import fs from 'node:fs';
export const sleep = ms=>new Promise(r=>setTimeout(r,ms));
export async function connect(){
 const tabs=await(await fetch(`http://127.0.0.1:${process.env.TURF_CDP_PORT || 9351}/json`)).json();
 const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}};
 const send=(method,params={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value};
 const click=async(x,y)=>{for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x,y,button:'left',clickCount:1})};
 const shot=async path=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path,Buffer.from(r.result.data,'base64'))};
 const key=async()=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32})};
 return {ws,send,ev,click,shot,key};
}
export const captureSetup = `(()=>{
 if(window.__captureReady)return;window.__captureReady=true;
 const Native=window.AudioContext||window.webkitAudioContext;const mix=new Native();const output=mix.createMediaStreamDestination();const meter=mix.createAnalyser();meter.fftSize=2048;meter.connect(output);const taps=new WeakMap();window.__audioEvents=[];
 const conn=AudioNode.prototype.connect;AudioNode.prototype.connect=function(dest,...rest){const r=conn.call(this,dest,...rest);if(dest===this.context.destination&&this.context!==mix){let tap=taps.get(this.context);if(!tap){tap=this.context.createMediaStreamDestination();taps.set(this.context,tap);const input=mix.createMediaStreamSource(tap.stream);input.connect(meter)}conn.call(this,tap)}return r};
 const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__audioEvents.push({at:performance.now(),src:this.currentSrc||this.src,volume:this.volume});return play.apply(this,args)};
 window.__recordStart=async()=>{await mix.resume();window.__mixStats={peak:0,rmsMax:0,clipped:0,samples:0};const pcm=new Float32Array(meter.fftSize);const metering=setInterval(()=>{meter.getFloatTimeDomainData(pcm);let sum=0;for(const v of pcm){window.__mixStats.peak=Math.max(window.__mixStats.peak,Math.abs(v));if(Math.abs(v)>=.999)window.__mixStats.clipped++;sum+=v*v}window.__mixStats.samples+=pcm.length;window.__mixStats.rmsMax=Math.max(window.__mixStats.rmsMax,Math.sqrt(sum/pcm.length))},30);const canvas=document.querySelector('canvas');const video=canvas.captureStream(24);const stream=new MediaStream([...video.getVideoTracks(),...output.stream.getAudioTracks()]);const chunks=[];const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:1200000});rec.ondataavailable=e=>chunks.push(e.data);window.__recordStop=()=>new Promise(resolve=>{rec.onstop=async()=>{clearInterval(metering);const blob=new Blob(chunks,{type:'video/webm'});const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);video.getTracks().forEach(t=>t.stop())};rec.stop()});rec.start(500)};
})()`;
export async function boot(c,url,w=1280,h=720){
 await c.send('Page.enable');await c.send('Page.addScriptToEvaluateOnNewDocument',{source:captureSetup});await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await c.send('Page.navigate',{url});await sleep(6500);await c.click(w/2,h*.62);await sleep(2000);await c.send('Page.bringToFront');
}
export async function saveRecording(c,path){
 const length=await c.ev('__recordStop().then(data=>{window.__recordData=data;return data.length})');
 let data='';for(let i=0;i<length;i+=131072)data+=await c.ev(`__recordData.slice(${i},${i+131072})`);
 fs.writeFileSync(path,Buffer.from(data.split(',')[1],'base64'));
}
if(process.argv[2]==='boot'){const c=await connect();await boot(c,process.argv[3],+(process.argv[4]||1280),+(process.argv[5]||720));console.log(await c.ev('({game:__HM_GAME__(),audio:__HM_AUDIO__(),text:document.body.innerText.slice(0,300)})'));c.ws.close()}
