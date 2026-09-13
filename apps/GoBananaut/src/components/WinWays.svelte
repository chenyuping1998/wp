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
	//   2. ONE winning symbol's cells stay bright, with a frame around each
	//   3. a badge states which symbol it is and how many WAYS it paid
	//   4. if more than one symbol paid, the next one takes over, highest first
	//
	// ONE SYMBOL AT A TIME, and this was the whole of the last revision.
	//
	// It used to light EVERY winning symbol's cells at once while the badge named
	// only the top one, so the board showed eleven lit cells under a badge saying
	// "12 WAYS" and the two could not be reconciled by looking at them. A ways win
	// is per symbol — its own count, its own amount — so a presentation that unions
	// them is showing a set the maths never computed.
	//
	// The cost of stepping through them is smaller than it looks, and it was
	// measured rather than assumed. Over 4,000 published books:
	//
	//     symbols paying     base game     free game
	//        1                 72.9%         59.1%
	//        2                 21.9%         29.5%
	//        3 or more          5.1%         11.3%
	//
	// Seven spins in ten pay one symbol and take exactly as long as they did
	// before. Only the spins that actually have something to explain get longer.
	//
	// The dimming is drawn as rectangles over the NON-winning cells rather than as
	// a scrim with holes cut in it. A 4x5 board is 20 cells, so the rect list is
	// trivial, and it avoids pixi v8's mask/hole API entirely — inverse masks are
	// the kind of thing that works until a version bump.

	const REVEAL_STAGGER = { normal: 90, fast: 40 };
	const HOLD_AFTER_MS = 220;

	// HOW LONG ONE SYMBOL'S PASS LASTS, including its wake.
	//
	// `first` is 950 in the base game because that is exactly what the whole
	// presentation used to last — a spin paying one symbol, which is seven in ten
	// of them, is unchanged by this rewrite. A symbol's win spine runs ~1.4s and
	// the wake is far shorter, so without this hold the round moves on a third of
	// the way into the animation.
	//
	// `next` is shorter because the second symbol is not a new board: the player
	// has already read the reels and only the highlighted set and the number
	// change. The free game and turbo compress both, and the free game genuinely
	// needs it — 41% of its wins pay more than one symbol against 27% in the base
	// game, so it is where the extra passes actually land.
	//
	// `first` IS 950 IN BOTH, deliberately. The free game already ran the wake at
	// the fast stagger and still held to 950 overall, so shortening it here would
	// have made the commonest case in the feature quicker than it is today —
	// a change nobody asked for, and one that clips a 1.4s win spine further.
	// Only the follow-up passes compress, which is where the extra time this
	// rewrite spends actually goes.
	const PASS_MS = {
		normal: { first: 950, next: 620 },
		fast: { first: 950, next: 380 },
	};

	// Long runs tighten, the same way a long growth run does in ReelGrow: eight
	// symbols at full length is four seconds of a player waiting to be told
	// something they can already see. Floored, so it never becomes a flicker.
	const passScale = (n: number) => (n <= 2 ? 1 : Math.max(0.55, 2.2 / n));

	const SCRIM = 0x05070a;
	const SCRIM_ALPHA = 0.62;
	const FRAME = 0xffd75e;

	let wins = $state<WinWayData[]>([]);
	// Reels revealed so far: the wake runs left to right, which is the direction
	// a ways win is read in.
	let revealedReels = $state(0);
	let show = $state(false);

	// The winning symbols, highest first. Sorted by AMOUNT rather than by ways:
	// ways is the count, the amount is what the player cares about, and on a flat
	// paytable like this one the two do not always agree.
	const ordered = $derived(
		wins.filter((w) => w.ways > 0).slice().sort((a, b) => b.win - a.win),
	);

	// Which of them is on screen. Driven by the presentation below, not by a
	// timer: the old version ran an interval at 1100ms inside a presentation that
	// lasted 950, so it never fired once and every symbol after the first was
	// invisible in every game that has ever been played.
	let activeIndex = $state(0);

	const current = $derived.by(() => {
		const win = ordered[activeIndex];
		if (!win) return undefined;
		return {
			// The symbol is shown as its own icon rather than its code — "A" and
			// "H1" mean nothing on screen, and the tile the player just watched
			// light up is the least ambiguous label there is.
			assetKey: getSymbolInfo({
				rawSymbol: { name: win.symbol as SymbolName },
				state: 'static',
			}).assetKey,
			ways: win.ways,
		};
	});

	const ICON = $derived(SYMBOL_SIZE * 0.3);

	// The cells of the symbol being shown, and only those, gated by how far the
	// left-to-right wake has travelled.
	const litCells = $derived.by(() => {
		const set = new Set<string>();
		const win = ordered[activeIndex];
		if (!win) return set;
		for (const p of win.positions) {
			if (p.row >= 1 && p.row <= reelRows(p.reel) && p.reel < revealedReels) {
				set.add(`${p.reel},${p.row}`);
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
			activeIndex = 0;

			const usable = incoming.filter((w) => w.positions.length > 0);
			if (usable.length === 0) return;

			wins = usable;
			show = true;
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const quick = fast || stateBet.isTurbo;
			const stagger = quick ? REVEAL_STAGGER.fast : REVEAL_STAGGER.normal;
			const pass = quick ? PASS_MS.fast : PASS_MS.normal;

			// `ordered` is derived from `wins`, which was assigned a line ago, so
			// take the same ordering here rather than reading the rune mid-update.
			const passes = usable.slice().sort((a, b) => b.win - a.win);
			const scale = passScale(passes.length);

			for (let i = 0; i < passes.length; i += 1) {
				activeIndex = i;
				revealedReels = 0;

				// This symbol's own reach. A three-of-a-kind stops at reel 3 rather
				// than waiting out two empty steps to reel 5 — and now that each
				// symbol is shown alone, that is per symbol instead of per board.
				const lastReel = Math.max(...passes[i].positions.map((p) => p.reel));

				for (let reel = 0; reel <= lastReel; reel += 1) {
					revealedReels = reel + 1;
					animatePositions(passes[i].positions.filter((p) => p.reel === reel));
					await waitForTimeout(stagger * scale);
					if (mine !== generation) return;
				}

				// Safety net, and it runs BEFORE the hold. Anything the wake missed —
				// a dropped frame, a position on a reel past lastReel — gets the whole
				// hold to play in rather than starting its 1.4s spine at the moment
				// the round moves on. animatedKeys makes it a no-op for everything
				// already lit, INCLUDING cells this pass shares with an earlier one,
				// which is what stops a Wild's cell being re-triggered mid-animation
				// and hanging the round on a completion that never fires.
				animatePositions(passes[i].positions);

				// Turbo opts out of the extended hold: there the player asked for
				// speed and a clipped win animation is the trade they made.
				const target = (i === 0 ? pass.first : pass.next) * scale;
				const elapsed = (lastReel + 1) * stagger * scale;
				const hold = stateBet.isTurbo
					? HOLD_AFTER_MS
					: Math.max(HOLD_AFTER_MS, target - elapsed);
				await waitForTimeout(hold);
				if (mine !== generation) return;
			}
		},
		winLinesHide: () => {
			generation += 1;
			show = false;
			wins = [];
			revealedReels = 0;
			activeIndex = 0;
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
			activeIndex = 0;
		},
		winLinesClear: () => {
			generation += 1;
			wins = [];
			revealedReels = 0;
			activeIndex = 0;
		},
	});

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (!show || wins.length === 0) return;

		// Dim every cell that is not part of THIS symbol's win. Reels the wake has
		// not reached yet are dimmed whole, so the board darkens ahead of the
		// reveal and the win appears to light up out of it — and on the second and
		// later passes the previous symbol's cells go back under the scrim, which
		// is what makes the handover legible.
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
