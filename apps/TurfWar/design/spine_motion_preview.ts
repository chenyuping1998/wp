// @ts-nocheck -- browser QA bundle, excluded from production.
import { Application, Assets, Rectangle } from 'pixi.js';
import { SpineCastFigure } from '../src/game/spineCastFigure';

const status = document.querySelector('#status');
const app = new Application();
await app.init({ width: 800, height: 560, background: '#20252e', antialias: true, resolution: 1, preserveDrawingBuffer: true });
document.querySelector('#preview').append(app.canvas);
const figures = [];
for (const [i,variant] of ['base','fg'].entries()) {
  const base = `./game/assets/castLayers/turf/v5/${variant}/`;
  const json = await (await fetch(base+'cast.spine.json')).json();
  const textures = Object.fromEntries(await Promise.all(json.slots.map(async s => [s.name,await Assets.load(base+s.name+'.png')])));
  const figure = new SpineCastFigure(json,textures,`preview-${variant}`);
  const [x0,y0,x1,y1] = figure.figureBox;
  const scale = 490/(y1-y0);
  figure.view.scale.set(scale);
  figure.view.position.set(200+400*i-(x0+x1)*scale/2, 40-y0*scale);
  app.stage.addChild(figure.view); figures.push(figure);
}
let clock = 0;
const tick = ticker => { clock += ticker.deltaMS; figures.forEach(f => f.update(clock)); };
app.ticker.add(tick);
status.textContent='已載入 · v5 加權網格';
document.querySelectorAll('[data-reaction]').forEach(button => button.onclick = () => {
  const kind = button.dataset.reaction;
  const speed = +document.querySelector('#speed').value;
  figures.forEach(f => f.react(kind,clock,speed)); status.textContent=`${kind} · ${speed}×`;
});
document.querySelector('#showGame').onclick=()=>{document.querySelector('#preview').classList.add('hidden');document.querySelector('#gamePanel').classList.remove('hidden');};
document.querySelector('#showPreview').onclick=()=>{document.querySelector('#gamePanel').classList.add('hidden');document.querySelector('#preview').classList.remove('hidden');};
document.querySelector('#base').onclick=()=>{const w=document.querySelector('#game').contentWindow;w.__stub.force(1);w.__HM_BETMODE__?.('BASE');};
document.querySelectorAll('[data-book]').forEach(button=>button.onclick=()=>{const w=document.querySelector('#game').contentWindow;w.__stub.force(+button.dataset.book);w.__HM_BETMODE__?.('BASE');status.textContent='本機 book '+button.dataset.book+' 已選，按 SPIN';});
document.querySelector('#bonus').onclick=()=>{const w=document.querySelector('#game').contentWindow;w.__stub.force(50);w.__HM_BETMODE__?.('BASE');};
const resizeGame=()=>{
  const [width,height]=document.querySelector('#viewport').value.split(',').map(Number);
  const frame=document.querySelector('#game');const scale=Math.min(1,window.innerWidth/width);
  Object.assign(frame.style,{width:width+'px',height:height+'px',transformOrigin:'top left',transform:`scale(${scale})`});
  document.querySelector('#gameWrap').style.height=height*scale+'px';
};
document.querySelector('#viewport').onchange=resizeGame;window.addEventListener('resize',resizeGame);resizeGame();
document.querySelector('#captureGame').onclick=async()=>{
  const w=document.querySelector('#game').contentWindow;
  const game=w.__PIXI_APP__;if(!game){status.textContent='遊戲尚未載入';return;}
  game.renderer.render(game.stage);
  const canvas=game.renderer.extract.canvas({target:game.stage,frame:new Rectangle(0,0,game.screen.width,game.screen.height),resolution:1});
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  const size=document.querySelector('#viewport').value.replace(',','x');
  const mode=w.__HM_GAME__?.().gameType??'unknown';
  await fetch(`/capture/game-${mode}-${size}.png`,{method:'PUT',body:blob});status.textContent=`已儲存 ${mode} ${size}`;
};
document.querySelector('#export').onclick=async()=>{
  app.ticker.stop(); status.textContent='輸出 72 格…';
  const sheet=document.createElement('canvas');sheet.width=800*8;sheet.height=560*9;
  const ctx=sheet.getContext('2d');
  figures.forEach(f=>{f.state.clearTracks();f.state.setAnimation(0,f.skeleton.data.findAnimation('idle')?'idle':'idle_weave',true);});
  // Six 60Hz simulation steps per recorded frame: exercise the real updater.
  for(let frame=0;frame<72;frame++){
    if(frame===12)figures.forEach(f=>f.react('win',clock));
    if(frame===29)figures.forEach(f=>f.react('winBig',clock));
    if(frame===49)figures.forEach(f=>f.react('trigger',clock));
    for(let step=0;step<6;step++){clock+=1000/60;figures.forEach(f=>f.update(clock));}
    app.renderer.render(app.stage);ctx.drawImage(app.canvas,(frame%8)*800,Math.floor(frame/8)*560);
  }
  const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));
  await fetch('/capture/preview-sheet.png',{method:'PUT',body:blob});
  app.ticker.start();status.textContent='72 格已儲存 · idle → win → winBig → trigger';
};

document.querySelector('#socialMode').onclick=()=>{document.querySelector('#game').src='./game/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=GC&lang=en&social=true';};
document.querySelector('#replayMode').onclick=()=>{document.querySelector('#game').src='./game/?hmdebug=1&replay=true&rgs_url=stub.local&game=turf_war&version=1&mode=BASE&event=64&amount=1000000&currency=USD&lang=en';};
document.querySelector('#diagnose').onclick=()=>{
 const w=document.querySelector('#game').contentWindow;
 const app=w.__PIXI_APP__;const buttons=[];const texts=[];
 const walk=(node,hidden)=>{const h=hidden||!node.visible||node.alpha===0;if(typeof node.text==='string'&&!h)texts.push(node.text);if(node.eventMode==='static'&&!h){const b=node.getBounds();buttons.push({label:node.label,x:b.x,y:b.y,w:b.width,h:b.height});}for(const c of node.children??[])walk(c,h);};if(app)walk(app.stage,false);
 const result={game:w.__HM_GAME__?.(),reels:w.__HM_REELS__?.(),stats:w.__stub?.stats(),audit:w.__textAudit?.scan(),texts,buttons};
 document.querySelector('#diagnostics').textContent=JSON.stringify(result,null,2);
 fetch('/capture/diagnostic-'+Date.now()+'.json',{method:'PUT',body:JSON.stringify(result,null,2)});
};

document.querySelector('#recordGame').onclick=async()=>{
 const w=document.querySelector('#game').contentWindow;const game=w.__PIXI_APP__;if(!game)return;
 const sheet=document.createElement('canvas');sheet.width=640*5;sheet.height=360*4;const ctx=sheet.getContext('2d');
 for(let i=0;i<20;i++){
  await new Promise(r=>setTimeout(r,150));game.renderer.render(game.stage);
  const frame=game.renderer.extract.canvas({target:game.stage,frame:new Rectangle(0,0,game.screen.width,game.screen.height),resolution:1});
  ctx.drawImage(frame,(i%5)*640,Math.floor(i/5)*360,640,360);
 }
 const blob=await new Promise(r=>sheet.toBlob(r,'image/png'));await fetch('/capture/game-motion-sheet.png',{method:'PUT',body:blob});status.textContent='實際遊戲 3 秒動作已儲存';
};

// QA-only shortcut: save the live canvas while the real mouse stays hovered.
const hoverShot=(event)=>{if(event.key.toLowerCase()==='h')document.querySelector('#captureGame').onclick();};
document.addEventListener('keydown',hoverShot);
const frame=document.querySelector('#game');frame.addEventListener('load',()=>frame.contentDocument.addEventListener('keydown',hoverShot));
frame.contentDocument?.addEventListener('keydown',hoverShot);

document.querySelector('#touchTest').onclick=async()=>{
 const w=document.querySelector('#game').contentWindow;const game=w.__PIXI_APP__;const targets=[];
 const walk=n=>{if(!n.visible||n.alpha===0)return;if(n.eventMode==='static'){const b=n.getBounds();if(b.x>40&&b.width>=44&&b.width<90&&b.height>=44&&b.y>game.screen.height*.65)targets.push({n,b});}for(const c of n.children??[])walk(c);};walk(game.stage);
 const target=targets[0];if(!target){status.textContent='找不到可測試的按鈕';return;}const b=target.b;
 const shot=async(name)=>{game.renderer.render(game.stage);const c=game.renderer.extract.canvas({target:game.stage,frame:new Rectangle(b.x,b.y,b.width,b.height),resolution:1});const blob=await new Promise(r=>c.toBlob(r,'image/png'));await fetch('/capture/'+name+'.png',{method:'PUT',body:blob});};
 await shot('touch-before');const rect=game.canvas.getBoundingClientRect();
 for(const type of ['pointerover','pointerdown','pointerup'])game.canvas.dispatchEvent(new w.PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:77,isPrimary:true,buttons:type==='pointerdown'?1:0,button:0,clientX:rect.left+(b.x+b.width/2)*rect.width/game.screen.width,clientY:rect.top+(b.y+b.height/2)*rect.height/game.screen.height}));
 await new Promise(r=>setTimeout(r,250));await shot('touch-after');status.textContent='已送出 touch over/down/up，保存按鈕前後畫面';
};
