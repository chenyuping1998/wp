<script lang="ts" module>
	export type EmitterEventExpandingWilds =
		| { type: 'expandingWildNew'; reel: number; row: number; mult: number }
		| { type: 'expandingWildsUpdate'; wilds: { reel: number; row: number; mult: number }[] }
		| { type: 'expandingWildsRestore'; wilds: { reel: number; mult: number }[] }
		| { type: 'expandingWildsClear' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { BitmapText, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type WildEntry = {
		reel: number;
		mult: number;
		phase: 'grow' | 'idle';
		y: Tween<number>;
		badgeScale: Tween<number>;
		oncomplete?: () => void;
	};

	const context = getContext();
	const REEL_CENTER_Y = BOARD_SIZES.height / 2;
	// visible padded row r sits at reelY(-SYMBOL_SIZE) + (r + 0.5) * SYMBOL_SIZE
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	let wilds = $state<WildEntry[]>([]);

	context.eventEmitter.subscribeOnMount({
		// A Wild landed in the free game: the monkey twirls a giant banana and expands to
		// fill the reel. Resolves when the grow spine animation completes.
		expandingWildNew: async ({ reel, row, mult }) => {
			const entry: WildEntry = {
				reel,
				mult,
				phase: 'grow',
				y: new Tween(rowCenterY(row)),
				badgeScale: new Tween(0),
			};
			wilds = [...wilds.filter((wild) => wild.reel !== reel), entry];
			// drift from the landing row to the reel center while the twirl grows him
			entry.y.set(REEL_CENTER_Y, { duration: 1150, delay: 320, easing: cubicOut });
			await waitForResolve((resolve) => (entry.oncomplete = resolve));
			entry.phase = 'idle';
			entry.badgeScale.set(1, { duration: 320, easing: backOut });
		},
		// Sticky wilds get a fresh multiplier on each reveal — pulse the badge.
		expandingWildsUpdate: async ({ wilds: updated }) => {
			let touched = false;
			for (const update of updated) {
				const entry = wilds.find((wild) => wild.reel === update.reel);
				if (!entry) continue;
				entry.mult = update.mult;
				entry.badgeScale.set(1.7, { duration: 220, easing: cubicOut });
				touched = true;
			}
			if (!touched) return;
			await waitForTimeout(320);
			for (const entry of wilds) entry.badgeScale.set(1, { duration: 220, easing: cubicOut });
			await waitForTimeout(240);
		},
		// Bet resume: rebuild sticky wilds instantly, no animation.
		expandingWildsRestore: ({ wilds: restored }) => {
			wilds = restored.map((wild) => ({
				reel: wild.reel,
				mult: wild.mult,
				phase: 'idle' as const,
				y: new Tween(REEL_CENTER_Y),
				badgeScale: new Tween(1),
			}));
		},
		expandingWildsClear: () => {
			wilds = [];
		},
		// A win line crossing a sticky reel: pulse that wild so the locked reel
		// still reads as participating in the win.
		winLinesShow: ({ wins }) => {
			if (wilds.length === 0) return;
			const winningReels = new Set(wins.flatMap((win) => win.positions.map((p) => p.reel)));
			for (const entry of wilds) {
				if (entry.phase !== 'idle' || !winningReels.has(entry.reel)) continue;
				entry.badgeScale.set(1.45, { duration: 200, easing: cubicOut }).then(() => {
					entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
				});
			}
		},
	});
</script>

<BoardContainer>
	{#each wilds as wild (wild.reel)}
		<!-- opaque reel-takeover backdrop: the sticky reel reads as locked, and
		     the symbols (and their mult texts) spinning behind stay hidden -->
		{#if wild.phase === 'idle'}
			<Graphics
				draw={(g) => {
					const x = getSymbolX(wild.reel);
					g.clear();
					g.beginFill(0x43101c, 0.96);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height, 14);
					g.endFill();
					g.beginFill(0x571523, 0.9);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 6, 6, SYMBOL_SIZE - 12, BOARD_SIZES.height - 12, 10);
					g.endFill();
					g.lineStyle(3, 0xffd43b, 0.75);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 3, 3, SYMBOL_SIZE - 6, BOARD_SIZES.height - 6, 12);
				}}
			/>
		{/if}
		<SpineProvider
			key="gbSpWx"
			x={getSymbolX(wild.reel)}
			y={wild.y.current}
			width={SYMBOL_SIZE}
			height={BOARD_SIZES.height}
		>
			<SpineTrack
				trackIndex={0}
				animationName={wild.phase === 'grow' ? 'grow' : 'idle'}
				loop={wild.phase === 'idle'}
				listener={{
					complete: (entry) => {
						if (entry.animation?.name === 'grow') wild.oncomplete?.();
					},
				}}
			/>
		</SpineProvider>
		{#if wild.phase === 'idle'}
			<BitmapText
				anchor={0.5}
				x={getSymbolX(wild.reel)}
				y={BOARD_SIZES.height - SYMBOL_SIZE * 0.42}
				scale={wild.badgeScale.current}
				text={`${wild.mult}X`}
				style={{ fontFamily: 'gold', fontSize: 52 }}
			/>
		{/if}
	{/each}
</BoardContainer>
