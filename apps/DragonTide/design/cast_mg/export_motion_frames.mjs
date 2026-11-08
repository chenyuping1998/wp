import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';

const root=dirname(fileURLToPath(import.meta.url));
const kit=process.env.SPINE_MOTION_KIT ?? join(homedir(),'tools/spine-generator');
const load=relative=>import(pathToFileURL(join(kit,relative)).href);
const {decodePngAlpha}=await load('src/png.ts');
const {buildCharacter,previewFrames}=await load('src/character.ts');
const {parseOrder}=await load('src/character.ts');
const layers=new Map(readdirSync(join(root,'layers')).filter(n=>n.endsWith('.png')).map(n=>[
 n.replace(/\.png$/,''),decodePngAlpha(new Uint8Array(readFileSync(join(root,'layers',n))))]));
const read=name=>JSON.parse(readFileSync(join(root,name),'utf8'));
const result=buildCharacter(layers,{name:'cast_mg',joints:read('joints.json'),order:parseOrder(read('layers.json')),
 params:existsSync(join(root,'motion.params.json'))?read('motion.params.json'):undefined});
// JSON serializes negative zero as zero; compare the actual exported format.
assert.deepEqual(JSON.parse(JSON.stringify(result.json)),read('cast_mg_spine/cast_mg.json'),'Preview and exported Spine must describe the same revision');
const frames=previewFrames(result,layers);
writeFileSync(join(root,'qa/motion-frames.json'),JSON.stringify(frames));
writeFileSync(join(root,'qa/motion-summary.json'),JSON.stringify(result.summary,null,2));
console.log(`Official Spine 4.3 evaluator: ${frames.frames.length} frames; ${frames.width}x${frames.height}; ${result.summary.length} animations.`);
