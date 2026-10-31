import fs from 'node:fs';
import assert from 'node:assert/strict';
import { applyRecordedLaugh } from './recorded_laugh_motion.mjs';
for(const [cast,folder] of [['mg','sushiMaster'],['fg','sushiApprentice']]) {
  const file=new URL(`../static/assets/spines/${folder}/monkey.json`,import.meta.url);
  const rig=JSON.parse(fs.readFileSync(file));
  const before=structuredClone(rig);
  applyRecordedLaugh(rig.animations,cast);
  before.animations.chestbeat=rig.animations.chestbeat;
  assert.deepEqual(before,rig,'Only chestbeat may change');
  fs.writeFileSync(file,JSON.stringify(rig));
  console.log(folder,'five timed syllables; every other animation and rig field preserved');
}
