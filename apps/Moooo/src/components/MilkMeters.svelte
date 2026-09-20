<script lang="ts" module>
	export type EmitterEventMilkMeter =
		| { type: 'milkMeterInit'; levels: number[]; maxLevel: number; superMode: boolean }
		| {
				type: 'milkMeterUpdate';
				changed: { reel: number; level: number }[];
				levels: number[];
				maxLevel: number;
		  }
		| { type: 'milkMeterHide' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Container, Graphics, Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';

	import { getContext } from '../game/context';
	import { waitForTimeout } from 'utils-shared/wait';

	import {
		SYMBOL_SIZE,
		BELL_COLORS,
		BOARD_DIMENSIONS,
		METER_MAX_LEVEL,
		METER_PIP_SIZE,
		METER_HEIGHT,
	} from '../game/constants';
	import { BELL_TIERS, type BellTier } from '../game/types';
	import { featureScaled } from '../game/timeScale';

	const context = getContext();

	/**
	 * One Milk Meter above each reel.
	 *
	 * This is the mechanic. Everything else in Moooo is decoration on top of it:
	 * the brief's instruction was to build the tracker first and the game around
	 * it, because a state the player can watch build across a round is exactly
	 * what Hot Miami's review said was missing ("shallow gameplay with limited
	 * depth").
	 *
	 * ── The one thing to get right ────────────────────────────────────────────
	 *
	 * The meter is coloured by the tier it GUARANTEES, not by how full it is.
	 *
	 * A progress bar says "you are 2/3 of the way to something". That is the
	 * wrong sentence: the meter does not measure progress toward a prize, it
	 * raises a floor. A reel at level 2 can no longer roll a Pasture bell — ever
	 * again, for the rest of the feature. Painting the pips in the colour of the
	 * bell they promise is the only way a player learns that without reading the
	 * rules panel, and it is why the pips go brass → silver → gold rather than
	 * all being the same colour and merely lighting up.
	 *
	 * ── Why it has to survive a missed event ─────────────────────────────────
	 *
	 * `levels` is always taken whole from the book event, never accumulated from
	 * `changed`. `changed` decides what to ANIMATE; `levels` decides what to
	 * DRAW. If the client added deltas itself, one dropped event would desync the
	 * meters from the maths for the rest of the round — and these meters are what
	 * the player is using to judge what each reel can still pay, so a desync is
	 * the game misreporting its own odds.
	 */
	let levels = $state<number[]>([]);
	let maxLevel = $state(METER_MAX_LEVEL);
	let visible = $state(false);

	// One pop per reel, so two reels upgrading on the same spin do not animate as
	// a single event.
	const pops = Array.from(
		{ length: 5 },
		() => new Tween(0, { duration: featureScaled(320), easing: backOut }),
	);

	// ── The flight, from Densho's `upgradeBucket` (2026-08-26) ───────────────
	//
	// Densho does not simply light a pip when its tracker advances. It plays the
	// upgrade animation on the SYMBOL, then flies a token from that symbol's world
	// position to the bar, and — the part worth stealing — starts growing the bar
	// at `after(0.8 * d)`, i.e. when the token is 80% of the way there rather than
	// when it arrives:
	//
	//     presentSpecial("upgrade")  ->  after(0.4)
	//       -> preIncrementVisual(worldPos, d)     d = 0.5s
	//         -> after(0.8 * d) -> incrementBar(0.6s)
	//
	// The overlap is what makes it read as one motion instead of two queued ones.
	// Moooo's meter just popped, with nothing connecting the churn on the board to
	// the meter above the reel, so the causal link — THIS symbol raised THAT
	// meter — was never drawn.
	//
	// The churn's row is not in the book event (`changed` carries only reel and
	// level), and adding it would mean regenerating every published book for a
	// presentation detail. It does not need to be: the churn is symbol `M` on the
	// board the client has already been handed, so the row is found by looking.
	const FLY_MS = 500;
	const FLY_OVERLAP = 0.8;
	type Flight = { reel: number; fromY: number; tier: BellTier; t: Tween<number> };
	let flights = $state<Flight[]>([]);

	// Row of the Milk Churn on this reel, in board coordinates (row 1 is the top
	// visible row). Falls back to the middle of the reel if it cannot be found —
	// a flight from a plausible place beats no flight and beats a crash.
	const churnRowOnReel = (reel: number) => {
		const rows = context.stateGameDerived.boardRaw()?.[reel] ?? [];
		const index = rows.findIndex((symbol) => symbol?.name === 'M');
		if (index < 1 || index > BOARD_DIMENSIONS.y) return (BOARD_DIMENSIONS.y + 1) / 2;
		return index;
	};

	context.eventEmitter.subscribeOnMount({
		milkMeterInit: ({ levels: next, maxLevel: max }) => {
			levels = [...next];
			maxLevel = max;
			visible = true;
			flights = [];
			for (const pop of pops) pop.set(0, { duration: 0 });
		},
		milkMeterUpdate: async ({ changed, levels: next, maxLevel: max }) => {
			maxLevel = max;
			visible = true;
			await Promise.all(
				changed.map(async (change) => {
					const pop = pops[change.reel];
					if (!pop) return;
					const t = new Tween(0, { duration: featureScaled(FLY_MS), easing: cubicOut });
					const flight: Flight = {
						reel: change.reel,
						fromY: SYMBOL_SIZE * (churnRowOnReel(change.reel) - 0.5),
						// The tier this churn is DELIVERING, captured now: `levels` flips
						// to the new state partway through the flight, so reading it from
						// there would change the token's colour in mid-air.
						tier: tierOfLevel(change.level),
						t,
					};
					flights = [...flights, flight];
					const travel = t.set(1);
					// The bar starts moving before the token lands. `levels` is applied
					// here rather than up front for the same reason: the pip must appear
					// as the token reaches it, not the instant the event arrives.
					await waitForTimeout(featureScaled(FLY_MS) * FLY_OVERLAP);
					levels = [...next];
					pop.set(0, { duration: 0 });
					await pop.set(1);
					await travel;
					flights = flights.filter((entry) => entry !== flight);
					pop.set(0, { duration: featureScaled(220) });
				}),
			);
			// Whatever the animation did, the drawn state is the book's state — see
			// the note at the top of this file about never accumulating deltas.
			levels = [...next];
		},
		milkMeterHide: () => {
			visible = false;
			levels = [];
			flights = [];
		},
	});

	// A reel's level indexes the tier ladder: level 1 guarantees at least
	// Pasture, level 3 guarantees Champion. Kept as an index rather than a
	// lookup table so it cannot drift out of step with BELL_TIERS.
	const tierOfLevel = (level: number) =>
		BELL_TIERS[Math.min(Math.max(level, 1), BELL_TIERS.length) - 1];

	const reelX = (reel: number) => SYMBOL_SIZE * (reel + 0.5);
</script>

<!--
	Through BoardContainer, like every other board layer — see Cows.svelte. The
	meters sit ABOVE the top row (negative y), so without the wrapper they are not
	merely misplaced, they are off the top of the canvas entirely and draw nothing
	at all.
-->
<BoardContainer>
	<!--
		The token in flight: the churn leaving the board and arriving at the meter.
		It shrinks and fades on the way up, and the pip it is heading for has
		already started growing by the time it gets there (FLY_OVERLAP), so the two
		motions bite into each other rather than queueing.
	-->
	{#each flights as flight (flight.reel)}
		{@const p = flight.t.current}
		{@const y = flight.fromY + (-METER_HEIGHT - flight.fromY) * p}
		<Container x={reelX(flight.reel)} {y}>
			<Sprite
				anchor={0.5}
				key="mooooFxGlow"
				width={SYMBOL_SIZE * (1.05 - 0.5 * p)}
				height={SYMBOL_SIZE * (1.05 - 0.5 * p)}
				alpha={0.55 * (1 - p * 0.7)}
				blendMode="add"
				tint={BELL_COLORS[flight.tier]}
			/>
			<Sprite
				anchor={0.5}
				key="mooooM"
				width={SYMBOL_SIZE * (0.9 - 0.55 * p)}
				height={SYMBOL_SIZE * (0.9 - 0.55 * p)}
				alpha={1 - 0.55 * p}
			/>
		</Container>
	{/each}
	{#if visible && levels.length > 0}
		{#each levels as level, reel (reel)}
			{@const color = BELL_COLORS[tierOfLevel(level)]}
			{@const pop = pops[reel]?.current ?? 0}
			<Container x={reelX(reel)} y={-METER_HEIGHT}>
				<!-- housing, so the pips read against whatever background is showing -->
				<Graphics
					draw={(g) => {
						g.clear();
						const width = METER_PIP_SIZE * maxLevel * 1.9;
						g.roundRect(-width / 2, -13, width, 26, 13);
						g.fill({ color: 0x1b0f2e, alpha: 0.72 });
						g.roundRect(-width / 2, -13, width, 26, 13);
						g.stroke({ width: 2, color, alpha: 0.5 + 0.5 * pop });
					}}
				/>
				<!--
					Pips, filled up to the reel's level and coloured by the tier that
					level guarantees. An unfilled pip is drawn as an outline in the same
					colour it WILL become, so the player can see what the next churn is
					worth before it lands.
				-->
				<Graphics
					draw={(g) => {
						g.clear();
						for (let index = 0; index < maxLevel; index++) {
							const filled = index < level;
							const x = (index - (maxLevel - 1) / 2) * METER_PIP_SIZE * 1.9;
							const radius = METER_PIP_SIZE / 2 + (filled && index === level - 1 ? 3 * pop : 0);
							const pipColor = BELL_COLORS[tierOfLevel(index + 1)];
							g.circle(x, 0, radius);
							if (filled) {
								g.fill({ color: pipColor, alpha: 0.95 });
							} else {
								g.fill({ color: pipColor, alpha: 0.1 });
								g.circle(x, 0, radius);
								g.stroke({ width: 1.5, color: pipColor, alpha: 0.45 });
							}
						}
					}}
				/>
			</Container>
		{/each}
	{/if}
</BoardContainer>
