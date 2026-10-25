import {stateUrlDerived} from 'state-shared';
const strings={placeBet:['PLACE YOUR BET','請下注'],comePlay:['COME AND PLAY','快來玩'],goodLuck:['GOOD LUCK!','祝好運！'],encoreTip:['PLAY THE TOP SYMBOL AGAIN','最賺的圖案再放一次'],volumeTip:['MORE ENCORES, MORE VOLUME','安可越多越大聲']} as const;
export const barText=(key:keyof typeof strings)=>strings[key][stateUrlDerived.lang()==='zh'?1:0];
