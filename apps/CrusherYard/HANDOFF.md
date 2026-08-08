# Crusher Yard — 專案交接文件

> 最後更新：2026-08-08
> 涵蓋範圍：`apps/CrusherYard` 前端 + `math-sdk/games/CrusherYard` 數學後端
>
> **狀態：可上傳驗證，但符號與部分過場仍是佔位。** 未完成的項目集中列在 §11，
> 不要當成已完成的東西看待。

---

## 1. 遊戲規格

| 項目 | 值 |
|------|-----|
| Game ID | `CrusherYard` |
| 版面 | 6 軸 × 5 列（pay-anywhere／scatter pays，無賠付線） |
| 中獎規則 | 同一符號在盤面上出現 **8 個以上**即賠付，**不需要相鄰**；消除後上方符號落下遞補，連鎖直到不再中獎 |
| RTP | 96.0%（base 與 bonus 皆為 0.96，實測精確命中） |
| Max Win | 15,000×（base 命中率 1/1e6；bonus 1/1e6） |
| Bet Modes | `base`（1×）、`bonus`（Buy Free Spins **80×**） |
| Free Game 特色 | **壓力表**：全域倍數起始 1×，每次 tumble +1×，**整場 feature 不重置**，上限 50 |
| 第二層倍數 | **氮氣瓶（M）**：僅免費遊戲出現，值 2–100。一轉連鎖結束後，盤面上所有氮氣瓶的值**相加**，乘上該轉的全部贏分 |
| 符號 | H1–H4、L1–L4、S（Scatter）、M（Multiplier）。**沒有百搭** |

### 為什麼沒有百搭

pay-anywhere 的 wild 會同時併進**每一個**符號群組 —— `Scatter.get_scatterpay_wins`
把 wild 位置 append 到每個 symbol 的 positions 陣列，所以盤面上一個 W 可以同時
讓八個符號賠付。`0_0_scatter` 範本宣告了 wild 卻在轉輪帶放 0 個，就是這個原因。

CrusherYard 更進一步把 `special_symbols["wild"]` 設成**空陣列**（不是 `["W"]`）。
留著 `["W"]` 會讓 W 出現在數學產出的前端 config 裡（`special_properties: ["wild"]`、
paytable null），一路流進 `SymbolName` 型別與賠付表 UI，變成一個永遠不會出現的符號。
key 本身必須存在，`get_scatterpay_wins` 會無條件索引它。

`design/sync_math_config.mjs` 會**斷言 W 不存在**。如果哪天它報錯說多了 W，代表
有人把百搭放回轉輪帶了，而那會改變遊戲裡每一筆賠付。

---

## 2. 數學建置

```powershell
$env:PATH = "C:\Program Files\Rust stable GNU 1.97\bin;$env:PATH"
cd E:\stake\math-sdk\games\CrusherYard
..\..\env\Scripts\python.exe run.py
```

輸出在 `math-sdk/games/CrusherYard/library/`。**跑之前先確認 `library/` 是乾淨的** —— 
中途被中斷的 library 從檔案列表看不出來，混到一半的 books 與 lookup table 會產生
「數字對不上但每個檔案都在」的狀況，這件事已經發生過一次。

改過的地方（相對於 `0_0_scatter` 範本）：

- `game_config.py`：identity、6×5、rtp 0.96、wincap 15000、`special_symbols["wild"] = []`、
  `global_multiplier_cap = 50`、免費遊戲次數表、bonus cost 80、氮氣瓶值階梯
- `game_executables.py`：**移除 `update_freespin` 裡的全域倍數重置**（見 §3）、
  倍數上限、免費次數改用表格而非「每個 scatter 給 2 次」
- `game_calculations.py`：`clamped_scatter_count()` —— scatter 會 tumble 進盤面，
  原始數量沒有上界，不夾住會在模擬中途 KeyError
- `game_optimization.py`：分段重新配平成 0.96（base：wincap 0.01 + freegame 0.37 +
  basegame 0.58；bonus：wincap 0.01 + freegame 0.95）
- `reels/generate_reels.py`：**新寫**，三條轉輪帶連同權重理由與 run-length 限制

### 兩個會讓 run.py 失敗的坑

1. **兩個模式各 1e5 會被 OS 砍掉（exit 137）。** bonus books 因為 15 轉的 feature，
   體積大約是 base 的七倍。目前設 5e4，在 0.001 quota 下每個模式仍有 ~50 本
   wincap books，足夠最佳化器加權尾巴。
2. **`OptimizationSetup(config)` 必須在 `generate_configs` 之前建立。** 它才會填
   `config.opt_params`，而 `generate_configs` 從中寫出 `library/configs/math_config.json`
   —— Rust 最佳化器讀 bet_modes/fences/dresses/bias 的來源。少了它，那個檔案會是
   112 bytes 的空殼，Rust 直接 panic「betmode index not found in betmode summary array」，
   而那句話看起來像命名對不上，不像少了一個設定步驟。`run.py` 本身順序是對的。

---

## 3. 壓力表：與範本行為相反

`0_0_scatter` 的 readme 寫「persistent throughout the freegame」，但它的
`update_freespin` 每一轉都把 `global_multiplier` 設回 1 —— **程式碼與自己的文件相反**。

CrusherYard 讓它真的持續：只有 `reset_fs_spin()`（feature 開始）會歸零。
`gamestate.py` 與 `game_executables.py` 的註解都標明了這一點。

### 這個機制的實測數字（6,000 局 × 2 模式）

| 量測 | 值 |
|---|---|
| feature 結束時的表值 | 中位數 **7**、p99 **18**、實測最高 **26** |
| 上限 50 是否生效 | 從未 |
| `updateGlobalMult` 事件中「值沒變」的比例 | **68%** |

最後一行是前端的關鍵：數學在**每次 tumble 都發**這個事件（即使被 clamp），以維持
與 `tumbleBoard` 一對一。大多數免費轉根本沒有 tumble，所以 top-of-spin 那次發送
只是重複前值。**對事件反應而不是對「變化」反應，會讓錶盤在三分之二的轉次上抽動。**
`PressureGauge.pressureGaugeAdvance` 的 `if (next <= from) return` 是必要邏輯，不是防禦性程式碼。

**所以錶盤刻度是 1–20（`GAUGE_DIAL_MAX`）、紅線 12（`GAUGE_REDLINE`），不是照 cap 50 畫的。**
照 50 畫的話，三分之二的刻度是沒人會走到的區域，每一場普通 feature 看起來都像沒動。

---

## 4. 兩個靠實測改掉的數學決定

1. **H1 幾乎永遠不賠。** 第一版高分符號權重 0.072，2,452 次中獎裡只有 **4 次**是 H1
   —— 六百分之一，玩家一輩子碰不到 60× 那階。把高分權重往低分靠攏後變成 1/137。
   代價是命中率下降，換到一個「存在的」頂級符號。
2. **免費遊戲 10 轉時壓力表中位數只到 ×5。** 那不是玩家會注意到的機制。表只在
   tumble 時前進（每轉約 0.35 次），唯一的槓桿是長度 → 改成 15/18/22/25 轉。

Bonus 定價 80× 也是量出來的：books 本體均值 ~68×，80× 只要最佳化器抬 12%。
100× 需要 +40%，只能靠灌尾巴達成，中位數會失真。

---

## 5. 事件流

```
reveal → winInfo → updateTumbleWin → tumbleBoard → [updateGlobalMult] → winInfo → …
       → boardMultiplierInfo? → updateTumbleWin → setWin? → setTotalWin
freeSpinTrigger → [updateFreeSpin → updateGlobalMult → reveal → …] × N → freeSpinEnd
→ finalWin
```

### 四個必記的事實（`typesBookEvent.ts` 有完整說明）

1. **這款所有事件的 row 都是含 padding 的**（1..5，7 列的欄）。跟 cluster 那款不同，
   沒有需要換算的未加 padding 事件。
2. **`winInfo` 沒有 `clusterSize`。** pay-anywhere 的賠付數量就是 `positions.length`。
3. **`meta.clusterMult` 恆為 1。** 它是「中獎位置上的 multiplier 屬性總和」，而唯一
   帶 multiplier 的 M 不參與賠付。**不要顯示它。**倍數從 `meta.globalMult`（壓力表）
   與 `boardMultiplierInfo`（氮氣瓶）兩個來源來。
4. **`setWin` 是每轉都發**（bonus 平均每局 ~4 次），不是每局一次。全部當大獎演出會變成
   免費遊戲裡每轉都彈獎牌 —— `isCelebratedWinLevel()` 只讓 `type === 'big'` 以上進獎牌。

`tumbleBoard.newSymbols[reel][0]` 是**新的 padding 列，不是可見符號**；原本盤面上方的
padding 符號會掉進最上面那格。這條規則有專屬守門腳本，見 §7。

---

## 6. 前端架構

從 `apps/EmberForge` 複製（它是最接近的起點：已經是 cascading reel + tumble + 守門腳本齊全），
**不含** `design/source/`、`thumbnail/`。

### 刪掉的（cluster 機制，這款沒有）

`ClusterWins`（連通塊描邊）、`GridMultipliers` / `GridMultiplierBadges`（每格熱度）、
`MultiplierFlyIn`（熱度飛入）。

### 新寫的機制層

| 元件 | 職責 |
|---|---|
| `ScatterWins.svelte` | 散布中獎標記（夾爪角標，不是連通塊輪廓）＋ 中心贏分與壓力表倍數。同時擁有符號中獎動畫 |
| `PressureGauge.svelte` | 盤面**上方**的壓力條。不是每格的東西，所以不需要跨越盤面圖層 |
| `TankPayout.svelte` | 一轉結束後氮氣瓶的結算演出：飛入、累加、超過門檻的 hit-stop |

### pay-anywhere 讓兩件事變簡單

- **位置永遠不會在中獎之間共用。** 一格只有一個符號，而沒有百搭，所以不需要 cluster 版
  那個 volley 範圍的去重。**如果哪天加了百搭，這件事要加回來。**
- **一次評估最多三個符號賠付**（96% 是一個）。所以沒有 volley 時間預算要抓 ——
  stagger 只是為了讓罕見的雙賠不要變成一次閃光。

### 版面

6×5 @ 98px。寬度維持在 7×7 板用的 588（588 / 6 = 98），盤面因此變矮，
空出來的橫帶就是壓力表的位置。

---

## 7. 守門與掃描

```powershell
node design/sync_math_config.mjs   # 從 math library 產 src/game/config.ts（含形狀與符號集驗證）
node design/check_undefined_refs.mjs
node design/check_string_literals.mjs
node design/check_assets.mjs
node design/check_tumble_rule.mjs  # 需要 library/publish_files 的 books
node design/check_font_coverage.mjs
```

`pnpm build` = `check_undefined_refs` + `check_string_literals` + `check_assets` + `vite build`。
**不建 Storybook、不做瀏覽器驗證** —— 使用者自行上傳 Stake Engine 驗證。

### `check_tumble_rule.mjs`

重播每一條連鎖，斷言後續每個 `winInfo` 的中獎位置在重建出的盤面上真的是那個符號。
實測 1,500 局 × 2 模式、**96,875 個中獎位置**全過，並做過**變異測試**：把錯的規則
（`newSymbols` 整個當可見補位）塞回去，立刻抓到 1,417/13,387 不符，且全部落在 row 1
—— 正是 padding 列的症狀。

⚠️ 這支腳本**刻意把規則寫死在自己檔案裡**而不是 import `TumbleLayer`。它要獨立陳述契約。
代價是它看不到 `TumbleLayer` 自己的偏移：這次移植時 `TumbleLayer` 裡有寫死的 `7`
（7×7 遺留），在 5 列盤面上會走過每欄尾端兩格，而守門腳本完全看不見。已改成讀
`BOARD_DIMENSIONS.y`。

### `check_assets.mjs` 補了一個會靜默失效的洞

`Sound.svelte` 大部分音效不走 assets.ts，而是自己組 URL：

```js
new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`)
```

所以目錄名只以 `yard/…` 這種裸片段出現。改名時搜尋 `assets/audio/forge` 會漏掉全部，
**整個遊戲的自製音效都 404** —— 而 Audio 元素的 404 是無聲的，build 過、原本的
check_assets 也過。現在這支腳本也會驗 `CN_SFX_FILES` 的每個片段（已做變異測試）。

### 三項常備掃描（目前全過）

① 廣播了但沒人監聽的事件 ② 宣告了但沒人引用的資產 ③ 沒被 import 的孤兒元件。
資產 0 個孤兒、元件 0 個孤兒。事件掃描剩下的都是跨 package 的配對
（`uiHide`/`drawerFold` 等由 `components-ui-pixi` 監聽，`autoBet`/`buyBonusConfirm`
等由它廣播），不是孤兒。

---

## 8. 演繹時序

實測自 books（6,000 局 × 2 模式）：

| 量測 | base | bonus |
|---|---|---|
| 單轉最長連鎖 | 8 | 11 |
| 單一連鎖只有 1 環的比例 | 68% | 68% |
| 一次 winInfo 最多幾個符號賠付 | 3（96% 是 1） | 3（96% 是 1） |
| 一轉累積最多幾個不同符號賠付 | 7 | **8**（98.6% ≤ 4） |
| 盤面上最多幾個氮氣瓶 | 6 | 6 |
| 氮氣瓶總和 | 中位數 4、p99 250、最高 550 | 中位數 4、p99 50、最高 450 |

⚠️ **`TANK_FLY_IN_MAX` 曾經是 5，那是錯的。** 較小樣本的普查只看到 5，而實際會出現 6 個 ——
第六個會被 slice 掉、不參與演出，但賠付照算，玩家看著被組出來的數字跟拿到的錢對不上。
現在是 8（留餘裕），而且最終讀數改用事件自己的 `boardMult` 而不是元件累加的和，
所以就算未來又被裁切，顯示的仍是實際賠付的數字。

---

## 9. 美術

```powershell
cd apps/CrusherYard
$g = 'E:\stake\tools\gen'   # 含 @resvg/resvg-js 的 node_modules
node design/generate_scene_yard.mjs           $g   # 場景（含機體與開口）
node design/generate_symbol_placeholders.mjs  $g   # 10 個佔位符號
node design/generate_fx_textures.mjs          $g
node design/generate_ui_plates.mjs            $g
node design/generate_ui_icons.mjs             $g
node design/generate_win_banners.mjs          $g
node design/generate_thumbnail.mjs            $g
node design/generate_font.mjs                 $g   # Yard Plate（介面字體）
node design/generate_font.mjs                 $g --stencil   # Yard Stencil（標題字體）
node design/generate_audio_yard.mjs                # 全套音效與兩軌 BGM
```

### 場景開口是 6:5，這是 `generate_scene_yard.mjs` 存在的唯一理由

`BoardFrame` 用**開口高度**對齊盤面。EmberForge 提供的畫作開口是 628×586（1.072，
為方形 7×7 而切），在 588×490 的盤面上會縮到 525 寬 —— 機體直接壓在第一軸與第六軸上。
新場景開口 812×650（1.249），比盤面（1.2）略寬，多出來的只是更多暗部凹槽，無害。

**`generate_scene_yard.mjs` 印出的四個數字與 `BoardFrame.svelte` 的 `SCENE` / `OPENING`
是契約。改一邊不改另一邊，機體就會走位。**

### 配色的兩條規則

1. **暖色留給機制。** 盤面在 tumble 時佈滿琥珀色中獎標記，正上方是綠→黃→紅的壓力表。
   所以房間幾乎全部由冷鋼灰與藍灰構成，唯一的暖光是壓在**右下角**的鈉燈，遠離盤面。
   危險黃只用在夾口的兩條細帶。
2. **等級靠材質、位置靠形狀。** 高分符號是**烤漆**的整台機具，低分是**裸鋼**五金件。
   84–98px 的格子裡，只有顏色不同的形狀是不可讀的 —— 判斷方法是把符號縮到格子大小看，
   若兩個糊在一起，要改的是形狀不是色相。

### 鏽蝕：第一版是橘色的，那是錯的

用 `feTurbulence` 調變既有鋼面（而不是畫上鏽的形狀）是對的，但第一版飽和度全開，
結果鏽變成畫面上**最暖的東西**，直接跟正上方的壓力表搶注意力，而且讀起來像木紋。
現在是暗鐵鏽棕、加上垂直漸層遮罩（鏽是往下流的），這個遮罩才是讓它不像「均勻貼圖」的關鍵。

---

## 10. 玩家可見文案

規則與賠付表都已重寫成 pay-anywhere。有幾個地方是刻意的：

- **賠付表的示意圖畫的是「散開」而不是形狀。** cluster 那款畫三個連通塊，因為那裡
  形狀就是規則。這裡形狀無關，畫一個連通塊會**教錯** —— 玩家會以為必須相鄰，
  然後認不出自己的中獎盤面。所以每個示意都是刻意散開的一組，標題是數量不是形狀名。
- **`socialTerms` 移除了 `clusterPays` / `howClustersPay`。** 新增 `payAnywhere`
  與 `howSymbolsPay`。刻意**不用** "scatter pays" 這個詞：這款的 Scatter 是觸發符號，
  在一個叫 Scatter 的符號旁邊把賠付方式也叫 scatter pays，是玩家最容易讀錯的一組術語。
- **載入畫面的提示全部重寫。** 舊的在講不存在的百搭與熱度格，而那是每次載入每個玩家都會看到的。
  現在前兩條刻意先講「不需要相鄰」。
- **字體多了 Ó 與 Ã**（西班牙文 PRESIÓN、葡萄牙文 PRESSÃO）。`check_font_coverage`
  抓到的 —— 缺字會讓同一個單字裡出現兩種字體。

---

### 字體：Yard Plate（介面）＋ Yard Stencil（標題）

兩套從同一骨架切出來，`design/generate_font.mjs` 產生（原創幾何字，直線中心線段擴成
矩形輪廓，直接打包成 TTF；無授權問題）。原本的 `Ember Runic` / `Ember Inscribed`
符文／碑刻風已經移除。

| | 用在哪 | 最小尺寸 |
|---|---|---|
| **Yard Plate** | bet bar 讀數、贏分、壓力表標籤 | **~14px，而且要顯示金額** |
| **Yard Stencil** | 載入標題 52px、press-to-continue 28px、免費遊戲結算標題 | 28px |

**這個分工就是整個設計。** 有橋接缺口的字在 bet bar 尺寸下不是缺口糊掉（等於白做），
就是讀成壞字，而這套字體唯一絕對不能出錯的就是餘額。所以缺口只放在永遠設大的那一面。

**橋接的三個實作要點**（改 `bridgeSegments` 之前先讀）：

1. **缺口沿筆畫方向量，不是切水平帶。** `strokeToContour` 每端各外推 `SW/2`，所以
   幾何切口 `G` 只留下 `G - SW` 的可見空隙；而水平帶在斜線上的切口長度會被
   `1/sinθ` 放大，對角線的缺口會比豎筆大一倍。水平帶只決定**位置**。
2. **保護的是接點，不是殘段長度。** 第一版用「殘段必須長過自己的端帽」，結果在滿高度
   豎筆上把**兩條帶都否決了**（上帶 t1=0.94 > 門檻 0.822，下帶 t0=0.06 < 0.178），
   整套字體幾乎沒有可見缺口。而且方向也錯：短殘段無害，鄰段的筆畫會蓋過它；真正
   致命的是切掉**接點**——`A` 的橫槓、`E` 的腰一旦被切口吞掉就會浮空。
3. **`BRIDGE_SOLID` 是必要的，沒有純幾何規則能取代。** 能不能切取決於字形的**拓撲**：
   帶橫槓的豎筆（`E` `F` `H` `L` `P` `R` `T`）切開仍可讀，封閉環（`O` `Q` `0`）
   切開仍是環，但**開放的短面鏈**（`S` `C` `G` `J` 與多數數字）切一刀會讓整條手臂
   脫離，變成兩塊互不相干的碎片。連通性也分不出來——`E` 是樹狀，切豎筆會讓字形斷開，
   而 `E` 正好是可行的那個。真正的噴印字體同樣是逐字決定的。

**兩個守門補了洞**：`check_font_coverage` 原本對缺檔是 `.filter(existsSync)`，少一個
字體檔會安靜地少檢查一個然後照樣回報 OK；`check_assets` 現在也驗 `app.html` 的
`@font-face` 路徑（`@font-face` 的 404 不會拋錯，只會靜靜退回系統 sans——而那正是
認證已經對這個 codebase 提過一次的問題）。兩者都做過變異測試。

## 10b. 實機回饋修正（2026-08-08）

### 「buy bonus 卡住，再點又跑回主遊戲」—— 每一次 tumble 都在丟例外

`TumbleLayer` 重建欄位時讀 `symbols[8].rawSymbol`。**8 是 9 格欄位（7 可見 + 2 padding）
的底部 padding 索引**，那是 7×7 盤面的數字；這款一欄只有 7 格（0..6），`symbols[8]`
是 `undefined`，於是**每一次 tumble 都丟 TypeError**。

`playBet` 會捕捉例外並把 spin 按鈕交還玩家，所以它不是崩潰 —— 演出在半路停死（**卡住**），
而回合既然中止，下一次 spin 就是 base 局（**跑回主遊戲**）。兩半症狀都由這一行造成。

它看起來像 bonus 專屬，只是因為 bonus 一定會 tumble；任何一次基本遊戲中獎也會踩到。

**為什麼所有守門都沒抓到：** `vite build` 不做型別檢查，`check_undefined_refs` 對
`<script>` 裡的識別字是盲的，而 `check_tumble_rule.mjs` **刻意用自己獨立的實作**陳述
契約 —— 它證明的是「規則正確」，看不到 `TumbleLayer` 自己的索引寫錯。這正是 §7 已經
記過一次的盲點（先前的 `slot <= 7`），我掃的是 `7` 和 `49`，沒掃 `8`。

現在欄位索引一律從 `BOARD_DIMENSIONS` 推導（`BOTTOM_PADDING_SLOT`），並在重建前加了一條
欄位長度斷言 —— 越界索引讀出來是 `undefined`，只會在後面某個屬性存取才炸，堆疊裡既沒有
盤面尺寸也沒有出錯的 slot。

### anticipation 在每次 buy 上多花約 2.3 秒

`gateAnticipation` 原本是 `value >= 1`。數學送的是
`anticipation[reel] = (該軸之前已落下的 scatter 數) - 1`，而觸發需要 3 個 —— 所以
**只有 `value === 1`（正好 2 個已落下）那一刻是懸念**；2 以上代表三個已經在盤上，
feature 已經贏了，再 tease 只是拖延。

代價是實的：`createReelForCascading` 給 anticipated 軸的 padding 是
`reelPaddingMultiplierAnticipated`（8）對比正常的 1.2，換算 `fallInDelayMultiplier`
是 `7*8/7 - 1 = 7` 對比 `0.2`，也就是**開始落下前先等 `110 × 7 = 770ms`**，然後還落得更慢。

每一本 bonus book 的開場都是 `[0,0,0,1,2,3]` —— 舊關卡放行**三軸**，約 2.3 秒的靜止盤面，
發生在一個玩家已經付過錢的回合上。retrigger 的 book 甚至到四軸。改成 `=== 1` 後只剩一軸。

### Buy Bonus 對話框文案數字全錯

`betModeMeta.ts` 從鍛造遊戲帶過來，寫著 200×、96.5% RTP、10,000× 上限，還在描述不存在的
熱度格機制 —— 而那是玩家花錢前讀的最後一段字。現在全部從 `config` 內插，不再手打。

### 本機重現用的 harness

`src/dev/mockRgs.ts`（`?mock=1`）現在配的是這款真正的 books，由
`node design/make_dev_books.mjs` 從 `library/publish_files` 挑出來：`baseWin`、
`baseTrigger`、`bonusPlain`、`bonusTank`、`bonusQuench`（15,000× 滿獎）、`bonusRetrigger`。

上面那個 TypeError 就是這樣抓到的 —— 靜態工具全過，是 harness 加上程式碼裡本來就有的
15 秒看門狗（`errorLog.ts`）指出「卡在哪個 book event」才定位到的。

```
http://localhost:3004/?mock=1&book=bonusQuench&headless=1&sessionID=dev&rgs_url=mock.local&currency=USD&device=desktop
```

⚠️ 這個環境的兩個限制：分頁沒有 compositing 時**拿不到 animation frame**，要手動泵
`__PIXI_APP__.ticker`；而分頁隱藏時 `setInterval` 會被節流到 ~1Hz，補間會爬得極慢，
15 秒看門狗因此會誤報。**看門狗在這裡的警告不代表真的卡住** —— 要看回合是否持續前進。

---

## 11. ⚠️ 尚未完成

| 項目 | 狀態 |
|---|---|
| **符號美術** | **佔位圖**（`design/generate_symbol_placeholders.mjs`）。使用者會提供畫作，放進 `design/source/symbols/` 後跑 `node design/process_symbols.mjs` 覆蓋，檔名與尺寸都已對齊，其他都不用改 |
| `EntryReveal.svelte` | 仍是鍛造坊開門的演出。工業鐵門在廢鐵廠不算違和，但那句「爐火從門縫透出」是錯的 |
| `TransitionAnimation.svelte` | 仍是熔爐噴火。**這個明確是錯的主題**，應改成液壓機閉合／氣壓釋放 |
| `FireFront.svelte` | 火焰特效，同上 |
| UI 底盤／圖示／中獎銅牌 | 仍是黃銅鍛造風。可用，但與冷鋼場景不同調 |
| `fs_sign` / `fs_counter_panel` | 免費遊戲告示牌仍是黃銅 |
| 音效 | 全套仍是鍛造音（敲砧、淬火、風箱）。三個新機制音（`sfx_gauge_tick` / `sfx_tank_land` / `sfx_tank_burst`）是把既有樣本變速對應，不是新合成 |

**沒有做真機驗證。** build 與所有守門腳本都過，但那只證明它會編譯、資產解析得到、
tumble 規則與數學一致。實際演出、版面與手感需要上傳 Stake Engine 確認。
