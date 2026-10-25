import assetsArt from './assets';
import type {BetModeData} from 'state-shared';import {stateUrlDerived} from 'state-shared';import config from './config';
const pick=(normal:string,social:string)=>stateUrlDerived.social()?social:normal;
const assets={icon:'',volatility:'',button:'',dialogImage:'',dialogVolatility:''};
const mode=(key:'base'|'bonus'|'super'):BetModeData=>({mode:key.toUpperCase(),costMultiplier:config.betModes[key].cost,type:key==='base'?'default':'buy',parent:'',children:'',maxWin:config.betModes[key].max_win,assets:{...assets,dialogImage:key==='super'?assetsArt.cardSuper.src:assetsArt.cardBonus.src},text:{
get title(){return key==='base'?'BASE':key==='super'?'SUPER FREE SPINS':'FREE SPINS';},
get dialog(){return pick(`Enter 12 free spins for ${config.betModes[key].cost}× your bet. Volume starts at ×${key==='super'?6:1}; each encore raises it by 1, to ×20. Only wins after encore use volume. Platinum records multiply one spin only. RTP 96.00%. Maximum win 10,000× your bet.`,`Enter 12 free spins for ${config.betModes[key].cost}× your amount. Volume starts at ×${key==='super'?6:1}; each encore raises it by 1, to ×20. Only wins after encore use volume. Platinum records multiply one spin only. RTP 96.00%. Maximum win 10,000× your amount.`);},
get description(){return `12 FREE SPINS · VOLUME STARTS AT ×${key==='super'?6:1}`;},get button(){return pick(`BUY ${config.betModes[key].cost}×`,`PLAY ${config.betModes[key].cost}×`);},get tickerIdle(){return pick('PLACE YOUR BET','READY TO PLAY');},tickerSpin:'GOOD LUCK',bannerText:'',betAmountLabel:''}});
export const PARROT_RADIO_BET_MODE_META:Record<string,BetModeData>={BASE:mode('base'),BONUS:mode('bonus'),SUPER:mode('super')};
