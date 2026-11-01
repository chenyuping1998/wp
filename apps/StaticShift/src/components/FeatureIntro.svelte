<script lang="ts">
 import {Container,Sprite,Text,SpineProvider,SpineTrack} from 'pixi-svelte';
 import {MainContainer} from 'components-layout';
 import {onMount} from 'svelte';
 import {getContext} from '../game/context';
 import {GAME_FONT,BODY_FONT,NUMBER_FONT} from '../game/fonts';
 import {gameText} from '../game/i18nText';
 import config from '../game/config';
 const c=getContext();const l=$derived(c.stateLayoutDerived.mainLayout());const stacked=$derived(l.width/l.height<1.2);
 let t=$state(0);
 onMount(()=>{let id=0,start=performance.now();const tick=(now:number)=>{t=now-start;if(t<1400)id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);});
 const cards=[{title:gameText('ssAfterHours'),tag:Object.keys(config.scatterSpins).join(' / '),body:gameText('ssIntroFsBody',{spins:Object.values(config.scatterSpins).join('/')}),cast:'ssCastFG'},
 {title:gameText('ssRelayTitle'),tag:`${gameText('collect')} X${config.banditMeter.mults.at(-1)}`,body:gameText('ssRelayBody'),cast:''},
 {title:gameText('ssCapTitle'),tag:`${config.betModes.base.max_win.toLocaleString()}X`,body:gameText('ssCapBody'),cast:'ssCastMG'}];
 // fs_plate's paper is x .18–.87, y .09–.92 of the plate: centre text on the
 // paper, not the plate. Every line gets its own band so the big tag never
 // sits on the body copy and the title clears the figure's feet.
 const PAPER_X=.525;
 // shrink a line that would overrun the paper (long locales); ~0.62em per glyph
 const fit=(text:string,size:number,width:number)=>Math.min(size,width/(Math.max(...text.split('\n').map((s)=>s.length))*.62));
 const boxes=$derived(cards.map((_,i)=>stacked?{x:l.width*.12,y:l.height*(.31+i*.17),w:l.width*.76,h:l.height*.15}:{x:l.width*(.13+i*.255),y:l.height*.36,w:l.width*.23,h:l.height*.43}));
</script>
<!-- the cast on the cards is the same rigged figure as beside the board,
     breathing in its idle (no still character at a feature beat); h is the
     figure's height, centred on the container like the old mesh -->
{#snippet figure(cast:string,h:number)}
 <SpineProvider key={cast==='ssCastMG'?'ssSpineDJ':'ssSpineHost'} y={h/2} scale={h/905}>
  <SpineTrack trackIndex={0} animationName="idle" loop />
  <SpineTrack trackIndex={1} animationName="flutter" loop />
 </SpineProvider>
{/snippet}
<MainContainer>
 {#each cards as card,i}
  {@const b=boxes[i]}
  {@const k=Math.max(0,Math.min(1,(t-i*120)/650))}
  <Container x={b.x} y={b.y+(1-k)*35} alpha={k} rotation={(1-k)*(i-1)*.04}>
   <Sprite key="gbFsSign" width={b.w} height={b.h}/>
   {#if stacked}
    <Container x={b.w*.18} y={b.h*.47}>
     {#if card.cast}{@render figure(card.cast,b.h*1.02)}
     {:else}<Sprite key="gbW" anchor={.5} width={b.h*.78} height={b.h*.78}/>{/if}
    </Container>
    <Text x={b.w*.37} y={b.h*.17} text={card.title} style={{fontFamily:GAME_FONT,fontSize:fit(card.title,b.h*.13,b.w*.48),fill:0x15191f}}/>
    <Text x={b.w*.37} y={b.h*.33} text={card.tag} style={{fontFamily:NUMBER_FONT,fontSize:fit(card.tag,b.h*.20,b.w*.48),fill:0x535e88}}/>
    <Text x={b.w*.37} y={b.h*.60} text={card.body} style={{fontFamily:BODY_FONT,fontSize:card.body.length>48?b.h*.095:b.h*.11,lineHeight:(card.body.length>48?b.h*.095:b.h*.11)*1.15,fill:0x15191f,wordWrap:true,breakWords:true,wordWrapWidth:b.w*.47}}/>
   {:else}
    <Container x={b.w*PAPER_X} y={b.h*.19}>
     {#if card.cast}{@render figure(card.cast,b.h*.70)}
     {:else}<Sprite key="gbW" anchor={.5} width={b.w*.58} height={b.w*.58}/><Sprite key="gbP" x={b.w*.23} y={b.h*.16} anchor={.5} width={b.w*.30} height={b.w*.30}/>{/if}
    </Container>
    <Text anchor={.5} x={b.w*PAPER_X} y={b.h*.565} text={card.title} style={{fontFamily:GAME_FONT,fontSize:fit(card.title,b.w*.064,b.w*.64),fill:0x15191f}}/>
    <Text anchor={.5} x={b.w*PAPER_X} y={b.h*.67} text={card.tag} style={{fontFamily:NUMBER_FONT,fontSize:fit(card.tag,b.w*.11,b.w*.62),fill:0x535e88}}/>
    <Text anchor={{x:.5,y:0}} x={b.w*PAPER_X} y={b.h*.745} text={card.body} style={{fontFamily:BODY_FONT,fontSize:card.body.length>60?b.w*.037:b.w*.042,lineHeight:(card.body.length>60?b.w*.037:b.w*.042)*1.2,fill:0x15191f,align:'center',wordWrap:true,breakWords:true,wordWrapWidth:b.w*.62}}/>
   {/if}
  </Container>
 {/each}
</MainContainer>
