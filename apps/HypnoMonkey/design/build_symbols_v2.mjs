// @ts-nocheck -- executable Node build driver, outside frontend type checking.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logfile = path.resolve(app, '../../../tmp/medusa-symbols-v2-build-20261024.log');
const commands = process.argv.includes('--vite-only') ? ['vite build'] : JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).scripts.build.split(' && ');
let output = '', code = 0;
for (const command of commands) {
  const args = command.split(' ');
  if (args.shift() === 'vite') args.unshift(path.resolve(app, 'node_modules/vite/bin/vite.js'));
  const result = spawnSync(process.execPath, args, { cwd: app, encoding: 'utf8', env: process.env, maxBuffer: 16 * 1024 * 1024 });
  output += `\n${command}\n${result.stdout || ''}${result.stderr || ''}`;
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${command}`);
  if (result.status !== 0) { code = result.status || 1; break; }
}
fs.mkdirSync(path.dirname(logfile), { recursive: true });
fs.writeFileSync(logfile, output);
console.log(`Build exit ${code}; full log ${logfile}`);
process.exitCode = code;
