# Wild Party — 「Neon Y2K Disco」全面視覺改版規格

> 版本：v1 ／ 2026-08-15
> 範圍：**只改視覺與演出**。數學（35 線、96% RTP、5000x、Global Multiplier、免費遊戲）完全不動，
> `config.ts` 的賠付表、`INITIAL_BOARD` 的符號代號（H1–H4 / L1–L4 / W / S）全部沿用。
> 參考基準：`apps/GoBananas`（厚描邊貼紙卡通）、`apps/HotMiami`（平面霓虹向量）、
> `.claude/skills/stake-engine-slot`（送審規則與驗證紀律）。

---

## 1. 為什麼要改：問題診斷

把三個遊戲的圖騰並排看，問題很清楚：

| | GoBananas | HotMiami | **WildParty（現況）** |
|---|---|---|---|
| 技法 | 厚白描邊平面向量 | 厚描邊平面霓虹 | **AI 寫實渲染** |
| 144px 下的剪影 | 乾淨、單看輪廓可辨識 | 乾淨 | **糊掉** |
| 色彩數 | 受控（每符號 3–4 色） | 受控 | **無上限漸層** |
| 品牌辨識 | 強 | 強 | 弱（像素材庫圖） |

三個核心問題：

1. **剪影不成立。** 現在的金色迪斯可球是一顆有上百格鏡面的球體，縮到滾輪格子就是一團金色雜訊；
   香檳瓶的噴濺、禮物盒的緞帶在 144px 全部消失。GoBananas 的香蕉、HotMiami 的紅鶴之所以有效，
   是因為**輪廓本身就是符號**。
2. **色系撞臉又撞自己。** 現在是紫 + 金，`uiTheme.ts` 直接沿用 shared package 的 plum/gold 預設，
   等於沒有品牌色。而紫金是市面上派對機台最泛濫的組合。
3. **背景過載。** `wildparty_bg_base.png` 四角塞滿氣球、彩帶、香檳桶、沙發，加上 `Background.svelte`
   已經疊了 EQ 光柱、bokeh、confetti、光束四層程序動畫，中央盤面區的視覺噪訊直接和圖騰打架。

### 改版策略

**技法對齊、色系錯開。** 採用 GoBananas / HotMiami 的厚描邊平面向量 + 霓虹光暈技法，
色系走 **Y2K 液態鉻 + 洋紅／萊姆／青**，刻意避開：

- HotMiami 的「粉紅 + 藍綠 + 日落漸層」
- GoBananas 的「叢林綠 + 暖橘」
- WildParty 自己舊版的「紫 + 金」

**液態鉻（liquid chrome）是這次的品牌記憶點**——市面上派對主題幾乎沒人用鉻，
而它在深紫黑底上的高光對比極強，144px 也還在。

> ⚠ **這個方向的依據是什麼，說清楚：**
> repo 裡**沒有任何證據顯示 GoBananas 或 HotMiami 通過審核**。
> `review-log.md` 的標題是「what Stake actually asked for」，記錄的是 GoBananas 六輪的
> **退件意見**；HotMiami 至今未過審。文件裡所有的「通過」都是指 build 通過、檢查通過。
>
> 所以能拿來當依據的只有**否定證據**——Stake 明確點名會被退的東西：generic／AI 感美術、
> 系統字體、emoji 圖示、非慣用的下注列版面、社交模式違禁詞、封面主體出血。
> 這套改版是照著「避開已知的退件原因」設計的，**不是照著「已知會過的作法」**。
> 兩者差很多，不要把姊妹作的做法當成核准背書。

---

## 2. 色彩系統（Design Tokens）

所有數值都會落進 `src/game/palette.ts`，程式端一律引用 token，不再散落 hex。

### 2.1 底色（越後面越深）

| Token | Hex | 用途 |
|---|---|---|
| `INK` | `#0A0410` | 畫布最底層、外框陰影 |
| `NIGHT` | `#12061E` | 背景主色、盤面底 |
| `VIOLET_DEEP` | `#1E0B36` | 盤面格子交替色、面板底 |
| `VIOLET_MID` | `#31145A` | UI 面板、描邊內側 |

### 2.2 霓虹三主色（每個符號只准用其中一個當主調）

| Token | Hex | 指派 |
|---|---|---|
| `MAGENTA` | `#FF2D95` | W（Wild）、L1（A）、主 CTA |
| `LIME` | `#B6FF3D` | S（Scatter）、L3（Q）、免費遊戲狀態 |
| `CYAN` | `#22E4FF` | L2（K）、L4（J）、聽牌提示 |

> **紀律：** 一個符號一個主調，加白高光與描邊，**不准第四色**。這是 HotMiami 的圖騰能在
> 滿版盤面上還互相分得開的唯一原因。

### 2.3 液態鉻（品牌記憶點）

鉻不是單一顏色，是一組**固定順序的漸層停點**，所有鉻件（H1、W、外框、UI 板）共用同一組，
確保整個遊戲的金屬感是同一種金屬：

| 停點 | Hex | 說明 |
|---|---|---|
| 0.00 | `#FFFFFF` | 頂部高光 |
| 0.18 | `#D8E6FF` | 冷白 |
| 0.42 | `#7B8FC7` | 中段陰影（關鍵，缺了就變塑膠） |
| 0.55 | `#2A3355` | 地平線暗帶 |
| 0.68 | `#C9B6FF` | 反射紫（環境色） |
| 0.86 | `#FF9AD5` | 反射洋紅（環境色） |
| 1.00 | `#FFFFFF` | 底部反光 |

> 0.42→0.55 那道**暗帶**是鉻的靈魂：金屬之所以看起來像金屬，是因為它反射「天空亮／地面暗」
> 的環境。少了暗帶，就會變成銀色塑膠。生圖題詞裡必須明講。

### 2.4 輔助色

| Token | Hex | 用途 |
|---|---|---|
| `WHITE_HOT` | `#FFFFFF` | 霓虹燈管核心、高光 |
| `OUTLINE` | `#0A0410` | 統一描邊色（**不是純黑**，帶紫更融背景） |
| `GOLD_ACCENT` | `#FFC94D` | 只用在得分數字與大獎橫幅，全遊戲唯一暖色 |

金色被**降級為稀有色**：只有在玩家贏錢時才出現。這樣「看到金色 = 有錢」變成一條可學習的視覺規則。

---

## 3. 圖騰（10 個符號）改版對照

代號不動，美術全換。所有符號共用同一套規格：

**通用技法規格（每個 prompt 都會帶）**
- 1024×1024 透明背景 PNG，主體佔畫面 **82%**，四邊留 9% 安全邊
- 厚描邊 `#0A0410`，寬度約主體短邊的 3.5%，**外緣封閉不斷線**
- 平面向量 + 硬邊 cel shading（最多 2 階明暗），**禁止柔和寫實漸層**
- 霓虹光暈畫在描邊**外側**，向外散開 ≤ 12px，不可蓋住主體輪廓
- 正面或 3/4 視角，無透視變形，無投影落地陰影

| 代號 | 舊 | **新** | 主調 | 剪影檢查 |
|---|---|---|---|---|
| H1 | 金色迪斯可球 | **液態鉻迪斯可球**（大格鏡面，格數大幅減少） | CHROME | 圓 |
| H2 | 寫實香檳開瓶 | **香檳塔**（三層堆疊杯，鉻香檳瓶傾倒） | CHROME + MAGENTA | 三角 |
| H3 | 粉紅雞尾酒 | **霓虹馬丁尼杯**（管狀霓虹描邊，杯中液體發光） | MAGENTA | 倒三角 |
| H4 | 禮物盒 | **Y2K 翻蓋手機**（開蓋，螢幕發光心形） | CYAN | 直立長方 |
| L1 | 霓虹 A | **霓虹燈管 A** | MAGENTA | 字形 |
| L2 | 霓虹 K | **霓虹燈管 K** | CYAN | 字形 |
| L3 | 霓虹 Q | **霓虹燈管 Q** | LIME | 字形 |
| L4 | 霓虹 J | **霓虹燈管 J** | VIOLET | 字形 |
| W | 霓虹星 WILD | **液態鉻 WILD 立體字 + 星芒** | CHROME + MAGENTA | 橫向塊 |
| S | 黑膠唱片 SCATTER | **黑膠唱片 + 萊姆星芒盤** | LIME | 星芒圓 |

> **H4 為什麼從禮物盒換成翻蓋手機：** 禮物盒是正方形，和 H1 的圓、H2 的三角比起來不夠有個性，
> 而且「禮物盒」在派對主題裡是最可預測的選擇。Y2K 翻蓋手機是直立長方形 + 上蓋斜角，
> 剪影和其他九個都不撞，而且直接把 Y2K 這個題材說清楚。
> **若要保守：** 沿用禮物盒，把它做成鉻面包裝紙 + 洋紅緞帶即可，prompt 見 §4.4b。

---

## 4. 生圖題詞（完整可直接貼）

> **共用規則：** 每組都給「正向題詞」與「負向題詞」。負向題詞是這批圖能不能用的關鍵——
> AI 預設就是往寫實渲染跑，不壓住就會生出跟現在一模一樣的東西。
> 建議工具：Midjourney v7（加 `--style raw`）、Flux 1.1 Pro、或 DALL·E 3。
> Midjourney 請在每則後面補 `--ar 1:1 --style raw --s 150`。

### 4.0 全域負向題詞（每一張圖都要帶）

```
photorealistic, 3D render, octane render, ray tracing, realistic reflections,
soft gradient shading, airbrush, glossy plastic, depth of field, bokeh background,
drop shadow on ground, perspective distortion, busy background, cluttered details,
text watermark, signature, jpeg artifacts, low contrast, muddy colors,
thin outlines, broken outline, multiple objects, collage, grid layout
```

---

### 4.1 H1 — 液態鉻迪斯可球

```
Flat vector game symbol icon of a chrome mirrorball disco ball, front view,
centered on transparent background.

STYLE: bold flat vector illustration, hard-edged cel shading with exactly two
shadow steps, thick uniform dark outline in color #0A0410 around the entire
silhouette, no gradients except the chrome band described below. Modern casino
slot symbol art, Hacksaw Gaming visual language, sticker-like clean shapes.

SUBJECT: a disco ball built from LARGE chunky mirror facets — only about 7 facets
across the diameter, not a fine mosaic. Each facet is a flat quadrilateral with a
crisp edge. The facets are filled with a LIQUID CHROME gradient running top to
bottom in this exact order: pure white #FFFFFF at the top, cool white #D8E6FF,
then a mid grey-blue #7B8FC7, then a DARK HORIZON BAND #2A3355 across the middle,
then reflected lavender #C9B6FF, reflected hot pink #FF9AD5, and pure white
#FFFFFF at the very bottom. This dark horizon band across the middle is
essential — it is what makes the metal read as chrome rather than silver plastic.
Two or three facets carry a pure white specular highlight shaped as a hard-edged
four-point star.

LIGHTING: a hot magenta #FF2D95 neon rim light on the lower left edge and an
electric cyan #22E4FF rim light on the upper right edge, both drawn as crisp
flat shapes hugging the outline, not soft glows.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, perfectly centered, no ground shadow, transparent background.
```
負向：`[4.0 全域負向題詞]` + `fine mosaic, hundreds of tiny mirror squares, gold, yellow, brass`

---

### 4.2 H2 — 香檳塔

```
Flat vector game symbol icon of a champagne tower, three-quarter view, centered
on transparent background.

STYLE: bold flat vector illustration, hard-edged cel shading with exactly two
shadow steps, thick uniform dark outline #0A0410 around the entire silhouette,
Hacksaw Gaming slot symbol visual language, clean sticker-like shapes.

SUBJECT: a pyramid of stacked coupe glasses, three tiers — one glass on top, two
in the middle, three at the base, forming a clean triangular silhouette. Above
them a chrome champagne bottle tilts and pours. The bottle body uses a LIQUID
CHROME gradient top to bottom: white #FFFFFF, cool white #D8E6FF, grey-blue
#7B8FC7, a DARK HORIZON BAND #2A3355 across the middle, lavender #C9B6FF,
pink #FF9AD5, white #FFFFFF at the base — the dark middle band is what makes it
read as chrome instead of silver plastic. The pouring champagne is a flat ribbon
of hot magenta #FF2D95 with a white #FFFFFF core line. The liquid inside the
glasses glows the same magenta. Bubbles are simple flat white circles, no more
than eight of them, arranged in a rising arc.

LIGHTING: crisp cyan #22E4FF rim light along the left edge of the bottle,
flat-shaped, not a soft glow.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```
負向：`[4.0]` + `gold foil, yellow champagne, realistic liquid, foam splash, many bubbles, wood table`

---

### 4.3 H3 — 霓虹馬丁尼杯

```
Flat vector game symbol icon of a neon martini cocktail glass, front view,
centered on transparent background.

STYLE: bold flat vector, the glass drawn as a NEON TUBE SIGN — the outline of the
glass is a thick luminous tube of hot magenta #FF2D95 with a pure white #FFFFFF
core running down the center of the tube, exactly like a real bent-glass neon
sign. Outside the tube, a thick dark outline #0A0410 keeps the silhouette
readable. Hard-edged, no soft glow bleeding into the shape.

SUBJECT: a classic martini glass, wide inverted triangular bowl on a thin stem
and round base, forming a strong inverted-triangle silhouette. The liquid inside
is a flat magenta #FF2D95 field with a lighter #FF9AD5 band at the surface line.
A single olive or cherry sits on a straight chrome pick — the pick uses the
liquid chrome gradient (white, cool white, grey-blue, dark band #2A3355,
lavender, pink, white). Three small hard-edged four-point white sparkle stars
float around the rim, no more than three.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```
負向：`[4.0]` + `ice cubes, condensation, realistic glass refraction, straw, umbrella, lemon slice, orange`

---

### 4.4 H4 — Y2K 翻蓋手機

```
Flat vector game symbol icon of a Y2K flip phone, open, three-quarter view,
centered on transparent background.

STYLE: bold flat vector illustration, hard-edged cel shading with exactly two
shadow steps, thick uniform dark outline #0A0410 around the entire silhouette,
Hacksaw Gaming slot symbol visual language, clean geometric shapes, early-2000s
gadget design language.

SUBJECT: a clamshell flip phone standing open so the upper screen half and the
lower keypad half form a shallow V, giving a tall rectangular silhouette. The
casing is glossy electric cyan #22E4FF with a chrome trim band running around
the edge — the chrome uses the gradient white #FFFFFF, cool white #D8E6FF,
grey-blue #7B8FC7, dark horizon band #2A3355, lavender #C9B6FF, pink #FF9AD5,
white #FFFFFF. The screen glows a flat pale cyan and displays a single simple
pixel-art heart in hot magenta #FF2D95. The keypad is a clean 3x4 grid of small
rounded rectangles in dark violet #1E0B36. A short stubby antenna sits on the
top right corner. One small chrome charm dangles from the bottom left corner on
two links.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```
負向：`[4.0]` + `smartphone, touchscreen, modern iphone, apple logo, realistic plastic, hand holding phone`

---

### 4.4b H4 替代版 — 鉻面禮物盒（保守選項）

```
Flat vector game symbol icon of a gift box wrapped in chrome paper, three-quarter
view, centered on transparent background.

STYLE: bold flat vector, hard-edged cel shading with two shadow steps, thick dark
outline #0A0410 around the whole silhouette, Hacksaw Gaming slot symbol language.

SUBJECT: a cube gift box seen from a three-quarter angle so the top face and two
side faces are visible as three clean flat planes. The wrapping is LIQUID CHROME —
each visible face carries the gradient white #FFFFFF, cool white #D8E6FF,
grey-blue #7B8FC7, a dark horizon band #2A3355 across the middle, lavender
#C9B6FF, pink #FF9AD5, white #FFFFFF, with the band running horizontally on the
side faces. A wide flat ribbon in hot magenta #FF2D95 crosses the box and ties
into a bold simple bow on top, drawn as four flat loops with no realistic folds.
Two hard-edged four-point white sparkle stars sit near the top corners.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```
負向：`[4.0]` + `gold ribbon, yellow, satin texture, realistic fabric folds, many small stars`

---

### 4.5 L1–L4 — 霓虹燈管字母（A / K / Q / J）

四張分開生，**只換字母與顏色**，其餘一字不動，這樣四個低分符號才會是同一套字。

```
Flat vector game symbol icon of the single letter "{LETTER}" built as a real neon
tube sign, front view, centered on transparent background.

STYLE: the letter is constructed from a continuous bent glass neon tube. The tube
is drawn as a thick stroke of {NEON_HEX} with a pure white #FFFFFF core line
running down the middle of the stroke — this white core is what makes it read as
a lit tube rather than a colored letter. Behind the tube sits a slightly larger
backing plate in the same letter shape, filled dark violet #1E0B36, with a thick
dark outline #0A0410 around it. Hard edges throughout, flat vector, no soft
airbrush glow.

SUBJECT: a single bold sans-serif capital letter "{LETTER}", heavy geometric
weight, wide and chunky so it stays legible when scaled down to 144 pixels.
Two small chrome mounting brackets sit at the top and bottom of the letter,
using the chrome gradient white, cool white, grey-blue, dark band #2A3355,
lavender, pink, white. A short flat cable curls from the bottom bracket.

COMPOSITION: the letter fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```

代入表：

| 檔案 | `{LETTER}` | `{NEON_HEX}` |
|---|---|---|
| `l1.png` | `A` | `#FF2D95`（洋紅） |
| `l2.png` | `K` | `#22E4FF`（青） |
| `l3.png` | `Q` | `#B6FF3D`（萊姆） |
| `l4.png` | `J` | `#A96BFF`（紫） |

負向：`[4.0]` + `serif font, script font, thin letter, outline only, multiple letters, word, crown, playing card`

---

### 4.6 W — 液態鉻 WILD

```
Flat vector game logo-symbol reading "WILD", front view, centered on transparent
background.

STYLE: bold flat vector, the word rendered as heavy three-dimensional block
letters with a thick dark outline #0A0410 around the entire word as one connected
shape. Hard-edged cel shading only, no soft gradients apart from the chrome
described below. Hacksaw Gaming slot symbol visual language.

SUBJECT: the four capital letters W I L D set in an extra-bold italic geometric
sans-serif, tightly kerned so the word reads as one solid horizontal block. The
letter faces are filled with LIQUID CHROME running top to bottom in this order:
pure white #FFFFFF, cool white #D8E6FF, grey-blue #7B8FC7, a DARK HORIZON BAND
#2A3355 across the middle, lavender #C9B6FF, hot pink #FF9AD5, pure white
#FFFFFF at the base — the dark middle band is essential to read as chrome rather
than silver plastic. Each letter has a flat extruded side face in dark violet
#31145A giving it depth. Behind the word, a bold eight-point starburst in hot
magenta #FF2D95 radiates outward with hard straight edges, its points reaching
just past the letters. Three hard-edged four-point white sparkles sit at the top
left, top right and bottom center.

COMPOSITION: the word plus starburst fills 82% of the square canvas, 9% clear
margin on all sides, horizontally centered, no ground shadow, transparent
background.
```
負向：`[4.0]` + `gold letters, yellow, script font, thin font, extra words, banner ribbon, smoke, fire`

---

### 4.7 S — 黑膠唱片 Scatter

```
Flat vector game symbol icon of a vinyl record on a starburst, front view,
centered on transparent background.

STYLE: bold flat vector, hard-edged cel shading with two shadow steps, thick dark
outline #0A0410 around the entire silhouette, Hacksaw Gaming slot symbol language.

SUBJECT: a black vinyl record seen straight on, its surface a very dark violet
#12061E with four concentric thin lighter rings suggesting grooves — only four
rings, not a fine texture. The center label is a flat circle of electric lime
#B6FF3D with a small dark center hole and the word "SCATTER" in bold condensed
dark #0A0410 capitals curving across it. Behind the record, a bold twelve-point
starburst in electric lime #B6FF3D radiates outward with hard straight edges and
sharp points, forming a spiky circular silhouette clearly different from a plain
circle. A single crisp white #FFFFFF diagonal highlight streak crosses the upper
left of the record surface as one straight flat shape.

COMPOSITION: subject fills 82% of the square canvas, 9% clear margin on all
sides, centered, no ground shadow, transparent background.
```
負向：`[4.0]` + `realistic vinyl texture, fine grooves, turntable, tonearm, record sleeve, gold label, rainbow`

---

### 4.8 背景 — Base Game

尺寸 **2304×1536**（3:2，`Background.svelte` 以 1.07 overscan 做 ken-burns，四邊要有多的）。

```
Wide flat vector illustration of an empty Y2K nightclub interior seen from the
dance floor, painted as a game background, 3:2 landscape.

CRITICAL COMPOSITION RULE: the entire central 55% of the image — a large vertical
rectangle in the middle — must stay nearly EMPTY and DARK, an uncluttered deep
violet void. All detail lives in the outer band around it. A slot machine reel
frame will be placed over that central area and must not compete with anything.

STYLE: bold flat vector illustration, hard-edged shapes, cel shading with at most
two steps, no photorealism, no soft airbrush. Limited palette only: deep violet
black #0A0410 and #12061E for the void and floor, dark violet #1E0B36 and #31145A
for architecture, hot magenta #FF2D95, electric cyan #22E4FF and electric lime
#B6FF3D for all light sources, chrome white #D8E6FF for metal.

SCENE: high above and slightly back, a large chrome mirrorball hangs near the top
edge, drawn with large chunky facets, throwing straight hard-edged light rays
downward and outward toward the top corners — the rays are flat translucent
triangles of magenta and cyan, not soft volumetric haze. Along the left and right
edges, tall slim vertical light columns and stacked speaker towers in dark violet
with thin neon trim run from floor to ceiling. The floor is a receding perspective
grid of thin glowing magenta and cyan lines on near-black, converging toward the
center horizon, fading to darkness in the middle where the reels will sit. A few
flat chrome balloons drift in the upper corners. Scattered small flat confetti
rectangles in magenta, cyan and lime sit sparsely in the outer band only.

MOOD: after-hours, cold neon, spacious and moody, not crowded.

COMPOSITION: 3:2 landscape, all subject matter pushed to the outer band, dark
empty center, no people, no text.
```
負向：`[4.0]` + `people, crowd, dancers, DJ, faces, gold, warm orange, cluttered center, balloons in center, text, logo, furniture in center, bright center`

---

### 4.9 背景 — Free Game（免費遊戲）

**同一個房間、燈全開的版本。** 玩家必須一眼認出是同個場景，但更亮更兇。
建議：拿 4.8 生成的圖當 image reference（Midjourney `--sref` 或 img2img 0.4 強度）再套下面題詞。

```
Wide flat vector illustration of the SAME Y2K nightclub interior as before, now
at peak — 3:2 landscape game background.

CRITICAL COMPOSITION RULE: the central 55% of the image stays nearly EMPTY and
DARK. All added energy goes into the outer band. The center must remain the
calmest, darkest part of the image.

STYLE: identical flat vector technique — hard-edged shapes, two-step cel shading,
no photorealism. Same limited palette, but ELECTRIC LIME #B6FF3D is now the
dominant accent, signalling the feature round, with hot magenta #FF2D95 and
electric cyan #22E4FF as support.

CHANGES FROM THE BASE SCENE: the mirrorball now blazes, throwing twice as many
hard-edged straight light rays outward in lime and magenta. Additional flat laser
beams in lime fan across the upper left and upper right corners as sharp
translucent triangles. The vertical light columns along both edges are fully lit
with bright lime and magenta segments stacked like an equalizer. The perspective
floor grid glows brighter and its lines are lime toward the outer edges,
still fading to near-black at the center. Denser flat confetti in the outer band
only. A few flat chrome streamers curl in from the top corners.

MOOD: the same room turned up — hotter, louder, greener, still spacious in the
middle.

COMPOSITION: 3:2 landscape, all detail in the outer band, dark empty center,
no people, no text.
```
負向：同 4.8

---

### 4.10 遊戲 Logo

用於載入畫面與 Stake 商店縮圖前景。尺寸 **2048×1024** 透明背景。

```
Flat vector game logo reading "WILD PARTY" on transparent background, two lines,
wide landscape composition.

STYLE: bold flat vector logotype, thick dark outline #0A0410 around the whole
lockup as one connected shape, hard-edged cel shading only, Y2K early-2000s
club-flyer design language, Hacksaw Gaming logo energy.

SUBJECT: the words "WILD" on the upper line and "PARTY" on the lower line, both
in an extra-bold italic geometric sans-serif, tightly kerned, the lower word
slightly wider so the lockup forms a stable trapezoid. Letter faces filled with
LIQUID CHROME running top to bottom: pure white #FFFFFF, cool white #D8E6FF,
grey-blue #7B8FC7, a DARK HORIZON BAND #2A3355 across the middle, lavender
#C9B6FF, hot pink #FF9AD5, pure white #FFFFFF — the dark middle band is what
makes it chrome and not silver plastic. Each letter carries a flat extruded side
face in dark violet #31145A. A thin hot magenta #FF2D95 neon tube outline traces
just outside the chrome edge of every letter, with a white core line.

BEHIND THE WORDS: a single flat chrome mirrorball with large chunky facets sits
behind and slightly above the gap between the two words, partly hidden by them.
Hard-edged straight light rays in magenta, cyan and lime radiate outward from it
past the letters. Four hard-edged four-point white sparkles at the outer corners.

COMPOSITION: wide 2:1 landscape, lockup centered, 8% clear margin, transparent
background, no ground shadow.
```
負向：`[4.0]` + `gold, yellow, serif, script, thin font, extra words, tagline, banner ribbon, background scene, people`

---

### 4.11 大獎橫幅（Big / Super / Mega / Epic / Max）

五張，尺寸 **1536×512** 透明背景。逐級升溫是**唯一**能讓玩家分辨等級的手段——
若五張長得差不多，等於沒有分級。

```
Flat vector game win banner reading "{WORD}" on transparent background, wide
landscape.

STYLE: bold flat vector logotype, thick dark outline #0A0410 around the entire
lockup, hard-edged cel shading only, no soft glow, Y2K club design language.

SUBJECT: the word "{WORD}" in extra-bold italic geometric sans-serif capitals on
a single line, tightly kerned into one solid block. Letter faces filled with
{FILL_DESC}. Each letter has a flat extruded side face in dark violet #31145A.
Behind the word, {BURST_DESC}. {EXTRA}

COMPOSITION: wide 3:1 landscape, word centered and horizontally filling 86% of
the canvas, transparent background, no ground shadow.
```

代入表：

| 檔案 | `{WORD}` | `{FILL_DESC}` | `{BURST_DESC}` | `{EXTRA}` |
|---|---|---|---|---|
| `big.png` | `BIG WIN` | 液態鉻漸層（白／冷白／灰藍／暗帶 `#2A3355`／薰衣草／粉／白） | 洋紅 `#FF2D95` 六角星芒，硬邊 | 兩顆白色四芒星 |
| `superwin.png` | `SUPER WIN` | 同上液態鉻 | 洋紅八角星芒 + 外圈青色 `#22E4FF` 細星芒 | 四顆白色四芒星 |
| `mega.png` | `MEGA WIN` | 液態鉻，但底部反射改為金 `#FFC94D` | 十二角雙層星芒，內洋紅外萊姆 `#B6FF3D` | 六顆白色四芒星 + 兩側平面鉻彩帶 |
| `epic.png` | `EPIC WIN` | 金 `#FFC94D` 面 + 鉻描邊 | 十六角三層星芒，洋紅／萊姆／青 | 八顆白色四芒星 + 平面鉻碎片向外飛散 |
| `max.png` | `MAX WIN` | 全金 `#FFC94D`，頂部白高光，鉻厚描邊 | 二十角滿版星芒，金核心向外轉洋紅 | 平面金幣與鉻碎片繞整圈，兩側閃電形高光 |

負向：`[4.0]` + `extra words, small text, currency symbol, numbers, banner ribbon, realistic gold texture, smoke`

> **送審注意（見 `references/certification.md`）：** 橫幅上**只准有這兩個英文字**，
> 不可加任何金額、貨幣符號或「JACKPOT」字樣。

---

### 4.12 滾輪外框（reelsFrame）

**這是畫面上第二大的美術元件，比任何單一圖騰都顯眼。** 現況是巴洛克金色雕花框加寶石鑲角
（`reels_frame_v3.png`），和 Y2K 霓虹是兩個完全不同的年代——不換掉，圖騰再怎麼改都白搭。

尺寸 **2048×1536** 透明背景，中央開孔必須是乾淨的透明矩形。

```
Flat vector slot machine reel housing frame, front view, transparent background,
the CENTER OF THE IMAGE COMPLETELY EMPTY AND TRANSPARENT — this is a frame, a
rectangular ring of artwork with a large clean rectangular hole through the
middle where the game board shows through.

STYLE: bold flat vector, hard-edged cel shading with two shadow steps, thick dark
outline #0A0410 on both the outer and inner edges of the frame, Y2K club hardware
design language. No baroque ornament, no carving, no gemstones, no filigree.

SUBJECT: a chunky rectangular housing built from brushed chrome panels. The metal
uses a LIQUID CHROME gradient running top to bottom on the upper and lower rails:
pure white #FFFFFF, cool white #D8E6FF, grey-blue #7B8FC7, a DARK HORIZON BAND
#2A3355 across the middle, lavender #C9B6FF, pink #FF9AD5, white #FFFFFF — the
dark band is what makes it chrome and not silver plastic. Running along the
inside edge of the frame, just outside the opening, is a continuous hot magenta
#FF2D95 neon tube with a pure white core line, bent around all four corners with
rounded turns like a real neon sign. The four corners carry simple chrome bolt
plates — flat hexagons with a highlight, no jewels. Along the top rail, a row of
six small round lamp lenses alternating cyan #22E4FF and lime #B6FF3D, drawn as
flat circles with a white center. The bottom rail carries two flat chrome speaker
grilles as simple rounded rectangles filled with a row of straight slots.

COMPOSITION: the frame ring occupies the outer 18% of the image on each side; the
inner 64% is a clean empty transparent rectangle with square corners. Symmetrical
left to right. No ground shadow.
```
負向：`[4.0]` + `gold, brass, baroque, ornate carving, filigree, gemstones, jewels, scrollwork, wood, curtains, filled center, content in center, opaque background`

> **驗證：** 換上後開 Storybook 的 `components-game--pre-spin`，確認中央開孔對得上 5×3 盤面、
> 沒有蓋到最外側兩軸的符號。舊框的內緣留白比一般框寬，開孔比例不要照抄。

---

### 4.13 Stake 商店縮圖

依 `references/review-log.md`，背景與前景要**分層交付**，被退件重排版時才不用重生。

**背景層（1920×1080，不透明）**
```
Wide flat vector Y2K nightclub background for a game store tile, 16:9.
Bold flat vector, hard-edged shapes, two-step cel shading, no photorealism.
Palette limited to deep violet black #0A0410 and #12061E, dark violet #1E0B36
and #31145A, hot magenta #FF2D95, electric cyan #22E4FF, electric lime #B6FF3D,
chrome white #D8E6FF.
A chrome mirrorball with large chunky facets hangs upper center, throwing hard-
edged straight light rays outward toward all four corners as flat translucent
triangles. Below, a receding perspective floor grid of thin glowing magenta and
cyan lines converges to a dark horizon. Slim vertical neon light columns line the
left and right edges. Sparse flat confetti in the corners. The lower center third
is darker and calmer, leaving room for a logo to be placed on top.
No people, no text, no logo.
```
負向：`[4.0]` + `people, text, logo, gold, warm orange, cluttered`

**前景層** = §4.10 的 Logo（透明 PNG，直接疊上去）。

---

## 5. UI 改版

現在 `uiTheme.ts` 直接吃 shared package 的 plum/gold 預設，等於沒有自己的品牌。改為：

| 項目 | 現況 | 新值 |
|---|---|---|
| 面板底 | plum 預設 | `VIOLET_DEEP #1E0B36`，88% 不透明 |
| 面板描邊 | gold `#d8a84e` | 液態鉻漸層細邊（1.5px） |
| 主 CTA（Spin） | `betFill 0x1a0a26` / `betBorder 0xffe9a8` | `betFill #31145A` / `betBorder #FF2D95` |
| Buy Bonus | 金字 | 萊姆 `#B6FF3D` 字 + 鉻邊（和免費遊戲同色，先建立關聯） |
| 得分數字 | Cinzel serif 粉紅漸層 | 幾何無襯線粗體，白→金 `#FFC94D` 漸層 |
| 免費遊戲計數 | 金 | 萊姆 `#B6FF3D` |
| 聽牌高亮 | 金 | 青 `#22E4FF` |

**版面沿用 `sideRail`**（現況已是，且 `railWidth: 322` / `railPanelScale: 0.5` 是量過盤面寬度算出來的，
不要動）。

**字體**：現在用 Cinzel（襯線，古典）——和 Y2K 完全相反。改用幾何無襯線粗體
（Orbitron 或 Chakra Petch，HotMiami 已驗證 Orbitron 在數字上可行，見其 `fonts.ts` 註解）。
Cinzel 的 woff2 已在 `static/fonts/`，替換時記得一併換掉 `textStyles.ts` 的 `fontFamily`
與 `app.html` 的 preload，否則會 fallback 到 Georgia。

---

## 6. 動畫與演出改版

| 節拍 | 現況 | 新設計 |
|---|---|---|
| 停輪 | 一般彈跳 | ✅ **已做**。落格時橫向掃光一次（前 55%，約 130ms），色相取自該符號本身 |
| 符號中獎 | 縮放脈動 | ✅ **已做，但不是在 `SymbolWinAnim`**。見下方「中獎符號的兩份美術」 |
| Wild 落定 | 星芒 | ✅ **已做**。鉻色雙環由中心擴散（在既有 240ms 落地封包內）|
| Scatter 落定 | 一般 | ✅ **已做**（視覺）。十二道萊姆星芒旋轉展開。音高遞升本來就已接好，在 `onSymbolLand` |
| 聽牌 | 壓暗 | ✅ **已做**。光柱、火花、壓暗色全部改為青色系（壓暗強度 0.42 是既有調過的值，未動） |
| Global Multiplier 上升 | 彗星 | ✅ **衝擊波已做**（`MultiplierShockwave.svelte`）。里程表滾動與彗星本來就有 |
| 免費遊戲進場 | 現有轉場 | ✅ **已做**。燈光轉萊姆、進場文字改白字+萊姆光暈、飄浮層加速（`flow` 時鐘）、巴洛克面板換成鉻面板。**地板網格加速做不到**——網格是烘在背景 PNG 裡的，無法捲動 |
| 大獎 | 橫幅 + 金幣 | ⚠️ **分級本來就有**（`TIER_FX` 的 mult／`WinCoins` 吃 levelAlias），我原本的描述不準。已做的是把配色對到色板：鉻 → 洋紅 → 萊姆 → 金 → 白金 |

> **`Background.svelte` 的四層程序動畫（EQ 光柱／bokeh／confetti／光束）保留，但要重新調色**
> 成新的三主色，並把 EQ 光柱的 `ceiling` 調低——新背景本身的邊帶已經很滿，
> 舊值是為了配舊背景的暗邊調的。

### 中獎符號有「兩份美術」——這是改版最容易漏掉的一點

`constants.ts` 的 `mixedSymbol()` 給每個符號兩套資產：

```
static / spin / land / postWinStatic → symbolSprite('wpL1')   ← wildPartySymbols/*.png
win                                  → symbolSpine('wpSpL1')  ← spines/wildPartySymbols/*.png
```

**只換 PNG 的話，符號一中獎就會變回舊美術。** 實際跑出來就是：靜態盤面是新的霓虹字，
連線得分的瞬間全部跳成舊的金字。spine 的 atlas 是單一未裁切、未旋轉、滿版 256×256 的區塊，
所以把頁面圖換成新美術縮到 256 即可，骨架的每個關鍵格都仍然有效——
`build_neon_y2k_assets.py` 的步驟 2b 已經自動做這件事。

> 連帶結論：**`SymbolWinAnim.svelte` 是死碼。** `Symbol.svelte` 只在 `isSprite && isWin`
> 時用它，但十個符號的 win 狀態全是 spine，這個分支永遠不會進。要改「中獎時長什麼樣」，
> 改的是 spine 頁面圖，不是那支元件。檔案開頭已標註。

> ⚠ **`blendMode: 'add'` 的坑**（見 `SKILL.md`）：所有新的掃光、過曝、光柱都是加法混合，
> **絕對不能放在有 mask 或 filters 的容器裡**，否則畫出來是一片什麼都沒有。
> 必須和被照亮的東西當同層 sibling。這個坑上次吃掉了一整輪上傳。

---

## 7. 落地順序（建議）

1. **`palette.ts` + `uiTheme.ts` + `textStyles.ts`** — 不需要任何新圖，先把色系換掉，馬上看得出差別
2. **`Background.svelte` 調色** — 同樣不需新圖
3. **生圖：背景兩張（§4.8 / §4.9）** — 換 `bg_base.png` / `bg_feature.png`，鍵值不變
4. **生圖：滾輪外框（§4.12）** — 換 `reelsFrame`。優先度高於圖騰：它面積最大，
   且現在的巴洛克金框是整個畫面裡最違和的東西
5. **生圖：10 個圖騰（§4.1–4.7）** — 換 `static/assets/sprites/wildPartySymbols/*.png`，鍵值不變
6. **動畫節拍（§6）** — 有新圖之後再調，才看得準
7. **生圖：Logo 與大獎橫幅（§4.10 / §4.11）**
8. **生圖：商店縮圖（§4.13）**

> 3–5 步刻意保持**檔名與 `assets.ts` 鍵值完全不變**，這樣 `check_assets.mjs` 一定綠，
> 也不會動到 `Symbol.svelte` 那一串引用。

## 8. 外框與側欄的寬度衝突（已解：九宮格重組）

**症狀。** 生成的鉻殼視窗只佔美術寬度的 **67.5%**（厚機殼）。遊戲會把整張外框縮放到
視窗貼齊盤面，所以邊框的實際粗細是由**美術比例**決定的：盤面 720 時鉻殼被撐到 1109px，
而版面框只有 **1422px**，左右側欄中心線在 161 / 1261 —— 兩邊都被蓋住。

> **注意：這個碰撞不是改版造成的。** `uiTheme.ts` 註解裡「housing 佔 322–1100」是
> `SYMBOL_SIZE` 還是 120 的年代算的。盤面調到 144 之後側欄從來沒重算，舊的巴洛克框
> 其實已經佔到 260–1162，早就蓋到側欄了。新外框只是讓它明顯到藏不住。

**三條走不通的路（都實測過）：**

| 嘗試 | 結果 |
|---|---|
| 裁掉美術的透明外邊 | **中性**。視窗重新對齊盤面後鉻殼一樣大 |
| 往鉻殼外緣裁 | **不行**。四角螺栓從 x=6 起、頂部燈珠在 y54–96，外緣沒有空白，裁下去就是切掉特徵 |
| 縮小 `railWidth`（322→240）把側欄往邊緣推 | **更糟**。側欄本來就接近畫布邊緣，再外推會把 readout 面板與 Turbo 鈕切出畫布 |

**解法：九宮格重組**（`rebuild_frame_nine_patch()`）。

問題的本質是「邊框粗細」和「視窗大小」被綁在同一個縮放上。九宮格把兩者拆開：四個角依
`bezel_scale` 縮小，四條邊只在厚度方向縮、長度方向拉伸，視窗要多大就多大。**沒有任何特徵被裁掉，
只是變薄。** 順便把視窗改成盤面的 5:3 比例（原生是 1.91:1，程式本來是用寬高不等比縮放硬湊，
會把鉻面和燈管拉歪）。

`bezel_scale = 0.40` 的結果：

| | 重組前 | **重組後** |
|---|---|---|
| 美術尺寸 | 1856×1142 | 1494×946 |
| 視窗佔比 | 67.5% × 57.4% | **83.9% × 79.6%** |
| 鉻殼繪製寬度 | 1109px | **893px**（舊框是 902px） |
| 佔據範圍 | 156–1266 | **265–1157** |
| 側欄 161 / 1261 | 兩邊都被蓋 | **兩邊淨空** |

視窗實際繪製 749×449，盤面 720×432 → 寬多 29px、高多 17px，沒有任何一軸被裁。
對應的 `SPRITE_SCALE = { width: 1.240, height: 0.784 }`、`Y_OFFSET = 5`。

> 重生外框美術時，`build_neon_y2k_assets.py` 每次都會印出視窗比例與換算後的鉻殼寬度，
> 拿那組數字回填 `BoardFrame.svelte` 即可，不必再用眼睛調。

---

### 免費遊戲進場面板原本還是舊主題

`fsOrnate/fs_ornate_panel.png` 是金色巴洛克鑲寶石面板——跟被換掉的舊滾輪外框同一套語言。
在整場都是鉻與霓虹之後，它是畫面上最突兀的物件。已用 `build_chrome_plate()` 重畫成
鉻身 + 洋紅燈管 + 六角螺栓，**檔名不變**，`assets.ts` 不用動。

> 同一支 `build_chrome_plate()` 也產免費遊戲計數框，兩者因此必然同調。

---

## 9. 驗證要求

依 `SKILL.md`，**build 綠燈不算驗證**。每一步都要：

1. 開 dev server（`wildparty-dev`，port 3001）實際載入，確認 canvas 有掛上
2. 每批新圖進來後，跑一張 5×3 滿版 contact sheet，**縮到 144px 檢查剪影是否還分得開**
   （HotMiami 的 `design/_contact/board_5x4.png` 就是這個用途，照抄那支腳本）
3. `check_assets.mjs` / `check_undefined_refs.mjs` / `check_social_words.mjs` 三支都要過
4. 送審前對照 `references/review-log.md` 的 pre-submission checklist

> **本機工具鏈注意：** `SKILL.md` 寫的是 Windows（`E:\stake\tools\...`），
> 但目前這台是 macOS，Node v24.16.0 / pnpm 10.34.4 都已在 PATH 上，直接 `pnpm --dir apps/WildParty dev` 即可。
> 那段 SKILL 的路徑說明對這台機器已經不適用。
