// @ts-nocheck -- Node-only build driver, not frontend code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const logfile=path.resolve(app,'../../../tmp/medusa-background-v2-build-20261025.log');
const commands=JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8')).scripts.build.split(' && ');
let log='',code=0;
for(const command of commands){const args=command.split(' ');if(args.shift()==='vite')args.unshift(path.join(app,'node_modules/vite/bin/vite.js'));
  const result=spawnSync(process.execPath,args,{cwd:app,encoding:'utf8',env:process.env,maxBuffer:16*1024*1024});
  log+=`\n${command}\n${result.stdout||''}${result.stderr||''}`;console.log(`${result.status===0?'PASS':'FAIL'} ${command}`);
  if(result.status!==0){code=result.status||1;break;}}
fs.mkdirSync(path.dirname(logfile),{recursive:true});fs.writeFileSync(logfile,log);console.log(`Build exit ${code}; log ${logfile}`);process.exitCode=code;
