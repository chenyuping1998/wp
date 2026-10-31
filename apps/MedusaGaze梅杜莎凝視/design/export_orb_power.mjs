// @ts-nocheck -- shared runtime mix exported for deterministic offline audition.
import fs from 'node:fs';
import {orbPower} from '../src/game/orbPower.ts';
import {orbSoundVoices} from '../src/game/castingSoundDesign.ts';
const values=[2,3,5,8,10,15,25,50,100,250,500];
const report={version:10,values:values.map(value=>({value,...orbPower(value),sounds:Object.fromEntries(['charge','release','fly','hit','collision'].map(cue=>[cue,orbSoundVoices(cue,value)]))}))};
fs.writeFileSync(new URL('./source/medusagaze/audio/ORB_POWER_V10_MIX.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('Exported eleven power profiles and production audio mixes.');
