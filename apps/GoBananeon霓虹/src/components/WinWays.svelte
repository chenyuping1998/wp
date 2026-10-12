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
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import TextMesh from './TextMesh.svelte';
	import { LABEL_ACT } from '../game/meshWin/textMesh';
	import { getContext } from '../game/context';
	import { featureTimeScale } from '../game/timeScale';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, BOARD_SIZES } from '../game/constants';
	import { REEL_PADDING } from '../game/constants';
	import { MESH_WINS } from '../game/meshWin';
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
				positions: w.positions,
				tint: MESH_WINS[w.symbol]?.flashTint ?? 0xff4fd8,
			})),
	);

	const ICON = $derived(SYMBOL_SIZE * 0.3);

	// ONE AT A TIME, HIGHEST FIRST.
	//
	// A ways board can pay six or seven symbols at once, and a list that long
	// under the board is a wall of numbers nobody reads — it also grows downward
	// into whatever is beneath it, which is a layout that breaks on the spin that
	// happens to pay the most. Cycling keeps the strip one line tall whatever
	// happens, and puts the biggest win in front of the player first. The show
	// handler advances this index explicitly so every badge actually gets time
	// on screen; a free-running timer outlived most normal win presentations.
	let cycle = $state(0);
	let focusing = $state(false);
	let focusAt = $state(0);
	let cueClock = $state(0);
	onMount(() => {
		const timer = setInterval(() => {
			if (focusing) cueClock = performance.now();
		}, 33);
		return () => clearInterval(timer);
	});

	const current = $derived(rows.length ? rows[cycle % rows.length] : undefined);
	const drawFocus = (g: PixiGraphics) => {
		g.clear();
		if (!focusing || !current) return;
		const age = Math.max(0, cueClock - focusAt);
		const alpha = 0.2 + 0.62 * Math.exp(-age / 210);
		const inset = SYMBOL_SIZE * 0.075;
		const reach = SYMBOL_SIZE * 0.14;
		for (const p of current.positions) {
			if (p.reel < 0 || p.reel >= BOARD_DIMENSIONS.x || p.row < 1 || p.row > BOARD_DIMENSIONS.y) continue;
			const left = SYMBOL_SIZE * (p.reel + REEL_PADDING) - SYMBOL_SIZE / 2 + inset;
			const top = (p.row - 1) * SYMBOL_SIZE + inset;
			const right = left + SYMBOL_SIZE - inset * 2;
			const bottom = top + SYMBOL_SIZE - inset * 2;
			g.moveTo(left, top + reach).lineTo(left, top).lineTo(left + reach, top)
				.stroke({ width: 3, color: current.tint, alpha, cap: 'round', join: 'round' });
			g.moveTo(right - reach, bottom).lineTo(right, bottom).lineTo(right, bottom - reach)
				.stroke({ width: 3, color: current.tint, alpha, cap: 'round', join: 'round' });
		}
	};
	// the label hops, letter after letter, each time it moves on to the next
	// winning symbol (TextMesh)
	let labelAt = $state(-1);
	$effect(() => {
		// keyed on the symbol shown, not the object: rows can be rebuilt with
		// the same content
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
		winLinesShow: async ({ wins: incoming, fast }) => {
			const mine = ++generation;
			animatedKeys = new Set();
			revealedReels = 0;
			cycle = 0;
			focusing = false;

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
			const focusCount = usable.filter((w) => w.ways > 0).length;
			const focusMs = fast || stateBet.isTurbo ? 240 : 390;
			if (focusCount > 0) {
				focusing = true;
				focusAt = cueClock = performance.now();
			}
			await waitForTimeout(Math.max(160, hold - Math.max(0, focusCount - 1) * focusMs));
			if (mine !== generation) return;
			for (let i = 1; i < focusCount; i++) {
				cycle = i;
				focusAt = cueClock = performance.now();
				await waitForTimeout(focusMs);
				if (mine !== generation) return;
			}
		},
		winLinesHide: () => {
			generation += 1;
			show = false;
			focusing = false;
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
			focusing = false;
			wins = [];
			revealedReels = 0;
		},
		winLinesClear: () => {
			generation += 1;
			wins = [];
			focusing = false;
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
			<Graphics draw={drawFocus} />
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
