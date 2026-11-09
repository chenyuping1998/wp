// Exercise the real Dragon Tide 4.3 cast scene (src/game/dragonCastScene.ts): act → idle,
// a cast never drops the feature wind-up, big-win silhouette on/off, reduced motion, QA hold,
// and the pearl release beats (animationTimeline) fall while the staff / pearl is held up.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Texture} from 'pixi.js';
import {medusaAnimations} from '../src/game/animationTimeline.ts';
const {build}=createRequire(import.meta.resolve('vite'))('esbuild');
const result=await build({entryPoints:[fileURLToPath(new URL('../src/game/dragonCastScene.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',packages:'external',write:false,define:{'import.meta.env.DEV':'true'}});
let code=result.outputFiles[0].text;
for(const name of ['pixi.js','@esotericsoftware/spine-core'])code=code.replaceAll(JSON.stringify(name),JSON.stringify(import.meta.resolve(name)));
const {createDragonCastScene}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const track=s=>s.state.tracks[0]?.animation?.name;
const run=(s,seconds,step=1/60)=>{for(let t=0;t<seconds-1e-9;t+=step)s.update(Math.min(step,seconds-t));};
const windows={};
for(const kind of ['mg','fg']){
 const s=createDragonCastScene(Texture.EMPTY,kind);
 assert.equal(track(s),'idle');
 // release window: the prop point within 15% of its highest raise during the cast
 assert.equal(s.play('gaze'),true);assert.equal(track(s),'cast');
 const ys=[];for(let i=0;i<=120;i++){ys.push(s.getGazeAnchors().center.y);s.update(1/120);}
 const rest=ys[0],top=Math.min(...ys),raise=rest-top;assert.ok(raise>40,`${kind}: the cast visibly raises the prop (${raise.toFixed(1)}px)`);
 const held=ys.map((y,i)=>[i/120*1000,y<=top+.15*raise]).filter(([,h])=>h).map(([ms])=>ms);
 windows[kind]={fromMs:Math.min(...held),toMs:Math.max(...held),raisePx:Math.round(raise)};
 run(s,1.2);assert.equal(track(s),'idle','a cast settles back into idle');
 // feature wind-up is never dropped by a refill cast
 assert.equal(s.play('fg_end'),true);run(s,.1);const wind=track(s);assert.ok(wind==='ready'||wind==='ready_loop');
 assert.equal(s.play('gaze'),false);assert.equal(track(s),wind,'a cast mid wind-up must not drop the ready pose');
 run(s,1.5);assert.equal(track(s),'ready_loop');
 assert.equal(s.play('transform'),true);run(s,3);assert.equal(track(s),'idle','transform ends in idle');
 // big win: silhouette while the win shows, off on reset; reset mid-cast lets the act finish
 assert.equal(s.play('win_big'),true);assert.ok(Math.abs(s.root.children[0].alpha-.45)<1e-6);
 s.play('gaze');s.reset();assert.equal(s.root.children[0].alpha,1);assert.equal(track(s),'cast','reset lets a running cast finish');
 run(s,1.2);assert.equal(track(s),'idle');
 // reduced motion: no acts, idle pose held
 s.setReducedMotion(true);assert.equal(s.play('gaze'),false);s.setReducedMotion(false);
 // QA hold ignores game cues until resumed
 s.inspect('cast',.3);assert.equal(s.play('transform'),false);s.resume();assert.equal(track(s),'idle');
 s.destroy();s.destroy();
}
for(const name of ['gaze','gaze_turbo','fg_gaze','fg_gaze_turbo']){
 const w=windows[name.startsWith('fg_')?'fg':'mg'],at=medusaAnimations[name].releaseAtMs;
 assert.ok(at>=w.fromMs-1e-6&&at<=w.toMs+1e-6,`${name}: pearl leaves at ${at} ms, outside the held raise ${w.fromMs.toFixed(0)}–${w.toMs.toFixed(0)} ms`);
}
console.log(`Cast transitions passed: cast→idle, wind-up kept, silhouette on/off, reduced motion, QA hold; pearl beats inside the raise (MG ${windows.mg.fromMs.toFixed(0)}–${windows.mg.toMs.toFixed(0)} ms, FG ${windows.fg.fromMs.toFixed(0)}–${windows.fg.toMs.toFixed(0)} ms).`);
