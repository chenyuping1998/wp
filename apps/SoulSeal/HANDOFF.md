# Soul Seal 封魂 — 專案交接文件

> 建立：2026-08-22
> 涵蓋範圍：`wp/apps/SoulSeal` 前端 + `math-sdk/games/SoulSeal` 數學後端
>
> **狀態：機制與視覺完成，美術是佔位圖。**
> 五個模式全部收斂到 RTP 0.9500，RGS 格式驗證通過，`config.ts` 已同步。
> collect 與符軌的視覺已實作，契約在 50,000 局 / 130,786 次收取上驗證通過。
>
> **沒有人看過實際畫面。** 靜態守門能證明型別、契約、幾何值都對，
> 但動畫長什麼樣、時序好不好看，只有跑起來才知道。未完成項目見 §13。

---

## 1. 遊戲定位

道士收妖題材的 **cash-collect** 機轉。參考基準是 Hacksaw《Marlin Masters OG》的
骨架（載體 / 收集者 / 升級軌），但題材、美術、演出全部重做。

拆解參考作的完整筆記在 `design/reference-notes.md`。

| 項目 | 值 |
|------|-----|
| Game ID | `SoulSeal` |
| 中文名 | 封魂（僅內部用，遊戲內不出現漢字） |
| 版面 | 5 軸 × 3 列 |
| 中獎規則 | 固定賠付線，左至右連續 |
| 線數 | **9** |
| RTP | **0.9500**，五個模式全部收斂（optimisation 已跑） |
| Max Win | **10,000×**，所有模式都要達得到 |
| Bet Modes | base 1× / active5 5× / active10 10× / bonus 100× / bonus300 300× |
| dev port | 3005 |

版面與賠付表對齊參考作實測值；RTP、wincap、bet modes 是本作自己的設計。
見 `design/game-spec.md`。

---

## 2. 核心機制

**兩個角色，不是三個。**

**載體 — 妖（M）**
身上的符紙寫著金額（bet 倍數）。**單獨落定不賠任何東西**，在哪個模式都一樣。

**收集者 — 百搭（W）**
就是百搭本身。連線時替代符號，**在免費遊戲中**還會收走盤面上所有 M 的金額。
沒有獨立的收集者符號。

### 觸發條件依遊戲類型分開

| | 收集觸發 |
|---|---|
| **主遊戲** | 3 個以上的 M 落在同一條賠付線上 → 收走盤面所有 M |
| **免費遊戲** | 每個 W 各收一次全盤（每軸最多一個 W，單轉 0–5 次） |

**feature 不是主遊戲數字變好，是規則不同。** 主遊戲裡妖要排隊，
feature 裡一個百搭清空盤面。

### 三條不可以動的規則

1. **W 不替代 M**（也不替代 S）。百搭會打斷 M 的連線。
   否則會出現「三隻妖連線卻只拿到兩隻的錢」——百搭沒有金額。
2. **每個 W 分別收取**。兩個 W 就是兩倍，否則第三個百搭等於沒事發生。
3. **每軸最多一個 W**。靠轉輪帶上的間距結構保證（`make_reels.py`），
   不是事後檢查。

**升級軌 — 符咒欄**
只屬於 `sealing`。每收取一次貼一張符，第 5/9/12 張 +8 次免費遊戲，
並拉高**全域收取倍數**（×2 → ×4 → ×10）。

`swarm` **沒有**符軌——兩個機制給同一個 feature 會複利爆炸，見 §13。

---

## 3. 數值

全部對齊參考作實測值。完整表格與出處在 **`design/game-spec.md`**，摘要：

- **9 條線**（線型已抄錄至 `math-sdk/games/SoulSeal/game_config.py`）
- **妖的面額**：19 階，0.5× 到 1000×，**base 與 feature 兩套權重**
- **道士倍數**：8 階離散，×1 / ×2 / ×3 / ×4 / ×5 / ×10 / ×15 / ×20
- **wincap 10,000×**（從 7,500 提高，理由見 spec §1）
- **五個 bet mode**，RTP 全部 0.95

低分符號賠付刻意壓到近乎象徵性（5 連只有 1× bet），
價值全部押在 collect 上。這是參考作的分配，照抄。

---

## 4. 美術方向

完整的美術聖經在 **`design/art-bible.md`**。以下是不可妥協的三條：

1. **框架必須是法壇本身**，不是套在遊戲外面的裝飾邊框。
   香爐、燭台、幡旗、桃木樁圍成矩形，玩家的視角是「站在法壇前」。
2. **三層景深，中層壓暗**。轉輪底板是有材質的暗色（青磚牆 + 燭光暈），
   不是純黑遮罩。壓暗的唯一目的是把符號推到前面。
3. **符紙黃 + 硃砂紅只給金額用**。場景其他任何地方都不准出現這組對比。
   這是全作最嚴格的一條色彩紀律。

---

## 5. 目前的檔案狀態

```
wp/apps/SoulSeal/
├── src/            ← TripleWitching 的程式碼，已改名，機制未改
├── design/
│   ├── art-bible.md         ← 美術規格（本次產出）
│   ├── reference-notes.md   ← 參考作拆解（本次產出）
│   └── check_*.mjs          ← 靜態守門腳本，沿用
└── static/assets/  ← 空的，美術尚未產出

math-sdk/games/SoulSeal/
└── ...             ← 0_0_lines 範本，identity 已改為 SoulSeal
```

**注意**：`src/game/config.ts` 目前是 TripleWitching 的 config（5×3 但 20 線、
帶擴展盤面）。它是從數學端產生的，等 `math-sdk/games/SoulSeal` 跑出結果後
用 `design/sync_math_config.mjs` 覆蓋，不要手改。

---

## 6. 建置

依 `wp/.claude/skills/stake-engine-slot`：

```bash
"E:/stake/tools/node-v22.23.1-win-x64/corepack.cmd" pnpm --dir E:\stake\wp\apps\SoulSeal build
```

不要看 exit code，看輸出裡有沒有 `✔ done`。
SVG→PNG 產生器要把 `E:\stake\tools\gen` 當參數傳進去。

---

## 7. 上架前檢查

**不要跳過** `wp/.claude/skills/stake-engine-slot/references/review-log.md`
開頭的 pre-submission checklist。Go Bananas 走了六輪 review，那張清單上每一行
都是一次 upload-and-wait 換來的。

跟本作特別相關的幾條：

- 妖身上的金額是錢，要走 4 位小數的格式化路徑，不能只給 2 位。
- 社交模式（`?social=true`）下「收妖」「封印」這些字沒問題，但金額面板的
  用詞要走 `socialTerms.ts`。
- 道士的收取範圍如果有動畫暗示（例如葫蘆的吸力光暈掃過某幾格），
  那個範圍就必須是數學實際結算的範圍。

---

## 8. 佔位美術

`static/assets/sprites/` 目前全是 `design/generate_placeholders.mjs` 產的佔位圖。

**它們刻意做得很醜**——平塗色塊、斜線警示紋、每張圖上都印著 `PLACEHOLDER`。
這是故意的：看起來像完成品的佔位圖，就是會不小心上線的佔位圖。

配色用的是 `art-bible.md` 的真實色票，所以構圖關係大致對（暗環境、
符號從壓暗的中層浮出、金額用黃/硃砂），但除此之外沒有一樣是最終的。

`spines/`、`sprites/coin/`、`audio/` 是從 TripleWitching 借來的自有資產，
同樣要換掉。

**沒有使用任何競品的美術資產。** 參考作只提供設計原則，見 `design/reference-notes.md`。

上架前必須全部替換。`generate_placeholders.mjs` 應該在真美術產生器完成後刪掉。

---

## 9. 型別守門

`design/check_types.mjs`，跑 svelte-check，**逐檔比對基準線**（目前總計 37）。

`vite build` 不做型別檢查，而 `check_undefined_refs.mjs` 對 `<script>` 裡的識別字是瞎的——
這支補的就是那個洞。從 TripleWitching 繼承來的既有錯誤多半在要刪的程式碼裡，
所以守的是「不得增加」而不是零。

**為什麼是逐檔而不是總數**：第一版只看總數，在清除舊機制時報了「維持基準線」——
但刪掉的 `FeatureBags`（2 個錯誤）其實被 `ResumeBet` 與 `BoardFrame` 的 2 個**新**
錯誤抵銷了，兩個都是真的退步，因為總和剛好相等而完全看不見。
重構時互相抵銷是常態，總數是錯的觀測對象。

**修好一個檔案就把它的數字調降。絕對不要為了讓紅燈變綠而調高。**

`tsconfig.json` 排除了 `design/` 與 `static/`——那些是獨立的 Node 建置腳本，
不進 bundle，也從來沒過過型別檢查。不排除的話會有 400 行噪音，守門就沒用了。

---

## 10. 進度：collect 機制

**已完成（事件契約 + 狀態層）**

| 檔案 | 內容 |
|---|---|
| `types.ts` | `CarrierHit` / `CollectorHit` / `CollectSource` / `CollectSweep` / `FeatureName` / `RAIL_TOTAL` / `RAIL_MILESTONES`；`RawSymbol.cashValue` |
| `typesBookEvent.ts` | `collect` / `railAdvance` / `featureSet` 三個事件 |
| `stateGame.svelte.ts` | `carriers` / `collectors` / `sweeps` / `collectActive` / `railFilled` / `railMinMultiplier` / `feature` 等 |
| `bookEventHandlerMap.ts` | 三個 handler；`reveal` 中的每轉重置與 M/C 擷取 |
| `Collect.svelte` | 收取演出：漩渦、符紙飛行、倍數印章、累加總額 |
| `TalismanRail.svelte` | 符軌：12 個符位、里程碑泛光、`ALL WINS xN` 標示 |
| `WinLines.svelte` | 連線演出：黃色折線 + 正中央白色描邊數字（照參考作） |
| `CarrierValues.svelte` | 把金額寫在妖的符紙上（`2x` / `250x`，無貨幣符號） |

**兩個刻意的設計決定**

1. **carriers/collectors 從 reveal 的盤面讀，不另發事件。** 盤面上已經帶著
   `cashValue` 與 `multiplier`，另發事件等於同一個事實有兩個來源，遲早會不一致。
2. **`railFilled` 一律用指派，不用累加。** 事件帶的是推進「之後」的數量。
   客戶端自己累加的計數，就是符軌跟數學在 retrigger 之後對不上的典型原因。

**舊機制已清除**

expand / mult / ways 三套全數移除，程式碼裡 0 個殘留參照：

| 刪除 | 內容 |
|---|---|
| 元件 | `BoardExpandFx` / `FeatureBags` / `MultiplierMeter` |
| 型別 | `FeatureName`(舊) / `EvalType` / `MultiplierWildHit` / `WaysWinMeta` / `isWaysWinMeta` |
| 事件 | `featureSet`(舊) / `multiplierWilds` |
| 狀態 | `activeFeatures` / `evalType` / `spinMultiplier` / `multiplierWildHits` / `displayRows` |
| 常數 | `MAX_ROWS` / `FEATURE_ROWS` / `BOARD_EXPAND_MS` / `FEATURE_BAG_*` |
| 資產 | `soulSealBags/`（三張 bag 圖） |
| 其他 | `src/stories/`（TripleWitching 的 book fixture，沒有任何東西 import） |

清完之後 `COLLECT_` 前綴就沒有存在理由，已改回 `FEATURE_NAMES` / `FeatureName` /
`featureSet`。

**盤面現在固定 5×3。** collect 機制改變的是盤面上有什麼，不是盤面的形狀。
`boardLayout()` 的兩組 fit 目標與插值已移除，只剩一組。

**兩支守門腳本跟著改了用途**

- `check_board_fit.mjs`：原本檢查 feature bags 的上方淨空，改成檢查**符軌**的淨空
  （符軌整場 feature 都在畫面上，比 bag 更需要這個檢查）
- `check_tease_length.mjs`：兩個盤面同高後，差異只剩「tease 從哪一軸開始」
  （base 從第 2 個 scatter、feature 從第 1 個），案例表從三個縮成兩個

**符號集已對齊**

`config.ts` 已從數學端同步，符號集是 `C H1-H4 L1-L5 M S W`——
四妖五行，加上載體、收集者、scatter、wild。

`CARRIER_SYMBOL` / `COLLECTOR_SYMBOL` 已收緊為 `SymbolName`，
所以打錯字或數學端改名都會變成編譯錯誤。

**道士的三個美術階級是前端的事**：數學只有一個 `C` 符號帶 ×1..×20 倍數，
`constants.ts` 的 `collectorAsset()` 依倍數挑圖。
數學不該知道階級的存在——那是美術表達一個數字的方式，不是它評估的區別。

---

## 11. 玩家可見文案：仍有一處描述已不存在的機制

**`src/components/ui/ModalPayTable.svelte`（634 行）整份還在講 expand / ways。**
這是認證必檢項目，而規則與數學不符正是 review 會擋的東西。

已經處理掉的：

- `LoadingScreen` 的提示語 — 改成 collect 機制的正確敘述（9 線、符軌）。
  **注意**：裡面寫的是 7,500×，wincap 後來提到 10,000×，這一行要跟著改。
- `FeatureIntro` 描述「三大特色」的面板 — 整個移除，連同 16 語系的
  `introWaysTitle` / `introWaysBody`

`LoadingScreen` 裡原本就有一段註解在警告「這個清單是從別的遊戲整份繼承來的，
當時還在宣傳那一款」。**同樣的事在移植到 Soul Seal 時又發生了一次。**
那段註解已補上這次的教訓：這份清單不會跟著周圍的程式碼一起更新，每次都要對著數學重讀。

ModalPayTable 沒有跟著一起改，是因為它要引用具體數字（各模式 RTP、各檔 buy 的價格），
而那些要等數學跑完才是真的。先改會變成第三次寫錯。

---

## 12. 契約守門：`check_collect_contract.mjs`

拿數學**真正產出的 book**（`library/publish_files/*.jsonl.zst`）去驗前端讀的欄位。

驗這些：

- row 在 padded 範圍內（1..3），reel 在盤面上
- 每個妖有金額，每個道士有正整數倍數
- `award = subtotal × multiplier`，subtotal 等於其 carriers 之和
- 符軌每次只 +1、不倒退、不超過 12
- 每軸只有一個道士收取
- `featureSet` 在第一次 collect 之前

**這支守門存在的理由**：collect 事件一度用 0-based visible row，
而 SDK 其他事件與 `getSymbolY` 全部用 padded（visible 是 1..3）。
**每個收取動畫都會偏一格**——跟 `utils.ts` 裡記載的 scatter 警報偏移同一類。
型別過、build 過、兩邊各自內部一致，只是彼此不同意。沒有別的東西看得見。

它第一次跑就抓到 98,654 個問題（那批 book 產生於修正之前），
重跑數學後 0 個問題。

**改了 collect 事件的形狀就要重跑數學再驗**，否則驗的是舊資料。
沒有數學輸出時會 SKIP 而不是失敗，所以剛 clone 的人不會被擋住。

---

## 13. 數學端：collect 已實作

`math-sdk/games/SoulSeal/`，五個模式跑得動。

| 檔案 | 內容 |
|---|---|
| `make_reels.py` | 產生六組轉輪帶（BR0 / FR0 / SWARM / AR5 / AR10 / FRWCAP）。**每軸最多一個道士**是靠 strip 上的間距結構保證的，不是靠事後檢查——已驗證 0 對距離過近 |
| `game_config.py` | 五個 bet mode、9 條線、賠付表、wincap 10,000、妖的面額階梯（base/feature 兩套） |
| `game_events.py` | `collect` / `railAdvance` / `featureSet` 三個事件，欄位對齊前端 `typesBookEvent.ts` |
| `game_executables.py` | 收取求值、wincap 截斷、符軌推進、swarm 的保底抽牌 |
| `game_override.py` | 妖的面額、道士的倍數、feature 選擇 |
| `gamestate.py` | 把 collect 接進 base 與 free game |

### 三個踩過的坑，都留在註解裡

1. **面額階梯必須隨 gametype 分開。** 一開始 base 與 feature 共用一套，
   100× 買入只回 22×——15 手 feature 裡一隻 0.5× 的妖等於雜訊。

2. **`guaranteesPair` 一度只是事件裡的旗標，數學沒有實作。**
   事件告訴玩家「每轉保底一妖一道士」而數學沒做，這正是 review 會擋的
   演示與數學不符。補上之後才發現它威力極大。

3. **符軌與保底不能給同一個 feature。**
   每轉保底一個道士 × 符軌把道士下限推到 ×10，兩者複利無上界——
   300× 買入實測原始 RTP **26.03**，中位數 6,974×，幾乎每局撞 cap。
   分開後掉到 **3.09**。`gamestate.py` 的 `advance_rail` 呼叫點有條件判斷，
   **不要拿掉**。

### Optimisation 結果

| 模式 | 成本 | RTP | 中獎率 | 未中獎 | 標準差 |
|---|---|---|---|---|---|
| `base` | 1× | 0.9500 | 1/3.44 | 70.9% | 12.4 |
| `active5` | 5× | 0.9500 | 1/2.57 | 61.0% | 51.0 |
| `active10` | 10× | 0.9500 | 1/1.98 | 49.5% | 89.8 |
| `bonus` | 100× | 0.9500 | 1/1.00 | 0% | 147.2 |
| `bonus300` | 300× | 0.9500 | 1/1.00 | 0% | 458.2 |

max win 每個模式都是 10,000×（以基礎押注計價）。RGS 格式驗證五個模式全過。

**注意模擬量只有每模式 10,000 局**，尾端統計還不夠穩，上架前要拉到 1e6 以上。

**重跑**：cargo 在 `C:\Program Files\Rust stable GNU 1.97\bin`，要手動加 PATH。

---

### 事件順序是有意義的

`collect` 在 `winInfo` **之後**發出。三隻妖連線同時是連線獎且會觸發收取，
玩家先看到線賠，再看到葫蘆打開。而且 `resolve_collect` 裡的 cap 檢查讀
`running_bet_win`，必須等連線獎入帳後才正確。

### wincap 截斷

截斷發生在**收取結算時**，不是丟給 win manager。
`collect` 事件會帶 `cappedAt`（未截斷的原始總額），
這樣演出不會數到一個這局根本沒付的數字。

---

## 14. 妖身上的數字：兩個量出來的常數

`CarrierValues.svelte` 把 `cashValue` 畫在符紙上。有兩個數字是**量出來的**，
不是猜的，而且兩次都是預覽圖抓到我算錯：

**1. 符紙的位置**（`TALISMAN_CX/CY/W/H`）

用「最大**連通**的紙色區域」量，不是所有紙色像素的 bounding box。
第一次用 bbox，把符紙左邊的繩子也框進去了——中心偏左 3.5%、框寬多了 40%，
數字有一半印在妖的胸口。

**2. 字寬比例**（`CHAR_RATIO = 0.82`）

Titan One 是重型展示字，每字約 0.82em；Arial 大約 0.56。
我一開始用 0.58 估，**算術一路說「fits」**，實際上最寬的幾個值明顯掛在紙外面。
把預覽改用真字體 render 才看出來。

`design/preview_carrier_values.mjs` 產出 `design/preview_carrier_values.png`，
把 5 個字長全部合成到符號上，並畫出符紙的框。
**改動美術或字體之後要重跑**——這是 build 唯一驗不到的事。

`1000x` 會稍微超出紙面，那是刻意的：紙只有格子寬度的五分之一，
五個重字放不進去又要保持可讀。真實的牌面也是最大的數字才擠不下。

---

## 15. Pixi v8 的路徑提交陷阱

**`lineStyle()` + `moveTo/lineTo` 什麼都不會畫。** 路徑要等 `stroke()` 或
`fill()` 才提交，兩種失敗方式都是靜默的：

1. **完全不畫** — 路徑留在緩衝區沒人提交
2. **變成填色區塊** — 下一個 `fill()` 把它一起吞掉

連線演出踩的是第二種：折線設了 lineStyle、堆了路徑、從沒 `stroke()`，
然後畫節點圓點的 `fill()` 把整條折線當成封閉圖形填滿——九條賠付線變成九塊實心多邊形。

**另外兩個從 scaffold 繼承來的元件踩的是第一種，而且沒人發現**：
`ScatterTrigger` 的角括號、`Anticipation` 的箭頭與列刻度，全部沒有提交，
根本沒畫出來過。TripleWitching 也有同樣的問題。

**還有一個容易搞錯的**：v8 的 `circle()` / `roundRect()` 是**加進路徑**，不提交也不重置。
只有 v7 的 `drawCircle()` 才自動提交。

`design/check_graphics_paths.mjs` 依**呼叫順序**檢查這件事。

第一版只數「這個 callback 有沒有提交過」——**那會放過原本那個 bug**，
因為節點圓點確實有 `fill()`。順序才是重點，這已經寫進那支腳本的註解。

真的要填一條手繪的封閉多邊形時，在 callback 裡加註解 `graphics-path: polyline is filled on purpose` 就會跳過。

---

## 16. 未完成

**下一件最有價值的事**

- [ ] **實際跑起來看一次**。所有靜態關卡都過了，但沒有人看過畫面。
      收取演出的時序、符軌的位置、佔位圖在真實版面下的可讀性，
      都只有上傳 Stake Engine 跑一輪才知道。

**其餘**

- [ ] `ModalPayTable.svelte` 重寫（見 §11）——現在數字是真的了，可以動了
- [ ] `LoadingScreen` 的提示語：7,500× 要改成 10,000×
- [x] ~~缺的符號~~ — 12 顆全數交付並匯入
- [ ] 噴金幣改成噴符咒（`design/art-prompts.md` §5，產生器尚未寫）
- [ ] 其餘美術資產：背景、法壇框架、UI、贏分橫幅、wordmark、封面
- [ ] 音效（目前借用 TripleWitching 的）
- [ ] 縮圖與封面
- [ ] 上架前把模擬量從 10,000 拉到 1e6 以上再跑一次 optimisation
- [ ] `L5` 與 W 的賠付表殘留值定案（見 spec §3）
