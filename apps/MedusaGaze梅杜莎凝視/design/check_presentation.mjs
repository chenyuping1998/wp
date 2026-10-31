// @ts-nocheck -- actual Pixi scene layout replay, without a browser renderer.
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
const scene=createBackgroundScene(Object.fromEntries(BACKGROUND_KEYS.map(key=>[key,Texture.EMPTY])),{softClouds:false});
const cases=[];
for(const [width,height,medusaHeight,groundY] of [[1792,771,455,600],[1280,720,430,568],[960,540,320,420],[390,844,245,650],[320,568,201,455]]){
 scene.setBounds(width,height,medusaHeight,groundY);const snapshot=scene.snapshot();
 for(const statue of snapshot.statues){assert.ok(Math.abs(statue.height/medusaHeight-.2)<1e-8);assert.ok(Math.abs(statue.groundY-groundY)<1e-8);}
 if(width>height){assert.ok(snapshot.leftClouds.filter(c=>c.alpha>.25&&c.y-c.height/2>=0&&c.y+c.height/2<height*.25).length>=2,'Left clouds must survive wide-screen vertical crop');}
 cases.push({width,height,medusaHeight,statueHeights:snapshot.statues.map(s=>s.height),groundY});
}
scene.destroy();
fs.writeFileSync(new URL('./presentation-validation.json',import.meta.url),JSON.stringify({scope:'Actual background scene responsive layout; GPU-only cloud blur is checked in browser',statueToMedusaHeight:.2,cases,passed:true},null,2)+'\n');
console.log('Presentation passed: both statues remain 1/5 of Medusa across 5 aspect ratios and share the safe ground baseline.');
