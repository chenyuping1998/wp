# Turf War — 街頭貼紙塗鴉 打樣提示詞

2026-10-15。送審結果 **5/9 退件**，標籤 **Poor animations ×2、Low quality assets**。
現版是半寫實 3D 渲染＋暗色鏽鐵（Capo 第一次被退時同一種預設 AI 感）。使用者選定
**A 街頭貼紙塗鴉**＋**灰底＋鈉燈橘＋塗鴉三色**，比照 Capo 的 Art Deco 改版：**整體換**
（符號、框、盤面外殼、背景、兩隻角色、UI、Logo、轉場、特效、縮圖、cover）。

這份是**打樣**：先生 6 件、縮到盤面大小驗，選出「風格定稿圖」後才改寫整份 `ART_BRIEF.md` §0
與其他提示詞。選項對照圖：`design/turf_style_options_1015.png`（只給人看，不進提示詞、不附給模型）。

---

## 0. 風格規則（每一張都照這個）

**畫風**：街頭貼紙塗鴉 —— 灰階線稿城市當背景，值錢的東西是貼在上面的**白邊模切貼紙**，
不值錢的東西是牆上的**灰色噴漆線條**。
**理由**：這是街頭幫派自己的媒材（噴漆、貼紙、影印 zine）。Hacksaw 同賽道（Chaos Crew、
Octo Attack）用的是怪物吉祥物；我們用**真人打手＋鈉燈橘**區隔。背景亮，縮圖不會再被說太暗。

### 技法（寫成數字）

| 規則 | 數值 |
|---|---|
| 高分／特殊符號 | 模切貼紙：**白邊**寬 = 畫布邊長 3–4%（1024 上 32–40px），白邊內一圈**黑色外框** 1.5–2% |
| 內線 | 黑線，粗細約外框一半；**沒有漸層**，陰影是一塊硬邊的深色平塗 |
| 每張貼紙的色 | 黑＋白邊＋**一個主色**（＋該主色的深/亮各一階）。第二個色相只能是極小點綴 |
| 小圖 L1–L4 | **沒有貼紙白邊**，灰色噴漆/麥克筆線條，像畫在牆上；只有灰階 |
| 背景 | 灰階**線稿**城市，只有線、沒有色塊填色；整體偏亮（平均明度 ≥ 55%） |
| 滴漆／噴點 | 平面形狀，不准寫實噴霧；**不上角色會動的手臂** |
| 最小形狀 | 任何色塊短邊 ≥ 畫布 2.5%，縮到 70px 才不糊 |
| 光 | 不畫光源、不畫反光 —— 貼紙是平的 |

### 色票

| 用途 | Hex |
|---|---|
| 墨黑（外框、內線） | `#121212` |
| 貼紙白邊 | `#F7F5F0` |
| 牆灰 亮 / 中 / 暗（背景線稿、小圖） | `#D8D6D1` / `#9A9CA0` / `#55585D` |
| 鈉燈橘 暗 / 主 / 亮 | `#9C5A22` / `#F5893D` / `#FFC38A` |
| 塗鴉 洋紅 | `#E0338A` |
| 塗鴉 青 | `#2EC4C6` |
| 塗鴉 酸綠 | `#9BD437` |
| ⚠ 警報血紅 | `#B22222` —— **整款只給 The Bruiser（SW）**，打樣只有 ④ 可以用 |

主色分配（整套定案時用，打樣先做 ①）：H1 金鍊＝鈉燈橘、H2 街區＝青、H3 鈔票捲＝酸綠、
H4 酒瓶＝洋紅、H5 低底盤車＝黑白＋一點橘。W 指虎＝鈉燈橘、FS 音響＝青＋洋紅、SW＝血紅。

### 生圖共通設定

- **符號背景一律純藍 `#0000FF`**（背景圖除外）。色票裡有洋紅也有綠，所以這次不用洋紅/綠幕。
- 符號生成 **1024×1024**，主體置中、四邊留 8%；交件後程式量化、縮成 512。
- **圖裡不准有任何文字、字母、數字**。塗鴉 tag、WILD、倍數全部由程式用字型排。
- 紙紋、印刷錯位、噴點雜訊一律程式加，不要叫模型畫。

### 共通風格段（貼在每一則提示詞最前面）

```
die-cut vinyl sticker illustration, thick clean white sticker border around the whole
silhouette, bold black outline inside the border, black interior lines at half the
outline weight, flat colour fills with no gradients, one hard-edged flat shadow shape
per form, street graffiti sticker style, limited palette of ink black #121212, sticker
white #F7F5F0, {main colour hexes}, crisp vector-like edges, bold simplified shapes
```

### 共通負面詞（貼在每一則提示詞最後面）

```
3D render, CGI, octane, unreal engine, photorealistic, realistic lighting, glossy,
shiny, specular highlights, metallic sheen, chrome reflections, rust texture, grunge
texture, bloom, glow, lens flare, god rays, volumetric light, depth of field, bokeh,
sparkles, particles, airbrushed gradient, smooth gradient, soft shading, painterly,
dark moody background, text, letters, numbers, graffiti lettering, watermark,
signature, logo
```

---

## 1. 六件打樣

依序：共通風格段（填入主色）＋主體段＋共通負面詞。

### ① H1 假金鍊（最高賠付）— 主色鈉燈橘

```
[共通風格段, main colours dark sodium orange #9C5A22, sodium orange #F5893D,
light orange #FFC38A], a thick chunky curb chain necklace hanging in a U shape with a
big crown pendant at the bottom, links drawn as simple bold ovals, one flat chipped
patch on the pendant showing darker metal underneath, centred on a pure blue #0000FF
background, 8% empty margin
```

### ② L1 王冠 tag（小圖）— 只有灰

```
flat street graffiti tag drawn with a fat grey marker on a wall, a simple three-point
crown outline, single line weight about 5% of the canvas, slight marker wobble, two
small flat drip shapes under it, only grey #9A9CA0 and dark grey #55585D, no sticker
border, no fill colour, centred on a pure blue #0000FF background, 8% empty margin
[共通負面詞]
```

### ③ W 指虎 — 主色鈉燈橘

```
[共通風格段, main colours dark sodium orange #9C5A22, sodium orange #F5893D,
light orange #FFC38A], brass knuckles seen straight from the front, four finger rings
in a row and a curved grip bar, slightly tilted, centred on a pure blue #0000FF
background, 8% empty margin
```
（WILD 字由程式壓在握把上。）

### ④ SW The Bruiser — 血紅（全款唯一可用血紅的圖）

```
[共通風格段, main colours alarm red #B22222, ink black, sticker white, small touches of
grey #9A9CA0], a hooded street thug from the chest up swinging a wooden baseball bat
across the frame, face half hidden by a bandana, three flat red speed-line shapes
following the bat swing, aggressive, centred on a pure blue #0000FF background,
8% empty margin
```

### ⑤ 背景局部（後巷）— 1920×1080，只有灰

```
greyscale ink line drawing of a narrow city back alley at street level, brick walls,
a chain-link fence, fire escape, dumpster, street lamp, overhead wires, clean black and
grey ink lines only, no colour fills, no shading, light grey paper #D8D6D1 ground,
lines in #55585D and #9A9CA0, flat perspective, calm composition with an empty centre
area, a few blank sticker-sized spots on the walls
[共通負面詞]
```
（中間要留給盤面；牆上的彩色貼紙之後由程式貼，不要叫模型畫。）

### ⑥ MG 角色頭（打手）— 胸像，看角色風格

```
[共通風格段 但把 "die-cut vinyl sticker illustration, thick clean white sticker border
around the whole silhouette" 換成 "flat street cartoon illustration, white sticker
border only along the outer silhouette", main colours sodium orange #F5893D for the
skin light tone #FFC38A / #9C5A22, grey #55585D hoodie, black bandana], a street
thug head and shoulders in three-quarter view facing left, hood up, bandana over the
nose and mouth, heavy brow, eyes narrowed, chunky simple shapes, centred on a pure
blue #0000FF background
```
⚠ 膚色用暖橘的亮/暗階，不准變成金色（Capo 打樣踩過）。⚠ 角色頭要面向**左**（MG 角色站在盤面右側，要看向盤面）。

---

## 2. 交件與我這邊的驗收

交件放 `design/_incoming/style_test_street/`（檔名 `h1.png l1.png w.png sw.png bg_crop.png cast_head.png`）。
我會做：

1. 藍幕去背、量化到色票、縮 512（照 Capo `build_style_test.py` 改寫）。
2. `check_style.py --sheet`：colors95、soft% 要遠低於現版渲染。
3. 換進真盤面（暫換 static 同名檔，原檔備份）＋ 200px 縮圖測試，跟現版並排給你看。
4. 小圖對照：現有 `l1–l4` 灰色噴漆也一起放上去比，**如果現有的就夠，小圖可以不重生**。

## 3. 這次一起處理的「Poor animations ×2」

換畫風本身不會解決動畫標籤。新媒材有自己的動作語言，定稿後一起做：

| 時刻 | 貼紙版動作 |
|---|---|
| 符號落地 | 「拍上去」：0.92→1.06→1 擠壓＋一格白閃 |
| 中獎 | 貼紙一角翹起再拍回、輕微晃動；小圖是噴漆線條重新「噴一遍」（描線動畫） |
| Bruiser 展開 | 噴罐一路掃下整條，紅色滴漆往下流 |
| Big Score / 大獎 | 整盤貼紙一張張被「撕開」露出底下獎牌 |
| FG 進場 | 一整面牆被新貼紙蓋過（取代鐵捲門） |

另外要先跑 `check_review_tags.py` 與完整遊玩一輪，把「關鍵時刻沒有動畫」的地方列出來。
