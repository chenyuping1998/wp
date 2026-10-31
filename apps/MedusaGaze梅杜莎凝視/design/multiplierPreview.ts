import { Application,Assets,Container,Graphics,Sprite,Text,ColorMatrixFilter } from 'pixi.js';
import { createMedusaRigScene } from '../src/game/medusaRigScene';
import { createMultiplierFxScene } from '../src/game/multiplierFxScene';
import { flightPose,orbChargePose,orbLaunchPoint,impactPose,gazePose,type OrbVisual } from '../src/game/multiplierPerformance';
import { drawMultiplierReadout } from '../src/game/multiplierReadout';
import { medusaAnimations,throwTiming } from '../src/game/animationTimeline';
import {multiplierCollisionPose,drawMultiplierCollision} from '../src/game/multiplierCollision';
import {castingMix,castingCueGain,orbFlightGain,orbSoundVoices,type OrbSoundCue} from '../src/game/castingSoundDesign';
import {orbPower} from '../src/game/orbPower';
import {characterSoundDesign,resolveCharacterSound,type CharacterSoundMark} from '../src/game/characterSoundDesign';
async function start(){
 const stage=document.querySelector<HTMLCanvasElement>('#stage')!,status=document.querySelector<HTMLElement>('#status')!,slider=document.querySelector<HTMLInputElement>('#time')!,select=document.querySelector<HTMLSelectElement>('#case')!;
 const app=new Application();await app.init({canvas:stage,width:1280,height:720,background:0x14343f,antialias:true});
 await document.fonts.load('24px "Titan One"');await document.fonts.ready;
 const root='../../../../../static/assets/';const paths=['spines/medusa43/medusa.png','sprites/medusaOrbs/orb_green.png','sprites/medusaOrbs/orb_purple.png','sprites/medusaOrbs/orb_gold.png','sprites/medusaUi/total_plate.png','sprites/medusaFx/fx_glow.png'];
 const [cast,green,purple,gold,plaque,glow]=await Promise.all(paths.map(p=>Assets.load(root+p)));
 const rig=createMedusaRigScene({'medusa.png':cast},undefined,characterSound);rig.root.scale.set(.32);rig.root.position.set(1000,685);app.stage.addChild(rig.root);
 const fx=createMultiplierFxScene({green,purple,gold,glow});app.stage.addChild(fx.root);
 const stoneMaterial=new ColorMatrixFilter();stoneMaterial.saturate(-1);
 const well=new Graphics();well.position.set(430,350);app.stage.addChild(well);
 const plate=new Sprite(plaque);plate.anchor.set(.5);plate.position.set(220,215);plate.width=270;plate.height=168.75;app.stage.addChild(plate);
 const text=(size:number,color:number,x:number,y:number)=>{const t=new Text({text:'',style:{fontFamily:'"Titan One",Arial',fontSize:size,fill:color,stroke:{color:0x10232c,width:3}}});t.anchor.set(.5);t.position.set(x,y);app.stage.addChild(t);return t;};
 const score=text(48,0xffe4a3,430,427),mult=text(80,0xb8ff5a,430,313),total=text(44,0xffe4a3,262,224),caption=text(21,0xefe8d8,360,32),heading=text(23,0xc3d5b6,430,262),equation=text(27,0xf0ead2,430,375),totalLabel=text(17,0xffedc1,262,180);totalLabel.text='TOTAL';
 const flyingNumber=text(48,0xb8ff5a,0,0);flyingNumber.style.fontFamily='"Titan One","Microsoft JhengHei",Arial';
 const bodies=Array.from({length:3},()=>{const c=new Container(),body=new Sprite(green);body.anchor.set(.5);body.width=body.height=92;const label=new Text({text:'',style:{fontFamily:'"Titan One",Arial',fontSize:32,fill:0xffffff,stroke:{color:0x19313b,width:4}}});label.anchor.set(.5);c.addChild(body);app.stage.addChild(c);return{c,body,label};});
 const cases=[{name:'一般局 ×25',free:false,turbo:false,applied:true,values:[25],mult:25},{name:'免費遊戲 ×8',free:true,turbo:false,applied:true,values:[8],mult:63},{name:'免費遊戲三顆',free:true,turbo:false,applied:true,values:[8,15,100],mult:178},{name:'未得分碎裂',free:false,turbo:false,applied:false,values:[25],mult:1},{name:'TURBO 1 ×25',free:false,turbo:true,applied:true,values:[25],mult:25},{name:'TURBO 2 ×25',free:false,turbo:true,applied:true,values:[25],mult:25},{name:'金色倍率 ×100',free:false,turbo:false,applied:true,values:[100],mult:100}];
 for(const value of [2,5,15,50,250,500])cases.push({name:`倍率層次 ×${value}`,free:value>=250,turbo:false,applied:true,values:[value],mult:value});
 cases.push({name:'神威三球 ×8 / ×100 / ×500',free:true,turbo:false,applied:true,values:[8,100,500],mult:663});
 for(let i=0;i<cases.length;i++){const o=document.createElement('option');o.value=String(i);o.textContent=cases[i].name;select.appendChild(o);}
 const collisionFlash=new Graphics();app.stage.addChild(collisionFlash);const labelsRoot=new Container();app.stage.addChild(labelsRoot);for(const item of bodies)labelsRoot.addChild(item.label);
 let current=cases[0],plan=throwTiming({freegame:false,turbo:false,applied:true,orbCount:1,mult:25}),clock=0,playing=false,last=0;
 const hit=new Set<number>(),cracked=new Set<number>(),played=new Set<string>();
 const audio=new AudioContext(),limiter=audio.createDynamicsCompressor(),auditionBus=audio.createGain(),audioBuffers=new Map<string,Promise<AudioBuffer>>(),voices=new Set<AudioBufferSourceNode>();let seeking=false;
 limiter.threshold.value=-3;limiter.knee.value=2;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.09;auditionBus.gain.value=.68;auditionBus.connect(limiter);limiter.connect(audio.destination);
 const loadAudio=(cue:string)=>{if(!audioBuffers.has(cue))audioBuffers.set(cue,fetch(root+'audio/medusa/'+cue+'.wav?v=8').then(r=>{if(!r.ok)throw Error(`Audio ${cue}: ${r.status}`);return r.arrayBuffer();}).then(data=>audio.decodeAudioData(data)));return audioBuffers.get(cue)!;};
 for(const cue of [...new Set(Object.values(characterSoundDesign).flatMap(d=>d.voices.map(v=>v.cue))), 'vo_medusa_laugh_2','sfx_gaze_charge','sfx_glasses_slide','sfx_gaze_beam','sfx_orb_charge','sfx_orb_release','vo_medusa_cast','sfx_snakes_hiss','sfx_orb_fly','sfx_orb_hit_s','sfx_orb_hit_m','sfx_orb_hit_l','sfx_orb_crack','sfx_glasses_on','sfx_total_mult_up','sfx_total_to_win'])void loadAudio(cue).catch(console.error);
 let soundGeneration=0;const lastCharacterSound=new Map<string,number>();let characterVariant=0;
 function characterSound(mark:CharacterSoundMark){if(seeking)return;const now=clock*1000;if(now-(lastCharacterSound.get(mark)??-Infinity)<characterSoundDesign[mark].cooldownMs)return;lastCharacterSound.set(mark,now);for(const v of resolveCharacterSound(mark,mark==='motion_laugh'?characterVariant++:0))sound(v.cue,v.rate,false,v.gain);}
 function sound(cue:string,speed=1,collision=false,gainOverride?:number){if(seeking||!document.querySelector<HTMLInputElement>('#sound')!.checked)return;const generation=soundGeneration;void audio.resume();void loadAudio(cue).then(buffer=>{if(generation!==soundGeneration)return;const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;source.playbackRate.value=cue==='vo_medusa_cast'?castingMix.voiceRate:cue==='sfx_snakes_hiss'?castingMix.hissRate:speed;gain.gain.value=gainOverride??(cue==='sfx_orb_fly'?orbFlightGain(current.values.length):castingCueGain(cue,collision));source.connect(gain);gain.connect(auditionBus);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start();}).catch(console.error);}
 const powerSound=(cue:OrbSoundCue,value:number)=>{for(const v of orbSoundVoices(cue,value,current.values.length))sound(v.cue,v.rate,false,v.gain);};
 function reset(){soundGeneration++;lastCharacterSound.clear();for(const source of voices){try{source.stop();}catch{}}voices.clear();current=cases[Number(select.value)];plan=throwTiming({freegame:current.free,turbo:current.turbo,applied:current.applied,orbCount:current.values.length,mult:current.mult});clock=0;hit.clear();cracked.clear();played.clear();fx.clearTransient();rig.reset();rig.setFreegame(current.free);rig.play(plan.animation,false,medusaAnimations[plan.animation].releaseAtMs/plan.releaseMs);plate.visible=current.free;total.visible=current.free;totalLabel.visible=current.free;caption.text=current.name+' / 正式骨架與同一套特效';}
 function draw(previous:number){const ms=clock*1000,eyes=rig.getGazeAnchors(),target=current.free?{x:262,y:215}:{x:288,y:350};
  const orbs:OrbVisual[]=[];const charge=plan.chargeMs;
  const cue=(at:number,key:string,id=key,powerCue?:OrbSoundCue,value=Math.max(...current.values))=>{if(previous*1000<=at&&ms>=at&&!played.has(id)){played.add(id);if(powerCue)powerSound(powerCue,value);else sound(key,1,id==='mathCollision');}};
  cue(0,'sfx_gaze_charge');cue(medusaAnimations[plan.animation].beamAtMs,'sfx_gaze_beam');
  cue(plan.releaseMs-plan.chargeMs,'sfx_orb_charge','charge','charge');cue(plan.releaseMs,'sfx_orb_release','release','release');
  if(current.free&&current.applied)cue(plan.plateCountStartMs,'sfx_total_mult_up');
  if(current.applied){cue(plan.transferStartMs,'sfx_total_to_win');cue(plan.collisionAtMs,'sfx_orb_hit_l','mathCollision','collision',current.mult);if(ms>=plan.collisionAtMs&&!hit.has(99)){hit.add(99);fx.impact({x:430,y:350},current.mult,'orb');}}
  current.values.forEach((value,index)=>{const from=orbLaunchPoint(eyes.center,target,index),launch=plan.releaseMs+index*plan.staggerMs,arrival=launch+plan.flightMs,end=current.applied?target:current.free?{x:target.x+(eyes.center.x-target.x)*.14,y:target.y+(eyes.center.y-target.y)*.14}:target;
   cue(launch,'sfx_orb_fly','flight'+index,'fly',value);const orb:OrbVisual={id:index,value,...from,scale:1,alpha:0,stone:0,crack:0,angle:0,sx:1,sy:1,trail:[]};
   if(ms>=launch-charge&&ms<launch){const p=(ms-launch+charge)/charge;Object.assign(orb,orbChargePose(from,end,p));}
   else if(ms>=launch&&ms<arrival)Object.assign(orb,flightPose(orbChargePose(from,end,1),end,(ms-launch)/plan.flightMs),{alpha:1,charging:false});
   else if(ms>=arrival&&ms<arrival+(current.applied?plan.landMs:plan.shatterMs*.45)){const incoming=flightPose(orbChargePose(from,end,1),end,1);if(current.applied)Object.assign(orb,end,impactPose((ms-arrival)/plan.landMs,incoming.angle));else Object.assign(orb,end,{alpha:1,stone:1,angle:incoming.angle});}
   if(ms>=arrival&&!hit.has(index)){hit.add(index);if(current.applied){fx.impact(end,value,current.free?'plate':'score');powerSound('hit',value);}else{sound('sfx_orb_crack');if(index===0)rig.play('gaze_dud',false,medusaAnimations.gaze_dud.durationMs/Math.max(120,plan.endMs-plan.firstArrivalMs));}}
   if(!current.applied&&ms>=arrival+plan.shatterMs*.45&&!cracked.has(index)){cracked.add(index);fx.shatter(end,value);}
   orbs.push(orb);const item=bodies[index],size=orbPower(value).bodyScale;item.c.visible=orb.alpha>0;item.c.position.set(orb.x,orb.y);item.c.alpha=orb.alpha;item.body.texture=value>=100?gold:value>=15?purple:green;item.body.rotation=orb.angle;item.body.scale.set(92/item.body.texture.width*orb.scale*orb.sx*size,92/item.body.texture.height*orb.scale*orb.sy*size);item.body.tint=orb.stone?0xa6a59a:0xffffff;item.body.filters=orb.stone?[stoneMaterial]:[];item.label.visible=orb.alpha>0;item.label.position.set(orb.x,orb.y);item.label.alpha=orb.alpha;item.label.text='×'+value;item.label.style.fontSize=value>=100?26:32;item.label.scale.set(orb.scale*size);
  });for(let i=current.values.length;i<bodies.length;i++){bodies[i].c.visible=false;bodies[i].label.visible=false;}
  const beamAt=medusaAnimations[plan.animation].beamAtMs,beamEnd=Math.max(beamAt+100,Math.min(medusaAnimations[plan.animation].beamEndMs,plan.lastArrivalMs)),gazeProgress=ms>=beamAt&&ms<beamEnd?(ms-beamAt)/(beamEnd-beamAt):-1,gaze=gazeProgress>=0?gazePose(gazeProgress).intensity:0;
  const count=Math.max(0,Math.min(1,(ms-plan.scoreStartMs)/Math.max(1,plan.countMs))),plateCount=Math.max(0,Math.min(1,(ms-plan.plateCountStartMs)/Math.max(1,plan.plateCountMs)));
  const applied=ms>=plan.scoreStartMs&&current.applied,transferring=current.applied&&ms>=plan.transferStartMs&&ms<plan.scoreStartMs;
  const move=multiplierCollisionPose(current.free?{x:262,y:222}:{x:288,y:350},{x:430,y:350},(ms-plan.transferStartMs)/Math.max(1,plan.transferMs)),collision=Math.max(0,Math.min(1,(ms-plan.collisionAtMs)/Math.max(1,plan.collisionHoldMs)));
  drawMultiplierReadout(well,1,gazeProgress);drawMultiplierCollision(collisionFlash,{x:430,y:350},ms>=plan.collisionAtMs&&ms<plan.scoreStartMs?collision:-1);
  well.visible=heading.visible=mult.visible=equation.visible=score.visible=current.applied&&(!current.free||transferring||applied);
  mult.visible=equation.visible=current.applied&&applied;
  flyingNumber.visible=transferring;flyingNumber.text='×'+current.mult;flyingNumber.position.set(move.mult.x,move.mult.y);flyingNumber.scale.set(move.mult.scale);flyingNumber.alpha=1-collision;total.alpha=transferring?0:1;
  heading.text=transferring?'MULTIPLY':applied?'MULTIPLIER':'BASE WIN';mult.text=applied?'×'+current.mult:'';equation.text=applied?'$1.00 ×'+current.mult+' =':'';score.position.set(transferring?move.score.x:430,transferring?move.score.y:applied?427:355);score.scale.set(transferring?move.score.scale*(1-collision*.3):1);
  score.text=current.applied?'$'+(1+(current.mult-1)*(1-(1-count)**3)).toFixed(2):'$0.00';total.text='×'+Math.round(55+(current.mult-55)*plateCount);
  fx.setState({orbs,eyes:[eyes.left,eyes.right],gaze,gazeProgress,target,transfer:0,plate:{x:262,y:215},score:{x:430,y:350}});
  status.textContent=clock.toFixed(3)+' 秒 · '+(ms<plan.releaseMs?'蓄力／凝視':ms<plan.firstArrivalMs?'加速飛行':ms<plan.firstArrivalMs+plan.landMs?'命中停頓':current.applied?(ms<plan.collisionAtMs?'倍率飛向得分':ms<plan.scoreStartMs?'數字碰撞':'加倍跳數'):'碎裂回收');slider.value=clock.toFixed(3);
 }
 function seek(t:number){seeking=true;reset();draw(0);for(let p=0;p<t;p+=1/60){const dt=Math.min(1/60,t-p),before=clock;clock+=dt;rig.update(dt);fx.update(dt);draw(before);}playing=false;app.render();seeking=false;}
 app.ticker.add(()=>{const now=performance.now();if(!last||document.hidden){last=now;return;}const dt=Math.min(.05,(now-last)/1000);last=now;if(!playing)return;const previous=clock;clock+=dt;rig.update(dt);fx.update(dt);draw(previous);if(clock>=plan.endMs/1000+.25)playing=false;});
 document.querySelector<HTMLButtonElement>('#play')!.onclick=()=>{reset();draw(0);playing=true;};document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>playing=!playing;select.onchange=()=>seek(0);slider.oninput=()=>seek(Number(slider.value));
 reset();draw(0);status.textContent='可播放，或拖動時間軸逐格確認。這是美術審片，不是 Stake Engine 金流測試。';
}
start().catch(e=>{document.querySelector<HTMLElement>('#status')!.textContent=String(e);console.error(e);});
