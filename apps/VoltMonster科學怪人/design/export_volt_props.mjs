import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {VOLT_PROPS} from '../src/game/voltBackground.ts';
const target=fileURLToPath(new URL('./source/volt_delivery/backgrounds/objects.json',import.meta.url));
fs.mkdirSync(fileURLToPath(new URL('./source/volt_delivery/backgrounds/',import.meta.url)),{recursive:true});
fs.writeFileSync(target,JSON.stringify(VOLT_PROPS,null,2)+'\n');
console.log('Exported scene placements and pivots');
