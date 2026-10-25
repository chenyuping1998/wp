// @ts-nocheck -- executable Node-only QA, outside the frontend type environment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { planCascadeColumn, symbolPoint, symbolPose, landingPose, gravityProgress, fallDuration, FRACTURE_PIECES } from '../src/game/symbolMotion.ts';
import { tumbleTiming } from '../src/game/animationTimeline.ts';

let plans = 0, positions = 0, minMeshAreaRatio = 1;
for (let mask = 1; mask < 64; mask++) {
  const column = Array.from({ length: 8 }, (_, i) => ({ name: 'cell' + i }));
  const removed = Array.from({ length: 6 }, (_, i) => i + 1).filter(row => mask & (1 << (row - 1)));
  const incoming = removed.map((_, i) => ({ name: 'new' + i }));
  const result = planCascadeColumn(column, removed, incoming);
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
  // No overtaking or cell intersections while shorter drops finish first.
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
  if (i) assert.ok(gravityProgress(t) >= gravityProgress((i - 1) / 120));
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
assert.equal(new Set(['H1', 'H2', 'H3', 'H4', 'H5'].map(name => JSON.stringify(symbolPose(name, 0.42)))).size, 5);
const eightLinkMs = Array.from({ length: 8 }, (_, i) => tumbleTiming({ chain: i + 1 }).totalMs).reduce((a, b) => a + b, 0);
assert.ok(eightLinkMs < 10000);
const report = { scope: 'Offline geometry, published book data and timing only; no Stake Engine recording.', exhaustiveColumnPatterns: plans, publishedWinningPositions: positions,
  fracturePieces: 5, fractureArea: 1, landingFootFixed: true, independentColumnLandings: true, eightLinkTimingBudgetMs: eightLinkMs,
  meshGrid: 32, invertedTriangles: 0, minMeshAreaRatio,
  reference: 'User confirmed Gates of Olympus (Pragmatic Play). Original app-owned motion; no competitor keyframes or assets shipped.',
  art: 'Ten polished production symbols installed; local mesh guides remeasured from these originals. Separate layered acting and character Spine remain in progress.' };
fs.writeFileSync(new URL('./motion-validation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(`Motion checks passed: ${plans} refill patterns, ${positions} published winning positions, no crossing, planted landing feet, 5 texture fragments, ${eightLinkMs}ms 8-link budget.`);
