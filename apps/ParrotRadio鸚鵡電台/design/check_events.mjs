import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=JSON.parse(fs.readFileSync(path.join(app,'src/dev/devBooks.json'),'utf8'));
const handlers=fs.readFileSync(path.join(app,'src/game/bookEventHandlerMap.ts'),'utf8');
let books=0,events=0,encores=0,records=0;
const coverage=new Set();
for(const [name,pool] of Object.entries(fixtures))for(const book of pool){
 books++;let board=[],volume=1,free=false,encored=false,spin=0,post=0,final=0;
 for(const e of book.state){
  events++;coverage.add(e.type);
  assert(handlers.includes(`${e.type}:`),`No handler for ${e.type}`);
  if(e.type==='reveal'){board=structuredClone(e.board);assert.equal(board.length,6);assert(board.every(r=>r.length===7));free=e.gameType==='freegame';encored=false;spin=0;post=0;}
  if(e.type==='volumeStart'){assert(e.volume>=1&&e.volume<=20);volume=e.volume;}
  if(e.type==='encore'){
   encores++;assert(!encored);assert(spin>0);encored=true;
   if(free){volume=Math.min(volume+1,20);assert.equal(e.volume,volume);assert.equal(e.mult,volume);}else{assert.equal(e.volume,null);assert.equal(e.mult,1);}
   for(const p of e.positions){assert(p.reel>=0&&p.reel<6&&p.row>=1&&p.row<=5);assert.notEqual(board[p.reel][p.row].name,'S');assert.notEqual(board[p.reel][p.row].name,e.symbol);board[p.reel][p.row]={name:e.symbol};}
  }
  if(e.type==='winInfo'){
   spin+=e.totalWin;if(encored)post+=e.totalWin;
   for(const win of e.wins){assert.equal(win.meta.globalMult,free&&encored?volume:1);assert(win.positions.length>=8);for(const p of win.positions)assert.equal(board[p.reel][p.row].name,win.symbol);}
  }
  if(e.type==='tumbleBoard')for(let reel=0;reel<6;reel++){
   const rows=e.explodingSymbols.filter(p=>p.reel===reel).map(p=>p.row);if(!rows.length)continue;
   assert.equal(e.newSymbols[reel].length,rows.length);
   const survivors=board[reel].slice(0,-1).filter((_,row)=>!rows.includes(row));
   board[reel]=[...structuredClone(e.newSymbols[reel]),...survivors,board[reel][6]];assert.equal(board[reel].length,7);
  }
  if(e.type==='platinumRecord'){records++;assert.equal(e.applied,e.baseWin>0);if(e.applied)assert(Math.abs(e.totalWin-Math.min(e.baseWin*e.mult,1000000))<=e.mult+1);else assert.equal(e.totalWin,0);}
  if(e.type==='finalWin')final=e.amount;
 }
 assert(Math.abs(final-book.payoutMultiplier*100)<.001,`payout units ${name}`);
}
for(const type of ['encore','volumeStart','platinumRecord','freeSpinTrigger','freeSpinRetrigger','freeSpinEnd'])assert(coverage.has(type),`Missing fixture coverage ${type}`);
assert(encores>0&&records>0);
console.log(`Parrot real-book contract: ${books} books, ${events} events, ${encores} encores, ${records} platinum records; padded board replay, authoritative multipliers and payouts pass.`);
