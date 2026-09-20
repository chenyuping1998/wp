# Turf War — 交接文件

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

