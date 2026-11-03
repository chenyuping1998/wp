// Exercise the real 4.3 scene: bow recovery and repeated wins previously spun the FG arm.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Texture} from 'pixi.js';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const result=await build({entryPoints:[fileURLToPath(new URL('../src/game/hypnoCastScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false,define:{'import.meta.env.DEV':'false'}});
let code=result.outputFiles[0].text;
for(const name of ['pixi.js','@esotericsoftware/spine-core'])code=code.replaceAll(JSON.stringify(name),JSON.stringify(import.meta.resolve(name)));
const {createHypnoCastScene}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const fg={rig:JSON.parse(fs.readFileSync(new URL('../src/game/hypnoAssistantData.json',import.meta.url))),atlas:JSON.parse(fs.readFileSync(new URL('../src/game/hypnoAssistantAtlas.json',import.meta.url)))};
for(const mode of ['mg','fg']){
	const scene=createHypnoCastScene(Texture.EMPTY,mode==='fg'?fg:undefined);
	scene.play('fg_end',true);
	for(let i=0;i<6;i++)scene.update(.1);
	scene.reset();
	if(mode==='fg')assert.equal(scene.state.tracks[0].animation.name,'idle','A bow must never recover through the raised-arm clip');
	scene.play('win_big',true);
	for(let i=0;i<7;i++)scene.update(.1);
	const entry=scene.state.tracks[0],time=entry.trackTime;
	scene.play('win_max',true);
	assert.equal(scene.state.tracks[0],entry,'A repeated celebration cue must not restart the arm raise');
	assert.equal(entry.trackTime,time);
	scene.reset();
	assert.equal(scene.state.tracks[0].animation.name,'win_big_end','A real held cheer still lowers naturally');
	scene.destroy();
}
console.log('Cast transitions passed: FG bow -> idle, repeated MG/FG wins preserve the current raise, held cheers recover naturally.');
