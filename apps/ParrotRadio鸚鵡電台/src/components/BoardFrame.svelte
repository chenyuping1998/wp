<script lang="ts" module>
 export type EmitterEventBoardFrame={type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number};
</script>
<script lang="ts">
 import BoardFrameArt from './BoardFrameArt.svelte';
 import {Graphics,Text} from 'pixi-svelte';
 import BoardContainer from './BoardContainer.svelte';
 import {BOARD_SIZES,BOARD_DIMENSIONS,SYMBOL_SIZE,REEL_PADDING} from '../game/constants';
 import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';
 const context=getContext();
 context.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>{},boardFrameGlowHide:()=>{},boardFrameImpact:()=>{}});
</script>
<BoardContainer><BoardFrameArt/></BoardContainer>
