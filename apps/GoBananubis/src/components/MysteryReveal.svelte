<script lang="ts" module>
	import type { SymbolName, Position } from '../game/types';

	export type EmitterEventMysteryReveal = {
		type: 'mysteryReveal';
		held: (Position & { mult: number })[];
		// SymbolName, not string. It is what gets written into rawSymbol.name, and
		// SymbolName is derived from the generated config - so a symbol the maths
		// starts emitting that the client has no entry for fails here rather than
		// rendering as an empty cell.
		symbol: SymbolName;
		positions: Position[];
	};
</script>

<script lang="ts">
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';

	// The sealed tablets crack open, and every one of them is the same symbol.
	//
	// WHY THIS COMPONENT OWNS THE SWAP RATHER THAN THE BOOK HANDLER
	//
	// The maths sends two events: `reveal`, whose board still contains M, and
	// `mysteryReveal`, which says what they turned out to be. The gap between
	// them is the whole mechanic — the player has to see a sealed board before
	// it opens — so the swap is a timed animation, not a state update, and it
	// belongs next to its timing rather than in a map of book handlers.
	//
	// The board is mutated in place: reelSymbol is a $state object (see
	// utils-slots/createReelForSpinning), so assigning rawSymbol is what makes
	// the symbol on screen change. Rebuilding the board through boardSettle
	// would work too and would also restart every reel's landing animation,
	// which on a board that has already settled reads as a second spin.
	//
	// THE HOLD IS APPLIED WITHOUT ANIMATION
	//
	// `held` carries every cell the run has already opened, this spin's included,
	// each with the multiplier it shows THIS spin. The maths re-stamps both on
	// every free spin (assign_mystery_symbols), so after a fresh reveal the board
	// would otherwise show whatever the strips landed there with no value on it.
	// They are re-stamped here silently; only `positions` — the tablets that
	// cracked on THIS spin — is animated.
	//
	// The multipliers move EVERY SPIN, high and low. That is the mechanic, not a
	// glitch: a cell showing 50x can show 2x next spin. Nothing here should try
	// to smooth or animate that transition into a climb, because it is not one.
	//
	// WHY THE POSITIONS COME FROM THE EVENT
	//
	// After the swap there are no M left to find. Anything that re-scans the
	// board to work out what to animate gets an empty list on the second call
	// and, worse, gets it silently. The event's list is the only record.

	const context = getContext();

	// Long enough to register as a held beat, short enough that a quarter of
	// spins carrying one does not drag the session. Measured against the
	// mechanic's pacing budget, not picked: at the shipped reel density about
	// 28% of base spins and 30% of free spins carry a reveal
	// (games/GoBananubis/make_mystery_reels.py), so this cost is paid roughly
	// every third or fourth spin and every extra 100ms here is real.
	const HOLD_MS = 420;
	const HOLD_MS_TURBO = 140;

	context.eventEmitter.subscribeOnMount({
		mysteryReveal: async (event) => {
			if (event.positions.length === 0) return;

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });

			// TODO(art): the crack. Right now the tablets simply hold and then
			// turn over. The intended beat is the seal splitting along a jackal-eye
			// fissure with gold sand escaping, sharing the transition's puff system
			// and its gold -> sand palette. Keep whatever replaces this INSIDE the
			// hold below, so the swap still lands on the same frame it does now and
			// the win lines that follow are not pushed later.
			await waitForTimeout(
				stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS,
			);

			// The hold first, silently — see the note above.
			for (const position of event.held) {
				const reelSymbol =
					context.stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = {
					...reelSymbol.rawSymbol,
					name: event.symbol,
					multiplier: position.mult,
				};
			}

			for (const position of event.positions) {
				const reel = context.stateGame.board[position.reel];
				const reelSymbol = reel?.reelState.symbols[position.row];
				// Defensive, and the defence has a reason: a wild that expands over
				// a reel replaces that reel's symbols, and in the free game that can
				// happen between this event being queued and being applied.
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, name: event.symbol };
			}
		},
	});
</script>
