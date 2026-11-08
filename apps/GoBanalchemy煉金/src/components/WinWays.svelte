<script lang="ts" module>
	export type EmitterEventWinWays =
		// live: the round's own presentation (winInfo). The idle replay leaves it
		// off, so the wake and the landings only make a sound the first time.
		| { type: 'winLinesShow'; wins: WinWayData[]; fast?: boolean; live?: boolean }
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
	import { Container } from 'pixi-svelte';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import TextMesh from './TextMesh.svelte';
	import { LABEL_ACT } from '../game/meshWin/textMesh';
	import { getContext } from '../game/context';
	import { featureTimeScale, winTimeScale } from '../game/timeScale';
	import { msToGrid, sixteenthMs } from '../game/beatClock';
	import { winLandAt } from '../game/winTempo';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, BOARD_SIZES } from '../game/constants';
	import type { SymbolName } from '../game/types';

	const context = getContext();

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
	// the label hops, letter after letter, each time it moves on to the next
	// winning symbol (TextMesh, 2026-10-16)
	let labelAt = $state(-1);
	$effect(() => {
		void [cycle, current?.assetKey];
		labelAt = Date.now();
	});

	// Every winning cell across every winning symbol, deduped — two symbols can
	// share a cell only via a Wild, but that is enough to double-draw a frame.
	const litCells = $derived.by(() => {
		const set = new Set<string>();
		for (const win of wins) {
			for (const p of win.positions) {
				if (p.row >= 1 && p.row <= BOARD_DIMENSIONS.y && p.reel < revealedReels) {
					set.add(`${p.reel},${p.row}`);
				}
			}
		}
		return set;
	});

	// --- symbol animations, fired reel by reel in the wake -------------------
	// A cell can belong to more than one winning symbol; animating it twice
	// re-assigns symbolState='win' without retriggering, and the game hangs
	// waiting for a completion that never fires. Dedupe per reveal.
	let animatedKeys = new Set<string>();
	const posKey = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	// Bumped by every show, hide and clear, so a volley cancelled midway cannot
	// keep animating a board that has already started spinning again.
	let generation = 0;

	// ON THE BEAT (2026-11-06, user: 「動畫跟音效節奏方面要更強」). The wake
	// used to start whenever winInfo arrived and step every 90ms, against a
	// 128 BPM bed whose sixteenth is 117ms, with one 1.2s arpeggio fired at the
	// start that knew nothing about it. Now a live wake waits for the bed's next
	// sixteenth (at most one, ~117ms) and lights a reel per sixteenth, each with
	// its own rising note — the sound walks across the board with the light —
	// and every reel's symbols clink as they come down from their leap. The leaps
	// are retimed to land a whole number of sixteenths in (meshWin/leapWin.ts),
	// so in the base game the landings fall on the drums too.
	const HEAVY = new Set(['H1', 'H2', 'H3', 'H4', 'W', 'S']);
	let landTimers: ReturnType<typeof setTimeout>[] = [];
	const clearLands = () => {
		for (const t of landTimers) clearTimeout(t);
		landTimers = [];
	};
	// one clink per moment a reel's symbols touch down (a reel can hold a letter
	// and a lantern, which land a sixteenth apart)
	const scheduleLands = (positions: { reel: number; row: number }[], symbolOf: (p: { reel: number; row: number }) => string) => {
		const speed = winTimeScale();
		const groups = new Map<number, { heavy: boolean; count: number }>();
		for (const p of positions) {
			const symbol = symbolOf(p);
			const at = winLandAt(symbol, speed);
			if (at >= 99999) continue;
			const key = Math.round(at);
			const g = groups.get(key) ?? { heavy: false, count: 0 };
			g.count++;
			g.heavy ||= HEAVY.has(symbol);
			groups.set(key, g);
		}
		for (const [at, g] of groups)
			landTimers.push(
				setTimeout(() => context.eventEmitter.broadcast({ type: 'soundWinLand', heavy: g.heavy, count: g.count }), at),
			);
	};

	const animatePositions = (positions: { reel: number; row: number }[]) => {
		const fresh = positions.filter(
			(p) =>
				p.row >= 1 &&
				p.row <= BOARD_DIMENSIONS.y &&
				!animatedKeys.has(posKey(p)),
		);
		if (fresh.length === 0) return;
		for (const p of fresh) animatedKeys.add(posKey(p));
		context.eventEmitter.broadcast({ type: 'boardWithAnimateSymbols', symbolPositions: fresh });
	};

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins: incoming, fast, live }) => {
			const mine = ++generation;
			clearLands();
			animatedKeys = new Set();
			revealedReels = 0;

			const usable = incoming.filter((w) => w.positions.length > 0);
			if (usable.length === 0) return;

			// Turbo asked for speed: no wait for the grid there, and the quick step.
			const onBeat = !!live && !stateBet.isTurbo;
			if (onBeat) {
				const wait = msToGrid(4);
				if (wait > 0) await waitForTimeout(wait);
				if (mine !== generation) return;
			}
			const symbolAt = new Map<string, string>();
			for (const w of usable) for (const p of w.positions) if (!symbolAt.has(posKey(p))) symbolAt.set(posKey(p), w.symbol);

			wins = usable;
			show = true;
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const stagger = onBeat
				? sixteenthMs()
				: fast || stateBet.isTurbo
					? REVEAL_STAGGER.fast
					: REVEAL_STAGGER.normal;

			// Widest win decides how far the wake travels; reels beyond it hold
			// nothing, so stopping there keeps a 3-of-a-kind from waiting out two
			// empty steps.
			const lastReel = Math.max(...usable.flatMap((w) => w.positions.map((p) => p.reel)));

			// Steps are scheduled from the wake's start, not chained, so timer
			// slop does not pile up across five reels and drift off the grid.
			const t0 = performance.now();
			for (let reel = 0; reel <= lastReel; reel++) {
				revealedReels = reel + 1;
				const cells = usable.flatMap((w) => w.positions.filter((p) => p.reel === reel));
				const fresh = cells.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y && !animatedKeys.has(posKey(p)));
				animatePositions(cells);
				if (live && fresh.length) {
					context.eventEmitter.broadcast({ type: 'soundWinStep', step: reel + 1 });
					scheduleLands(fresh, (p) => symbolAt.get(posKey(p)) ?? '');
				}
				await waitForTimeout(Math.max(0, t0 + (reel + 1) * stagger - performance.now()));
				if (mine !== generation) return;
			}

			// Safety net, and it runs BEFORE the hold. Anything the wake missed —
			// a dropped frame, a position on a reel past lastReel — gets the whole
			// hold to play in rather than starting its 1.4s spine at the moment the
			// round moves on. animatedKeys makes it a no-op for everything already lit.
			animatePositions(usable.flatMap((w) => w.positions));

			// Turbo opts out of the extended hold in the base game: there the player
			// asked for speed and a clipped win animation is the trade they made.
			// NOT in the free game, where the wins are the payoff: there the hold
			// is shortened by the feature's gentler scale (game/timeScale.ts) —
			// long enough for the mesh wins, which run at that same scale, to play.
			const elapsed = (lastReel + 1) * stagger;
			const hold = !stateBet.isTurbo
				? Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS - elapsed)
				: context.stateGame.gameType === 'freegame'
					? Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS / featureTimeScale() - elapsed)
					: HOLD_AFTER_MS;
			await waitForTimeout(hold);
			if (mine !== generation) return;
		},
		winLinesHide: () => {
			generation += 1;
			// a landing still in the air keeps its clink: the leap plays out
			// after the lines are hidden
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
			clearLands();
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

	// THE DIMMING AND THE FRAMES MOVED OUT OF HERE.
	//
	// Winning symbols now play GB100's win moves and grow to 1.3-1.55x over
	// their neighbours (SymbolWinAnim). Drawn from here, above the whole board,
	// the scrim over a losing neighbour dimmed the half of the winning tile that
	// had grown across it, and the fixed cell frame cut straight through it.
	//
	// So this publishes WHICH cells are lit, and WinScrim draws the dimming from
	// inside Board, under the layer the winning symbols play on. The frame is
	// drawn by the symbol itself and moves with it. Reels the wake has not
	// reached are still dimmed whole, so the wins light up out of a dark board.
	$effect(() => {
		stateGame.winLitCells = show && wins.length > 0 ? [...litCells] : null;
	});
</script>

{#if show && wins.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
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
				<TextMesh
					text={`${current.ways.toLocaleString()} WAYS`}
					fontSize={SYMBOL_SIZE * 0.22}
					x={BOARD_SIZES.width / 2 + SYMBOL_SIZE * 0.07}
					{y}
					anchor={{ x: 0, y: 0.5 }}
					maxWidth={BOARD_SIZES.width * 0.4}
					letterSpacing={1}
					bevel
					at={{ spin: labelAt }}
					act={LABEL_ACT}
				/>
			{/if}
		</Container>
	</BoardContainer>
{/if}
