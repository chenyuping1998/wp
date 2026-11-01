// Literal Sprite key guard; dynamic symbol keys are checked separately below.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const registry = fs.readFileSync(path.join(root, 'src/game/assets.ts'), 'utf8');
const keys = new Set([...registry.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]));
const errors = [];
const walk = (dir) => {
 for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) walk(file);
  else if (entry.name.endsWith('.svelte')) {
   const text = fs.readFileSync(file, 'utf8');
   for (const match of text.matchAll(/\bkey="([A-Za-z][A-Za-z0-9_]*)"/g)) {
    if (!keys.has(match[1])) errors.push(`${path.relative(root, file)}: unknown asset ${match[1]}`);
   }
  }
 }
};
walk(path.join(root, 'src'));
const constants = fs.readFileSync(path.join(root, 'src/game/constants.ts'), 'utf8');
for (const match of constants.matchAll(/(?:assetKey:\s*|mixedSymbol\()['"]([^'"]+)['"]/g)) {
 if (!keys.has(match[1])) errors.push(`constants.ts: unknown dynamic symbol asset ${match[1]}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: literal sprite keys and dynamic symbol keys exist (${keys.size} registered assets)`);
