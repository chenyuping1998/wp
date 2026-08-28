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
	import { Container, Graphics } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE, isBigLeverage, LEVERAGE_FILL, LEVERAGE_HOT_FILL } from '../game/constants';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// This draws in MAIN box coordinates, not board coordinates.
	//
	// It used to live inside BoardContainer, which was simpler - board space is
	// where the symbols are - but it also meant the meter had no way to know where
	// the top of the screen was. The feature board is tall and sits high, and the
	// meter, pinned a fixed distance above it, went off the canvas: the player saw
	// "…VERAGE 1X" with the top sliced off. Working in main space lets it be
	// clamped.
	const GAP_ABOVE_BOARD = 44;
	const MIN_Y = 34;

	// The whole point of this presentation is that the player SEES where the
	// multiplier came from, so it is paced to be followed rather than to be got
	// out of the way. 420ms was a flick: on a board that dropped three LEVERAGE
	// symbols, all three chips left at the same instant, arrived at the same
	// instant, and the meter went from 1x to 18x in one step with nothing to
	// watch. Now each chip is a separate beat.
	const CHIP_FLIGHT_MS = 820;
	/** delay between one chip leaving and the next */
	const CHIP_STAGGER_MS = 260;
	const TICK_MS = 300;
	/** how long the meter stays swollen after a chip lands */
	const POP_MS = 260;

	const layout = () => context.stateGameDerived.boardLayout();

	/** board-space point -> main-box point */
	const toMain = (bx: number, by: number) => {
		const l = layout();
		return {
			x: l.x + (bx - l.width / 2) * l.scale,
			y: l.y + (by - l.height / 2) * l.scale,
		};
	};

	const meterX = $derived(layout().x);
	const meterY = $derived(
		Math.max(MIN_Y, layout().y - (layout().height * layout().scale) / 2 - GAP_ABOVE_BOARD),
	);
	// The meter reads at a constant size regardless of how the board is scaled.
	const fontSize = $derived(Math.max(26, Math.min(40, SYMBOL_SIZE * layout().scale * 0.34)));

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

	// Meter emphasis on arrival: a scale kick and a ring that flares out of it.
	// Both run off the same 0..1 clock so they cannot drift apart.
	const pop = new Tween(0, { duration: POP_MS, easing: cubicOut });
	const meterScale = $derived(1 + 0.34 * Math.sin(pop.current * Math.PI));

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	const flyChip = async (hit: LeverageHit, index: number) => {
		// Staggered, so three chips read as three arrivals and three ticks up
		// rather than as one jump.
		if (index > 0) await wait(index * CHIP_STAGGER_MS);
		const from = toMain(getSymbolX(hit.reel), getSymbolY(hit.row));
		const chip: Chip = {
			id: nextChipId++,
			value: hit.value,
			x: new Tween(from.x, { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
			y: new Tween(from.y, { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
			alpha: new Tween(1, { duration: CHIP_FLIGHT_MS, easing: cubicOut }),
		};
		// Re-fetch from the array before mutating: the object literal above is the
		// raw one, and writing to it would bypass the $state proxy's set trap.
		chips = [...chips, chip];
		const entry = chips.find((c) => c.id === chip.id);
		if (!entry) return;

		await Promise.all([
			entry.x.set(meterX),
			entry.y.set(meterY),
			entry.alpha.set(0.15, { duration: CHIP_FLIGHT_MS, easing: backOut }),
		]);
		chips = chips.filter((c) => c.id !== entry.id);

		// Landed. Sound and kick together - this is the beat the player is meant to
		// register, and it is the one moment in the sequence with a hard onset.
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		// NEITHER of these is awaited, and that is load-bearing.
		//
		// Svelte's Tween abandons the promise from an in-flight `set` when a new
		// `set` retargets it - that promise never resolves. Two chips landing
		// within a frame of each other would have one of them awaiting a promise
		// the other had just orphaned, and since this whole sequence is awaited by
		// the book handler, the round would stop dead. Fire and forget: the worst
		// case is one dropped kick, not a hung game.
		pop.set(0, { duration: 0 });
		pop.set(1);
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
			// The meter climbs WITH the chips, not after all of them: each arrival
			// adds its own value, so the number the player watches rise is the same
			// number the chips are feeding. Awaited as a whole, so the win this
			// applies to is still not presented until the meter has finished.
			//
			// EXACTLY ONE `displayed.set` is awaited, and it is the last one.
			//
			// The per-arrival sets are deliberately not: Svelte's Tween orphans the
			// promise of an in-flight `set` when a later `set` retargets it, and
			// that promise never resolves. Awaiting each arrival's set meant a
			// second LEVERAGE symbol landing mid-tick left the first chip awaiting
			// a dead promise - `Promise.all` never settled, `leverageUpdate` never
			// returned, and the round stopped on the spot with the meter showing
			// the right number and nothing else ever happening. Two symbols on one
			// free spin is common, so this hung most feature rounds.
			let running = Math.round(displayed.current);
			await Promise.all(
				hits.map((hit, index) =>
					flyChip(hit, index).then(() => {
						running += hit.value;
						displayed.set(running);
					}),
				),
			);
			// Authoritative value from the book, in case rounding drifted. Safe to
			// await: every arrival has already landed, so nothing retargets it.
			await displayed.set(leverage);
		},
	});
</script>

{#if show}
	<MainContainer>
		<Container>
			<!--
				Flare behind the readout, expanding and fading as the kick decays. It
				is what makes the arrival land as an event: the number growing on its
				own is easy to miss when the eye is still on the board.
			-->
			<Graphics
				draw={(g) => {
					g.clear();
					if (pop.current <= 0 || pop.current >= 1) return;
					const t = pop.current;
					const r = fontSize * (1.1 + t * 2.6);
					g.circle(meterX, meterY, r);
					g.stroke({ width: fontSize * 0.18 * (1 - t), color: LEVERAGE_FILL[1], alpha: 0.8 * (1 - t) });
					g.circle(meterX, meterY, fontSize * 1.5);
					g.fill({ color: LEVERAGE_FILL[1], alpha: 0.22 * (1 - t) });
				}}
			/>

			<!--
				Scaled about its own centre, so the kick grows the readout in place
				rather than shifting it right. anchor 0.5 puts the text's centre at
				the origin; the container is moved to the meter position and the text
				drawn at 0,0 inside it.
			-->
			<Container x={meterX} y={meterY} scale={meterScale}>
				<GoldText
					x={0}
					y={0}
					anchor={0.5}
					text={`LEVERAGE ${Math.round(displayed.current)}×`}
					fontSize={fontSize}
					letterSpacing={2}
					maxWidth={layout().width * layout().scale * 0.9}
					fill={isBigLeverage(Math.round(displayed.current)) ? LEVERAGE_HOT_FILL : LEVERAGE_FILL}
				/>
			</Container>

			{#each chips as chip (chip.id)}
				<GoldText
					x={chip.x.current}
					y={chip.y.current}
					anchor={0.5}
					alpha={chip.alpha.current}
					text={`+${chip.value}`}
					fontSize={fontSize * 0.9}
					fill={isBigLeverage(chip.value) ? LEVERAGE_HOT_FILL : LEVERAGE_FILL}
				/>
			{/each}
		</Container>
	</MainContainer>
{/if}
