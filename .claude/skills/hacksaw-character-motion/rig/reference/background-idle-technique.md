# Miami Mayhem · 背景角色「一直晃」的做法拆解

Hacksaw Gaming *Miami Mayhem*，gameId **1824**、version **1.23.2**。

這份專門拆**背景角色的待機晃動**（idle sway）—— 怎麼做到看起來一直有生命、
又不會覺得在重播同一段。所有數字出自 5 個角色的 spine 骨架檔，
不是估的。

> 素材位置：`assets/files/static-live.hacksawgaming.com/1824/1.23.2/assets/default/hd/spine/`
> 骨架 `.json` ＋ 圖集 `.atlas` ＋ 貼圖（`.ktx2` 已轉成 `.png`，1024²～2048²）。

---

## 0. 三句話講完手法

1. **五個角色的循環長度全部不同**（3.33 / 5 / 6.67 / 8 / 8 秒），
   而且刻意選成**互質不易對齊** —— 全部同時回到起點要 **40 秒**。
2. **身體本體幾乎不動**（1～3 度），生命感全靠**附屬物放大跟隨**
   （頭髮 20～27 度、鬍子 14 度、煙 26 度）。
3. **同一個基礎週期疊多層不同相位**，再在長循環裡藏一次**不規則抖動**，
   讓它不像節拍器。

---

## 1. 五個角色

| 角色 | 循環長度 | 動畫骨 | 有 deform | 招牌部位 |
|---|---|---|---|---|
| `character_bikinigirl` | **3.33s** | 32 根 | 無 | 長髮（`hair_back` / `hair_strand`）|
| `character_main_girl` | **5.00s** | 44 根 | 有 | 馬尾＋瀏海＋耳環 |
| `character_boss` | **6.67s** | 46 根 | 無 | **雪茄煙霧**（`smoke_p1~17`）|
| `character_green_guy` | **8.00s** | 15 根 | 有 | 鬍子兩節跟隨 |
| `character_main_guy` | **8.00s** | 20 根 | 有 | 面具＋球棒 |

每個角色都有兩套：`full_screen/idle` 與 `mobile/idle`（內容相同，分開是為了不同版面）。
部分角色另有 `reaction`（0.70～1.07s）與 `reaction_win`（1.00s）。

### 為什麼循環長度要不一樣

```
3.333 = 10/3   5 = 5/1   6.667 = 20/3   8 = 8/1
最小公倍數 = LCM(10,5,20,8) / GCD(3,1,3,1) = 40 / 1 = 40 秒
```

**五個角色要 40 秒才會同時回到起點。** 玩家看到的永遠是不同組合，
所以背景「活著」而不是「在循環」。

> 這是最便宜也最有效的一招：**不要讓多個循環動畫用同一個長度**。
> 你自己的素材只要把每個角色的 idle 設成不同且不好整除的秒數，就有一半效果了。

---

## 2. 幅度分配：本體 1～3 度，附屬物 6～27 度

這是整套手法的核心。以 `green_guy` 為例（幅度由小到大）：

| 骨骼 | 旋轉幅度 | 位移 |
|---|---|---|
| `shoulder_r` | −0.6 ~ +1.0° | |
| `arm_top_l` | −0.8 ~ +2.0° | |
| `arm_l` | 0 ~ +2.2° | |
| `neck` | −1.2 ~ +3.1° | |
| `head` | 0 ~ **+3.3°** | x −2.8~+5.2、y −1.2~0 |
| `beard` | −6.0 ~ **+6.9°** | |
| `beard_tip` | −13.9 ~ **+5.8°** | |

**身體最大只有 3.3 度，鬍子尖端接近 14 度 —— 相差 4 倍。**

其他角色同樣模式：

| 角色 | 本體最大 | 附屬物最大 |
|---|---|---|
| `main_girl` | 手/身 ~9.7° | **頭髮 27.5°**、耳環 14.9° |
| `bikinigirl` | 手 6.7° | **頭髮 20.2°** |
| `boss` | — | **煙 25.9°** ＋ scale 0→1.89 |
| `main_guy` | 手臂 2.2~3.2° | 面具 10.5°、手 9.0° |

**要抄的判斷**：觀眾看的是「有沒有在動」，不是「動多大」。
本體動太多會變成搖頭晃腦很假；把幅度全押在頭髮、布料、飾品、煙這些
**沒有骨頭的東西**上，既安全又生動。

---

## 3. 跟隨鏈（follow-through）：每一節放大約 2 倍

`green_guy` 的鬍子是兩節：

```
character_0_beard      −6.0 ~ +6.9°     21 幀
character_0_beard_tip  −13.9 ~ +5.8°    21 幀      ← 幅度約 2 倍，相位落後
```

`main_girl` 的頭髮是多節控制骨：

```
girl_hair_ctrl4    0 ~ +9.7°
girl_hair_ctrl6   +6.0 ~ +15.8°
girl_hair_ctrl7   −12.1 ~ +19.8°
girl_hair_strand_L3  +1.7 ~ +15.2°
girl_hair_strand_L4  −2.6 ~ +27.5°     ← 最末端最大
```

**規則：越靠末端幅度越大、相位越落後。** 這就是慣性的視覺化。

---

## 4. 疊層週期：同一個基礎拍，不同相位

`green_guy` 的 8 秒循環是由 **1 秒基礎週期**疊出來的：

```js
character_0_persp   translate  幀距 [1, 1, 1, 0.767]   ← 透視/呼吸底層
character_0_spine2  translate  幀距 [1, 1, 1, 1]        ← 軀幹，同週期不同幅度
character_0_head    translate  幀距 [0.167, 1.0, 0.833, 0.167]  ← 有 hold 段
```

`bikinigirl` 的 3.33 秒循環用 **0.833 秒基礎週期**（3.33 / 4 = 0.833）。

### 「呼吸」骨

兩個角色有專門的呼吸骨：

```
bikinigirl : ch4_chest_breathing     translate 幀距 0.833s
green_guy  : character_0_persp       translate + scale
```

`persp` 骨的做法值得抄 —— 它同時做**位移**和**縱向縮放**：

```js
translate: (0,0) → (8.65, 4.11) → (0,0)        週期 2 秒
scale:     y 1.0 → 1.35 → 1.0                  同週期
```

**位移 ＋ 縱向拉伸同時做**，就是吸氣時胸腔上抬又變高的感覺。
只做位移會像整個人在飄。

---

## 5. 藏在長循環裡的不規則抖動

`green_guy` 的 `spine2` 旋轉軌道，在 8 秒循環的 3.73～4.57 秒之間有一段**快速小抖**：

```js
{time: 3.7333, value: 0}
{time: 3.9333, value: -0.54}
{time: 4.0667, value: +0.12}
{time: 4.2000, value: -0.37}
{time: 4.3333, value: +0.21}
{time: 4.5667, value: 0}
```

幅度只有 ±0.5 度、持續 0.83 秒，**整個循環只出現一次**。

這一段的作用是**破壞規律性**：基礎是 1 秒週期，如果從頭到尾都規律，
8 秒看兩輪就會被察覺；中間插一次不對稱的小抖動，感知上就變成「他剛剛動了一下」。

> **這是最值得抄的一招**，成本極低：在循環中段隨便挑一根骨，
> 加 4～5 個小幅度、不等距的關鍵幀就好。

---

## 6. 骨架命名規則（照抄可以少走彎路）

| 後綴／前綴 | 意思 | 實例 |
|---|---|---|
| `*_persp` | 透視／呼吸底層 | `character_0_persp`、`ch4_arm_r_persp` |
| `*_breathing` | 明確的呼吸骨 | `ch4_chest_breathing` |
| `*_target` | IK 目標點 | `hand_r_target`、`hand_l_target`、`cigar_target`、`arm_l_target` |
| `*_ctrl` / `*_ctrlN` | 控制骨（不直接綁圖）| `girl_hair_ctrl2~7`、`smoke_ctrl_1~6` |
| `*_tip` | 跟隨鏈末端 | `character_0_beard_tip` |
| `*_strandN` | 髮絲個別 | `ch4_hair_strand8~10`、`girl_hair_strand_L3/L4` |
| `*_pN` | 粒子個體 | `smoke_p1~p17` |
| `character_N_*` | 角色編號前綴 | `character_0_head` |

**`ctrl` 與 `target` 是分離的控制層** —— 動畫只 K 這些骨，
真正綁圖的骨去跟隨它們。改動畫時不會動到綁定。

---

## 7. 曲線格式（Spine JSON）

每個關鍵幀的 `curve` 是**三次貝茲的兩個控制點**：

```js
// 單值（rotate）：[cx1, cy1, cx2, cy2]
{"time": 0.1667, "curve": [0.5, 0, 0.858, 3.29]}

// 雙值（translate x,y）：[x_cx1, x_cy1, x_cx2, x_cy2, y_cx1, y_cy1, y_cx2, y_cy2]
{"curve": [0.333, 0, 0.667, 10.33, 0.333, 0, 0.667, -2.4]}
```

控制點是**絕對座標**（時間, 值），不是相對比例。
`green_guy` 的 head 用 `[0.5, 0, 0.858, 3.29]` —— 前半段幾乎不動、後段才衝到位，
是「慢起快到」的緩動。

沒有 `curve` 欄位 = 線性；`"curve": "stepped"` = 階梯。

---

## 8. 照著做的最小步驟

要把這套用到你自己的素材：

1. **切素材**：身體、頭、頭髮分節（至少 2 節）、飾品各自獨立。
2. **建骨**：本體骨 ＋ 一根 `persp`／`breathing` 底層骨 ＋ 附屬物跟隨鏈。
3. **定循環長度**：每個角色給**不同且不好整除**的秒數（3.33 / 5 / 6.67 / 8）。
4. **K 底層**：`persp` 骨做位移 ＋ 縱向 scale，週期取循環長度的 1/4。
5. **K 本體**：頭 3°、頸 3°、肩 1°、手臂 2° —— **不要超過 5 度**。
6. **K 跟隨鏈**：每往末端一節，幅度 ×2、相位往後推 0.1～0.2 秒。
7. **加抖動**：循環中段挑一根骨，插 4～5 個 ±0.5 度的不等距關鍵幀。
8. **緩動**：主要動作用「慢起快到」的貝茲，不要用線性。

---

## 9. 這份沒涵蓋的

- **`deform` 網格變形**：`green_guy` / `main_girl` / `main_guy` 的 idle 有 `deform` 區塊
  （網格頂點動畫），這份只拆了骨骼軌道，沒拆網格。
- **`boss` 的煙霧系統**：17 個 `smoke_p*` 粒子骨 ＋ 6 個 `smoke_ctrl_*`，
  是獨立的一套，值得另外拆。
- **`reaction` 動畫**：只記了時長，沒拆內容。
- ~~背景本身的動畫~~ ✅ 見 §11。結論：**背景圖是靜態的**，會動的全是疊在上面的 spine。
- **這些角色在遊戲裡何時播 reaction**：要挖 `main.js`，這份沒做。

---

**著作權**：抄下來的美術與骨架是原廠著作權。
這份是**方法拆解**供學習用，素材本身不要進產品、不要散佈。

---

## 10. 「能不能完美複製」——分兩件事看

### 10.1 原封不動播放：**可以**

匯出的 `.json` 是**完整的 runtime 匯出**，播放需要的東西全在：

| 角色 | Spine | IK | transform | path | deform | slots |
|---|---|---|---|---|---|---|
| `bikinigirl` | 4.0.64 | 1 | 2 | — | — | ✅ |
| `boss` | 4.0.64 | **7** | 5 | — | — | ✅ |
| `green_guy` | 4.0.64 | 2 | — | — | ✅ | ✅ |
| `main_girl` | 4.0.64 | — | 4 | — | ✅ | ✅ |
| `main_guy` | 4.0.64 | 4 | **9** | **1** | ✅ | ✅ |

`hand_l_target` / `hand_r_target` / `cigar_target` 這些不只是骨骼名稱 ——
**IK 約束的定義本身也在 JSON 裡**，所以手臂會照原本的方式跟著目標點走，
不會因為缺約束而走樣。

貼圖也對得上：atlas 檔頭**沒有 `pma` 旗標**（= straight alpha），
而 `ktx2png.mjs` 轉檔時已經把 4 個預乘的還原成 straight，
所以 30 張 PNG 全是 straight alpha，跟 atlas 一致。**不會發灰。**

**條件**：要 **Spine 4.0 以上的 runtime**（3.8 讀不了 4.0 格式）。
runtime 本身是開源免費的，各語言都有。

### 10.2 拿去編輯／改成自己的：**有門檻**

| 限制 | 說明 |
|---|---|
| **不是專案檔** | 這是 runtime 匯出的 `.json`，不是 `.spine` 專案檔。Spine 編輯器可以匯入 JSON，但拿不到原始圖層結構、專案設定、沒匯出的動畫 |
| **需要 Spine 授權** | 這些檔案**用了 mesh（deform）**。Spine 的 Essential 版不支援 mesh —— 要編輯 `green_guy` / `main_girl` / `main_guy` 得用 Professional 版。實際版本差異請自行向 Esoteric Software 確認 |
| **著作權** | 素材本身是原廠的。**要學的是手法，不是拿他們的角色去用** |

### 10.3 所以實際上該怎麼做

**建議路徑：把 §8 的八個步驟套到自己的素材上，而不是改他們的檔。**

原始檔的用途是**當參照**——用 Spine runtime 播出來，
一邊看一邊對照 §2～§5 的數字，理解「3 度看起來是多少」、
「跟隨鏈延遲 0.14 秒是什麼感覺」。
`reports/idle-sway-lab.html` 就是為了不用開 Spine 也能感受這些差別而做的。

真正可以直接複製的是**參數**：循環長度、幅度分配、放大倍率、
相位延遲、抖動視窗 —— 這些數字放到任何骨架上都成立，跟素材無關。

---

## 11. 背景本身會不會動？——**不會**

背景圖是**靜態貼圖**，不是 spine。`backgrounds.atlas` 只有兩個切片：

```
backgrounds.png   2048×2048
  base        1920×1024
  base_night  1920×1024
```

其他模式各有自己的整張背景：`bonus_backgrounds`（`fs_1` / `fs_2`）、`epic_background`（`bg`）。

### 背景的「變化」只有三種，都不是動畫

| 動作 | 做法 |
|---|---|
| `activateMission()` / `deactivateMission()` | `base` ↔ `base_night` **alpha 交叉淡入淡出**（兩張圖疊著，一張淡出一張淡入）|
| `updateBackground(mode)` | 換模式時**整張換圖** |
| `fadeBackground()` | FG 時把背景**整體壓暗**：landscape 亮度 **1.0**（不壓）、portrait **0.5**（壓一半）|

`_missionBg` 一開始就 `set_z(-0.01)` 疊在 `_regularBg` 後面、alpha 設 0，
要用的時候才淡進來 —— 所以切換沒有載入延遲。

### 會動的是疊在背景上的三層

```
BackgroundHandler
 ├ _backgroundScenery   靜態背景圖（regular + mission 兩張疊著）
 ├ _wantedScenery       通緝令 spine（wanted_vfx），z = 0.2，follow 背景
 └ _characters[]        角色 spine ×N   ← 就是會晃的那些人
```

### 各模式派不同角色上場

| 模式 | 角色 |
|---|---|
| `base`（主遊戲）| `character_main_guy` |
| `fs` | `character_green_guy` |
| `fs_2` | `character_main_girl` |
| `fs_epic` | `character_boss` ＋ `character_bikinigirl` |

換模式時 `enterMode()` 會把舊角色 `dispose()` 掉再建新的 —— 不是隱藏，是真的換。

### 直式與橫式：角色跟隨的對象不一樣

```js
landscape: pos (1.3, -0.7, 0.01)   scale 1.0   follow → _backgroundScenery
portrait : pos (0.65, 0.9, 0.01)   scale 0.6   follow → reelObj
```

**橫式時角色跟著背景走，直式時角色跟著轉輪走。**
這樣直式縮排版時角色會固定在盤面旁邊，不會被擠出畫面。
直式另外還會在 splash 期間把角色隱藏（`_inSplash`）。

動畫名稱由設定裡的 `anim:"LANDSCAPE_IDLE"` / `"PORTRAIT_IDLE"` 決定，
對到 spine 檔裡的 `full_screen/idle` / `mobile/idle`
（名稱表 `full_screen_idle="full_screen/idle"` 在 bundle 裡；
LANDSCAPE→full_screen、PORTRAIT→mobile 這層對應是推論，沒有直接看到查表程式碼）。

### 要抄的判斷

**別把力氣花在讓背景圖本身動。** 一張 1920×1024 的靜態圖 ＋
幾個獨立的角色 spine 疊上去，就足夠讓整個畫面看起來是活的。

背景圖動起來（捲動、視差、粒子）成本高、又容易搶走盤面的注意力。
Miami 的做法是**背景完全不動，動的只有角色**，
再用「壓暗 0.5」這種最便宜的手段做 FG 的氣氛切換。

---

## 12. 整體版面：角色與盤面的關係

### 12.1 盤面幾何

| 項目 | 值 |
|---|---|
| 盤面 | **5 輪 × 4 列 = 20 格**、14 條線 |
| 單格 `symSize` | **0.43 × 0.43**（正方）|
| 盤面總尺寸 | **2.15 × 1.72** 世界單位 |
| 盤面半徑 | x **±1.075**、y **±0.86** |
| stencil 位移 | (0.5, 0.02) |
| `revealDelay` | 0.2 |
| `cloneMarginRows` | true |
| `sortDirection` | `TopLeftToBottomRight` |

**相機留邊 `fitReelMargins`：四邊各 5%，桌機／手機／直式／橫式全部一樣。**
也就是盤面永遠佔可視區的 90%。

### 12.2 圖層堆疊（z 由後到前）

```
z = -0.01   _missionBg        base_night，平常 alpha 0 疊在後面
z =  0      _regularBg        base，靜態背景圖 1920×1024
z =  0.01   _characters[]     角色 spine ← 會晃的人
z =  0.2    _wantedScenery    通緝令 spine，follow 背景
            （盤面與 UI 在更前面）
```

### 12.3 角色的兩套定位

```js
landscape: pos (1.30, -0.70, 0.01)   scale 1.0   parent = _backgroundScenery
portrait : pos (0.65,  0.90, 0.01)   scale 0.6   parent = reelObj
```

**兩種方向掛在不同的父物件上** —— 這是整個版面設計的關鍵。

#### 直式：角色釘在盤面上

`parent = reelObj`，所以 `pos` 直接就是**盤面座標系**，可以跟盤面半徑直接比較：

```
盤面上緣 y = +0.86        角色 y = +0.90   ← 剛好在盤面正上方外側
盤面右緣 x = +1.075       角色 x = +0.65   ← 在盤面寬度之內，偏右
角色縮放 0.6
```

**角色貼在盤面正上方、稍微偏右，縮到 60%。**
盤面怎麼縮放移動，角色就跟著跑 —— 窄螢幕不會被擠出畫面。
另外直式在 splash 期間會把角色隱藏（`_inSplash`）。

#### 橫式：角色釘在背景上

`parent = _backgroundScenery`，`pos` 是**背景圖的局部座標**，
縮放維持 1.0（不縮小）。角色跟背景一起移動，**與盤面無關**。

> ⚠️ 背景圖在世界座標中的尺寸與錨點我沒查出來，
> 所以無法把橫式的 (1.30, −0.70) 換算成「距離盤面幾個單位」。
> 只能確定它跟盤面是**兩套獨立座標系**。

### 12.4 為什麼要這樣分

| | 橫式 | 直式 |
|---|---|---|
| 畫面比例 | 寬 —— 盤面兩側有空間 | 窄 —— 盤面幾乎占滿寬度 |
| 角色掛在 | 背景 | **盤面** |
| 縮放 | 1.0 | **0.6** |
| 效果 | 角色站在場景裡，是佈景的一部分 | 角色縮小貼在盤面上方，當裝飾 |

**橫式時角色是「場景裡的人」，直式時角色是「盤面的配件」。**
同一份 spine、同一組動畫，靠換父物件與縮放就切換了兩種角色定位。
動畫本身也分 `full_screen/idle` 與 `mobile/idle` 兩套。

### 12.5 順帶：Miami 的轉輪時序

抓 bundle 時一併看到的（跟 The Luxe / Densho 對照用）：

```js
normal: { reelDelay: .05, startDuration: .4, reelStopDelay: .3, stopDuration: .2,
          speed: 30, stopSpeed: 30,
          attentionSpeed: 15, attentionStopDuration: 1, attentionStopSpeed: 1,
          settleType: { halflife: .03, type: "elastic", dampingRatio: .93 },
          startCurve: "bezier(rate, [0, -.05, -.05, -.05, -.05, 1.0])",
          presentAfterSettle: false }
superTurbo: { reelDelay: 0, startDuration: .1,
              settleType: { halflife: .03, type: "elastic", dampingRatio: 1 } }
```

**Miami 有 anticipation**（`attentionSpeed` 15 = 正常 speed 30 的一半，
`attentionStopDuration` 1.0s vs 平常 0.2s）—— 跟 The Luxe 同路數，
跟完全沒有 anticipation 的 Densho 相反。

`reelDelay` 只有 **0.05**（幾乎同時起轉），`speed` 30 是三款裡最快的。

### 12.6 遊戲規格（probe 實測）

```
輪帶組    default / mod_wild / mod_mission / fs / fs_2 / fs_epic
符號      0=WILD 1~5=LOW 6~10=HIGH 12=FS 13=EXPAND 14=WANTED
scatter   id 12    collector  id 11
盤面 index  row-major（5/5 驗證通過）
注碼      10 起跳
可買      mod_bonus 3x / mod_wild 50x / mod_mission 50x / fs 100x / fs_2 300x
RTP       96.26 ~ 96.31%
```

`fs_epic` 不在購買清單裡 —— 跟 The Luxe 的 VELVET NIGHTS 一樣是自然觸發限定。

### 12.7 沒量到的

- **背景圖的世界尺寸與錨點** —— 所以橫式角色跟盤面的距離換算不出來。
- **實際遊戲畫面截圖** —— probe 的截圖被開場 splash 擋住，
  沒有拍到盤面與角色同框的畫面。要的話得手動點過 splash 再截。
- **`wantedScenery` 的位置** —— 只知道 z=0.2、follow 背景。

---

## 13. 開場三格介紹（SplashState）

進遊戲前那張「CLICK TO CONTINUE」的畫面。由 `SplashState` 建立，
資源全在 `atlas/splash.*`。

### 13.1 素材

| 切片 | 尺寸 | 用途 |
|---|---|---|
| `splash_1` | **455 × 587** | 第 1 格底圖 |
| `splash_2` | **455 × 587** | 第 2 格底圖 |
| `splash_3` | **455 × 587** | 第 3 格底圖 |
| `volatility` | 299 × 69 | 波動度標示 |
| `hidden_epic_sticker` | 192 × 192 | 右上角圓形貼紙 |

貼圖頁 `splash.png` 2048×2048。三格底圖**尺寸完全一樣**，只有內容不同。

### 13.2 三格的內容設定

```js
[
  { headerString:"the_miami_mission_uc",  bodyString:"the_miami_mission_body",  background: splash_1 },
  { headerString:"code_word_mayhem_uc",   bodyString:"code_word_mayhem_body",   background: splash_2 },
  { headerString:"miami_most_wanted_uc",  bodyString:"miami_most_wanted_body",  background: splash_3 },
]
```

標題與內文都是**翻譯鍵**，不是寫死的字 —— 三格共用同一套排版，只換鍵值與底圖。

### 13.3 每一格內部的排版

三個元素堆在同一個容器裡，用 y 值分層：

| 元素 | y | z | 對齊 | 文字框 |
|---|---|---|---|---|
| 底圖（`splash_N`）| **−0.2** | **−0.01** | — | — |
| 標題 | **−0.222** | 0 | `Center` | 最大寬 **440** |
| 內文 | **−0.42** | 0 | `MultilineCenter`（自動換行）| **420 × 180** |

底圖 z = −0.01 壓在文字後面。**標題與底圖的 y 幾乎重合**（−0.2 vs −0.222），
所以標題是壓在底圖上緣的位置，內文再往下 0.2。

### 13.4 整頁的固定元素——每個都有橫式／直式兩套座標

程式碼的模式是 `Ra(圖A, 圖B, 橫式座標, 直式座標, …)`：

| 元素 | 橫式 | 直式 |
|---|---|---|
| Logo（`misc.logo`）| y **0.8** | y **0.7** |
| 波動度（`volatility`）| (y **0.5**, z 0.1) | (y **0.425**, z 0.1) |
| `CLICK TO CONTINUE` | y **−1.4** | y **−0.9** |
| Epic 貼紙 | (**0.4, 0.3**, z 0.01) | (**1.4, 0.375**, z 0.01) |

**Epic 貼紙有旋轉**：z 軸 `0.075 × −π` = **−13.5 度**，兩個方向共用，
混色模式 `Alpha`。

`CLICK TO CONTINUE` 文字：`Center`、最大寬 **500**、
字型帶 SDF 參數 `(size, 4, 0.5, 0.03125)`。

**左右邊距依方向切換**：橫式有值、**直式設 0**（`margins.left = margins.right = 0`），
所以直式時三格會撐滿寬度。

### 13.5 值得抄的做法

- **三格底圖同尺寸**（455×587），只換圖不換版 —— 新增第四格成本趨近於零。
- **文字全走翻譯鍵**，排版與內容徹底分離。
- **每個元素兩套座標**，不是寫兩份版面 —— 同一份結構，換一組數字。
- **直式把左右邊距歸零**讓內容撐滿，是窄畫面最省事的解法。

---

## 14. FG 開始前的說明格（Feature Splash）

進免費遊戲前那張說明。資源在 `atlas/fs_splash.*`。

### 14.1 三種 FG 各一組素材

| 模式 | 標題切片 | 尺寸 | 底圖切片 | 尺寸 |
|---|---|---|---|---|
| `fs` | `the_hit` | 467 × 155 | `the_hit_bg` | **819 × 783** |
| `fs_2` | `we_split` | 572 × 181 | `we_split_bg` | **819 × 783** |
| `fs_epic` | `get_lit` | 450 × 179 | `get_lit_bg` | **819 × 783** |

**三張底圖尺寸完全一樣（819×783）**，標題寬度隨字數變。
另有 `totalwin` 962 × 226（FG 結算用）。

### 14.2 設定表

```js
switch (mode) {
  case "fs":      { title: the_hit,  body: "the_hit_body",  bg: the_hit_bg,  descYPos: 0.2 }
  case "fs_2":    { title: we_split, body: "we_split_body", bg: we_split_bg, descYPos: 0.2 }
  case "fs_epic": { title: get_lit,  body: "get_lit_body",  bg: get_lit_bg,  descYPos: 0.1 }
}
```

**只有 `descYPos` 不同**：`fs` / `fs_2` 是 0.2，`fs_epic` 是 **0.1**（內文往下 0.1）。
推測是 epic 的內文較長需要更多空間。

### 14.3 版面（用 slot 名稱組裝）

跟 The Luxe 同一套 slot 列舉：`BACKGROUND` / `BONUS_GAME_NAME` /
`BONUS_GAME_DESCRIPTION` / `RETRIGGER_DESCRIPTION` / `BONUS_SPIN_AMOUNT` /
`TOTAL_WIN_TEXT` / `SCREEN_CLICK_PROMPT`。

| slot | 內容 | 位置 (x, y, z) | 對齊／文字框 |
|---|---|---|---|
| `BACKGROUND` | `*_bg` 圖 | — | — |
| `BONUS_GAME_NAME` | 標題圖 | (—, **0.8**, 0.325) | — |
| `BONUS_SPIN_AMOUNT` | 轉數 | (—, **0.57**, 0.325) | `Center` |
| `BONUS_GAME_DESCRIPTION` | 說明文 | (—, **descYPos**, 0.325) | `MultilineCenter`，**690 × 380** |
| `TOTAL_WIN_TEXT` | 總贏分 | (—, **−0.45**, 0.35) | `MultilineCenter` |
| `RETRIGGER_DESCRIPTION`（僅 `fs_2`）| `landing_respins_body` | (—, **−0.3**, 0.325) | `MultilineCenter` |
| Epic 貼紙（僅 `fs_epic`）| `hidden_epic_sticker` | (**0.6**, **0.8**, 0.35) | — |
| `totalwin` 圖 | 結算橫幅 | (—, **0.8**, 0.5) | — |

**z 值分層**：底圖最後 → 內容 0.325 → 總贏分 0.35 → 結算橫幅 0.5。

說明文的文字框 **690 × 380** 比開場三格的 420 × 180 大很多 —— 因為只有一格，空間夠。

### 14.4 兩張說明格的差異

| | 開場三格 | FG 說明格 |
|---|---|---|
| 格數 | 3 格並排 | 1 格 |
| 底圖 | 455 × 587 ×3 | 819 × 783 ×1 |
| 標題 | 文字（翻譯鍵）| **圖片**（各模式一張）|
| 內文框 | 420 × 180 | **690 × 380** |
| 內文 y | 固定 −0.42 | **依模式變**（0.2 / 0.1）|
| 方向適配 | 每元素兩套座標 | 只有一套（z 分層）|
| 觸發 | `SplashState`（載入後）| `FeatureEnterState` 的 `showDialog()` |

**標題從文字改成圖片**是關鍵差異 —— FG 標題是設計過的字體圖（THE HIT / WE SPLIT / GET LIT），
開場三格的標題則是可翻譯的純文字。

### 14.5 三格的 x 座標：公式算出來的

版面容器是 `hacksaw.core.components.view.SplashComponent`，
設定類別 `SplashComponentConfig(logo, volatility, topHeader, clickToContinue,
xSpacing, splashTimeout, splashes, epicSticker)`。

Miami 傳的值：**`xSpacing = 1`**、`splashTimeout` 用預設 **2**。

排版邏輯：

```js
// 橫式：三格並排
splashes.forEach((card, i) => {
  card.setPosition(
    (i / (splashes.length - 1) * 2 - 1) * xSpacing,   // ← x
    config.splashes[i].yOffset,                        // ← y（每格可各自偏移）
    0);
  card.set_visible(true);
});

// 直式：只顯示當前那一格，全部擺在原點
splashes.forEach((card, i) => {
  card.set_visible(i == _activeSplashIndex);
  card.setPosition(0, 0, 0);
});
```

**代入 3 格、xSpacing = 1：**

| 格 | 計算 | x |
|---|---|---|
| 第 1 格 | (0/2×2−1)×1 | **−1** |
| 第 2 格 | (1/2×2−1)×1 | **0** |
| 第 3 格 | (2/2×2−1)×1 | **+1** |

**三格中心 x = −1 / 0 / +1，中間那格正好置中。**
公式是「均分到 −xSpacing ~ +xSpacing」，所以改成 4 格會自動變成 −1 / −0.33 / +0.33 / +1。

### 14.6 直式是輪播，不是三格並排

這是橫直式最大的差異，不只是位置不同：

- **橫式**：三格同時顯示，並排。
- **直式**：**一次只顯示一格**（`_activeSplashIndex`），其餘 `set_visible(false)`，
  全部擺在原點，靠 **`splashTimeout = 2` 秒自動輪播**下一格。

`SplashComponent` 內部有 `_activeSplashIndex` / `_timeLeft` / `_tweeningCards` /
`onSplashFocused`，就是為了這個輪播。

### 14.7 引擎預設值 vs Miami 的覆寫

引擎有一組預設（`SplashDataConfig`）：

```js
xSpacing: 1.25,  headerMaxWidth: 490,  bodyMaxWidth: 490,  bodyMaxHeight: 300,
topHeaderMaxWidth: 1024,  volatilityScale: 1,  volatilityPos: (0, 0.65, 0),
logoScale: 1,  logoPos: (0, 1.1, 0)
```

Miami 幾乎每項都覆寫了：

| 項目 | 引擎預設 | Miami |
|---|---|---|
| `xSpacing` | 1.25 | **1** |
| 標題最大寬 | 490 | **440** |
| 內文框 | 490 × 300 | **420 × 180** |
| logo 位置 | (0, 1.1, 0) | y **0.8**（橫）／ **0.7**（直）|
| 波動度位置 | (0, 0.65, 0) | y **0.5**（橫）／ **0.425**（直）|

### 14.8 字型與字級（`gameconfig.json`）

`assets/social/common/config/gameconfig.json` 的 `style.text`
（default 版是 403，但 social 版內容相同且抓得到）。

**開場三格：**

| 樣式 | 字型 | 字級 | 顏色 | 描邊 | 其他 |
|---|---|---|---|---|---|
| `splashHeader` | `avega_regular` | **34** | `0xFFFF79B9`（粉紅）| 黑 1px | 陰影 radius 2.5 / dist 0.5 / angle −0.5；貼圖邊距 y 16 |
| `splashBody` | `avega_regular` | **25** | `0xFFFFFFFF`（白）| 黑 1px | 同陰影；空白寬 7；行距 **5** |
| `splashFooter` | `avega_regular` | **60** | 白 | 黑 1px | 字距 **−1.01**；空白寬 15 |

**FG 說明格：**

| 樣式 | 字級 | 用途 | 其他 |
|---|---|---|---|
| `featureBody` | **50** | `the_hit_uc` / `we_split_uc` / `get_lit_uc`、轉數 | 空白寬 12 |
| `featureInfo` | **30** | `*_body` 說明文、`landing_respins_body` | 空白寬 12；字距 **−2**；行距 **8**；陰影同上；貼圖邊距 y 17 |
| `featureFooter` | **50** | `click_to_continue_uc` | 空白寬 12 |

**全部用同一支字型 `avega_regular`**，只靠字級（25 / 30 / 34 / 50 / 60）與
顏色（粉紅標題 vs 白內文）分層級。描邊一律黑色 1px。

`style.text` 還有 `wantedInfo` / `respinsInfo` 兩組沒展開。

### 14.9 現在還缺的

- **`splashes[i].yOffset`** —— 每格可各自 y 偏移，Miami 傳的值沒查（公式裡有這個參數）。
- **`avega_regular` 字型檔本身** —— 在 `font/` 底下，沒抓（多語系字型 73MB 一起排除了）。
- **翻譯字串** —— `the_miami_mission_uc` 等是鍵值，實際文字由 RGS 的語系包提供。
- **FG 說明格的實際截圖** —— probe 截圖被開場 splash 擋住。
