<script lang="ts">
 import {Rectangle,Sprite} from 'pixi-svelte';
 import {FadeContainer} from 'components-pixi';
 import {SECOND} from 'constants-shared/time';
 import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';
 import {HOLD_AND_SPIN_MODE_KEY} from '../game/constants';
 import VoltAtmosphere from './VoltAtmosphere.svelte';
 const context=getContext();
 const hold=$derived(context.stateGame.gameType==='holdandspin'||stateBet.activeBetModeKey.toUpperCase()===HOLD_AND_SPIN_MODE_KEY);
 const base=$derived(context.stateGame.gameType==='basegame'&&!hold);
 const feature=$derived(context.stateGame.gameType==='freegame'&&!hold);
 // Clean plate and independent props share one projection, with a still camera.
 const plate=$derived({x:0,y:0,...context.stateLayoutDerived.canvasSizes()});
</script>
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x1b2430} zIndex={-3}/>
<FadeContainer show={base} duration={SECOND} zIndex={-2}>
 <Sprite key="gbBgBase" {...plate}/><VoltAtmosphere mode="base" {...plate} active={base}/>
</FadeContainer>
<FadeContainer show={feature} duration={SECOND} zIndex={-1}>
 <Sprite key="gbBgFeature" {...plate}/><VoltAtmosphere mode="feature" {...plate} active={feature}/>
</FadeContainer>
<FadeContainer show={hold} duration={SECOND} zIndex={-1}>
 <Sprite key="gbBgHoldAndSpin" {...plate}/><VoltAtmosphere mode="hold" {...plate} active={hold}/>
</FadeContainer>
