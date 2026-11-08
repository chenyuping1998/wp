/** Bounded, game-local HTMLAudio mixer. Music and effect loops crossfade;
 * speech/fanfares are exclusive within their own groups. */
export class BloodMoonAudio{
 private voices=new Map<HTMLAudioElement,{gain:number;group:string;fading:boolean}>();
 private speechFades=new Set<ReturnType<typeof setTimeout>>();
 private templates=new Map<string,HTMLAudioElement>();
 private beds=new Map<string,{audio:HTMLAudioElement;gain:number;target:number;kind:'music'|'effect'}>();
 private musicKey='';private effectKey='';private musicVolume=0;private effectsVolume=0;private duck=1;private targetDuck=1;
 private visible=true;
 private captureContext:AudioContext|undefined;
 private captureOutput:MediaStreamAudioDestinationNode|undefined;
 private captureSources=new Map<HTMLAudioElement,MediaElementAudioSourceNode>();
 private timer:ReturnType<typeof setInterval>|undefined;
 private files:Record<string,string>;private resolve:(s:string)=>string;
 constructor(files:Record<string,string>,resolve:(s:string)=>string){this.files=files;this.resolve=resolve;}
 private unlock=()=>{if(this.visible)for(const bed of this.beds.values())if(bed.target>0&&bed.audio.paused)bed.audio.play().catch(()=>{});};
 private visibility=()=>{
  this.visible=!document.hidden;
  if(this.visible)this.unlock();
  else{this.stopEffects();for(const bed of this.beds.values()){bed.audio.pause();bed.gain=0;}}
 };
 mount(){
  document.addEventListener('pointerdown',this.unlock,true);document.addEventListener('keydown',this.unlock,true);
  document.addEventListener('visibilitychange',this.visibility);this.visibility();
  for(const [key,path] of Object.entries(this.files)){
   const audio=new Audio(this.resolve(path));audio.preload='auto';audio.load();this.templates.set(key,audio);
  }
  this.timer=setInterval(()=>{
   this.duck+=(this.targetDuck-this.duck)*.12;
   for(const [key,bed] of this.beds){
    bed.gain+=((this.visible?bed.target:0)-bed.gain)*.18;
    bed.audio.volume=Math.max(0,Math.min(1,bed.gain*(bed.kind==='music'?this.musicVolume*.26*this.duck:this.effectsVolume)));
    if(bed.target===0&&bed.gain<.002){bed.audio.pause();this.disconnectCapture(bed.audio);this.beds.delete(key);}
   }
  },32);
 }
 volumes(music:number,effects:number){
  this.musicVolume=Math.max(0,Math.min(1,music));this.effectsVolume=Math.max(0,Math.min(1,effects));
  for(const [a,{gain,fading}] of this.voices)a.volume=Math.max(0,Math.min(1,this.effectsVolume*gain*(fading?.35:1)));
 }
 private bed(kind:'music'|'effect',key:string,gain:number){
  for(const bed of this.beds.values())if(bed.kind===kind)bed.target=0;
  const path=this.files[key];if(!path)return;
  const id=`${kind}:${key}`;let bed=this.beds.get(id);
  if(!bed){const audio=new Audio(this.resolve(path));audio.loop=true;audio.preload='auto';audio.volume=0;bed={audio,gain:0,target:gain,kind};this.beds.set(id,bed);}
  this.connectCapture(bed.audio);bed.target=gain;if(this.visible)bed.audio.play().catch(()=>{});
 }
 music(key:string,duck=1){
  this.targetDuck=Math.max(0,Math.min(1,duck));if(key===this.musicKey)return;this.musicKey=key;this.bed('music',key,1);
 }
 effectLoop(key:string|null,gain=.25){
  const next=key??'';if(next===this.effectKey)return;this.effectKey=next;this.bed('effect',next,gain);
 }
 private fade(audio:HTMLAudioElement){
  const entry=this.voices.get(audio);if(!entry||entry.fading)return;entry.fading=true;audio.volume*=.35;
  const timer=setTimeout(()=>{audio.pause();this.disconnectCapture(audio);this.voices.delete(audio);this.speechFades.delete(timer);},60);this.speechFades.add(timer);
 }
 stopEffects(){
  for(const audio of this.voices.keys())this.fade(audio);
  this.effectLoop(null);
 }
 cue(key:string,gain=.5){
  const path=this.files[key];if(!path||this.effectsVolume===0||!this.visible)return;
  const group=key.startsWith('Chara')?'speech':key.endsWith('_Start')?'fanfare':'';
  if(group)for(const [old,entry] of this.voices)if(entry.group===group)this.fade(old);
  while(this.voices.size>=12){const old=this.voices.keys().next().value!;old.pause();this.disconnectCapture(old);this.voices.delete(old);}
  const template=this.templates.get(key),audio=template?template.cloneNode(true) as HTMLAudioElement:new Audio(this.resolve(path));
  audio.volume=Math.min(1,this.effectsVolume*gain);this.voices.set(audio,{gain,group,fading:false});
  this.connectCapture(audio);
  const done=()=>{this.disconnectCapture(audio);this.voices.delete(audio);};audio.addEventListener('ended',done,{once:true});audio.addEventListener('error',done,{once:true});audio.play().catch(done);
 }
 private connectCapture(audio:HTMLAudioElement){
  if(!this.captureContext||!this.captureOutput||this.captureSources.has(audio))return;
  const source=this.captureContext.createMediaElementSource(audio);source.connect(this.captureContext.destination);source.connect(this.captureOutput);this.captureSources.set(audio,source);
 }
 private disconnectCapture(audio:HTMLAudioElement){this.captureSources.get(audio)?.disconnect();this.captureSources.delete(audio);}
 /** Explicit local review recording. No microphone or system audio is used. */
 async captureStream(){
  if(!this.captureContext){this.captureContext=new AudioContext();this.captureOutput=this.captureContext.createMediaStreamDestination();}
  for(const audio of this.voices.keys())this.connectCapture(audio);
  for(const bed of this.beds.values())this.connectCapture(bed.audio);
  await this.captureContext.resume();
  return this.captureOutput!.stream.clone();
 }
 destroy(){
  if(this.timer)clearInterval(this.timer);for(const timer of this.speechFades)clearTimeout(timer);
  document.removeEventListener('pointerdown',this.unlock,true);document.removeEventListener('keydown',this.unlock,true);
  document.removeEventListener('visibilitychange',this.visibility);
  for(const a of [...this.voices.keys(),...this.templates.values(),...[...this.beds.values()].map(b=>b.audio)]){a.pause();a.removeAttribute('src');a.load();}
  this.voices.clear();this.beds.clear();this.templates.clear();this.speechFades.clear();
  for(const source of this.captureSources.values())source.disconnect();this.captureSources.clear();
  for(const track of this.captureOutput?.stream.getTracks()??[])track.stop();void this.captureContext?.close();
 }
}
