<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import { reelYOffset, BASE_ROWS, unmarkSymbolName } from '../game/constants';
	import { stateGame, stateGameDerived, type ReelSymbol } from '../game/stateGame.svelte';
	import { MESH_WINS } from '../game/meshWin';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	// A held hold-and-spin coin is drawn by the StickyPrizes overlay, but the math
	// also leaves it on the board, so the reel carries its own copy of the same
	// coin. That copy was the "ghost" appearing just under a held coin when the
	// reel stopped: the stop bounces the strip 0.3 of a cell past its resting
	// place (reelBounceSizeMulti), which pushes the coin below the one-cell
	// occluder and into view.
	//
	// At rest a symbol's index equals its row, so the duplicate can be dropped
	// once the reel is no longer spinning. Two deliberate exclusions:
	//   · while spinning, indices track scrolling symbols, so hiding one would
	//     punch a hole travelling down the reel
	//   · a symbol in the 'win' state must stay mounted — its oncomplete is what
	//     resolves the win animation, and an unmounted symbol would never fire it
	// Reel speed as a 0..1 blur amount. 'bouncing' is the overshoot-and-settle at
	// the end of a stop: the strip is still moving but far slower, and carrying
	// full-speed blur through it made the symbols snap from heavily smeared to
	// perfectly sharp in a single frame.
	const reelMotion = $derived(stateGame.board[props.reelIndex]?.reelState.motion);
	const blur = $derived(reelMotion === 'spinning' ? 1 : reelMotion === 'bouncing' ? 0.3 : 0);

	// Landing weight by tier. The Scatter and the Wild are the two symbols a
	// player is looking for, so they hit hardest; the card royals make up most of
	// every board and land lightest, which stops the whole grid bouncing as one.
	const LANDING_IMPACT: Record<string, number> = {
		S: 1.25,
		W: 1.2,
		M: 1.15,
		X: 1.15,
		H1: 1,
		H2: 1,
		H3: 0.95,
		H4: 0.95,
		L1: 0.7,
		L2: 0.7,
		L3: 0.7,
		L4: 0.7,
		L5: 0.7,
	};
	// The Scatter lands HARDER with every one the spin has shown — the tease
	// builds with the sound, which already climbs a step per Scatter. The
	// counter is bumped in the same pass that sets 'land', so it already includes
	// this one: 1 -> 1.1, 2 -> 1.25, 3 -> 1.4, 4+ -> 1.6 (the mesh gate checks
	// every landing up to 1.6). SymbolMeshWin reads it once, at mount.
	const landingImpact = $derived(
		props.reelSymbol.rawSymbol.name === 'S'
			? Math.min(1.6, 0.95 + 0.15 * stateGameDerived.scatterLandIndex())
			: (LANDING_IMPACT[unmarkSymbolName(props.reelSymbol.rawSymbol.name)] ?? 0.9),
	);

	// Built by a function so `forState` is a real argument — a plain value copied
	// at call time — rather than a reference into the template's reactive scope.
	// The version this replaced read a {@const}, which is recomputed whenever
	// symbolState changes, so the guard was comparing the state with itself and
	// never rejected anything. SymbolSprite now cancels at the source as well;
	// this stays as the second line of defence.
	const makeOnComplete = (forState: SymbolState) => () => {
		// a completion from a presentation the symbol has already left
		if (props.reelSymbol.symbolState !== forState) return;
		if (forState === 'win') props.reelSymbol.oncomplete();
		if (forState === 'land') props.reelSymbol.symbolState = 'static';
	};

	// A mesh win draws on the board's UNMASKED layer (BoardContext animate): its
	// flash and light sweep are additive, and inside the reel mask additive light
	// has nothing to add to; its pop may also leave the cell.
	// this cell is the one doing its idle beat (IdleActors)
	const isIdleActing = $derived(
		(props.reelSymbol.symbolState === 'static' || props.reelSymbol.symbolState === 'postWinStatic') &&
			stateGame.idleActor?.reel === props.reelIndex &&
			stateGame.idleActor?.row === props.reelSymbol.symbolIndex,
	);

	// a landed Scatter while another reel is teasing (Symbol.svelte isMeshTease)
	const isTeasing = $derived(
		(props.reelSymbol.symbolState === 'static' || props.reelSymbol.symbolState === 'postWinStatic') &&
			unmarkSymbolName(props.reelSymbol.rawSymbol.name) === 'S' &&
			stateGame.board.some((r) => r.reelState.anticipating),
	);

	const isMeshWin = $derived(
		props.reelSymbol.symbolState === 'win' && unmarkSymbolName(props.reelSymbol.rawSymbol.name) in MESH_WINS,
	);

	const isHeldDuplicate = $derived(
		props.reelSymbol.symbolState !== 'win' &&
			stateGame.board[props.reelIndex]?.reelState.motion !== 'spinning' &&
			stateGame.stickyPrizes.some(
				(prize) => prize.reel === props.reelIndex && prize.row === props.reelSymbol.symbolIndex,
			),
	);
</script>

{#if !isHeldDuplicate}
	<!-- see makeOnComplete, and SymbolSprite's destroyed guard, for why a
	     completion has to be pinned to the presentation that produced it -->
	{@const oncomplete = makeOnComplete(props.reelSymbol.symbolState)}
	<!--
		Reels stand on a shared BOTTOM edge inside a box that is always six rows
		tall, so a short reel is pushed DOWN by the rows it is missing. utils-slots
		lays every reel out from the top of its own strip and knows nothing about
		the box, which is why the offset is applied here rather than in the reel.

		The skyline this produces — stepping down from reel 1, because growth is
		left to right and depth first — is the game's progress meter. It is the
		reason there is no counter UI.
	-->
	{@const rows = stateGame.growRows[props.reelIndex] ?? BASE_ROWS}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY() + reelYOffset(rows)}
		windowTop={reelYOffset(rows)}
		windowRows={rows}
		animating={(symbolInfo.type === 'spine' &&
			(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')) ||
			isMeshWin ||
			isIdleActing ||
			isTeasing}
	>
		<Symbol
			reelIndex={props.reelIndex}
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			{blur}
			impact={landingImpact}
			idleActing={isIdleActing}
			teasing={isTeasing}
			winKind={stateGame.winKinds[`${props.reelIndex},${props.reelSymbol.symbolIndex}`]}
			{oncomplete}
		/>
	</SymbolWrap>
{/if}
