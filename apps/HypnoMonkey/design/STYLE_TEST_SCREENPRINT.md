# Hypno Monkey 催眠猴 — 絹印海報打樣提示詞

2026-10-26。畫風選定：復古馬戲團絹印海報，色票鎖定。這份是**打樣**（style test），
不是整套需求單：先生 7 件，我合成到真的盤面上、縮到 70px 和商店圖 200px 驗，
你選出一張「風格定稿圖」後，才寫整份 `ART_BRIEF.md` §0 和其餘圖的提示詞。

---

## 0. 風格規則（每一張都照這個）

**畫風**：1920–50 年代馬戲團／雜耍秀絹印海報。幾塊專色平塗、油墨疊印產生較深的色，
大而簡化的造型。
**理由**：催眠秀、馬戲團本來就印在這種海報上。Hacksaw 183 款裡只有 4 款走絹印，
Pragmatic 沒有任何 2D 印刷風；自家遊戲也沒用過。

### 技法（寫成數字）

| 規則 | 數值 |
|---|---|
| 色層 | 每張最多 **4 種專色＋墨黑**；疊色只能是兩種專色重疊的結果，不准平滑漸層 |
| 明暗 | 每個形體最多 2 階（本色／疊色暗面），硬邊 |
| 墨線 | 墨黑粗外框，線寬約畫布 1.2%（1024px 上 ≈ 12px），全套一致；內部細節線 ≥ 6px |
| 最小形狀 | 色塊短邊 ≥ 畫布 2.5%（1024px ≥ 26px），否則縮到 70px 會糊 |
| 光 | 單一方向：左上；暗面一律在右下 |
| 裝飾 | 放射光芒、星星、彩帶旗、帳篷條紋；**不要**花草捲曲、不要寫實毛髮 |
| 網點／紙紋／套色偏移 | **不要叫模型畫**，生完由程式統一加 |

### 色票（7 色；生完在 2× 尺寸量化到這幾色再縮小）

| 用途 | Hex |
|---|---|
| 墨黑 | `#1B1716` |
| 紙色（米白，背景與亮面） | `#F2E6CC` |
| 馬戲紅 | `#D2322D` |
| 皇家藍 | `#24508C` |
| 芥末黃 | `#E3A82B` |
| 猴毛棕 | `#8C5A3C` |
| ⚠ 催眠紫（保留色） | `#9B3DF5` —— **整款只給催眠螺旋、倍率懷錶的光、倍率演出**；其他圖一律不准用 |

### 生圖共通設定

- **背景一律純綠 `#00FF00`**（背景圖除外）。色票裡沒有綠，去背不會吃到圖；不用洋紅，因為洋紅會吃到保留的催眠紫。
- 符號生成 **1024×1024**，主體置中、四邊留 8% 空白。
- **圖裡不准有任何文字、字母、數字**（倍率數字由程式排字）。

### 共通風格段（貼在每一則提示詞最前面）

```
vintage 1930s circus poster, screen printed illustration, four flat spot inks
plus black ink: circus red #D2322D, royal blue #24508C, mustard yellow #E3A82B,
monkey-fur brown #8C5A3C, ink black #1B1716, cream paper #F2E6CC for highlights,
inks overlap to make darker tones, no gradients, at most two flat values per
form, bold simplified shapes, thick even black ink outline, light from top-left,
flat graphic composition
```

### 共通負面詞（貼在每一則提示詞最後面）

```
3D render, CGI, photorealistic, glossy, shiny, specular highlights, metallic
sheen, chrome, bloom, glow, lens flare, volumetric light, depth of field, bokeh,
sparkles, particles, airbrush, smooth gradient, soft shading, realistic fur,
fine hair strands, halftone dots, paper texture, grain, misregistration,
cross-hatching, art nouveau, floral curls, text, letters, numbers, watermark,
signature, logo
```

---

## 1. 七件打樣

依序：共通風格段 + 下面的主體段 + 共通負面詞。

### ① H1 大禮帽（最高分）

```
[共通風格段], a tall black magician's top hat in three-quarter view, crown and
brim built from clean simple curves, one cream light band along the left of the
crown, a wide circus red hat band, a small mustard yellow star pinned to the band,
a fan of mustard and cream sunburst rays behind the hat,
object fills 80% of the frame, centred, flat solid pure green #00FF00 background,
[共通負面詞]
```

驗收：縮到 70px 還認得是禮帽；黑帽在盤面深色底上靠放射光芒分得開。

### ② L1 星星票根（小圖）

小圖用同一個世界的材質：四種小圖都是馬戲團入場票根，靠印的圖形（星／月／菱形／愛心）分，不只靠顏色。

```
[共通風格段], a single circus admission ticket stub seen straight on, rectangle
with scalloped torn edges on left and right, two-colour print: royal blue ticket
with a large bold mustard yellow five-point star in the centre, a thin cream inner
border, no numbers or letters,
object fills 70% of the frame, centred, flat solid pure green #00FF00 background,
[共通負面詞]
```

驗收：亮部面積比 H1 小（小圖不能搶高分）；灰階化後明度低於 H1。

### ③ S 催眠螺旋盤（散付）

```
[共通風格段] plus hypnotic violet #9B3DF5, a round hypnosis spiral disc on a short
wooden handle seen straight on, a bold two-colour spiral of hypnotic violet and
cream winding to the centre, a thick black outline, a ring of short mustard
light rays around the disc,
object fills 80% of the frame, centred, flat solid pure green #00FF00 background,
[共通負面詞]
```

驗收：螺旋 3–4 圈就好（太密縮小會糊成灰）；剪影跟 ① 明顯不同（圓盤 vs 帽子）。

### ④ 倍率懷錶（招牌演出，金級）

```
[共通風格段] plus hypnotic violet #9B3DF5, an old pocket watch on a short chain,
seen straight on, mustard yellow case with a simple stepped rim, a blank cream
watch face with no numbers and no hands, a thin hypnotic violet spiral ring
just inside the rim, short violet light rays around the watch,
object fills 75% of the frame, centred, flat solid pure green #00FF00 background,
[共通負面詞]
```

驗收：錶面中間留白（倍率數字由程式排上去）；銅、銀兩級之後換外殼顏色即可。

### ⑤ MG 背景局部（512px 裁切用）

```
[共通風格段], wide daytime scene outside a circus big top, a red and cream
striped circus tent with blue pennant flags, bunting strings, a few round
balloons, a ticket booth on the left, a small crowd as flat silhouettes,
bright cream sky with large simple flat clouds, the centre of the image kept
calm and empty for the game board, no text on any sign,
16:9 landscape, 1920x1080, full bleed, no border,
[共通負面詞]
```

驗收：整張不暗（商店圖會自動提亮）；中央留空給盤面；招牌上沒有字。

### ⑥ MG 角色頭像：催眠師猴（男）

```
[共通風格段], head and shoulders of a cartoon monkey stage hypnotist, monkey-fur
brown face with a cream muzzle, a tall black top hat, round sunglasses pushed
down his nose revealing hypnotic violet #9B3DF5 spiral eyes, a thin curled black
moustache, black tailcoat lapels and a red bow tie, confident grin,
three-quarter view facing left, centred, flat solid pure green #00FF00 background,
[共通負面詞]
```

驗收：毛用平塗色塊，不要一根根毛；螺旋眼是唯一的紫色。

### ⑦ FG 角色頭像：助手猴（女）

```
[共通風格段], head and shoulders of a cartoon monkey stage assistant, monkey-fur
brown face with a cream muzzle, short bob of darker brown fur, a small mustard
yellow feathered headband, circus red sequin costume shown as flat red with a few
cream dot highlights, holding a mustard pocket watch on a chain up beside her face,
cheeky wink, three-quarter view facing right, centred, flat solid pure green
#00FF00 background,
[共通負面詞]
```

驗收：跟 ⑥ 放一起一眼分得出兩個人（性別、配色）；頭的大小差不超過 5%。

---

## 2. 交件

- 7 張原圖丟進 `design/style_test/`，檔名照編號：`01_h1.png` … `07_fg_head.png`。
- 不用自己去背、不用縮圖；我會量化到色票、加網點紙紋、合成到真的盤面截圖給你挑定稿。
