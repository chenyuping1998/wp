/** Settled-board acting: two layers (ambient loop + a short act), authored per Dragon Tide symbol.
 * H1–H4 are framed tiles that fill the cell, so their acts lift and pulse rather than swing:
 * a tile corner must never leave the cell (design/check_symbol_idle.mjs). */
export const SYMBOL_IDLE_WRAP = 120;
const TAU=Math.PI*2;
const bell=(u:number)=>u<0?0:Math.sin(Math.PI*u)**2;
const ring=(u:number,n=3)=>u<0?0:Math.sin(Math.PI*n*u)*Math.sin(Math.PI*u);
export const SYMBOL_IDLE_SPECS = {
 H1:{loop:3,cycle:6,duration:1.2,pivotX:0,pivot:0,description:'Wave crown tile lifts and swells'},
 H2:{loop:2.5,cycle:5,duration:1,pivotX:0,pivot:0,description:'Trident tile pulses with a small twist'},
 H3:{loop:4,cycle:8,duration:1.6,pivotX:0,pivot:0,description:'Jade ruyi tile settles and swells'},
 H4:{loop:1,cycle:4,duration:.8,pivotX:0,pivot:0,description:'Gold ingot tile hops with a squash'},
 L1:{loop:4,cycle:6,duration:1,pivotX:0,pivot:0,description:'Gold scale plaque drifts and flicks upward'},
 L2:{loop:5,cycle:5,duration:1.2,pivotX:0,pivot:-.24,description:'Red scale plaque narrows then opens'},
 L3:{loop:2.5,cycle:8,duration:1.1,pivotX:0,pivot:-.34,description:'Purple scale diamond pendulum kick'},
 L4:{loop:3,cycle:7.5,duration:.9,pivotX:0,pivot:0,description:'Jade scale shield double beat'},
 L5:{loop:3,cycle:7.5,duration:.9,pivotX:0,pivot:0,description:'Blue scale plaque pulses'},
 M:{loop:2,cycle:4,duration:1,pivotX:0,pivot:0,description:'Dragon pearl mount breathes'},
 S:{loop:2,cycle:4,duration:1.4,pivotX:0,pivot:.3,description:'Dragon Gate sways and swings open a touch'},
} as const;
export type IdleFrame={x:number;y:number;rotation:number;sx:number;sy:number;act:number;u:number;loop:number};
export const idleCellPhase=(reel:number,row:number)=>((reel*37+row*61+reel*row*13)%127)/127*119;
export function symbolIdleFrame(name:string,seconds:number,phase=0,enabled=true):IdleFrame {
 const spec=SYMBOL_IDLE_SPECS[name as keyof typeof SYMBOL_IDLE_SPECS];
 const f:IdleFrame={x:0,y:0,rotation:0,sx:1,sy:1,act:0,u:-1,loop:0};if(!spec||!enabled)return f;
 const t=((seconds+phase)%SYMBOL_IDLE_WRAP+SYMBOL_IDLE_WRAP)%SYMBOL_IDLE_WRAP;
 const within=t%spec.cycle,u=within<spec.duration?within/spec.duration:-1;
 const l=t/spec.loop*TAU,a=bell(u);f.act=a;f.u=u;f.loop=l;
 switch(name){
 case 'H1':f.rotation=.006*Math.sin(l);f.y=-.034*a;f.sx=1+.03*a;f.sy=1+.01*Math.sin(l)+.04*a;break;
 case 'H2':f.rotation=.008*Math.sin(l)+.03*ring(u,2);f.sx=f.sy=1+.045*a;break;
 case 'H3':f.sy=1+.012*Math.sin(l)+.045*a;f.sx=1-.012*Math.sin(l)+.025*a;f.y=-.012*a;break;
 case 'H4':{const hop=u<0?0:Math.sin(Math.PI*u);f.y=-.04*hop;f.sx=1+.03*ring(u,2);f.sy=1+.012*Math.sin(l)-.03*ring(u,2);break;}
 case 'L1':f.y=.009*Math.sin(l)-.05*a;f.rotation=.012*Math.cos(l)+.08*ring(u,2);break;
 case 'L2':f.rotation=.014*Math.sin(l);f.sx=1-.10*a;f.sy=1+.015*Math.cos(l)+.03*a;break;
 case 'L3':f.rotation=.02*Math.sin(l)+.13*ring(u,3);f.x=.012*Math.cos(l);break;
 case 'L4':{const p=u<0?0:Math.max(0,Math.sin(u*TAU*2))*Math.sin(Math.PI*u);f.sx=1+.06*p;f.sy=1+.012*Math.sin(l)+.065*p;break;}
 case 'L5':f.rotation=.012*Math.sin(l)+.04*ring(u,2);f.sx=f.sy=1+.05*a;break;
 case 'M':f.sy=1+.01*Math.sin(l);f.y=-.035*a;f.sx=1+.02*a;break;
 case 'S':f.rotation=.022*Math.sin(l)+.095*a;f.sx=f.sy=1+.015*Math.sin(l)+.045*a;break;
 }
 // Rotate around the object's actual base / hanging point, not canvas center.
 f.x+=spec.pivotX*(1-Math.cos(f.rotation))+spec.pivot*Math.sin(f.rotation);f.y+=spec.pivot*(1-Math.cos(f.rotation))-spec.pivotX*Math.sin(f.rotation);
 return f;
}
