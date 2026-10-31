from pathlib import Path
import shutil
ROOT=Path('E:/stake/wp');TOOLS=ROOT/'tools'
DATA='''import {stateUrlDerived} from 'state-shared';
import config from './config';
import assets from './assets';
import {socialTerms} from './socialTerms';
TEXT_IMPORT
export function createGameInfo(){
 const T=socialTerms(),zh=stateUrlDerived.lang()==='zh'&&!T.social,kind='KIND' as string;
 const pick=(en:string,cn:string)=>zh?cn:en;
 const art=(name:string)=>(assets as Record<string,{src:string}>)[name]?.src??'';
 const labels=LABELS;
 const tiers=TIERS,tierLabels=TIER_LABELS;
 const entries=config.symbols as unknown as Record<string,{paytable:Record<string,number>[]|null}>;
 const symbols=Object.entries(labels).map(([name,label])=>({label:pick(label[0],label[1]),src:art('mg'+name),values:tiers.map(n=>entries[name]?.paytable?.find(p=>String(n) in p)?.[String(n)]??0)}));
 const sections=SECTIONS;
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
 return {kind,title:'TITLE',rulesLabel:pick('Game rules','遊戲說明'),tableLabel:T.social?'Win table':pick('Pay table','賠率表'),navLabel:pick('Game information','遊戲資訊'),closeLabel:pick('Close information','關閉資訊'),boardLabel:pick('Board','盤面'),board:'BOARD',rtp:(config.rtp*100).toFixed(2)+'%',maxLabel:pick('Maximum result','最高結果'),matchTitle:pick('How matching symbols win','圖案如何得分'),matchRule:MATCH_RULE,multipleNote:pick(`Values and maximum results are multiples of the base ${T.bet}. Feature entry multiples are shown separately.`, '圖案與最高結果均以基本金額的倍數表示；功能入場倍數另列。'),symbolLabel:pick('Symbol','圖案'),tiers,tierLabels,symbols,sections,specials:SPECIALS,modes,modesLabel:pick('Game modes','遊戲模式'),modeLabel:pick('Mode','模式'),entryLabel:T.social?'Play for':pick('Entry multiple','入場倍數'),controls,controlsLabel:pick('Controls','操作說明')};
}
'''
THEME='''import {GAME_FONT,GAME_FONT_WEIGHT} from './fonts';
import {setUiTheme} from 'components-ui-pixi';
import {stateConfig} from 'state-shared';
// The Medusa console proportions, with this title's own quiet palette.
setUiTheme({
 fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,
 barStyle:'framed',barHeight:210,barFrameBottom:18,barFill:BAR,barAlpha:1,panelFill:PANEL,panelBorder:0x171b24,
 buttonFill:PANEL,buttonFillLight:0xe5bd69,buttonFillDisabled:0x343c46,buttonFillActive:0x8c672d,buttonBorder:0xb99756,buttonBorderWidth:2,buttonBorderWidthActive:3,buttonIconFill:0xfff4d9,buttonIconStroke:0xfff4d9,turboKeylineColor:PANEL,
 turboButtonScale:1.16,turboIconScale:.58,railButtonScale:1.10,spinScale:.88,betFill:PANEL,betBorder:0xd7b96f,
 labelFill:0xe5dcc9,balanceLabelFill:0xe5dcc9,winAccent:{border:0xd7b96f,label:0xffdc8a},betAccent:{border:0x171b24,label:0xe5dcc9},valueFill:0xfffaf0,valueStroke:0x171b24,valueShadow:0x11151b,
 readoutScale:.82,readoutOffsetY:-4,barMessageFill:0xd8d1c4,barMessageScale:.50,barMessageStroke:0x171b24,valuePop:.12,winFlashTint:0xffedbe,
 betBarLayout:'compactBottom',barSpriteSlice:96,activeByIconOnly:['turbo'],turboTiers:2,stepButtonScale:.46,stepButtonGap:28,stepperLayout:'flank',portraitSideButtonX:400,portraitStepButtonScale:.68,
 buyBonusOnRail:false,buyBonusButtonScale:.9,buyBonusPlateScale:1.08,buyBonusPlateInset:{width:.8,height:.86},buyBonusHighlightPad:0,buyBonusHighlightRadius:.12,buyBonusHitArea:{x:.08,y:.05,width:.84,height:.9},buyBonusLabelFill:0x251f1c,buyBonusLabelSizeRatio:.32,buyBonusLabelWrapWidth:90,buyBonusLabelOffsetY:.16,buyBonusHoverSprite:'buyBonusGlyph',buyBonusHoverSpriteTint:0xffffff,buyBonusHoverSpriteBlend:'normal',buyBonusDisabledStyle:'dim',buyBonusIdleTint:0xffffff,buyBonusHideInFreeSpins:true,
 labelAffordance:true,labelHoverColor:0xffdc8a,labelChevronHoverColor:0xffdc8a,hoverHighlight:true,hoverPlateLight:undefined,pressFeedback:true,spinButtonGlow:false,
 platformUx:{betRepeatMs:0,betToSpinCooldownMs:500,idleReminderMs:0,idlePulseMs:2000,shortcuts:true,keybindThrottleMs:100,closePanelsOnSpin:true},
 autoSpinsCounterFill:PANEL,autoSpinsCounterBorder:0xd7b96f,autoSpinsCounterLabel:0xfffaf0,autoSpinsCounterLabelStroke:0x171b24,
 sprites:{bar:'mgUiBarStrip',base_ticker:'mgUiTicker',buyBonus:'mgUiBuyBonus',buyBonusGlyph:'mgUiBuyBonusLit'},
 icons:{menu:'mgIconMenu',menuExit:'mgIconMenuExit',settings:'mgIconSettings',info:'mgIconInfo',payTable:'mgIconPayTable',soundOn:'mgIconSoundOn',soundOff:'mgIconSoundOff',autoSpin:'mgIconAutoSpin',increase:'mgIconIncrease',decrease:'mgIconDecrease'},iconScales:{increase:.7,decrease:.7}
});
stateConfig.explainInsufficientBalance=true;
'''
for folder,slug in [('Purrfia喵菲亞家族','purrfia'),('ParrotRadio鸚鵡電台','parrot')]:
 app=ROOT/'apps'/folder;cat=slug=='purrfia';data=DATA
 replacements={'KIND':slug,'TITLE':'PURRFIA' if cat else 'PARROT RADIO','BOARD':'7 × 7' if cat else '6 × 5','TEXT_IMPORT':"import {purrfiaText} from './purrfiaText';" if cat else '',
 'LABELS':"{H1:['Goldfish bowl','金魚缸'],H2:['Salmon tin','鮭魚罐頭'],H3:['Yarn ball','毛線球'],H4:['Catnip plant','貓薄荷'],L1:['Spade paw','黑桃貓掌'],L2:['Heart paw','紅心貓掌'],L3:['Diamond paw','方塊貓掌'],L4:['Club paw','梅花貓掌']}" if cat else "{H1:['Gold record','金色黑膠唱片'],H2:['Headphone hat','耳機三角帽'],H3:['Spyglass','望遠鏡'],H4:['Coconut','椰子'],L1:['Eighth note','八分音符'],L2:['Quarter note','四分音符'],L3:['Treble clef','高音譜號'],L4:['Rest','休止符']}",
 'TIERS':'[5,6,9,13]' if cat else '[8,10,12]','TIER_LABELS':"['5','6–8','9–12','13+']" if cat else "['8–9','10–11','12+']",
 'MATCH_RULE':"purrfiaText('cluster')" if cat else "pick('Eight or more matching symbols anywhere form a win. Adjacency is not required. Winners leave and new symbols tumble in.', '任意位置 8 個以上相同圖案即可得分，不必相鄰。得分圖案收走後掉落並補位。')",
 'SECTIONS':"[{title:purrfiaText('clusterTitle'),body:purrfiaText('cluster')},{title:purrfiaText('boxesTitle'),body:purrfiaText('boxes')},{title:purrfiaText('territoryTitle'),body:purrfiaText('territory')},{title:purrfiaText('freeTitle'),body:purrfiaText('free')},{title:pick('Standard and Super entry','一般與超級入場'),body:pick('Standard entry starts 10 free rounds with normal stamps. Super entry starts 10 rounds with every cell already marked and stamps from ×5.','一般入場為 10 轉、使用一般印章。超級入場同為 10 轉，49 格開場已有記號，印章從 ×5 起。')}]" if cat else "[{title:pick('Matching symbols and tumbles','圖案與連消'),body:pick('The board has 6 columns and 5 rows. Eight or more matching symbols anywhere form a win. Winners leave, remaining symbols drop, and the board refills until no more wins remain.','6×5 盤面，任意位置 8 個以上相同圖案得分。收走得分圖案、上方掉落並補位，直到沒有新的得分。')},{title:pick('ENCORE','安可'),body:pick('A winning base round has a 25% chance of one encore. Every winning free round has one encore. The highest contributing symbol is selected, indicated non-microphone tiles turn into it, and tumbles continue. There is at most one encore per round.','有得分的主遊戲有 25% 機率安可；免費遊戲有得分就一定安可。本轉貢獻最多的圖案會被選中，指定的非麥克風格子翻成該圖案後繼續連消，每轉最多一次。')},{title:pick('Free rounds and volume','免費遊戲與音量'),body:pick('4+ microphones award 12 free rounds; 3+ during the feature add 5. Volume starts at ×1, or ×6 in Super, and each encore raises it by 1 up to ×20. Only wins after the encore use volume.','4 支以上麥克風獲得 12 轉；免費遊戲中 3 支以上再加 5 轉。音量一般從 ×1、超級從 ×6 起，每次安可加 1，最高 ×20。只有安可之後的得分乘音量。')},{title:pick('Platinum record','白金唱片'),body:pick('A platinum record can appear after all tumbles. It multiplies the whole current round only if that round has a win, including its encore results. It never accumulates across rounds. Values reach ×100 in base play and ×500 in free rounds.','白金唱片可在所有連消結束後出現，只在本轉有得分時乘整轉結果，包含安可得分。倍數不跨轉累積，主遊戲最高 ×100、免費遊戲最高 ×500。')}]",
 'SPECIALS':"[{src:art('mgS'),title:pick('Family ring','家族戒指'),body:purrfiaText('free')},{src:art('mgM'),title:purrfiaText('boxesTitle'),body:purrfiaText('boxes')},{src:art('mgW'),title:purrfiaText('territoryTitle'),body:purrfiaText('territory')}]" if cat else "[{src:art('mgS'),title:pick('Microphone','麥克風'),body:pick('4+ microphones award 12 free rounds; 3+ in the feature add 5. Microphones have no separate symbol award.','4 支以上獲得 12 轉，免費遊戲中 3 支以上再加 5 轉。麥克風本身不另付圖案得分。')},{src:art('art_platinum_disc'),title:pick('Platinum record','白金唱片'),body:pick('Multiplies the current whole round when there is a win. It does not carry into the next round.','本轉有得分時乘整轉結果，不帶到下一轉。')}]"}
 for key in sorted(replacements,key=len,reverse=True):data=data.replace(key,replacements[key])
 (app/'src/game/gameInfo.ts').write_text(data,encoding='utf-8');shutil.copy2(TOOLS/'new_game_info_panel.svelte',app/'src/components/ui/GameInfo.svelte')
 theme=THEME.replace('BAR','0x261e1c' if cat else '0x163343').replace('PANEL','0x211d1e' if cat else '0x12303e');(app/'src/game/uiTheme.ts').write_text(theme,encoding='utf-8')
 modal=app/'src/components/ui/Modals.svelte';s=modal.read_text(encoding='utf-8');s=s.replace("import ModalPayTable from './ModalPayTable.svelte';","import GameInfo from './GameInfo.svelte';").replace("import ModalGameRules from './ModalGameRules.svelte';",'').replace('<ModalPayTable />','<GameInfo />').replace('<ModalGameRules />','');modal.write_text(s,encoding='utf-8')
 print(folder,'console and Info panel updated')
