<script lang="ts" module>
	import type { Position, SymbolName } from '../game/types';

	export type EmitterEventHeldTabletsPending = {
		// The cells whose seals are breaking right now. This overlay draws held
		// cells at rest, and until the break has played those cells are still
		// sealed on the board — drawing them here would put the revealed symbol on
		// screen ahead of the animation that is supposed to name it.
		type: 'heldTabletsPending';
		positions: Position[];
	};

	export type EmitterEventHeldTabletsOpened = {
		// every seal in that batch has finished breaking; the board draws them now
		type: 'heldTabletsOpened';
	};

	export type EmitterEventHeldTabletsShow = {
		// WHAT TO DRAW, decided by MysteryReveal rather than by this component.
		//
		// It used to read the reveal event itself, which meant it applied this
		// spin's multipliers the instant the event arrived — before the seals had
		// broken and before the wheels had rolled to those very values. The reveal
		// owns the order of that sequence, so it owns what is on screen at each
		// step of it.
		type: 'heldTabletsShow';
		symbol: SymbolName;
		cells: { reel: number; row: number; mult: number }[];
	};
</script>

<script lang="ts">
	/**
	 * Held tablets, drawn OVER the reels while they are turning.
	 *
	 * THE PROBLEM THIS SOLVES
	 *
	 * A cell the run has opened is fixed for the rest of the round — the maths
	 * stamps the run's seal into it before the lines are read, every spin. But
	 * the client's reels do not know that. Every free spin, a held cell spun with
	 * the rest of its reel, blurred past a dozen unrelated symbols, stopped on
	 * whatever the strip drew, and only THEN snapped back to the seal when the
	 * mysteryReveal event landed.
	 *
	 * So the one thing the feature is about — the board filling up with a symbol
	 * that stays — was invisible while the board was moving, which is most of the
	 * time the player is looking at it. It read as "nothing is sticky", which is
	 * exactly what it was reported as.
	 *
	 * WHAT THIS DOES
	 *
	 * Holds the last mysteryReveal's `held` snapshot and draws each of those cells
	 * on top of the board, at rest. The symbol art is opaque and fills its cell,
	 * so it occludes whatever the reel is doing behind it without needing a plate
	 * of its own — the cell simply never moves, ever.
	 *
	 * ALWAYS ON, NOT ONLY WHILE THE REELS TURN.
	 *
	 * The first pass drew these only while a reel was in motion, on the argument
	 * that once it stopped the board's own symbol was correct and could take over.
	 * It is not correct yet at that moment, and that is the whole problem: the
	 * spin promise resolves when the reels land, and the mysteryReveal event that
	 * stamps the held cells is the NEXT book event, handled after it. Between the
	 * two the board is showing whatever the strip drew in those cells, so every
	 * single spin ended with the held tablets flashing back to random symbols
	 * before snapping into place.
	 *
	 * There is no window where handing the cell back is safe, so it is never
	 * handed back — with one exception, below.
	 *
	 * THE EXCEPTION IS THE WIN ANIMATION. The win presentation animates the
	 * BOARD's symbols, so a cell that is part of a winning line has to be visible
	 * underneath. A held cell drops out of this overlay for exactly as long as its
	 * board symbol is in the `win` state, and the board is showing the same symbol
	 * by then, so nothing changes on screen when it does.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import Symbol from './Symbol.svelte';

	const context = getContext();

	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE — the same mapping
	// MysteryReveal and StickyPrizes use
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// ── A HELD CELL IS SEALED ────────────────────────────────────────────────
	//
	// These cells are drawn at rest on purpose (see above), and the side effect
	// was that the most important thing in the feature — the tablets that have
	// opened and are staying open, each carrying 2X to 50X — had nothing marking
	// them out from the ordinary symbols around them.
	//
	// So each one gets a gold frame on its cell boundary, plus a soft bed under
	// it. A FRAME rather than the corner brackets the win and the Scatter hold
	// use: those two mean "this is live", and this means the opposite — it is
	// boxed in for the rest of the run.
	//
	// STEADY, NOT BREATHING. It was a slow pulse first, and a mark that spends
	// half of its cycle dim is a mark the player has to wait for; these cells
	// need to be findable at a glance while the rest of the board is moving.
	// Nothing to animate also means no clock, so this costs nothing per frame.
	const HOLD_GOLD = 0xffd75e;

	const drawFrames = (g: PixiGraphics) => {
		g.clear();

		for (const cell of covered) {
			// ON the cell boundary, not inside it. At 0.455 the frame fell within
			// the plate art's own footprint, and the plate is opaque — so the first
			// version was drawn every frame and covered up every frame, which is why
			// it could not be seen in the game while the code looked correct.
			const half = SYMBOL_SIZE * 0.5 - 2;
			g.rect(
				getSymbolX(cell.reel) - half,
				rowCenterY(cell.row) - half,
				half * 2,
				half * 2,
			).stroke({ width: 4.5, color: HOLD_GOLD, alpha: 0.92 });
			// a paler line just outside it: one line alone reads as a border, two
			// read as gilding — the same pair the buy cards and the symbol plates use
			g.rect(
				getSymbolX(cell.reel) - half - 4,
				rowCenterY(cell.row) - half - 4,
				(half + 4) * 2,
				(half + 4) * 2,
			).stroke({ width: 1.4, color: 0xfff3bd, alpha: 0.38 });
		}
	};

	type Held = { reel: number; row: number; symbol: SymbolName; mult: number };
	let held = $state<Held[]>([]);
	// keys of cells whose seal has not finished breaking yet
	let pending = $state(new Set<string>());

	// The hold belongs to one run. Cleared on the way out rather than on a
	// dedicated event so a round that ends any way at all — the last spin, a
	// wincap, a resumed bet that lands back in the base game — cannot leave a
	// tablet from a finished feature painted over a fresh board.
	$effect(() => {
		if (context.stateGame.gameType !== 'freegame' && held.length) held = [];
	});

	// Everything held, minus whatever is currently playing its win animation on
	// the board underneath.
	const covered = $derived.by(() => {
		const board = context.stateGame.board;
		return held.filter(
			(cell) =>
				!pending.has(`${cell.reel},${cell.row}`) &&
				board[cell.reel]?.reelState.symbols[cell.row]?.symbolState !== 'win',
		);
	});

	context.eventEmitter.subscribeOnMount({
		heldTabletsPending: ({ positions }) => {
			pending = new Set(positions.map((position) => `${position.reel},${position.row}`));
		},
		// Raised when the last seal has finished breaking: from here the board is
		// showing those cells itself, so the overlay takes them back over.
		heldTabletsOpened: () => (pending = new Set()),
		// The whole snapshot, every time — the reveal sends it in full precisely so
		// a client can rebuild cells it never saw open.
		heldTabletsShow: ({ symbol, cells }) => {
			held = cells.map((cell) => ({
				reel: cell.reel,
				row: cell.row,
				symbol,
				mult: cell.mult,
			}));
		},
	});
</script>

<BoardContainer>
	<!-- a soft bed under the plates, so the frame has something to sit on -->
	{#each covered as cell (`${cell.reel},${cell.row}`)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={getSymbolX(cell.reel)}
			y={rowCenterY(cell.row)}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 1.35}
			tint={HOLD_GOLD}
			blendMode="add"
			alpha={0.22}
		/>
	{/each}

	{#each covered as cell (`${cell.reel},${cell.row}`)}
		<Container>
			<!--
				Drawn through Symbol so a held cell is the same component the board
				draws for it: same art, same multiplier badge, same position. Anything
				hand-rolled here would be a second place for the held cell's
				appearance to be defined, and the two would drift.
			-->
			<Symbol
				x={getSymbolX(cell.reel)}
				y={rowCenterY(cell.row)}
				state="postWinStatic"
				rawSymbol={{ name: cell.symbol, multiplier: cell.mult }}
			/>
		</Container>
	{/each}

	<!-- and the frame that says it is sealed, over them -->
	<Container zIndex={5}>
		<Graphics draw={drawFrames} />
	</Container>
</BoardContainer>
