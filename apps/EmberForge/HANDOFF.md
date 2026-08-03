# Ember Forge — 專案交接文件

> 最後更新：2026-08-02（Phase 1–7 全部完成：數學、機制層、美術、音效、UI 主題）
> 涵蓋範圍：`apps/EmberForge` 前端 + `math-sdk/games/EmberForge` 數學後端

---

## 1. 遊戲規格

| 項目 | 值 |
|------|-----|
| Game ID | `EmberForge` |
| 版面 | 7 軸 × 7 列（cluster pays，無賠付線） |
| 中獎規則 | 5 個以上同符號上下左右相連即成 cluster；消除後上方符號落下遞補，連鎖直到無 cluster |
| RTP | 96.5% |
| Max Win | 10,000×（base 命中率 1/1,000,000；bonus 1/5,000） |
| Bet Modes | `base`（1×）、`bonus`（Buy Free Spins 200×） |
| Free Game 特色 | **格位熱度倍數**：中獎位置被「加熱」啟動為 1×，之後每次再中獎 +1×；cluster 賠付 = 符號賠付 × 該 cluster 覆蓋格位的熱度總和 |
| 符號 | H1–H4、L1–L4、W（百搭，不自付）、S（Scatter，不自付） |

## 2. 數學建置

```powershell
$env:PATH = "C:\Program Files\Rust stable GNU 1.97\bin;$env:PATH"
cd E:\stake\math-sdk\games\EmberForge
..\..\env\Scripts\python.exe run.py    # sims 1e4×2 modes → configs → Rust 最佳化 → 分析 → 驗證
```

輸出在 `math-sdk/games/EmberForge/library/`：`publish_files/`（上傳 Stake Engine 用）、`lookup_tables/`、`configs/`、`optimization_files/`、`EmberForge_full_statistics.xlsx`。

改過的地方（相對於 `0_0_cluster` 範本）：

- `game_config.py`：`game_id`/`game_name`/`working_name`、`rtp` 0.965、`wincap` 10000、`mode_maxwins` 10000、bonus 模式 `is_buybonus=True`、補上 `padding_reels`（範本沒設，導致產出的前端 config `paddingReels` 是空的、落下動畫沒有東西可掉）
- `game_optimization.py`：分段重新配平成 0.965（base：wincap 0.01 + freegame 0.37 + basegame 0.585；bonus：wincap 0.01 + freegame 0.955）

只改 config 不需重跑模擬時，可只跑 `generate_configs(gamestate)`。

## 3. 從 books 量出來的關鍵數字

這些數字是演繹設計的依據，改數學後要重新量（scratchpad 有 `analyse_books.py` / `event_census.py`）。

| 量測 | base | bonus |
|---|---|---|
| 單次 spin 最長連鎖 | 8 | 11 |
| 單一連鎖只有 1 環的比例 | 79% | 79% |
| 一次 winInfo 最多幾個 cluster | 11 | 14 |
| cluster 大小範圍 | 5–18 | 5–25 |
| **單格熱度最高值** | 34 | **47** |
| 有格子達到 10× 的 book 比例 | 0.97% | 8.6% |
| 單一 cluster 的 clusterMult 上限 | 218 | 265 |

**`maximum_board_mult = 512` 從未生效**——一次 feature 只有 10–18 spin，每次中獎只 +1，實際天花板在 50 上下。所以 `constants.ts` 的 `GRID_TIERS` 色階是照 1–20 這個真實區間切的，不是照 512。

Scatter 實際行為：**4/5/6/7 顆 → 10/12/15/18 次免費遊戲；3 顆在主遊戲不觸發**。免費遊戲中 3 顆以上可再觸發（+5/8/10 次），約 9% 的 feature 會發生。

## 4. 事件流與兩個必記的陷阱

```
reveal → winInfo → updateTumbleWin → tumbleBoard → winInfo → … → setWin? → setTotalWin
freeSpinTrigger → [updateFreeSpin → reveal → updateGrid → winInfo/tumble 迴圈] × N → freeSpinEnd
→ finalWin
```

**陷阱 1：行索引不一致。** `winInfo.positions`、`meta.overlay`、`tumbleBoard.explodingSymbols`、`freeSpinTrigger.positions` 都是**含 padding 的座標（1–7，9 列的盤面）**；但 `updateGrid.gridMultipliers[reel][row]` 是**不含 padding（0–6）**。`gridMultipliers[reel][r]` 對應盤面 row `r+1`。轉換只做一次，在 `bookEventHandlerMap.ts` 的 `toBoardSpaceGrid()`；下游一律用盤面座標。

**陷阱 2：`setTumbleWin` 不存在，且 `setWin` 是每次 spin 都發**（bonus 平均每局 6.4 次）。GoBananas 的 setWin handler 會播整套大獎演出，直接沿用會變成免費遊戲裡每轉都彈獎牌。目前用 `isCelebratedWinLevel()` 只讓 `type === 'big'` 以上進獎牌，其餘由連鎖計數牌與 win ticker 表現。

## 5. 前端架構

從 `apps/GoBananas` 複製（繼承 uiTheme 主題化、GoldText、16 語 i18nText、compactBottom 版面、FX 貼圖管線、兩支出貨守門腳本），**不含** `.storybook/`、`src/stories/`、`design/source/`。

### 刪掉的（EmberForge 數學沒有的機制）
`ExpandingWilds` / `StickyPrizes` / `SuperspinCells` / `GrenadeRunner` / `WinLines`、superspin 整個模式、L5/X/P 符號。

### 新寫的機制層

| 元件 | 職責 |
|---|---|
| `TumbleLayer.svelte` | 消除→落下→補位。直接動畫盤面自己的 reel symbol（不是畫覆蓋層），結束後 `setSymbolsWithRawSymbols` + 重設 tween 目標回到正規狀態，否則下一次 spin 會繼承被打亂的符號 |
| `ClusterWins.svelte` | 連通塊輪廓（逐格判斷鄰居是否同屬 cluster，只畫外緣，任意形狀都能描）+ 中心贏分與倍數。**同時擁有符號中獎動畫** |
| `GridMultipliers.svelte` | FG 熱度格。畫在**盤面之下**——它是符號站的鐵砧，不是蓋在上面的徽章 |
| `TumbleCounter.svelte` | 連鎖第幾環 + 該次 spin 累積贏分，置於盤面上方 |

### 機制層的兩個必要防護

- **cluster 位置去重**：一個 W 可以同時屬於多個 cluster。對已是 `'win'` 的格子再指派 `'win'` 不會重新觸發 effect，第二次請求會永遠等不到完成回呼 → 卡死。`ClusterWins` 以整個 volley 為單位用 Set 去重。
- **volley 總時長有上限**：一次最多 14 個 cluster，固定間隔會讓大獎比小獎多花三秒。`CLUSTER_VOLLEY_MAX_MS` 反推每個的間隔。

### 轉輪改為 cascading
`stateGame.svelte.ts` 用 `createReelForCascading`（不是 `createReelForSpinning`）。兩者的 reel symbol 形狀不同：

| | spinning | cascading |
|---|---|---|
| 索引欄位 | `symbolIndex` | `symbolIndexOfBoard` |
| Y 座標 | `symbolY()` 函式 | `symbolY` 是 Tween → 用 `.current` |
| `motion` | `spinning` / `bouncing` | `fallingOut` / `hanging` / `fallingIn` / `stopped` |

`ReelSymbol.svelte` 已對應改寫。另外 `{@const}` 必須是區塊的直接子節點，所以 `forState` 改用 **snippet 參數**捕捉（不能用 `$derived`——derived 會在呼叫時重讀，防護條件就永遠不成立）。

## 6. 美術（全程序生成，無來源畫作）

```powershell
cd apps/EmberForge
$g = 'E:\stake\tools\gen'   # 含 @resvg/resvg-js 的 node_modules
node design/generate_symbols_forge.mjs $g   # 10 個符號 + design/forge_contact_sheet.png
node design/generate_theme_forge.mjs   $g   # 背景×2、轉輪框、FS 告示牌與計數牌
node design/generate_fx_textures.mjs   $g   # 加法混色粒子貼圖（純白，執行期 tint）
node design/generate_ui_plates.mjs     $g   # bet bar 讀數板、Buy Bonus 底盤
node design/generate_ui_icons.mjs      $g   # 黃銅按鈕圖示
node design/generate_win_banners.mjs   $g   # 五級中獎銅牌
node design/generate_spines.mjs             # 各符號 idle/win 動畫（要先跑 symbols）
node design/generate_thumbnail.mjs     $g   # Thumbnail_EmberForge.png（408×546）
node design/generate_audio_forge.mjs        # 全套音效與兩軌 BGM
```

**驅動整套美術的兩條規則**（改圖前先讀）：

1. **等級靠材質、位置靠形狀。** 免費遊戲把熱度階梯（暗紅→橘→白）畫在格子**底下**，那條階梯獨占了暖色端。所以四個低分符號是**冷鐵**、四個高分符號是**飽和寶石**——高低一眼可辨，且都不跟底下的熱度搶。房間背景同理：整間鍛造坊是冷灰褐，唯一的暖光是爐口，而且刻意壓在右下角遠離盤面。
2. **每個符號有自己的剪影。** 84px 的格子裡，四顆只有顏色不同的寶石是不可讀的。所以四種切工（圓形明亮式／階梯式／馬眼／三角）、四種工具外形（鎚／鉗／鉚釘／齒輪）。判斷方法：看 `design/forge_contact_sheet.png`，若兩個符號在小尺寸下糊在一起，要改的是形狀不是顏色。

第一版的鎚與鉗按真實比例畫，在盤面上直接消失（低分符號還要再乘 0.8 縮放）——現在兩者都刻意畫得比真實比例粗重。

音效同樣是程序合成（`generate_audio_forge.mjs`，零外部相依）：核心是**非諧波**泛音比 `METAL_RATIOS`，這是敲擊鋼料與敲鐘的差別，換成整數諧波列會立刻變成教堂鐘聲。連鎖每一環用同一個 sample 升半音（`soundTumbleHit`，上限一個八度）。檔名與舊 set 完全相同，換主題只是換目錄。

## 7. 守門與掃描

```powershell
node design/sync_math_config.mjs      # 從 math library 產 src/game/config.ts（含形狀驗證）
node design/check_undefined_refs.mjs  # 樣板未定義變數（已接進 pnpm build）
node design/check_assets.mjs          # assets.ts 全部路徑可解析
```

`pnpm build` = `check_undefined_refs` + `vite build`。**不建 Storybook、不做瀏覽器驗證**——使用者自行上傳 Stake Engine 驗證。

三項常備掃描（每次改完可跑，目前全過）：①廣播了但沒人監聽的事件 ②宣告了但沒人引用的資產 ③沒被 import 的孤兒元件。第①項抓到過 `soundGrenadeBlast` 在移除 superspin 音效時被孤立（已改名 `soundTransitionBlast` 並補回 handler）；第②項抓到 `fxStreak` 在刪掉擴展百搭後沒人用（已改用在 tumble 落下的速度線上）。

## 8. 演繹時序預算

實測自 books（20,000 局）。改動畫參數前先看這張表——這款的風險不是單一動畫太慢，而是**連鎖會把任何一點延遲乘上九倍**。

| 段落 | 主遊戲 | 免費遊戲 | Turbo |
|---|---|---|---|
| reveal（整盤落下） | ~1.26s | ~0.9s | ~0.5s |
| 每次 winInfo（cluster 描邊＋高亮） | 0.42s＋錯開 | 0.24s＋錯開 | 0.24s |
| 每次 tumbleBoard（消除＋落下） | ~0.83s | ~0.60s | ~0.33s |
| **典型單環中獎局** | **~2.5s** | ~1.8s | ~1.1s |
| **最長九環連鎖** | ~12.5s | ~8.5s | ~4.5s |

一次 winInfo 最多 14 個 cluster，但 `CLUSTER_VOLLEY_MAX_MS` 把錯開總時間封頂，所以**大獎不會比小獎多花時間**。

## 9. 演繹稽核（2026-08-02，對照 20,000 局 books）

先跑資料稽核確認前端依賴的不變量，八項全過（腳本在 scratchpad `audit_presentation.py`）。最重要的一條：**每軸的 `newSymbols` 數量恆等於該軸「去重後」的消除格數**——所以 TumbleLayer 不會有 carrier 對不上而崩潰的路徑。另一條關鍵觀察：**23,484 筆 tumbleBoard 的 `explodingSymbols` 含重複座標**（同一格同時屬於多個 cluster），去重不是防禦性程式碼而是必要邏輯。

接著逐項稽核自己寫的動畫，抓到並修掉七個：

1. **落下的回彈是空動作**（最嚴重的手感缺陷）。原本 `symbolY.set(to, cubicIn)` 之後再 `symbolY.set(to, backOut)`——第二個 tween 起點等於終點，**不管用什麼緩動都不會移動**。符號是直接停死的，「落下有重量」只存在於註解裡。改成先落到 `to - bounce` 再 backOut 進 `to`，與共用 cascading reel 的作法一致
2. **新符號的落地擠壓從來沒播過**。`symbolState = 'land'` 設在 settle 之前，而 `setSymbolsWithRawSymbols` 會把所有狀態重設為 `'static'`，同一個 tick 內就被抹掉。改到 settle 之後才套用，且只套在新落入的符號上（倖存者是滑下來的，一起擠壓會讓整盤晃）
3. **連鎖每一環要等 1.4 秒的中獎動畫播完**。那個時長對 lines 遊戲是對的（符號會留在盤上），但這裡每個中獎符號馬上就要被消除。九環連鎖因此要跑 **約 25 秒**，兩環也要六秒。改成點亮後只 hold 一拍（主遊戲 420ms / 免費 240ms），spine 繼續在底下播，由 tumble 接手——順帶把「等一個永遠不來的回呼」整類卡死風險也消掉了
4. **tumble 落入的 Scatter 完全沒有聲音**。共用 reel 的 `onSymbolLand` 只在 reveal 時觸發。但數學是在整串連鎖結束後才數 scatter，所以**連鎖中掉進來的 scatter 是算數的**，卻靜悄悄地出現。已補上
5. **連鎖計數牌在單環中獎時也會跳出來**。79% 的中獎是單環，等於大部分中獎都會蓋一塊寫著「CHAIN」的牌子，這個字就沒有意義了。改成第二環才出現
6. **免費遊戲的節奏自相矛盾**。`ClusterWins` 在免費遊戲走快速路徑，`TumbleLayer` 卻只看 turbo——會變成「閃一下就慢慢掉」。補上免費遊戲專屬的中間速度（對齊既有的 `SPIN_OPTIONS_FAST_FREEGAME`）
7. **熱度格的閃光衰減與畫面更新率綁定**（每幀減固定值），144Hz 螢幕上會快 2.4 倍；且 49 格的呼吸重繪是每幀跑。改成依經過時間衰減、呼吸取樣 40ms。這與 GoBananas §5.19 抓到的「所有實例共用同一個 `Math.sin(Date.now())` 相位」是同一類問題

順帶更新了 `ClusterWins` 的類別註解——它還在描述我已經移除的等待回呼設計，留著會誤導下一個人。

## 10. 實機回饋修正（2026-08-02 第一輪）

1. **左欄新增 `SpinLedger.svelte`（本轉得分紀錄），Buy Bonus 縮小**
   `uiTheme.buyBonusRailScale` 2.4 → 1.6（這是 theme 值，WildParty 不受影響）。帳表**按符號累計整串連鎖**，不是每一環列一行——玩家要知道的是「紅寶石總共賠了 2.40」，不是讀九行。兩種版面：寬版走左欄直式（自動依行數決定高度，並固定壓在 Buy Bonus 上方、不超出上緣）；直式版面沒有側欄，改成盤面上方的橫向 chip 列（最多 5 個）。
2. **移除停輪後的閒置連線重播**
   Lines 遊戲可以重播是因為盤面就是中獎時的盤面；tumble 遊戲不行——中獎符號早已被消除並被掉落的新符號取代，重播等於在一組從未參與該 cluster 的符號上畫框。取而代之的正是上面那張帳表，它會留到下一次 spin。
3. **賠付表加上分隔符**：`5 2.0` → `5 : 2.0`，冒號用低對比灰金，讀作標點而非內容。
4. **免費遊戲不再整片變暗**
   根因不是「太暗」而是**方向錯了**：原本每個啟動格填的是接近黑的暗紅（`0x6e1f0c`）且 alpha 高達 0.78–0.96，而 1x 是最常見的階級——等於為了凸顯少數格子，把整個盤面染暗。alpha 填色**只能讓底下變暗**，用它做階級對比必然逼低階往黑走。
   改法三點：①**未啟動的格子完全不畫**（盤底本來就是「尚未加熱」該有的顏色）②所有階級的顏色都比盤底亮，alpha 降到 0.5–0.74，符號自身對比得以保留 ③真正的階級差異改由**加法混色光暈**（`fxGlow`，隨 heat 放大變亮）提供——加法只會加光，所以高倍格會發亮，其餘區域完全不受影響。

## 11. 符號改用提供的美術（2026-08-02）

原本的程序生成符號（`generate_symbols_forge.mjs`）已刪除，改用使用者提供的畫作。

**目前的符號對應（與第一版程序生成的方案相反，高分是器物、低分是寶石）：**

| | 符號 | | | 符號 |
|---|---|---|---|---|
| H1 | Horned Helmet 維京頭盔 | | L1 | Ruby 紅寶石 |
| H2 | Flaming Sword 烈焰劍 | | L2 | Amethyst 紫水晶 |
| H3 | Dragon Torch 龍首火炬 | | L3 | Sapphire 藍寶石 |
| H4 | Gold Hoard 金幣金條 | | L4 | Emerald 綠寶石 |
| W | Forge Hammer 戰鎚 | | S | The Forge 熔爐 |

**檔案流向（原圖不會被寫入）：**

```
design/source/symbols/*.png   ← 使用者提供的原圖，唯讀
        ↓  node design/process_symbols.mjs
static/assets/sprites/emberForgeSymbols/*.png   ← 256×256 RGBA，遊戲用
        ↓  node design/generate_spines.mjs
static/assets/spines/emberForgeSymbols/         ← idle / win 動畫
```

**為什麼需要 process 這一步：** 提供的十張圖**完全沒有 alpha 通道**——其中九張把編輯器的透明格紋（兩個灰階）壓平進去了，h4 則是實心深色底。直接拿來用的話每個符號都是不透明矩形：免費遊戲的熱度格畫在符號**底下**，整個特色機制會被十塊灰磚蓋住，而且每格都會看到接縫。尺寸也從 212×182 到 310×272 不等，直接塞進方形格子會每個符號一個比例。

**去背用「從邊界往內 flood fill」而不是整張圖做顏色鍵**，這個差別是必要的：劍身、頭盔、鐵砧都含有和格紋相同的中性灰，全域顏色鍵會直接在符號上打洞。只有真正與邊界相連的區域會被移除。邊緣再用合成公式反解回符號自身的顏色，否則每個輪廓都會留一圈灰邊。

**踩過的坑：** 第一版把邊界取樣到的顏色全部當成背景參考色。h3 龍首火炬幾乎填滿畫框、碰到邊界，於是它的深棕皮革 `(50,24,15)` 與火焰 `(131,73,44)` 被當成背景，flood fill 吃掉了 **89%** 的符號，只剩幾片焦炭。現在參考色必須是**中性色**（RGB 極差 ≤ 16，格紋與深色底都是中性，皮革與火焰不是）且佔邊界取樣 2% 以上；另外加了自動警戒：去背比例 > 90% 或殘餘內容過小就標記 SUSPICIOUS 並讓腳本以非零狀態結束。

要換圖就把新檔案放進 `design/source/symbols/` 重跑，**不需要先去背**——但如果來源本身就帶正確 alpha，取樣會找不到中性邊界背景而報錯，屆時把 `process_symbols.mjs` 的去背段跳過即可（縮放置中那段仍然有用）。

⚠️ 低分符號現在是高飽和寶石，其中 L1 紅寶石與熱度格的暖色系最接近。目前實測（contact sheet 下半部就是疊在熱度格上的樣子）仍可分辨，但若真機覺得糊，優先調的是 `GRID_TIERS` 的色相而不是符號。

## 12. 得分演繹與開場／過場改版（2026-08-02 第二輪）

**符號雜質自動清除。** h3 重新上傳後仍帶著裁切殘留，改在管線裡解決而不是逐張處理：`process_symbols.mjs` 去背後做**連通元件分析**，只保留面積 ≥ 最大元件 3% 的島。門檻用相對值而非絕對像素數，才能跟著來源解析度走；3% 這個值要同時清掉碎屑並保住 h3 那團**與火把本體分離**的火焰。實測 h3 清掉 264 個碎島（1017px），bbox 從 281×182 收到 252×167，符號因此在格子裡放大了。其餘符號也各清掉數十個 1–2px 的雜點。

**中獎演繹改為程序化，並移除每符號 Spine。**
原本的 win 是 `generate_spines.mjs` 產的每符號 Spine，那批動作是為程序生成的舊符號編的（「元寶像船一樣搖」「鉗子開合」），沒有一個描述得了新美術，全部得重編。改成 `SymbolWinAnim.svelte` 的單一時間軸：**被鎚擊（縱向擠壓的過衝）→ 熱透到白 → 噴出餘燼 → 燒盡**，620ms 一次性播放，不循環——循環是 lines 遊戲的作法（符號會留著讓玩家讀線），這裡符號幾百毫秒後就會被消除，效果應該交棒給爆炸而不是被打斷。

發熱是**把同一張符號圖再疊一次、用加法混色**。這會精準貼合美術自己的輪廓，不需要遮罩、不需要逐符號製作，而且**下次換圖仍然有效**——這個專案已經換過兩次圖了。

連帶刪除 `generate_spines.mjs` 與 10 組 spine 資產（資產路徑 64 → 44）。`explosion` 用的仍是範本 spine，不受影響。

⚠️ **這裡踩到一個會靜默失效的坑**：`Board` 有兩層（遮罩層／不遮罩層），`SymbolWrap` 靠 `animating` 決定符號畫在哪層，而舊寫法是 `symbolInfo.type === 'spine' && (land||win)`。win 改成 sprite 後這個判斷**恆為 false**，中獎符號會被送回遮罩層，光暈與餘燼全部被裁在格子邊界——build 與型別都不會報錯。已改為依狀態判斷（`win` 或 `explosion` 走不遮罩層）。

**開場：打鐵舖開門。** `EntryReveal.svelte` 重寫——兩片鑄鐵門覆蓋整個畫布，門閂鬆脫時抖動，接著向兩側開啟，爐火從門縫透出並隨開度擴大。開門是用**對各自鉸鏈邊做水平縮放**來模擬（門片繞垂直軸旋轉的投影就是如此），成本是一個 transform 而不是透視矩陣；會露餡的是均勻打光，所以門片轉到側面時同步變暗、內緣則吃到透出的火光。門片刻意不縮到零寬（側面仍有厚度），否則就變成單純的擦除轉場。

**進 FG 過場：熔爐噴火。** `TransitionAnimation.svelte` 重寫成三拍：**抽氣（畫面壓暗、火被吸回去）→ 爐門鬆開（底部一道光縫）→ 火舌自下方噴發蓋滿畫面**，切場落在白熱峰值。火焰是**不同速度的柔光精靈堆疊**而不是畫出來的形狀——火沒有輪廓，任何帶邊的形狀都會讀成一團往上飄的色塊；底層慢速暗橘做本體、上層快速亮色做火舌、白熱核心最後到達，讓峰值是顏色的轉變而不只是更多橘色。

## 13. 實機回饋修正（2026-08-02 第三輪）

### 1. 五個相連卻不消除 —— 前端與數學的盤面不同步（真 bug）

使用者截圖裡第 6 欄有**五把火焰劍垂直相連卻沒賠付**。根因不在數學，在前端 tumble 後重建盤面的規則。

讀 `tumble_board()`：

```python
if i == 0 and self.config.include_padding:
    insert_sym = self.top_symbols[reel]   # 舊的 padding 掉進可見區
    # 而且「不」加入 new_symbols_from_tumble
...
# 迴圈結束後：
self.new_symbols_from_tumble[reel].insert(0, self.top_symbols[reel])  # 新 padding，插在最前面
```

所以 **`newSymbols[reel][0]` 是新的 padding 列，不是可見符號**；可見補位是 index 1 之後的部分，而**原本盤面上方的 padding 符號會掉進最上面那格**。我原本把整個陣列當成可見補位，導致每個發生消除的欄位**整欄下移一格**。

這個 bug 為什麼撐過了那麼多輪檢查：盤面看起來完全合理，build 過、型別過、資產與事件掃描全過——它只是**不是正在被賠付的那個盤面**。唯一的外顯症狀就是「五個相連卻不賠」，而那看起來像數學問題。

**用資料證明而不是靠推理**：把兩種規則各自重播一次，再用後續每個 winInfo 的 cluster 位置去對照重建出的盤面。舊規則有 **6.0%** 的位置對不上（9430/157554），新規則 **0%**。

**已加入常備守門** `design/check_tumble_rule.mjs`（`pnpm check:tumble`），全量 20,000 局、**1,062,431 個 cluster 位置**全過。這支腳本刻意把規則寫死在自己檔案裡而不是 import `TumbleLayer`——它要獨立陳述契約，`TumbleLayer` 改了就必須有意識地同步改它。也做過變異測試：把舊 bug 塞回去，它會立刻抓到並非零退出。

### 2. Hit rate 29% → 35%

整體命中率是各分段命中率的總和，而除了 basegame 以外都是零頭（freegame 1/200、wincap 1/1e6），所以 `0.35 - 1/200 = 0.345` → `hr = 2.899`（原本 3.5，正好對應觀測到的 29%）。分段 RTP 維持 0.585 不變，**因此提高頻率必然拉低平均單次中獎金額**——這是一個取捨，不是白賺的改善。

重跑後實測：**hit rate 34.99%**、RTP 仍精確 0.9650、max win 10000× 可達、`prob_nil` 0.709 → 0.650。

### 3. 得分紀錄框

縮到約 Buy Bonus 按鈕的一半（寬度綁在 `buyBonusSize * 0.72`，該按鈕若再調整會跟著走）、字級同步縮小；改為**以底邊錨定**在 Buy Bonus 上方固定間距處、往上生長——原本是頂邊錨定，得分符號一多就會往下長到按鈕上，截圖裡蓋住 BUY BONUS 的就是這個原因。改為**恆常顯示**，沒得分時顯示破折號；會消失的讀數會讓整條側欄每局跳動，玩家也無法養成往固定位置看的習慣。

**選單遮擋**：Pixi 依掛載順序繪製，`SpinLedger` 原本掛在 `<UI>` 之後所以蓋在選單上。移到 `<UI>` 之前即可。

### 4. FG 倍數底色仍擋住符號

單純降低 alpha 不夠——只要是覆蓋整格的色塊，再淡都會壓低符號的對比。改成**畫成「環」而不是「整塊」**：用 even-odd 填充規則（外圓角矩形減內圓角矩形）把中央挖空，符號的細節區完全不被覆蓋，單次填充、不需要遮罩。填充 alpha 一併從 0.5–0.74 降到 0.24–0.4，階級的辨識改由**邊框粗細亮度**與**符號底下的加法光暈**承擔。

## 14. 實機回饋修正（2026-08-03 第四輪）

### 得分紀錄框重疊 Buy Bonus —— 真因是座標空間用錯

之前反覆加大間距都沒用,因為算式沒錯、**只是套在錯的座標空間**。

`LayoutBottomBar` 把 Buy Bonus 放在 `<MainContainer standard>` 裡的 `mainLayoutStandard().height * 0.46`;而 `SpinLedger` render 在 `<MainContainer>`(遊戲空間),卻用 `mainLayoutStandard()` 與 `uiTheme.railWidth`(標準空間的常數)算位置。兩個 box 的**寬高與 scale 都不同**(`mainLayout` 用 app 自己的 `mainSizesMap`,`mainLayoutStandard` 用共用的 `STANDARD_MAIN_SIZES_MAP`),所以怎麼加 gap 都對不準。

改成 `<MainContainer standard>` 之後兩者才在同一個空間裡。

**行數上限改為由版面實測推導**,不是寫死:可用高度 = Buy Bonus 上緣 − 間距 − 上邊界,除以行高得容量。同一塊面板在桌機放得下六行、在矮的橫向版面只放得下四行——用量測而不是寫死,「絕不重疊」才會在所有裝置上都成立,而不是只在我調過的那一台。

超出容量時把尾端摺成一行 `+N MORE`,金額仍計入 TOTAL,不會遺漏。實測 books:一次 spin 最多 **7 種**不同符號中獎,但 **93% 的中獎 spin 只有 ≤4 種**,所以摺疊是罕見情況而非常態。沒有做可滑動 bar——玩家不會在轉動中途去捲動一份讀數,而摺疊行不需要任何互動就能保住金額正確性。

### FG 倍率格改為「邊框 + 角落徽章」

這是第三次改了:實心格 → 淡色格 → 環形格,每次都還是壓在符號上。根本原因是**任何覆蓋在格子上的東西都會降低符號對比,再透明也一樣**。

現在完全不覆蓋格子中央,熱度由三個都不遮擋美術的元素承擔:
1. **格子邊框**——粗細與亮度隨階級
2. **符號下方的加法光暈**——加法混色只會加光,不可能遮蔽
3. **右下角小徽章**承載數字——角落是符號剪影唯一穩定留白的位置

因為徽章必須在符號**之上**才讀得到,而邊框與光暈必須在符號**之下**,一個元件無法同時位於盤面兩側,所以拆成 `GridMultipliers`(下層)與 `GridMultiplierBadges`(上層)。後者直接讀 `stateGame.gridMultipliers`,不重複另一層的 flare/rAF 時鐘。

## 15. FG 倍率分級配色（2026-08-03）

倍率徽章依值分色。**分界是按「實際看得到的頻率」切的,不是等距**——先量了 bonus books 中每次 feature 結束時所有非零格位的值:

| 值 | 佔比 | | 值 | 佔比 |
|---|---|---|---|---|
| 1x | 38.1% | | 6–9x | 5.8% |
| 2x | 25.9% | | 10–19x | 1.0% |
| 3x | 15.4% | | 20x+ | 0.15% |
| 4x | 8.8% | | 最高紀錄 | 47x |
| 5x | 4.9% | | | |

所以 **1x 與 2x 合計約 64%**,維持原本的暗炭色不動——把最常見的情況做得醒目,正是先前幾版讓整個 FG 盤面糊成一片的原因。**3x 起每個值各有自己的顏色**,直到值稀少到不值得再細分為止,之後改為分段。

色相走的是金屬受熱的真實順序:暗紅 → 橘 → 琥珀 → 金 → 黃白 → 白 → 藍白。不需要學就讀得懂是強度刻度,而且跟遊戲其他部分講的是同一種語言。

`GRID_TIERS` 的分界:`1, 3, 4, 5, 6, 10, 20`。

- **文字顏色隨徽章底色改變**（亮底用深字、暗底用亮字）,並新增 `textStroke` 欄位成對指定。原本是在元件裡拿 `tier.text === 0xfff3d6` 去推描邊色——那種寫法在有人微調任一色值時會無聲失效。
- **最稀有的兩段（10x+、20x+）額外加呼吸與微幅放大**:在一片全部亮起的盤面上,靠動態比靠顏色更容易被找到。
- 呼吸的 rAF **只在盤面上真的有這兩段時才啟動**（約 1% 的格位),其餘時間不空轉。

3x 與 4x 都是常見值（15% 與 9%）,第一版兩者太接近,已把 3x 壓深（`0xa8320a`）拉開級距。

## 16. FG 節奏與音效（2026-08-03 第五輪）

### 1. 移除連鎖計數牌（跟手數板撞在一起）

`TumbleCounter.svelte` 整個刪除。它浮在盤面上方,而免費遊戲的手數板在同一區,兩者疊在一起變成截圖裡那塊只露出「HAIN x2」的破板子。

資訊沒有丟:**連鎖深度移進得分紀錄框的標題列**（連鎖 ≥2 時顯示 `THIS SPIN · CHAIN x3`）。標題本來就是保留空間,不佔額外版面,而且玩家要找「這一轉發生什麼事」時本來就是看那一格。累積金額原本就在紀錄框裡,本來就是重複的。

### 2. FG 消除節奏放慢

原本 `fast: isFreeGame || stateBet.isTurbo` 讓**免費遊戲直接借用 turbo 的時序**,結果特色玩法（熱度格正在累積、最值得看的部分）反而跑得比主遊戲還快。

改成三段速而不是布林值(`ClusterPace = 'normal' | 'freegame' | 'turbo'`),而且**免費遊戲的停留是三者中最長的**:

| | 主遊戲 | 免費遊戲 | Turbo |
|---|---|---|---|
| 亮起後停留 | 420ms | **560ms** | 240ms |
| cluster 錯開 | 70ms | 60ms | 26ms |
| 消除 | 260ms | **230ms**（原 170） | 120ms |
| 落下 | 300ms | **275ms**（原 210） | 150ms |

順序就是「亮起 → 停一下 → 消除」,那個停頓是讓玩家看清哪些格子要消失、以及它們底下壓著多少倍率。單環免費 spin 從約 1.3s 變成約 1.9s,12 轉的 feature 約多 7 秒。

### 3. 音效

**進 FG 過場改成火焰聲。** 新增 `fireBurst` 樂器,三層疊出來——低頻轟鳴本體、中頻 whoosh（火舌撲面）、稀疏高頻爆裂聲。**爆裂聲才是讓它聽起來像「火」而不是「風」的關鍵**,單一噪音帶只會是靜態嘶聲。過場音變成「爐門鬆開的一記撞擊 + 抽氣 + 火焰噴發」,對齊畫面的三拍。檔名仍是 `grenade_blast.wav`（Sound.svelte 的 `soundTransitionBlast` 映射到它),只是內容不再是鎚擊——鎚擊描述的是舊版過場,跟現在畫面上的東西已經對不上了。

**FG BGM 從 116 BPM 重寫成 138 BPM。** 原本跟 `bgm_main` 用同一組 figure,聽起來太接近。加強的是三件事,沒有一件是單純「更大聲」:
- 八分音符鎚擊,每小節第一下重音——有脈動可以跟,而不是一串平均的敲擊
- 下拍加低頻 pedal（49Hz）——胸口感覺得到的那層
- 旋律高一個八度並**後推十六分音符**,推著走而不是坐在拍子上
- 每兩小節用一記淬火聲收尾當轉折

**FG 期間的連鎖音更強。** 同一個 sample（維持是同一件樂器,特色玩法應該像同一座熔爐轉更快,不是換一個遊戲）,但免費遊戲時音量 0.75 → 1.0、音高再提高一點,並疊一記低頻 thump,讓連鎖除了音階往上爬之外也有重量。

## 17. 自製字體 Ember Runic（2026-08-03）

`design/generate_font.mjs` **從零產生一個真正的 TrueType 檔案**（`static/fonts/EmberRunic.ttf`，7.1 KB，61 glyph／86 碼位）。沒有用任何字型函式庫——字形定義成中心線筆畫，展開成輪廓，再直接組出 TTF 各個表。

### 為什麼是「拉丁字母刻成盧恩風」而不是真的盧恩文字

介面上有 BALANCE、WIN、BET、TOTAL、FREE SPINS 與各種金額。**把 A–Z 換成 ᚠᚢᚦᚨᚱᚲ 就沒有人讀得懂了**——主題是撐起來了，代價是介面失效。所以這是**拉丁字母用盧恩的刀法刻出來**：全直線筆畫、折角轉折、沒有任何曲線。看起來是北歐，讀起來仍然是「BALANCE」。

### 為什麼直線筆畫讓這件事變得可行

盧恩字形本來就沒有曲線，所以每個字都是若干直線段。每段展開成一個矩形輪廓，而 TrueType 用 **non-zero winding** 填充，同方向的重疊輪廓會自動聯集——不需要路徑布林運算、不需要二次貝茲控制點，整張 `glyf` 表都是 on-curve 點。輪廓方向會統一強制（依帶正負號面積翻轉），方向混雜的話重疊處會被挖成洞。

### 多語系怎麼辦

字型**只含拉丁字母、數字、標點與貨幣符號**，這是刻意的。字型堆疊寫成 `"Ember Runic", "Titan One", …`——**瀏覽器是逐字元回退**的，所以拉丁文字被刻成盧恩風，日／韓／中／阿拉伯／天城文則整批落到後面的字型，完全不受影響。Titan One 沒有被移除，移除的話那些語系就會掉到作業系統隨便給的一個 sans。

### 驗證方式（沒有瀏覽器）

一個格式錯誤的字型檔會**被靜默忽略然後回退**，看起來跟「載入成功但長得像 fallback」完全一樣。所以用 **resvg 的 `fontFiles` 選項**當驗證器：它底層是 ttf-parser，解析嚴格，**字有畫出來就代表各個表是正確的**。specimen 輸出在 `design/font_specimen.png`。

**第一版就是靠這個抓到 bug 的**：只有兩個字畫得出來。原因是 cmap 的 `idDelta` 是**模 16 位元的算術**，我先遮罩成無號再用有號寫入函式輸出，而那個函式會做**上下限截斷**——所有負的 delta 都被截成 32767，整個字母表因此對應到 .notdef。字型檔本身完全合法，只是什麼都不畫。

### 其他決定

- 筆畫粗細比較過 104 / 128 / 148：104 在下注列尺寸太細撐不住，148 時 O、B、8 的字腔開始被重疊筆畫填死，定案 **128**。
- 補上 `·`（記錄框標題的分隔符）與 `£ € ¥ ¢`——金額讀數是玩家所在幣別，少了這些會在每個非美元帳戶上出現一個 Titan One 字元夾在盧恩數字中間。
- 小寫共用大寫字形，顯示字體的常見作法。
- 這是原創產出，**沒有授權或續約問題**（Titan One 是 OFL，仍保留作為回退）。

## 18. 字體多語系覆蓋（2026-08-03）

初版接上去時,我斷言「瀏覽器逐字元回退會處理其他語系」就收工了。**這個斷言只對了一半**,而且沒有實際驗證過。寫了 `design/check_font_coverage.mjs`（`pnpm check:font`）之後才看清楚。

Stake 的語系清單來自 `packages/config-lingui`,共 16 個：`ar de en es fr id ja ko pl pt ru tr vi zh fi hi`。腳本從 `src/game/i18nText.ts`、共用套件的 `messagesMap`、以及元件裡寫死的字串抓出**實際會被畫出來的每一個字串**,再對照**字型自己的 cmap**（直接解析 TTF,不採信產生器的意圖）逐字元比對。

### 真正的問題不是「哪些語系沒覆蓋」

- **完全沒覆蓋**的語系（ar ja ko ru zh hi）整段落到後備字型,**單一字體、外觀一致,沒有問題**。
- **完全覆蓋**的語系（de en es id）全用 Ember Runic,沒有問題。
- **問題在部分覆蓋**：一個 95% 覆蓋的語系會在**同一個單字裡混用兩種字體**——`M[Ü]NZE` 的 Ü 換了一套字。

初版量出來：**fr 97.1% / pl 95.1% / pt 98.6% / tr 83.9% / vi 69.8% / fi 97.7% 全部是混排狀態**,缺 29 個帶變音符號的拉丁字母。

### 修法

新增變音符號**組字系統**：重音符號用同一套直線筆畫畫成元件,再疊到基礎字母上,所以多一個帶符號的字只是多一列表格而不是多畫一個字。兩層高度帶——第一層緊貼字高之上,越南文的聲調符號再疊一層。`ASC` 從 800 提高到 980 讓堆疊符號落在宣告的 ascent 之內。

29 個字補完後**16 個語系全部通過**：10 個拉丁語系 100% 覆蓋,6 個非拉丁語系整段乾淨回退。

順帶抓到一個一個字元的錯誤：`Ắ` 我填成 `U+1EAF`（那是小寫 ắ）,大寫是 `U+1EAE`——覆蓋檢查直接把它指出來,靠看是看不出來的。

另補了 `’ ‘ “ ” – —`。目前沒有任何字串用到（檢查腳本確認過）,但在地化文案很常出現彎引號與破折號,而**少一個字元就足以在單字中間插進第二種字體**。

### 已接成常備守門

`pnpm check:font`。之後任何人新增在地化字串,只要帶進一個字型沒有的拉丁變音字元,這支腳本就會標成 MIXED TYPEFACE 並以非零狀態結束。

⚠️ 仍未驗證：加入新字型（且置於堆疊最前）會改變文字量測結果,因而可能讓 anchor 置中的元素有些微垂直位移。這在真機上才看得出來。

## 19. 尚未驗證 / 已知取捨

- `SYMBOL_SIZE = 84` 是照 118×5/7 推出來的，**尚未實測**外框是否完整落在畫面內（GoBananas 曾在這裡踩坑，見其 HANDOFF §5.21-3）
- 只有 5 個 `scatter_*` 音階但盤面可容納 7 顆 scatter，第 6/7 顆重複用第 5 階
- `ModalPayTable` 的符號名稱（Fire Ruby / Molten Wild / Hammer…）是我定的暫名，未經命名確認
- 所有動畫節奏、音效與畫面的同步、實際手感都**只能真機確認**——本地沒有可信的驗證途徑
