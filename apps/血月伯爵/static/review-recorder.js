// Local artboard helper. Recording is explicitly enabled with ?record=1.
// Captures the actual canvas and the game's own mixer, without microphone input.
const reviewQuery=new URLSearchParams(location.search);
if(reviewQuery.get('record')==='1'){
 const control=document.createElement('button');
 control.disabled=true;control.textContent='場景載入中…';control.style.cssText='position:fixed;left:12px;top:12px;z-index:20;padding:10px 16px;background:#241021;color:#f1d4a1;border:1px solid #b28b55;border-radius:8px;font:14px system-ui;cursor:pointer';
 document.body.append(control);
 const readiness=setInterval(()=>{
  const target=document.querySelector('#scene')?.contentWindow;
  if(!target?.bloodMoonReviewAudio||!target.bloodMoonReviewBegin||reviewQuery.get('scene')==='win'&&!target.bloodMoonReviewWin)return;
  clearInterval(readiness);control.disabled=false;control.textContent='開始錄製演出';
 },200);
 window.addEventListener('pagehide',()=>clearInterval(readiness),{once:true});
 control.onclick=async()=>{
  const frame=document.querySelector('#scene'),canvas=frame.contentDocument.querySelector('canvas');
  if(!canvas){control.textContent='場景載入中，請稍後再按';return;}
  const format=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!format){control.textContent='瀏覽器不支援錄製';return;}
  const seconds=Math.max(5,Math.min(120,Number(reviewQuery.get('seconds'))||14));
  const target=frame.contentWindow;
  if(reviewQuery.get('scene')==='win'&&!target.bloodMoonReviewWin){control.textContent='大獎場景載入中，請稍後再按';return;}
  control.disabled=true;control.textContent='準備錄製…';
  let audio;
  try{audio=await target.bloodMoonReviewAudio?.();await target.bloodMoonReviewPrepare?.();}
  catch(error){for(const track of audio?.getTracks()??[])track.stop();control.disabled=false;control.textContent='音訊準備失敗，請重新錄製';return;}
  if(!target.bloodMoonReviewBegin?.()){
   for(const track of audio?.getTracks()??[])track.stop();
   control.disabled=false;control.textContent='場景尚未就緒，請重新錄製';return;
  }
  // Request each frame only AFTER the game clock, Svelte updates and Pixi draw
  // complete. Automatic capture can be tied to a throttled embedded compositor.
  const video=canvas.captureStream(0),track=video.getVideoTracks()[0];let requested=0;
  const capture=()=>{track.requestFrame();control.dataset.requestedFrames=String(++requested);};
  target.bloodMoonReviewCaptureFrame=capture;
  const stream=new MediaStream([...video.getVideoTracks(),...(audio?.getAudioTracks()??[])]);
  const recorder=new MediaRecorder(stream,{mimeType:format,videoBitsPerSecond:8000000,audioBitsPerSecond:192000}),chunks=[];
  control.disabled=true;control.textContent='錄製演出中…';
  recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  recorder.onstop=()=>{
   for(const track of stream.getTracks())track.stop();
   if(target.bloodMoonReviewCaptureFrame===capture)delete target.bloodMoonReviewCaptureFrame;
   target.bloodMoonReviewEnd?.();
   const blob=new Blob(chunks,{type:format}),url=URL.createObjectURL(blob),link=document.createElement('a');
   const rank=['big','super','mega','epic'].includes(reviewQuery.get('rank'))?reviewQuery.get('rank'):'epic';
   link.href=url;link.download=`bloodmoon-${reviewQuery.get('scene')==='win'?rank:reviewQuery.get('scenario')==='wild'?'wild':'bigwin'}.webm`;link.textContent='下載演出影片';
   link.style.cssText=control.style.cssText;link.style.top='58px';document.body.append(link);link.click();
   control.disabled=false;control.textContent=`重新錄製演出（${canvas.dataset.reviewFrames??0} 幀）`;
   setTimeout(()=>{URL.revokeObjectURL(url);link.remove();},60000);
  };
  recorder.onerror=()=>{for(const track of stream.getTracks())track.stop();if(target.bloodMoonReviewCaptureFrame===capture)delete target.bloodMoonReviewCaptureFrame;target.bloodMoonReviewEnd?.();control.disabled=false;control.textContent='錄製失敗，重新錄製';};
  recorder.start(250);
  capture();
  // Use the same enabled Space shortcut as the native spin control. The
  // artboard URL forwards no RGS/session parameters and uses virtual balance.
  if(reviewQuery.get('scene')==='win')void target.bloodMoonReviewWin();
  else{target.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true}));target.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space',bubbles:true}));}
  setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},seconds*1000);
 };
}
