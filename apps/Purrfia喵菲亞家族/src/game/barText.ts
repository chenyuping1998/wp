import {stateUrlDerived} from 'state-shared';
const text={placeBet:['PLACE YOUR BET','請下注'],comePlay:['READY TO PLAY','準備開始'],goodLuck:['GOOD LUCK','祝好運'],boxTip:['BOXES OPEN TOGETHER','紙箱一起開'],multipliersAddUp:['GROW YOUR TERRITORY','地盤倍數持續累積']} as const;
export const barText=(key:keyof typeof text)=>text[key][stateUrlDerived.lang()==='zh'?1:0];

