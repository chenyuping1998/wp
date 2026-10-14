# Capo Nostra — Art Deco 打樣提示詞

2026-10-03。使用者選定 Art Deco 海報畫風，全部重畫。這份是**打樣**（style test），
不是整套需求單：先生 6 件、縮到盤面大小驗，選出一張「風格定稿圖」後，才寫整份
`ART_BRIEF.md` §0 與其他符號的提示詞。

---

## 0. 風格規則（每一張都照這個）

**畫風**：1930 年代 Art Deco 海報 —— 幾何化、對稱、大平塗色塊、階梯式明暗。
**理由**：這是題材自己年代的印刷語言；Hacksaw 183 款、Nolimit 143 款都沒有正規 Deco 遊戲。

### 技法（寫成數字）

| 規則 | 數值 |
|---|---|
| 造型 | 只用圓、弧、直線、等距平行線組成；能對稱就對稱 |
| 明暗 | **階梯色帶**，每個形體最多 3 階（亮面／本色／暗面），階與階之間是硬邊，不准平滑漸層 |
| 外框線 | **沒有黑色描邊**，形體靠明度差分開 |
| 最小形狀 | 任何色塊短邊 ≥ 畫布邊長 2.5%（512px 上 ≥ 13px），否則縮到 70px 會糊 |
| 裝飾 | 放射線（sunburst）、階梯（ziggurat）、流線平行速度線；**不要**花草捲曲（那是新藝術） |
| 光 | 單一暖光由正上方偏左打下，所有圖同一方向 |
| 金色面積 | ≤ 15%（H1 權戒例外，可到 40%） |

### 色票（7 色，生完會在 2× 尺寸量化到這幾色再縮小）

| 用途 | Hex |
|---|---|
| 墨黑 | `#14110F` |
| 深翡翠 | `#16403C` |
| 翡翠 | `#2E7A70` |
| 暗金 | `#8A6D1F` |
| 金 | `#C9A227` |
| 象牙 | `#EDE3CC` |
| 酒紅（只給紅心／方塊類小圖與少量點綴） | `#5C2126` |
| ⚠ 訊號紅 | `#C1272D` —— **整款只給特殊 Wild**，打樣裡只有 4b 可以用 |

翡翠＋金＋墨黑是這款跟 Turf War／Hard Time／Deadwood 拉開距離的關鍵，舊版的棕黑皮革基調不再用。

### 生圖共通設定

- **背景一律純洋紅 `#FF00FF`**（背景圖除外）。色票裡沒有洋紅，去背不會吃到圖。
- 符號生成 **1024×1024**，主體置中、四邊留 8% 空白；交件後由程式在 1024 量化、縮成 512。
- **圖裡不准有任何文字、字母、數字**（WILD 字樣、倍數都由程式排字）。
- 網點、紙紋、印刷錯位一律由程式統一加，**不要叫模型畫**。

### 共通風格段（貼在每一則提示詞最前面）

```
Art Deco poster illustration, 1930s, geometric stylisation built only from circles,
arcs, straight lines and evenly spaced parallel lines, symmetrical composition,
large flat colour shapes, stepped tonal bands with hard edges (at most three values
per form: lit face, local colour, shadow face), no outlines, forms separated by value
contrast, single warm light from top-left, limited palette of ink black #14110F,
deep jade #16403C, jade #2E7A70, dark gold #8A6D1F, gold #C9A227, ivory #EDE3CC,
crisp vector-like edges
```

### 共通負面詞（貼在每一則提示詞最後面）

```
3D render, CGI, octane, unreal engine, photorealistic, glossy, shiny, specular
highlights, metallic sheen, chrome reflections, bloom, glow, lens flare, god rays,
volumetric light, depth of field, bokeh, sparkles, particles, airbrushed gradient,
smooth gradient, soft shading, art nouveau, floral curls, vines, filigree, engraving
hatching, cross-hatching, halftone dots, paper texture, grain, black outlines,
comic ink lines, text, letters, numbers, watermark, signature, logo
```

---

## 1. 六件打樣

依序：共通風格段 + 下面的主體段 + 共通負面詞。

### ① H1 教父權戒（最高賠付 400×）

```
[共通風格段], a single heavy gold signet ring seen at a three-quarter angle,
the flat oval face carved with a stepped ziggurat crest, the band built from
three stepped gold bands, a small fan of jade sunburst rays behind it,
object fills 80% of the frame, centred, flat solid magenta #FF00FF background,
[共通負面詞]
```

驗收重點：縮到 70px 還認得出是「戒指」；金色階梯清楚三階、沒有鏡面亮點。

### ② L1 黑桃（小圖）

小圖要用同一個世界的材質，不是平面字形。這裡做成一枚 Deco 賭場籌碼上的黑桃鑲嵌。

```
[共通風格段], a round casino chip seen straight on, ivory and jade stepped rim
divided into eight equal segments, a bold spade shape inlaid in the centre in
ink black with a single gold stepped edge, no numbers or letters on the chip,
object fills 70% of the frame, centred, flat solid magenta #FF00FF background,
[共通負面詞]
```

驗收重點：亮部面積要比 H1 小（小圖不能搶高分）；灰階化後明度低於 H1。

### ③ W 黑色紳士帽（Wild）

```
[共通風格段], a black fedora hat in three-quarter view, crown and brim built from
clean arcs, two-step black shading with one ivory light band along the brim edge,
a plain gold hat band with a small stepped ziggurat buckle, the band is blank with
no lettering, a half sunburst of gold rays fanning behind the hat,
object fills 80% of the frame, centred, flat solid magenta #FF00FF background,
[共通負面詞]
```

驗收重點：帽帶留白（WILD 由程式排上去）；黑帽在深色盤面上靠放射線襯底分得開。

### ④ FS 金庫轉盤（Scatter）

```
[共通風格段], a round bank vault combination dial seen straight on, concentric
stepped rings in gold and jade, tick marks as evenly spaced short bars with no
numbers, a central knob with a four-point stepped star, thick ivory sunburst rays
radiating behind the dial,
object fills 80% of the frame, centred, flat solid magenta #FF00FF background,
[共通負面詞]
```

驗收重點：刻度是短槓、**沒有數字**；跟 ① 的戒指在剪影上明顯不同（圓盤 vs 戒指）。

### ④b（選做，要你拍板）特殊 Wild 改小提琴盒

審核紀錄有「不可出現寫實槍械」，風格化的 Tommy Gun 一樣有風險。這張是取代候選：
機制不變（落地整條輪變 Wild），只換圖。**要不要換你決定，先生一張看看。**

```
[共通風格段] plus signal red #C1272D, a closed black violin case standing
upright at a slight angle, its outline simplified into clean arcs, gold stepped
clasps and corner caps, a burst of signal red #C1272D jagged sunburst rays
behind it as the only red in the image, no weapon visible,
object fills 80% of the frame, centred, flat solid magenta #FF00FF background,
[共通負面詞]
```

### ⑤ 主遊戲背景

生 **1920×1080**，不去背。中央 60% 寬要「安靜」—— 那裡會被盤面蓋住，右側要留給 Don 站。

```
[共通風格段], interior of a 1930s speakeasy club seen straight on, symmetrical
architecture: tall stepped ziggurat archway in the centre, fluted jade columns
on both sides, a large gold sunburst panel on the back wall, a row of stepped
wall lamps casting flat bands of warm light, polished floor shown as flat
horizontal bands, the central 60% of the width is a calm dark jade wall with
very little detail, overall dark: ink black and deep jade dominate, gold only on
trims, no people, full bleed, 16:9,
[共通負面詞]
```

驗收重點：盤面放上去後背景退得下去；金色只在線條、不成片。

### ⑥ Don 頭部（角色）

只生頭與肩頸上緣，用來驗角色在這個畫風下的臉。**角色的平塗不能太碎**：臉上最多 3 階明暗，
陰影是幾塊大的幾何面。

```
[共通風格段], head and upper shoulders of a heavy-set mob boss in his late fifties,
facing three-quarter to the viewer's left, broad square jaw, heavy jowls, a nose
broken once and set slightly crooked to the right, deep-set narrow eyes under
thick brows, left eyelid drooping a little lower than the right, short grey hair
slicked back, a thick cigar clenched in the right corner of the mouth, expression:
bored contempt; face planes simplified into large geometric facets with three
stepped values, charcoal suit collar and ivory shirt collar, jade tie,
flat solid magenta #FF00FF background,
[共通負面詞]
```

驗收重點：不是「AI 帥大叔臉」—— 歪鼻、垂眼皮要看得出來；縮到 120px 還有表情。

（夜總會女主人的頭等 Don 這張過了再做，同一套規則。）

---

## 2. 交件與驗收流程

1. 生好的圖放 `design/_incoming/style_test/`，檔名：
   `h1.png`、`l1.png`、`w.png`、`fs.png`、`sw_violin.png`（選做）、`bg_base.png`、`don_head.png`。
   每件可以多給 2–3 張候選，加 `_a` `_b` 後綴。
2. 我這邊做：洋紅去背 → 2× 量化到色票 → 縮 512 → `check_style.py --sheet` 量數字
   → 放進開發伺服器的真盤面截圖（不是拼貼）→ 做 200px 商店縮圖試看。
3. 你從結果裡挑一張當**風格定稿圖**。之後所有提示詞都附這張圖、數字也以它為基準。
4. 定稿後才寫：其餘符號（H2–H5、L2–L4）、三個金庫倍數框、FG 背景、兩隻角色分層、
   UI、Logo、轉場、商店縮圖。

### 字體（跟著畫風換，先記著）

現在的 Cinzel 是羅馬碑文字，不是 Deco。標題建議換 **Limelight** 或 **Poiret One**，
數字用 **Josefin Sans**（細幾何、可讀）。定稿後一起換。

---

## 3. 第一輪結果（2026-10-03）

處理：`build_style_test.py`（洋紅依色相去背 → 1024 以 Lab 最近色量化 → 縮 512），輸出 `_style_test/`。
色票因此補兩階金：`gold_deep #574311`（金的暗面，少了它暗金會被量化成酒紅）、`gold_light #E6C65A`。
酒紅只開給紅心／方塊。

| 件 | colors95 | soft | 對色票 | 結論 |
|---|--:|--:|--:|---|
| H1 權戒 | 17 | 11.9% | 99.2% | ✅ 可當定稿候選 |
| L1 籌碼 | 12 | 7.2% | 99.1% | ⚠ 全套最亮（亮部 24.6%、佔格 61.5%）；程式改版 `l1_alt` 外圈改翡翠、縮 86% → 佔格 45%、平均明度 102（H1 110）。盤面上仍偏搶眼，建議重生 |
| W 紳士帽 | 22 | 10.7% | 98.7% | ✅ |
| FS 金庫轉盤 | 45 | 18.5% | 97.7% | ✅ 外圈細條在 70px 仍分得開 |
| Don 頭 | 31 | 9.4% | 90.6% | ❌ 膚色畫成金色，像金像；臉要另給膚色墨 |
| 背景 | — | — | — | ✅ 中央安靜、金只在線條 |

舊版半寫實渲染是 colors95 58–484／soft 29–65%，這批全部落在平面印刷區間。
真盤面（playtest shell，暫換 6 檔後已用 SHA1 驗證還原）：新符號一眼就跟舊的渲染符號分得開；
舊的皮革盤面底板和寫實 Don 跟新背景明顯不搭 —— 兩者都在整套重畫範圍內。

## 4. A／B 並排（2026-10-03）

`build_style_compare.py` 把同一批打樣逐墨色換成兩版：A 翡翠金、B 黑白＋紅（紅只給倍數框）。
同一手牌（forceBook=133，3×3＋1×1 框）在 playtest shell 各拍一張 → `_style_test/compare_deco_vs_noir.png`。
只換了 H1/L1/W/FS、背景、盤面底板、倍數框；其餘符號與 Don 仍是舊渲染圖，倍數字顏色寫在程式裡沒換。
playtest 的 14 個檔與 bundle 已還原並以 SHA1 驗過。

---

# 5. 定案：B 版 —— Deco 造型＋黑白＋單一紅（2026-10-03 使用者拍板）

**以下取代 §0 的色票與 §1 的提示詞。** 造型規則（圓、弧、直線、階梯明暗 ≤3 階、無描邊、
最小形狀 2.5%）照舊；換掉的是墨色。

## 5.1 色票

| 用途 | Hex | 規則 |
|---|---|---|
| 墨黑 | `#121212` | 大塊陰影、底 |
| 深灰 | `#333333` | 暗面 |
| 中灰 | `#8C8C8C` | 本色 |
| 紙白 | `#ECE8DF` | 亮面 |
| 紅（深／主／淺） | `#5A0F12` / `#C1272D` / `#F2D6D0` | **只給金庫倍數框、倍數字、倍數相乘的特效**，任何畫面紅色面積 ≤ 10% |

連帶改變：
1. **紅色從 Tommy Gun 移到倍數框。** 特殊 Wild 落地改用紙白閃光；它還是不准用紅。
   （Tommy Gun 要不要換成小提琴盒仍待決定。）
2. **紅心／方塊也是黑白**，靠形狀分，不靠顏色。
3. **賠付等級靠明度和大小**：高分 = 紙白面積大、剪影大；小圖 = 深灰為主、佔格 ≤ 45%、紙白 ≤ 5%。
   灰階下的平均明度必須照賠付排序。
4. **商店縮圖要做紙白為主**（黑底縮圖會卡曝光檢查）。
5. 程式端（定稿後一起改）：`NeonFrames.svelte` 的三個框色調與倍數字、`palette.ts`、
   贏分特效色、下注列與 Buy Bonus 的酒紅底板 → 灰階。

## 5.2 共通風格段（取代 §0 的版本）

```
Art Deco poster illustration, 1930s, geometric stylisation built only from circles,
arcs, straight lines and evenly spaced parallel lines, symmetrical composition,
large flat shapes, high-contrast black and white, stepped tonal bands with hard
edges (at most three values per form), only four tones: ink black #121212, dark grey
#333333, mid grey #8C8C8C, paper white #ECE8DF, no colour at all, no outlines, forms
separated by value contrast, single hard light from top-left, crisp vector-like edges
```

共通負面詞：§0 那份，再加上 `colour, color, sepia, gold, yellow, green, red, blue`
（紅框那幾張例外，見下）。背景照舊用洋紅 `#FF00FF`。

## 5.3 第二輪打樣

**沿用、不重生**：H1 權戒、W 紳士帽、FS 金庫轉盤、主遊戲背景 —— 用 `build_style_compare.py`
從翡翠金版逐墨色轉成黑白，形狀已在真盤面驗過。最後再決定要不要原生重生。

**要生的四件：**

### ⑦ L1 黑桃籌碼（重生：變暗、變小）

```
[共通風格段], a round casino chip seen straight on, rim divided into eight segments
alternating ink black and dark grey, a thin mid grey inner ring, centre disc in ink
black, a bold spade shape in mid grey with a single dark grey stepped edge, no
numbers or letters, object fills 60% of the frame, centred, flat solid magenta
#FF00FF background, [共通負面詞]
```
驗收：佔格 ≤ 45%、紙白 ≤ 5%、灰階平均明度低於 H1。

### ⑧ 1×1 金庫倍數框（B 版的招牌，紅色唯一出現的地方）

框中間要**完全空**（符號在下面透出來、倍數字由程式排）。生 1024×1024。

```
Art Deco poster illustration, 1930s, geometric, a square frame shaped like the face
of a bank vault door, thick border built from stepped concentric bands, four stepped
ziggurat corner caps, a row of round rivets along each side, a small round dial knob
at the middle of the right side, flat fills in deep red #5A0F12, signal red #C1272D
and pale rose #F2D6D0 with ink black #121212 for shadow faces, no other colours,
stepped tonal bands with hard edges, no outlines, the inside of the frame is a
completely empty flat solid magenta #FF00FF square taking 72% of the width, outside
the frame also flat solid magenta #FF00FF, [§0 共通負面詞，不加 red]
```
驗收：中空 ≥ 70% 寬；縮到 180px 一眼是「金庫門框」；紅色三階分得開。

### ⑨ Don 頭（重生：黑白）

```
[共通風格段], head and upper shoulders of a heavy-set mob boss in his late fifties,
facing three-quarter to the viewer's left, broad square jaw, heavy jowls, a nose
broken once and set slightly crooked to the right, deep-set narrow eyes under thick
brows, left eyelid drooping a little lower than the right, short hair slicked back,
a thick cigar clenched in the right corner of the mouth, expression: bored contempt;
face planes simplified into large geometric facets: lit side paper white, local tone
mid grey, shadow side ink black, the shadow side of the face falls mostly into solid
black like a film-noir key light, black suit, paper white shirt collar, dark grey tie,
flat solid magenta #FF00FF background, [共通負面詞]
```
驗收：縮到 120px 還看得出歪鼻和垂眼皮；臉不是灰糊一片（三階要分得開）。

### ⑩ L2 紅心（測黑白下花色怎麼分）

```
[共通風格段], a round casino chip seen straight on, rim divided into eight segments
alternating ink black and dark grey, a thin mid grey inner ring, centre disc in ink
black, a bold heart shape in mid grey with a single dark grey stepped edge, no
numbers or letters, object fills 60% of the frame, centred, flat solid magenta
#FF00FF background, [共通負面詞]
```
驗收：跟 ⑦ 並排縮到 70px，黑桃和紅心一眼分得出。分不出就改成四種花色各一種籌碼外形
（圓、八角、方、盾），交給下一輪。

交件：`design/_incoming/style_test_b/`，檔名 `l1.png`、`frame_1x1.png`、`don_head.png`、`l2.png`。

## 5.4 第二輪結果（2026-10-04）

`build_style_test_b.py` → `_style_test/b/`（籌碼統一縮成直徑 76%；紅框裁到自身邊界）。

| 件 | colors95 | soft | 佔格 | 平均明度 | 結論 |
|---|--:|--:|--:|--:|---|
| H1（翡翠版轉黑白） | 8 | 11.5% | 52.7% | 142 | ✅ |
| W | 9 | 11.6% | 50.1% | 125 | ✅ |
| FS | 10 | 16.8% | 71.2% | 134 | ✅ |
| L1 黑桃籌碼 | 3 | 6.0% | 45.0% | 54 | ✅ 紙白 0% |
| L2 紅心籌碼 | 3 | 5.8% | 44.8% | 56 | ✅ 70px 跟黑桃分得開 |
| Don 頭 | 6 | 8.0% | — | — | ✅ 黑色電影打光、歪鼻垂眼皮都在 |
| 1×1 紅框 | — | — | 中空 63%（舊框 69%） | — | ✅ 盤面上最醒目；正式版中空再加寬 |

真盤面（`board_b_round2.png`）看到的待改項，都在整套重畫範圍內：
舊 Tommy Gun 的紅色爆炸跟紅框搶紅 → 特殊 Wild 必須去紅；期待特效的金色光柱 → 改紙白；
倍數字 2x/4x 還是金色（程式）；其餘舊符號（手提箱、威士忌、轎車、方塊、梅花、天際線）、
盤面外框、下注列酒紅底板、Don 全身。

**風格定稿圖建議：H1 權戒（符號）＋ Don 頭（角色）＋ 1×1 紅框（倍數框）三張一組。**
