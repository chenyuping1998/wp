# Le Bandit · 角色動態完整拆解

Hacksaw Gaming *Le Bandit*，gameId **1309**、version **1.24.0**。
主角 spine：`assets/default/common/spine/raccoon.json`。

抄錄日期 2026-09-16。所有數字出自骨架 `.json` 與 `main.js`（2.54 MB，Haxe 編譯，
**屬性名未混淆**）。**`main.js` 是讀出來的，不是跑出來的** —— 推斷的地方會標示。

姊妹作對照見 [`le-series-comparison.md`](le-series-comparison.md)。

---

## 0. 五句話講完

1. **這是四款裡最會演的角色：21 段動畫**（Miami 主角只有 4 段）。
2. **它會因為你贏太少而生氣。** 贏 0–9.99× 播的是 `loosing_1_stomp`
   —— 跺腳、罵髒話。10× 以上才給好臉色。
3. **待機是 1.07 秒的彈跳迴圈，髖部真的位移 ±40px** ——
   跟 Miami 那種 8 秒近乎靜止的呼吸完全不同路數。
4. **每 30–39 秒會自己做一件事**（掉鬍子、抓屁股），第一次在 10–19 秒。
5. **直向不演。** 整套演出被 `"landscape" === orientation` 包住；
   另外部分動畫被 `"west_virginia" != jurisdiction` 擋掉。

---

## 1. 骨架：36 骨 / 36 slot

`raccoon.json` 183 KB，**Spine 3.8.99**，骨架框 998 × 1372，圖集 2048²。

> ⚠️ **3.8 跟 4.x 的 JSON 不一樣，讀錯會全部變成 0**：
> rotate 的欄位叫 **`angle`**（4.x 是 `value`），
> curve 是 `"curve": cx1, "c2", "c3", "c4"` 四個純量（4.x 是陣列）。
> 本包附的 `scripts/dump38.py` 已經處理。

### 階層

```
root
├ bone ─ hip_bone ─ chest_bone ─┬ L_sholder ─ L_elbow ─ L_hand
│  │                            ├ R_sholder ─ R_elbow ─ R_hand
│  │                            ├ head_bone ─┬ hat_bone
│  │                            │            ├ pupil / eyebrow / L_ear / R_ear
│  │                            │            ├ nose_bone ─ mustache_side ─ mustache
│  │                            │            ├ dollar_eyes_bone
│  │                            │            └ leprechaun_hat_bone ─ (top / bottum)
│  │                            ├ sholder_bone_2 ─ elbow_bone_2 ─ hand_bone_2   ← 第二組手臂
│  │                            └ forearm_bone ─ face_hand_bone                 ← 第三組手臂
│  └ tail_bone_1 ─ tail_bone_2
├ R_knee_bone / L_knee_bone / L_shoe_bone
└ bubble_bone ─┬ positive_bubble_bone
               └ negative_bubble_bone
```

**三組手臂**是這具骨架最特別的地方。主鏈 `L_/R_sholder→elbow→hand` 負責一般動作；
`sholder_bone_2` 那組與 `forearm_bone→face_hand_bone` 那組是**擺特定姿勢用的替身**
—— 摸臉、丟帽子、伸長手那些。切換靠 slot alpha，不是靠骨骼（見 §4）。

### 藝術資產：43 個切片，一張 2048² 圖集

| 切片 | 尺寸 | 用途 |
|---|---|---|
| `Body` | 726×675 | 軀幹 |
| `Tail` | 489×656 | 尾巴（36 頂點 mesh）|
| `Head_grr` | 564×456 | **預設臉**（78 頂點）|
| `_0000s_0000_Angry_head` | 567×470 | 生氣臉（66 頂點）|
| `_0000s_0001_Ohh_head` | 567×417 | 驚訝臉（6 頂點）|
| `happy_mouth` / `hmm_mouth` / `smirk` | 565×316 / 564×222 / 564×221 | 三張嘴 |
| `Crowbar` / `Crowbar_back` | 514×500 / 261×665 | 撬棍（前後兩片）|
| `L_arm` / `R_arm` | 346×241 / 230×224 | 主手臂 |
| `_0000s_0004_stretched_arm` | 127×427 | 伸長的手臂 |
| `_0000s_0002_Face_hand` / `_0000s_0003_Forearm` | 243×274 / — | 摸臉那組 |
| `bonjour_hand` | 212×248 | 打招呼的手 |
| `hat` | 329×187 | 帽子（兩個 slot 共用，一個 4 頂點一個 24 頂點）|
| `Shoe_up` / `Shoe_down` | 282×194 / 281×187 | 鞋子兩態 |
| `mustache` | — | 鬍子（11 頂點，會掉）|
| `leprechaun_hat_front/back` | 181×250 | 妖精帽 |

**幾乎全部是 mesh，而且全部綁在 `root`** —— 跟 Miami 的作法一樣，
整隻角色是一張連續的權重網格，不是切開的剛性圖層。

---

## 2. 台詞泡泡：13 個法文字

```
good_attachments (8)  bien, bonjour, cava, incroyable, lepain, merci, mondieu, oui
bad_attachments  (5)  bleep, conneries, merde, non, zutalors
```

`bubble_bone` 掛在 `root`，底下分 `positive_bubble_bone` 與 `negative_bubble_bone`。
泡泡的進場**每一段都一樣**：

```
bubble_bone  scale 0.48 → 1.02（或 1.08）
             rotate −3.96 → +32.80
```

**從 48% 大小 ＋ 轉 33 度彈出來** —— 一個彈性 pop-in，不是淡入。
文字 attachment 在某個時間點被指定，然後整個 slot 的 color 從 `ffffff00` 淡到 `ffffffff`。

---

## 3. `idle`：1.07 秒，完整關鍵幀

**全段只有骨骼通道，沒有 slot、沒有 deform。** 15 根骨。

```
hip_bone       translate  0.00 (0,0)  0.27 (+39.5,+8.4)  0.57 (−4.2,+6.2)  0.80 (−10.3,−25.0)  1.07 (0,0)
chest_bone     rotate     0.00  0.00  0.30 +1.34   0.73 −1.58   1.07  0.00
head_bone      translate  0.00 (0,0)  0.13 (−3.0,−3.9)  0.43 (−30.6,−40.8)  0.63 (−7.6,−38.8)  0.87 (−14.6,+5.2)  1.07 (0,0)
nose_bone      translate  0.13 (0,0)  0.40 (−17.5,−0.6)  0.67 (+12.5,+5.9)  0.90 (−5.0,+5.3)  1.07 (0,0)
eyebrow_bone   translate  0.00 (0,0)  0.60 (−8.1,+6.4)  1.07 (0,0)
L_ear          rotate     0.00  0.00  0.27 +13.14  0.80 −12.01  1.07  0.00
R_ear          rotate     0.00  0.00  0.27  +7.88  0.70 −15.56  1.07  0.00
tail_bone_1    rotate     0.00  0.00  0.27  +4.51  0.80  −6.63  1.07  0.00
tail_bone_2    rotate     0.00  0.00  0.27  −8.85  0.80  +5.85  1.07  0.00
L_sholder_bone rotate     0.00  0.00  0.30  −6.35  0.80  +2.57  1.07  0.00
L_elbow_bone   rotate     0.00  0.00  0.27  −7.46  0.77  +5.33  1.07  0.00
L_hand_bone    rotate     0.00  0.00  0.37  −4.93  0.87  +4.94  1.07  0.00
R_sholder_bone rotate     0.00  0.00  0.27 −10.02  0.80  +8.20  1.07  0.00
R_elbow_bone   rotate     0.00  0.00  0.40 −11.36  0.90  +9.55  1.07  0.00
R_hand_bone    rotate     0.00  0.00  0.60  +8.21  1.07  0.00
```

曲線（Spine 3.8 格式）：

```json
[{"curve": 0.25, "c3": 0.75}, {"time": 0.2667, "x": 39.48, "y": 8.41},
 {"time": 0.5667, "x": -4.17, "y": 6.23, "curve": 0.25, "c3": 0.75},
 {"time": 0.8, "x": -10.34, "y": -24.97}, {"time": 1.0667}]
```

`curve: 0.25, c3: 0.75` 是標準的 ease-in-out；沒寫 curve 的是線性。

### 四件事值得抄

**（a）髖部真的在位移。** `hip_bone` 橫向 +39.5 px，縱向 −25 ~ +8.4。
在 1372 高的角色上約 **2.9% 身高**，而且是**橫向**為主 ——
這是卡通的重心轉移，不是呼吸。**Miami 的角色 idle 位移是 0**，靠的是網格權重推擠。
兩種路線都成立，但讀起來完全不同：Miami 是「站著呼吸」，Le Bandit 是「站不住」。

**（b）軀幹只有 ±1.5 度。** `chest_bone` 是全身最小的通道。
跟 Miami 一樣的原則：**本體小、附屬物大**。

**（c）末端放大 ＋ 相位落後。** 耳朵 ±13–15°、手肘 ±11°、尾巴兩節反向
（`tail_bone_1` +4.51 / `tail_bone_2` −8.85，**父子反向**）。
父骨往一邊、子骨往另一邊，就是尾巴的甩尾。

**（d）關鍵幀刻意錯開。** 峰值時間 0.27 / 0.30 / 0.37 / 0.40 / 0.43 / 0.60 / 0.70 / 0.80 / 0.87 / 0.90
—— 15 根骨沒有兩根同時到位。**1.07 秒這麼短的迴圈，靠錯開才不會像整塊在抖。**

---

## 4. 演出語彙：三招

### （a）一幀交叉淡換圖層

換手臂、換臉、換嘴，全部是兩個 slot 的 color 在 **0.03 秒（一幀）內**對調：

```
welcome:
  R_hand        0.67 ffffffff → 0.70 ffffff00
  bonjour_hand  0.67 ffffff00 → 0.70 ffffffff
```

**不是淡入淡出，是硬切**，只是用 color 通道做。好處是同一根骨可以掛多張圖，
而且切換點精準到幀。

### （b）scaleY = −1 做鏡像

`welcome` 裡 `R_sholder_bone` 與 `R_hand_bone` 的 scale y 走到 **−1.00** ——
整條手臂鏡像翻過去。省掉一整套反向的圖。

### （c）deform 放在臉上

`small_win` 的 `Eyes` deform 最大位移 **121.6**，`lost_mustache` 是 **135.8**。
眼睛只有 8 個頂點，但位移一百多 —— **眼睛是整張臉裡變形最劇烈的東西**。
`Head_grr` 同時 deform 24.3。

---

## 5. 誰決定播哪一段

### 主遊戲中獎階梯（`banditBaseWin`，依 win factor ＝ 贏分 ÷ 押注）

| win factor | 動畫 | publish 的事件 |
|---|---|---|
| **0 – 9.99** | **`loosing_1_stomp`** | `raccoonRaging` |
| 10 – 19.99 | `small_win` | `raccoonDelighted` |
| 20 – ∞ | `big_win` | `raccoonHappy` |
| 70 – ∞ | `big_win`（另一條 filter） | `raccoonHappy` |

**贏不到 10 倍，角色是在生氣的。** 這是整份文件最值得注意的設計決定 ——
它把「小獎」重新定義成「沒中」，用角色的情緒告訴你這不算數。

### 妖精模式（`banditLeprechaunWin`）

| 50 – 99.99 | `leprechaun_win` |
| 100 – ∞ | `leprechaun_win_mondieu` |

### Feature 結束

`>100` → `leprechaun_win_incroyable`；`>30` → `leprechaun_win_mondieu`；
再往下 → `leprechaun_loosing_1` / `leprechaun_loosing_2`。

### 兩道閘

```js
"landscape" === this.appModel.orientation        // 直向完全不演
"west_virginia" != this.casinoModel.jurisdiction // 西維吉尼亞擋掉部分動畫
```

第二條擋的是 `loosing_*` 那幾段與 `big_win_mondieu`。
**推測**是法規不允許對輸家做情緒化演出，或是法文粗話（`merde`、`conneries`）的問題
—— 我沒有查該州的實際條文，這是從被擋的清單反推的。

### 播放參數

```js
new Hr(anim, loop, null, mixMs, null, 0.5, ...)
  idle                   loop=true   mix=500ms
  big_win / *_mondieu    loop=false  mix=500ms
  leprechaun_loosing_1/2 loop=false  mix=200ms
  其餘                    loop=false  mix=null（預設）
  全部第 6 個參數 = 0.5
```

**進出混合 0.5 秒**（Miami 是 0.2 秒）—— 慢一倍，配合這個角色比較鬆的節奏。
輸的那兩段用 200ms，切得比較急。

---

## 6. 自動 idle break：10–19 秒，之後 30–39 秒

`Bandit` 控制器（`main.js` 的 `Vc`）：

```js
setup() {
  this.banditSpine.play("idle", true);
  this._animationTrigger = rng() % 10 + 10;        // ← 第一次：10–19 秒
}

update(dt) {
  this._animationTimer += dt;
  if (this._animationDone && this._animationTimer > this._animationTrigger) {
    this._animationDone = false;
    this._animationTimer = 0;
    this._animationTrigger = rng() % 10 + 30;      // ← 之後：30–39 秒
    if (visible) this.playIdleAnimation();
  }
}

playIdleAnimation(justIdle) {
  base:  justIdle ? "idle"            : baseIdleAnimationMap[random(len)]
  fs_*:  justIdle ? "leprechaun_idle" : bonusIdleAnimationMap[random(len)]
}
```

```
baseIdleAnimationMap  = [lost_mustache, sus_scratch]
bonusIdleAnimationMap = [leprechaun_scratch]
```

**主遊戲從 2 段裡隨機挑，妖精模式只有 1 段。**
`playAnimation` 做的事：`stopAllTracks()` → 播 → 播完自動接 `idle` 並把 `_animationDone` 設回 true。

RNG 是自己實作的 LCG（`seed = 36969*(seed & 0xFFFF) + (seed >> 16)`），不是 `Math.random`。

### 兩個 spine event

| event | 時間 | 遊戲端做什麼 |
|---|--:|---|
| `assScratch` | 1.867s | publish `scratch`（音效）|
| `lepHat` | 1.633s | publish `strapLeprechaunHat`（換裝邏輯）|

**動畫用 event 回頭驅動遊戲狀態**，不是遊戲算好時間去等 —— 帽子什麼時候戴上
由動畫師決定，程式只是聽。

### 位置

```js
banditSpine.object.setPosition(1.3, -0.45, 0.1);
banditSpine.object.object.set_follow(followObject);   // 跟著盤面走
```

---

## 7. 21 段動畫全表

| 動畫 | 長度 | 骨 | slot | deform | 備註 |
|---|--:|--:|--:|--:|---|
| `idle` | 1.07s | 15 | 0 | 0 | 迴圈 |
| `welcome` | 2.07s | 13 | 5 | 0 | 脫帽致意，說 `bonjour` |
| `small_win` | 2.07s | 15 | 4 | 3 | 說 `bien` |
| `bread_win` | 1.97s | 14 | 3 | 2 | 麵包符號專用 |
| `big_win` | 2.53s | 21 | 10 | 3 | |
| `big_win_incroyable` | 2.53s | 21 | 12 | 3 | 說 `incroyable` |
| `big_win_mondieu` | 2.53s | 21 | 12 | 3 | 說 `mondieu` |
| `loosing_1_stomp` | 2.83s | 15 | 5 | 3 | 跺腳 |
| `loosing_2__hat_toss` | 2.53s | 18 | 12 | 2 | 摔帽子 |
| `loosing_3_stomp_on_hat` | **5.43s** | 20 | 14 | 3 | 踩自己的帽子 |
| `lost_mustache` | **7.43s** | 21 | 8 | 2 | 鬍子掉了（最長的一段）|
| `sus_scratch` | 2.73s | 14 | 5 | 0 | 抓屁股，帶 event |
| `leprechaun_hat_on` | 3.33s | 16 | 7 | 0 | 戴妖精帽，帶 event |
| `leprechaun_idle` | 1.07s | 16 | 2 | 0 | 迴圈 |
| `leprechaun_win` / `_incroyable` / `_mondieu` | 2.53s | 24 | 11–14 | 3 | |
| `leprechaun_loosing_1` / `_2` | 2.83 / 2.53s | 17 / 19 | 7 / 14 | 3 / 2 | |
| `leprechaun_scratch` | 2.73s | 15 | 7 | 0 | 帶 event |
| `idle_path_test` | 1.43s | 1 | 0 | 0 | **測試殘留**，用 path constraint，程式 0 次引用 |

### `lost_mustache` 拆一下（7.43 秒的showpiece）

```
mustache_side_bone  rotate    ±179°      translate y → −630.4   ← 鬍子飛出去再掉下來
head_bone           translate 15 個關鍵幀
pupil_bone          translate 12 個關鍵幀   ← 眼珠追著鬍子看
R_elbow_bone        rotate    14 個關鍵幀
[slot] mustache     4.73 ffffffff → 4.77 ffffff00 → 4.87 ffffff00 → 4.90 ffffffff
[slot] R_arm/R_hand 4.57–5.10 之間換了三次手臂圖層
[deform] Eyes       最大位移 135.8
[drawOrder] 1.97 把 Eyes/Pupil 提前 2 層；4.67 再提前 3 層並把 mustache 插進去
```

**七秒半的橋段，動畫師在裡面換了三次手臂、兩次繪製順序、一次鬍子的存在與否。**
這不是「反應」，是一個小短劇。

---

## 8. 沒有驗證的部分

- **沒有實跑過遊戲。** 全部出自檔案。演出看起來對不對、混合 0.5 秒夠不夠順，
  我沒有看過。
- **`west_virginia` 那道閘的理由是推測的**，我沒查該州條文，只看到被擋的清單。
- **`Hr` 建構式的第 4、第 6 個參數**（500 / 0.5）我按位置推斷是 mix 毫秒與某個比例，
  沒有交叉驗證。500 也可能是 track 優先序。
- **`win factor` 的定義**（贏分 ÷ 總押注 vs ÷ line bet）沒有用實錄資料驗證。
- **只抓了 spine 與 atlas，沒抓音效**，所以 `raccoonRaging` 那些事件實際接到什麼聲音不知道。
- `idle_path_test` 我判定是測試殘留（程式 0 次引用），但沒排除它被動態字串引用的可能。

---

## 附錄 · 重現這些數字

```bash
# 完整研究包：原始骨架在 materials/spine/le-bandit/（原機是 Games/le-bandit/assets/1309/1.24.0/assets/default/common/spine/）
python hacksaw-character-motion/scripts/dump38.py materials/spine/le-bandit/raccoon.json idle
python hacksaw-character-motion/scripts/dump38.py materials/spine/le-bandit/raccoon.json lost_mustache
```

程式端在 `Games/_bundles/le-bandit-main.js`，搜：
`raccoon_info.animations`、`playIdleAnimation`、`_animationTrigger`、
`banditBaseWin`、`banditLeprechaunWin`、`west_virginia`、`assScratch`。
