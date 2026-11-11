# Deadwood Express — 符號重做需求單（2026-09-26）

第二次送審三位審核都標「Low quality assets」。**列車長與背景保留**，所以新符號必須和它們同一種畫法（暗色寫實厚塗、夜色灰青＋舊銅），只修掉讓現有符號「一看就是 AI 圖」的毛病。

## 現有符號的問題（這次要避免的）

1. 全部都是亮面黃銅＋同一個左上高光 → 審核一眼認出是 AI 預設渲染
2. WILD / SCATTER 字是生圖畫的，字形歪
3. 光暈直接畫在圖裡
4. 五個高分同色、輪廓相近，縮到 70px 分不出來
5. A/K/Q/J 是四個同色字母，而且只是「字」，和旁邊的「物件」不是同一種工藝（Hot Miami 被判過 mismatched art styles 就是這個原因）

## §0 風格規格（每一張都照這個）

- **畫法**：matte painterly, semi-realistic, 和 `static/assets/deadwood/conductor.png`、`background.png` 同一個畫法。**生圖時把這兩張當參考圖一起附上。**
- **光**：單一柔和冷色月光，從左上方來；不要金屬高光、不要反光、不要邊緣光
- **視角**：正面稍微俯視 3/4，一個物件置中
- **質感**：只有一個符號（H4 懷錶）可以是亮金屬。其他的材質要不同：布料、玻璃、琺瑯、鑄鐵、木頭
- **專屬色**：每個高分符號一個保留主色（下表），面積約 25–35%，其他部分用背景的暗灰青 / 炭黑
- **細節預算**：細節只集中在主體的 1/3 焦點區，其他大面積要安靜
- **禁止**：字母、數字、文字、發光、光暈、粒子、煙霧特效、景深模糊、背景場景

背景色板（量自保留的美術，符號暗部用這些）：
`#12100f` `#171e1e` `#242423` `#2f434c` `#39504c` `#4a6770` `#779498` `#9bb9b9`

## 交件規格

- PNG，**1024×1024**，一張一個符號
- **純洋紅 `#FF00FF` 平塗背景**（我這邊去背；色板裡沒有洋紅，不會吃到圖本身）。不要棋盤格、不要漸層、不要地面陰影
- 物件高度佔畫面 **80–85%**，四周留一點邊，置中
- 檔名照下表，放進 `wp/apps/DeadwoodExpress/design/_incoming/`
- 每個符號可以多生 2–3 張讓我挑

## 符號表

高分改成「角色在上、物件在下」，這是業界慣例，也讓符號裡有角色（審核看重這點）。

| 檔名 | 等級 | 主題 | 保留主色 | 輪廓 |
|---|---|---|---|---|
| `H1.png` | 最高 | 幽靈列車長胸像（和旁邊的列車長**同一個人**） | 幽靈青 `#5fd6c4` | 人像、帽簷橫線 |
| `H2.png` | 次高 | 戴面紗的幽靈女乘客胸像 | 紫丁香 `#b08ae0` | 人像、面紗三角 |
| `H3.png` | 中 | 煤油提燈，**琥珀橘火焰** | 琥珀 `#f0a040` | 高瘦直立 |
| `H4.png` | 中低 | 懷錶，翡翠綠琺瑯錶面、舊金錶殼 | 翡翠 `#3fbf7f` | 正圓＋上方錶冠 |
| `H5.png` | 低 | 鐵道號誌燈，**紅色鏡片** | 號誌紅 `#e0463c` | 方形燈箱＋側臂 |
| `W_plate.png` | Wild | 蒸汽火車頭正面，下方有**空白**銅名牌 | 幽靈青 | 寬、對稱 |
| `S_plate.png` | Scatter | 舊車票，中間**空白**橫帶 | 舊紙米白＋青色壓印 | 斜放長方形 |
| `L_plate.png` | A/K/Q/J 共用 | **空白**琺瑯車站站牌（圓角盾形），邊框鉚釘 | 生成時用中性灰琺瑯 | 盾形 |

WILD、SCATTER、A/K/Q/J 的字**由我用 Cinzel 字型（遊戲本來就在用）排版合成**，不讓生圖寫字。A/K/Q/J 的四個琺瑯顏色也由我程式上色，所以 `L_plate.png` 只要一張。

## 提詞（英文，直接貼；每段後面都接「共用結尾」）

### 共用結尾（每張都貼在最後）

```
Match the painting style of the attached reference images exactly: matte painterly semi-realistic
illustration, dark night palette of charcoal and muted grey-teal. Single soft cool moonlight from the
upper left. Matte surfaces, no glossy highlights, no specular reflections, no rim light.
Detail concentrated on the focal third, large quiet shapes elsewhere.
Isolated single object centred, filling 80-85% of the frame height, on a perfectly flat solid
magenta #FF00FF background, no ground shadow, no scenery.
Negative: text, letters, numbers, words, logo, watermark, glow, bloom, lens flare, sparkles,
particles, smoke effects, depth of field, bokeh, 3D render, CGI, octane, plastic, chrome,
polished brass on everything.
```

### H1 — 幽靈列車長胸像

```
Slot game symbol: head-and-shoulders portrait of the same spectral Victorian railway conductor as
the attached character reference — same face, pale grey-green skin, white swept hair, peaked cap,
dark wool coat. His ghost-teal (#5fd6c4) scarf is the one saturated area. Slight smile, eyes
looking at the viewer. Cloth and skin are matte; the only metal is the small cap badge.
```

### H2 — 幽靈女乘客

```
Slot game symbol: head-and-shoulders portrait of a Victorian widow passenger ghost, translucent
lilac (#b08ae0) mourning veil and high-collared dress, pale face with calm sad expression, a small
cameo brooch. Veil fabric is the one saturated area; everything else muted charcoal.
```

### H3 — 提燈

```
Slot game symbol: an old railway kerosene hand lantern, blackened cast iron frame and wire guard,
thick glass chimney with a warm amber-orange (#f0a040) flame inside. The flame is painted as flat
warm colour, not a glow effect. Tall upright silhouette.
```

### H4 — 懷錶

```
Slot game symbol: an antique railway pocket watch seen from the front, aged gold case, emerald
green (#3fbf7f) enamel dial with simple dark hands and plain tick marks (no numerals), short chain
curling to one side. This is the only symbol with a metal case; keep it satin, not mirror-polished.
```

### H5 — 號誌燈

```
Slot game symbol: a railway signal lamp, square black-painted iron housing with a short side
bracket, one large round red (#e0463c) glass lens on the front. Chipped paint, rivets. Boxy
silhouette clearly different from a lantern.
```

### W_plate — Wild 底圖

```
Slot game symbol: front view of a haunted steam locomotive, symmetric, dark iron boiler with a
ghost-teal (#5fd6c4) headlamp lens, cow-catcher at the bottom. Across the lower third a wide BLANK
aged-bronze nameplate with a plain flat face and no engraving — it must stay empty.
```

### S_plate — Scatter 底圖

```
Slot game symbol: an old railway ticket stub tilted about 15 degrees, worn cream paper with torn
perforated edge, teal (#5fd6c4) printed border ornament of simple repeated lines. The centre band
is BLANK plain paper with nothing printed on it.
```

### L_plate — A/K/Q/J 共用底牌

```
Slot game symbol: a BLANK railway station enamel sign plate, rounded shield shape, neutral mid-grey
enamel face, thin dark iron rim with four rivets, slight chips in the enamel at the edges. The face
is completely empty, flat and evenly lit.
```

## 我收到圖之後做的事

1. 洋紅去背、檢查邊緣有沒有殘留洋紅
2. 裁切置中到遊戲用的 1254×1254
3. 用 Cinzel 排上 WILD / SCATTER / A K Q J 字樣，A/K/Q/J 底牌上四種琺瑯色
4. `check_style.py` 全套量測 + 180px / 70px 對照表
5. 放進遊戲、在 Storybook 截實際盤面給你看
6. 賠率表的符號名稱跟著改（Conductor / Veiled Passenger / Lantern / Pocket Watch / Signal Lamp）
