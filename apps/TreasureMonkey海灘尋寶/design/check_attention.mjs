import assert from 'node:assert/strict';
import {gazeAim,followEyes,rankWinningLines,readablePlates,secondarySymbolTime} from '../src/game/treasureAttention.ts';
const empty={x:0,y:0,vx:0,vy:0};
for(const step of [8,16,33]){
 let eye={...empty};for(let t=0;t<700;t+=step)eye=followEyes(eye,{x:-1,y:1},step);
 assert.ok(Math.abs(eye.x+1)<.001&&Math.abs(eye.y-1)<.001,'eyes acquire the target');
 for(let t=0;t<700;t+=step){eye=followEyes(eye,{x:1,y:-1},step);assert.ok(Object.values(eye).every(Number.isFinite));assert.ok(Math.abs(eye.x)<=1&&Math.abs(eye.y)<=1,'pupils remain inside sockets');}
}
assert.deepEqual(followEyes(empty,{x:1,y:1},0),empty,'hidden clock cannot move eyes');
assert.deepEqual(gazeAim('idle',200),{x:0,y:0});assert.deepEqual(gazeAim('scan',1960),{x:0,y:0});
assert.ok(gazeAim('scan',90,{x:-1,y:1}).y>.99,'eyes acquire before the torso commits');
const wins=[{lineIndex:3,win:5,symbolCount:5,positions:[]},{lineIndex:2,win:40,symbolCount:3,positions:[]},{lineIndex:1,win:40,symbolCount:3,positions:[]}];
const ranked=rankWinningLines(wins);assert.deepEqual(ranked.map(w=>w.lineIndex),[1,2,3]);assert.equal(wins[0].lineIndex,3,'book order is not mutated');
assert.equal(ranked.reduce((sum,w)=>sum+w.win,0),85,'ranking preserves awards');
const plates=[{plate:{x:50,y:40},id:1},{plate:{x:55,y:42},id:2},{plate:{x:50,y:110},id:3}];
assert.deepEqual(readablePlates(plates,104,48).map(p=>p.id),[1,3],'main plate wins overlapping positions');
assert.equal(secondarySymbolTime(0),0);assert.equal(secondarySymbolTime(970),970);assert.ok(secondarySymbolTime(200)<200,'secondary gestures follow inside original window');
console.log('OK: gaze acquisition/retargeting, ranked award invariants, readable plates and 970ms secondary finish');
