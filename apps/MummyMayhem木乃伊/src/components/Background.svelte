<script lang="ts">
 import {Rectangle,Sprite} from 'pixi-svelte';
 import {FadeContainer} from 'components-pixi';
 import {SECOND} from 'constants-shared/time';
 import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';
 import {HOLD_AND_SPIN_MODE_KEY} from '../game/constants';
 import TombAtmosphere from './TombAtmosphere.svelte';
 import TombPlate from './TombPlate.svelte';
 const context=getContext();
 const hold=$derived(stateBet.activeBetModeKey===HOLD_AND_SPIN_MODE_KEY);
 const base=$derived(context.stateGame.gameType==='basegame'&&!hold);
 const feature=$derived(context.stateGame.gameType==='freegame'&&!hold);
 // Static cover projection: all cut parts inherit precisely the same transform.
 const plate=$derived.by(()=>{const {width,height}=context.stateLayoutDerived.canvasSizes(),s=Math.max(width/1920,height/1080);return{x:(width-1920*s)/2,y:(height-1080*s)/2,width:1920*s,height:1080*s};});
</script>
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0b0a08} zIndex={-3}/>
<FadeContainer show={base} duration={SECOND} zIndex={-2}>
 <Sprite key="gbBgBase" {...plate}/><TombAtmosphere mode="base" {...plate} active={base}/>
</FadeContainer>
<FadeContainer show={feature} duration={SECOND} zIndex={-1}>
 <TombPlate mode="feature" textureKey="gbBgFeature" {...plate} active={feature}/><TombAtmosphere mode="feature" {...plate} active={feature}/>
</FadeContainer>
<FadeContainer show={hold} duration={SECOND} zIndex={-1}>
 <TombPlate mode="hold" textureKey="gbBgHoldAndSpin" {...plate} active={hold}/><TombAtmosphere mode="hold" {...plate} active={hold}/>
</FadeContainer>
