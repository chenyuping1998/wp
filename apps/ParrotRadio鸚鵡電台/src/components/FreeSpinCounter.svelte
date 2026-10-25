<script lang="ts" module>
 export type EmitterEventFreeSpinCounter={type:'freeSpinCounterShow'}|{type:'freeSpinCounterHide'}|{type:'freeSpinCounterUpdate';current?:number;total?:number};
</script>
<script lang="ts">
 import {Text} from 'pixi-svelte';import BoardContainer from './BoardContainer.svelte';import {getContext} from '../game/context';import {BOARD_SIZES} from '../game/constants';import {gameText} from '../game/i18nText';
 const context=getContext();let show=$state(false),current=$state(1),total=$state(0);
 context.eventEmitter.subscribeOnMount({freeSpinCounterShow:()=>show=true,freeSpinCounterHide:()=>show=false,freeSpinCounterUpdate:e=>{if(e.current!==undefined)current=e.current;if(e.total!==undefined)total=e.total;}});
</script>
{#if show}<BoardContainer><Text anchor={.5} x={BOARD_SIZES.width*.5} y={BOARD_SIZES.height+33} text={`${gameText('freeSpins')} ${current}/${total}`} style={{fontFamily:'Arial',fontSize:24,fill:0xffffff}}/></BoardContainer>{/if}
