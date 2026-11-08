// Local deformation only: feet and the hand/tool grip remain ordinary rigid
// attachments. The same torso mapping drives the artwork and its attachments.
// elbow/hand are painted joint positions in the arm's UV space; ik plants the
// hand (hand-on-hip). knee/ankle are the legs' bend rows in UV space.
export type CastAttachment={x:number;y:number;w:number;h:number;ax:number;ay:number;trimSleeves?:boolean;elbow?:readonly number[];hand?:readonly number[];ik?:boolean;knee?:number;ankle?:number;rot?:number};
export type CastSkin={part:CastAttachment;kind:'body'|'tail'|'arm'|'legs';rest:Float32Array;uvs:Float32Array;indices:Uint32Array};
const smooth=(u:number)=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function castBodyInset(v:number,trimSleeves=false){
 return trimSleeves?(v<.18?.22+.10*smooth(v/.18):.32*(1-smooth((v-.18)/.50))):.22*(1-smooth(v/.58));
}
export function castTorsoPoint(x:number,y:number,bend:number,breathX=0,breathY=0,shoulderY=0){
 const weight=smooth((442-y)/145),shoulderWeight=smooth(Math.abs(x-240)/80)*smooth((410-y)/110);
 const angle=bend*weight,c=Math.cos(angle),s=Math.sin(angle),dx=(x-240)*(1+breathX*weight);
 // The centre chest inhales first. Across its sides the cloth follows the
 // delayed shoulder track, using this exact mapping for both arm attachments.
 const dy=(y-442)*(1+breathY*weight)+(shoulderY+180*breathY)*shoulderWeight;
 return {x:240+dx*c-dy*s,y:442+dx*s+dy*c};
}
export function castTailPoint(x:number,y:number,curl:number,middleCurl=curl){
 // A two-bone curl with soft weights across the painted U. Left stem is
 // untouched; the middle leads and the right curl follows rather than shears.
 const rotate=(px:number,py:number,angle:number)=>{
  if(!angle)return;
  const dx=x-px,dy=y-py,c=Math.cos(angle),s=Math.sin(angle);
  x=px+dx*c-dy*s;y=py+dx*s+dy*c;
 };
 const middle=smooth((x-.27)/.36),tip=smooth((x-.50)/.28);
 rotate(.34,.62,middleCurl*.45*middle);
 rotate(.70,.40,curl*.55*tip);
 return {x,y};
}
export function createCastSkin(part:CastAttachment,kind:CastSkin['kind'],columns=16,rows=16,foreground=false):CastSkin{
 const count=(columns+1)*(rows+1),rest=new Float32Array(count*2),uvs=new Float32Array(count*2),indices=new Uint32Array(columns*rows*6);
 for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  const i=(row*(columns+1)+col)*2,v=row/rows;
  // The arm paintings already contain sleeves. Trim the torso's duplicate
  // sleeves in UV space, retaining its collar, straps and complete waist.
  const inset=kind==='body'?castBodyInset(v,part.trimSleeves):foreground?.55*(1-smooth(v/.56)):0;
  const u=inset+(1-inset*(kind==='body'?2:1))*col/columns;
  rest[i]=u;rest[i+1]=v;uvs[i]=u;uvs[i+1]=v;
 }
 let at=0;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1;
  indices.set([a,b,c,b,d,c],at);at+=6;
 }
 return {part,kind,rest,uvs,indices};
}
const rotateBy=(x:number,y:number,angle:number)=>{const c=Math.cos(angle),s=Math.sin(angle);return {x:x*c-y*s,y:x*s+y*c};};
/** Painted joint positions (figure space) for a two-bone arm. */
export function castArmJoints(part:CastAttachment){
 const at=(uv:readonly number[])=>({x:part.x+(uv[0]-part.ax)*part.w,y:part.y+(uv[1]-part.ay)*part.h});
 return {shoulder:{x:part.x,y:part.y},elbow:part.elbow?at(part.elbow):null,hand:part.hand?at(part.hand):null};
}
/**
 * Absolute rotations of the upper arm and forearm. A planted hand (ik) is
 * solved from the breathing shoulder to its hip contact, so the elbow moves
 * and the palm stays put; `turn` then only lifts the palm a little.
 */
export function castArmAngles(part:CastAttachment,turn:number,elbow=0,chest=0,breathX=0,breathY=0,shoulderY=0){
 const j=castArmJoints(part);
 if(!part.ik||!j.elbow||!j.hand)return {upper:turn+chest,fore:turn+elbow+chest};
 const s=castTorsoPoint(j.shoulder.x,j.shoulder.y,chest,breathX,breathY,shoulderY);
 const lift={x:turn*28,y:-turn*52},rest=castTorsoPoint(j.hand.x,j.hand.y,chest,breathX,breathY,shoulderY);
 const target={x:rest.x+lift.x,y:rest.y+lift.y};
 const l1=Math.hypot(j.elbow.x-j.shoulder.x,j.elbow.y-j.shoulder.y),l2=Math.hypot(j.hand.x-j.elbow.x,j.hand.y-j.elbow.y);
 const d=Math.max(Math.abs(l1-l2)+1,Math.min(l1+l2-1,Math.hypot(target.x-s.x,target.y-s.y)));
 const side=Math.sign((j.elbow.x-j.shoulder.x)*(j.hand.y-j.shoulder.y)-(j.elbow.y-j.shoulder.y)*(j.hand.x-j.shoulder.x))||1;
 const reach=Math.atan2(target.y-s.y,target.x-s.x),open=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
 const upperDir=reach-side*open,e={x:s.x+l1*Math.cos(upperDir),y:s.y+l1*Math.sin(upperDir)};
 const foreDir=Math.atan2(target.y-e.y,target.x-e.x);
 return {upper:upperDir-Math.atan2(j.elbow.y-j.shoulder.y,j.elbow.x-j.shoulder.x),fore:foreDir-Math.atan2(j.hand.y-j.elbow.y,j.hand.x-j.elbow.x)};
}
/**
 * Rigid frame of the forearm: world = (x,y) + R(rotation)(p - shoulderRest).
 * Hand-held props and lights use it, so they stay in the painted grip while
 * the elbow bends.
 */
export function castForearmFrame(part:CastAttachment,turn:number,elbow=0,chest=0,breathX=0,breathY=0,shoulderY=0){
 const j=castArmJoints(part),s=castTorsoPoint(j.shoulder.x,j.shoulder.y,chest,breathX,breathY,shoulderY);
 const a=castArmAngles(part,turn,elbow,chest,breathX,breathY,shoulderY);
 if(!j.elbow)return {x:s.x,y:s.y,rotation:a.upper};
 const ue=rotateBy(j.elbow.x-j.shoulder.x,j.elbow.y-j.shoulder.y,a.upper),back=rotateBy(j.elbow.x-j.shoulder.x,j.elbow.y-j.shoulder.y,a.fore);
 return {x:s.x+ue.x-back.x,y:s.y+ue.y-back.y,rotation:a.fore};
}
export function castArmPoint(part:CastAttachment,u:number,v:number,turn:number,chest=0,breathX=0,breathY=0,shoulderY=0,elbow=0){
 const dx=(u-part.ax)*part.w,dy=(v-part.ay)*part.h;
 const shoulder=castTorsoPoint(part.x,part.y,chest,breathX,breathY,shoulderY);
 const fixed=castTorsoPoint(part.x+dx,part.y+dy,chest,breathX,breathY,shoulderY);
 const a=castArmAngles(part,turn,elbow,chest,breathX,breathY,shoulderY),j=castArmJoints(part);
 const up=rotateBy(dx,dy,a.upper);
 let moving={x:shoulder.x+up.x,y:shoulder.y+up.y},forearm=0;
 if(j.elbow&&j.hand){
  // Forearm weight changes across a narrow band on the elbow's bisector, so
  // everything past the elbow (hand, grip, painted handle) is fully rigid
  // with the forearm and its prop. Sleeve cuff and fur bend in the band
  // instead of the whole painting swinging from the shoulder.
  const band=22,lu=Math.hypot(j.shoulder.x-j.elbow.x,j.shoulder.y-j.elbow.y),lf=Math.hypot(j.hand.x-j.elbow.x,j.hand.y-j.elbow.y);
  let nx=(j.hand.x-j.elbow.x)/lf-(j.shoulder.x-j.elbow.x)/lu,ny=(j.hand.y-j.elbow.y)/lf-(j.shoulder.y-j.elbow.y)/lu;
  const nl=Math.hypot(nx,ny);nx/=nl;ny/=nl;
  const w=smooth(.5+((part.x+dx-j.elbow.x)*nx+(part.y+dy-j.elbow.y)*ny)/(2*band));
  forearm=w;
  if(w>0){
   const f=castForearmFrame(part,turn,elbow,chest,breathX,breathY,shoulderY),fp=rotateBy(dx,dy,f.rotation);
   moving={x:moving.x+(f.x+fp.x-moving.x)*w,y:moving.y+(f.y+fp.y-moving.y)*w};
  }
 }
 // Keep the sleeve root sewn to the torso. Only the upper arm is pinned: a
 // hand painted near the shoulder (the wave) is still fully on its forearm.
 const weight=Math.max(forearm,smooth((Math.hypot(dx,dy)-24)/62));
 return {x:fixed.x+(moving.x-fixed.x)*weight,y:fixed.y+(moving.y-fixed.y)*weight};
}
/** Knees take the crouch: the waist drops by `drop`, shoes stay planted. */
export function castLegsPoint(part:CastAttachment,v:number,drop:number){
 const knee=part.knee??.42,ankle=part.ankle??.78;
 return drop*(1-smooth((v-knee)/(ankle-knee)));
}
export function deformCastSkin(skin:CastSkin,bend:number,out:Float32Array,options:{breathX?:number;breathY?:number;shoulderY?:number;middleBend?:number;chest?:number;elbow?:number}={}){
 const p=skin.part;
 for(let i=0;i<skin.rest.length;i+=2){
  const u=skin.rest[i],v=skin.rest[i+1];
  if(skin.kind==='body'){
   const point=castTorsoPoint(p.x+(u-p.ax)*p.w,p.y+(v-p.ay)*p.h,bend,options.breathX,options.breathY,options.shoulderY);
   out[i]=point.x-p.x;out[i+1]=point.y-p.y;
  }else if(skin.kind==='arm'){
   const point=castArmPoint(p,u,v,bend,options.chest,options.breathX,options.breathY,options.shoulderY,options.elbow);
   out[i]=point.x-p.x;out[i+1]=point.y-p.y;
  }else if(skin.kind==='legs'){
   out[i]=(u-p.ax)*p.w;out[i+1]=(v-p.ay)*p.h+castLegsPoint(p,v,bend);
  }else{
   const point=castTailPoint(u,v,bend,options.middleBend);
   out[i]=(point.x-p.ax)*p.w;out[i+1]=(point.y-p.ay)*p.h;
  }
 }
 return out;
}
