/* Review-only instrumentation, loaded before the app. No production hooks. */
(() => {
 const rows=[], counts={}, started=performance.now();
 const record=(type,detail)=>{
  rows.push({ms:Math.round(performance.now()-started),type,...detail});
  if(rows.length>1200)rows.shift();
  counts[type]=(counts[type]||0)+1;
  console.log('[audio-qa]',JSON.stringify(rows[rows.length-1]));
 };
 const label=a=>String(a.currentSrc||a.src||'').split('/').pop();
 const play=HTMLMediaElement.prototype.play;
 const observed=new WeakSet();
 HTMLMediaElement.prototype.play=function(){
  if(!observed.has(this)){
   observed.add(this);
   for(const name of ['playing','ended','pause','error','volumechange'])this.addEventListener(name,()=>{
    record(name,{file:label(this),volume:+this.volume.toFixed(3),time:+this.currentTime.toFixed(3),rate:this.playbackRate});
   });
  }
  record('play',{file:label(this),volume:+this.volume.toFixed(3),rate:this.playbackRate});
  const result=play.call(this);
  result?.catch(e=>record('rejected',{file:label(this),reason:e.name}));
  return result;
 };
 const create=AudioContext.prototype.createBufferSource;
 AudioContext.prototype.createBufferSource=function(){
  const node=create.call(this),start=node.start,stop=node.stop,ctx=this;
  node.start=function(...args){record('bufferStart',{duration:+(node.buffer?.duration||0).toFixed(4),loop:node.loop,state:ctx.state});return start.apply(node,args);};
  node.stop=function(...args){record('bufferStop',{duration:+(node.buffer?.duration||0).toFixed(4),loop:node.loop});return stop.apply(node,args);};
  return node;
 };
 document.addEventListener('visibilitychange',()=>record('visibility',{hidden:document.hidden}));
 document.addEventListener('DOMContentLoaded',()=>{
  const details=document.createElement('details');
  details.style='position:fixed;left:4px;top:4px;z-index:99999;max-width:410px;max-height:30vh;overflow:auto;background:#10182e;color:#d9f9d0;font:10px monospace;padding:4px';
  details.innerHTML='<summary>Audio QA monitor</summary><pre style="white-space:pre-wrap"></pre>';
  document.body.append(details);
  setInterval(()=>{details.querySelector('pre').textContent=JSON.stringify({counts,recent:rows.slice(-100)},null,1);},400);
 });
})();
