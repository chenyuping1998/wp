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
	import { Mesh, MeshGeometry, Sprite, Container, Graphics as PixiGraphicsNode, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';
	import { WIN_FX, spawn, particleAt, haloAt, beamAt } from '../game/meshWin/winFx';
	import { HIGH_JUMP, highJump } from '../game/meshWin/highJump';
	import { getContext } from '../game/context';
	import { winTimeScale } from '../game/timeScale';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** a spec to play instead of the symbol's win (the dynamite's landing) */
		spec?: MeshWinSpec;
		/** which reel the cell is on: the win cascades left to right */
		reel?: number;
		/** the gold pay frame round the cell (every winning symbol but the Scatter) */
		showWinFrame?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const context = getContext();
	const spec = props.spec ?? MESH_WINS[props.symbolName];

	// must match make_symbol_layers.mjs (the atlas) and render_mesh_wins.py
	const SHEEN_FRAMES = 24, SHEEN_COLS = 6, SHEEN_CELL = 128;
	const SHADOW_ALPHA = 0.55, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;

	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;

	// THE WHOLE CELL POPS. The mesh acting is held to what the drawing can take
	// without tearing (check_mesh_wins.mjs), which on a board of 20 cells read
	// as small. So on top of it the whole symbol — stone, subject and all —
	// springs out to POP_UP on the hit, settles back to POP_HOLD and breathes
	// there, and comes home over the last POP_OUT_MS so the swap back to the
	// static sprite is seamless (exactly 1 at 0ms and at the end).
	// Wins only: the dynamite's landing (props.spec) keeps its own size.
	const POP_UP = 0.28;
	const POP_HOLD = 0.1;
	const POP_OUT_MS = 260;
	const easeOutBack = (u: number) => {
		const c = 1.9;
		const v = u - 1;
		return 1 + (c + 1) * v * v * v + c * v * v;
	};
	const smooth01 = (u: number) => {
		const x = Math.min(1, Math.max(0, u));
		return x * x * (3 - 2 * x);
	};
	const cellPop = (t: number) => {
		if (props.spec) return 1;
		const hit = Math.max(1, spec.hitMs);
		const into = t < hit ? POP_UP * easeOutBack(Math.max(0, t / hit)) : 0;
		const after =
			t >= hit
				? POP_HOLD +
					(POP_UP - POP_HOLD) * Math.exp(-(t - hit) / 160) +
					0.035 * Math.sin((t - hit) / 70) * smooth01((t - hit) / 200)
				: 0;
		const out = 1 - smooth01((t - (spec.durationMs - POP_OUT_MS)) / POP_OUT_MS);
		return 1 + (t < hit ? into : after) * out;
	};

	// AND IT JUMPS: a hop off the board whose first peak lands on the hit, then
	// smaller ones, each |sin| arch starting and ending on the ground so there
	// is no jolt between them. Faded out with the pop, so it is back on the
	// cell exactly when the static sprite takes over. Board px, up.
	const HOP_PX = SYMBOL_SIZE * 0.14;
	const cellHop = (t: number) => {
		if (props.spec || t <= 0) return 0;
		const period = 2 * Math.max(120, spec.hitMs);
		const arch = Math.abs(Math.sin((Math.PI * t) / period));
		const decay = Math.exp(-t / 1000);
		const out = 1 - smooth01((t - (spec.durationMs - POP_OUT_MS)) / POP_OUT_MS);
		return HOP_PX * arch * decay * out;
	};

	// THE PAY FRAME IS A NEON TUBE in the symbol's own colour (gold is the
	// Scatter's alone), drawn each frame: it stutters on like a sign being
	// switched on — two flickers, then full — and hums while it is lit.
	const NEON = spec.symbol === 'S' ? GOLD : (spec.flashTint ?? GOLD);
	const neonOn = (t: number) => {
		const on = t < 40 ? 0.9 : t < 70 ? 0.12 : t < 110 ? 0.75 : t < 150 ? 0.2 : Math.min(1, 0.2 + (t - 150) / 50);
		return on * (0.93 + 0.07 * Math.sin(t / 31) * Math.sin(t / 13));
	};
	const drawNeonFrame = (g: PixiGraphics, t: number) => {
		g.clear();
		const half = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / 2;
		const inset = SYMBOL_SIZE * 0.02;
		const a = neonOn(t);
		const box = () => g.roundRect(-half + inset, -half + inset, (half - inset) * 2, (half - inset) * 2, SYMBOL_SIZE * 0.05);
		// the glow round the tube, the tube, and its white-hot core
		box().stroke({ width: SYMBOL_SIZE * 0.1, color: NEON, alpha: 0.22 * a });
		box().stroke({ width: SYMBOL_SIZE * 0.05, color: NEON, alpha: 0.45 * a });
		box().stroke({ width: SYMBOL_SIZE * 0.022, color: NEON, alpha: 0.95 * a });
		box().stroke({ width: SYMBOL_SIZE * 0.008, color: 0xffffff, alpha: 0.85 * a });
	};
	let dust = $state(false);

	// THE HIGHS PERFORM ON THEIR CELL (game/meshWin/highJump.ts) — crouch,
	// spring, trick, stomp — instead of the lows' pop: a win, not the
	// dynamite's landing (props.spec).
	// Neighbouring highs on a line turn opposite ways.
	const jumper = !props.spec && HIGH_JUMP[spec.symbol] !== undefined;
	const jumpSide = (props.reel ?? 0) % 2 ? -1 : 1;

	const root = new Container();

	onMount(() => {
		// the free game's wins are the payoff: turbo shortens them to ~74%, not
		// half (game/timeScale.ts)
		const speed = props.spec ? stateBetDerived.timeScale() : winTimeScale();
		const started = performance.now();
		// No cascade delay of its own here. GoBananubis staggers its line 60ms a
		// reel in this component; in this game WinWays already lights the win
		// reel by reel (90ms apart, 40 in turbo) and each cell mounts as its reel
		// is reached, so a second stagger on top would double it.
		const delay = 0;
		root.label = `meshWin ${spec.symbol} reel ${props.reel ?? '?'} +${delay}ms`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		const done = setTimeout(() => props.oncomplete?.(), (delay + spec.durationMs) / speed);
		const land = setTimeout(() => (dust = true), (delay + spec.landMs) / speed);
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
		flash.tint = spec.flashTint ?? GOLD;
		flash.alpha = 0;
		const sheen = new Mesh({ geometry: sheenGeometry, texture: sheenTex });
		sheen.blendMode = 'add';
		sheen.visible = false;

		// THE SYMBOL'S OWN PARTICLES (game/meshWin/winFx.ts): embers for the
		// lantern, glints for the crystal, a spark shower for the picks... The
		// generic star burst below is only for what has none (the dynamite's
		// landing).
		const fx = WIN_FX[spec.symbol];
		const glowTex = assets.fxGlow as Texture | undefined;
		const streakTex = assets.fxStreak as Texture | undefined;
		const fxTex = { fxStar: starTex, fxGlow: glowTex, fxStreak: streakTex, chip: Texture.WHITE };
		// seeded by the cell, so two lanterns on one line do not throw the same
		// embers in step
		const particles = fx ? spawn(fx, spec.hitMs, 1 + (props.reel ?? 0) * 97 + Math.round((props.y ?? 0) * 13)) : [];
		const particleSprites = particles.map((p) => {
			const k = new Sprite(fxTex[p.emitter.tex] ?? Texture.WHITE);
			k.anchor.set(0.5);
			if (p.emitter.add) k.blendMode = 'add';
			k.visible = false;
			return k;
		});
		const halo = fx?.halo && glowTex ? new Sprite(glowTex) : null;
		if (halo) {
			halo.anchor.set(0.5);
			halo.blendMode = 'add';
			halo.tint = fx!.halo!.tint;
			halo.position.set(...fx!.halo!.at);
			halo.setSize(fx!.halo!.size, fx!.halo!.size);
		}
		const beam = fx?.beam && glowTex ? new Sprite(glowTex) : null;
		if (beam) {
			// the soft glow stretched long and drawn from near its end reads as a
			// cone of light (the streak texture was a hairline at this width)
			beam.anchor.set(0.12, 0.5);
			beam.blendMode = 'add';
			beam.tint = fx!.beam!.tint;
			beam.position.set(...fx!.beam!.at);
			beam.setSize(fx!.beam!.length, fx!.beam!.width);
			beam.alpha = 0;
		}

		// sparks: born on the hit, flung out from the subject, gone in ~0.5s
		const sparks = Array.from({ length: starTex && !fx && !spec.quiet ? 8 : 0 }, (_, i) => {
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
		// the light sits under a cut subject (on the stone, behind it) and over a
		// panel one, whose opaque panel would hide it
		const layers = panelMode
			? [subject, flash, halo, sheen, beam]
			: [plate, shadow, halo, subject, flash, sheen, beam];
		for (const layer of [...layers, ...particleSprites, ...sparks.map((k) => k.s)])
			if (layer) content.addChild(layer);
		root.addChild(content);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// A performing high swells and turns past its cell's edges, so it goes on
		// TOP of the cells round it. Everything else stays under the pay frame,
		// which the markup draws.
		if (jumper) parent.parent.addChild(root);
		else parent.parent.addChildAt(root, 0);
		let wasLanded = 0;

		// OVER the pay frame: a bright comet running once round it, and a star
		// on each corner on the hit
		const over = new Container();
		over.label = `meshWin frame ${spec.symbol}`;
		const tube = new PixiGraphicsNode();
		tube.blendMode = 'add';
		const trace = new PixiGraphicsNode();
		trace.blendMode = 'add';
		over.addChild(tube, trace);
		const half = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / 2 - SYMBOL_SIZE * 0.02;
		const corners = (props.showWinFrame ?? true) && starTex
			? [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
					const k = new Sprite(starTex);
					k.anchor.set(0.5);
					k.blendMode = 'add';
					k.tint = NEON;
					k.position.set(sx * half, sy * half);
					k.visible = false;
					over.addChild(k);
					return k;
				})
			: [];
		over.position.set(props.x ?? 0, props.y ?? 0);
		if (props.showWinFrame ?? true) parent.parent.addChild(over);

		// a point u (0..1) of the way round the frame, clockwise from top left
		const rim = (u: number): [number, number] => {
			const w = ((u % 1) + 1) % 1 * 4;
			const side = Math.floor(w), f = w - side;
			const a = -half + 2 * half * f;
			return side === 0 ? [a, -half] : side === 1 ? [half, a] : side === 2 ? [-a, half] : [-half, -a];
		};
		const TRACE_MS = 900, TAIL = 0.22, SEGS = 16;
		const drawTrace = (t: number) => {
			trace.clear();
			if (t >= TRACE_MS + 200) return;
			const head = Math.min(1, t / TRACE_MS);
			// eased: quick off the mark, slowing into the corner it started from
			const h = 1 - (1 - head) ** 2;
			const fade = 1 - Math.max(0, (t - TRACE_MS) / 200);
			for (let i = 0; i < SEGS; i++) {
				const u1 = h - (TAIL * i) / SEGS, u0 = h - (TAIL * (i + 1)) / SEGS;
				if (u1 <= 0) break;
				const [x0, y0] = rim(Math.max(0, u0));
				const [x1, y1] = rim(u1);
				const k = 1 - i / SEGS;
				trace.moveTo(x0, y0).lineTo(x1, y1).stroke({
					width: SYMBOL_SIZE * (0.018 + 0.03 * k),
					color: i < 3 ? 0xffffff : NEON,
					alpha: 0.9 * k * k * fade,
					cap: 'round',
				});
			}
		};

		// where the sparks fly from: the picks' clash is at the top, not the middle
		const [sparkX, sparkY] = spec.sparkAt ?? [CANVAS / 2, CANVAS / 2];

		const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
		const atlasW = SHEEN_COLS * SHEEN_CELL, atlasH = rows * SHEEN_CELL;
		let sheenCell = -1;

		const tick = () => {
			const t = Math.max(0, performance.now() - started - delay / speed) * speed;
			const pose = spec.pose(rig, t);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			if (jumper) {
				const j = highJump(spec.symbol, t, spec.durationMs, jumpSide);
				const k = fit * pose.plateHit * j.pop;
				root.scale.set(k * j.sx, k * j.sy);
				root.angle = j.rot;
				// squash and stretch keep the tile's feet on the ground
				const half = (CANVAS / 2) * fit;
				root.position.set(props.x ?? 0, (props.y ?? 0) + half * (1 - j.sy));
				// each touchdown: the frame takes the knock and dust flies
				if (j.landed > 0 && wasLanded === 0) {
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.35 * j.landed });
					dust = false;
					queueMicrotask(() => (dust = true));
				}
				wasLanded = j.landed;
			} else {
				root.scale.set(fit * pose.plateHit * cellPop(t));
				root.position.set(props.x ?? 0, (props.y ?? 0) - cellHop(t));
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

			if (halo) halo.alpha = haloAt(fx!.halo!, t, pose.flash);
			if (beam) {
				const b = beamAt(fx!.beam!, t);
				beam.angle = b.angle;
				beam.alpha = b.alpha;
			}
			particles.forEach((p, i) => {
				const st = particleAt(p, t);
				const k = particleSprites[i];
				k.visible = st.visible;
				if (!st.visible) return;
				k.position.set(st.x, st.y);
				k.rotation = st.rotation;
				k.tint = st.tint;
				k.alpha = st.alpha;
				// a streak is a bar 128 x ~20: sized by its length
				if (p.emitter.tex === 'fxStreak') k.setSize(st.size * st.stretch * 2.2, st.size * 0.34);
				else k.setSize(st.size, st.size);
			});
			if (props.showWinFrame ?? true) drawNeonFrame(tube, t);
			drawTrace(t);
			const cornerAge = (t - spec.hitMs) / 420;
			for (const k of corners) {
				k.visible = cornerAge > 0 && cornerAge < 1;
				if (!k.visible) continue;
				const s = SYMBOL_SIZE * 0.3 * Math.sin(Math.PI * cornerAge);
				k.setSize(s, s);
				k.rotation = cornerAge * 2.4;
				k.alpha = 1 - cornerAge * cornerAge;
			}

			const age = (t - spec.hitMs) / 520;
			for (const k of sparks) {
				k.s.visible = age > 0 && age < 1;
				if (!k.s.visible) continue;
				const out = 1 - (1 - age) ** 3;
				k.s.position.set(
					sparkX + Math.cos(k.angle) * k.reach * out,
					sparkY + pose.rigid.dy + Math.sin(k.angle) * k.reach * out,
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
			over.removeFromParent();
			over.destroy({ children: true });

			root.removeFromParent();
			// textures belong to the asset loader; the geometries are ours
			root.destroy({ children: true });
			geometry.destroy();
			sheenGeometry.destroy();
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
