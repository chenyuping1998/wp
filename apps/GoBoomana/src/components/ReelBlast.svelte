<script lang="ts" module>
	export type EmitterEventReelBlast =
		| {
				type: 'reelBlast';
				reels: number[];
				symbol: SymbolName;
				level: number;
				maxLevel: number;
				/** the whole board went up — the thing the feature is a chase for */
				full: boolean;
		  }
		| { type: 'reelBlastClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import type { SymbolName } from '../game/types';

	const context = getContext();

	// THE DETONATION, IN FOUR BEATS.
	//
	// The reveal has already landed the board the reels stopped on. This turns it
	// into the board that was scored, and the order is the whole point: the player
	// must see what was there BEFORE it goes, because what was there is what
	// decides the fill symbol.
	//
	//   CHARGE    the covered reels darken under the fuse
	//   PUFF      a comic smoke cloud bursts out and covers the reel completely
	//   HOLD      fully hidden — the symbols are swapped in here, unseen
	//   DISPERSE  the cloud billows out and thins, revealing what it left behind
	//
	// The swap happens UNDER THE COVER, which is the whole reason for the cloud.
	// The previous version swapped behind a white flash, and a flash is
	// transparent for most of its life — the change was visible happening, which
	// makes it read as a graphic replacing another graphic rather than as an
	// explosion leaving something behind.
	const CHARGE_MS = 300;
	const PUFF_MS = 200;
	const HOLD_MS = 160;
	const DISPERSE_MS = 560;
	const TOTAL_MS = CHARGE_MS + PUFF_MS + HOLD_MS + DISPERSE_MS;

	// A full board is what the whole feature climbs towards, so it is held longer.
	// Not a different animation — the same one, given room.
	const FULL_BOARD_HOLD_MS = 700;

	// TURBO DOES NOT SHORTEN THIS.
	//
	// Every other part of a turbo spin is the player skipping something they have
	// already understood. This is the one moment that is not routine, and it is
	// the moment the game is named after — a detonation the player cannot see
	// happen is a detonation that did not happen. Turbo still skips the pre-spin,
	// the win-line volley and the reel wind-up, so a turbo round is still much
	// faster; it just does not take this away.

	let reels = $state<number[]>([]);
	let clock = $state(-1);
	let raf = 0;

	// A cleared blast must not be able to write to the board afterwards.
	//
	// This handler awaits across four phases and only THEN rewrites symbols. If a
	// clear lands in one of those gaps — the round ending, a resume, the next
	// spin's reveal — the promise still wakes up and fills reels on a board that
	// has moved on, stamping the previous spin's fill symbol onto the current one.
	//
	// gen-3 shipped three separate fixes for exactly this shape of bug in its
	// split animation before the cause was understood, so it is guarded here by
	// construction rather than waited for.
	let generation = 0;

	onDestroy(() => cancelAnimationFrame(raf));

	const TOP = 0;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;

	// Smoke is drawn as overlapping circles, which is what a comic explosion is.
	// The cluster is generated from the reel index rather than from Math.random,
	// so a reel's cloud is the same shape every frame of one blast — a cloud that
	// re-rolls its lumps each frame boils instead of billowing.
	const PUFFS_PER_REEL = 9;
	const puffsOf = (reel: number) =>
		Array.from({ length: PUFFS_PER_REEL }, (_, i) => {
			const seed = Math.sin(reel * 12.9898 + i * 78.233) * 43758.5453;
			const rand = seed - Math.floor(seed);
			const seed2 = Math.sin(reel * 39.3468 + i * 11.135) * 24634.6345;
			const rand2 = seed2 - Math.floor(seed2);
			return {
				// spread down the column, with the ends pulled slightly inside so the
				// cloud has a silhouette rather than square corners
				y: TOP + HEIGHT * (0.06 + 0.88 * (i / (PUFFS_PER_REEL - 1))),
				x: (rand - 0.5) * SYMBOL_SIZE * 0.5,
				// At least half a cell wide, so a single lump already spans the column
				// and the cluster cannot leave a gap down the edges for the old symbol
				// to show through — the cover has to be total or the swap is visible.
				r: SYMBOL_SIZE * (0.52 + 0.20 * rand2),
				// each lump grows at its own rate, so the cloud does not inflate as
				// one object
				lag: rand2 * 0.25,
			};
		});

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (clock < 0 || reels.length === 0) return;

		const t = clock;
		const charge = Math.min(1, t / CHARGE_MS);
		const puff = t < CHARGE_MS ? 0 : Math.min(1, (t - CHARGE_MS) / PUFF_MS);
		const disperse =
			t < CHARGE_MS + PUFF_MS + HOLD_MS
				? 0
				: Math.min(1, (t - CHARGE_MS - PUFF_MS - HOLD_MS) / DISPERSE_MS);

		for (const reel of reels) {
			const cx = getSymbolX(reel);
			const left = cx - SYMBOL_SIZE / 2;

			// The charge reads as pressure building in the rock: the column darkens
			// rather than brightening, so the cloud has somewhere to come from.
			if (charge > 0 && disperse === 0) {
				g.rect(left, TOP, SYMBOL_SIZE, HEIGHT);
				g.fill({ color: 0x140d05, alpha: 0.5 * charge });
			}

			if (puff <= 0) continue;

			for (const p of puffsOf(reel)) {
				// grow in, then keep growing as it thins — smoke does not shrink away,
				// it spreads out until it is gone
				const grow = Math.min(1, Math.max(0, (puff - p.lag) / (1 - p.lag)));
				const scale = grow * (1 + 0.45 * disperse);
				if (scale <= 0) continue;
				// drift up and outward as it clears
				const dx = p.x + (p.x >= 0 ? 1 : -1) * disperse * SYMBOL_SIZE * 0.22;
				const dy = p.y - disperse * SYMBOL_SIZE * 0.35;
				const alpha = (1 - disperse) ** 1.4;
				g.circle(cx + dx, dy, p.r * scale);
				g.fill({ color: 0x6b6055, alpha: alpha });
				// a lighter core on the upper-left of each lump, which is what makes a
				// flat circle read as a volume
				g.circle(cx + dx - p.r * scale * 0.22, dy - p.r * scale * 0.22, p.r * scale * 0.6);
				g.fill({ color: 0x9a8d7d, alpha: alpha * 0.75 });
			}
		}
	};

	/** Rewrite the covered cells. This is what actually applies the blast. */
	const fillReels = (covered: number[], symbol: SymbolName) => {
		for (const reel of covered) {
			const symbols = stateGame.board[reel]?.reelState.symbols;
			if (!symbols) continue;
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				const cell = symbols[row];
				// The scatter survives a blast in the maths, so it has to survive it
				// here too — writing over it would show the player a board the round
				// was not scored on.
				if (!cell || cell.rawSymbol?.name === 'S') continue;
				cell.rawSymbol = { ...cell.rawSymbol, name: symbol };
			}
		}
	};

	const runClock = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = now - t0;
			if (clock < TOTAL_MS) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbol, full: isFull }) => {
			const mine = ++generation;
			reels = covered;
			clock = 0;
			runClock();

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			await waitForTimeout(CHARGE_MS);

			context.eventEmitter.broadcast({
				type: 'soundOnce',
				name: isFull ? 'sfx_wild_explode' : 'sfx_multiplier_explosion_b',
			});
			// The cloud is opening. Wait for it to close over the reel before
			// touching the board.
			await waitForTimeout(PUFF_MS);
			if (mine !== generation) return;

			// Fully hidden. Swap here and the player never sees it happen.
			fillReels(covered, symbol);
			await waitForTimeout(HOLD_MS);

			await waitForTimeout(DISPERSE_MS);
			if (mine !== generation) return;
			if (isFull) await waitForTimeout(FULL_BOARD_HOLD_MS);
		},
		reelBlastClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			reels = [];
			clock = -1;
		},
	});
</script>

<BoardContainer>
	<Container>
		<Graphics {draw} />
	</Container>
</BoardContainer>
