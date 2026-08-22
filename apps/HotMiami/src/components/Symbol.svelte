<script lang="ts">
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, isBigPrize, BIG_PRIZE_FILL, BIG_PRIZE_STROKE } from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
		// anticipation lift, while this symbol's reel is being teased
		focus?: { scale: number; bloom: number };
		// board position, for the idle breath's per-cell phase
		cell?: { reel: number; row: number };
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
</script>

{#if isSprite && isWin}
	<!-- Win state for sprite symbols: programmatic scale+glow animation -->
	<SymbolWinAnim
		{symbolInfo}
		symbolName={props.rawSymbol.name}
		cell={props.cell}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{:else if isSprite}
	<SymbolSprite
		{symbolInfo}
		symbolName={props.rawSymbol.name}
		x={props.x}
		y={props.y}
		blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
		landing={props.state === 'land'}
		impact={props.impact}
		focus={props.focus}
		cell={props.cell}
		oncomplete={props.oncomplete}
	/>
{/if}

<!--
	There is no Spine branch any more.

	Every entry in SYMBOL_INFO_MAP is built by `spriteSymbol`, so `symbolInfo.type`
	is always 'sprite' and the `{:else}` that used to sit here was unreachable —
	`SymbolSpine.svelte` never rendered. That mattered because it was the only
	consumer of the `anticipation` Spine, and that file shipped with

	    "audio": "D:/BigTech Media Dropbox/Kevin Tran/BigTech Media/WickedGames/
	              Kick/0007_MiningMayhem_by_KICK/Assets/Animation/Anticipation/img"

	baked into its skeleton — another studio's Dropbox path, a named person, and
	another game's title, inside our submission bundle, preloaded by every player
	and drawn for none of them. Stake's approval guidelines make asset IP grounds
	for rejection, so a dead reference is not harmless: what ships is what a
	reviewer can open.

	The win presentation is SymbolWinAnim (drawn brackets), which is what actually
	runs. `props.loop` is kept on the Props type because Board passes it.
-->


<!-- NOTE: W symbols carry a `multiplier` attribute from the math (always 1 in
     the base game; 2x-50x in the free game). It is deliberately NOT drawn on
     the symbol — the free-game value is already presented by the expanded
     reel's multiplier badge in ExpandingWilds.svelte. -->

{#if props.rawSymbol.prize}
	<!--
		Superspin coin value. This is the copy drawn on the reel as a coin lands;
		StickyPrizes draws the held ones. Both have to grade identically or a coin
		would change colour the instant it sticks — the previous pass only updated
		StickyPrizes, so high-value coins landed in plain gold and only turned
		amber a beat later.
	-->
	<GoldText
		x={props.x ?? 0}
		y={props.y ?? 0}
		text={bookEventAmountToCurrencyString(props.rawSymbol.prize)}
		fontSize={28}
		maxWidth={SYMBOL_SIZE * 0.86}
		fill={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_FILL : undefined}
		stroke={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_STROKE : undefined}
	/>
{/if}
