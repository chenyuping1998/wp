<script lang="ts" module>
	export type EmitterEventStickyPrizes =
		| { type: 'stickyPrizesNew'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesCelebrate'; wins: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesRestore'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesClear' };
</script>

<script lang="ts">
	/**
	 * The superspin coins held on the board, drawn through the P coin's own mesh
	 * (meshWin/pCoin.ts, SymbolMeshWin's landing), not as a picture.
	 *
	 * They used to be a sprite scaled 0 -> 1 with a back-out when they stuck and
	 * 1 -> 1.35 -> 1 when they paid: the stock "pop" every template ships, on the
	 * one mode where the coins are the whole show. Now they behave like coins:
	 *
	 *   stick      the coin drops the last few px into its cell and RINGS DOWN
	 *              (the tilt-and-settle P does on a reel), harder for a bigger
	 *              prize, with its ting of light and the glint across its face
	 *   idle       while they wait, now and then one held coin gives a small
	 *              ring and catches the light — never two at once
	 *   celebrate  the paying coins are tossed: up off the cell, down, and they
	 *              ring as they land, one after another along the board
	 *
	 * The value rides the coin's face as it rings (coinFace, the same function
	 * the mesh reads), so the number is on the coin, not stuck over it.
	 */
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { onDestroy, onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_CELL_COLOR,
		isBigPrize,
		BIG_PRIZE_FROM,
		BIG_PRIZE_FILL,
		BIG_PRIZE_STROKE,
	} from '../game/constants';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { RawSymbol } from '../game/types';
	import { coinFace } from '../game/meshWin/pCoin';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';

	type PrizeEntry = {
		reel: number;
		row: number;
		prize: number;
		/** px above its cell: the drop in, the toss */
		lift: Tween<number>;
		landedAt: number;
		/** bumped to ring the coin again (SymbolMeshWin replay) */
		ring: number;
		ringAt: number;
		impact: number;
	};

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE (same as ExpandingWilds)
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const keyOf = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;
	const coinInfo = getSymbolInfo({ rawSymbol: { name: 'P' } as RawSymbol, state: 'static' });

	// threshold and palette live in constants so the reel-side copy of the same
	// coin (Symbol.svelte) grades identically
	const isBig = isBigPrize;

	// Landing shake, scaled by how big the prize is: 10x barely twitches, the
	// top prizes really slam. log10 keeps the range usable — the values span
	// three orders of magnitude, so anything linear would be imperceptible at
	// 10x or absurd at 10000x.
	const SHAKE_MS = 420;
	const RING_MS = 560;
	const DROP = SYMBOL_SIZE * 0.22;
	const TOSS = SYMBOL_SIZE * 0.2;
	const shakeAmplitude = (prize: number) => {
		if (!isBig(prize)) return 0;
		const decades = Math.log10(prize / BIG_PRIZE_FROM); // 10x -> 0, 10000x -> 3
		return SYMBOL_SIZE * (0.05 + 0.055 * decades);
	};
	// how hard a coin rings on sticking: a small prize a light ting, the big ones
	// the full ring-down (coinFace caps the swing at 1.2)
	const ringImpact = (prize: number) =>
		isBig(prize) ? Math.min(1.2, 0.95 + 0.08 * Math.log10(prize / BIG_PRIZE_FROM)) : 0.75;

	let prizes = $state<PrizeEntry[]>([]);
	let celebrating = false;

	let clock = $state(0);
	let rafId = 0;
	let running = false;
	// one frame loop while anything is shaking, ringing or in the air
	const busy = (now: number) =>
		prizes.some(
			(entry) =>
				now - entry.landedAt < SHAKE_MS ||
				now - entry.ringAt < RING_MS ||
				entry.lift.current !== entry.lift.target,
		);
	const startClock = () => {
		if (running) return;
		running = true;
		const step = (now: number) => {
			clock = now;
			if (busy(now)) {
				rafId = requestAnimationFrame(step);
			} else {
				running = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};
	const shakeOffset = (entry: PrizeEntry) => {
		const amp = shakeAmplitude(entry.prize);
		if (amp === 0) return { x: 0, y: 0 };
		const t = clock - entry.landedAt;
		if (t < 0 || t > SHAKE_MS) return { x: 0, y: 0 };
		// decaying rattle; x and y run at different rates so it jitters rather
		// than sliding along one axis
		const decay = (1 - t / SHAKE_MS) ** 2;
		return {
			x: Math.sin(t / 17) * amp * decay,
			y: Math.cos(t / 13) * amp * decay * 0.8,
		};
	};
	const REST_FACE = { across: 1, angle: 0 };
	const faceOf = (entry: PrizeEntry) =>
		entry.ring > 0 && clock - entry.ringAt < RING_MS ? coinFace(clock - entry.ringAt, entry.impact) : REST_FACE;

	const ring = (entry: PrizeEntry, impact: number) => {
		entry.impact = impact;
		entry.ringAt = performance.now();
		entry.ring++;
		startClock();
	};

	// ── the idle: one held coin at a time gives a small ring ────────────────
	onMount(() => {
		let id = 0;
		const next = () => {
			id = setTimeout(
				() => {
					const now = performance.now();
					const resting = prizes.filter((e) => now - e.ringAt > 1500 && e.lift.current === 0);
					if (!celebrating && resting.length > 0) {
						ring(resting[Math.floor(Math.random() * resting.length)], 0.35);
					}
					next();
				},
				2600 + Math.random() * 2400,
			) as unknown as number;
		};
		next();
		return () => clearTimeout(id);
	});
	onDestroy(() => cancelAnimationFrame(rafId));

	const newEntry = (p: { reel: number; row: number; prize: number }, lift: number): PrizeEntry => ({
		...p,
		lift: new Tween(lift),
		landedAt: lift > 0 ? Infinity : 0,
		ring: 0,
		ringAt: -Infinity,
		impact: 0,
	});

	context.eventEmitter.subscribeOnMount({
		// New coins landed and stuck: each drops into its cell and rings down
		// (superspin "hold em" — every new coin also resets the remaining spins).
		stickyPrizesNew: async ({ prizes: incoming }) => {
			prizes = [
				...prizes.filter((p) => !incoming.some((n) => keyOf(n) === keyOf(p))),
				...incoming.map((p) => newEntry(p, DROP)),
			];
			// the $state proxies, so the writes below are seen
			const live = prizes.slice(-incoming.length);
			startClock();
			for (const entry of live) {
				entry.lift.set(0, { duration: 130, easing: cubicIn }).then(() => {
					entry.landedAt = performance.now();
					ring(entry, ringImpact(entry.prize));
				});
				await waitForTimeout(140);
			}
			await waitForTimeout(360);
		},
		// Final tally: the paying coins are tossed and ring as they come down.
		stickyPrizesCelebrate: async ({ wins }) => {
			celebrating = true;
			const winningKeys = new Set(wins.map(keyOf));
			const paying = prizes
				.filter((entry) => winningKeys.has(keyOf(entry)))
				.sort((a, b) => a.reel - b.reel || a.row - b.row);
			const STEP = 70;
			paying.forEach((entry, i) => {
				setTimeout(() => {
					entry.lift.set(TOSS, { duration: 170, easing: cubicOut }).then(() =>
						entry.lift.set(0, { duration: 190, easing: cubicIn }).then(() => ring(entry, 1)),
					);
					startClock();
				}, i * STEP);
			});
			await waitForTimeout(Math.min(paying.length * STEP, 700) + 420);
			celebrating = false;
			await waitForTimeout(300);
		},
		// Bet resume: rebuild instantly, no animation.
		stickyPrizesRestore: ({ prizes: restored }) => {
			prizes = restored.map((p) => newEntry(p, 0));
		},
		stickyPrizesClear: () => {
			prizes = [];
		},
	});
</script>

<BoardContainer>
	{#each prizes as entry (keyOf(entry))}
		{@const x = getSymbolX(entry.reel)}
		{@const y = rowCenterY(entry.row)}
		<!--
			Occluder for the held cell. Its only job is to hide the reel sweeping
			behind the coin, so it is painted in the board's own olive rather than
			the old red — the cell then reads as an ordinary empty slot with a coin
			held on it, instead of a coloured plate laid over the reel. A thin brass
			edge still marks it as held.

		-->
		<Graphics
			draw={(g) => {
				g.clear();
				// square and full-bleed: a rounded fill alone leaves the cell
				// corners open and the sweep shows through them
				g.beginFill(BOARD_CELL_COLOR, 1);
				g.drawRect(x - SYMBOL_SIZE / 2, y - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
				g.endFill();
				g.lineStyle(2.5, 0xffd43b, 0.45);
				g.drawRoundedRect(
					x - SYMBOL_SIZE / 2 + 3,
					y - SYMBOL_SIZE / 2 + 3,
					SYMBOL_SIZE - 6,
					SYMBOL_SIZE - 6,
					10,
				);
			}}
		/>
		{@const shake = shakeOffset(entry)}
		{@const face = faceOf(entry)}
		{@const lift = entry.lift.current}
		<Container x={shake.x} y={shake.y - lift}>
			<!-- the coin, through its mesh: at rest it is the drawing; each ring
			     replays its landing (tilt, ting, glint) -->
			<SymbolMeshWin
				symbolInfo={coinInfo}
				symbolName="P"
				beat="land"
				impact={entry.impact}
				replay={entry.ring}
				{x}
				{y}
				onTop
			/>
		</Container>
		{#if isBig(entry.prize)}
			<!-- high-value coins get a hot rim so they separate from the $1s at a
			     glance, flaring as they ring -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={x + shake.x}
				y={y + shake.y - lift}
				width={SYMBOL_SIZE * 1.3}
				height={SYMBOL_SIZE * 1.3}
				tint={0xff8a3c}
				blendMode="add"
				alpha={0.3 + 0.25 * Math.max(0, 1 - (clock - entry.ringAt) / RING_MS)}
			/>
		{/if}
		<!-- the value rides the coin's face as it rings -->
		<Container
			x={x + shake.x}
			y={y + shake.y - lift}
			scale={{ x: face.across, y: 1 }}
			rotation={(face.angle * Math.PI) / 180}
		>
			<GoldText
				text={bookEventAmountToCurrencyString(entry.prize)}
				fontSize={28}
				maxWidth={SYMBOL_SIZE * 0.86}
				fill={isBig(entry.prize) ? BIG_PRIZE_FILL : undefined}
				stroke={isBig(entry.prize) ? BIG_PRIZE_STROKE : undefined}
			/>
		</Container>
	{/each}
</BoardContainer>
