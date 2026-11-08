from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'src/components/ui/BuyEmblem.svelte'
p.write_text('''<script lang="ts">
 import { base } from '$app/paths';
 const { kind, accent }: {kind:'coins'|'arch'|'scarab'|'sure'|'sun';accent:string}=$props();
 const names={coins:'holdandspin',arch:'bonus',scarab:'scarab',sure:'scarab',sun:'sun'};
</script>
<img src={`${base}/assets/sprites/mummyUi/buy_art_${names[kind]}.png`} alt="" class="scene-art" />
<style>.scene-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}</style>
''',encoding='utf-8')
p=ROOT/'src/components/ui/ModalBuyBonus.svelte';s=p.read_text(encoding='utf-8');s=s.replace('<div class="emblem"><BuyEmblem kind={card.emblem} accent={card.accent} /></div>','<BuyEmblem kind={card.emblem} accent={card.accent} />');p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/FeatureIntro.svelte';s=p.read_text(encoding='utf-8').replace('Container, Graphics, Text','Container, Graphics, Text, Sprite')
s=s.replace('<Graphics draw={(g) => panel.art(g, slot.art.w, slot.art.h)} />','<Sprite key={i===0?"gbS":i===1?"mummyPlate":"mummySunDisc1"} x={slot.art.w/2} y={slot.art.h/2} anchor={.5} width={Math.min(slot.art.w,slot.art.h)*.9} height={Math.min(slot.art.w,slot.art.h)*.9} />')
p.write_text(s,encoding='utf-8')
# Runtime title art is language-neutral except these two explicitly English plaques.
p=ROOT/'src/game/assets.ts';s=p.read_text(encoding='utf-8')
for key,name in [('mummySunTitle','title'),('mummyLevelUp','levelup'),('mummyRays','rays')]:
 if key+':' not in s:s=s.replace('export default {',f"export default {{\n {key}: {{type:'sprite',src:new URL('../../assets/sprites/mummyWheel/{name}.png',import.meta.url).href,preload:true}},",1)
p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/RareRoulette.svelte';s=p.read_text(encoding='utf-8')
start=s.index('\t\t\t<!-- title plate');end=s.index('\n\t\t\t{#if countdown',start)
s=s[:start]+'''   <Container x={CX} y={CY-R*1.34} scale={titleScale} alpha={fade}>
    <Sprite key="mummySunTitle" anchor={.5} width={R*2.1} height={R*.525} />
    <Text text={`LV ${level}`} anchor={.5} y={R*.3} style={style(R*.1,0xf2e8d0)} />
   </Container>'''+s[end:]
start=s.index('\t\t\t{#if levelUp > 0}');end=s.index('\n\t\t\t{#if amountShown',start)
s=s[:start]+'''   {#if levelUp>0}
    <Sprite key="mummyLevelUp" anchor={.5} x={CX} y={CY+R*.05} width={R*1.9} height={R*.798} alpha={Math.min(1,levelUp)} scale={.6+.4*levelUp} />
   {/if}'''+s[end:]
s=s.replace('<Sprite key="fxGlow" anchor={.5} width={R*3.5}', '<Sprite key="mummyRays" anchor={.5} width={R*4.8} height={R*2.7} rotation={rayAngle} alpha={.35} blendMode="add" />\n    <Sprite key="fxGlow" anchor={.5} width={R*3.5}')
p.write_text(s,encoding='utf-8')
print('Installed illustrated buy scenes, feature cards and wheel plaques')
