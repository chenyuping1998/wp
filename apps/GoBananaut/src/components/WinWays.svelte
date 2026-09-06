<script lang="ts" module>
	export type EmitterEventWinWays =
		| { type: 'winLinesShow'; wins: WinWayData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	// One winning SYMBOL, not one line. `ways` is the product of the per-reel
	// counts and is the number the player is shown.
	export type WinWayData = {
		symbol: string;
		kind: number;
		ways: number;
		win: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
	};
</script>

<script lang="ts">
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import { getContext } from '../game/context';
	import { getSymbolInfo } from '../game/utils';
	import {
		SYMBOL_SIZE,
		REEL_PADDING,
		BOARD_DIMENSIONS,
		BOARD_SIZES,
		BASE_ROWS,
		cellTopY,
	} from '../game/constants';
	import type { SymbolName } from '../game/types';

	const context = getContext();

	// PER REEL, not per board. The box is six rows tall and a reel is 4..6, so a
	// win frame bounded by the box would be drawn over empty space above a reel
	// that has not grown.
	const reelRows = (reel: number) => context.stateGame.growRows[reel] ?? BASE_ROWS;

	// WHY THIS IS NOT A LINE PRESENTATION
	//
	// Gen-1 and gen-2 drew a coloured polyline per payline and ran a grenade along
	// it. A ways game has no line to run along: a symbol pays wherever it lands on
	// its reel, and a single win can involve eight scattered cells with no path
	// between them. Drawing one would invent a shape the maths does not have.
	//
	// So this follows what ways games actually do — Megaways, Nolimit, Pragmatic
	// all present the same way, and players arrive already knowing how to read it:
	//
	//   1. the board dims
	//   2. the winning cells stay bright, with a frame around each
	//   3. a badge states how many WAYS paid
	//
	// The dimming is drawn as rectangles over the NON-winning cells rather than as
	// a scrim with holes cut in it. A 4x5 board is 20 cells, so the rect list is
	// trivial, and it avoids pixi v8's mask/hole API entirely — inverse masks are
	// the kind of thing that works until a version bump.

	const REVEAL_STAGGER = { normal: 90, fast: 40 };
	const HOLD_AFTER_MS = 220;

	// A symbol's win spine runs ~1.4s. The reveal itself is far shorter, so
	// without a hold the next spin wipes the symbols a third of the way into
	// their animation — the same bug gen-2 had with its line volley.
	const WIN_ANIM_VISIBLE_MS = 950;

	const SCRIM = 0x05070a;
	const SCRIM_ALPHA = 0.62;
	const FRAME = 0xffd75e;

	let wins = $state<WinWayData[]>([]);
	// Reels revealed so far: the wake runs left to right, which is the direction
	// a ways win is read in.
	let revealedReels = $state(0);
	let show = $state(false);

	// One row per winning SYMBOL, because that is how a ways game pays: each
	// symbol has its own count and its own amount, and a single summed total
	// would tell the player a number that appears nowhere in the maths.
	//
	// The symbol is shown as its own icon rather than its code — "A" and "H1"
	// mean nothing on screen, and the tile the player just watched light up is
	// the least ambiguous label there is.
	const rows = $derived(
		wins
			.filter((w) => w.ways > 0)
			.slice()
			.sort((a, b) => b.win - a.win)
			.map((w) => ({
				key: `${w.symbol}-${w.kind}`,
				assetKey: getSymbolInfo({
					rawSymbol: { name: w.symbol as SymbolName },
					state: 'static',
				}).assetKey,
				ways: w.ways,
			})),
	);

	const ICON = $derived(SYMBOL_SIZE * 0.3);

	// ONE AT A TIME, HIGHEST FIRST.
	//
	// A ways board can pay six or seven symbols at once, and a list that long
	// under the board is a wall of numbers nobody reads — it also grows downward
	// into whatever is beneath it, which is a layout that breaks on the spin that
	// happens to pay the most. Cycling keeps the strip one line tall whatever
	// happens, and puts the biggest win in front of the player first.
	const CYCLE_MS = 1100;
	let cycle = $state(0);
	let cycleTimer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (cycleTimer !== null) clearInterval(cycleTimer);
		cycleTimer = null;
		cycle = 0;
		if (rows.length < 2) return;
		cycleTimer = setInterval(() => {
			cycle = (cycle + 1) % rows.length;
		}, CYCLE_MS);
		return () => {
			if (cycleTimer !== null) clearInterval(cycleTimer);
			cycleTimer = null;
		};
	});

	const current = $derived(rows.length ? rows[cycle % rows.length] : undefined);

	// Every winning cell across every winning symbol, deduped — two symbols can
	// share a cell only via a Wild, but that is enough to double-draw a frame.
	const litCells = $derived.by(() => {
		const set = new Set<string>();
		for (const win of wins) {
			for (const p of win.positions) {
				if (p.row >= 1 && p.row <= reelRows(p.reel) && p.reel < revealedReels) {
					set.add(`${p.reel},${p.row}`);
				}
			}
		}
		return set;
	});

	// Same formula as getSymbolX in utils.ts.
	const cellX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING) - SYMBOL_SIZE / 2;
	// PER REEL. This used to be `-SYMBOL_SIZE + row * SYMBOL_SIZE`, which is the
	// six-row box's own coordinate and correct only for a reel that has grown all
	// the way. On a reel still at four it put the scrim and the win frames two
	// cells above the symbols they belong to — over the closed shutter.
	const cellY = (reel: number, row: number) => cellTopY(reelRows(reel), row);

	// --- symbol animations, fired reel by reel in the wake -------------------
	// A cell can belong to more than one winning symbol; animating it twice
	// re-assigns symbolState='win' without retriggering, and the game hangs
	// waiting for a completion that never fires. Dedupe per reveal.
	let animatedKeys = new Set<string>();
	const posKey = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	// Bumped by every show, hide and clear, so a volley cancelled midway cannot
	// keep animating a board that has already started spinning again.
	let generation = 0;

	const animatePositions = (positions: { reel: number; row: number }[]) => {
		const fresh = positions.filter(
			(p) =>
				p.row >= 1 &&
				p.row <= reelRows(p.reel) &&
				!animatedKeys.has(posKey(p)),
		);
		if (fresh.length === 0) return;
		for (const p of fresh) animatedKeys.add(posKey(p));
		context.eventEmitter.broadcast({ type: 'boardWithAnimateSymbols', symbolPositions: fresh });
	};

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins: incoming, fast }) => {
			const mine = ++generation;
			animatedKeys = new Set();
			revealedReels = 0;

			const usable = incoming.filter((w) => w.positions.length > 0);
			if (usable.length === 0) return;

			wins = usable;
			show = true;
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const stagger = fast || stateBet.isTurbo ? REVEAL_STAGGER.fast : REVEAL_STAGGER.normal;

			// Widest win decides how far the wake travels; reels beyond it hold
			// nothing, so stopping there keeps a 3-of-a-kind from waiting out two
			// empty steps.
			const lastReel = Math.max(...usable.flatMap((w) => w.positions.map((p) => p.reel)));

			for (let reel = 0; reel <= lastReel; reel++) {
				revealedReels = reel + 1;
				animatePositions(usable.flatMap((w) => w.positions.filter((p) => p.reel === reel)));
				await waitForTimeout(stagger);
				if (mine !== generation) return;
			}

			// Safety net, and it runs BEFORE the hold. Anything the wake missed —
			// a dropped frame, a position on a reel past lastReel — gets the whole
			// hold to play in rather than starting its 1.4s spine at the moment the
			// round moves on. animatedKeys makes it a no-op for everything already lit.
			animatePositions(usable.flatMap((w) => w.positions));

			// Turbo opts out of the extended hold: there the player asked for speed
			// and a clipped win animation is the trade they made.
			const elapsed = (lastReel + 1) * stagger;
			const hold = stateBet.isTurbo
				? HOLD_AFTER_MS
				: Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS - elapsed);
			await waitForTimeout(hold);
			if (mine !== generation) return;
		},
		winLinesHide: () => {
			generation += 1;
			show = false;
			wins = [];
			revealedReels = 0;
		},
		// The round is over. Board listens to this to cancel its symbol
		// animations; this component has to listen too, or the two disagree.
		//
		// winLinesHide alone was not enough. The idle replay is a detached loop,
		// and pressing Spin while one of its passes is inside winLinesShow leaves
		// that pass mid-flight: it wakes from its next await and fires one more
		// boardWithAnimateSymbols — AFTER Board has already cancelled — putting
		// symbols into the win state for a round that has started. That is the
		// win presentation which kept appearing on the following spin.
		boardWinAnimCancel: () => {
			generation += 1;
			show = false;
			wins = [];
			revealedReels = 0;
		},
		winLinesClear: () => {
			generation += 1;
			wins = [];
			revealedReels = 0;
		},
	});

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (!show || wins.length === 0) return;

		// Dim every cell that is not part of a win. Reels the wake has not reached
		// yet are dimmed whole, so the board darkens ahead of the reveal and the
		// wins appear to light up out of it.
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 1; row <= reelRows(reel); row++) {
				if (litCells.has(`${reel},${row}`)) continue;
				g.rect(cellX(reel), cellY(reel, row), SYMBOL_SIZE, SYMBOL_SIZE);
			}
		}
		g.fill({ color: SCRIM, alpha: SCRIM_ALPHA });

		// A frame around each winning cell. Drawn after the scrim so it sits over
		// the boundary between a lit cell and a dimmed neighbour, which is where
		// the eye looks for the edge of a win.
		const inset = 3;
		for (const key of litCells) {
			const [reel, row] = key.split(',').map(Number);
			g.rect(
				cellX(reel) + inset,
				cellY(reel, row) + inset,
				SYMBOL_SIZE - inset * 2,
				SYMBOL_SIZE - inset * 2,
			);
		}
		g.stroke({ width: 3, color: FRAME, alpha: 0.9 });
	};
</script>

{#if show && wins.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			<Graphics {draw} />
			{#if revealedReels > 0 && current}
				{@const y = BOARD_SIZES.height + SYMBOL_SIZE * 0.3}
				<!-- icon then count, as one centred pair: the icon is anchored on its
				     right edge and the text on its left, so the pair stays balanced
				     about the board's centre however long the number is. -->
				<Sprite
					anchor={{ x: 1, y: 0.5 }}
					key={current.assetKey}
					x={BOARD_SIZES.width / 2 - SYMBOL_SIZE * 0.07}
					{y}
					width={ICON}
					height={ICON}
				/>
				<GoldText
					text={`${current.ways.toLocaleString()} WAYS`}
					fontSize={SYMBOL_SIZE * 0.22}
					x={BOARD_SIZES.width / 2 + SYMBOL_SIZE * 0.07}
					{y}
					anchor={{ x: 0, y: 0.5 }}
					maxWidth={BOARD_SIZES.width * 0.4}
					letterSpacing={1}
				/>
			{/if}
		</Container>
	</BoardContainer>
{/if}
