<script lang="ts">
 import {Container,Sprite,Graphics,Text} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import type {FeatureTier} from '../game/featureTiers';
 import FeatureSplashPanel from './FeatureSplashPanel.svelte';
 import TreasureFigure from './TreasureFigure.svelte';
 let {width,height,tier,header,sequence=0}:{width:number;height:number;tier:FeatureTier;header:string;sequence?:number}=$props();
 const portrait=$derived(width/height<.85);
 const sceneWidth=$derived(portrait?670:1160),sceneHeight=$derived(portrait?900:780);
 const scale=$derived(Math.min(width/sceneWidth,height/sceneHeight));
 const panelX=$derived(portrait?335:370);
 const shade=(g:PixiGraphics)=>{g.clear();g.rect(0,0,width,height).fill({color:0x163f49,alpha:.28});};
</script>
<Sprite key="hmBgFeature" {width} {height}/>
<Graphics draw={shade}/>
<Container x={(width-sceneWidth*scale)/2} y={(height-sceneHeight*scale)/2} {scale}>
 <Text text={tier.title} x={panelX} y={portrait?70:157} anchor={.5} style={{fontFamily:'Titan One',fontSize:portrait?46:50,fill:0xffedb2,stroke:{color:0x274c52,width:5}}}/>
 <Container x={panelX}>
  <FeatureSplashPanel {tier} width={portrait?550:570} centerY={portrait?303:390} minHeight={180} {header}/>
 </Container>
 <TreasureFigure who="lifeguard" x={portrait?205:730} y={portrait?480:144} height={portrait?360:575} cue="welcome" {sequence}/>
</Container>
