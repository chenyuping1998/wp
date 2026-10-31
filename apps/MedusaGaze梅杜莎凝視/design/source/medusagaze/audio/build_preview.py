"""Rebuild the dependency-free local audition page from audio_metadata.json."""
from pathlib import Path
import json

HERE=Path(__file__).resolve().parent
data=json.loads((HERE/'audio_metadata.json').read_text(encoding='utf-8'))
template='''<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>梅杜莎凝視 · 音訊試聽</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#101a21;color:#eaf0e7}*{box-sizing:border-box}body{max-width:1180px;margin:auto;padding:38px 24px 70px}h1{font-size:34px;margin:10px 0}h2{font-size:20px;color:#d6ca91;margin-top:38px}p{line-height:1.7;color:#b9c6be}a{color:#b7e4a1}header{border-bottom:1px solid #33493e;padding-bottom:24px}.eyebrow{color:#8ebc82;letter-spacing:.14em;font-size:12px}.notice{border:1px solid #76603c;background:#30291e;padding:15px 18px;border-radius:10px;color:#ecd7ad}.tools{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}button{background:#233c30;color:#e1edc7;border:1px solid #466747;border-radius:8px;padding:11px 15px;font:inherit;cursor:pointer}button:hover{background:#34533b}button.stop{background:#633b37;border-color:#8e5751}label{display:flex;align-items:center;gap:12px}input{accent-color:#a4d489}#status{min-height:24px;color:#b7e4a1}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(315px,1fr));gap:14px}.card{background:#18262b;border:1px solid #2d443c;border-radius:10px;padding:17px;min-width:0}.name{font:600 14px ui-monospace,monospace;color:#e0d1a0;overflow-wrap:anywhere}.meta{font-size:12px;margin:8px 0;color:#a9beb2}.desc{font-size:13px;min-height:34px}.card audio{width:100%;height:36px;margin:9px 0}.small{font-size:12px}.links{display:flex;gap:20px}.synthetic{border-color:#786140}.foot{margin-top:45px;font-size:13px} @media(max-width:600px){body{padding:24px 16px}h1{font-size:27px}}
</style>
<header><div class="eyebrow">MEDUSA GAZE / ORIGINAL SYNTHESIS / 2026.10.30</div>
<h1>梅杜莎凝視 · 音訊試聽</h1><p>情境喜劇的輕快節奏，配上原創里拉琴、潘笛與手鼓音色。__CUE_COUNT__ 個檔案，共 <strong>__AUDIO_MB__ MB</strong>；兩首 BGM 同主題、同調性，各 64 秒。</p>
<div class="notice">角色聲音為<strong>程序合成預聽</strong>，用於角色時機與情緒方向。仍需同一位真人配音演員錄製中音、帶鼻音的戲劇化聲線；不宣稱已完成真人配音。全部素材未使用外部取樣或既有曲目。</div>
<p class="small">SFX：WAV 44.1 kHz / 16-bit / mono。母帶：48 kHz / 24-bit。BGM 與環境循環：Ogg Vorbis / 44.1 kHz / stereo，以滿足 12 MB 預算。遊戲使用 Web Audio 取樣迴圈與 450 ms 交叉淡入淡出。<a href="LEVELS.md">LEVELS</a> · <a href="audio_metadata.json">量測資料</a> · <a href="generate_audio.py">重建程式</a> · <a href="../../audio/README.md">來源與授權</a></p>
</header>
<h2>倍率丟球 · v8 聲音層次</h2><p>350ms 蓄力 → 角色發聲 → 出手爆點 → 600ms 風壓 → 晶石重擊。以下為分層合成試聽；聲畫同步請使用<a href="../multiplier/preview/index.html">倍率演出預覽</a>。</p><audio controls src="CASTING_V8_SOUND_DESIGN.wav"></audio><h2>情境試聽</h2><p class="small">先將音量設低，再依序檢查連消音高、得分與落空的差異，以及多顆寶珠的短尾巴。下列為排程試聽；實際 Turbo / 筆電喇叭的主觀驗收仍需在遊戲中完成。</p>
<label>試聽音量 <input id="volume" type="range" min="0" max="1" step=".01" value=".5"><span id="volumeText">50%</span></label>
<div class="tools"><button data-scene="cascade">8 次連消</button><button data-scene="contrast">寶珠：得分 / 落空</button><button data-scene="turbo">3 顆寶珠間隔預聽</button><button data-scene="spins">連按 20 次 Spin</button><button data-scene="crossfade">BGM 主遊戲 → 免費遊戲</button><button class="stop" id="stop">停止全部</button></div><div id="status" aria-live="polite">準備試聽。</div>
<div id="library"></div>
<p class="foot">短於 3 秒的音效將整段重複至至少 3 秒再測 LUFS，避免 EBU R128 在不足 400 ms 的檔案回傳無量測值；表中 LUFS 為此參考值。BGM 與長檔以完整檔案量測。峰值為交付檔的 oversampled true peak。最高階罐頭笑聲屬選配，本版未製作。</p>
<script>
const DATA=__METADATA__;
const ROOT='../../../../static/assets/audio/medusa/';
const byCue=Object.fromEntries(DATA.files.map(f=>[f.cue,f]));
const groups=[['配樂與免費遊戲',f=>f.cue.startsWith('bgm_')||f.cue.startsWith('stinger_')],['梅杜莎與蛇 · 合成預聽',f=>f.cue.startsWith('vo_')||f.cue.includes('snake')||f.cue.includes('glasses')],['凝視與倍率',f=>/gaze|orb|mult|total/.test(f.cue)],['消除、掉落與神盾',f=>/petrify|crumble|drop|reel|scatter|win_mark/.test(f.cue)],['一般音效與大獎',f=>/button|spin|buybonus|fg_plus|bigwin|statues/.test(f.cue)],['環境迴圈',f=>f.cue.startsWith('amb_')]];
let audioContext,bus,voices=[],timers=[],revision=0;
const allAudio=[];
const volume=document.querySelector('#volume');
function setStatus(text){document.querySelector('#status').textContent=text}
function currentVolume(){return Number(volume.value)}
function updateVolume(){document.querySelector('#volumeText').textContent=Math.round(currentVolume()*100)+'%';for(const a of allAudio)a.volume=currentVolume();if(bus)bus.gain.value=currentVolume()}
volume.oninput=updateVolume;
const library=document.querySelector('#library');
for(const [title,test] of groups){
 const heading=document.createElement('h2');heading.textContent=title;library.append(heading);
 const section=document.createElement('section');library.append(section);
 for(const f of DATA.files.filter(test)){
  const card=document.createElement('div');card.className='card'+(f.cue.startsWith('vo_')?' synthetic':'');
  const name=document.createElement('div');name.className='name';name.textContent=f.file;card.append(name);
  const desc=document.createElement('p');desc.className='desc';desc.textContent=f.description;card.append(desc);
  const meta=document.createElement('div');meta.className='meta';meta.textContent=`${f.duration.toFixed(3)} s · ${f.true_peak_db.toFixed(2)} dBTP · ${f.lufs.toFixed(2)} LUFS · ${(f.bytes/1000).toFixed(1)} kB${f.loop?' · LOOP':''}`;card.append(meta);
  const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=ROOT+f.file;audio.loop=f.loop;audio.volume=currentVolume();allAudio.push(audio);card.append(audio);
  const links=document.createElement('div');links.className='links small';
  for(const [text,url] of [['執行檔',ROOT+f.file],['48k / 24-bit 母帶','masters/'+f.cue+'.wav']]){const a=document.createElement('a');a.href=url;a.textContent=text;a.download='';links.append(a)}card.append(links);section.append(card);
  if(f.cue.startsWith('bgm_')){const a=document.createElement('a');a.href='wav-reference/'+f.cue+'.wav';a.download='';a.textContent='44.1k / 16-bit WAV';links.append(a)}
 }
}
const cache=new Map();
function getEngine(){if(!audioContext){audioContext=new AudioContext();bus=audioContext.createGain();bus.gain.value=currentVolume();bus.connect(audioContext.destination)}audioContext.resume();return audioContext}
function stop(){revision++;timers.forEach(clearTimeout);timers=[];for(const v of voices){try{v.source.stop()}catch{} }voices=[];for(const a of allAudio){a.pause();a.currentTime=0}setStatus('已停止。')}
document.querySelector('#stop').onclick=stop;
async function play(cue,delay=0,gain=1,loop=false,token=revision){
 if(token!==revision)return;
 const f=byCue[cue];
 // file:// permits native media playback but usually blocks fetch. Individual
 // controls and these HTML audio scenes therefore remain usable offline.
 if(location.protocol==='file:'){
  const a=new Audio(ROOT+f.file);a.volume=currentVolume()*gain;a.loop=loop;allAudio.push(a);timers.push(setTimeout(()=>{if(token===revision)a.play().catch(()=>setStatus('請使用個別播放鈕，或以本機 HTTP 伺服器開啟。'))},delay*1000));return;
 }
 const ctx=getEngine();
 if(!cache.has(cue))cache.set(cue,fetch(ROOT+f.file).then(r=>{if(!r.ok)throw Error(f.file);return r.arrayBuffer()}).then(b=>ctx.decodeAudioData(b)));
 const buffer=await cache.get(cue);if(token!==revision)return;const source=ctx.createBufferSource();source.buffer=buffer;source.loop=loop;const g=ctx.createGain();g.gain.value=gain;source.connect(g);g.connect(bus);const voice={source,gain:g};voices.push(voice);source.onended=()=>{source.disconnect();g.disconnect();voices=voices.filter(v=>v!==voice)};source.start(ctx.currentTime+delay);return voice;
}
async function scene(name){
 stop();
 const token=revision;const audition=(cue,delay=0,gain=1,loop=false)=>play(cue,delay,gain,loop,token);
 try{
  if(name==='cascade'){setStatus('8 次連消：第 5 次起維持最高音階。');for(let i=0;i<8;i++){await audition('sfx_petrify_'+Math.min(i+1,5),i*.52);await audition('sfx_crumble',i*.52+.13,.55);await audition('sfx_drop',i*.52+.32,.7)}}
  if(name==='contrast'){setStatus('依序：綠、紫、金寶珠得分 → 兩種落空。');for(const [i,cue] of ['sfx_orb_hit_s','sfx_orb_hit_m','sfx_orb_hit_l','sfx_orb_crack','sfx_orb_crack_2'].entries())await audition(cue,i*.85)}
  if(name==='turbo'){setStatus('3 顆寶珠：200 ms 間隔、600 ms 飛行；三種 TURBO 的倍率演出速度相同。');for(let i=0;i<3;i++){await audition('sfx_orb_fly',i*.2,.8);await audition('sfx_orb_hit_'+['s','m','l'][i],i*.2+.6,.8)}}
  if(name==='spins'){setStatus('20 次短轉試聽，約 9 秒；請自行判斷是否刺耳。');for(let i=0;i<20;i++){await audition('sfx_spin',i*.45,.8);await audition('sfx_reel_stop',i*.45+.17,.65)}}
  if(name==='crossfade'){
   setStatus('主遊戲 6 秒後交叉淡入免費遊戲，8 秒後回到主遊戲。');
   const a=await audition('bgm_base',0,1,true);
   if(token!==revision)return;
   timers.push(setTimeout(async()=>{if(token!==revision)return;const b=await audition('bgm_feature',0,0,true);if(token!==revision)return;if(b){const now=audioContext.currentTime;a.gain.gain.setValueAtTime(a.gain.gain.value,now);b.gain.gain.setValueAtTime(0,now);a.gain.gain.linearRampToValueAtTime(0,now+.45);b.gain.gain.linearRampToValueAtTime(1,now+.45);timers.push(setTimeout(()=>{if(token!==revision)return;const t=audioContext.currentTime;b.gain.gain.setValueAtTime(b.gain.gain.value,t);a.gain.gain.setValueAtTime(0,t);b.gain.gain.linearRampToValueAtTime(0,t+.45);a.gain.gain.linearRampToValueAtTime(1,t+.45);setStatus('已回到主遊戲。可停止或繼續聽循環。')},8000))}else setStatus('檔案模式請用個別 BGM 播放鈕；HTTP 模式支援交叉淡入淡出。')},6000));
  }
 }catch(error){setStatus('載入失敗：'+error.message)}
}
for(const button of document.querySelectorAll('[data-scene]'))button.onclick=()=>scene(button.dataset.scene);
</script></html>
'''
(HERE/'preview.html').write_text(template.replace('__METADATA__',json.dumps(data,ensure_ascii=False)).replace('__CUE_COUNT__',str(len(data['files']))).replace('__AUDIO_MB__',f"{data['runtime_bytes']/1_000_000:.2f}"),encoding='utf-8')
print('Wrote preview.html')
