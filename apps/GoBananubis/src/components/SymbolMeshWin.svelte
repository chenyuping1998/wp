<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import type { MeshWinSpec } from '../game/meshWin';

	// one rig per symbol for every copy on the board — it depends only on the drawing
	const rigs = new Map<string, Rig>();
	const rigFor = (spec: MeshWinSpec) => {
		let rig = rigs.get(spec.symbol);
		if (!rig) rigs.set(spec.symbol, (rig = buildRig(spec.rig)));
		return rig;
	};
</script>

<script lang="ts">
	/**
	 * A high-pay symbol's win, drawn as a plate and a subject that ACTS on it.
	 *
	 * Every other symbol's win is a Spine clip that turns and scales the whole
	 * plate as one flat picture. Here the stone stays put (it only takes a knock
	 * on the hit and the landing) and the subject — cut off its plate by
	 * design/make_symbol_layers.mjs — performs through a deforming mesh. The
	 * acting lives in game/meshWin/h*.ts; this component only builds the pixi
	 * objects and feeds them the pose each frame.
	 *
	 * Bottom up, under one container, all in the 256px canvas of the art:
	 *   plate    the stone with the subject lifted off it
	 *   shadow   a soft silhouette ON THE STONE, spreading and darkening as the
	 *            subject rises; it follows the subject sideways, never up
	 *   subject  the mesh
	 *   flash    the same mesh, additive gold — the hit
	 *   sheen    the same positions through a second geometry whose UVs point
	 *            into the current cell of the baked light-sweep atlas. Rewriting
	 *            UVs rather than switching to a sub-texture because on WebGPU
	 *            pixi 8.8.1's mesh never applies a texture's frame
	 *            (GpuMeshAdapter leaves uTextureMatrix at identity)
	 *   sparks   a burst of fxStar on the hit
	 * and the landing dust (ImpactDust) in the markup below.
	 *
	 * PANEL mode (the letters, the Wild, the Scatter — meshRig.panelParts): the
	 * subject is painted onto its panel rather than cut off it, so there is no
	 * plate and no shadow: the mesh draws the symbol's own sprite, the frame
	 * held still by the rig, and the flash draws `${key}Glow` — the same art
	 * masked to the subject — so the hit lights the letter, not the stone.
	 *
	 * Symbols in the win state draw outside the board mask, so the additive
	 * layers have something to add to.
	 */
	import { Mesh, MeshGeometry, Sprite, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, IDLE_MS, TEASE_HOME_MS, dampPose, idlePose, landMsOf, landPose, landSwingAt, skin, teasePose, track } from '../game/meshWin/meshRig';
	import { MESH_LANDS } from '../game/meshWin';
	import ImpactDust from './ImpactDust.svelte';
	import { getContext } from '../game/context';
	import { applyLeap, leapState, SUBJECT_BOX } from '../game/meshWin/leap';
	import { BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which reel the cell is on: the win cascades left to right */
		reel?: number;
		/** its padded row, so a leap's landing can knock the cells round it */
		row?: number;
		/** 'win' (default) or 'land': the landing every spin (meshRig.landPose) —
		 *  a fixed 240ms, plate and subject only, no light, sparks or frame */
		/** 'reveal': the symbol's win act, smaller (revealSize), bursting out as it is named — a
		 *  Sealed Tablet cracking open (MysteryReveal), the seal being read
		 *  (MysteryOracle). No cascade,
		 *  and the tile swells as it bursts out */
		beat?: 'win' | 'land' | 'tease' | 'idle' | 'reveal';
		/** add on top of the parent's children instead of under them (the board
		 *  draws the pay frame over a cell; the intro card draws the art under it) */
		onTop?: boolean;
		/** 'tease': while true it loops; set false and it settles home
		 *  (TEASE_HOME_MS) and then reports complete */
		active?: boolean;
		/** the landing's weight (ReelSymbol's impact tier) */
		impact?: number;
		/** 'reveal': how much of the win act it plays (default REVEAL_SIZE) */
		revealSize?: number;
		/** 'land': each change plays the landing again from the start, at the
		 *  current `impact` — a held superspin coin ringing again (StickyPrizes)
		 *  without being remounted. Timers are not re-armed: a replay reports nothing */
		replay?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	// MESH_LANDS is every mesh symbol: the winners, plus the tablet and the coin
	// that only ever land (Symbol.svelte routes a win only through MESH_WINS)
	const spec = MESH_LANDS[props.symbolName];

	// must match make_symbol_layers.mjs (the atlas) and render_mesh_wins.py
	const SHEEN_FRAMES = 24, SHEEN_COLS = 6, SHEEN_CELL = 128;
	const SHADOW_ALPHA = 0.55, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;
	// THE WIN, BY RANK. Every winner used to act at one size, so a line of 10s
	// paying a fraction of the bet threw itself about exactly as hard as the
	// Wild — the board was loud all the time and nothing stood out. Now the
	// size of the act says what the symbol is worth:
	//
	//   low     the letters: their act at 80%, a small tile hop
	//   high    H1-H4 leap inside their cell (leap.ts) — the act in full
	//   special the Wild and the Scatter: the act in full and the full tile
	//           hop (no bigger: a tile that leaves its cell was tried, and cut)
	//
	// Above all of them sits the big win's own presentation (Win.svelte).
	//
	// `act` scales the symbol's own motion (dampPose); the tile hop (see tick)
	// is how far the tile lifts, as a share of the cell, how much it grows at
	// the top, and how much harder the plate's crouch and landing knocks land.
	const RANK = {
		low: { act: 0.8, hop: 0.05, pop: 0.07, knock: 1.4 },
		full: { act: 1, hop: 0.09, pop: 0.12, knock: 1.8 },
	};
	const rank = RANK[/^L\d$/.test(props.symbolName) ? 'low' : 'full'];
	const TILE_HOP = rank.hop, TILE_POP = rank.pop, TILE_KNOCK = rank.knock;

	// THE HIGH PAYS JUMP inside their own cell (game/meshWin/leap.ts): the plate
	// stays, the subject springs off it, and the landing knocks the housing.
	const context = getContext();

	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;
	let dust = $state(false);

	const root = new Container();

	// the tease is drawn like a landing: plate and subject, no light
	const teasing = props.beat === 'tease';
	// the idle act too (BoardIdle): plate and subject, no light, a fixed length
	const idling = props.beat === 'idle';
	const revealing = props.beat === 'reveal';
	// how far the tile swells as it bursts out. Only ever UP: at under 1 the
	// static drawing beneath it (the board cell, the strip) would show round it
	const REVEAL_POP = 0.1;
	// A REVEAL IS THE ACT AT A FRACTION OF ITS SIZE. Played full, every tablet
	// that cracked on a free spin threw its whole win act — the high pays even
	// leapt — and a board of them read as the symbols jumping about rather than
	// as seals giving way. It names the symbol; the win act is for when it pays.
	// The light stays (dampPose keeps flash at sqrt(k)), and the sparks, smaller.
	const REVEAL_SIZE = 0.5;
	const landing = props.beat === 'land' || teasing || idling;
	// the feature symbols' landings carry light (meshRig: landLight)
	const lit = !landing || (!teasing && !idling && !!spec.landLight);

	// the tease's completion also on a TIMER: the frame loop stops in a hidden
	// tab, and a tease that never reported would sit on the cell until the next
	// spin (the board does not wait on it, so nothing else would hang)
	let teaseDone = false;
	$effect(() => {
		if (!teasing || props.active) return;
		const fallback = setTimeout(() => {
			if (!teaseDone) {
				teaseDone = true;
				props.oncomplete?.();
			}
		}, TEASE_HOME_MS + 120);
		return () => clearTimeout(fallback);
	});

	onMount(() => {
		// the landing is NOT scaled by turbo: every reel settles on the same beat
		// a reveal keeps 70% of its length under turbo, like the seal it bursts
		// out of: turbo shortens the waiting, not the payoff
		const speed = landing ? 1 : revealing ? Math.min(1 / 0.7, stateBetDerived.timeScale()) : stateBetDerived.timeScale();
		// read ONCE: the Scatter's weight follows a counter that moves while the
		// board keeps landing, and a weight that changed mid-landing would jump
		let weight = props.impact ?? 1;
		let started = performance.now();
		let replayed = props.replay;
		// A line of three identical symbols acting in perfect sync reads as one
		// object copied three times. Cascade them left to right, 60ms a reel.
		// The reel comes in as a prop: reading the cell container's x at mount
		// got 0 for every cell (pixi-svelte has not applied it yet), and the
		// probe saw all twelve start in the same millisecond.
		const delay = landing || revealing ? 0 : (props.reel ?? 0) * 60;
		root.label = `meshWin ${spec.symbol} ${props.beat ?? 'win'} reel ${props.reel ?? '?'} +${delay}ms`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on. Both are
		// cleared on unmount, so a landing cut short by the win (land -> win in the
		// same cell) can never report "landed" from a presentation already gone —
		// the bug SymbolSprite's `destroyed` flag exists for.
		// a tease has no fixed end: it completes after settling (see tick)
		const done = teasing
			? undefined
			: setTimeout(
					() => props.oncomplete?.(),
					(delay + (idling ? IDLE_MS : landing ? landMsOf(spec) : spec.durationMs)) / speed,
				);
		const dustAt = teasing || idling ? undefined : landing ? spec.landDust : spec.landMs;
		const land = dustAt === undefined ? undefined : setTimeout(() => (dust = true), (delay + dustAt) / speed);
		const clearTimers = () => {
			clearTimeout(done);
			clearTimeout(land);
		};

		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const panelMode = spec.mode === 'panel';
		const plateTex = panelMode ? undefined : tex(`${spec.key}Plate`);
		const shadowTex = panelMode || landing ? undefined : tex(`${spec.key}Shadow`);
		const subjectTex = panelMode ? tex(spec.sprite ?? spec.key) : tex(`${spec.key}Subject`);
		const flashTex = panelMode ? tex(`${spec.key}Glow`) : subjectTex;
		const sheenTex = tex(`${spec.key}Sheen`);
		const starTex = landing ? undefined : (assets.fxStar as Texture | undefined);
		if (!subjectTex || !flashTex || !sheenTex || (!panelMode && !plateTex) || (!panelMode && !landing && !shadowTex)) {
			console.error(`SymbolMeshWin: ${spec.key} layers not loaded`);
			return clearTimers;
		}

		const rig = rigFor(spec);
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
		const sheenPositions = new Float32Array(rig.rest);
		const sheenUvs = new Float32Array(rig.uvs.length);
		const sheenGeometry = new MeshGeometry({ positions: sheenPositions, uvs: sheenUvs, indices: rig.indices });

		const plate = plateTex ? new Sprite(plateTex) : null;
		plate?.setSize(CANVAS, CANVAS);
		const shadow = shadowTex ? new Sprite(shadowTex) : null;
		if (shadow) {
			shadow.setSize(CANVAS, CANVAS);
			shadow.alpha = 0;
		}
		const subject = new Mesh({ geometry, texture: subjectTex });
		const flash = new Mesh({ geometry, texture: flashTex });
		flash.blendMode = 'add';
		flash.tint = GOLD;
		flash.alpha = 0;
		const sheen = new Mesh({ geometry: sheenGeometry, texture: sheenTex });
		sheen.blendMode = 'add';
		sheen.visible = false;

		// sparks: born on the hit, flung out from the subject, gone in ~0.5s
		const sparks = Array.from({ length: starTex ? 8 : 0 }, (_, i) => {
			const s = new Sprite(starTex);
			s.anchor.set(0.5);
			s.blendMode = 'add';
			s.tint = i % 2 ? 0xffffff : GOLD;
			s.visible = false;
			const angle = -Math.PI / 2 + (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
			return { s, angle, reach: (70 + Math.random() * 40) * (revealing ? 0.6 : 1), spin: (Math.random() - 0.5) * 6 };
		});

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		// a landing is the plate and the subject only: fifteen cells land every
		// spin, and none of them wants light
		const layers = !landing
			? [plate, shadow, subject, flash, sheen, ...sparks.map((k) => k.s)]
			: lit
				? [plate, subject, flash, sheen]
				: [plate, subject];
		for (const layer of layers) if (layer) content.addChild(layer);
		root.addChild(content);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// under the pay frame, which the markup draws
		// A leaper draws over everything on the board (it lands on other cells);
		// its shadow stays on its own cell, underneath. Everything else sits
		// under the pay frame, which the markup draws.
		// under the pay frame, which the markup draws
		if (props.onTop) parent.parent.addChild(root);
		else parent.parent.addChildAt(root, 0);
		// no leap on a reveal: it is the act at half size, in its own place
		const leap = !landing && !revealing && spec.symbol in SUBJECT_BOX;
		const leapS = leapState();
		let knocked = false;

		const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
		const atlasW = SHEEN_COLS * SHEEN_CELL, atlasH = rows * SHEEN_CELL;
		let sheenCell = -1;

		let stoppedAt = -1;
		const tick = () => {
			if (props.replay !== replayed) {
				replayed = props.replay;
				started = performance.now();
				weight = props.impact ?? 1;
			}
			const t = Math.max(0, performance.now() - started - delay / speed) * speed;
			if (teasing && !props.active && stoppedAt < 0) stoppedAt = t;
			const raw = teasing
				? teasePose(spec, rig, t, weight, stoppedAt < 0 ? -1 : t - stoppedAt)
				: idling
					? idlePose(spec, rig, t)
					: landing
					? landPose(spec, rig, t, weight)
					: spec.pose(rig, t);
			const size = revealing ? (props.revealSize ?? REVEAL_SIZE) : landing ? 1 : rank.act;
			const pose = size < 1 ? dampPose(raw, size) : raw;
			if (teasing && stoppedAt >= 0 && t - stoppedAt >= TEASE_HOME_MS && !teaseDone) {
				teaseDone = true;
				props.oncomplete?.();
			}
			if (leap) applyLeap(spec, pose, t, leapS);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			// the reveal's burst: up fast, a small second swell, home
			const burst = revealing
				? 1 + REVEAL_POP * track(t, [[0, 0], [90, 1, 'out'], [260, 0.15, 'inOut'], [420, 0, 'out']])
				: 1;
			if (landing) {
				root.scale.set(fit * pose.plateHit);
				// a hung symbol swings from its top edge (meshRig landSwing)
				const swing = teasing || idling ? 0 : (landSwingAt(spec, t, weight) * Math.PI) / 180;
				const hang = (CANVAS / 2) * fit * pose.plateHit;
				root.rotation = swing;
				root.position.set((props.x ?? 0) - hang * Math.sin(swing), (props.y ?? 0) - hang * (1 - Math.cos(swing)));
			}
			else if (revealing && !leap) {
				// in its own cell: the tile does not hop off it (it would uncover
				// the static drawing beneath), it bursts and the act does the rest
				root.scale.set(fit * pose.plateHit * burst);
			} else if (leap) {
				// the tile stays in its cell with its own small knocks; the jump is
				// the subject's (applyLeap above). The landing knocks the housing.
				root.scale.set(fit * pose.plateHit * burst);
				if (t >= spec.landMs && !knocked) {
					knocked = true;
					context.eventEmitter.broadcast({
						type: 'boardFrameImpact',
						strength: 0.22,
						from: [(((props.reel ?? 2) + 0.5) / BOARD_DIMENSIONS.x) * 2 - 1, 0],
					});
					// ...and the cells round it flinch (Symbol.svelte)
					if (props.reel !== undefined && props.row !== undefined) {
						context.eventEmitter.broadcast({ type: 'cellKnock', reel: props.reel, row: props.row, strength: 0.6 });
					}
				}
			} else {
				// THE WHOLE TILE HOPS TOO, on the symbol's own jump (pose.air, 0 at
				// both ends). The subject's hop inside the tile is held small by its
				// frame — a letter panel may not leave its own border — so the size
				// of the jump comes from the tile leaving its cell: up, and larger,
				// with the plate's knocks on the crouch and the landing turned up
				// with it. Rigid, so it distorts nothing the mesh gate measures.
				const knock = 1 + TILE_KNOCK * (pose.plateHit - 1);
				root.scale.set(fit * knock * (1 + TILE_POP * pose.air));
				root.position.y = (props.y ?? 0) - TILE_HOP * SYMBOL_SIZE * pose.air;
			}

			if (shadow) {
				const air = pose.air;
				const spread = 1 + SHADOW_SPREAD * air;
				shadow.alpha = SHADOW_ALPHA * air;
				shadow.scale.set((CANVAS / shadow.texture.width) * spread);
				shadow.position.set(
					CANVAS / 2 - (CANVAS * spread) / 2 + pose.rigid.dx,
					spec.feetY - spec.feetY * spread + SHADOW_DROP * air,
				);
			}

			flash.alpha = pose.flash;

			sheen.visible = pose.sheen >= 0;
			if (sheen.visible) {
				sheenPositions.set(positions);
				sheenGeometry.getBuffer('aPosition').update();
				const cell = Math.round(pose.sheen * (SHEEN_FRAMES - 1));
				if (cell !== sheenCell) {
					sheenCell = cell;
					const ox = (cell % SHEEN_COLS) * SHEEN_CELL, oy = Math.floor(cell / SHEEN_COLS) * SHEEN_CELL;
					for (let i = 0; i < sheenUvs.length; i += 2) {
						sheenUvs[i] = (ox + rig.uvs[i] * SHEEN_CELL) / atlasW;
						sheenUvs[i + 1] = (oy + rig.uvs[i + 1] * SHEEN_CELL) / atlasH;
					}
					sheenGeometry.getBuffer('aUV').update();
				}
			}

			const age = (t - spec.hitMs) / 520;
			for (const k of sparks) {
				k.s.visible = age > 0 && age < 1;
				if (!k.s.visible) continue;
				const out = 1 - (1 - age) ** 3;
				k.s.position.set(
					CANVAS / 2 + Math.cos(k.angle) * k.reach * out,
					CANVAS / 2 + pose.rigid.dy + Math.sin(k.angle) * k.reach * out,
				);
				k.s.scale.set(0.22 * Math.sin(Math.PI * Math.min(1, age * 1.4)));
				k.s.rotation = k.spin * age;
				k.s.alpha = 1 - age * age;
			}
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);

		return () => {
			clearTimers();
			ticker?.remove(tick);
			root.removeFromParent();
			// textures belong to the asset loader; the geometries are ours
			root.destroy({ children: true });
			geometry.destroy();
			sheenGeometry.destroy();
			// the unused layers of a landing were never added to root
			if (!lit) {
				flash.destroy();
				sheen.destroy();
			}
		};
	});
</script>

<!-- NO PAY FRAME. A gold frame closed round every winning cell (WinFrame,
     and the template's payframe spine before it); it drew the eye to the
     border and away from the symbol's own act, which is the thing that
     should read. The act alone says the cell won. -->

{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust
		x={props.x ?? 0}
		y={(props.y ?? 0) + (spec.feetY - CANVAS / 2) * fit}
		oncomplete={() => (dust = false)}
	/>
{/if}
