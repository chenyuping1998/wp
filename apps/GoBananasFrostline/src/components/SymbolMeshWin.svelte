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
	import { SpineProvider, SpineTrack, getContextApp, getContextParent } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS, MESH_LANDS, MESH_IDLES, MESH_TEASES, teasePose } from '../game/meshWin';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which reel the cell is on: the win cascades left to right */
		reel?: number;
		/** the gold pay frame round the cell (every winning symbol but the Scatter) */
		showWinFrame?: boolean;
		/** LANDING mode (game/meshWin/lands.ts): the reel has just stopped on this
		 *  cell. Drawn in place of the sprite's squash, inside the board mask, with
		 *  none of the win's light, sparks, dust or cell pop, and with no completion
		 *  of its own — SymbolSprite reports "landed" on its usual clock. */
		land?: boolean;
		/** the landing's weight: the cell's impact, clamped to AMP_MAX */
		amp?: number;
		/** IDLE mode (game/meshWin/idles.ts): an act between spins, chosen by the
		 *  idle director. Quiet in the same way a landing is. */
		idle?: boolean;
		/** TEASE mode (game/meshWin/teases.ts): the Scatter sways while the spin
		 *  is still undecided. Loops while `teaseOn`; once that drops it blends
		 *  home over TEASE_HOME_MS — SymbolSprite takes the cell back after. */
		tease?: boolean;
		teaseOn?: boolean;
		/** its weight (teaseWeight: harder with each Scatter down) */
		teaseK?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	// a landing and an idle act are both QUIET: inside the cell, no light, no
	// sparks, no dust, no frame, no pop, no completion of their own
	const landing = !!props.land || !!props.idle || !!props.tease;
	const teaseSpec = props.tease ? MESH_TEASES[props.symbolName] : undefined;
	const spec = teaseSpec
		? teaseSpec
		: props.idle
		? MESH_IDLES[props.symbolName]
		: props.land
			? MESH_LANDS[props.symbolName]
			: MESH_WINS[props.symbolName];

	// must match make_symbol_layers.mjs (the atlas) and render_mesh_wins.py
	const SHEEN_FRAMES = 24, SHEEN_COLS = 6, SHEEN_CELL = 128;
	const SHADOW_ALPHA = 0.55, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;

	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;
	// THE TILE STAYS PUT. The win used to pop and hop the whole cell — plate,
	// frame and all — and turned up to that it read as the board jumping, not
	// the picture. The bounce is now inside the mesh, on the picture only
	// (game/meshWin/winHop.ts: the highs' tricks, the panels' jelly).
	let dust = $state(false);

	const root = new Container();

	onMount(() => {
		// a tease runs on the wall clock: it lasts as long as the reels take,
		// and turbo already shortens that
		const speed = teaseSpec ? 1 : stateBetDerived.timeScale();
		const started = performance.now();
		// WinLines already starts each reel as the runner reaches it. React at
		// that moment instead of delaying the picture a second time.
		const delay = 0;
		root.label = `meshWin ${spec.symbol} reel ${props.reel ?? '?'} +${delay}ms`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		const done = landing ? undefined : setTimeout(() => props.oncomplete?.(), (delay + spec.durationMs) / speed);
		const land = landing ? undefined : setTimeout(() => (dust = true), (delay + spec.landMs) / speed);
		const clearTimers = () => {
			clearTimeout(done);
			clearTimeout(land);
		};

		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const panelMode = spec.mode === 'panel';
		const plateTex = panelMode ? undefined : tex(`${spec.key}Plate`);
		const shadowTex = panelMode ? undefined : tex(`${spec.key}Shadow`);
		const subjectTex = panelMode ? tex(spec.sprite ?? spec.key) : tex(`${spec.key}Subject`);
		const flashTex = panelMode ? tex(`${spec.key}Glow`) : subjectTex;
		const sheenTex = tex(`${spec.key}Sheen`);
		const starTex = assets.fxStar as Texture | undefined;
		if (!subjectTex || !flashTex || !sheenTex || (!panelMode && (!plateTex || !shadowTex))) {
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
		// None on a landing: a landing spec's hitMs is 0, so the spark clock below
		// would otherwise fire a burst on every cell the instant its reel stops.
		const sparks = Array.from({ length: starTex && !landing ? 8 : 0 }, (_, i) => {
			const s = new Sprite(starTex);
			s.anchor.set(0.5);
			s.blendMode = 'add';
			s.tint = i % 2 ? 0xffffff : GOLD;
			s.visible = false;
			const angle = -Math.PI / 2 + (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
			return { s, angle, reach: 70 + Math.random() * 40, spin: (Math.random() - 0.5) * 6 };
		});

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		for (const layer of [plate, shadow, subject, flash, sheen, ...sparks.map((k) => k.s)])
			if (layer) content.addChild(layer);
		root.addChild(content);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// High-pay art springs past the cell edge; keep it above neighbouring
		// content while it performs. Smaller symbols remain under the pay frame.
		// (parent is pixi-svelte's context object, so parent.parent is THIS cell's
		// own container: (0,0) is the cell centre either way.) A landing replaces
		// the cell's sprite, so it simply sits where the sprite was.
		if (landing || ['H1', 'H2', 'H3', 'H4'].includes(spec.symbol)) parent.parent.addChild(root);
		else parent.parent.addChildAt(root, 0);

		const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
		const atlasW = SHEEN_COLS * SHEEN_CELL, atlasH = rows * SHEEN_CELL;
		let sheenCell = -1;
		// when the tease was told to stop, in its own ms (-1: still running)
		let stoppedAt = -1;

		const tick = () => {
			const t = Math.max(0, performance.now() - started - delay / speed) * speed;
			if (teaseSpec && !props.teaseOn && stoppedAt < 0) stoppedAt = t;
			const pose = teaseSpec
				? teasePose(teaseSpec, rig, t, props.teaseK ?? 1, stoppedAt < 0 ? -1 : t - stoppedAt)
				: spec.pose(rig, t, props.amp);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			root.scale.set(fit * pose.plateHit);
			root.position.set(props.x ?? 0, props.y ?? 0);

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
		};
	});
</script>

{#if !landing && (props.showWinFrame ?? true)}
	<!-- the same pay frame every other winning symbol gets (SymbolSpine). It
	     defaults ON, so a landing has to refuse it outright, or every cell on a
	     stopping reel would light up as if it had paid. -->
	<SpineProvider x={props.x} y={props.y} key="anticipation" width={SYMBOL_SIZE * 0.19}>
		<SpineTrack trackIndex={0} animationName={'payframe'} loop />
	</SpineProvider>
{/if}

{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust
		x={props.x ?? 0}
		y={(props.y ?? 0) + (spec.feetY - CANVAS / 2) * fit}
		oncomplete={() => (dust = false)}
	/>
{/if}
