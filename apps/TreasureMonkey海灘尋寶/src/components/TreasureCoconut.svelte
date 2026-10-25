<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import TreasureAttachment from './TreasureAttachment.svelte';
 import {strawPose} from '../game/treasureObjectMotion';
 let {width,height,time,active,reduced=false,tint,alpha=1,debugBones=false}:{width:number;height:number;time:number;active:boolean;reduced?:boolean;tint?:number;alpha?:number;debugBones?:boolean}=$props();
 const pose=$derived(strawPose(time,active,reduced));
</script>
<TreasureAttachment frameKey="coconutBase" width={width*.77} height={height*.77} y={height*.055} {tint} {alpha}/>
<Graphics draw={g=>{g.clear();g.ellipse(-width*.12,height*.019,width*.025,height*.007).fill({color:0x714022,alpha:.18});}}/>
<Container>
 <Graphics isMask draw={g=>{g.clear();g.rect(-width*.7,-height*.65,width*1.4,height*.665).fill(0xffffff);}}/>
<Container x={-width*.12} y={height*.015} rotation={pose.angle} scale={{x:pose.sx,y:1}}>
 <TreasureAttachment frameKey="coconutStraw" width={width*.27} height={height*.40} anchorX={.92} anchorY={.98} {tint} {alpha}/>
 {#if debugBones}<Graphics draw={g=>{g.clear();g.moveTo(0,0).lineTo(-width*.065,-height*.30).stroke({color:0x13b9bf,width:1.2});g.circle(0,0,3).fill(0xffefb2).stroke({color:0x147b87,width:1});}}/>{/if}
</Container>
</Container>
