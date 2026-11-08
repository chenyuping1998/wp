<script lang="ts">
	/**
	 * Cows wandering the field at night (user 2026-11-06: 讓獎圖的那隻牛在背景有幾隻牛走來走去).
	 *
	 * Three of the intro card's cow (game/meshWin/bgCows.ts), each on her own loose routine: amble a few
	 * seconds, stop and graze or just stand, amble on; at the end of her patch she stops, turns and heads back.
	 * Mostly still, like the rest of the motion here (act, then a long rest) — a field of cows that never stop
	 * walking is a screensaver. Smaller and higher up the field the further off she is; a soft contact shadow
	 * under her hooves; the mist (BgEvents, drawn after this) drifts in front of her legs.
	 *
	 * Their patches are the open field RIGHT of the board, round and behind the captain (plate x ~1230-1740):
	 * the middle of the field sits behind the board on desktop, where nobody saw them (user 2026-11-06, with a
	 * screenshot: 多在角色後面那一塊走來走去才看的到). Each patch stops short of the right-hand foreground corn,
	 * which starts at plate x ~1730 (hooves at y 680) to ~1840 (y 600) — a cow must never walk OVER it.
	 *
	 * requestAnimationFrame, not setInterval: the review checker flags interval animation.
	 */
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { COW, COW_CANVAS, COW_GROUND, type CowEnv } from '../game/meshWin/bgCows';
	import PropMesh from './PropMesh.svelte';

	type Props = { x: number; y: number; width: number; height: number };
	const props: Props = $props();

	type Mode = 'walk' | 'graze' | 'stand' | 'turn';
	type Cow = {
		x: number;
		y: number;
		scale: number;
		lo: number;
		hi: number;
		dir: 1 | -1;
		mode: Mode;
		left: number;
		turnK: number;
		env: CowEnv;
	};
	const STRIDE_S = 1.3;
	const TURN_S = 0.45;

	// a fixed seed per cow: the routine varies, but the same way every session
	let seed = 1337;
	const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	const pick = (a: number, b: number) => a + (b - a) * rand();

	const make = (x: number, y: number, scale: number, lo: number, hi: number, dir: 1 | -1, mode: Mode, left: number): Cow => ({
		x, y, scale, lo, hi, dir, mode, left, turnK: 0,
		env: { t: 0, phase: rand() * Math.PI * 2, walk: mode === 'walk' ? 1 : 0, graze: mode === 'graze' ? 1 : 0 },
	});
	// hooves on plate y; scale grows toward the viewer
	let cows = $state<Cow[]>([
		make(1420, 590, 0.31, 1260, 1740, 1, 'graze', 4.5),
		make(1600, 628, 0.36, 1240, 1660, -1, 'walk', 5),
		make(1300, 664, 0.4, 1230, 1600, 1, 'stand', 2.5),
	]);

	const next = (c: Cow) => {
		if (c.mode === 'walk') {
			c.mode = rand() < 0.6 ? 'graze' : 'stand';
			c.left = c.mode === 'graze' ? pick(5, 9) : pick(2.5, 4.5);
		} else if (c.mode === 'turn') {
			c.dir = -c.dir as 1 | -1;
			c.turnK = 0;
			c.mode = 'walk';
			c.left = pick(3.5, 7);
		} else {
			c.mode = 'walk';
			c.left = pick(3.5, 7);
		}
	};

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const start = last;
		const tick = (now: number) => {
			const dt = Math.min(now - last, 100) / 1000;
			last = now;
			cows = cows.map((c0) => {
				const c = { ...c0, env: { ...c0.env } };
				c.env.t = now - start;
				// blend into and out of the walk and the graze, never a cut
				const toward = (v: number, goal: number, s: number) => v + (goal - v) * Math.min(1, dt / s);
				c.env.walk = toward(c.env.walk, c.mode === 'walk' ? 1 : 0, 0.35);
				c.env.graze = toward(c.env.graze, c.mode === 'graze' ? 1 : 0, 0.55);
				c.env.phase += ((dt * Math.PI * 2) / STRIDE_S) * c.env.walk;
				c.x += c.dir * 40 * c.scale * c.env.walk * dt;
				if (c.mode === 'turn') c.turnK = Math.min(1, c.turnK + dt / TURN_S);
				c.left -= dt;
				// the end of her patch: stop, turn round, head back
				const atEdge = (c.dir > 0 && c.x > c.hi) || (c.dir < 0 && c.x < c.lo);
				if (c.mode === 'walk' && atEdge) {
					c.mode = 'turn';
					c.left = TURN_S + 0.35;
				} else if (c.left <= 0) next(c);
				return c;
			});
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// the turn: she narrows to her front view and widens facing the other way (a quick paper turn, eased)
	const facing = (c: Cow) => {
		if (c.mode !== 'turn') return c.dir;
		const k = c.turnK, e = k * k * (3 - 2 * k);
		return c.dir * (Math.abs(1 - 2 * e) < 0.12 ? Math.sign(1 - 2 * e) * 0.12 : 1 - 2 * e);
	};
</script>

<Container x={props.x} y={props.y} scale={{ x: props.width / 1920, y: props.height / 1080 }}>
	{#each [...cows].sort((a, b) => a.y - b.y) as c, i (i)}
		<Container x={c.x} y={c.y} scale={{ x: facing(c) * c.scale, y: c.scale }}>
			<!-- soft contact shadow under the hooves -->
			<Sprite key="fxSoft" anchor={0.5} x={-48} y={2} width={200} height={30} tint={0x0b1030} alpha={0.45} />
			<PropMesh spec={COW} env={c.env} x={-COW_CANVAS / 2} y={-COW_GROUND} width={COW_CANVAS} height={COW_CANVAS} />
		</Container>
	{/each}
</Container>
