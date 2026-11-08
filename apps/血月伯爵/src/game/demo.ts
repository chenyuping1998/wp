import {stateBet} from 'state-shared';
import type {Book} from './bloodmoonTypes';
export const isLocalDemo = () => {
  if(typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  return !q.has('sessionID') && !q.has('rgs_url') && q.get('replay') !== 'true';
};
type Data = {modes:Record<string,Book[]>;scenarios:Record<string,Book>;costs:Record<string,number>};
let data:Data;
let credit = 0;
export async function loadDemo() {
  if(!data) {
    const response = await fetch(`${import.meta.env.BASE_URL}data/demo-books.json`);
    if(!response.ok) throw Error('Reference books could not be loaded');
    data = await response.json();
  }
  return data;
}
export async function demoPlay(options:{mode:string;amount:number;currency:string}) {
  const d=await loadDemo(); const mode=options.mode.toLowerCase();
  const list=d.modes[mode]; if(!list?.length) throw Error(`No books for ${mode}`);
  const scenario=new URLSearchParams(window.location.search).get('scenario');
  const book=(mode==='base'&&scenario==='bigwin'?list.reduce((best,book)=>book.payoutMultiplier>best.payoutMultiplier?book:best):null)
   ||(mode==='base' && scenario && d.scenarios[scenario]) || list[crypto.getRandomValues(new Uint32Array(1))[0] % list.length];
  const debit=options.amount*d.costs[mode];
  if(stateBet.balanceAmount<debit) throw Error('Insufficient virtual balance');
  credit=options.amount*book.payoutMultiplier/100;
  return {balance:{amount:Math.round((stateBet.balanceAmount-debit)*1e6),currency:options.currency},round:{betID:book.id,amount:Math.round(options.amount*1e6),payout:Math.round(credit*1e6),payoutMultiplier:book.payoutMultiplier/100,active:credit>0,mode:options.mode,event:'0',state:structuredClone(book.events)}};
}
export async function demoEnd() {
  const value=credit; credit=0;
  return {balance:{amount:Math.round((stateBet.balanceAmount+value)*1e6),currency:stateBet.currency}};
}
