<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);
	const RIGHT = $derived(x + SYMBOL_SIZE / 2);
	const H = BOARD_SIZES.height;

	// Seconds since the tease started. The wisps travel, so this is a running clock.
	let t = $state(0);
	let finished = $state(false);

	// Per-reel phase offset: when several reels tease at once a shared phase makes
	// them strobe as one block.
	const phase = $derived(props.reel.reelIndex * 0.9);
	const pulse = $derived(0.5 + 0.5 * Math.sin(t * 6.5 + phase));

	// Wisps climbing each rail. Deterministic per index so a reel looks the same
	// every time it teases, and the two rails are offset so they never rise level.
	const WISPS = 7;
	const wisps = $derived.by(() =>
		[0, 1].flatMap((side) =>
			Array.from({ length: WISPS }, (_, i) => ({
				key: `${side}-${i}`,
				side,
				speed: 0.55 + Math.abs(Math.sin(i * 78.233 + side * 3.1)) * 0.45,
				offset: (i + 0.5) / WISPS + side * 0.5 / WISPS,
				width: 0.5 + Math.abs(Math.sin(i * 43.11 + side)) * 0.5,
				warm: Math.abs(Math.sin(i * 5.31 + side * 2.7)),
			})),
		),
	);

	const WISP_TINTS = [0x5fd06a, 0x8ce85a, 0xb8ff5a, 0xe2ffb0];

	// A pool of light at the foot of the column and a spill off the top. Hoisted
	// out of the template so the array is not rebuilt on every frame.
	const VENTS = [
		{ y: H, width: 1.5, height: 0.85, alpha: 0.5 },
		{ y: 0, width: 1.2, height: 0.6, alpha: 0.34 },
	];

	onMount(() => {
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			t = (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	$effect(() => {
		// Stop the moment the reel lands, so the tease hands over to the result.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});

	
	const climbOf = (wisp: { speed: number; offset: number }) =>
		(t * wisp.speed + wisp.offset) % 1;
</script>

<BoardContainer>
	<!-- the column glows from within; brightest at the rails -->
	<Graphics
		draw={(g) => {
			g.clear();

			// a wash over the whole teasing column
			g.beginFill(0x8ce85a, 0.16 + 0.14 * pulse);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, H - 6, 12);
			g.endFill();

			// one bright rim, not nested strokes — the wisps carry the edge
			g.lineStyle(2.5, 0xe2ffb0, 0.55 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 4, 4, SYMBOL_SIZE - 8, H - 8, 12);

			// cell ticks so the column still reads as six slots, not a tube
			g.lineStyle(1.5, 0xb8ff5a, 0.14 + 0.16 * pulse);
			for (let row = 1; row < H / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 16, y);
				g.lineTo(RIGHT - 16, y);
			}
		}}
	/>

	<!-- wisps climbing both rails -->
	{#each wisps as wisp (wisp.key)}
		{@const climb = climbOf(wisp)}
		{@const rail = wisp.side === 0 ? LEFT + 5 : RIGHT - 5}
		{@const fade = Math.sin(climb * Math.PI) ** 0.7}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={rail + Math.sin(t * 5 + wisp.offset * 9) * 3}
			y={H - climb * (H + SYMBOL_SIZE * 0.6)}
			width={SYMBOL_SIZE * (0.34 + wisp.width * 0.3)}
			height={SYMBOL_SIZE * (0.95 + wisp.width * 0.7) * (0.6 + fade * 0.7)}
			tint={WISP_TINTS[Math.floor(wisp.warm * WISP_TINTS.length) % WISP_TINTS.length]}
			blendMode="add"
			alpha={0.5 * fade}
		/>
	{/each}

	<!-- the two rails themselves, held lit under the wisps -->
	{#each [LEFT + 4, RIGHT - 4] as railX (railX)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={railX}
			y={H * 0.5}
			width={SYMBOL_SIZE * 0.42}
			height={H}
			tint={0x8ce85a}
			blendMode="add"
			alpha={0.26 + 0.2 * pulse}
		/>
	{/each}

	{#each VENTS as vent (vent.y)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={vent.y}
			width={SYMBOL_SIZE * vent.width}
			height={SYMBOL_SIZE * vent.height}
			tint={0xb8ff5a}
			blendMode="add"
			alpha={vent.alpha * (0.7 + 0.5 * pulse)}
		/>
	{/each}
</BoardContainer>
