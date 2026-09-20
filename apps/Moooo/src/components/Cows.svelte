<script lang="ts" module>
	import type { BellTier } from '../game/types';

	export type CowEntry = { reel: number; row: number; tier: BellTier; mult: number };
	export type ExpandedEntry = { reel: number; tier: BellTier; mult: number };

	export type EmitterEventCows =
		| { type: 'cowsLand'; cows: CowEntry[] }
		| { type: 'cowsExpand'; reels: ExpandedEntry[]; totalMultiplier: number }
		| { type: 'cowsClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut, quadInOut } from 'svelte/easing';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BELL_COLORS, BOARD_DIMENSIONS } from '../game/constants';
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { featureScaled } from '../game/timeScale';

	const context = getContext();

	/**
	 * The expanded reels, drawn as a column of light over the reel with the bell
	 * value at its foot.
	 *
	 * This component draws the RESULT of the mechanic, not the cow itself — the
	 * cow is a board symbol (`W`), placed by the math before the reveal, so it
	 * lands with its reel like anything else. What is drawn here is what happens
	 * afterwards: the mouth opening, the reel filling, and the bell value
	 * arriving.
	 *
	 * Only expanded reels get a value. A cow that landed and kept its mouth shut
	 * is 42% of them — measured, not estimated — and it is deliberately left
	 * looking like an ordinary wild rather than being dimmed or crossed out. On a
	 * dead spin it is the only thing on the board doing anything, and marking it
	 * as a failure would turn the game's own headline symbol into a disappointment
	 * four times in ten.
	 *
	 * ── Timing, from the Densho teardown (2026-08-26) ────────────────────────
	 *
	 * Densho's expand — the mechanic Moooo shares — is a strictly serial three-
	 * beat chain in its `act()`:
	 *
	 *     ① the family symbol's own *_expand spine        2.00s
	 *     ② showExpandReel(col)  — the reel fills
	 *     ③ createMultiplier(m)  — value fades in over 0.5s, counts up,
	 *                              then pulses FOREVER
	 *
	 * Moooo's was ② then ③, 260ms and 200ms, both starting on the frame the
	 * board settled. The signature mechanic of the game went past in under half a
	 * second and shared that half second with the reels stopping.
	 *
	 * The mouth-open beat now exists as its own step, and the chain is pinned to
	 * the grid the rest of the game already uses: Densho's expand is exactly TWICE
	 * its symbol-win animation (2.00s against 1.00s), and Moooo's symbol win holds
	 * for WIN_HOLD_MS = 480ms, so mouth + fill = 960ms. That relationship is the
	 * transferable part, not Densho's absolute numbers — its symbols are full
	 * character spines and Moooo's are sprites, so two seconds of a swapped PNG
	 * would be two seconds of nothing moving.
	 */
	// Cows that LANDED this spin — including the 42% that never expand.
	//
	// Each gets a bell drawn over it, tinted by its tier. The symbol art ships
	// bell-less precisely so this can happen: nothing tints a board sprite, so a
	// bell baked into `w.png` showed the same colour for every tier, and the
	// expansion column beside it drew the correct one. The game contradicted
	// itself about the same cow on the same spin.
	//
	// This is also where the tension lives. The bell's COLOUR lands with the cow;
	// its VALUE waits for the expansion, because only 58% of cows expand and a
	// number shown then withdrawn reads as the game taking something back.
	let landed = $state<CowEntry[]>([]);
	let expanded = $state<ExpandedEntry[]>([]);
	let total = $state(0);

	// Beat lengths. MOUTH + FILL = 2 × WIN_HOLD_MS (SymbolWinAnim), which is the
	// ratio Densho holds between its expand and its symbol wins.
	const MOUTH_MS = 420;
	const FILL_MS = 540;
	// Densho's `createMultiplier(..., fade)`: 0.5s at normal speed, 0.2s in turbo.
	// featureScaled() already applies the gentler turbo curve, so one number here.
	const VALUE_MS = 500;
	const TOTAL_MS = 420;

	// Densho hands the player a way out that is not a hard cut: a tap during the
	// chain sets `skipped`, and every remaining expand plays its `superturbo`
	// variant — a shorter animation, not a truncated one. Same idea here, done
	// with the duration rather than a second asset: the beats that have not
	// started yet run at SKIP_SCALE speed. Nothing is cancelled mid-tween, so the
	// chain cannot be left half-drawn.
	const SKIP_SCALE = 3.2;
	let skipped = false;
	const beat = (ms: number) => featureScaled(ms) / (skipped ? SKIP_SCALE : 1);

	// 0 → 1 as the mouth opens: the cow punches up and a ring of light leaves it.
	const mouth = new Tween(0, { duration: featureScaled(MOUTH_MS), easing: backOut });
	// 0 → 1 as the reel fills from the cow's mouth, top and bottom at once.
	const fill = new Tween(0, { duration: featureScaled(FILL_MS), easing: backOut });
	// The bell value arrives after the fill, so the beats read in the order the
	// design brief sets out: mouth opens → reel fills → bell swings, value lands.
	const value = new Tween(0, { duration: featureScaled(VALUE_MS), easing: cubicOut });
	// Only drawn when more than one cow paid — see below.
	const sum = new Tween(0, { duration: featureScaled(TOTAL_MS), easing: backOut });

	// ── The permanent pulse ─────────────────────────────────────────────────
	//
	// Straight from Densho, and the single cheapest idea in its whole bundle: once
	// a multiplier has landed it never goes still. It breathes until the round
	// ends, and it breathes at one of TWO rates depending on how big it is —
	//
	//     val >= 10 : colour ×1.3, scale ×1.04, period 3.5s
	//     val <  10 : colour ×1.2, scale ×1.03, period 4.0s
	//
	// so a big multiplier is visibly more agitated than a small one and the player
	// feels the difference without reading the digits. Moooo needs that more than
	// Densho does, because Moooo's values ADD: a board can carry three of them at
	// once and the eye has to rank them at a glance.
	const PULSE_BIG_FROM = 10;
	let pulse = $state(0);
	let pulseRaf = 0;
	const startPulse = () => {
		cancelAnimationFrame(pulseRaf);
		const step = (now: number) => {
			pulse = now / 1000;
			pulseRaf = requestAnimationFrame(step);
		};
		pulseRaf = requestAnimationFrame(step);
	};
	const stopPulse = () => {
		cancelAnimationFrame(pulseRaf);
		pulse = 0;
	};
	onDestroy(() => {
		cancelAnimationFrame(pulseRaf);
		if (unlistenSkip) unlistenSkip();
	});

	// yoyo on easeInOutQuad, which is the easing Densho names for this tween.
	const breathe = (period: number) => {
		const phase = (pulse % period) / period;
		return quadInOut(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
	};

	let unlistenSkip: (() => void) | null = null;
	const listenForSkip = () => {
		if (unlistenSkip || typeof window === 'undefined') return;
		const onTap = () => {
			skipped = true;
		};
		window.addEventListener('pointerdown', onTap);
		unlistenSkip = () => {
			window.removeEventListener('pointerdown', onTap);
			unlistenSkip = null;
		};
	};

	const boardHeight = SYMBOL_SIZE * BOARD_DIMENSIONS.y;

	context.eventEmitter.subscribeOnMount({
		cowsLand: ({ cows }) => {
			landed = cows;
		},
		cowsExpand: async ({ reels, totalMultiplier }) => {
			expanded = reels;
			total = totalMultiplier;
			skipped = false;
			mouth.set(0, { duration: 0 });
			fill.set(0, { duration: 0 });
			value.set(0, { duration: 0 });
			sum.set(0, { duration: 0 });
			listenForSkip();
			// Serial, like Densho's `rc(false)` chain — each future completes before
			// the next starts. Re-reading the duration at each step is what lets a
			// mid-chain tap shorten the beats that have not run yet.
			await mouth.set(1, { duration: beat(MOUTH_MS), easing: backOut });
			await fill.set(1, { duration: beat(FILL_MS), easing: backOut });
			await value.set(1, { duration: beat(VALUE_MS), easing: cubicOut });
			startPulse();
			// The sum only appears when there is a sum to state. Moooo's cows ADD
			// (`apply_added_symbol_mult`), which is the rule a player is least likely
			// to guess and the one the reference game does not have, so it is spelled
			// out at the moment it applies — and only then, because on the common
			// single-cow spin a "total" the same size as the one value beside it says
			// nothing and reads as clutter.
			if (reels.length > 1) {
				await sum.set(1, { duration: beat(TOTAL_MS), easing: backOut });
				// Said, then got out of the way. It is drawn large and dead centre, so
				// leaving it up would put a 92pt glyph over the board for the whole of
				// the win-line volley that follows. The fade is deliberately NOT
				// awaited: the chain is finished once the total has been read, and the
				// dissolve happens underneath the AWARD_DELAY that comes next.
				setTimeout(() => sum.set(0, { duration: featureScaled(320) }), featureScaled(700));
			}
			if (unlistenSkip) unlistenSkip();
		},
		cowsClear: () => {
			landed = [];
			expanded = [];
			total = 0;
			skipped = false;
			if (unlistenSkip) unlistenSkip();
			stopPulse();
			mouth.set(0, { duration: 0 });
			fill.set(0, { duration: 0 });
			value.set(0, { duration: 0 });
			sum.set(0, { duration: 0 });
		},
	});

	const reelX = (reel: number) => SYMBOL_SIZE * (reel + 0.5);
	// `row` arrives already shifted for the padding row, so it indexes the client
	// board directly — row 1 is the top visible row.
	const rowY = (row: number) => SYMBOL_SIZE * (row - 0.5);
	const expandedReels = $derived(new Set(expanded.map((entry) => entry.reel)));

	// Densho draws its multipliers in a ROW at y = -0.5 — BELOW the reels, off the
	// grid, all of them on the same line. Moooo's sat in the middle of each reel,
	// on top of the symbols, at whatever height that reel's cow happened to be.
	//
	// The row is the better idea here for a reason specific to this game: the
	// values ADD, and values on one line can be added by eye while values
	// scattered down a board cannot.
	//
	// Where the row sits took three tries, all of them looked at on screen.
	//
	//   boardHeight - 44, no plaque : a 46pt glyph square on a bright bottom-row
	//                                 symbol. The pixels were there; nobody would
	//                                 read it.
	//   boardHeight + 26            : genuinely below the grid, on the housing's
	//                                 bottom rail — and lost. Dark plaque on dark
	//                                 timber, 26px above the bet bar's neon top
	//                                 edge, with the frame's own highlight running
	//                                 through it.
	//   boardHeight - 40, on a plaque : where it is now. On the board, where the
	//                                 eye already is, with enough opaque backing
	//                                 that the symbol underneath stops mattering.
	//
	// The lesson is the plaque, not the height: Densho can drop a bare number
	// below its reels because its board ends in empty world space, and Moooo's
	// ends in a timber rail 26px above a neon UI bar.
	const VALUE_ROW_Y = boardHeight - 40;
</script>

<!--
	Through BoardContainer, like every other board layer.

	Without it these draw against MainContainer's origin instead of the board's,
	so the reel columns land in the top-left corner of the canvas at the wrong
	scale. Board, Anticipations and WinLines all go through the same wrapper for
	the same reason: the layout's position, scale and pivot are applied once, at
	the single point every board layer shares.
-->
<BoardContainer>
	{#each landed as cow (`${cow.reel},${cow.row}`)}
		{@const opened = expandedReels.has(cow.reel)}
		<Container x={reelX(cow.reel)} y={rowY(cow.row)}>
			<!--
				The open mouth, swapped in over the landed cow once its reel expands.
				The mouth opening is the mechanic's tell — the moment the player is
				being paid — so it cannot be a static swap on a still cell. It gets its
				own beat now (MOUTH_MS), with a punch on the way up and a ring of light
				leaving the cow, and the fill does not start until it has finished.

				A cow whose reel did NOT cross a win line keeps its mouth shut and is
				left completely alone: no dimming, no grey-out. That is 42% of them, and
				on a dead spin it is the only thing on the board doing anything.
			-->
			{#if opened}
				{@const m = Math.min(1, mouth.current)}
				<!-- ring of light thrown off as the mouth opens -->
				{#if m > 0.01 && m < 0.999}
					<Graphics
						draw={(g) => {
							g.clear();
							g.circle(0, 0, SYMBOL_SIZE * (0.42 + 0.5 * m));
							g.stroke({
								width: 7 * (1 - m),
								color: BELL_COLORS[cow.tier],
								alpha: 0.75 * (1 - m),
							});
						}}
					/>
				{/if}
				<Sprite
					anchor={0.5}
					key="mooooWOpen"
					width={SYMBOL_SIZE * 1.08 * (1 + 0.14 * Math.sin(Math.PI * m))}
					height={SYMBOL_SIZE * 1.08 * (1 + 0.14 * Math.sin(Math.PI * m))}
				/>
			{/if}
			<!-- the bell, in the colour of the tier this cow is carrying -->
			<Sprite
				anchor={0.5}
				key="mooooBell"
				width={SYMBOL_SIZE * 1.08}
				height={SYMBOL_SIZE * 1.08}
				tint={BELL_COLORS[cow.tier]}
			/>
		</Container>
	{/each}

	{#each expanded as entry (entry.reel)}
		{@const color = BELL_COLORS[entry.tier]}
		{@const height = boardHeight * fill.current}
		{@const big = entry.mult >= PULSE_BIG_FROM}
		{@const b = pulse > 0 ? breathe(big ? 3.5 : 4.0) : 0}
		<Container x={reelX(entry.reel)} y={boardHeight / 2}>
			<!--
				The reel fills from the middle outward rather than from the top down,
				because the cow's mouth is the source of the moo and the mouth is
				somewhere in the middle of the reel. Filling top-down would read as a
				curtain, which is a different mechanic.
			-->
			<Graphics
				draw={(g) => {
					g.clear();
					if (height <= 0) return;
					g.roundRect(-SYMBOL_SIZE * 0.46, -height / 2, SYMBOL_SIZE * 0.92, height, 10);
					g.fill({ color, alpha: 0.16 });
					g.roundRect(-SYMBOL_SIZE * 0.46, -height / 2, SYMBOL_SIZE * 0.92, height, 10);
					g.stroke({ width: 3, color, alpha: 0.85 });
				}}
			/>
		</Container>
		{#if value.current > 0.01}
			<!--
				The value, on the row. Scale and alpha carry the entrance; `b` is the
				permanent breathing that never stops until cowsClear — Densho's two
				rates, the faster and stronger one reserved for 10x and up.
			-->
			<Container x={reelX(entry.reel)} y={VALUE_ROW_Y}>
				<!-- plaque, so the value reads against the timber rail -->
				<Graphics
					draw={(g) => {
						g.clear();
						const w = SYMBOL_SIZE * 0.82 * value.current;
						if (w <= 1) return;
						g.roundRect(-w / 2, -23, w, 46, 13);
						g.fill({ color: 0x140a24, alpha: 0.94 * value.current });
						g.roundRect(-w / 2, -23, w, 46, 13);
						g.stroke({ width: 2, color, alpha: (0.55 + 0.45 * b) * value.current });
					}}
				/>
				<Text
					anchor={0.5}
					scale={(0.7 + 0.3 * value.current) * (1 + (big ? 0.04 : 0.03) * b)}
					alpha={value.current}
					text={`${entry.mult}x`}
					style={{
						fontFamily: DISPLAY_FONT,
						fontWeight: DISPLAY_FONT_WEIGHT,
						fontSize: 46,
						fill: color,
						stroke: { color: 0x2a1440, width: 6 },
					}}
				/>
				<!-- the colour half of the pulse: an additive copy over the glyph -->
				{#if b > 0}
					<Text
						anchor={0.5}
						scale={(0.7 + 0.3 * value.current) * (1 + (big ? 0.04 : 0.03) * b)}
						alpha={value.current * (big ? 0.3 : 0.2) * b}
						blendMode="add"
						text={`${entry.mult}x`}
						style={{
							fontFamily: DISPLAY_FONT,
							fontWeight: DISPLAY_FONT_WEIGHT,
							fontSize: 46,
							fill: color,
						}}
					/>
				{/if}
			</Container>
		{/if}
	{/each}

	<!--
		"…and they add up to this." Only when more than one cow paid.
	-->
	{#if sum.current > 0.01}
		<Container x={(SYMBOL_SIZE * BOARD_DIMENSIONS.x) / 2} y={boardHeight * 0.5}>
			<Text
				anchor={0.5}
				scale={0.6 + 0.4 * sum.current}
				alpha={sum.current}
				text={`${total}x`}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					fontSize: 92,
					fill: 0xffe9a8,
					stroke: { color: 0x2a1440, width: 9 },
				}}
			/>
		</Container>
	{/if}
</BoardContainer>
