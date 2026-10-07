# Miami Mayhem · 角色 reaction 與連線演出拆解

Hacksaw Gaming *Miami Mayhem*，gameId **1824**、version **1.23.2**。

姊妹篇：[`background-idle-technique.md`](background-idle-technique.md) 拆的是**待機晃動**。
這一份拆的是**動起來那一下** —— reaction 動畫本身、它到底被什麼觸發、
以及連線（payline win）時盤面上的角色符號在演什麼。
第 10 節專門處理「動作最大的那一刻長什麼樣、原圖必須怎麼畫」。

所有數字出自骨架 `.json` 與 `main.js`（Haxe 編譯、已 minify）。
**`main.js` 是讀出來的，不是跑出來的** —— 凡是靠讀程式推斷的地方都會標示。

> 素材：`assets/files/static-live.hacksawgaming.com/1824/1.23.2/assets/default/hd/spine/`

---

## 0. 六句話講完

1. **背景角色的 reaction 不是連線觸發的。** 它只在「**任務目標符號中獎**」時放一次，
   一次轉軸最多一次。
2. **reaction 是 1 秒以內的獨立動畫**，形狀一律是 **snap → hold → release**，
   跟 8 秒的 idle 完全兩種東西。
3. **幅度不是靠關節轉角，是靠視差控制骨＋局部縮放＋道具＋發光層。**
   關節很少超過 20 度，但二頭肌縮放到 1.52、前臂壓到 0.80、球棒尖端放大 3.35 倍。
4. **連線時盤面上的 HIGH_4 / HIGH_5 符號，演的就是主角自己那段 reaction**，
   同一套骨、同一組姿勢值，重新匯出進符號骨架、外面加一層底板與光暈。
5. **boss 沒有 reaction 動畫。** 見第 8 節。
6. **整隻角色只切 10 張圖**，切線只在肩、頸、腕 —— 手肘、腰、膝都在圖裡面用網格彎。見第 10 節。

---

## 1. 五個角色有什麼

| 角色 | idle | reaction | 出現模式 | 版面位置（landscape / portrait）|
|---|---|---|---|---|
| `character_main_guy` | 8.00s | **1.00s** | `base` | (−1.4, −0.7) ×1.0 / (0.65, 0.9) ×0.6 |
| `character_green_guy` | 8.00s | **0.70s** | `fs` | (−1.2, −0.6) ×1.0 / (0.65, 0.9) ×0.7 |
| `character_main_girl` | 5.00s | **1.00s** | `fs_2` | (−1.2, −0.6) ×1.0 / (0.65, 0.9) ×0.8 |
| `character_boss` | 6.67s | **無** | `fs_epic` | (−1.3, −0.7) ×1.0 / (−0.65, 0.9) ×0.6 |
| `character_bikinigirl` | 3.33s | **1.07s** | `fs_epic` | (−1.2, −0.6) ×1.0 / (0.65, 0.9) ×0.6 |

`fs_epic` 是唯一同時掛兩個角色的模式（boss 在左、bikinigirl 在右）。

### `full_screen/*` 與 `mobile/*` 是同一段動畫

逐 byte 比對過：

| 對照 | 骨骼軌道 | 差別 |
|---|---|---|
| guy `full_screen/idle` vs `mobile/idle` | **完全相同** | mobile 多一個 `mobile_clipping` 遮罩 attachment |
| guy `full_screen/reaction` vs `mobile/reaction` | **完全相同** | 同上 |
| girl idle / reaction | **完全相同** | 同上 |

**直向不是重做動畫，是同一段動畫外加一個裁切遮罩。**
（guy 的 idle 有一個例外：`bat_highlight` 橫向用 `rgba` 通道、直向用 `alpha` 通道，
但兩邊值都是 0，等價。）

`character_main_girl` 另有一個 `reaction_win`（1.00s）—— 跟 `full_screen/reaction`
比對後只有 `girl_head` 的**一個貝茲控制點**不同（5.85 vs 5.81），
其餘 47 根動畫骨完全一樣。**`main.js` 裡 0 次引用。** 是遺留的重複資產。

---

## 2. 觸發：不是連線，是任務

`main.js` 只有一處呼叫 `characterReact()`，在中獎演出的 per-win callback 裡
（base 與 free spins 各一份，內容相同）：

```js
R = function(e){
  return P == null                         // 沒有進行中的任務
      || U.symTarget != parseInt(e.symbol) // 這條線的符號不是任務目標
      || O                                 // 這次轉軸已經放過了
      || ( O = true,
           background.characterReact(),
           Q.completeMission(get_lives(P)) ),
    NOISE
};
...
return t.showWins(new C_(n, R, I, null))
```

拆開來：

| 條件 | 意思 |
|---|---|
| `P != null` | 手機（wanted phone）上有進行中的任務 |
| `symTarget == 該線符號` | **這條線的符號正好是任務指定的高賠符號** |
| `!O` | `O` 是一次性旗標，**一次轉軸只放一次**，不管中幾條 |

**所以：一般連線角色不會有反應。只有打中任務目標符號那一刻才會。**
而且 reaction 與 `completeMission()` 是同一個 statement —— 角色的動作
就是任務完成的視覺確認。

### `characterReact()` 本體

```js
characterReact: function(){
  for (每個 this._characters) {
    this._gameChannel.publish("characterReact", {mode: this._mode});
    play(orientation == "landscape" ? "LANDSCAPE_REACTION" : "PORTRAIT_REACTION");
  }
  等全部播完 → orientCharacter(orientation, true)   // 強制回 idle
}
```

三個值得抄的細節：

- **`_characters` 是當前模式的角色**（`enterMode` 時整組重建），所以 `fs_epic` 會同時對兩個角色下令。
- **同時 publish 一個 `characterReact` 事件**，音效／其他系統掛在這個頻道上，
  動畫與音效不互相耦合。
- **播完不是靠動畫自己收尾，是外部強制 `orientCharacter(..., true)` 把 anim 重設回 idle。**
  這比在 reaction 尾端接 idle 可靠 —— 中途被打斷也一定回得去。

### 混合時間

動畫表建構時 idle 與 reaction 都帶 **mix = 0.2 秒**，idle `loop = true`、
reaction `loop = false`：

```js
LANDSCAPE_IDLE     = Gr(full_screen/idle,     loop=true,  ..., mix=0.2)
PORTRAIT_IDLE      = Gr(mobile/idle,          loop=true,  ..., mix=0.2)
LANDSCAPE_REACTION = Gr(full_screen/reaction, loop=false, ..., mix=0.2)
PORTRAIT_REACTION  = Gr(mobile/reaction,      loop=false, ..., mix=0.2)
```

**0.2 秒的交叉混合是整套看起來不突兀的關鍵。** 1 秒的動作配 0.2 秒進出，
等於前後各 20% 在跟 idle 融合，不會有「啪」一下切換的斷點。

---

## 3. reaction 的形狀：snap → hold → release

四個角色的 reaction，骨骼關鍵幀數只有 **2～9 幀**（idle 是 10～21 幀）。
不是把 idle 加大，是完全不同的寫法：**衝到位、停住、放掉**。

`main_guy` 的軀幹位移（整段的主軸）：

```
body_perspective translate
  0.000 (0, 0)
  0.167 (28.8, 90.8)     ← 17% 就到最高點
  0.433 (50.7, 47.8)
  0.700 (34.0, −14.3)    ← 掉到起點以下（回彈）
  1.000 (0, 0)
```

`neck` 更乾脆 —— **一個純粹的 hold**：

```
neck rotate
  0.000  0.00
  0.167 +10.58    ← 17% 衝到位
  0.567 +10.58    ← 停在那裡 40% 的時間，一動不動
  1.000  0.00
```

四個角色的 snap / hold / release 比例：

| 角色 | 全長 | snap 到位 | hold 到 | release |
|---|---|---|---|---|
| `main_guy` | 1.00s | **0.167s (17%)** | 0.567s (57%) | 到 1.00s |
| `main_girl` | 1.00s | 0.10~0.17s | 0.43~0.63s | 到 1.00s |
| `bikinigirl` | 1.07s | 0.23~0.27s | 0.57~0.67s | 到 0.87~0.97s |
| `green_guy` | 0.70s | 0.33s | 0.40s | 到 0.60~0.70s |

**`green_guy` 幾乎沒有 hold**（0.33 → 0.40 只有 0.07 秒），
所以它是四個裡面最像「抖一下」而不是「做一個動作」的。

### hold 段裡一定要有東西在動

停住 0.4 秒，如果真的全部靜止，會讀成「卡住」而不是「用力」。
Hacksaw 在 hold 裡塞了兩種東西：

**（a）單幀彈跳 —— `main_guy` 的球棒**

```
bat rotate
  0.467  +3.18
  0.500  −11.42    ← 一幀（1/30 秒）內甩 14.6 度
  1.000   0.00
```

**（b）高頻抖動 —— `main_guy` 的二頭肌**

```
biceps_r scale
  0.167 (1.52,1.56)  0.233 (1.40,1.40)  0.300 (1.52,1.56)
  0.367 (1.40,1.40)  0.433 (1.52,1.56)  0.500 (1.40,1.40)
  0.567 (1.52,1.56)  1.000 (1.00,1.00)
```

**在 hold 期間以 0.067 秒（2 幀）為週期在 1.40↔1.52 之間跳** ——
肌肉在使勁發抖。`bikinigirl` 的左手 scale 也是同樣手法（1.1↔1.2）。

`bikinigirl` 的雙臂旋轉在 hold 段裡也有同樣的顫抖：

```
ch4_arm_2_r rotate
  0.333 −21.28   0.400 −20.37   0.467 −21.55
  0.600 −20.57   0.667 −22.18   ← hold 期間在 −20~−22 之間微顫
```

---

## 4. 幅度從哪來（關節給不了）

reaction 的關節轉角其實都不大：

| 角色 | 最大關節轉角 |
|---|---|
| `main_guy` | `hand` +20.0°、`hand_r` −16.5°、`neck` +10.6°、`arm_r_2` −7.7° |
| `main_girl` | `girl_arm_R` +18.8°、`girl_hand_R` −13.6°、`girl_head` −7.2° |
| `bikinigirl` | `ch4_hand_l` +27.1°、`ch4_arm2_l` +22.8°、`ch4_arm_2_r` −22.2° |
| `green_guy` | `ch0_arm_r` −13.4°、`character_0_head` −4.1° |

大小感是這三個地方給的：

### （a）視差控制骨（`*_persp`）

| 角色 | 控制骨 | 位移幅度 | 在軀幹網格上的最大權重 |
|---|---|---|---|
| `main_guy` | `body_perspective` | (+50.7, +90.8) | 0.39（55 / 81 頂點）|
| `main_girl` | `girl_body_perspective` | — | 0.52（31 / 63 頂點）|
| `bikinigirl` | `ch4_body_perspective` | (−19.7, −26.5) | — |
| `green_guy` | `character_0_persp` | (−27.6, −33.4) | 0.51（35 / 75 頂點）|

**這四個角色都沒有任何整體平移。** `root` 與 `*_root_pelvis` 在 reaction 裡
一格關鍵幀都沒有。`*_persp` 全部是掛在 spine 底下、**沒有任何子骨**的控制骨 ——
它不搬動角色，它只做兩件事：(1) 以 0.39～0.52 的權重推軀幹網格，
(2) 當 transform constraint 的 target（見 §10.5）。

所以「大」不是整個人位移 90 px，而是**軀幹網格被一個低頻、大範圍的權重推出去
約 0.39 × 90.8 ≈ 35 px**，同時前後兩層往相反方向滑。
idle 裡這根骨完全不動 —— 這個通道是 reaction 專用的。

### （b）道具

`main_guy` 的球棒尖端是整段最大的動作：

```
bat_tip translate 0.000 (0,0) → 0.200 (−70.3, −7.5) → 0.633 (−66.5, 0) → 0.933 (0,0)
bat_tip scale     1.00 → 2.83 × 3.35 → 回 1.00
```

位移 70 單位 ＋ 放大近 3 倍。**尖端掃過的範圍約角色身高的 31%。**
道具是剛性圖層、背後沒有東西，所以可以隨便甩，不會扯出破綻。

### （c）發光層（slot alpha）

這是最便宜的一招 —— **不動任何骨頭，也不用畫任何新圖**。
五個發光 slot 全部指向**和本體同一張圖的同一個 attachment**，
差別只在 `"blend": "additive"`：

```js
{"name":"body",           "bone":"guy_root_pelvis", "attachment":"body"}
{"name":"body_lights",    "bone":"guy_root_pelvis", "attachment":"body", "blend":"additive"}
{"name":"guy_head",       "bone":"guy_root_pelvis", "attachment":"guy_head"}
{"name":"guy_head_light", "bone":"guy_root_pelvis", "attachment":"guy_head",
                          "color":"ffffff00", "blend":"additive"}
```

**同一張圖再畫一次、用加法混合、把 alpha 從 0 拉到 1，就是發光。**
（`guy_head_light` 的網格只取 47 個頂點、`body_lights` 只取 14 個，
所以亮的是身上特定幾塊，不是整個人一起發白。）

`main_guy` 的 reaction 開了五層：

| slot | 通道 | 時間軸 |
|---|---|---|
| `arm_r2` | alpha | 0.00→0 · 0.13→1 · 0.67→0.90 · 0.93→0 |
| `body_lights` | alpha | 同上 |
| `guy_head_light` | alpha | 同上 |
| `bat_highlight` | alpha | 0.00→0 · **0.10→1** · 0.57→0.90 · 0.83→0（**比其他早 0.03 亮、早 0.10 滅**）|
| `lenses2` | **rgba** | 0.00 `ffffff00` · 0.17 `ffffffff` · **0.40 `ff93f8ff`（粉紅）** · 0.57 `ffffff00` |

兩個細節：

- **球棒的高光比身體早亮、早滅** —— 視線先被引到武器上。
- **墨鏡不是淡入淡出，是變色**：白 → 粉紅 → 消失。
  用 `rgba` 通道就能做，不用多一張圖。

idle 裡這五個 slot 全部是 alpha = 0，**只有 reaction 打開**。

---

## 5. 逐角色

### `character_main_guy` — 揮棒（1.00s，49 骨）

```
body_perspective  tr  (0,0) → (28.8,90.8) → (50.7,47.8) → (34.0,−14.3) → (0,0)
neck              rot  0 → +10.58 [hold 0.167~0.567] → 0
hand              rot  0 → 1.55 → +20.02 → 18.15 → 12.70 → 1.33 → 0
hand_r            rot  0 → −16.48 [hold 0.267~0.667] → 0     scale 1.0→1.2→1.0
arm_r_2           rot  0 → −7.67 → −6.65 → 0
biceps_r          sc   1.52↔1.40 高頻抖動（見上）
chain_control     tr   (0,0) → (27.4,32.7) → (26.2,17.2) → (0,0)   ← 項鍊甩動
bat_tip           tr   (0,0) → (−70.3,−7.5) → (−66.5,0) → (0,0)    sc → 2.83×3.35
bat               rot  ... +3.18 → −11.42（單幀）→ 0
arm_l_target      tr   (0,0) → (−27.4,−7.1) [hold] → (8.5,59.7) → (0.2,2.7)
```

還有一條 `[ik] hand_l_targer_opposite mix=[0]` —— **IK 在 reaction 全程關閉**，
左手改由 `arm_l_target` 直接擺位。用 IK 擺姿勢、再用關掉 IK 來手動蓋過，
這是 Spine 裡處理「這一段我要完全控制」的標準做法。

### `character_main_girl` — 甩頭甩馬尾（1.00s，59 骨）

她的做法跟 idle 一脈相承：**本體小、附屬物大**。

```
girl_spine2     rot  0 → −4.33 → −3.43 → +0.96 → 0        ← 軀幹 4 度
girl_neck       rot  0 → +1.37 → −4.97 → −4.66 → +0.88 → 0
girl_head       rot  0 → +5.85 → −7.19 → −5.25 → +3.16 → −0.53 → 0
girl_arm_R      rot  0 → +18.03 → +18.77 [hold] → +15.17 → 0
girl_hand_R     rot  0 → −12.70 → −13.63 → 0
girl_shoulder_R rot/tr/sc  −4.15° ＋ (2.1,3.0) ＋ scaleX 0.66  ← 肩膀壓縮
outer_fingers   rot/tr  −13.95° ＋ (−3.3, −39.3)              ← 手指張開
girl_hair_ctrl7 rot  0 → +3.37 → −37.19 → +14.45 → −13.50 → 0
ponytail3       rot  0 → −12.30 → +5.63 → −4.53 → −3.39 → +0.97 → −4.03 → 0
```

**頭轉 7 度，頭髮甩 37 度 —— 5 倍。** 馬尾（`ponytail3`）在 0.87 秒內
來回 7 次，是明顯的阻尼震盪，跟頭部動作**不同步**，落後而且收得比較慢。

她的頭部第一拍是**反向的**：先 +5.85 再甩到 −7.19。
**先往反方向預備（anticipation），再甩過去** —— 動畫十二原則的第一條，
在 0.1 秒內做完。

### `character_bikinigirl` — 雙手抬起（1.07s，42 骨）

唯一一個**兩手不對稱**的：

```
ch4_arm2_l    rot  0 → −4.97 → +22.76 [顫抖 hold] → −4.97 → 0
ch4_arm_2_r   rot  0 → +4.03 → −21.28 [顫抖 hold] → +1.43 → 0
```

兩手都有**反向預備**（左手先 −4.97 再 +22.76；右手先 +4.03 再 −21.28），
而且方向相反，讀起來是「雙手向外一撐」。

臉部有獨立的眉毛控制：

```
ch4_brow_r  tr  (0,0) → (2.7,0.8) → (−25.0,−15.1) → (−20.8,−13.6) → (1.9,0.8) → (0,0)
ch4_brow_l  tr  y 到 +14.8                                  ← 兩眉不同方向
```

**兩條眉毛走不同方向**（右眉往下內、左眉往上）—— 一個挑眉的表情，
成本只是兩根骨的位移。

### `character_green_guy` — 最短的一個（0.70s，24 骨）

```
character_0_persp  tr  (0,0) → (−27.6,−33.4) → (0,0)    ← 只有 3 幀
hand_r_target      tr  (0,0) → (10.4, 33.2) → (0,0)
hand_l_target      tr  (0,0) → ( 9.9, 31.4) → (0,0)
ch0_arm_r          rot  0 → −13.39 → 0
character_0_spine2 rot  0 → −0.51 → −4.07 → −4.07 → 0
```

**用 IK target 位移代替關節旋轉** —— 動 `hand_*_target`，手臂骨自己算出來。
每根骨只有 3～6 幀，是四個角色裡最省的寫法。

### `character_boss` — 沒有 reaction

只有 `full_screen/idle` 與 `mobile/idle`（6.67s），
113 條軌道裡**絕大多數是雪茄煙霧**（`smoke_p1~p20`，rotate ±26°、scale 0→1.89）。
本體只有 `body_root` ±4.4° 與 `boss_breathing` 的縮放。

---

## 6. 連線（payline win）演出

### 6.1 執行模式由 turbo 決定

```js
switch (turboMode) {
  case "superTurbo": I = Summarized(0, null, true, true);   // 全部合併，不逐條播
  case "turbo":      I = Parallel(400, ...);                // 全部同時，400ms
  default:           I = Serial(...);                       // 逐條依序播
}
showWins(new C_(wins, R, I, null))
```

**三檔速度不是「同一段動畫播快一點」，是三種不同的呈現結構。**
逐條 → 同時 400ms → 直接算總和。

每個 action 之間還有一段間隔，同樣看 turbo：

```js
after(currentTurboValue({normal: 0.25, turbo: 0.1, superTurbo: 0}))
```

### 6.2 符號 win 動畫長度

| 符號 | `win` 長度 | 來源檔 |
|---|---|---|
| `lows/low_1~5` | 0.83s | `symbols.json` |
| `highs/high_1` | 0.83s | `symbols.json` |
| `highs/high_2` | 1.10s | `symbols.json` |
| `highs/high_3` | 1.00s | `symbols.json` |
| `HIGH_4` | **1.07s** | **獨立檔 `high_4.json`**（76 骨 / 36 slot）|
| `HIGH_5` | **1.07s** | **獨立檔 `high_5.json`**（66 骨 / 36 slot）|
| `specials/wild` | 0.60s | `symbols.json` |
| `specials/fs` | 0.83s | `symbols.json` |

**兩個最高賠的符號被拉出去做成獨立骨架檔**，因為它們裡面是完整的角色。

### 6.3 HIGH_4 / HIGH_5 的 win = 主角自己的 reaction

比對過骨架與姿勢值：

| | 共用骨 | **姿勢值序列完全相同的通道** |
|---|---|---|
| `main_girl` reaction → `high_4/win` | 46 根 | **61 / 66** |
| `main_guy` reaction → `high_5/win` | 17 根 | 12 / 23 |

差別只有兩種：

**（a）整段往後推一幀。** 例如 `ear_L`：

```
角色 : 0.0667  0.1333  0.2333  0.3667  0.5667  0.6667  0.8000  0.9667
符號 : 0.1000  0.1667  0.2667  0.4000  0.6000  0.7000  0.8333  1.0000
                                          ← 每一幀都 +0.0333s（30fps 的一幀）
```

**（b）符號版加大。** guy 的 `body_perspective` 縱向從 90.8 加到 **111.5**，
`bat_tip` scale 從 2.83 加到 2.89 —— 符號格子小，動作要更誇張才看得出來。

符號版另外多 7 根骨，全是**外框**不是角色：
`high_5_backplate`、`high_5_backplate_top`、`high_5_gradient_bottom`、
`h5_character_container`、`character_scale_bone`、`high_4_clipping_mask_top`。

> **這是整份文件最值得抄的結構決定**：
> 角色的表演只做一次，然後**匯出兩份** —— 一份給背景大圖、一份塞進符號骨架，
> 外面套一層底板／裁切／光暈。盤面上的符號跟背景的角色是同一個人在做同一件事，
> 玩家不會意識到，但一致性是這樣來的。

---

## 7. 任務目標符號的四個狀態

手機（wanted phone）指定一個高賠符號當任務目標，盤面上那個符號會被標記。
`main.js` 註冊的狀態表：

```js
["win", "active_trigger", "active_idle", "active_fade", "completed"]
```

| 狀態 | track | loop | mix | 長度 | 內容 |
|---|---|---|---|---|---|
| `active_trigger` | 0 | 否 | 1.0 | 0.40s | 底板 scale 1.0→1.10、光暈方塊閃斷一次（0.27s 消失、0.40s 回來）|
| `active_idle` | **1** | **是** | **0.5** | 0.60s | 只有三根骨在做 1.03～1.05 的呼吸縮放 |
| `active_fade` | 1 | 否 | 1.0 | 0.33s | 收掉 |
| `completed` | 1 | 否 | 1.0 | 0.33s | **打勾**：`completed_checkmark_master_bone` scale 0.01→1.95、rotate −11°→+35° |
| `failed` | 0 | 否 | 1.0 | 0.37s | **打叉**：`failed_cross_master_bone` scale 0.05→2.11 ＋ 底板左右甩 ±21 |

三個關鍵設計：

- **`active_idle` 跑在 track 1、mix 0.5、loop**。
  疊在符號本來的動畫上面、只出一半的力，
  **所以目標符號可以同時「被標記」又照常播自己的 win 動畫**，不互相蓋掉。
- **打勾／打叉是 scale 從近 0 彈到近 2 再收回**（1.95 / 2.11），
  典型的 overshoot，比淡入有力得多。
- **失敗的叉還加了底板左右甩** ±21 單位 —— 搖頭。

程式端：

```js
setDefaultSymbolState(symId, Spine("active_idle"));   // 目標符號的預設狀態
setRevealMode(symbolName);
...
newMessagePopup()  → highAnimations[symTarget].ACTIVATE
endMission(true)   → highAnimations[symTarget].COMPLETE  → after(0.5)
endMission(false)  → highAnimations[symTarget].FAIL      → after(0.5)
```

`COMPLETE` / `FAIL` 播完都硬等 **0.5 秒**再往下走。

---

## 8. 讀出來的疑點（沒有實跑驗證）

**`character_boss` 沒有 reaction 動畫，但它會被下令播。**

- 動畫名稱表是用 `mapValues` 對**每個角色**建同一份，
  四個 key 全部指向 `full_screen/reaction` 等字串。
- `characterReact()` 對 `_characters` 裡**每一個**角色呼叫 `play("LANDSCAPE_REACTION")`。
- `fs_epic` 模式的 `_characters` 是 `[boss, bikinigirl]`。
- `character_boss.json` 只有 idle。

所以在 `fs_epic` 期間若 `characterReact()` 觸發，boss 這一格會找不到動畫。
**但是**任務系統（wanted phone）是 base game 的機制，
`fs_epic` 期間是否可能有進行中的任務、`P` 是否為 null，
我沒有從程式路徑追到底，也沒有實際跑過遊戲確認。
**這一條是讀程式的推斷，不是觀察到的 bug。**

另一條：`character_main_girl` 的 `reaction_win` 在 `main.js` 裡 0 次引用，
內容與 `full_screen/reaction` 只差一個貝茲控制點。**是死資產。**

---

## 9. 抄錄清單

| 手法 | 數字 | 成本 |
|---|---|---|
| reaction 與 idle 分開，不是加大版 | 1.0s vs 8.0s；3~7 幀 vs 10~21 幀 | 低 |
| snap → hold → release | 到位 17%、hold 到 57～63% | 低 |
| 進出用 0.2s 混合 | mix = 0.2 | 極低 |
| hold 段塞高頻抖動 | 2 幀週期、1.40↔1.52 | 低 |
| hold 段塞單幀彈跳 | 一幀甩 14.6 度 | 極低 |
| 反向預備 | 0.1 秒內先往反方向 5~6 度 | 低 |
| 幅度靠視差控制骨不靠關節 | 權重 0.39～0.52、位移 90 px | 低 |
| 幅度靠道具 | 尖端掃過身高 31%、放大 3.35 倍 | 中（要一張圖）|
| **大動作靠 squash & stretch 不靠旋轉** | 二頭肌 1.52、手臂拉長 1.23、前臂壓 0.80，旋轉最大只有 20° | 低 |
| **前後緣反向滑 4% 假造轉身** | 前 +0.90 / 後 −0.65 的 transform mix | 低 |
| 發光層淡入淡出 | 5 個 additive slot、0.13 亮 0.93 滅 | **極低（0 張新圖）**|
| 武器高光比身體早亮早滅 | 早 0.03s 亮、早 0.10s 滅 | 極低 |
| 墨鏡用 rgba 變色不用換圖 | 白 → `ff93f8ff` → 透明 | 極低 |
| 附屬物 5 倍放大 | 頭 7°／頭髮 37° | 低 |
| 表演匯出兩份（背景＋符號） | 61/66 通道值相同、整體 +1 幀、幅度加大 23% | 中 |
| 標記狀態跑 track 1、mix 0.5 | 不蓋掉符號本身的動畫 | 低 |
| 打勾／打叉 overshoot | scale 0.01 → 1.95 → 1.0 | 低 |
| 播完由外部強制回 idle | `orientCharacter(..., true)` | 低 |
| 動畫與音效用事件解耦 | `publish("characterReact", {mode})` | 低 |

---

> ⚠ **2026-09-24 更正**：Spine 的 scaleX 是沿骨頭、scaleY 是垂直骨頭。`arm_r 1.00 × 1.23` 是**上臂變粗 23%、長度不變**（動作包實測肩→肘距離 231.09 不變）；`arm_l_2 1.06 × 0.80` 是前臂**變細** 20%。本文件寫「拉長 23%／壓縮 20%」是讀反了，見 `rig/motion.py` REACTION_SCALE 的註解。

## 10. 動作最大的那一刻，以及對圖的限制

### 10.1 尖峰在 t = 0.20（整段的 20%）

把 `main_guy` 的 reaction 每根骨在同一時刻取樣出來（局部值，未套 IK／constraint）：

| t | 0.167 | **0.200（尖峰）** | 0.400 | 0.500 |
|---|---|---|---|---|
| `bat_tip` tr | (−65.3, −7.0) | **(−70.3, −7.5)** | (−69.9, −4.1) | (−69.2, −2.0) |
| `bat_tip` sc | 2.70 × 3.18 | **2.83 × 3.35** | 2.83 × 3.35 | 2.83 × 3.35 |
| `body_perspective` tr | (+28.9, +90.8) | (+34.9, **+92.6**) | (**+50.0**, +57.0) | (+50.4, +28.1) |
| `biceps_r` sc | **1.52 × 1.56** | 1.46 × 1.50 | 1.46 × 1.50 | 1.40 × 1.43 |
| `biceps_l` sc | **1.40 × 1.48** | 1.34 × 1.41 | 1.34 × 1.41 | 1.27 × 1.34 |
| `arm_r` sc | 1.00 × **1.23** | 1.00 × 1.23 | 1.00 × 1.19 | 1.00 × 1.16 |
| `arm_l_2` sc | 1.06 × **0.80** | 1.06 × 0.80 | 1.06 × 0.81 | 1.06 × 0.83 |
| `hand` rot | +16.44 | **+20.02** | +16.11 | +13.66 |
| `hand_r` rot / sc | −12.71 / 1.25 | −14.24 / **1.26** | −17.53 / 1.27 | −17.15 / 1.26 |
| `chain_control` tr | (+27.4, **+32.7**) | (+27.3, +31.4) | (+26.7, +23.7) | (+26.4, +19.8) |

**幾乎所有東西在 0.167～0.20 之間就到位了。** 之後到 0.5 只有
`body_perspective` 的 x 還在往前推（28.9 → 50.4）—— 身體撞出去之後**繼續前傾**，
這是 hold 段沒有變成靜止畫面的第三個原因（前兩個是單幀彈跳與高頻抖動）。

### 10.2 尖峰時最猛的不是旋轉，是**縮放**

上表最大的數字全部是 scale：

```
bat_tip     2.83 × 3.35      ← 球棒尖端放大 3 倍
biceps_r    1.52 × 1.56      ← 二頭肌鼓起 52%
biceps_l    1.40 × 1.48
hand_r      1.26 × 1.26      ← 拳頭放大 26%
arm_r       1.00 × 1.23      ← 右上臂變粗 23%（長度不變；原文誤作「拉長」）
arm_l_2     1.06 × 0.80      ← 左前臂縱向壓縮 20%
```

而旋轉最大只有 `hand` 的 20 度。

**這是整個問題的答案：Hacksaw 的「大動作」是靠局部 squash & stretch 做出來的，
不是靠關節轉更多。** 一張平面圖轉 20 度只會看起來歪了；同一張圖在正確的位置
鼓起 50%、拉長 23%、壓扁 20%，看起來就是有肌肉在用力。

### 10.3 對圖的第一個限制：**整隻角色只切 10 張**

`character_main_guy.atlas` 的全部內容：

| 圖 | 尺寸 | 網格 | 綁到幾根骨 |
|---|---|---|---|
| `body` | 545 × 964 | 81 頂點 / 121 三角 | 6 |
| `guy_head` | 197 × 296 | 119 頂點 / 202 三角 | 8 |
| `arm_r` | 234 × 659 | 63 頂點 / 88 三角 | 6 |
| `arm_l` | 284 × 337 | 41 頂點 / 57 三角 | 4 |
| `bat` | 724 × 281 | 38 頂點 / 49 三角 | 2 |
| `chain` | 158 × 130 | 22 頂點 / 20 三角 | 11 |
| `fingers` | 130 × 113 | 5 頂點 / 3 三角（剛性）| 1 |
| `hand_l` | 125 × 107 | 6 頂點 / 4 三角（剛性）| 1 |
| `Glasses` | 166 × 51 | 8 頂點 | — |
| `lenses` | 134 × 63 | 6 頂點 | — |

合計 **1.10 M 像素**，塞在一張 2048² 的圖集裡。

**切線只有三處：肩、頸、腕。**
手肘沒有切、腰沒有切、膝蓋沒有切 —— 那些全部是**同一張圖裡面的網格在彎**。

其他四個角色同樣的量級：

| 角色 | 圖數 | 總頂點 | 總三角 | 多骨頂點比例 | 單頂點最多綁幾根骨 |
|---|---|---|---|---|---|
| `main_guy` | 10 | 530 | 718 | **86%** | 6 |
| `main_girl` | 15 | 538 | 678 | 81% | 5 |
| `bikinigirl` | 8 | 406 | 515 | 77% | **8** |
| `green_guy` | **6** | 242 | 350 | 83% | 4 |
| `boss` | 7 | 736 | 857 | **90%** | 4 |

> **77～90% 的頂點綁在兩根以上的骨上。**
> 這就是為什麼它們永遠不會在關節裂開 —— 沒有邊界可以裂。
> 反過來說：**這也是對圖最硬的限制 —— 圖不能先被切成關節件。**

### 10.4 一隻手臂 = 一張圖 + 6 根骨

`arm_r` 這張 234 × 659 的圖，裡面有：

```
arm_r        主導 31 頂點      ← 上臂
arm_r_2      主導 16 頂點      ← 前臂
fingers_r    主導 11 頂點      ← 手指
hand_r        主導 2 頂點      ← 手腕
big_finger_r  主導 2 頂點
biceps_r      主導 1 頂點      ← 只主導一個頂點，但以次要權重鼓起整條上臂
平均 2.51 根骨 / 頂點
```

**從肩膀到指尖是一張連續的圖。** 尖峰時它同時被拉長 23%、
二頭肌處鼓起 52%、拳頭放大 26% —— 全部發生在這 63 個頂點裡。

對圖的要求：
- **手臂要畫成攤開、跟身體有空隙的姿勢**，否則沒有地方放那 6 根骨。
- **不要把手指跟手臂畫在不同圖層再拼** —— 這裡就是一張。
- **關節處不要有硬邊細節**（銳利的縫線、鉚釘、格紋），
  網格在那裡會剪切，硬邊會被扭出來。

### 10.5 軀幹是一張圖，但裡面藏了「視差三層」

這是這個 rig 最巧的地方。`body_perspective` 沒有子骨，它透過
**transform constraint** 把自己的位移**按不同比例、不同正負**餵給三個區域：

| constraint | 被驅動的骨 | mixX | mixY | × 尖峰 (50.7, 90.8) |
|---|---|---|---|---|
| `body_front_perspective` | `body_front_persp` | **+0.90** | +0.65 | (+45.6, +59.0) |
| `body_back_perspective` | `body_back_persp` | **−0.65** | 0 | (−33.0, 0) |
| `arm_r_perspective` | `arm_r` | +0.241 | +0.386 | (+12.2, +35.0) |
| `arm_l_perspective` | `arm_l` | −0.386 | −0.157 | (−19.5, −14.2) |

四個 constraint 全部 `mixRotate: 0`、`mixScaleX: 0`、`mixShearY: 0` ——
**只傳位移，不傳旋轉。**

這兩個 persp 骨再以權重回到同一張 `body` 圖上：

```
body_front_persp   綁 23 頂點  最大權重 0.32
body_back_persp    綁 23 頂點  最大權重 0.21
```

所以整段最大時，軀幹圖的**前緣**被推 0.32 × 45.6 ≈ **+14.6 px**，
**後緣**被推 0.21 × (−33.0) ≈ **−6.9 px**，
一張 545 px 寬的圖**內部撐開約 21.5 px ≈ 圖寬的 4%**。

> 這 4% 就是「他轉過來了」的全部內容。
> 平面圖沒有厚度，Hacksaw 用**前後兩緣反向滑動 4%** 假造出一個 Z 軸。
>
> 上面 (+45.6, −33.0) 是 constraint 常數 × 驅動骨尖峰算出來的**上界**，
> 我沒有實跑 Spine runtime 驗證最終合成值。權重與 mix 常數本身是檔案裡的原值。

`main_girl` 是同一套、數字更小（mixX +0.25 / −0.30，權重 0.75）。
`green_guy` **沒有 transform constraint**，它的 `character_0_persp`
就只是一根權重 0.51 的骨 —— 所以它看起來最「平」。

**對圖的要求：軀幹必須是一整張、前後緣都畫滿**。
如果把前襟跟背部切成兩張再疊，這 4% 的相對滑動立刻變成一條縫。

### 10.6 頭也是一張圖，裡面四層＋一條面具鏈

```
guy_head  197 × 296，119 頂點 / 202 三角，8 根骨，平均 2.87 根骨/頂點

face_center  綁 114 頂點  最大 1.00     ← 整張臉的基準
head_front    綁 60 頂點  最大 0.98     ← 前緣（constraint mixX +0.578）
head_back     綁 61 頂點  最大 0.99     ← 後緣（constraint mixX −0.325）
head_top      綁 40 頂點  最大 0.53     ← 頭頂（mixX −0.265，scaleX −0.4）
mask / mask2 / mask3 / mask4  各綁 9~23 頂點  最大 0.28~0.31
```

`face_center` 尖峰位移 (10.3, 4.7)，經 constraint 後前緣 +5.8 px、後緣 −3.3 px，
**197 px 寬的頭內部滑動約 9.2 px ≈ 4.7%** —— 跟軀幹同一個量級。

`mask~mask4` 是一條四節的鏈，**只在 idle 用**（idle 裡 `mask3` 轉 ±6.75 度、
`mask4` 到 +10.5 度），reaction 完全不動它。

**對圖的要求：頭是一張圖，臉、髮際、頭頂不能分層。**
眼鏡（`Glasses` + `lenses`）才是分開的 —— 因為它要獨立閃色。

### 10.7 對圖的完整檢查清單

拿一張自己的角色圖，照這個順序檢查：

| # | 條件 | 為什麼 | 不合格會怎樣 |
|---|---|---|---|
| 1 | **不要先切成關節件** | 77～90% 頂點要綁多骨 | 每個關節都會裂 |
| 2 | **手臂與身體之間要有空隙** | 手臂要獨立成圖並塞 4～6 根骨 | 只剩身體晃動＋頭，比原本的少 |
| 3 | **手臂一張圖畫到指尖** | 手肘不切，靠網格彎 | 手肘會有硬轉折 |
| 4 | **軀幹一張圖、前後緣畫滿** | 前後要反向滑 4% | 縫 |
| 5 | **頭一張圖，臉／髮際／頭頂不分層** | 內部滑 4.7% | 臉會從頭上滑開 |
| 6 | **關節處不要有硬邊細節** | 網格在那裡剪切 | 格紋／縫線被扭 |
| 7 | **道具（球棒、鏈子）另外一張** | 剛性、可以任意甩、可以插進 z 序 | 甩不動或穿幫 |
| 8 | **不用另外畫發光圖** | additive 重畫同一張就是發光 | 白做工 |
| 9 | **要有反鋸齒邊** | 網格會旋轉它 | 邊緣會爬 |
| 10 | **上臂要能變粗 23%、前臂變細 20%（長度幾乎不變）** | 尖峰全靠局部 scale | 動作會顯得小 |

這 10 條裡有 7 條已經寫進 `rig/inspect_art.py`，跑一次就會印出來：

```bash
python rig/inspect_art.py character.png
```

| 清單 # | inspect_art 的哪一行 |
|---|---|
| 2 | `limbs   N of 60 sampled heights show 3+ separate runs` |
| 3 | `clear band spans N% of figure height (reference arm image: 62%)` |
| 4 / 5 | `shear budget  torso W px -> front/back edges slide ~0.04W px apart` |
| 6 | `joint detail  neck / waist / elbow / knee ... N% of width` |
| 7 | `protrusions ... HELD OBJECT or free appendage` |
| 8 | `not needed   glow / highlight layers` |
| 9 | `style ... soft alpha N%` |
| 10 | `headroom  left/right/top/bottom` |

第 1 條（不要先切成關節件）沒辦法從一張圖量 —— 那是交件格式的約定。

第 2 條是最常卡住的。用 `rig/inspect_art.py` 量：
在 60 個高度取樣裡，**有幾個高度看得到手臂與身體之間的空隙**。
Hot Miami 現有那兩隻是 **0 / 60** 與 **2 / 60** —— 手插口袋、手貼在身側，
所以它們就算換成網格 rig 也做不了這一節講的任何東西。

### 10.8 一句話總結

> **Hacksaw 不是把圖切碎再拼回去，是把圖切成「一張軀幹＋兩隻手臂＋一顆頭＋道具」，
> 然後在每一張裡面塞 4～8 根骨，用 squash & stretch 而不是旋轉去做大動作，
> 再用兩層反向滑動 4% 假造出轉身的厚度。**

---

## 附錄 · 重現這些數字

骨架端（在 `assets/.../hd/spine/` 底下跑）：

```python
import json
d = json.load(open('character_main_guy.json', encoding='utf-8'))
b = d['animations']['full_screen/reaction']['bones']
for n in ('body_perspective', 'neck', 'bat_tip', 'biceps_r'):
    for c, ks in b[n].items():
        print(n, c, [(k.get('time', 0), k.get('value'), k.get('x'), k.get('y')) for k in ks])
```

程式端在 `assets/files/static-live.hacksawgaming.com/1824/1.23.2/main.js`，
搜這幾個字串就能找到本文引用的每一段：
`characterReact`、`symTarget`、`highAnimations`、`addBackground`、`showWins`、`active_idle`。
