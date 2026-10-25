<script lang="ts">
 import TreasureBeachBackdrop from '../../components/TreasureBeachBackdrop.svelte';
 import { onMount,onDestroy } from 'svelte';
 import { dev } from '$app/environment';
 import { innerWidth,innerHeight } from 'svelte/reactivity/window';
 import { Container,Sprite,Graphics,Text } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import assets from '../../game/assets';
 import SandPreviewStage from '../../components/SandPreviewStage.svelte';
 import ReelSand from '../../components/ReelSand.svelte';
 import TreasureFigure from '../../components/TreasureFigure.svelte';
 import TreasureSymbol from '../../components/TreasureSymbol.svelte';
 import SymbolWinAnim from '../../components/SymbolWinAnim.svelte';
 import {SYMBOL_INFO_MAP} from '../../game/constants';
 import DetectorSweep from '../../components/DetectorSweep.svelte';
 import WinLineRunner from '../../components/WinLineRunner.svelte';
 import {FoleyGate,MusicDuckWindow,TREASURE_FOLEY,FOCUS_DURATIONS,type TreasureFoley} from '../../game/treasureAudioDirection';
 import DigZone from '../../components/DigZone.svelte';
 import WaveWipe from '../../components/WaveWipe.svelte';
 import TreasureFeatureOpening from '../../components/TreasureFeatureOpening.svelte';
 import TreasureFeatureCard from '../../components/TreasureFeatureCard.svelte';
 import {OPENING,type OpeningSound} from '../../game/featureOpening';
 import {MULTIPLIER_FLIP_MS} from '../../game/treasureMechanicMotion';
 import {FEATURE_TIERS,tierByBonusTier} from '../../game/featureTiers';
 import {castDuration,type CastCue} from '../../game/treasureMotion';
 import {subscribePresentationFrame} from '../../game/presentationClock';
 const previewAssets=Object.fromEntries(Object.entries(assets).filter(([,entry])=>entry.type==='sprite'&&typeof entry.src==='string'&&entry.src.includes('/treasure/')));
 const names=['H1','H2','H3','H4','H5','W','S','SW','L1','L2','L3','L4'];
 const keys:Record<string,string>={H1:'hmH1',H2:'hmH2',H3:'hmH3',H4:'hmH4',H5:'hmH5',W:'hmW',S:'hmS',SW:'hmSw',L1:'hmL1',L2:'hmL2',L3:'hmL3',L4:'hmL4'};
 const symbolInfo=(name:string)=>SYMBOL_INFO_MAP[name as keyof typeof SYMBOL_INFO_MAP].win;
 let now=$state(0),spinStart=$state(-10000),scanStart=$state(-10000),zoneStart=$state(-10000);
 let spinning=$state([false,false,false,false,false]),turbo=$state(false),who=$state<'digger'|'lifeguard'>('digger'),cue=$state<CastCue>('idle'),sequence=$state(0),wave=$state(false),zones=$state(false),soundOn=$state(true);
 let music:HTMLAudioElement|undefined;let voices:HTMLAudioElement[]=[];
 const previewFoley=new FoleyGate(),previewDuck=new MusicDuckWindow();let previewMixLevel=1;
 let audioStarted=$state(0),audioFailed=$state(0),openingCues=$state<string[]>([]);
 const stopEffects=()=>{voices.forEach(v=>v.pause());voices=[];previewDuck.reset();previewMixLevel=1;};
 const playFoley=(name:TreasureFoley)=>{if(!previewFoley.admit(name,performance.now()))return;if(name==='sand_reveal')previewDuck.request(performance.now()/1000,.6/rate,.72);play(name,TREASURE_FOLEY[name].volume);};
 let jobs:{at:number;run:()=>void}[]=[];
 let half=$state(false),inspectAct=$state(false),actTime=$state(0),actCue=$state<CastCue>('scan');
 let inspectSymbols=$state(false),symbolTime=$state(0);
 let inspectRig=$state(false),rigName=$state('H4'),rigPaused=$state(false),rigTime=$state(0),rigBones=$state(false);
 const rigLabels:Record<string,string>={H1:'寶箱｜開蓋與金幣',H2:'沙堡｜旗幟跟隨',H3:'海螺｜殼口與尖端',H4:'椰子｜吸管獨立旋轉',H5:'繩索｜鑰匙擺動與反光',W:'猴子｜帽沿、笑臉與眨眼',S:'藏寶圖｜收卷與展開',SW:'探測器｜面板與線圈',L1:'A｜字母蓄力跳躍',L2:'K｜字母側轉回彈',L3:'Q｜字母扭轉收勢',L4:'J｜字母上挑回落'};
 let winningCells=$state(new Set<string>()),winSequence=$state(0),winCompleted=$state(0),winTracing=$state(false);
 const cellKey=(reel:number,row:number)=>`${reel}:${row}`;
 const finishCell=(key:string,token:number)=>{if(token!==winSequence||!winningCells.has(key))return;winningCells=new Set([...winningCells].filter(value=>value!==key));winCompleted++;};
 const rate=$derived(half?.5:1);
 const schedule=(delay:number,run:()=>void)=>jobs.push({at:now+delay,run});
 let inspectGaze=$state(false),inspectCast=$state(false),castPlaying=$state(false),castSequence=$state(0),gazeX=$state(-.8),gazeY=$state(.6);
 const primaryRow=[1,1,2,1,1];
 const inspectEyes=()=>{inspectCast=false;castPlaying=false;inspectRig=false;fg=false;inspectFg=false;inspectAct=true;actCue='scan';actTime=440;inspectGaze=!inspectGaze;};
 const inspectBody=()=>{inspectRig=false;fg=false;inspectFg=false;inspectAct=true;actCue='scan';actTime=560;castPlaying=false;inspectGaze=true;inspectCast=true;};
 let inspectWave=$state(false),waveTime=$state(100),inspectZone=$state(false),multTime=$state(0),zoneMult=$state(10);
 let fg=$state(false),fgCovered=$state(false),fgDone=$state(false),fgSequence=$state(0),inspectFg=$state(false),fgTime=$state(0),fgTierKey=$state('soldier');
 const fgTier=$derived(tierByBonusTier(fgTierKey)??FEATURE_TIERS[0]);
 const fgSound=(cue:OpeningSound)=>{openingCues=[...openingCues,{scan:'探測鎖定',find:'沙地發現',chest:'寶箱開蓋',celebrate:'FG短句',wave:'碎浪'}[cue]];if(cue==='celebrate')play('fs_intro');else if(cue==='wave')play('wave_transition');else playFoley(cue==='scan'?'detector_lock':cue==='find'?'sand_reveal':'chest_open');};
 const startFg=()=>{inspectRig=false;audioStarted=0;audioFailed=0;openingCues=[];stopEffects();winTracing=false;inspectGaze=false;clearTimers();spinning=centers.map(()=>false);inspectAct=false;inspectSymbols=false;wave=false;inspectWave=false;inspectFg=false;fgCovered=false;fgDone=false;fgSequence++;fg=true;};
 const inspectOpening=()=>{inspectRig=false;inspectGaze=false;clearTimers();fg=false;wave=false;inspectWave=false;inspectFg=!inspectFg;};
 let toolbar=$state<HTMLElement>();let toolbarHeight=$state(110);
 const width=$derived(innerWidth.current??1200),height=$derived(innerHeight.current??800);
 const featureHeight=$derived(Math.max(100,height-toolbarHeight));
 const gazeHeight=$derived(inspectCast?Math.min(width*1.35,featureHeight-65):Math.min(width*2.3,featureHeight*2.2));
 const scale=$derived(Math.max(.25,Math.min((width-24)/1180,(height-120)/740)));
 const centers=[59,177,295,413,531];
 const scan=$derived(Math.max(0,Math.min(1,(now-scanStart-300)/(turbo?340:520))));
 const scanPower=$derived(now-scanStart>=0&&now-scanStart<(turbo?850:1150)?1:0);
 const play=(name:string,volume=.5)=>{if(!soundOn)return;if(FOCUS_DURATIONS[name])previewDuck.request(performance.now()/1000,FOCUS_DURATIONS[name]/rate,.45);const audio=new Audio(`/assets/audio/treasure/sfx/${name}.wav`);audio.volume=volume;audio.playbackRate=rate;void audio.play().then(()=>audioStarted++).catch(()=>audioFailed++);voices.push(audio);voices=voices.filter(v=>!v.ended);};
 const clearTimers=()=>{jobs=[];};
 const run=()=>{inspectRig=false;winTracing=false;inspectGaze=false;clearTimers();winSequence++;winningCells=new Set();winCompleted=0;inspectAct=false;inspectSymbols=false;spinning=centers.map(()=>true);spinStart=now;cue='scan';sequence++;play('spin');centers.forEach((_,i)=>schedule(turbo?450+i*70:1200+i*180,()=>{spinning=spinning.map((v,j)=>i===j?false:v);play('reel_stop');}));};
 const stop=()=>{inspectRig=false;winTracing=false;clearTimers();spinning=centers.map(()=>false);play('reel_stop');};
 const win=()=>{inspectRig=false;inspectGaze=false;inspectSymbols=false;inspectAct=false;winSequence++;winningCells=new Set();winCompleted=0;winTracing=true;cue='winBig';sequence++;play('win_tier_big');};
 const winReel=(reel:number,token:number)=>{
  if(token!==winSequence)return;
  winningCells=new Set([...winningCells,cellKey(reel,primaryRow[reel])]);
  for(let row=0;row<4;row++)if(row!==primaryRow[reel])schedule(44+row*12,()=>{if(token===winSequence)winningCells=new Set([...winningCells,cellKey(reel,row)]);});
 };

 const sweep=()=>{inspectRig=false;inspectGaze=false;inspectAct=false;scanStart=now;cue='scan';sequence++;play('wild_expand');};
 const zone=()=>{inspectRig=false;inspectGaze=false;fg=false;inspectFg=false;inspectZone=false;zones=!zones;zoneStart=now;play('frame_big_land');};
 const flipZone=()=>{inspectRig=false;inspectGaze=false;clearTimers();fg=false;inspectFg=false;const current=inspectZone?(multTime<115?10:20):zoneMult;zoneMult=current;inspectZone=false;zones=true;zoneStart=-10000;const next=current===10?20:10;schedule(180,()=>{zoneMult=next;play('mult_update');});};
 const inspectMultiplier=()=>{inspectRig=false;inspectGaze=false;fg=false;inspectFg=false;zones=true;zoneStart=-10000;inspectZone=!inspectZone;};
 const swap=()=>{inspectRig=false;who=who==='digger'?'lifeguard':'digger';cue='welcome';sequence++;};
 const startMusic=(feature:boolean)=>{music?.pause();music=new Audio(`/assets/audio/treasure/${feature?'bgm_freespin':'bgm_main'}.mp3`);music.loop=true;music.volume=.24;if(soundOn)void music.play().catch(()=>{});};
 const wipe=()=>{inspectRig=false;inspectGaze=false;inspectWave=false;wave=false;requestAnimationFrame(()=>{wave=true;play('wave_transition');});};
 const story=()=>{inspectWave=false;zones=false;run();const speed=turbo?.7:1;schedule(2250*speed,sweep);schedule(3500*speed,()=>{zones=true;zoneStart=now;play('frame_big_land');});schedule(4100*speed,win);schedule(6600*speed,wipe);};
 const grid=(g:PixiGraphics)=>{g.clear();g.roundRect(0,0,590,472,6).fill(0xeddbaf);for(let i=1;i<5;i++)g.moveTo(i*118,0).lineTo(i*118,472).stroke({width:1.3,color:0xc4a57a});for(let i=1;i<4;i++)g.moveTo(0,i*118).lineTo(590,i*118).stroke({width:1.3,color:0xc4a57a});};
 const mask=(g:PixiGraphics)=>{g.rect(0,0,590,472).fill(0xffffff);};
 onMount(()=>{
  const toolbarNode=toolbar;if(!toolbarNode)return;
  const observer=new ResizeObserver(()=>toolbarHeight=toolbarNode.getBoundingClientRect().height);observer.observe(toolbarNode);
  const stopClock=subscribePresentationFrame(delta=>{if(inspectRig&&!rigPaused)rigTime=(rigTime+delta*rate)%970;const desired=performance.now()/1000<previewDuck.until?previewDuck.level:1;previewMixLevel+=(desired-previewMixLevel)*(1-Math.exp(-delta/(desired<previewMixLevel?35:140)));if(music)music.volume=.24*previewMixLevel;now+=delta*rate;const due=jobs.filter(job=>job.at<=now);jobs=jobs.filter(job=>job.at>now);due.forEach(job=>job.run());});
  return()=>{observer.disconnect();stopClock();};
 });
 onDestroy(()=>{clearTimers();music?.pause();stopEffects();});
</script>
<svelte:head><title>Treasure Monkey · 美術動畫音效檢視</title></svelte:head>

{#if dev}
 <SandPreviewStage assets={previewAssets}>
  <TreasureBeachBackdrop {width} {height}/>
  <Container x={(width-1180*scale)/2} y={110+(height-110-740*scale)/2} {scale}>
   <Text text="TREASURE MONKEY" x={56} y={34} style={{fontFamily:'Titan One',fontSize:43,fill:0x287f8c,stroke:{color:0xfff3d2,width:5}}}/>
   <Text text="BEACH ART · ORIGINAL AUDIO · ANIMATION STUDY" x={60} y={94} style={{fontFamily:'Saira',fontSize:16,fill:0x274c52}}/>
   <Container x={60} y={166}>
    <Graphics draw={grid}/>
    <Container><Graphics isMask draw={mask}/>
     {#each centers as x,reel}
      {#each [-1,0,1,2,3,4] as row}
       {@const name=names[((reel*4+row+12)%12)]}
       <Container {x} y={row*118+59+(spinning[reel]?((now-spinStart)*.62)%118:0)}>
        {#if inspectSymbols}<SymbolWinAnim primary={row===primaryRow[reel]} symbolName={name} symbolInfo={symbolInfo(name)} cell={{reel,row:row+1}} previewTime={symbolTime}/>{:else if winningCells.has(cellKey(reel,row))}{#key winSequence}{@const token=winSequence}<SymbolWinAnim primary={row===primaryRow[reel]} symbolName={name} symbolInfo={symbolInfo(name)} cell={{reel,row:row+1}} playbackRate={rate} oncomplete={()=>finishCell(cellKey(reel,row),token)}/>{/key}{:else}<TreasureSymbol {name} assetKey={keys[name]} width={118*symbolInfo(name).sizeRatios.width} height={118*symbolInfo(name).sizeRatios.height}/>{/if}
       </Container>
      {/each}
     {/each}
    </Container>
    {#if inspectSymbols}<WinLineRunner points={centers.map((x,reel)=>({x,y:primaryRow[reel]*118+59}))} color={0xfff3d2} previewTime={symbolTime}/>{/if}
    {#if winTracing}{#key winSequence}{@const token=winSequence}<WinLineRunner points={centers.map((x,reel)=>({x,y:primaryRow[reel]*118+59}))} color={0xfff3d2} playbackRate={rate} onreel={reel=>winReel(reel,token)} oncomplete={()=>{if(token===winSequence)winTracing=false;}}/>{/key}{/if}
    <ReelSand {spinning} {centers} floor={469} {turbo}/>
    {#if zones}<Container x={177} y={177}>{#key inspectZone}<DigZone onflip={()=>playFoley('plaque_flip')} size={2} mult={inspectZone?20:zoneMult} previousMult={inspectZone?10:undefined} updateTime={inspectZone?multTime:undefined} playbackRate={rate} time={now-zoneStart>440?-1:now-zoneStart} duration={440} sticky={who==='lifeguard'}/>{/key}</Container><Container x={413} y={59}><DigZone mult={25} time={now-zoneStart>460?-1:now-zoneStart} duration={460}/></Container>{/if}
    {#if scanPower}<Container x={295}><DetectorSweep progress={scan} preparation={Math.min(1,Math.max(0,(now-scanStart)/300))} power={scanPower}/></Container>{/if}
   </Container>
   <Sprite key="hmFrameEdge" x={355} y={402} width={590*1280/1110} height={472*1280/1110} anchor={.5}/>
   <TreasureFigure focus={inspectGaze?{x:gazeX,y:gazeY}:scanPower?{x:-.8,y:-.3+scan*1.3}:undefined} {who} x={720} y={6} height={670} cue={inspectAct?actCue:cue} {sequence} previewTime={inspectAct?Math.min(actTime,castDuration(actCue)):undefined} playbackRate={rate}/>
   <Sprite key="hmUiTicker" x={355} y={691} width={600} height={70} anchor={.5}/>
   <Text text={who==='digger'?'FOLLOW THE BEEP. FIND THE SURPRISE.':'THE NEXT ADVENTURE IS AT LOW TIDE.'} x={355} y={687} anchor={.5} style={{fontFamily:'Titan One',fontSize:18,fill:0x274c52}}/>
  </Container>
  {#if wave}<WaveWipe {width} {height} playbackRate={rate} oncover={swap} oncomplete={()=>wave=false}/>{/if}
  {#if inspectWave}<WaveWipe {width} {height} previewTime={waveTime}/>{/if}
  <Container y={toolbarHeight}>
  {#if (fg&&fgCovered)||(inspectFg&&fgTime>=OPENING.cover)}<TreasureFeatureCard {width} height={featureHeight} tier={fgTier} header="10 FREE SPINS AWARDED" sequence={fgSequence}/>{/if}
  {#if fg&&!fgDone}{#key fgSequence}<TreasureFeatureOpening {width} height={featureHeight} playbackRate={rate} title={fgTier.title} onsound={fgSound} oncover={()=>fgCovered=true} oncomplete={()=>fgDone=true}/>{/key}{/if}
  {#if inspectFg}<TreasureFeatureOpening {width} height={featureHeight} title={fgTier.title} previewTime={fgTime}/>{/if}
  </Container>
 {#if inspectGaze}<Container y={toolbarHeight}><TreasureBeachBackdrop {width} height={featureHeight}/><TreasureFigure {who} x={width/2-236*gazeHeight/700} y={16} height={gazeHeight} cue={actCue} sequence={castSequence} playbackRate={rate} previewTime={inspectCast&&castPlaying?undefined:Math.min(actTime,castDuration(actCue))} focus={{x:gazeX,y:gazeY}}/></Container>{/if}
  {#if inspectRig}
   <Container y={toolbarHeight}>
    <Graphics draw={g=>{g.clear();g.rect(0,0,width,featureHeight).fill(0xfff3d2);g.roundRect(width*.04,20,width*.92,Math.max(60,featureHeight-110),22).fill(0xf4e1b6).stroke({color:0xc8a879,width:2});}}/>
    <Text text={rigLabels[rigName]} x={width/2} y={38} anchor={{x:.5,y:0}} style={{fontFamily:'Microsoft JhengHei',fontSize:Math.min(23,width/24),fill:0x286a72,fontWeight:'bold'}}/>
    <Container x={width/2} y={(featureHeight-85)/2+22} scale={Math.max(.5,Math.min(3.4,(featureHeight-175)/118,(width-60)/118))}>
     {#key rigName}<SymbolWinAnim symbolName={rigName} symbolInfo={symbolInfo(rigName)} previewTime={rigTime} debugBones={rigBones}/>{/key}
    </Container>
   </Container>
  {/if}
 </SandPreviewStage>
 <div class="rig-tools"><button onclick={inspectBody}>人物特寫</button>{#if inspectCast&&inspectGaze}<button onclick={()=>{castPlaying=true;castSequence++;}}>重播人物</button>{/if}<button onclick={()=>{inspectRig=!inspectRig;fg=false;inspectFg=false;inspectGaze=false;rigTime=0;}}>獎圖特寫</button>{#if inspectRig}<select aria-label="特寫獎圖" bind:value={rigName}>{#each names as name}<option value={name}>{rigLabels[name]}</option>{/each}</select><label><input type="checkbox" bind:checked={rigPaused}/>暫停獎圖</label><label><input type="checkbox" bind:checked={rigBones}/>顯示骨架</label><label>動作時間 <input aria-label="獎圖骨架時間" type="range" min="0" max="970" step="1" bind:value={rigTime} oninput={()=>rigPaused=true}/>{Math.round(rigTime)}ms</label>{/if}</div>
 <nav bind:this={toolbar}><strong>演出檢視</strong><button onclick={startFg}>FG 開場</button><button onclick={inspectOpening}>FG 逐格</button>{#if fg||inspectFg}<select aria-label="FG 階級" bind:value={fgTierKey}>{#each FEATURE_TIERS as tier}<option value={tier.tier}>{tier.title}</option>{/each}</select>{#if fg&&!fgDone}<button onclick={()=>{fgCovered=true;fgDone=true;voices.forEach(v=>v.pause());}}>略過開場</button>{/if}<button onclick={()=>{fg=false;inspectFg=false;}}>返回演出</button>{/if}{#if inspectFg}<label>開場時間 <input aria-label="FG 開場時間" type="range" min="0" max={OPENING.end} step="1" bind:value={fgTime}/>{fgTime}ms</label>{/if}<button onclick={story}>完整演出</button><label><input type="checkbox" bind:checked={half}/>半速</label><button onclick={()=>{inspectRig=false;inspectAct=!inspectAct;}}>角色逐格</button><button onclick={inspectEyes}>視線檢查</button>{#if inspectGaze&&!inspectCast}<label>視線左右 <input aria-label="視線左右" type="range" min="-1" max="1" step=".05" bind:value={gazeX}/></label><label>視線上下 <input aria-label="視線上下" type="range" min="-1" max="1" step=".05" bind:value={gazeY}/></label>{/if}{#if inspectAct}<select aria-label="角色動作" bind:value={actCue}><option value="scan">探測／挖掘</option><option value="win">小獎反應</option><option value="winBig">大獎反應</option><option value="welcome">歡迎</option></select><label>姿勢時間 <input aria-label="姿勢時間" type="range" min="0" max={castDuration(actCue)} step="1" bind:value={actTime} oninput={()=>castPlaying=false}/>{Math.min(actTime,castDuration(actCue))}ms</label>{/if}<button onclick={()=>{inspectRig=false;inspectGaze=false;inspectSymbols=!inspectSymbols;}}>符號逐格</button>{#if inspectSymbols}<label>符號時間 <input aria-label="符號時間" type="range" min="0" max="970" step="1" bind:value={symbolTime}/>{symbolTime}ms</label>{/if}<button onclick={run}>轉輪捲沙</button><button onclick={stop}>急停</button><button onclick={sweep}>探測器 Wild</button><button onclick={zone}>倍率探測區</button><button onclick={flipZone}>倍率翻牌</button><button onclick={inspectMultiplier}>倍率逐格</button>{#if inspectZone}<label>翻牌時間 <input aria-label="倍率翻牌時間" type="range" min="0" max={MULTIPLIER_FLIP_MS} step="1" bind:value={multTime}/>{multTime}ms</label>{/if}<button onclick={win}>中獎與角色</button><button onclick={wipe}>海浪轉場</button><button onclick={()=>{inspectRig=false;inspectGaze=false;wave=false;inspectWave=!inspectWave;}}>浪花逐格</button>{#if inspectWave}<label>浪花時間 <input aria-label="浪花時間" type="range" min="0" max="1279" step="1" bind:value={waveTime}/></label>{/if}<button onclick={swap}>切換人物</button><label><input type="checkbox" bind:checked={turbo}/>Turbo</label><button onclick={()=>startMusic(false)}>主遊戲配樂</button><button onclick={()=>startMusic(true)}>FG 配樂</button><button onclick={()=>{music?.pause();stopEffects();}}>停止聲音</button><a href="/setup">開案頁</a><small>純演出預覽，使用正式素材與元件；此頁未接評獎或平台 session。{#if winCompleted>0} 中獎演出完成 {winCompleted}/20{/if}{#if fgDone&&fg} FG 開場完成{/if}{#if openingCues.length} 音效節點：{openingCues.join(" → ")}；已啟動 {audioStarted}／失敗 {audioFailed}{/if}</small></nav>
{:else}<a href="/">Treasure Monkey</a>{/if}
<style>
 .rig-tools{position:fixed;bottom:12px;left:12px;right:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;width:fit-content;max-width:calc(100% - 48px);padding:8px 12px;border:1px solid #b68f5f;border-radius:9px;background:#fff5deef;color:#2a1a12;font-size:12px}
 .rig-tools label{display:flex;gap:5px;align-items:center}.rig-tools select{max-width:230px;padding:6px;background:#fff5de;border:1px solid #b68f5f;border-radius:5px;color:#2a1a12}.rig-tools input[type=range]{width:140px}

:global(body){margin:0;background:#fff3d2;overflow:hidden;font-family:'Saira','Segoe UI','Microsoft JhengHei',sans-serif}nav{position:fixed;top:0;left:0;right:0;padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fff5deed;border-bottom:2px solid #2a1a12;color:#2a1a12;font-size:12px}button{background:#fff5de;border:2px solid #2a1a12;border-radius:6px;padding:7px 10px;cursor:pointer;color:#2a1a12}button:hover{background:#f3d397}nav small{width:100%;color:#5b6257;font-size:11px}a{color:#287f8c}button:focus-visible{outline:3px solid #287f8c;outline-offset:2px}@media(max-width:600px){nav{gap:5px;padding:7px}button{font-size:11px;padding:5px 7px}nav small{display:none}}</style>
