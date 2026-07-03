<script lang="ts" module>
	export type EmitterEventStickyPrizes =
		| { type: 'stickyPrizesNew'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesCelebrate'; wins: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesRestore'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesClear' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { BitmapText, Graphics, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type PrizeEntry = {
		reel: number;
		row: number;
		prize: number;
		scale: Tween<number>;
	};

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE (same as ExpandingWilds)
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const keyOf = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	let prizes = $state<PrizeEntry[]>([]);

	context.eventEmitter.subscribeOnMount({
		// New coins landed and stuck: pop each in with a bounce (superspin
		// "hold em" — every new coin also resets the remaining spins).
		stickyPrizesNew: async ({ prizes: incoming }) => {
			const fresh = incoming.map((p) => ({ ...p, scale: new Tween(0) }));
			prizes = [...prizes.filter((p) => !incoming.some((n) => keyOf(n) === keyOf(p))), ...fresh];
			for (const entry of fresh) {
				entry.scale.set(1, { duration: 420, easing: backOut });
				await waitForTimeout(140);
			}
			await waitForTimeout(360);
		},
		// Final tally: pulse every winning coin while the win counts up.
		stickyPrizesCelebrate: async ({ wins }) => {
			const winningKeys = new Set(wins.map(keyOf));
			for (const entry of prizes) {
				if (!winningKeys.has(keyOf(entry))) continue;
				entry.scale.set(1.35, { duration: 260, easing: cubicOut });
			}
			await waitForTimeout(420);
			for (const entry of prizes) entry.scale.set(1, { duration: 260, easing: cubicOut });
			await waitForTimeout(300);
		},
		// Bet resume: rebuild instantly, no animation.
		stickyPrizesRestore: ({ prizes: restored }) => {
			prizes = restored.map((p) => ({ ...p, scale: new Tween(1) }));
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
		<!-- opaque cell plate: the stuck coin reads as locked while reels spin behind -->
		<Graphics
			draw={(g) => {
				g.clear();
				g.beginFill(0x43101c, 0.96);
				g.drawRoundedRect(x - SYMBOL_SIZE / 2, y - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE, 12);
				g.endFill();
				g.lineStyle(3, 0xffd43b, 0.75);
				g.drawRoundedRect(
					x - SYMBOL_SIZE / 2 + 3,
					y - SYMBOL_SIZE / 2 + 3,
					SYMBOL_SIZE - 6,
					SYMBOL_SIZE - 6,
					10,
				);
			}}
		/>
		<Sprite
			key="gbP"
			anchor={0.5}
			{x}
			{y}
			width={SYMBOL_SIZE * entry.scale.current}
			height={SYMBOL_SIZE * entry.scale.current}
		/>
		<BitmapText
			anchor={0.5}
			{x}
			y={y + SYMBOL_SIZE * 0.08}
			scale={entry.scale.current}
			text={bookEventAmountToCurrencyString(entry.prize)}
			style={{ fontFamily: 'gold', fontSize: 30 }}
		/>
	{/each}
</BoardContainer>
