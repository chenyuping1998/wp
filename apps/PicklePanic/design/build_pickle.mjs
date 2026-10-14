import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const env={...process.env,GEN_TOOLS:process.env.GEN_TOOLS||'/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node',PATH:process.cwd()+'/node_modules/.bin:/usr/local/bin:'+process.env.PATH};
const r=spawnSync('/bin/sh',['-c',pkg.scripts.build],{stdio:'inherit',env});
process.exit(r.status??1);
