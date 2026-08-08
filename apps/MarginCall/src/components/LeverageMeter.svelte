<script lang="ts" module>
	import type { LeverageHit } from '../game/types';

	export type EmitterEventLeverageMeter =
		| { type: 'leverageMeterShow' }
		| { type: 'leverageMeterHide' }
		// awaited: resolves once the landed values have flown into the meter and
		// the number has ticked up, so the win it applies to is not presented
		// before the player has seen the multiplier it was paid at
		| { type: 'leverageMeterCollect'; hits: LeverageHit[]; leverage: number }
		// resumed round: snap straight to the value without the fly-in
		| { type: 'leverageMeterRestore'; leverage: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE, isBigLeverage, LEVERAGE_FILL, LEVERAGE_HOT_FILL } from '../game/constants';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// The meter sits directly above the board, inside BoardContainer, so it
	// inherits the board's scale and pivot and needs no layout maths of its own.
	const METER_Y = -SYMBOL_SIZE * 0.62;
	const CHIP_FLIGHT_MS = 420;
	const TICK_MS = 260;

	let show = $state(false);
	// The number actually drawn. Tweened rather than assigned so a +10 reads as a
	// climb; the book's value is the target, never the displayed one.
	const displayed = new Tween(1, { duration: TICK_MS, easing: cubicOut });

	type Chip = {
		id: number;
		value: number;
		x: Tween<number>;
		y: Tween<number>;
		alpha: Tween<number>;
	};
	let chips = $state<Chip[]>([]);
	let nextChipId = 0;

	const meterX = $derived((SYMBOL_SIZE * context.stateGame.board.length) / 2);

	const flyChip = async (hit: LeverageHit) => {
		const chip: Chip = {
			id: nextChipId++,
			value: hit.value,
			x: new Tween(getSymbolX(hit.reel), { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
			y: new Tween(getSymbolY(hit.row), { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
			alpha: new Tween(1, { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
		};
		// Re-fetch from the array before mutating: the object literal above is the
		// raw one, and writing to it would bypass the $state proxy's set trap.
		chips = [...chips, chip];
		const entry = chips.find((c) => c.id === chip.id);
		if (!entry) return;

		await Promise.all([
			entry.x.set(meterX),
			entry.y.set(METER_Y),
			entry.alpha.set(0.15, { duration: CHIP_FLIGHT_MS, easing: backOut }),
		]);
		chips = chips.filter((c) => c.id !== entry.id);
	};

	context.eventEmitter.subscribeOnMount({
		leverageMeterShow: () => {
			show = true;
			displayed.set(1, { duration: 0 });
		},
		leverageMeterHide: () => {
			show = false;
			chips = [];
			displayed.set(1, { duration: 0 });
		},
		leverageMeterRestore: ({ leverage }) => {
			show = true;
			displayed.set(leverage, { duration: 0 });
		},
		leverageMeterCollect: async ({ hits, leverage }) => {
			show = true;
			await Promise.all(hits.map(flyChip));
			await displayed.set(leverage);
		},
	});
</script>

{#if show}
	<Container>
		<GoldText
			x={meterX}
			y={METER_Y}
			anchor={0.5}
			text={`LEVERAGE ${Math.round(displayed.current)}×`}
			fontSize={34}
			letterSpacing={2}
			maxWidth={SYMBOL_SIZE * context.stateGame.board.length * 0.9}
			fill={isBigLeverage(Math.round(displayed.current)) ? LEVERAGE_HOT_FILL : LEVERAGE_FILL}
		/>

		{#each chips as chip (chip.id)}
			<GoldText
				x={chip.x.current}
				y={chip.y.current}
				anchor={0.5}
				alpha={chip.alpha.current}
				text={`+${chip.value}`}
				fontSize={30}
				fill={isBigLeverage(chip.value) ? LEVERAGE_HOT_FILL : LEVERAGE_FILL}
			/>
		{/each}
	</Container>
{/if}
