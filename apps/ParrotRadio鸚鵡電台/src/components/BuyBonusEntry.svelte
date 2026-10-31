<script lang="ts">
 import {stateBet,stateBetDerived,stateModal,stateReplay,stateUi} from 'state-shared';
 import {getContext} from '../game/context';
 import {i18nDerived} from '../i18n/i18nDerived';
 const props:{art:string;kind:'purrfia'|'parrot'}=$props();
 const context=getContext();
 const active=$derived(stateBetDerived.activeBetMode()?.type==='activate');
 const label=$derived(active?i18nDerived.disable():i18nDerived.buyBonus());
 const visible=$derived(!context.stateLayout.showLoadingScreen&&context.stateGame.gameType!=='freegame'&&!stateReplay.enabled&&!stateUi.menuOpen&&stateModal.modal===null);
 const open=()=>{context.eventEmitter.broadcast({type:'soundPressGeneral'});if(active)stateBet.activeBetModeKey='BASE';else stateModal.modal={name:'buyBonus'};};
</script>
{#if visible}
 <button class="bonus-entry {props.kind}" data-testid="buy-bonus" aria-label={label} disabled={!context.stateXstateDerived.isIdle()} onclick={open}>
  <span class="art" aria-hidden="true"><img src={props.art} alt=""/></span>
  <span class="caption">{label}</span>
 </button>
{/if}
<style>
 .bonus-entry{position:fixed;z-index:20;left:clamp(12px,4.4vw,90px);top:38%;width:160px;padding:0;border:0;background:transparent;color:#fff6dc;cursor:pointer;filter:drop-shadow(0 4px 5px #0008);font-family:'Segoe UI','Microsoft JhengHei',Arial,sans-serif;touch-action:manipulation}
 .art{display:block;position:relative;height:126px;overflow:hidden}.art img{position:absolute;width:290px;height:290px;max-width:none;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}
 .caption{display:flex;align-items:center;justify-content:center;min-height:44px;padding:5px 10px;border:2px solid #ebc574;border-radius:10px;background:linear-gradient(#49301c,#251a17);font-size:21px;font-weight:750;line-height:1.15;text-align:center;box-shadow:inset 0 1px #fff5;text-shadow:0 1px 2px #000}
 .parrot .caption{background:linear-gradient(#125365,#0a2f41)}
 .bonus-entry:enabled:hover .caption{background:#765129}.parrot:enabled:hover .caption{background:#176779}
 .bonus-entry:focus-visible{outline:3px solid white;outline-offset:5px;border-radius:12px}.bonus-entry:active{transform:translateY(2px)}
 .bonus-entry:disabled{cursor:default;filter:grayscale(.55) drop-shadow(0 3px 4px #0006);opacity:.65}
 @media(orientation:portrait){.bonus-entry{top:16px;left:12px;right:auto;width:112px}.art{display:none}.caption{min-height:58px;padding:5px 8px;font-size:18px;line-height:1.22}}
 @media(orientation:landscape) and (max-height:500px){.bonus-entry{left:10px;top:39%;width:112px}.art{height:76px}.art img{width:190px;height:190px}.caption{font-size:16px;min-height:36px}}
 @media(prefers-reduced-motion:reduce){.bonus-entry:active{transform:none}}
</style>
