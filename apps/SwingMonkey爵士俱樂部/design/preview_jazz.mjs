// Offline visual QA only. Mock responses and controls never enter build/.
import { createServer } from 'node:http';
import { existsSync, readFileSync, createReadStream, statSync } from 'node:fs';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(app, 'build');
const mockData = resolve(app, '../../../tmp/artqa_swing_20261013/stub-data.js');
if (!existsSync(mockData)) throw new Error('Local QA mock books missing: ' + mockData);
const controls = `
window.__jazzErrors = [];
addEventListener('error', e => window.__jazzErrors.push(e.message));
addEventListener('unhandledrejection', e => window.__jazzErrors.push(String(e.reason)));
addEventListener('DOMContentLoaded', () => {
 if(new URLSearchParams(location.search).has('hideQA')) return;
 const original=structuredClone(window.__STUB_DATA__.BASE.books['0']);
 const panel = document.createElement('div');
 panel.style.cssText='position:fixed;left:8px;top:38px;z-index:99999;background:#f3e9d2e8;color:#161412;padding:6px;font:12px sans-serif;display:flex;flex-wrap:wrap;max-width:calc(100vw - 30px);gap:5px;align-items:center;border:1px solid #8c6a4a';
 const title=document.createElement('span');title.textContent='LOCAL MOTION QA';panel.append(title);
 for(const name of ['H1','H2','H3','H4','W','S','Super','Band']) {
  const button=document.createElement('button');button.textContent=name;
  button.onclick=()=>{
   const book=window.__STUB_DATA__.BASE.books['0'];
   const symbol=name==='Super'?'H1':name;
   const band=name==='Band';
   const amount=name==='Super'?5000:band?400:100;
   const board=Array.from({length:5},()=>(band?['L1','H1','H2','H3','H4','L2']:['L1',symbol,'L2',symbol,'L3','L2']).map(n=>({name:n})));
   const positions=Array.from({length:5},(_,reel)=>[1,3].map(row=>({reel,row}))).flat();
   book.events=[{index:0,type:'reveal',board,paddingPositions:[0,0,0,0,0],gameType:'basegame',anticipation:[0,0,0,0,0]},
    {index:1,type:'winInfo',totalWin:amount,wins:band?['H1','H2','H3','H4'].map((s,row)=>({symbol:s,kind:5,win:100,positions:Array.from({length:5},(_,reel)=>({reel,row:row+1})),meta:{ways:1,globalMult:1,winWithoutMult:100,symbolMult:0}})):[{symbol,kind:5,win:amount,positions,meta:{ways:1,globalMult:1,winWithoutMult:amount,symbolMult:0}}]},
    {index:2,type:'setWin',amount,winLevel:name==='Super'?7:1},{index:3,type:'setTotalWin',amount}];
   book.payoutMultiplier=amount;window.__stub.force('0');title.textContent='NEXT: '+name;
  };panel.append(button);
 }
 const feature=document.createElement('button');feature.textContent='Feature';feature.onclick=()=>{window.__STUB_DATA__.BASE.books['0']=structuredClone(original);window.__stub.force('0');title.textContent='NEXT: FEATURE';};panel.append(feature);
 const status=document.createElement('span');panel.append(status);document.body.append(panel);
 let start=performance.now(),frames=0;
 function frame(t){frames++;if(t-start>1000){status.textContent=(document.hidden?'background':Math.round(frames*1000/(t-start))+' fps')+' · errors '+window.__jazzErrors.length;status.title=window.__jazzErrors.join(' / ');start=t;frames=0;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
});`;
const mime = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp3':'audio/mpeg', '.wav':'audio/wav' };
createServer((req,res)=>{
	const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
	if(pathname==='/jazz-qa.js'){res.setHeader('Content-Type','text/javascript');res.end(controls);return;}
	let file=pathname==='/stub-data.js'?mockData:pathname==='/stub.js'?join(app,'design/playtest_stub.js'):resolve(build,'.'+pathname);
	if(![mockData,join(app,'design/playtest_stub.js')].includes(file)&&file!==build&&!file.startsWith(build+'\\')){res.writeHead(403).end();return;}
	if(!existsSync(file)||!statSync(file).isFile()) file=join(build,'index.html');
	res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');
	res.setHeader('Cache-Control','no-store');
	if(file===join(build,'index.html'))res.end(readFileSync(file,'utf8').replace('</head>','<script src="/stub-data.js"></script><script src="/stub.js"></script><script src="/jazz-qa.js"></script></head>'));
	else createReadStream(file).pipe(res);
}).listen(4199,'127.0.0.1',()=>console.log('Jazz motion QA: http://127.0.0.1:4199/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en'));
