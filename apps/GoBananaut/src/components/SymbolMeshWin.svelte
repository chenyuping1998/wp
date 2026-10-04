<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import type { MeshWinSpec } from '../game/meshWin';

	// one rig per symbol for every copy on the board — it depends only on the drawing
	const rigs = new Map<string, Rig>();
	// the landing's housing knock, shared by every high landing in the same win
	let lastKnock = 0;

	// The vertices that sit on the drawing (texture alpha), per symbol: the ones
	// the cell containment measures. Read once from the loaded texture, at 128px.
	// null when the pixels cannot be read — containment is then skipped.
	const inkedCache = new Map<string, Uint32Array | null>();
	const inkedFor = (key: string, rig: Rig, texture: Texture): Uint32Array | null => {
		if (inkedCache.has(key)) return inkedCache.get(key)!;
		let out: Uint32Array | null = null;
		try {
			const N = 128;
			const cv = document.createElement('canvas');
			cv.width = cv.height = N;
			const g = cv.getContext('2d', { willReadFrequently: true })!;
			g.drawImage(texture.source.resource as CanvasImageSource, 0, 0, N, N);
			const a = g.getImageData(0, 0, N, N).data;
			const list: number[] = [];
			for (let v = 0; v < rig.uvs.length / 2; v++) {
				const x = Math.min(N - 1, Math.floor(rig.uvs[v * 2] * N));
				const y = Math.min(N - 1, Math.floor(rig.uvs[v * 2 + 1] * N));
				if (a[(y * N + x) * 4 + 3] > 40) list.push(v);
			}
			out = list.length ? Uint32Array.from(list) : null;
		} catch {
			out = null;
		}
		inkedCache.set(key, out);
		return out;
	};
	const rigFor = (spec: MeshWinSpec) => {
		let rig = rigs.get(spec.symbol);
		if (!rig) rigs.set(spec.symbol, (rig = buildRig(spec.rig)));
		return rig;
	};
</script>

<script lang="ts">
	/**
	 * A winning symbol that ACTS: the symbol's own drawing through a deforming
	 * mesh, posed each frame by its spec in game/meshWin/*. Ported from
	 * GoBananubis (same file name there), where it replaced a whole-tile pulse
	 * that read as generic; here it replaces SymbolWinAnim's pulse and bloom.
	 *
	 * Bottom up, under one container, in the 256px canvas of the rigs:
	 *   shadow   (cut mode) a soft silhouette under the subject, spreading and
	 *            darkening as it rises; it follows sideways, never up
	 *   subject  the mesh, drawing the symbol's own sprite
	 *   flash    the same mesh, additive — the hit. Cut mode draws the sprite
	 *            again; panel mode (the letter tiles) draws `${key}Glow`, the art
	 *            masked to the letter, so the hit lights the letter, not the stone
	 *   sheen    the same positions through a second geometry whose UVs point
	 *            into the current cell of the baked light-sweep atlas. UVs are
	 *            rewritten rather than switching to a sub-texture because on
	 *            WebGPU pixi 8's mesh never applies a texture's frame
	 *   sparks   a burst of fxStar on the hit
	 * and the landing dust (ImpactDust) in the markup, for specs that land.
	 *
	 * ReelSymbol draws a winning mesh symbol on the board's UNMASKED layer, so
	 * the additive layers have something to add to (inside a mask they draw
	 * nothing — see the stake-engine-slot skill) and a pop can leave the cell.
	 */
	import { Mesh, MeshGeometry, Sprite, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, LAND_MS, landPose, skin, intensify, heldTime, winLevelFor, type WinLevel } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';
	import { LEAPS, leapAmount, scaleLeap } from '../game/meshWin/leap';
	import { getContext } from '../game/context';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		/** the reel symbol's info, for its drawn size (omitted when `size` is given) */
		symbolInfo?: ReturnType<typeof getSymbolInfo>;
		/** which reel the cell is on: the win cascades left to right */
		reel?: number;
		/** drawn size in board px, when it is not a whole cell (the grow marker
		 *  rides a cell's corner at 0.42 of it) */
		size?: number;
		/** playback rate. Defaults to the bet's (turbo doubles it); a caller that
		 *  runs its own clock alongside — ReelGrow's marker flight — pins it so
		 *  the two cannot drift apart */
		speed?: number;
		/** the pose time in ms, read every frame, for a caller that owns the
		 *  timeline and has phases of its own to stay on (the thrown canister's
		 *  blinks). Replaces the internal clock, the cascade delay and `speed`. */
		clock?: () => number;
		/** 'win' (default) or 'land': the landing, every spin (meshRig.landPose)
		 *  — a fixed 240ms, not scaled by turbo, drawn as the subject alone */
		beat?: 'win' | 'land';
		/** the landing's weight (ReelSymbol's impact tier; the Scatter's climbs
		 *  with the spin's count). Read once, at mount: the board keeps landing
		 *  and a weight that changed mid-landing would jump. */
		impact?: number;
		/** how many reels this cell's win spans (the book's `kind`): sets the
		 *  beat's size, its hit-stop and its trail (meshRig.WIN_LEVELS). Absent
		 *  for everything that is not a line win — the trigger, the idle beats. */
		kind?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = MESH_WINS[props.symbolName];

	// must match make_symbol_layers.mjs (the atlas)
	const SHEEN_FRAMES = 24, SHEEN_COLS = 6, SHEEN_CELL = 128;
	// a lighter shadow than Bananubis' on stone: these float over a dark board
	const SHADOW_ALPHA = 0.45, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;

	const fit = (props.size ?? SYMBOL_SIZE * (props.symbolInfo?.sizeRatios.height ?? 1)) / CANVAS;
	let dust = $state(false);

	const root = new Container();

	const landing = props.beat === 'land';
	// the beat as authored: no scaling, no hit-stop, no trail
	const NEUTRAL: WinLevel = { body: 1, rigid: 1, fx: 1, speed: 1, hold: 0, trail: false, sparks: 8, lift: 1, swell: 1, squash: 1 };
	const lvl: WinLevel = landing || props.kind === undefined ? NEUTRAL : winLevelFor(props.kind);
	// the AFTERIMAGE: one copy of the mesh, posed this far behind, faded in only
	// while the subject is moving fast — the smear an animator draws on a snap
	const TRAIL_LAG_MS = 45;
	const TRAIL_ALPHA = 0.32;
	const TRAIL_TINT = 0xd6ecff;

	// THE HIGHS' SIGNATURE TURN (meshWin/leap.ts), inside the cell. Only a real line win — not the trigger or idle beats (no kind), not a
	// landing, not a caller that sizes or clocks the mesh itself.
	const leap =
		!landing && props.kind !== undefined && !props.clock && props.size === undefined ? LEAPS[props.symbolName] : undefined;
	const leapK = props.kind !== undefined ? leapAmount(props.kind) : 0;
	// KEPT IN THE CELL ("高分獎圖不要跳離格子"): a high symbol's drawing never
	// crosses its cell's edge. The hop, the swell and the turn are sized for the
	// middle of the cell; where a frame would carry the drawing past an edge it
	// is pulled back and, if it is wider than the cell, eased smaller — for that
	// frame only, so at the edge it reads as pressing against the wall.
	const CONTAIN_MARGIN = 2; // canvas px
	const contain = !landing && props.size === undefined && !props.clock && props.symbolName in LEAPS;

	onMount(() => {
		// the landing is NOT scaled by turbo: every reel settles on the same beat
		const speed = landing ? 1 : (props.speed ?? stateBetDerived.timeScale());
		const weight = props.impact ?? 1;
		const started = performance.now();
		// Three identical symbols acting in perfect sync read as one object copied
		// three times. Cascade them left to right, 60ms a reel. The reel comes in
		// as a prop: the cell container's x reads 0 at mount. (Landings need no
		// cascade: the reels already stop one after another.)
		const delay = landing ? 0 : (props.reel ?? 0) * 60;
		root.label = `meshWin ${spec.symbol} ${landing ? 'land' : 'win'} reel ${props.reel ?? '?'} +${delay}ms`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		// the beat's own length: a small win plays quicker (lvl.speed), and the
		// hit-stop adds its hold
		const beatMs = landing ? LAND_MS : (spec.durationMs + lvl.hold) / lvl.speed;
		const done = setTimeout(() => props.oncomplete?.(), (delay + beatMs) / speed);
		const land =
			spec.dust && !landing
				? setTimeout(() => (dust = true), (delay + (spec.landMs + (spec.landMs > spec.hitMs ? lvl.hold : 0)) / lvl.speed) / speed)
				: undefined;
		// coming back down: dust, and a knock through the housing — shared, one
		// per 150ms, since several highs land together in one win
		const slam = leap
			? setTimeout(
					() => {
						const now = performance.now();
						if (now - lastKnock > 150) {
							lastKnock = now;
							context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.25 + 0.35 * leap.slam * leapK, reel: props.reel });
						}
						dust = true;
					},
					(delay + (leap.slamAt + (leap.slamAt > spec.hitMs ? lvl.hold : 0)) / lvl.speed) / speed,
				)
			: undefined;
		const clearTimers = () => {
			clearTimeout(done);
			clearTimeout(land);
			clearTimeout(slam);
		};

		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const panelMode = spec.mode === 'panel';
		const shadowTex = panelMode || landing ? undefined : tex(`${spec.key}Shadow`);
		const subjectTex = tex(spec.sprite);
		const flashTex = panelMode ? tex(`${spec.key}Glow`) : subjectTex;
		const sheenTex = tex(`${spec.key}Sheen`);
		const starTex = landing ? undefined : (assets.fxStar as Texture | undefined);
		if (!subjectTex || !flashTex || !sheenTex || (!panelMode && !landing && !shadowTex)) {
			console.error(`SymbolMeshWin: ${spec.key} layers not loaded`);
			return clearTimers;
		}
		const tint = spec.flashTint ?? GOLD;

		const rig = rigFor(spec);
		const inked = contain ? inkedFor(spec.symbol, rig, subjectTex) : null;
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
		const sheenPositions = new Float32Array(rig.rest);
		const sheenUvs = new Float32Array(rig.uvs.length);
		const sheenGeometry = new MeshGeometry({ positions: sheenPositions, uvs: sheenUvs, indices: rig.indices });

		// the tile a cut subject came off (the letters): drawn under it and never
		// moved — counter-scaled below against the root's knock
		const plateTex = spec.plate ? tex(spec.plate) : undefined;
		const plate = plateTex ? new Sprite(plateTex) : null;
		if (plate) plate.setSize(CANVAS, CANVAS);
		const shadow = shadowTex ? new Sprite(shadowTex) : null;
		if (shadow) shadow.alpha = 0;
		const subject = new Mesh({ geometry, texture: subjectTex });
		const flash = new Mesh({ geometry, texture: flashTex });
		flash.blendMode = 'add';
		flash.tint = tint;
		flash.alpha = 0;
		const sheen = new Mesh({ geometry: sheenGeometry, texture: sheenTex });
		sheen.blendMode = 'add';
		sheen.visible = false;
		// the part that lights on its own (spec.feature: the craters, the lamps)
		const featureTex = spec.feature && !landing ? tex(`${spec.key}Feature`) : undefined;
		const feature = featureTex ? new Mesh({ geometry, texture: featureTex }) : null;
		if (feature) {
			feature.blendMode = 'add';
			feature.tint = spec.feature!.tint;
			feature.alpha = 0;
		}

		// sparks: born on each hit, flung out from the subject, gone in ~0.5s
		const hits = spec.hits ?? [spec.hitMs];
		const perHit = lvl.sparks;
		const sparks = Array.from({ length: starTex ? perHit * hits.length : 0 }, (_, i) => {
			const s = new Sprite(starTex);
			s.anchor.set(0.5);
			s.blendMode = 'add';
			s.tint = i % 2 ? 0xffffff : tint;
			s.visible = false;
			const burst = Math.floor(i / perHit);
			// each burst turned half a step from the last, so repeats do not retrace
			const angle = -Math.PI / 2 + ((i % perHit) / perHit + burst / (2 * perHit)) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
			// a later hit in a climbing sequence throws further, and so does a big win
			const reach = (70 + Math.random() * 40) * (1 + 0.15 * burst) * (0.85 + 0.15 * lvl.fx);
			return { s, angle, reach, at: hits[burst], spin: (Math.random() - 0.5) * 6 };
		});

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		// a landing is the subject alone: up to thirty cells land every spin, and
		// a flash or a sweep on each would be noise
		// the afterimage sits UNDER the subject, on its own geometry
		const trailPositions = lvl.trail && !landing ? new Float32Array(rig.rest) : null;
		const trailGeometry = trailPositions ? new MeshGeometry({ positions: trailPositions, uvs: rig.uvs, indices: rig.indices }) : null;
		const trail = trailGeometry ? new Mesh({ geometry: trailGeometry, texture: subjectTex }) : null;
		if (trail) {
			trail.alpha = 0;
			trail.tint = TRAIL_TINT;
		}
		const layers = landing ? [plate, subject] : [plate, shadow, trail, subject, feature, flash, sheen, ...sparks.map((k) => k.s)];
		for (const layer of layers) if (layer) content.addChild(layer);
		root.addChild(content);
		const baseX = props.x ?? 0, baseY = props.y ?? 0;
		root.position.set(baseX, baseY);
		// the context's parent is the cell container Symbol.svelte places
		parent.parent.addChild(root);

		const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
		const atlasW = SHEEN_COLS * SHEEN_CELL, atlasH = rows * SHEEN_CELL;
		let sheenCell = -1;

		const tick = () => {
			const raw = props.clock ? props.clock() : Math.max(0, performance.now() - started - delay / speed) * speed * lvl.speed;
			// the HIT-STOP: the beat's clock stands still at its peak for lvl.hold
			const t = landing ? raw : heldTime(raw, spec.hitMs, lvl.hold);
			const poseAt = (ms: number) => intensify(spec.pose(rig, ms), rig, spec.limits, lvl);
			const pose = landing ? landPose(spec, rig, Math.min(t, LAND_MS), weight) : poseAt(t);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();

			if (trail && trailPositions && trailGeometry) {
				skin(rig, poseAt(heldTime(Math.max(0, raw - TRAIL_LAG_MS), spec.hitMs, lvl.hold)), spec.feetY, trailPositions);
				// how far the drawing got ahead of its afterimage: the smear only
				// shows on a real snap, never on a drift
				let lead = 0;
				for (let i = 0; i < positions.length; i += 7) lead = Math.max(lead, Math.abs(positions[i] - trailPositions[i]));
				const k = Math.max(0, Math.min(1, (lead - 5) / 22));
				trail.alpha = TRAIL_ALPHA * k * k * (3 - 2 * k);
				if (trail.alpha > 0.01) trailGeometry.getBuffer('aPosition').update();
			}
			// the turn: the whole symbol, about its centre
			const rot = leap ? scaleLeap(leap.pose(t), leapK).rot : 0;
			let fitIn = 1, inX = 0, inY = 0;
			if (inked) {
				// the drawing's extent this frame, about the cell's centre, as drawn
				const c = Math.cos(rot), n = Math.sin(rot), k = pose.plateHit, h = CANVAS / 2;
				let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
				for (let i = 0; i < inked.length; i += 2) {
					const v = inked[i];
					const px = (positions[v * 2] - h) * k, py = (positions[v * 2 + 1] - h) * k;
					const X = px * c - py * n, Y = px * n + py * c;
					if (X < x0) x0 = X;
					if (X > x1) x1 = X;
					if (Y < y0) y0 = Y;
					if (Y > y1) y1 = Y;
				}
				const room = h - CONTAIN_MARGIN;
				fitIn = Math.min(1, (2 * room) / (x1 - x0), (2 * room) / (y1 - y0));
				inX = Math.max(0, -room - x0 * fitIn) - Math.max(0, x1 * fitIn - room);
				inY = Math.max(0, -room - y0 * fitIn) - Math.max(0, y1 * fitIn - room);
			}
			root.scale.set(fit * pose.plateHit * fitIn);
			// the plate holds still whatever the subject's knock does
			if (plate) {
				const s = 1 / (pose.plateHit * fitIn);
				plate.scale.set((CANVAS / plate.texture.width) * s, (CANVAS / plate.texture.height) * s);
				plate.position.set((CANVAS * (1 - s)) / 2, (CANVAS * (1 - s)) / 2);
			}
			root.rotation = rot;
			if (inked) root.position.set(baseX + inX * fit, baseY + inY * fit);

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
			if (feature) feature.alpha = pose.feature;

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

			for (const k of sparks) {
				const age = (t - k.at) / 520;
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
			// the layers a landing never added to root
			if (landing) {
				flash.destroy();
				sheen.destroy();
			}
			geometry.destroy();
			sheenGeometry.destroy();
			trailGeometry?.destroy();
		};
	});
</script>

{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust
		x={props.x ?? 0}
		y={(props.y ?? 0) + (spec.feetY - CANVAS / 2) * fit}
		oncomplete={() => (dust = false)}
	/>
{/if}
