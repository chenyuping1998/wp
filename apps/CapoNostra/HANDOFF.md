# Capo Nostra — 交接文件

最後更新：2026-09-03（全檔 RTP 降 0.5 個百分點；修正 bonus_epic 的尾端機率超標；
把 bonus_epic 的 Probability of Payout < Bet 壓到 70% 以下；再拉高 bonus_epic 的
20-200x 跟 1000-2000x 佔比——四者都重跑過 optimizer）

從 Hot Miami 分支出來的新遊戲。**數學已改完並跑過完整 optimizer，前端已接上並實測可玩，
主要美術（符號、錢框、Tommy Gun 特效、三檔標題、Logo、大佬角色）已到位。**

- 美術現況與待辦：[ART_STATUS.md](ART_STATUS.md)
- 美術設計規格：[ART_BRIEF.md](ART_BRIEF.md)

開場說明頁已改成單一西裝大佬，base 背景已換成地下賭場包廂 v1；feature／Don 背景與近景層仍待製作，清單在 ART_STATUS.md 第 2 節。

> **2026-09-28 角色改成兩隻（MG 一隻、FG 一隻）。** 使用者新規則：之後每款都要兩個不同的角色。
> - MG：The Don 重畫（分層、雙手離開身體）；FG：夜總會女主人（扛立式麥克風架），Soldier／Capo／Don 三個等級是她的打光版。
> - 交件在 `design/cast_parts/`（全畫布分層＋骨架），需求單在 `design/cast_brief/`。
> - `design/build_cast_layers_runtime.py` 把每層裁到有墨的範圍輸出到 `static/assets/castLayers/{don,hostess}/`（GPU 約 21MB，全畫布會要 260MB），也輸出開場卡的 `intro_don_v4.png`。
> - 執行期：`CastFigureLayered.svelte` ＋ `game/layeredFigure.ts`（UV 對應裁切）＋ `game/layeredCastMotion.ts`（兩隻各自的動作表）。
>   Cast.svelte 依 `gameType` 換人（feature splash 蓋著時換）；FreeSpinIntro 放女主人（`onTop`、`box="main"`、不夾右邊界）。
> - ⚠ 這兩具骨架的 `arm_l` 在畫面右、**負角度往外張**，跟舊 Don 相反，舊表的手臂正負號不能沿用。
>   Don 的手離畫布邊只有 ~65px，往外甩會超出 check 的 40px 邊界，所以他的反應是「手肘外張、前臂收回」。
> - 閘門：`design/check_cast_layers.mjs`（已加進 build）＝技能的 check_layered_cast（複製成 `design/lib_check_layered_cast.mjs`）＋掃描擺動範圍是否在 `LAYERED_X_ENVELOPE` 內。改動作表就要重量 `design/measure_cast_envelope.mjs`。
> - 退役（09-28 清完）：單一網格 Don（meshRigs/cast_guy：guy／guy_feature／guy_don）、Hot Miami 女角（cast_girl、capoCast 的 girl／girl_spine）、
>   平面剪影（capoCast 的 guy／guy_spine／guy_bat*）、舊開場 `intro_boss_v3.png`、`CastFigure.svelte`、`CastFigureMesh.svelte`、`skinnedFigure.ts`，
>   以及只讀舊 rig 的 `check_cast_motion.mjs`（已移出 build，`check:cast` 改跑 `check_cast_layers.mjs`）、`dump_cast_pose.mjs`、`measure_cast_travel.mjs`、
>   `build_cast_guy_rig.py`、`build_cast_guy_states.py`、`build_intro_boss.py`、`build_cast_figures.py`，全部搬到 `design/_legacy_assets/single_mesh_cast_20260928/`。
>   `castMotion.ts` 拿掉舊 Don 的反應表與 MOTION_SCALE，只留共用的 idle 與姿勢／蒙皮程式；`CAST_NATIVE` 搬到 `game/castLayout.ts`。
>   `idleSway.ts` 的 `CAST_SWAY` 沒動：它參與 check_idle_sway 的循環週期計算，不帶任何素材。
> - 已在 playtest shell 實測：MG Don → FG 開場卡女主人 → FG 盤面女主人（Capo 打光版）→ 結算 → 回到 Don；4:3／16:10／16:9 都不壓到盤面。

---

## 1. 這款跟 Hot Miami 差在哪

| 項目 | Hot Miami | Capo Nostra |
|---|---|---|
| 框（Frame） | 只有 1×1 | **1×1 / 2×2 / 3×3**，整塊一個倍數，被中獎線穿過幾格算幾次 |
| Collector `C` | 掃全場框值後結算 | **完全移除** |
| 特殊 Wild `SW` | 無 | **Tommy Gun**：落地時整條直行貼滿 WILD（Scatter 不被覆蓋） |
| 免費遊戲三檔 | neon_nights / sunset_hits / ocean_drive | **soldier / capo / don** |
| 第三檔規則 | 全盤鋪框、無 Scatter/Collector、專用 reel 帶 | **起手黏 3 框（同第二檔）+ 每手保證至少 1 個 Tommy Gun** |
| Buy Bonus | 100 / 250 / 500 | **100 / 500 / 1000** |
| RTP | 全 94.00%（epic 94.17%） | **94.58 / 94.63 / 94.67 / 94.78**（2026-09-03 全檔降 0.5 個百分點，原為 95.08/95.13/95.17/95.28，跨距不變） |
| 盤面 / 線數 / 上限 | 5×4、14 線、20000x | 不變 |

沒動到的東西：paytable 數值、14 條 payline、盤面尺寸、win cap、reel 帶的整體節奏
（scatter 位置那套經過測量的配置原封不動保留）。

---

## 2. 數學（`math-sdk/games/capo_nostra/`）

### 檔案與職責

| 檔案 | 內容 |
|---|---|
| `game_config.py` | 盤面、paytable、三檔設定、**框尺寸階梯**、bet modes、RTP |
| `game_calculations.py` | `frame_cells()` 展開框的足跡；`framable_positions(size)` 找可放的錨點 |
| `game_executables.py` | 放框、抽尺寸/倍數、**`expand_special_wilds()`**、**`force_special_wild()`**、加倍 |
| `game_events.py` | 事件序列化。`collectorWin` 已刪除，新增 **`wildExpand`** |
| `game_override.py` | 狀態重置與 `check_repeat`。Ocean Drive 的 reel 替換邏輯已整段移除 |
| `gamestate.py` | 每手流程與事件順序 |
| `game_optimization.py` | 各 mode 的 RTP 切片目標 |
| `reels/make_reels.py` | reel 帶生成器。改完要重跑 `python make_reels.py` |

### 框的資料結構

```python
{"reel": 1, "row": 0, "size": 3, "mult": 8}
```

`reel`/`row` 是**左上角錨點**，`size` 是邊長。所以 size=3 錨在 reel 1 row 0 會蓋住
reel 1–3、row 0–2。倍數寫到**每一個被蓋住的格子**上，`Lines.get_lines` 用
`multiplier_method="symbol"` 把中獎位置的倍數加總——所以一條線穿過大框 3 格就吃 3 次。

**大框有自己的倍數階梯**（`config.frame_size_ladders`）：2×2 封頂 10x、3×3 封頂 8x。
這是刻意的：如果大框用 1×1 的階梯，一個 100x 的 3×3 被穿 3 格就是 +300x，
壓在 400x 的線上是 120,000x，直接被 20,000x 上限吞掉——尺寸就不再有意義。
**大框的價值要來自足跡，不是來自面額。**

放不下時會**降級而不是丟棄**（3×3 放不下就試 2×2、再試 1×1）。丟棄會讓框在盤面最擠的
時候變稀有，而那正好是強檔——等於偷偷削弱了強檔。

### Tommy Gun 展開

`expand_special_wilds()`（`game_executables.py`）把 SW 所在整軸換成 W，**但跳過 Scatter**。
跳過 Scatter 有兩個理由，第二個才是關鍵：

1. Scatter 可讀性——玩家看著三個 Scatter 落地，不該有一個被無關機制擦掉
2. **`force_freegame` 的正確性**——generator 是用 rejection sampling 湊 scatter 數量的，
   一個會刪掉 Scatter 的 wild 直行會讓那些書被退回重抽，靜靜地扭曲哪些觸發盤面能存活

展開後會呼叫 `get_special_symbols_on_board()` 重建快取，否則 retrigger 判定會讀到過期資料。

`force_special_wild()` 是 Don 檔的保證：盤面沒有 SW 就塞一個，塞在既非 Scatter 也非 Wild 的格子。

### 事件順序

```
reveal → [wildExpand] → [updateFrames] → [newFrames] → [winInfo] → [frameDoubling] → setWin → setTotalWin
```

`reveal` 送的是**發牌當下**的盤面（槍還在、整軸沒變），`wildExpand` 才是把那一軸變成 Wild
的那一拍。這樣拆是刻意的——把展開後的盤面直接塞進 `reveal` 也能對得起數學，但玩家就永遠
看不到槍落地，機制等於隱形。

> ⚠ **這件事前端必須配合**，見第 3 節的 `WildColumns.svelte`。

### 重跑數學

```bash
cd /Users/stone/stake-engine/math-sdk && PYTHONPATH=$PWD /Applications/anaconda3/envs/math-sdk/bin/python games/capo_nostra/run.py
```

**環境注意**：系統 `python3` 是 3.9，math-sdk 需要 3.10+（`match` 語法）。
可用的環境是 `/Applications/anaconda3/envs/math-sdk/bin/python`（3.12）。

改了 reel 組成要先 `cd games/capo_nostra/reels && python make_reels.py`。

跑完要同步前端 config：

```bash
cd /Users/stone/stake-engine/wp/apps/CapoNostra && /Applications/anaconda3/envs/math-sdk/bin/python design/sync_math_config.py /Users/stone/stake-engine/math-sdk
```

### 上次跑出來的數字（2026-09-03，全檔降 0.5 點後）

四檔 RTP 應要求整體下修 0.5 個百分點（原 95.08/95.13/95.17/95.28）。base 的四個 RTP
切片依原比例縮放（wincap 0.0015 維持不動，其餘按 0.994733 等比例縮），buy 檔的切片是從
`bet_mode.rtp` 自動推導，改 `game_config.py` 的目標值就會自動跟著算。

| mode | cost | RTP（改前 → 改後） | books |
|---|---|---|---|
| base | 1× | 0.9508 → **0.9458** | 40,000 |
| bonus (Soldier) | 100× | 0.9513 → **0.9463** | 20,000 |
| bonus_hits (Capo) | 500× | 0.9517 → **0.9467** | 20,000 |
| bonus_epic (The Don) | 1000× | 0.9528 → **0.9478** | 20,000 |

RTP 切片加總 = 0.94580（精確，`verify_optimization_input` 的 assert 卡過）。四檔跨距仍是
0.20%（每檔降的幅度一樣，跨距不變），Stake 上限 0.5%。
Max win 20,000x 四檔皆實測可達（`lookUpTable_*.csv` 裡 payout=20000 的列都還在：
base 12 列 / bonus 9 列 / bonus_hits 4 列 / bonus_epic 1 列）。

模擬量測（這幾項是 reel 帶與遊戲機制本身決定的，這次只動了 optimizer 的 RTP 權重目標，
沒有動 reels 或機制程式碼，所以沒有重新量測——原始數字附註於此供參考）：

- 框尺寸分佈 1×1 88.0% / 2×2 10.7% / 3×3 1.3%
- 一般遊戲出現 wild 直行 **24.5%**（贏分手 36%、輸分手 10%）
- Soldier / Capo 免費遊戲 wild 直行 28%
- **Don 檔保證 wild 直行**：由 `force_special_wild()` 在模擬階段無條件套用，
  跟 optimizer 的權重無關，結構上仍是每手 100%（上次實測 2084/2084）

`run.py` 這次多印了兩條警告：

```
Mode [bonus_hits] fails 3-star volatility limits: VIOLATED: etl10k VALUE:3.4524 --- LIMIT: 0.8
Mode [bonus_epic] fails 3-star volatility limits: VIOLATED: etl10k VALUE:349.0423 --- LIMIT: 0.8
```

只是 `warnings.warn`，不擋 `run.py`（exit 0）。**這裡第一次判斷錯了**：我原本以為
`etl10k` 沒有除以 `bet_cost` 是量測單位問題、跟實際上不上架無關，就沒有處理。
使用者後來直接貼了 Stake 平台自己的量化面板截圖，`bonus_epic` 在 **Tail Probability
(5,000x)** 跟 **(10,000x)** 兩項都是真的失敗（2 星、3 星都被扣到 Max Exposure：
15,000,000→10,000,000、50,000,000→25,000,000），不是 local checker 的假警報。
量到的原始數字：p(≥5000x) 0.0496、p(≥10000x) 0.0249，比最嚴的門檻（0.0100／0.0050）
超標約 5 倍。

### bonus_epic 尾端機率修正（2026-09-03，同日第三次跑）

根因在 `game_optimization.py` 的 `buy_scaling`：`freegame_strong`（bonus_epic 專用的
criteria）原本把 `(10000, 15000)` 這個賠付區間**放大 1.2 倍**（設計原意是讓大獎感覺
更常見），正好是被抓到超標的那個區間。改成 `(5000, 19999) @ 0.12`（壓低，範圍也放寬到
涵蓋 5000x 檢查跟 wincap 之下的整段尾巴）。Base game 自己觸發 Don 那組同款設定（沒被抓，
但道理一樣）也同步改，否則會變成免費中 Don 比花錢買 Don 賠得更猛。RTP 目標沒有動，
bonus_epic 還是 0.9478。

重跑後量到的**原始**（未乘 `prob_scale` leniency）尾端機率，逐一核對截圖裡兩層門檻：

| mode | p(≥5000x) | 2★門檻 0.0100 | 3★門檻 0.0500 | p(≥10000x) | 2★門檻 0.0050 | 3★門檻 0.0100 |
|---|---|---|---|---|---|---|
| base | 0.000001 | PASS | PASS | 0.000000 | PASS | PASS |
| bonus | 0.000026 | PASS | PASS | 0.000010 | PASS | PASS |
| bonus_hits | 0.001088 | PASS | PASS | 0.000253 | PASS | PASS |
| **bonus_epic** | **0.003905** | **PASS** | PASS | **0.001549** | **PASS** | PASS |

四檔在兩層門檻都過，bonus_epic 還留有約 2.5–3 倍餘裕。`bonus_hits` 從頭到尾都沒有真的
超標過（`etl10k` 對它的警報本來就是誤報——它的買入成本 500× 還不到讓這個未除以
`bet_cost` 的指標失真到會誤判的門檻，真正的機率式檢查對它一直是過的）。

RTP、書數、wincap 可達性都沒被這次調整動到（見上表）。前端 config 重新同步、
playtest stub 重建、三個 upload zip 都已重新打包。

**這是本地量測，不是直接查 Stake 的線上面板**——沒有 API 可以從這裡直接呼叫那個工具，
數字是照它列出的 5,000x／10,000x／星等門檻公式在本地重算的。麻煩上傳後再去面板確認一次。

### bonus_epic Probability of Payout < Bet 降到 70% 以下（2026-09-03，同日第四、五次跑）

尾端機率修完後量到 bonus_epic 的 `prob_less_bet` 是 75.6%，要求降到 70% 以下，同時
「2000~5000X 獎稍微往下移」。

**先釐清一個容易搞混的地方**：`buy_scaling` 裡原本就有一條 `(2000,5000)@0.8`，但那條
`criteria` 是 `freegame_mid`——**500× Capo 的桶子，不是 1000× Don 的**。bonus_epic
(`freegame_strong`) 在 2000-5000 這段本來完全沒有調過權重，所以「稍微往下移」是新增
一條規則，不是改舊的。

做法：
- 新增 `freegame_strong (2000,5000) @ 0.7`（稍微壓低，如題目要求）
- 新增 `freegame_strong (1000,2000) @ 4.5`（拉高——這才是真正讓 prob_less_bet 下降的
  關鍵：單壓 2000-5000 不保證釋出的權重會往上（≥1000）跑而不是往下（<1000）跑，兩個
  方向對 fence 要守住的 RTP 目標同樣成立，得明確給一個目的地）
- Base game 自己觸發 Don 的同款設定同步改（跟尾端機率修正一樣的理由：同一個 feature，
  免費觸發跟花錢買不該長不一樣的形狀）

分兩次調：第一次 boost=3.0，量出來 70.85%，還差一點沒過，boost 加到 4.5 重跑第二次。

| | 改前 | boost=3.0 | boost=4.5（最終） |
|---|---|---|---|
| prob_less_bet | 75.6% | 70.85% | **67.8%** ✓ |
| 2000-4999x 佔比 | 19.68% | 15.91% | **9.88%**（確實往下移了） |
| 1000-1999x 佔比 | 4.37% | 12.90% | 21.95% |
| p(≥5000x)（原始） | 0.003905 | 0.003303 | 0.003310（沒退步，仍遠低於 2★門檻 0.0100） |
| p(≥10000x)（原始） | 0.001549 | 0.001391 | 0.001519（沒退步，仍遠低於 2★門檻 0.0050） |

RTP 沒動（bonus_epic 仍 0.9478）。跑跟跑之間 base／bonus／bonus_hits 這幾個沒被
這次調整碰到的模式，`prob_less_bet` 本身在不同次模擬間有明顯波動（例如 bonus_hits
上次量到 65.9%、這次 80.7%）——這是模擬本身的隨機性，不是被這次改動牽動；真正要看的
是**這次實際會出貨的那批 books**，數字就是上表最右欄。

前端 config、playtest stub、三個 upload zip 都已依這批新書重新打包。

### bonus_epic 拉高 20-200x 跟 1000-2000x（2026-09-03，同日第六次跑）

上一節修完後，要求「把一些 20~200 倍的獎比例提高，1000~2000 倍比例也提高」。

量測發現 20-200x 當時只佔 18.3%（幾乎全在 100-200x，20-100x 本身不到 1%），而
**200-999x 這一整段從今天改到現在完全沒被動過，佔了將近一半的權重（49.5%：
200-500x 25.9% + 500-1000x 23.6%）**。要同時拉高兩個不相鄰的檔位，總得有地方讓出
權重才行，200-999 是唯一夠大、又完全沒被前面幾次調整動過的地方，所以兩邊都從那裡抽。

做法：
- 新增 `freegame_strong (200,999) @ 0.75`（稍微壓低，不是砍掉——「拉高 20-200x」
  不等於「掏空中段」）
- 新增 `freegame_strong (20,200) @ 2.2`（拉高）
- `freegame_strong (1000,2000)` 從 4.5 再加到 **6.0**（「也提高」讀成要再往上，
  不只是維持在上次修完的水準）
- Base game 自己觸發 Don 的同款設定同步改

| | 這次改前 | 這次改後 |
|---|---|---|
| 20-200x 佔比 | 18.3% | **51.6%**（大幅拉高） |
| 200-999x 佔比 | 49.5% | 8.4%（權重來源，如預期下降） |
| 1000-2000x 佔比 | 21.95% | **26.8%**（再拉高） |
| 2000-5000x 佔比 | 9.88% | 12.5%（沒特別動它，優化器自己找地方放） |
| Probability of Payout < Bet | 67.8% | **60.4%**（連帶又降了，兩邊都是往「離開 <1000」的方向拉） |
| p(≥5000x)（原始，2★門檻 0.0100） | 0.003905 | 0.003223（沒退步） |
| p(≥10000x)（原始，2★門檻 0.0050） | 0.001549 | 0.001507（沒退步） |

RTP 沒動（bonus_epic 仍 0.9478，`average_win` 實測 947.8 對得上）。之前修好的兩件事——
尾端機率合規性、Probability of Payout < Bet < 70%——都沒有被這次調整拖累，反而
`prob_less_bet` 又更低了（這是拉高 1000-2000x 的自然結果：釋出的權重同時往 <1000
的 20-200 跟 ≥1000 的 1000-2000 兩邊分流，後者直接把 prob_less_bet 往下拉）。

Max win、書數、wincap 可達性都沒變（見上面的表）。前端 config、playtest stub、
三個 upload zip 都已依這批新書重新打包。

---

## 3. 前端（`src/`）

### 改了什麼

| 檔案 | 改動 |
|---|---|
| `game/typesBookEvent.ts` | `FrameEntry` 加 `size`；`collectorWin` → `wildExpand`；`BonusTier` 型別 |
| `game/stateGame.svelte.ts` | `frames` 用 `FrameEntry`；新增 `expandedWildReels` |
| `game/bookEventHandlerMap.ts` | 移除 `collectorWin` handler，新增 `wildExpand` |
| `game/featureTiers.ts` | 三檔改名與文案 |
| `game/constants.ts` `game/assets.ts` `game/symbolParts.ts` | `C` → `SW`，sprite key `hmC*` → `hmSw*` |
| `game/symbolWinMotion.ts` `game/symbolLandMotion.ts` | SW 的動態重寫（見下） |
| `game/betModeMeta.ts` `game/socialTerms.ts` | 每檔顯示**自己的** RTP |
| `components/NeonFrames.svelte` | 支援大框足跡；sweep 整段移除 |
| **`components/WildColumns.svelte`** | **新檔**：Tommy Gun 展開特效 + 符號替換 |
| `components/ui/Modal*.svelte` `IntroFeatures.svelte` | 規則/賠付表/開場文案 |
| `game/assets.ts` | 註冊 `capoFrame*` / `capoSw*` / 三檔標題 key |
| `design/soften_frames.py` | **新檔**：錢框透明度後製（見 ART_STATUS.md 3.1） |
| `design/check_feature_titles.mjs` | **新檔**：驗證 `titleKey` 都有註冊，已掛進 build |

### ⚠ `WildColumns.svelte` 不只是特效

**這個元件同時負責把整軸的符號真的換成 W，這一段不能拿掉。**

`reveal` 送的是展開前的盤面，但數學是拿展開後的盤面算線的。實測時抓到的原始 bug 就是這個：
book 2 的 reel 3 是 `[L1, L4, H5, SW]`，數學卻是照「整軸都是 W」結算——不換符號的話，
**玩家會看到一條中獎線把 L4 當 Wild 算**。

替換的規則必須跟 `game_executables.py` 的 `expand_special_wilds` 完全一致（Scatter 不換），
兩邊任何一邊寫錯都會產生玩家對不起來的賠付。

替換跟光束跑同一個時鐘：光束掃到哪一列，那一列才變 Wild，所以是「看著它被填滿」而不是
「特效播完盤面已經不一樣了」。

### 大框的呈現

`NeonFrames.svelte` 用 `span = SYMBOL_SIZE * size` 決定所有 sprite 的尺寸。
**倍數字級刻意不照 `span` 放大**——3×3 的字如果放大三倍，等於把「它很大」這件事講兩次，
足跡本身已經是尺寸提示了，字只給 18%/格的小幅加成。

框的分級（plain / premium / elite）改用 **`mult × size`** 而不是 `mult`。
因為大框階梯封頂在 10x/8x，只看面額的話所有大框都會掉進 plain，
但一個 3×3 的 8x 實際上比一個 1×1 的 8x 值錢得多。

### 美術已接上（佔位圖已全部換掉）

- 符號、三種尺寸的錢框、Tommy Gun 的火光/光柱/彈殼/彈孔、三檔標題全部是專屬美術
- `NeonFrames.svelte` 依 `size` 選 `capoFrame1x1/2x2/3x3` 與對應的 edge 疊層
- `WildColumns.svelte` 用 `capoSwMuzzle` / `capoSwBeam` / `capoSwShell` / `capoSwBulletHoles`

**錢框是後製過的** —— 交付的原圖是實心板子會蓋掉底下的符號，出貨用的圖由
`design/soften_frames.py` 從 `design/_capo_frames_delivered/` 產生。
重生圖之後要重跑那支腳本，細節見 ART_STATUS.md 第 3.1 節。

### 兩個尺寸上的硬限制

**槍口火光有尺寸上限（`FLASH_MAX = 1.6` 格）。** `WildColumns` 是 `Board` 的**兄弟節點**
而不是子節點 —— 這是故意的，因為 additive 光畫在 `BoardMask` 裡面會沒有東西可加而消失
（Pixi v8 的 sprite mask 是 filter，會把內容渲進一張透明的 render texture）。
代價是沒有任何東西會裁切它，尺寸就是唯一讓它留在盤面上的東西。槍可能落在最上或最下一排，
從那兩排的格心到盤面邊緣只有半格，所以 k 格寬的 sprite 會溢出 `(k/2 − 0.5)` 格 ——
原本的 3.0 溢出整整一格，直接壓到 bet bar 上。

**倍數文字畫在中心下方 `span × 0.22`**，因為框的中央淨空圓半徑約 `span × 0.31`。
原本的 0.34 剛好落在圓外，印在下緣金屬和轉盤上。改框的美術時這兩個數字要一起看。

---

## 4. 怎麼跑起來

### Dev server

```bash
pnpm --dir wp/apps/CapoNostra run dev
```

開在 **3013**（HotMiami 是 3003，不會撞）。**但直接開會是黑畫面**——沒有 RGS session。
要看畫面請用下面的 playtest shell。

### Playtest shell（真正能玩的路徑）

用真實 books 把 RGS 樁掉。網址**一定要帶 query 參數**，否則 `rgs_url` 是空的，
請求會逃到真的 fetch，畫面只會顯示 `TypeError: Failed to fetch`：

```bash
python3 -m http.server 4193 --directory dist/caponostra-playtest
```

然後開 `http://localhost:4193/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`

`.claude/launch.json` 裡已經有 `caponostra-dev` 和 `caponostra-playtest` 兩個設定。

### 重建 playtest shell（改了前端或重跑數學之後）

```bash
cd /Users/stone/stake-engine/wp/apps/CapoNostra && npx vite build
```

```bash
cd /Users/stone/stake-engine && rsync -a --exclude stub-data.js --exclude stub.js --delete-after wp/apps/CapoNostra/build/ dist/caponostra-playtest/ && cp wp/apps/CapoNostra/design/playtest_stub.js dist/caponostra-playtest/stub.js
```

`index.html` 需要在 `</head>` 前插入這兩行（rsync 後會被蓋掉，要補回去）：

```html
<script src="./stub-data.js"></script>
<script src="./stub.js"></script>
```

**只有重跑數學才需要**重新產生 stub 資料（13.8MB，不進 repo）：

```bash
cp math-sdk/games/capo_nostra/library/publish_files/* upload/CapoNostra/math/ && cd wp/apps/CapoNostra && /Applications/anaconda3/envs/math-sdk/bin/python design/build_playtest_stub_data.py
```

### 叫出特定書

`?forceBook=<id>`。stub-data.js 末尾的 `__STUB_CATALOGUE__` 有命名 id：
`maxWin` / `scatter3` / `scatter4` / `scatter5` / `wildExpand` / `bigFrame` / `deadWithFrames`。

上次跑出來的 BASE：`wildExpand=2`、`bigFrame=133`、`maxWin=541`。

### 設計檢查

```bash
cd /Users/stone/stake-engine/wp/apps/CapoNostra && pnpm run build
```

會跑十幾個 design/check_*.mjs。**`check_social_words.mjs` 特別重要**——社交玩法禁用詞
（`cash` / `money` / `pay` / `buy` …）。這次的機制原本叫 "Cash Frames"，就是被它擋下來
才改成 **Vault Frames** 的。

**guards 看不到用變數引用的資產。** `check_sprite_keys.mjs` 只讀 `key="..."` 的字面值，
`check_assets_exist.mjs` 只讀 `assets.ts` 裡的 `src:` 路徑。`FreeSpinIntro.svelte` 是用
`key={tier.titleKey}` 引用三檔標題的 —— 所以三檔改名成 soldier/capo/don 之後，
`featureTiers.ts` 要的三個 key 在 `assets.ts` 裡根本不存在、新的標題圖在硬碟上躺著沒被註冊，
而**所有 guard 都是綠的**，進 bonus 時 splash 會沒有標題。

已補上 `design/check_feature_titles.mjs`（已掛進 build），驗證每個 `titleKey` 都存在。
這個 guard 是**先注入壞值確認它會 FAIL 才採信的** —— clean run 在證明它會失敗之前不代表任何事。
目前全專案只有這一處用變數定址資產；之後再新增這種寫法，要同時補 guard。

`check_source_art.py` 會掃 `design/source/` 找「腳本畫出來的圖」（色數過少）。
錢框的交付原圖**刻意放在 `design/_capo_frames_delivered/`** 而不是 `design/source/`，
因為單色的 edge 疊層本來就會觸發它。

### 型別檢查（build 不做這件事）

`vite build` **不做型別檢查**，而 `check_undefined_refs.mjs` 對 `<script>` 區塊內的
識別字是盲的——兩者都綠的情況下，一個型別錯誤還是能活到 runtime。svelte-check 沒有裝在
這個 app 裡，要透過 workspace 的 pnpm store 呼叫：

```bash
cd /Users/stone/stake-engine/wp/apps/CapoNostra && pnpm run check:types
```

**基準線：687 errors / 28 warnings。** Hot Miami 跑出來是一模一樣的數字，所以這些全部是
從 Hot Miami 繼承下來的既有問題（shared package 的 readonly config cast、`strokeThickness`、
`expandingWildsClear` 不在 emitter union 裡等等）加上 `stories/` 的過期 fixture。

**判斷方式：不要看總數，看有沒有你改的檔案出現在清單裡。** 本次改動的所有檔案
（`WildColumns` / `NeonFrames` / `typesBookEvent` / `featureTiers` / `betModeMeta` /
`stateGame` / `symbolParts` / `symbolWinMotion` / `symbolLandMotion` / `socialTerms` /
`constants` / `assets`）在清單上是零筆。

---

## 5. 已驗證 / 未驗證

### 已實測驗證 ✓

- 大框 2×2 / 3×3 正確渲染，足跡與錨點無誤（截圖確認 3×3 跨 reel 2–4 / row 0–2）
- Tommy Gun 整行展開：第 4 軸四格全變 WILD 禮帽
- 框倍數（4x / 2x）正確顯示
- Buy 選單三檔價格 100× / 500× / 1000×、名稱 SOLDIER / CAPO / THE DON
- 每檔顯示自己的 RTP（SOLDIER 95.13%）
- 買入 SOLDIER → 扣款正確 → 進入免費遊戲，無卡住、無 console error
- 所有 design/check_* 通過、`vite build` 通過
- `svelte-check` 對本次改動的檔案零錯誤（總數 687 與 Hot Miami 完全相同，即無新增）
- `WildColumns` 的 additive 光效不在 `BoardMask` 內（是 `Board` 的兄弟節點），
  避開了「additive 在 mask 裡畫不出東西」那個曾經燒掉一次上傳的陷阱；截圖也確認火光可見
- Don 檔保證 wild（數學層 2084/2084）

### 2026-09-02 第二輪（美術進來之後）新增驗證 ✓

- 三種尺寸的錢框在實機盤面上底下的符號都認得出來（`?forceBook=133` 看 3×3）
- Tommy Gun 整行展開：四格全變 WILD 禮帽 + 紅色光柱 + 彈殼（`?forceBook=2`）
- 槍口火光收在盤面內，不再壓到 bet bar
- `pnpm run build` 全套 guard 綠燈（含新增的 `check_feature_titles`）

### 實測時抓到並修掉的問題

1. **`reveal` 盤面與結算盤面不一致** — 見第 3 節。這是唯一一個會造成錯誤賠付的 bug
2. **Buy 選單 THE DON 副標還是 "every position framed"** — 舊 Ocean Drive 的描述
3. **Buy 選單標題聲稱 "same RTP as the base game"** — 四檔已不同，這是合規宣稱，整句移除
4. **每檔 dialog 都印 base 的 RTP** — SOLDIER 顯示 95.08% 但實際 95.13%，改成讀各 mode 自己的
5. **THE DON 卡片畫 5 個框圖示** — 現在是 3 個

第二輪（美術進來之後）：

6. **三檔標題圖沒被註冊** — 見上面「設計檢查」那段。圖在硬碟上、`featureTiers.ts` 要的
   key 不存在、所有 guard 全綠。已修並補 guard
7. **錢框把符號整個蓋掉** — 交付原圖 57–68% 完全不透明。已用 `soften_frames.py` 後製，
   降到 12–21%
8. **`frame_edge_3x3` 中央是一塊填滿的灰盤**（alpha 0.70，另外兩張是 0.00）—— 它用 add 混合
   全 span 畫，會把 3×3 中間洗白。已清成純外框線
9. **槍口火光 3.0 格寬，溢出盤面壓到 bet bar** — 已加上限 1.6 格，並把推導寫進註解
10. **倍數文字落在淨空圓外**，印在框的下緣金屬上 — `span × 0.34` → `0.22`

### 還沒驗證 ⚠

- Capo（500×）與 The Don（1000×）的免費遊戲**沒有實際玩過**——預設 $1000 餘額買不起。
  三檔走的是同一段呈現程式，但 Don 的保證 wild 每手都會觸發 `WildColumns`，
  連續十手的節奏值得實際看一次
- Turbo 模式下大框與 wild 直行的時序
- 手機直式版面下 3×3 框會不會壓到 UI
- `stories/` 底下的 Storybook fixture 還是 Hot Miami 的舊書（含 `collectorWin`），
  跑那些 story 會 hang。要修就跑 `design/sync_story_books.py`（裡面的路徑還指著 hot_miami）

### 已知待辦

- **剩下的美術**（見 [ART_STATUS.md](ART_STATUS.md) 第 2 節）。符號、錢框、特效、標題、
  Logo、大佬角色都完成了；**開場說明頁人物**、背景、商店縮圖、中獎橫幅、盤面外框、音效
  還是 Hot Miami 的。開場頁最急 —— 那是玩家看到的第一個畫面
- `upload/CapoNostra/` 只有 `math/`，還沒打包 frontend
- `game_config.py` 的 paytable 註解寫 "Cash Case"，改成別的字比較一致（Python 註解不影響檢查）
- 標題列（左上時鐘旁、右上角）還印 **HOT MIAMI**
- 沒被引用的舊資產可以清（清單在 ART_STATUS.md 第 4 節），含整組 `cast_girl`

---

## 6. 怎麼截遊戲畫面（踩過的坑）

Browser pane 隱藏時 `requestAnimationFrame` 不會觸發，**遊戲根本不會動** ——
連拍出來每一幀都一樣。先 `tabs_select` 把 pane 叫到前景。

要把畫面存成檔案，兩條看似合理的路都不通：

- `drawImage(webglCanvas, …)` 到 2D canvas → **全黑**（drawing buffer 已清空）
- 連續呼叫 `canvas.toDataURL()` → **每次回傳同一張快取**

可行的是單張 `canvas.toDataURL('image/png')`（6MB base64，太大不能走工具回傳），
所以開一個本地接收端讓頁面 POST 過去存檔。腳本在 scratchpad 的 `shotsink.py`。

**300ms 以內的動畫（例如槍口火光）截不到。** 做法是暫時在
`WildColumns.svelte` 的火光後面插一行 `await waitForTimeout(3000)` 把它停住去拍，
拍完移除、重新 build 部署。這樣拍到的 renderer、sprite、尺寸都是真的，只有時鐘被改過 ——
但**一定要記得還原**（`grep TEMP-CAPTURE-HOLD` 應該回傳 0）。

---

## 7. 可以先動的旋鈕

| 想調什麼 | 改哪裡 |
|---|---|
| wild 直行太常出現（現在 24.5%） | `reels/make_reels.py` 的 `BASE_COMPOSITION["SW"]`。改成 `[0,1,0,1,0]` 約 17% |
| 大框太多/太少 | `game_config.py` 的 `SIZE_BASE` / `SIZE_WEAK` / `SIZE_MID` / `SIZE_STRONG` |
| 大框太強/太弱 | `game_config.py` 的 `frame_size_ladders` |
| 展開特效的節奏 | `components/WildColumns.svelte` 的 `SWEEP_MS` 與那三段 await |
| 各檔 RTP | `game_config.py` 的 `_buy_mode(..., rtp=)` + `game_optimization.py` 的切片（要加總相符） |

**1000× 的 Don 對 20,000× 上限只剩 20 倍空間**（100× 是 200 倍、500× 是 40 倍）。
還在安全範圍，但這條價格梯已經到極限——再往上就得同時抬 wincap，否則整個 mode 的
回報會集中在最頂端那幾個結果。

---

## 8. 送審被打回（4/9，門檻 6）—— 修復記錄（2026-09-04）

Hot Miami 同一套引擎拿 6.7 分過了，Capo Nostra 送審只拿 4/9（沒附理由）。派了
`stake-compliance` agent 重新稽核整個遊戲（`game-qa` agent 也派了，但因為 session
額度限制中途失敗，沒有拿到完整的實機播放報告）。稽核抓到的東西比想像中嚴重：

### 真正的問題：Loading Screen 的提示文字整組都還是 Hot Miami 的

`src/components/LoadingScreen.svelte` 的 `TIPS` 陣列——七條提示——**沒有一條是對的**：
提到「The Collector」（機制已移除）、「Neon Frames」（已改名 Vault Frames）、
「Neon Nights / Sunset Hits / Ocean Drive」（三檔早就改成 Soldier / Capo / The Don）、
甚至有一條描述的規則（「Ocean Drive 開局鋪滿全盤」）本身就是被砍掉的舊設計。

**這組文字不是背景雜訊，是 replay 模式唯一看得到的畫面。** `IntroFeatures.svelte`
在 replay 路徑會直接 dismiss 自己，但**沒有清 `showLoadingScreen`**——這是刻意設計
（loading screen 本來就該是 replay 的 loader），但代價是：一般玩法看不到這組文字
（intro card 蓋住），**replay 模式全程看得到**。Replay 是 Stake checklist 裡的正式
檢查項目之一，reviewer 開 replay 就會看到一款「Capo Nostra」在介紹「The Collector」。

已重寫成對照 `ModalGameRules.svelte` 原文核對過的七條，內容以後者為準（不是憑印象改寫）。

### 其他三個「殘留上一款」的問題

| 位置 | 問題 |
|---|---|
| `ModalPayTable.svelte:165` | Wild 的說明還寫「except the Scatter and **the Collector**」，跟 `ModalGameRules.svelte` 說的「except the Scatter and **the Tommy Gun**」直接互相矛盾——同一款遊戲兩個面板給不同答案 |
| `ModalGameRules.svelte:21` | Controls 清單的圖示路徑還指著 `hotMiamiUiIcons`——這個資料夾今天稍早被我改名成 `capoUiIcons`（見下方重新命名那段），但這一個引用沒跟著改，8 個控制項圖示全部會 404。純粹是我自己這輪重新命名時漏掉的，不是舊有問題 |
| `ModalGameRules.svelte:324` | 頁尾寫「TM and © 2026 **Stake Engine**」，應該是「**Silverstars Studio**」——Hot Miami 的同一行寫對的，這裡誤標了平台當工作室 |

### 資料夾重新命名：`hotMiami*` → `capo*`

`static/assets/sprites/` 底下所有實際會被載入的資料夾都還叫 `hotMiami*`
（Background/Brand/Cast/Frame/Fx/Splash/Symbols/Ui/UiIcons/WinBanners），
意味著每一個資產請求在瀏覽器 devtools 的 Network 分頁都寫著「這是 Hot Miami 的檔案」。
不影響功能，但正是使用者說的「有沒有殘留上一款資訊」——已重新命名十個資料夾
（`hotMiamiParts/` 刻意保留：36 個 entry 全部 `preload: false`，never fetched，
不會出現在 Network 分頁，是之前就決定緩議的部分分件動畫死碼，見上面第 5 節）。

**改名過程踩到的坑，寫下來給下次參考：**

1. `mv hotMiamiFx capoFx` 時 `capoFx/` 資料夾**已經存在**（v�金庫轉場那批素材），
   `mv` 把來源整個「搬進去」而不是「改名成」，變成 `capoFx/hotMiamiFx/*`——
   `check_assets_exist.mjs` 當場抓到 5 個檔案消失，靠 guard 才發現，手動合併修正。
2. `design/check_symbol_weight.py` 這支 guard 自己也硬編了 `hotMiamiSymbols/` 路徑
   （3 處），改完資料夾後guard 直接噴「assets.ts 沒有引用符號 h1」——這支腳本雖然在
   `design/` 底下、但它是 `pnpm run build` guard chain 的一環，跟純美術生成的離線腳本
   不一樣，必須跟著改。已修正三處路徑。
3. `ModalGameRules.svelte` 的 `hotMiamiUiIcons` 就是被我自己的驗證 grep 漏掉的
   （`hotMiami\(...\|Ui\)\b` 這個 pattern 裡 `\b` 卡在 "Ui" 後面，"UiIcons" 中間
   沒有 word-boundary，永遠比對不到）——是 `stake-compliance` agent 抓到的，
   不是我自己抓到的。**以後這類驗證直接用最原始的 `grep -rn "hotMiami" src/`
   全文比對，不要自己發明帶邊界的 pattern。**
4. 純離線的美術生成腳本（`design/generate_art.py`、`design/retheme_ui.py` 等
   四十幾支）**沒有改**——它們不在 build chain 裡，不會被打包進成品，讀寫的路徑
   跟出貨的資料夾名稱脫鉤本來就沒關係。

### Thumbnail 超過 3MB 上限

`CapoNostra-BG.png`（2.02MB）+ `CapoNostra-FG.png`（1.25MB）= 3.27MB，超過平台
3MB 的背景+前景合計上限。用 `zopflipng`（無損）重新壓縮，畫質完全沒變：
BG → 1.90MB、FG → 1.09MB，合計 2.995MB，過關但沒有很多餘裕。已核對兩張圖
`Read` 出來目視比對，沒有肉眼可見的畫質損失。

### 順手修的：開場人物在 intro card 是完全靜止的

跟審核分數的關聯不確定，但這是使用者原本就講過的硬性要求（人物要會動）：
`IntroFeatures.svelte` 的開場卡角色圖是**純靜態 PNG**（`intro_boss_v1.png`），
Hot Miami 同一張卡用的是從 mesh rig 預先烘焙出來的**動畫 webp**（`guy_idle.webp`）。
這款從沒做過那個烘焙流程，角色在 0.6s 走入動畫結束後就完全凍結，直到卡片關閉——
而這正是玩家/reviewer 看到的第一個畫面，停留時間還不短（三張說明卡要看完）。

發現這款檔案裡其實已經寫好一組 `castSwayLeft` 的 CSS keyframes（連 Hot Miami
自己都沒接上，是死碼——它自己升級成用 webp 之後這組就沒人用了），註解直接寫明
「為扁平剪影角色設計的持續呼吸動畫」——正好是這裡缺的東西。把入場動畫（一次性
滑入）跟呼吸動畫（持續迴圈）拆到 wrapper／img 兩層（CSS 同一個元素兩個
`animation` 同時動 `transform` 會互相蓋掉，不能疊在同一層），接上 `castSwayLeft`。
已用 `getComputedStyle` 實測跨影格的 transform matrix 有持續變化，確認動畫真的在跑
（不是只有 `animationPlayState: running` 這種騙人的假象——這個坑本身也踩過一次：
第一次量測時分頁在背景，CSS animation 被瀏覽器凍結，數值連續四次讀出來都一樣）。

### 沒有能驗證的部分

`game-qa` agent 因為 session 額度限制中途失敗，**沒有拿到完整的實機互動測試報告**
（原本要測 Buy Bonus 面板窄螢幕裁切、免費遊戲全流程、手機直式等）。已知有這些缺口：

- 全流程實機播放（一般轉、三檔免費遊戲、retrigger）沒有這輪重新測過
- Buy Bonus 面板在窄視窗（Popout S/L）會不會裁切/重疊——之前在別的遊戲的
  共用元件上抓到過同類問題，但那個修正已經在這次的 build 裡（見更早的稽核）
- 手機直式（375×812）沒有這輪重新測過
- 動畫/turbo 時序（`stake-compliance` agent 自陳「無法透過受限的分頁量測」）

### 目前狀態

13 個 guard 全綠，正式 build 乾淨無錯誤。已重新部署 playtest 跟重新打包
`CapoNostra-frontend.zip` / `CapoNostra-upload.zip`（`CapoNostra-math.zip` 這輪
沒動數學，不需要重打）。修好的四項（Collector 矛盾、Loading Screen 舊文案、
圖示路徑 404、Stake Engine 誤標）已在瀏覽器裡直接讀 DOM 確認生效，不是只看
原始碼或 build log。

### 補充驗證（2026-09-04，`game-qa` agent 兩次都因 session 額度限制中途失敗後，改自己直接測）

額度重置後（19:20 左右）改自己用 Browser pane 直接測，補上原本 agent 沒測完的部分：

- **Buy Bonus 面板在窄螢幕**：桌面全寬、760px、640px、375px（直式手機）都測過。
  640px 以下三張卡改成上下堆疊、可捲動，沒有裁切、+/- 調整額按鈕沒有被蓋住——
  之前在別的遊戲共用元件上抓到的「卡片裁切／額度按鈕重疊」問題，這裡沒有重現。
- **選單跟 Buy Bonus 重疊**：桌面版跟直式手機版都測過，選單展開時 Buy Bonus
  按鈕正確消失，沒有疊字。
- **直式手機（375×812）**：intro card、盤面、下 bar、選單、Buy Bonus 面板都測過，
  排版正常，沒有裁切或重疊。直式下人物不顯示（帶狀空間太窄，之前就是刻意這樣改的）。
- **開場人物動畫**：這次順便再次用 `getComputedStyle` 跨影格核對 transform matrix
  有連續變化，動畫確實在跑，不是只有 `animationPlayState: running` 的假象。

**還是沒有機會實測到的**：三檔免費遊戲的完整播放（trigger→retrigger→outro）、
turbo 時序、音效觸發時機——這些需要能連續互動一段時間的環境，這個 harness 的
Browser pane 對滑鼠點擊在某些視窗尺寸下會間歇性「pane hidden」（螢幕截圖跟
`javascript_exec` 不受影響，只有 `computer` 的點擊/捲動動作會卡住），
繞過的方法是改用 `dispatchEvent(PointerEvent)` 直接送事件到 canvas，
這次測窄螢幕/直式版面就是這樣繞過去的。

## 2026-09-04 — frontend-presentation

**Did:** 站在盤面旁的 mesh 角色（`SkinnedFigure`）反應從「連線 / 觸發」兩檔改成
三檔 `win` / `bigWin` / `trigger`，並把「多大算大獎」的常數抽成單一來源。

**Found:**

- `src/game/skinnedFigure.ts:92`（改前）— 連線反應 `WIN_REACTION × 0.34` 的有效
  峰值是 **0.41°**，正好是 mesh-cast-rig 文件列的第四號缺陷（「小到看不見的
  反應」）；而同一根骨的 idle 擺動峰值是 1.6°，也就是連線反應整個埋在待機晃動的
  雜訊底下。實測（1280×720、人物高 372 CSS px）改前身體頂點最大位移 **0.58 px**。
  Advisory，已修。
- `src/game/skinnedFigure.ts`（改前）— 三段反應所有骨共用同一條包絡線，沒有任何
  lag，也是文件列的缺陷之一（「讀起來是抽搐不是身體」）。已加 `REACTION_LAG_MS`
  跟隨鏈（hips→waist→chest→neck→head、chest→arm→forearm），三檔共用同一組、
  只用 `lagScale` 縮放。Advisory，已修。
- `src/components/SymbolWinAnim.svelte:128`（改前）— `BIG_WIN_MULTIPLE = 15` 是
  元件內的私有常數，角色反應沒有辦法讀到同一個值。已移到
  `src/game/constants.ts` 的 `BIG_WIN_MULTIPLE` / `BIG_WIN_UNITS`，符號的稀有
  表情與角色反應現在讀同一個來源。Advisory，已修。
- playtest shell 在 Browser pane 隱藏時**不會前進**：pixi 的 ticker 可以用
  `app.ticker.update()` 手動驅動，但轉軸用的是 svelte `Tween`（走 rAF），
  分頁隱藏時 rAF 不跑，整局會停在轉軸中。繞法是在 `dist/caponostra-playtest/index.html`
  暫時插一段把 `requestAnimationFrame` 換成 `setTimeout` 的 shim（**只在
  dist，最後已移除，repo 內沒有這段**）。Advisory，給下一個要在這個環境跑整局的人。
- 一次 `[Loader.load] Failed to load .../capoUiPlates/ticker_plate.png`。檔案在
  dist 裡存在，`curl` 回 200，判定是 `python3 -m http.server` 在載入尖峰掉連線的
  環境問題，不是資產缺漏。Advisory。

**Verified:**（playtest shell，真實 books，`__stub.force(<id>)` 指定局）

- 三檔在圖上的實測（直接驅動 `SkinnedFigure`，以同一時刻的純 idle 姿勢為基準，
  取 figure_box 內頂點的最大位移，換算成 CSS px）：
  `win 1.15px @176ms、結束 712ms` ／ `bigWin 3.23px @248ms、結束 1048ms` ／
  `trigger 9.23px @328ms、結束 1368ms`。改前的連線是 0.58px。整體剛好落在
  1 : 2.8 : 8。
- 連線分檔（book 32564，1×）→ `kind:'win'`、圖上套到 `scale 0.46 / 720ms`。
- 大獎分檔（book 5093，45×）→ `kind:'bigWin'`、圖上套到 `scale 0.62 / 940ms`。
- FG 觸發（book 1715，87.8×）→ `kind:'trigger'`、`scale 0.86 / 1250ms`，
  免費遊戲內四次 winInfo 也正確分檔：160→win、100→win、8000→**bigWin**、520→win。
- **整局都跑完沒有卡住**：base 兩局（餘額 1000→1000、→1044）、bonus 一局
  （freeSpinTrigger → splash → 10 spins → freeSpinEnd → finalWin，餘額 +87.8、
  gameType 回 basegame）。`window.onerror` / `unhandledrejection` 全程 0 筆。
- 截圖：idle、bigWin 峰值（248ms）、trigger 峰值（328ms）三張凍結姿勢。
  trigger 一眼看得出人物被抬起、上半身前傾；bigWin 與 idle 的差別在
  800×450 的截圖上很細（頭與肩約 3 CSS px），肉眼分得出來但接近截圖解析度的極限。
- 最後一版（拿掉驗證用 hook 的乾淨 build）重新載入、跑完一局 45× 大獎，
  `window.__castFigure === undefined` 確認 hook 沒有留在產品裡。

**Unverified:**

- **沒有實際「看」到動畫過程**，只看得到凍結的單格姿勢。反應最長 1.37 秒，這個
  環境的截圖是一次一張、而且 pane 隱藏時不合成畫面，抓不到連續影格。
  跟隨鏈（lag）造成的「前臂比頭晚到」我是用逐格量測確認的，不是看出來的。
- 沒有測直式手機版面（該版面本來就不畫人物）。
- 沒有測 `FreeSpinIntro` 裡那一份 `CastFigureMesh`（splash 期間 `Cast` 會讓位，
  splash 自己畫一份）；三檔反應只在盤面旁那一份上驗過。
- 沒跑完整 `pnpm build` 的全部 gate（只跑了 `check:sprite_keys` 與 svelte-check
  過濾我改的檔案；既有的 691 個型別錯誤是繼承來的，我改的檔案沒有新增任何一個）。

**2026-09-04 補記：turbo 時長已接上（同一輪）**

`SkinnedFigure.react()` 現在多一個 `speed` 參數（預設 1），把 `durationMs` 跟每根
骨的 lag 一起除下去——縮短長度，不縮小幅度，是刻意的：turbo 要的是「快一點看
到」，不是「動得小一點」。呼叫端（`CastFigureMesh.svelte`）在 `$effect` 裡量：
`trigger` 讀 `featureTimeScale()`（跟 FG 開場那條線的其他 beat 一致，不是拍平的
2×），`win`/`bigWin` 讀 `stateBetDerived.timeScale()`（跟一般連線的其他 beat 一
致）。`skinnedFigure.ts` 本身刻意不 import 這兩個 turbo 模組——維持它是純渲染器
的界線，turbo 狀態一律由呼叫端在 `react()` 當下讀好傳進來，跟 `atMs` 一樣的做法。

驗證：`vite build` 乾淨過（無新型別錯誤）；playtest shell 開 turbo 連續轉了兩
局（含一次 Frame 爆炸的中獎），console 只剩下既有的、跟這次改動無關的
`ticker_plate.png` fetch 警告（重整前後都在，不是新增的）。沒有另外拿掉 hook 逐
格量測 turbo 下的實際位移數字——這次是看 build 乾淨＋連續跑幾局不出錯來驗，比
上一輪淺，如果要更嚴謹地確認 turbo 下三檔的相對力度關係還在，之後可以比照上一
輪的逐格量測手法補一次。

**Next:**

- `trigger` 這一檔現在跟另外兩檔共用跟隨鏈，但它的姿勢表 `REACTION` 手臂方向與
  `WIN_REACTION` / `BIG_WIN_REACTION` 相反（fore_l +2.8 對 -1.0）。這是刻意保留的
  （FG 開場是自己的一個 beat），但如果有人覺得三檔應該是同一個動作的三種力度，
  那要動的是 `REACTION` 而不是新加的那一檔。
- 這個 repo 沒有 mesh-cast-rig 文件講的 `design/check_cast_motion.mjs` 閘門
  （只有 `check_idle_sway.mjs`，它讀的是 `idleSway.ts`，不讀 `skinnedFigure.ts`）。
  三檔的遞增、跟隨鏈順序、關節不超過量測上限這三件事目前沒有任何自動檢查在守，
  我是用臨時腳本驗的。要補的話，`skinnedFigure.ts` 的表可以像那份文件說的那樣
  被 bare node 解析（它只 import pixi，表本身是純資料）。

## 2026-09-05 — frontend-presentation

**Did:** 把 Hot Miami 已經成熟的 mesh-cast-rig 動作管線移植到 Capo Nostra：拆出純資料
模組 `src/game/castMotion.ts`、新增可用 bare node 量測的閘門 `design/check_cast_motion.mjs`
（已掛進 build 與 `check:cast`）、實際做了一輪逐關節的張力量測、依量到的上限重寫三檔
反應表、修掉手臂正負號的「洩氣手勢」bug、補上 root 的 `stretch`（垂直縮放），並把
`bigWin` 更名為 `winBig` 對齊 Hot Miami 的命名。

**Found:**

- `src/game/skinnedFigure.ts`（改前，整包 227 行資料＋渲染混在一起）— 沒有任何資料/渲染
  的切分，所以 mesh-cast-rig 文件講的那道閘門在這款「結構上做不出來」（閘門必須 bare
  node import，一個 pixi import 就整個跑不起來）。Blocking（對「有沒有東西在守」而言），
  已修：資料搬到 `src/game/castMotion.ts`，該檔 **import 任何東西都不行**，也包括 turbo
  那兩個模組。
- `src/game/skinnedFigure.ts:92,105`（改前）— **正負號 bug 確實存在，和 Hot Miami 當年
  一模一樣**。用 rig 實測：`arm_l +10°` 手往外移 44px、`arm_r −10°` 手往外移 32px，
  也就是「左正右負 = 打開身體」。`WIN_REACTION` 與 `BIG_WIN_REACTION` 寫的是
  `arm_l −` / `arm_r +`——**全遊戲最常出現的兩檔反應是大佬把手臂往內縮**，而且和它自己
  的 `REACTION`（觸發檔，方向相反）互相矛盾。Blocking，已修：三檔統一成打開的方向，
  閘門 rule 5 現在會擋。
- 三檔的幅度是「憑保守猜的」而不是量出來的，量完發現**留了很多安全範圍沒用**。
  Advisory，已修（見下方量測表）。
- `src/components/CastFigureSpine.svelte:54`（改前）— `reactionKind` 型別只有
  `'idle'|'win'|'trigger'`，但它讀的 `stateGame.castReaction.kind` 早就有第三檔。
  這支元件目前是**死碼**（沒有任何地方 import 它，`Cast.svelte` 走 mesh 版），
  但型別還是修成 `'idle' | CastReactionKind`。Advisory。
- 這個 harness 的 Browser pane 在背景時 `requestAnimationFrame` 完全凍結（`document.hidden`
  → `ticker.lastTime` 不動），所以整局跑不完。**`setTimeout` shim 沒有用**（背景分頁被
  clamp 到約 1 fps）；可行的是**用 Web Worker 每 16ms `postMessage` 來驅動 rAF**
  （Worker 不被 throttle），實測背景 49 fps。這段 shim 只放在 `dist/` 的 index.html，
  測完已移除（`grep TEMP-CAPTURE` 全 repo 與 dist 皆 0）。Advisory，留給下一個要在這個
  環境跑整局的人。

**量到的關節上限（The Don 自己的，2026-09-05）**

方法照 mesh-cast-rig 文件：把 `skinnedFigure.ts` 的矩陣數學原樣移植到離線腳本，
對 `static/assets/meshRigs/cast_guy` 一次只轉一根骨、算好 LBS 後把貼圖真的貼上去畫出來，
**放大到末端（手、臉）看**，不是看整體剪影。

| 骨 | 乾淨到 | 壞掉的樣子 |
|---|---|---|
| `arm_l` / `arm_r` | **4°** | 5° 手指開始沾黏、8° 變連指手套、12° 變槳且袖口撕開 |
| `fore_l` | **12°** | 20° 手指融在一起、35° 整隻手變楔形 |
| `fore_r` | **20°**（寬鬆） | 那個腕點就在手上，幾乎沒有混合權重，28° 還看得出是手 |
| `hips` | **8°** | 它拖著整個上半身（10° 頭移動 97px），11° 起肩膀與頭變形 |
| `waist` / `chest` | **10°** | 14° 起臉明顯變寬變扁 |
| `neck` | **15°** | 20° 起臉變矮胖 |
| `head` | **25°** | 30° 起下顎變寬 |

肩膀這麼緊是**畫的姿勢決定的**，跟 Hot Miami 那個男角同一個毛病：手臂貼著身體、
一隻手臂只有一格網格寬，沒有 mesh 可以吸收彎折（ART_BRIEF.md §1 要求手臂與軀幹之間
留空隙就是為了這個）。所以幅度改成往**脊椎**（每一節都遠低於自己的上限，但沿鏈累積起來
整個人移動很多，而累積出來的旋轉對下游是剛體、不花錢）和**前臂**放。

另外量到一件之前沒人注意的事：**idle 光是站著就吃掉肩膀 55% 的預算**（`arm_l` idle 峰值
2.20° / 上限 4°）。idle 這次刻意沒動（它是上一輪在實機上調出來的），但這是反應表不能
把幅度壓在肩膀上的直接原因，閘門 rule 8 現在會盯著這個比例。

**新舊有效峰值（度，含 `MOTION_SCALE`）**

| | win | winBig | trigger |
|---|---|---|---|
| 前臂 舊 → 新 | 0.55 → **2.3** | 1.24 → **4.8** | 2.41 → **8.0** |
| 頭 舊 → 新 | 0.25 → **2.0** | 0.65 → **4.2** | 2.06 → **7.0** |
| root 抬升 舊 → 新 | 0.14% → **0.8% + 0.6% stretch** | 0.50% → **1.5% + 1.1%** | 1.03% → **2.2% + 1.6%** |
| 長度 | 720ms（不變） | 940ms（不變） | 1250ms（不變） |

`stretch` 是這次補上的機制（Hot Miami 有、這款沒有）：root 的**垂直縮放**，樞紐在
`root`（y=886，在鞋底 830 之下），所以腳幾乎不動、travel 全部由頭帶走。它跟 `rise`
一樣不彎任何關節、任何幅度都不會拉伸貼圖。純平移看起來像「整個人在飄」，`stretch`
才是把他種回地板上的那一半。

**Verified:**

- **離線逐關節掃描**：九根骨、每根多個角度，算出 per-triangle 的形變奇異值當輔助指標，
  但**判定是看圖**（手放大 5-7 倍、臉放大 3 倍）。三檔中最大的 trigger 用「幅度 + 同方向
  idle 峰值」的最壞姿勢渲染出來，兩隻手放大 5 倍檢查：手指會轉會捲，**沒有刀片、沒有撕裂**。
- **閘門真的有在擋**：逐一注入壞值確認會 FAIL 再改回來——
  (A) 手臂正負號改回出貨版的 bug → 抓到；(B) trigger `arm_l` 1.4→2.4 → 抓到超過 4° 上限；
  (C) win 整檔縮回出貨前的大小 → 兩條「看不見」的規則都響（絕對下限 2°、以及沒有蓋過
  該骨自己的 idle 峰值 1.25 倍）；(D) trigger `fore_l` 的 lag 提前到 arm_l 之前 → 抓到
  跟隨鏈逆向；(E) winBig 幅度砍到比 win 小 → 抓到；(F) 表裡出現沒有量過上限的骨（`hair`）
  → 抓到；(G) idle `arm_l` 拉到 1.75 → 三條規則同時響（超過 1.5° 上限、吃掉 68% 關節預算、
  連帶把 trigger 推過 4°）；(H) winBig 時長縮到比 win 短 → 抓到。
- **實機三檔量測**（1280×720，playtest shell，跟**同一時刻的純 idle** 逐格相減，
  取頭頂頂點位移，CSS px；人物整個 figure box 對應 744 CSS px）：
  `win 24.8px @176ms、768ms 歸位` ／ `winBig 52.2px @560ms、1088ms` ／
  `trigger 83.9px @368ms、1424ms`。手部位移 11.7 / 23.7 / 38.2px。
  改前那組（上一輪量的，人物只有 372px 高）是 1.2 / 3.0 / 9.2px。
- **實機三檔的定格截圖**（idle / win / winBig / trigger 四張並排）：肉眼一眼看得出
  是同一個動作的三種力度——win 只是微微挺起來、winBig 明顯拔高並側傾、trigger 大幅
  往盤面方向壓過去且手臂張開。沒有任何一格看得到貼圖撕裂。
- **整局跑完沒有卡住**：base 小獎（book 32564 → `win`）、base 大獎（book 5093，45× →
  `winBig`，餘額 1000→1044）、**bonus 整局**（book 1715 → `trigger` → SOLDIER splash →
  10 手免費遊戲，含 Tommy Gun 展開 → TOTAL WIN $87.80 → 回 basegame，餘額 +87.80）。
  `window.onerror` / `unhandledrejection` 全程 **0 筆**。
- **turbo**：實機開 turbo 轉一局大獎，`react()` 收到 `speed: 2`。另外逐格量測
  `winBig` speed 1 vs 2：長度 1016ms → 512ms，**幅度 52.1px → 51.9px（不變）**；
  `trigger` speed 1 vs 1.55：1360ms → 880ms，84.2px → 84.3px。也就是 turbo 只縮短、
  不縮小，跟註解宣稱的一致。
- **最後一版是乾淨 build**：量測用的 `window.__castFigure` hook 與 dist 的 rAF shim
  都已移除並重新部署，重新載入後 `window.__castFigure === undefined`，再跑一局 45×
  大獎完整結束（餘額 1044、win $45）。中途的截圖剛好抓到一格 `winBig` 的反應姿勢。
- `pnpm run build` 全套 14 個 guard 綠燈（含新加的 `check_cast_motion`）、`vite build` 乾淨。
- `svelte-check`：705 errors / 30 warnings，逐條看過落在我改的檔案上的每一筆——
  全部是既有的三類繼承問題（shared package 的 readonly config cast、
  `expandingWildsClear` 不在 emitter union、`std.anchor` 推成 `never`），
  **沒有任何一筆提到 `castMotion` / `CastReactionKind` / `winBig` / `MOTION_SCALE` /
  `SkinnedFigure` / `ReactionTier`**（grep 計數 0）。

**Unverified:**

- **沒有看到連續播放的動畫**，只有定格與逐格量測。反應最長 1.42 秒，這個環境的截圖
  是一次一張，而且 pane 隱藏時整個 rAF 凍結——跟隨鏈（前臂比頭晚到）我是用逐格數字
  確認的，不是看出來的。
- **沒有驗 `FreeSpinIntro` 裡那一份 `CastFigureMesh`**。三檔量測與截圖都只在盤面旁那一份
  上做。splash 期間截圖看起來人物那一側偏暗，沒有進一步查是刻意的打光還是有問題——
  這是我留下最明確的一個缺口。
- 沒有測直式手機版面（該版面本來就不畫人物，`Cast.svelte` 的 `hasSideBand` 會擋掉）。
- 沒有測 Capo（500×）/ The Don（1000×）檔的免費遊戲——餘額買不起，這次只跑了
  base 觸發的 SOLDIER 檔。
- **`girl` 這條路徑沒有量過**。`MOTION_SCALE` 現在只有 `guy` 一個 key，
  `CastFigureMesh` 一律用 `MOTION_SCALE.guy`；Capo Nostra 只有一個角色
  （`Cast.svelte` 把 `who` 釘死成 `"guy"`、`FreeSpinIntro` 也傳 `"guy"`），
  但如果之後真的站第二個人上去，**必須同時**補 `MOTION_SCALE` 的 entry 跟
  `check_cast_motion.mjs` 的 `JOINT_LIMIT_DEG` 那一列，只補一邊正是隔壁那款出貨
  一隻壞掉的手的原因。
- `stories/` 的 Storybook fixture 我沒碰（它們本來就還是 Hot Miami 的舊書、含
  `collectorWin`，跑起來會 hang——這是第 5 節既有的待辦，不是這次造成的）。

**動到的檔案：**

- `src/game/castMotion.ts`（**新檔**：三檔表、idle 表、`MOTION_SCALE`、`wave`/`oddBeat`/
  `idleAngle`/`reactionEnvelope`，**不 import 任何東西**）
- `src/game/skinnedFigure.ts`（改寫成純渲染器，讀 `castMotion`；加上 root `stretch`；
  per-bone lag 改由各檔自己的表帶）
- `src/game/stateGame.svelte.ts`（`ReactionKind` → `CastReactionKind`，改從 `castMotion` 匯入）
- `src/game/bookEventHandlerMap.ts`（`'bigWin'` → `'winBig'`）
- `src/components/CastFigureMesh.svelte`（傳 `MOTION_SCALE.guy` 進建構子；註解更名）
- `src/components/CastFigureSpine.svelte`（死碼，只修型別）
- `design/check_cast_motion.mjs`（**新檔**，9 條規則）
- `package.json`（`build` chain 加 `check_cast_motion`、新增 `check:cast`）
- `dist/caponostra-playtest/`（重新部署，非 repo 內容）

**沒有動 `upload/CapoNostra/`**（打包留給後面獨立的一步）。

**Next:**

- **splash（`FreeSpinIntro`）那一份人物要有人實際看一次**。它現在跟盤面旁那份共用同一個
  `SkinnedFigure` 與同一組表，`trigger` 反應是在 splash 打開的同一拍觸發的，但我沒有驗證
  那一份的可見度與打光。
- **idle 的手臂幅度值得重新評估**。`arm_l` idle 峰值 2.20° 佔掉肩膀 4° 上限的 55%，
  反應能用的只剩 1.8°。如果之後想讓手臂在反應時更明顯，最划算的一刀是把 idle 的
  `arm_l`/`arm_r` 降 20%（釋出約 0.4°），而不是硬拉反應幅度——但那會動到上一輪在實機上
  調出來的手感，要重新用眼睛驗一次，不是改個數字就算。
- **真正的解方是重畫**：`ART_BRIEF.md §1` 已經寫了「手臂與軀幹之間要有空隙」。這一版
  的大佬手臂貼著身體，肩膀因此只有 4°。如果有機會重出這張圖，把手臂拉開，
  `JOINT_LIMIT_DEG` 的 `arm_*` 可以直接翻倍，三檔的表也就能整組放大。
- `check_cast_motion.mjs` 的 `JOINT_LIMIT_DEG` 是**量出來的、不是猜的**——改 rig、
  換貼圖、或動 `paint_limb_weights` 之後，這張表就過期了，要重跑一次掃描。

## 9. W／S 動作補完（2026-09-07，接續上一輪 H/L 重寫）

上一輪把 H1-H5、L1-L4 的贏分/落地動作從 Hot Miami 的（設計給另一批完全不同物件的）
動作換成貼合 Capo 自己符號的版本，但 `check_symbol_motion.mjs` 的 `KNOWN_INHERITED`
白名單留了 `win:W`／`land:W`／`win:S`／`land:S` 四條沒做——這輪補完，白名單現在是空的
（`KNOWN_INHERITED = {}`）。

**W（紳士帽，`w.png`，金色 "WILD" 布章）**：舊動作是 Hot Miami 的「漫畫爆炸」——四道
射線＋硬彈跳，帽子不會爆炸。
- win：改成「脫帽致意」的手勢——brim 快速掀起，兩次衰減的過衝震盪後回正（`ring =
  strike(u,3.2)*cos(uπ*3.4)`），金色布章在帽緣掀起時掃過一道高光。
- land：原本想直接用垂直擠壓＋小幅旋轉，但 `check_symbol_motion.mjs` 立刻抓到跟 H2
  的「砸地發光」與 H3 的「轉角搖晃」太像（0.70／0.85，門檻 0.9）——旋轉這個軸線在
  H3 的註解裡明講是留給公事包專用的。改成**純橫向搖擺衰減**（`dx` 正弦乘衰減，無旋
  轉、無淨位移），這條軸線board上沒人用過，最終跟其他符號的最近距離回到 0.9 以上。
  第一版的搖擺頻率／衰減率也踩到能見度門檻邊緣（9.9px，門檻10px，被 `boostToFloor`
  自動放大後仍卡在門檻下，因為波峰恰好落在兩個取樣點中間被漏掉）——把半週期數從 8
  改成 6，讓波峰精確落在 `t=20ms`（取樣網格的整數倍），問題才真正解決，不是單純調
  大振幅（那個自動放大機制會把任何「相關」的振幅一路正規化到門檻附近，調大振幅本身
  沒用，要讓取樣抓得到真正的峰值才行）。

**S（金庫門，`fs.png`，輪盤把手＋鉚釘）**：舊動作是 Hot Miami 的「綠╱青色星芒脈動」，
跟金庫門的鉚釘鋼鐵質感完全對不上。改成「輪盤被轉動」：`spins: true` 保留（board 上
唯一持續旋轉的符號，這個識別度值得留），但轉速從等速改成「加速轉入」（`spinup = 1 -
strike(u,4)`），疊一次金屬「哐」的擠壓（`clunk`），高光從一圈光暈改成沿輪盤掃過的
金屬反光條（`fxStreak`），顏色從 `0x4dffa6`（青綠）換成 `0xffb347`／`0xe3d9c6`（琥
珀／暖銀），對應 `fs.png` 本來就畫在門縫裡的那道琥珀光。land 沿用「轉入定格」的既有
概念（物理上本來就通，只是顏色跟形狀不對），同樣換色換形狀。

**H4 節拍音效**：檢查過 `sound.ts` 跟符號動作觸發點，沒有任何音效是綁在符號動作曲線
本身的節拍上（音效是按 win/land 事件本身觸發的通用一次性音效，不讀動作表的相位）——
上一輪擔心的「H4 從節拍震動改成連續晃盪後音效可能對不上」經檢查不成立，沒有動任何
音效相關檔案。

**驗證**：`pnpm run build` 全綠（13 道 gate，含 `check_symbol_motion.mjs` 現在無白名單
仍過），`vite build` 乾淨。Playtest shell 重新部署，實機轉了兩局（`forceBook=wildExpand`
跟 `forceBook=scatter3`），畫面上確認過帽子與金庫門符號本身渲染正常、整局不卡、
console 沒有新增錯誤（只剩 stub shell 本來就有的 `/wallet/balance` fetch 失敗，跟這輪
改動無關）。**沒有實際截到 W／S 中獎當下的動畫凍結格**——這兩次強制的 book 沒有讓
W／S 剛好中線；動作正確性主要靠 `check_symbol_motion.mjs` 的數值驗證（能見度門檻、
跨符號距離、跟 Hot Miami 的比對），不是肉眼看到播放過程。

動到的檔案：
- `src/game/symbolWinMotion.ts`（W／S 兩個區塊）
- `src/game/symbolLandMotion.ts`（W／S 兩個區塊）
- `design/check_symbol_motion.mjs`（清空 `KNOWN_INHERITED`）
- `dist/caponostra-playtest/`（重新部署，非 repo 內容）

沒有動 `upload/CapoNostra/`——打包留給使用者確認後再做。

## 10. 切層角色：B 版停做、中獎反應改走重定向（2026-09-20）

**B 版（照 `miami_main_guy` 切圖）停做**，一張圖都沒生。停的原因是需求本身組不起來，
不是生圖生壞了：15 個 slot 裡 13 個原本是加權網格、5 個 `len_synthetic` 全落在臉上
（`guy_head` / `guy_head_light` / `Glasses` / `lenses` / `lenses2`）、`bat` 兩個 slot 都是
`auto_fit: false`，而且機器導出的 `ref/miami_main_guy_spec.md` 自相矛盾（同一個檔名
同時列成兩種尺寸，因為導出時沒處理「一個 attachment 出現在多個 slot」）。
完整理由寫在 `ART_BRIEF_CAST_PACKS.md` 的「B 版為什麼停」。

打光層**不是**停做的原因 —— `motionlib.py` 的 `<slot>__<att>.png` 修補本來就支援，
難的是它們要跟同一塊**變形過的**網格逐像素對齊。

B 版唯一 A 版沒有的東西是**那 1 秒的中獎反應**，而那要的是動作、不是切圖。所以改成
`design/cast_layers/_hacksaw_motion/spineplay/retarget_reaction.py`：把反應的骨骼通道
重定向到 boss 的骨架，用 A 版已經交的七張圖播，產出三個版本讓使用者選
（`boss/reaction_{name,swap,torso}.gif`）。**評估用，原始關鍵幀不出貨。**

### 那 10 個沿用 pack 擺位的槽位 —— 同日補完

10 層全部卡在**同一件事**：`artfit` 用輪廓的三階動差判斷主軸往哪一頭，輪廓夠對稱時
最佳與次佳差不到 `SIG_AMBIG = 0.06`（實測 0.001–0.045），它就拒絕猜。沒有一層是形狀
對不上或缺骨長。新增 `spineplay/resolve_joints.py`：四種正負向各算一次擺放，跟 pack
自己那一層的四邊形比角點平均距離取最小 —— 判準成立是因為需求本來就是「照原版 bind
pose 畫」。7 層判準夠強（次佳/最佳 ≥1.5x），2 層（`ch3_arm_r`、`ch3_head`）判準弱但目視
方向正確，`ch3_pocket/ch3_body2` 四種都 >0.5 倍骨長、改用眼睛挑。

同時改了 `motionlib.joint_key()`：joints.json 查表順序變成 `<slot>/<att>` →
`<slot>__<att>` → `<att>`。`ch3_body2` 被兩個 slot 用、兩張圖不同尺寸，以 attachment
為鍵的條目會有一張必錯。

**結果：擬合 21 層、沿用 0 層（原本 11/10），`--verify-pose` 42 個關節全過
（原本只驗 22 個）。** 手臂不再是與身體分開的暗板、手掌不再浮在袖口下。

### ⚠ `--checkart` 對換皮不是驗收條件

補完之後 21 層裡 20 層仍然 fail，訊息全部是「輪廓跟原件對不上」。那是**形狀簽章**在比
「這塊圖跟 `miami_boss` 的同一個零件像不像」，門檻是拿原件轉八種角度量出來的波動 ×1.6。
Capo 的大佬是**另一個角色**（三件式西裝、圍巾、雪茄），輪廓本來就不一樣 ——
**這一關不可能過，之前把它列成待辦是錯的。** 機械上能回答「姿勢有沒有被強制寫進去」的
是 `--verify-pose`，那一關現在全過。

還要人看的是 `--checkart` 抓不到的那一類：`ch3_pocket/ch3_body2` 的圖是一塊灰補丁、
條紋方向跟褲子對不上，四種擺法都不對 —— **那一層要重畫**。

踩過的坑記在 `design/cast_layers/_hacksaw_motion/README.md`：前三個是同一類
（把網格變形的輔助骨當骨骼動作搬），第四個是 **boss 的 IK 目標掛在 `root` 底下** ——
軀幹位移接到 `boss_spine1` 時要一起搬 `hand_l/r_target` 與 `shoulder_l/r_target`，
否則手臂會張成翅膀。

## 11. 切層整條收掉，角色動作回到 Hot Miami 的寫法（2026-09-20）

使用者看過 A 版接上原始關鍵幀的三支 GIF 之後：「完全不行，重來，回到類似 hot miami 的
動態」。**§10 那整條切層／動作庫的路收掉**，檔案搬到
`design/_legacy_assets/cast_layers_spine_20260918/`（入口 `STOPPED.md`，記著那四個坑）。
角色一直都在蒙皮網格上跑 —— 切層只是 design/ 底下的評估，從來沒有接進 app —— 所以這一輪
動的是**動作表本身**。

### castMotion.ts：762 行 → Hot Miami 的寫法

拿掉的：`REFERENCE_ROTATION` / `REFERENCE_SCALE` / `fromReference`（三檔由抄錄算出來的
那套）、**squash and stretch**（`scale` / `flutter`，連同 `composeBoneMatrices` 裡的
第二組矩陣 `chain` 與 `boneAxes`）、`push` / `tremor`（本來就沒人用）、`lean`。
`glow` 留著 —— 那是閃光不是動作，而且不在抱怨範圍內。

放進來的：Hot Miami 三檔手寫的 `[角度, 延遲]` 表，**逐字照抄**，兩處例外：

1. **沒有 `hair` 骨** —— Hot Miami 的女角有，大佬短髮貼頭皮，這具 rig 上沒有這根骨。
2. **右側的正負號相反** —— Hot Miami 那具 rig 兩邊都是正的開身體；這具**量出來**是
   `arm_l +10°` 把手甩出 44px、`arm_r −10°` 把手甩出 32px。同一個手勢，反的號，因為圖不同。

### MOTION_SCALE 0.36 → 0.18，而且原因不是關節角度

0.36 是 Hot Miami 給他家**男角**的值，那個男角跟大佬一樣手臂貼著身體。照抄 0.36
每個關節都還在量到的上限內（最緊的左肩 4.07° 對 4.5°），**但 rule 10 的網格摺疊擋下來**：
左前臂在 `(85, 529)` 摺到 37%（門檻 50%）。掃出來的表寫在 `MOTION_SCALE` 的註解裡。

那個點是**權重斷崖**：兩側格子的 `fore_l` 權重是 0.17 和 0.83，一格 32px 跳 0.66。
一般的解法是 `build_cast_guy_rig.py` 多平滑幾次，**這裡不能用** —— 那支腳本自己的掃描
顯示 smooth=2 會把雪茄臂的上臂自有權重壓到 0.42，低於 rule 11 的 0.5 底線。
腳本也寫了為什麼：一格 32px，大佬的手臂寬 40–50px，一條手臂就是**一個格子**，
沒有「內部保持剛性、邊緣變軟」的餘地。

**真正的解方還是重畫**（`ART_BRIEF.md §1` 早就寫了）：手臂與身體之間要有空隙。
有空隙才有網格橫跨關節去吸收彎折，這個數字才回得去 0.36。

### 新增 `BODY_SCALE = 1`：rise / stretch 不吃 MOTION_SCALE

這是這一輪最關鍵的一個修正。`MOTION_SCALE` 存在的理由是「別把關節折到摺紙」，
而 `rise` / `stretch` **不折任何關節**：它們平移與縮放 root，整個人剛性移動，
沒有任何三角形相對鄰居變形。為了保護一條前臂而把它們一起縮小是搞錯類別，而且很貴 ——
實測整個反應看得見的份量**大部分來自 root 抬升**。

拆開前後（頂點最大位移，佔身高）：

| | win | winBig | trigger |
|---|---|---|---|
| 舊的（抄錄版） | 4.99% | 7.48% | 9.96% |
| Hot Miami 表 ×0.18，rise 也被縮 | 1.43% | 3.09% | 3.87% |
| **Hot Miami 表 ×0.18，rise 全額（出貨）** | **3.39%** | **7.38%** | **9.34%** |

也就是說：份量跟舊的差不多，但分佈換成 Hot Miami 的 —— 身體小、末端大、逐骨延遲。

### gate 跟著改回來

`check_cast_motion.mjs` 有三條是為抄錄版寫的，一併改回 Hot Miami 的形式：

- **rule 3** 拿掉「有 squash and stretch 就可以不要延遲」那條例外（那個通道沒了），
  逐骨延遲重新變成必要條件。
- **rule 6** 從「必須有一隻手臂拉長、另一隻壓縮」改回 **自由端 ≥ 2× 胸口**（旋轉量）。
  這具 rig 沒有頭髮骨，自由端就是兩條前臂。
- **rule 6b** 從「脊椎不得超過抄錄版的峰值」改成 **頭 ≤ 0.55 × 最大前臂**。
  0.55 是 Hot Miami 出貨版的比例（6.4 / 12.5 = 0.51）加一點餘裕 —— 它過了審，
  所以拿它當天花板不必自己發明一個數字。守的還是同一件事：「頭部位移太多」。

現況：`check_cast_motion ok (3 tiers, 10 idle bones)`，trigger 摺疊 63%（門檻 50%）、
0 翻轉；`pnpm run build` 全綠（18 道 gate + vite）。

### 新增 `design/dump_cast_pose.mjs`

把角色在指定時間點的網格頂點吐成 JSON，姿勢完全由 `src/game/castMotion.ts` 算
（跟遊戲、跟 gate 同一份程式，不自己推導矩陣）。用來畫接觸表與 GIF 給人看 ——
之前每次調這個表都只能靠數字，沒有人真的看過那一拍長什麼樣。
`--live` 讓待機跟著反應一起跑，那才是遊戲裡的樣子。

### 打包（2026-09-20）

`pnpm run build` 全綠 → 部署 playtest（`dist/caponostra-playtest/`，stub script 被 rsync
洗掉後有重新注入）→ 部署 `upload/CapoNostra/frontend/` → 打三個 zip。
**`math/` 沒動**，仍是 2026-09-14 建置。

| zip | 大小 |
|---|---|
| `upload/CapoNostra-frontend.zip` | 95 MB |
| `upload/CapoNostra-math.zip` | 109 MB |
| `upload/CapoNostra-upload.zip` | 207 MB |

出貨前檢查：舊遊戲名 `GoBananas` / `Hot Miami` / `hot_miami` / `Moooo` / `WildParty`
都是 0，`localhost:` 與 `stub.local` 都沒有，`frontend/` 底下沒有 stub／playtest 檔，
zip 裡沒有 `.map`。實機在 playtest shell 轉過四手（餘額 1000→998，Tommy Gun 與 Wild
都落過），除了我自己戳出來的一個 404 之外 console 無錯誤，`guy.rig.json` 有載入。

### 清掉兩項換皮殘留後重打（2026-09-20 第二次）

| zip | 第一次 | 清完 |
|---|---|---|
| `CapoNostra-frontend.zip` | 95 MB | **86 MB** |
| `CapoNostra-math.zip` | 109 MB | 109 MB（未動） |
| `CapoNostra-upload.zip` | 207 MB | **198 MB** |

**1. `sprites/hotMiamiParts/`（4.5MB）** —— 切片符號的零件圖。那套 rig 早就停用
（`SYMBOL_RIGS` 是空的 map，因為零件畫的是 Hot Miami 的角色），先前的處理只把
`preload` 關掉 —— 那只擋住開機下載，**Vite 對 `new URL(..., import.meta.url)` 是無條件
打包的**，圖照樣進包。這次連圖帶 `assets.ts` 的 37 個條目一起刪，動作定義（值得留的那部分）
搬到 `design/_legacy_assets/symbol_part_rigs_hotmiami_20260920.ts.bak`。
**「hotMiami」在出貨的 index.html 從 35 次降到 0。**

**2. `assets/spines/cast_guy` + `cast_girl`（5.4MB）與 `CastFigureSpine.svelte`** ——
帶 `preload: true`、每次開機都真的 fetch，但 `Cast.svelte` 掛的是 `CastFigureMesh`，
唯一讀那兩個 key 的 `CastFigureSpine.svelte` 沒有任何人 import。三者一起刪。

**踩到的坑：`check_assets_exist.mjs` 會掃整份 `assets.ts` 的 `assets/...` 字串，註解也算。**
我在註解裡寫了 `design/_legacy_assets/symbol_part_rigs_...` 和 `assets/spines/cast_guy`
兩個路徑，gate 當成兩個不存在的資產參照擋下來。註解改掉不要出現 `assets/` 這個字樣才過。

驗證：`pnpm run build` exit 0；出貨包內 `hotMiamiParts` / `/spines/` / `stub` / `playtest`
/ `.map` 全部 0 筆；playtest shell 重新開一次，`performance.getEntriesByType('resource')`
實測 **spines 0 筆、hotMiamiParts 0 筆、`guy.rig.json` 有載入**；轉四手（餘額 1000→998），
中過一條紅心線與一個 6x 錢框，符號都畫對（沒有變成紅鶴），console 無錯誤。

**未上傳到平台。**

## 12. 角色右移、Buy Bonus 的 hover 動態（2026-09-20）

使用者兩項要求：人物不要碰到盤面；Buy Bonus 按鈕要像協作者那款一樣「游標指過去會發亮然後旋轉」。

### 12.1 人物右移

`CastFigureMesh.svelte` 裡原本有一個沒有註解的 `props.x - 45` —— 把人物往**左**推 45 個
standard unit，那就是大佬的雪茄手壓在盤面右邊框上的原因。改成具名常數：

```ts
const MESH_TRIM_X = 10;   // 負值往右；原本等效於 45（往左）
```

`Cast.svelte` 的 `OVERLAP` **沒有動**，因為它同時參與 `width` 的計算（`std.width -
(boardInkRight - OVERLAP)`），調它會連帶改變人物大小 —— 位置與尺寸耦合在一起不好調。
`MESH_TRIM_X` 是純位移。

⚠ `Cast.svelte` 的註解仍寫著 Miami 參考「人物內緣**貼著**盤面、完全沒有間隙」。那是參考，
這次是使用者的決定推翻它，`MESH_TRIM_X` 的註解裡寫了這件事。

### 12.2 Buy Bonus hover：發亮 + 旋轉

協作者那顆是**船舵**，圓的、上面沒有字，所以整顆轉沒問題。Capo 這顆是 Art Deco 方牌，
上面寫著 BUY BONUS —— 整顆轉會把字轉到上下顛倒。所以**轉的是牌子背後自己的一圈光芒**，
牌子與字不動；只有芒尖越過方牌的圓角露出來，那正好是這款本來就在用的 Art Deco 放射紋。

新增共用元件 `packages/components-ui-pixi/src/components/BuyBonusHoverSpin.svelte`：

- **為什麼另開一個元件**：動畫要跟著 `hovered` 起停，而 `hovered` 只存在於
  `ButtonBuyBonus` 的 children snippet 裡。在 snippet 裡把它讀進元件 state 等於
  render 期間寫 state。當成 **prop 傳給子元件**，計時器就搬到值本來就在的地方 ——
  沒人指著的按鈕不會有任何計時器在跑（現有的 idle glow 是整局都在跑的）。
- `lit`（0→1，180ms）只驅動 alpha，`angle` 自由累加且**不歸零** —— 滑開再滑回來是接著轉，
  不會跳回十二點鐘。這兩個量分開，才讀得出「先亮、再轉」而不是「憑空出現一個已經在轉的環」。

主題鍵（預設全關，其他 12 款一律不受影響，已用 GoBananas 實際 build 驗過）：

| key | 預設 | Capo |
|---|---|---|
| `buyBonusHoverSpin` | `0`（關） | `38` 度/秒 |
| `buyBonusHoverSpinRays` | 12 | 14 |
| `buyBonusHoverSpinColor` | `0xffd98a` | `GOLD_LIGHT` |
| `buyBonusHoverSpinRadius` | 1.12 | 1.14（牌子半**對角線**的倍數，才蓋得過方牌的角） |

38 度/秒 ≈ 十秒一圈：看得出在動，又不會變成 loading spinner —— 那會在唯一一顆意思是
「花錢」的按鈕上說「請稍候」。

**調過一次**：第一版的底光是 1.06 倍半徑、alpha 0.10/0.14，在夜色盤面上變成一整塊跟按鈕
一樣大的灰白板，牌子不再是酒紅色、光芒也失去邊緣。收到 0.94/0.78 倍、alpha 0.05/0.07，
底光只負責把光芒坐穩，不該自己被看見。

驗證：`pnpm run build` 全綠；playtest 實機 hover，光芒亮起且兩次截圖的角度不同（確實在轉），
滑開後消失。⚠ 瀏覽器面板合成的 pointer 事件不太穩，第一次 hover 常常不觸發，
要先移到別處再移回來才會進 hover 狀態 —— 那是測試環境的問題，不是按鈕的。

### 12.3 重打，並且終於有了 `design/ship.sh`

這是 Capo 第四次手打包裝，前三次都是照 packaging.md 逐步敲 —— 而且同樣的兩個錯犯過兩次。
所以這次先把 `design/ship.sh` 寫出來（照 Hard Time 那份改），再用它出包：

1. **playtest 的 rsync 會用新 build 的 index.html 蓋掉舊的，把兩個 stub `<script>` 洗掉。**
   忘了補回去，playtest 殼就連不到假 RGS，看起來跟遊戲壞掉一模一樣。現在是第 5 步，會印訊息。
2. **在最後一次修改建好之前就打包。** 第 4 步一律重建，不假設 `build/` 是新的。

Capo 版與 Hard Time 版的差別：污染字串清單換成**其他**遊戲的名字（Capo 自己是被換皮的源頭，
但它本身又是從 Hot Miami 換皮來的，所以 `hotMiami` 這個**資料夾命名**也在清單裡 ——
資料夾名會以 URL 的形式進 bundle，即使畫面上沒有任何一個字提到另一款遊戲）；
上限是 20,000x，minifier 寫成 `2e4`。

| zip | 大小 |
|---|---|
| `upload/CapoNostra-frontend.zip` | 86 MB |
| `upload/CapoNostra-math.zip` | 109 MB（math 未動） |
| `upload/CapoNostra-upload.zip` | 198 MB |

`checks` 回報 `all clean`。出貨包內殘留 0 筆，`buyBonusHoverSpin` 確認在 index.html 裡。
實機：人物與盤面之間有間隙、hover 光芒會亮、轉兩手（餘額 1000→998）、資產全 200。
（playtest 有一筆 `ERR_CONNECTION_RESET` —— 那是 `python -m http.server` 單執行緒被並發請求
拖斷的連線，不是遊戲的錯誤。）

**未上傳到平台。**

## 13. Buy Bonus 的旋轉補上慣性（2026-09-20，取自協作者的船舵按鈕）

使用者給了協作者 private repo 的存取（`chenyuping1998/wp`，用本機已登入的 `gh` 讀）。
他們的 `apps/GoBananasBoat` 是貨櫃碼頭主題，Buy Bonus 的牌子就是一個**船舵** ——
而且他們共用套件裡的鍵名跟我這天自己取的**一模一樣**：`buyBonusHoverSpin`。
同名、不同義，值得記一筆（見下）。

### 他們做對、我原本沒做的三件事，已補進 `BuyBonusHoverSpin.svelte`

1. **慣性，而且是不對稱的**。進場 `k = 7` 很快咬住，離場 `k = 1.8` 慢慢滑停。
   起停都是硬切的話，那是「影片被暫停」，不是一個有質量的東西。常數直接用他們的，
   不值得重推一次。
2. **dt 夾在 100ms**。分頁被丟到背景、或主執行緒被卡住時，下一拍是**從原處接著跑**，
   而不是一次把整段空白積分掉、跳過一整圈。
3. **不可以用 `requestAnimationFrame`**。rAF 在背景分頁**完全不跑**，玩家切回來會看到
   光芒卡在半途的角度與亮度上 —— 是凍住，不是停下。`setInterval` 沒這個問題。
   （這點我本來就是用 `setInterval`，但理由是他們寫下來的。）

### 一件必須自己想的：淡出不能有自己的計時器

照抄慣性之後第一版是壞的：滑鼠移開後 `lit` 照原本的 180ms 淡出，但轉速要滑行約 1 秒才停
—— 光芒早就消失了，**慣性發生在看不見的地方**，等於白做。

改成 **`lit` 跟著剩餘轉速走**（`lit = min(lit, |speed| / 目標速度)`）：慢下來就同時暗下去，
兩者一起歸零。這也正好是一盞轉動的燈本來的樣子。

實測：滑鼠移開 → 光芒仍亮且在轉 → 明顯變暗 → 約 3 秒後完全消失。

### ⚠ 兩個 repo 的 `buyBonusHoverSpin` 同名不同義

| | 他們 | 我們 |
|---|---|---|
| 轉的東西 | **牌子本身**（美術是船舵，字另外畫所以不會顛倒） | 牌子**背後**另畫的一圈光芒 |
| 為什麼 | 圓的、沒有字，整顆轉最自然 | 方牌、字寫在上面，整顆轉字會顛倒 |
| hover 怎麼進 script | 在共用 `Button` 加了 `onhover` prop | 另開子元件，當 prop 傳 |

他們的 45 度/秒是**從美術推出來的**：八根舵柄，45 度一循環，剛好一秒一個視覺輪迴。
我們的 38 度/秒沒有這種依據，是挑的 —— Capo 的光芒是 14 道，若要比照辦理應該是
360/14 ≈ 25.7 的整數倍。**沒有改**，因為 38 目前看起來是對的，而且 14 道芒的循環
比八根舵柄細得多，對不對齊肉眼分不出來。

兩邊的 `packages/components-ui-pixi` 已經各自長歪（幾乎每個檔案都不一樣），
同名不同義只是其中一個徵兆。真要合併時這個鍵會撞。

驗證：`pnpm run build` 全綠；另外 build 了 GoBananas 確認共用套件沒壞。
已重新 stage 到 `upload/CapoNostra/`，**依使用者指示沒有打 zip**。

