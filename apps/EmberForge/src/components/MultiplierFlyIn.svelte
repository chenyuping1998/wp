<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		FLY_IN_MS,
		FLY_IN_STAGGER_MS,
		FLY_IN_MAX,
		gridTierFor,
	} from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { getSymbolX } from '../game/utils';

	/**
	 * Every heated cell under a big cluster tears its multiplier loose and throws
	 * it at the cluster's centre.
	 *
	 * This is the one effect that ANSWERS a question rather than decorating. When a
	 * cluster pays 40x the player can see the amount, but not why — the heat that
	 * produced it is spread over cells that are about to be destroyed. Flying the
	 * numbers in and stepping the total up as each one lands shows the sum being
	 * assembled: 8x, then 15x, then 27x, then the payout.
	 *
	 * Only fires above FLY_IN_FROM (3.9% of clusters). Below that the arithmetic is
	 * small enough to read off the badges, and spending half a second on it every
	 * other cluster would undo the pacing work.
	 */
	type Props = {
		positions: { reel: number; row: number }[];
		overlay: { reel: number; row: number };
		/** total heat under the cluster — the number being assembled */
		clusterMult: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;

	/**
	 * One flyer per heated cell, biggest first, with the tail merged so a cluster
	 * covering twenty cells does not throw twenty numbers across the board.
	 */
	const flyers = $derived.by(() => {
		const heated = props.positions
			.map((pos) => ({ ...pos, mult: context.stateGameDerived.gridMultiplierAt(pos) }))
			.filter((cell) => cell.mult > 0)
			.sort((a, b) => b.mult - a.mult);

		if (heated.length <= FLY_IN_MAX) return heated.map((cell) => ({ ...cell, merged: 0 }));

		const shown = heated.slice(0, FLY_IN_MAX - 1);
		const rest = heated.slice(FLY_IN_MAX - 1);
		return [
			...shown.map((cell) => ({ ...cell, merged: 0 })),
			{
				reel: rest[0].reel,
				row: rest[0].row,
				mult: rest.reduce((sum, cell) => sum + cell.mult, 0),
				merged: rest.length,
			},
		];
	});

	const target = $derived({
		x: getSymbolX(props.overlay.reel),
		y: slotY(props.overlay.row),
	});

	const total = $derived(flyers.reduce((sum, f) => sum + f.mult, 0) || 1);

	let t = $state(0);
	const duration = $derived(FLY_IN_MS + FLY_IN_STAGGER_MS * Math.max(0, flyers.length - 1) + 160);

	onMount(() => {
		let raf = 0;
		let start = 0;
		let done = false;
		const tick = (now: number) => {
			if (!start) start = now;
			t = now - start;
			if (t >= duration) {
				if (!done) {
					done = true;
					props.oncomplete?.();
				}
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeInBack = (v: number) => v * v * (2.2 * v - 1.2);

	/** How far each flyer has travelled, 0 before its turn, 1 once landed. */
	const progressOf = (index: number) =>
		Math.max(0, Math.min(1, (t - index * FLY_IN_STAGGER_MS) / FLY_IN_MS));

	// The running multiplier, stepped up as each flyer lands. This is what makes
	// the effect read as assembly rather than as decoration flying about.
	const landed = $derived(
		flyers.reduce((sum, flyer, index) => (progressOf(index) >= 1 ? sum + flyer.mult : sum), 0),
	);
	// Pops on each arrival, then settles.
	const bump = $derived.by(() => {
		let closest = 1;
		flyers.forEach((_, index) => {
			const since = t - (index * FLY_IN_STAGGER_MS + FLY_IN_MS);
			if (since >= 0 && since < 160) closest = Math.min(closest, since / 160);
		});
		return 1 + (1 - closest) * 0.35;
	});
</script>

<Container>
	{#each flyers as flyer, index (index)}
		{@const p = progressOf(index)}
		{#if p > 0 && p < 1}
			{@const from = { x: getSymbolX(flyer.reel), y: slotY(flyer.row) }}
			{@const e = easeInBack(p)}
			{@const tier = gridTierFor(flyer.mult)}
			<Container
				x={from.x + (target.x - from.x) * e}
				y={from.y + (target.y - from.y) * e - Math.sin(p * Math.PI) * SYMBOL_SIZE * 0.5}
				scale={1 + (1 - p) * 0.35}
			>
				<Sprite
					key="fxGlow"
					anchor={0.5}
					width={SYMBOL_SIZE * 0.8}
					height={SYMBOL_SIZE * 0.8}
					tint={tier?.glow ?? 0xffb04a}
					blendMode="add"
					alpha={0.75 * (1 - p * 0.3)}
				/>
				<Text
					text={flyer.merged > 0 ? `+${flyer.mult}x` : `${flyer.mult}x`}
					anchor={{ x: 0.5, y: 0.5 }}
					style={{
						fontFamily: GAME_FONT,
						fontWeight: GAME_FONT_WEIGHT,
						fontSize: SYMBOL_SIZE * 0.34,
						fill: 0xfff3d6,
						stroke: { color: 0x3a1006, width: 4 },
					}}
				/>
			</Container>
		{/if}
	{/each}

	<!-- the total being assembled, sitting where the payout will be read -->
	{#if landed > 0}
		<Container x={target.x} y={target.y - SYMBOL_SIZE * 0.62} scale={bump}>
			<Text
				text={`${landed}x`}
				anchor={{ x: 0.5, y: 0.5 }}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: SYMBOL_SIZE * (landed >= total ? 0.5 : 0.42),
					fill: 0xfff0c8,
					stroke: { color: 0x3a1006, width: 5 },
				}}
			/>
		</Container>
	{/if}
</Container>
