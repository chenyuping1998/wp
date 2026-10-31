import assert from 'node:assert/strict';
import fs from 'node:fs';
import {letterPose,scrollPose,strawPose,keyShine} from '../src/game/treasureObjectMotion.ts';
import {symbolPose} from '../src/game/treasureMotion.ts';
import {projectSymbolPoints} from '../src/game/treasureSymbolRig.ts';
import {objectSecondary} from '../src/game/treasureObjectGenerator.ts';
const generator=JSON.parse(fs.readFileSync(new URL('../src/game/data/treasureObjectGenerator.json',import.meta.url),'utf8'));
assert.deepEqual(generator.source.functions,['spring','strike']);
assert.equal(generator.durationMs,970);assert.equal(generator.stepMs,5);
assert.equal(Object.keys(generator.samples).length,12,'separate masses and contacts, rather than a shared whole-symbol pop');
const accents=new Set();
for(const [name,values] of Object.entries(generator.samples)){
 const settings=generator.channels[name];
 assert.ok(settings.params.overshoot?.frequency||settings.params.frequency,'rebuild data records its physical parameters');
 assert.equal(values[0],0);assert.equal(values.at(-1),0);assert.ok(values.every(value=>Number.isFinite(value)&&Math.abs(value)<1));
 assert.ok(values.some(value=>Math.abs(value)>.1),'probe can see an actual recoil');
 assert.equal(objectSecondary(name,settings.startMs-.25),0,'no interpolation spill before the attachment contact');
 assert.equal(objectSecondary(name,settings.startMs),0);assert.equal(objectSecondary(name,970),0);
 assert.ok(Math.abs(objectSecondary(name,969))<.00002,'recoil settles before the shared completion callback');
 accents.add(JSON.stringify(values));
}
assert.equal(accents.size,12,'every object/channel has its own timing and damping');
const letters=['L1','L2','L3','L4'],traces=new Set();
for(const name of letters){
 const trace=[];let previous;
 for(let t=0;t<=970;t+=5){
  const outer=symbolPose(name,t,'win');assert.deepEqual([outer.dx,outer.dy,outer.rotation,outer.scaleX,outer.scaleY],[0,0,0,1,1],'wooden plaque must stay fixed');
  const p=letterPose(name,t,'win');assert.ok(Object.values(p).every(Number.isFinite));
  assert.ok(Math.abs(p.angle)<Math.PI*2+.31&&Math.abs(p.dy)<.13&&Math.abs(p.dx)<.08,'letter stays on readable plaque');
  assert.ok(p.sx>.80&&p.sx<1.30&&p.sy>.80&&p.sy<1.30,'letter retains its readable silhouette');
  if(previous)assert.ok(Math.abs(Math.atan2(Math.sin(p.angle-previous.angle),Math.cos(p.angle-previous.angle)))<.22,'offset rotation keys never introduce a one-frame snap');
  const calm=letterPose(name,t,'win',true);
  assert.ok(Math.abs(calm.angle)<.06,'reduced motion omits the full turn');
  for(const key of ['dx','dy'])assert.ok(Math.abs(calm[key])<=Math.abs(p[key])*.181+1e-10,'reduced motion lowers attachment travel');
  trace.push(p);previous=p;
 }
 assert.ok(Math.max(...trace.map(p=>Math.abs(p.angle)))>5.8,'each low glyph completes a full turn');
 assert.ok(Math.max(...trace.map(p=>Math.abs(p.dy)))>.055,'low wins have visible lift');
 assert.ok(Math.max(...trace.map(p=>Math.max(p.sx,p.sy)))>1.13,'low wins have visible growth');
 traces.add(JSON.stringify(trace));
 assert.deepEqual(letterPose(name,0,'win'),letterPose(name,970,'win'),'letter returns to exact resting attachment');
 assert.deepEqual(letterPose(name,0,'land'),letterPose(name,240,'land'),'short landing returns before its completion callback');
 assert.deepEqual(letterPose(name,-20,'win'),letterPose(name,0,'win'),'time before the cue remains still');
 assert.deepEqual(letterPose(name,1200,'win'),letterPose(name,970,'win'),'a delayed frame cannot restart the performance');
}
assert.equal(traces.size,4,'four distinct letter performances');
assert.ok(letterPose('L1',110,'win').dy>0&&letterPose('L1',315,'win').dy<-.06,'A loads before its airborne hold');
assert.ok(letterPose('L2',145,'win').angle<-.09&&letterPose('L2',320,'win').angle<-.5,'K cocks back before its reverse turn');
assert.ok(letterPose('L3',410,'win').dx<-.02&&letterPose('L3',585,'win').dx>.02,'Q follows an off-centre orbit');
assert.ok(letterPose('L4',340,'win').angle<-.17&&letterPose('L4',640,'win').angle<-5,'J winds up and completes its reverse turn');
assert.ok(Math.abs(letterPose('L1',565,'win').dy-.012)>.00001,'generator contact is applied to A, while the plaque stays fixed');
assert.ok(Math.abs(letterPose('L2',430,'win').angle-.165)>.00001,'generator lean is applied to K');
assert.ok(Math.abs(letterPose('L3',475,'win').angle+.145)>.00001,'generator turn is applied to Q');
assert.ok(Math.abs(letterPose('L4',455,'win').angle+.16)>.00001,'generator hook recoil is applied to J');
assert.ok(scrollPose(150,true).open<.3,'rolls visibly close');
assert.ok(scrollPose(175,true).open<.3&&scrollPose(235,true).open<.3,'closed scroll has a readable pause');
assert.ok(scrollPose(435,true).open>1,'unroll has restrained overshoot');
for(const t of [500,560,620,660])assert.ok(scrollPose(t,true).open>.99,'unrolled map remains readable before its small settling echo');
assert.ok(Math.abs(scrollPose(420,true).roll)>.025,'end rolls trail the paper reveal');
for(const t of [0,970]){assert.equal(scrollPose(t,true).open,1);assert.equal(strawPose(t,true).angle,0);assert.equal(keyShine(t,true),0);}
assert.ok(strawPose(305,true).angle>.4&&strawPose(535,true).angle<-.2,'straw reverses around fixed insertion point');
assert.ok(strawPose(105,true).angle<-.15&&strawPose(165,true).angle<-.15,'straw gathers before stirring');
assert.ok(Math.abs(strawPose(365,true).angle-.43)>.00001,'generator bend follows the main straw turn');
assert.ok(Math.abs(scrollPose(440,true).roll+.055)>.00001,'generator roll recoil trails the paper reveal');
for(let t=0;t<=970;t+=5){
 const straw=strawPose(t,true),scroll=scrollPose(t,true);
 assert.ok(Math.abs(straw.angle)<.48&&straw.sx>.91&&straw.sx<=1,'straw keeps positive volume while turning');
 assert.ok(scroll.open>=.269&&scroll.open<1.045&&Math.abs(scroll.roll)<=.101,'scroll retains its physical opening bounds');
 assert.ok(keyShine(t,true)>=0&&keyShine(t,true)<=.901,'brass reflection never becomes a full white flash');
}
assert.ok(scrollPose(150,true,true).open>.9,'reduced motion avoids full roll');
assert.equal(keyShine(300,true,true),0,'reduced motion omits glint');
const resting=projectSymbolPoints('H5',[[.8,.4]],0),moving=projectSymbolPoints('H5',[[.8,.4]],300);
assert.notDeepEqual(resting,moving,'metal reflection uses the key skinning coordinates');
const root=new URL('../',import.meta.url),frames=JSON.parse(fs.readFileSync(new URL('src/game/treasureAttachmentFrames.json',root)));
const files={treasureLowBoards:'low_boards_v3.png',treasureScrollParts:'scroll_parts_v3.png',treasureCoconutParts:'coconut_parts_v3.png'};
for(const f of Object.values(frames)){
 const png=fs.readFileSync(new URL('static/assets/treasure/attachments/'+files[f.atlas],root));const w=png.readUInt32BE(16),h=png.readUInt32BE(20),[x,y,fw,fh]=f.rect;
 assert.ok(x>=0&&y>=0&&fw>0&&fh>0&&x+fw<=w&&y+fh<=h,'atlas frame stays within original generated pixels');
}
console.log('OK: 12 local generator spring/strike accents with rebuild parameters; fixed low plaques and separate letters; scroll read hold; straw fixed pivot; reduced motion; exact 240/970ms rest and bounded attachments');
