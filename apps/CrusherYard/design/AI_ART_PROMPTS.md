# Crusher Yard — AI 生圖提示詞

給 Midjourney / DALL·E / Stable Diffusion / Nano Banana 之類的工具用。
每一段都對應管線裡一個具體的入口，尺寸與底色是**硬性需求**，不是建議。

產出後放進 `design/source/…`，跑對應的腳本（每段最後有寫），不要直接丟進
`static/assets/`。

---

## 0. 共用風格區塊（每個提示詞前面都貼這段）

```
Industrial scrapyard car-crusher theme. Dark, cold, heavy machinery.
Palette: cold steel greys and blue-greys (#8d99a3, #454f58, #232a30), dark
iron-oxide brown rust (#42260f), hazard yellow used ONLY as thin painted
warning stripes (#c9a227). Dim shed lighting, one weak warm sodium lamp far
off to one side. Photorealistic rendered 3D game asset, physically based
materials, brushed and pitted steel, weld seams, rivets, chipped paint.
High contrast, readable silhouette, dramatic rim light.
NOT cartoon, NOT cel shaded, NOT neon, NOT fantasy.
```

### 為什麼配色被綁得這麼死

盤面在 tumble 時佈滿**琥珀色**中獎標記，正上方是一條**綠→黃→琥珀→紅**的壓力表，
氮氣瓶結算是**青色**。這三個是玩家唯一必須在轉動中讀懂的東西。

所以美術能用的只有**冷鋼灰**。任何一張圖只要出現大面積飽和橘、紅、綠或青，
就會跟機制搶注意力——不是難看，是讓遊戲變難讀。危險黃只能出現在細條紋上。

### 每一張圖都不可以有文字

所有文字（BIG WIN、FREE SPINS、金額、倍數）都由前端以 16 種語言繪製。
生成的圖裡出現任何字母或數字，都得手動修掉。

```
負面提示詞（全部通用）：
text, letters, numbers, words, logo, watermark, signature, UI, buttons,
frame border, cartoon, cel shading, anime, neon, glowing, fire, flames,
lava, orange glow, magic, fantasy, gold, brass, treasure
```

---

## 1. 符號（最重要，10 張）

### 硬性需求

| 項目 | 值 | 理由 |
|---|---|---|
| 尺寸 | 生 1024×1024，最後會被縮到 **256×256** | `process_symbols.mjs` 會縮放置中 |
| 背景 | **純平的中性灰（#808080）**，不要透明、不要漸層、不要有色 | 見下方 |
| 邊距 | 物件四周至少留 **12% 空白**，**絕對不能碰到畫面邊緣** | 見下方 |
| 視角 | 全部同一個：正面略俯視，光從左上 | 十個符號要像同一套 |
| 放進 | `design/source/symbols/{h1,h2,h3,h4,l1,l2,l3,l4,s,m}.png` | |

**為什麼要中性灰底而不是透明：** `process_symbols.mjs` 是從邊界往內 flood fill 去背的，
它需要取樣到**中性色**（RGB 極差 ≤ 16）當背景參考。透明底會讓它找不到參考而報錯；
彩色底會被當成符號的一部分。

**為什麼絕對不能碰邊：** 上一款遊戲有一張圖畫滿整個畫框，它的深棕色被當成背景，
flood fill 吃掉了符號的 **89%**，只剩幾片碎屑。腳本現在會偵測並標記 SUSPICIOUS，
但留白才是根本解。

### 高分符號（烤漆整機，飽和度壓在中低）

```
h1 — Engine Block
[共用風格區塊]
A single scrapped automotive engine block, cast aluminium with four cylinder
bores open on top, oil-stained, bolt holes and casting ridges. Chipped
industrial YELLOW paint over bare metal. Three-quarter front view, slight
top-down angle, light from upper left. Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
h2 — CRT Television
[共用風格區塊]
A single smashed vintage CRT television, deep boxy case, cracked dark screen,
two chunky dials on the right, bent antenna stub. Faded TEAL plastic case,
scratched. Three-quarter front view, slight top-down angle, light from upper
left. Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
h3 — Washing Machine
[共用風格區塊]
A single scrapped front-loading washing machine, dented white enamel body,
one large circular glass door dominating the front, control dial top right.
Rust streaks running down from the seams. Three-quarter front view, slight
top-down angle, light from upper left. Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
h4 — Bumper
[共用風格區塊]
A single torn-off car bumper, long horizontal chrome bar curving toward the
viewer at both ends, two mounting brackets hanging underneath, dented and
scraped, patches of RUST RED primer showing through. Front view, slight
top-down angle, light from upper left. Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

### 低分符號（裸鋼五金，四種輪廓要明顯不同）

```
l1 — Hex Nut
[共用風格區塊]
A single large hexagonal steel nut, thick, threaded hole through the centre,
bright machined edges with dark grime in the threads, galvanised finish.
Three-quarter view, slight top-down angle, light from upper left. Centred,
isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
l2 — Coil Spring
[共用風格區塊]
A single heavy automotive coil spring, five visible coils stacked vertically,
thick round steel wire, dark oxidised finish with bright wear marks on the
coil crowns. Side view, slight top-down angle, light from upper left.
Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
l3 — Gear
[共用風格區塊]
A single steel gear wheel, twelve chunky teeth around the rim, hexagonal
bore in the centre, hardened surface with blued heat tint and polished tooth
flanks. Face-on view tilted slightly, light from upper left. Centred,
isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
l4 — Tin Can
[共用風格區塊]
A single crushed tin can, cylindrical, dented and creased down one side, torn
pull-ring lid partly open, bare unlabelled tinplate with rust spots. Standing
upright, three-quarter view, light from upper left. Centred, isolated object,
floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
NO label, NO printing, NO text on the can.
```

### 兩個特殊符號（要比其他八個更醒目）

```
s — The Crusher（Scatter，觸發免費遊戲）
[共用風格區塊]
A single industrial car-crusher press unit, two massive horizontal steel jaw
plates facing each other with an OPEN GAP between them, hydraulic rams above
and below, black-and-YELLOW hazard stripes painted on both jaw faces. The
open gap through the middle is the key feature — it must read as a machine
about to close. Front view, slight top-down angle, light from upper left.
Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

```
m — Nitrogen Tank（Multiplier，只在免費遊戲出現）
[共用風格區塊]
A single upright industrial nitrogen gas cylinder, rounded top and bottom,
brass valve and protective collar on top, two horizontal painted bands around
the body. Body is pale ICE BLUE / CYAN, the only cyan object in the whole art
set. Cold condensation frost on the lower half. Standing upright, three-quarter
view, light from upper left. Centred, isolated object, floating.
Flat neutral grey background (#808080), no shadow on the background.
Generous empty margin on all four sides, object must not touch any edge.
```

### 生完之後

```powershell
node design/process_symbols.mjs        # 去背、清雜點、縮到 256x256
```

**驗收方式**：把十張縮到 98px 併排看（腳本會產 contact sheet）。
如果有兩個在小尺寸下糊在一起，**要改的是形狀不是顏色** —— 顏色在 98px 的格子裡
幾乎不傳遞資訊，輪廓才傳遞。

---

## 2. 場景（背景＋壓縮機外殼，1 張）

這張最難，因為它同時是房間和盤面的框。

```
[共用風格區塊]
Interior of a scrap metal yard shed, wide establishing shot. A massive
industrial car-crusher machine fills the centre of the frame, seen straight
on. Its body is a huge riveted steel housing with weld seams and rust
streaks. In the CENTRE of the housing is a large EMPTY RECTANGULAR OPENING,
wider than it is tall (ratio 5:4), completely black inside — a dark recess,
nothing visible in it. Heavy hydraulic rams above the opening. Thin
black-and-yellow hazard stripes on the jaw plates directly above and below
the opening.
Behind and around the machine: corrugated steel shed walls, an overhead
gantry rail, an unlit crane claw hanging at the far LEFT, piles of crushed
scrap on the floor. One weak orange sodium lamp low in the BOTTOM RIGHT
corner, its pool of light on a wet concrete floor. Everything else cold and
dim.
Wide 3:2 composition. The opening must be centred horizontally and sit
slightly ABOVE the vertical centre.
```

### 硬性需求

- 輸出 **1536×1024**（或等比更大後縮）
- 中央開口**必須是純黑的空矩形**，比例接近 **5:4（寬>高）**，裡面什麼都沒有
- 開口要**水平置中**、**略高於垂直中心**
- 暖光只能有一處，壓在**右下角**

### 生完之後（重要）

AI 不會剛好把開口放在指定像素。**產出後告訴我，我來量開口的實際座標**，
然後同步更新兩個地方：

- `design/generate_scene_yard.mjs` 的 `OPEN_X / OPEN_Y / OPEN_W / OPEN_H`
- `src/components/BoardFrame.svelte` 的 `SCENE / OPENING`

這兩組數字是**契約**。上一張供圖的開口是 628×586（為方形 7×7 而切），
在 588×490 的盤面上縮到 525 寬，機體直接壓在第一軸與第六軸上——
這就是為什麼開口的長寬比不能將就。

檔案放 `static/assets/sprites/crusherYardBackground/bg_background.png`。

---

## 3. 中獎銅牌 × 5

`generate_win_banners.mjs` 會**自己把字排進凹槽**，所以圖上不能有字。
它靠亮度找凹槽：金屬要亮（luminance > 90），凹槽要暗（< 55）。

```
[共用風格區塊]
A horizontal industrial nameplate / title bar, seen straight on. A BRIGHT
polished steel frame with rivets at the corners, enclosing a WIDE SUNKEN
DARK RECESSED PANEL that runs the full length of the plate. The recess is
near-black and completely EMPTY. Strong contrast between the bright metal
frame and the dark recess. Opaque black margins outside the plate.
Roughly 680 wide by 130 tall.
NO text, NO letters, NO numbers anywhere.
```

五階用**同一個結構、不同的份量**，等級靠材質與體積遞增，不要靠顏色：

| 檔名 | 差異 |
|---|---|
| `BigWin.png` | 樸素鋼板，四角鉚釘 |
| `SuperWin.png` | 加厚邊框，多一圈內緣線 |
| `MegaWin.png` | 更重的鑄件邊框，角落有補強塊 |
| `EpicWin.png` | 邊框加上液壓管件與螺栓細節 |
| `MaxWin.png` | 最重，邊框帶危險黃細條紋（唯一允許用黃的一階） |

放 `design/source/winBanners/`，然後：

```powershell
node design/generate_win_banners.mjs "E:\stake\tools\gen"
```

---

## 4. 免費遊戲告示牌 × 2

前端會把 FREE SPINS 標題、次數、AWARDED 三行畫在中央凹面上。

```
fs_sign.png — 1706×922
[共用風格區塊]
A large industrial hanging sign, seen straight on. Heavy steel frame with
riveted corner plates and two chain mounting lugs on top. The centre is a
LARGE FLAT DARK PANEL, near-black, completely empty, occupying most of the
sign. Bright metal frame around it. Weathered, chipped paint, rust at the
bolts.
NO text, NO letters, NO numbers.
```

```
fs_counter_panel.png — 824×622
[共用風格區塊]
A small industrial instrument panel, seen straight on. Steel bezel with four
corner screws, enclosing a dark empty readout face. Compact, roughly 4:3.
Weathered brushed steel.
NO text, NO letters, NO numbers, NO dial markings.
```

放 `static/assets/sprites/crusherYardFrame/`（這兩個目前直接使用，不經腳本）。

⚠️ `FreeSpinAnimation.svelte` 裡有一組**量出來的內部座標**
（`SIGN_SOURCE` 1706×922、內部 x 138..1563 / y 132..836）。換圖後這些要重量，
否則文字會壓到邊框上。跟我說一聲我來量。

---

## 5. Bet bar 底盤 × 2

```
ticker_plate.png — 652×146
[共用風格區塊]
A long narrow industrial readout plate, seen straight on. Dark recessed
centre panel with a thin bright steel bezel, four small rivets. Very simple,
low contrast, meant to sit behind numbers.
NO text, NO numbers.
```

```
buybonus_plate.png — 640×640
[共用風格區塊]
A square industrial control-panel button plate, seen straight on. Dark steel
face with a raised bezel, four corner bolts, and black-and-YELLOW hazard
stripes across the TOP and BOTTOM edges only — the centre stays clear and
dark. Reads as a machine control you press.
NO text, NO letters, NO numbers.
```

放 `static/assets/sprites/crusherYardUi/`。

> Buy Bonus 這塊目前是我程序生成的，換成鋼材配色後變成一塊平的金黃方塊，比原本更糟——
> 所以這張特別值得用 AI 生。危險條紋壓在上下緣是刻意的：中間要留給前端寫的文字。

---

## 6. 不建議用 AI 生的

| 資產 | 理由 |
|---|---|
| **UI 圖示**（menu / settings / 音量 / 自動旋轉…12 個） | AI 很難做出十二個風格一致、在 40px 下都可辨的圖示。現在程序生成的那套已經夠好，換成 AI 幾乎一定會退步 |
| **Thumbnail** | 由遊戲自己的美術合成（`generate_thumbnail.mjs`），換了場景與符號後重跑即可，不需要另外生 |
| **FX 貼圖**（光暈、星芒、拖尾） | 純白柔邊素材，執行期 tint。AI 生的會帶顏色與硬邊，反而不能用 |
| **字體** | 已經是原創幾何字，可商用無授權問題。AI 生的字圖無法當字型檔 |

---

## 7. 建議的順序

1. **符號先做**——它決定整套的材質語言，而且是目前唯一的佔位圖
2. 拿符號的成品**回頭校準場景**的明暗（場景不能比符號亮）
3. 銅牌與告示牌
4. Bet bar 底盤

每一批生完給我，我跑對應腳本、量座標、更新契約常數，然後重建。
