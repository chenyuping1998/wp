<script lang="ts" module>
	import type { RevealBar } from '../game/typesBookEvent';

	export type EmitterEventBlocks =
		/** the settled board's wide reels: draw every block of 2x2 and up as one symbol */
		| { type: 'blocksSet'; bars: RevealBar[] }
		/** swap block art after the conversion reveal (WILD cards) */
		| { type: 'blocksSwap'; bars: RevealBar[] }
		/**
		 * The next spin is starting: the blocks stay drawn and ride the reel strip
		 * off the board in one piece, then disappear on their own (抄錄 §3.2 "下一手
		 * 開轉時大格被整塊推走").
		 */
		| { type: 'blocksLeave' }
		| { type: 'blocksClear' };
</script>

<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, symbolInfoOf } from '../game/constants';
	import type { RawSymbol } from '../game/types';

	const context = getContext();

	type ReelSymbolRef = (typeof context.stateGame.board)[number]['reelState']['symbols'][number];

	type Block = {
		key: string;
		reel: number;
		/** top row, may be negative when cut by the board's top edge */
		row: number;
		size: number;
		symbol: RawSymbol;
		/**
		 * While leaving: one landed cell of the block on its first reel, and where
		 * that cell sat when the spin started. The block moves exactly as that
		 * cell moves, and is gone once the strip no longer carries it.
		 */
		anchor?: { symbol: ReelSymbolRef; y0: number };
	};

	let blocks = $state<Block[]>([]);
	let show = $state(false);

	// A 2x2 block in the reveal is `size` x `size` cells of the same symbol; the
	// reel engine has already landed those cells one by one. This layer draws the
	// block as ONE symbol over them, with an opaque backing so the repeated small
	// art underneath cannot show through the big art's transparency.
	const toBlocks = (bars: RevealBar[]): Block[] => {
		const out: Block[] = [];
		for (const bar of bars) {
			if (bar.size < 2) continue;
			bar.symbols.forEach((symbol, k) => {
				const row = k * bar.size - bar.offset;
				// a block entirely above the board is never drawn
				if (row + bar.size <= 0 || row >= BOARD_DIMENSIONS.y) return;
				out.push({ key: `${bar.reel}:${row}:${bar.size}`, reel: bar.reel, row, size: bar.size, symbol });
			});
		}
		return out;
	};

	const assetKeyOf = (symbol: RawSymbol) => symbolInfoOf(symbol).static.assetKey;
	// a big WILD overflows its block a little, like the 1x1 WILD overflows its cell
	const fitOf = (symbol: RawSymbol) => (symbol.name === 'W' ? 1.03 : 0.985);

	const reelsAtRest = (list: Block[]) =>
		list.every((block) =>
			Array.from({ length: block.size }, (_, k) => context.stateGame.board[block.reel + k]).every(
				(reel) => !reel || reel.reelState.motion === 'stopped',
			),
		);

	/**
	 * Pin every block to the landed cell under its first visible row. A settled
	 * reel holds exactly the board, top row first, so the cell is
	 * `symbols[row]`. Only valid while the reels are still at rest — once the
	 * strip has been rebuilt for the spin the indices no longer mean rows.
	 */
	const anchorBlocks = (list: Block[]): Block[] | null => {
		if (!reelsAtRest(list)) return null;
		const out: Block[] = [];
		for (const block of list) {
			const symbols = context.stateGame.board[block.reel]?.reelState.symbols ?? [];
			const symbol = symbols[Math.max(0, block.row)];
			if (!symbol) return null;
			out.push({ ...block, anchor: { symbol, y0: symbol.symbolY() } });
		}
		return out;
	};

	/** How far the block's cell has travelled, or null once it has left the strip. */
	const offsetOf = (block: Block): number | null => {
		if (!block.anchor) return 0;
		const reel = context.stateGame.board[block.reel];
		if (!reel || !reel.reelState.symbols.includes(block.anchor.symbol)) return null;
		const dy = block.anchor.symbol.symbolY() - block.anchor.y0;
		// fully below the board: nothing left to draw
		if ((block.row + 0) * SYMBOL_SIZE + dy >= BOARD_DIMENSIONS.y * SYMBOL_SIZE) return null;
		return dy;
	};

	const leaving = $derived(blocks.some((block) => block.anchor));

	context.eventEmitter.subscribeOnMount({
		blocksSet: ({ bars }) => {
			blocks = toBlocks(bars);
			show = true;
		},
		blocksSwap: ({ bars }) => {
			blocks = toBlocks(bars);
		},
		blocksLeave: () => {
			if (!show || blocks.length === 0 || leaving) return;
			const anchored = anchorBlocks(blocks);
			if (anchored) {
				blocks = anchored;
			} else {
				// the strip is already moving (a resumed round, a feature spin that
				// started without a press): nothing to follow, so just go
				show = false;
				blocks = [];
			}
		},
		blocksClear: () => {
			show = false;
			blocks = [];
		},
	});
</script>

<!-- Always mounted, shown by `visible`: an {#if} here re-attached the layer
     as the parent's LAST child every time blocks appeared, which put it above
     WildTransfer — the conversion fog never covered a 2x2 person. -->
<BoardContainer>
		<Container visible={show}>
			<BoardMask />
		{#each blocks as block (block.key)}
			{@const dy = offsetOf(block)}
			{#if dy !== null}
				{@const span = block.size * SYMBOL_SIZE}
				<!-- while leaving, the part that was cut off by the board's top edge
				     slides into view with the rest of the block, so back all of it -->
				{@const visibleTop = (block.anchor ? block.row : Math.max(0, block.row)) * SYMBOL_SIZE}
				{@const visibleBottom = (block.anchor ? block.row + block.size : Math.min(BOARD_DIMENSIONS.y, block.row + block.size)) * SYMBOL_SIZE}
				<Container x={block.reel * SYMBOL_SIZE} y={visibleTop + dy}>
					<!-- opaque backing clipped to the visible part of the block; the card
					     art carries its own frame, the same one the 1x1 cards have -->
					<Rectangle width={span} height={visibleBottom - visibleTop} backgroundColor={0x2a2430} />
				</Container>
				<Container x={block.reel * SYMBOL_SIZE} y={block.row * SYMBOL_SIZE + dy}>
					<Sprite
						key={assetKeyOf(block.symbol)}
						anchor={0.5}
						x={span * 0.5}
						y={span * 0.5}
						width={span * fitOf(block.symbol)}
						height={span * fitOf(block.symbol)}
					/>
				</Container>
			{/if}
		{/each}
		</Container>
</BoardContainer>
