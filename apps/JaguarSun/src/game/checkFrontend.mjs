import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const config=JSON.parse(read('config.ts').split('export default ')[1].replace(/ as const;\s*$/,''));
assert.deepEqual(Object.keys(config.betModes).sort(),['base','bonus','bonus_hits']);
assert.equal(config.betModes.bonus.cost,100); assert.equal(config.betModes.bonus_hits.cost,250);
assert.equal(config.featureRules.maxMultiplier,200);
for(const [tier,values] of Object.entries(config.featureRules.wheelValues)){assert.equal(Math.max(...values),200);assert(values.every(v=>v>0&&v<=200));if(tier==='phantom_express')assert(values.every(v=>v%5===0));}
const handlers=new Set([...read('bookEventHandlerMap.ts').matchAll(/^\t([A-Za-z]+): async/gm)].map(m=>m[1]));
for(const file of ['base_books','bonus_books','bonus_hits_books']){
 const data=fs.readFileSync(path.join(dir,'../stories/data',file+'.ts'),'utf8');
 const books=JSON.parse(data.split('export default ')[1].replace(/;\s*$/,''));
 for(const book of books)for(const event of book.events)assert(handlers.has(event.type),`Unmapped fixture event ${event.type}`);
}
const assets=read('assets.ts');
for(const name of ['W','S','H1','H2','H3','H4','H5','L1','L2','L3','L4'])assert(assets.includes(`/assets/deadwood/symbol_${name}.png`),`Missing symbol ${name}`);
assert(!/newFrames: async|updateFrames: async|collectorWin: async|frameDoubling: async/.test(read('bookEventHandlerMap.ts')));
assert(handlers.has('multiplierWheel'));
console.log('Deadwood frontend contract PASS: modes, wheel ladders, new symbol wiring and fixture event coverage.');
