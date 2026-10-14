/* Offline preview only: records actual runtime music and cue timing. Never shipped. */
if(new URLSearchParams(location.search).has('qa_audio')){
 const Native=window.AudioContext||window.webkitAudioContext;
 const mixer=new Native(),bus=mixer.createGain(),output=mixer.createMediaStreamDestination();bus.connect(output);
 const originalConnect=AudioNode.prototype.connect,ctxBuses=new WeakMap(),elements=new WeakMap();
 AudioNode.prototype.connect=function(destination,...args){
  const result=originalConnect.call(this,destination,...args);
  if(this.context!==mixer&&destination===this.context.destination){
   let capture=ctxBuses.get(this.context);
   if(!capture){capture=this.context.createMediaStreamDestination();ctxBuses.set(this.context,capture);mixer.createMediaStreamSource(capture.stream).connect(bus);}
   originalConnect.call(this,capture);
  }
  return result;
 };
 const originalPlay=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){
  if(!elements.has(this)){const source=mixer.createMediaElementSource(this);source.connect(bus);source.connect(mixer.destination);elements.set(this,source);}
  return originalPlay.call(this);
 };
 let recorder,chunks=[],start=0;
 const panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',right:'4px',top:'4px',zIndex:100000,font:'12px sans-serif',background:'#fff0cf',color:'#20231d',padding:'4px',border:'2px solid #20231d'});
 const button=document.createElement('button');button.textContent='Record actual game audio';panel.appendChild(button);document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(panel));
 button.onclick=async()=>{
  if(recorder?.state==='recording'){recorder.stop();button.disabled=true;return;}
  await mixer.resume();chunks=[];start=Date.now();const type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(output.stream,{mimeType:type,audioBitsPerSecond:192000});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PicklePanic-runtime-'+Math.round((Date.now()-start)/1000)+(recorder.mimeType.includes('mp4')?'.m4a':'.webm');a.textContent='Download actual game recording';panel.replaceChildren(a);};
  recorder.start(1000);button.textContent='Stop & save actual game audio';
 };
}
