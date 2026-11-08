import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/components/Sound.svelte'),'utf8');
const body=src.match(/const CN_SFX_FILES[^=]*=\s*\{([\s\S]*?)\n\s*\};/);
if(!body)throw new Error('CN_SFX_FILES not found');
const files=new Map([...body[1].matchAll(/(\w+):\s*'([^']+)'/g)].map(m=>[m[1],m[2]]));
for(const [name,file] of files)if(!fs.existsSync(path.join(root,'static/assets/audio',file)))throw new Error(`${name}: ${file} missing`);
for(const call of src.matchAll(/playCn(?:Sfx|Loop)\(\s*'([^']+)'/g))if(!files.has(call[1]))throw new Error(`unknown cue ${call[1]}`);
if(/jungle\/|reel_stop',\s*rate/.test(src))throw new Error('legacy audio reference');
for(let i=1;i<=5;i++)if(!files.has(`reel_stop_${i}`))throw new Error('five independent reel stops required');
const check=spawnSync(process.env.PYTHON??'python',[path.join(root,'design/verify_mummy_audio.py')],{encoding:'utf8'});
process.stdout.write(check.stdout??'');if(check.status!==0){process.stderr.write(check.stderr??'');process.exit(1);}
console.log(`check_audio: ${files.size} cues, provenance, mastering, loop seams and budget passed`);
