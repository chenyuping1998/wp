<script lang="ts">
 import { App, Container } from 'pixi-svelte';
 import { UI, UiGameName } from 'components-ui-pixi';
 import Modals from '../../components/ui/Modals.svelte';
 import '../../game/uiTheme';
 import '../../game/infoV2.css';
 import { MainContainer } from 'components-layout';
 import { stateBet, stateModal } from 'state-shared';
 import { getContext } from '../../game/context';
 import { INITIAL_BOARD, HOLD_AND_SPIN_MODE_KEY } from '../../game/constants';
 import config from '../../game/config';
 import type { RawSymbol } from '../../game/types';
 import Background from '../../components/Background.svelte';
 import Board from '../../components/Board.svelte';
 import BoardFrame from '../../components/BoardFrame.svelte';
 import ReelAccent from '../../components/ReelAccent.svelte';
 import PresentationDirector from '../../components/PresentationDirector.svelte';
 import Sound from '../../components/Sound.svelte';
 const context=getContext();
 let busy=$state(false), enabled=$state(false), error=$state(''), cycles=$state(0);
 const ready=$derived(!!context.stateApp.loadedAssets?.gbBgBase);
 const scene=(kind:'base'|'feature'|'vault')=>{
  if(busy)return;
  stateBet.activeBetModeKey=kind==='vault'?HOLD_AND_SPIN_MODE_KEY:'BASE';
  context.stateGame.gameType=kind==='feature'?'freegame':kind==='vault'?'superspin':'basegame';
  context.eventEmitter.broadcast({type:'soundMusic',name:kind==='base'?'bgm_main':'bgm_freespin'});
 };
 const spin=async(turbo=false)=>{
  if(busy||!ready)return; busy=true;error='';stateBet.isTurbo=turbo;
  context.eventEmitter.broadcast({type:'soundPressBet'});
  const strips=config.paddingReels.basegame as unknown as RawSymbol[][];
  const board=INITIAL_BOARD.map((reel,i)=>reel.map((_,j)=>({...strips[i][(cycles*7+j+i*3)%strips[i].length]})));
  try { await context.stateGameDerived.enhancedBoard.spin({revealEvent:{index:0,type:'reveal',board,anticipation:[0,0,0,0,0]},paddingBoard:strips});cycles++; }
  catch(e){error=String(e);} finally {busy=false;}
 };
 const feature=()=>{context.eventEmitter.broadcast({type:'soundBladeHit',finale:true});};
 const roll=()=>context.eventEmitter.broadcast({type:'soundLoop',name:'sfx_bigwin_coinloop'});
 const stop=()=>context.eventEmitter.broadcast({type:'soundStop',name:'sfx_bigwin_coinloop'});
</script>
{#if import.meta.env.DEV}
 <App>
  <PresentationDirector />
  <Background />
  <MainContainer><BoardFrame /><Board /><ReelAccent /></MainContainer>
  <Container eventMode="none"><UI>{#snippet gameName()}<UiGameName name="GO BANANINJA"/>{/snippet}{#snippet logo()}{/snippet}</UI></Container>
  {#if enabled}<Sound />{/if}
 </App>
 <Modals>{#snippet version()}UI / Audio V2{/snippet}</Modals>
 <nav aria-label="本機表現預覽">
  <strong>忍者｜轉輪、音效、背景預覽</strong>
  <button disabled={!ready||busy} onclick={()=>spin()}>一般旋轉</button>
  <button disabled={!ready||busy} onclick={()=>spin(true)}>快速旋轉</button>
  <button disabled={busy} onclick={()=>scene('base')}>主場景</button>
  <button disabled={busy} onclick={()=>scene('feature')}>免費遊戲</button>
  <button disabled={busy} onclick={()=>scene('vault')}>金庫</button>
  <button onclick={()=>enabled=!enabled}>{enabled?'關閉音效':'開啟音效'}</button>
  <button disabled={!ready} onclick={feature}>刀斬重擊</button>
  <button onclick={roll}>跑分開始</button><button onclick={stop}>結束／跳過</button>
  <button onclick={()=>stateModal.modal={name:'gameRules'}}>Info</button><button onclick={()=>stateModal.modal={name:'payTable'}}>Symbol values</button>
  <output>{error||(!ready?'載入素材中…':busy?'旋轉中…':`已完成 ${cycles} 次旋轉`)}</output>
 </nav>
{/if}
<style>
 :global(body){margin:0;background:#0a1119;font-family:system-ui,sans-serif}
 nav{position:fixed;top:10px;left:10px;right:10px;display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:12px;background:#0a1119e8;color:#e4eef6;border:1px solid #355467;border-radius:10px;z-index:100}
 button{background:#21394c;color:#e7f5ff;border:1px solid #587487;border-radius:6px;padding:8px 11px;cursor:pointer}
 button:disabled{opacity:.4;cursor:default} output{font-size:12px;color:#b2d6cf}
</style>
