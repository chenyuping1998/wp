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
	 * A winning symbol that ACTS: the plate stays put (it only takes a knock on
	 * the hit and the landing) and the subject — cut off its plate by
	 * design/make_symbol_layers.mjs — performs through a deforming mesh. The
	 * acting lives in game/meshWin/*.ts; this component only builds the pixi
	 * objects and feeds them the pose each frame.
	 *
	 * GoBananubis's SymbolMeshWin, placed differently. There it replaced the
	 * board cell; here it replaces the SPRITE inside WinWays' popped copy of the
	 * cell — the copy drawn above the scrim and above the neighbours, which is
	 * the only place on this board where a tile can come forward (WinWays says
	 * why). So it draws into the pixi container it is mounted in, at that
	 * container's origin (the cell's centre), and WinWays' own glow and gold
	 * rings go on round it. Bubis's pay frame is not drawn: those rings are
	 * this game's.
	 *
	 * Bottom up, all in the 256px canvas of the rigs:
	 *   plate    the steel with the subject lifted off it
	 *   shadow   a soft silhouette ON THE STEEL, spreading as the subject rises
	 *   subject  the mesh
	 *   flash    the same mesh, additive, in the symbol's flashTint (gold unset)
	 *   sheen    the same positions through a second geometry whose UVs point
	 *            into the current cell of the baked light-sweep atlas. Rewriting
	 *            UVs rather than switching to a sub-texture because on WebGPU
	 *            pixi 8.8.1's mesh never applies a texture's frame
	 *            (GpuMeshAdapter leaves uTextureMatrix at identity)
	 *   sparks   a burst of fxStar on the hit
	 *   fx       the symbol's own effects (game/meshWin/fx.ts): what it casts
	 *            (a halo) under the subject, what it throws (bubbles, sparks,
	 *            embers, paint) over it
	 * and the landing dust (ImpactDust) in the markup below.
	 *
	 * THE IMPACT FRAME: for IMPACT_MS on the hit the flash goes WHITE, near
	 * full — the few frames of pure silhouette a hand-animated hit has before
	 * the colour comes back (fx.ts IMPACT).
	 *
	 * PANEL mode (the Wild — meshRig.panelDiscParts): he is painted into the
	 * porthole's glass rather than cut off it, so there is no plate and no
	 * shadow: the mesh draws the symbol's own sprite, the ring held still by the
	 * rig, and the flash draws `${key}Glow`, masked to the portrait.
	 *
	 * The pose runs on the frame loop, and the frame loop stops in a hidden tab.
	 * Nothing waits on it: WinWays owns the presentation's timing with timers,
	 * and a pose frozen mid-hop in a hidden tab is gone with the copy when the
	 * presentation ends.
	 */
	import { Mesh, MeshGeometry, Sprite, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS, MESH_LANDS, MESH_REVEAL } from '../game/meshWin';
	import { FxRunner, FX_TEXTURES, MESH_FX, IMPACT, IMPACT_MS, fxEndMs } from '../game/meshWin/fx';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		symbolName: string;
		/** the cell's drawn size, board px — the canvas is fitted to it */
		width: number;
		height: number;
		/** play speed: 1 at normal, faster in turbo and in the fast presentations */
		speed?: number;
		/** ms before the act starts, for a wave across several cells (the
		 *  Scatter trigger); it holds the drawing at rest until then */
		delay?: number;
		/** play the symbol's LANDING (game/meshWin/lands.ts) instead of its win */
		land?: boolean;
		/** the landing's weight — the cell's impact */
		amp?: number;
		/** the tarp coming off a crate (game/meshWin/mReveal.ts): draws the
		 *  SUBJECT only — what it uncovers is the new symbol's own tile */
		reveal?: boolean;
		/** 'plate': the plate and the shadow on it only; 'subject': everything
		 *  else only. A leaping high pay is drawn as two of these, so its
		 *  subject can be put above every other cell (WinWays). */
		part?: 'all' | 'plate' | 'subject';
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = props.reveal ? MESH_REVEAL : (props.land ? MESH_LANDS : MESH_WINS)[props.symbolName];

	// must match make_symbol_layers.mjs (the atlas) and render_mesh_wins.py
	const SHEEN_FRAMES = 24, SHEEN_COLS = 6, SHEEN_CELL = 128;
	const SHADOW_ALPHA = 0.55, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;

	const part_ = () => props.part ?? 'all';
	const fitX = $derived(props.width / CANVAS);
	const fitY = $derived(props.height / CANVAS);
	let dust = $state(false);

	const root = new Container();

	onMount(() => {
		const speed = props.speed ?? 1;
		const delay = props.delay ?? 0;
		const started = performance.now() + delay;
		root.label = `meshWin ${spec.symbol}`;
		const land = setTimeout(() => (dust = !spec.noDust && props.part !== 'plate'), delay + spec.landMs / speed);

		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const panelMode = spec.mode === 'panel';
		const subjectOnly = !!props.reveal;
		const plateTex = panelMode ? undefined : tex(`${spec.key}Plate`);
		const shadowTex = panelMode || subjectOnly ? undefined : tex(`${spec.key}Shadow`);
		const subjectTex = panelMode ? tex(spec.sprite ?? spec.key) : tex(`${spec.key}Subject`);
		const flashTex = panelMode ? tex(`${spec.key}Glow`) : subjectTex;
		const sheenTex = tex(`${spec.key}Sheen`);
		const starTex = assets.fxStar as Texture | undefined;
		if (!subjectTex || !flashTex || !sheenTex || (!panelMode && (!plateTex || (!subjectOnly && !shadowTex)))) {
			console.error(`SymbolMeshWin: ${spec.key} layers not loaded`);
			return () => clearTimeout(land);
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
		if (shadow) shadow.alpha = 0;
		// THE AFTERIMAGE (spec.smear): copies of the subject at the poses a few
		// ms ago, under it. Posed from the same pose function at earlier times
		// rather than from a buffer of past frames, so it does not depend on the
		// frame rate and a dropped frame cannot leave a stale ghost.
		const ghostCount = spec.smear?.ghosts ?? 0;
		const ghosts = Array.from({ length: ghostCount }, () => {
			const pos = new Float32Array(rig.rest);
			const geo = new MeshGeometry({ positions: pos, uvs: rig.uvs, indices: rig.indices });
			const mesh = new Mesh({ geometry: geo, texture: subjectTex });
			mesh.alpha = 0;
			mesh.visible = false;
			return { pos, geo, mesh };
		});
		const subject = new Mesh({ geometry, texture: subjectTex });
		const flash = new Mesh({ geometry, texture: flashTex });
		flash.blendMode = 'add';
		flash.tint = spec.flashTint ?? GOLD;
		flash.alpha = 0;
		const sheen = new Mesh({ geometry: sheenGeometry, texture: sheenTex });
		sheen.blendMode = 'add';
		sheen.visible = false;

		// sparks: born on the hit, a few short white glints that stay ON the tile.
		// There were eight gold stars flung up to 110 canvas px — past the tile's
		// edge, over its neighbours — and on a line win that was a gold spray
		// across the board. Five, half the reach, white: they read as a glint off
		// the subject rather than confetti.
		const sparks = Array.from({ length: starTex ? 5 : 0 }, (_, i) => {
			const s = new Sprite(starTex);
			s.anchor.set(0.5);
			s.blendMode = 'add';
			s.tint = 0xffffff;
			s.visible = false;
			const angle = -Math.PI / 2 + (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
			return { s, angle, reach: 38 + Math.random() * 22, spin: (Math.random() - 0.5) * 6 };
		});

		// PANEL mode draws the whole cell through the mesh, so the static tile
		// under this copy is never uncovered; in cut mode the plate does that.
		// THE EFFECTS: on a win only (not a landing, not the tarp), and not on the
		// plate half of a leaper — they belong to the subject. Pooled sprites,
		// handed the runner's list every frame.
		const fxItems = props.land || props.reveal || part_() === 'plate' ? [] : (MESH_FX[props.symbolName] ?? []);
		const scratch = new Float32Array(rig.rest.length);
		const fx = new FxRunner(rig, fxItems, (ms) => {
			skin(rig, spec.pose(rig, ms, props.amp), spec.feetY, scratch);
			return scratch;
		});
		const fxUnder = new Container();
		const fxOver = new Container();
		const pool = { under: [] as Sprite[], over: [] as Sprite[] };
		const drawFx = (t: number) => {
			const used = { under: 0, over: 0 };
			for (const p of fx.frame(t, positions)) {
				const texture = tex(FX_TEXTURES[p.tex]);
				if (!texture) continue;
				const list = pool[p.layer];
				let s = list[used[p.layer]];
				if (!s) {
					s = new Sprite();
					s.anchor.set(0.5);
					list.push(s);
					(p.layer === 'under' ? fxUnder : fxOver).addChild(s);
				}
				used[p.layer]++;
				s.texture = texture;
				s.visible = true;
				s.position.set(p.x, p.y);
				s.scale.set(p.sx, p.sy);
				s.rotation = p.rot;
				s.alpha = p.alpha;
				s.tint = p.tint;
				s.blendMode = p.blend;
			}
			for (const layer of ['under', 'over'] as const)
				for (let i = used[layer]; i < pool[layer].length; i++) pool[layer][i].visible = false;
		};
		const impact = props.land || props.reveal ? 0 : (IMPACT[props.symbolName] ?? 0);
		const flashTint = spec.flashTint ?? GOLD;
		// keep posing until the last particle is gone, not just the act
		const endMs = Math.max(spec.durationMs, fxEndMs(fxItems));

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		const part = part_();
		const acting = [fxUnder, ...ghosts.map((g) => g.mesh).reverse(), subject, flash, sheen, ...sparks.map((k) => k.s), fxOver];
		const layers = part === 'plate' ? [plate, shadow] : part === 'subject' ? acting : [plate, shadow, ...acting];
		for (const layer of layers) if (layer) content.addChild(layer);
		root.addChild(content);
		parent.parent.addChild(root);

		const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
		const atlasW = SHEEN_COLS * SHEEN_CELL, atlasH = rows * SHEEN_CELL;
		let sheenCell = -1;

		const tick = () => {
			const t = Math.max(0, performance.now() - started) * speed;
			const pose = spec.pose(rig, t, props.amp);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			root.scale.set(fitX * pose.plateHit, fitY * pose.plateHit);

			if (spec.smear) {
				const { stepMs, alpha, fullAtPx, trail } = spec.smear;
				ghosts.forEach((g, i) => {
					const back = t - (i + 1) * stepMs;
					if (back <= 0) {
						g.mesh.visible = false;
						return;
					}
					skin(rig, spec.pose(rig, back, props.amp), spec.feetY, g.pos);
					// how far the subject has travelled since that pose, in board px
					let d = 0;
					for (let v = 0; v < positions.length; v += 16)
						d = Math.max(d, Math.hypot(positions[v] - g.pos[v], positions[v + 1] - g.pos[v + 1]));
					// ...and the ghost is pushed further back along that travel
					for (let v = 0; v < positions.length; v++) g.pos[v] = positions[v] + (g.pos[v] - positions[v]) * trail;
					const k = Math.min(1, (d * fitY) / fullAtPx);
					g.mesh.alpha = alpha * k * (1 - i / (ghosts.length + 1));
					g.mesh.visible = g.mesh.alpha > 0.01;
					if (g.mesh.visible) g.geo.getBuffer('aPosition').update();
				});
			}
			if (plate && spec.plateUntilMs !== undefined) plate.visible = t < spec.plateUntilMs;

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

			const struck = impact > 0 && t >= spec.hitMs && t < spec.hitMs + IMPACT_MS;
			flash.tint = struck ? 0xffffff : flashTint;
			flash.alpha = struck ? Math.max(pose.flash, impact) : pose.flash;

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
				k.s.scale.set(0.16 * Math.sin(Math.PI * Math.min(1, age * 1.4)));
				k.s.rotation = k.spin * age;
				k.s.alpha = 1 - age * age;
			}

			// the beat ends exactly on the drawing (meshRig.settled): stop posing
			// once it is over, and leave the rest pose standing until WinWays
			// takes the copy away
			drawFx(t);
			if (t > endMs) ticker?.remove(tick);
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		tick();
		ticker?.add(tick);

		return () => {
			clearTimeout(land);
			ticker?.remove(tick);
			root.removeFromParent();
			// textures belong to the asset loader; the geometries are ours
			root.destroy({ children: true });
			geometry.destroy();
			sheenGeometry.destroy();
			for (const g of ghosts) g.geo.destroy();
		};
	});
</script>

{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust x={0} y={(spec.feetY - CANVAS / 2) * fitY} oncomplete={() => (dust = false)} />
{/if}
