import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=JSON.parse(fs.readFileSync(path.join(app,'src/dev/devBooks.json'),'utf8'));
for(const name of ['baseWin','baseNoWin','baseBoxes','baseTrigger','bonusPlain','superPlain'])assert(fixtures[name],`Missing real-book fixture ${name}`);
const handlers=fs.readFileSync(path.join(app,'src/game/bookEventHandlerMap.ts'),'utf8');
const eventTypes=new Set(Object.values(fixtures).flatMap(books=>books.flatMap(book=>book.state.map(e=>e.type))));
for(const type of eventTypes)assert(new RegExp('\\b'+type+'\\s*:').test(handlers),`Unhandled published event ${type}`);
let boxes=0,changes=0,sharedStamps=0;
for(const books of Object.values(fixtures))for(const book of books){
 let territory=Array.from({length:7},()=>Array(9).fill(0)),board=null;
 for(const e of book.state){
  if(e.type==='freeSpinTrigger'||e.type==='freeSpinEnd')territory=Array.from({length:7},()=>Array(9).fill(0));
  if(e.type==='reveal'){if(e.gameType==='basegame')territory=Array.from({length:7},()=>Array(9).fill(0));board=structuredClone(e.board);assert.equal(board.length,7);assert(board.every(c=>c.length===9));}
  if(e.type==='boxOpen'){
   boxes++;assert(board);for(const b of e.boxes){assert.equal(board[b.reel][b.row].name,'M');board[b.reel][b.row]={name:e.symbol,multiplier:b.multiplier};assert(b.row>=1&&b.row<=7);}
   assert(e.symbol!=='S');
  }
  if(e.type==='winInfo'){
   const stampUse=new Map();for(const win of e.wins){
    assert(win.positions.length>=5);let cell=0,stamp=0;
    for(const p of win.positions){assert(p.row>=1&&p.row<=7);const mult=territory[p.reel][p.row];if(mult>=2)cell+=mult;const s=board[p.reel][p.row];if(s.name==='W'){stamp+=s.multiplier;const key=p.reel+':'+p.row;stampUse.set(key,(stampUse.get(key)??0)+1);}else assert.equal(s.name,win.symbol);}
    assert.equal(win.meta.cellMult,cell);assert.equal(win.meta.stampMult,stamp);assert.equal(win.meta.clusterMult,Math.max(1,cell+stamp));
   }sharedStamps+=[...stampUse.values()].filter(n=>n>1).length;
  }
  if(e.type==='cellMults'){changes+=e.cells.length;for(const c of e.cells){assert([1,2,4,8,16,32,64,128].includes(c.mult));territory[c.reel][c.row]=c.mult;}}
  if(e.type==='tumbleBoard')board=board.map((col,r)=>{
   const removed=new Set(e.explodingSymbols.filter(p=>p.reel===r).map(p=>p.row));if(!removed.size)return col;
   const surviving=col.slice(0,8).filter((_,row)=>!removed.has(row));return [...e.newSymbols[r],...surviving,col[8]];
  });
 }
}
assert(boxes>0&&changes>0);assert(fixtures.superPlain[0].state.some(e=>e.type==='cellMults'&&e.cells.length===49&&e.cells.every(c=>c.mult===1)));
assert(handlers.includes('territoryBeforeReveal'));assert(handlers.includes('replayTerritory(events)'));
console.log(`Purrfia event contract passed: ${Object.keys(fixtures).length} real fixtures, ${eventTypes.size} event types, ${boxes} box openings, ${changes} territory changes, ${sharedStamps} shared stamp groups.`);
