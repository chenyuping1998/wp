# Turf War — 交接文件

## 2026-10-30 — 數字壓圖修正（skill 步驟 5 第 7 項），已上傳並發布 front v31

- 直式載入頁：`5X4, 14 LINES — MAX WIN 20,000X` 與提示列原本壓在人物胸口／褲子上。`LoadingScreen.svelte` 直式時文字移到上方空白牆面（logo 0.13H），人物改站下方 58% 高；橫式不變。
- 320×568 開場卡：工作室徽章蓋住 `MAX WIN 20,000×`。`IntroFeatures.svelte` 的 `measure` 在直式時上下各預留徽章高度。
- 已確認無問題：購買卡（100×/500×/1000× 在牆面平坦處）、賠率表、50× 標籤（自帶底板）。
- 證據：`design/qa/number_audit_20261030/`。upload/TurfWar/frontend 已更新（只有 bundle／index 改變），10-30 Stone 同意後 stakecli 上傳（4 actions，重新 plan 0）並發布 front v31；數學不變，未動審查版本。

## 2026-10-16 — 打手收手握棒修正

已實作 `design/cast_brief_street/mg/REARM_REQUEST.md`：原生 imagegen 重畫右臂、球棒、
手指三層，右肘改 (305,770)、握點改 (395,615)，其餘五層像素及 Kingpin 保留。
重建三模式 MG 骨架、載入圖／單人物縮圖／雙人物 cover；完整 build 與全部 guard 通過。
正式資料夾 `/Users/stone/stake-engine/upload/TurfWar/` 已更新前端及縮圖／封面，
math 不變、未產生 ZIP、平台尚未更新。驗證數據／原圖／提示詞／備份與重跑方式：
`design/MG_REARM_STATUS.md`。本段取代下方「upload 未更新」的歷史狀態。

## 2026-10-16 — 剩餘美術接線

依 `design/ART_REQUEST_REMAINING.md` 補生並接入兩位不同的街頭角色（MG 8 層、FG 6 層）、
四款錢袋框角、三張近景線稿，以及新版載入人物／縮圖／cover。原生 imagegen 原圖與提示詞
均留在 `_incoming/street_cast/`，可重跑的註冊、裁切、骨架與合成流程見
`design/STREET_REMAINING_STATUS.md`。本輪取代下方「角色／框角仍待交付」的狀態。

角色已朝盤面，不再 flip；FG 移除舊 ±12° A-pose 補償，整套角色關閉光暈。
兩位圖層驗收通過；MG／FG colors95 = 45／40，soft = 24.8%／26.1%。
裁切 UV 與 motion guard 已對齊；完整 build／全部 guard 通過。桌機 Lookout／Muscle、
390×844 手機 Kingpin 都已結算並返回一般局，遊戲 console error 為零；詳見 status。
新素材留在 app／design 與本地 dist；**math、upload/TurfWar、zip 與平台都未更新**。

## 2026-10-15 — v2 正式接線（取代下方「等待風格定稿」狀態）

`ART_BRIEF.md` v2 已明確記錄打樣通過。本輪直接實作程式端並補生第一批八張符號、
倉庫／頂樓兩張場景與商店背景，未再要求風格確認。詳細範圍、過渡素材與重跑方式：
`design/STREET_V2_STATUS.md`；原圖／處理輸出在 `_incoming/street_batch{1,3}`、`_street/`。

已接：白邊貼紙盤面／UI、Bungee 即時 Logo／標題、Permanent Marker 倍數、WILD 文字、
平塗金額、落地拍貼、貼紙翹角／小圖重描、Bruiser 噴漆與紅膠帶黏住標記、四邊 Bag／
Big Score 貼帶、大獎逐張疊貼、鐵捲門鎖住後踹開。移除背景 blur／vignette／環境光束、
小圖浮雕邊、數字 glow。MG／FG 仍為兩人，暫以保留原 alpha 的灰階圖層沿用已驗證骨架。

本地實播抓到並修掉：後加入獎牌蓋住金額（獎牌獨立容器）、重描／貼帶動態 mask 銷毀後
Pixi GPU context uid 為 null（改平面揭露，不再使用動態 mask）、手機入口 rem 字級僅 7.92px
（固定 11px）、手機 FG 說明卡過窄（portrait 寬度 86%）。

完整 build／全部 guard 綠；12 組 win／land 差異檢查維持門檻 0.9，最近距離 1.02／0.93。
第一批圖通過 v2 colors95／soft／chroma 限制，H3 過多色階已處理、H4 改正為洋紅主色。
review-tags：0 FAIL、24 WARN；平塗 UI 是 v2 明定語言，角色 WARN 保留為未完成正式分層圖。
桌機本地 BASE book 1 Bruiser 正常；book 11 Lookout（再觸發至 12 手）／29 Muscle 皆回到一般局，
總回報 $22.00／$259.90 與 fixture 相符。手機 Kingpin book 50 與修正後 GPU 檢查見 status 文件。

本地預覽 `dist/turfwar-street-v2/`，`design/stage_street_playtest.py` 僅在 dist 加 stub／QA 工具。
舊圖完整備份 `design/_legacy_assets/pre_street_v2/`。**框角落插畫、新角色分層與最終商店 FG／cover
仍待交付；不是最終美術版。math、upload/TurfWar 與平台均未更新，沒有產生 zip。**

## 2026-10-15 — 街頭貼紙六件打樣與本地接線

依 `design/STYLE_TEST_STREET.md` 完成 H1、L1、W、SW、灰階後巷、角色頭像六件打樣。
原始生成圖在 `design/_incoming/style_test_street/`；色票量化、去藍幕與 512px 輸出在
`design/_style_test_street/`，附提示詞、70/96px 檢視、200px 大廳研究圖、hash/量測及 README。
重跑：`design/build_street_style_test.py --stage-playtest`（math-sdk Python）。

本地預覽：`dist/turfwar-street-test/`，以既有遊戲編譯結果測試四個新符號與 MG 線稿背景。
1280×720 實播一般局與固定 BASE book 1（Bruiser），正常回到待機，四格新指虎顯示正常，
該段 console error 0。這仍混用舊框、UI、其他符號和人物，不能當成整套完成。
另實播 Lookout：retrigger 10→14 手、14/14 結算 $56.70，點擊返回，console error 0。
H1/W/SW colors95 舊 210/201/252 → 新 30/32/24；背景平均亮度 196.68/255（77.13%）。

整套接線須處理 `Game.svelte` 的背景 blur/vignette、`SymbolArt.svelte` 小圖舊 rim/shadow，
並補 runtime WILD 字樣。新角色只有風格頭像，未冒充新人物 rig。動畫仍是原版；貼紙拍落／
翹角、噴漆 Bruiser、撕貼 Big Score、貼牆 FG 轉場尚待風格定稿後整套實作。
已向使用者呈現實際樣品並詢問是否以此展開整套。正式 static、math、upload 與平台均未更新。

最後更新：2026-09-06（scaffold 完成：從 CapoNostra 複製 app + math game，改 game_id /
working_name / package 名 / dev port，dev server 開起來 canvas 有 mount、無 ReferenceError、
只剩沒帶 RGS session 的預期 fetch 失敗）。

Capo Nostra 的原交接文件保留在 [HANDOFF_capo_nostra_reference.md](HANDOFF_capo_nostra_reference.md)。
本檔只記 Turf War 相對 Capo Nostra 的改動與每個階段的實際數字。

跑這次換皮用的是 `wp/.claude/skills/game-reskin`。

---

## 0. 決策（已跟使用者確認）

- **來源**：`wp/apps/CapoNostra` + `math-sdk/games/capo_nostra`
- **主題 / 名稱**：**Turf War**（`game_id = turf_war`、`working_name = "Turf War"`）。
  小混混街頭火拚風的黑幫題材，不是 Capo Nostra 的西裝大佬大理石風。
- **限制字檢查**：Turf War、Loot Bag、Big Score、Bruiser、Brass Knuckles、Boombox、
  Lookout / Muscle / Kingpin 都不在 `check_social_words.mjs` 的 RESTRICTED 表內。
  （scaffold 後尚未實跑 script，theming 階段會跑。）

### 角色對應（引擎行為不變，只換皮）

| 角色 | Capo Nostra | Turf War |
|---|---|---|
| 倍數框（金匡） | Vault Frame | **Loot Bag**（一袋贓物，倍數噴漆在上面） |
| 全盤框（新增） | 無 | **The Big Score**：整個 5×4 變一個大 Loot Bag，帶預中動畫 |
| 擴展 Wild `SW` | Tommy Gun | **The Bruiser**（拿球棒衝直行把整行砸成 WILD）；頂檔黏著 |
| 一般 Wild `W` | Fedora | **Brass Knuckles**（指虎） |
| Scatter `S` | Vault 轉盤 | **Boombox**（放大聲叫人，3/4/5 → 三檔） |
| 三檔階梯 | soldier / capo / don | **Lookout / Muscle / Kingpin** |

---

## 1. 規格差異 — Capo Nostra → Turf War

| # | 改動 | 從 | 到 |
|---|---|---|---|
| 1 | base 回報結構 | base 有實際的線中獎頻率與大小 | 降低 base 線中獎的頻率與大小；**拉高免費遊戲觸發率**補回體感 |
| 2 | 頂檔（5 scatter / 1000× buy = `bonus_epic`） | 每手保證一個擴展 Wild | **取消每手保證**；當手有落地的 Bruiser，就把該行變 WILD，且**這些 WILD 黏著到 feature 結束** |
| 3 | 全盤框（新增） | 框只有 1×1 / 2×2 / 3×3 | 新增稀有結果：**整個盤面 = 一個框**，帶高倍數，base 與免費遊戲都可能出，出現時要有**預中／build-up 動畫** |
| 4 | 框密度 | 框是招牌機制 | 框**略微變稀有**；**擴展 Wild 變成主軸** |
| 5 | RTP 水位 | ~94.58% base / 94.63–94.78 buys | **再降 1%** → ~93.58% base / ~93.6–93.8 buys，跨距維持 ≤0.5% |

- Big Score 框倍數階梯目標：**5×–50×**（"punchy" 檔，稀有、命中有明顯 spike）。
  實際 ladder 在 math 階段定，要順便量 5,000x / 10,000x 尾端機率。
- #2 與 #3 也有前端工作（黏 Wild 的持續狀態、Big Score 的 build-up beat），
  所以這次比純數學微調多一點。

### 尚未定、math 階段要決定的細節

- #2：黏 Wild 只套 Kingpin（頂檔）？還是 Muscle 也要？（目前理解：只頂檔）
- #3：Big Score 是第 4 種框「size」（整盤）還是獨立事件？倍數 ladder 的權重。
- #3 預中動畫：哪些手會觸發 build-up、鎖格順序 —— presentation 階段處理。
- #1 與 #5 交互：#1 當「重分配」、#5 當「整體降 1 個百分點」，retarget 時合併處理。

---

## 2. Scaffold 已做

- `math-sdk/games/turf_war/`：從 `capo_nostra` rsync（排除 `library/`、`__pycache__/`）。
  改了 `game_config.py` 的 `game_id` / `working_name`、`run.py` docstring。其餘（paytable、
  14 payline、reel 帶、betmode 結構、game_optimization slices）仍是 Capo Nostra 原樣 —— 下個階段才動。
- `wp/apps/TurfWar/`：從 `CapoNostra` rsync（排除 `node_modules/`、`.svelte-kit/`、`build/`、
  `design/` 底下的美術中間產物）。改了 `package.json` 的 `name`（`turf-war`）、dev port
  3013→**3016**、storybook 6013→**6016**。
- `.claude/launch.json`：加了 `turfwar-dev`（3016）與 `turfwar-playtest`（4196，dist 目錄待建）。
- `pnpm install`（root）已跑，lockfile 已含 `turf-war`。
- Dev server（`pnpm --dir wp/apps/TurfWar dev`）：canvas mount OK（1600×1200）、無
  ReferenceError／module-eval crash、rules 文字有 render。唯一 error 是沒帶 RGS session 的
  `Failed to fetch`（跟 CapoNostra 直接開一樣，屬預期）。可玩實測要等 math 產出 books 後用
  playtest shell。

### 還沒改（下一階段起）

- app 內大量 `capo` / `CapoNostra` / `capo_nostra` 參照（~27 個檔），含 `betModeMeta.ts` 的
  `CAPO_NOSTRA_BET_MODE_META`、`config.ts`（generated，要重跑 math 後 sync）、`app.html` /
  `title` 還是 "Capo Nostra"。
- app 內有一份 `math/` 快照，帶 Hot Miami 殘留（`WCAP_OD.csv`、`FR_OD.csv`、
  `_buy_mode` 註解裡的 "Neon Nights" / "Ocean Drive"）—— dead-asset audit 階段清。
- 所有主題美術、字型、配色、角色 rig、轉場 set-piece。

---

## 2.5 Math — 引擎與設定改動（2026-09-06，已做，尚未跑完整 optimizer）

決策（跟使用者確認）：
- #2 黏 wild：**整條展開的行**都黏，到 feature 結束，只套 Kingpin（`don` tier）。
- #3 Big Score：**~1/120**，base + 免費遊戲都有，5×–50× ladder（"punchy"）。

已改：
- `game_config.py`：`rtp` 0.9458→**0.9358**；buy modes 0.9463/67/78→**0.9363/67/78**；
  新增 `fullboard_frame_ladder = {5:40,8:30,12:18,20:9,30:3,50:1}` 與 `fullboard_frame_chance = 1/120`；
  `tier_guaranteed_wild` 全 False；新增 `tier_sticky_wilds = {..., "don": True}`；
  base 盤 `frame_counts` 調稀（`{0:60,1:30,2:10}`→`{0:74,1:21,2:5}` 等，#4）；
  `fullboard_chance` 注入 `basegame` 與三個 `freegame_*` distribution（以及 `_buy_mode` 的 group）。
- `game_optimization.py`：base slices retarget（#1+#5）——
  soldier 0.19731 hr220、capo 0.10134 hr1100、don 0.10134 hr4400、basegame 0.53431 hr4.0，
  wincap 0.0015，**sum = 0.9358**。`verify_optimization_input` **PASS**。
  scaling buckets（freegame_strong 的尾端抑制）**維持 Capo 原值不動** —— 第一輪跑完量尾端再調。
- `game_calculations.py`：`frame_cells` 說明更新（Big Score 不走這裡）。
- `game_executables.py`：新增 `draw_fullboard_frame` / `clear_big_score` /
  `restore_sticky_wilds` / `record_sticky_wild_columns`；`apply_frames_to_board` 最後套 big_score
  覆蓋當手每格。
- `game_override.py`：`reset_book` 加 `big_score` / `sticky_wilds_enabled` / `sticky_wild_cells`。
- `game_events.py`：新增 `bigScore`、`stickyWilds` 事件（`--allow-event` 清單已更新）。
- `gamestate.py`：base 與 free 迴圈接上 Big Score 與黏 wild；事件順序
  `reveal → wildExpand → stickyWilds → updateFrames → newFrames → bigScore → winInfo → frameDoubling`。

Smoke（3k base + 各 800–1500 buy，無 optimizer）：全部產出、無 crash。新事件都有出：
`bigScore` mults 照 ladder 分布；`stickyWilds` **只** 出現在 Kingpin；`bigScore` 不出現在 losing 手。

### 完整 optimizer 跑完（2026-09-06）—— 結果健康，比 Capo Nostra 出貨版還緊

`run.py` 全跑（40k base + 各 20k buy，Rust optimizer，~3 分鐘 books + 秒級 optimizer）。

| 指標 | base | bonus | bonus_hits | bonus_epic |
|---|---|---|---|---|
| RTP（達標） | 0.9358 | 0.9363 | 0.9367 | 0.9378 |
| max win 可達 | 20000x ✓ | ✓ | ✓ | ✓ |
| book / LUT 一致 | 0 mismatch | 0 | 0 | 0 |
| p(≥5000x) | 6.4e-7 | 2.7e-5 | 6.4e-4 | **2.5e-3** |
| p(≥10000x) | 2.4e-7 | 7.9e-6 | 2.1e-4 | **1.2e-3** |

RTP 跨距 0.20%（限 0.5%）。`check_math_bundle.py` 全過。

**尾端機率沒問題。** Capo Nostra 被 Stake 打回時 `bonus_epic` 的 p(≥5000x)/p(≥10000x) 是
**0.0496 / 0.0249**；調過之後出貨版是 **3.2e-3 / 1.5e-3**。Turf War 是 **2.5e-3 / 1.2e-3**，
比出貨的 Capo Nostra 還低 —— 因為 Big Score 封在 50x、黏 wild 雖然讓很多手打到 cap 但單一 book
的賠付有上限，optimizer 把權重攤薄了。

SDK 的 `rgs_verification` 會印 `VIOLATED: etl10k VALUE:17.11 LIMIT:0.8`（bonus_hits 3.13）——
但這是**既有的**非阻擋性本地檢查：Capo Nostra 出貨版跑同一支檢查是 **21.7 / 3.2**，一樣「VIOLATED」，
一樣送審了。真正的 ship gate 是上面那兩個 dashboard p 值，都過。

**機制驗證**（`design/check_mechanics.py`，跑每次重生都要跑）：
- Big Score：9,150 個中獎 spin 全部 line-multiplier == 中獎格數 × 倍數（全盤覆蓋正確）
- 黏 wild：只出現在 `don`／Kingpin，held set 只增不減，每格後續每手都 render 成 W
- 100,000 books，0 問題

前端 `src/game/config.ts` 已 sync（`sync_math_config.py` 的 GAME_ID 已改 turf_war，rtp 0.9358）。

**Math 階段完成。** 若之後美術／體感調整要動 volatility，重跑 `run.py` → `check_math_bundle.py`
→ `check_mechanics.py` → `sync_math_config.py`。

## 3. 階段計畫（依 game-reskin skill）

1. ~~Scaffold~~ ✅
2. ~~**Math**~~ ✅（見 §2.5）。
3. **美術第一版**（使用者生成）：63 個資產、已接進 registry、`pnpm build` + 全 guard 綠。
   待修：`h2` 偏藍、`L1–L4` 厚鏽圓框、`h3` 過重。
4. ~~**打包**~~ ✅（`design/ship.sh` 可重跑）。

## 2.6 第二輪修改（2026-09-06，使用者上傳後的回饋）

**#4 Big Score 改頻繁 + 死手也出**（math）：`fullboard_frame_chance` 1/120→**1/70**；
criteria `"0"`（losing）也加 `fullboard_chance` —— 全盤框在沒中線的手也會出（純預中動畫、不賠）。
重跑 optimizer：RTP 仍 0.9358/0.9363/0.9367/0.9378，`check_math_bundle` + `check_mechanics` 全過。
尾端 p(≥5000x)：bonus_epic 2.5e-3→**3.8e-3**（仍在 Capo Nostra 出貨版 3.2e-3 的同級、遠低於 dashboard 上限）；
SDK `etl10k` 警告 17→23（同 Capo 一樣非阻擋）。

**#2 黏 wild 表演**（前端）：新增 `stickyWilds` / `bigScore` book event（`typesBookEvent.ts`、
`bookEventHandlerMap.ts`），`stateGame.stickyWildReels`（累積、只在 bonusTier/freeSpinEnd 清）＋
`stickyWildCells`＋`bigScoreMult`。`WildColumns.svelte` 加一層**常駐的鎖鍊 overlay**
（`turfWildLocked` = `turfFx/sw_locked.png`，慢速呼吸脈動），展開 beat 對「已經黏住的軸」不再重播 ——
黏住的行會一直留在盤面到 feature 結束，而不是每手同位置重轉。`createBonusSnapshot`（replay/resume）
也重建黏 wild 狀態。`build green`、`sw_locked.png` 已 preload。
**✅ 已用 `?hmdebug=1` 的 `__HM_EMIT__` 逐層驗過（2026-09-06）：**
- 免費遊戲計數器（"FREE SPINS n/10" 鏽鐵牌）：正常
- feature 開場 splash（鏽鐵招牌 + "PRESS ANYWHERE TO CONTINUE"）：正常
- **黏 wild overlay**：`stickyWildsHold` → 每條黏住的軸畫出鎖鍊 + 紅色 X 連結 + 微弱紅色脈動，
  正常渲染。展開 beat 對已黏住的軸不重播。
- 展開 beat（紅光/火花）：正常

之前 click 驅動看不到，是因為：(1) Browser pane 中途變 hidden，canvas 點擊無法歸屬到 frame，
買 bonus 的點擊常常沒中、feature 根本沒觸發；(2) 開場 splash 是「點任意處繼續」，我點盤面時
把它立刻關掉了；(3) feature 自動快播 ~15-20s，每 6-12s 截一張剛好都截在空檔。

小調：鎖鍊 overlay 目前偏淡（鏈子細、紅色淡），要更明顯可以調 `WildColumns.svelte` 裡
held layer 的 `alpha` / tint。

**#1 買 bonus 描述 + copy audit**（前端，已在瀏覽器確認）：
- `betModeMeta.ts` / `featureTiers.ts` / `ModalBuyBonus.svelte`：Kingpin 從「每手保證 Bruiser」
  改成「3 sticky Frames + sticky Wild columns」／「每條 Bruiser 展開的行黏到 feature 結束」
- `ModalGameRules.svelte`：Kingpin 段改寫；**新增 The Big Score 段**
- `IntroFeatures.svelte`：**新增 THE BIG SCORE 面板**；FREE SPINS 面板 Kingpin 描述改寫
- `LoadingScreen.svelte`：TIPS 加 Big Score、Kingpin 改黏 wild
- FreeSpinIntro / socialTerms / ReplayIntro：無殘留機制 copy（用 featureTiers 的字串）

**#5 dead-asset**（部分）：`turfTitle{Lookout,Muscle,Kingpin}` key 改名（featureTiers + assets.ts，
`check_feature_titles` 過）；刪 `static/fonts/Cinzel.ttf` + `Cinzel-OFL.txt`（TITLE_FONT 已是 Oswald）。
**仍待清**（inert、內部路徑，另開一輪帶驗證）：`sprites/hotMiamiParts/`（符號分件動畫，`symbolParts.ts`
已停用）＋其 registry entries、`sprites/capoFx/fx_*`（4 張，待重上色）、`sprites/capoCast/`、
`audio/capo/`（game 實際用 `audio/turf/`，但 sound map 名稱還指 capo set）、其餘 `hm*`/`capo*` registry key、
math 的 `force_special_wild`/`guaranteed_wild` 死枝（`tier_guaranteed_wild` 全 False）。

打包已用第二輪的 build/math 重跑（`upload/TurfWar-*.zip`，2026-09-06 22:34）。

## 2.7 第三輪（2026-09-06，使用者回饋：paytable odds 再降、擴展 wild/Big Score 更多、
##      轉輪帶要有高賠付堆疊、開場只留三格）

**paytable odds ↓ / 兩個招牌機制 ↑**：
- `make_reels.py` `BASE_COMPOSITION["SW"]` `[0,1,1,1,0]` → **`[0,2,2,2,0]`**（中間三軸 Bruiser 密度加倍，
  base 落地率 ~24.5% → ~40%+）；L1 讓格補償（`[9,9,9,9,9]`→`[9,8,8,8,9]`），TRIGGER 的 L1/L2
  跟著重算保持每軸 64。FR0 的 SW 不動（Kingpin 黏 wild 已經夠展示）。
- `fullboard_frame_chance` 1/70 → **1/50**。
- `game_optimization.py` base slices 再往 feature 挪：
  soldier hr 220→**185** rtp 0.19731→**0.230**；capo hr 1100→**920** rtp→**0.115**；
  don hr 4400→**3700** rtp→**0.115**；basegame hr 4.0→**4.8** rtp 0.53431→**0.47430**。
  feature share 40.0% → **49.2%**。sum = 0.9358，`verify_optimization_input` PASS。

**高賠付堆疊（memory points）**：`make_reels.py` 新增 `inject_high_stacks()` —— despace 之後
在每條 strip（WCAP 除外）刻意放 2–4 處 H 符號的 2–3 格短堆疊，純排列（符號數不變、strip 長度不變）、
永不動到 W/S/SW。實測每軸 1–4 個 H 相鄰、最長 3。

**開場頁三格**：`IntroFeatures.svelte` 拿掉 FREE SPINS 那格 —— 現在只有
LOOT BAGS / THE BRUISER / THE BIG SCORE。免費遊戲三檔說明仍完整在 rules modal + 開場 splash。

第三輪 optimizer 跑完（40k + 各 20k）：
| 指標 | base | bonus | bonus_hits | bonus_epic |
|---|---|---|---|---|
| RTP | 0.9358 | 0.9363 | 0.9367 | 0.9378 |
| p(≥5000x) | 8e-7 | 3.2e-5 | 8.7e-4 | **2.1e-3** |
| p(≥10000x) | 3e-7 | 1e-5 | 2.7e-4 | **1.0e-3** |

尾端反而比第二輪更緊（bonus_epic 3.8e-3→2.1e-3），也低於 Capo Nostra 出貨版（3.2e-3）——
更頻繁但封 50x 的 Big Score + 更多 base SW + H 堆疊把權重攤到中段。`check_math_bundle` +
`check_mechanics`（100k books）全過。SDK `etl10k` 23→15（同 Capo 一樣非阻擋）。
base 中獎率 ~1/4.6（paytable odds 確實降了）。

打包 `upload/TurfWar-*.zip` 已用第三輪 build/math 重跑（2026-09-06 23:09）。playtest stub 也重生。

## 2.8 第四輪（2026-09-06，使用者澄清「odds」＝ paytable 賠付數值本身）

使用者指的「odds 調低」= **`game_config.py` `self.paytable` 的每個賠付值**（賠付表 modal 上
5×/4×/3× 那些數字），不是中獎率。已記進 memory `odds-means-paytable.md`。

**paytable 全面砍約一半**（維持階梯單調）：
| combo | 舊 | 新 |
|---|---|---|
| 5×W / 5×H1 | 400 | 250 |
| 4×H1 / 3×H1 | 100 / 40 | 50 / 15 |
| 5×H2 / 4 / 3 | 200 / 60 / 20 | 120 / 25 / 8 |
| 5×H3 / 4 / 3 | 50 / 20 / 4 | 25 / 8 / 2 |
| 5×H4 / 4 / 3 | 30 / 10 / 2 | 15 / 4 / 1 |
| 5×H5 / 4 / 3 | 10 / 4 / 1 | 5 / 2 / 0.5 |
| 5×L / 4 / 3 | 2 / 1 / 0.4 | 1 / 0.5 / 0.2 |

optimizer 仍把每檔 RTP 鎖在目標，所以這等於把「一條線中獎」變成螢幕上更小的數字，
回報改由 Bruiser 直行 / Loot Bag / Big Score / 觸發率承接。同輪把 slices 再往 feature 挪：
soldier hr 185→**165** rtp→**0.245**；capo hr 920→**820** rtp→**0.122**；
don hr 3700→**3300** rtp→**0.122**；basegame hr 4.8→**5.2** rtp→**0.44530**。
feature 佔比 **52.3%**（round 1 是 40%）。前端 `config.ts` + 賠付表 modal 已 sync（自動吃新值）。

第四輪 optimizer：RTP 全達標，`check_math_bundle` + `check_mechanics` 全過。
base 中獎率 ~1/5（更 grindy）。尾端**又更緊**：
| | base | bonus | bonus_hits | bonus_epic |
|---|---|---|---|---|
| p(≥5000x) | 3e-7 | 1.5e-5 | 1.3e-3 | **1.8e-3** |
| p(≥10000x) | 2e-7 | 7e-6 | 4e-4 | **7.9e-4** |
（Capo Nostra 出貨版 bonus_epic 是 3.2e-3 / 1.5e-3 —— Turf War 現在明顯更低。）
SDK `etl10k` 每輪往下：round1→2→3→4 = 17→23→15→**11.5**（同 Capo 一樣非阻擋）。

打包 `upload/TurfWar-*.zip` 已用第四輪 build/math 重跑（2026-09-06 23:48）。playtest stub 重生中。

## 2.9 第五輪（2026-09-07，使用者澄清「feature」＝ 遊戲特色機制，不是 free game 觸發率）

「換取更多 feature」= **擴展 wild（Bruiser）＋ 全盤大金匡（Big Score）更常出現**，
**不是**免費遊戲觸發率。前面幾輪把觸發率一路往上調（1/229→1/155→1/135→1/130）是**錯方向，收回**。

- `game_optimization.py` slices **收回 Capo Nostra 基準**（照 0.9458→0.9358 等比縮）：
  soldier hr **275** rtp 0.17940、capo hr **1375** rtp 0.09210、don hr **5500** rtp 0.09210、
  basegame hr **3.6** rtp 0.57070。實測 free-spin trigger = **1 in 220**（＝ Capo baseline）。
- `fullboard_frame_chance` 1/50 → **1/35**（config），實測 Big Score 在 base **1 in 47** 出現。
- Bruiser 轉輪帶密度維持 `[0,2,2,2,0]`，實測 base **30.6%** 的手會展開（Capo 是 24.5%）。
- paytable 砍半（第四輪）維持不變。

第五輪 optimizer：RTP 全達標、`check_math_bundle` + `check_mechanics` 全過。
base 中獎率回到 ~1/3.5（＝ Capo 頻率），但每次中獎的數字是一半 —— 刺激感改由
Bruiser（30% 的手）＋ Big Score（1/47）承接。尾端仍遠低於 Capo 出貨版
（bonus_epic p≥5000x = 1.3e-3 vs Capo 3.2e-3）。

打包 `upload/TurfWar-*.zip` 第五輪（2026-09-07 00:02）。

**還可以更激進**（若使用者要）：Big Score `fullboard_frame_chance` 1/35→1/25（→ base ~1/33）；
Bruiser 若要超過 30% 就得加到 reels 0/4（會破壞「5-OAK wild 稀有」與「固定展開位置」的設計）。

## 2.10 第六輪（2026-09-07）

**1. 3/4 格堆疊多一點**：`make_reels.py` `inject_high_stacks()` 改成 run 長度 2/3/4
（權重 0.15/0.5/0.35，之前是 2/3 @ 0.7/0.3），sites 每條 4–7 處（之前 2–4）。
4 格 = 整個可見窗一個符號。頂符號（H1 3/軸、H2 4/軸）copy 不夠做 4 格，所以大堆疊落在
H3/H4/H5（波動性安全側）。實測 BR0 幾乎每軸都有 3 格和 4 格堆疊。

**2. 同一輪最多一個擴展 wild**：新增 `config.max_expand_wilds_per_spin = 1` +
`GameExecutables.dedupe_special_wilds()` —— draw_board 之後、reveal 之前，多出來的
Bruiser 收成一個 W 格（不是整行）。base 與 free 都套；`force_wincap` 的書略過
（要 WCAP 密 wild 才收斂）。`check_mechanics.py` 加了「非 wincap 書 wildExpand.reels ≤ 1」的斷言。
實測：**0.0000% 的 base 手出現 2+ 個展開**。副作用：尾端更緊了（bonus_epic p≥5000x
從 1.3e-3 → **2.0e-3**... 其實是這輪 stacking 讓它回升一點，但仍遠低於 Capo 出貨版 3.2e-3）。

第六輪 optimizer：RTP 全達標、`check_math_bundle` + `check_mechanics`（100k books）全過。
free-spin trigger 維持 1/220、Big Score base 1/45、Bruiser base 32.1%（每手一個）。
SDK `etl10k` bonus_epic 降到 10.1、bonus_hits 3.4。

打包 `upload/TurfWar-*.zip` 第六輪（2026-09-07 00:29）。

## 2.11 送審前整理 + bug 修（2026-09-07）

### MG 報獎中按 spin 卡住（＋報獎聲一直響）
`stake-engine-slot` 記的「oncomplete race」。`setWin` 的 `await broadcastAsync(winUpdate)` 掛在
`Win.svelte` 的 `oncomplete` 上；報獎中按 spin 把 `Win.svelte` 拆掉，resolver 變孤兒，
`setWin` 永遠 await 不到 → 卡死，而 `winLevelSoundsStop()` 在 await 之後所以聲音一直響。修：
- `bookEventHandlerMap.ts`：`setWin` / `winInfo` / `freeSpinEnd` 的 presentation await 全部包
  `cappedAwait`（20s 上限）＋ `try/finally` —— 聲音一定會停、回合一定會往下走。
- `Win.svelte`：`winHide` 和 `onDestroy` 都呼叫 `oncomplete()` 釋放待決的 await。
- `actor.ts` `onNewGameStart`：開頭 broadcast `winHide` + `winLinesHide`，按 spin 打斷報獎時
  乾淨拆掉。
**⚠ 未在瀏覽器實測到**（playtest pane 隱藏、synthetic input 打不進遊戲）—— 修法是 skill 記的
標準 pattern，happy path 無行為改變，低風險。使用者可在能操作的環境確認。

### 通盤檢查（依 skill 的 review-findings.md + dead-asset-audit.md）
**修好的**：
- 免責聲明結尾 `Silverstars Studio` → **`Engine`**（review 指定的字，加註解）—— review-finding #1
- `stateConfig.explainInsufficientBalance = true`（uiTheme.ts）—— review-finding #2，之前**沒設**
- `static/build-version.txt` `CapoNostra 2026-09-03...` → `TurfWar 2026-09-07 qa-pass-v1`
- `FxBurst.svelte` / `LoadingScreen.svelte` 的 `0x5C2126`（Capo 酒紅）→ `0x465562`（Turf 鐵藍）
- `CAPO_NOSTRA_BET_MODE_META` → `TURF_WAR_BET_MODE_META`（3 檔）

**查過沒問題的**：
- build grep：**無** capo nostra / vault frame / tommy gun / fedora / hot miami / neon night / ocean drive 任何一個到得了玩家的字串
- 賠付表 modal `SYMBOL_LABEL`：H1 Crown Chain / H2 Fenced Block / … / SW Bruiser —— 每個都對得上美術
- portrait 控制：`closePanelsOnSpin: true` 由共用 `ButtonBetProvider` guard（只在 `drawerButtonShow` 時才 fold）—— review-finding #5 已在共用層修好。**仍建議送審前實機看一次直式**
- 轉場 registry key（`capoVaultDoorL/R/Dial`）指向正確的 `turfFx/shutter_l/r.png`、`lock.png`
- 賭桌 bar 預設是 hacksaw 中性灰皮（刻意的平台 chrome，非 Capo 殘留）；Capo 霓虹 block 只在 `uiSkin=miami` fallback，也順手改掉了 `0x2ee6a8` mint

**仍待處理（都是內部、不影響送審/執行）**：
- `sprites/hotMiamiParts/`（停用的符號分件動畫）＋ registry entries、`sprites/capoFx/fx_*`（4 張待重上色）、
  `sprites/capoCast/`、`audio/capo/`（game 用 `audio/turf/`）、其餘 `hm*`/`capo*` registry key、
  math 的 `force_special_wild` 死枝
- 美術待修：`h2` 偏藍、`L1–L4` 厚鏽圓框、`h3` 過重、store tile 是全身非半身、thumbnail 壓縮

打包 `upload/TurfWar-*.zip` 已重跑（2026-09-07 00:50）。sanity grep 全過（無 Stake Engine、
無 Capo/Miami/Silverstars 顯示文字、免責聲明結尾 = `Engine.`）。

## 2.12 第七輪（2026-09-07）：框太搶戲、遮到圖騰、Kingpin 看起來都是框

**Math**（`game_config.py`）：
- `SIZE_*` 大框權重全面下修（如 `SIZE_STRONG` `{1:780,2:170,3:50}` → `{1:900,2:85,3:15}`）——
  1×1 變壓倒性預設，2×2/3×3 變稀有。
- `tier_seed_frames` `{soldier:1, capo:3, don:3}` → `{soldier:1, capo:2, don:1}` ——
  Kingpin 只起手 1 個黏框（黏 wild 才是主軸）。
- 免費遊戲 `frame_counts` 大砍：Kingpin `{0:18,1:36,2:30,3:16}` → `{0:58,1:32,2:8,3:2}`；
  Muscle、Lookout 同步降；base 也再降一點（`{0:72,...}` → `{0:80,...}`）。
- **Big Score 分 base / feature 兩個機率**：base 維持 **1/35**（招牌事件），
  免費遊戲降到 **1/150**（`fullboard_frame_chance_feature`）—— 免費遊戲要講自己的機制，
  不是每 35 手掉一個全盤框在上面。

第七輪 optimizer：RTP 全達標、bundle + mechanics 全過。
實測 Kingpin 一輪結束平均 **4 個框 vs 7 格黏 wild**（wild 現在多於框）；
尾端更緊（bonus_epic p≥5000x 1.3e-3）。

**前端**：`WildColumns.svelte` 黏 wild 常駐層——紅色柱狀底光 alpha `0.14+0.16·pulse` → `0.22+0.22·pulse`，
鏈條圖層改畫在紅光**之上**、alpha 1，讓它更立體、更壓得過框。

**⚠ 單一個框還是會遮住它那格的符號 —— 那是圖的不透明度，要美術修**。
已開需求：`ART_BRIEF.md` §3.0（框後製／重畫的 alpha 目標表，含 `design/soften_frames.py` 可改用的路徑）
＋ §4「`sw_locked` 要更搶眼」（整條鐵鍊 + 滿版血紅，視覺重量 ≥ 一個 2×2 框）。

打包 `upload/TurfWar-*.zip` 第七輪（2026-09-07 11:52）。

## 2.13 美術修訂（2026-09-07 12:14，使用者重生 + 後製）

`design/install_art_revision_20260907.sh` + `postprocess_art_revision.py` 一批：

- **框全面軟化**：`frame_1x1/2x2/3x3` peak alpha 255 → **217（85%）**，`frame_full` → **102（40%）**，
  `frame_sticky` → 115。實測疊在 h1 上遮蔽面積：1×1 **3%**、2×2 **6%**、full **0%**、3×3 **18%**
  （3×3 略高於 15% 目標但已很稀有）。`check_turf_art` 中央淨空區仍通過。
- **`sw_locked` 加重**：整條粗鐵鍊 + 每格血紅鎖釦 + 紅色底光，視覺重量明顯 ≥ 一個 2×2 框。
  `WildColumns.svelte` 的紅色底光 alpha 相應**調降**（0.22+0.22·pulse → 0.1+0.14·pulse），
  因為紅色改由圖本身承接。
- **h2**：藍色天際線 → 鈉燈橘窗光 + 鐵絲網（色相破口修掉；`check_symbol_weight` 對比掉到 5.45
  但窗光夠亮，實測讀得出來）。
- **h3**：佔格 53% → **31%**（「最重的符號」修掉）。
- **L1–L4**：厚鏽圓框拿掉 → 乾淨噴漆 stencil，佔格 avg 32% → **13%**，對比 5.04（貼工具下限，
  過）。L2 骷髏／L3 星星在盤面尺寸偏淡，靠噴漆滴流紋路分辨 —— 可接受。
- `tile_background` 也重生了（thumbnail BG 已更新）。

`check_symbol_weight` + `check_turf_art` + 全 build guard 綠。打包 `upload/TurfWar-*.zip`
（2026-09-07 16:10）。

**art flags 現況**：h2 藍 ✅ / L1–L4 圓框 ✅ / h3 過重 ✅ / 框遮圖騰 ✅（3×3 邊緣值）/
sw_locked 太淡 ✅。剩 store tile 全身非半身（低優先）。
3. **Art brief**：改 `ART_BRIEF.md` 成 Turf War 需求（跟 math 平行）。
4. **Frontend：style match**：字型、配色（`components-ui-pixi` 有前一款硬寫 hex）、
   角色（mesh-cast-rig）、轉場。
5. **Art integration loop**：使用者產圖 → 接進 `assets.ts` → 截圖回報 → 迭代。
6. **Pre-submission QA**：先過 `references/review-findings.md` 六項；`game-qa`；
   `stake-compliance`；再跑 dead-asset audit（是否還有 Capo Nostra 的東西）。
7. **Thumbnail**：BG/FG/logo 三層，不燒標題。
8. **Package**：sync math config → build → playtest stub → 三個 zip；跑 sanity grep。

---

## 2.14 UI 全面客制化：皮、字、材質、info 頁（2026-09-09，frontend-presentation）

使用者要求：「不只是顏色，UI BAR 本身的紋理、字體等等要切合主題，info 頁裡面也要，
但全部保留恢復的機會。」

### 最關鍵的一件事：主題皮根本沒有被顯示

`src/game/uiTheme.ts` 是兩層：上面一整塊是本遊戲自己的 `setUiTheme()`，下面一個
`DEFAULT_SKIN` 機制會用 Hacksaw 的中性平台 chrome **覆蓋掉上面所有顏色**。
`DEFAULT_SKIN` 一直是 `'hacksaw'` —— 也就是 2026-09-07 那次把整塊 base palette
改成水泥灰／鈉燈橘／骨白的工作，**改完從來沒有出現在畫面上過**。

已改成 `DEFAULT_SKIN: 'hacksaw' | 'turf' = 'turf'`。回退路徑原封不動，而且更寬：
判斷式是 `skin === 'hacksaw'`，所以任何其他值都走遊戲皮，舊的
`localStorage.setItem('uiSkin','miami')` 在已部署的 build 上仍然有效、不需要清掉。

- `localStorage.setItem('uiSkin','hacksaw')` → 中性平台 chrome（免重 build）
- `localStorage.removeItem('uiSkin')` → 回到預設 `'turf'`
- 改 `DEFAULT_SKIN` 一個字 → build 內回退

### 翻皮之後才浮出來的兩個 bug（都已修）

1. **版面幾何本來只寫在 hacksaw 區塊裡**。`barHeight: 166` / `barFrameBottom: 46` /
   `spinScale: 1.12` 只在下面那塊設，一旦不跑就掉回共用套件預設 140 / 12 / 0.78。
   `barHeight` 是 `stateGame.svelte.ts` 推算盤面下緣內縮用的 —— 換配色會順手把盤面
   移位、旋轉鍵縮小。已把這三個值搬到 base 區塊，**兩個皮的幾何完全相同**，
   只差顏色與形狀。`betBarLayout: 'compactBottom'` 未動。
2. **`barFill` 從來沒設過**，掉回共用套件預設 `0x0C1206` —— Go Bananas 的叢林綠。
   在 hacksaw 皮底下看不到，翻皮後整條 bar 的底就會是深綠。已設
   `barFill: 0x17191C` / `barAlpha: 0.94`，`barStyle: 'framed'`（跟盤面鏽鐵外殼同語彙）。

### 顏色稽核結果

base 區塊的色票**逐格對過 §0，本來就是對的**（`0e0f11` / `17191c` / `3a3d42` /
`9c5a22` / `f5893d` / `ffc38a` / `d9d6ce` / `2a343e` / `465562` 全部在表上），
只有一處改：`valueFill` 由純白 `0xffffff` 改成骨白 `0xd9d6ce`（§0 指定的文字色，
對比仍 ~14:1）。血紅 `#B22222` 在整個 UI 層完全沒有出現。

### 字體

`GAME_FONT` Titan One → **Oswald 700**（`src/game/fonts.ts`）。ART_BRIEF §9.5 原本
把它列為「刻意留中性」，前提是 bar 維持平台 chrome，前提已不成立，§9.5 已改寫並附
選字理由（bar 是短標籤＋長金額，要 condensed 與清楚的 0/6/8/9；stencil 在 bar 尺寸糊）。
**連帶影響**：`GoldText` 的預設字體＝`GAME_FONT`，所以框倍數與中獎金額也一起變 Oswald ——
這正好符合 §9.5「數字用 condensed」的規定，而且 Oswald 比 Titan One 窄，
`READOUT_SCALE 0.68` 的溢字風險只會更低。Titan One 仍保留在 `app.html` 與
`setLocalFonts`，一行可退。

### info 頁（規則 / 賠付表 / 設定 / Buy / Replay）

- **殘留的金色系全清掉**：`#ffe98a` / `#a87a1e` / `#ffc93c` / `#fff3bd` / `#FFF3D0`
  → §0 的鈉燈橘與骨白；`ReplayIntro` 的卡片底是暖棕 `rgba(34,27,20)`（Capo 的桃花心木）
  → 冷近黑 `rgba(23,25,28)`；`ModalPayTable` 的 `.wp-special` 還有 Hot Miami 的
  桃紅光暈 `rgba(255,122,217,.4)` → 鈉燈橘。
- **毛玻璃 → 水泥板**：規則卡與賠付列本來是 `rgba(255,255,255,.03~.06)` + `backdrop-filter:
  blur()`，那是來源遊戲的材質，§0 的語彙裡沒有乾淨玻璃。改成不透明 `#17191C` +
  `#3A3D42` 硬邊 + 上緣一道受光內陰影。
- **⭐ 找到一個字體漏洞**：`.wp-paytable` / `.wp-rules` 不在 `.pop-up-wrap` 底下，
  所以 `Modals.svelte` 的 body-face 覆寫從來沒有套到它們 —— 賠付表每個符號名、
  每個賠付數字、規則頁全部的內文都在跑 `proxima-nova`（template 的 Typekit 字，
  這裡沒授權、永遠載不到），玩家看到的是**作業系統預設 sans**。
  已在兩個面板的根節點明寫 `font-family: var(--gb-body-font)`，標題明寫 title face。
- 一堆註解與程式不符的地方一併修掉（「Cinzel」「banana gold」「Warm near-black」
  「Hot Miami only」「brass-edged plates」）。

### 新增 gate

`design/check_ui_palette.mjs`（已接進 `pnpm run build`，另有 `pnpm check:palette --report`）：
掃 `uiTheme.ts` / `fonts.ts` / `src/components/ui/*.svelte` 的 hex 字面值（先剝註解），
不在 §0 色票 / 無彩色 / hacksaw 平台灰白名單裡的一律擋，`#B22222` 直接擋。
目前 8 個檔、22 個不同顏色，全綠。

### 材質：ART_BRIEF 新增 §8.7

`uiTheme.sprites` 目前只有 `base_ticker` 與 `buyBonus` 有圖，而且
**`base_ticker` 在 `compactBottom` 版面下根本畫不出來**（讀數傳 `tiled={false}`）。
圓鈕、bar 底、旋轉鍵全是純色向量。§8.7 開了 7 個資產需求，附實際量到的繪製尺寸
（bar 框 1872×120、旋轉鍵 168、圓鈕 150 縮到 42–66、`UI_BASE_SIZE` 150）、9-slice 切法、
材質方向與驗收清單。另外標出 `buybonus_plate.png` 是 512×440 被硬拉進 150×150 正方框
（垂直壓縮 13%），要重出成 512×512。

**§8.7 有兩項需要先動共用套件才接得上**（不是美術工作）：`uiTheme.barSprite`（bar 底貼圖）
與 `UiButton` 傳 slot key 給 `UiSprite`（圓鈕底盤）。共用套件 CapoNostra 也吃，
預設值必須是 undefined。

### 驗過的 / 沒驗到的

驗過：`pnpm run build` 全綠（含新 gate）；playtest shell 重建（rsync → dist，重打 stub
script tag）；bet bar、選單、賠付表、規則頁、設定、Buy 卡、免費遊戲開場**都截圖看過**；
base 一手轉完（旋轉鍵回到 idle）；買了 `BONUS`（stub log `/wallet/play BONUS`）跑到
LOOKOUT 開場卡；console 只有既有的 pixi v8 deprecation 與 lingui 未編譯 catalog 警告，
**沒有 error**；規則／賠付表的 computed style 用 JS 逐項確認（Saira / Oswald、
`rgb(217,214,206)` / `rgb(23,25,28)` / `rgb(58,61,66)`）。

**沒驗到**：
- 免費遊戲 10 手從開場跑到結算 outro 的完整過程 —— 平行有另一個 agent 在用同一個
  browser pane，pane 被藏起來時頁面不 composite、`requestAnimationFrame` 停住，
  遊戲就卡在那裡。買入與開場卡有看到，**中間 10 手與 outro 沒看到**。
- `localStorage.setItem('uiSkin','hacksaw')` 回退後的畫面**沒有截到圖**（同上原因）。
  程式路徑沒動，判斷式仍是 `skin === 'hacksaw'`，但**沒有實際眼睛看過**。
- 直式（portrait）與 Popout S 版面完全沒看。
- 音效、動畫時序、盤面本身都沒動也沒看。

### 下一棒

- 有人能穩定拿到 browser pane 時：跑完一次完整免費遊戲（含 outro），再截一次
  `uiSkin=hacksaw` 的回退畫面，兩張補進來。
- `DISPLAY_FONT` 還是 Orbitron（Hot Miami 的 techno 字），§9.5 說「或沿用」所以不算違規，
  但跟街頭題材不合。要換的話會動到所有數字面的字寬，要重量一次，不是這一棒的範圍。
- `game/featureTiers.ts:86` Kingpin 的 accent 是 `0xb22222`，§0 說血紅只給 The Bruiser。
  §10 驗收清單允許 `title_kingpin` 描邊用，但這是程式端的 tier accent，建議確認。
- 開場卡左下仍是 `SILVERSTARS STUDIO`；2.x 有一條 review-finding 說免責聲明結尾要改
  `Engine`，確認兩者是不是同一件事。

---

## 2.15 共用套件開三個 sprite slot：bar 底 + 圓鈕底盤（2026-09-09，frontend-presentation）

**Did:** 在 `components-ui-pixi` 加 `sprites.bar` / `sprites.button` /
`sprites.buttonActive` 三個 slot 與 `barSpriteSlice`，bar 底走新的水平三剖元件
`UiBarStrip.svelte`；ART_BRIEF §8.7 的「需要引擎鍵」阻擋解除。

### 動到的套件檔（敏感區，全部是加法、預設關閉）

- `packages/components-ui-pixi/src/theme.svelte.ts`
  `sprites` 型別加 `'button' | 'buttonActive' | 'bar'`；新增 `barSpriteSlice: 64`
  （只有設了 `sprites.bar` 才會被讀）。
- `packages/components-ui-pixi/src/components/UiBarStrip.svelte`（**新檔**）
- `packages/components-ui-pixi/src/components/LayoutBottomBar.svelte`
  `barSpriteKey = uiTheme.sprites.bar`；有圖才畫 `<UiBarStrip>`，
  且 `drawCasing = !barSpriteKey` 只擋掉底色與外框（含 `flat` 分支），
  **分隔線與呼吸刻度照畫**。
- `packages/components-ui-pixi/src/components/UiButton.svelte`
  `litPlate = active ? sprites.buttonActive : undefined`，
  `key={litPlate ? 'buttonActive' : 'button'}`；ON 的描邊圈條件從
  `plate && active` 改成 `plate && active && !litPlate`（有亮圖就不再描圈）。

### 為什麼是三剖不是 NineSliceSprite

`pixi-svelte` 沒有 nine-slice wrapper，而且**它的 `svelte-package` build 在這台機器上
跑不起來**（`svelte2tsx` 對上 workspace 的 TypeScript 7.0.2 炸
`Cannot read properties of undefined (reading 'fileExists')`），dist 是 commit 進去的，
所以無法在那邊加元件。`components-ui-pixi` 又不能 value-import `pixi.js`
（它的 node_modules 裡沒有，只能 type-import，`theme.svelte.ts` 開頭那段註解就是這個約束）。
`UiBarStrip` 因此用三個 `Sprite` + 各自的 `Graphics isMask`（`WinSymbolScene` /
`BoardMask` 已經在用的既有寫法）：左右端帽用 `height/texHeight` 的等比縮放畫、
中段自己算出 `midDrawnW` / `midX` 讓原圖的中段剛好落在兩端帽之間。
bar 的高度是 `barHeight − barFrameBottom`＝固定值，所以只有水平需要剖。

### 怎麼證明貼圖路徑真的會畫（不是只有 typecheck 過）

暫時產了三張丟棄用的板子（`design` 沒進去，腳本在 scratchpad）放 `turfUiTmp/`，
接上 TurfWar 的三個 slot 跑 playtest shell：

- 端帽故意畫成一深一亮的橘色實心塊、中段畫成等距細直線 —— 一眼看得出有沒有被拉糊。
- 第一版原圖出成 3744×240，**剛好等於 1872×120 的 2×**，三個 sprite 的 x/width
  算出來完全重疊（1200/1872 那組數字），看不出剖沒剖；改成 **2400×240** 重測，
  scene graph 讀到 `x=24 w=1200` / `x=-16.12 w=1952.24` / `x=696 w=1200`，
  跟公式對得上（`fit=0.5`、`cap=64`、`midDrawnW=2400×(1744/2144)`）。
- 再把三個 sprite 分別 tint 成綠 / 紅 / 藍截圖，bar 上是「綠端帽 26px｜紅中段｜藍端帽 26px」，
  **mask 確實有生效**（`getBounds()` 對 mask Graphics 回報 `[0,0]`，不可信，要用 tint 看）。
- 圓鈕：五顆都吃到 `button_plate.png`；按 turbo ON 之後 scene graph 變成
  `button_plate.png ×4 + button_plate_active.png ×1`，畫面上那顆變成亮橘底盤。

**已全部撤掉**：`static/assets/sprites/turfUiTmp/` 已刪，`assets.ts` 的三個 `tmp*`
entry 已移除（改成一段說明未來檔名的註解），`uiTheme.ts` 的三個 slot 留空並附上
真圖到位時要填什麼。TurfWar 目前的 bar 與圓鈕**跟 2.14 完全一樣**（重建 shell 後截圖確認）。

### 非退化

`pnpm --filter <app> build`：go-bananas / lines(WildParty) / moooo / margin-call /
triple-witching / ember-forge / crusher-yard / **turf-war** 全綠。
四個 FAIL 全部是既有環境問題，**跟這次改動無關，已用 `git stash` 套件後重跑對照**：

| app | 原因 |
|---|---|
| hot-miami / capo-nostra | `python3` 沒有 PIL，`check_source_art.py` 掛在 vite 之前。單獨跑 `pnpm exec vite build` 兩個都 OK |
| soul-seal / go-bananas-100 | `svelte-check` 超過 baseline，**stash 前後的檔案清單逐行 diff 相同** |

Capo 的 `check_ui_palette` / `check_sprite_keys` / `check_undefined_refs` 另外單跑，全綠。

視覺對照（把 build rsync 進 playtest shell 的複本，scratchpad 底下，沒動
`dist/*-playtest` 本體）：

- **Moooo before/after 完全相同**（before ＝整個 `components-ui-pixi/src` stash 掉）。
  Moooo 沒設任何新 key，這條同時證明了 2.14 那批 font key 跟這次的 slot 都是 default-off。
- **CapoNostra after 正常**，bar 外殼、分隔線、圓鈕金盤都在。它跟 before 的差異是
  讀數字體與 `sprites.button` —— 那是這個 session 稍早 Capo 自己那一棒的東西，不是這次的。

### 驗過的

- TurfWar `pnpm run build` 全綠（含 `check_ui_palette` 等既有 gate），接圖版與撤圖版各跑一次。
- playtest shell 重建兩次（接圖 / 撤圖），bar 與圓鈕各截圖看過。
- **base 一手完整跑完**（`/wallet/play BASE` → `/wallet/end-round`，旋轉鍵回 idle）。
- 買 `LOOKOUT`（`/wallet/play BONUS`，餘額 999.60 → 899.60）→ 轉場 → 開場卡 →
  免費遊戲第 1、2 手都有畫出來，bar 一直在，**沒有卡在任何一個 event 上**。
- console 沒有 `Sprite: key ... is not found`，也沒有新的 error；
  剩下的只有既有的 pixi v8 deprecation 與 lingui 未編譯 catalog 警告。

### 沒驗到（明講）

- **免費遊戲 10 手跑不完**，跟 2.14 同一個原因，而且這次確認了機制：
  `javascript_tool` 直接回報 `The Browser pane is currently hidden`，
  pane 藏起來時 `requestAnimationFrame` 停住，只有 `wait` / 截圖那幾個瞬間會 composite。
  100 秒的 wait 只推進到第 2 手中段。**outro 與結算沒看到。**
- **9-slice 在非 16:9 版面沒看過**：只在 1920×1080 標準框下量過。
  平板框（`mainLayoutStandard` 會給不同 `box.width`）與直式（直式會退回 `bottom` 版面、
  根本不走 `LayoutBottomBar`）都沒開。
- `barSpriteSlice` 大於 `width/2` 的退化分支（`sliceable === false` 走單張拉伸）
  只有讀過程式，沒有實際觸發過 —— 現有版面不會產生那麼窄的 bar。
- `buttonActive` 只在 turbo 上試過，autoplay 的 ON 狀態沒試。
- disabled 的 `tint 0x6b6b6b` 沒在有貼圖的狀態下實際看到（餘額一直夠、按鈕沒被 disable）。
- GoBananas / HotMiami **沒有截圖**：這兩個沒有 playtest shell，沒有 stub 就只會停在
  `TypeError: Failed to fetch` 的錯誤框，bar 看不到。改用有 shell 的 Moooo 與 CapoNostra。
- 沒有做「只 revert 這次改動、保留 2.14」的精準 A/B —— stash 是整包的。
  Moooo 那條 before/after 相同已經涵蓋，但 Capo 的差異無法用截圖切割成兩棒。

### 下一棒

- 美術：§8.7 的 #2 / #3 / #4 現在畫了就能接，接法寫在 `src/game/uiTheme.ts` 的
  `sprites` 註解與 `assets.ts` 的註解裡。`bar_strip.png` **不要畫分隔線**。
- 有人拿得到穩定 browser pane 時：跑完一次免費遊戲含 outro；順便看平板框下的 bar 三剖。
- 2.14 留的那三條（`uiSkin=hacksaw` 回退截圖、`DISPLAY_FONT`、
  `featureTiers.ts:86` 的血紅）**這一棒沒動**。

## 角色網格動作 — 2026-09-18 移植 Capo / Hard Time 的 09-17 修正

原狀：`castMotion.ts` 是 Capo 09-10 raw-Spine 模型的逐姿勢改版——三層全部 `rise/stretch/lean = 0`、
胸口 `push`、沒有 squash-and-stretch、lag 階梯、手勢塞進一條前臂（shoulder trigger fore_l 9.5°、
base fore_r −7°）。gate 還是舊規則（規則 3 要 lag、6 要 free end ≥ 2× chest、6b 要 head ≤ 0.45× carrier），
沒有網格規則。**舊表放到現在的 rig 上 trigger 摺到 base 13%、shoulder 7%**，舊 gate 全綠。
舊檔在 `design/_legacy_assets/cast_motion_20260914/`。

**(1) rig 不是抄來的，不必重建。** 三個 rig 都是 `design/rig/build_turf_rigs.py` 從 Turf 自己的貼圖生的，
重跑與出貨版權重差 2e-16。手臂自有權重（新描的 `design/cast_guy_arm_regions.json`，獨立於 builder
的 part 多邊形）0.88–1.00；口袋手刻意釘在 hips，列為 anchored 不計。唯一改動：builder 為每根手臂骨
寫了明確 `axis`（base arm_l 沒有子骨、shoulder fore_l 在拳頭裡轉，推導出的軸都不沿著肢體）；
權重不變。無 axis 版在 `design/_legacy_assets/cast_guy_rig_20260914_noaxis/`。

**(2) 關節極限兩輪量**（`design/measure_joint_limits.mjs` 幾何 → mesh_render 目視，放大到拳頭、
球棒腳、口袋手；全身看 hips）。表在 `check_cast_motion.mjs` JOINT_LIMIT_DEG 的註解。base 緊，
而且是**畫的問題**：右手插口袋（釘在 hips），任何往那邊收的脊椎/右臂轉動都在剪前臂；左拳握著立地
球棒，fore_l 每度讓棒腳滑 ~4px，目視只到 1.5°。

**(3) 動作表 = 轉錄版原值**（IDLE、REACTION、LIFT、SCALE、K 0.42、FLUTTER、1000ms/0.18/0.63），
`fromReference` 0.5/0.75/1 三層。兩處照「角色」而非名字：
- **arm_l 主動（B），兩個姿勢都是。** 兩張圖右手都在口袋→右臂不自由；左臂是拿球棒的那隻。
  網格也這樣說，而且不接近：A（arm_r 主動）base 47% / shoulder 36% 摺在口袋手，B 65% / 57%。
  所以沒有做 A/B 渲染讓使用者選（跟 Hard Time 打平的情況不同）。
- **base 的 fore_l 是道具，不給動作**（`HELD_STILL`）。那根骨頭在 base rig 上是拳頭＋立地球棒、
  掛在 root；轉錄版的 fore_l 數字是**前臂**的。給了球棒：idle 自己就 1.74° 超過 1.5，stretch 把棒
  塞進地面，trigger 摺到 0%、27 個翻轉。不給：65% / 1.40x、0 翻轉。
- 正負號在這些 rig 上重量過：左 + 右 − 張開身體，兩個姿勢都成立（base fore_l + 讓棒腳外擺 39.7px）。

**(4) gate** 移植 Hard Time 的規則 1–10 + 規則 11，逐姿勢、逐 rig 跑；`--motion=`/`--rigs=` 用來注入。
已注入證明：舊 rig（Capo 手垂身側那副）→ 規則 11 擋下每個手臂區塊 0–27%（shoulder 上規則 10 自己
擋不住，跟 Hard Time 記的一樣）；舊表 → 規則 1/6/6b/10 全擋。

**(5) `measure_cast_travel.mjs`** 呼叫 castMotion、預算頭部**自身**擺動（扣根部抬升），逐 rig。
轉錄版實測 base 3.58/5.39/7.20%、shoulder 3.70/5.57/7.43%，上限 ×1.15。比 Hard Time 大是因為頭群組
是整個兜帽（453–471 頂點）。注入：只把 head 骨放大 1.3x **擋不住**（自身擺動大多來自下面的脊椎鏈，
單骨超量是 gate 規則 6b 的事）；整條脊椎 1.2x 兩邊都擋。

**瀏覽器**（dev 3016，`import('/src/game/stateGame.svelte.ts')` 直接設 castReaction）：base trigger
腳抬 33.7px（=4.5%×749）、橫移 4.8px、主動上臂 1.108x、glow 0.34、~1.08s 回原位；shoulder 同樣 33.7 /
1.107x / 棒尖自身上抬 24px。dev 沒有 stub，玩不到真實的一手。

**未決（gate 目前在這兩條 FAIL，所以 `pnpm build` 會停）**：base 的轉錄版原值 neck 3.34°（規則 1 保守地
把 idle 峰值不分方向相加；實際收向口袋的方向最大 3.15）對目視 3°，以及 idle arm_r 峰值 2.36 = 3° 的 79%
（規則 8 上限 60%；收向口袋方向只到 1.87）。最壞相位的組合渲染口袋手前臂是乾淨的，idle arm_r − 峰值
讓前臂微彎。等使用者決定：照原值（調 base 的 neck/arm_r 目視上限並記下組合渲染）或只在 base 縮 neck。
**未打包、未上傳。**

## 2026-09-20 — 清掉兩項換皮殘留、動作改回 Hot Miami 的寫法、打包

### 1. 兩項換皮殘留（跟 Capo Nostra 同一批）

- `sprites/hotMiamiParts/`（4.5MB）+ `assets.ts` 的 37 個條目。那套切片符號 rig 早就停用
  （`SYMBOL_RIGS` 是空的 map），先前只把 `preload` 關掉**沒有用** —— Vite 對
  `new URL(..., import.meta.url)` 是**無條件打包**的，圖照樣每次出貨都在包裡。
  動作定義搬到 `design/_legacy_assets/symbol_part_rigs_hotmiami_20260920.ts.bak`。
- `assets/spines/cast_guy` + `cast_girl`（5.4MB）與 `CastFigureSpine.svelte`。
  `Cast.svelte` 掛的是 `CastFigureMesh`，唯一讀那兩個 key 的元件沒有任何人 import。

⚠ **坑：`check_assets_exist.mjs` 會掃整份 `assets.ts` 的 `assets/...` 字串，註解也算。**
在註解裡寫路徑會被當成不存在的資產參照擋下 build。註解不要出現 `assets/` 字樣。

### 2. 動作改回 Hot Miami 的寫法（使用者決定）

Capo Nostra 在同一天換掉抄錄版，Turf War 跟著。順帶解掉**從 09-18 卡到現在的 build**：
那兩條 gate 失敗（base `neck` 3.34° 對上限 3°、idle `arm_r` 佔預算 79% 對上限 60%）
都是抄錄版數值的性質，Hot Miami 的 idle 不到一半大，兩條自然消失。

拿掉 `PORT_ROTATION` / `PORT_SCALE` / `fromReference`、squash and stretch（含第二組矩陣
`chain` 與 `boneAxes`）、`push` / `tremor` / `lean`。放進 Hot Miami 三檔手寫的
`[角度, 延遲]` 表，三處例外：

1. **`hair` 骨留著不驅動** —— 兩具 rig 都宣告了（當初為錢包鏈加的），但
   `JOINT_LIMIT_DEG` 沒有它的量測值，貼圖上也沒有那個東西，硬給就是亂猜。
2. **右側正負號相反**（這兩張圖量出來 `arm_l +` / `arm_r −` 才是開身體）。
3. **每個姿勢吃自己的比例**，見下。

### 3. POSE_SCALE / WIN_FRACTION —— 兩個姿勢的預算差很多

| | POSE_SCALE | WIN_FRACTION | 卡住的原因 |
|---|---|---|---|
| base | **0.46** | **0.6** | 兩頭擠：>0.50 時 trigger 的 `arm_l` 把網格拉過 1.60x 上限（實測 1.65x @229,367）；<0.50 時線中獎低於能見度門檻 |
| shoulder | **0.34** | **0.5** | 自由前臂摺疊：0.42 實測 44%，門檻 50%；0.34 是 62% |

**`IDLE` 也吃 POSE_SCALE**，這不是細節：只縮反應不縮待機，在緊的那張圖上會把關係倒過來
—— 實測線中獎最大 1.14° 壓在峰值 1.37° 的待機下面，反應比呼吸還小。

**Hot Miami 自己的 0.4 線中獎比例在 base 上無解**：「trigger 會糊掉」與「線中獎看不見」
之間的窗口比 0.4 到門檻的距離還窄，所以線中獎的比例改成逐姿勢。

**`BODY_SCALE = 1`**：`rise` / `stretch` 不吃 POSE_SCALE/MOTION_SCALE —— 它們平移縮放
root、整個人剛性移動、不折任何關節，為了保護一條前臂把它們一起縮是搞錯類別。

### 4. ⚠ 差點被誤導：rig 資料夾裡的 PNG 不是出貨的圖

`meshRigs/cast_guy/guy.png`、`guy_feature.png`、`guy_don.png` **三張逐位元相同**，畫的是
西裝男 —— 那是建 rig 時的來源圖，`rig.image` 還寫著它們，但**沒有人 render**。
真正出貨、也是 gate 量測用的是 `sprites/turfCast/guy.png` 等（兜帽拿球棒那個）。
`design/lib/castMesh.mjs` 本來就從 `assets.ts` 解出貨貼圖，它的檔頭也寫了這件事。
**量測要用 gate，不要打開 rig 旁邊那張圖下結論。**

### 5. 打包

`./design/ship.sh` 全綠。gate：`check_cast_motion ok`，摺疊 base trigger 84%、
shoulder trigger 62%，0 翻轉；base trigger 拉伸 1.54x（上限 1.60）。

| zip | 大小 |
|---|---|
| `TurfWar-frontend.zip` | 104 MB |
| `TurfWar-math.zip` | 105 MB |
| `TurfWar-upload.zip` | 214 MB |

（18:30 重打一次：15:20 那包是在修正 §4 那些註解**之前**建的。純註解改動，但出貨包要從
最終原始碼建出來才算數。）

出貨包內 `hotMiamiParts` / `/spines/` / `stub` / `playtest` / `.map` 全 0；
`hotMiami` / `Hot Miami` / `CapoNostra` / `Capo Nostra` / `Tommy Gun` / `Vault Frame`
在 index.html 全 0。實機轉兩手（餘額 1000→999.20，中 $0.20，指虎 WILD 有落地），
console 只有 PixiJS 的 deprecation warning，無錯誤。

⚠ **`design/ship.sh` 沒有部署 playtest 的步驟**（Hard Time 的有）。`dist/turfwar-playtest/`
一直停在 09-18，這次是手動 rsync + 重新注入 stub script 才對得上。下次改 ship.sh 補上。

**未上傳到平台。**


## 2026-09-22 — 人物動態改成 Deadwood Express 的寫法

使用者：「turf 人物動態能不能照 deadwood 的」。`src/game/castMotion.ts` 換成
`apps/DeadwoodExpress/src/game/castMotion.ts` 的內容：idle 表、REFERENCE_ROTATION /
SCALE / LIFT / FLUTTER、`fromReference`、三檔的比例與時長（1000/880/720ms）、
以及帶第二組 `chain` 矩陣的 composeBoneMatrices（squash & stretch 不被子骨繼承）。
`skinnedFigure.ts` 補回 `chain`。舊的 Hot Miami 版備份在
`design/_legacy_assets/cast_motion_hm_20260920/`。

保留 Turf 自己的兩件事（Deadwood 只有一張圖）：
- `RIG_POSE`／`HELD_STILL`：base 的 `fore_l` 是立在地上的球棒，不動。
- **手臂依角色對應（`BY_ROLE`）**：Deadwood 的指揮甩的是右手，所以參考值最大的旋轉
  與擠壓（arm_r 1.23x）在 arm_r；Turf 的右手插在口袋、釘在臀部。照名字搬量到 trigger
  摺疊 47%（base）／36%（肩扛）都在口袋手；左右對調（正負號跟著換）後 56%／47%。
  跟 09-18 的 A/B 結論相同。idle 沒對調（兩側幅度幾乎一樣）。

gate（`design/check_cast_motion.mjs`）改動，每條都有量測依據：
- rule 3／6／6b（逐骨延遲、前臂 ≥2× 胸口、頭部比例）是 Hot Miami 的旋轉階梯規則，
  參考動作按定義就不符 —— Deadwood 自己的 gate 同樣報這幾條，而且沒接進它的 build。
  有 `scale` 的 tier 豁免並在 --report 中註明。
- base `neck` 上限 3 → 3.4（峰值 3.34；目測量表寫的是 3.5 開始夾）。
- idle 預算比例 0.6 → 0.8（base 口袋手 arm_r idle 峰值 79%；反應只再加 0.36，rule 1 照樣把總和壓在上限內）。
- 肩扛 rig 的反應摺疊下限 50% → 45%：最差一格在口袋手（379,452，age 667ms），在同一
  idle 時間點 render 比對，是手往口袋裡稍微擠窄，沒有撕裂或翻面。idle 與 base 仍是 50%。

打包：`./design/ship.sh`（無 zip）全綠，數學未動。playtest 手動部署到
`dist/turfwar-playtest/`（stub 重新注入）；4196 是 Capo 的 playtest 在用，另外加了
launch 設定 `turfwar-playtest-4230`。實機轉四手正常，三個 rig 都有載入。**未上傳、未產生 zip。**

## 2026-09-23 — 手臂改回剛性（Miami 的做法）＋ FG 結算置中

使用者：「turf 的手很怪，很像沒骨頭一樣，參考 miami 或 deadwood」「FG 結束後贏分沒置中」。

**手臂。** 量法：每個手臂骨主導的頂點群，在反應過程中偏離「最佳剛體擬合」的最大距離（純旋轉＝0），
以身高的千分比表示。Deadwood 版移植後：base／肩扛左臂 23.9‰／24.5‰，Deadwood 自己的列車長最大 8.8‰；
只看待機也有 4.8‰（Hot Miami 版 1.2‰）。原因有兩個：
① `BY_ROLE` 把參考裡最大的拉伸（1.23x）交給左臂，而左手不是握著立地的球棒（base）就是扛在肩上 —— 手固定住還拉長手臂，只能彎成弧形；
② Deadwood 的待機會讓手臂一直擺動（1.6／1.2／1.5／1.1°），手固定的情況下就是永遠彎著。
改法：`castMotion.ts` 的 `ARM_BONES` 不吃擠壓伸展；待機的四根手臂骨改用之前出貨的 Hot Miami 值（`IDLE_ARMS`，已乘過各姿勢的比例）。
脊椎、頭、抬升、側移、胸頸擠壓、所有反應角度仍是 Deadwood 的。結果：反應 11.5‰／8.0‰、待機 2.6‰／1.5‰。gate 全綠。
base 剩下的 11.5‰ 來自胸口旋轉帶動肩膀，而拳頭在 root 上（立地球棒）—— 這是這張圖的結構限制，不是動作表造成的。

**FG 結算。** `FreeSpinOutro.svelte` 的 TOTAL WIN／金額原本放在 0.02／0.28（為了避開舊牌子上印好的 FREE SPINS 字），
現在的牌子是空白的，整組偏下約 0.18 個牌高。改成 −0.18／0.08（間距不變），在 playtest 用 `__HM_EMIT__` 叫出結算，1280×720 下目測置中。

`./design/ship.sh`（無 zip）全綠，playtest 已重新部署。未上傳、未產生 zip。

## 2026-09-24 — 手臂擠壓改成參考的真實軸向＋分層重繪需求單

使用者給了新版研究包（`hacksaw-motion-kit.zip`，內含 Miami 六隻角色的動作包）。用動作包量出：
skill `rig/motion.py` 的 REACTION_SCALE **把 Spine 的 scaleX／scaleY 讀反了**（scaleX＝沿骨頭、scaleY＝垂直骨頭）。
Miami 扛球棒男在反應最高點：上臂 `arm_r` 長度不變（肩→肘 231.09 → 231.09）、**變粗 1.229**；
支撐側前臂 `arm_l_2` 沿骨頭 1.063、**變細 0.799**。舊表卻是「沿骨頭拉長 1.23」——這正是「手像沒骨頭」的源頭。
四隻有反應動作的 Miami 角色，沒有一隻的手臂沿骨頭拉長超過 6%。

本款改成：主動臂上臂**垂直骨頭鼓起**（1.00, 1.23）、支撐側前臂（1.06, 0.80），k 與 flutter 沿用。
量測（仿射殘差，只算真正的彎）：鼓起 ≈ 不擠壓，約是舊拉長版的一半以下。gate 與 `pnpm run build` 全綠。
在目前的圖上，鼓起幾乎看不出來（手臂貼身）→ 真正的解法是重畫：
**需求單在 `/Users/stone/stake-engine/docs/cast-layers-brief/README.md`**（三款共用，附標註圖）。
收到分層圖之後，程式要改成「每個圖層一張網格、共用一副骨架」。

未重新打包：upload/ 仍是上一版，要出貨時跑 `./design/ship.sh`。

## 2026-09-26 — 分層角色需求單（skill 流程產出）

照 `hacksaw-character-motion` 的「換皮選角色」流程：使用者選 **#2 扛球棒男**，而且**一般遊戲、免費遊戲、Kingpin 三張共用這一個姿勢**
（只換打光與質感）。產出在 `design/cast_brief/`：
- `README.md` —— 0–7 節由 `archetype/brief.py -c 2 --feet-y 1674 --top-y 176 --center-x 537 --variants base,feature,kingpin` 產生；
  第 8 節是手寫的 Turf 設定（人設、晃動物對應、三張變化圖的打光）。**重跑產生器會蓋掉第 8 節**，要先備份。
- `pose_guide.png`（只有關節和骨架線）、`layers.template.json`（圖層順序＋支點）。
取代：`ART_BRIEF.md` §1 的技術規格與姿勢（已加註）、`ART_BRIEF_CAST_RIG.md`、`docs/cast-layers-brief/` 的 Turf 章節（已加註）。
收圖後：`check_layered_art.py design/cast_parts/base --variants design/cast_parts/feature design/cast_parts/kingpin` →
`build_layered_rig.py` → `motion_table.py -c 2 --sides anatomical` → 接 `layeredFigure.ts`（Turf 的 composeBoneMatrices 已支援 chain；
PoseState 需要 `pose`，用 `poseState`）→ `check_layered_cast.mjs`。

## 2026-09-28 — 視覺與演出整改（原始碼基準）

- Big Score 補上全盤框的蓄力、20× 等倍率的落下、收斂成頂部標記；短版 Storybook event 在 1280×720 實播並正常結束。
- Bruiser 掃光改成四段等時直線移動，每段光前沿到達一格才換 Wild；獨立 `wildExpand` 故事實播四格完成。Sticky Frame 的舊倍率在轉輪停下時先顯示，新倍率在 re-roll 撞擊點切換，doubling 也延後到撞擊點；新增 `stickyFrameReroll` 故事並實播 3×→4×，action 正常結束。
- 免費局入口的 PRESS ANYWHERE TO CONTINUE 移到牌子與底欄之間；1280×720 實播可見且點擊後正常進入免費局。
- Storybook 抽書來源改回 `math-sdk/games/turf_war/library/publish_files`，重建四份資料；`collectorWin` 故事改為本款的 `wildExpand`。產出的 12 本基本局與 12 本免費局沒有 Hot Miami collector event。
- H1–H5 換成一套夜街網印高價符號，L1 改成灰色噴漆準星，避免與 H1 皇冠同形；原圖在 `design/_legacy_assets/turfSymbols_before_screenprint_20260928/`，L1 向量來源在 `design/source/turf/l1_target.svg`。`check_symbol_weight.py`：H 佔格均值 39.8%，L 13.5%，階級與對比合格。`pnpm build` 全綠。
- **角色新分層圖尚未接線**：`check_layered_art.py` 報告垂手距身體 15.8px，門檻 48px；若直接驅動會穿模。保留目前已驗證的網格角色。商店 tile 的日景／舊角色與遊戲夜景的差異仍待重做；本輪 imagegen 在低價符號生圖時用盡額度（服務回報 2026-09-28 16:47 CST 重置）。

## 2026-09-28 — 商店縮圖夜景／角色對齊

- 重做 `tile_background.png`：維持原鐵捲門／圍網構圖，改為遊戲同款夜街冷影、鈉燈、濕地反光。
- 重做 `tile_foreground.png`：人物改為與遊戲一致的黑色連帽蒙面、肩扛球棒；音響保留在左下。兩層於 200px 與 512px 疊圖目檢，人物輪廓、球棒、音響均可辨識。原圖存於 `design/_legacy_assets/turfBrand_before_night_20260928/`。
- `pnpm build` 通過，包含 `check_turf_art.py` 對 63 張 Turf 輸出圖的透明度、角色對位與畫框檢查。
- 新分層角色再跑 `check_layered_art.py`，仍在左臂（圖中右側垂手）肘部下方 `x≈784, y≈792` 量到 15.8px，規格要求 48px。收圖時須把垂手前臂與拳頭向身體外側拉開，三款 variant 共用同一 alpha；重跑分層圖檢查與極限姿勢檢查後才能接線。

## 2026-09-28 — 分層角色完成接入（取代上方待修狀態）

- `design/cast_brief/build_cast_parts.py` 將畫面右側垂手由肩端漸進外移 45px；`check_layered_art.py` 實測前臂／手距身體 **55.01px**，三款 alpha 相同，PSD／PNG 圖層吻合。
- 8 層、13 骨共用骨架已輸出到 `static/assets/castLayers/turf/{base,feature,kingpin}/`；透明像素清空 RGB 後，三款遊戲圖層合計約 5MB。來源 PSD 與舊版圖保留在 `design/cast_parts/`、`design/_legacy_assets/cast_parts_before_clearance_20260928/`。
- `CastFigureMesh.svelte` 改以 `layeredFigure.ts` 畫每層網格，共用 `layeredCastMotion.ts` 反應。一般局、免費局、Kingpin 共用姿勢，只切換配色；球棒由握棒前臂帶動，垂手可獨立打開。角色置於盤面與螢幕邊緣間，直式側欄不足時仍隱藏。
- 首次實播發現觸發閃光太白、鞋子離開控制欄；已把全身上移與橫移改為腰部反應，觸發閃光降至 0.12。載入及開場說明圖也換成同一套肩扛球棒角色 `castLayers/turf/loading.png`。
- 新 `design/check_turf_layered_cast.mjs` 已放進 `pnpm build`：三款各測 **3,544** 個待機／反應／倍速姿勢，翻面 0、面積比 0.639–1.320、最窄畫布邊距 61px、手臂彎曲殘差 6.99／7.26px；全綠。`pnpm build` 全綠，資產路徑檢查涵蓋 103 個引用。
- Storybook 1280×720 實播 `winInfo` 與 `freeSpinTrigger`，Action 正常結束；免費局人物成功切換。390×720 直式畫面無側欄殘留角色。直接啟動 `pnpm dev` 因沒有遊戲端服務回報 `Failed to fetch`，但開場說明卡視覺已檢查。
- `pnpm check:types` 仍有專案既有 908 個錯誤（主要是設計腳本缺 Node 型別與其他舊 Svelte 型別問題）；本輪改動檔案無新增 TypeScript 錯誤。

## 2026-10-01 — 送審品質整改（對照 Deadwood 三次退件的標籤）

- **中獎動作放大**：09-27 照抄了 Deadwood 09-26 的「縮小」版（彈跳 1.16/1.07、閃光 .5、VISIBLE_FLOOR 減半），Deadwood 下一次審查就被打 Poor animations ×2。改回 Deadwood 09-30 的值：1.38/1.15、閃光 .85、10 顆較大光點、floor 15°/10%/15%。`check_symbol_motion` 通過。
- **中獎金額**：GoldText 主體是陣列填色，pixi 8 只畫第一色（骨灰色），所有金額都是灰色。改為鈉燈色 0xffc38a＋加法橙光；其餘三處陣列填色也改單色。小額中獎不再閃出 PRESS ANYWHERE（點擊略過仍有效）。FG 結算金額 0.15→0.2。
- **Loot Bag**：框加常駐邊光、倍率改放在右下角的手繪圓牌（drawer plate）上，不再壓在符號上。
- **FG 開場卡**：Graphics 漸層方框 → `PlateSlice.svelte`（Buy Bonus 手繪板九宮格）＋ticker 板標頭；發牌入場、標題落下、落地閃光、每 3.4s 掃光；鐵捲門打開後（0.35s）才開始。
- **轉場**：鐵捲門改為由上落下（重力加速）→觸地回彈→上捲，不再左右對開。
- **開場說明卡**：CSS 漸層 → 手繪板 border-image；手機橫式（高 ≤520px）縮框縮字，整頁放得下。
- **規則頁**：純文字 → Logo＋數據條、各功能配符號圖、Loot Bag 三尺寸圖、三張等級卡（標題圖）、再觸發圖塊、鋼框卡片（原本 panel_edge 的 border-image 被下一行覆蓋，從沒畫出來）。
- **購買面板**：文案錯誤修正（寫的是 Capo 的「1/3/3 sticky Frames」→ 1/2/1 Loot Bag）；等級名改用標題圖；按鈕改手繪 ticker 板；Loot Bag 圖示提亮。
- **直式**：盤面上方空白處放 Logo（寬 <480 時右上角 Logo 不畫）。
- **Kingpin 角色**：產生器的硬遮罩把藍色輪廓光變成斑駁洋紅色 → `design/kingpin_rim_fix.py` 從 base 圖層以軟遮罩重建（alpha 不變，原圖在 `design/_legacy_assets/kingpin_layers_before_rimfix_20261001/`）。
- **殘留清除**：`meshRigs/cast_girl`、`sprites/capoCast`、capoFx 中未用的 8 張（含槍口火光、彈孔、Capo 金庫門）移到 `design/_legacy_assets/reskin_leftovers_20261001/`。
- 無頭錄影工具（瀏覽器面板隱藏時 rAF 會停）：scratchpad 的 puppeteer-core + 本機 Chrome，逐格錄 Storybook 故事。
- `pnpm run build` 全綠；`./design/ship.sh`（無 zip）EXIT 0，備份 `_upload_backups/TurfWar-frontend-1001-0915.tgz`。**未上傳。**
- **仍未解決**：FG 仍是同一角色換打光，違反「MG／FG 兩個不同角色」規則 —— 需要生圖。
- **Hover 不反灰（同日，使用者要求「像 Deadwood」）**：共用 `components-ui-pixi` 新增 opt-in 主題鍵 `hoverPlateLight`（預設 undefined＝其他遊戲維持原本白色覆蓋）。設定後圓鈕在 hover 時把自己的板子再畫一次（additive、該色），Bet 讀數改為一條亮底線而非 12% 白框。Turf 設 0x9c5a22；Buy Bonus 的 `buyBonusHoverSpriteTint` 由灰 0x5b5f66 改為同色。無頭 Chrome 逐鈕截圖確認。重新打包（無 zip），備份 `_upload_backups/TurfWar-frontend-1001-2308.tgz`。

## 2026-10-20 — 交叉雙臂重畫與接入

已實作 `design/cast_brief_crossed/REQUEST.md`：兩隻獨立新角色、7／6 分層、700ms 抖肩、舊 REST 歸零，球棒改背部綁定。側欄全身高度限制、手機上方半身；載入圖、縮圖、封面一併重做。完整 build 與動作閘門通過，MG／FG 與三種畫面比例已本機 fixture 實播。詳見 `design/CROSSED_CAST_STATUS.md`。已打包至 `upload/TurfWar/`，平台未更新。

## 2026-10-20 — 比例修正 v2（取代本日上一版）

使用者指出人物比例完全錯誤。主因是各層獨立縮放，身體橫向壓窄 MG 28%／FG 24%。重畫完整人物、改為單一等比註冊後原位切層；新 `build_master_cast.py`、舊入口轉送新版。`check_cast_proportions.py` 已納入 build：實際 runtime 合成與定稿輪廓100%一致／RGBA誤差0，並已證明會攔截上一版。重新建骨架、全部閘門與 build 通過，商店／封面／loading 跟同一組圖層重做。詳見 `design/CROSSED_CAST_STATUS.md` 最上方 v2。


## 2026-10-20 平台發佈 v20

交叉雙臂人物比例修正 v2 已上傳並發佈為 front v20，math 維持 v7；遠端與本地176檔一致、同步動作0。actor.ts 新增每局請求前餘額檢查；21秒長按空白鍵測試只送出2筆可負擔請求。商店新版縮圖／封面已打包，平台商店圖未同步，等使用者完成網頁條款和登入；審核版本未變更。收據及自檢風險：upload/TurfWar/RELEASE-{RECEIPT,SELF-CHECK}-20261020.*。

## 2026-10-23 — 使用 spine-motion-kit 更新 MG／FG 動作

使用者要求直接用新工具改 Turf 人物，可自行重畫、不要提問。現有分層可用，保留定稿外觀；將既有骨架與加權網格轉成 Spine 4.3.13，所有動畫由工具配方產生。新增呼吸、抖肩、抬下巴與配件延遲，反應疊在持續待機之上。主遊戲、免費遊戲和 FG 開場卡均接入官方 4.3 runtime，既有符號 4.2 runtime 保留。完整 build PASS，兩隻各 8,641 姿勢無翻面、鞋底位移 <0.001px；三種比例 MG／FG 本機 fixture 已實播，未驗完整十次免費遊戲的回程。全專案型別檢查仍有既有錯誤，本次修改的遊戲檔無錯誤。來源、Import Data 交件、配方、動作 GIF 和完整驗證界線在 `design/spine_motion_cast/README.md`。本機 upload 套件更新；平台未更新。

## 2026-10-23 平台發佈 front v21

回應 10-23 退件（動畫差×3／素材品質低／下注列差）的整套重畫（rebuild_20261023：寫實漫畫風新人物 v3＋Spine 4.3 動作、符號、背景、UI）已上傳並發佈 front v21：上傳 49、刪 36（舊人物圖層／bundle）、再規劃 0 動作；math 維持 v7。審核單 closed，需在網站重新送審；商店縮圖／cover 需在 studio 手動換。

## 2026-10-23 平台發佈 front v22 — 下注列／BB 修正＋spine-motion-kit 格鬥動作

使用者回報 v21「UI 整個壞了、BB 變超小、按鈕超框、人物沒套新動作」。
- `TurfConsole.svelte`：BB 0.64 → 1.35（stateGame 算好的尺寸）；橫式選單／自動／閃電／旋轉鈕全部收進 bar_plate 斜角端蓋（約 42 單位）內；直式把自動＋閃電移到下注列上方右側、主列重排。16:9、4:3、390×844 實看。
- 人物：v3 只有 4 層、動作只是呼吸。`rebuild_20261023/split_kit_layers.py` 依最近骨段把 4 層切成 kit 拳擊模板 13 層（疊回與原圖 alpha 0 差異）→ `spine-motion character`（`kit/<who>/spine`，報告.md）→ `install_kit_cast.py`（裁圖＋region 位移）→ `measure_kit_cast.mjs`（包圍框、反應對照）。runtime `spineCastFigure.ts` 支援 region 附件與整身反應：待機 idle_weave（彈跳型 IK 頓挫 60/70 分不用）、win→punch、winBig/trigger→celebrate（jump 離地 290px 會出框，不用）。後手腕接縫警告是關節點在剪影邊緣的誤報。
- upload 移除不再引用的 v3 圖層；math v7 不變；備份 `_upload_backups/TurfWar-frontend-pre-v22-20261023-1024.tgz`。審核單 closed，需網站重送。

## 2026-10-23 平台發佈 front v23 — 脖子分離／手肘撕裂修正

- 切層 `split_kit_layers.py` 改 `chain()`：關節上方那層只留自身粗細的管＋以關節為圓心的圓蓋，袖口／手肘肉歸下層；前手改為伸出的遠手（刺拳），近手為後手、layers.json 仍疊在上。頭支點下移到頸根。
- `install_kit_cast.py`：頭部 translate ×0.25、rotate ×0.45。`rigid_arms_kit.mjs`（新）：手臂 IK 換算成肩膀整臂轉角、關 IK，手肘／手腕維持原畫。
- 動作改用 `kit/<who>/recipe.json`（`spine-motion generate`）：idle_weave、punch（reach 42）、punch_big（reach 62）；win→punch，winBig/trigger→punch_big；不用 celebrate（近手前臂必過臉）與 jump。
- QA：`dump_kit_poses.mjs` + `render_kit_poses.py` 全解析度渲染（qa_kit/）。math v7 不變；審核單需網站重送。

## 2026-10-23 v5 加權網格人物 — 平台發佈 front v24（math v7）

v23 回報：腳殘影、動作不像產生器（rigid 手臂把出拳／慶祝弄沒了）、BB 太低、脖子仍分離。
- 換做法：`build_mesh_cast.py` 把 4 張原圖（arm_r/body/head/arm_l）各做成一片 16px 格網，依到 kit 骨段的距離加權（chest 另含肩線、shin 含腳、hand 含拳）；`mesh_to_spine.mjs` 轉成 Spine 加權網格 → `static/.../turf/v5/`，並量包圍框、檢查綁定（0.12px）。頭下緣綁脖子／胸口 → 不再分離；身體單片 → 腳無殘影。
- 動作全用產生器預設：idle（彈跳）、punch、celebrate；celebrate 用 `recipe_celebrate.json` 只舉前手（近手舉起必擋臉）。win→punch、winBig/trigger→celebrate。
- BB 橫式 top-125→top-245、直式 top-140→top-175。
- v4 區塊切層腳本（split_kit_layers/install_kit_cast/rigid_arms_kit）保留但已不用；kit 骨架仍由 split_kit_layers 的關節產生。

## 2026-10-23 平台發佈 front v25

v24 回報：loading 看不懂、手分離、脖子分離、動作太快像抽動。
- IntroFeatures Big Score：迷你 3×2 盤面＋frame_full 整圈包住＋50× 標籤（原本外框縮成單格只框住鏈子）。
- build_mesh_cast.py：手臂不綁 hand 骨（拳頭隨前臂剛性移動）；頭部 sigma 30→48。mesh_to_spine.mjs：頭部 translate ×0.2、rotate ×0.5；punch/celebrate 時 arm-back IK mix 0（護臉手跟胸口走，不被壓扁）；turf.speed {idle .7, punch .6, celebrate .7}，spineCastFigure 套用 timeScale、mix 0.15/0.35。
- QA 工具：dump_mesh_poses.mjs + render_mesh_poses.py。math v7 不變；審核單需網站重送。

## 2026-10-23 平台發佈 front v26

v25 回報：100× 標籤擋住、手臂分離（MG/FG）、FG 脖子（衣領）、出拳肩膀不動。
- NeonFrames 倍數標籤 0.62–0.76 → 0.42–0.5 格，整個收在自己那格右下角。
- build_mesh_cast.py：手臂根部只 30% 固定胸口；身體遠側肩頭 70% 跟上臂（同比例一起動）；`CHARS[who].sleeve_bulb`（split_kit_layers.py）把身體上畫的上臂膨袖／捲袖肩頭 100% 綁上臂（上臂前 60% 段、45px 漸變）；頭下緣（下巴／鬍子）固定胸口。
- 動作：celebrate 改上臂水平＋前臂舉拳（recipe_celebrate.json elbow 0 / angle 80）；punch reach 80、windup 30、lean 8＋胸口 screen rotate −2→+5（往出拳方向扭）。
- math v7 不變；審核單需網站重送。


## 2026-10-27 送審前修正與本機驗證

三項原始FAIL均已修正：ModalMessage不足餘額提示；WebAudio／HTMLAudio播放中即時靜音（含無AudioContext啟動）；RGS jurisdiction.socialCasino opt-in社交英文／用語。另修認證錯誤被開場卡遮住、小視窗重播3欄2列、GC數字ink基線、portrait重複免費局計數與有效src型別錯誤。svelte-check 0 errors／0 warnings，Turf完整guard/build PASS。

v5權重修正胸／拳誤綁、腿部全綁chest與肩部過窄權重交接，保留原骨架／曲線／幅度／尺寸／速度。guard改讀實際runtime v5，兩角色6862姿勢含中斷混合通過，舊v5反例會攔。來源與runtime裁圖合成RGBA誤差0；321格實際renderer輸出、7clip／混合、桌機與portrait目視未見破口／分離／碎片。工具idle IK warnings保留如實列於報告，未冒充滿分。

三檔feature完整進出、Kingpin20,000×封頂；四模式重播完整結束且零wallet請求；RGS-only九介面與SC／GC feature掃描0禁字；hasTouch實際tap開局正常。14個遊戲最終Vite編譯PASS；13個完整app guard通過，HotMiami既有H2重複頭髮／full合成美術guard失敗，未修改該美術。GoBananas100／SoulSeal型別guard修跨平台路徑，不提高baseline。

本機upload/TurfWar166檔更新，source／build／stage一致；math與商店圖hash不變。平台未更新／未重送審，開始前唯讀front27／math7、approval closed／locked。Studio圖、真實RGS、舊手機與人工題材／原創性需後續確認。報告與證據：design/qa/precheck_20261027/TurfWar-fixes-20261027.html；送審包收據LOCAL-PRECHECK-FIX-20261027.json。舊v3／舊v5收據與preview不得拿來證明本次修正。


## 2026-10-27 已上傳並發佈 front v28（math v7）

使用者明確授權「改完幫我上傳發佈」。核對同一測試來源與166檔本機manifest，validate無warning；plan上傳15、刪3舊bundle／style、137不變，6,516,193 bytes。execute_upload成功，發佈前scratch152檔吻合／0 actions。publish回傳published=true、changed=true、version28，get_game確認front28／math7，發佈後plan仍0 actions。math9檔未變、不重發math。

平台已更新；審核仍closed／locked，未更新approval version、未新送審；商店thumbnail／cover未同步。沒有取得真實玩家session，未以scratch零差異冒稱CDN byte驗證。收據：upload/TurfWar/RELEASE-RECEIPT-20261027.json；API證據：design/qa/precheck_20261027/publish/。前一段「平台未更新」為發佈前歷史狀態。

## 2026-10-30 — 圖騰局部動態與收勢優化

項鍊／鈔票／瓶身／車身懸吊／音響振膜加入連續局部網格；房子窗光依原圖註冊，四個塗鴉透過原 alpha 遮罩描亮。去除共用光暈星芒、補齊 970ms 起終回位，修星星／皇冠／指虎待機接點。主角 Spine、美術 PNG、玩法與數學未修改。完整 guard/build PASS、型別 0/0；桌機 base64 $0.70、手機 Lookout0 完整12次 $29.80。證據 design/qa/symbol-craft-20261030/REPORT.md；本機 upload/TurfWar 152 frontend 檔與 build 同版，9 math hash 不變。平台未更新。

## 2026-10-31 圖騰安定節奏（Stone：太頻繁）
- SymbolSprite 取消常駐縮放呼吸；symbolIdleFrame 改成共用 20 格排程，每 5.2 秒最多一顆短動作，單格 104 秒輪替，空檔精確回原姿勢；中獎與落地動作未變。
- check_symbol_idle 加入完整 104 秒週期的單種與混合盤面檢查：最多一顆 act，非 act 無位移／旋轉／縮放／透明變化。
- 完整 build PASS；svelte-check 0 errors / 0 warnings。production 本機 stub 直式畫面成功啟動與回到安定盤面；此次未完整重跑桌機／所有 bonus。直接開 dev 無 RGS 時的 Failed to fetch 為認證缺參數，改用既有本機 stub 後可啟動。
- 測試版：dist/turfwar-street-v2（http://localhost:8016/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en）。未同步 upload 包、未上傳平台。

## 2026-10-31 背景安定節奏
- Background 固定構圖，移除整張圖的左右漂移。
- StreetLife 旗子／吊燈使用共享慢風：31 秒週期、19 秒停風，旗角小幅動作；旗子掛點改用吊繩的同一條 Bézier 曲線。
- 鴿子 48 秒週期只走兩段各 5 秒，停留時腳不動；啄食改頭部動作，不再轉動整隻鳥。
- 煙霧 17 秒淡入／升起／消散，端點透明，多層低透明度邊緣；feature 燈維持暖光、不再規律熄滅閃爍。
- 完整 build PASS，svelte-check 0 errors / 0 warnings。本機 production stub 已開啟桌機 1280×720（縮圖檢視）及直式主遊戲；未完整重跑 bonus。瀏覽器工具記錄一筆無來源的 MutationObserver observe 錯誤，未確定出處，畫面可正常載入；不宣稱 console 零錯誤。
- 本機預覽 dist/turfwar-street-v2 已更新；upload 包與平台未更新。

## 2026-10-31 動態收斂與送審前檢查
- Symbol idle：20格共用104秒排程，每5.2秒輪下一格，最多1格動作，其餘完全rest；中獎演出保留。
- StreetLife：背景固定、旗幟雙端貼纜線與延遲布面、31秒風週期含19秒平靜、燈具延遲、低透明蒸氣；鳥落在路面865並長停頓。
- 最新本機預覽已更新 dist/turfwar-street-v2；build成功。未更新 upload/TurfWar 或平台。
- 完整報告：design/qa/precheck_20261031/report.html。官方51項：25 PASS、1 FAIL、19 AT RISK、5 NEEDS A HUMAN、1 N/A；另1個house UI FAIL。
- FAIL #26：rulesText.ts:39「at most one lands on any spin」與有正權重的bonus book2289 event20兩個Bruiser矛盾。建議改全部規則／intro單一出現承諾，或另行變更生成器。
- FAIL UI：ReplayIntro.svelte:279–290 Start Replay深底深字，對比1.718:1；建議橘底深字並補focus。
- JPY共享formatter兩位小數與官方零位標準、先前審查註記衝突，先確認適用規格。全幣別、真人手機、Kingpin/max-win/error回放矩陣、全部社交modals與角色全部動作視覺驗收仍待補；無法以guard代替。
- 本機真books回放已驗base64重播、Lookout0 XSC、Muscle0 XGC400×225完成，只有GET replay、無wallet與執行錯誤。全100000 books/LUT一致，12501中獎線重算通過。
- 審查遵循engine-self-check.md的read-only/report-first要求，未順便修規則或共享幣別。報告保留證據與SOURCE/BUILD SHA256。

## 2026-10-31 授權上傳發佈完成
- Stone明確授權「上傳發佈」；修正Bruiser occurrence規則與16語言intro，回放橘底深字及focus。
- 完整build通過，svelte-check0 errors/0 warnings；本機production回放卡已確認新按鈕，證據publish/replay-fixed.png。
- upload/TurfWar/frontend精確鏡像新build（152檔）；上傳5檔、刪除3舊雜湊、147不變，3510645 bytes。post-upload plan0 actions。舊stage可恢復於dist/turfwar-pre-release-20261031。
- publish回傳front32，get_game確認front32；math保持7。審核仍closed/locked，未更新審核或另開送審。商店圖未修改。
- 憑證design/qa/precheck_20261031/publish/RELEASE-RECEIPT.json；原報告保留未補的實機與人工檢查，不將發佈成功當作51項全數通過。


## 2026-11-02：Neon 一般轉輪節奏試版

Stone 要求把協作者 GoBananeon 的節奏套到 Turf 試看。參考 origin/main `19bedb2e` 的一般轉速，僅改 `src/game/constants.ts` 的 `SPIN_OPTIONS_DEFAULT`：起轉錯開 100ms、normal padding 1、回彈 0.12 格；四個 px/ms 速度乘 `SYMBOL_SIZE / 140`，對齊兩款不同格子尺寸下的時間。保留 Turf 的 landOnImpact、聽牌慢速規則、音效與 Turbo 設定。未搬 Neon 的模糊濾鏡。

完整 build 與 check_reel_stop_sound 通過。Chrome 本機 stub 實測 5 手一般轉速，停輪間隔中位數 200ms，首末輪差 786–800ms；回彈實際取樣約 81–85ms（設定值約 76ms，受逐幀量化影響）。桌機與 390×844 直式主遊戲各有轉完及截圖；未完整重跑 bonus / 聽牌 / Turbo。5 手桌機測試的 QA error 收集為空。

預覽：`dist/turfwar-neon-rhythm/`，`http://localhost:8017/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`。量測 JSON 與桌機／直式截圖在該資料夾 `evidence/`。此為本機試玩版，未同步 upload、未上傳平台。


### 2026-11-02: Neon cadence published

User requested upload and publication. Build PASS. Staged `/Users/stone/stake-engine/upload/TurfWar/frontend/` matches tested production assets. Front plan4 actions (3 uploads,1 deletion,149 unchanged),3,411,024 bytes uploaded; subsequent plan0 actions. Published **front v33**, verified with get_game; **math v7** unchanged,9 files match remote,CLI compliance PASS. Existing thumbnail/cover retained; platform store artwork unchanged.

Incremental51-item review against final v32 sources: only constants.ts differs;26 PASS /19 AT RISK /5 NEEDS A HUMAN /1 N/A /0 FAIL. Outstanding complete currency/device/audio/replay matrices retain their risk labels. Approval closed+locked; no approval-version update or new submission. Public CDN index returned403, so published CDN bytes were not independently compared. Receipt and audit: `design/qa/release_20261102_neon/`; release receipt/self-check also saved under upload/TurfWar.


### 2026-11-02: corrected Neon spin presentation, front v34

Stone rejected v33 as an incomplete port: matching stop timing alone did not meet the requested spinning feel. Re-read GoBananeon on origin/main19bedb2e: all3 utils-slots spin/pre-spin/board engine files are byte-identical to our shared engine. The missing presentation was ReelMotion.svelte + reelMotion.ts: actual frame displacement drives one vertical BlurFilter per reel; padding identity changes rebase the sample; build45ms/sharpen24ms smoothing and a lower bounce cap make strips clear as they brake.

Ported those two files (reelMotion.ts byte-identical) and behavioral check_reel_motion.mjs; BoardBase wraps each strip in ReelMotion. Removed SymbolSprite's two faded ghost copies,30% vertical stretch and15% motion dim. The blur prop remains only to suppress idle acts while moving. Normal cadence is still100ms start stagger/~200ms stop gaps, with Turf landOnImpact retained. Turbo/anticipation math profiles and character art are unchanged. Build and svelte-check PASS (0 errors,0 warnings).

Actual production Chrome:3 complete desktop normal rounds and1 portrait round.321 measured active-filter samples,306 while at least one reel spun; strengthX0, peak strengthY15.44px; no active filter on fully stopped board, caught window errors empty. First-to-last stops799–801ms. Screenshots include3 stopped sharp columns beside2 still blurred moving columns. Actual captured clip: `design/qa/release_20261102_neon_motion/neon-motion-preview.gif`. Preview now http://localhost:8018/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en (8017 is the superseded cadence-only trial).

Continued the user's upload/publication instruction for the corrected result: staged upload/TurfWar/frontend exactly from this build.4 plan actions (3 uploads+1 obsolete bundle deletion),3,428,406 bytes uploaded; subsequent plan0 actions. Publish success **front v34**, get_game confirmed **front34/math7**. No new approval submission/version change, no store-art change; original thumbnail/cover remain staged. Receipt, source comparison, full inherited-checklist gaps and new runtime evidence in `design/qa/release_20261102_neon_motion/`, with receipt/self-check copied to upload/TurfWar.

## 2026-11-03 — 審查四類回饋的本機改善版

Stone 先要求分析，再授權「做」。本輪是本機實作／比較／驗證，**未更新 upload/TurfWar、未打包、未上傳或重新送審**；math、角色來源／rig、縮圖與封面未改。

- 新 app-local `TurfPortrait.svelte`：餘額／贏分並列，下注與大旋轉鍵放同一層，下方四個次要控制。整塊下注框可觸控開金額選單；沿用既有 drawer／free-spin、modal、按鈕 provider。桌機結構與 replay UI 保留原路徑，沒有修改共用 packages。
- `design/build_review_glyphs.py` 是本輪四低賠符號＋四按鈕的可重建原生幾何來源；舊圖備份在 `design/qa/review_fix_20261103/before-assets/`。保留符號身分、原註冊與透明背景，補分層筆觸、刻線與明暗邊緣。低賠佔格平均15.4%（高賠37.7%）、輪廓對比4.77–4.81，階級guard通過。
- Scatter 的通用金星 `FxBurst` 換成 `ScatterSignal`：兩個喇叭的外向波紋與音量條，依 feature time scale 收勢。Frame entry 的分級改與靜態相同（mult × size），等待實際tier動畫長度，更新／加倍音效改在數字換值時播。8ms取樣：reroll約172ms、double約214ms，聲音與換值同窗。
- Sound：BGM 360ms交叉淡化且舊媒體source會斷線；聽牌／coin循環80ms起音與100ms收音，移除Anticipations對舊sprite播放器無效的fade呼叫。Wild和弦45ms同時落地去重，保留五次物理停輪click。新增共用compressor與headroom，處理真實功能回放中量到的重疊過載；靜音仍即時套用所有活躍／收音voice。所有被測cue均走Turf映射，fallback清單空。

最終完整build與guards PASS；最後下注框hit-area調整後再Vite編譯＋refs PASS，svelte-check 0 errors／0 warnings，diff whitespace check PASS。四種viewport 320×568／390×844／640×420／1280×720無scroll overflow與window exception；Chrome實際touch選$2後開局stats wagered=$2；social金額選單無BET。滿音量五種SFX＋聽牌重疊peak0.558、0 overload samples；播放中mute量到peak0。

同一最終build的手機normal與桌機實際按鈕鎖定Turbo各6組：BASE books64（中獎）／1（Bruiser）／1546（Big Score）／11（Lookout）／29（Muscle）／50（Kingpin），全12組至finalWin exit並返回base。手機完整混音peak0.593、桌機0.583，均0 overload samples；window exception／HTTP≥400皆空。角色未改，完整pose／layer guard與兩尺寸實播保留證據；未以舊人物preview證明本次版面。

review-tags為0 FAIL／4 WARN，保留盤面底色、字體Logo、sticky記號、spin plate低色數警告；這是機械檢查結果，不代表人工素材評價或四類評語已被撤銷。沒有以加雜訊消警告。

預覽：`dist/turfwar-review-20261103/`，`http://localhost:8021/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`。報告、前後比較與含音訊實際回放：`design/qa/review_fix_20261103/report.html`。final source hash與152檔build manifest已保存；preview除注入fixture的index外正式檔逐檔與build一致。早期探測的before-desktop.webm／after-mobile-first.png是過程資料，不作最終驗收；以report引用的final截圖與after-{390,1280}-gameplay.webm為準。

驗證界線：本機已發布book fixtures／Chrome觸控與viewport模擬，沒有真實玩家RGS session或實體iOS／Android裝置；音訊以輸出量測和回放交件，人工音色偏好與平台通過仍未確認。

補驗：手機replay BASE64正常完成至finalWin exit、wallet rounds=0、無window exception；replay-report.json／replay-final.png。探測必須等Svelte replay-start事件handler就緒才按，不能把pre-hydration click當作真正開始。

## 2026-11-03 — 已上傳並發布 front v35（math v7）

Stone明確授權「上傳發布」。核對改善版來源／測試build／stage雜湊，upload/TurfWar/frontend152檔與已驗證build完全相同；舊stage備份於_upload_backups/TurfWar-frontend-pre-review-fix-20261103.tgz。validate無warning，front plan12 actions（11上傳＋1舊bundle刪除、141不變），3,803,102 bytes。execute成功，上傳後plan0 actions。publish回傳published=true、changed=true、version35；get_game獨立確認front35／math7，發布後plan仍0 actions。math9檔與remote無差異，CLI compliance PASS、0 failures／0 warnings；thumbnail／cover與provider14個保留檔hash不變，未更新平台商店圖。

本輪官方51項增量自檢保存於design/qa/review_fix_20261103/publish/SELF-CHECK.md：26 PASS／19 AT RISK／5 NEEDS A HUMAN／1 N/A／0 FAIL，保留完整幣別／實體手機／真人RGS與人工美術音色等未完成矩陣。補充官方精確尺寸的舊headless瀏覽器嘗試未完成，已停止，不推定PASS；原本最終4尺寸與12組回放證據有效。審核仍closed＋locked；沒有更新approval version或新送審。沒有以scratch零差異聲稱公開CDN逐檔驗證。收據：upload/TurfWar/RELEASE-RECEIPT-20261103.json；API與manifest證據在design/qa/review_fix_20261103/publish/。

## 2026-11-05 — 人物動作最高標準複查＋修正（本機，未打包未上傳）

Stone 要求以最高標準看人物／動畫，選「人物動作先修」。只動 v5 rig 與動作；四張原圖逐像素不變（PNG 位元組也還原成原檔），math、UI、upload 包、平台都沒動。重建一行：`design/rebuild_20261023/regen_motion.sh`（spine-motion generate 兩份配方 → build_mesh_cast.py → mesh_to_spine.mjs），可重現、輸出確定。

修了什麼（MG 與 FG 同步）：
- **出拳手腕後折**：拳頭原本硬綁前臂，防守圖的拳頭比前臂高約 20°，伸直後像手腕往後翻。拳頭改綁 handF（腕部 ±30px 漸變），配方加 handF −24° 出手；前手權重從腕部起不再分給上臂（舊版伸直時腕部拉伸 2.0x，現 1.6x），手肘內折處保留原寬混合，並做 4 次網格平滑。
- **出拳只有手**：胸口扭轉 5°→9°、前傾 8→11；身體層胸口／髖部分配沿網格平滑（WAIST_PASSES 12），腰側不再被摺。
- **慶祝太弱**：前手上臂抬 15°/前臂 88°（試過 35–55°：MG 身體上畫的肩頭膨袖會留在原地變一顆球、FG 捲袖扭曲 → 退回），加兩次離地跳（預設彈跳 14 + 雙腳 IK 目標 50/38px 同步抬起），後手 upperArmB/foreArmB 做往下拉的「Yes!」。
- **前手（護臉手）不動**：慶祝時往下拉到腹部（不經過臉）；出拳仍隨胸口。
- **新發現：腳底浮動**：kit 只有後腳 IK（目標偏離腳踝約 80px、softness 89），前腳沒 IK，鞋子硬綁小腿 → 待機時腳尖腳跟 ±17（MG）／±27（FG）px 上下翹、滑。現在雙腳 IK 目標放在腳踝、softness 0＋stretch、腳掌骨 footB/footF 不繼承旋轉；大腿／小腿權重改沿大腿軸線（膝上 110／膝下 70px），修掉 MG 後腿口袋帶子落地時彎折分叉。殘餘漂移 ±3–7px。
- **只安裝遊戲會播的動作**：idle／punch／celebrate。hit／jump／punch_big／idle_weave 從未接上，雙腳踩穩後 hit 會把後膝折過頭；kit 骨架仍保留。

驗證：check_spine_motion_cast（含中斷混合 3128 姿勢/角色）PASS，墨線三角形面積比 MG 0.211–1.874（舊 0.107–2.404）、FG 0.210–2.028（舊 0.239–2.247）；完整 `pnpm build` 綠。離線逐格（每 0.1s、遊戲實際播放速度與 0.15/0.35 混合）全身＋關鍵格放大（拳、肩、膝、腳、臉）看過；本機試玩 dist/turfwar-motion-20261105（port 8022）桌機 1280×720 MG 出拳／觸發慶祝／FG Kingpin、直式 390×844 出拳，無錯誤、拳不碰盤面也不壓 Logo。證據：design/qa/motion_review_20261105/（before_v5 備份、after/ 圖、render.py、_qa_sim_runtime.mjs、tri_check.py、feet.py）。

未做：upload/TurfWar 未更新、未上傳發布、未送審；角色縮圖／封面未重做（姿勢沒變）。轉場鐵捲門、數字壓圖、中獎標籤堆疊、直式人物裁切、載入疊字仍待處理（見同資料夾第一次複查）。

### 2026-11-05 — 人物動作修正已上傳並發布 front v36（math v7）

Stone 明確授權「Stage and publish」。ship.sh（SKIP_MATH_CHECKS=1 SKIP_STUB=1，數學與 math-sdk 一致）重建＋全部 guard 綠；舊 stage 備份 _upload_backups/TurfWar-frontend-pre-motion-20261105.tgz。upload/TurfWar/frontend 152 檔與 build 完全相同，兩個 cast.spine.json 與本機試玩版逐位元組相同；與前一版只差 2 個 rig JSON＋bundle（大小相同、只有建置時間戳）＋version.json＋index.html。plan 5 上傳／1 刪舊 bundle／147 不變（4,139,544 bytes），execute 成功後 plan 0；publish 回傳 version 36，get_game 確認 front 36／math 7，發布後 plan 仍 0。審核 closed＋locked，未更新 approval version、未送審；商店圖未改（姿勢沒變）。收據 upload/TurfWar/RELEASE-RECEIPT-20261105-motion.json；API 證據 design/qa/motion_review_20261105/publish/。未以 scratch 零差異冒稱公開 CDN 逐檔驗證。

## 2026-11-05 — 畫面問題修正（本機，未打包未上傳）

接續同日人物複查清單的畫面項目。本機 build＋全部 guard 綠、svelte-check 0/0；試玩 dist/turfwar-screens-20261105（port 8023）。未更新 upload、未上傳。證據 design/qa/motion_review_20261105/screens/。
- **數字壓圖**：開場說明頁的 VOLATILITY 與「14 PAYLINES / MAX WIN 20,000×」改放 ticker_plate（bet bar 同款）牌子上（IntroFeatures `.hm-tag`）；pixi 載入畫面的「5X4, 14 LINES — MAX WIN」也放 PlateSlice(hmUiTicker)。
- **載入／說明頁疊字**：IntroFeatures 原本整張 opacity 0、等 420ms arming 才淡入，期間 pixi 載入畫面的標題／MAX WIN／提示／PRESS ANYWHERE 透出來。現在背景第一格就不透明（in:fade 140ms），只有內容等 arming 淡入；關閉仍 320ms 淡出。
- **直式人物從大腿被切**：直式寬度限制縮放，`visible` 比例無效。CastFigureMesh 加 `cut`（指定 ink 第幾成對齊盤面頂邊），直式 MG 0.47（外套下擺）／FG 0.42（皮帶下）；頭頂超出才退回原位置。
- **鐵捲門轉場**：原 shutter_l/r、lock 是 10-16 換畫風的過渡版（淺灰條紋＋舊貼紙、橘方塊＋白 U 鎖），正式圖從未交件。`design/shutter_20261105/build_shutter_v2.py` 依 bg_base 的手繪鐵捲門畫法重繪整面（藍灰鋼片三階、溝槽墨線、碎鏽＋暗邊、斜向分色陰影、09-06 生成鐵捲門只取刮痕高頻（左半＋鏡像，避免中線）、踢腳條＋拉把＋中央鎖扣、噴上遊戲 Logo），一張切兩半；鎖改用 09-06 生成的圓形掛鎖（墨線分色，透明邊乾淨）。舊圖在 design/_legacy_assets/turfFx_interim_20261016/。TransitionAnimation：鎖從鎖環頂端擺動落下扣上（不再像轉盤轉 112°），開門時先晃、脫落、淡出，鐵捲門往上捲（原本是往左右分開＋旋轉）；拿掉中縫黑帶（整面一張畫，接縫亮度差 2.8 < 一般相鄰欄 3.7）；鎖 min(0.32H, 0.42W)。離線關鍵格 transition_frames_{1280,390}.jpg＋遊戲內重播模式實錄（放慢 rAF 0.2x 只為截圖）。
- **不改：中獎金額標籤直排**：同輪多條線的標籤排成一列是 10-15 依 Deadwood 審核意見（每條線金額都要看得到）刻意做的。
- 仍未做：TURF WAR 打字 Logo 在說明頁壓在曬衣繩上（是 Logo 不是數字，可另議）；鐵捲門仍是程式繪製，若要手繪正式圖需生圖。

### 2026-11-06 — 畫面修正已上傳並發布 front v37（math v7）

Stone 要求排程 11/6 00:45 stage and publish；排程沒有執行（早上 08:35 平台仍 front 36、stage 停在 11-05 21:56），Stone 說「請再試一次」→ 08:4x 直接執行。先確認 11-05 22:29 試玩建置之後沒有任何來源被改。ship.sh（SKIP_MATH_CHECKS=1 SKIP_STUB=1，math 與 math-sdk 一致）全 guard 綠；舊 stage 備份 _upload_backups/TurfWar-frontend-pre-screens-20261106.tgz。stage 152 檔＝build；轉場 3 圖與 2 個 CSS 與已測 dist/turfwar-screens-20261105 逐檔相同，bundle 只差建置時間戳 5 bytes。plan 8 上傳／3 刪舊／144 不變（8,181,847 bytes），execute 後 plan 0；publish version 37，get_game 確認 front 37／math 7，發布後 plan 0。審核 closed＋locked，未更新 approval、未送審；商店圖未改。收據 upload/TurfWar/RELEASE-RECEIPT-20261106-screens.json；API 證據 design/qa/motion_review_20261105/publish_screens/。

### 2026-11-06 — 揮拳肩膀分裂＋連線數字雜亂（本地，未上傳；平台仍是 front v37）

Stone：「人物揮拳的那隻手的肩膀處還是有分裂感」「連線跳小數字在盤面上有點雜亂看不清楚尤其是很多條線的時候 參考催眠猴淡出」。

- 肩膀（MG＋FG）：身體圖層畫的肩頭只跟手臂 0.3–0.5，手臂層同位置是 0.7–1.0，出拳到底時肩頭留成一顆球、描邊橫過袖子；FG 另外是手臂根部從背心底下滑出、露出自己的圓形描邊。修法在 `design/rebuild_20261023/build_mesh_cast.py` 的 `shoulder_field()`：沿畫好的袖縫（`split_kit_layers.py` 的 `sleeve_edge`，MG 肩頭內縫、FG 背心袖口）定同一個權重場，身體肩頭照抄手臂層的權重，手臂根部在軀幹那一側改跟胸口；兩邊都沿網格抹平。`check_turf_layered_cast.mjs` PASS（MG 0.116..1.952、FG 0.210..2.028）。證據 `design/qa/shoulder_20261106/`。
- 連線數字（`src/components/WinLines.svelte`）：拿掉白邊貼紙牌與整列堆疊，改成催眠猴式：最後一格上一個數字＋淡黑底，跑完淡入、停住、淡出；同一格多條線輪流出現（每條 600 ms／turbo 360 ms），全部停 650／320 ms 後一起淡出。閒置重播（`src/game/utils.ts`）改成一條一條輪播。桌面與直式 390 實測：book 38961（8 線）、18277（同格 $0.50 → $16.00 ×2）。
- 試玩版 `dist/turfwar-lines-20261106`（launch `turfwar-lines-1106`，含 `?slow=N` 慢動作與 `?forceBook=`）。

**11-06 14:17 已發布 front v38（math v7）**：Stone「給我看GIF然後上傳發佈」。先給 GIF（design/qa/shoulder_20261106/shoulder_punch.gif、shoulder_celebrate.gif＝新 rig 實際速度渲染；win_values_8lines.gif＝試玩版 book 38961 實錄）。ship.sh（SKIP_MATH_CHECKS=1 SKIP_STUB=1）全 guard 綠，舊 stage 備份 _upload_backups/TurfWar-frontend-pre-lines-20261106.tgz；stage 與 build 相同、兩個 cast.spine.json 與 static 相同。plan 5 上傳／1 刪舊 bundle／147 不變（4,144,436 bytes），執行後 plan 0；publish version 38，get_game 確認 front 38／math 7。審核 closed＋locked，未更新 approval、未送審；商店圖未改。收據 upload/TurfWar/RELEASE-RECEIPT-20261106-lines.json；API 證據 design/qa/shoulder_20261106/publish/。FG 免費遊戲的數字節奏未在畫面上另外看過。

## 2026-11-09 — 人物動作 v6 全面重做（本機，未打包未上傳；平台仍 front v40）

Stone：「Turf還是超低分 幫我全面優化動作動畫 任何接縫處我都要很自然 要有專業虎機動畫的水準」。四張圖不變（與 v5 逐像素相同、PNG 位元組也相同，商店圖／loading 不用重做），骨架、權重、動作、播放全部重做。來源 `design/cast_v6/`，安裝到 `static/assets/castLayers/turf/v6/`；v5 搬到 `design/_legacy_assets/castLayers_v5_20261109/`（gitignored）。

重建一行：`python design/cast_v6/build_v6.py && python design/cast_v6/assemble.py && node design/cast_v6/finalize.mjs --install`（python 用 /Applications/anaconda3/bin/python3）。

- **骨架**（build_v6.py）：hip→spine→chest→neck→head、左右鎖骨、手臂三節、雙腿 IK（鞋子 noRotation 踩地）、肩膀半轉輔助骨 deltF（動作自動 key 成 upperArmF 的一半，抬手時肩頭是圓的不會凹）、physics 鏈：MG 兩條帽繩＋腰間鍊、FG 領帶（兩端固定、中段擺；鍊子同）。物理加 limit 上限，turbo 不會甩過頭。
- **權重**：每張圖在自己的網格圖上解 harmonic（Laplace）場，只釘骨頭核心；接縫規則＝上層畫在同一部件上時抄下層權重（MG 膨袖／FG 襯衫袖肩抄手臂、帽子／領口在頭下面那塊綁 neck）；袖縫折線 `armholeF` 沿真正袖縫、袖下繞到軀幹外（外套前片／背心側邊留給胸）；手臂被身體蓋住且離外露處 34px 以上的根部才抄身體權重；外露袖子不帶胸/腰權重、上臂側不帶前臂權重（緊折手肘的折痕不互漏）。
- **動作**（motions.py，Iron Jaw 三星節奏）：idle 2 s 正弦循環（髖下沉＋重心前移、呼吸、肩膀隨呼吸、頭部抵銷軀幹保持看盤面、護手每節晚 0.067 s）；win＝刺拳（0.30 蓄力／0.10 出手／停頓／收）；winBig＝兩記刺拳＋上勾拳；trigger＝蹲低後爆發、往側上方連續舉拳兩次（拳頭不經過頭後）。出手時軀幹先帶、手臂 snap、軀幹後到；蓄力與護手永不把手肘折得比原圖更緊；手肘伸直只到 80%（MG/FG 都是）、前臂 scaleX 補距離；FG 前手抬高 ×0.78、鎖骨 ×1.35。
- **播放**（src/game/castDirector.ts，遊戲與 QA 共用）：overlay——idle 永遠在 track 0 不重來；反應在 track 1 混入 0.12 s、混出 0.25 s 接回 idle 當下相位；反應進行中再來的反應排隊（只留最新），等這一拳收勢時接上，不在出拳半途切斷。SpineCastFigure 改用 director；CastFigureMesh 指向 v6，assets.ts 鍵改 turfV6*。
- **閘門**：`check_spine_motion_cast.mjs` 改用 CastDirector（含 physics）跑全部 clip＋每種反應×被打斷×idle 相位×1/2 倍速＋24 秒 idle；壓扁/翻折三角形若被上層圖完全蓋住（`design/lib/cast_occluded.py` 量 ≥0.98）才放行。目前 base/fg 各 21050 姿勢通過、墨線三角形面積比 0.084–4.61／0.085–4.54。check_cast_proportions（runtime 裁圖＝full 合成，RGBA 誤差 0）通過。
- QA 工具：sim.mjs（同一個 director 傾印頂點）、render.py（bilinear＋預乘，這台 8GB 機器請單程序）、analyze.py（每格速度／跳點）、tri_scan.mjs、tri_time.mjs、trace_mix.mjs、occlusion.mjs、viz_weights.py／viz_bone.py。
- 動作包絡（決定側邊人物縮放）：第一版出拳太長，實測 4:3／16:10／16:9 人物都比 v5 小約 6%（scale 0.218 vs 0.232、0.272 vs 0.290）。出拳改成：手肘伸直 MG 70%／FG 74%、前臂不拉長、拳頭只轉 −10°、出手時重心不前移、胸口扭轉減小 → 包絡 MG [36,1075]（寬 1039，v5 1038）、FG [100,1114]（寬 1014，v5 1025），人物大小與 v5 相同。量法：`design/cast_v6/envelope_by_clip.mjs`；遊戲內 `__PIXI_APP__` 找 `turf-cast-base` 的 scale。
- 實機（dist/turfwar-motion6-20261109，launch turfwar-motion6-1109）：MG 中獎出拳、forceBook=11 觸發 → 慶祝舉拳 → Lookout 開場卡 Kingpin → FG 盤面 Kingpin、直式 390×844 Kingpin 腰部切在盤面上緣，皆無頁面錯誤。
- 證據：`design/qa/motion_v6_20261109/compare_{mg,fg}.gif`（左 v5 現行、右 v6，同一事件序列實速）。

### 2026-11-09 — 小腿彎曲修正＋已上傳發布 front v41（math v7）

Stone 截圖 FG 後腳：「腿下半部不要不自然彎曲動作」。原因兩個：①膝蓋骨頭比畫出來的膝蓋低 80–120 px（FG 後腳骨頭在 y1110、畫的膝蓋折在 ~990），蹲低時腿在小腿中段折；②大腿／小腿權重過渡拉太長，小腿彎成香蕉。修法：四條腿的膝蓋改放在畫的膝蓋中心（MG kneeB 240,1075／kneeF 810,1070；FG kneeB 250,990／kneeF 755,985），大腿核心 t 0.24–0.78、小腿核心 t 0.24–0.88、各自只在離另一段 25px 以上處釘（膝蓋和腳踝小範圍彎、小腿保持直）；慶祝蹲低 −30→−24。閘門 base/fg 各 21050 姿勢 PASS。

Stone「做完就上傳發佈」：ship.sh（SKIP_MATH_CHECKS=1 SKIP_STUB=1，math 與 math-sdk 一致）全 guard 綠；舊 stage 備份 `_upload_backups/TurfWar-frontend-pre-motion6-20261109.tgz`；stage＝build、兩個 rig 與閘門驗過的檔逐位元相同。plan：front 上傳 5／伺服器端複製 8（v6 PNG 與 v5 相同位元組）／刪 11（舊 bundle＋v5 資料夾）／不變 139，4,820,082 bytes；math 0 動作。執行後 plan 0；publish version 41，get_game 確認 front 41／math 7。審核 closed＋locked，未更新 approval、未送審；商店圖未改。收據 `upload/TurfWar/RELEASE-RECEIPT-20261109-motion6.json`，ART-PACKAGE-SHA256.json 已重算；API 紀錄 `design/qa/motion_v6_20261109/publish/`。
