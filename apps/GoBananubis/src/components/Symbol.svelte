<script lang="ts">

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, isBigPrize, BIG_PRIZE_FILL, BIG_PRIZE_STROKE } from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';
	import { Graphics } from 'pixi-svelte';
	import { drawMultiplierBadge, BADGE_W, BADGE_H } from '../game/multiplierBadge';

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
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
</script>

{#if isSprite && isWin}
	<!-- Win state for sprite symbols: programmatic scale+glow animation -->
	<SymbolWinAnim {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else if isSprite}
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
		landing={props.state === 'land'}
		impact={props.impact}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && !['S', 'M'].includes(props.rawSymbol.name)}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

<!--
	A HELD TABLET's multiplier, 2x-50x, drawn on the cell itself.

	It used to live on a badge beside the expanded wild's reel, and that component
	is gone: the multiplier moved onto the tablets, and a tablet is a single cell
	rather than a whole reel, so there is nowhere else for the number to be. Drawn
	the same way the hold-and-spin coin value is drawn below, for the same reason
	— the value belongs to the cell and has to move with it.

	Only held cells carry the attribute. Nothing else in this game sets it: the
	maths registers "multiplier" with an EMPTY symbol list, so no symbol gets one
	from its name and a plain board has none anywhere.

	It re-draws every free spin. No transition is applied on purpose — the value
	genuinely jumps, and easing between two unrelated numbers would read as a
	count rather than a re-roll.
-->
{#if props.rawSymbol.multiplier}
	<!-- the cartouche it is carved into, the same one the re-roll spins inside
	     (game/multiplierBadge.ts) — drawn here too so the value does not change
	     furniture the moment the roll hands it back to the board -->
	<Graphics
		draw={(g) => {
			g.clear();
			drawMultiplierBadge(g, {
				x: props.x ?? 0,
				y: (props.y ?? 0) + SYMBOL_SIZE * 0.3,
				width: SYMBOL_SIZE * BADGE_W,
				height: SYMBOL_SIZE * BADGE_H,
				lit: true,
			});
		}}
	/>
	<GoldText
		x={props.x ?? 0}
		y={(props.y ?? 0) + SYMBOL_SIZE * 0.3}
		text={`${props.rawSymbol.multiplier}X`}
		fontSize={26}
		maxWidth={SYMBOL_SIZE * 0.72}
	/>
{/if}

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
