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

	/**
	 * The teasing column, on fire.
	 *
	 * Drawn here rather than through the old `anticipation` spine: that asset is
	 * template art from a mining game (rocks, dust, sparks) whose artwork sat
	 * off-centre and was only ~1.6 cells tall, so it never framed the reel.
	 *
	 * This was a set of nested amber strokes — legible, but a vector outline in a
	 * game whose entire language is heat. The column now burns: tongues climb both
	 * rails, the rim glows rather than being stroked on, and embers lift off the
	 * top. A stroke can only be made brighter by raising its alpha, which flattens
	 * it; fire gets brighter by adding light, which is the same trick the win
	 * effects and the heat grid already use.
	 */
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);
	const RIGHT = $derived(x + SYMBOL_SIZE / 2);
	const H = BOARD_SIZES.height;

	// Seconds since the tease started. The flames travel, so this has to be a
	// running clock — the old `pulse` sine could only make the frame breathe in
	// place, which is why raising its brightness never made it read as fire.
	let t = $state(0);
	let finished = $state(false);

	// Per-reel phase offset: when several reels tease at once a shared phase makes
	// them strobe as one block instead of burning independently.
	const phase = $derived(props.reel.reelIndex * 0.9);
	const pulse = $derived(0.5 + 0.5 * Math.sin(t * 6.5 + phase));

	// Tongues climbing each rail. Deterministic per index so a reel looks the same
	// every time it teases, and the two rails are offset so they never rise level
	// with each other.
	const TONGUES = 7;
	const tongues = $derived.by(() =>
		[0, 1].flatMap((side) =>
			Array.from({ length: TONGUES }, (_, i) => ({
				key: `${side}-${i}`,
				side,
				speed: 0.55 + Math.abs(Math.sin(i * 78.233 + side * 3.1)) * 0.45,
				offset: (i + 0.5) / TONGUES + side * 0.5 / TONGUES,
				width: 0.5 + Math.abs(Math.sin(i * 43.11 + side)) * 0.5,
				warm: Math.abs(Math.sin(i * 5.31 + side * 2.7)),
			})),
		),
	);

	const FLAME_TINTS = [0xff5a0f, 0xff8a2a, 0xffb04a, 0xffd75e];

	// Furnace mouth at the foot of the column, heat spilling off the top. Hoisted
	// out of the template so the array is not rebuilt on every frame of the clock.
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
		// Stop the moment the reel lands, so the tease hands over to the result
		// instead of burning on underneath it.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});

	/** Where one tongue is on its climb, 0 at the floor to 1 past the top. */
	const climbOf = (tongue: { speed: number; offset: number }) =>
		(t * tongue.speed + tongue.offset) % 1;
</script>

<BoardContainer>
	<!-- the column glows from within; brightest at the rails -->
	<Graphics
		draw={(g) => {
			g.clear();

			// heat bed over the whole teasing column
			g.beginFill(0xff7a14, 0.16 + 0.14 * pulse);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, H - 6, 12);
			g.endFill();

			// one hot rim, not three nested strokes — the fire carries the edge now
			g.lineStyle(2.5, 0xffe9a0, 0.55 + 0.4 * pulse);
			g.drawRoundedRect(LEFT + 4, 4, SYMBOL_SIZE - 8, H - 8, 12);

			// cell ticks so the column still reads as seven slots, not a tube
			g.lineStyle(1.5, 0xffc46a, 0.14 + 0.16 * pulse);
			for (let row = 1; row < H / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 16, y);
				g.lineTo(RIGHT - 16, y);
			}
		}}
	/>

	<!-- tongues climbing both rails -->
	{#each tongues as tongue (tongue.key)}
		{@const climb = climbOf(tongue)}
		{@const rail = tongue.side === 0 ? LEFT + 5 : RIGHT - 5}
		{@const fade = Math.sin(climb * Math.PI) ** 0.7}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={rail + Math.sin(t * 5 + tongue.offset * 9) * 3}
			y={H - climb * (H + SYMBOL_SIZE * 0.6)}
			width={SYMBOL_SIZE * (0.34 + tongue.width * 0.3)}
			height={SYMBOL_SIZE * (0.95 + tongue.width * 0.7) * (0.6 + fade * 0.7)}
			tint={FLAME_TINTS[Math.floor(tongue.warm * FLAME_TINTS.length) % FLAME_TINTS.length]}
			blendMode="add"
			alpha={0.5 * fade}
		/>
	{/each}

	<!-- the two rails themselves, held hot under the tongues -->
	{#each [LEFT + 4, RIGHT - 4] as railX (railX)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={railX}
			y={H * 0.5}
			width={SYMBOL_SIZE * 0.42}
			height={H}
			tint={0xff8a2a}
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
			tint={0xffb04a}
			blendMode="add"
			alpha={vent.alpha * (0.7 + 0.5 * pulse)}
		/>
	{/each}
</BoardContainer>
