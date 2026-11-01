// Actual Pixi scene replay: responsiveness, transitions, time cap and reduced motion.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Texture} from 'pixi.js';
import {BACKGROUND_KEYS} from '../src/game/backgroundMotion.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/game/backgroundScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const source=compiled.outputFiles[0].text.replaceAll('"pixi.js"',JSON.stringify(import.meta.resolve('pixi.js')));
const {createBackgroundScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scene=createBackgroundScene(Object.fromEntries(BACKGROUND_KEYS.map(key=>[key,Texture.EMPTY])));
const cases=[];
for(const [width,height,figureHeight,groundY] of [[1792,771,455,600],[1280,720,430,568],[960,540,320,420],[390,844,245,650],[320,568,201,455]]){
 scene.setBounds(width,height,figureHeight,groundY);const s=scene.snapshot();
 assert.equal(s.props.length,2);
 for(const prop of s.props){assert.ok(prop.height/figureHeight>=.335&&prop.height/figureHeight<=.361);assert.ok(Math.abs(prop.groundY-groundY)<1e-8);}
 assert.deepEqual(s.architecture,{x:0,y:0,rotation:0});cases.push({width,height,figureHeight,props:s.props});
}
const a=scene.snapshot();scene.update(10);assert.ok(scene.snapshot().elapsed-a.elapsed<=.100001,'Frame hitch is capped');
scene.setNight(true);for(let i=0;i<60;i++)scene.update(1/60);assert.equal(scene.snapshot().nightness,1);
assert.ok(scene.snapshot().lights.every(l=>l.alpha>0));
scene.setNight(false);for(let i=0;i<60;i++)scene.update(1/60);assert.equal(scene.snapshot().nightness,0);
scene.setReducedMotion(true);const still=scene.snapshot();scene.update(.1);assert.equal(scene.snapshot().faceRotation,still.faceRotation);assert.equal(scene.snapshot().balloonRotation,still.balloonRotation);assert.equal(scene.burstProps(),false);
scene.setReducedMotion(false);assert.equal(scene.burstProps(),true);assert.equal(scene.burstProps(),false);
scene.destroy();scene.destroy();
fs.writeFileSync(new URL('./presentation-validation.json',import.meta.url),JSON.stringify({scope:'Actual circus scene, five aspect ratios, mode fade, delta cap, reduced motion, event response, disposal',cases,passed:true},null,2)+'\n');
console.log('Presentation passed: five aspect ratios, circus props baseline, MG/FG lighting, time cap and reduced motion.');
