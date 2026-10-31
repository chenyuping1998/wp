import {Application,Assets,Container,Graphics,Mesh,MeshGeometry,Text,type Texture} from 'pixi.js';
import {symbolPoint,symbolPose,winHopPose,gravityProgress} from '../src/game/symbolMotion';
import {createMedusaRigScene} from '../src/game/medusaRigScene';
import {MEDUSA_HIGHLIGHT_MS} from '../src/game/ppMotion';

async function start(){
 const canvas=document.querySelector<HTMLCanvasElement>('#symbols')!,app=new Application();
 await app.init({canvas,width:1200,height:600,antialias:true,background:0x14343f});
 const names=['H1','H2','H3','H4','H5','S','L1','L2','L3','L4'];
 const root='../../../../../static/assets/';
 const textures=Object.fromEntries(await Promise.all(names.map(async name=>[name,await Assets.load<Texture>(root+'sprites/medusaSymbols/'+name.toLowerCase()+'.png')])));
 const sheet=new Container();app.stage.addChild(sheet);let geometries:MeshGeometry[]=[];
 function label(text:string,x:number,y:number,size=15){const l=new Text({text,style:{fontFamily:'Arial',fontSize:size,fill:0xf5dfaa}});l.position.set(x,y);sheet.addChild(l);}
 function draw(group:string){
  sheet.removeChildren().forEach(c=>c.destroy({children:true}));geometries.forEach(g=>g.destroy());geometries=[];
  const frames=[0,.089,.289,.467,.778,1],selected=group==='low'?names.slice(5):names.slice(0,5);
  label('MEDUSA / LOCAL CHAINS + DEPTH TURN / ACTUAL 98px SYMBOL SIZE',18,8,18);
  frames.forEach((p,i)=>label(Math.round(p*MEDUSA_HIGHLIGHT_MS)+'ms',145+i*174,41));
  selected.forEach((name,row)=>{
   label(name,22,108+row*102,20);
   frames.forEach((p,column)=>{
    const cx=176+column*174,cy=118+row*102,cell=new Graphics().roundRect(cx-57,cy-52,114,102,7).stroke({width:1,color:0x35545d});sheet.addChild(cell);
    const actor=new Container(),pose=symbolPose(name,p),hop=winHopPose(p,name),uv:number[]=[],positions:number[]=[],indices:number[]=[];
    const grid=32;for(let y=0;y<=grid;y++)for(let x=0;x<=grid;x++){
     const u=x/grid,v=y/grid,at=symbolPoint(name,u,v,p);uv.push(u,v);positions.push(at.x,at.y);
     if(x<grid&&y<grid){const a=y*(grid+1)+x;indices.push(a,a+1,a+grid+1,a+1,a+grid+2,a+grid+1);}
    }
    const geometry=new MeshGeometry({positions:new Float32Array(positions),uvs:new Float32Array(uv),indices:new Uint32Array(indices)});geometries.push(geometry);
    const body=new Mesh({geometry,texture:textures[name]}),glow=new Mesh({geometry,texture:textures[name]});glow.blendMode='add';glow.alpha=pose.glint;
    actor.addChild(body,glow);actor.position.set(cx+pose.x*98,cy+(hop.y+pose.y)*98);actor.scale.set(98*pose.sx*hop.sx,98*pose.sy*hop.sy);actor.rotation=pose.rotation;sheet.addChild(actor);
   });
  });app.render();
 }
 document.querySelector<HTMLSelectElement>('#group')!.onchange=e=>draw((e.currentTarget as HTMLSelectElement).value);draw('high');
 const character=new Application();await character.init({canvas:document.querySelector<HTMLCanvasElement>('#character')!,width:1200,height:470,antialias:true,background:0x14343f});
 const atlas=await Assets.load<Texture>(root+'spines/medusa43/medusa.png');
 for(const [index,time] of [0,.12,.32,.52,.65,.8].entries()){
  const rig=createMedusaRigScene({'medusa.png':atlas});rig.root.position.set(100+index*200,451);rig.root.scale.set(.205);character.stage.addChild(rig.root);rig.play('react_small');
  for(let p=0;p<time;p+=1/120)rig.update(Math.min(1/120,time-p));
  const l=new Text({text:time.toFixed(2)+'s',style:{fontFamily:'Arial',fontSize:18,fill:0xf5dfaa}});l.position.set(68+index*200,12);character.stage.addChild(l);
 }character.render();
 const drop=new Application();await drop.init({canvas:document.querySelector<HTMLCanvasElement>('#drop')!,width:1200,height:215,antialias:true,background:0x14343f});
 for(const [index,t] of [0,.35,.6,.725,.85,.925,1].entries()){
  const x=80+index*170,progress=gravityProgress(t),line=new Graphics().moveTo(x-48,165).lineTo(x+48,165).stroke({width:2,color:0x6c9694});drop.stage.addChild(line);
  const tex=textures.H4,mesh=new Mesh({geometry:new MeshGeometry({positions:new Float32Array([-40,-40,40,-40,40,40,-40,40]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),texture:tex});mesh.position.set(x,45+progress*80);drop.stage.addChild(mesh);
  const l=new Text({text:Math.round(t*360)+'ms',style:{fontFamily:'Arial',fontSize:17,fill:0xf5dfaa}});l.position.set(x-30,184);drop.stage.addChild(l);
 }drop.render();
 document.querySelector<HTMLElement>('#status')!.textContent='逐格表已完成。共用正式遊戲曲線與貼圖；沒有影片輸出。';
}
start().catch(error=>{document.querySelector<HTMLElement>('#status')!.textContent=String(error);console.error(error);});
