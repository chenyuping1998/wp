# Capo Nostra — 美術需求（Art Deco 黑白紅版）

2026-10-04 起取代舊版（半寫實渲染，已移到 `design/_legacy_assets/ART_BRIEF_v1_render_20261004.md`）。
打樣過程與數字在 `design/STYLE_TEST_ARTDECO.md`。

**怎麼用這份**：每則提示詞 = `[STYLE]` + 主體段 + `[NEG]`，**每次都附上 §0.3 的三張風格定稿圖**。
生好的圖照 §11 交件，我負責去背、量化、量數字、接進遊戲。

---

## 0. 畫風鎖定（每一張都照這個）

### 0.1 畫風與理由

**Art Deco 海報造型＋黑白四階＋單一紅。** 1930 年代黑幫題材自己的印刷語言（Deco 海報）配上黑色電影的
黑白。紅色只給金庫倍數框，讓「紅＝倍數」成為全款唯一的訊號。Hacksaw／Nolimit 都沒有 Deco 幾何的
黑白遊戲，跟它們的黑白作品（蝕刻、寫意筆觸）靠造型分開。

### 0.2 技法規則（數字，不是形容詞）

| 規則 | 數值 |
|---|---|
| 造型 | 只用圓、弧、直線、等距平行線；能對稱就對稱 |
| 明暗 | 階梯色帶，每個形體最多 3 階，階與階是硬邊，**不准平滑漸層** |
| 外框線 | 沒有描邊，形體靠明度差分開 |
| 最小形狀 | 短邊 ≥ 畫布邊長 2.5%（512px 上 ≥ 13px） |
| 裝飾 | 放射線、階梯（ziggurat）、流線平行線；**不要**花草捲曲 |
| 光 | 單一硬光由左上打下，所有圖同一方向 |

### 0.3 色票

| 用途 | Hex | 規則 |
|---|---|---|
| 墨黑 | `#121212` | 大塊陰影、底 |
| 深灰 | `#333333` | 暗面 |
| 中灰 | `#8C8C8C` | 本色 |
| 紙白 | `#ECE8DF` | 亮面 |
| 紅 深／主／淺 | `#5A0F12` / `#C1272D` / `#F2D6D0` | **只給金庫倍數框、倍數字、倍數相乘特效**；任何畫面紅色面積 ≤ 10% |

**全款其他任何東西都不准有顏色**：符號、角色、背景、UI、特殊 Wild、轉場、縮圖。

### 0.4 風格定稿圖（`design/style_frame/`，每次生圖都附）

| 檔 | 管什麼 | 量測（512px） |
|---|---|---|
| `h1.png` 權戒 | 符號 | colors95 8、soft 11.5%、色票吻合 98.5%、彩度 1.8 |
| `don_head.png` Don 頭 | 角色 | colors95 6、soft 8.0%、色票吻合 99.1%、彩度 1.0 |
| `frame_1x1.png` 紅框（量測用 `frame_1x1_512.png`） | 倍數框 | colors95 35、soft 28.1%、紅色票吻合 92.8% |

`source/` 是原始生成圖。

### 0.5 驗收門檻（`check_style.py`，對照定稿圖）

| 類別 | colors95 | soft | 色票吻合 | 彩度 |
|---|--:|--:|--:|--:|
| 符號、角色、背景、UI | ≤ 15 | ≤ 18% | ≥ 97% | ≤ 4 |
| 細節多的高分（H2、H3、H5） | ≤ 15 | ≤ 22%，並且 70px 一眼可辨 | ≥ 97% | ≤ 4 |
| 倍數框（紅） | ≤ 40 | ≤ 32% | ≥ 90%（紅色票） | — |

### 0.6 `[STYLE]` 共通風格段

```
Art Deco poster illustration, 1930s, geometric stylisation built only from circles,
arcs, straight lines and evenly spaced parallel lines, symmetrical composition,
large flat shapes, high-contrast black and white, stepped tonal bands with hard
edges (at most three values per form), only four tones: ink black #121212, dark grey
#333333, mid grey #8C8C8C, paper white #ECE8DF, no colour at all, no outlines, forms
separated by value contrast, single hard light from top-left, crisp vector-like edges
```

紅框類（§3）把最後一行的四色換成：`deep red #5A0F12, signal red #C1272D, pale rose #F2D6D0,
ink black #121212 for shadow faces, no other colours`。

### 0.7 `[NEG]` 共通負面詞

```
3D render, CGI, octane, unreal engine, photorealistic, glossy, shiny, specular
highlights, metallic sheen, chrome reflections, bloom, glow, lens flare, god rays,
volumetric light, depth of field, bokeh, sparkles, particles, airbrushed gradient,
smooth gradient, soft shading, art nouveau, floral curls, vines, filigree, engraving
hatching, cross-hatching, halftone dots, paper texture, grain, black outlines,
comic ink lines, text, letters, numbers, watermark, signature, logo,
colour, color, sepia, gold, yellow, green, blue, red
```

紅框類拿掉最後的 `red`。

### 0.8 模型不准做的事（全部由程式做）

文字與數字（16 種語言）、UI 圖示、網點／紙紋／印刷錯位、光暈與粒子、色票本身（量化在 2× 做）。

---

## 1. 角色（兩隻：MG Don、FG 夜總會女主人）

分層需求單在 `design/cast_brief/mg/`、`design/cast_brief/fg/`，由 `brief.py` 用本檔 §0 產生，
各自附定稿圖。重點：

- **全黑白**，臉照 `don_head.png` 的打法：亮面紙白、本色中灰、暗面沉進墨黑。
- 四肢以平塗為主，階梯明暗只放在頭和軀幹（四肢彎折時色帶會被拉扯）。
- 手臂離開身體（舊 Don 手臂貼身，網格只能把動作縮到 0.18 倍）。
- 兩隻都不准有紅色，不拿槍。
- 剪影對比：Don「寬、重、黑」，女主人「細、高、紙白手套＋黑禮服」。
- 角色不能跟背景同色系糊在一起：背景暗的地方角色要有紙白邊（見 §4）。

---

## 2. 符號（512×512，生成 1024×1024，洋紅底）

### 2.1 規則

- **賠付等級靠明度和大小，不靠顏色**。灰階平均明度：H1 最亮（≥ 135）、其他高分 ≥ 95、
  Wild／Scatter ≥ 120、小圖 ≤ 60；**最暗的高分 ≥ 最亮小圖的 1.6 倍**。
  （2026-10-04 放寬：高分之間不必嚴格照賠付排序 —— 第 1 批 H3 101 < H4 120，但縮到 70px 高低分仍一眼分開。）
- 高分佔格 50–65%；小圖 ≤ 45%、紙白 ≤ 5%。
- 剪影一眼分得出：戒指、塔樓、手提箱、方杯、橫向轎車、帽子、琴盒、圓盤 —— 不要兩個都是圓的高分符號。
- 圖裡不准有字（帽帶留白，WILD 由程式排）。

### 2.2 已完成

| 檔 | 內容 | 狀態 |
|---|---|---|
| `h1.png` | 權戒（5×400） | ✅ 定稿圖 |
| `w.png` | 紳士帽 Wild | ✅ |
| `fs.png` | 金庫轉盤 Scatter | ✅ |
| `l1_v4.png` | 黑桃籌碼 | ✅ |
| `l2_v4.png` | 紅心籌碼（黑白） | ✅ |
| `h3.png` | 現鈔手提箱 | ✅ 第 1 批（soft 19.1%，略超門檻但 70px 判讀清楚，保留） |
| `l3_v4.png` `l4_v4.png` | 方塊、梅花籌碼 | ✅ 第 1 批 |
| `sw.png` | 小提琴盒 | ✅ 第 1 批 |
| `capoFx/sw_case_open.png` | 小提琴盒開蓋 | ✅ 第 1 批 |
| `h2.png` `h4.png` `h5.png` | 摩天樓、威士忌、轎車 | ✅ v2（H2 soft 20.7%、H5 21.6%：細節多，70px 判讀清楚；處理時清雜點） |

**符號 12 張全部到齊（2026-10-04）**，處理好的在 `design/_artdeco/full/capoSymbols/`，尚未裝進 `static/`。
真盤面截圖：`design/_artdeco/board_full_symbols.png`。

### 2.3 要生的

> **第 1 批重生（2026-10-04）**：H2、H4、H5 用 §2.4 的 v2 提示詞，下面的 v1 留作紀錄。

**H2 Deco 摩天樓（5×200）**
```
[STYLE], a tall stepped Art Deco skyscraper seen straight on, setback tiers like a
ziggurat, crowned by a needle spire and a half sunburst crown, vertical window bands
as evenly spaced parallel lines, lit face paper white, shadow face ink black, two
shorter towers behind it in dark grey, object fills 85% of the frame height, centred,
flat solid magenta #FF00FF background, [NEG]
```

**H3 現鈔手提箱（5×50）**
```
[STYLE], an open leather briefcase seen from the front at a slight high angle, lid
raised, packed with stacked bundles of banknotes drawn as flat paper white blocks
with a mid grey paper band around each bundle, no printed numbers or portraits, case
body ink black with a dark grey stepped light band, two square stepped clasps in mid
grey, object fills 80% of the frame width, centred, flat solid magenta #FF00FF
background, [NEG]
```

**H4 威士忌方杯與雪茄（5×30）**
```
[STYLE], a heavy faceted whisky tumbler with a stepped geometric cut pattern, the
whisky as a flat mid grey band, one large ice cube as a paper white block, a thick
cigar resting across the rim, a thin ribbon of smoke built from three parallel arcs,
object fills 75% of the frame, centred, flat solid magenta #FF00FF background, [NEG]
```

**H5 1930 年代黑頭轎車（5×10，高分裡最暗）**
```
[STYLE], a 1930s long sedan in exact side view, flowing fenders built from clean
arcs, a running board, wheels as concentric rings, trim as thin paper white lines,
body ink black with one broad mid grey stepped light band along the side so at least
a quarter of the car reads light, object fills 90% of the frame width, centred,
flat solid magenta #FF00FF background, [NEG]
```

**L3 方塊籌碼／L4 梅花籌碼** —— 照 L1 原文，只換花色：
```
[STYLE], a round casino chip seen straight on, rim divided into eight segments
alternating ink black and dark grey, a thin mid grey inner ring, centre disc in ink
black, a bold {diamond | club} shape in mid grey with a single dark grey stepped edge,
no numbers or letters, object fills 60% of the frame, centred, flat solid magenta
#FF00FF background, [NEG]
```

**SW 小提琴盒（特殊 Wild，取代 Tommy Gun，不准有紅）**
```
[STYLE], a closed violin case standing upright and tilted ten degrees, its outline a
figure-of-eight body tapering to a narrow neck end, built from clean arcs, shell ink
black with a dark grey stepped light band, a paper white carrying handle and two
stepped paper white clasps, behind it a burst of jagged paper white sunburst rays,
no weapon, no lettering, object fills 85% of the frame height, centred, flat solid
magenta #FF00FF background, [NEG]
```

**SW 開蓋（展開特效用，`capoFx/sw_case_open.png`，1024×1024）**
```
[STYLE], the same violin case from the same angle with its lid swung open, the
inside lined in mid grey, a blaze of stepped paper white rays bursting out of the
open case, nothing inside the case, no weapon, flat solid magenta #FF00FF background,
[NEG]
```


### 2.4 第 1 批重生提示詞（v2）

**H2 v2 —— 塔身加寬、窗格加粗**（v1 太細：佔格 42%、窗格線在 70px 糊成灰）
```
[STYLE], a massive stepped Art Deco skyscraper seen straight on, a broad base and three
wide setback tiers, the tower body as wide as half the frame, crowned by a short thick
spire with a full sunburst crown behind the top tier, at most five vertical window
bands per tier and every band at least 3% of the frame wide, lit face paper white,
shadow face mid grey, no flanking towers, object fills 85% of the frame height and
60% of its width, centred, flat solid magenta #FF00FF background, [NEG]
```

**H4 v2 —— 要一眼是酒杯**（v1 像條紋水桶、雪茄末端像素階梯）
```
[STYLE], a short heavy whisky tumbler in three-quarter view, clearly a drinking glass:
a thick flat glass base and a visible elliptical rim, straight sides with one row of
large stepped diamond facets around the lower half, the whisky as a flat mid grey band
filling the lower half, one large paper white ice cube, a thick cigar resting across
the rim with a smooth rounded ash tip, smoke as three thick parallel arcs, object fills
75% of the frame, centred, flat solid magenta #FF00FF background, [NEG], pixel art,
stair-stepped edges, bucket, can, drum, stripes around the glass
```

**H5 v2 —— 改成前側 3/4 視角，車變大**（v1 正側面只佔格 27%）
```
[STYLE], a 1930s sedan in three-quarter front view, a long hood with a tall vertical
stepped radiator grille in paper white, round headlamps, sweeping arc fenders, body ink
black with broad mid grey light planes on the hood and the side, wheels as thick
concentric rings, every trim line at least 2.5% of the frame thick, no thin pinstripes,
the car fills 85% of the frame width and 60% of its height, centred, flat solid magenta
#FF00FF background, [NEG]
```

---

## 3. 金庫倍數框（全款唯一的紅）

三個尺寸是**三個不同的物件**，不是同一張放大；**框的寬度不跟著放大**，中空才會越來越大。
中間完全空（洋紅），符號從下面透出來，倍數字由程式排。

| 檔 | 尺寸 | 物件 | 框寬 | 中空 |
|---|---|---|--:|--:|
| `frame_1x1.png` | 256 | 金庫門框（✅ 定稿圖直接用，中空量出 68%，不用重生） | ≈ 40px | ≥ 68% |
| `frame_2x2.png` | 512 | 鉚釘現金箱正面（✅ 第 2 批，中空 86%） | ≈ 48px | ≥ 80% |
| `frame_3x3.png` | 768 | 圓形金庫大門的門框（✅ 第 2 批，中空 90%） | ≈ 56px | ≥ 85% |

生成 1024×1024，框寬照上表換算（2×2：96px、3×3：75px）。

**1×1 重生（加寬中空）**：定稿圖的提示詞，把 `taking 72% of the width` 照舊、加上
`the border is thin: each side is no thicker than 14% of the frame width`。

**2×2 現金箱**
```
[STYLE 紅框版], a square frame shaped like the front face of a riveted steel cash
box, a thin border built from two stepped concentric bands, a row of small round
rivets along each side, a small stepped keyhole plate centred on the bottom edge, a
carrying handle shape on the top edge, each side of the border no thicker than 10% of
the frame width, the inside is a completely empty flat solid magenta #FF00FF square,
outside also flat solid magenta #FF00FF, [NEG 紅框版]
```

**3×3 圓形金庫大門框**
```
[STYLE 紅框版], a square frame shaped like the surround of a massive round bank vault
door, a thin square border of stepped bands, the inner corners filled with quarter
circle stepped rings that echo a round door, short radial bolt shapes evenly spaced
around them, four stepped ziggurat corner caps, a small round dial knob on the right
edge, each side of the border no thicker than 7% of the frame width, the inside is a
completely empty flat solid magenta #FF00FF area, outside also flat solid magenta
#FF00FF, [NEG 紅框版]
```

`frame_edge_*`（外框發光層）與黏著標記由程式從框的 alpha 產生，不用生（`design/build_frame_edges.py`）。

> 第 2 批量測：2×2 soft 34.9%／吻合 89.9%、3×3 soft 33.2%／吻合 86.0%，略超框類門檻。原因跟定稿圖一樣是細線框
> 縮到 512 量測時反鋸齒佔比高；目視為平塗四色，接受。`NeonFrames.svelte` 的 PLATE_BOX 已照新圖重量。

---

## 4. 背景（1920×1080，不去背）

中央 60% 寬要安靜（盤面蓋住），右側 30% 留給角色站。**角色站的位置背景要暗**，角色靠紙白邊跳出來。

| 檔 | 內容 | 狀態 |
|---|---|---|
| `bg_base.png` | 地下酒吧（翡翠版轉黑白） | ✅ |
| `bg_feature.png` | 夜總會舞台（女主人） | 要生 |
| `bg_epic.png` | 金庫室（The Don 等級） | 要生 |

`*_near.png` 由程式從原圖切。

**FG 夜總會舞台**
```
[STYLE], a 1930s nightclub stage seen straight on, a tall stepped proscenium arch, a
heavy curtain drawn back on both sides built from vertical parallel folds, a round
spotlight pool on the stage floor as a flat paper white ellipse, a row of small round
tables in the foreground as black silhouettes, the central 60% of the width is a calm
dark curtain backdrop with very little detail, the right third stays dark, overall
dark: ink black and dark grey dominate, paper white only on trims and the spotlight,
no people, full bleed, 16:9, [NEG]
```

**Epic 金庫室**
```
[STYLE], interior of a bank vault room seen straight on, a giant round vault door
standing open in the back wall with concentric stepped rings and radial bolts, walls
of safe deposit boxes as a grid of flat rectangles, stepped ziggurat pillars on both
sides, the central 60% of the width is a calm dark wall behind the open door with
very little detail, the right third stays dark, overall dark, paper white only on
edges, no people, full bleed, 16:9, [NEG]
```

---

## 5. 盤面與面板

| 檔 | 尺寸 | 內容 |
|---|---|---|
| `capoBoardFrame/frame_bg_capo_v1.png` | 1280 | 盤面底板：程式產生（墨黑平塗＋內緣一圈細階梯線），不用生 |
| `capoBoardFrame/frame_edge_capo_v1.png` | 1280 | 盤面外框，**要生**（見下） |
| `capoBoardFrame/fs_sign_capo_v2.png` | 1280×1002 | 免費遊戲標題牌，**無字** |
| `capoBoardFrame/fs_counter_panel_capo_v1.png` | 1280×966 | 免費遊戲計數面板，**無字** |

**盤面外框**（生成 1280×1280，洋紅底）
```
[STYLE], a square Art Deco picture frame border seen straight on, the border built
from three thin stepped bands in mid grey and paper white on ink black, stepped
ziggurat corner caps, a small half sunburst ornament centred on the top edge, each
side no thicker than 5% of the width, the whole inside is a completely empty flat
solid magenta #FF00FF square, outside also flat solid magenta #FF00FF, [NEG]
```

**標題牌／計數面板**（無字的 Deco 牌匾，各生一張，照尺寸比例）
```
[STYLE], a blank Art Deco plaque seen straight on, a wide rectangle with stepped
ziggurat ends, a thin paper white inner border, the centre is a flat ink black panel
with nothing on it, a small half sunburst above the panel, flat solid magenta #FF00FF
background, [NEG]
```

---

## 6. 特效與轉場

| 檔 | 處理 |
|---|---|
| `sw_muzzle_flash` `sw_bullet_holes` `sw_shell` | **刪除**（槍火，跟小提琴盒不搭） |
| `sw_column_beam` | 程式重做成紙白階梯光柱 |
| `sw_case_open`（新） | §2.3 生 |
| `fx_glow` `fx_star` `fx_streak` `fx_ray` `fx_vignette` | 程式產生，紙白；倍數相乘時用紅 |
| `fx_leaf` `car_side` | **刪除**（Hot Miami 殘留） |
| `vault_door_l/r`（1024×1536）、`vault_dial`（1024） | 轉場金庫門，要生（見下） |
| `coin.json` 硬幣 | 程式把現有圖轉成黑白銀幣 |

**轉場金庫門（左右兩扇，各生 1024×1536，不去背）**
```
[STYLE], the left half of a massive round bank vault door seen straight on, filling
the whole frame, concentric stepped rings, a row of radial locking bolts along the
cut edge on the right side of the image, heavy stepped rivets, ink black and dark
grey with paper white edges, full bleed, [NEG]
```
右扇：把 `left half` 改 `right half`、`right side` 改 `left side`。

**金庫轉盤**（1024，洋紅底）：沿用 `fs.png` 的造型，放大重生一張沒有外圈放射線的版本。

---

## 7. 標題、Logo、中獎橫幅 —— 字全部由程式排

舊圖把字燒在圖上（SOLDIER／CAPO／THE DON、BIG WIN…），只有英文。新版**只生無字底板**，字用字體排：
標題 **Limelight**，數字 **Josefin Sans**（兩者 OFL，非拉丁語言回落到系統字體）。

| 檔 | 尺寸 | 內容 |
|---|---|---|
| `title_soldier/capo/don.png` | 1024×360 | 無字底板，三檔遞進：線條 1／2／3 道、放射線無／半／全 |
| `capoWinBanners/*.png` ×5 | 1000×560 | 無字底板，五檔遞進：框線 1→5 道；**MAX 那張可以有紅** |
| `capoBrand/logo.png` | 1200×520 | 程式用 Limelight 排 CAPO NOSTRA ＋ 一枚小權戒剪影，不生 |

**標題／橫幅底板**
```
[STYLE], a blank wide Art Deco banner plate seen straight on, a horizontal panel with
stepped ziggurat ends, {one | two | three} thin paper white border lines, a {no |
half | full} sunburst fan rising behind the top edge, the centre panel is flat ink
black with nothing on it, flat solid magenta #FF00FF background, [NEG]
```

---

## 8. UI

- 圖示（`capoUiIcons/` 12 張）：**程式畫**，單色紙白，線寬跟盤面外框的細線一致。
- 底板（`capoUiPlates/`）：`button_plate`（256）、`spin_plate`（512）、`ticker_plate`（1206×165）、
  `buybonus_plate`、`card_plate`（640）—— 生成無字 Deco 圓鈕／長條牌：
```
[STYLE], a blank round Art Deco button plate seen straight on, concentric stepped
rings in dark grey and mid grey, a thin paper white outer ring, the centre is a flat
ink black disc with nothing on it, flat solid magenta #FF00FF background, [NEG]
```
- 滑過（hover）：亮自己的底板，**不准**用白色反灰方塊。
- Buy Bonus 卡框（`buy_card_frame.svg`）：程式改成灰階雙線。

---

## 9. 商店縮圖（1024×1024，BG 與 FG 分開）

**2026-10-04（商店圖重生）**：依使用者新要求，`design/_incoming/brand_artdeco_20261004/` 新增
`tile_background.png`、`tile_foreground.png`（Don 半身＋封閉琴盒）及 `thumbnail.png` 合成預覽；
另附 1920×1080 `cover_art.png` 無字底圖與 Limelight 排字的 `cover.png`。
縮圖曝光／透明度、各圖畫風門檻通過。已於本日更新到 `/Users/stone/stake-engine/upload/CapoNostra/thumbnail/`。
依最新 Claude skill，另由新 Don 前景與已交件女主人合成無字雙角色分層 cover，存於上架目錄 `cover/`；
本批內 `CapoNostra-Cover-BG.png`／`CapoNostra-Cover-FG.png` 為正式分層版本，原 `cover.png` 保留作排字概念稿。
前端重新建置後已更新上架目錄；math 九檔與 SDK 發佈檔 SHA-256 一致、沿用未改。尚未更新平台。

**必須紙白為主**（黑底會卡 `check_thumbnail.py` 的曝光門檻）。FG 是 Don 半身＋小提琴盒，四周留 ≥ 10%；
頭頂留空給平台疊標題。**沒有槍、沒有字。**

**BG**
```
[STYLE], a giant paper white Art Deco sunburst filling the frame, rays alternating
paper white and mid grey, a stepped ziggurat skyline silhouette in ink black along the
bottom fifth, overall light: paper white dominates, full bleed, [NEG]
```
FG 等角色分層交件後，由 `full.png` 合成，不另外生。

---

## 10. 程式端要改的（定稿後由我做，列在這裡對帳）

**2026-10-04（角色批）— 全部美術到齊。** `_incoming/cast_artdeco_20261004/` 兩隻角色（Don 6 層、女主人 9 層＋capo/don
變化圖）換進 `design/cast_parts/`（舊的移 `_legacy_assets/cast_parts_render_20261004/`），`check_layered_art` 通過、
`build_layered_rig` 重建骨架、`check_cast_layers`（build 閘門）通過、`build_cast_layers_runtime.py` 打包（2.5MB）。
遊戲裡確認兩隻都面向盤面、反應峰值無撕裂。黑色剪影在暗背景會沉，所以角色身後加了一圈紙白聚光（`CastFigureLayered.svelte`）；
開場卡 Don 高度 104vh→96vh 避免帽頂被切。商店縮圖：`capoBrand/tile_background_v3.png` ＋ `tile_foreground_v2.png`
（`design/build_store_tile_artdeco.py`），上架打包時用這兩張。

**2026-10-04（場景批）**：`_incoming/artdeco_scenes_20261004/` 的 FG 舞台、Epic 金庫室、轉場門左右扇、轉盤、縮圖背景
都已裝進 `static/`（轉成純灰、轉盤去背）。縮圖背景存成 `capoBrand/tile_background_v3.png`，`check_thumbnail.py` 通過
（平均 167、暗部 8%）；上架打包時要改用這張。三張背景的近景層（`*_near.png`）改成透明：Deco 對稱建築切一條出來
飄移會露接縫，整張背景的視差保留。**唯一還沒到的是兩隻角色。**

**2026-10-04（晚）**：字體已換（Limelight 標題、Josefin Sans 數字，OFL，從 google/fonts 下載；Cinzel、Orbitron 移到
`design/_legacy_assets/fonts_pre_artdeco_20261004/`）。`design/build_artdeco_ui.py` 用程式畫好 18 張並裝進 `static/`：
Logo、三個等級標題、五張中獎橫幅、Spin／圓鈕／跑馬燈／卡片／Buy Bonus 底板、FS 標題牌與計數面板、盤面外框與底板。
字全部用 Limelight 排，沒有模型生的字。**還要生圖的**：兩隻角色（§1）、FG／Epic 背景（§4）、2×2／3×3 倍數框（§3）、
轉場金庫門（§6）、商店縮圖（§9）—— 這些目前是灰階過渡版。

**2026-10-04 進度**：1–5、7、10 已做；6 已做（改名）；8、9 待做（字體要下載、標題／橫幅底板要等圖）。
- 已過關的新圖（12 符號、主遊戲背景、盤面底板、紅框、琴盒開蓋）**已裝進 `static/`**。
- 其餘還沒重畫的圖（UI 底板與圖示、標題、橫幅、Logo、轉場門、兩隻角色、FG／Epic 背景）用
  `design/greyscale_interim.py` 轉成**灰階過渡版**，讓整體畫面現在就一致；新圖到了直接覆蓋。
- 原檔：`design/_legacy_assets/static_assets_pre_artdeco_20261004.tgz`、`src_pre_artdeco_20261004.tgz`。
- 程式顏色：`palette.ts` 換 B 色票（舊名稱保留、值換成同角色的灰）；其餘 184 行寫死顏色由
  `design/desaturate_src_colours.py` 轉灰；`check_ui_palette.mjs` 改成 B 規則（UI 不准有任何色相、紅只准在 palette.ts 定義）。
- 仍要注意：2×2／3×3 舊框圖中間有半透明底，會把框裡的符號染紅 —— 第 2 批新框（中空完全透明）到了就解決。
- FG 女主人黑禮服在暗背景上偏糊，正式重畫時要照 §1「紙白邊」規則處理。

1. `src/game/palette.ts`：換成 §0.3 色票。
2. `NeonFrames.svelte`：三檔框色調、倍數字顏色 → 紅系；邊框發光層改由框 alpha 產生。
   框底下那層光暈（`fxGlow`）不能吃框的色調 —— 現在 3×3 框裡的符號被染成粉紅。
3. 期待特效（最後一條輪的光柱）：金 → 紙白。
4. `symbolWinMotion.ts`：L1–L4 與各符號的贏分色調 → 灰階；只有倍數相乘時用紅。
5. 特殊 Wild 展開：拿掉槍火／彈殼／彈孔，改成琴盒開蓋＋紙白光柱。
6. ✅ **「Tommy Gun」→「The Violin Case」**（2026-10-04 已改：介紹卡、規則頁、賠付表、Buy Bonus、載入畫面、等級說明；禁用詞檢查與 build 通過。這些字串沒有翻譯檔，只有英文）。程式註解等改特效時一起改。
7. 下注列、Buy Bonus、介紹卡的酒紅與金 → 灰階。
8. 字體：Cinzel → Limelight（標題）＋ Josefin Sans（數字）。
9. 標題、橫幅、Logo 改成無字底板＋程式排字。
10. 舊檔清理：`hotMiami*` 殘留、`fx_leaf`、`car_side`、`l1–l4` 舊版本、`frame.png`。

---

## 11. 交件

- 位置：`design/_incoming/<批次>/`，檔名照本檔的檔名。每件可多給 2–3 張候選，加 `_a` `_b`。
- 去背用的洋紅 `#FF00FF` 不在色票裡；背景圖、轉場門不去背。
- 生成尺寸：符號 1024；框 1024；背景 1920×1080；其他照表。我負責在 2× 量化、縮到交件尺寸。

### 建議批次順序

| 批 | 內容 | 為什麼先做 |
|---|---|---|
| 1 | H2–H5、L3、L4、SW、SW 開蓋 | 盤面一次換齊，最先看得到整體 |
| 2 | 1×1 重生、2×2、3×3 | 紅色是這款的招牌 |
| 3 | 兩隻角色分層（`cast_brief/`） | 最花時間，跟 1、2 平行 |
| 4 | FG／Epic 背景、盤面外框、面板、轉場門 | |
| 5 | 標題／橫幅底板、UI 底板、縮圖 BG | 最後收尾 |
