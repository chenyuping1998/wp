/** Official spine-motion-kit builds all curves/IK. Extend its stand34 rig only
 * with the assistant's three connected chain links and separate watch. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {parseSkeleton} from '/Users/stone/tools/spine-generator/src/spineJson.ts';
import {compileRecipe} from '/Users/stone/tools/spine-generator/src/recipe.ts';
const req=createRequire('/Users/stone/tools/spine-generator/package.json');
const {Skeleton,Physics}=req('@esotericsoftware/spine-core');
const D=path.dirname(fileURLToPath(import.meta.url)),folder=path.join(D,'cast_fg_spine');
const json=JSON.parse(fs.readFileSync(path.join(folder,'cast_fg.json'),'utf8'));
const points=[[244,276],[235,359],[212,442],[172,523]];
const skin=json.skins[0].attachments;
const world=(p)=>({x:p[0]-512,y:1456-p[1]});
const inverse=(p,x,y)=>{const dx=x-p.worldX,dy=y-p.worldY,det=p.a*p.d-p.b*p.c;return{x:(p.d*dx-p.b*dy)/det,y:(-p.c*dx+p.a*dy)/det};};
for(let i=0;i<4;i++){
 const name=i<3?`chain_${i+1}`:'watch',parent=i===0?'handB':`chain_${i}`;
 const sk=new Skeleton(parseSkeleton(json));sk.setupPose();sk.updateWorldTransform(Physics.none);const pp=sk.findBone(parent).getAppliedPose(),w=world(points[i]),p=inverse(pp,w.x,w.y);
 json.bones.push({name,parent,x:p.x,y:p.y,rotation:-pp.getWorldRotationX(),length:i<3?Math.hypot(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1]):65});
 json.slots.push({name,bone:name,attachment:name});
 skin[name]={[name]:{x:-w.x,y:688-w.y,rotation:0,width:1024,height:1536}};
}
// Both thigh roots tuck beneath the shorts; no painted hip socket covers a hem.
const byName=new Map(json.slots.map(s=>[s.name,s]));
const order=['tail_3','tail_2','tail_1','arm_l_upper','arm_l_lower','leg_l_upper','leg_l_lower','foot_l','leg_r_upper','leg_r_lower','foot_r','pelvis','neck','torso','head','hat','arm_r_upper','arm_r_lower','chain_3','chain_2','chain_1','watch','hand_l','hand_r'];
json.slots=order.flatMap(n=>byName.has(n)?[byName.get(n)]:[]);
const poses=(bone,channel,points,space='screen')=>({bone,channel,type:'poses',space,points:points.map(([time,value])=>({time,value,ease:'sineInOut'}))});
const wave=(bone,channel,amplitude,period,peakAt=0,space='local')=>({bone,channel,type:'wave',space,amplitude,period,peakAt});
const body=(D,amount=1)=>[
 poses('hip','y',[[0,0],[.24*D,-23*amount],[.48*D,-4*amount],[.75*D,-9*amount],[D,0]]),
 poses('hip','rotate',[[0,0],[.22*D,-4*amount],[.5*D,4*amount],[.8*D,1*amount],[D,0]]),
 poses('head','rotate',[[0,0],[.24*D,4*amount],[.52*D,-6*amount],[.8*D,-2*amount],[D,0]],'local')];
const chains=(D,amp=1)=>[...['chain_1','chain_2','chain_3'].map((n,i)=>{const a=(5+i*2)*amp,p=D/4+i*.05;return {...wave(n,'rotate',a,D,p),offset:-a*Math.cos(-2*Math.PI*p/D)};}),wave('watch','rotate',3*amp,D,D/4)];
const restHand=(D)=>[poses('ik-fist-front','x',[[0,0],[D*.45,-8],[D,0]]),poses('ik-fist-front','y',[[0,0],[D*.25,-18],[D*.5,-3],[D,0]])];
// Cheer arm (Stone 2026-10-29: no unnatural angles): the raised arm reaches up and
// out almost straight, the open hand only 15deg off the forearm; it used to fold
// at 90deg with the wrist bent back 55deg.
const animations=[
 {name:'idle',preset:'stand-idle',tracks:chains(4,.65)},
 {name:'idle_fidget',duration:2,tracks:[...body(2,.45),...restHand(2),poses('ik-fist-back','x',[[0,0],[.5,22],[1.1,-18],[2,0]]),poses('ik-fist-back','y',[[0,0],[.4,14],[1.2,-10],[2,0]]),...chains(2,1.1)]},
 {name:'gaze',duration:1.75,events:[{name:'throw',time:.62}],tracks:[...body(1.75,1),...restHand(1.75),poses('ik-fist-back','x',[[0,0],[.25,28],[.45,12],[.62,-80],[.86,-90],[1.2,-32],[1.75,0]]),poses('ik-fist-back','y',[[0,0],[.25,-20],[.45,25],[.62,45],[.86,22],[1.25,0],[1.75,0]]),...chains(1.75,2.8)]},
 {name:'react_small',duration:1.1,tracks:[...body(1.1,.55),poses('ik-fist-back','x',[[0,0],[.45,-22],[1.1,0]]),poses('ik-fist-back','y',[[0,0],[.45,18],[1.1,0]]),poses('ik-fist-front','x',[[0,0],[.45,-65],[1.1,0]]),poses('ik-fist-front','y',[[0,0],[.45,80],[1.1,0]]),...chains(1.1,.8)]},
 {name:'gaze_dud',duration:1.25,tracks:[...body(1.25,.5),poses('ik-fist-back','x',[[0,0],[.4,38],[.8,30],[1.25,0]]),poses('ik-fist-back','y',[[0,0],[.4,-24],[1.25,0]]),poses('ik-fist-front','x',[[0,0],[.4,58],[.8,48],[1.25,0]]),poses('ik-fist-front','y',[[0,0],[.4,55],[1.25,0]]),...chains(1.25,.7)]},
 {name:'win_big',duration:1.4,tracks:[...body(1.4,1.2),poses('handF','rotate',[[0,0],[.26,0],[.65,15],[1.4,15]],'local'),poses('ik-fist-back','x',[[0,0],[.26,32],[.65,-55],[1.05,-28],[1.4,0]]),poses('ik-fist-back','y',[[0,0],[.26,-26],[.65,75],[1.05,45],[1.4,0]]),poses('ik-fist-front','x',[[0,0],[.26,12],[.65,240],[1.05,240],[1.4,240]]),poses('ik-fist-front','y',[[0,0],[.26,-12],[.65,560],[1.05,560],[1.4,560]]),...chains(1.4,3.2)]},
 {name:'win_big_loop',duration:2,loop:true,tracks:[{...wave('handF','rotate',3,2,.5),offset:15},wave('hip','y',5,2,.5,'screen'),wave('hip','rotate',3,2,.5,'screen'),wave('head','rotate',5,2,.5),wave('ik-fist-back','x',40,2,.5,'screen'),wave('ik-fist-back','y',22,2,.5,'screen'),{...wave('ik-fist-front','x',25,2,.5,'screen'),offset:240},{...wave('ik-fist-front','y',22,2,.5,'screen'),offset:560},...chains(2,3)]},
 {name:'win_big_end',duration:1.25,tracks:[...body(1.25,.75),poses('handF','rotate',[[0,15],[.4,12],[1.25,0]],'local'),poses('ik-fist-front','x',[[0,240],[.4,200],[1.25,0]]),poses('ik-fist-front','y',[[0,560],[.4,490],[1.25,0]]),poses('ik-fist-back','x',[[0,0],[.35,12],[1.25,0]]),...chains(1.25,.8)]},
 ...['fg_trigger','fg_end'].map(name=>({name,duration:1.4,tracks:[poses('hip','rotate',[[0,0],[.5,-10],[.82,-10],[1.4,0]]),poses('hip','y',[[0,0],[.5,-20],[.82,-20],[1.4,0]]),poses('head','rotate',[[0,0],[.5,15],[.82,15],[1.4,0]],'local'),poses('ik-fist-back','x',[[0,0],[.5,40],[.82,40],[1.4,0]]),poses('ik-fist-back','y',[[0,0],[.5,-35],[.82,-35],[1.4,0]]),poses('ik-fist-front','x',[[0,0],[.5,-60],[.82,-60],[1.4,0]]),poses('ik-fist-front','y',[[0,0],[.5,32],[.82,32],[1.4,0]]),...chains(1.4,.7)]}))
];
// Wave tracks must not implicitly turn a one-shot action into a looping clip.
for(const anim of animations)if(anim.loop===undefined)anim.loop=anim.name==='idle';
const recipe={fps:60,maxSegment:.04,characterHeight:1430,ikGuard:true,roles:{root:'root',hip:'hip',body:'hip',chest:'chest',neck:'neck',head:'head',hat:'hat',fistFront:'ik-fist-front',fistBack:'ik-fist-back',feet:['ik-foot-front','ik-foot-back'],fists:['ik-fist-front','ik-fist-back'],shoulders:['upperArmF','upperArmB'],tail:['tail1','tail2','tail3'],coat:[],hair:['tail1','tail2','tail3'], 'swap:head':['head_idle','head_blink','head_spiral','head_grin','head_annoyed'],'swap:hand_l':['hand_l_hip','hand_l_point','hand_l_open'],'swap:hand_r':['hand_r_pinch','hand_r_open','hand_r_grip']},animations};
fs.writeFileSync(path.join(D,'assistant.recipe.json'),JSON.stringify(recipe,null,2)+'\n');
const compiled=compileRecipe(json,recipe).json;
const swap=(anim,slot,keys)=>{compiled.animations[anim].slots??={};compiled.animations[anim].slots[slot]={attachment:keys.map(([time,name])=>({time,name}))};};
for(const name of Object.keys(compiled.animations)){
 if(name==='idle')continue;
 const D=animations.find(a=>a.name===name).duration;
 swap(name,'head',[[0,'head_idle'],[.2,name==='gaze_dud'?'head_annoyed':name.startsWith('win')?'head_grin':'head_spiral'],[D,'head_idle']]);
 swap(name,'hand_l',[[0,'hand_l_hip'],[D,'hand_l_hip']]);swap(name,'hand_r',[[0,'hand_r_pinch'],[.24,name==='react_small'?'hand_r_grip':'hand_r_open'],[D,'hand_r_pinch']]);
}
swap('gaze','hand_l',[[0,'hand_l_hip'],[.60,'hand_l_point'],[1.18,'hand_l_hip']]);
for(const slot of ['watch','chain_1','chain_2','chain_3'])swap('gaze',slot,[[0,slot],[.62,null],[1.18,slot]]);
// A loop begins and ends on the same head/hand drawings; never an accidental pop.
swap('win_big_loop','head',[[0,'head_grin']]);swap('win_big_loop','hand_r',[[0,'hand_r_open']]);swap('win_big','head',[[0,'head_idle'],[.2,'head_grin']]);swap('win_big','hand_r',[[0,'hand_r_pinch'],[.24,'hand_r_open']]);swap('win_big_end','head',[[0,'head_grin'],[.9,'head_spiral'],[1.25,'head_idle']]);swap('win_big_end','hand_r',[[0,'hand_r_open'],[1.1,'hand_r_pinch']]);
fs.writeFileSync(path.join(folder,'cast_fg.json'),JSON.stringify(compiled,null,2)+'\n');
for(const name of ['chain_1','chain_2','chain_3','watch'])fs.copyFileSync(path.join(D,'layers',name+'.png'),path.join(folder,'images',name+'.png'));
fs.writeFileSync(path.join(D,'motion-build.json'),JSON.stringify({generator:'official spine-motion-kit compileRecipe',animations:animations.map(a=>a.name),throwAtSeconds:.62,sourceRig:'official spine-motion character stand34',extraBones:['chain_1','chain_2','chain_3','watch'],note:'Slot expression/gesture drawings and release visibility are app-owned cues; curves and IK are toolkit-generated.'},null,2)+'\n');
console.log('Assistant: ten official recipe motions, connected 3-link chain and wrist-driven release at 620ms.');
execFileSync(process.execPath,[path.join(D,'update_final_report.mjs')],{stdio:'inherit'});
