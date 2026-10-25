<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
import {Text,Sprite} from 'pixi-svelte';
import {GAME_FONT} from '../game/fonts';
	import SymbolWinAnim from './SymbolMeshWin.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';

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

{#if props.state === 'explosion'}
	<!-- Crumble owns the stone fragments; never play the template explosion. -->
{:else if isSprite && isWin}
	<!-- Individual symbol acting, followed by shared petrification/fracture. -->
	<SymbolWinAnim
		{symbolInfo}
		name={props.rawSymbol.name}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{:else if props.rawSymbol.name==='W'}
<Sprite key={'art_stamp_x'+(props.rawSymbol.multiplier??2)} anchor={.5} x={props.x} y={props.y} width={84} height={84}/>
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
		showWinFrame={props.state === 'win' && props.rawSymbol.name !== 'S'}
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

{#if props.rawSymbol.name === 'W' && props.state !== 'explosion'}
<Text text={'×'+(props.rawSymbol.multiplier??1)} x={props.x} y={(props.y??0)+18} anchor={0.5} style={{fontFamily:GAME_FONT,fontSize:18,fill:0x281c20,stroke:{color:0xffe6a0,width:2}}} />
{/if}

<!-- Nothing is drawn over a symbol here: the win amount sits at the group's
     centre (ScatterWins) and Medusa's multiplier lands once per spin
     (MedusaThrow). Printing anything on the symbol would compete with both. -->
