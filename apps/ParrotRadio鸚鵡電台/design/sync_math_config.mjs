import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {mathGameDir} from '../../../tools/math_game_dir.mjs';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const math=mathGameDir('ParrotRadio');
const config=JSON.parse(fs.readFileSync(path.join(math,'library/configs/config_fe_ParrotRadio.json'),'utf8'));
if(config.gameID!=='ParrotRadio'||config.numReels!==6||config.numRows.some(n=>n!==5))throw Error('Parrot board configuration mismatch');
config.symbols=Object.assign({},...config.symbols);
if(Object.keys(config.symbols).sort().join(',')!==['H1','H2','H3','H4','L1','L2','L3','L4','S'].sort().join(','))throw Error('Unexpected math symbols');
config.freeSpins={trigger:4,spins:12,retrigger:3,retriggerSpins:5};config.volume={start:1,superStart:6,cap:20};config.platinum={baseValues:[2,3,5,10,25,50,100],freeValues:[2,3,5,10,25,50,100,250,500]};
fs.writeFileSync(path.join(app,'src/game/config.ts'),'// Generated from existing ParrotRadio math.\nexport default '+JSON.stringify(config)+';\n');console.log('Parrot math synced: 6x5, 9 symbols, modes '+Object.keys(config.betModes).join('/'));
