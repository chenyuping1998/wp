# #7 香蕉猴：Go Bananas 切件 Spine（全身站姿、身體帶動作）

Go Bananas 系列（Boomana → Go Banandit）的吉祥物骨架與九個動作。**這是我們自己的骨架和動作**
（`tools/generate_monkey_spine.mjs` 從零件圖產生 Spine JSON），可以直接出貨，跟 #1–#5 的「量參考、寫自己的動作表」不同。

- **看動作**：`gallery/overview.gif`（八個動作連播）、`gallery/<動作>.gif`（各自循環，左 MG 大盜猴、右 FG 把風猩猩）、`gallery/bubble.gif`（FG 吹泡泡特寫）
- **互動預覽**：`python3 -m http.server 4231 --directory <本資料夾>` → 開 `http://localhost:4231/viewer.html`，按鈕切動作
  （本機已登記為 `/Users/stone/stake-engine/.claude/launch.json` 的 `monkey-gallery`）
- **數字**：`motion_table.md`（人看）、`motion_table.json`（程式讀），用 `python3 extract_motion.py spines/<角色>/monkey.json [--md]` 從骨架重量（目前的表量自 Lookout，含 bubble 骨）

## 什麼時候選它

| 適合 | 不適合 |
|---|---|
| 全身站姿、雙手自然下垂的角色（猴子、壯漢、工人、大盜） | 舉手過頭、雙臂交叉、扛道具在肩上的姿勢（手臂撐不住，見「手臂預算」） |
| 美術只交**一張全身圖**（用多邊形切）或 **24 層 PSD**（Boomana 格式） | 要逐格複製 Miami 的網格變形（走 #1–#5） |
| 要一套**完整反應**：贏分、大獎、觸發、丟東西轉場、受驚、提高警覺、看盤面 | 只要待機呼吸（#1–#5 較省事） |
| 需要「丟道具」接轉場的作品（道具骨掛在手上，出手點已量好） | |

一句話：**角色感來自身體**（髖部上下、軀幹擠壓伸展、頭、節奏差），手臂只跟著甩。

## 九個動作

時長、出處都從骨架量出；遊戲裡由 `reference_wiring/Mascot.svelte` 觸發。

| 動作 | 秒 | 遊戲裡什麼時候播 | 重點 |
|---|---|---|---|
| `idle` | 5.4（循環） | 一直 | 髖部 ±5px、胸口呼吸 torso scaleY 1.022、頭 −2.4°～+1.8°、兩臂各自週期 ±2°（1.8s／2.1s 錯開）；每條時間軸都在 5.4s 精準閉合 |
| `flutter` | 4.8（循環，**track 1**） | 永遠疊在上面 | 只動配件骨：嘴裡香蕉嚼兩下（−10°）、口袋晃 4°、袖口／褲管各自相位漂移；加物理才有慣性。**FG 吹泡泡**：0.3 → 0.58 → 0.88 → 1.18 → 1.5 → 1.86 倍，一口一口越吹越大（每口吹完回縮 3–4%），4.0s 撐到 2.0×1.86，4.04s 破掉，4.45s 起從嘴邊重吹；另加 ±3° 晃動 |
| `nod` | 1.0 | 主遊戲一般贏分（只在待機時） | 刻意幾乎不動：頭 +6°、髖 −7px。太常觸發，動作大就變成「提示音」 |
| `cheer` | 2.05 | big／super 大獎 | 蹲 26px → 跳 48px（0.42s 頂點）→ 落地；軀幹 scaleY 0.8～1.2；雙臂外甩 32°、前臂 ±21°（拖 0.05s） |
| `chestbeat` | 2.68 | FG 觸發、每次收集、mega／epic／max | 0.48s 起每 0.30s 一拳共六拳、左右交替；前臂內收 37.6°／26.5°，每拳髖部下沉 23px、頭點 10° |
| `throwit` | 1.2 | 轉場開始（丟袋子進場） | 0.2s 道具在手中長出來（scale 0.2→1.18）→ 拉弓 34° → **0.52s 語音、0.58s 出手**、道具隱藏；肩 36°、肘 30° 是全檔唯一超出手臂預算的地方（只經過、不停留） |
| `flinch` | 1.0 | 爆炸（香蕉大盜沒有，保留給有爆炸的作品） | 0.38s 爆點、0.48s 跳到最高、0.62s 落地 |
| `alert` | 1.35 | FG 計數器升級 | 0.45～1.0s 前傾停住盯盤面 |
| `glance` | 1.6 | 待機中隨機 | 往盤面看一眼再回來；主遊戲每 8～12.8s 一次；FG 從 6.3s 起、每升一級少 0.7s、最短 3.5s（再加最多 60% 隨機） |

每根骨頭的角度、位移、縮放和關鍵幀時間見 `motion_table.md`。

### 交叉淡入與互斥

- `mixDuration 0.16`：反應要即時，太長會錯過它在反應的事。
- one-shot（cheer chestbeat nod throwit flinch alert glance）播完靠 Spine 的 `complete` 回到 idle，不用計時器。
- **小反應可以互相打斷**（nod glance alert flinch），**大三個不被打斷**（cheer chestbeat throwit 各有意義）。
- 搥胸的六個衝擊星是遊戲自己畫的（不是骨架的一部分），時序抄 `BEAT_START 0.48 / BEAT_GAP 0.30`，落點用產生器印出的拳頭座標（`beat R/L fist at`）。

## 手臂預算（最重要的限制）

| 常數 | 值 | 為什麼 |
|---|---|---|
| `MAX_SHOULDER` | 26° | 逐 10° 掃出來的：25° 還好、30° 僵、40° 肩膀離開衣服、50° 像木板。第一版用 142° 舉過頭，在遊戲裡就是壞的 |
| `MAX_ELBOW` | 22° | 前臂零件中心在關節下方很遠，折太多會跟上臂疊成一團 |
| 垂手規則 | 前臂反轉肩膀的 70% | 肩膀甩、前臂維持鉛垂；同向轉會把手肘的彎抵銷成一直線 |
| 例外 | chestbeat、throwit | 手臂是「被驅動」而不是垂著，所以同向 |
| `LEAD / DRAG` | 0.05s / 0.08s | 一手先動、前臂晚到：完全對稱和同時到位最像機器 |

**舉手過頭的慶祝這套圖做不到**——要上臂另外畫一張、肩膀轉了還成立才行，那是美術的事，不是關鍵幀的事。

## 衣服和配件會動

- 袖子、大腿褲管是**加權網格**：靠肩 18px 內屬軀幹、70px 內交給手臂，下半段屬自己的下襬骨（cuffL/R、pantL/R）。
- 七條**物理約束**（Spine 4.2）：banana、helmet、pocket、cuffL/R、pantL/R。參數在產生器底部。
  ⚠ **每條約束要有自己的 `order`**，全部留 0 只有第一條會跑（不報錯）。
- 帽子刻意很硬：帽子底下的頭只畫到帽簷，傾太多會露出平頭頂。
- `RIGID_CLOTH=1` 產出舊的剛性版本，做前後對照用。

## 製作流程

1. **美術**：一張全身圖，雙手自然下垂、手肘微彎、腳底在畫面底；面向哪邊無所謂（切圖時可鏡像）。
   切件命名照 Boomana PSD（產生器靠前綴認骨頭）：`torso_0_trunk`、`head_2_face`、`left/right_arm_0_upper_arm`、
   `left/right_arm_2_hand`、`left/right_leg_0_thigh / 1_calf / 2_foot`（一張圖切 12 件；PSD 版另有 decoration、helmet、banana、pocket 等共 24 層）。
   投擲道具另交（`prop_sack.png`，約 160×160）。
2. **切圖**（一張圖時）：把 `tools/cut_cast_layers.py` 複製到遊戲 `design/`，在 `CUTS` 寫每件的多邊形（座標對照
   `examples/<mg|fg>/*_grid.png` 這種格線圖），`MIRROR` 決定是否鏡像讓角色面向盤面。
   ```bash
   python3 design/cut_cast_layers.py mg      # → design/source/mg/*.png、layers.json、_compare.png
   ```
   被蓋住的零件會往下延伸 26px（`UNDERLAY`）補自己的邊色，關節轉動不露洞；**先看 `_compare.png`**（左原圖、右重組）。
3. **骨架**：`design/source/<cast>/rig.json` 填沒有零件邊可讀的關節（root、hip、waist、neck、配件骨，範例在 `examples/*/source_rig.json`），然後：
   ```bash
   CAST=mg node design/generate_monkey_spine.mjs <有 pngjs 的資料夾>   # → static/assets/spines/<out>/monkey.{json,atlas,png}
   ```
   產生器會印出 `release hand at`（出手點）和 `beat R/L fist at`（拳頭落點），貼進遊戲的 `CASTS` 設定。
   缺零件的骨頭會警告（Banandit 沒有 helmet/banana/pocket 圖層，預期內）。
4. **檢查**：`node design/preview_monkey_spine.mjs <工具> chestbeat 0.3 1.0` 出 8 格接觸表。
   ⚠ 這個預覽**不畫網格**（袖子、大腿會消失），看關節要用 `RIGID_CLOTH=1` 產生；看實際樣子用 `viewer.html` 或遊戲。
5. **接遊戲**：參考 `reference_wiring/Mascot.svelte`（事件 → 動作、交叉淡入、衝擊星、護目鏡提示、依 gameType 換 MG/FG）
   和 `reference_wiring/TransitionAnimation.svelte`（鐵捲門等丟完才換場）。

## 從 Go Banandit 學到的（2026-10-01）

- **轉場要等動作播完**：throwit 1.2s，原本 0.71s 就換場，進出 FG 猴子都被切掉。現在門在 0.52s 出手時才開始落、
  換人在 1.36s（1.2 + 淡入 0.16）之後；轉場時鐘每幀最多走 100ms，頁面卡頓時不會一口氣關門。
- **出手後道具交給轉場**：骨架裡的道具在 0.58s 隱藏，轉場在同一點從 `mascotThrowOrigin` 飛一個自己的袋子出去。
- **跟背景分開**：絲印這種少色畫風，角色和背景同一組墨色就糊在一起；Banandit 在 spine 外包兩層 `OutlineFilter`
  （墨 2.5px＋紙 4px）。
- **朝向**：兩張原稿都朝右，站盤面右側要鏡像；在切圖時鏡像（`MIRROR`），不要翻骨架，否則丟的方向也會反。
- **旋轉關鍵幀欄位是 `value`**（4.x），寫成 3.8 的 `angle` 不會報錯，四肢就是不動。
- **小綠點（已修，2026-10-03）**：底襯（underlay）會越過別塊的縫，落成一塊不跟本體相連的碎片，四肢一動就飄在旁邊。`cut_cast_layers.py` 現在只保留碰得到本體的底襯。
- **會變大小的配件要切成獨立件**：泡泡用顏色挑出來（`colour_ok` 的 `bubble`）、補洞、外擴 1px 收反鋸齒邊，自己一根骨掛在頭上、原點在嘴唇。底下的臉用 `INPAINT_UNDER` 把整個泡泡範圍補畫（只補在臉的輪廓內），泡泡破掉時嘴才在。
- **骨頭的前綴規則會搶圖層**：head 的 regex 本來會吃掉 `head_6_bubble`，要在排除清單加上去。

## 檔案

```
gobananas_monkey/
  README.md                 本文件
  viewer.html               互動預覽（兩隻、八個按鈕）
  gallery/overview.gif      八個動作連播
  gallery/<動作>.gif         各動作循環
  gallery/vendor/           pixi 8.8.1、spine-pixi-v8 4.2.74（預覽用）
  motion_table.{md,json}    每根骨頭的量測值
  extract_motion.py         從任何同款骨架重量動作表
  spines/bananditBandit/    MG 大盜猴骨架（Spine 4.2 JSON＋atlas＋png）
  spines/bananditLookout/   FG 把風猩猩骨架
  tools/                    cut_cast_layers.py、generate_monkey_spine.mjs、preview_monkey_spine.mjs（複製到遊戲 design/ 用）
  examples/mg|fg/           切圖格線、rig.json、layers.json 範例
  reference_wiring/         Mascot.svelte、TransitionAnimation.svelte（Go Banandit 的接法）
```
