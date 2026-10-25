import { Application, Assets, Graphics, Text } from 'pixi.js';
import { createMedusaRigScene } from '../src/game/medusaRigScene';

async function start(){
 const canvas=document.querySelector<HTMLCanvasElement>('#stage')!,status=document.querySelector<HTMLElement>('#status')!,clock=document.querySelector<HTMLElement>('#clock')!;
 const app=new Application();await app.init({canvas,width:960,height:960,antialias:true,background:0x14333e,resolution:1});
 const texture=await Assets.load('../../../../../static/assets/spines/medusa43/medusa.png');
 const floor=new Graphics().ellipse(480,910,280,18).fill({color:0x081c23,alpha:.5});app.stage.addChild(floor);
 const scene=createMedusaRigScene({'medusa.png':texture});app.stage.addChild(scene.root);
 const label=new Text({text:'SPINE 4.3 / 9 INDEPENDENT SNAKES',style:{fontFamily:'Arial',fontSize:22,fill:0xf3dfae}});label.position.set(22,20);app.stage.addChild(label);
 const clip=document.querySelector<HTMLSelectElement>('#clip')!,view=document.querySelector<HTMLSelectElement>('#view')!,scrub=document.querySelector<HTMLInputElement>('#scrub')!;
 const clips=scene.player.skeleton.data.animations;for(const animation of clips){const option=document.createElement('option');option.value=animation.name;option.textContent=`${animation.name} · ${animation.duration.toFixed(2)}s`;clip.appendChild(option);}
 let paused=false,night=false,last=0,time=0,mode:'manual'|'demo'|'idle'='manual',recording=false,recorder:MediaRecorder|undefined,previous=0;
 function frame(detail=false){view.value=detail?'detail':'full';const scale=detail?1.08:.445;scene.root.scale.set(scale);scene.root.position.set(detail?530:490,detail?2010:920);floor.visible=!detail;}
 function play(name=clip.value,hold=false){scene.reset();scene.play(name,hold);scene.update(0);time=0;scrub.value='0';paused=false;document.querySelector<HTMLButtonElement>('#pause')!.textContent='暫停';label.text=`${name.toUpperCase()} / SPINE 4.3 / 9 SNAKE CHAINS`;}
 function begin(next:'demo'|'idle'){mode=next;time=0;previous=0;night=false;scene.setFreegame(false);frame(next==='demo');play('idle');mode=next;status.textContent=next==='idle'?'錄製 60 秒待機；每次只有一條蛇短暫動作，身體保持穩定。':'18 秒：拉墨鏡與凝視近看 → 免費遊戲 → 全身大獎演出。';}
 app.ticker.add(()=>{
  const now=performance.now();if(!last||document.hidden){last=now;return;}const dt=(now-last)/1000;last=now;
  if(paused&&!recording)return;scene.update(dt);previous=time;time+=dt;clock.textContent=`${time.toFixed(2)}s · ${mode==='idle'?'60 秒待機':mode==='demo'?'動作展示':clip.value}`;
  if(mode==='demo'){
   const cue=(at:number,run:()=>void)=>{if(previous<at&&time>=at)run();};
   cue(1,()=>{scene.play('gaze');label.text='GAZE / FINGERS HOLD GLASSES RIM';});
   cue(3.3,()=>{scene.setFreegame(true);scene.play('fg_gaze');label.text='FREE GAME / SHORTER RELEASE';});
   cue(5.5,()=>{frame(false);scene.play('fg_trigger');label.text='FREE GAME TRIGGER / FULL FIGURE';});
   cue(8,()=>{scene.play('win_big',true);label.text='BIG WIN / RAISED HANDS + TAIL FLICK';});
   cue(12,()=>{scene.play('win_max',true);label.text='MAX WIN / NINE STAGGERED SNAKES';});
   cue(16,()=>{scene.play('fg_end',true);label.text='FREE GAME END / GLASSES RETURN';});
   if(time>=18)finish();
  }else if(mode==='idle'&&time>=60)finish();
 });
 function finish(){mode='manual';if(recorder?.state==='recording')recorder.stop();else status.textContent='演出已完成，可逐段重播與拖曳時間檢查。';}
 document.addEventListener('visibilitychange',()=>{last=0;});
 document.querySelector<HTMLButtonElement>('#play')!.onclick=()=>{mode='manual';play();};
 document.querySelector<HTMLButtonElement>('#pause')!.onclick=event=>{paused=!paused;(event.currentTarget as HTMLButtonElement).textContent=paused?'繼續':'暫停';};
 document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{mode='manual';scene.reset();time=0;paused=false;};
 document.querySelector<HTMLButtonElement>('#night')!.onclick=()=>{night=!night;scene.setFreegame(night);};
 view.onchange=()=>frame(view.value==='detail');
 clip.onchange=()=>{mode='manual';play();};
 scrub.oninput=()=>{mode='manual';scene.reset();scene.play(clip.value,true);time=Number(scrub.value)/100*(clips.find(a=>a.name===clip.value)?.duration??1);scene.update(time);paused=true;clock.textContent=`${clip.value} · ${time.toFixed(3)} 秒（逐格檢視）`;};
 document.querySelector<HTMLInputElement>('#reduced')!.onchange=event=>scene.setReducedMotion((event.currentTarget as HTMLInputElement).checked);
 function record(kind:'demo'|'idle'){
  if(recording)return;if(!window.MediaRecorder||!canvas.captureStream){status.textContent='此瀏覽器不支援錄影。';return;}
  scene.setReducedMotion(false);document.querySelector<HTMLInputElement>('#reduced')!.checked=false;
  begin(kind);const stream=canvas.captureStream(60),chunks:Blob[]=[];const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5500000});recording=true;
  recorder.onstart=()=>{last=performance.now();};recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recorder.onstop=()=>{const url=URL.createObjectURL(new Blob(chunks,{type:'video/webm'})),link=document.createElement('a');link.href=url;link.download=kind==='idle'?'MedusaGaze_idle_60s.webm':'MedusaGaze_character43.webm';const save=document.querySelector<HTMLAnchorElement>('#download')!;save.href=url;save.download=link.download;save.hidden=false;save.textContent='下載剛才的錄影';stream.getTracks().forEach(track=>track.stop());recording=false;status.textContent='已下載實際 Pixi / Spine 4.3 動畫錄影。此為角色檢視，非 Stake Engine 錄影。';};recorder.start();
 }
 document.querySelector<HTMLButtonElement>('#demo')!.onclick=()=>begin('demo');
 document.querySelector<HTMLButtonElement>('#record')!.onclick=()=>record('demo');
 document.querySelector<HTMLButtonElement>('#idle')!.onclick=()=>record('idle');
 document.querySelector<HTMLButtonElement>('#png')!.onclick=()=>{app.render();const link=document.createElement('a');link.download=`MedusaGaze_${clip.value}_${time.toFixed(2)}s.png`;link.href=canvas.toDataURL('image/png');link.click();};
 frame(false);play('idle');status.textContent='共用正式遊戲的骨架與渲染器。24 段動作、九條獨立蛇鏈，可逐格檢查手指與墨鏡。';
}
start().catch(error=>{document.querySelector<HTMLElement>('#status')!.textContent=String(error);console.error(error);});
