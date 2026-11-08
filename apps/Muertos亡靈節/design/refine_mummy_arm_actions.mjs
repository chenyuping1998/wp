/** Narrow the shoulder lift and soften the waving elbow, preserving painted meshes. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'static/assets/spines/mummyCat');
const backup=path.join(root,'design/source/mummy_delivery/mascot_versions/before_seven_fixes');
if(!fs.existsSync(backup)){fs.mkdirSync(backup,{recursive:true});for(const f of fs.readdirSync(dir))fs.copyFileSync(path.join(dir,f),path.join(backup,f));}
const j=JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json'))),original=JSON.parse(fs.readFileSync(path.join(backup,'mummyCat.json')));
for(const name of ['wave','cheer'])j.animations[name]=structuredClone(original.animations[name]);
function scale(frames,k,base=0){for(const f of frames??[]){f.value=+(base+((f.value??base)-base)*k).toFixed(6);if(Array.isArray(f.curve))for(let i=1;i<f.curve.length;i+=2)f.curve[i]=+(base+(f.curve[i]-base)*k).toFixed(6);}}
const wave=j.animations.wave.bones,cheer=j.animations.cheer.bones;
scale(wave.clavR.rotate,.32);scale(wave.upperArmR.rotate,.9);scale(wave.foreArmR.rotate,.76);scale(wave.handR.rotate,.8);
for(const side of ['L','R']){scale(cheer['clav'+side].rotate,.22);scale(cheer['upperArm'+side].rotate,1.06);}
scale(cheer.chest.scalex,.35,1);scale(cheer.chest.scaley,.35,1);
// Keep the forearms pointing up in a compact V rather than reaching outward.
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const follow=t=>smooth((t-.2)/.17)*(1-smooth((t-.7)/.4));
for(const side of ['L','R'])for(const f of cheer['foreArm'+side].rotate){
 const sign=side==='R'?1:-1;f.value=+((f.value??0)+sign*60*follow(f.time??0)).toFixed(6);
 if(Array.isArray(f.curve))for(let i=1;i<f.curve.length;i+=2)f.curve[i]=+(f.curve[i]+sign*60*follow(f.curve[i-1])).toFixed(6);
}
fs.writeFileSync(path.join(dir,'mummyCat.json'),JSON.stringify(j));
fs.writeFileSync(path.join(root,'design/source/mummy_delivery/mascot/arm_refinement.json'),JSON.stringify({actions:['wave','cheer'],waveElbowScale:.76,waveShoulderScale:.32,jumpShoulderScale:.22,jumpChestScale:.35,compactForearmDegrees:60,source:'mascot_versions/before_seven_fixes',meshesUnchanged:true},null,2));
console.log('Refined wave elbow, shoulder socket motion, compact jump forearms');
