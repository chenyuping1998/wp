# Soul Seal — 生成提示詞

還缺的符號：**L5 / M / C / S**。

用法：把 §1 的 STYLE 區塊原封不動貼在前面，再接 §3 裡對應那一顆的 SUBJECT 區塊。
STYLE 每次都要帶，那是讓新圖跟已交付的 A K Q J / 狐面 / 陰陽牌長得像同一套的唯一辦法。

---

## 1. STYLE（每次都貼）

```
Casino slot machine symbol icon, single centered subject on a PURE BLACK
background (#000000), square 1:1 composition.

Style: painterly digital illustration, semi-realistic, highly detailed, glossy.
Ornate gold metalwork with fine filigree scrollwork. Polished bevelled edges
with strong rim lighting and specular highlights. Inset gemstones (ruby red,
emerald green, amethyst purple). Rich saturated palette: royal purple, deep
crimson, antique gold, jade green, bronze. Soft coloured aura glowing behind
the subject. East Asian mythological motifs — stylised clouds, scrollwork,
lacquer.

Lighting from upper left, warm. Deep shadows, high contrast against the black.
Clean silhouette, no cropping — the whole subject is inside the frame with a
small margin on every side.

Absolutely no text, no letters, no Chinese characters, no Japanese characters,
no watermarks, no borders around the image itself.
```

**為什麼要求純黑底**：`design/import_symbols.mjs` 從邊界 flood 找 matte 再還原 alpha。
黑底是它最擅長的情況，已交付的九張都是黑底，去背結果乾淨。
給白底或透明底都會走到別的路徑，結果比較差。

---

## 2. 剪影分配（重要，不要偏離）

已交付的四個中分符號剪影**兩兩重複**：

| 符號 | 剪影 |
|---|---|
| H1 狐面 | 圓角方框 |
| H2 摺扇 | 圓角方框 |
| H3 陰陽 | 正圓 |
| H4 銅鈴 | 正圓 |

盤面上快速掃視時，方框跟方框、圓牌跟圓牌會糊在一起。
所以剩下的符號**一律不做方框、不做圓牌**：

| 符號 | 指定剪影 | 理由 |
|---|---|---|
| M 載體妖 | **直立、不規則、無外框** | 要能一眼跟中分符號分開 |
| C 道姑 | **直立人形、無外框** | 收集者要最顯眼 |
| S Scatter | **垂直長條，下緣不規則** | 跟其他都不像 |
| L5 | 跟 A K Q J 一樣的立體字 | 低分要成組 |

---

## 3. 各符號的 SUBJECT

### L5 —「10」

```
SUBJECT: The number "10" as a single ornate three-dimensional emblem.
Thick polished gold bevelled outline with a deep sapphire-blue enamel fill,
carved with fine floral relief patterns inside the strokes. A soft blue glow
behind it. The two digits slightly overlap so the pair reads as one solid
emblem rather than two separate characters. No frame, no plaque, no background
panel — just the numerals floating on black.
```

**驗收**：跟 A K Q J 並排時，厚度、金屬邊寬度、發光強度要一致。
`10` 比單字元寬——**不要為了對齊寬度把字級縮小**，寧可讓兩字重疊。
藍色是刻意的：A 紅紫 / K 綠 / Q 紫 / J 紅金，藍是唯一還空著的色相。

---

### M — 載體妖（carrier）

**這顆最重要，而且有一個硬性版面需求。**

```
SUBJECT: A small mischievous spirit creature, floating upright, facing the
viewer three-quarters. Rounded, plump, harmless and slightly comical — this is
something that gets captured, not something frightening. Wispy smoke-like lower
body trailing downward instead of legs. Large glowing cyan eyes. Pale
blue-white translucent body with a soft cyan aura.

Across its chest hangs a BLANK vertical paper talisman — plain warm yellow
paper (#F2D544), slightly weathered with singed corners, held by a thin cord.
The talisman must be COMPLETELY EMPTY: no writing, no symbols, no characters,
no decoration inside it. Flat, evenly lit, unobstructed, occupying roughly the
lower third of the icon and at least 45% of the icon's width.

No frame, no plaque, no circular border.
```

**空白符紙是硬性需求**：金額由程式在執行時畫上去（面額 19 階，`0.5x` 到 `1000x`），
符紙上任何既有的紋樣或文字都會跟數字疊在一起。

**驗收**：
- 符紙區域拿一支粗黑筆寫 `1000x` 上去，還讀得出來嗎？讀不出來就是太小或太花。
- 青色靈光要跟 H1 狐面的綠眼**明顯不同色相**（狐是黃綠，妖是青藍）。
  並排比對，分不出來就重做。

---

### C — 道姑（collector）

**一張，不是三張。**

早期規劃是三階（小道士／道長／天師）依倍數換圖。已取消：
參考作用一張圖做完同樣的事，倍數數字本來就把資訊講完了，
而三張必須共用輪廓的人物是三倍的工、也是三倍出錯的機會。

```
SUBJECT: A young female Taoist exorcist standing upright, facing the viewer,
three-quarter view, full body from head to mid-calf. Long flowing white hair.
Calm confident expression, mid-action. She holds an ornate gourd flask forward
in her right hand, mouth of the gourd angled toward the viewer as if about to
draw something in. Indigo and black silk robe with gold-thread cloud and
thunder patterns, wide ceremonial sleeves. Wisps of pale captured spirit-light
curling out of the gourd's mouth. Warm golden aura behind her.

No frame, no plaque, no circular border — the figure stands free on black.
Leave the lower quarter of the icon visually simple: no busy hem decoration,
no props below knee height.
```

**下緣要留乾淨**：倍數數字（×1 到 ×20）由程式畫在符號下緣，
用金色 `#D9A85C`——**不是**符紙黃。道士的倍數是乘數不是錢，色彩上要跟金額分開。
下擺太花的話數字會讀不出來。

**跟已交付的 W（鳥居巫女）要能分辨。** 兩張都是白髮女性——
W 是**框在鳥居裡的肖像**，C 是**站在黑底上的全身人物、手持葫蘆**。
框 vs 無框、半身 vs 全身，這兩個差異要拉開。

---

### S — Scatter

```
SUBJECT: A single ceremonial paper talisman scroll hanging vertically, seen
straight on. Warm yellow aged paper with a torn, ragged, uneven bottom edge.
Ornate gold cloud-motif capping along the top edge, from which it hangs. The
paper surface carries an intricate abstract seal pattern — swirling lines and
geometric knotwork, NOT writing, NOT characters of any language. A bright
golden halo radiating outward, and small floating embers around it.

Tall narrow proportions, no frame, no plaque.
```

**驗收**：紙面上的紋樣必須明顯是**抽象裝飾**而不是文字。
生成模型很容易自己加上看起來像漢字的東西——一旦出現就重生成，
`design/check_no_cjk_art.mjs` 擋得住程式碼裡的漢字，擋不住烘進圖片的。

---

## 4. 拿到圖之後

```bash
cp 新圖.png E:/stake/wp/apps/SoulSeal/design/source/symbols/
```

檔名就是符號代號（`l5.png` / `m.png` / `c.png` / `s.png`），
然後：

```bash
node design/import_symbols.mjs E:/stake/tools/gen
```

去背、裁切、縮到 200×200 都是自動的。
匯入後 `design/generate_placeholders.mjs` 的 `SUPPLIED` 集合要把新檔名加進去，
否則下次跑佔位圖產生器會蓋掉真美術。

---

## 5. 噴符咒（取代噴金幣）

大獎時噴出的粒子目前是金幣（`static/assets/sprites/coin/SD2_Coin.json`，
12 格 Y 軸旋轉序列）。要換成黃色符咒。

### 先看清楚那 12 格是什麼

| 格 | 寬 | 高 |
|---|---|---|
| 1 | 487 | 487 |
| 2 | 469 | 487 |
| 3 | 391 | 487 |
| 5 | 267 | 487 |
| 4 | **81** | 487 |

高度恆定、寬度收縮到 81 再展開——**這是繞垂直軸旋轉的壓縮序列**，不是 12 張畫。

### 所以只生成一張

叫生成器產 12 格，它會給你 12 張不同的符咒。旋轉序列用程式從單張算出來，
那本來就只是水平縮放加一片側面。

**貼 §1 的 STYLE，再接：**

```
SUBJECT: A single rectangular paper talisman charm, seen straight on, flat,
filling the frame. Warm golden-yellow aged paper (#F2D544) with subtly frayed
edges and faint fold creases. A narrow ornate gold border runs around the
rectangle. The paper surface carries an abstract decorative seal pattern —
swirling lines and geometric knotwork, NOT writing, NOT characters of any
language. Slight glossy sheen, warm rim light along the top edge.

Perfectly flat and front-facing, no perspective, no tilt, no rotation.
Tall rectangular proportions, roughly 2:3 width to height, centred.
```

**驗收**：
- **必須完全正面、零透視。** 有一點傾斜，旋轉序列就會歪掉。
- 紋樣必須明顯是抽象裝飾，不是文字。生成模型很愛自己加上像漢字的東西。
- 亮度要撐得住縮到 81px 寬——太暗的細節在側面那幾格會整片糊掉。

### 拿到之後

存成 `design/source/fx/talisman.png`，然後跑產生器把 12 格序列與 atlas 生出來
（`design/generate_talisman_spin.mjs`，**尚未寫**）。

它要做的事：
1. 讀單張正面圖
2. 每一格套一個水平縮放 `cos(θ)`，θ 從 0 走到 2π
3. 接近側面時（|cos θ| 很小）換成一片帶厚度的紙邊，而不是壓成零寬
4. 背面那半圈用水平鏡像，並稍微壓暗——紙的背面沒有正面亮
5. 依 `SD2_Coin.json` 的結構寫出 `talisman.png` + `talisman.json`
6. `assets.ts` 的 `coins` 改指過去，`WinCoins.svelte` 的 key 跟著改

金幣的 sheet 是 1889×1152、每格 487×487、部分格子 `rotated`。
新的不需要照抄那個packing，只要 frame 名稱是 `1.png`..`12.png` 就能直接替換。

---

## 6. 之後還會需要的（不急）

背景、法壇框架、UI 底板、贏分橫幅、wordmark、縮圖與封面。

這些不適合單張生成——它們要跟盤面一起看才知道對不對，
而且封面有 Stake 的構圖要求（角色要在框內、四邊留白、背景才出血，
見 `wp/.claude/skills/stake-engine-slot/references/review-log.md` 第六輪）。
等符號齊了、遊戲能跑起來，再對著實際畫面做。
