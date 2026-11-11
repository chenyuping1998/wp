# HardTime — Neon motion release self-check 2026-11-02

{'PASS': 25, 'AT RISK': 13, 'NEEDS A HUMAN': 2, 'N/A': 1}

Incremental revalidation of the exact production build already tested locally. Previous findings are explicitly inherited, not represented as newly repeated full certification. No known new FAIL from this rendering/cadence delta. User requested upload AND publication.

Comparison: platform before release saved in game-before.json. Frontend plan3 uploads (index.html,version.json,new bundle),1 obsolete bundle deletion; math plan0 actions. Existing asset bytes match staged artwork; existing thumbnail/cover retained.

## Remaining risks

Incomplete real-RGS, exhaustive currency/replay/modal and physical-device checks remain labelled below. JPY retains the later reviewer-requested2dp convention where applicable. This release is not a platform approval or new review submission.

## Full checklist

| ID | Guideline | Verdict | Evidence |
|---|---|---|---|
| 181 | RGS authenticate | PASS | Inherited prior evidence (not all paths rerun): packages/rgs-requests/src/rgs-requests.ts:6–17; components-shared/.../Authenticate.svelte:16. 靜態 host/session 引數；本機 authenticate 已實測。真實 RGS 未測。 |
| 274 | Invalid rgs_url | AT RISK | Inherited prior evidence (not all paths rerun): packages/state-shared/src/stateUrl.svelte.ts:52 只取 URL；本次未做失效 host 的端到端試驗。 |
| 183 | Play request | PASS | Inherited prior evidence (not all paths rerun): packages/utils-xstate/src/createPrimaryMachines.ts:9–18；本次 stub MG/FG 實測，回放真實 math books；無實金下注。 |
| 275 | No Stake loader | PASS | Inherited prior evidence (not all paths rerun): src/components/LoadingScreen.svelte；character_fix_20261029 遊戲實測為 HARD TIME / SILVERSTARS STUDIO，非 Stake loader。 |
| 213 | Title restrictions | PASS | Inherited prior evidence (not all paths rerun): src/app.html；實際畫面 HARD TIME；沒有受限標題詞。 |
| 217 | Content | PASS | Inherited prior evidence (not all paths rerun): character_fix_20261029 的 source sheets、桌機／手機與 intro：成年囚犯／典獄長，沒有未成年人、裸露或血腥素材。 |
| 253 | Distinct title | NEEDS A HUMAN | Inherited prior evidence (not all paths rerun): 既有平台 rating=60；本次保留原角色及主題，原創性／相似度仍需平台人員判定。 |
| 242 | Dynamic bet config | PASS | Inherited prior evidence (not all paths rerun): packages/components-shared/src/components/Authenticate.svelte:66–95 讀 authenticate config/default；非本次改動。靜態判定，未重測全部幣別。 |
| 187 | Active round stake | PASS | Inherited prior evidence (not all paths rerun): packages/components-shared/src/components/Authenticate.svelte:120–121 讀 round.amount；本次未做真實 RGS 中斷。 |
| 219 | Currency display | AT RISK | Inherited prior evidence (not all paths rerun): packages/utils-shared/amount.ts:20–25：既有 10/14 審查要求 balance/bet 固定兩位，JPY 與此 self-check 的零小數範例不同。保留既有更具體審查要求；未逐幣別重測。 |
| 273 | Sub-cent wins | PASS | Inherited prior evidence (not all paths rerun): packages/utils-shared/amount.ts:118 起保留小額 win 精度，餘額與下注兩位；靜態。 |
| 221 | Zero-win end-round | PASS | Inherited prior evidence (not all paths rerun): packages/utils-xstate/src/createPrimaryMachines.ts:92–139：noWin 不 end-round，正賠付才 singleRoundWin/bonusWin。 |
| 222 | Insufficient balance | AT RISK | Inherited prior evidence (not all paths rerun): packages/state-shared/src/stateBet.svelte.ts:91；src/components/ui/ModalBuyBonus.svelte:106。靜態 affordability 有 gate；20 秒空白鍵與介於 ladder 的餘額本次未重測。 |
| 228 | Space shortcut | PASS | Inherited prior evidence (not all paths rerun): packages/components-ui-pixi/src/components/ButtonBet.svelte:127；EnableShortcuts.svelte:129–133 window listener/preventDefault。 |
| 227 | No scrolling | PASS | Inherited prior evidence (not all paths rerun): src/app.html:67–99 viewport、overflow hidden、touch-action；1280×720/390×844 實測。 |
| 104 | Autoplay confirmation | PASS | Inherited prior evidence (not all paths rerun): packages/components-ui-pixi/src/components/ButtonAutoSpin.svelte:34 先開 autoSpin modal。靜態。 |
| 31 | High-cost confirmation | PASS | Inherited prior evidence (not all paths rerun): src/components/ui/ModalBuyBonus.svelte；本次桌機與手機 RIOT BUY 300× 後仍須 CONFIRM，沒有單擊下注。 |
| 107 | All audio mute | NEEDS A HUMAN | Inherited prior evidence (not all paths rerun): src/components/Sound.svelte:600–620 同步 music/effect settings；尚需用耳確認全部音源在所有節點靜音。 |
| 25 | RTP/max win | PASS | src/game/config.ts:4 per-mode RTP/cost and caps matched current staged math CLI compliance; no math upload actions. Rules use generated config. {'base': {'rtp': 0.9605, 'cost': 1.0, 'max_win': 12000.0}, 'bonus': {'rtp': 0.9606, 'cost': 100.0, 'max_win': 12000.0}, 'bonus_hits': {'rtp': 0.9607, 'cost': 300.0, 'max_win': 12000.0}, 'bonus_epic': {'rtp': 0.9609, 'cost': 600.0, 'max_win': 12000.0}} |
| 24 | Symbol payouts | PASS | Inherited prior evidence (not all paths rerun): src/components/ui/ModalPayTable.svelte:105–108 從 config.symbols.paytable 產生；前次 100,000 books 全線獎比對已通過（optimization_20261029）。 |
| 26 | Win combinations | PASS | Inherited prior evidence (not all paths rerun): src/game/rulesText.ts:39–42：lights from own position down、multipliers >1 added、overlap doubled；既有線獎完整重算通過。 |
| 27 | Modes/costs | PASS | Inherited prior evidence (not all paths rerun): src/components/ui/ModalGameRules.svelte:125；upload math/index.json 成本1/100/300/600；本次 buy modal 正確。 |
| 29 | Free spins/retrigger | PASS | Inherited prior evidence (not all paths rerun): src/game/rulesText.ts:45 起；rulesCommon.ts:187：There is no limit to the number of free spins that can be won；實測8手及結算。 |
| 235 | Controls guide | PASS | Inherited prior evidence (not all paths rerun): src/components/ui/ModalGameRules.svelte:48–69；src/game/rulesCommon.ts:72–84 列 spin/stepper/amount/buy/auto/turbo/menu/info/settings/paytable/sound。靜態。 |
| 185 | Disclaimer | PASS | Inherited prior evidence (not all paths rerun): src/game/rulesCommon.ts:194；socialTerms.ts:82–83；正式 bundle 檢查有 TM and © 2026 Engine.。 |
| 266 | Mystery odds | N/A | Inherited prior evidence (not all paths rerun): upload math/index.json 只有 base/bonus/bonus_hits/bonus_epic，沒有 Mystery Mode 或顯示抽選機率。 |
| 193 | Laptop1024×576 | AT RISK | Inherited prior evidence (not all paths rerun): 本次角色驗收是1280×720，未把1024×576當已測；需另看此尺寸文字與操作。 |
| 195 | Popout400×225/800×450 | AT RISK | Inherited prior evidence (not all paths rerun): 本次未重錄這兩個確切尺寸；保留既有 responsive 實作，無宣稱新 PASS。 |
| 194 | Mobile425×812 | AT RISK | Inherited prior evidence (not all paths rerun): 本次390×844 MG/FG/entry/outro通過；425×812及真實touch裝置未重測。 |
| 223 | No doubletap zoom | PASS | Inherited prior evidence (not all paths rerun): src/app.html:67 maximum-scale=1,user-scalable=no，:99 touch-action manipulation。 |
| 239 | English | PASS | Inherited prior evidence (not all paths rerun): 本次桌機／手機 MG、buy/confirm、RIOT entry/outro 都為英文，無key/undefined/NaN；character_fix_20261029截圖。 |
| 240 | Invalid language fallback | PASS | Inherited prior evidence (not all paths rerun): packages/state-shared/src/stateUrl.svelte.ts:34–47 unknown code回en；src/game/rulesCommon.ts:41–43 規則頁也回en。靜態。 |
| 77 | Social words | AT RISK | Inherited prior evidence (not all paths rerun): src/game/socialTerms.ts:22–23 使用social pick；完整build social guard已通過。未重掃所有live畫面，不宣稱 runtime 全覆蓋。 |
| 78 | SC/GC formatting | PASS | Inherited prior evidence (not all paths rerun): packages/utils-shared/amount.ts:79–83 XGC→GC、XSC/XEC→SC，symbolAfter。靜態，非全部social畫面已重測。 |
| 225 | Social mode names | PASS | Inherited prior evidence (not all paths rerun): src/game/rulesText.ts:47起 Lockdown/Riot/Breakout，均無受限詞；socialTerms.ts控制buy稱呼。 |
| 188 | Social replay | AT RISK | Inherited prior evidence (not all paths rerun): 本次未跑 social replay 全流程；需平台 replay URL 或真實 books fixture。 |
| 171 | Replay end to end | AT RISK | Inherited prior evidence (not all paths rerun): packages/components-shared/.../Authenticate.svelte:138–181 分離replay/auth；createPrimaryMachines.ts:44 跳過end-round。靜態正向，未做平台重播。 |
| 172 | Replay optional params | AT RISK | Inherited prior evidence (not all paths rerun): src/components/ui/ReplayIntro.svelte:78 起顯示amount/cost；未逐 EUR/fr/amount 路徑重測。 |
| 173 | Replay again | AT RISK | Inherited prior evidence (not all paths rerun): 本次沒有重跑 replay finished→again。 |
| 174 | Replay costs | AT RISK | Inherited prior evidence (not all paths rerun): src/components/ui/ReplayIntro.svelte:78 起有base/costMultiplier；未做平台各mode重播比較。 |
| 243 | Replay small popout | AT RISK | Inherited prior evidence (not all paths rerun): 本次未重測400×225重播。 |

## House presentation and release evidence

- Source hashes in source-sha256.json match current files; staged-sha256.json proves stage==tested build. No character source/rig or art changes in this delta; existing acceptance remains relevant, not a claim of fresh all-motion QA.
- Runtime measured3 complete normal spins, median stop gap200ms, first-to-last about800ms. Desktop moving/settled and390x844 portrait screens viewed; caught window errors empty. Labelled stopped-reel check confirms5 stopped reels with no filter.
- Full current build and the Neon blur behavioral check passed. Existing type baseline warnings/errors, if any, remain in the build log; no baseline increase.
- Static social guard passed. Whole-modal runtime social/large-amount scan and pixel centering audit are not fully repeated (AT RISK). No text, UI coordinates or store art changed.

## Human checks

Content/originality, complete audio mute listening and older physical Android/iOS/touch/layout checks remain human verification where not covered by inherited evidence.

## Next step

Execute the exact current front plan and publish, as requested. Verify0 pending actions and get_game versions; do not update approval or submit review automatically.
