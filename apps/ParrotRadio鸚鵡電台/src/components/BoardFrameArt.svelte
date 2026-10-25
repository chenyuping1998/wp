<script lang="ts">
 import {Graphics,Sprite,Container} from 'pixi-svelte';
 import {BOARD_SIZES,BOARD_DIMENSIONS,SYMBOL_SIZE} from '../game/constants';
 const w=BOARD_SIZES.width,h=BOARD_SIZES.height;
 const corners=[{x:0,y:0,sx:1,sy:1},{x:w,y:0,sx:-1,sy:1},{x:0,y:h,sx:1,sy:-1},{x:w,y:h,sx:-1,sy:-1}];
</script>
<Graphics draw={g=>{g.clear();g.roundRect(-14,-14,w+28,h+28,12).fill(0x1d4557).stroke({color:0xb78b42,width:4});for(let x=0;x<BOARD_DIMENSIONS.x;x++)for(let y=0;y<BOARD_DIMENSIONS.y;y++)g.roundRect(x*SYMBOL_SIZE+2,y*SYMBOL_SIZE+2,SYMBOL_SIZE-4,SYMBOL_SIZE-4,5).fill(0x12364a).stroke({color:0x235b70,width:1});}}/>
<Sprite key="frameEdgeH" anchor={.5} x={w/2} y={-9} width={w+22} height={28}/>
<Container x={w/2} y={h+9} scale={{x:1,y:-1}}><Sprite key="frameEdgeH" anchor={.5} width={w+22} height={28}/></Container>
<Sprite key="frameEdgeV" anchor={.5} x={-9} y={h/2} width={28} height={h+22}/>
<Container x={w+9} y={h/2} scale={{x:-1,y:1}}><Sprite key="frameEdgeV" anchor={.5} width={28} height={h+22}/></Container>
{#each corners as c}<Container x={c.x} y={c.y} scale={{x:c.sx,y:c.sy}}><Sprite key="frameCorner" anchor={{x:.25,y:.25}} width={64} height={64}/></Container>{/each}
<Sprite key="mgLogo" anchor={.5} x={w/2} y={-62} width={260} height={98}/>
