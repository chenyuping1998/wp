import {mount,tick} from 'svelte';
import InlineBetMenu from '../../src/components/ui/InlineBetMenu.svelte';
import {inlineBetAnchor} from '../../src/game/inlineBetAnchor.svelte';
import {stateModal,stateBet,stateConfig,debug} from './fixture.svelte';
inlineBetAnchor.measure=()=>document.querySelector('#anchor')!.getBoundingClientRect();
mount(InlineBetMenu,{target:document.querySelector('#app')!});
await document.fonts.ready;await new Promise(r=>setTimeout(r,450));await tick();
const report:any={passed:true,viewport:[innerWidth,innerHeight]};
try{
 const grid=document.querySelector<HTMLDivElement>('.bet-amount-grid')!,panel=document.querySelector<HTMLElement>('.bet-panel')!,buttons=[...grid.querySelectorAll<HTMLButtonElement>('button')];
 report.options=buttons.length;report.buttonHeight=buttons[0].getBoundingClientRect().height;report.scrollHeight=grid.scrollHeight;report.viewportHeight=grid.clientHeight;
 if(buttons.length!==60||report.buttonHeight<51.9||grid.scrollHeight<=grid.clientHeight)throw new Error('Options or touch/scroll sizing failed');
 grid.scrollTop=grid.scrollHeight;buttons.at(-1)!.click();await tick();
 if(stateBet.betAmount!==stateConfig.betAmountOptions.at(-1)||debug.changes!==1)throw new Error('Last amount not selected');
 report.lastAmountSelected=true;
 document.querySelector<HTMLButtonElement>('.bet-done')!.click();await tick();if(stateModal.modal!==null)throw new Error('Done did not close');
 stateModal.modal={name:'betAmountMenu'};await tick();await tick();
 if(document.querySelector<HTMLDivElement>('.bet-amount-grid')!.scrollTop<=0)throw new Error('Selected amount not restored into view');report.selectedAmountRestored=true;
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await tick();if(stateModal.modal!==null)throw new Error('Escape did not close');report.escapeClosed=true;
 stateBet.betAmount=1000000;stateModal.modal={name:'betAmountMenu'};await tick();await tick();
 const r=document.querySelector<HTMLElement>('.bet-panel')!.getBoundingClientRect();if(r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)throw new Error('Panel outside viewport');report.bounds=[r.left,r.top,r.width,r.height];
}catch(e){report.passed=false;report.error=String(e);}
document.body.dataset.qa=report.passed?'passed':'failed';document.querySelector('#qa-result')!.textContent=JSON.stringify(report);
