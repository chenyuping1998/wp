import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const alias=path.join(app,'../TreasureMonkey');
if(!fs.existsSync(alias)) fs.symlinkSync(app,alias,'junction');
if(fs.realpathSync(alias)!==fs.realpathSync(app)) throw new Error('TreasureMonkey alias points to a different app');
if(!fs.existsSync(path.join(app,'.env'))) fs.copyFileSync(path.join(app,'.env.example'),path.join(app,'.env'));
console.log('TreasureMonkey local alias and environment ready');
