# Sweet Loot（Pragmatic Play, `vs20stopbnnza`）拆解數據

2026-10-30 從公開 demo 拆。原始資料：`E:\stake\archive\research\sweet-loot\`
（`raw/` 下載檔、`merged/` 合併後 JSON、`spine/` 解碼後 23 個 Spine 3.7 骨架、`spine-index.json` 動作時長）。
時間來源：靜態 = Spine 關鍵影格 / Unity AnimationClip；CAT = 線上元件的事件表（delay 是**從事件開始算的絕對秒數**，
不是累加）；實測 = 掛 `Time.time` 錄的時間軸（瀏覽器面板 rAF 被節流，精度約 0.1s，只看先後與大致間隔）。

遊戲：6×5 盤面＋上方 4 格橫向「Top Reel」，scatter pays＋tumble；FS 中砲台把倍數打到盤面。

---

## 1. 獎圖（symbol）預製體結構

每個獎圖一個 prefab，底下 5 個圖層用「開關顯示」切狀態，不靠動畫混合：

```
S05
├─ CAT（狀態事件表）
└─ content            V3Animator（落地彈跳，本作 from=to=0，實際無作用）
   ├─ Normal          Spine idle（1.5s，onEnable 播一次或循環）
   ├─ Blurred         靜態模糊圖（轉動中）
   ├─ Win             Spine win（1.5s，onEnable 播）
   ├─ Collapse        共用特效 Spine `swpl_symbol_overlay`（爆開）
   └─ frame           共用特效 Spine `swpl_win_frame`（中獎框）
```

CAT 事件（S05，hv_3 猴子）：

| 事件 | 動作 |
|---|---|
| Set Normal | 開 Normal；關 Blurred/Win/Collapse/frame |
| Set Blurred | 開 Blurred（轉動中） |
| HighlightOn → Set Winning | 圖層切到最上層 (mask 131072)；開 Win＋frame；播該圖案的中獎音 |
| HighlightOff | 回 Set Normal、圖層回原位 |
| Collapse | 0s 開 Collapse 特效、同時 Set Normal；**0.2s 關 Normal（本體在爆炸遮住時消失）**；0.5s 關特效；0.51s 回報結束；播 vanish 音 |
| boop-it | 掉落開始時觸發；+0.2s 播落地 bounce；播 tumble 音 |

Scatter（S01）多一個 `excited`：Set Winning 0.333s 後回 Normal ——「閃一下」用的短版中獎。

Top Reel 獎圖的 Cascade：0s 特效、0.25s 關本體與倍數字、0.467s 關特效並把倍數字放回來。

### 每個 Spine 獎圖的動作

所有獎圖都是 `idle 1.5s / land 0.5s / win 1.5s`。**land 在這個 build 沒被任何 CAT 用到**（落地感改由 tumble 曲線的回彈負責）。

---

## 2. 中獎動作（win 1.5s）配方 —— 高獎 hv_3（猴子）

骨架 34 骨、99 網格（85 加權）、42 個 additive slot、3 個 transform 約束。

**骨架鏈**：`root > land > monkey_all > land3 > land4 > land5 > head > 3d`，每一節同樣的值、關鍵影格時間往後錯
（land3 0.13 → land4 0.17 → land5 0.20 → head 0.27s）＝**跟隨/重疊動作靠「錯時」不是靠物理**。

| 層 | 做法 | 數值 |
|---|---|---|
| 主節拍 | monkey_all 上下彈＋放大 | y ±14、scale 1→1.08，節拍點 0.13/0.47/0.83/1.2s（約 0.35s 一拍，1.5s 三拍） |
| 身體鏈 | land3~5 小轉動＋位移，錯時 0.03–0.07s | rot -1~+4°，tx ±7~9 |
| 頭 | 轉＋位移＋擠壓 | rot -9~+6°，scale 0.96–1.07 / 0.97–1.14 |
| **假 3D 轉頭** | `3d` 骨位移，臉上所有網格都加權到 head+3d（2–3 骨） | x -15~+14、y 到 +47 |
| 背面零件 | `bk_3d` 用 transform 約束 mix **-1** 反向跟 3d；下巴 land13 mix 0.4 | |
| 耳朵/帽尾 | 2 節鏈旋轉，子節晚 0.07s | ±18~25° |
| 頭髮/布 | **shear** 鏈（不是 rotate）做軟質晃動 | shearX -15~+12 |
| 手臂 | 3 節鏈，越末端角度越大 | 9° → 34° → -39° |
| 邊光 | **每個美術 slot 都有一個 additive 的複本 `xxx2`**，alpha 跟節拍閃 | 0 → 22% → 0 → 15% → 0（0.4s/0.87s/1.33s 峰值） |
| 框亮 | 框的 additive 複本 | 0 → 64% → 0 → 59% → 26% → 60% → 0 |
| 離框 | 「投在框上的陰影」slot 在 0.17s 淡出、1.33s 淡回 | 角色看起來從框裡浮出來 |
| 眨眼 | 3 張眨眼圖序列 | 0.17–0.37s |
| 閃光 | sparkle 骨 scale 0.61↔1.46 stepped | |

**idle（1.5s）**＝同一套骨架的極小版：monkey_all y -2、3d x -7~+4、耳朵 ±3~4°、additive 複本 alpha 只到 12%（呼吸光），
「投在框上的陰影」在 0.73s 淡出又淡回。

**land（0.5s，未使用）**：y +8 → 0 → +6 → 0 兩下小跳，耳朵 ±13~15°。

### hv_1（另一種假 3D）

不用加權網格，改一根 `face_25d` 控制骨，各五官用 transform 約束跟著，**mix 值＝深度**：
帽子 0.5、嘴唇/鬍子 0.5、耳環/舌頭 0.35、帽子細部 0.1、背後布 **-0.05**（反向）。
win：face_25d x -42~+32；頭 rot -14~+6°、scale 到 1.17；整體 scale 0.97→1.04→1.06。

### 低獎 lv_3（10 骨、3 網格）

- 主體跳：y -15 → +41 → -7 → +18 → 0（先蹲、跳、落、小彈）
- 擠壓伸展與跳同步：scale (0.88,1.04) → (1.06,0.91) → … → (0.85,1.14) → (1.08,0.91)
- 小轉動 ±5°、細部 ±6~10°
- 一段 flipbook 閃光（0.37–0.8s，13 格）＋一段水花 flipbook（1.03–1.5s，14 格）
- drop_shadow 跳起時淡出（0.17→0.33）、落地前淡回（0.93→1.1）

### 各骨架手法分布

| 骨架 | 骨 | 網格(加權) | additive | TC | IK | 有 3d 骨 |
|---|---|---|---|---|---|---|
| hv_1 | 65 | 85(79) | 38 | 9 | 1 | face_25d |
| hv_2 | 40 | 57(51) | 5 | 2 | 2 | ✓ |
| hv_3 | 34 | 99(85) | 42 | 3 | 0 | ✓ |
| hv_4 | 43 | 80(74) | 42 | 7 | 0 | ✓ |
| lv_1 | 15 | 13(13) | 9 | 1 | 0 | ✓ |
| lv_2 | 8 | 10(8) | 10 | 1 | 0 | ✓ |
| lv_3~6 | 3–10 | 0–7 | 0–3 | 0 | 0 | |
| 人物 | 152 | 97(51) | 34 | 3 | 2 | ✓ |

→ 高獎＝加權網格＋假 3D＋additive 複本；低獎＝少骨擠壓跳＋一段 flipbook。

---

## 3. 消除（tumble）流程

### 3.1 時間軸（實測＋CAT）

```
t=0      輪停（所有輪同一刻停、各獎圖 Stop 事件）
+0.4     SpinEnded → TumblingManager「Tumble Start」→ 人物 Cannon_in（FS 才有砲台）
+0.7     中獎獎圖 HighlightOn（win 1.5s＋中獎框）、人物 win、0.2s 後糖果雨
+2.17    HighlightOff（約播完一輪 win）
+2.67    下一個 cascade：中獎獎圖 Collapse ＋ 同一刻金額飄字 Show
+3.07    （cascadingDuration 0.45 後）上方所有獎圖同時開始掉，新獎圖從上面補
+3.17    「boop-it」→ 落地 bounce、tumble 音
```

TumblingManager 線上值：`cascadingDuration 0.45`、`delayBetweenTumbles 0`、`delayAfterFinalTumble 0.45`、
`smallWinTumblingDuration 0.583`（tumble 中小獎的跑分時間）。

### 3.2 爆開特效 `swpl_symbol_overlay`（0.6s，共用一支）

1. 0–0.2s：一顆糖球（主題物件）白閃——alpha 0.07s 拉滿、0.13s 開始退、0.2s 消失；第二層同圖 42% 稍早出現
2. 0.13–0.6s：爆炸 flipbook（15 格，約 30fps），0.13→0.2s 淡入、0.5→0.6s 淡出
3. 爆炸疊兩層：白色原色＋**主題色 #71276d 70% 的複本**墊底（換主題只換這個色）
4. 本體在 0.2s（被特效完全蓋住時）關掉

### 3.3 掉落曲線 `SymbolTumbler_GRM`

- **固定時長 0.45s，不論掉 1 格(130px)或 2 格(260px)**；同一輪全部同時開始（不逐列錯開）
- 曲線（正規化時間 → 位置比例）：

```
0     : 0
0.60  : 1.00   (0.27s 到底，入切線陡 = 加速落下)
0.725 : 0.95   第一彈（關鍵影格 5%，插值後最低約 0.94）
0.85  : 1.00
0.925 : 0.98   第二彈（插值後最低約 0.975）
1.0   : 1.00
```

回彈量跟落差成正比，掉得越遠彈越高 —— 免費得到「重量感」。

原始 Unity AnimationCurve（time, value, inTangent, outTangent），要逐點還原就用 Hermite 插值：

```
(0,     0,    -0.017, -0.017)
(0.6,   1,     5.059, -2.330)
(0.725, 0.95,  0,      0    )
(0.85,  1,     2.034, -1.792)
(0.925, 0.98,  0,      0    )
(1,     1,     1.709,  0.667)
```

```ts
// Unity-style Hermite between keys a and b (tangents are dvalue/dtime).
function evalCurve(keys: [number, number, number, number][], t: number) {
	for (let i = 0; i < keys.length - 1; i++) {
		const [t0, v0, , out0] = keys[i], [t1, v1, in1] = keys[i + 1];
		if (t > t1) continue;
		const dt = t1 - t0, s = (t - t0) / dt, s2 = s * s, s3 = s2 * s;
		return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * out0 * dt + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * in1 * dt;
	}
	return keys[keys.length - 1][1];
}
```

### 3.4 金額飄字（MarioFloatingText）

- Content：`MarioShowLineWin` 1.25s —— scale 0.5 → 1.10(0.08s) → 0.95(0.33s) → 0.80(1.25s)；y 0 → 40(0.17s) → 120(1.25s)
- 透明度：1.7s 內 0 → 1（2.5%）→ 1（75%）→ 0
- 0.7–1.32s 疊一段 `swpl_amount_fx` 閃光
- 倍數小字 pos1–4：0.3s 出現、0.5s 飛向目標（曲線 0 → -0.05(42%) → 1，**先往反方向退 5% 再衝**）

### 3.5 其他 UI 動畫片段

| 片段 | 用途 | 曲線 |
|---|---|---|
| symbolStopping_new | 輪停落地 | 0.75s：y 0,-15,+5,-10,+3,-5,0；scaleY 0.85,1.05,0.90,1.03,0.95,1 |
| labelPulseAnim | Top Reel 中獎倍數 | 1.5s 內三下：1 → 1.3（0.08s）→ 1（0.42s） |
| MultiplierAddPulse / Merge | 倍數加上去 | 0.25s：1 → 1.5（0.07s）→ 1 |
| epicWinTitle / Loop | 大獎標題 | 進場 1→1.2→1（0.33s）；循環標題 1→1.1→1、底板 1→1.02→1（0.67s） |

倍數合併序列（RSMultiplierVisual.MergeMultiplier）：+0.15 音效 → +0.5 數字與倍數同時飛 → +0.63 關「×」號 →
+0.8 合併並播 Merge 脈衝。

---

## 4. 人物（海盜）

### 4.1 骨架

```
root
├─ overall_master > overall_master2 > shirt > shirt3 > shirt2
│     ├─ shirt5 > right_aram > right_forehand > plam
│     ├─ shirt6 > 左手兩條鏈、衣領鏈
│     └─ head > 3d、3d_back、鬍子鏈(4 節)、帽布鏈、嘴唇 14 組、眉毛、臉頰
│  pant/pant2 > 腿（兩條 IK：right_leg_ik、target_left_leg）
├─ ca_overall_master …  砲台（同一個骨架檔裡，另一個 SpineController 播）
└─ cannon_hit_fx …       砲擊特效（金環、星星群、糖球）
```

- 152 骨、97 網格（51 加權）、34 additive
- **假 3D 頭**：臉上 17 個網格加權到 `3d`（嘴唇網格綁 25 骨）；`3d_back` 用 TC mix **-0.6** 反向跟 3d；
  帽布兩段再以 mix 0.3 跟 3d_back。動一根 `3d` 骨 = 臉轉向、後腦往反方向、帽布慢半拍
- 場景擺位：Character 整體 scale 0.8，盤面右側

### 4.2 動作與數值

| 動作 | 長 | 重點 |
|---|---|---|
| idle（循環） | 1.667 | 整體 y -5.8；胸 scaleY 1.04（呼吸）；右手三節 -2.2° / -6.4° / -4.9°，關鍵影格各晚 0.1s；頭 rot 1.3°、3d x -20（微看）；嘴巴微動 |
| idle_eyeblink | 1.667 | 與 idle 完全相同＋眉毛 0.17–0.5s 動一下＋眨眼（可無縫替換 idle） |
| idle_break | 3.333 | 兩個 idle 長度；3d x -42~+18、y +53 ——「東張西望」 |
| win_1 | 1.667 | 0.3s 先下蹲 y -16＋身體轉 3.75°（預備）→ 右手抬到 -34° **在 0.53–1.17s 停住** → 收；頭 ±10~12°、3d 甩 |
| win_2 | 2.833 | 大慶祝，腿 IK 踢 51px；本 build 沒用到 |
| canon_in / loop / out | 0.5 / 1.333 / 0.733 | 砲台推入、待命循環、退出 |
| canon_blast | 1.333 | 人物：0.17s 下壓 y -16 → 0.4s 後坐 x -19；手前臂 -14° → +17°；砲台同時播 `hit_one_time` |

### 4.3 觸發（狀態機）

- **任何中獎都播 win_1**：`XTVariable2CAT` 監看 `SpinCycleWinDisplayed > 0` → Character CAT「win」：
  win_1 ＋ 0.2s 後糖果雨（3.33s）＋ 1.667s 後「reset」切回 idle 循環
- tumble 回合開始 → `Cannon_in`：開砲台、播 canon_in，0.5s 接 canon_loop，0.8s 關進場特效，同時背景播 Cannon_in
- tumble 回合結束 → `Cannon_out`：canon_out，0.733s 關砲台
- 伺服器回傳有倍數（`lmi`）→ 一般速 `blast`：1.0s 把砲台圖層提到盤面上 → 1.5s 人物 canon_blast＋砲台 hit_one_time →
  2.833s 人物回 idle → 4.0s 砲台回 loop、圖層放回去；快轉 `BLASTFAST`：同一串去掉 1.5s 前置，2.667s 收
- idle_eyeblink / idle_break 在場景與程式都沒排程（可能是被砍掉的功能）——我們做時要自己排
