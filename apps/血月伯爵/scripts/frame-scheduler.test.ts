import test from 'node:test';import assert from 'node:assert/strict';
import {requestPresentationFrame,cancelPresentationFrame,setReviewFrameDriver} from '../src/game/frameScheduler.ts';

test('explicit recording keeps the authored clocks moving when embedded rAF never fires',async()=>{
 const oldRequest=Object.getOwnPropertyDescriptor(globalThis,'requestAnimationFrame'),oldCancel=Object.getOwnPropertyDescriptor(globalThis,'cancelAnimationFrame');
 let requests=0,cancels=0,frames=0,renders=0,lastTime=0,token=0;
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>++requests});Object.defineProperty(globalThis,'cancelAnimationFrame',{configurable:true,value:()=>cancels++});
 try{
  const finished=new Promise<void>(resolve=>{
   const frame=(time:number)=>{assert.ok(time>=lastTime);lastTime=time;frames++;if(frames<3)token=requestPresentationFrame(frame);else resolve();};
   token=requestPresentationFrame(frame);
  });
  assert.equal(frames,0);assert.equal(requests,1);
  setReviewFrameDriver(true,()=>{renders++;});await finished;setReviewFrameDriver(false);
  assert.equal(frames,3);assert.equal(renders,3);assert.equal(cancels,1);
 }finally{
  cancelPresentationFrame(token);setReviewFrameDriver(false);
  if(oldRequest)Object.defineProperty(globalThis,'requestAnimationFrame',oldRequest);else delete (globalThis as any).requestAnimationFrame;
  if(oldCancel)Object.defineProperty(globalThis,'cancelAnimationFrame',oldCancel);else delete (globalThis as any).cancelAnimationFrame;
 }
});
