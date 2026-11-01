# Hard Time — 發布前官方自檢 2026-10-29

31 PASS · 14 AT RISK · 2 NEEDS A HUMAN · 1 N/A · 0 FAIL

本次靜態複查 + 同一版本剛完成的本機 stub 實測；不宣稱全套平台 RGS／重播／幣別皆已端到端測試。AT RISK 表示尚未重測的覆蓋缺口，非已證實缺陷。這次是既有遊戲更新發布，不更新審查單。沒有已知新的 FAIL 阻擋本次角色修正發布。

## 風險先列

- [274] Invalid rgs_url: AT RISK。packages/state-shared/src/stateUrl.svelte.ts:52 只取 URL；本次未做失效 host 的端到端試驗。
- [219] Currency display: AT RISK。packages/utils-shared/amount.ts:20–25：既有 10/14 審查要求 balance/bet 固定兩位，JPY 與此 self-check 的零小數範例不同。保留既有更具體審查要求；未逐幣別重測。
- [222] Insufficient balance: AT RISK。packages/state-shared/src/stateBet.svelte.ts:91；src/components/ui/ModalBuyBonus.svelte:106。靜態 affordability 有 gate；20 秒空白鍵與介於 ladder 的餘額本次未重測。
- [193] Laptop1024×576: AT RISK。本次角色驗收是1280×720，未把1024×576當已測；需另看此尺寸文字與操作。
- [195] Popout400×225/800×450: AT RISK。本次未重錄這兩個確切尺寸；保留既有 responsive 實作，無宣稱新 PASS。
- [194] Mobile425×812: AT RISK。本次390×844 MG/FG/entry/outro通過；425×812及真實touch裝置未重測。
- [77] Social words: AT RISK。src/game/socialTerms.ts:22–23 使用social pick；完整build social guard已通過。未重掃所有live畫面，不宣稱 runtime 全覆蓋。
- [188] Social replay: AT RISK。本次未跑 social replay 全流程；需平台 replay URL 或真實 books fixture。
- [171] Replay end to end: AT RISK。packages/components-shared/.../Authenticate.svelte:138–181 分離replay/auth；createPrimaryMachines.ts:44 跳過end-round。靜態正向，未做平台重播。
- [172] Replay optional params: AT RISK。src/components/ui/ReplayIntro.svelte:78 起顯示amount/cost；未逐 EUR/fr/amount 路徑重測。
- [173] Replay again: AT RISK。本次沒有重跑 replay finished→again。
- [174] Replay costs: AT RISK。src/components/ui/ReplayIntro.svelte:78 起有base/costMultiplier；未做平台各mode重播比較。
- [243] Replay small popout: AT RISK。本次未重測400×225重播。
- [house-centre] Optical centring: AT RISK。本次修正包含手機feature panel88%寬並已目視；沒有本輪 ui_center_audit.js 所有plate>=1px量測。

## 完整表

| ID | Guideline | Verdict | Evidence |
|---|---|---|---|
| 181 | RGS authenticate | PASS | packages/rgs-requests/src/rgs-requests.ts:6–17; components-shared/.../Authenticate.svelte:16. 靜態 host/session 引數；本機 authenticate 已實測。真實 RGS 未測。 |
| 274 | Invalid rgs_url | AT RISK | packages/state-shared/src/stateUrl.svelte.ts:52 只取 URL；本次未做失效 host 的端到端試驗。 |
| 183 | Play request | PASS | packages/utils-xstate/src/createPrimaryMachines.ts:9–18；本次 stub MG/FG 實測，回放真實 math books；無實金下注。 |
| 275 | No Stake loader | PASS | src/components/LoadingScreen.svelte；character_fix_20261029 遊戲實測為 HARD TIME / SILVERSTARS STUDIO，非 Stake loader。 |
| 213 | Title restrictions | PASS | src/app.html；實際畫面 HARD TIME；沒有受限標題詞。 |
| 217 | Content | PASS | character_fix_20261029 的 source sheets、桌機／手機與 intro：成年囚犯／典獄長，沒有未成年人、裸露或血腥素材。 |
| 253 | Distinct title | NEEDS A HUMAN | 既有平台 rating=60；本次保留原角色及主題，原創性／相似度仍需平台人員判定。 |
| 242 | Dynamic bet config | PASS | packages/components-shared/src/components/Authenticate.svelte:66–95 讀 authenticate config/default；非本次改動。靜態判定，未重測全部幣別。 |
| 187 | Active round stake | PASS | packages/components-shared/src/components/Authenticate.svelte:120–121 讀 round.amount；本次未做真實 RGS 中斷。 |
| 219 | Currency display | AT RISK | packages/utils-shared/amount.ts:20–25：既有 10/14 審查要求 balance/bet 固定兩位，JPY 與此 self-check 的零小數範例不同。保留既有更具體審查要求；未逐幣別重測。 |
| 273 | Sub-cent wins | PASS | packages/utils-shared/amount.ts:118 起保留小額 win 精度，餘額與下注兩位；靜態。 |
| 221 | Zero-win end-round | PASS | packages/utils-xstate/src/createPrimaryMachines.ts:92–139：noWin 不 end-round，正賠付才 singleRoundWin/bonusWin。 |
| 222 | Insufficient balance | AT RISK | packages/state-shared/src/stateBet.svelte.ts:91；src/components/ui/ModalBuyBonus.svelte:106。靜態 affordability 有 gate；20 秒空白鍵與介於 ladder 的餘額本次未重測。 |
| 228 | Space shortcut | PASS | packages/components-ui-pixi/src/components/ButtonBet.svelte:127；EnableShortcuts.svelte:129–133 window listener/preventDefault。 |
| 227 | No scrolling | PASS | src/app.html:67–99 viewport、overflow hidden、touch-action；1280×720/390×844 實測。 |
| 104 | Autoplay confirmation | PASS | packages/components-ui-pixi/src/components/ButtonAutoSpin.svelte:34 先開 autoSpin modal。靜態。 |
| 31 | High-cost confirmation | PASS | src/components/ui/ModalBuyBonus.svelte；本次桌機與手機 RIOT BUY 300× 後仍須 CONFIRM，沒有單擊下注。 |
| 107 | All audio mute | NEEDS A HUMAN | src/components/Sound.svelte:600–620 同步 music/effect settings；尚需用耳確認全部音源在所有節點靜音。 |
| 25 | RTP/max win | PASS | src/components/ui/ModalGameRules.svelte:125 起讀生成 config；stakecli compliance=base96.05%,bonus96.06%,bonus_hits96.07%,bonus_epic96.09%；math gate max12,000×。 |
| 24 | Symbol payouts | PASS | src/components/ui/ModalPayTable.svelte:105–108 從 config.symbols.paytable 產生；前次 100,000 books 全線獎比對已通過（optimization_20261029）。 |
| 26 | Win combinations | PASS | src/game/rulesText.ts:39–42：lights from own position down、multipliers >1 added、overlap doubled；既有線獎完整重算通過。 |
| 27 | Modes/costs | PASS | src/components/ui/ModalGameRules.svelte:125；upload math/index.json 成本1/100/300/600；本次 buy modal 正確。 |
| 29 | Free spins/retrigger | PASS | src/game/rulesText.ts:45 起；rulesCommon.ts:187：There is no limit to the number of free spins that can be won；實測8手及結算。 |
| 235 | Controls guide | PASS | src/components/ui/ModalGameRules.svelte:48–69；src/game/rulesCommon.ts:72–84 列 spin/stepper/amount/buy/auto/turbo/menu/info/settings/paytable/sound。靜態。 |
| 185 | Disclaimer | PASS | src/game/rulesCommon.ts:194；socialTerms.ts:82–83；正式 bundle 檢查有 TM and © 2026 Engine.。 |
| 266 | Mystery odds | N/A | upload math/index.json 只有 base/bonus/bonus_hits/bonus_epic，沒有 Mystery Mode 或顯示抽選機率。 |
| 193 | Laptop1024×576 | AT RISK | 本次角色驗收是1280×720，未把1024×576當已測；需另看此尺寸文字與操作。 |
| 195 | Popout400×225/800×450 | AT RISK | 本次未重錄這兩個確切尺寸；保留既有 responsive 實作，無宣稱新 PASS。 |
| 194 | Mobile425×812 | AT RISK | 本次390×844 MG/FG/entry/outro通過；425×812及真實touch裝置未重測。 |
| 223 | No doubletap zoom | PASS | src/app.html:67 maximum-scale=1,user-scalable=no，:99 touch-action manipulation。 |
| 239 | English | PASS | 本次桌機／手機 MG、buy/confirm、RIOT entry/outro 都為英文，無key/undefined/NaN；character_fix_20261029截圖。 |
| 240 | Invalid language fallback | PASS | packages/state-shared/src/stateUrl.svelte.ts:34–47 unknown code回en；src/game/rulesCommon.ts:41–43 規則頁也回en。靜態。 |
| 77 | Social words | AT RISK | src/game/socialTerms.ts:22–23 使用social pick；完整build social guard已通過。未重掃所有live畫面，不宣稱 runtime 全覆蓋。 |
| 78 | SC/GC formatting | PASS | packages/utils-shared/amount.ts:79–83 XGC→GC、XSC/XEC→SC，symbolAfter。靜態，非全部social畫面已重測。 |
| 225 | Social mode names | PASS | src/game/rulesText.ts:47起 Lockdown/Riot/Breakout，均無受限詞；socialTerms.ts控制buy稱呼。 |
| 188 | Social replay | AT RISK | 本次未跑 social replay 全流程；需平台 replay URL 或真實 books fixture。 |
| 171 | Replay end to end | AT RISK | packages/components-shared/.../Authenticate.svelte:138–181 分離replay/auth；createPrimaryMachines.ts:44 跳過end-round。靜態正向，未做平台重播。 |
| 172 | Replay optional params | AT RISK | src/components/ui/ReplayIntro.svelte:78 起顯示amount/cost；未逐 EUR/fr/amount 路徑重測。 |
| 173 | Replay again | AT RISK | 本次沒有重跑 replay finished→again。 |
| 174 | Replay costs | AT RISK | src/components/ui/ReplayIntro.svelte:78 起有base/costMultiplier；未做平台各mode重播比較。 |
| 243 | Replay small popout | AT RISK | 本次未重測400×225重播。 |
| static | Static hosts | PASS | 正式 staged index 無 stub.local/local QA injection；43角色檔雜湊與build一致，資產路徑為本地assets。 |
| wins | Wins vs math | PASS | optimization_20261029 完整book/lookup與2,284,946筆線獎核對；本次 math gate/CLI compliance PASS。數學檔與平台scratch 9/9一致。 |
| console | Console | PASS | character_fix_20261029/console-errors.json=[]；桌機與手機兩次完整FG流程。 |
| house-centre | Optical centring | AT RISK | 本次修正包含手機feature panel88%寬並已目視；沒有本輪 ui_center_audit.js 所有plate>=1px量測。 |
| house-ghost | Cast ghosts | PASS | character_fix_20261029/REPORT.md：35來源層亮暗底、8clips實際渲染968張；source continuity及runtime hashes guard通過。 |
| house-beats | Feature cast motion | PASS | src/components/FreeSpinIntro.svelte:CastSpine inline intro；desktop_intro_peak.png實際最大動作；保留同一rig/animation。 |
| house-character | Zero visible defects | PASS | character_fix_20261029/REPORT.md/desktop_peak.png/portrait_fg_peak.png：修正後來源、過渡與極值、MG/FG/cut-ins目視無殘影、碎片、洞與分離。 |

## 人工項目

- #253：平台對與既有遊戲的相似度及原創性作最終判定，本次不新增主題。
- #107：用耳逐一確認主盤、feature、大獎、ambient全部可靜音。

## 平台比較及下一步

get_game_before.json顯示目前最高front v18、math v3、rating60、approval.open=false。plan_upload前端16上傳、1刪除舊JS、156不變，數學9不變；此包是前一輪驗收的同一177檔雜湊版本。授權為使用者「做完的話上傳發布」，依明確指示執行upload/publish，不更新關閉的審查單。剩餘AT RISK項目若要送新一輪審查，應補測；不把本次publish當成新審查已通過。
