// @ts-nocheck -- executable Node-only QA, outside the frontend type environment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { planCascadeColumn, symbolPoint, symbolPose, winHopPose, landingPose, gravityProgress, fallDuration, FRACTURE_PIECES, fragmentPose, stoneFront } from '../src/game/symbolMotion.ts';
import { tumbleTiming } from '../src/game/animationTimeline.ts';
import { winningAccentPose, scoreArrivalScale, stoneChipPose, impactMotePose,selectLandingContacts,landingAccentPose,impactWavePose,winFocusPose } from '../src/game/presentationMotion.ts';

let plans = 0, positions = 0, minMeshAreaRatio = 1;
assert.deepEqual(winHopPose(0),{y:0,sx:1,sy:1});
assert.deepEqual(winHopPose(1),{y:0,sx:1,sy:1},'Symbol returns to contact before stone onset');
assert.ok(winHopPose(.089,'H1').sy<1&&winHopPose(.289,'H1').y<-.05,'Compression must precede the reduced whole-icon hop');
for (let mask = 1; mask < 64; mask++) {
  const column = Array.from({ length: 8 }, (_, i) => ({ name: 'cell' + i }));
  const removed = Array.from({ length: 6 }, (_, i) => i + 1).filter(row => mask & (1 << (row - 1)));
  const incoming = removed.map((_, i) => ({ name: 'new' + i }));
  const result = planCascadeColumn(column, removed, incoming);
  const contacts=selectLandingContacts(result.moves);
  assert.ok(contacts.length>=1&&contacts.length<=2);
  assert.equal(new Set(contacts.map(c=>c.slot)).size,contacts.length);
  for(const contact of contacts)assert.ok(result.moves.some(m=>m.to===contact.slot&&m.to-m.from===contact.distance&&m.from<m.to),'Landing accents must belong to an actual moving symbol');
  assert.equal(result.column.length, 8);
  assert.deepEqual(result.column[0], incoming[0]);
  assert.deepEqual(result.column[7], column[7]);
  const slots = result.moves.map(move => move.to).sort((a, b) => a - b);
  assert.deepEqual(slots, [1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(result.moves.map(move => move.carrier)).size, 6);
  for (const move of result.moves) {
    assert.deepEqual(move.rawSymbol, result.column[move.to]);
    assert.ok(move.from <= move.to);
    assert.ok(fallDuration(move.to - move.from, 252) <= 252);
  }
  // Shared progress, including rebounds, is a convex combination of ordered endpoints. No overtaking.
  for (let frame = 0; frame <= 90; frame++) {
    const elapsed = frame / 90 * 252;
    const ys = result.moves.map(move => {
      const duration = fallDuration(move.to - move.from, 252);
      return { from: move.from, y: duration ? move.from + (move.to - move.from) * gravityProgress(elapsed / duration) : move.to };
    }).sort((a, b) => a.from - b.from);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i].y - ys[i - 1].y >= 0.9999, 'Falling symbols must not cross');
  }
  plans++;
}
const books = JSON.parse(fs.readFileSync(new URL('../src/dev/devBooks.json', import.meta.url), 'utf8'));
for (const entries of Object.values(books)) for (const book of entries) {
  let board;
  for (const event of book.state) {
    if (event.type === 'reveal') board = structuredClone(event.board);
    if (event.type === 'winInfo') for (const win of event.wins) for (const pos of win.positions) {
      assert.equal(board[pos.reel][pos.row].name, win.symbol, `Published win mismatch in book ${book.id}`); positions++;
    }
    if (event.type !== 'tumbleBoard') continue;
    for (let reel = 0; reel < board.length; reel++) {
      const removed = event.explodingSymbols.filter(p => p.reel === reel).map(p => p.row);
      assert.ok(removed.every(row => board[reel][row].name !== 'S'));
      board[reel] = planCascadeColumn(board[reel], removed, event.newSymbols[reel]).column;
    }
  }
}
for (let i = 0; i <= 120; i++) {
  const t = i / 120, land = landingPose(t, 1.25);
  assert.ok(Math.abs(land.y + land.sy / 2 - 0.5) < 1e-10, 'Landing foot must stay fixed');
  assert.ok(gravityProgress(t)>=0&&gravityProgress(t)<=1,'A rebound must not overshoot the target row');
  for (const name of ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S']) {
    const grid = 32, mesh = [];
    for (let y = 0; y <= grid; y++) for (let x = 0; x <= grid; x++) {
      const p = symbolPoint(name, x / grid, y / grid, t); assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); mesh.push(p);
    }
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) {
      const i = y * (grid + 1) + x;
      for (const [a, b, c] of [[mesh[i], mesh[i+1], mesh[i+grid+1]], [mesh[i+1], mesh[i+grid+2], mesh[i+grid+1]]]) {
        const ratio = ((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))*grid*grid;
        assert.ok(ratio > 0, `${name} mesh folds at ${t}`); minMeshAreaRatio = Math.min(minMeshAreaRatio, ratio);
      }
    }
  }
}
const area = points => Math.abs(points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - p[1] * q[0]; }, 0)) / 2;
assert.ok(Math.abs(FRACTURE_PIECES.reduce((sum, points) => sum + area(points), 0) - 1) < 1e-10, 'Fracture must preserve the full original texture at frame zero');
assert.ok(FRACTURE_PIECES.every(points=>points.length>=4),'Stone fractures need irregular cells, not radial triangle wedges');
for(const points of FRACTURE_PIECES){
 const fan=points.slice(1,-1).reduce((sum,p,i)=>sum+area([points[0],p,points[i+2]]),0);
 assert.ok(Math.abs(fan-area(points))<1e-10,'Convex shard fan must cover its painted polygon exactly');
}
for(let y=0;y<41;y++)for(let x=0;x<41;x++){
 const p=[(x+.371)/41-.5,(y+.619)/41-.5];
 const covering=FRACTURE_PIECES.filter(points=>points.every((a,i)=>{const b=points[(i+1)%points.length];return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])>=-1e-12;}));
 assert.equal(covering.length,1,'Every painted point must belong to exactly one stone cell');
}
for(let i=0;i<8;i++){
 const p=fragmentPose(i,.07,11);assert.equal(Math.hypot(p.x,p.y),0);assert.equal(p.scale,1);assert.equal(p.alpha,1);
 assert.ok(Math.hypot(fragmentPose(i,.3,11).x,fragmentPose(i,.3,11).y)>.01);
}
assert.deepEqual(winFocusPose(0),{shade:0,readout:1});
assert.deepEqual(winFocusPose(810),{shade:0,readout:0});
assert.equal(winFocusPose(300).shade,1);
for (const name of ['H1','H2','H3','H4','H5','L1']) {
  assert.deepEqual(winHopPose(0,name),{y:0,sx:1,sy:1}); assert.deepEqual(winHopPose(1,name),{y:0,sx:1,sy:1});
}
assert.ok(winHopPose(.57,'H2').y > winHopPose(.57,'H5').y, 'Heavier artwork must have a lower hop');
for (let i=0;i<=100;i++) {
  assert.ok(stoneFront(i/100,0)<-.5 && stoneFront(i/100,1)>.5,'Petrification must leave no partial stone at either endpoint');
  FRACTURE_PIECES.forEach((_,index)=>{const p=fragmentPose(index,i/100,11); assert.ok(Object.values(p).every(Number.isFinite)); assert.ok(p.sx>=.49 && p.alpha>=0 && p.alpha<=1);});
}
assert.equal(new Set(['H1', 'H2', 'H3', 'H4', 'H5'].map(name => JSON.stringify(symbolPose(name, 0.42)))).size, 5);
const eightLinkMs = Array.from({ length: 8 }, (_, i) => tumbleTiming({ chain: i + 1 }).totalMs).reduce((a, b) => a + b, 0);
assert.ok(eightLinkMs < 10000);
assert.equal(winningAccentPose(0).alpha,0);
assert.equal(winningAccentPose(810).alpha,0,'Winning accents must end before the crumble');
assert.equal(gravityProgress(.6),1);assert.ok(gravityProgress(.725)<.96);assert.equal(gravityProgress(.85),1);assert.ok(gravityProgress(.925)<.99);assert.equal(gravityProgress(1),1);
assert.equal(fallDuration(1,360),fallDuration(6,360),'All falling distances share the same contact clock');
assert.equal(scoreArrivalScale(0),1); assert.equal(scoreArrivalScale(1000),1);
assert.deepEqual(selectLandingContacts([{from:2,to:2},{from:0,to:0}]),[]);
assert.equal(landingAccentPose(0).alpha,0);assert.equal(landingAccentPose(1).alpha,0);
assert.equal(impactWavePose(0).alpha,0);assert.ok(impactWavePose(.56).alpha<1e-10);
assert.equal(impactMotePose(0,0).alpha,0);assert.ok(impactMotePose(0,.56).alpha<1e-10);
for(let i=0;i<=100;i++)for(let chip=0;chip<6;chip++){
  const p=stoneChipPose(chip,i/100,23);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);
  if(i===0||i===100)assert.equal(p.alpha,0,'Debris must not persist beyond the owning crumble');
}
const report = { scope: 'Offline geometry, published book data and timing only; no Stake Engine recording.', exhaustiveColumnPatterns: plans, publishedWinningPositions: positions,
  fracturePieces: FRACTURE_PIECES.length, fractureArea: 1, irregularConvexStoneCells:true,partitionCoverageSamples:1681,fractureContactHoldFraction:.08,softWinFocus:true,directionalStone:true, materialSpecificHop:true, winSequence:'Reduced root hop, delayed local chains, depth look, advancing stone front, retained cracks, impact hold, irregular stone cells, shared two-rebound drop', winHopHeightFraction:.0682, landingFootFixed: true, coordinatedColumnLandings: true, eightLinkTimingBudgetMs: eightLinkMs,
  meshGrid: 32, invertedTriangles: 0, minMeshAreaRatio, transientWinAccents:true, stoneDebrisChips:6,
  reference: 'User confirmed Gates of Olympus (Pragmatic Play). Original app-owned motion; no competitor keyframes or assets shipped.',
  art: 'Ten polished production symbols installed; local mesh guides remeasured from these originals. Layered character and Spine 4.3 are integrated and verified by check_medusa43.mjs.' };
fs.writeFileSync(new URL('./motion-validation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(`Motion checks passed: ${plans} refill patterns, ${positions} published winning positions, no crossing, planted landing feet, ${FRACTURE_PIECES.length} texture fragments, ${eightLinkMs}ms 8-link budget.`);
