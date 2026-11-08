/** Offline QA copy: real published books, intercepted RGS calls, no live wallet. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=path.join(app,'build'),out=path.join(app,'build-replaytest');
if(path.dirname(out)!==app)throw new Error('QA destination escaped app');
const books=JSON.parse(fs.readFileSync(path.join(app,'design/source/volt_delivery/qa_data.json'),'utf8'));
// This Windows Node build crashes in recursive cpSync; use the installed Python copier.
execFileSync('python',['-c','import shutil,sys; shutil.copytree(sys.argv[1],sys.argv[2],dirs_exist_ok=True)',build,out],{stdio:'inherit'});
fs.writeFileSync(path.join(out,'volt-qa-data.json'),JSON.stringify(books));
const hook=`(()=>{
 const nativeFetch=window.fetch.bind(window),data=nativeFetch('./volt-qa-data.json').then(r=>r.json());
 localStorage.setItem('pixiPreference','webgl');
 window.__VOLT_QA_REQUESTS__=[];window.__VOLT_QA_ERRORS__=[];
 addEventListener('error',e=>window.__VOLT_QA_ERRORS__.push(e.message));
 addEventListener('unhandledrejection',e=>window.__VOLT_QA_ERRORS__.push(String(e.reason)));
 // QA-only DOM telemetry, so browser checks can inspect actual canvas state.
 const moved=new Set(),seen=new Set(),seenTexts=new Set(),previous=new WeakMap();
 setInterval(()=>{
  const app=window.__PIXI_APP__,nodes=[],texts=[];
  function visit(n){
   if(!n)return;
   if(n.label?.startsWith('Volt ')||n.label?.startsWith('meshWin ')){
    const state=[n.rotation,n.x,n.y,n.scale?.x,n.scale?.y,n.alpha];
    const last=previous.get(n);if(last&&state.some((v,i)=>Math.abs((v||0)-(last[i]||0))>.00001))moved.add(n.label);
    previous.set(n,state);seen.add(n.label);nodes.push({label:n.label,rotation:n.rotation,alpha:n.alpha});
   }
   if(typeof n.text==='string'&&(n.worldAlpha??n.groupAlpha??n.alpha??0)>.05){texts.push(n.text);seenTexts.add(n.text);}
   for(const child of n.children||[])visit(child);
  }
  visit(app?.stage);
  let output=document.getElementById('volt-qa-status');
  if(!output&&document.body){output=document.createElement('output');output.id='volt-qa-status';output.hidden=true;document.body.append(output);}
  if(output)output.textContent=JSON.stringify({seen:[...seen],moving:[...moved],nodes,texts,seenTexts:[...seenTexts],errors:window.__VOLT_QA_ERRORS__,requests:window.__VOLT_QA_REQUESTS__.map(r=>r.path)});
 },300);
 window.fetch=async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(url.hostname!=='mock.local')return nativeFetch(input,init);
  const all=await data,params=new URLSearchParams(location.search),body=JSON.parse(init?.body||'{}');
  window.__VOLT_QA_REQUESTS__.push({path:url.pathname,body});
  const mode=(body.mode||params.get('mode')||'base').toLowerCase(),list=all[mode]||all.base;
  const index=Number(params.get('event')||0),amount=Number(body.amount||params.get('amount')||1000000);
  let book=list[index%list.length];
  if(params.get('case')==='tesla4'){
   // Explicit visual fixture for all four tiers; this never changes published books.
   book=structuredClone(all.base[3]);book.id='synthetic-tesla4';book.payoutMultiplier=300000;
   for(const event of book.events){
    if(event.type==='rouletteInfo')Object.assign(event,{multiplier:3000,level:4,path:['UP','UP','UP',3000],amount:300000});
    else if(event.type==='setWin'||event.type==='finalWin'||event.type==='setTotalWin'&&event.amount>0)event.amount=300000;
   }
  }
  const balance={amount:100000000000,currency:'USD'};
  let result;
  if(url.pathname.includes('/bet/replay/'))result={id:book.id,payoutMultiplier:book.payoutMultiplier/100,payout:book.payoutMultiplier*amount/100,state:book.events};
  else if(url.pathname==='/wallet/authenticate')result={balance,config:{minBet:100000,maxBet:100000000,stepBet:100000,defaultBetLevel:1000000,betLevels:[100000,200000,500000,1000000,2000000,5000000,10000000,20000000,50000000,100000000],jurisdiction:{}},round:null};
  else if(url.pathname==='/wallet/play')result={balance,round:{id:'volt-qa-'+book.id,betID:'volt-qa-'+book.id,amount,active:true,mode,payout:amount*book.payoutMultiplier/100,payoutMultiplier:book.payoutMultiplier,state:book.events}};
  else if(['/wallet/end-round','/bet/event'].includes(url.pathname))result={balance};
  else throw new Error('Unhandled local QA request '+url.pathname);
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
 };
})();`;
fs.writeFileSync(path.join(out,'volt-qa-hook.js'),hook);
const index=path.join(out,'index.html'),html=fs.readFileSync(index,'utf8');
fs.writeFileSync(index,html.replace('<head>','<head><script src="./volt-qa-hook.js"></script>'));
console.log(JSON.stringify({out,modes:Object.fromEntries(Object.entries(books).map(([k,v])=>[k,v.length]))},null,2));
