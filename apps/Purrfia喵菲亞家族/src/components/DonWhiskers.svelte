<script lang="ts">
 import {Container,Graphics,Text} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';
 import {BOARD_SIZES} from '../game/constants';
 const context=getContext();
 const layout=$derived(context.stateGameDerived.boardLayout());
 const portrait=$derived(context.stateLayoutDerived.mainLayout().width<context.stateLayoutDerived.mainLayout().height);
 const scale=$derived(portrait?.48:.65);
 const pose=$derived(context.stateGame.bossPose);
</script>
<Container x={portrait?layout.x+layout.width*.30:layout.x+layout.width*.73} y={portrait?layout.y-layout.height*.63:layout.y+layout.height*.12} {scale}>
 <Graphics draw={g=>{g.clear();g.roundRect(-90,15,180,160,30).fill(0x6a1a22);g.ellipse(0,54,66,85).fill(0x3a3a42);g.poly([-60,-65,-55,-118,-19,-89]).fill(0xf4f1ea);g.poly([60,-65,55,-118,19,-89]).fill(0xf4f1ea);g.ellipse(0,-52,76,66).fill(0xf4f1ea);g.ellipse(-25,-57,13,8).fill(0xf2c14e);g.ellipse(25,-57,13,8).fill(0xf2c14e);g.circle(26,-58,22).stroke({color:0xf2c14e,width:5});g.circle(0,-33,6).fill(0xe8a0a8);g.poly([-10,15,10,15,7,71,0,80,-7,71]).fill(0x8e1f2f);g.ellipse(pose==='idle'?-55:25,pose==='monocle'?-45:pose==='stamp'?-4:88,20,13).fill(0xf4f1ea);}} />
 <Text text="DON WHISKERS" y={195} anchor={0.5} style={{fontFamily:GAME_FONT,fontSize:18,fill:0xf2c14e}} />
</Container>
