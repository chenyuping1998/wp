import assetsArt from './assets';
import type {BetModeData} from 'state-shared';
import {stateUrlDerived} from 'state-shared';
import config from './config';
import {purrfiaText} from './purrfiaText';
const emptyAssets={icon:'',volatility:'',button:'',dialogImage:'',dialogVolatility:''};
const pick=(normal:string,social:string)=>stateUrlDerived.social()?social:normal;
const mode=(key:'base'|'bonus'|'super'):BetModeData=>({
 mode:key.toUpperCase(),costMultiplier:config.betModes[key].cost,type:key==='base'?'default':'buy',parent:'',children:'',maxWin:config.betModes[key].max_win,assets:{...emptyAssets,dialogImage:key==='super'?assetsArt.cardSuper.src:assetsArt.cardBonus.src},
 text:{get title(){return key==='base'?'PURRFIA':key==='super'?(stateUrlDerived.lang()==='zh'?'超級免費遊戲':'SUPER FREE SPINS'):(stateUrlDerived.lang()==='zh'?'免費遊戲':'FREE SPINS');},
 get dialog(){return key==='base'?'':purrfiaText(key==='super'?'super':'bonus')+' '+config.betModes[key].cost+'× '+pick('bet','amount')+'. '+purrfiaText('max');},
 get description(){return key==='base'?'':purrfiaText(key==='super'?'super':'bonus');},
 get button(){return key==='base'?'':pick('BUY '+config.betModes[key].cost+'×','PLAY '+config.betModes[key].cost+'×');},
 betAmountLabel:'',get tickerIdle(){return pick('PLACE YOUR BET','READY TO PLAY');},tickerSpin:'GOOD LUCK',bannerText:''}
});
export const PURRFIA_BET_MODE_META:Record<string,BetModeData>={BASE:mode('base'),BONUS:mode('bonus'),SUPER:mode('super')};

