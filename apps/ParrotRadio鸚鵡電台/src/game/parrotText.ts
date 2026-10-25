import {stateUrlDerived} from 'state-shared';
const strings={
 clusterTitle:['SCATTER ANYWHERE','任意位置得分'],cluster:['8+ matching symbols anywhere win. Winning symbols disappear and new symbols drop in.','任意位置 8 個相同圖案得分，得分圖案消除後補入新圖案。'],
 encoreTitle:['ONE MORE TIME','再來一首'],encoreRule:['ENCORE flips more tiles into the highest contributing symbol, once per winning round.','安可每個得分回合最多一次，將其他格子翻成得分最高的圖案。'],
 freeTitle:['TURN IT UP','音量全開'],featureRule:['Free rounds build volume up to ×20. Platinum records multiply one round only.','免費遊戲的安可累積音量，最高 ×20。白金唱片只乘本回合。'],
 
 intro:['8+ matching symbols anywhere win. ENCORE replays the top symbol. Free rounds build volume; platinum records multiply one round.','任意位置 8 個相同圖案得分。安可再放本轉最賺的圖案；免費遊戲累積音量，白金唱片只乘本轉。'],
 encore:['ENCORE!','安可！'],volume:['VOLUME','音量'],record:['PLATINUM','白金唱片'],miss:['TRY NEXT TIME','下次再來'],
 freeTip:['More encores, more volume','安可越多越大聲'],feature:['FREE SPINS','免費遊戲'],super:['SUPER FREE SPINS','超級免費遊戲']
} as const;
export const parrotText=(key:keyof typeof strings)=>strings[key][stateUrlDerived.lang()==='zh'?1:0];
