<script lang="ts" module>
 import type {WinLevelData} from '../game/winLevelMap';
 export type EmitterEventFreeSpinOutro={type:'freeSpinOutroShow'}|{type:'freeSpinOutroHide'}|{type:'freeSpinOutroCountUp';amount:number;winLevelData:WinLevelData};
</script>
<script lang="ts">
 import {FadeContainer} from 'components-pixi';import {CanvasSizeRectangle} from 'components-layout';
 import {Text} from 'pixi-svelte';import {waitForResolve} from 'utils-shared/wait';import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {getContext} from '../game/context';import {GAME_FONT} from '../game/fonts';import {gameText} from '../game/i18nText';
 import FreeSpinAnimation from './FreeSpinAnimation.svelte';import PressToContinue from './PressToContinue.svelte';
 const context=getContext();let show=$state(false),amount=$state(0),done=$state(()=>{});
 context.eventEmitter.subscribeOnMount({freeSpinOutroShow:()=>show=true,freeSpinOutroHide:()=>show=false,freeSpinOutroCountUp:async e=>{amount=e.amount;await waitForResolve(resolve=>done=resolve);}});
</script>
<FadeContainer {show}><CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={.5}/>
 <FreeSpinAnimation>{#snippet children({sizes})}<Text anchor={.5} y={-60} text={gameText('totalWin')} style={{fontFamily:GAME_FONT,fontSize:34,fill:0xf2c14e}}/><Text anchor={.5} y={35} text={bookEventAmountToCurrencyString(amount)} style={{fontFamily:GAME_FONT,fontSize:60,fill:0xffffff}}/>{/snippet}</FreeSpinAnimation>
 <PressToContinue onpress={()=>done()}/>
</FadeContainer>
