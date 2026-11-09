// Actual Pixi scene replay of the Dragon Tide backdrop (src/game/backgroundScene.ts):
// cover at five aspect ratios, frame-hitch cap, MG→FG crossfade, reduced motion, big-win flare, disposal.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Texture} from 'pixi.js';
import {BACKGROUND_KEYS,BACKGROUND_SIZE} from '../src/game/backgroundMotion.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/game/backgroundScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const source=compiled.outputFiles[0].text.replaceAll('"pixi.js"',JSON.stringify(import.meta.resolve('pixi.js')));
const {createBackgroundScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scene=createBackgroundScene(Object.fromEntries(BACKGROUND_KEYS.map(key=>[key,Texture.EMPTY])));
const cases=[];
for(const [width,height] of [[1792,771],[1280,720],[960,540],[390,844],[320,568]]){
 scene.setBounds(width,height);
 const k=scene.root.scale.x,x=scene.root.position.x,y=scene.root.position.y;
 assert.ok(BACKGROUND_SIZE.width*k>=width-1e-6&&BACKGROUND_SIZE.height*k>=height-1e-6,'backdrop must cover the screen');
 assert.ok(Math.abs(x+BACKGROUND_SIZE.width*k/2-width/2)<1e-6&&Math.abs(y+BACKGROUND_SIZE.height*k/2-height/2)<1e-6,'backdrop is centred');
 cases.push({width,height,scale:k});
}
const a=scene.snapshot();scene.update(10);assert.ok(scene.snapshot().elapsed-a.elapsed<=.100001,'Frame hitch is capped');
scene.setNight(true);for(let i=0;i<60;i++)scene.update(1/60);assert.equal(scene.snapshot().nightness,1);
scene.setNight(false);for(let i=0;i<60;i++)scene.update(1/60);assert.equal(scene.snapshot().nightness,0);
scene.setReducedMotion(true);const still=scene.snapshot().elapsed;scene.update(.1);assert.equal(scene.snapshot().elapsed,still,'reduced motion freezes the backdrop');
scene.setReducedMotion(false);assert.equal(scene.burstProps(),true);assert.equal(scene.burstProps(),false);
scene.destroy();scene.destroy();
fs.writeFileSync(new URL('./presentation-validation.json',import.meta.url),JSON.stringify({scope:'Dragon Tide backdrop scene: cover at five aspect ratios, frame cap, MG/FG crossfade, reduced motion, big-win flare, double dispose',cases},null,2)+'\n');
console.log('Presentation passed: five aspect ratios covered, MG/FG crossfade, time cap, reduced motion, big-win flare.');
