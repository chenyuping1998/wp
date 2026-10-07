# GO BOOMANA — 背景生成規格與提示詞

三張：主遊戲、免費遊戲、Hold and Spin。

---

## 0. 三條硬性限制

**1. 圖會被拉伸，不保持比例。** `Background.svelte` 把 sprite 拉滿畫布（`OVERSCAN 1.08`），畫布就是玩家的視窗。所以構圖**不能靠幾何形狀或可辨識的物件輪廓撐**——圓形會變橢圓。要靠層次和光。

生成請直接要 **16:9，1920 × 1080 以上**。上一代交來 2.36:1，裁到 16:9 後只剩 1195px 寬再放大回 1920，銳利度回不來。

**2. 盤面會蓋住中間。** 中央約 **55% 寬 × 70% 高**是盤面加外框，**右側邊欄站著猩猩**。細節只能活在頂部帶狀區和左側；中央必須暗而安靜。

**3. 盤面沒有不透明底板。** H1–H4、S、W、B 是去框的符號，每格約四分之一是背景直接透出來。所以**盤面範圍內的亮度上限比你想的低**——三代的免費遊戲背景在這裡吃過虧，太陽正好壓在最上排符號後面，60% 的面積亮度超過 200，最後要另外做一道 haze 才救回來。

---

## 1. 主遊戲 `bg_base.png`

坑道深處，礦燈點著，還在開採中。

```
Vertical-safe 16:9 game BACKGROUND plate for a mining slot. No characters, no
people, no animals, no text, no logos.

The inside of a working mine tunnel, seen straight on down its length. The
CENTRE of the frame must stay dark, empty and low-contrast — the shaft receding
into blackness, no focal object, nothing the eye lands on.

Visual interest sits in the TOP FIFTH: heavy timber roof supports crossing the
frame, an old oil lantern hanging from one of them casting a warm amber pool,
dust hanging in the light. And along the LEFT EDGE: a rough-hewn rock wall with
a seam of ore catching the lamplight, a coil of rope and a leaning pickaxe. The
RIGHT THIRD stays simple and dark — bare shadowed rock only, no detail.

Lighting: warm amber lantern light from the upper left, falling off fast into
deep shadow. Damp highlights on the rock. Fine dust drifting in the beams.

Palette: dark slate grey-brown, coal black, warm amber lamplight, rusted iron,
and a few glints of gold in the ore seam. Rich and warm but DARK overall — a
mid-dark backdrop that bright symbols read cleanly against.

Painterly hand-illustrated game art, bold simple shapes that read at small size,
strong single light source. Full-bleed to all four edges, no frame, no vignette
border, no strong horizon line.
```

---

## 2. 免費遊戲 `bg_feature.png`

同一條坑道，**炸開之後**。這是玩家爬階梯的地方，所以要更熱、更有事發生。

```
Vertical-safe 16:9 game BACKGROUND plate for a mining slot. No characters, no
people, no animals, no text, no logos.

The same mine tunnel after a blast has opened it up: the walls are torn back to
raw rock and a great vein of gold and crystal has been exposed, glowing along
both sides of the shaft.

The CENTRE of the frame must stay dark, empty and low-contrast — the opened
shaft receding into shadow, no focal object. Visual interest lives in the TOP
FIFTH (splintered timber supports, hanging dust and smoke still settling, hot
sparks drifting down) and along BOTH SIDE EDGES (the exposed seam — thick veins
of gold threaded with blue-green crystal, lit from within).

Lighting: the seam itself is the light source. Warm gold from the left, a cooler
blue-green glow from the crystal on the right, meeting in the dark centre.
Smoke and dust catching both. Distinctly BRIGHTER and more charged than a quiet
tunnel, but the centre stays dark.

IMPORTANT: keep the upper-centre band restrained. Bright light directly behind
the top row of symbols makes them hard to read.

Palette: hot gold and amber, blue-green crystal glow, near-black rock, rusted
iron. Higher contrast and more energy than the base scene.

Painterly hand-illustrated game art, bold simple shapes that read at small size.
Full-bleed to all four edges, no frame, no vignette border, no strong horizon.
```

---

## 3. Hold and Spin `bg_holdandspin.png`

金幣盤面，跟主玩法無關，所以**故意不共用語彙**：不是坑道，是金庫。

```
Vertical-safe 16:9 game BACKGROUND plate. No characters, no people, no animals,
no text, no logos.

A deep underground strongroom cut into the rock at the bottom of a mine: a
vaulted chamber of fitted stone blocks, iron banding, and a heavy riveted door
frame set into the far wall.

The CENTRE of the frame must stay dark, empty and low-contrast — the middle of
the chamber floor, no focal object. Visual interest sits in the TOP FIFTH (the
stone vault arch, iron brackets, a single caged lamp) and along the LEFT EDGE
(stacked strongboxes and a spill of coins catching the light). The RIGHT THIRD
stays simple and dark.

Lighting: one cold caged lamp high on the left, and a faint warm underglow
rising from the coins on the floor. Low overall exposure, still and quiet —
this is a room, not a working face.

Palette: cold grey cut stone, black iron, deep shadow, with restrained warm gold
only where coins catch the light. The DARKEST and calmest of the three.

Painterly hand-illustrated game art, bold simple shapes. Full-bleed to all four
edges, no frame, no vignette border, no strong horizon line.
```

---

## 4. 三張的關係

| | 場景 | 光 | 感覺 |
|---|---|---|---|
| base | 開採中的坑道 | 暖油燈，衰減快 | 安靜、日常 |
| feature | 同一條坑道被炸開 | 礦脈自己在發光，金＋藍綠 | 熱、有事剛發生 |
| holdandspin | 地底金庫 | 冷燈 + 金幣微光 | 最暗、最靜 |

base 和 feature 是**同一個地方的前後**，換場時玩家要認得出來。holdandspin 刻意不共用——它付的是金幣不是 ways，看起來就不該像免費遊戲。

---

## 5. 交來之後

丟給我，我跑 `design/import_backgrounds.py`：裁到 16:9、必要時銳化、**量測盤面範圍內每一列的亮度**並在超標時做 haze，最後產出一張標了盤面範圍的對照表。

三代的免費遊戲背景第一列有 59.7% 的面積亮度超過 200——那是一整片白壓在最高分符號後面。這次量測會在接進去之前就告訴我們。
