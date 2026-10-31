/** All coordinates belong to the fixed painted 1920×1080 set. */
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
const posts=[[488,708,570,910],[825,707,903,910],[1201,707,1282,910],[1604,580,1704,910]];
export function seaWeight(x:number,y:number){
 const edge=Math.min(733,901-x*.13);let w=smooth(345,390,x)*(1-smooth(1695,1740,x))*smooth(545,570,y)*(1-smooth(edge-22,edge,y));
 for(const [l,t,r,b] of posts){const inside=smooth(l-12,l,x)*(1-smooth(r,r+12,x))*smooth(t-10,t,y)*(1-smooth(b,b+10,y));w*=1-inside;}return w;
}
export function seaSample(x:number,y:number,time:number,reduced=false,weight=seaWeight(x,y)){
 const w=reduced?0:weight,depth=clamp01((y-550)/185);
 return {u:(x+w*(Math.sin(x*.012+y*.028-time*.68)*4.0+Math.sin(x*.027-y*.014+time*.43))*(.35+depth*.65))/1920,v:(y+w*(Math.sin(x*.015+y*.054-time*.95)*8.2+Math.sin(x*.006-y*.029-time*.57)*2.8)*(.30+depth*.70))/1080};
}
type Point=readonly[number,number];
const polygon=(ctx:CanvasRenderingContext2D,p:readonly Point[])=>{ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
const receivers:readonly (readonly Point[])[]=[[[0,0],[538,0],[538,557],[0,433]],[[625,207],[1015,493],[1030,796],[625,691]],[[357,806],[1155,758],[1900,1010],[1900,1080],[360,1080]]];
export function paintAmbient(shadow:CanvasRenderingContext2D,light:CanvasRenderingContext2D,time:number,kind:'purrfia'|'parrot',feature:boolean,reduced:boolean){
 for(const ctx of [shadow,light]){ctx.setTransform(ctx.canvas.width/1920,0,0,ctx.canvas.height/1080,0,0);ctx.clearRect(0,0,1920,1080);}const t=reduced?0:time;
 if(kind==='purrfia'&&!feature){
  const cloud=.5+.30*Math.sin(t*.133)+.20*Math.sin(t*.071+1.4),drift=30*Math.sin(t*.17)+12*Math.sin(t*.071);
  for(const [index,points] of receivers.entries()){
   shadow.save();light.save();polygon(shadow,points);shadow.clip();polygon(light,points);light.clip();
   const g=shadow.createLinearGradient(-320+150*Math.sin(t*.11),0,1320+150*Math.sin(t*.11),1000);g.addColorStop(0,`rgba(42,56,78,${.055+cloud*.12})`);g.addColorStop(.52,`rgba(42,56,78,${.09+cloud*.19})`);g.addColorStop(1,'rgba(42,56,78,0)');shadow.fillStyle=g;shadow.fillRect(0,0,1920,1080);
   shadow.translate(580,200);shadow.transform(1,.82,0,1,0,drift);light.translate(580,200);light.transform(1,.82,0,1,0,drift);
   for(let n=-18;n<20;n++){
    const y=n*(index===0?48:61),band=shadow.createLinearGradient(0,y-4,0,y+11);band.addColorStop(0,'rgba(18,30,49,0)');band.addColorStop(.35,`rgba(18,30,49,${index===0?.065:.17})`);band.addColorStop(.7,`rgba(18,30,49,${index===0?.065:.17})`);band.addColorStop(1,'rgba(18,30,49,0)');shadow.fillStyle=band;shadow.fillRect(-900,y-4,2400,15);
    light.fillStyle=`rgba(255,223,160,${(.055+(1-cloud)*.065)*(index===0?.65:1)})`;light.fillRect(-900,y+13,2400,26);
   }shadow.restore();light.restore();
  }
 }else if(kind==='purrfia'){
  light.save();polygon(light,[[250,885],[840,740],[1140,740],[1880,1010],[1900,1080],[250,1080]]);light.clip();
  for(let i=0;i<16;i++){const p=(t*.035+i*.137)%1,x=i<8?350+p*145:1590+p*130,y=825+(i%8)*31,w=35+(i%5)*10;light.fillStyle=`rgba(${i<8?'255,96,183':'255,198,104'},${Math.sin(p*Math.PI)*.10})`;light.beginPath();light.ellipse(x,y,w,1.2+Math.sin(p*Math.PI)*.7,0,0,Math.PI*2);light.fill();}light.restore();
 }else{
  for(let i=0;i<48;i++){
   const p=(t*.12+i*.173)%1,y=566+(i%6)*23+p*25,x=365+((i*193)%1335)+p*11,depth=clamp01((y-550)/180),w=seaWeight(x,y),length=22+depth*58,alpha=Math.sin(p*Math.PI)*(.12+depth*.22)*w;
   if(w<.2)continue;light.strokeStyle=feature?`rgba(161,230,255,${alpha})`:`rgba(237,255,246,${alpha})`;light.lineWidth=.8+depth*.9;light.beginPath();let open=false;
   for(let s=0;s<=14;s++){const xx=x+(s/14-.5)*length,yy=y+Math.sin(s*.65+i)*1.1+Math.sin(s*1.6+i)*.35;if(seaWeight(xx,yy)<.2){open=false;continue;}if(open)light.lineTo(xx,yy);else{light.moveTo(xx,yy);open=true;}}light.stroke();
  }
 }
}
