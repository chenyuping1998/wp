import {mount,tick}from'svelte';
import 'virtual:mummy-modal-skin.css';
import InlineBetMenu from '../../src/components/ui/InlineBetMenu.svelte';
import ModalBuyBonusConfirm from '../../src/components/ui/ModalBuyBonusConfirm.svelte';
import {inlineBetAnchor}from'../../src/game/inlineBetAnchor.svelte';
import {stateBet,stateBonus,stateModal,stateUi,debug}from'./fixture.svelte';
inlineBetAnchor.measure=()=>document.querySelector('#anchor')!.getBoundingClientRect();
mount(InlineBetMenu,{target:document.querySelector('#app')!});mount(ModalBuyBonusConfirm,{target:document.querySelector('#app')!});
await document.fonts.ready;await new Promise(r=>setTimeout(r,500));await tick();
const report:any={passed:true,viewport:[innerWidth,innerHeight],skin:document.documentElement.dataset.uiSkin,realBetsSent:false};
try{
 const selected=document.querySelector<HTMLButtonElement>('.bet-amount-grid button.selected')!,style=getComputedStyle(selected);
 report.selected={color:style.color,background:style.backgroundColor};
 if(style.color!=='rgb(10, 8, 4)'||style.backgroundColor!=='rgb(236, 194, 84)')throw Error('Selected contrast regressed under full modal skin');
 selected.click();await tick();if(stateBet.betAmount!==100000)throw Error('Selected value wrong');
 const r=document.querySelector<HTMLElement>('.bet-panel')!.getBoundingClientRect();report.betBounds=[r.x,r.y,r.width,r.height];
 stateModal.modal={name:'buyBonusConfirm'};await tick();document.querySelector<HTMLButtonElement>('.confirm-submit')!.click();await tick();
 if(debug.bets!==1||stateBet.activeBetModeKey!=='BONUS'||stateModal.modal!==null)throw Error('Mock buy dispatch mismatch');report.mockBuy=true;
 stateBonus.selectedBetModeKey='SCARAB5';stateModal.modal={name:'buyBonusConfirm'};await tick();document.querySelector<HTMLButtonElement>('.confirm-submit')!.click();await tick();
 if(debug.bets!==1||stateBet.activeBetModeKey!=='SCARAB5'||stateUi.autoSpinsLossLimitText!=='∞'||stateUi.autoSpinsSingleWinLimitText!=='∞')throw Error('Activation mismatch');report.mockActivation=true;
 stateBet.balanceAmount=1;stateBonus.selectedBetModeKey='BONUS';stateModal.modal={name:'buyBonusConfirm'};await tick();document.querySelector<HTMLButtonElement>('.confirm-submit')!.click();await tick();
 if(debug.bets!==1||stateBet.activeBetModeKey!=='SCARAB5'||stateModal.modal?.name!=='message')throw Error('Insufficient balance guard failed');report.mockBalanceGuard=true;
 stateBet.balanceAmount=100000000;stateBet.activeBetModeKey='BASE';stateModal.modal={name:'buyBonusConfirm'};await tick();
 document.querySelector<HTMLButtonElement>('.confirm-back')!.click();await tick();if(stateModal.modal?.name!=='buyBonus')throw Error('Back failed');report.backReturnsToMenu=true;
 stateModal.modal={name:'betAmountMenu'};await tick();
}catch(e){report.passed=false;report.error=String(e);}
document.querySelector('#qa-result')!.textContent=JSON.stringify(report);document.body.dataset.qa=report.passed?'passed':'failed';
document.querySelector('#show-bet')!.addEventListener('click',()=>stateModal.modal={name:'betAmountMenu'});
document.querySelector('#show-confirm')!.addEventListener('click',()=>{stateBonus.selectedBetModeKey='BONUS';stateModal.modal={name:'buyBonusConfirm'};});
