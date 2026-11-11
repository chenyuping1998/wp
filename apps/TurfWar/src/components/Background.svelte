<script lang="ts">
 import { Sprite, Rectangle } from 'pixi-svelte';
 import { FadeContainer } from 'components-pixi';
 import { getContext } from '../game/context';
 import StreetLife from './StreetLife.svelte';
 const context = getContext();
 const mode = $derived(context.stateGame.gameType === 'basegame' ? 'base' : context.stateGame.bonusTier === 'don' ? 'epic' : 'feature');
 const scene = $derived.by(() => {
  const {width,height}=context.stateLayoutDerived.canvasSizes();
  const scale=Math.max(width/1920,height/1080)*1.02;
  const w=1920*scale,h=1080*scale;
  return {width:w,height:h,x:(width-w)/2,y:(height-h)/2};
 });
</script>
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0xd8d6d1} zIndex={-3} />
<FadeContainer show={mode==='base'} duration={450} zIndex={-2}><Sprite key="hmBgBase" {...scene} /></FadeContainer>
<FadeContainer show={mode==='feature'} duration={450} zIndex={-2}><Sprite key="hmBgFeature" {...scene} /></FadeContainer>
<FadeContainer show={mode==='epic'} duration={450} zIndex={-2}><Sprite key="hmBgEpic" {...scene} /></FadeContainer>
<StreetLife {scene} {mode} />
