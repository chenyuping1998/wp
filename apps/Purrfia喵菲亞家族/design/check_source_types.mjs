// App-source diagnostics are required even though Vite does not type-check.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workspace=path.resolve(app,'../..');
const packages=path.join(workspace,'node_modules/.pnpm');
const checker=fs.readdirSync(packages).find(name=>name.startsWith('svelte-check@'));
if(!checker)throw Error('svelte-check is missing from the workspace');
const result=spawnSync(process.execPath,[path.join(packages,checker,'node_modules/svelte-check/bin/svelte-check'),'--workspace',app,'--output','machine'],{cwd:app,encoding:'utf8',maxBuffer:10*1024*1024});
const output=(result.stdout??'')+(result.stderr??'');
if(!output.includes('COMPLETED')){console.error(output);process.exit(1);}
const own=output.split('\n').filter(line=>/ ERROR "src[\\/]/.test(line));
const baseline=output.split('\n').filter(line=>/ ERROR "/.test(line)&&!/ ERROR "src[\\/]/.test(line));
console.log('Source type check: '+own.length+' app errors; '+baseline.length+' shared dependency diagnostics.');
if(own.length){console.error(own.join('\n'));process.exit(1);}
