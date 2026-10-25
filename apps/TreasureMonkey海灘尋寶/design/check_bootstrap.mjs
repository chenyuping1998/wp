// The game's own math is authoritative; identity, rules and RTP must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readConfig = (folder) => {
 const source = fs.readFileSync(path.join(folder, 'src/game/config.ts'), 'utf8');
 return JSON.parse(source.slice(source.indexOf('export default ') + 15).replace(/\s+as const;?\s*$/, ''));
};
const config = readConfig(root);
assert.equal(config.gameID, 'TreasureMonkey');
assert.equal(config.gameName, 'TreasureMonkey');
assert.equal(config.numReels, 5);
assert.deepEqual(config.numRows, [4, 4, 4, 4, 4]);
assert.equal(Object.keys(config.paylines).length, 14);
assert.deepEqual(Object.values(config.betModes).map(mode => mode.cost), [1, 100, 500, 1000]);
assert.equal(config.betModes.base.max_win, 20000);
assert.ok(config.symbols.SW);
assert.ok(!config.symbols.C && !config.symbols.P);
const rules = JSON.parse(fs.readFileSync(path.join(root, 'math/rules.json'), 'utf8'));
assert.equal(config.rtp, rules.rtp);
assert.equal(config.rtp, .96);
assert.deepEqual(config.paylines, rules.paylines, 'Paylines must match the independent math');
assert.deepEqual(config.symbols, rules.symbols, 'Displayed paytable must match the math');
for (const [name, mode] of Object.entries(config.betModes)) {
 assert.equal(mode.rtp, .96, `${name} must target 96%`);
 assert.equal(mode.cost, rules.modes[name].cost);
 assert.equal(mode.max_win, rules.maxWin);
 assert.equal(mode.buyBonus, name !== 'base');
}
assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name, 'treasure-monkey');
assert.equal(fs.realpathSync(path.join(root, '../TreasureMonkey')), fs.realpathSync(root));
console.log('OK: TreasureMonkey independent math contract; 5×4 / 14 lines / 100,500,1000x buys; all four modes at 96%');
