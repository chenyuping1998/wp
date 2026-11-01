<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { winMoveOf, WIN_MOVE_MS } from '../game/winMoves';
	import { GAME_FONT } from '../game/fonts';
 import RadioSymbolArt from './RadioSymbolArt.svelte';
 import { idleClock } from '../game/idleClock.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** which GB100 move to play: H1, L3, W... */
		symbolName: string;
		letter?: string;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// A short anticipation, a decisive contact, then a held pose and follow-through.
 // Completion stays on a timer so background tabs cannot trap a round.
	const TICK_MS = 16;
	const FRAME = 0xe5e2d6;

	const move = $derived(winMoveOf(props.symbolName));
	let t = $state(0);

	// The pose is sampled once per DISPLAY frame (everyFrame), so the motion is
	// frame-locked instead of stepping on a 16ms interval that drifts against the
	// screen (the stutter Stake's "Poor animations" tag describes). Completion is
	// a separate timeout, which still fires in a hidden tab where rAF stops.
	onMount(() => {
		const start = Date.now();
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			t = WIN_MOVE_MS / 1000;
			props.oncomplete?.();
		};
		const stopFrames = everyFrame(() => {
			t = Math.min(WIN_MOVE_MS, Date.now() - start) / 1000;
			if (t * 1000 >= WIN_MOVE_MS) finish();
		});
		const timeout = setTimeout(finish, WIN_MOVE_MS + TICK_MS);
		return () => {
			stopFrames();
			clearTimeout(timeout);
		};
	});

	// Ease velocity at pose boundaries; no linear direction snaps.
	const sample = <K extends number[]>(keys: [number, ...K][], at: number, rest: K): K => {
		if (keys.length === 0) return rest;
		if (at <= keys[0][0]) return keys[0].slice(1) as K;
		for (let i = 1; i < keys.length; i++) {
			const [t1, ...v1] = keys[i];
			if (at <= t1) {
				const [t0, ...v0] = keys[i - 1];
				const u = t1 === t0 ? 1 : (at - t0) / (t1 - t0);
   const k = u*u*(3-2*u);
				return v0.map((v, j) => v + (v1[j] - v) * k) as K;
			}
		}
		return keys[keys.length - 1].slice(1) as K;
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

	const w = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const h = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);

 const drawFrame = (g: PixiGraphics) => {
  g.clear();
  const envelope=Math.sin(Math.PI*Math.min(1,t/1.4))**2;
  const half=SYMBOL_SIZE*.455, arm=SYMBOL_SIZE*.11;
  for(const sx of [-1,1])for(const sy of [-1,1]) {
   g.moveTo(sx*(half-arm),sy*half).lineTo(sx*half,sy*half).lineTo(sx*half,sy*(half-arm))
    .stroke({width:2.5,color:FRAME,alpha:.35+.65*envelope});
  }
 };

</script>

<!--
	Win state for sprite symbols. Rendered at local 0,0 inside whatever container
	Symbol.svelte places.
-->
<Container x={(props.x ?? 0) + offset.x} y={(props.y ?? 0) + offset.y} {scale} {rotation}>
 <RadioSymbolArt assetKey={props.symbolInfo.assetKey} name={props.symbolName}
  width={w} height={h} ms={t*1000} reelMs={idleClock.t} win={true} />
	{#if props.letter}
		<Text anchor={0.5} text={props.letter} style={{ fontFamily: GAME_FONT, fontWeight: '400', fontSize: props.letter.length > 1 ? 51 : 62, fill: 0x15191f }} />
	{/if}
</Container>

<Graphics x={props.x??0} y={props.y??0} draw={drawFrame} />
