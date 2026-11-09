/** Settled-board acting: two layers, authored for each circus prop. */
export const SYMBOL_IDLE_WRAP = 120;
const TAU=Math.PI*2;
const bell=(u:number)=>u<0?0:Math.sin(Math.PI*u)**2;
const ring=(u:number,n=3)=>u<0?0:Math.sin(Math.PI*n*u)*Math.sin(Math.PI*u);
export const SYMBOL_IDLE_SPECS = {
 H1:{loop:3,cycle:6,duration:1.2,pivotX:0,pivot:.34,description:'Hat balances on its brim, tips and lifts'},
 H2:{loop:2.5,cycle:5,duration:1,pivotX:-.28,pivot:.36,description:'Lollipop sways from its stick and turns'},
 H3:{loop:4,cycle:8,duration:1.6,pivotX:0,pivot:.32,description:'Crystal settles on its base, inner orbit circles'},
 H4:{loop:1,cycle:4,duration:.8,pivotX:.31,pivot:-.38,description:'Bell hangs from its handle and rings'},
 H5:{loop:3,cycle:7.5,duration:1.1,pivotX:0,pivot:.3,description:'Banana rocks on its peel and hops'},
 L1:{loop:4,cycle:6,duration:1,pivotX:0,pivot:0,description:'Star ticket drifts and flicks upward'},
 L2:{loop:5,cycle:5,duration:1.2,pivotX:0,pivot:-.24,description:'Moon ticket curls inward then opens'},
 L3:{loop:2.5,cycle:8,duration:1.1,pivotX:0,pivot:-.34,description:'Diamond ticket pendulum kick'},
 L4:{loop:3,cycle:7.5,duration:.9,pivotX:0,pivot:0,description:'Heart ticket double heartbeat'},
 L5:{loop:3,cycle:7.5,duration:.9,pivotX:0,pivot:0,description:'Placeholder: low symbol pulse'},
 M:{loop:2,cycle:4,duration:1,pivotX:0,pivot:0,description:'Placeholder: pearl body'},
 S:{loop:2,cycle:4,duration:1.4,pivotX:0,pivot:.3,description:'Spiral paddle sways and makes a hypnotic turn'},
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
 case 'H1':f.rotation=.018*Math.sin(l)-.12*ring(u,2);f.y=-.045*a;f.sy=1+.016*Math.sin(l)+.04*a;break;
 case 'H2':f.rotation=.027*Math.sin(l)+.14*ring(u,2);f.sx=1-.055*a;break;
 case 'H3':f.sy=1+.012*Math.sin(l)+.05*a;f.sx=1-.018*Math.sin(l)+.03*a;f.y=-.012*a;break;
 case 'H4':f.rotation=.025*Math.sin(l)+.19*ring(u,5);break;
 case 'H5':f.rotation=.018*Math.sin(l)-.085*a;f.y=-.065*a;f.sx=1+.035*ring(u,3);f.sy=1-.04*ring(u,3);break;
 case 'L1':f.y=.009*Math.sin(l)-.05*a;f.rotation=.012*Math.cos(l)+.08*ring(u,2);break;
 case 'L2':f.rotation=.014*Math.sin(l);f.sx=1-.10*a;f.sy=1+.015*Math.cos(l)+.03*a;break;
 case 'L3':f.rotation=.02*Math.sin(l)+.13*ring(u,3);f.x=.012*Math.cos(l);break;
 case 'L4':{const p=u<0?0:Math.max(0,Math.sin(u*TAU*2))*Math.sin(Math.PI*u);f.sx=1+.06*p;f.sy=1+.012*Math.sin(l)+.065*p;break;}
 case 'S':f.rotation=.022*Math.sin(l)+.095*a;f.sx=f.sy=1+.015*Math.sin(l)+.045*a;break;
 }
 // Rotate around the object's actual base / hanging point, not canvas center.
 f.x+=spec.pivotX*(1-Math.cos(f.rotation))+spec.pivot*Math.sin(f.rotation);f.y+=spec.pivot*(1-Math.cos(f.rotation))-spec.pivotX*Math.sin(f.rotation);
 return f;
}
