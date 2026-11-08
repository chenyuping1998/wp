/** Reproduce the late-mounted backdrop regression with the installed Pixi event system. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {register} from 'node:module';
import 'pixi.js/events';import {Container,Graphics,EventBoundary,FederatedPointerEvent,Matrix} from 'pixi.js';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bar=fs.readFileSync(path.join(root,'src/components/ui/MummyBar.svelte'),'utf8').replace(/\r/g,'');
if(!bar.includes('<Container zIndex={2}>\n<MainContainer standard>')||!bar.includes('zIndex={1}')||!bar.includes('onpointertap={(e) => {e.stopPropagation();pickRounds(o);}}'))throw new Error('Autospin routing is not wired to the verified layers');
const options=[...bar.match(/const AUTO_OPTIONS:[^=]*=\s*\[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
function testLayering(fixed,portrait){
 const stage=new Container(),wrapper=new Container();stage.eventMode='static';wrapper.zIndex=fixed?2:0;
 wrapper.position.set(portrait?70:260,portrait?150:120);wrapper.scale.set(portrait?.55:.8);stage.addChild(wrapper);
 const panel=new Container();panel.eventMode='static';wrapper.addChild(panel);
 panel.addChild(new Graphics().roundRect(0,0,488,288,12).fill(0x222222));
 let selected=null,starts=0,closed=0;const cells=[];
 for(let i=0;i<options.length;i++){
  const cell=new Container();cell.eventMode='static';cell.position.set(16+i%3*156,84+Math.floor(i/3)*66);
  cell.addChild(new Graphics().roundRect(0,0,148,56,8).fill(0xffffff));cell.on('pointertap',e=>{e.stopPropagation();selected=options[i];});panel.addChild(cell);cells.push(cell);
 }
 const start=new Container();start.eventMode='static';start.position.set(328,216);start.addChild(new Graphics().rect(0,0,148,56).fill(0xffd75e));start.on('pointertap',()=>starts++);panel.addChild(start);
 // Exactly the failure: the outside-click layer mounts AFTER the existing bar.
 const backdrop=new Graphics().rect(0,0,1920,1080).fill(0x0);backdrop.eventMode='static';backdrop.zIndex=fixed?1:0;backdrop.on('pointertap',()=>closed++);stage.addChild(backdrop);stage.sortChildren();stage.getBounds();
 // A renderer normally publishes these matrices before EventBoundary runs.
 const publish=n=>{n.worldTransform.copyFrom(n.getGlobalTransform(new Matrix()));for(const child of n.children??[])publish(child);};publish(stage);
 const boundary=new EventBoundary(stage);
 const tap=(object,x=74,y=28)=>{const p=object.toGlobal({x,y}),hit=boundary.hitTest(p.x,p.y),e=new FederatedPointerEvent(boundary);e.target=hit;boundary.dispatchEvent(e,'pointertap');return hit;};
 if(!fixed){tap(cells[0]);if(selected!==null||closed!==1)throw new Error('Original overlay failure was not reproduced');return{originalFailureReproduced:true};}
 for(let i=0;i<cells.length;i++){tap(cells[i]);if(selected!==options[i]||closed)throw new Error(`Option blocked:${options[i]}`);}
 tap(start);if(starts!==1||closed)throw new Error('Start was blocked');
 const e=new FederatedPointerEvent(boundary);e.target=boundary.hitTest(1800,1000);boundary.dispatchEvent(e,'pointertap');if(closed!==1)throw new Error('Outside dismissal failed');
 return{passed:true,portrait,selectedOptions:options,startDispatches:starts,outsideDismissal:true};
}
const original=testLayering(false,false),wide=testLayering(true,false),portrait=testLayering(true,true);
const {multiplierImpactAt,multiplierImpactProfile,scarabSpinProgress}=await import(pathToFileURL(path.join(root,'src/game/scarabPresentation.ts')));
globalThis.$state=v=>v;const {FG_WHEEL_MS}=await import(pathToFileURL(path.join(root,'src/game/wheels.svelte.ts')));
const values=[2,4,6,8,10,12,14,16,32],impacts=[];
let lastPeak=0;
for(const value of values){const p=multiplierImpactProfile(value);let peak=0;
 for(let t=0;t<=Math.ceil(p.duration);t++){const v=multiplierImpactAt(value,t);peak=Math.max(peak,Math.hypot(v.x,v.y));if(!Number.isFinite(v.x+v.y))throw new Error('Invalid impact');}
 if(peak<=lastPeak)throw new Error('Impact strength must increase with multiplier');lastPeak=peak;
 const end=multiplierImpactAt(value,p.duration);if(end.x||end.y)throw new Error('Impact does not settle');impacts.push({value,peak,duration:p.duration,platePop:p.platePop});
}
let previous=0;for(let i=0;i<=1000;i++){const x=scarabSpinProgress(i/1000);if(x<previous||x<0||x>1)throw new Error('Invalid wheel progression');previous=x;}
const braking=Object.fromEntries(Object.entries(FG_WHEEL_MS).map(([name,p])=>{
 const finalSegments=39.55*(1-scarabSpinProgress((p.spin-1200)/p.spin));
 if(p.spin<2800||p.settle<300||finalSegments>4)throw new Error('Wheel end is too fast');return[name,{spinMs:p.spin,settleMs:p.settle,last1200msSegments:finalSegments}];
}));
const report={passed:true,original,wide,portrait,braking,impacts};
fs.writeFileSync(path.join(root,'design/source/mummy_delivery/ui_wheel_verification.json'),JSON.stringify(report,null,2));console.log(report);
