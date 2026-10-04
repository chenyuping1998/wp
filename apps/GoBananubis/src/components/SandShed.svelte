<script lang="ts">
	/**
	 * The sand the board sheds as it rises out of the tomb floor (EntryReveal).
	 *
	 *   rising    grains thrown off the housing's top edge (carried up with it,
	 *             then falling back) and running off both its sides
	 *   seat      the board drops into place: dust bursts out from its foot on
	 *             both sides, rolling outward, and a spray of grains with it
	 *   after     sand keeps pouring down both sides of the housing from its
	 *             top corners — a curtain each side, thinning out over ~1.3s
	 *
	 * Plain pooled sprites on the app ticker, in main-layout px (place it in a
	 * MainContainer). `frame` is the housing as it is right now; it moves while
	 * rising, and the spawns follow it.
	 */
	import { Container, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		frame: { x: number; y: number; halfW: number; halfH: number };
		/** ms into the reveal */
		t: number;
		/** px/ms the housing is moving (negative = up) */
		riseSpeed: number;
		/** ms at which it seats */
		seatAt: number;
		rising: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const SAND = [0xe8c98a, 0xd9b877, 0xf2dcae, 0xc9a364];
	const GRAVITY = 1500;
	const MAX_GRAINS = 700;
	const CURTAIN_MS = 1300;

	type Grain = { s: Sprite; x: number; y: number; vx: number; vy: number; age: number; life: number; live: boolean };
	type Cloud = { s: Sprite; x: number; y: number; vx: number; age: number; size: number };
	type Curtain = { s: Sprite; side: -1 | 1; inset: number };

	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

	onMount(() => {
		const glow = app.stateApp.loadedAssets?.fxGlow as Texture | undefined;
		const streak = app.stateApp.loadedAssets?.fxStreak as Texture | undefined;
		if (!glow || !streak) {
			console.error('SandShed: fxGlow / fxStreak not loaded');
			return;
		}
		const root = new Container();
		root.label = 'sandShed';
		const curtainLayer = new Container();
		const grainLayer = new Container();
		const cloudLayer = new Container();
		root.addChild(curtainLayer, grainLayer, cloudLayer);
		parent.parent.addChild(root);

		const grains: Grain[] = [];
		const clouds: Cloud[] = [];
		const spawn = (x: number, y: number, vx: number, vy: number, big = false) => {
			let g = grains.find((q) => !q.live);
			if (!g) {
				if (grains.length >= MAX_GRAINS) return;
				const s = new Sprite(glow);
				s.anchor.set(0.5);
				grainLayer.addChild(s);
				g = { s, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, live: false };
				grains.push(g);
			}
			Object.assign(g, { x, y, vx, vy, age: 0, life: rand(0.9, 1.6), live: true });
			g.s.visible = true;
			g.s.tint = pick(SAND);
			const d = big ? rand(10, 15) : rand(4, 8);
			g.s.setSize(d, d);
		};

		// the curtains: a faint sheet down each side, under the grains
		const curtains: Curtain[] = ([-1, 1] as const).flatMap((side) =>
			[2, 12].map((inset) => {
				const s = new Sprite(streak);
				s.anchor.set(0, 0.5);
				s.rotation = Math.PI / 2;
				s.blendMode = 'add';
				s.tint = 0xe8c98a;
				s.alpha = 0;
				curtainLayer.addChild(s);
				return { s, side, inset };
			}),
		);

		let seated = false;
		let carryTop = 0, carrySide = 0, carryCurtain = 0;

		const tick = () => {
			const dt = Math.min(0.05, (app.stateApp.pixiApplication?.ticker.deltaMS ?? 16) / 1000);
			const { x: fx, y: fy, halfW, halfH } = props.frame;
			const top = fy - halfH, bottom = fy + halfH;
			const carry = props.riseSpeed * 1000;

			if (props.rising) {
				// thrown off the top edge, carried up with it, falling back
				carryTop += 260 * dt;
				while (carryTop >= 1) {
					carryTop--;
					spawn(fx + rand(-halfW, halfW), top + rand(0, 8), rand(-60, 60), carry * rand(0.4, 0.8), Math.random() < 0.12);
				}
				// running off the sides
				carrySide += 200 * dt;
				while (carrySide >= 1) {
					carrySide--;
					const side = Math.random() < 0.5 ? -1 : 1;
					spawn(fx + side * (halfW + rand(-4, 4)), top + rand(0, 2 * halfH), side * rand(15, 70), carry * rand(0.2, 0.5));
				}
			}

			if (!seated && props.t >= props.seatAt) {
				seated = true;
				// dust bursting out from the foot, both ways, and a spray with it
				for (const side of [-1, 1]) {
					for (let i = 0; i < 4; i++) {
						const s = new Sprite(glow);
						s.anchor.set(0.5);
						s.tint = pick(SAND);
						cloudLayer.addChild(s);
						clouds.push({
							s,
							x: fx + side * (halfW * rand(0.55, 1)),
							y: bottom - rand(0, 24),
							vx: side * rand(60, 220),
							age: 0,
							size: rand(110, 200),
						});
					}
					for (let i = 0; i < 40; i++) {
						spawn(fx + side * halfW * rand(0.6, 1.02), bottom - rand(0, 10), side * rand(80, 380), -rand(150, 520), Math.random() < 0.15);
					}
				}
			}

			// the curtains down both sides, thinning out
			const since = props.t - props.seatAt;
			const pour = since < 0 ? 0 : Math.max(0, 1 - since / CURTAIN_MS);
			if (pour > 0) {
				carryCurtain += 220 * pour * dt;
				while (carryCurtain >= 1) {
					carryCurtain--;
					const side = Math.random() < 0.5 ? -1 : 1;
					spawn(fx + side * (halfW + rand(-2, 12)), top + rand(-6, 20), side * rand(0, 18), rand(30, 120));
				}
			}
			for (const c of curtains) {
				c.s.position.set(fx + c.side * (halfW + c.inset), top);
				c.s.setSize((bottom - top) * Math.min(1, Math.max(0, since) / 500), 70);
				c.s.alpha = 0.16 * pour * Math.min(1, Math.max(0, since) / 120);
			}

			for (const g of grains) {
				if (!g.live) continue;
				g.age += dt;
				g.vy += GRAVITY * dt;
				g.vx *= 1 - 0.8 * dt;
				g.x += g.vx * dt;
				g.y += g.vy * dt;
				const fading = g.y > bottom + 40 || g.age > g.life;
				g.s.alpha = fading ? Math.max(0, g.s.alpha - dt * 4) : 0.92;
				if (fading && g.s.alpha <= 0) {
					g.live = false;
					g.s.visible = false;
					continue;
				}
				g.s.position.set(g.x, g.y);
			}

			for (const c of clouds) {
				c.age += dt;
				const p = Math.min(1, c.age / 1.1);
				c.x += c.vx * dt;
				c.vx *= 1 - 2.2 * dt;
				c.s.position.set(c.x, c.y - 30 * p);
				c.s.setSize(c.size * (0.5 + 0.9 * p), c.size * (0.3 + 0.45 * p));
				c.s.alpha = 0.55 * (1 - p) * Math.min(1, c.age / 0.08);
			}
		};

		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
		};
	});
</script>
