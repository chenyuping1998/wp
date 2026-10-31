import {stateUrlDerived} from 'state-shared';
import config from './config';
import assets from './assets';
import {socialTerms} from './socialTerms';
import {purrfiaText} from './purrfiaText';
export function createGameInfo(){
 const T=socialTerms(),zh=stateUrlDerived.lang()==='zh'&&!T.social,kind='purrfia' as string;
 const pick=(en:string,cn:string)=>zh?cn:en;
 const art=(name:string)=>(assets as Record<string,{src:string}>)[name]?.src??'';
 const labels={H1:['Goldfish bowl','金魚缸'],H2:['Salmon tin','鮭魚罐頭'],H3:['Yarn ball','毛線球'],H4:['Catnip plant','貓薄荷'],L1:['Spade paw','黑桃貓掌'],L2:['Heart paw','紅心貓掌'],L3:['Diamond paw','方塊貓掌'],L4:['Club paw','梅花貓掌']};
 const tiers=[5,6,9,13],tierLabels=['5','6–8','9–12','13+'];
 const entries=config.symbols as unknown as Record<string,{paytable:Record<string,number>[]|null}>;
 const symbols=Object.entries(labels).map(([name,label])=>({label:pick(label[0],label[1]),src:art('mg'+name),values:tiers.map(n=>entries[name]?.paytable?.find(p=>String(n) in p)?.[String(n)]??0)}));
 const sections=[{title:purrfiaText('clusterTitle'),body:purrfiaText('cluster')},{title:purrfiaText('boxesTitle'),body:purrfiaText('boxes')},{title:purrfiaText('territoryTitle'),body:purrfiaText('territory')},{title:purrfiaText('freeTitle'),body:purrfiaText('free')},{title:pick('Standard and Super entry','一般與超級入場'),body:pick('Standard entry starts 10 free rounds with normal stamps. Super entry starts 10 rounds with every cell already marked and stamps from ×5.','一般入場為 10 轉、使用一般印章。超級入場同為 10 轉，49 格開場已有記號，印章從 ×5 起。')}];
 const controls=[
  {mark:'↻',title:pick('Spin / Stop','開始／停止'),body:pick(`Starts a round at the current ${T.bet}. Space does the same. Stop brings falling symbols to rest sooner.`,'以目前金額開始一轉；空白鍵功能相同。轉動中按停止可加快圖案落定。')},
  {mark:'− +',title:pick('Amount controls','金額調整'),body:pick(`Each press steps one available level. Tap the ${T.bet} readout to open all available levels.`,'每按一次加減調整一級。點擊金額欄可直接選擇可用級距。')},
  {mark:'▶',title:pick('Auto Play','自動遊戲'),body:pick('Choose the round count and stopping conditions. Press again to stop the run early.','選擇遊戲次數與停止條件；再次按下可提前停止。')},
  {mark:'ϟ',title:pick('Turbo','快速模式'),body:pick('Cycles Normal, Turbo and Turbo 2. Feature results remain readable.','依序切換一般、快速及超快；重要功能結果仍保留閱讀時間。')},
  {mark:'✦',title:pick(T.buyBonusName,'功能入場'),body:pick(`Opens the feature menu. The entry multiple and total amount are shown before confirmation. Hidden during free spins.`,'開啟功能入場選單，確認前會顯示倍數與總金額。免費遊戲中隱藏此按鈕。')},
  {mark:'☰',title:pick('Menu','主選單'),body:pick('Opens the win table, game rules, sound switch and settings.','開啟賠率表、遊戲說明、聲音開關與設定。')},
  {mark:'i',title:pick('Info','遊戲說明'),body:pick('Opens these rules and the mode information.','顯示玩法、模式資訊與操作說明。')},
  {mark:'▦',title:pick(T.payTableLabel,'賠率表'),body:pick('Shows symbol values, required counts and special symbols.','查看各圖案的數量級距、倍數與特殊圖案用途。')},
  {mark:'♪',title:pick('Sound','聲音開關'),body:pick('Mutes and unmutes all game audio.','切換遊戲聲音的開啟與靜音。')},
  {mark:'⚙',title:pick('Settings','設定'),body:pick('Master, music and sound effects can be adjusted separately.','總音量、音樂與音效可分別調整。')}
 ];
 const modes=Object.entries(config.betModes).map(([key,mode])=>({label:key==='base'?pick('Base game','主遊戲'):key==='bonus'?pick('Free Spins','免費遊戲'):pick('Super Free Spins','超級免費遊戲'),entry:mode.cost,rtp:(mode.rtp*100).toFixed(2)+'%',max:mode.max_win.toLocaleString('en-US')}));
 return {kind,title:'PURRFIA',rulesLabel:pick('Game rules','遊戲說明'),tableLabel:T.social?'Win table':pick('Pay table','賠率表'),navLabel:pick('Game information','遊戲資訊'),closeLabel:pick('Close information','關閉資訊'),boardLabel:pick('Board','盤面'),board:'7 × 7',rtp:(config.rtp*100).toFixed(2)+'%',maxLabel:pick('Maximum result','最高結果'),matchTitle:pick('How matching symbols win','圖案如何得分'),matchRule:purrfiaText('cluster'),multipleNote:pick(`Values and maximum results are multiples of the base ${T.bet}. Feature entry multiples are shown separately.`, '圖案與最高結果均以基本金額的倍數表示；功能入場倍數另列。'),symbolLabel:pick('Symbol','圖案'),tiers,tierLabels,symbols,sections,specials:[{src:art('mgS'),title:pick('Family ring','家族戒指'),body:purrfiaText('free')},{src:art('mgM'),title:purrfiaText('boxesTitle'),body:purrfiaText('boxes')},{src:art('mgW'),title:purrfiaText('territoryTitle'),body:purrfiaText('territory')}],modes,modesLabel:pick('Game modes','遊戲模式'),modeLabel:pick('Mode','模式'),entryLabel:T.social?'Play for':pick('Entry multiple','入場倍數'),controls,controlsLabel:pick('Controls','操作說明')};
}
