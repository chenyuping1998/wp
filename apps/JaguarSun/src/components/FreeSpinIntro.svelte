<script lang="ts" module>
export type EmitterEventFreeSpinIntro = {type:'freeSpinIntroShow'} | {type:'freeSpinIntroHide'} | {type:'freeSpinIntroUpdate';totalFreeSpins:number;extraSpins?:number};
</script>
<script lang="ts">
import { Rectangle, Text, Container } from 'pixi-svelte';
import { MainContainer } from 'components-layout';
import { getContext } from '../game/context';
import { tierByBonusTier } from '../game/featureTiers';
import PressToContinue from './PressToContinue.svelte';
const c=getContext();
let show=$state(false), spins=$state(0), extra=$state(false);
let done=()=>{};
const tier=$derived(tierByBonusTier(c.stateGame.bonusTier));
const l=$derived(c.stateLayoutDerived.mainLayout());
c.eventEmitter.subscribeOnMount({
freeSpinIntroShow:()=>{show=true;c.stateGame.featureSplashShow=true;},
freeSpinIntroHide:()=>{show=false;c.stateGame.featureSplashShow=false;},
freeSpinIntroUpdate: async (e)=>{spins=e.extraSpins??e.totalFreeSpins;extra=!!e.extraSpins;await new Promise<void>(r=>{done=r;});}
});
</script>
{#if show}
<Rectangle {...c.stateLayoutDerived.canvasSizes()} backgroundColor={0x041411} alpha={0.96}/>
<MainContainer>
<Container x={l.width/2} y={l.height/2}>
<Text anchor={0.5} y={-140} text={extra?'JOURNEY EXTENDED':tier?.title??'MIDNIGHT PASSAGE'} style={{fontFamily:'Georgia',fontSize:42,fill:0xe9c586,letterSpacing:4,align:'center',wordWrap:true,wordWrapWidth:l.width*0.85}}/>
<Text anchor={0.5} y={-40} text={`${extra?'+':''}${spins} FREE SPINS`} style={{fontFamily:'Georgia',fontSize:58,fill:0xb1ffe4}}/>
<Text anchor={0.5} y={70} text={extra?'YOUR STEAM PRESSURE IS PRESERVED':tier?.splash??''} style={{fontFamily:'Saira',fontSize:21,fill:0xe5e0d0,align:'center',wordWrap:true,wordWrapWidth:l.width*0.65}}/>
</Container>
</MainContainer>
<PressToContinue onpress={()=>done()}/>
{/if}
