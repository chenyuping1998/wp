<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite,Graphics} from 'pixi-svelte';
 import {SYMBOL_LAYERS} from '../game/symbolLayers';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolInfo} from '../game/utils';
 const props:{symbolName:string;symbolInfo:ReturnType<typeof getSymbolInfo>;mode:'win'|'land';impact?:number;oncomplete?:()=>void}=$props();
 type Layer={name:string;key:string;pivot:readonly number[];box:readonly number[];polygon?:readonly(readonly number[])[]};
 const nameMap:Record<string,keyof typeof SYMBOL_LAYERS>={H1:'h1',H2:'h2',H3:'h3',H4:'h4',W:'w',S:'s',P:'p',L1:'l1_a',L2:'l2_k',L3:'l3_q',L4:'l4_j',L5:'l5_10'};
 const name=$derived(nameMap[props.symbolName]),spec=$derived(SYMBOL_LAYERS[name]);
 const layers=$derived(spec.layers as readonly Layer[]);
 const w=$derived(SYMBOL_SIZE*props.symbolInfo.sizeRatios.width),h=$derived(SYMBOL_SIZE*props.symbolInfo.sizeRatios.height);
 const duration=$derived(props.mode==='win'?1200:240);
 let t=$state(0);
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 const pulse=(start:number,end:number)=>Math.sin(clamp((t-start)/(end-start))*Math.PI);
 const pose=(part:string,i:number)=>{
  if(t>=duration||t<=0)return {dx:0,dy:0,rotation:0,sx:1,sy:1};
  if(props.mode==='land'){
   const weight=props.impact??1,delay=part==='body'?0:Math.min(60,40+i*4),p=clamp((t-delay)/(240-delay));
   const squash=Math.sin(p*Math.PI*2)*Math.exp(-p*3)*weight;
   return{dx:0,dy:part==='body'?0:-h*.025*weight*Math.sin(p*Math.PI),rotation:part==='flag'?squash*.12:0,sx:1+squash*.1,sy:1-squash*.14};
  }
  let dx=0,dy=0,rotation=0,sx=1,sy=1;
  if(name==='h1'){if(part.startsWith('pickle'))dy=-h*.13*pulse(130+i*50,780+i*50);if(part==='top_bun')dy=-h*.18*pulse(80,900);if(part==='cheese')sy=1+.14*pulse(210,810);}
  if(name==='h2'){if(part==='pickle'){dx=w*.05*Math.sin(clamp((t-100)/950)*Math.PI*2);rotation=.1*Math.sin(clamp((t-100)/950)*Math.PI*2);}if(part==='mustard')sy=1+.10*pulse(170,1050);}
  if(name==='h3'&&part.startsWith('ring')){dy=-h*.15*pulse(120+i*50,780+i*50);rotation=.35*pulse(120+i*50,780+i*50)*(i%2?1:-1);}
  if(name==='h4'&&part.startsWith('spear'))rotation=(part==='spear_left'?-.22:part==='spear_right'?.22:0)*pulse(140,1000);
  if(name==='w'){if(part==='head')dy=-h*.03*pulse(160,920);if(part==='glasses'){dy=-h*.03*pulse(200,960);rotation=.04*Math.sin(clamp((t-200)/760)*Math.PI*2);}if(part==='hat'){dy=-h*.045*pulse(230,990);rotation=.07*pulse(230,990);}}
  if(name==='s'){if(part==='clapper')rotation=.384*Math.sin(clamp((t-100)/900)*Math.PI*6)*Math.exp(-clamp((t-100)/900)*1.5);if(part==='flag')rotation=.15*Math.sin(clamp((t-150)/900)*Math.PI*6)*(1-clamp((t-150)/900));if(part==='paper'){dy=-h*.10*pulse(180,1000);rotation=-.13*pulse(180,1000);}}
  if(name==='p'){if(part==='lid')rotation=-.611*pulse(100,1040);if(part.startsWith('pickle'))dy=-h*.1*pulse(180+i*40,860+i*40);if(part==='liquid')sx=1+.04*pulse(200,1000);}
  if(name.startsWith('l')&&part!=='body'){dy=-h*.035*pulse(160,1060);rotation=.07*pulse(190,1090);}
  return{dx,dy,rotation,sx,sy};
 };
 const root=$derived.by(()=>{if(props.mode==='land'||t>=1200)return{y:0,x:1,yScale:1};const anticip=t<80?t/80:t<160?1-(t-80)/80:0;const squash=name==='p'?.07*pulse(1000,1200):0;return{y:h*.04*anticip,x:1+squash,yScale:1-squash};});
 onMount(()=>{let raf=0,prev=performance.now(),done=false;const finish=()=>{if(done)return;done=true;t=duration;props.oncomplete?.();};const tick=(now:number)=>{t=Math.min(duration,t+Math.min(60,now-prev));prev=now;if(t>=duration){finish();return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);const timeout=setTimeout(finish,duration+500);return()=>{cancelAnimationFrame(raf);clearTimeout(timeout);};});
</script>
<Container y={root.y} scale={{x:root.x,y:root.yScale}}>
 {#if t<=0||t>=duration}
  <Sprite key={props.symbolInfo.assetKey} anchor={.5} width={w} height={h}/>
 {:else}
  {#if spec.underpaint}
   <Container>
    <Graphics isMask draw={g=>{g.clear();for(const layer of layers){if(layer.polygon)g.poly(layer.polygon.flatMap(p=>[(p[0]/512-.5)*w,(p[1]/512-.5)*h]));}g.fill(0xffffff);}}/>
    <Sprite key={`under_${name}`} anchor={.5} width={w} height={h}/>
   </Container>
  {/if}
  {#each layers as layer,i}
   {@const p=pose(layer.name,i)}
   <Container x={(layer.pivot[0]/512-.5)*w+p.dx} y={(layer.pivot[1]/512-.5)*h+p.dy} rotation={p.rotation} scale={{x:p.sx,y:p.sy}}>
    <Sprite key={layer.key} anchor={{x:(layer.pivot[0]-layer.box[0])/(layer.box[2]-layer.box[0]),y:(layer.pivot[1]-layer.box[1])/(layer.box[3]-layer.box[1])}} width={w*(layer.box[2]-layer.box[0])/512} height={h*(layer.box[3]-layer.box[1])/512}/>
    {#if name==='w'&&props.mode==='win'&&layer.name==='glasses'&&t>=80&&t<780}<Sprite key={t<210?'gbWEyesClosedV2':'gbWEyesWideV2'} anchor={{x:layer.pivot[0]/512,y:layer.pivot[1]/512}} width={w} height={h}/>{/if}
    {#if name==='w'&&props.mode==='win'&&layer.name==='mouth'&&t>=380&&t<970}<Sprite key={t<730?'gbWMouthGrinV2':'gbWMouthBiteV2'} anchor={{x:layer.pivot[0]/512,y:layer.pivot[1]/512}} width={w} height={h}/>{/if}
   </Container>
  {/each}
 {/if}
</Container>
