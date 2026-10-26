import { Application,Assets,Container,Graphics,Sprite,Text,ColorMatrixFilter } from 'pixi.js';
import { createMedusaRigScene } from '../src/game/medusaRigScene';
import { createMultiplierFxScene } from '../src/game/multiplierFxScene';
import { flightPose,impactPose,gazePose,ORB_CHARGE_DISTANCE,type OrbVisual } from '../src/game/multiplierPerformance';
import { drawMultiplierReadout } from '../src/game/multiplierReadout';
import { medusaAnimations,throwTiming } from '../src/game/animationTimeline';
async function start(){
 const stage=document.querySelector<HTMLCanvasElement>('#stage')!,status=document.querySelector<HTMLElement>('#status')!,slider=document.querySelector<HTMLInputElement>('#time')!,select=document.querySelector<HTMLSelectElement>('#case')!;
 const app=new Application();await app.init({canvas:stage,width:1280,height:720,background:0x14343f,antialias:true});
 await document.fonts.load('24px "Titan One"');await document.fonts.ready;
 const root='../../../../../static/assets/';const paths=['spines/medusa43/medusa.png','sprites/medusaOrbs/orb_green.png','sprites/medusaOrbs/orb_purple.png','sprites/medusaOrbs/orb_gold.png','sprites/medusaUi/total_plate.png'];
 const [cast,green,purple,gold,plaque]=await Promise.all(paths.map(p=>Assets.load(root+p)));
 const rig=createMedusaRigScene({'medusa.png':cast});rig.root.scale.set(.32);rig.root.position.set(1000,685);app.stage.addChild(rig.root);
 const fx=createMultiplierFxScene({green,purple,gold});app.stage.addChild(fx.root);
 const stoneMaterial=new ColorMatrixFilter();stoneMaterial.saturate(-1);
 const well=new Graphics();well.position.set(430,350);app.stage.addChild(well);
 const plate=new Sprite(plaque);plate.anchor.set(.5);plate.position.set(220,215);plate.width=270;plate.height=168.75;app.stage.addChild(plate);
 const text=(size:number,color:number,x:number,y:number)=>{const t=new Text({text:'',style:{fontFamily:'"Titan One",Arial',fontSize:size,fill:color,stroke:{color:0x10232c,width:3}}});t.anchor.set(.5);t.position.set(x,y);app.stage.addChild(t);return t;};
 const score=text(48,0xffe4a3,430,427),mult=text(80,0xb8ff5a,430,313),total=text(44,0xffe4a3,262,224),caption=text(21,0xefe8d8,360,32),heading=text(23,0xc3d5b6,430,262),equation=text(27,0xf0ead2,430,375),totalLabel=text(17,0xffedc1,262,180);totalLabel.text='TOTAL';
 const bodies=Array.from({length:3},()=>{const c=new Container(),body=new Sprite(green);body.anchor.set(.5);body.width=body.height=92;const label=new Text({text:'',style:{fontFamily:'"Titan One",Arial',fontSize:32,fill:0xffffff,stroke:{color:0x19313b,width:4}}});label.anchor.set(.5);c.addChild(body,label);app.stage.addChild(c);return{c,body,label};});
 const cases=[{name:'一般局 ×25',free:false,turbo:false,applied:true,values:[25],mult:25},{name:'免費遊戲 ×8',free:true,turbo:false,applied:true,values:[8],mult:63},{name:'免費遊戲三顆',free:true,turbo:false,applied:true,values:[8,15,100],mult:178},{name:'未得分碎裂',free:false,turbo:false,applied:false,values:[25],mult:1},{name:'Turbo ×100',free:false,turbo:true,applied:true,values:[100],mult:100}];
 for(let i=0;i<cases.length;i++){const o=document.createElement('option');o.value=String(i);o.textContent=cases[i].name;select.appendChild(o);}
 let current=cases[0],plan=throwTiming({freegame:false,turbo:false,applied:true,orbCount:1,mult:25}),clock=0,playing=false,last=0;
 const hit=new Set<number>(),cracked=new Set<number>(),played=new Set<string>();
 function sound(cue:string,speed=1){if(!document.querySelector<HTMLInputElement>('#sound')!.checked)return;const a=new Audio(root+'audio/medusa/'+cue+'.wav');a.volume=.55;a.playbackRate=speed;void a.play();}
 function reset(){current=cases[Number(select.value)];plan=throwTiming({freegame:current.free,turbo:current.turbo,applied:current.applied,orbCount:current.values.length,mult:current.mult});clock=0;hit.clear();cracked.clear();played.clear();fx.clearTransient();rig.reset();rig.setFreegame(current.free);rig.play(plan.animation,false,medusaAnimations[plan.animation].releaseAtMs/plan.releaseMs);plate.visible=current.free;total.visible=current.free;totalLabel.visible=current.free;caption.text=current.name+' / 正式骨架與同一套特效';}
 function draw(previous:number){const ms=clock*1000,eyes=rig.getGazeAnchors(),target=current.free?{x:262,y:215}:{x:430,y:350},direction=Math.hypot(target.x-eyes.center.x,target.y-eyes.center.y)||1;
  const from={x:eyes.center.x+(target.x-eyes.center.x)/direction*ORB_CHARGE_DISTANCE,y:eyes.center.y+(target.y-eyes.center.y)/direction*ORB_CHARGE_DISTANCE},orbs:OrbVisual[]=[];const charge=current.turbo?70:130;
  const cue=(at:number,key:string,id=key)=>{if(previous*1000<=at&&ms>=at&&!played.has(id)){played.add(id);sound(key,current.turbo?1.5:1);}};
  cue(0,'sfx_gaze_charge');if(!current.free)cue(current.turbo?100:200,'sfx_glasses_slide');cue(current.applied?medusaAnimations[plan.animation].beamAtMs:Math.max(0,plan.releaseMs-100),'sfx_gaze_beam');
  if(!current.free&&current.applied)cue(medusaAnimations[plan.animation].durationMs-120,'sfx_glasses_on');
  if(current.free&&current.applied){cue(plan.plateCountStartMs,'sfx_total_mult_up');cue(plan.scoreStartMs-plan.beamMs,'sfx_total_to_win');}
  current.values.forEach((value,index)=>{const launch=plan.releaseMs+index*plan.staggerMs,arrival=launch+plan.flightMs,end=current.applied?target:current.free?{x:target.x+(eyes.center.x-target.x)*.14,y:target.y+(eyes.center.y-target.y)*.14}:target;
   cue(launch,'sfx_orb_fly','flight'+index);const orb:OrbVisual={id:index,value,...from,scale:1,alpha:0,stone:0,crack:0,angle:0,sx:1,sy:1,trail:[]};
   if(ms>=launch-charge&&ms<launch){const p=(ms-launch+charge)/charge;Object.assign(orb,{scale:.12+.76*(1-(1-p)**3),alpha:p,charging:true});}
   else if(ms>=launch&&ms<arrival)Object.assign(orb,flightPose(from,end,(ms-launch)/plan.flightMs),{alpha:1});
   else if(ms>=arrival&&ms<arrival+(current.applied?plan.landMs:plan.shatterMs*.45)){if(current.applied)Object.assign(orb,end,impactPose((ms-arrival)/plan.landMs));else Object.assign(orb,end,{alpha:1,stone:1});}
   if(ms>=arrival&&!hit.has(index)){hit.add(index);if(current.applied){fx.impact(end,value,current.free?'plate':'score');sound('sfx_orb_hit_'+(value>=100?'l':value>=15?'m':'s'));}else{sound('sfx_orb_crack');if(index===0)rig.play('gaze_dud',false,medusaAnimations.gaze_dud.durationMs/Math.max(120,plan.endMs-plan.firstArrivalMs));}}
   if(!current.applied&&ms>=arrival+plan.shatterMs*.45&&!cracked.has(index)){cracked.add(index);fx.shatter(end,value);}
   orbs.push(orb);const item=bodies[index];item.c.visible=orb.alpha>0;item.c.position.set(orb.x,orb.y);item.c.alpha=orb.alpha;item.body.texture=value>=100?gold:value>=15?purple:green;item.body.rotation=orb.angle;item.body.scale.set(92/item.body.texture.width*orb.scale*orb.sx,92/item.body.texture.height*orb.scale*orb.sy);item.body.tint=orb.stone?0xa6a59a:0xffffff;item.body.filters=orb.stone?[stoneMaterial]:[];item.label.text='×'+value;item.label.style.fontSize=value>=100?26:32;item.label.scale.set(orb.scale);
  });for(let i=current.values.length;i<bodies.length;i++)bodies[i].c.visible=false;
  const beamAt=current.applied?medusaAnimations[plan.animation].beamAtMs:Math.max(0,plan.releaseMs-100),beamEnd=Math.max(beamAt+100,Math.min(medusaAnimations[plan.animation].beamEndMs,plan.lastArrivalMs)),gazeProgress=ms>=beamAt&&ms<beamEnd?(ms-beamAt)/(beamEnd-beamAt):-1,gaze=gazeProgress>=0?gazePose(gazeProgress).intensity:0;
  const count=Math.max(0,Math.min(1,(ms-plan.scoreStartMs)/Math.max(1,plan.countMs))),plateCount=Math.max(0,Math.min(1,(ms-plan.plateCountStartMs)/Math.max(1,plan.plateCountMs)));
  const applied=ms>=plan.scoreStartMs&&current.applied;drawMultiplierReadout(well,1,gazeProgress);
  well.visible=heading.visible=mult.visible=equation.visible=score.visible=current.applied&&(!current.free||applied);
  if(ms>=plan.firstArrivalMs&&ms<plan.scoreStartMs)score.visible=false;
  heading.text=applied?'MULTIPLIER':'BASE WIN';mult.text=applied?'×'+current.mult:'';equation.text=applied?'$1.00 ×'+current.mult+' =':'';score.y=applied?427:355;
  score.text=current.applied?'$'+(1+(current.mult-1)*(1-(1-count)**3)).toFixed(2):'$0.00';total.text='×'+Math.round(55+(current.mult-55)*plateCount);
  fx.setState({orbs,eyes:[eyes.left,eyes.right],gaze,gazeProgress,target,transfer:current.free&&ms>=plan.scoreStartMs-150&&ms<plan.scoreStartMs?Math.sin(Math.PI*(ms-plan.scoreStartMs+150)/150):0,plate:{x:262,y:215},score:{x:430,y:350}});
  status.textContent=clock.toFixed(3)+' 秒 · '+(ms<plan.releaseMs?'蓄力／凝視':ms<plan.firstArrivalMs?'加速飛行':ms<plan.firstArrivalMs+plan.landMs?'命中停頓':current.applied?'加倍跳數':'碎裂回收');slider.value=clock.toFixed(3);
 }
 function seek(t:number){reset();draw(0);for(let p=0;p<t;p+=1/60){const dt=Math.min(1/60,t-p),before=clock;clock+=dt;rig.update(dt);fx.update(dt);draw(before);}playing=false;app.render();}
 app.ticker.add(()=>{const now=performance.now();if(!last||document.hidden){last=now;return;}const dt=Math.min(.05,(now-last)/1000);last=now;if(!playing)return;const previous=clock;clock+=dt;rig.update(dt);fx.update(dt);draw(previous);if(clock>=3.6)playing=false;});
 document.querySelector<HTMLButtonElement>('#play')!.onclick=()=>{reset();draw(0);playing=true;};document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>playing=!playing;select.onchange=()=>seek(0);slider.oninput=()=>seek(Number(slider.value));
 reset();draw(0);status.textContent='可播放，或拖動時間軸逐格確認。這是美術審片，不是 Stake Engine 金流測試。';
}
start().catch(e=>{document.querySelector<HTMLElement>('#status')!.textContent=String(e);console.error(e);});
