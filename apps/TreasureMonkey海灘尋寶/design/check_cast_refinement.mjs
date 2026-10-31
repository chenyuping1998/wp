import assert from 'node:assert/strict';
import fs from 'node:fs';
import {castPose,castDuration,CastPerformer} from '../src/game/treasureMotion.ts';
import {castTorsoPoint,castTailPoint,castArmPoint,createCastSkin,deformCastSkin} from '../src/game/treasureCastSkin.ts';
const rig=JSON.parse(fs.readFileSync(new URL('../src/game/treasureCastRig.json',import.meta.url),'utf8'));
const generator=JSON.parse(fs.readFileSync(new URL('../src/game/data/treasureCastGenerator.json',import.meta.url),'utf8'));
assert.equal(generator.periodMs,4000);
assert.ok(generator.source.files.every(f=>f.path.includes('/spine-generator/')&&/^[a-f0-9]{64}$/.test(f.sha256)),'generator source and hashes are recorded');
for(const frames of Object.values(generator.channels))assert.deepEqual(frames.at(-1),frames[0],'baked value/velocity/acceleration loop seam is exact');
const joints=['body','chest','breathX','breathY','shoulderY','head','left','right','tail','tailMid','tailTip','dy'];
for(const who of ['digger','lifeguard']){
 const idle=[];
 for(let t=0;t<=4000;t+=8){
  const p=castPose(t,'idle',0,false,who),q=castPose(t,'idle',0,true,who);idle.push({t,p});
  for(const key of joints)assert.ok(Math.abs(q[key])<=Math.abs(p[key])*.241+1e-9,'idle also respects reduced motion');
  assert.ok(Math.abs(p.breathX)<=.00321&&Math.abs(p.breathY)<=.00801&&Math.abs(p.shoulderY)<1.17,'quiet breath stays inside measured limits');
  const screenHead=p.body+p.chest*.65+p.head;
  assert.ok(Math.abs(screenHead)<.0045,'head counter-rotation keeps the screen-space gaze stable');
  if(t>0){
   const before=idle.at(-2).p;
   assert.ok(joints.some(k=>Math.abs(p[k]-before[k])>1e-7),'continuous idle does not become a held still image');
  }
 }
 const maximum=key=>idle.reduce((a,b)=>b.p[key]>a.p[key]?b:a).t;
 assert.ok(Math.abs((maximum('tailMid')-maximum('tail'))-100)<=8,'tail middle lags root by 100ms');
 assert.ok(Math.abs((maximum('tailTip')-maximum('tailMid'))-100)<=8,'tail tip lags middle by 100ms');
 assert.ok(Math.abs((maximum('tail')-maximum('breathY')))<=8,'tail root counterbalances the breathing phrase');
 // Inspect every interpolation key and the loop seam from both sides.
 for(let i=0;i<=generator.sampleCount;i++){
  const t=i*4000/generator.sampleCount,h=.05,a=castPose(t-h,'idle',0,false,who),b=castPose(t,'idle',0,false,who),c=castPose(t+h,'idle',0,false,who);
  const a2=castPose(t-2*h,'idle',0,false,who),c2=castPose(t+2*h,'idle',0,false,who);
  for(const key of joints){
   assert.ok(Math.abs((b[key]-a[key])/h-(c[key]-b[key])/h)<.000002,'sample velocities join');
   assert.ok(Math.abs((b[key]-2*a[key]+a2[key])/h**2-(c2[key]-2*c[key]+b[key])/h**2)<.0000002,'sample accelerations join');
  }
 }
 for(const cue of ['scan','win','winBig','welcome']){
  const duration=castDuration(cue),frames=[];
  for(let t=0;t<=duration;t+=8){
   const pose=castPose(0,cue,t,false,who),reduced=castPose(0,cue,t,true,who);frames.push({t,pose});
   assert.ok(Math.abs(pose.chest)<.04&&Math.abs(pose.tailTip)<.14,'restrained chest and tail deformation');
   for(const key of joints)assert.ok(Math.abs(reduced[key])<=Math.abs(pose[key])*.241+1e-9,'all new joints respect reduced motion');
  }
  const peak=(joint,until=duration)=>frames.filter(f=>f.t<=until).reduce((a,b)=>Math.abs(b.pose[joint])>Math.abs(a.pose[joint])?b:a).t;
  assert.ok(peak('chest')-peak('body')>=48,`${who} ${cue}: chest weight follows hips`);
  assert.ok(peak('tailTip',duration*.55)-peak('tail',duration*.55)>=64,`${who} ${cue}: curl follows tail root`);
  const end=castPose(0,cue,duration,false,who),rest=castPose(0,'idle',0,false,who);
  for(const key of joints)assert.ok(Math.abs(end[key]-rest[key])<1e-12,'all joints return to the current idle in the original duration');
 }
 for(const kind of ['body','tail']){
  const part=rig[who][kind],skin=createCastSkin(part,kind),out=new Float32Array(skin.rest.length);
  deformCastSkin(skin,0,out);
  for(let i=0;i<out.length;i+=2){
   assert.ok(Math.abs(out[i]-(skin.rest[i]-part.ax)*part.w)<.00003);
   assert.ok(Math.abs(out[i+1]-(skin.rest[i+1]-part.ay)*part.h)<.00003,'neutral mesh matches original artwork');
  }
  for(const bend of [-.14,-.04,0,.04,.14]){
   deformCastSkin(skin,bend,out);
   for(let i=0;i<skin.indices.length;i+=3){
    const a=skin.indices[i]*2,b=skin.indices[i+1]*2,c=skin.indices[i+2]*2;
    const area=(out[b]-out[a])*(out[c+1]-out[a+1])-(out[c]-out[a])*(out[b+1]-out[a+1]);
    assert.ok(area>0,'mesh triangles never fold at or beyond authored limits');
   }
  }
  for(const {p} of idle){
   deformCastSkin(skin,kind==='tail'?p.tailTip:p.chest,out,{breathX:p.breathX,breathY:p.breathY,shoulderY:p.shoulderY,middleBend:p.tailMid});
   for(let i=0;i<skin.indices.length;i+=3){
    const a=skin.indices[i]*2,b=skin.indices[i+1]*2,c=skin.indices[i+2]*2;
    assert.ok((out[b]-out[a])*(out[c+1]-out[a+1])-(out[c]-out[a])*(out[b+1]-out[a+1])>0,'breathing skin never folds');
   }
   if(kind==='body'){
    // The trimmed UV rows are no longer a rectangular sampling of the texture.
    // Check the actual sewn sleeve roots against the torso mapping instead.
    for(const part of [rig[who].arm_l,rig[who].arm_r]){
     const point=castTorsoPoint(part.x,part.y,p.chest,p.breathX,p.breathY,p.shoulderY);
     const root=castArmPoint(part,part.ax,part.ay,.2,p.chest,p.breathX,p.breathY,p.shoulderY);
     assert.ok(Math.hypot(root.x-point.x,root.y-point.y)<1e-9,'sleeve root stays sewn during breath and rotation');
    }
   }
  }
 }
 const performer=new CastPerformer();performer.trigger(0,'scan',who);
 for(const [time,cue] of [[420,'winBig'],[590,'scan'],[870,'welcome'],[1150,'win'],[1290,'idle']]){
  const h=.05,current=performer.sample(time),before=performer.sample(time-h),before2=performer.sample(time-h*2);
  performer.trigger(time,cue,who);
  const after=performer.sample(time),next=performer.sample(time+h),next2=performer.sample(time+h*2);
  for(const key of joints){
   assert.ok(Math.abs(current[key]-after[key])<1e-9,'interrupted mesh channels retain position');
   const a=(current[key]-2*before[key]+before2[key])/h**2,b=(next2[key]-2*next[key]+after[key])/h**2;
   assert.ok(Math.abs(a-b)<.000015,`no acceleration jolt: ${who} ${cue} ${key} ${a-b}`);
  }
 }
}
for(const bend of [-.04,.04]){
 for(const x of [120,180,240,300,355])assert.deepEqual(castTorsoPoint(x,442,bend,.0032,.008,1.16),{x,y:442},'waist contact stays exact while breathing');
 for(const y of [.05,.3,.7,.95])assert.deepEqual(castTailPoint(.2,y,bend),{x:.2,y},'tail stem remains attached');
}
console.log('OK: generator provenance, 4s C2 breath loop, 100ms/link tail phase, stable head, planted waist, no mesh folds, original cue durations, reduced motion and C2 cue interruptions');
