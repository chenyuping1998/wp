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
{#if stateModal.modal?.name==='gameRules'}<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>{#snippet children()}<article style="max-width:900px;padding:20px;color:#173448;background:#f6f1e6;line-height:1.6"><h2>PARROT RADIO</h2>{#each rules as rule}<p>{rule}</p>{/each}<p>{LEGAL_NOTICE}</p></article>{/snippet}</Popup>{/if}
