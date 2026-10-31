---
name: slot-motion-recipes
description: >-
  Style-independent recipes for how slot symbols and characters move — symbol idle / win / landing / pop-and-drop
  (消除、掉落、tumble、cascade), win-amount pop-ups, multiplier pulses, and a reel-side character's Spine rig and
  performance (idle, blink, win reaction, feature prop), symbols breaking out of their frame, background ambience,
  feature-intro transitions and big-win screens. Distilled from tearing down Pragmatic Play's Sweet Loot, with every
  number measured from the shipped files and every move checked on rendered contact sheets. Use whenever you design or
  review 獎圖動態、中獎動畫、破框、消除效果、掉落回彈、人物 Spine 骨架或人物動作、背景動態、過場 for any theme, when a
  brief for an animator is needed, or when the user asks why our motion looks cheap / "AI 感" next to a commercial
  game. Pairs with character-pipeline (which tool makes the character) and the per-game meshWin code (which this tells
  what to animate). Also covers tearing down another Pragmatic Play demo (extract → 4.2 skeletons → gallery → contact
  sheets) and contact-sheeting our own Spine exports.
---

# 獎圖與人物動態：可換皮的做法

這份是「怎麼動」的規格，跟主題無關：換成糖果、海盜、埃及、霓虹都照同一套層次與節奏，只換圖與主題色。
要親眼看：逐格表在 `E:\stake\archive\research\sweet-loot\sheets\`（用 Read 開 PNG），或開 launch.json 的
`sweetloot-gallery` 圖庫逐格拖。
數值來源與完整時間軸在 `references/sweet-loot-teardown.md`；要拆別款 PP 遊戲看 `references/teardown-method.md`。
**要動手做（骨頭怎麼擺、權重怎麼畫、曲線怎麼調、我們工具差在哪）先讀 `references/craft-deep-dive.md`**；
獎圖 meshWin 直接用 `scripts/pp_vocabulary.ts`，要把 PP 的動作套到別的 Spine 骨架用 `templates/` ＋
`scripts/analysis/template.mjs`。

核心觀念（全部從拆解數據與消融對照來，不是猜的）：

1. **狀態靠開關圖層，不靠動畫混合。** 每個獎圖是 5 層（Normal / Blurred / Win / Collapse 特效 / 中獎框），
   事件只做「開這層、關那層、換圖層深度」。所以每層的動畫都能獨立做、獨立換皮。
2. **跟隨感靠錯時，不靠物理。** 骨架鏈上每一節用同一組值，關鍵影格往後錯 0.03–0.1s。可預測、可重播、
   在任何播放速度都一致。
3. **立體感靠一根控制骨。** 頭外側放一根 `3d` 骨，臉上的網格以高斯分布加權到它（正中 0.3–0.55、輪廓 <0.1）；
   背面零件用負 mix 的 transform 約束反向跟。動一根骨＝轉頭；東張西望時頭骨本身幾乎不動。
4. **曲線是柔的。** 九成用 Spine 預設把手 `[0.25,0,0.75,1]`（≈smoothstep），關鍵影格全在 30fps 整格、
   win 每 4–8 格一個。我們 meshRig 的三次方 `inOut` 太硬（30% 處只走 11%，PP 走 24%），是機械感的來源之一。
5. **「靈魂」在身體鏈＋破框＋末端手勢＋看向。** 消融對照：只留整體縮放跳動＝廉價貼紙感；
   主節拍和光只是襯底。

---

## 1. 獎圖

### 1.1 結構（每個獎圖都一樣）

| 層 | 內容 | 何時開 |
|---|---|---|
| Normal | idle 動畫（1.5s） | 平常、停輪後、HighlightOff |
| Blurred | 一張模糊靜態圖 | 轉動中 |
| Win | win 動畫（1.5s），onEnable 從頭播 | HighlightOn |
| Collapse | **全遊戲共用一支**爆開特效（0.6s） | 消除 |
| frame | 共用中獎框（0.3s 序列） | 跟 Win 一起 |

中獎時把整個獎圖拉到最上層的圖層（才能超出格子、蓋過鄰格）；結束時放回。
我們的 pixi 版：一個 Container 下 5 個子物件，`visible` 切換＋`zIndex`/換父層，別用 alpha 混。

### 1.2 win 動畫的六層（高獎，1.5s，三拍）

照順序做，前一層沒對之前不要加下一層：

1. **主節拍**：整隻上下彈＋放大，約 0.35s 一拍、1.5s 三拍（0.13 / 0.47 / 0.83 / 1.2s）。
   位移約獎圖高的 ±5%、scale 1→1.08。這一層單獨看就要像「在高興」。
2. **身體鏈錯時**：從腰到頭 3–4 節，每節同值、晚 0.03–0.07s。角度小（-1~+4°），靠錯時出軟度。
3. **假 3D 轉頭**：`3d` 控制骨左右 ±(獎圖寬 6%)、上 18%；背面零件 mix -1、下巴 0.4。見 §3。
4. **末端甩動**：耳朵、帽尾、手 2–3 節鏈，越末端角度越大（9° → 34° → -39°），子節晚 0.07s。
   **軟質物（頭髮、布）用 shear 不用 rotate**（shearX ±12~15），看起來是「晃」不是「轉」。
5. **邊光**：每個美術 slot 複製一份設 additive，alpha 跟主節拍閃（0 → 22% → 0 → 15% → 0）；
   框的 additive 複本更亮（到 60%）。換主題不用重畫光，複本跟著原圖換。
6. **細節**：約 0.27s **單眼 wink**（只換一隻眼的 3 張序列，不是兩眼眨）；把「投在框上的陰影」在 0.17s 淡出、
   結束前淡回 —— 角色看起來從框裡浮出來；sparkle 用 stepped scale 0.6↔1.5 閃。

看逐格表時四個高獎的節奏一樣：**0.14s 先縮（預備）→ 0.27s wink → 0.41s 第一次衝出框 → 回框 →
1.1–1.23s 第二次衝出 → 1.5s 回到 idle 姿勢**。換主題時照抄這個節奏表，只換「衝出框」的方式（猴子探頭、
章魚伸觸手揮刀、鸚鵡張翅）。

### 1.3 破框三明治（高獎能「衝出框」的圖層做法）

框不是一張圖，而是拆成上下左右四條，角色夾在中間，再用 clipping 只裁身體：

```
bg → 框後光 → 框（左、右、上）→ 「角色投在框上的陰影」
   → [clipping 開始：矩形＝框內窗口] 身體、衣服、頭髮 [clipping 結束]
   → 頭、五官、帽子、手上道具（不裁，可以蓋過框）
   → 框（下）← 最後畫，壓住身體下緣
```

- clipping 只要 4 點矩形，`end` 設在最後一個要裁的 slot（hv_3 是 hair）。
- 動畫時頭和道具往上衝會自然越過上框；身體永遠留在窗內，看起來是「從框裡探出來」不是「整張圖放大」。
- 衝出時把框上的投影淡掉，回去時淡回。
- 章魚那種包住框的角色不用 clipping，改成觸手分前後兩組 slot 夾住框。
- 我們的 pixi 網格版同理：身體用 mask 裁、頭與道具放在 mask 外的上層、下框最上層。

### 1.4 低獎與 scatter

低獎只做 1＋擠壓伸展＋一段 flipbook：先蹲（y -4%）、跳（+11%）、落、小彈；
scale 在 (0.88,1.04) 和 (1.06,0.91) 之間跟著跳交替；跳起時腳下陰影淡出。整支 3–10 根骨就夠。
更低的（鉤子、錨）只有整體 scale 脈衝＋小傾斜，三拍，中間一拍最大（0.55s）。
果凍類（骷髏糖）多一個 0.14s 壓扁、0.41s 拉高的 jelly 變形，1.1s 噴一段主題色水花 flipbook。

**Scatter（金幣翻面）**：只有「3D 轉一圈」這種骨架做不到的動作才用預渲染序列 ——
0.2s 先縮到 0.76（預備）→ 0.23s **把骨架做的金幣各層全部隱藏、換成翻轉序列**（側面 → 背面巧克力 → 回正面）→
0.97s 在正面那格把骨架版換回來 → 1.2–1.26 放大、包裝紙鏈條甩動、巧克力滴落序列。
換回點要選序列與骨架剪影一致的那格，接縫才看不出來。光芒（rays）與閃光序列墊在後面。

idle＝同一套骨架縮到極小：位移 1–2px、3d 骨幾 px、耳朵 ±3°、additive 複本只到 12%（呼吸光）。
**idle 不是 win 的慢版**，幅度要小一個數量級。這也符合我們「只動主角、長時間近乎靜止」的要求（見 memory
motion-restraint-pro-feel）：PP 的 idle 在一般距離幾乎看不出在動，只有光在呼吸。

### 1.5 落地

PP 這款的 Spine 有 0.5s 的 land（兩下小跳 +8 / +6px），**但沒用**；落地感全交給掉落曲線（§2.3）。
輪停另有一支 0.75s 曲線可參考：y 0,-15,+5,-10,+3,-5,0；scaleY 0.85,1.05,0.90,1.03,0.95,1（壓扁-彈回遞減三次）。
原則：落地只做一件事（曲線或 Spine 二選一），兩個疊起來會抖。

---

## 2. 消除與掉落（tumble）

### 2.1 時間軸

```
停輪 ──0.4s── 中獎獎圖 HighlightOn（win 一輪 1.5s）＋人物反應
     ──1.5s── HighlightOff
     ──0.5s── Collapse：爆開特效＋同一刻金額飄字
     ──0.45s─ 上方全部同時掉，0.45s 落定（含回彈）
     ──0.2s── 落地 bounce＋落地音 → 判下一輪
最後一輪落定後再等 0.45s 才結算
```

### 2.2 爆開（0.6s，一支共用）

| 時間 | 事件 |
|---|---|
| 0–0.07s | 主題物件（糖球/金幣/寶石…）白閃 alpha 拉滿 |
| 0.13–0.2s | 爆炸序列淡入；主題物件退掉 |
| **0.2s** | **關掉獎圖本體**（此時被特效完全蓋住，看不到「瞬間消失」） |
| 0.2–0.5s | 爆炸序列滿亮播放（15 格約 30fps） |
| 0.5–0.6s | 淡出 |

爆炸疊兩層：原色＋**主題色 70% 的複本墊底**。換主題只改那個色與中心物件，序列可共用。

### 2.3 掉落曲線（最值得直接抄的一條）

- **固定 0.45s，不管掉幾格**；同輪全部同時開始，不逐列錯開。
- 正規化曲線：`0:0 → 0.60:1 → 0.725:0.95 → 0.85:1 → 0.925:0.98 → 1:1`（關鍵影格值）（0.27s 到底；插值後兩下遞減回彈約 6% / 2.5%）。
- 回彈量是「落差的百分比」，掉 2 格的比 1 格彈得高 —— 自動得到重量感，不用另外調。

```ts
// t: 0..1, returns 0..1 of the drop distance
const DROP = [[0, 0], [0.6, 1], [0.725, 0.95], [0.85, 1], [0.925, 0.98], [1, 1]] as const;
// 原始切線與 Hermite 求值函式在 references/sweet-loot-teardown.md §3.3，直接用那個，別自己猜 easing
```

### 2.4 金額飄字

1.25s：scale 0.5 → 1.10（0.08s）→ 0.95（0.33s）→ 0.80；y 往上 40px（0.17s）再慢飄到 120px；
透明度 1.7s 內 0→1（前 2.5%）→ 持平到 75% → 0；0.7s 疊一段閃光。
倍數小字飛向總額：0.3s 出現、0.5s 飛，**先往反方向退 5% 再衝**。

### 2.5 數字脈衝（倍數、計數）

一律 0.25s：1 → 1.5（0.07s）→ 1。持續強調用 1.5s 內三下 1 → 1.3（0.08s）→ 1（0.42s 回）。
大獎標題進場 1 → 1.2 → 1（0.33s），循環時標題 1 ↔ 1.1、底板只 1 ↔ 1.02（底板幾乎不動）。

---

## 3. 假 3D（獎圖與人物共用）

兩種做法，選一：

**A. 控制骨＋加權網格**（hv_3、人物用）
- 頭骨下加 `3d` 骨。臉上每個網格（眼、眉、鼻、嘴、臉、帽）都加權到 `head` 與 `3d`，越靠前的特徵給 `3d` 越多權重。
- 後腦/耳背/背面布加 `3d_back`（或 `bk_3d`），用 transform 約束跟 `3d`，**mix 為負**（獎圖 -1、人物 -0.6）。
- 再後面的軟物（帽布）跟 `3d_back` mix 0.3。
- 動畫只 key `3d` 的 translate。人物 idle ±20px、看旁邊 -42px、慶祝 ±70px。

**B. 控制骨＋transform 約束（不需網格）**（hv_1 用，適合切件圖）
- 一根 `face_25d` 骨，每個五官一條 TC 跟它，**mix＝深度**：帽 0.5、嘴/鬍子 0.5、耳環 0.35、帽細部 0.1、背後布 -0.05。
- 我們的 mascot-rig / spine-generator 都能做 B；加權網格的 A 走 mascot-rig 的網格綁骨。

---

## 4. 人物

### 4.1 骨架層次

```
root
├─ overall_master > overall_master2   ← 整體位移/下蹲/後坐（動作大部分在這兩層）
│    └─ 腰 > 胸1 > 胸2 > 胸3            ← 呼吸（胸 scaleY 1.04）、錯時 0.1s
│         ├─ 上臂 > 前臂 > 手掌         ← 三節，關鍵影格各晚 0.1s
│         └─ head > 3d / 3d_back、鬍子鏈、帽布鏈、嘴唇群、眉毛
│    腿：兩條 IK（目標骨掛在 overall_master，腳才能踩住）
├─ 地面陰影 slot 直接掛 root             ← 人物跳起時陰影留在地上、只縮放淡化
├─ 道具骨架（砲台等）                   ← 同一個檔，見下
└─ 道具特效骨（金環、星星、糖球）
```

**一個骨架檔、兩個播放實體**：人物與砲台在同一個 Spine 檔，但場景裡放兩個 controller。人物的每支動作在
t=0 把砲台所有 slot 設成空；砲台的每支動作把人物所有 slot 設成空。好處是共用一份 atlas、座標天生對齊，
又能把砲台單獨提到盤面上層（發射時要蓋過獎圖）而人物留在後面。我們要做「角色＋會換層的道具」時照做。

**表情不換整張臉**：
- 嘴型靠 25 骨加權的嘴唇網格（14 組小骨），笑、張嘴、抿嘴都是骨頭推出來的，不畫多張嘴。
- 只有「笑到眼睛瞇起來」換圖：`eye_close` 在 0.27s 換上、1.1s 換回（win_1），同時把眼睛高光 slot 關掉。
- 網格變形（deform）只用在三處：**跟著轉頭移動的陰影網格**（鼻影、臉影——轉頭時陰影要跟著換位，否則立體感破功）、
  衣領布料壓縮、落地時鞋子壓扁。其餘全部骨架驅動。

### 4.2 動作清單與數值

| 動作 | 長 | 怎麼做 |
|---|---|---|
| idle（循環） | 1.667s | 整體下沉 6px、胸 scaleY 1.04、手三節 2°/6°/5° 錯 0.1s、頭 1.3°、3d -20px |
| idle_eyeblink | 同 idle | **與 idle 每根骨完全相同**＋眨眼＋眉毛 ——可在循環邊界無縫替換 |
| idle_break | 2× idle | 前後與 idle 相同，中間 3d 大幅看左右（-42 / +18、抬 53）——「東張西望」 |
| win（小反應） | 1.667s | 0.15s 轉頭 → 0.3s **先蹲 16px＋身體轉 3.75°、劍收到胸前（預備）** → 0.45s 舉劍到 -34°＋笑瞇眼 → **停 0.64s**（0.53–1.17，頭跟著點）→ 收 |
| win_2（大慶祝） | 2.833s | 0.37s 蹲 → 0.49s 起跳 → 0.62s 最高點單腳踢（腿 IK 51px）、**地面陰影不動** → 0.74–0.86s 落地鞋子壓扁 → 1.1–2.7s 舉劍晃身＋瞇眼 → 收 |
| 道具 in / loop / out | 0.5 / 1.333 / 0.733 | 道具自己的骨架 |
| 道具發射 | 1.333s | 人物 0.12–0.24s 縮頭瞇眼（預備）→ 0.36s 劍往前指「開砲」、身體後仰 19px → 停到 0.97s → 收 |
| 砲台擊發 | 2.667s | 0.46s 糖球出膛＋閃光 → 0.58–0.93s 煙霧拖尾 → 其餘時間砲台靜止 |

設計重點：
- **動作的「停」是做出來的**：win 的舉手在最高點 hold 0.64s，比動的時間還長。這是「像專業動畫」的關鍵。
- **變化版一定從 idle 同一姿勢進出**（第一與最後一格相同），才能隨時切。
- 預備動作方向與主動作相反（先下才上、先退才衝）—— 飄字、倍數飛行、人物都一樣。

### 4.3 狀態機（排程）

```
idle(循環) ──任何中獎── win(一次) ─(win 長度後 reset)─▶ idle
            └ +0.2s 開場景特效（糖果雨 3.33s）
tumble 回合開始 ── 道具 in → 道具 loop
有倍數時 ── 道具提到盤面上層 → 1.5s 後人物＋道具發射 → 2.8s 人物回 idle → 4.0s 道具回 loop、層級放回
     快轉：去掉 1.5s 前置，2.67s 收
tumble 回合結束 ── 道具 out（0.733s）→ 關道具
```

- 反應動作用 NoWait 播，**另排一個「reset」在動作長度後切回 idle 循環**，不依賴 Spine 的 complete 事件。
- PP 這款沒有排程 eyeblink / idle_break（素材做了沒用）。我們要自己排：每 2–4 個 idle 循環隨機換一次 eyeblink，
  每 15–25 秒一次 idle_break，都在循環邊界切。

---

## 5. 場景、過場與大獎

**背景環境動畫**：底遊戲背景一支 **20 秒**循環（FS 16 秒、超級 FS 8 秒，越刺激越短）；樹葉與裝飾每條旋轉
timeline 約 19–23 個關鍵影格（≈每秒一個，不規則，不是一條正弦）；**中位擺幅只有 4–5°、位移 9–16px**。
頂部糖果柱的條紋滾動一圈 23–47 秒。看逐格表幾乎看不出在動 —— 這就是「背景活著但不吵」的量級，比我們之前
做的短週期晃動慢 5–10 倍。

**FS 進場過場（1.333s，一段迷你短片）**：
1. 0–0.24s 鏡頭推過一層水/冰（前景遮蔽物）
2. 0.36s 揭露場景：洞窟裡的角色與砲台
3. 0.73–0.97s 砲台蓄力、開火閃光
4. 1.09–1.33s **主題物件（糖果、金幣）朝鏡頭飛來塞滿畫面** —— 用來遮住切換場景的那一瞬間

換主題：前景遮蔽物＋角色動作＋「朝鏡頭飛的主題物件」三段都能換，結構不變。

**大獎（Nice / Superb / Mega / Sensational）**：每級都是 in 1s / loop 2s / out 1s。
in＝海浪由下往上捲過全螢幕（0.09–0.55s）後露出一整幅慶祝場景；out 倒過來由海浪洗掉。
四級共用同一組場景與轉場，只換標題字與裝飾量。

**FS 標題牌進場（1s）**：0–0.33s 牌子從 0 跳到 1.11（底板先到）→ 0.63s 回 0.97 → 1.0；
文字層晚一拍（0.33–0.67s 淡入）；牌上的小裝飾在 0.43s 之後才開始動。先底板、再字、最後裝飾。

---

## 6. 換皮檢查清單

做任何新主題的獎圖或人物時：

1. 獎圖 5 層都有嗎？Collapse 與中獎框是共用一支，不是每個獎圖各做一支。
2. win 是不是三拍、1.5s？主節拍單獨看就有情緒嗎？高獎有沒有破框三明治（身體裁在框內、頭與道具在框外）？
3. 鏈上每節是否同值錯時（0.03–0.1s），而不是每節各自亂 key？
4. 高獎有沒有假 3D（A 或 B）？背面零件是反向嗎？
5. additive 複本有沒有跟節拍？idle 的光有沒有壓到 ~12%？
6. 消除：本體是在特效蓋住時（約 0.2s）才關嗎？爆炸有主題色墊底層嗎？
7. 掉落：固定 0.45s＋兩下遞減回彈？同輪同時？
8. 人物：idle 變化版首尾與 idle 相同？反應動作有預備與 hold？reset 有排？
9. 動的只有主角嗎？框、邊條、裝飾是否不動（memory motion-restraint-pro-feel）？
10. 人物跳起時地面陰影留在地上嗎？轉頭時臉上的陰影跟著移嗎？
11. 背景循環是不是 ≥15 秒、擺幅 ≤5°？
12. 離線出逐格圖自己看過再交（數字全對、畫面還是錯的情況發生過，見 character-pipeline）。

---

## 7. 工具

Node：`E:\stake\tools\node-v22.23.1-win-x64`。

- `scripts/pp_extract.mjs <研究資料夾> --base <資產網址>`：PP demo 一條龍——合併分塊 JSON、取出全部貼圖、
  解出 Spine 3.7、從 UIAtlas 重建 atlas、轉成 4.2（含 deform、顏色曲線、transform 約束 mix 改名；
  Luxor 那支舊轉換器漏了這三項，假 3D 的負 mix 會被讀成 1）。
- `scripts/gallery_server.mjs <研究資料夾> [port]` ＋ `scripts/gallery.html`：動作圖庫。選骨架/動作、拖時間軸、
  顯示骨頭、隱藏 additive、**輸出逐格表 PNG 到 `<研究資料夾>/sheets/`**（存檔後用 Read 直接看圖）。
  資料夾沒有自己的 gallery.html 時自動用模板。用 preview_start 開（launch.json 有 `sweetloot-gallery` 可照抄）。
  我們自己做的 Spine 4.x 也能丟進 `spine-42/`＋`spine-index.json` 用同一個圖庫出逐格表檢查。
- `scripts/spine_motion.mjs <skeleton.json> [動作名片段]`：列出每根骨每種 timeline 的關鍵影格時間、數值範圍與序列，
  slot 的換圖與顏色。拿來量任何 Spine JSON（PP 的 3.7、我們的 4.x 都可），也能拿來檢查自己做的動作有沒有錯時、幅度對不對。
- `scripts/pp_cat_probe.js`：貼到 PP demo 頁（瀏覽器工具的 javascript_tool）後得到 `window.__pp`，讀線上場景的
  事件表（CAT）、Spine 設定、動畫曲線，並可錄時間軸。用法見 `references/teardown-method.md`。
- 圖庫頁面的 JS（`window.__gallery`）：
  - `compare([{label, tweak?, noAdd?}], n)`：**消融對照**，每列關掉一個手法（`tweak: s => freeze(s, b => /^3d/.test(b.data.name))`）
  - `trails(['bone', ...], t)`：在 t 的姿勢上畫骨頭的世界軌跡，每點一格 —— 點距就是 easing、迴圈就是錯時
- `scripts/analysis/`（`RESEARCH=<拆解資料夾>`，讀 `spine-42/` 的 4.2 骨架，不需要貼圖）：
  - `anatomy.mjs`：骨位（以框高 U 為單位）、win 時每根骨的位移/旋轉幅度、切件分類、網格與權重
  - `weights3d.mjs <骨架> <控制骨> [head] [背面骨]`：假 3D 控制骨的權重 vs 距頭中心，輸出熱圖
  - `curves.mjs`：30fps 格點、貝茲把手、hold、反轉、過衝、保體積統計
  - `lag.mjs <骨架> <動作>`：取樣互相關量每條鏈的落後與幅度比
  - `template.mjs extract|apply`：按角色抽動作範本／套到別的骨架（`templates/` 有 Sweet Loot 抽好的）
- `scripts/pp_vocabulary.ts`：PP 的曲線、三拍時間表、錯時鏈、假 3D 權重（`lookPart`）、節拍邊光，給 meshWin 用。

Sweet Loot 的逐格表在 `E:\stake\archive\research\sweet-loot\sheets\`（77 張：全部獎圖、人物、特效、大獎、過場，
以及消融對照、軌跡、臉部特寫、範本套用驗證）。
