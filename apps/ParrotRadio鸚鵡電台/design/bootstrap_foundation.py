"""Create the app-owned mechanical review foundation. Art remains unapproved."""
from pathlib import Path
import json, shutil, re

APP=Path(__file__).resolve().parent.parent
BASE=APP.parent/'MedusaGaze梅杜莎凝視'
def write(name, data):
 p=APP/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(data.strip()+'\n',encoding='utf-8')

for directory in ('src','design'):
 for p in (APP/directory).rglob('*'):
  if p.is_file() and p.suffix in ('.ts','.svelte','.mjs','.html','.js'):
   t=p.read_text(encoding='utf-8').replace('MEDUSA_GAZE','PARROT_RADIO').replace('MedusaGaze','ParrotRadio').replace('medusa-gaze','parrot-radio').replace('MEDUSA GAZE','PARROT RADIO').replace('梅杜莎凝視','鸚鵡電台')
   p.write_text(t,encoding='utf-8')

pkg=json.loads((APP/'package.json').read_text());pkg['name']='parrot-radio'
pkg['scripts']={
 'dev':'vite dev --host --port 3047','preview':'vite preview',
 'build':'node design/sync_math_config.mjs && node design/check_undefined_refs.mjs && node design/check_string_literals.mjs && node design/check_social_words.mjs && node design/check_assets.mjs && node design/check_events.mjs && vite build',
 'check:events':'node design/check_events.mjs','dev:books':'E:/stake/math-sdk/env/Scripts/python.exe design/make_dev_books.py'}
write('package.json',json.dumps(pkg,indent=2))
shutil.copytree(BASE/'static/fonts',APP/'static/fonts',dirs_exist_ok=True)
write('vite.config.js',"import config from 'config-vite';\nimport { mergeConfig } from 'vite';\nexport default mergeConfig(config(), {base:'./'});")
write('src/app.html',(BASE/'src/app.html').read_text().replace('MEDUSA GAZE','PARROT RADIO').replace('Medusa Gaze','Parrot Radio'))

keep_components={'Board','BoardBase','BoardContainer','BoardMask','ReelSymbol','SymbolWrap','SymbolSprite','EnableGameActor','EnableSound','BetLabelDim','BarMessage','ResumeBet','ReplayIntro','PressToContinue','EntryReveal','GoldText','WildPartyLoader','FreeSpinIntro','FreeSpinOutro','FreeSpinCounter','FreeSpinAnimation','Transition','TransitionAnimation'}
for p in (APP/'src/components').glob('*.svelte'):
 if p.stem not in keep_components:p.unlink()
keep_games={'actor','config','constants','context','errorLog','eventEmitter','fonts','i18nText','socialTerms','stateApp','stateGame.svelte','stateLayout','stateXstate','types','typesBookEvent','typesEmitterEvent','utils','winLevelMap','animationTimeline','symbolMotion','featureTotal'}
for p in (APP/'src/game').iterdir():
 if p.is_file() and p.stem not in keep_games:p.unlink()

const=(APP/'src/game/constants.ts').read_text()
start=const.index('export const INITIAL_BOARD:');end=const.index('export const BOARD_DIMENSIONS')
const=const[:start]+"const SYMBOL_CYCLE: RawSymbol['name'][] = ['H1','H2','H3','H4','L1','L2','L3','L4'];\nexport const INITIAL_BOARD: RawSymbol[][] = Array.from({length:6},(_,reel)=>Array.from({length:7},(_,row)=>({name:SYMBOL_CYCLE[(reel*3+row)%8]})));\n\n"+const[end:]
const=const.replace("\tH5: mixedSymbol('mgH5', HIGH_RATIOS),\n",'')
const=const.replace("type: 'spine',\n\tassetKey: 'explosion',\n\tanimationName: 'explosion',","type: 'sprite' as const,\n\tassetKey: 'mgL1',")
const=const.replace('0x1e4950','0x16334a')
const=const[:const.index('// ---------------------------------------------------------------------------\n// Medusa')]+const[const.index('// The board\'s own cell colour'):]
write('src/game/constants.ts',const)

state=(APP/'src/game/stateGame.svelte.ts').read_text();state=re.sub(r"\t// Medusa's running total.*?\tmedusaTotal: 0,",'\tvolume: 1,\n\tencored: false,\n\tencoreResult: null as null | boolean,\n\tspinWin: 0,\n\tpostEncoreWin: 0,\n\tplatinum: null as null | {mult:number;applied:boolean;baseWin:number;totalWin:number},',state,flags=re.S)
write('src/game/stateGame.svelte.ts',state)
actor=(APP/'src/game/actor.ts').read_text();actor=re.sub(r"\t\t// Safety net.*?\t\tstateGame.tumbleWin",'\t\tstateGame.volume = 1;\n\t\tstateGame.encored = false;\n\t\tstateGame.platinum = null;\n\t\tstateGame.tumbleWin',actor,flags=re.S)
write('src/game/actor.ts',actor)

write('src/game/uiTheme.ts',"""
import {setUiTheme} from 'components-ui-pixi';
import {stateConfig} from 'state-shared';
import {GAME_FONT,GAME_FONT_WEIGHT} from './fonts';
setUiTheme({fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,barStyle:'framed',barFill:0x10283c,panelFill:0x16334a,panelBorder:0xf2c14e,
buttonFill:0x16334a,buttonFillLight:0x32c7ce,buttonFillActive:0xf2c14e,labelFill:0xf6f1e6,valueFill:0xffffff,
betBarLayout:'compactBottom',turboTiers:2,spinButtonGlow:false,buyBonusHideInFreeSpins:true,portraitSideButtonX:400,
platformUx:{betRepeatMs:0,betToSpinCooldownMs:500,idleReminderMs:30000,idlePulseMs:2000,shortcuts:true,keybindThrottleMs:100,closePanelsOnSpin:true}});
stateConfig.explainInsufficientBalance=true;
""")
write('src/game/barText.ts',"""
import {stateUrlDerived} from 'state-shared';
const strings={placeBet:['PLACE YOUR BET','請下注'],comePlay:['COME AND PLAY','快來玩'],goodLuck:['GOOD LUCK!','祝好運！'],encoreTip:['PLAY THE TOP SYMBOL AGAIN','最賺的圖案再放一次'],volumeTip:['MORE ENCORES, MORE VOLUME','安可越多越大聲']} as const;
export const barText=(key:keyof typeof strings)=>strings[key][stateUrlDerived.lang()==='zh'?1:0];
""")
bar=(APP/'src/components/BarMessage.svelte').read_text().replace("'medusaTip'","'encoreTip'").replace("'multipliersAddUp'","'volumeTip'")
write('src/components/BarMessage.svelte',bar)

write('src/game/assets.ts',"// Neutral symbol tokens for mechanics review; approved artwork is pending.\nexport default {\n"+''.join(f" mg{name}: {{type:'sprite',src:new URL('../../assets/sprites/parrotSymbols/{name.lower()}.png',import.meta.url).href,preload:true}},\n" for name in ['S','H1','H2','H3','H4','L1','L2','L3','L4'])+"} as const;")
write('src/game/typesEmitterEvent.ts',"""
import type {EmitterEventBoard} from '../components/Board.svelte';
import type {EmitterEventBoardFrame} from '../components/BoardFrame.svelte';
import type {EmitterEventFreeSpinIntro} from '../components/FreeSpinIntro.svelte';
import type {EmitterEventFreeSpinCounter} from '../components/FreeSpinCounter.svelte';
import type {EmitterEventFreeSpinOutro} from '../components/FreeSpinOutro.svelte';
import type {EmitterEventWin} from '../components/Win.svelte';
import type {EmitterEventSound} from '../components/Sound.svelte';
import type {EmitterEventTransition} from '../components/Transition.svelte';
import type {EmitterEventScatterWins} from '../components/ScatterWins.svelte';
import type {EmitterEventTumble} from '../components/TumbleLayer.svelte';
import type {EmitterEventParrot} from '../components/ParrotFeature.svelte';
export type EmitterEventGame=EmitterEventBoard|EmitterEventBoardFrame|EmitterEventFreeSpinIntro|EmitterEventFreeSpinCounter|EmitterEventFreeSpinOutro|EmitterEventWin|EmitterEventSound|EmitterEventTransition|EmitterEventScatterWins|EmitterEventTumble|EmitterEventParrot;
""")

write('src/components/Game.svelte',"""
<script lang="ts">
 import {onMount} from 'svelte';
 import {App,Container} from 'pixi-svelte';
 import {EnablePixiExtension} from 'components-pixi';
 import {EnableHotkey} from 'components-shared';
 import {MainContainer} from 'components-layout';
 import {UI,UiGameName} from 'components-ui-pixi';
 import {GameVersion} from 'components-ui-html';
 import {stateModal} from 'state-shared';
 import {getContext} from '../game/context';
 import '../game/uiTheme';
 import EnableGameActor from './EnableGameActor.svelte';
 import ResumeBet from './ResumeBet.svelte';
 import Sound from './Sound.svelte';
 import BarMessage from './BarMessage.svelte';
 import BetLabelDim from './BetLabelDim.svelte';
 import Background from './Background.svelte';
 import LoadingScreen from './LoadingScreen.svelte';
 import BoardFrame from './BoardFrame.svelte';
 import Board from './Board.svelte';
 import TumbleLayer from './TumbleLayer.svelte';
 import ScatterWins from './ScatterWins.svelte';
 import ParrotFeature from './ParrotFeature.svelte';
 import Win from './Win.svelte';
 import FreeSpinIntro from './FreeSpinIntro.svelte';
 import FreeSpinOutro from './FreeSpinOutro.svelte';
 import FreeSpinCounter from './FreeSpinCounter.svelte';
 import ReplayIntro from './ReplayIntro.svelte';
 import Transition from './Transition.svelte';
 import Modals from './ui/Modals.svelte';
 const context=getContext();
 onMount(()=>context.stateLayout.showLoadingScreen=true);
 context.eventEmitter.subscribeOnMount({buyBonusConfirm:()=>{stateModal.modal={name:'buyBonusConfirm'};}});
</script>
<App>
 <EnableHotkey/><EnableGameActor/><EnablePixiExtension/><Background/>
 {#if context.stateLayout.showLoadingScreen}
  <LoadingScreen onloaded={()=>context.stateLayout.showLoadingScreen=false}/>
 {:else}
  <ResumeBet/><Sound/><BetLabelDim/><BarMessage/>
  <MainContainer><BoardFrame/><Board/><TumbleLayer/><ScatterWins/><ParrotFeature/></MainContainer>
  <UI>{#snippet gameName()}<Container scale={0.62}><UiGameName name="PARROT RADIO"/></Container>{/snippet}{#snippet logo()}{/snippet}</UI>
  <Win/><FreeSpinIntro/><FreeSpinCounter/><FreeSpinOutro/><ReplayIntro/><Transition/>
 {/if}
</App>
<Modals>{#snippet version()}<GameVersion version="0.1.0"/>{/snippet}</Modals>
""")
write('src/components/Background.svelte',"""
<script lang="ts">
 import {Graphics} from 'pixi-svelte';
 import {getContext} from '../game/context';
 const context=getContext();
</script>
<Graphics draw={g=>{const {width,height}=context.stateLayoutDerived.canvasSizes();g.clear();g.rect(0,0,width,height).fill(context.stateGame.gameType==='freegame'?0x0b1633:0x16425b);g.rect(0,height*.66,width,height*.34).fill(0x694a35);}}/>
""")
write('src/components/BoardFrame.svelte',"""
<script lang="ts" module>
 export type EmitterEventBoardFrame={type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number};
</script>
<script lang="ts">
 import {Graphics,Text} from 'pixi-svelte';
 import BoardContainer from './BoardContainer.svelte';
 import {BOARD_SIZES,BOARD_DIMENSIONS,SYMBOL_SIZE,REEL_PADDING} from '../game/constants';
 import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';
 const context=getContext();
 context.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>{},boardFrameGlowHide:()=>{},boardFrameImpact:()=>{}});
</script>
<BoardContainer>
 <Graphics draw={g=>{g.clear();g.roundRect(-12,-12,BOARD_SIZES.width+24,BOARD_SIZES.height+24,15).fill(0x16334a).stroke({color:0xd9a650,width:9});for(let x=0;x<BOARD_DIMENSIONS.x;x++)for(let y=0;y<BOARD_DIMENSIONS.y;y++)g.rect(x*SYMBOL_SIZE+3,y*SYMBOL_SIZE+3,SYMBOL_SIZE-6,SYMBOL_SIZE-6).fill(0x102b40);}}/>
 <Text text="PARROT RADIO" x={BOARD_SIZES.width/2} y={-55} anchor={0.5} style={{fontFamily:GAME_FONT,fontSize:30,fill:0xf2c14e}}/>
</BoardContainer>
""")
write('src/components/Symbol.svelte',"""
<script lang="ts">
 import {Sprite,Container} from 'pixi-svelte';
 import {onMount,onDestroy} from 'svelte';
 import {SYMBOL_SIZE} from '../game/constants';
 import {getSymbolInfo} from '../game/utils';
 import type {RawSymbol,SymbolState} from '../game/types';
 const props:{x?:number;y?:number;state:SymbolState;rawSymbol:RawSymbol;oncomplete?:()=>void;blur?:number;impact?:number;loop?:boolean}=$props();
 const info=$derived(getSymbolInfo({rawSymbol:props.rawSymbol,state:props.state}));
 $effect(()=>{const state=props.state;const timer=setTimeout(()=>{if(state==='win'||state==='land')props.oncomplete?.();},state==='win'?280:150);return()=>clearTimeout(timer);});
</script>
{#if props.state!=='explosion'}
 <Container x={props.x??0} y={props.y??0} scale={props.state==='win'?1.07:1}>
  <Sprite key={info.assetKey} anchor={0.5} width={SYMBOL_SIZE*info.sizeRatios.width} height={SYMBOL_SIZE*info.sizeRatios.height}/>
 </Container>
{/if}
""")
write('src/components/LoadingScreen.svelte',"""
<script lang="ts">
 import {MainContainer} from 'components-layout';
 import {Text} from 'pixi-svelte';
 import PressToContinue from './PressToContinue.svelte';
 import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';
 import {parrotText} from '../game/parrotText';
 const props:{onloaded:()=>void}=$props();const context=getContext();
</script>
<MainContainer>
 <Text anchor={.5} x={context.stateLayoutDerived.mainLayout().width*.5} y={context.stateLayoutDerived.mainLayout().height*.25} text="PARROT RADIO" style={{fontFamily:GAME_FONT,fontSize:52,fill:0xf2c14e}}/>
 <Text anchor={.5} x={context.stateLayoutDerived.mainLayout().width*.5} y={context.stateLayoutDerived.mainLayout().height*.44} text={parrotText('intro')} style={{fontFamily:'Arial',fontSize:23,fill:0xffffff,align:'center',wordWrap:true,wordWrapWidth:600}}/>
</MainContainer>
{#if context.stateApp.loaded}<PressToContinue onpress={props.onloaded}/>{/if}
""")
write('src/components/FreeSpinAnimation.svelte',"""
<script lang="ts">
 import type {Snippet} from 'svelte';
 import {Container,Graphics} from 'pixi-svelte';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 const props:{children:Snippet<[{sizes:{width:number;height:number}}]>}=$props();const context=getContext();
 const sizes=$derived({width:Math.min(context.stateLayoutDerived.mainLayout().width*.8,900),height:320});
</script>
<MainContainer><Container x={context.stateLayoutDerived.mainLayout().width*.5} y={context.stateLayoutDerived.mainLayout().height*.45}>
 <Graphics draw={g=>{g.clear();g.roundRect(-sizes.width/2,-sizes.height/2,sizes.width,sizes.height,20).fill(0x14354a).stroke({color:0xf2c14e,width:5});}}/>
 {@render props.children({sizes})}
</Container></MainContainer>
""")
# The generic counter is preserved but its art is replaced by a board-owned panel.
counter=(APP/'src/components/FreeSpinCounter.svelte').read_text();counter=re.sub(r'<Sprite\s+key="mgFsPanel".*?/>','<Graphics draw={(g)=>{g.clear();g.roundRect(-115,-48,230,96,14).fill(0x14354a).stroke({color:0xf2c14e,width:3});}}/>',counter,flags=re.S)
counter=counter.replace("import { Sprite, Text", "import { Graphics, Text").replace("import { Text, Sprite", "import { Text, Graphics")
if 'Graphics' not in counter.split('</script>')[-2]: pass
write('src/components/FreeSpinCounter.svelte',counter)

write('src/game/parrotText.ts',"""
import {stateUrlDerived} from 'state-shared';
const strings={
 intro:['8+ matching symbols anywhere win. ENCORE replays the top symbol. Free rounds build volume; platinum records multiply one round.','任意位置 8 個相同圖案得分。安可再放本轉最賺的圖案；免費遊戲累積音量，白金唱片只乘本轉。'],
 encore:['ENCORE!','安可！'],volume:['VOLUME','音量'],record:['PLATINUM','白金唱片'],miss:['TRY NEXT TIME','下次再來'],
 freeTip:['More encores, more volume','安可越多越大聲'],feature:['FREE SPINS','免費遊戲'],super:['SUPER FREE SPINS','超級免費遊戲']
} as const;
export const parrotText=(key:keyof typeof strings)=>strings[key][stateUrlDerived.lang()==='zh'?1:0];
""")

write('src/components/Win.svelte',"""
<script lang="ts" module>
 import type {WinLevelData} from '../game/winLevelMap';
 export type EmitterEventWin={type:'winShow'}|{type:'winHide'}|{type:'winUpdate';amount:number;winLevelData:WinLevelData};
</script>
<script lang="ts">
 import {Text} from 'pixi-svelte';import {MainContainer} from 'components-layout';import {waitForTimeout} from 'utils-shared/wait';
 import {bookEventAmountToCurrencyString} from 'utils-shared/amount';import {getContext} from '../game/context';import {GAME_FONT} from '../game/fonts';
 const context=getContext();let show=$state(false),amount=$state(0);
 context.eventEmitter.subscribeOnMount({winShow:()=>show=true,winHide:()=>{show=false;},winUpdate:async e=>{amount=e.amount;await waitForTimeout(1000);}});
</script>
{#if show}<MainContainer><Text anchor={.5} x={context.stateLayoutDerived.mainLayout().width*.5} y={context.stateLayoutDerived.mainLayout().height*.35} text={bookEventAmountToCurrencyString(amount)} style={{fontFamily:GAME_FONT,fontSize:66,fill:0xf2c14e,stroke:{color:0x102b40,width:8}}}/></MainContainer>{/if}
""")

write('src/components/ScatterWins.svelte',"""
<script lang="ts" module>
 import type {ScatterWinDatum} from '../game/bookEventHandlerMap';
 export type EmitterEventScatterWins={type:'scatterWinsShow';wins:ScatterWinDatum[];pace?:string}|{type:'scatterWinsHide'};
</script>
<script lang="ts">
 import {Graphics,Text} from 'pixi-svelte';import {waitForTimeout} from 'utils-shared/wait';import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {getContext} from '../game/context';import {SYMBOL_SIZE} from '../game/constants';import {getSymbolX} from '../game/utils';import BoardContainer from './BoardContainer.svelte';
 const context=getContext();let wins=$state<ScatterWinDatum[]>([]);
 context.eventEmitter.subscribeOnMount({scatterWinsHide:()=>wins=[],scatterWinsShow:async e=>{wins=e.wins;await waitForTimeout(e.pace?.includes('turbo')?280:620);}});
</script>
<BoardContainer>
 <Graphics draw={g=>{g.clear();for(const win of wins)for(const p of win.positions)g.roundRect(getSymbolX(p.reel)-SYMBOL_SIZE*.46,(p.row-1)*SYMBOL_SIZE+4,SYMBOL_SIZE*.92,SYMBOL_SIZE*.92,12).stroke({color:context.stateGame.encored?0xf2c14e:0x50e8df,width:4});}}/>
 {#each wins as win}<Text x={getSymbolX(win.overlay.reel)} y={(win.overlay.row-.5)*SYMBOL_SIZE} anchor={.5} text={bookEventAmountToCurrencyString(win.win)} style={{fontFamily:'Arial',fontSize:23,fontWeight:'700',fill:0xffffff,stroke:{color:0x102b40,width:5}}}/>{/each}
</BoardContainer>
""")

write('src/components/TumbleLayer.svelte',"""
<script lang="ts" module>
 import type {Position,RawSymbol} from '../game/types';
 export type EmitterEventTumble={type:'tumbleRun';explodingSymbols:Position[];newSymbols:RawSymbol[][]};
</script>
<script lang="ts">
 import {waitForTimeout} from 'utils-shared/wait';import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';import {planCascadeColumn,gravityProgress} from '../game/symbolMotion';import {BOARD_DIMENSIONS,SYMBOL_SIZE} from '../game/constants';
 const context=getContext();const y=(row:number)=>(row-.5)*SYMBOL_SIZE;
 context.eventEmitter.subscribeOnMount({tumbleRun:async e=>{
  const removed=new Map<number,number[]>();for(const p of e.explodingSymbols){removed.set(p.reel,[...(removed.get(p.reel)??[]),p.row]);context.stateGame.board[p.reel].reelState.symbols[p.row].symbolState='explosion';}
  await waitForTimeout(stateBet.isTurbo?90:180);
  await Promise.all(context.stateGame.board.map(async(reel,i)=>{
   const rows=removed.get(i);if(!rows?.length)return;
   const symbols=reel.reelState.symbols;const plan=planCascadeColumn(symbols.map(s=>s.rawSymbol),rows,e.newSymbols[i]??[],BOARD_DIMENSIONS.y);
   for(const m of plan.moves){const s=symbols[m.carrier];if(m.incoming){s.rawSymbol=m.rawSymbol;void s.symbolY.set(y(m.from),{duration:0});}s.symbolState='spin';}
   await Promise.all(plan.moves.map(m=>symbols[m.carrier].symbolY.set(y(m.to),{duration:stateBet.isTurbo?130:260,easing:gravityProgress})));
   reel.setSymbolsWithRawSymbols(plan.column);for(let r=0;r<reel.reelState.symbols.length;r++){const s=reel.reelState.symbols[r];void s.symbolY.set(y(r),{duration:0});s.symbolState='static';}
  }));
 }});
</script>
""")

write('src/components/Sound.svelte',"""
<script lang="ts" module>
 export type EmitterEventSound={type:'soundOnce';name:string;forcePlay?:boolean}|{type:'soundStop';name:string}|{type:'soundMusic';name:string}|{type:'soundLoop';name:string}|{type:'soundScatterCounterIncrease'}|{type:'soundScatterCounterClear'};
</script>
<script lang="ts">
 import {onDestroy} from 'svelte';import {stateSound} from 'state-shared';import {getContext} from '../game/context';
 const context=getContext();const playing=new Set<HTMLAudioElement>();
 // No inherited audio. Install approved WAVs in audio/parrot; absent cues stay silent.
 const files=import.meta.glob('../../static/assets/audio/parrot/*.wav',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
 const play=(name:string,loop=false)=>{const src=Object.entries(files).find(([p])=>p.endsWith(`/${name}.wav`))?.[1];if(!src)return;const a=new Audio(src);a.loop=loop;a.volume=0.25;playing.add(a);a.onended=()=>playing.delete(a);void a.play().catch(()=>playing.delete(a));};
 context.eventEmitter.subscribeOnMount({soundOnce:e=>play(e.name),soundMusic:e=>play(e.name,true),soundLoop:e=>play(e.name,true),soundStop:()=>{for(const a of playing)a.pause();playing.clear();},soundScatterCounterIncrease:()=>context.stateGame.scatterCounter++,soundScatterCounterClear:()=>context.stateGame.scatterCounter=0});
 onDestroy(()=>{for(const a of playing)a.pause();playing.clear();});
</script>
""")

write('src/game/betModeMeta.ts',"""
import type {BetModeData} from 'state-shared';import {stateUrlDerived} from 'state-shared';import config from './config';
const pick=(normal:string,social:string)=>stateUrlDerived.social()?social:normal;
const assets={icon:'',volatility:'',button:'',dialogImage:'',dialogVolatility:''};
const mode=(key:'base'|'bonus'|'super'):BetModeData=>({mode:key.toUpperCase(),costMultiplier:config.betModes[key].cost,type:key==='base'?'default':'buy',parent:'',children:'',maxWin:config.betModes[key].max_win,assets:{...assets},text:{
get title(){return key==='base'?'BASE':key==='super'?'SUPER FREE SPINS':'FREE SPINS';},
get dialog(){return pick(`Enter 12 free spins for ${config.betModes[key].cost}× your bet. Volume starts at ×${key==='super'?6:1}; each encore raises it by 1, to ×20. Only wins after encore use volume. Platinum records multiply one spin only. RTP 96.00%. Maximum win 10,000× your bet.`,`Enter 12 free spins for ${config.betModes[key].cost}× your amount. Volume starts at ×${key==='super'?6:1}; each encore raises it by 1, to ×20. Only wins after encore use volume. Platinum records multiply one spin only. RTP 96.00%. Maximum win 10,000× your amount.`);},
get description(){return `12 FREE SPINS · VOLUME STARTS AT ×${key==='super'?6:1}`;},get button(){return pick(`BUY ${config.betModes[key].cost}×`,`PLAY ${config.betModes[key].cost}×`);},get tickerIdle(){return pick('PLACE YOUR BET','READY TO PLAY');},tickerSpin:'GOOD LUCK',bannerText:'',betAmountLabel:''}});
export const PARROT_RADIO_BET_MODE_META:Record<string,BetModeData>={BASE:mode('base'),BONUS:mode('bonus'),SUPER:mode('super')};
""")

write('design/sync_math_config.mjs',"""
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {mathGameDir} from '../../../tools/math_game_dir.mjs';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const math=mathGameDir('ParrotRadio');
const config=JSON.parse(fs.readFileSync(path.join(math,'library/configs/config_fe_ParrotRadio.json'),'utf8'));
if(config.gameID!=='ParrotRadio'||config.numReels!==6||config.numRows.some(n=>n!==5))throw Error('Parrot board configuration mismatch');
config.symbols=Object.assign({},...config.symbols);
if(Object.keys(config.symbols).sort().join(',')!==['H1','H2','H3','H4','L1','L2','L3','L4','S'].sort().join(','))throw Error('Unexpected math symbols');
config.freeSpins={trigger:4,spins:12,retrigger:3,retriggerSpins:5};config.volume={start:1,superStart:6,cap:20};config.platinum={baseValues:[2,3,5,10,25,50,100],freeValues:[2,3,5,10,25,50,100,250,500]};
fs.writeFileSync(path.join(app,'src/game/config.ts'),'// Generated from existing ParrotRadio math.\nexport default '+JSON.stringify(config)+';\n');console.log('Parrot math synced: 6x5, 9 symbols, modes '+Object.keys(config.betModes).join('/'));
""")

write('design/make_dev_books.py',"""
from pathlib import Path
import io,json,zstandard
app=Path(__file__).resolve().parent.parent
lib=app.parents[2]/'math-sdk/games/ParrotRadio鸚鵡電台/library/publish_files'
out={}
for mode in ('base','bonus','super'):
 with open(lib/f'books_{mode}.jsonl.zst','rb') as f:
  for number,line in enumerate(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(f),encoding='utf-8')):
   b=json.loads(line);es=b['events'];types={e['type'] for e in es}
   shape={'id':b['id'],'payoutMultiplier':b['payoutMultiplier']/100,'state':es,'mode':mode}
   def save(key,ok):
    if ok and key not in out:out[key]=[shape]
   if mode=='base':
    simple='freeSpinTrigger' not in types and 'wincap' not in types
    save('baseWin',simple and b['payoutMultiplier']>0 and 'encore' not in types)
    save('baseEncore',simple and 'encore' in types)
    save('baseRecord',simple and any(e['type']=='platinumRecord' and e['applied'] for e in es))
    save('baseRecordMiss',simple and any(e['type']=='platinumRecord' and not e['applied'] for e in es))
    save('baseTrigger','freeSpinTrigger' in types and 'wincap' not in types)
   else:
    save(mode+'Plain','wincap' not in types)
    save(mode+'Retrigger','freeSpinRetrigger' in types and 'wincap' not in types)
   if number>20000:break
   expected=['baseWin','baseEncore','baseRecord','baseRecordMiss','baseTrigger'] if mode=='base' else [mode+'Plain',mode+'Retrigger']
   if all(k in out for k in expected):break
(app/'src/dev/devBooks.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf-8')
print({k:{'id':v[0]['id'],'events':len(v[0]['state'])} for k,v in out.items()})
""")

# Deterministic neutral tokens are deliberately not production art.
from PIL import Image,ImageDraw,ImageFont
font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',140)
for name,color in zip(['S','H1','H2','H3','H4','L1','L2','L3','L4'],['#F2C14E','#DCAE55','#8F77BF','#73A89A','#E1A58D','#D45466','#639CCC','#57B9A1','#CEAC68']):
 p=APP/f'static/assets/sprites/parrotSymbols/{name.lower()}.png';p.parent.mkdir(parents=True,exist_ok=True)
 im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im);d.rounded_rectangle((55,55,457,457),60,fill=color,outline='#F6F1E6',width=12);d.text((256,256),name,font=font,anchor='mm',fill='#16334A');im.save(p)

print('Parrot foundation files initialized')
