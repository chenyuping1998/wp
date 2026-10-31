import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(app,'src/game/assets.ts'),'utf8');
const keys=new Set([...source.matchAll(/\b(\w+)\s*:\s*\{\s*type:/g)].map(m=>m[1]));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(svelte|ts)$/.test(e.name)?[path.join(dir,e.name)]:[]);
let references=0;
for(const file of walk(path.join(app,'src/components'))){const s=fs.readFileSync(file,'utf8');for(const m of s.matchAll(/<Sprite\b[^>]*?\bkey\s*=\s*"([^"{}]+)"/g)){assert(keys.has(m[1]),`${path.relative(app,file)} missing ${m[1]}`);references++;}}
const theme=fs.readFileSync(path.join(app,'src/game/uiTheme.ts'),'utf8');for(const m of theme.matchAll(/:\s*'((?:mg|art_|castAtlas)[A-Za-z0-9_]+)'/g)){assert(keys.has(m[1]),`UI theme missing ${m[1]}`);references++;}
const parts=JSON.parse(fs.readFileSync(path.join(app,'src/game/symbolParts.json'),'utf8'));for(const list of Object.values(parts))for(const item of list)assert(keys.has('part_'+item[0]),`Missing part ${item[0]}`);
const pages=JSON.parse(fs.readFileSync(path.join(app,'src/game/characterRigPages.json'),'utf8'));for(let i=0;i<pages.length;i++)assert(keys.has('castAtlas'+i));
if(app.includes('Purrfia'))for(const n of [2,3,5,10,25,50,100])assert(keys.has('art_stamp_x'+n));
else for(const key of ['knob_base','knob_cap','knob_led','platinum_disc','platinum_label_t1','platinum_label_t2','platinum_label_t3','platinum_label_t4'])assert(keys.has('art_'+key));
console.log(`Presentation assets: ${keys.size} registered, ${references} literal/theme references and all computed symbol/character/mechanic families resolve.`);
