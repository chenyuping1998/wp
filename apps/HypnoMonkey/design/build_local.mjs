// @ts-nocheck -- local orchestration of the exact package.json build sequence.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const log='E:/stake/tmp/medusa-completion-final-build-20261025.log';
const script=JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8')).scripts.build;
fs.writeFileSync(log,'Medusa Gaze / full local build / Node '+process.version+'\n');
for(const command of script.split(' && ')){
 const parts=command.trim().split(/\s+/);const args=parts[0]==='node'?parts.slice(1):parts[0]==='vite'?['node_modules/vite/bin/vite.js',...parts.slice(1)]:null;
 if(!args)throw Error('Unexpected build command '+command);
 const result=spawnSync(process.execPath,args,{cwd:app,encoding:'utf8',env:{...process.env,NODE_OPTIONS:'--experimental-strip-types'},maxBuffer:20*1024*1024});
 fs.appendFileSync(log,'\n'+command+'\n'+result.stdout+result.stderr+'\nExit: '+result.status+'\n');
 console.log(command+' → '+result.status);if(result.status!==0){console.error((result.stdout+result.stderr).slice(-5000));process.exit(result.status??1);}
}
console.log('PASS / '+log);
