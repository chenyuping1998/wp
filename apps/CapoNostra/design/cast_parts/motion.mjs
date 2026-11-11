/** Original conservative delivery-preview motion, authored for these layers.
 * Bones use global bind pivots, y down, rotations clockwise. No axial arm scale.
 * This file and manifests are delivery assets; the live game has not been changed.
 */
const rad=Math.PI/180;
const tier=(strength,durationMs)=>({durationMs,snap:.18,hold:.55,rise:strength*.0006,stretch:strength*.0003,bones:{hips:[strength*.1,0],waist:[-strength*.15,30],chest:[strength*.22,60],head:[-strength*.65,100],arm_l:[-strength*.5,120],arm_r:[strength*.5,145],dangle_ponytail:[strength,180],dangle_smoke:[strength*.7,190],dangle_earring_l:[strength*.75,175],dangle_earring_r:[-strength*.6,205]}});
export const TIERS={win:tier(1,700),winBig:tier(2,900),trigger:tier(3,1100)};
const idle={hips:[.13,7500,0],waist:[.18,6200,.8],chest:[.25,5500,1.2],head:[.65,6800,2.1],arm_l:[.4,5800,.6],arm_r:[.45,6700,1.7],dangle_ponytail:[2.8,3800,1.4],dangle_smoke:[2.2,4500,.9],dangle_earring_l:[1.8,2800,1.5],dangle_earring_r:[1.5,3100,.1]};
function envelope(t,snap=.18,hold=.55){if(t<=0||t>=1)return 0;let u=t<snap?t/snap:t<hold?1:1-(t-hold)/(1-hold);return u*u*(3-2*u)}
function mul(a,b){return[a[0]*b[0]+a[1]*b[3],a[0]*b[1]+a[1]*b[4],a[0]*b[2]+a[1]*b[5]+a[2],a[3]*b[0]+a[4]*b[3],a[3]*b[1]+a[4]*b[4],a[3]*b[2]+a[4]*b[5]+a[5]]}
export function composeBoneMatrices(rig,state,out){
 const {timeMs=0,reactionAge=null,speed=1,motionScale=1,tier=TIERS.win,durationMs=tier.durationMs}=state;
 const height=rig.figure_box[3]-rig.figure_box[1];
 for(let i=0;i<rig.bones.length;i++){
  const b=rig.bones[i],v=idle[b.name];let angle=v?v[0]*Math.sin(timeMs/v[1]*Math.PI*2+v[2]):0;
  const r=tier.bones[b.name];if(r&&reactionAge!==null)angle+=r[0]*motionScale*envelope((reactionAge-r[1]/speed)/durationMs,tier.snap,tier.hold);
  const c=Math.cos(angle*rad),s=Math.sin(angle*rad);let sy=1,dy=0;
  if(i===0&&reactionAge!==null){const e=envelope(reactionAge/durationMs,tier.snap,tier.hold);sy+=tier.stretch*e;dy=-height*tier.rise*e}
  const local=[c,-s*sy,b.x-c*b.x+s*sy*b.y,s,c*sy,b.y-s*b.x-c*sy*b.y+dy];
  out[i].set(b.parent>=0?mul(out[b.parent],local):local);
 }
}
export function buildWeightIndex(rig){return{bones:rig.weights.map(r=>r.flatMap((v,i)=>v>.002?[i]:[])),values:rig.weights.map(r=>r.filter(v=>v>.002))}}
export function skinVertices(rest,index,matrices,out){for(let v=0;v<index.bones.length;v++){let x=0,y=0;for(let j=0;j<index.bones[v].length;j++){const m=matrices[index.bones[v][j]],w=index.values[v][j],rx=rest[v*2],ry=rest[v*2+1];x+=(m[0]*rx+m[1]*ry+m[2])*w;y+=(m[3]*rx+m[4]*ry+m[5])*w}out[v*2]=x;out[v*2+1]=y}}
