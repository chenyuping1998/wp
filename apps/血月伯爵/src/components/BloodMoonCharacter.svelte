<script lang="ts">
 import {onMount,untrack} from 'svelte';import {BaseSprite,Container,Sprite} from 'pixi-svelte';
 import {Texture,VideoSource,Filter,GlProgram} from 'pixi.js';
 import {stateBloodMoon as bm} from '../game/bloodmoon.svelte';
 import {characterSpec,clamp01} from '../game/presentation';
 import {requestPresentationFrame,cancelPresentationFrame,isReviewRecording} from '../game/frameScheduler';
 import manifest from '../game/bloodmoonAssets.json';
 import {MotionClock} from '../game/motionClock';
 const {x,y,width,height}:{x:number;y:number;width:number;height:number}=$props();
 type Layer={texture:Texture;video:HTMLVideoElement;id:string};
 let active=$state<Layer|null>(null),outgoing=$state<Layer|null>(null),blend=$state(1),mounted=$state(false);
 const videos=new Map<string,HTMLVideoElement>(),textures=new Map<string,Texture>();
 let request=0,fadeFrame=0,disposed=false,fadeClock:MotionClock|null=null;
 const relative=(s:string)=>`${import.meta.env.BASE_URL}${s.slice(1)}`;
 const mode=$derived(bm.inFree?'free':'base');
 const spec=$derived(characterSpec(bm.phase,bm.clock,bm.spinWin,bm.reveal,bm.turbo));
 const selection=$derived(`${mode}:${spec.name==='Idle'?'idle':bm.presentationId}:${spec.name}`);
 const filter=new Filter({clipToViewport:false,resources:{
  uPrevious:Texture.EMPTY.source,characterUniforms:{uMix:{value:1,type:'f32'}},
 },glProgram:GlProgram.from({
  vertex:`in vec2 aPosition;out vec2 vTextureCoord;out vec2 vPackedCoord;uniform vec4 uInputSize;uniform vec4 uOutputFrame;uniform vec4 uOutputTexture;vec4 filterVertexPosition(){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;return vec4(p,0.0,1.0);}void main(){gl_Position=filterVertexPosition();vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);vPackedCoord=aPosition;}`,
  fragment:`in vec2 vTextureCoord;in vec2 vPackedCoord;out vec4 finalColor;uniform sampler2D uTexture;uniform sampler2D uPrevious;uniform float uMix;uniform vec4 uInputClamp;void main(){float y=vTextureCoord.y-uInputClamp.y;float mid=(uInputClamp.y+uInputClamp.w)*0.5;vec4 rgb=texture(uTexture,vec2(vTextureCoord.x,uInputClamp.y+y*0.5));vec4 matte=texture(uTexture,vec2(vTextureCoord.x,mid+y*0.5));float a=matte.r/max(matte.a,0.00001)*rgb.a;vec4 current=vec4(rgb.rgb/max(rgb.a,0.00001)*a,a);if(uMix>=0.9999){finalColor=current;return;}vec3 previous=texture(uPrevious,vec2(vPackedCoord.x,vPackedCoord.y*0.5)).rgb;float previousAlpha=texture(uPrevious,vec2(vPackedCoord.x,0.5+vPackedCoord.y*0.5)).r;finalColor=mix(vec4(previous*previousAlpha,previousAlpha),current,uMix);}`
 })});const filters=[filter];
 function videoFor(scene:'base'|'free',name:string){
  const key=`${scene}:${name}`;let video=videos.get(key);
  if(!video){
   video=document.createElement('video');video.src=relative((manifest.character[scene] as Record<string,string>)[name]);video.muted=true;video.playsInline=true;video.preload='auto';videos.set(key,video);
   // Preallocate the packed-video source without starting every cached clip.
   textures.set(key,new Texture({source:new VideoSource({resource:video,autoPlay:false,updateFPS:0})}));
   video.load();
  }
  return video;
 }
 function ready(video:HTMLVideoElement):Promise<boolean>{
  if(video.error)return Promise.resolve(false);
  if(video.readyState>=2)return Promise.resolve(true);
  return new Promise(resolve=>{
   const done=(ok:boolean)=>{video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);resolve(ok);};
   const loaded=()=>done(true),failed=()=>done(false);
   video.addEventListener('loadeddata',loaded,{once:true});video.addEventListener('error',failed,{once:true});
  });
 }
 async function activate(id:string,scene:'base'|'free',name:string){
  const ticket=++request,key=`${scene}:${name}`,video=videoFor(scene,name);
  if(!await ready(video)||disposed||ticket!==request)return;
  const now=untrack(()=>spec),seconds=now.elapsed/1000;
  const desired=Number.isFinite(video.duration)?now.loop?seconds%video.duration:Math.min(seconds,Math.max(0,video.duration-1/30)):0;
  video.loop=now.loop;video.playbackRate=1;
  // Seek once at entry. Repeated drift correction during playback flushes the
  // decoder and drops frames on the packed RGB/alpha clips.
  if(Math.abs(video.currentTime-desired)>1/30){
   const sought=new Promise<void>(resolve=>video.addEventListener('seeked',()=>resolve(),{once:true}));
   video.currentTime=desired;await sought;
  }
  if(disposed||ticket!==request)return;
  try{await video.play();}catch{return;}
  if(disposed||ticket!==request){video.pause();return;}
  cancelPresentationFrame(fadeFrame);
  outgoing?.video.pause();outgoing=active?.video===video?null:active;
  active={id,video,texture:textures.get(key)!};blend=outgoing?0:1;
  const clock=new MotionClock(performance.now());fadeClock=clock;clock.setHidden(document.hidden,performance.now());
  const fade=(at:number)=>{
   if(disposed||ticket!==request)return;
   const p=clamp01(clock.read(at)/140);blend=p*p*(3-2*p);
   if(p<1)fadeFrame=requestPresentationFrame(fade);
   else{outgoing?.video.pause();outgoing=null;}
  };
  if(outgoing)fadeFrame=requestPresentationFrame(fade);
 }
 $effect(()=>{if(!mounted)return;for(const name of Object.keys(manifest.character[mode]))videoFor(mode,name);});
 $effect(()=>{
  if(!mounted)return;
  const id=selection;
  untrack(()=>{void activate(id,mode,spec.name);});
 });
 // Mix unpacked, premultiplied pixels in ONE pass. Two source-over sprites
 // with complementary opacity made the body dim to 75% halfway through a cut.
 $effect(()=>{
  filter.resources.uPrevious=(outgoing??active)?.texture.source??Texture.EMPTY.source;
  filter.resources.characterUniforms.uniforms.uMix=outgoing?blend:1;
 });
 $effect(()=>{bm.clock;if(isReviewRecording()){active?.texture.source.update();outgoing?.texture.source.update();}});
 onMount(()=>{
  mounted=true;
  const visibility=()=>{
   fadeClock?.setHidden(document.hidden,performance.now());
   for(const layer of [active,outgoing])if(layer){if(document.hidden)layer.video.pause();else void layer.video.play().catch(()=>{});}
  };
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);disposed=true;request++;cancelPresentationFrame(fadeFrame);for(const v of videos.values()){v.pause();v.removeAttribute('src');v.load();}for(const t of textures.values())t.destroy(true);filter.destroy();};
 });
</script>
<Container {x} {y}>
 {#if active}<BaseSprite texture={active.texture} {width} {height} {filters}/>{:else}<Sprite key={`bmCharacter_${mode}`} {width} {height}/>{/if}
</Container>
