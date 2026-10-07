---
name: hacksaw-character-motion
description: Slot/game cast characters that move well — pick a pose archetype (Miami's boss / bat guy / bat girl / bikini girl / green guy / #7 Go Bananas monkey — our own shippable full-body Spine cutout rig with 9 motions: idle, flutter, nod, cheer, chestbeat, throw, flinch, alert, glance) when reskinning, turn it straight into a layered art brief (layers, cut lines, pose, joint guide), then build the delivered layers into one-mesh-per-layer rigs on a shared skeleton, gate them, and drive them with the game's OWN motion table measured from the archetype (timing, amplitude, ratios). Also: one-flat-PNG mesh rigs with verifiable zero-error gates, a Spine 3.8/4.x player/retargeter, and research-only motion packs (235 characters from 114 Hacksaw games, each with --verify goldens) that replay the reference exactly for comparison (never shipped — rig/PROVENANCE.md). Use when a reskin needs a character, the user wants to choose which kind of character/pose, wants an art brief/美術需求單 for a cast figure, wants character idle sway or win/trigger reactions, says arms look boneless, needs to animate a character PNG without seams, or wants to inspect a Spine skeleton. Triggers on 換皮選角色, 選角色, 角色需求單, 美術需求單, 分層, 角色動態, 角色動畫, 待機動畫, idle, reaction, 生圖提詞, 人物會動, 立繪動起來, rig, spine, 骨架, 網格變形, squash and stretch, 手像沒骨頭, 重定向, retarget, 動作庫, motion pack, 複製動作, 示意圖, GIF, Le Bandit, Le Prechaun, Miami Mayhem 角色, Chaos Crew 角色, 全目錄角色, 哪款遊戲的角色, 香蕉猴, Go Bananas, Banandit, Boomana, 搥胸, 丟東西.
---


# 角色動態：選姿勢 → 需求單 → 分層接入 → 自己的動作表

---

## ⚠️ 先分清楚使用者要的是哪一種

| 使用者說 | 走哪裡 |
|---|---|
| 換皮要一個會動的角色、「要哪種角色」「給我美術需求單」「照 Miami 那樣動」「複製某隻的動作」 | **換皮選角色** `archetype/` —— 下一節（**預設走這條**） |
| 「用香蕉猴／Banandit／Boomana 那隻的動作」「全身站著、會搥胸會丟東西」 | **#7 香蕉猴** `gobananas_monkey/README.md`（自己的骨架，可出貨） |
| 「讓我這張圖**會動**就好」（一張圖、沒指定姿勢） | **通用綁定** `rig/`（路線 A） |
| 「我想看原版動作套在我的圖上長怎樣」（研究、比對） | **動作庫預覽** `spineplay/motionlib.py`，**只在本機看，不出貨** |

**「完美複製」要先講清楚：** 動作包帶著參考角色的原始關鍵幀、網格頂點和權重，能逐格重現，
但 `rig/PROVENANCE.md` 規定它**研究用、不進產品、不散布**。出貨的動作一律是 `archetype/motion_table.py`
量出來、寫成遊戲自己格式的動作表：同樣的節奏、結構和力道分配，但不是逐格一樣。
使用者說「完美複製」時，先講這條線，再走換皮流程。

---

## ⭐ 換皮選角色（`archetype/`，細節見 `archetype/README.md`）

**每款遊戲都要兩個角色：MG（主遊戲）一隻、FG（免費遊戲）一隻**（使用者 2026-09-28 定的規則）。
兩隻是不同的人，不是同一人換打光（`--variants` 產的是同一隻的打光版，不算第二隻）。
下面 1–6 步**各跑一次**：兩隻可以選不同的原型，需求單分別輸出到 `design/cast_brief/mg/`、`design/cast_brief/fg/`，
各自建骨架、各自過閘門。兩隻用同一份 §0 畫風、同一個光源方向，腳底同一條線，頭頂高度差 5% 以內。
進 FG 轉場時換成 FG 那隻，FG 結束轉場時換回來；不要轉到一半換，也不要兩隻同時站在盤面旁。

1. **給使用者看** `gallery/overview.gif`（六隻並排、有編號，用色塊演出，沒有原作像素），用 AskUserQuestion 分兩題問：
   先問「垂手（老大／比基尼女）／扛道具（扛球棒男／扛球棒女）／雙臂交叉（綠背心）」哪一類，再問哪一隻。
   浣熊（#6）是零件路線，這條流程不適用。
   **另外一定要列出 #7 香蕉猴**（`gobananas_monkey/`，給使用者看 `gobananas_monkey/gallery/overview.gif`）：
   Go Bananas 系列的全身站姿 Spine 切件骨架，九個動作（待機、配件晃動、點頭、跳起歡呼、搥胸、丟道具、受驚、警覺、看盤面），
   **骨架和動作都是我們自己的，可直接出貨**；一張全身圖就能切。選了它就不走下面 2–6 步，改照
   `gobananas_monkey/README.md`（切圖 → 產生骨架 → 接 Mascot）。
2. **產需求單**：
   ```bash
   python archetype/brief.py -c 2 --game "Turf War" --out <app>/design/cast_brief/ \
       --feet-y 1674 --top-y 176 [--variants feature,kingpin] [--mirror] \
       --style <app>/ART_BRIEF.md --style-kind comic [--style-frame <風格基準圖> ...]
   ```
   輸出 `README.md`（繁中需求單）、`pose_guide.png`（只有關節和骨架線）、`layers.template.json`。
   `--feet-y`／`--top-y` 取這款遊戲目前人物的腳底和頭頂，換算到 1024×2048。
   **畫風一定要帶**：`--style` 取遊戲美術需求的 §0 貼進需求單，`--style-kind`（`comic` `noir` `woodcut`
   `engraving` `screenprint` `flat` `cel` `inkwash` `constructivist` `nouveau` `gouache` `cartoon`
   `rubberhose` `manga` `street` `caricature` `grime` `collage` `render`，
   對應 `game-reskin` 的 `references/art-direction.md`）加上「分層＋網格」才需要的畫風規則。
   沒帶 `--style` 時需求單最上面會寫「還不能交出去」，角色會以生圖模型預設的亮面寫實樣子回來。
3. **收圖、驗收、建骨架**：
   ```bash
   python archetype/layered/check_layered_art.py <交件資料夾> [--variants <資料夾>...]
   python archetype/layered/build_layered_rig.py <交件資料夾>
   ```
4. **動作表**：`python archetype/motion_table.py -c 2 --sides anatomical --out <dir>`。
   squash 的 k 從 0.42 起，用閘門往上找；網格撐不住時整組縮小，不要只砍一根。
5. **接遊戲**：`archetype/layered/layeredFigure.ts` 複製到 `src/game/`，掛法參考 Hard Time 的 `CastFigureMesh.svelte`。
   兩隻、多層、加上 FG 打光版時，**每層先裁到有墨的範圍再出貨**，UV 用 `(x - cropX) / cropW` 對進裁切圖
   （Capo 2026-09-28：33 張全畫布 1024×2048 約 260MB GPU，裁完約 21MB）；參考 Capo 的
   `design/build_cast_layers_runtime.py` 與 `src/game/layeredFigure.ts`。
   ⚠ **朝向一定要在遊戲畫面裡確認**：角色站在盤面哪一側，臉、道具、身體就要朝盤面；不要看原圖或臉部裁切就判斷要不要 `flip`（Capo 2026-09-28 兩隻都朝右、站右側，看原圖判斷錯了，被使用者退回）。角色出現的每個地方（盤面旁、FG 開場卡、載入畫面）都要看。
   ⚠ 分層骨架是解剖學左右：`arm_l` 在畫面右，**負角度才是往外張**，跟舊的單張網格 rig 相反，動作表的手臂正負號不能直接搬。
6. **閘門**：`node archetype/layered/check_layered_cast.mjs --manifest .. --motion <app>/src/game/castMotion.ts --tiers <file>#TIERS`，
   然後到瀏覽器實際看三種反應的峰值。

⚠ **手臂只能變粗，不能沿骨頭拉長。** Spine 的 scaleX 是沿骨頭、scaleY 是垂直骨頭。參考角色的 `arm_r 1.00 × 1.23`
是上臂**變粗** 23%；2026-09-24 以前 `rig/motion.py` 讀反了，所有照它做的角色手臂都「像沒骨頭」。

---

## 動作庫預覽（研究用，**不出貨**）

以下是 kit 原本的「逐格複製」工具。用途：讓使用者看「原版動作套在新圖上長怎樣」，拿來跟遊戲裡的動作表比對。
**產出的 GIF、零件圖、輪廓範本都不進遊戲、不進交付資料夾。**

### 挑角色（預覽用）

**第一步：給他看示意圖。**

```
gallery/overview.gif    ← 六隻並排、標好編號的總覽動畫（一張就能挑，可以直接傳給使用者看）
gallery/index.html      ← 用瀏覽器打開：六隻角色、每段動作一張 GIF
```

GIF 是真正的動作資料在演（網格怎麼彎、什麼時候換臉換道具都照原作），
每個零件用它自己網格形狀的色塊代替美術，**沒有任何原作像素**。
要重新產生：`python spineplay/motionlib.py --gallery`（不需要任何原作素材）。

**第二步：用 AskUserQuestion 分兩題問**（一題最多 4 個選項，六隻要分組）：

1. 「要複製哪一類角色的動作？」
   - **Miami 男角** —— 白西裝老大、扛球棒男、綠背心壯漢
   - **Miami 女角** —— 扛球棒女、比基尼女
   - **浣熊大盜**（Le Bandit）—— 會換臉、冒對話框、丟帽子
2. 選了 Miami 的話，再問是哪一隻；然後問要哪段動作
   （`-c N --anims` 列出全部；Miami 通常是 `full_screen/idle`、`full_screen/reaction`）。

`python spineplay/motionlib.py --list` 印出帶編號的清單，之後 `-c 1`～`-c 6` 就能用：

| # | 角色 | id | 動作 | 簡單路線 | 完美路線 |
|---|---|---|---|---|---|
| 1 | 白西裝老大 | `miami_boss` | 2 | 一張全身圖 99.70% | ＋零件圖層 99.76% |
| 2 | 扛球棒男 | `miami_main_guy` | 4 | 一張全身圖 99.69% | ＋零件圖層 99.78% |
| 3 | 扛球棒女 | `miami_main_girl` | 5 | 一張全身圖 98.98% | ＋零件圖層 99.84% |
| 4 | 比基尼女 | `miami_bikinigirl` | 4 | 一張全身圖 99.66% | ＋零件圖層 99.81% |
| 5 | 綠背心壯漢 | `miami_green_guy` | 4 | 一張全身圖 99.63% | ＋零件圖層 99.91% |
| 6 | 浣熊大盜 | `le_bandit_raccoon` | 21 | 每個零件一張圖 99.98% | （一張全身圖只有 77%）|

百分比＝拿原作自己當輸入、跟原作動畫逐格比，所有動作裡**最差的一格**。

### Miami 1–5：一張全身圖（要完美就補零件圖層）

```bash
python spineplay/motionlib.py -c 1 --mask ref.png                # bind pose 剪影
python spineplay/motionlib.py -c 1 --prompt                      # 提詞
# 生一張全身圖 —— 最穩：把 ref.png 當 ControlNet 或 img2img 起始遮罩
python spineplay/motionlib.py -c 1 --checkpose 全身圖.png          # 每個零件的位置上有沒有東西
python spineplay/motionlib.py -c 1 -a full_screen/idle --image 全身圖.png --gif out.gif
```

**規則跟切層相反**：四肢**不用**跟身體分開，長大衣、圍巾、披風都可以，
只要剪影跟 `ref.png` 一樣。

要完美：一張圖裡被擋住的地方是空的，動作一大就露出來、前面的零件還會帶著背景晃。

```bash
python spineplay/motionlib.py -c 3 --split 全身圖.png --out 補圖/   # 列出要補哪些零件＋遮罩＋指示
# 照 補圖/README.md 用生圖模型補出零件圖層（跟全身圖同尺寸、零件在原位、檔名＝零件名.png）
python spineplay/motionlib.py -c 3 -a full_screen/idle --image 全身圖.png --parts 補好的/ --gif out.gif
```

有給的零件用自己的圖層、沒給的沿用全身圖，可以只補一部分先看效果。

### 浣熊 6：每個零件一張圖

牠的 21 段動作要用 38 張零件圖（各種臉、嘴型、對話框、道具），一張圖給不出來。
每個零件一張獨立的圖（檔名＝零件名）：

```bash
python spineplay/motionlib.py -c 6 --guide --out 零件指引/     # 38 張輪廓範本＋每個零件的提詞
# 照 零件指引/README.md 一張一張生（附角色設定圖＋ <零件>__shape.png）
python spineplay/motionlib.py -c 6 --layers 零件/ --checkart    # 逐張檢查
python spineplay/motionlib.py -c 6 -a idle --layers 零件/ --gif out.gif
```

**照範本的輪廓畫就一定過 `--checkart`**（門檻建包時拿範本一起校準過）。
大小、角度都不用管（接上去會自動轉正、縮放）；不要左右翻；
對話框的字寫自己的（範本是比例正確的框），只檢長寬比、要橫著寫。不需要 `joints.json`。
照範本畫＝剪影跟原作一樣，實驗可以；要變成自己的作品就換外形、改用 `joints.json` 對位。

### 「完美」的意思要跟使用者講清楚

* **動作資料是 100% 原作的**：骨骼跟官方 spine-ts runtime 差 1e-7，
  網格頂點（含 deform）跟原生播放器差 5e-5。換一台機器先跑
  `for c in 1 2 3 4 5 6; do python spineplay/motionlib.py -c $c --verify; done`。
* **畫面重現度** 99.76–99.98%（零件補齊時），剩下的是兩次光柵化的邊緣抗鋸齒
  （次像素）—— 跟這個播放器對官方 runtime 的差距同一個等級。
* 使用者畫的是**他自己的角色**，成品不會長得像原作。「完美」是
  **動作完全是原作的，而且他的圖不會破、不會殘影、不會露洞**。

#### ⚠️ 使用者回報「照著做還是對不上」時先查

1. **路線對不對**：Miami 給一張全身圖，浣熊給零件圖。
2. **圖對不對**：Miami 用 `--checkpose`（哪個零件落空、在哪）；浣熊用 `--checkart`
   （哪張形狀、比例、方向不對，會直接說怎麼改）。
3. **有沒有先 `--verify`**：這台機器算出來跟原機一樣，才輪得到查圖。

這一版之前的動作庫有六個錯（剛性片、自己跟自己比的驗證、切層規則套到 Miami、
浣熊沒保留網格變形、浣熊的提詞跟路線矛盾又沒有範本、叫人畫動畫裡不會出現的零件），
細節見 `references/motion-library.md` 的「舊版為什麼複製不了」。

---

### ⭐ 全目錄角色（2026-10-06 擴充：235 隻、114 款遊戲）

上面八隻有手寫名字與完整說明（1–6 同前，**7 = `le_bandit_hw_smokey` 新版浣熊、8 = `le_prechaun_smokey` 妖精浣熊**），
另外兩百多隻是從 Hacksaw 整個遊戲目錄抓的，每隻都有 `--verify` 黃金值：

```bash
python spineplay/motionlib.py --list                 # 全部，依遊戲分組（編號會隨新增變，程式與文件裡一律用 id）
python spineplay/motionlib.py --list --find chaos    # 只列名字或遊戲含 chaos 的
python spineplay/motionlib.py -c chaos_crew_2__cranky --anims
python spineplay/motionlib.py -c chaos_crew_2__cranky --verify
```

- id ＝ `<遊戲>__<骨架名>`（換裝骨架再加 `__<skin>`，例如 `dr_zappo__zappo_and_monkey__zappo_with_monkey`）。
- 路線照 `--list` 標的（「一張全身圖」或「每個零件一張圖」），用法跟上面八隻一樣（`--prompt`／`--mask`／`--split`／`--guide`／`--checkart`）。
- `--list` 的百分比是建包時實測的最佳路線重現度；**低於 98% 的角色**（多半是道具多、半透明特效多）照規格畫也會有可見的差。
- 每隻的 GIF 在 `gallery/<id>/`，`gallery/index.html` 全部列出；`gallery/overview_library.gif` 是八隻手寫名字的總覽
  （`gallery/overview.gif` 仍是換皮選角色用的六隻版，編號跟 `archetype/` 一致）。
- ⚠ **編號衝突**：動作庫的 #7 是新版浣熊；換皮選角色流程裡的「#7 香蕉猴」是 `gobananas_monkey/`（我們自己的骨架，不在動作庫裡）。
  跟使用者講的時候說名字，不要只說編號。
- 一樣是**研究用、不出貨**：要出貨就走上面的 `archetype/` 流程，量成遊戲自己的動作表。
  目前 `archetype/archetypes.json` 只收 Miami 五隻（浣熊列著但標為不適用）；要把新角色當原型，先在那裡加一筆（關節對應、側別、`_l` 在畫面哪邊），
  再跑 `archetype/motion_table.py`，並在瀏覽器確認。
- ⚠ 研究包裡的 `rig/motion.py` 仍是**軸向讀反的舊版**（arm_r 1.23 沿骨），這次只更新了 `spineplay/`、`scripts/`、`gallery/`、`references/`，
  `rig/` 保留 2026-09-24 修正後的版本。以後再更新研究包也一樣：**不要覆蓋 `rig/`**。

**整體風格**（載入頁、開場說明格、FG 說明面板、轉場、節奏、音效、字型、取色）：研究包的 `materials/style-library/`
（本機在 `/Users/stone/stake-engine/research/hacksaw-motion-kit/`），已整理進 `game-reskin` skill 的
`references/hacksaw-style-transcripts.md`，用 `scripts/hacksaw_styles.py game|norms|find|shots` 查。

---

## 通用綁定（`rig/`）：沒指定角色、只要一張圖會動

這條路**不是**複製任何一隻角色，是一組從 Hacksaw 量出來、手調過的通用動態
（呼吸、搖晃、1 秒反應、squash & stretch），綁在一張 PNG 上，有機械式的零誤差保證：

```
rig/reproduce.py   跑完整條流程並斷言每一個量測值 → "everything reproduced"
rig/parity.py      比對 Python 模型與 JS runtime 4088 個值 → 最差 2.22e-16
rig/check.py       閘住成品：翻面 / 收縮 / 拉伸 / 腳位移 / 週期 / 相關性
```

**三個都綠才算數。**細節見後面的「路線 A」。

`spineplay/` 另外還有一個自己寫的 Spine 3.8/4.x 播放器（動作庫就是用它），
可以真的算出並畫出骨架動畫，細節見後面的「路線 B」。

---

## 環境

```bash
pip install numpy pillow scipy
```

`node` 只有跑 `parity.py` 時需要。

---

## 路線 A：完整流程

### 0. 先證明這台機器是乾淨的

```bash
python rig/reproduce.py    # 必須看到 everything reproduced
python rig/parity.py       # 必須看到 PARITY OK（要 node）
```

**沒過就停下來**，先解決環境，不要繼續。

### 1. 生圖

提詞在 `references/art-prompts.md` 的「路線 A」那節，直接貼。
重點只有四個，缺一不可：

- **手臂要離開身體，整條都有空隙**（最常失敗的一條）
- **要有東西自由垂掛**（圍巾／辮子／開襟外套）—— 背後沒東西的部位沒有幅度上限
- **反鋸齒邊、多色階**（< 200 色會階梯化）
- **四邊留白 ≥ 4%**（reaction 會拉到 1.11×）

### 2. 驗收這張圖

```bash
python rig/inspect_art.py character.png
```

要過的門檻：

| 這一行 | 要求 |
|---|---|
| `limbs  N of 60 sampled heights show 3+ separate runs` | **N ≥ 6** |
| `clear band spans N% of figure height` | 越接近 62% 越好 |
| `protrusions ... HELD OBJECT or free appendage` | 至少一個 |
| `style ... N distinct colours` | **≥ 200** |
| `style ... soft alpha N%` | **≥ 1%** |
| `headroom left/right/top/bottom` | 各 **≥ 4%** |
| `joint detail ... N% of width` | 都 **< 50%** |

**手臂那條沒過就重生圖，不要硬做。** 手臂貼著身體時切出來，
等於要重畫被遮住的身體 —— 那已經是路線 B 的工序。

圖沒有 alpha 的話先跑 `python rig/dekey.py character.jpg`。

### 3. 綁定 + 閘

```bash
python rig/build.py character.png          # 產生 character.rig.json、跑閘
python rig/preview.py character.png        # 看 idle 的 GIF
python rig/preview.py character.png --react 900   # 看反應
```

有道具（拿在手上的東西）的話：

```bash
python rig/props.py character.png bat.png --pivot 378,552 \
    --length 300 --angle 0 --parent fore_r --z behind
```

`--pivot` 是**手握住的那一點**，不是物件的端點。
`--angle 0` 是垂下，`180` 是立起來。

### 4. 上線

`rig/runtime/skinned.js` 是 Pixi v8 的元件：

```js
import { SkinnedFigure } from './runtime/skinned.js';
const fig = await SkinnedFigure.load('char.rig.json', 'char.png',
                                     { props: { bat: 'char_prop_bat.png' } });
stage.addChild(fig.view);
app.ticker.add(() => fig.update(app.ticker.lastTime));
fig.react();          // 觸發時呼叫
```

**這條路徑沒有在瀏覽器實跑過。** `parity.py` 只證明 JS 算出的數字跟
Python 一樣，沒證明它畫得出來。要上線先做一次最小驗證。

### 5. 改了動態常數之後

```bash
python rig/export_motion.py   # 從 motion.py 重新產生 JS 常數
python rig/parity.py          # 確認兩邊還是一樣
python rig/check.py character.rig.json
```

**`motion.py` 是唯一的真相來源**，JS 那份是產生出來的。
手動改 `runtime/motion.generated.js` 會讓閘測的東西跟上線的東西分家。

---

## 這些數字是量出來的，不是調的

| 決定 | 量測 |
|---|---|
| 不切開角色，用一張連續網格 | 參考角色 **86% 頂點綁到 2 根以上的骨** |
| idle 每根骨各有自己的週期 | 共用週期時互相關性 r = 0.94–0.99，看起來就是整塊在搖 |
| 波形不是 sine，升 38% 降 62% | 量自 `mask3`：0 → +6.75 花 0.77s，回到 −6.63 花 0.93s |
| 8 秒迴圈裡藏一次反拍 | `hand_r` 每輪 +9.04，但 t=4.3 時 −9.77 並停 1.2 秒 |
| reaction 是 snap → hold → release | 17% 衝到位、hold 到 57%、放掉 |
| 幅度不靠關節靠別的 | 關節單獨上限只有 5–19°；大小來自根位移與道具 |
| squash & stretch 換掉部分旋轉 | 旋轉砍到 60% 才換得到縮放的空間；上臂**垂直骨頭**鼓起（2026-09-24 更正：舊版寫「沿骨軸 +5.8%」是軸向讀反，參考上臂長度不變） |

細節與推導在 `rig/README.md`，來源報告在 `rig/reference/`。

---

## 路線 B：播放、重定向、規格

**播放器能做什麼：**

| 項目 | B 會怎樣 |
|---|---|
| 骨骼位置 / 旋轉 / 縮放 | ✅ 用原始關鍵幀算，逐幀相同 |
| 繪製順序、attachment 抽換、slot 顏色 | ✅ 原始資料 |
| **mesh deform** | ✅ 保留（動作庫全部走網格投影；只有舊的 `retarget.py` 剛性片不保留）|
| **IK / transform / path 三種約束** | ✅ 全部實作，3.8 與 4.0 兩套語意都照官方分開寫 |
| clipping attachment | ✅ 凸多邊形（凹的會警告）|
| skin 切換 / two-color tint | ❌ 只用第一個 skin；dark 色不處理，碰到會警告 |

**播放器本身跟官方 spine-ts 逐項比對過**（`spineplay/sweep.py`、`bonediff.py`、
`compare_official.py`，官方 runtime 是 EsotericSoftware 的 build，
Playwright 開 headless 瀏覽器算；3.8 的骨架用 3.8 runtime、4.0 的用 4.0，
工具會看骨架版本自動選）：

| 骨架 | 約束 | 規模 | 矩陣最大差 | 座標最大差 | 畫面 |
|---|---|---|---|---|---|
| Le Bandit raccoon（3.8）| path 1 | 21 動畫 × 4 點 × 36 骨 | 1.1e-6 | 1.5e-4 | IoU 0.996 / RGB 0.42 |
| Miami character_main_guy | ik 4、tr 9、path 1 | 4 × 5 × 49 | 4.0e-7 | 4.5e-5 | IoU 0.999 / RGB 0.76 |
| Miami expand | ik 9、tr 24、path 2 | 22 × 3 × 259 | 3.0e-6 | 2.1e-4 | — |
| Miami 另外 5 隻角色 | ik 0–7、tr 0–5 | — | < 3.9e-7 | < 5.9e-5 | IoU 0.999 / RGB ≤ 0.60 |
| Miami symbols / high_4 / high_5 / wanted_vfx | tr 1–9、ik 0–4 | 85 動畫 × 3 點 | < 1.3e-6 | < 2.1e-4 | — |
| The Luxe countup_tiers | tr 3 | 9 × 3 × 37 | 3.4e-7 | 1.8e-4 | — |

**11 支骨架、190 段動畫全部通過**，一個例外都沒有。

殘差已經到官方 runtime 自己的精度下限 —— spine-ts 的 timeline 用
`Float32Array` 存關鍵幀，float32 的 eps 就是 1.2e-7，座標量到的相對誤差
1.7e-7 就是這個。畫面殘差幾乎全落在輪廓邊緣 2px 內
（raccoon 是 100%，內部平均差 0.046/765），來源是抗鋸齒與貼圖濾波，不是幾何。

retarget 的自我檢查：拿原圖切片接回自己，覆蓋 **IoU = 0.968**，
差的 3% 是 mesh deform。對 Le Bandit 影響很小 ——
它本來就有 **79% 的頂點只綁一根骨**。

---



### B-1 先看原作到底在演什麼

`spineplay/` 吃 Spine 的 `.json` + `.atlas` + `.png`。
貼圖是 `.ktx2` 的話先轉：`node scripts/ktx2png.mjs <資料夾>`（主專案裡）。

```bash
python spineplay/play.py raccoon.json --list                 # 列出所有動畫與長度
python spineplay/play.py raccoon.json idle --gif             # 算成 GIF
python spineplay/play.py raccoon.json lost_mustache --sheet 8 # 接觸表
```

### B-2 看要準備哪些圖層

```bash
python spineplay/retarget.py raccoon.json my_layers/ --list
```

會列出每個 attachment、原圖尺寸，以及 `my_layers/` 裡你已經有哪些。
檔名就是 attachment 名，例如 `Body.png`、`Head_grr.png`、`hat.png`。

### B-3 用自己的圖播原作的動作

```bash
python spineplay/retarget.py raccoon.json my_layers/ idle --gif
python spineplay/retarget.py raccoon.json my_layers/ loosing_2__hat_toss --sheet 8
```

每個 attachment 在 bind pose 的世界四邊形會被換算到**主導骨**的區域座標，
之後跟著那根骨走 —— **骨骼動作 100% 照原樣，每層當剛性一片**。

### B-4 確認換算沒有偏差

```bash
python spineplay/retarget.py raccoon.json --selftest idle
```

拿原 atlas 自己切出來的圖當「使用者圖層」再接回去，跟原生 render 比對覆蓋率。
**應該看到 IoU ≈ 0.97**；差的部分是 mesh deform，不是換算錯誤。

### B-5 跟官方 runtime 對答案（要 playwright ＋ 連線）

```bash
pip install playwright && python -m playwright install chromium
python spineplay/bonediff.py raccoon.json idle          # 比骨骼矩陣（精準）
python spineplay/compare_official.py raccoon.json idle  # 比畫面（含並排圖）
```

`bonediff.py` 是主要依據 —— 像素會被取樣與抗鋸齒糊掉，骨骼矩陣是純數字。
**全部的骨、全部的動畫都應該落在相對 2e-7 以內**（座標的絕對值會隨骨架
大小放大到 1e-4 量級）。任何一根跳到 0.01 以上就是真的算錯了，不是精度問題。

整支骨架一次掃完用 `sweep.py`：

```bash
python spineplay/sweep.py <skeleton.json> --times 5
```

**沒有官方 runtime、也沒有任何骨架素材的機器**，跑這支就好：

```bash
python spineplay/constraint_selftest.py
```

它用自己編的合成骨架（`spineplay/example/`，四個色塊當貼圖）把 IK、
transform、path 三種約束與兩種繼承模式都走一遍，比對 171 個寫死的黃金值
（那些值是拿官方 spine-webgl 4.0.28 算出來的）。**應該印出
`constraint selftest OK`。**

### B-6 美術規格

要做 Le Bandit 那種「會生氣、會丟帽子、鬍子會掉」的角色：

| 要什麼 | 去哪裡 |
|---|---|
| 生圖提詞（每層單獨生）| `references/art-prompts.md` 路線 B |
| 分層清單、比例、遮擋、畫風約束 | `references/le-bandit-art-spec.md` |
| 21 段動畫、idle 完整關鍵幀、選擇邏輯 | `references/le-bandit-motion.md` |
| 一具骨架撐三款的做法 | `references/le-series-comparison.md` |

Miami 五隻的研究（動作庫之外的背景知識）：

| 要什麼 | 去哪裡 |
|---|---|
| reaction 怎麼觸發（任務符號，不是連線）、snap→hold→release、幅度從哪來、連線時的符號演出 | `references/miami-character-reactions.md` |
| 待機晃動的原理：幅度分配、跟隨鏈、疊層週期、藏在長循環裡的抖動 | `references/miami-idle-technique.md`（互動版 `miami-idle-sway-lab.html`）|

**關鍵事實**：Le Bandit 只有 **21%** 頂點多重綁定（Miami 是 86%）——
它是切件式角色。粗黑描邊、大重疊量、圓關節這三條是它敢轉 ±40° 不破的原因，
**是畫風選擇，後製補不了**。

只要看數字不要看圖的話：

```bash
python scripts/dump38.py skeleton.json idle     # 3.8 / 4.x 自動判斷
```

> ⚠️ Spine **3.8 的 rotate 欄位叫 `angle`**，4.x 叫 `value`。
> 用錯的讀法不會報錯，只會把所有旋轉讀成 0。`dump38.py` 會自己判斷並印出它選了哪個。

---

## 界線

`rig/PROVENANCE.md` 是完整版，摘要：

**動態資料是手藝，可以用** —— 時序、比例、幅度、結構決定。
**美術是財產，不能用** —— 別人的貼圖、atlas、骨架、切好的圖層，
一個像素都不要進出貨的產品。

判準：**只看過遊戲、沒開過檔案的人，有沒有可能得出這個結論？**
時序比例可以，別人畫的線不行。

`rig/example/` 那兩張圖不是 Hacksaw 的，它們存在的目的是讓 `reproduce.py`
有東西可以斷言 —— **不要刪，刪了就失去零誤差的驗證能力**。

---

## 已知的洞

- **runtime 沒有在瀏覽器跑過。**
- **idle 還是純旋轉**，squash & stretch 只用在 reaction。呼吸應該是胸腔縮放而非旋轉，
  那大概是下一個真正的收穫。
- **idle 不在迴圈邊界閉合**（最差 1.55°）。live 不會 wrap 所以無所謂，
  但 GIF 會頓一下，`preview.py` 會警告。要匯出 Spine 的話得把週期放到公倍數上。
- **一張全身圖沒有「被擋住的部分」**：前面的零件一動，後面那塊露出來的是
  前面零件的像素（殘影）。實測上限 98.98–99.70% 已含這個；要消掉就用
  `--split` 補零件圖層（99.76–99.91%）。
- **Miami 的零件不能用「獨立零件圖」**：Miami 的網格在綁定之後被動過，
  零件圖框跟網格之間不是單純的仿射（殘差可達 27 像素），所以 Miami 的
  零件要用**同畫布圖層**（`--parts`），不要用 `--layers`。浣熊沒有這個問題。
- **`spineplay/` 不做 skin 切換**：只用第一個 skin，`"skin": true` 的骨與約束
  當成停用（這跟官方沒呼叫 `setSkin` 時的行為一致）。要真的換裝得自己改。
- **two-color tint（dark 色）、multiply / screen 混合沒實作**，碰到會警告。
- **clipping 只做凸多邊形**：官方會先把凹多邊形拆成數個凸的再逐一裁。
  手上這幾支用的都是四邊形，碰到凹的會警告。
- **畫面殘差 RGB 0.4～0.8/255 是邊緣抗鋸齒**：本播放器硬邊填充，官方有平滑。
- **官方 spine-ts 4.0.28 的 transform 時間軸讀取有 bug**（漏了
  `mixShearY = mixShearY2`，整條時間軸的 mixShearY 停在第一幀）。
  預設照著它做 —— 目標是跟實際在跑遊戲的 runtime 一致，不是跟規格一致。
  要「正確」的內插就把 `spine.py` 的 `V40_MIXSHEARY_FREEZE` 設成 False。
  對手上這批 Hacksaw 骨架沒有差別（它們的 mixShearY 都 <= 0，兩種行為都會跳過）。
- **retarget 不保留 mesh deform。**
