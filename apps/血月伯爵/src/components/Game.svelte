<script lang="ts">
 import '../game/gpuAddBlend';import '../game/fonts';import '../game/uiTheme';
 import {App,Text} from 'pixi-svelte';import {UI,UiGameName} from 'components-ui-pixi';
 import {EnableHotkey} from 'components-shared';import {EnablePixiExtension} from 'components-pixi';
 import {stateModal,stateReplay} from 'state-shared';import {onMount,onDestroy,tick} from 'svelte';
 import {getContext} from '../game/context';
 import {stateBloodMoon,stopBloodMoon,settleBloodMoon,playEvents} from '../game/bloodmoon.svelte';
 import {winTier} from '../game/presentation';
 import {winSceneReady} from '../game/winSpineRenderer';
 import type {BloodMoonReviewWindow} from '../game/review';
 import {setReviewFrameDriver} from '../game/frameScheduler';
 import {Ticker} from 'pixi.js';
 import {isLocalDemo,loadDemo} from '../game/demo';
 import EnableGameActor from './EnableGameActor.svelte';import ResumeBet from './ResumeBet.svelte';
 import BloodMoonScene from './BloodMoonScene.svelte';import Sound from './Sound.svelte';
 import Modals from './ui/Modals.svelte';import ReplayIntro from './ui/ReplayIntro.svelte';
 const context=getContext();let started=$state(false);
 let disposed=false,reviewCleanup=()=>{};
 onDestroy(()=>{disposed=true;reviewCleanup();});
 onMount(()=>{
  if(!isLocalDemo()||window.parent===window)return;
  const reviewWindow=window as BloodMoonReviewWindow;let oldResolution=1,active=false;
  const end=()=>{
   if(!active)return;active=false;setReviewFrameDriver(false);
   const app=context.stateApp.pixiApplication;
   if(app?.renderer){app.renderer.resolution=oldResolution;app.renderer.resize(window.innerWidth,window.innerHeight);app.ticker.start();}
  };
  const begin=()=>{
   const app=context.stateApp.pixiApplication;if(!app?.renderer||active)return false;active=true;oldResolution=app.renderer.resolution;
   app.ticker.stop();app.renderer.resolution=1;app.renderer.resize(window.innerWidth,window.innerHeight);
   let frames=0,updateMs=0,renderMs=0;app.canvas.dataset.reviewFrames='0';
   setReviewFrameDriver(true,async time=>{
    const before=performance.now();await tick();if(disposed||!active||!app.renderer)return;
    const updated=performance.now();Ticker.shared.update(time);app.ticker.update(time);
    updateMs+=updated-before;renderMs+=performance.now()-updated;
    app.canvas.dataset.reviewFrames=String(++frames);reviewWindow.bloodMoonReviewCaptureFrame?.();
    app.canvas.dataset.reviewUpdateMs=(updateMs/frames).toFixed(2);app.canvas.dataset.reviewRenderMs=(renderMs/frames).toFixed(2);
   });
   return true;
  };
  reviewWindow.bloodMoonReviewBegin=begin;reviewWindow.bloodMoonReviewEnd=end;
  return()=>{end();if(reviewWindow.bloodMoonReviewBegin===begin)delete reviewWindow.bloodMoonReviewBegin;if(reviewWindow.bloodMoonReviewEnd===end)delete reviewWindow.bloodMoonReviewEnd;};
 });
 // GoBoomana control behavior, with game-local Vampire chrome.
 if(typeof localStorage!=='undefined')localStorage.setItem('pixiPreference','webgl');
 context.eventEmitter.subscribeOnMount({buyBonusConfirm:()=>stateModal.modal={name:'buyBonusConfirm'},stopButtonClick:stopBloodMoon});
 onMount(async()=>{
  if(!isLocalDemo())return;
  const q=new URLSearchParams(window.location.search),d=await loadDemo(),preview=q.get('preview');
  if(disposed)return;
  if(preview==='free'){
   const b=d.scenarios.fg,n=b.events.findIndex(e=>e.type==='freeProgress');settleBloodMoon(b.events.slice(0,n+1));started=true;
  }else if(preview==='base')started=true;
  else if(preview==='win'){
   // Art review only: use a real reference event without placing a virtual bet.
   const rank=q.get('rank')??'epic';
   const candidates=Object.values(d.modes).flat().flatMap(book=>book.events.flatMap((event,index)=>event.type==='winInfo'&&winTier(event.payout)===rank?[{book,event,index}]:[]));
   const chosen=candidates.sort((a,b)=>b.event.payout-a.event.payout)[0];
   if(chosen){
    let reviewing=false;
    const prepare=async()=>{await winSceneReady;};
    const play=async()=>{
     if(reviewing||disposed)return;reviewing=true;
     try{await prepare();if(disposed)return;settleBloodMoon(chosen.book.events.slice(0,chosen.index));await tick();await playEvents([chosen.event]);}
     finally{reviewing=false;}
    };
    settleBloodMoon(chosen.book.events.slice(0,chosen.index));started=true;await tick();
    const reviewWindow=window as BloodMoonReviewWindow;
    if(window.parent!==window){reviewWindow.bloodMoonReviewWin=play;reviewWindow.bloodMoonReviewPrepare=prepare;reviewCleanup=()=>{if(reviewWindow.bloodMoonReviewWin===play)delete reviewWindow.bloodMoonReviewWin;if(reviewWindow.bloodMoonReviewPrepare===prepare)delete reviewWindow.bloodMoonReviewPrepare;};}
    if(q.get('autoplay')!=='false')await play();
   }
   else started=true;
  }
 });
</script>
<App><EnablePixiExtension/><BloodMoonScene/>
 {#if started}<EnableHotkey/><EnableGameActor/><ResumeBet/><Sound/>
  <UI>{#snippet gameName()}<UiGameName name="BLOOD MOON COUNT"/>{/snippet}{#snippet logo()}{/snippet}</UI>
 {/if}
</App>
{#if !started}<div class="welcome"><section><div class="moon"></div><p>THE HUNT BEGINS</p><h1>BLOOD MOON<br/><span>COUNT</span></h1><p>6 × 6 · 50 LINES · WILD HUNT</p><button onclick={()=>{started=true;stateBloodMoon.ready=true;}}>ENTER THE CASTLE</button>{#if isLocalDemo()}<small>LOCAL PREVIEW · VIRTUAL BALANCE</small>{/if}</section></div>{/if}
{#if stateReplay.waiting}<ReplayIntro onstart={()=>{stateReplay.waiting=false;stateReplay.startRequested=true;}}/>{/if}
<Modals>{#snippet version()}<span>Blood Moon · GoBoomana base · development</span>{/snippet}</Modals>
<style>
 .welcome{position:fixed;inset:0;z-index:10;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 20%,#41213a99,#051219ef);color:#d5b98a;text-align:center;font-family:Georgia,serif}section{padding:35px 70px;border:1px solid #85674777;background:#060c16c9;box-shadow:0 30px 100px #000b;min-width:290px}.moon{margin:0 auto 20px;width:76px;height:76px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff9c80,#9c1536 50%,#210512);box-shadow:0 0 50px #9c1536aa}h1{font-size:42px;letter-spacing:4px;line-height:1.1;margin:20px 0;color:#f1d6a8;text-shadow:0 3px 5px #000}h1 span{font-size:64px;color:#c43b4f}p{font:11px system-ui;letter-spacing:4px}button{margin:22px 0 12px;border:1px solid #c8a16a;background:linear-gradient(#631b34,#341522);color:#ffe7bc;padding:18px 26px;font:14px Georgia;letter-spacing:2px;cursor:pointer}button:hover{filter:brightness(1.35)}small{display:block;font:9px system-ui;letter-spacing:2px;color:#92a0a5}
 section{animation:castle-enter .7s ease-out both}.moon{animation:moon-breathe 6s ease-in-out infinite}
 button{transition:filter .16s,transform .16s,box-shadow .16s}button:hover{transform:translateY(-2px);box-shadow:0 8px 24px #ad244044}button:active{transform:translateY(0)}button:focus-visible{outline:2px solid #f5d59a;outline-offset:5px}
 @keyframes castle-enter{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
 @keyframes moon-breathe{0%,100%{box-shadow:0 0 38px #9c153666;transform:scale(1)}50%{box-shadow:0 0 64px #b42a54aa;transform:scale(1.035)}}
 @media(prefers-reduced-motion:reduce){section,.moon{animation:none}button{transition:none}}
</style>
