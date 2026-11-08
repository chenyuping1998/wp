# MUMMY MAYHEM — 美術需求單

> 這份是 Mummy Mayhem 美術的**唯一依據**。遊戲裡現在的圖全是 GoBoomana（礦坑猴子）的佔位圖，**不要參考它們的內容**。
>
> 交件放在 `design/source/mummy_delivery/<類別>/`，**檔名照表格寫**。收到後我負責去背、縮放、切 glow／sheen 圖層、量亮度、接進遊戲。
>
> 配套文件：
> - 人物圖層與關節規格：[MUMMY_CAT_RIG_SPEC.md](MUMMY_CAT_RIG_SPEC.md)（從 `wp/tools/mascot-rig` 的正面模板產生）
> - 動態與節奏：[MUMMY_RHYTHM_REQUIREMENTS.md](MUMMY_RHYTHM_REQUIREMENTS.md)
> - 音效：[MUMMY_AUDIO_REQUIREMENTS.md](MUMMY_AUDIO_REQUIREMENTS.md)
> - 規則：[../MUMMY_SPEC.md](../MUMMY_SPEC.md)

---

## 0. 主題

### 0.1 一句話

**金字塔墓室裡的木乃伊貓。** 主角是一隻胖胖、有點笨的木乃伊貓（埃及貓），繃帶總是鬆掉、一隻眼睛從繃帶縫裡冒出來、尾巴尖的繃帶拖在地上。好笑來自**繃帶出包**：一興奮繃帶就彈開、頭巾滑下來蓋住眼睛、尾巴纏到自己的腳。

古埃及本來就有大量貓木乃伊（祭祀貓神 Bastet），這個設定有出處，可以寫進遊戲介紹。

### 0.2 兩個輪盤的美術身分

| 機制 | 名稱 | 長相 |
|---|---|---|
| FG 倍率輪盤（每局有連線必轉） | **SCARAB WHEEL（聖甲蟲輪）** | 盤面下緣的半圓石拱，拱上嵌一條可捲動的石板格子帶；中央圓牌顯示目前倍數；拱頂一顆**聖甲蟲金幣按鈕** |
| 稀有輪盤（一局結束隨機） | **SUN WHEEL（太陽輪）** | 全螢幕的拉神太陽盤，12 格；四級分別是**黎明（綠松石）→ 上午（青藍）→ 正午（朱紅）→ 神聖紫金**；中心伸出一根指針旋轉 |

兩個輪盤上的**數字都由程式寫上去**（值來自數學設定），圖上一律不要畫數字。

### 0.3 調色盤

| 角色 | 色 | Hex |
|---|---|---|
| 墓室底色 | 深藍綠（夜色墓室） | `#10303A` |
| 牆面／盤框 | 砂岩 | `#D9B77A` |
| 砂岩暗部 | 焦褐 | `#7A5530` |
| 繃帶 | 米白 | `#F2E8D0` |
| 點綴 1 | 綠松石 | `#2EC4B6` |
| 點綴 2 | 胭脂紅 | `#C8443A` |
| 點綴 3 | 青金石藍 | `#2457A6` |
| **Scatter／太陽輪專用** | **太陽金** | `#FFC23A` |

**金色只屬於 Scatter（黃金貓神面具）和太陽輪。** 盤面上其他符號、盤框、UI 都不准用金色當主色。

> 跟 GoBananubis（同樣是埃及）要分得開：Bananubis 是黑曜石黑＋金邊、胡狼面具；這款是**砂岩＋繃帶米白＋綠松石**，明亮、好笑、不莊嚴。

### 0.4 從前幾款量出來的規則

1. **符號不能整片暗。** Boomana 第一版高分符號平均亮度只有 46～67，縮到格子大小幾乎看不見。這套每個高分符號在中央 60% 的**平均亮度 ≥ 70**（0–255）。
2. **高分靠「色相＋剪影」兩層分辨**，低分靠字形。低分用淡砂岩無彩板＋深色刻字，亮度給低分、彩度給高分。
3. **低分的亮度／亮區覆蓋率不能超過高分的最低值。** 交件後我會量，超過就重生。
4. **背景中央要暗、要安靜**：符號是去框的，背景會從格子間透出來。
5. **不要小星星、硬邊光環、方框特效**（使用者明確要求過）：光效用柔和背光和光澤掃過，這些由程式做，不用畫。

---

## 1. 給生圖的共用風格開頭（每次開新對話先貼）

```
You are producing a matched set of game art for a cartoon slot game called
"Mummy Mayhem": inside a sandstone Egyptian pyramid tomb, starring a chubby,
clumsy mummy CAT whose bandages keep coming loose. Style for EVERY image in this
conversation: painterly hand-illustrated casual game art, bold simple readable
shapes, thick clean silhouettes, soft cel shading, glossy highlights, warm torch
light from the upper left with a soft turquoise (#2EC4B6) rim light. Palette:
sandstone (#D9B77A), bandage cream (#F2E8D0), turquoise, carmine red (#C8443A),
lapis blue (#2457A6), deep tomb teal (#10303A). Bright, friendly and funny, never
spooky, never gory, no skulls, no real human mummies. Gold (#FFC23A) is reserved
for one golden cat mask and the sun wheel only; do not use gold as a main colour
anywhere else. Never include any text, letters, numbers, hieroglyph words, logos
or watermarks unless the prompt explicitly asks for a specific letter.
```

**生成方式**：同一個對話裡依序生，風格才一致。每張生完自己先縮到 120px 看一眼，認不出是什麼就重生。

**埃及元素的分寸**：象形文字只當**花紋**（不能拼出可讀的字），不要畫真實的神像、法老人臉、木乃伊人體。

---

## 2. 符號（13 張）→ `mummy_delivery/symbols/`

盤面是 5×5，一格在遊戲裡約 118px（桌機），符號要在這個大小一眼分得出來。

| 檔名 | 規格 | 內容 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild：木乃伊貓胸像 |
| `s.png` | 1024×1024 正方、不透明 | Scatter：黃金貓神面具 |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 錢幣（中央留白，金額由程式寫） |
| `x.png` | 1024×1024 **透明背景** | Hold & Spin 的空格（沒中獎的格子） |

**通則**
- 主體佔格子寬約 80%，四周留約 8%，不要貼邊（中獎時會放大到 1.3–1.55 倍，貼邊會被切）
- 高分／W／S 放在同一塊**深藍綠石板底板**上（`#10303A`，四角刻小聖甲蟲、一圈細砂岩邊）；低分放在**淡砂岩板**上。底板之後我會裁掉，但生的時候一定要有，整套比例才一致
- **每張高分的主色相都不一樣**，剪影也不一樣（直、圓、橫、斜各一）
- 中獎動畫是網格變形（拉伸、彎曲、局部晃），主體要是**完整、清楚的一個物件**，不要一堆小東西散在畫面上

### 2.1 高分（由高到低）

**H1 — 貓臉彩繪石棺**（綠松石＋青金石藍，直立剪影）
```
An upright Egyptian sarcophagus with a cute CAT face painted on its lid, filling
most of the frame, glossy turquoise (#2EC4B6) and lapis blue (#2457A6) painted
stripes, big friendly cat eyes painted on, little cat ears carved on top of the
lid, cream bandage strips peeking out from a gap in the lid. Strong rim light.
Tall vertical silhouette. Centred on a deep teal stone plate (#10303A) with tiny
carved scarabs in the corners and a thin sandstone edge. Square 1:1, no text.
```
為什麼是 H1：全套唯一的直立長形，顏色最飽和。中獎時可以做「棺蓋彈開一條縫、貓眼往外看」。

**H2 — 貓頭卡諾卜罐**（陶紅橘，花瓶剪影）
```
An Egyptian canopic jar with a chubby cat-head lid, filling most of the frame,
glossy terracotta orange and carmine red (#C8443A) glaze with painted turquoise
bands, the cat lid has closed happy eyes and whiskers, one bandage strip wrapped
around the jar's neck with a loose end. Rounded vase silhouette. Centred on a
deep teal stone plate (#10303A) with tiny carved scarabs in the corners and a
thin sandstone edge. Square 1:1, no text.
```
中獎時可以做「蓋子跳起來、貓頭轉一下再落回」。

**H3 — 被繃帶纏住的毛線球**（洋紅紫，圓形＋一條甩出的線）
```
A big round ball of magenta-purple yarn tangled up in cream mummy bandages,
filling most of the frame, one long loose yarn strand and one bandage strip
curling out to the side, soft fuzzy texture, glossy highlights. Round silhouette
with one strand leaving the body. Centred on a deep teal stone plate (#10303A)
with tiny carved scarabs in the corners and a thin sandstone edge. Square 1:1,
no text.
```
貓＋木乃伊的雙關笑點。那條甩出去的線是識別點，**不要縮回去**，中獎時它會甩動。

**H4 — 包著繃帶的魚骨**（淺青藍，橫向剪影）
```
A cartoon fish skeleton (a cat's treat) wrapped in cream mummy bandages like a
tiny mummy, lying horizontally across the frame, pale sky blue bones with a
cheeky fish head, a little bow of bandage at the tail. Clean horizontal
silhouette. Centred on a deep teal stone plate (#10303A) with tiny carved
scarabs in the corners and a thin sandstone edge. Square 1:1, no text.
```

### 2.2 特殊符號

**W — 木乃伊貓胸像（Wild）**
```
A chubby clumsy mummy CAT seen from the chest up, facing forward, filling the
frame. Body wrapped in cream bandages (#F2E8D0) that are coming loose in a few
places, one big round eye peeking out through a gap in the face bandages, the
other eye covered, a turquoise-and-lapis striped Egyptian nemes headcloth that
is slightly crooked, pointy cat ears poking through the bandages, a goofy happy
grin with one tiny fang. Bright and friendly, not spooky. Centred on a deep teal
stone plate (#10303A) with tiny carved scarabs in the corners and a thin
sandstone edge. Square 1:1, no text.
```
- **必須跟第 8 節的吉祥物是同一隻**，臉型、頭巾、露出的眼睛位置都要對得上
- 繃帶米白的身體是刻意的：深色底板上靠淺色身體撐起剪影

**S — 黃金貓神面具（Scatter）**
```
A polished golden (#FFC23A) Egyptian cat-goddess face mask, front view, filling
most of the frame, tall pointed ears, inlaid turquoise and lapis eye lines,
a small carved scarab on the forehead, hard bright specular highlights and a
warm glow around it. This is the ONLY gold object in the whole set and the
brightest symbol on the board. Centred on a deep teal stone plate (#10303A) with
tiny carved scarabs in the corners and a thin sandstone edge. Square 1:1, no
text.
```

**p.png — Hold & Spin 錢幣**
```
A thick round ancient coin seen straight on, aged bronze with a turquoise
enamel ring inset and a tiny scarab engraved on the rim, the flat centre left
EMPTY and smooth (a number will be printed there by the game). Transparent
background, no plate. Square 1:1, no text.
```
**不要用金色**（金色是 Scatter 的）。中央一定要乾淨，金額會寫在上面。

**x.png — Hold & Spin 空格**
```
An empty recessed sandstone niche tile, seen straight on, a shallow square
hollow carved into stone with soft dust, a faint carved border, very low
contrast and calm. Transparent background outside the tile. Square 1:1, no text.
```
它要**比錢幣暗很多**，Hold & Spin 時一眼看出哪些格子還空著。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**，分開生會變成五種字體。
```
The single letter "A" deeply carved INTO a pale sandstone tile (#E6D3AE), almost
colourless, with softly rounded corners and a thin cream edge. The letter is a
dark recessed cut (deep teal #10303A), thick blocky rounded sans-serif, with a
clean unbroken outline; the upper edge of the cut catches a bright highlight. A
tiny loose bandage strip is tied around the tile's top-left corner. Maximum
contrast between the dark letter and the pale tile. Any cracks or dust belong
to the TILE only — the letterform itself must stay perfectly clean and
unbroken. Square 1:1, only the single character "A" and no other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。**不要幫低分上顏色**，那條繃帶也維持米白。

---

## 3. 背景（3 張）→ `mummy_delivery/backgrounds/`

| 檔名 | 用途 | 場景 |
|---|---|---|
| `bg_base.png` | 主遊戲 | 火把照亮的墓室走廊 |
| `bg_feature.png` | 免費遊戲（Scarab Wheel） | 聖甲蟲神殿，天頂開口有晨光灑下 |
| `bg_holdandspin.png` | Hold & Spin | 堆滿古錢幣的寶藏室 |

**硬性規格**
- **16:9，至少 1920×1080**，直接生 16:9，不要生寬銀幕再讓我裁
- **畫面會被拉伸、不保持比例**：不要靠正圓或完整的圖案撐構圖
- **中央約 55% 寬 × 70% 高會被盤面蓋住，右側站著木乃伊貓**：細節放頂部和左側，中央要暗、要安靜
- **盤面下緣中央會有 Scarab Wheel 的半圓拱升起**，那一塊也不要放亮的東西
- 直式手機也用這張（左右會被裁），重點不要只放最左或最右
- 沒有人物、沒有文字、象形文字只當花紋
- **要能拆前後景**：請另外附一張 `bg_*_far.png`（只有最遠的牆／天空）和 `bg_*_props.png`（透明背景，只有火把、垂下的繃帶、砂粒堆這類會動的道具）。背景動態是程式拿這些層做的（火光閃、砂粒飄、繃帶晃），整張不拆就只能整片動

**bg_base — 墓室走廊**
```
16:9 game BACKGROUND plate, no characters, no text, hieroglyphs only as
decorative patterns. A sandstone tomb corridor inside a pyramid, warm torches
on the left and right walls, painted wall friezes of cats and scarabs (as
patterns), a few loose cream bandages hanging from the ceiling, soft dust in the
torchlight, deep teal shadows (#10303A). The CENTRE is darker, calmer and less
detailed (a slot board will cover it); keep the brightest details in the top
band and the left side. Painterly casual game art, warm and friendly, not
spooky.
```

**bg_feature — 聖甲蟲神殿**
```
16:9 game BACKGROUND plate, no characters, no text. A tall temple chamber with a
huge carved scarab relief high on the back wall holding a sun disc, a shaft of
warm morning light falling from an opening in the ceiling onto the floor,
turquoise inlays glowing softly, sand drifting in the light beam. Brighter and
more hopeful than the corridor. The CENTRE stays calmer and slightly darker (a
slot board covers it); keep the sun shaft to one side, NOT behind the middle.
Painterly casual game art.
```
**光柱要偏一邊**：Go Bananas 三代的 FG 背景太陽正好在最上排符號後面，最後得加一層霧才救回來。

**bg_holdandspin — 寶藏室**
```
16:9 game BACKGROUND plate, no characters, no text. A small treasure room inside
the pyramid, shelves and piles of aged bronze coins with turquoise rings, a few
canopic jars, cool lapis-blue shadows and warm coin reflections. Cooler and more
contained than the corridor. The CENTRE stays darker and calmer (a slot board
covers it). Painterly casual game art.
```

---

## 4. 盤面框與 FG 牌 → `mummy_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深藍綠半透明石面，幾乎沒細節 |
| `fs_sign.png` | 1280×1000，透明 | FG 標題牌：**三條橫向分隔的石板**（字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | FG 局數面板（上方中央留小凹槽放圖示） |

**frame_edge**
```
A square slot-machine board frame, 1:1, carved sandstone blocks with a thin band
of turquoise and lapis inlay running all the way around, small carved scarabs at
the four corners, one loose cream bandage wrapped around the top-right corner.
The ENTIRE INSIDE of the frame is empty and fully transparent — only the border
band exists. Border thickness about 6% of the width. Transparent background, no
text.
```
- 下緣正中**留一塊約框寬 40% 的平整石面**：Scarab Wheel 的小圓牌平常就停在那裡
- 框是**靜止的**（使用者要求：只動主角，邊框裝飾不動），不用為動畫設計

**fs_sign**：寬石牌，約 1.28:1，砂岩邊＋綠松石鑲邊，**分成三條等高的橫板**（中間用細砂岩條隔開），三條都留空。程式會讓三條各自晃一下，字騎在中間那條。

**fs_counter_panel**：同材質的一整塊面板（不分條），上方中央一個小凹槽，透明背景，無字。

---

## 5. Scarab Wheel（FG 倍率輪盤）零件 → `mummy_delivery/scarab_wheel/`

參考：2026-11-06 錄影（`E:\stake\proposals\輪盤雙機制\參考圖\FG輪盤_*`）。結構照抄，風格換成本作。
程式目前用色塊畫佔位，零件到了直接換上。

**幾何（以盤面寬 W＝1 計）**：拱的圓心在盤面下緣正中；外半徑 0.40W、內半徑 0.275W；中央圓牌半徑 0.20W；一次露出 7 格，每格約 25.7°。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `arch_base.png` | 1600×860，透明 | 半圓石拱本體（外框＋內側凹槽）。**圓心在圖下緣正中**，外緣半徑 = 圖寬 0.5 |
| `tile_normal.png` | 360×300，透明 | 一格石板（給 2–10×），**扇形、尖端朝下**（朝圓心），中間留空寫數字 |
| `tile_hot.png` | 360×300，透明 | 同形狀，胭脂紅（給 12–16×） |
| `tile_top.png` | 360×300，透明 | 同形狀，紫＋綠松石（給 32×，最稀有） |
| `tile_result_glow.png` | 360×300，透明 | 停中那一格的外光（柔和，**不要星芒**），程式用 add 疊 |
| `plate.png` | 640×640，透明 | 中央倍數圓牌（砂岩外圈＋深藍綠內面＋一圈綠松石），中間留空寫「×N」 |
| `plate_flash.png` | 800×800，透明 | 倍數更新時的金色光環（柔和漸層環） |
| `pointer.png` | 180×240，透明 | 拱頂的固定指針：小聖甲蟲造型，**尖端朝下**，尖端在圖下緣正中 |
| `button.png` | 420×420，透明 | 唯一的按鈕：聖甲蟲金幣（待按） |
| `button_lit.png` | 420×420，透明 | 同一顆，綠松石光點亮（滑過／可按） |
| `button_burst.png` | 600×600，透明 | 按下時金幣碎開的一張爆光圖（程式放大淡出） |

**規則**
- 格子扇形的**左右兩邊要沿半徑方向**，尖端角度 ≈ 25°，七格並排正好圍成半圓
- 三種格子**形狀完全一樣**，只換顏色和花紋（程式會替換）
- 按鈕上**不要畫字**，「SPIN」由程式寫；兩張（待按／點亮）構圖一模一樣
- 平常（不轉的時候）只看得到 `plate.png` 縮小一半停在盤框下緣，所以圓牌縮小後也要清楚

**按鈕的生圖提示**
```
A round golden-bronze coin button with a big carved scarab beetle on its face,
seen straight on, thick bevelled rim, turquoise enamel inlay on the scarab's
wings, clean and readable at small size. The centre stays uncluttered so a short
word can be printed over it. Transparent background, no text.
```
（例外：這顆按鈕可以用**偏銅的金**，因為它是 FG 專用、不會和盤面上的 Scatter 同時出現；但不要比 Scatter 亮。）

---

## 6. Sun Wheel（稀有輪盤）零件 → `mummy_delivery/sun_wheel/`

參考：東海龍王四級輪盤（`E:\stake\proposals\輪盤雙機制\參考圖\龍王輪盤_等級1–4.png`）。**拆層方式照龍王**：盤面、外框、等級光、指針、中心蓋分開，數字由程式寫。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `disc_lv1.png`～`disc_lv4.png` | 1200×1200，透明 | 四級盤面：**12 個扇形、不畫數字**；第 0 格（正上方）和第 6 格（正下方）是特殊格 |
| `ring.png` | 1400×1400，透明 | 四級共用的外框（太陽光芒造型），中間挖空 |
| `ring_glow_lv1.png`～`lv4.png` | 1400×1400，透明 | 各級的外框光暈（程式用 add 疊，換級時閃） |
| `needle.png` | 280×760，透明 | 從中心伸出的指針（鷹羽或權杖造型），**旋轉中心在圖的 (140, 620)**，尖端朝上 |
| `hub.png` | 320×320，透明 | 中心蓋（太陽圓盤＋聖甲蟲） |
| `wedge_win.png` | 640×640，透明 | 停中那一格的亮光（**白色**，程式依等級上色；形狀＝一格扇形，尖端在圖下緣正中） |
| `title.png` | 1200×300，透明 | 標題牌，**字畫在圖上：「SUN WHEEL」** |
| `levelup.png` | 1000×420，透明 | 升級時跳出的字牌，**字畫在圖上：「LEVEL UP!」** |
| `rays.png` | 1920×1080 | 全螢幕背景：太陽光芒放射（程式慢慢轉、半透明疊在暗幕上） |

**四級的盤面**（照龍王的格子排法）

| 等級 | 主題 | 主色 | 第 0 格（上） | 第 6 格（下） |
|---|---|---|---|---|
| 1 | 黎明 | 綠松石 `#2EC4B6`＋深綠 | LEVEL UP（青金石藍） | 最大值 30×（亮綠＋金邊） |
| 2 | 上午 | 青藍 `#2457A6` | LEVEL UP（胭脂紅） | 90× |
| 3 | 正午 | 朱紅 `#C8443A` | LEVEL UP（紫） | 200× |
| 4 | 神聖 | 紫 `#6A2C9E`＋太陽金 | 2000×（特殊色） | 3000×（金，全場最亮） |

- 其餘 10 格**兩種深淺交錯**（龍王也是），讓格子邊界清楚
- 特殊格要有**花紋或金邊**，一眼看出它不一樣
- LEVEL UP 那一格**只畫底色和一個向上的箭頭／太陽升起花紋**，字「LEVEL UP」由程式寫
- 四級的盤面**構圖、格子角度完全一致**，只換顏色和花紋（換級時程式直接換貼圖）

**盤面的生圖提示（等級 1）**
```
A flat circular wheel face seen straight on, divided into 12 equal wedge
segments radiating from the centre, NO numbers and NO text on it. Alternating
deep green and turquoise (#2EC4B6) wedges with subtle carved sandstone texture
and thin gold divider lines. The wedge pointing straight UP is lapis blue with a
small rising-sun motif; the wedge pointing straight DOWN is bright green with a
gold border. Clean, readable, no clutter. Transparent background outside the
circle. Square 1:1.
```
等級 2–4 換表裡的顏色，其餘一字不改。

**`title.png`／`levelup.png`**：字一定要拼對（S-U-N W-H-E-E-L、L-E-V-E-L U-P），生完逐字核對。字體用粗圓、好笑的展示字，砂岩刻字＋太陽金描邊。

---

## 7. 大獎牌匾（5 張）→ `mummy_delivery/banners/`

| 檔名 | 字 | 尺寸 |
|---|---|---|
| `big.png` | BIG WIN | 1000×560，透明 |
| `superwin.png` | SUPER WIN | 同上 |
| `mega.png` | MEGA WIN | 同上 |
| `epic.png` | EPIC WIN | 同上 |
| `max.png` | MAX WIN | 同上 |

```
A horizontal carved sandstone plaque, about 16:9, with turquoise and lapis inlay
borders and loose cream bandages wrapped around both ends, and the words
"BIG WIN" in large chunky carved letters with a warm glow across the upper part.
The lower 40% of the plaque is a plain EMPTY panel (the game prints the win
amount there). Transparent background. Only the words "BIG WIN", no other text.
```
- 字換成 SUPER WIN / MEGA WIN / EPIC WIN / MAX WIN 各生一張
- 等級越高越華麗：**綠松石 → 青金石 → 胭脂紅 → 紫 → 紫＋太陽金**，繃帶和裝飾越來越多（MAX 可以有一個小木乃伊貓頭探出牌子）
- 字一定要拼對，逐字核對
- **不要把牌匾畫成兩塊疊在一起**（使用者看過覺得像 AI 拼貼），一塊完整的板子

---

## 8. 吉祥物：木乃伊貓（全身，正面）→ `mummy_delivery/mascot/`

**Spine 骨架由套版骨架製作**：用 `wp/tools/mascot-rig` 的**正面吉祥物模板**（`template.json`，加權網格＋8 個動作），不手工綁骨、不在 Spine 編輯器裡另做。所以交件**一定要照模板拆圖層**，規格見 [MUMMY_CAT_RIG_SPEC.md](MUMMY_CAT_RIG_SPEC.md)（畫布 1024×1536、每個部件一張同尺寸透明 PNG、附 `joints.json`）。

> 版本：本 app 目前的 Spine runtime 是 4.2.74（從 Boomana 繼承，期待框、盤框光都是 4.2 檔），所以 build 時用 `--spine 4.2`。如果之後要整套換 4.3，那些舊 spine 也要一起換。

### 8.1 要交的圖層

| 檔名 | 這隻貓要畫什麼 |
|---|---|
| `tail.png` | 尾巴，整條纏繃帶，**尾巴尖的繃帶鬆開拖出一段** |
| `ear_l.png` `ear_r.png` | 尖耳朵，從頭部繃帶裡穿出來；耳根多畫進頭後面 |
| `leg_l.png` `leg_r.png` | 短胖的腿＋貓掌，整條繃帶；**一隻腳踝的繃帶鬆開一圈**（笑點） |
| `pelvis.png` | 骨盆（繃帶纏成的短褲形），兩個腿洞畫滿 |
| `torso.png` | 圓滾滾的肚子＋胸口，繃帶有幾處鬆開；兩肩、腋下畫完整 |
| `arm_l.png` `arm_r.png` | 整條手臂＋貓掌，肩膀頂端畫成圓；手肘微彎 |
| `head.png` | 貓臉＋歪掉的條紋頭巾（nemes）；**一隻大眼睛從繃帶縫露出來**，另一隻被繃帶蓋住 |
| `neck.png`（選用） | 脖子；可以畫一圈綠松石項圈 |

再加兩張**換圖用的頭**（表情不靠骨架、要換圖）：

| 檔名 | 用途 |
|---|---|
| `head_blink.png` | 露出的那隻眼睛閉上（眨眼） |
| `head_laugh.png` | 開口大笑、眼睛笑成彎線（中獎大笑、大獎） |

三張頭的**外輪廓、頭巾、耳朵位置要一模一樣**，只換眼睛和嘴，切換時才不會跳。

### 8.2 姿勢與比例（會決定他能不能動）

1. **正面站姿**，臉朝玩家，可以微微轉向盤面（盤面在他的左邊＝畫面左）
2. **兩手離開身體**，手臂和身體之間要看得到背景的縫（手臂貼身一動就會把肚子一起拖走）
3. **肩到手腕的長度 ≥ 肩到頭頂的高度**：短手貓很可愛，但手太短舉不過頭，`cheer` 的雙手舉高會蓋在頭上。可以靠「頭小一點、手長一點」或頭巾不要太高來達成
4. 手肘微彎 10–20°、膝蓋往外微彎 15–20°、兩腳與骨盆同寬、腳掌平貼地面
5. 身上**不要有東西擋在前面**（抱東西、雙手交叉都不行）
6. **全身在畫面內，連腳**，四周留空

### 8.3 交件前先對佔位人偶

```bash
node tools/mascot-rig/mascot.ts mannequin 角色/人偶
```
（在 `wp` 根目錄跑）會畫出一隻照規格的佔位猴子，圖層切法、關節位置照它做就對了。交件後我跑 `build` 套上同一組動作，看報告和逐格圖驗收。

### 8.4 生圖提示（完整的一張，用來確認造型，之後再照它拆圖層）
```
Full-body standing chubby mummy CAT character, same character as the Wild
symbol: wrapped in cream bandages (#F2E8D0) coming loose in a few places, one
big round eye peeking out through a gap in the face bandages, the other eye
covered, a crooked turquoise-and-lapis striped Egyptian nemes headcloth, pointy
cat ears poking through, a long bandaged tail whose tip is unravelling, a loose
bandage ring around one ankle, a turquoise collar. Facing the viewer, standing
relaxed, feet apart at hip width, knees slightly bent, BOTH ARMS HELD CLEARLY
AWAY FROM THE BODY with a visible gap between each arm and the torso, elbows
slightly bent, paws open. Arms long enough that the paws would reach above the
head if raised. Nothing crossing in front of the body. Goofy friendly grin.
Painterly casual game art, warm torch key light, turquoise rim light.
Transparent background, no text, entire body including feet in frame.
```

---

## 9. 商店縮圖 → `mummy_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景**（不是畫一個棋盤格） |
| `cover_16x9_bg.png` | 1920×1080，不透明（Stake 審查要求 16:9 封面） |
| `cover_16x9_fg.png` | 1920×1080，透明 |

- **FG 只放主角**（木乃伊貓半身或全身，可以抱著太陽輪），**不要放遊戲名稱、字、Logo**
- **BG 不能只是把遊戲背景調暗**：200px 下會變一塊黑。用大塊、明亮的色塊（例如晨光金字塔天空、砂岩＋綠松石大色塊）
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% ≥ 35、低於 32 的像素 ≤ 30%。交件後我跑 `check_thumbnail.py`

---

## 10. UI → `mummy_delivery/ui/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buybonus_stone.png` | 800×800，透明 | 下注列上的 **Buy Bonus 按鈕**（平常） |
| `buybonus_stone_lit.png` | 800×800，透明 | 同一顆，**點亮**（滑過／可按）；構圖完全一樣 |
| `buybonus_plate.png` | 640×640，透明 | 按鈕的底座（舊版面用，跟上面同材質） |
| `ticker_plate.png` | 652×146，透明 | 下注列的長條跑馬燈底板 |
| `buy_art_bonus.jpg` | 800×450 | 購買選單：FG 卡片的場景圖（聖甲蟲神殿＋Scarab Wheel 發光） |
| `buy_art_holdandspin.jpg` | 800×450 | 購買選單：Hold & Spin 卡片（錢幣從石棺裡噴出來） |
| `buy_hero_bonus.png` | 512×512，透明 | FG 卡片上的主角物件：聖甲蟲金幣按鈕 |
| `buy_hero_holdandspin.png` | 512×512，透明 | Hold & Spin 卡片上的主角物件：一疊錢幣 |
| `buy_art_scarab.jpg` | 800×450 | 激活卡片 SCARAB SPIN／SCARAB SURE WIN 共用場景（Scarab Wheel 在盤面下緣亮著） |
| `buy_art_sun.jpg` | 800×450 | 激活卡片 SUN BOOST 場景（太陽輪從墓室天頂升起） |
| `buy_hero_scarab5.png` `buy_hero_scarab10.png` `buy_hero_sun.png` | 512×512，透明 | 三張激活卡片的主角物件：一顆／兩顆聖甲蟲金幣、太陽圓盤 |

- **buybonus_stone**：圓角方石磚、砂岩邊、中間凹一個淺槽（程式寫字），點亮版是綠松石鑲線發光。按鈕和購買選單的卡片是**兩個不同的素材**，兩個都要
- 兩張購買場景圖都**沒有文字**、16:9
- **購買選單的卡片框、下注列的圓形小圖示、特效粒子都是程式畫的，不用生**
- 下注列小圖示（menu／paytable／info／settings／sound／autoplay）由 `design/generate_ui_icons.mjs` 用程式畫，只會換成本作的顏色；規則照 `game-reskin` 的細線圖示規範（線寬約畫布 7–8%、孔洞保持打開、無外光）

---

## 11. 轉場（FG 進場／離場）→ `mummy_delivery/transition/`

Boomana 的轉場是「猴子丟炸藥、爆炸白光蓋住換場景」。這款改成**木乃伊貓扯開繃帶、繃帶捲過整個畫面**：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `bandage_strip.png` | 2400×360，透明 | 一條很長的繃帶（米白、邊緣有布紋、一端撕開），程式會讓 6–8 條從畫面一側斜著掃過 |
| `bandage_end.png` | 360×360，透明 | 繃帶撕開的那一端（接在條子尾端） |
| `sand_burst.png` | 1024×1024，透明 | 一團砂塵（柔邊，程式放大淡出） |

**轉場要做到的事**（跟長相分開講）：在約 0.5 秒內把畫面完全蓋住，蓋住的那一刻換場景，再在 0.5 秒內掀開。繃帶要**夠寬、夠密**才蓋得住；圖上**不要畫陰影**，陰影由程式加，畫在圖上會疊兩層。

---

## 12. 字型

| 用途 | 建議 | 備註 |
|---|---|---|
| 標題、牌匾、輪盤數字、FG 局數 | **Lilita One**（粗圓、好笑） | 英數子集即可；`×` 用字母 `X` 代替，字型子集沒有 U+00D7 |
| 規則頁、付費表內文 | 系統無襯線 | 現有設定不變 |

畫在圖上的字（牌匾、`title.png`、`levelup.png`）要和程式字型同一種語言：粗圓、砂岩刻字。

---

## 13. 目前程式畫的佔位 → 交件後要換掉的圖

下面這些現在是**程式用色塊、線條畫的**，只是讓節奏和流程能跑，**不是成品**。交件後逐項換成右欄的檔案。程式裡每一處都標了 `PLACEHOLDER(art)`，用 `grep -rn "PLACEHOLDER(" src` 就找得到。

| 現在畫的地方 | 程式畫了什麼 | 換成（本單章節） |
|---|---|---|
| `FgArcWheel.svelte`（Scarab Wheel） | 半圓拱本體 | `scarab_wheel/arch_base.png`（§5） |
| 〃 | 三種顏色的格子（2–10× 綠、12–16× 紅、32× 紫） | `tile_normal` / `tile_hot` / `tile_top.png` |
| 〃 | 停中那格的亮邊 | `tile_result_glow.png` |
| 〃 | 中央倍數圓牌 | `plate.png` |
| 〃 | 倍數更新的金色光環 | `plate_flash.png` |
| 〃 | 粉紅三角指針 | `pointer.png` |
| 〃 | 黃色圓形按鈕＋按下的放大淡出 | `button.png` / `button_lit.png` / `button_burst.png` |
| `RareRoulette.svelte`（Sun Wheel） | 背後的放射光芒 | `sun_wheel/rays.png`（§6） |
| 〃 | 12 格扇形（四級換色） | `disc_lv1`～`disc_lv4.png` |
| 〃 | 外圈圓環 | `ring.png`＋`ring_glow_lv1`～`lv4.png` |
| 〃 | 黃色三角指針 | `needle.png`（旋轉中心 140, 620） |
| 〃 | 中心圓 | `hub.png` |
| 〃 | 停中那格的白色亮光 | `wedge_win.png` |
| 〃 | 標題的圓角底板＋「SUN WHEEL LV n」程式字 | `title.png`（等級數字仍由程式寫） |
| 〃 | 「LEVEL UP!」程式字 | `levelup.png` |
| `TransitionAnimation.svelte`（FG 轉場） | 8 條米白色斜帶 | `transition/bandage_strip.png`＋`bandage_end.png`（§11）；`sand_burst.png` 換圖時再加 |
| `FeatureIntro.svelte`（讀取頁三格介紹） | Scarab／Sun Wheel 的小圖示 | 用 `plate.png`、`disc_lv1.png`＋`needle.png` 縮圖 |
| `ui/ModalBuyBonus.svelte`＋`ui/BuyEmblem.svelte`（購買選單） | 11-07 起是程式畫的墓室底＋徽章（青銅幣／Scarab 拱／聖甲蟲／全亮拱＋勾／太陽輪），五張卡片都是 | 買入：`buy_art_bonus.jpg`、`buy_hero_bonus.png`、`buy_art_holdandspin.jpg`、`buy_hero_holdandspin.png`；激活：`buy_art_scarab.jpg`、`buy_art_sun.jpg`、`buy_hero_scarab5/scarab10/sun.png`（§10） |
| `ui/MummyBar.svelte`（下注列，11-07 重做） | 買入方塊上的金字塔圖示（程式畫） | `ui/buy_icon.png`（512×512 透明，黑色單色圖示，放在黃色方塊中央；**不能用參考影片那家廠商的迴紋針標誌**）。其餘 bar 零件（面板、按鈕、箭頭、輪數面板、選單）照參考影片用程式畫，不用交圖 |
| `Mascot.svelte` | Boomana 的猴子骨架，借用它的 alert／cheer／throwit 動作 | 木乃伊貓的套版骨架（§8），動作改成模板的 8 個 |

**一直維持程式畫、不用交圖的**：連線（白色細線）、盤面壓暗、Sun Wheel 的暗幕、所有數字（輪盤值、倍數、倒數、金額、FG 局數）、SPIN 按鈕上的字。

音效的佔位（兩個輪盤和轉場暫借 Boomana 的音檔）另外列在 [MUMMY_AUDIO_REQUIREMENTS.md](MUMMY_AUDIO_REQUIREMENTS.md)，程式裡標 `PLACEHOLDER(audio)`。

---

## 14. 交件清單

```
mummy_delivery/
  symbols/       h1 h2 h3 h4 w s l1 l2 l3 l4 l5 p x                         (13)
  backgrounds/   bg_base bg_feature bg_holdandspin
                 ＋各自的 _far、_props                                         (9)
  frame/         frame_edge frame_bg fs_sign fs_counter_panel                (4)
  scarab_wheel/  arch_base tile_normal tile_hot tile_top tile_result_glow
                 plate plate_flash pointer button button_lit button_burst   (11)
  sun_wheel/     disc_lv1-4 ring ring_glow_lv1-4 needle hub wedge_win
                 title levelup rays                                         (16)
  banners/       big superwin mega epic max                                  (5)
  mascot/        照 MUMMY_CAT_RIG_SPEC.md 的圖層＋joints.json
                 ＋head_blink head_laugh                                    (13＋json)
  thumbnail/     thumb_bg thumb_fg cover_16x9_bg cover_16x9_fg               (4)
  ui/            buybonus_stone buybonus_stone_lit buybonus_plate ticker_plate
                 buy_art_bonus buy_art_holdandspin buy_hero_bonus
                 buy_hero_holdandspin                                        (8)
  transition/    bandage_strip bandage_end sand_burst                        (3)
```
共約 **86 張**＋關節檔。

**建議交件順序**：符號 → 吉祥物（先交一張完整全身圖給我確認造型，再拆層）→ 兩個輪盤 → 背景 → 框 → UI／牌匾 → 轉場 → 縮圖。符號先到我就能先上盤面看整體。

### 交件前自己檢查

- [ ] 13 張符號縮到 120px 排一列，每張都認得出來
- [ ] 轉灰階看，高分比低分**彩度高**、低分的字**清楚**
- [ ] 除了 S 和太陽輪，沒有任何東西是金色當主色
- [ ] W、吉祥物、縮圖上的木乃伊貓是同一隻（露出的是同一隻眼睛）
- [ ] 吉祥物：手臂離開身體、手夠長、全身在畫面內、三張頭輪廓一致
- [ ] 太陽輪四張盤面格子角度一致、沒有數字
- [ ] 所有畫在圖上的字拼對了
- [ ] 透明的那幾張真的是透明（不是白底或棋盤格）
- [ ] 沒有真實人類木乃伊、骷髏、恐怖元素

### 我這邊收到後會量的（不用你做）

- 每個高分符號中央 60% 平均亮度 ≥ 70；低分亮區覆蓋率 ≤ 高分最低值
- 縮圖三項亮度門檻
- 吉祥物 `build` 報告：流暢度 ≥ 80、網格摺疊 0、手追不上 ≤ 3%、遊戲檔重播 < 0.05 px
- 拆出 glow／sheen 圖層、輪盤零件的實際墨水範圍（決定程式裡的對位）


## 交付紀錄（2026-11-07）

已整合新素材、套版角色動作與取樣音效；詳細檔案、來源、檢查結果、已知差異與重建方式見 [MUMMY_DELIVERY_20261107.md](MUMMY_DELIVERY_20261107.md)。本文件前面的舊版佔位／待美術狀態保留作歷史對照，現況以交付紀錄為準。
