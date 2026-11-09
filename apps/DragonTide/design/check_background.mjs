// Dragon Tide backdrop motion (src/game/backgroundScene.ts), replayed for 120 s at 60 fps:
// every moving bit keeps its whole painted extent left of FX_RIGHT (cast strip stays still,
// cast-reads-off-background), alphas stay bounded, the sea and the hall both visibly move.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Texture} from 'pixi.js';
import {BACKGROUND_KEYS} from '../src/game/backgroundMotion.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/game/backgroundScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false});
const source=compiled.outputFiles[0].text.replaceAll('"pixi.js"',JSON.stringify(import.meta.resolve('pixi.js')));
const {createBackgroundScene,FX_RIGHT}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scene=createBackgroundScene(Object.fromEntries(BACKGROUND_KEYS.map(key=>[key,Texture.EMPTY])));
const [, , seaFx, hallFx]=scene.root.children;
let maxRight=-Infinity,moved={sea:0,hall:0};
const sample=(layer,key)=>{
 const before=layer.children.map(c=>c.x+c.y+c.alpha+c.rotation);
 return ()=>{layer.children.forEach((c,i)=>{const now=c.x+c.y+c.alpha+c.rotation;if(Math.abs(now-before[i])>1e-3)moved[key]++;before[i]=now;
  if(c.alpha>.002){const b=c.getBounds();maxRight=Math.max(maxRight,b.maxX);}assert.ok(c.alpha>=0&&c.alpha<=1);});};
};
for(const night of [false,true]){
 scene.setNight(night);for(let i=0;i<60;i++)scene.update(1/60);
 const layer=night?hallFx:seaFx,check=sample(layer,night?'hall':'sea');
 for(let i=0;i<120*60;i++){scene.update(1/60);if(i%6===0)check();}
}
assert.ok(maxRight<=FX_RIGHT+1e-6,`moving bits reach x ${maxRight.toFixed(1)} (cast strip starts at ${FX_RIGHT})`);
assert.ok(moved.sea>1000&&moved.hall>1000,'both backdrops visibly move');
scene.destroy();
console.log(`Background: sea glints/wave light and hall shafts/bubbles move for 120 s, all left of x ${FX_RIGHT} (max ${maxRight.toFixed(0)}).`);
