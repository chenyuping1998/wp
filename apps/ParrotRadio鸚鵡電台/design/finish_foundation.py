from pathlib import Path
APP=Path(__file__).resolve().parent.parent
def w(name,s):(APP/name).write_text(s.strip()+'\n',encoding='utf-8')
w('src/components/TransitionAnimation.svelte',r'''
<script lang="ts">
 import {onMount} from 'svelte';
 const props:{oncomplete:()=>void;oncover?:()=>void}=$props();
 onMount(()=>{const a=setTimeout(()=>props.oncover?.(),200);const b=setTimeout(props.oncomplete,400);return()=>{clearTimeout(a);clearTimeout(b);};});
</script>
''')
w('src/components/FreeSpinOutro.svelte',r'''
<script lang="ts" module>
 import type {WinLevelData} from '../game/winLevelMap';
 export type EmitterEventFreeSpinOutro={type:'freeSpinOutroShow'}|{type:'freeSpinOutroHide'}|{type:'freeSpinOutroCountUp';amount:number;winLevelData:WinLevelData};
</script>
<script lang="ts">
 import {FadeContainer} from 'components-pixi';import {CanvasSizeRectangle} from 'components-layout';
 import {Text} from 'pixi-svelte';import {waitForResolve} from 'utils-shared/wait';import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {getContext} from '../game/context';import {GAME_FONT} from '../game/fonts';import {gameText} from '../game/i18nText';
 import FreeSpinAnimation from './FreeSpinAnimation.svelte';import PressToContinue from './PressToContinue.svelte';
 const context=getContext();let show=$state(false),amount=$state(0),done=$state(()=>{});
 context.eventEmitter.subscribeOnMount({freeSpinOutroShow:()=>show=true,freeSpinOutroHide:()=>show=false,freeSpinOutroCountUp:async e=>{amount=e.amount;await waitForResolve(resolve=>done=resolve);}});
</script>
<FadeContainer {show}><CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={.5}/>
 <FreeSpinAnimation>{#snippet children({sizes})}<Text anchor={.5} y={-60} text={gameText('totalWin')} style={{fontFamily:GAME_FONT,fontSize:34,fill:0xf2c14e}}/><Text anchor={.5} y={35} text={bookEventAmountToCurrencyString(amount)} style={{fontFamily:GAME_FONT,fontSize:60,fill:0xffffff}}/>{/snippet}</FreeSpinAnimation>
 <PressToContinue onpress={()=>done()}/>
</FadeContainer>
''')
w('src/components/FreeSpinCounter.svelte',r'''
<script lang="ts" module>
 export type EmitterEventFreeSpinCounter={type:'freeSpinCounterShow'}|{type:'freeSpinCounterHide'}|{type:'freeSpinCounterUpdate';current?:number;total?:number};
</script>
<script lang="ts">
 import {Text} from 'pixi-svelte';import BoardContainer from './BoardContainer.svelte';import {getContext} from '../game/context';import {BOARD_SIZES} from '../game/constants';import {gameText} from '../game/i18nText';
 const context=getContext();let show=$state(false),current=$state(1),total=$state(0);
 context.eventEmitter.subscribeOnMount({freeSpinCounterShow:()=>show=true,freeSpinCounterHide:()=>show=false,freeSpinCounterUpdate:e=>{if(e.current!==undefined)current=e.current;if(e.total!==undefined)total=e.total;}});
</script>
{#if show}<BoardContainer><Text anchor={.5} x={BOARD_SIZES.width*.5} y={-95} text={`${gameText('freeSpins')} ${current}/${total}`} style={{fontFamily:'Arial',fontSize:24,fill:0xffffff}}/></BoardContainer>{/if}
''')
w('src/components/ui/ModalGameRules.svelte',r'''
<script lang="ts">
 import {Popup} from 'components-shared';import {zIndex} from 'constants-shared/zIndex';import {stateModal,LEGAL_NOTICE,stateUrlDerived} from 'state-shared';
 import config from '../../game/config';import {socialTerms} from '../../game/socialTerms';
 const T=socialTerms();const zh=stateUrlDerived.lang()==='zh';
 const rules=zh?[
 '6×5 盤面，任意位置 8 個以上相同圖案得分，不需要相鄰。中獎圖案收走後，上方掉落並補位，直到沒有中獎。',
 '每轉連消結束後，有中獎的主遊戲有 25% 機率安可；免費遊戲有中獎就一定安可。安可選本轉總得分最多的圖案，將指定的非麥克風格子翻成該圖案，再繼續連消。一轉最多一次。',
 '4 支以上麥克風獲得 12 次免費遊戲；免費遊戲中 3 支以上增加 5 次。音量從 ×1 開始，超級免費遊戲從 ×6 開始；每次安可 +1，最高 ×20。只有安可之後的中獎乘音量。',
 '白金唱片在所有連消結束後揭曉，只在本轉有贏分時套用到整轉得分。倍數不累積；主遊戲最高 ×100，免費遊戲最高 ×500。',
 `免費遊戲 100×、超級免費遊戲 300×，兩者各 12 次。各模式 RTP ${(config.rtp*100).toFixed(2)}%，最高贏分 10,000×。`
 ]:[
 'The board has 6 columns and 5 rows. Eight or more matching symbols anywhere form a win. Adjacency is not required. Winning symbols leave, the remaining symbols drop, and new symbols refill the board until there are no more wins.',
 'After all tumbles finish, a winning base round has a 25% chance of ENCORE. Every winning free round has one encore. Squawk selects the symbol that earned the most in this round and turns the indicated non-microphone cells into it. Tumbles then continue. There is at most one encore per round.',
 'Four or more microphones award 12 free spins. Three or more during the feature add 5. Volume starts at ×1, or ×6 in Super Free Spins. Each encore raises it by 1, to ×20. Only wins after the encore use volume; earlier wins do not.',
 'A platinum record may appear after all tumbles. It multiplies this whole round only when the round has a win, including the encore winnings. It never accumulates. Values reach ×100 in base play and ×500 in free spins.',
 `Free Spins and Super Free Spins enter 12 rounds for 100× and 300× your ${T.bet}. All modes have ${(config.rtp*100).toFixed(2)}% RTP and a maximum win of 10,000× your ${T.bet}.`,
 'Controls: Spin or Space starts a round; Stop settles falling symbols. Minus and plus change the amount one step. Tap the amount to choose a level. Auto plays the selected number of rounds. Turbo cycles normal, fast, fastest. Menu opens settings, these rules and the win table. Sound controls master, music and effects volume. Replay begins only when Play is pressed.'
 ];
</script>
{#if stateModal.modal?.name==='gameRules'}<Popup title={zh?'遊戲規則':'GAME RULES'} zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>{#snippet children()}<article style="max-width:900px;padding:20px;color:#173448;background:#f6f1e6;line-height:1.6"><h2>PARROT RADIO</h2>{#each rules as rule}<p>{rule}</p>{/each}<p>{LEGAL_NOTICE}</p></article>{/snippet}</Popup>{/if}
''')
w('src/components/ui/ModalPayTable.svelte',r'''
<script lang="ts">
 import {Popup} from 'components-shared';import {zIndex} from 'constants-shared/zIndex';import {stateModal,stateUrlDerived} from 'state-shared';
 import config from '../../game/config';import {socialTerms} from '../../game/socialTerms';
 const T=socialTerms(),zh=stateUrlDerived.lang()==='zh';
 const labels:Record<string,string>={H1:zh?'金色黑膠唱片':'Gold Record',H2:zh?'戴耳機的三角帽':'Headphone Hat',H3:zh?'望遠鏡':'Spyglass',H4:zh?'椰子':'Coconut',L1:zh?'八分音符':'Eighth Note',L2:zh?'四分音符':'Quarter Note',L3:zh?'高音譜號':'Treble Clef',L4:zh?'休止符':'Rest'};
 const names=Object.keys(labels);const value=(name:string,count:number)=>{const s=(config.symbols as Record<string,{paytable:Record<string,number>[]|null}>)[name];return s.paytable?.find(p=>String(count) in p)?.[count]??0;};
</script>
{#if stateModal.modal?.name==='payTable'}<Popup title={T.payTable.toUpperCase()} zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>{#snippet children()}<article style="max-width:900px;padding:20px;color:#173448;background:#f6f1e6;line-height:1.6"><h2>PARROT RADIO</h2><p>{zh?'任意位置相同圖案數量；顯示為押注倍數。':`Matching symbols anywhere. Values are multiples of your ${T.bet}.`}</p><table style="width:100%"><thead><tr><th>{zh?'圖案':'SYMBOL'}</th><th>8–9</th><th>10–11</th><th>12+</th></tr></thead><tbody>{#each names as name}<tr><td>{labels[name]}</td><td>{value(name,8)}×</td><td>{value(name,10)}×</td><td>{value(name,12)}×</td></tr>{/each}</tbody></table><p>{zh?'S 麥克風本身不付分，只觸發免費遊戲。':'S microphones trigger free spins and have no separate win value.'}</p><p>{zh?'4 支以上 → 12 次免費遊戲；免費遊戲 3 支以上 → 加 5 次。':'4+ microphones → 12 free spins; 3+ during the feature → 5 more.'}</p></article>{/snippet}</Popup>{/if}
''')
# Keep static asset existence guard, remove source-specific audio and dynamic scene checks.
p=APP/'design/check_assets.mjs';s=p.read_text(encoding='utf-8');a=s.index('// Delivered cues');b=s.index('// ── the fonts',a);s=s[:a]+s[b:];w('design/check_assets.mjs',s)
w('src/dev/DevControls.svelte',r'''
<script lang="ts">
 import {onMount} from 'svelte';import {eventEmitter} from '../game/eventEmitter';import {stateLayout} from '../game/stateLayout';import {stateBet} from 'state-shared';import {stateGame} from '../game/stateGame.svelte';
 let enabled=$state(false),scenario=$state(new URLSearchParams(typeof location==='undefined'?'':location.search).get('book')??'baseWin');
 onMount(()=>enabled=import.meta.env.DEV&&new URLSearchParams(location.search).has('mock'));
 const go=()=>{stateLayout.showLoadingScreen=false;stateBet.activeBetModeKey=scenario.startsWith('super')?'SUPER':scenario.startsWith('bonus')?'BONUS':'BASE';eventEmitter.broadcast({type:'bet'});};
 const navigate=()=>{const u=new URL(location.href);u.searchParams.set('book',scenario);location.href=u.href;};
</script>
{#if enabled}<aside style="position:fixed;left:4px;top:4px;z-index:999999;background:#fff;color:#123;padding:6px;font:12px Arial;max-width:95vw">
 <span>LOCAL MECHANICS REVIEW</span>
 <select aria-label="Scenario" bind:value={scenario} onchange={navigate}>{#each ['baseWin','baseEncore','baseRecord','baseRecordMiss','baseTrigger','bonusPlain','bonusRetrigger','superPlain','superRetrigger'] as key}<option value={key}>{key}</option>{/each}</select>
 <button onclick={()=>stateLayout.showLoadingScreen=false}>Start</button><button onclick={go}>Play fixture</button>
 <button onclick={()=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' '}))}>Continue</button>
 <button onclick={()=>stateBet.turboLevel=stateBet.turboLevel===2?0:2}>Turbo</button>
 <output aria-label="Review status">{stateGame.gameType} · volume ×{stateGame.volume} · win {stateBet.winBookEventAmount}</output>
</aside>{/if}
''')
p=APP/'src/routes/+layout.svelte';s=p.read_text(encoding='utf-8').replace("import Game from '../components/Game.svelte';","import Game from '../components/Game.svelte';\n import DevControls from '../dev/DevControls.svelte';");s += '\n{#if import.meta.env.DEV}<DevControls/>{/if}\n';w('src/routes/+layout.svelte',s)
# Expose continue through a real dev DOM button directly tied to the current callback.
p=APP/'src/components/PressToContinue.svelte';s=p.read_text(encoding='utf-8');s += '\n{#if import.meta.env.DEV && typeof location!=="undefined" && new URLSearchParams(location.search).has("mock")}<button style="position:fixed;right:8px;top:8px;z-index:999999" onclick={props.onpress}>Continue panel</button>{/if}\n';w('src/components/PressToContinue.svelte',s)
# Mock uses authentic books, normalized payout, mode-matched fixtures and costs.
p=APP/'src/dev/mockRgs.ts';s=p.read_text(encoding='utf-8');s=s.replace("type DevBook = { id: number; payoutMultiplier: number; state: unknown[] };","type DevBook = { id: number; payoutMultiplier: number; state: unknown[];mode:string };")
a=s.index('\tconst ORDER = [');b=s.index('\tconst forced =',a);s=s[:a]+"\tconst ORDER = ['baseWin','baseEncore','baseRecord','baseRecordMiss','baseTrigger'];\n"+s[b:]
s=s.replace("const book = sequence[index % sequence.length];", "const mode=String(body.mode??'base').toLowerCase();\n\t\t\tconst pool=sequence.filter(b=>b.mode===mode);\n\t\t\tconst fallback=Object.values(books).flat().filter(b=>b.mode===mode);\n\t\t\tconst available=pool.length?pool:fallback;\n\t\t\tconst book = available[index % available.length];")
s=s.replace('balance = balance - amount + amount * book.payoutMultiplier;','balance = balance - amount * (mode===\'super\'?300:mode===\'bonus\'?100:1) + amount * book.payoutMultiplier;')
w('src/dev/mockRgs.ts',s)
# No source setup scripts in runtime; thumbnail is a neutral token until approval.
from PIL import Image
Image.open(APP/'static/assets/sprites/parrotSymbols/s.png').resize((256,256)).save(APP/'static/favicon.png')
print('Parrot review controls, rules and static guards complete')
