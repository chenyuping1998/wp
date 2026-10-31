import {stateUrlDerived} from 'state-shared';
import config from './config';
import assets from './assets';
import {socialTerms} from './socialTerms';

export function createGameInfo(){
 const T=socialTerms(),zh=stateUrlDerived.lang()==='zh'&&!T.social,kind='parrot' as string;
 const pick=(en:string,cn:string)=>zh?cn:en;
 const art=(name:string)=>(assets as Record<string,{src:string}>)[name]?.src??'';
 const labels={H1:['Gold record','金色黑膠唱片'],H2:['Headphone hat','耳機三角帽'],H3:['Spyglass','望遠鏡'],H4:['Coconut','椰子'],L1:['Eighth note','八分音符'],L2:['Quarter note','四分音符'],L3:['Treble clef','高音譜號'],L4:['Rest','休止符']};
 const tiers=[8,10,12],tierLabels=['8–9','10–11','12+'];
 const entries=config.symbols as unknown as Record<string,{paytable:Record<string,number>[]|null}>;
 const symbols=Object.entries(labels).map(([name,label])=>({label:pick(label[0],label[1]),src:art('mg'+name),values:tiers.map(n=>entries[name]?.paytable?.find(p=>String(n) in p)?.[String(n)]??0)}));
 const sections=[{title:pick('Matching symbols and tumbles','圖案與連消'),body:pick('The board has 6 columns and 5 rows. Eight or more matching symbols anywhere form a win. Winners leave, remaining symbols drop, and the board refills until no more wins remain.','6×5 盤面，任意位置 8 個以上相同圖案得分。收走得分圖案、上方掉落並補位，直到沒有新的得分。')},{title:pick('ENCORE','安可'),body:pick('A winning base round has a 25% chance of one encore. Every winning free round has one encore. The highest contributing symbol is selected, indicated non-microphone tiles turn into it, and tumbles continue. There is at most one encore per round.','有得分的主遊戲有 25% 機率安可；免費遊戲有得分就一定安可。本轉貢獻最多的圖案會被選中，指定的非麥克風格子翻成該圖案後繼續連消，每轉最多一次。')},{title:pick('Free rounds and volume','免費遊戲與音量'),body:pick('4+ microphones award 12 free rounds; 3+ during the feature add 5. Volume starts at ×1, or ×6 in Super, and each encore raises it by 1 up to ×20. Only wins after the encore use volume.','4 支以上麥克風獲得 12 轉；免費遊戲中 3 支以上再加 5 轉。音量一般從 ×1、超級從 ×6 起，每次安可加 1，最高 ×20。只有安可之後的得分乘音量。')},{title:pick('Platinum record','白金唱片'),body:pick('A platinum record can appear after all tumbles. It multiplies the whole current round only if that round has a win, including its encore results. It never accumulates across rounds. Values reach ×100 in base play and ×500 in free rounds.','白金唱片可在所有連消結束後出現，只在本轉有得分時乘整轉結果，包含安可得分。倍數不跨轉累積，主遊戲最高 ×100、免費遊戲最高 ×500。')}];
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
 return {kind,title:'PARROT RADIO',rulesLabel:pick('Game rules','遊戲說明'),tableLabel:T.social?'Win table':pick('Pay table','賠率表'),navLabel:pick('Game information','遊戲資訊'),closeLabel:pick('Close information','關閉資訊'),boardLabel:pick('Board','盤面'),board:'6 × 5',rtp:(config.rtp*100).toFixed(2)+'%',maxLabel:pick('Maximum result','最高結果'),matchTitle:pick('How matching symbols win','圖案如何得分'),matchRule:pick('Eight or more matching symbols anywhere form a win. Adjacency is not required. Winners leave and new symbols tumble in.', '任意位置 8 個以上相同圖案即可得分，不必相鄰。得分圖案收走後掉落並補位。'),multipleNote:pick(`Values and maximum results are multiples of the base ${T.bet}. Feature entry multiples are shown separately.`, '圖案與最高結果均以基本金額的倍數表示；功能入場倍數另列。'),symbolLabel:pick('Symbol','圖案'),tiers,tierLabels,symbols,sections,specials:[{src:art('mgS'),title:pick('Microphone','麥克風'),body:pick('4+ microphones award 12 free rounds; 3+ in the feature add 5. Microphones have no separate symbol award.','4 支以上獲得 12 轉，免費遊戲中 3 支以上再加 5 轉。麥克風本身不另付圖案得分。')},{src:art('art_platinum_disc'),title:pick('Platinum record','白金唱片'),body:pick('Multiplies the current whole round when there is a win. It does not carry into the next round.','本轉有得分時乘整轉結果，不帶到下一轉。')}],modes,modesLabel:pick('Game modes','遊戲模式'),modeLabel:pick('Mode','模式'),entryLabel:T.social?'Play for':pick('Entry multiple','入場倍數'),controls,controlsLabel:pick('Controls','操作說明')};
}
