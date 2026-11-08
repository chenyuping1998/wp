// Directed motion in milliseconds. No timers or random samples in the render path.
const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const cubic=(value:number)=>{const p=clamp(value);return p*p*p*(10+p*(-15+6*p));};
export const WIN_IMPACT=240;
export const WIN_OUTRO=520;
export function winEnvelope(clock:number,duration:number){return cubic(clock/320)*cubic((duration-clock)/WIN_OUTRO);}
export function winMotion(age:number,clock:number,duration:number,reduced=false){
 const enter=cubic((age-50)/150),exit=cubic((duration-clock)/WIN_OUTRO);
 const t=Math.max(0,(age-WIN_IMPACT)/1000);
 // The compression builds before contact. A Gaussian peak and a gated spring
 // keep position AND velocity continuous at contact instead of jumping 4–5%.
 const contact=(age-WIN_IMPACT)/1000;
 const impact=Math.exp(-Math.pow(contact/(contact<0?.068:.19),2));
 const rebound=Math.sin(t*19)*(1-Math.exp(-t*16))*Math.exp(-t*7.5);
 return {
  alpha:enter*exit,
  titleY:reduced?-86:-86-90*(1-cubic(age/WIN_IMPACT))+rebound*10,
  scaleX:reduced?1:1+.24*(1-cubic(age/WIN_IMPACT))-.04*impact+rebound*.025,
  scaleY:reduced?1:1+.38*(1-cubic(age/WIN_IMPACT))+.055*impact-rebound*.04,
  plateY:reduced?112:112+30*(1-cubic((age-100)/440))+rebound*3,
  plateScale:reduced?1:1+impact*.018,
  shake:reduced?0:Math.sin(t*46)*(1-Math.exp(-t*24))*impact*1.8,
  impact:reduced?0:impact,
  sheen:cubic((age-570)/700),
  exitY:reduced?0:-18*(1-exit),
 };
}
export type WinParticle={x:number;y:number;tailX:number;tailY:number;alpha:number;size:number;rotation:number};
const directions=Array.from({length:48},(_,index)=>{
 const angle=index*2.39996323,speed=180+(index%9)*29;
 return {angle,x:Math.cos(angle)*speed,y:Math.sin(angle)*speed*.68};
});
export function winParticle(index:number,age:number,result?:WinParticle){
 const life=1250+(index%7)*85,t=(age-WIN_IMPACT-(index%4)*18)/life;
 if(t<0||t>1)return null;
 const direction=directions[index]??{angle:index*2.39996323,x:Math.cos(index*2.39996323)*(180+(index%9)*29),y:Math.sin(index*2.39996323)*(180+(index%9)*29)*.68};
 const previous=Math.max(0,t-.035);
 // A short emission ramp avoids particles appearing at full brightness in one frame.
 const p=result??{x:0,y:0,tailX:0,tailY:0,alpha:0,size:0,rotation:0};
 p.x=direction.x*t;p.y=direction.y*t+180*t*t;p.tailX=direction.x*previous;p.tailY=direction.y*previous+180*previous*previous;
 p.alpha=cubic(t/.055)*Math.pow(1-t,1.6);p.size=1.2+(index%4)*.65;p.rotation=direction.angle+t*4;
 return p;
}
