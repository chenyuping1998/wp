<script lang="ts">
	/**
	 * One backdrop scene (SPEC §3.1): the base plate plus every delivered object
	 * layer, each with its own slow, continuous motion. Replaces Hard Time's
	 * "crop flame patches out of the flat plate" pass.
	 *
	 * Placement is game/sceneLayout.json, in the 1920x1080 plate space; this
	 * component only maps that space onto the screen (`x`, `y`, `scale` from
	 * Background.svelte) and moves things. Plain pixi objects on one container,
	 * updated on our own frame clock — sixty-odd sprites through reactive props
	 * would re-run Svelte effects every frame for nothing.
	 *
	 * Motions (the `motion.type` of a layer):
	 *   swing    hanging things rock about their top anchor (lantern, herbs,
	 *            pendulum, wind chime); `glowAt` adds a flickering light inside
	 *   flicker  candle / brazier flames stretch and breathe about their base
	 *   glow     the moon breathes, with a soft halo
	 *   twinkle  a big star pulses
	 *   rise     steam / smoke: staggered copies drift up, swell and fade
	 *   bubbles  bubbles rise from a point, grow and pop out
	 *   flutter  the pennant waves from its bracket
	 *   perch    the raven bobs and now and then turns round
	 *   dust     motes / star specks rising slowly through the side bands
	 *   meteor   a shooting star every 8–15 s
	 */
	import { Container, Sprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount, untrack } from 'svelte';

	import layout from '../game/sceneLayout.json';

	type SceneName = 'mg' | 'fg';
	type Orient = 'land' | 'port';
	type Props = {
		scene: SceneName;
		orient: Orient;
		/** plate origin and scale on screen (canvas px) */
		x: number;
		y: number;
		scale: number;
		/** only the visible scene runs its clock */
		active: boolean;
		/** plate px cropped off the left / right edge by the cover fit (no drift) */
		cropL?: number;
		cropR?: number;
		/** paper wash behind the cast, canvas px (Background.svelte): stronger below `split` */
		wash?: { left: number; right: number; top: number; bottom: number; split: number };
	};
	const props: Props = $props();

	type Motion = {
		type: string;
		amp?: number;
		period?: number;
		phase?: number;
		tint?: number;
		glowAt?: number[];
		glowSize?: number;
		dist?: number;
		copies?: number;
		alpha?: number | number[];
		keys?: string[];
		count?: number;
		spread?: number;
		s?: number | number[];
		every?: number[];
		zones?: number[][];
		speed?: number[];
		twinkle?: boolean;
		keyName?: string;
		dur?: number;
	};
	type Layer = { key: string; x?: number; y?: number; ax?: number; ay?: number; s?: number; only?: string; motion?: Motion };
	type Scene = { base: string; edgeAnchor?: boolean; layers: Layer[] };
	const SCENES = layout as unknown as Record<SceneName, Scene>;

	const app = getContextApp();
	const parent = getContextParent();
	const root = new Container();
	root.label = `wa-scene-${props.scene}`;
	parent.addToParent(root);

	const TAU = Math.PI * 2;
	const DEG = Math.PI / 180;
	const frac = (n: number) => n - Math.floor(n);
	// deterministic per-index noise, so particles do not reshuffle on a rebuild
	const hash = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const range = (v: number | number[] | undefined, fallback: number): [number, number] =>
		Array.isArray(v) ? [v[0], v[1] ?? v[0]] : [v ?? fallback, v ?? fallback];

	type Actor = (t: number, dt: number) => void;

	// the cast-band wash: over the plate, under every object layer.
	//
	// One smooth paper gradient, not bands. It used to be drawn as 14 vertical
	// strips (a stepped ramp) cut by a horizontal seam at `split`: alpha 0.22
	// above, 0.5 below. The seam was a hard line at 32% of the screen height
	// that cut the window behind the alchemist into two colours — read as a pale
	// panel behind the figure, the thing the house rule forbids (QA 11-11 B7).
	//
	// Now alpha(x, y) = ramp(x) · fall(y), painted once into a small canvas
	// texture and stretched over the band (a gradient survives stretching; it
	// has no edges to blur): ramp eases in from 0 at the housing's edge to full
	// strength toward the cast side; fall eases from the light top value to the
	// strong bottom value across a wide band centred on `split`, so the wall
	// gets paler going down without any line where it changes.
	const PAPER = 0xf2e4c4;
	const WASH_TOP_ALPHA = 0.22;
	const WASH_BOTTOM_ALPHA = 0.5;
	const WASH_FLAT_ALPHA = 0.4; // no split (portrait strip above the housing)
	const smooth = (e0: number, e1: number, v: number) => {
		const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
		return t * t * (3 - 2 * t);
	};
	const washTextures = new Map<string, Texture>();
	const washTexture = (splitFrac: number): Texture => {
		// quantised so a resize does not mint a new texture every frame
		const key = splitFrac <= 0 ? 'flat' : splitFrac.toFixed(2);
		const cached = washTextures.get(key);
		if (cached) return cached;
		const W = 128;
		const H = 256;
		const canvas = document.createElement('canvas');
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext('2d')!;
		const img = ctx.createImageData(W, H);
		const r = (PAPER >> 16) & 255;
		const g = (PAPER >> 8) & 255;
		const b = PAPER & 255;
		for (let y = 0; y < H; y++) {
			const v = (y + 0.5) / H;
			const fall =
				splitFrac <= 0
					? WASH_FLAT_ALPHA
					: lerp(WASH_TOP_ALPHA, WASH_BOTTOM_ALPHA, smooth(splitFrac - 0.22, splitFrac + 0.33, v));
			for (let x = 0; x < W; x++) {
				const ramp = smooth(0, 0.65, (x + 0.5) / W);
				const i = (y * W + x) * 4;
				img.data[i] = r;
				img.data[i + 1] = g;
				img.data[i + 2] = b;
				img.data[i + 3] = Math.round(255 * ramp * fall);
			}
		}
		ctx.putImageData(img, 0, 0);
		const texture = Texture.from(canvas);
		texture.source.scaleMode = 'linear';
		washTextures.set(key, texture);
		return texture;
	};
	const washLayer = new Sprite();
	const drawWash = () => {
		const w = props.wash;
		if (!w || w.right <= w.left || w.bottom <= w.top) {
			washLayer.visible = false;
			return;
		}
		const toX = (x: number) => (x - props.x) / props.scale;
		const toY = (y: number) => (y - props.y) / props.scale;
		const splitFrac = w.split > w.top ? (w.split - w.top) / (w.bottom - w.top) : 0;
		washLayer.texture = washTexture(splitFrac);
		washLayer.visible = true;
		washLayer.position.set(toX(w.left), toY(w.top));
		washLayer.width = toX(w.right) - toX(w.left) + 1;
		washLayer.height = toY(w.bottom) - toY(w.top);
	};

	// Zones in the plate's middle third only show in portrait (the board covers
	// them in landscape); the side-band zones only in landscape (portrait crops
	// the plate to its middle).
	const isCentre = (z: number[]) => z[0] >= 600 && z[2] <= 1300;

	const build = (
		scene: Scene,
		orient: Orient,
		crop: { l: number; r: number },
		tex: (key: string) => Texture | undefined,
	): Actor[] => {
		root.removeChild(washLayer);
		root.removeChildren().forEach((c) => c.destroy({ children: true }));
		const actors: Actor[] = [];
		const sprite = (key: string, ax = 0.5, ay = 0.5) => {
			const s = new Sprite(tex(key));
			s.anchor.set(ax, ay);
			return s;
		};

		// edge anchoring (landscape only): side objects follow the screen edge
		const anchored = scene.edgeAnchor && orient === 'land';
		const shiftX = (x: number) => (!anchored ? x : x < 600 ? x + crop.l : x > 1300 ? x - crop.r : x);
		const shiftZone = (z: number[]) => {
			const d = shiftX((z[0] + z[2]) / 2) - (z[0] + z[2]) / 2;
			return [z[0] + d, z[1], z[2] + d, z[3]];
		};

		const base = sprite(scene.base, 0, 0);
		base.width = 1920;
		base.height = 1080;
		root.addChild(base);
		root.addChild(washLayer);

		scene.layers.forEach((layer, index) => {
			const only = layer.only ?? 'both';
			if (only !== 'both' && only !== orient) return;
			const m = layer.motion;
			const kind = m?.type ?? 'static';
			const seed = index * 7.13 + (props.scene === 'fg' ? 101 : 0);

			// ── particle systems ────────────────────────────────────────────
			if (kind === 'dust' && m?.keys && m.zones) {
				const live = m.zones.filter((z) => isCentre(z) === (orient === 'port')).map(shiftZone);
				const count = Math.round((m.count ?? 12) * (orient === 'land' ? 1 : 0.35));
				const [s0, s1] = range(m.s, 0.4);
				const [v0, v1] = range(m.speed, 12);
				const [a0, a1] = range(m.alpha, 0.7);
				const motes = Array.from({ length: count }, (_, i) => {
					const z = live[i % live.length];
					const node = sprite(m.keys![i % m.keys!.length]);
					// portrait shows the plate ~1.4x larger: keep motes mote-sized
					node.scale.set(lerp(s0, s1, hash(seed + i * 3.1)) * (orient === 'land' ? 1 : 0.55));
					root.addChild(node);
					return {
						node,
						z,
						x0: lerp(z[0], z[2], hash(seed + i * 5.7)),
						y0: lerp(z[1], z[3], hash(seed + i * 9.3)),
						v: lerp(v0, v1, hash(seed + i * 2.9)),
						a: lerp(a0, a1, hash(seed + i * 4.4)),
						ph: hash(seed + i * 6.6) * TAU,
						spin: (hash(seed + i * 8.8) - 0.5) * 0.6,
					};
				});
				actors.push((t) => {
					for (const p of motes) {
						const h = p.z[3] - p.z[1];
						const y = p.z[1] + frac((p.y0 - p.z[1] - p.v * t) / h) * h;
						p.node.position.set(p.x0 + Math.sin(t * 0.45 + p.ph) * 16, y);
						p.node.rotation = t * p.spin;
						// fade at the zone's top and bottom so motes never pop
						const edge = Math.min(1, (y - p.z[1]) / 60, (p.z[3] - y) / 60);
						const tw = m.twinkle ? 0.55 + 0.45 * Math.sin(t * 2.1 + p.ph) : 1;
						p.node.alpha = Math.max(0, edge) * p.a * tw;
					}
				});
				return;
			}

			if (kind === 'meteor' && m?.keyName && m.zones) {
				const node = sprite(m.keyName);
				node.scale.set(range(m.s, 0.4)[0]);
				node.alpha = 0;
				root.addChild(node);
				const zones = m.zones.filter((z) => isCentre(z) === (orient === 'port')).map(shiftZone);
				const [e0, e1] = range(m.every, 10);
				const dur = m.dur ?? 0.9;
				let n = 0;
				let start = 3 + hash(seed) * 4;
				let from = { x: 0, y: 0 };
				// the art's head is at the lower left, its tail up and to the right
				const dir = { x: -0.91, y: 0.41 };
				const travel = 460;
				actors.push((t) => {
					if (t >= start + dur) {
						n += 1;
						start = t + lerp(e0, e1, hash(seed + n * 1.7));
						const z = zones[n % zones.length];
						from = { x: lerp(z[0], z[2], hash(seed + n * 3.3)), y: lerp(z[1], z[3], hash(seed + n * 5.1)) };
					}
					const p = (t - start) / dur;
					if (p < 0 || p > 1) {
						node.alpha = 0;
						return;
					}
					node.position.set(from.x + dir.x * travel * p, from.y + dir.y * travel * p);
					node.alpha = Math.min(1, p / 0.15, (1 - p) / 0.35);
				});
				return;
			}

			if (kind === 'bubbles' && m?.keys) {
				const count = m.count ?? 4;
				const [s0, s1] = range(m.s, 0.08);
				const period = m.period ?? 3;
				const bubbles = Array.from({ length: count }, (_, i) => {
					const node = sprite(m.keys![i % m.keys!.length]);
					root.addChild(node);
					return { node, i };
				});
				actors.push((t) => {
					for (const b of bubbles) {
						const cyc = t / period + b.i / count;
						const p = frac(cyc);
						const k = Math.floor(cyc);
						const jitter = hash(seed + b.i * 13 + k * 7.7) - 0.5;
						b.node.position.set(
							shiftX(layer.x ?? 0) + jitter * (m.spread ?? 40) + Math.sin(p * TAU * 1.5 + b.i) * 5,
							(layer.y ?? 0) - (m.dist ?? 80) * p,
						);
						b.node.scale.set(lerp(s0, s1, hash(seed + b.i * 2.2 + k)) * (0.45 + 0.75 * p));
						b.node.alpha = Math.min(1, p / 0.12, (1 - p) / 0.3);
					}
				});
				return;
			}

			// ── single objects ──────────────────────────────────────────────
			const ax = layer.ax ?? 0.5;
			const ay = layer.ay ?? 0.5;
			const s = layer.s ?? 1;
			const holder = new Container();
			holder.label = layer.key;
			holder.position.set(shiftX(layer.x ?? 0), layer.y ?? 0);
			root.addChild(holder);
			const node = sprite(layer.key, ax, ay);
			node.scale.set(s);

			const period = m?.period ?? 2;
			const w = TAU / period;
			const ph = (m?.phase ?? 0) * TAU;

			if (kind === 'rise') {
				const copies = m?.copies ?? 2;
				const top = range(m?.alpha, 0.8)[0];
				const puffs = Array.from({ length: copies }, (_, i) => {
					const puff = i === 0 ? node : sprite(layer.key, ax, ay);
					holder.addChild(puff);
					return { puff, i };
				});
				actors.push((t) => {
					for (const { puff, i } of puffs) {
						const p = frac(t / period + i / copies + (m?.phase ?? 0));
						puff.position.set(Math.sin(p * TAU + i * 2) * 8, -(m?.dist ?? 60) * p);
						puff.scale.set(s * (0.8 + 0.35 * p), s * (0.75 + 0.4 * p));
						puff.alpha = top * Math.sin(Math.PI * p) ** 1.3;
					}
				});
				return;
			}

			holder.addChild(node);

			if (kind === 'swing') {
				const amp = (m?.amp ?? 3) * DEG;
				let glow: Sprite | null = null;
				if (m?.glowAt) {
					glow = sprite('fxGlow');
					glow.tint = 0xffd27a;
					glow.blendMode = 'add';
					const size = m.glowSize ?? 100;
					glow.width = size;
					glow.height = size;
					const tx = node.texture.width * s;
					const ty = node.texture.height * s;
					glow.position.set((m.glowAt[0] - ax) * tx, (m.glowAt[1] - ay) * ty);
					holder.addChild(glow);
				}
				actors.push((t) => {
					holder.rotation = amp * Math.sin(w * t + ph);
					if (glow) glow.alpha = 0.32 + 0.14 * Math.sin(t * 7.1 + ph) + 0.08 * Math.sin(t * 13.3);
				});
			} else if (kind === 'flicker') {
				actors.push((t) => {
					const a = w * t + ph;
					holder.scale.set(1 - 0.05 * Math.sin(a + 0.6), 1 + 0.07 * Math.sin(a) + 0.03 * Math.sin(a * 2.7 + 1));
					holder.skew.x = 0.06 * Math.sin(a * 0.5 + 0.3);
					node.alpha = 0.9 + 0.1 * Math.sin(a * 3.3);
				});
			} else if (kind === 'glow') {
				const halo = sprite('fxGlow');
				halo.tint = m?.tint ?? 0xfff3d8;
				const size = Math.max(node.texture.width, node.texture.height) * s * 2.4;
				halo.width = size;
				halo.height = size;
				holder.addChildAt(halo, 0);
				actors.push((t) => {
					const a = w * t + ph;
					halo.alpha = 0.35 + 0.25 * Math.sin(a);
					holder.scale.set(1 + 0.02 * Math.sin(a));
					holder.rotation = 1.5 * DEG * Math.sin(a * 0.5);
				});
			} else if (kind === 'twinkle') {
				actors.push((t) => {
					const a = w * t + ph;
					holder.scale.set(1 + 0.16 * Math.sin(a));
					holder.rotation = 8 * DEG * Math.sin(a * 0.5);
					node.alpha = 0.75 + 0.25 * Math.sin(a + 0.7);
				});
			} else if (kind === 'flutter') {
				actors.push((t) => {
					const a = w * t + ph;
					holder.skew.y = 0.05 * Math.sin(a);
					holder.scale.set(1 + 0.035 * Math.sin(a * 2 + 1), 1 + 0.015 * Math.sin(a + 2));
				});
			} else if (kind === 'perch') {
				const [e0, e1] = range(m?.every, 9);
				let n = 0;
				let next = 4 + hash(seed) * 3;
				let facing = 1;
				let turnAt = -10;
				const TURN = 0.18;
				actors.push((t) => {
					if (t >= next) {
						n += 1;
						facing = -facing;
						turnAt = t;
						// turned away: look back sooner; facing the board: stay longer
						next = t + (facing < 0 ? 1.6 + hash(seed + n) : lerp(e0, e1, hash(seed + n * 2.3)));
					}
					// squash through edge-on: the old facing at p=0, the new one at p=1
					const p = Math.min(1, (t - turnAt) / TURN);
					holder.scale.set(-facing * Math.cos(Math.PI * p) || 0.001, 1 + 0.012 * Math.sin(t * 2.2 + ph));
				});
			}
		});
		return actors;
	};

	let actors: Actor[] = [];
	// Rounded through $derived: the plate's props change every frame (the slow
	// drift), and reading them directly in the build effect rebuilt the whole
	// scene every frame — resetting every timed act (the raven never turned).
	// (Background spreads the per-frame plate object into our props, so every
	// prop read depends on it; these deriveds only pass on real changes.)
	const sceneProp = $derived(props.scene);
	const orientProp = $derived(props.orient);
	const cropL = $derived(Math.round(props.cropL ?? 0));
	const cropR = $derived(Math.round(props.cropR ?? 0));
	let clock = 0;

	// Rebuild only when the scene, orientation, side crop or the plate's
	// texture changes. Everything else is read untracked: the build touches
	// dozens of loadedAssets entries and props, and any of them changing (the
	// plate drift alone does, every frame) used to rebuild the whole scene each
	// frame — resetting every timed act (the raven never turned round).
	$effect(() => {
		const sceneName = sceneProp;
		const orient = orientProp;
		const crop = { l: cropL, r: cropR };
		const assets = app.stateApp.loadedAssets as Record<string, Texture | undefined> | undefined;
		const scene = SCENES[sceneName];
		if (!assets?.[scene.base]) return;
		untrack(() => {
			actors = build(scene, orient, crop, (key) => assets[key]);
			for (const actor of actors) actor(clock, 0);
		});
	});

	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.scale);
		drawWash();
	});

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			if (props.active) {
				clock += dt;
				for (const actor of actors) actor(clock, dt);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>
