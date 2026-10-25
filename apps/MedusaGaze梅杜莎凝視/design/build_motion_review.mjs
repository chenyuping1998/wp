// @ts-nocheck -- executable Node-only export tool, outside frontend type checking.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { planCascadeColumn } from '../src/game/symbolMotion.ts';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(app, 'design/source/medusagaze/motion'); fs.mkdirSync(out, { recursive: true });
const generated = '// @ts-nocheck\n// Generated browser review module; types are checked in the original app TypeScript.\n';
fs.writeFileSync(path.join(out, 'symbolMotion.js'), generated + stripTypeScriptTypes(fs.readFileSync(path.join(app, 'src/game/symbolMotion.ts'), 'utf8')));
fs.writeFileSync(path.join(out, 'animationTimeline.js'), generated + stripTypeScriptTypes(fs.readFileSync(path.join(app, 'src/game/animationTimeline.ts'), 'utf8')));
const books = JSON.parse(fs.readFileSync(path.join(app, 'src/dev/devBooks.json'), 'utf8'));
let best = [];
for (const [category, entries] of Object.entries(books)) for (const book of entries) {
  let board, chain = [], wins;
  const save = () => { if (chain.length > best.length) best = chain; };
  for (const event of book.state) {
    if (event.type === 'reveal') { save(); chain = []; board = structuredClone(event.board); }
    if (event.type === 'winInfo') wins = event.wins;
    if (event.type !== 'tumbleBoard') continue;
    const before = structuredClone(board), moves = [];
    for (let reel = 0; reel < 6; reel++) {
      const removed = event.explodingSymbols.filter(p => p.reel === reel).map(p => p.row);
      const plan = planCascadeColumn(board[reel], removed, event.newSymbols[reel]);
      board[reel] = plan.column; moves.push(...plan.moves.map(move => ({ ...move, reel })));
    }
    chain.push({ category, bookId: book.id, before, after: structuredClone(board), moves, wins, removed: event.explodingSymbols });
  }
  save();
}
const review = { description: 'Published math book cascade with app-shared motion curves and approved-style production symbols. Offline preview only.', steps: best.slice(0, 8) };
fs.writeFileSync(path.join(out, 'scenario.js'), 'export default ' + JSON.stringify(review) + ';\n');
console.log(`Motion review rebuilt: ${review.steps.length} consecutive real cascade links; ${review.steps[0]?.category}/${review.steps[0]?.bookId}.`);
