<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { winMoveOf, WIN_MOVE_MS } from '../game/winMoves';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which GB100 move to play: H1, L3, W... */
		symbolName: string;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// THE WIN MOVE, AS GO BANANAS 100 PLAYS IT.
	//
	// This used to be a 5.5% breathing pulse with a faint bloom over the tile,
	// chosen so a winning tile would never overlap its neighbours. It never
	// overlapped anything, and it never looked like anything either: next to
	// GB100, where every symbol has its own 1.4s move and swells to 1.3-1.55x,
	// a win here barely registered.
	//
	// So it plays GB100's moves now — same keys, same timing, per symbol (see
	// game/winMoves.ts for where they came from and how they were converted).
	// Overlapping the neighbours is the point of them, and it works for the same
	// reason it worked in GB100: a winning symbol is drawn on the board's top
	// layer (ReelSymbol sets `animating` for the win state), above every tile
	// that did not win, and above WinScrim's dimming of those tiles.
	//
	// The gold frame is drawn here, around the tile and moving WITH it, rather
	// than as a fixed square on the cell: a fixed frame cut straight across a
	// tile grown past it. GB100 drew its `payframe` alongside the symbol in the
	// same way.
	//
	// Played once. oncomplete fires when it ends, the way the spine's complete
	// did, so Board's hold measures the move rather than guessing at it. Timed
	// with setInterval and Date.now, not requestAnimationFrame: rAF stops in a
	// hidden tab, and the round would wait on a completion that never came.
	const TICK_MS = 16;
	const FRAME = 0xffd75e;

	const move = $derived(winMoveOf(props.symbolName));
	let t = $state(0);

	onMount(() => {
		const start = Date.now();
		let done = false;
		const id = setInterval(() => {
			t = Math.min(WIN_MOVE_MS, Date.now() - start) / 1000;
			if (!done && t * 1000 >= WIN_MOVE_MS) {
				done = true;
				clearInterval(id);
				props.oncomplete?.();
			}
		}, TICK_MS);
		return () => clearInterval(id);
	});

	// linear between keys, as every curve in the source was
	const sample = <K extends number[]>(keys: [number, ...K][], at: number, rest: K): K => {
		if (keys.length === 0) return rest;
		if (at <= keys[0][0]) return keys[0].slice(1) as K;
		for (let i = 1; i < keys.length; i++) {
			const [t1, ...v1] = keys[i];
			if (at <= t1) {
				const [t0, ...v0] = keys[i - 1];
				const k = t1 === t0 ? 1 : (at - t0) / (t1 - t0);
				return v0.map((v, j) => v + (v1[j] - v) * k) as K;
			}
		}
		return keys[keys.length - 1].slice(1) as K;
	};
	// colours lerp per channel, or a warm flash would pass through green
	const sampleTint = (at: number) => {
		const keys = move.tint;
		if (keys.length === 0) return 0xffffff;
		let i = keys.findIndex(([kt]) => at <= kt);
		if (i <= 0) return keys[i === 0 ? 0 : keys.length - 1][1];
		const [t0, c0] = keys[i - 1];
		const [t1, c1] = keys[i];
		const k = t1 === t0 ? 1 : (at - t0) / (t1 - t0);
		let out = 0;
		for (const shift of [16, 8, 0]) {
			const a = (c0 >> shift) & 0xff;
			const b = (c1 >> shift) & 0xff;
			out |= Math.round(a + (b - a) * k) << shift;
		}
		return out;
	};

	const rotation = $derived((sample(move.rotate, t, [0])[0] * Math.PI) / 180);
	const scale = $derived.by(() => {
		const [x, y] = sample(move.scale, t, [1, 1]);
		return { x, y };
	});
	const offset = $derived.by(() => {
		const [x, y] = sample(move.translate, t, [0, 0]);
		return { x: x * SYMBOL_SIZE, y: y * SYMBOL_SIZE };
	});
	const tint = $derived(sampleTint(t));
	// the frame is brightest while the tile is furthest out
	const lift = $derived(Math.min(1, Math.max(0, (Math.max(scale.x, scale.y) - 1) / 0.35)));

	const w = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const h = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);

	const drawFrame = (g: PixiGraphics) => {
		g.clear();
		const inset = SYMBOL_SIZE * 0.02;
		g.roundRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, SYMBOL_SIZE * 0.05).stroke({
			width: SYMBOL_SIZE * 0.03,
			color: FRAME,
			alpha: 0.55 + 0.4 * lift,
		});
	};
</script>

<!--
	Win state for sprite symbols. Rendered at local 0,0 inside whatever container
	Symbol.svelte places.
-->
<Container x={(props.x ?? 0) + offset.x} y={(props.y ?? 0) + offset.y} {scale} {rotation}>
	<Sprite anchor={0.5} key={props.symbolInfo.assetKey} width={w} height={h} {tint} />
	<Graphics draw={drawFrame} />
</Container>
