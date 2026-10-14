<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite,Graphics} from 'pixi-svelte';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 const props:{oncomplete:()=>void;oncover?:()=>void}=$props();
 const context=getContext(), origin=context.stateGame.mascotThrowOrigin;
 const lead=origin?580:0,coverAt=origin?1400:700,openAt=coverAt+100,total=openAt+760;
 let t=$state(0),covered=false,complete=false;
 const canvas=$derived(context.stateLayoutDerived.canvasSizes());
 const age=$derived(t-lead);
 const clamp=(n:number)=>Math.max(0,Math.min(1,n));
 const backOut=(p:number)=>1+2.6*(p-1)**3+1.6*(p-1)**2;
 const shut=$derived.by(()=>{if(age<0)return 0;if(age<380)return clamp(age/380)**3;if(t<openAt+300)return 1;const p=clamp((t-openAt-300)/460);return (1-p)**3;});
 const doorScale=$derived(Math.max(canvas.height/1030,canvas.width/1920));
 const w=$derived(1100*doorScale),h=$derived(1080*doorScale);
 const half=$derived(canvas.width/2),travel=$derived(half+170*doorScale);
 const rebound=$derived(age>=380&&age<470?14*doorScale*Math.sin((age-380)/90*Math.PI):0);
 const jolt=$derived(age>=380&&age<470?8*Math.sin((age-380)/9)*(1-(age-380)/90):0);
 const left=$derived(half+doorScale-travel*(1-shut)-rebound+jolt);
 const right=$derived(half+travel*(1-shut)+rebound+jolt);
 const doorSides=$derived([{key:'gbDoorLV2',x:left,anchor:1,port:-330},{key:'gbDoorRV2',x:right,anchor:0,port:330}]);
 const wheel=$derived(t>=openAt?-Math.PI*clamp((t-openAt)/220)+Math.PI*1.5:Math.PI*1.5*backOut(clamp((age-500)/200)));
 const latch=$derived(clamp((age-380)/120)*(1-clamp((t-openAt)/220)));
 const steam=$derived(age>=700&&age<1000?Math.min(6,Math.floor((age-700)/50)+1):0);
 const plate=$derived.by(()=>{if(!origin)return null;const p=(t-580)/520;if(p<0||p>1)return null;const board=context.stateGameDerived.boardLayout();return{x:origin.x+(board.x-origin.x)*p,y:origin.y+(board.y-origin.y)*p-Math.sin(p*Math.PI)*220,rotation:-p*Math.PI*2.2};});
 onMount(()=>{
  if(origin)context.eventEmitter.broadcast({type:'mascotThrow'});
  let raf=0,prev=performance.now(),slide=false,hit=false,lock=false,hiss=false,open=false;
  const step=(now:number)=>{t+=Math.min(60,now-prev);prev=now;
   if(!slide&&t>=lead){slide=true;context.eventEmitter.broadcast({type:'soundDoorSlide'});}
   if(!hit&&age>=380){hit=true;context.eventEmitter.broadcast({type:'soundDoorClack'});}
   if(!lock&&age>=500){lock=true;context.eventEmitter.broadcast({type:'soundDoorWheel'});}
   if(!hiss&&age>=700){hiss=true;context.eventEmitter.broadcast({type:'soundDoorSteam'});}
   if(!covered&&t>=coverAt){covered=true;props.oncover?.();}
   if(!open&&t>=openAt+300){open=true;context.eventEmitter.broadcast({type:'soundDoorOpen'});}
   if(t>=total){if(!complete){complete=true;props.oncomplete();}return;}raf=requestAnimationFrame(step);
  };raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 });
</script>
<Container>
 {#if plate}<MainContainer><Sprite key="gbP" anchor={.5} x={plate.x} y={plate.y} rotation={plate.rotation} width={150} height={150}/></MainContainer>{/if}
 {#if shut>0}
  <!-- Opaque door well closes with the panels; no scene can show through corner cutouts at cover. -->
  <Graphics draw={g=>{g.clear();g.rect(0,0,canvas.width,canvas.height);g.fill({color:0x20231d,alpha:clamp((shut-.85)/.15)});}}/>
  {#each doorSides as d,i}
   <Container x={d.x} y={canvas.height/2}>
    <Sprite key={d.key} anchor={{x:d.anchor,y:.5}} width={w} height={h}/>
    <Sprite key="gbDoorLiquidV2" anchor={.5} x={d.port*doorScale} y={-172*doorScale} rotation={Math.sin(t/300+i)*.035} width={200*doorScale} height={200*doorScale}/>
    <Sprite key="gbDoorWheelV2" anchor={.5} x={d.port*doorScale} y={170*doorScale} rotation={wheel*(i? -1:1)} width={245*doorScale} height={245*doorScale}/>
    {#if steam}<Sprite key={`gbDoorSteam${steam}V2`} anchor={.5} x={d.port*doorScale} y={-40*doorScale} width={260*doorScale} height={260*doorScale}/>{/if}
   </Container>
  {/each}
  <Sprite key="gbDoorBadgeV2" anchor={.5} x={half+jolt} y={canvas.height/2-65*doorScale} width={180*doorScale} height={180*doorScale} alpha={clamp((shut-.92)/.08)}/>
  <Sprite key="gbDoorLatchV2" anchor={.5} x={half+(1-latch)*200*doorScale+jolt} y={canvas.height/2+40*doorScale} width={420*doorScale} height={210*doorScale} alpha={latch}/>
  <Sprite key="gbDoorHazardV2" anchor={{x:.5,y:0}} x={half+jolt} y={-130*doorScale*(1-shut)} width={canvas.width} height={130*doorScale}/>
 {/if}
</Container>
