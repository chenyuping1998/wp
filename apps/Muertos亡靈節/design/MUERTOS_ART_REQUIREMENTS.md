# MUERTOS — 美術需求單

> 這份是 Muertos 美術的**唯一依據**。遊戲裡現在的圖全是 Mummy Mayhem（木乃伊貓、墓室）的佔位，**不要參考它們的內容**。
>
> 交件放在 `design/source/muertos_delivery/<類別>/`，**檔名照表格寫**。收到後我負責去背、縮放、切 glow／sheen 圖層、量亮度、接進遊戲。
>
> 配套文件：
> - 人物模板規格：[MUERTOS_RIG_SPEC.md](MUERTOS_RIG_SPEC.md)（`wp/tools/mascot-rig` 正面模板；要拆的圖層以本單 §8.1 為準）
> - 規則：[../MUERTOS_SPEC.md](../MUERTOS_SPEC.md)
> - 音效需求單：還沒寫，音效目前沿用 Mummy Mayhem

---

## 0. 主題

### 0.1 一句話

**亡靈節之夜的熱鬧廣場，主角是一個愛現的骷髏街頭樂手。** 卡通骷髏、臉上畫著彩色糖骷髏花紋、戴超大寬邊帽、穿黑色鑲銀扣的樂手服、背著吉他。好笑來自**骨頭不太牢**：一彈太嗨下巴掉下來、帽子太大蓋住眼睛、跳舞跳到骨頭散了又自己裝回去。**熱鬧、鮮豔、好笑，不陰森**。

### 0.2 兩個輪盤的美術身分

| 機制 | 名稱 | 長相 |
|---|---|---|
| FG 倍率輪盤（每局有連線必轉） | **FIESTA WHEEL（嘉年華輪）** | 盤面下緣升起的半圓拱，做成**彩色摩天輪的上半圈**：拱框是彩燈鐵架、掛著剪紙彩旗；格子是一個個車廂；中央圓牌顯示目前倍數；拱頂一根固定指針；一顆按鈕 |
| 稀有輪盤（一局結束隨機） | **MARIGOLD WHEEL（萬壽菊輪）** | 全螢幕的大轉盤，**整個盤面是一朵盛開的萬壽菊**（12 片花瓣＝12 格）；四級花色往上升：**橘 → 粉紅 → 紫 → 金**；外圈是剪紙花邊；中心伸出一根花莖形指針 |

兩個輪盤上的**數字都由程式寫上去**，圖上一律不要畫數字。

### 0.3 調色盤

| 角色 | 色 | Hex |
|---|---|---|
| 夜空底色 | 深紫藍 | `#2B1B4A` |
| 牆面／盤框 | 彩繪陶磚的深靛 | `#3A2E6B` |
| 點綴 1（萬壽菊） | 萬壽菊橘 | `#FF9F1C` |
| 點綴 2 | 桃紅 | `#FF4F9A` |
| 點綴 3 | 湖水青 | `#1FB5A9` |
| 點綴 4 | 檸檬黃 | `#FFE14D` |
| 骨頭 | 暖白 | `#F4EBDD` |
| **Scatter／萬壽菊輪第 4 級專用** | **金** | `#FFC83D` |

**金色只屬於 Scatter（金色寬邊帽）和萬壽菊輪最高級。** 其他地方的黃用檸檬黃，不要用金。

> 跟前幾款分得開：Mummy 是砂岩、Volt 是鐵灰、Fang 是深夜紫。這款是**最鮮豔的一款**：深紫藍底上大量橘、桃紅、湖水青，像剪紙和彩繪陶器。

### 0.4 從前幾款量出來的規則

1. **符號不能整片暗**：每個高分符號在中央 60% 的**平均亮度 ≥ 70**（0–255）。
2. **高分靠「色相＋剪影」兩層分辨**，低分靠字形。這款顏色多，**高分每張只用一個主色**，花紋是點綴，不然縮小後全部變成一團彩色。
3. **低分的亮度／亮區覆蓋率不能超過高分的最低值。**
4. **背景中央要暗、要安靜**：符號是去框的，背景會從格子間透出來。這款背景很熱鬧，中央更要收。
5. **不要小星星、硬邊光環、方框特效**。彩燈的光暈、煙火由程式做，**圖上不要畫飛散的光點**。
6. **骷髏要可愛不嚇人**：大眼眶、圓下巴、笑臉；不要真實人骨、腐爛、蟲。不要畫真實人物的照片或肖像（祭壇上的相框留空或放花）。

---

## 1. 給生圖的共用風格開頭（每次開新對話先貼）

```
You are producing a matched set of game art for a cartoon slot game called
"Muertos": a lively Day of the Dead night fiesta in a colourful town plaza,
starring a show-off cartoon SKELETON street musician with a sugar-skull painted
face, a huge wide-brimmed hat, a black musician's suit with silver buttons and a
guitar on his back. Style for EVERY image in this conversation: painterly
hand-illustrated casual game art, bold simple readable shapes, thick clean
silhouettes, soft cel shading, glossy highlights, warm string-light glow from
above and a cool teal (#1FB5A9) rim light. Palette: deep night indigo (#2B1B4A),
marigold orange (#FF9F1C), hot pink (#FF4F9A), lagoon teal (#1FB5A9), lemon yellow
(#FFE14D), warm bone white (#F4EBDD), papel picado cut-paper patterns. Festive,
bright and funny, never creepy: cute round skulls with big eye sockets and
smiles, NO realistic bones, NO decay, NO real people or portraits. Gold (#FFC83D)
is reserved for one golden hat and the top level of the marigold wheel; do not
use gold as a main colour anywhere else. Never draw loose sparkle dots or star
particles. Never include any text, letters, numbers, logos or watermarks unless
the prompt explicitly asks for a specific letter.
```

**生成方式**：同一個對話裡依序生，風格才一致。每張生完縮到 120px 看一眼，認不出是什麼就重生。

---

## 2. 符號（13 張）→ `muertos_delivery/symbols/`

| 檔名 | 規格 | 內容 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild：骷髏樂手胸像 |
| `s.png` | 1024×1024 正方、不透明 | Scatter：金色寬邊帽 |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 彩繪陶幣（中央留白，金額由程式寫） |
| `x.png` | 1024×1024 **透明背景** | Hold & Spin 的空格 |

**通則**
- 主體佔格子寬約 80%，四周留約 8%，不要貼邊
- 高分／W／S 放在同一塊**深靛彩繪陶磚**上（`#3A2E6B`，四角各一朵小剪紙花、一圈細湖水青邊）；低分放在**淡色素燒陶磚**上。底板我會切掉，但生的時候一定要有
- **每張高分的主色相都不一樣**，剪影也不一樣（直、花瓶、圓、橫各一）
- **中獎動畫要切出主體、讓它自己動**：主體完整、輪廓和底板分得開、不碰邊框；每張高分要有 1–2 個**會自己動的部件**，畫得明顯

### 2.1 高分（由高到低）

**H1 — 吉他**（萬壽菊橘，直立長形）
```
A cartoon acoustic guitar standing upright, glossy marigold-orange (#FF9F1C)
body painted with simple folk flowers, a dark neck with a decorated headstock,
a ribbon tied around the neck with two loose ends, filling most of the frame.
Tall vertical silhouette. Centred on a deep indigo painted-tile plate (#3A2E6B)
with a tiny cut-paper flower in each corner and a thin teal edge. Square 1:1,
no text.
```
會動的部件：琴弦（中獎時震）、琴頸上的緞帶兩端（甩）。

**H2 — 萬壽菊花盆**（湖水青陶盆＋橘花，花瓶剪影）
```
A round painted clay pot in lagoon teal (#1FB5A9) with folk patterns, overflowing
with big puffy marigold flowers and two long leaves curling out, filling most of
the frame. Vase silhouette. Centred on a deep indigo painted-tile plate
(#3A2E6B) with a tiny cut-paper flower in each corner and a thin teal edge.
Square 1:1, no text.
```
會動的部件：上面的花（中獎時一朵朵彈起）、兩片長葉（擺）。

**H3 — 糖骷髏**（桃紅，圓形）
```
A big round cute sugar skull, glossy hot pink (#FF4F9A) with white icing
patterns, flower-shaped eye sockets with sparkly teal centres, a big friendly
grin, a small marigold on top of its head. Round silhouette. Centred on a deep
indigo painted-tile plate (#3A2E6B) with a tiny cut-paper flower in each corner
and a thin teal edge. Square 1:1, no text.
```
會動的部件：下巴（中獎時開合「喀喀」笑）、頭頂的小花（搖）。**下巴和頭的接縫要畫清楚**。

**H4 — 小號**（檸檬黃銅管，橫向剪影）
```
A cartoon brass trumpet lying horizontally across the frame, lemon-yellow
(#FFE14D) shiny brass, a hot-pink tassel hanging from it, the bell facing right.
Clean horizontal silhouette. Centred on a deep indigo painted-tile plate
(#3A2E6B) with a tiny cut-paper flower in each corner and a thin teal edge.
Square 1:1, no text.
```
會動的部件：喇叭口（中獎時「叭」一下撐大）、流蘇（甩）。用**檸檬黃**，不是金。

### 2.2 特殊符號

**W — 骷髏樂手胸像（Wild）**
```
A show-off cartoon SKELETON musician seen from the chest up, facing forward,
filling the frame. A cute round skull (#F4EBDD) with colourful sugar-skull face
paint (flowers around the eye sockets, dots on the forehead), big expressive
eyes glowing softly in the sockets, a cheeky grin, a huge wide-brimmed black hat
with a pink and teal embroidered band, a black musician's jacket with silver
buttons and a red bow tie. Funny and charming, not creepy. Centred on a deep
indigo painted-tile plate (#3A2E6B) with a tiny cut-paper flower in each corner
and a thin teal edge. Square 1:1, no text.
```
- **必須跟第 8 節的吉祥物是同一隻**：臉部花紋、帽子、蝴蝶結都要對得上
- 會動的部件：下巴（大笑時掉下來再接回去）、帽子（彈）、眼睛（眨）
- **下巴要和頭骨分得開**（下巴是另一塊）

**S — 金色寬邊帽（Scatter）**
```
A polished golden (#FFC83D) wide-brimmed festive hat seen from the front, the
brim slightly tilted, ornate embroidered patterns, little pom-poms hanging around
the brim, a marigold tucked in the band, hard bright specular highlights and a
warm glow around it. This is the ONLY gold object in the whole set and the
brightest symbol on the board. Centred on a deep indigo painted-tile plate
(#3A2E6B) with a tiny cut-paper flower in each corner and a thin teal edge.
Square 1:1, no text.
```
會動的部件：帽簷的小毛球（甩）、帽子（轉一下）。

**p.png — Hold & Spin 彩繪陶幣**
```
A thick round painted clay coin seen straight on, lagoon teal with a hot-pink and
orange folk-pattern ring around the rim, the flat centre left EMPTY and smooth
cream (a number will be printed there by the game). Transparent background, no
plate. Square 1:1, no text.
```
**不要用金色**。中央一定要乾淨。

**x.png — Hold & Spin 空格**
```
An empty recessed terracotta tile niche, seen straight on, a shallow square
hollow in plain unpainted clay with a faint cut-paper edge, very low contrast and
calm. Transparent background outside the tile. Square 1:1, no text.
```
它要**比陶幣暗很多**。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**。
```
The single letter "A" carved deeply INTO a pale unpainted clay tile (#E8DCCB),
almost colourless, with softly rounded corners and a thin darker edge. The letter
is a dark recessed carving (deep indigo #2B1B4A), thick blocky rounded
sans-serif, with a clean unbroken outline; the upper edge of the carving catches
a bright highlight. A tiny marigold flower in the tile's top-left corner. Maximum
contrast between the dark letter and the pale tile. Any cracks belong to the TILE
only — the letterform itself must stay perfectly clean and unbroken. Square 1:1,
only the single character "A" and no other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。**不要幫低分上顏色**（小萬壽菊是唯一的顏色）。中獎時字母會自己跳出來、空中左右轉一圈再落回，字母要是完整、邊緣清楚的深色形狀。

---

## 3. 背景（3 張）→ `muertos_delivery/backgrounds/` ★ 重點

**背景要做動態，每張背景一定要有「容易做動態的物體或配件」**，畫成能拆出來單獨動的樣子。

| 檔名 | 用途 | 場景 |
|---|---|---|
| `bg_base.png` | 主遊戲 | 亡靈節夜晚的小鎮廣場，滿天剪紙彩旗 |
| `bg_feature.png` | 免費遊戲（Fiesta Wheel） | 廣場旁的移動遊樂場，一座大摩天輪在轉 |
| `bg_holdandspin.png` | Hold & Spin | 室內的花朵祭壇（ofrenda），滿是蠟燭和萬壽菊 |

### 3.1 構圖的硬性規格

- **16:9，至少 1920×1080**，直接生 16:9
- **畫面會被拉伸**：不要靠正圓撐構圖（**會旋轉的物件本身要畫成正圓**）
- **中央約 55% 寬 × 70% 高會被盤面蓋住**：細節放頂部和左右兩側
- **盤面下緣中央會有 Fiesta Wheel 的半圓拱升起**，那一塊不要放亮的東西
- **第四版 bar**：左下角、右下角各約畫面寬 25% × 高 40% 被按鈕蓋住，**底部一整條約 12% 高被 BALANCE／WIN／BET 底板蓋住**。可動物件不要放在這些地方
- 右側會站骷髏樂手（盤面右邊），右側中段不要放最搶眼的物件
- 直式手機也用這張（左右會被裁），可動物件左右兩側都要有
- 沒有人物、沒有文字

### 3.2 可動物件要怎麼畫（每張背景 5–8 個）

| 類型 | 例子 | 畫法規定 |
|---|---|---|
| **擺動** | 剪紙彩旗串、紙燈籠、皮納塔、風鈴 | **懸掛點要畫出來**（繩子兩端或頂端固定在柱子、屋簷上）；彩旗串要**兩端固定、中間下垂**，每一面旗子分得開 |
| **旋轉** | 摩天輪、風車、旋轉木馬頂 | **正面看、畫成正圓**，軸心清楚；摩天輪的**車廂另外一層**（車廂會一直保持朝下） |
| **發光／閃爍** | 串燈、蠟燭、燈籠、教堂窗 | 燈泡和燭身畫出來，**光暈不要畫**；串燈的燈泡要一顆顆分開 |
| **飄動** | 花瓣、氣球、煙火 | **另交透明小圖**（程式讓它飄）；煙火、煙霧不要畫（程式做） |
| **開合／彈跳** | 窗板、皮納塔裡掉出的糖 | 轉軸畫清楚 |

**通用規則**
1. **每個物件完整、輪廓清楚**，不被擋住一半、不跟其他物件疊在一起
2. **物件跟背後的顏色要分得開**（這款物件都很鮮豔，背景牆、夜空要偏暗、偏單色）
3. **物件背後要單純**（夜空、素色牆），物件拿掉後才補得回來
4. 一張背景**大物件 2–3 個、小物件 3–5 個**
5. 動態很慢很小（循環 15 秒以上、擺幅 5° 以內），物件不用畫很大，但要清楚

### 3.3 要交的分層（每張背景都要）

| 檔名 | 內容 |
|---|---|
| `bg_base.png` | 完整的一張 |
| `bg_base_far.png` | **拿掉所有可動物件後的乾淨背景**：牆、地、天空延續畫完 |
| `bg_base_obj_<名稱>.png` | **每個可動物件一張**，透明背景、**1920×1080 整張畫布、物件留在原位**。例：`bg_base_obj_papel_1.png`、`bg_base_obj_lantern_l.png` |
| `bg_*_sky.png` | 有夜空的背景：夜空單獨一層 |
| `petal_1.png`～`petal_3.png`、`balloon_1.png`～`balloon_2.png` | 共用的飄動小圖：透明、512px 左右 |

另附 `objects.txt`：每個物件的檔名、類型、大概的懸掛點或軸心位置。
> 生圖工具做不到分層：至少交完整那張＋`_far`，而且**兩張同構圖、同角度、同光**（用完整那張改出 `_far`）。

### 3.4 三張背景的物件清單與提示

**bg_base — 亡靈節廣場**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 三串剪紙彩旗（兩端固定在屋簷） | 擺動 | 頂部橫跨 |
| 一串彩色燈泡 | 閃爍 | 頂部，彩旗下方 |
| 兩盞紙燈籠 | 擺動＋發光 | 左上、右上 |
| 掛在樹枝上的星形皮納塔 | 擺動 | 左側 |
| 遠處的教堂鐘樓（窗會亮） | 發光 | 右上遠景 |
| 花瓣（共用小圖） | 飄動 | 全畫面 |

```
16:9 game BACKGROUND plate, no characters, no text. A colourful small-town plaza
on the night of the Day of the Dead: three strings of papel picado cut-paper
flags hanging across the top between the rooftops (each string fixed at both
ends and sagging in the middle, every flag clearly separate), a string of
coloured light bulbs below them, two paper lanterns hanging on the upper left and
upper right, a star-shaped piñata hanging from a tree branch on the left, a
distant church bell tower with glowing windows on the upper right, pastel
painted houses with marigold garlands, deep indigo night sky. Every object is
complete, clearly separated from the others, with plain night sky or wall behind
it. The CENTRE is darker, calmer and less detailed (a slot board will cover it);
keep the bottom strip and the bottom-left and bottom-right corners plain. No
glows, no sparkles, no fireworks drawn. Painterly casual game art, festive and
funny, not creepy.
```

**bg_feature — 移動遊樂場（FG）**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 大摩天輪（正圓，**車廂另一層**） | 旋轉 | 左側（不在正中） |
| 旋轉木馬的帳篷頂 | 旋轉（慢） | 右側 |
| 遊樂場入口的彩燈拱門 | 閃爍 | 右上 |
| 一束氣球綁在攤位上 | 飄動 | 右側 |
| 兩串剪紙彩旗 | 擺動 | 頂部 |

```
16:9 game BACKGROUND plate, no characters, no text. A travelling fair next to the
plaza on the Day of the Dead night: a big Ferris wheel on the LEFT seen perfectly
face-on (not behind the middle), its gondolas drawn clearly separate from the
wheel, the striped canopy top of a carousel on the right, an arch of coloured
lights over the fair entrance on the upper right, a bunch of balloons tied to a
food stall on the right, two strings of papel picado across the top, deep indigo
sky. Brighter and more exciting than the plaza. Every object is complete and
clearly separated, with plain sky behind it. The CENTRE stays calmer and slightly
darker (a slot board covers it); keep the bottom strip and the bottom-left and
bottom-right corners plain. No glows, no sparkles, no fireworks drawn. Painterly
casual game art.
```

**bg_holdandspin — 花朵祭壇**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 一排一排的蠟燭（祭壇階梯上） | 發光／閃爍 | 左右兩側 |
| 掛在祭壇上方的剪紙彩旗 | 擺動 | 頂部 |
| 萬壽菊花拱 | 擺動（花頭輕晃） | 祭壇上方 |
| 兩盞紙燈籠 | 擺動 | 左右上方 |
| 一堆一堆的彩繪陶幣 | 發光（反光閃） | 左右兩側 |
| 小香爐（煙由程式做） | 冒煙 | 右側 |

```
16:9 game BACKGROUND plate, no characters, no text. A warm indoor Day of the Dead
ofrenda altar room: stepped altar tiers on both sides covered with rows of
lit candles, piles of painted clay coins and sugar skulls, a big arch of marigold
flowers above, papel picado banners hanging across the top, two paper lanterns
hanging on the upper left and right, a small clay incense burner on the right
(no smoke drawn). Picture frames on the altar are EMPTY or hold flowers — no
people. Cooler and more contained than the plaza. Every object is complete and
clearly separated, with a plain painted wall behind it. The CENTRE stays darker
and calmer (a slot board covers it); keep the bottom strip and the bottom-left
and bottom-right corners plain. No glows, no sparkles. Painterly casual game art.
```

---

## 4. 盤面框與 FG 牌 → `muertos_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深靛半透明，幾乎沒細節 |
| `fs_sign.png` | 1280×1000，透明 | FG 標題牌（字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | FG 局數面板（上方中央留小凹槽放圖示） |

```
A square slot-machine board frame, 1:1, made of painted wooden planks in deep
indigo with hot-pink, orange and teal folk-art flowers painted along it, small
marigold clusters at the four corners, a thin papel-picado cut-paper trim along
the top edge. The ENTIRE INSIDE of the frame is empty and fully transparent —
only the border band exists. Border thickness about 6% of the width. Transparent
background, no text.
```
- 下緣正中**留一塊約框寬 40% 的平整木板**：Fiesta Wheel 的小圓牌平常停在那裡
- 框是**靜止的**；**不要畫兩塊板疊在一起**

**fs_sign**：一整塊彩繪木牌，四周剪紙花邊，中間留空寫字。**fs_counter_panel**：同材質一整塊，上方中央一個小凹槽，透明背景，無字。

---

## 5. Fiesta Wheel（FG 倍率輪盤）零件 → `muertos_delivery/fiesta_wheel/`

幾何、拆件、程式行為都跟 Mummy 的 Scarab Wheel 一樣，只換長相。

**幾何（以盤面寬 W＝1 計）**：拱的圓心在盤面下緣正中；外半徑 0.40W、內半徑 0.275W；中央圓牌半徑 0.20W；一次露出 7 格，每格約 25.7°。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `arch_base.png` | 1600×860，透明 | 半圓拱本體：**摩天輪上半圈的彩燈鐵架**，掛著小剪紙旗。**圓心在圖下緣正中**，外緣半徑 = 圖寬 0.5 |
| `tile_normal.png` | 360×300，透明 | 一格（給 2–10×），**扇形、尖端朝下**，畫成湖水青車廂的正面，中間留空寫數字 |
| `tile_hot.png` | 360×300，透明 | 同形狀，桃紅車廂（給 12–16×） |
| `tile_top.png` | 360×300，透明 | 同形狀，萬壽菊橘車廂＋花邊（給 32×，最稀有） |
| `tile_result_glow.png` | 360×300，透明 | 停中那格的外光（柔和，不要星芒） |
| `plate.png` | 640×640，透明 | 中央倍數圓牌：摩天輪的輪軸蓋（彩繪陶盤、一圈萬壽菊），中間留空寫「×N」 |
| `plate_flash.png` | 800×800，透明 | 倍數更新時的橘色光環（柔和漸層環） |
| `pointer.png` | 180×240，透明 | 拱頂的固定指針：小糖骷髏頭朝下，尖端在圖下緣正中 |
| `button.png` | 420×420，透明 | 唯一的按鈕：圓形彩繪鈴鼓（待按） |
| `button_lit.png` | 420×420，透明 | 同一顆，亮起；構圖完全一樣 |
| `button_burst.png` | 600×600，透明 | 按下時的一張爆光圖（柔和，**不要光點**；可以是一圈花瓣形狀的柔光） |

- 格子扇形的**左右兩邊沿半徑方向**，尖端角度 ≈ 25°；三種格子**形狀完全一樣**，只換顏色
- 按鈕上不要畫字；`plate.png` 縮小一半也要清楚

---

## 6. Marigold Wheel（稀有輪盤）零件 → `muertos_delivery/marigold_wheel/`

拆層照東海龍王：盤面、外框、等級光、指針、中心蓋分開，數字由程式寫。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `disc_lv1.png`～`disc_lv4.png` | 1200×1200，透明 | 四級盤面：**一朵花的 12 片花瓣＝12 個扇形、不畫數字**；第 0 格（正上方）和第 6 格（正下方）是特殊格 |
| `ring.png` | 1400×1400，透明 | 四級共用的外框：剪紙花邊一圈，中間挖空 |
| `ring_glow_lv1.png`～`lv4.png` | 1400×1400，透明 | 各級的外框光暈 |
| `needle.png` | 280×760，透明 | 花莖形指針（頂端一片葉子當尖端），**旋轉中心在圖的 (140, 620)**，尖端朝上 |
| `hub.png` | 320×320，透明 | 中心蓋：花心（一顆小糖骷髏） |
| `wedge_win.png` | 640×640，透明 | 停中那格的亮光（**白色**，形狀＝一格扇形，尖端在圖下緣正中） |
| `title.png` | 1200×300，透明 | 標題牌，**字畫在圖上：「MARIGOLD WHEEL」** |
| `levelup.png` | 1000×420，透明 | **字畫在圖上：「LEVEL UP!」** |
| `rays.png` | 1920×1080 | 全螢幕背景：從中心放射的柔和花瓣形光束（程式慢轉） |

| 等級 | 花色 | 第 0 格（上） | 第 6 格（下） |
|---|---|---|---|
| 1 | 萬壽菊橘 `#FF9F1C` | LEVEL UP（桃紅） | 最大值 30× |
| 2 | 桃紅 `#FF4F9A` | LEVEL UP（紫） | 90× |
| 3 | 紫 `#7A3CC2` | LEVEL UP（金） | 200× |
| 4 | 金 `#FFC83D`＋白 | 2000×（特殊色） | 3000×（最亮） |

- 其餘 10 格兩種深淺交錯；特殊格要有花紋或白邊；LEVEL UP 格只畫底色＋往上的小箭頭
- 四級構圖、格子角度完全一致，只換顏色和花紋

```
A flat circular wheel face seen straight on, shaped like a big open marigold
flower with 12 equal petal-shaped wedges radiating from the centre, NO numbers
and NO text on it. Alternating deep orange and bright marigold (#FF9F1C) petals
with thin cream divider lines. The petal pointing straight UP is hot pink with a
small upward arrow motif; the petal pointing straight DOWN is bright yellow-orange
with a cream border. Clean, readable, no clutter. Transparent background outside
the circle. Square 1:1.
```
等級 2–4 換表裡的顏色，其餘一字不改。`title.png`／`levelup.png` 字要拼對（M-A-R-I-G-O-L-D W-H-E-E-L、L-E-V-E-L U-P），粗圓好笑的展示字。

---

## 7. 大獎牌匾（5 張）→ `muertos_delivery/banners/`

`big.png` BIG WIN、`superwin.png` SUPER WIN、`mega.png` MEGA WIN、`epic.png` EPIC WIN、`max.png` MAX WIN，各 1000×560 透明。
```
A horizontal painted wooden sign, about 16:9, with folk-art flowers, a garland of
marigolds across the top and papel picado flags hanging from both ends, and the
words "BIG WIN" in large chunky rounded letters. The lower 40% of the sign is a
plain EMPTY panel (the game prints the win amount there). Transparent background.
Only the words "BIG WIN", no other text.
```
- 等級越高越華麗：**湖水青 → 桃紅 → 橘 → 紫 → 金**（MAX 可以有骷髏樂手從牌子後面探頭彈吉他）
- **一塊完整的板子**；字要拼對

---

## 8. 吉祥物：骷髏樂手（全身，正面）→ `muertos_delivery/mascot/`

**人物是正面站姿（使用者 11-08 確認）。Spine 骨架由 `wp/tools/mascot-rig` 正面模板製作**（加權網格＋8 個動作）。這款 Spine runtime 是 4.2，build 用 `--spine 4.2`。

### 8.1 要拆的圖層

**通用規則**
- 畫布 **1024×1536**，每個圖層都是**整張畫布的透明 PNG**，部件**留在原位**（疊起來就是完整角色）
- L／R 指**畫面的左右**
- **手、腳各一整條**（肩到指尖、大腿到鞋尖），**不要在手肘、膝蓋切開**
- **被擋住的地方要畫完**
- 骷髏的手腳很細：**骨頭畫粗一點**（至少畫布寬 4%），太細的骨頭彎起來會變形；可以讓袖子、褲管蓋住大部分，只露手骨和腳骨
- 先交一張完整全身圖（§8.4）確認造型，再照下表拆

**身體圖層（由後往前疊，共 12 張）**

| 順序 | 檔名 | 部件 | 這隻要畫什麼 | 被擋住的地方要畫什麼 |
|---|---|---|---|---|
| 1 | `guitar_back.png` | 背在背上的吉他 | 從右肩後面斜到左腰後面的吉他（只露出琴頸和琴身邊緣） | 被身體擋住的整把吉他畫完（人物轉身時會露出來） |
| 2 | `leg_l.png` | 畫面左・整條腿＋靴子 | 黑色窄褲（側邊一排銀扣）、露出一截腳踝骨、尖頭短靴 | 大腿上端多畫約 40px 藏進褲腰；膝蓋不要畫圓頭；膝蓋往外微彎 15–20° |
| 3 | `leg_r.png` | 畫面右・整條腿＋靴子 | 同左腿 | 同左腿 |
| 4 | `pelvis.png` | 骨盆／褲腰 | 黑色褲腰＋一條桃紅腰帶（打結垂下兩條） | 上緣多畫藏進外套下面；兩個腿洞畫滿 |
| 5 | `neck.png` | 脖子 | 一節一節的頸椎骨（卡通、圓圓的） | 上端伸進頭裡、下端藏進衣領後面 |
| 6 | `torso.png` | 軀幹 | 短版黑色樂手外套（銀扣、彩色刺繡）、白襯衫、紅色蝴蝶結；吉他背帶斜過胸前 | **兩肩、腋下、被手臂擋住的胸側全部畫完** |
| 7 | `arm_l.png` | 畫面左・整條手臂＋手 | 黑袖子、白袖口、骨頭手（四根粗粗的卡通指骨） | **肩膀頂端畫成以肩關節為圓心的圓**；手肘不要畫圓頭；手肘微彎 10–20° |
| 8 | `arm_r.png` | 畫面右・整條手臂＋手 | 同左手 | 同左手 |
| 9 | `jaw.png` | 下巴 | 骷髏的下巴（含下排牙齒） | 跟頭骨接合處多畫一點、藏到頭骨後面；**大笑時下巴會往下掉** |
| 10 | `head.png` | 頭骨（不含下巴） | 圓圓的卡通頭骨、糖骷髏花紋（眼眶一圈花、額頭點點）、眼眶裡發光的大眼睛、上排牙齒 | 下巴接合處畫完整（下巴掉下來時會露出來） |
| 11 | `hat.png` | 寬邊帽 | 超大的黑色寬邊帽，帽帶刺繡桃紅＋湖水青，帽簷一圈小毛球 | 帽子底下的頭頂畫在 `head.png` 上 |
| 12 | `hat_pompoms.png`（選用） | 帽簷小毛球 | 把帽簷那一圈小毛球單獨拆出來（會一顆顆甩） | 毛球的繩子根部多畫進帽簷 |

這隻**沒有耳朵、沒有尾巴**。

**換圖用的圖層（表情，共 3 張）**

| 檔名 | 換掉哪一層 | 內容 | 什麼時候用 |
|---|---|---|---|
| `head_blink.png` | `head` | 眼睛閉上 | 眨眼（閒置時隨機） |
| `head_laugh.png` | `head` | 眼睛笑成彎線 | 中獎大笑（下巴同時往下掉） |
| `head_shout.png` | `head` | 眼睛瞪大、眼裡冒小火花（畫在眼眶裡，不是飛散的光點） | 大獎、LEVEL UP 時大喊「¡Ay!」 |

- 三張換圖頭和 `head.png` 的**外輪廓、花紋位置、下巴接合處要一模一樣**，只換眼睛
- 張嘴靠 `jaw.png` 往下移，**不用另外畫張嘴的頭**

**關節點 `joints.json`**

畫布像素、y 向下，例如 `{ "ground": [512, 1500], "hip": [512, 905], … }`：

| 名稱 | 位置 |
|---|---|
| `ground` | 地面（兩腳中間的地板點） |
| `hip`、`belly`、`chest` | 骨盆中心、腰、胸口中間 |
| `neckBase` | 脖子底（兩肩連線中點） |
| `headBase` | 下巴後方（頭頸交界） |
| `headTop` | 頭骨頂（**不含帽子**） |
| `hatTop` | 帽子頂 |
| `jawHinge` | 下巴的轉軸（耳朵位置，左右兩點中間） |
| `shoulderL` / `shoulderR` | 肩關節（肩膀圓頭的圓心） |
| `elbowL` / `elbowR`、`wristL` / `wristR`、`handTipL` / `handTipR` | 手肘、手腕、指尖 |
| `hipL` / `hipR`、`kneeL` / `kneeR`、`ankleL` / `ankleR`、`toeL` / `toeR` | 腿根、膝蓋、腳踝、鞋尖 |

量不準沒關係，標個大概我會校正；但一定要交。

> `guitar_back`、`jaw`、`hat`、`hat_pompoms` 不在 mascot-rig 模板的圖層裡，收件後我另外掛到骨架上：吉他掛背、下巴掛頭骨的轉軸（大笑時下巴掉下來再彈回）、帽子掛頭頂（跳起時晚一拍落下）、毛球加物理甩動。

**交件資料夾長這樣**

```
muertos_delivery/mascot/
  full_body.png                                     （§8.4 完整全身圖）
  guitar_back.png leg_l.png leg_r.png pelvis.png neck.png torso.png
  arm_l.png arm_r.png jaw.png head.png hat.png      （身體 11 張）
  hat_pompoms.png                                   （選用）
  head_blink.png head_laugh.png head_shout.png      （換圖 3 張）
  joints.json
```

> 模板原始規格在 [MUERTOS_RIG_SPEC.md](MUERTOS_RIG_SPEC.md)，以這節為準。

### 8.2 姿勢與比例

1. **正面站姿**，臉朝玩家，可以微微轉向盤面（盤面在他的左邊＝畫面左）
2. **兩手離開身體**，手臂和身體之間看得到背景的縫
3. **肩到手腕的長度 ≥ 肩到頭頂（不含帽子）的高度**
4. 手肘微彎 10–20°、膝蓋往外微彎 15–20°、兩腳與骨盆同寬、腳掌平貼地面
5. **吉他背在背上**，身體前面不要有東西擋住（不要抱著吉他、不要雙手交叉）
6. **全身在畫面內，連帽子和腳**，四周留空
7. **帽子寬不要超過肩膀太多**（頂多肩寬 1.4 倍），不然在盤面右側會撞到盤框

### 8.3 交件前先對佔位人偶

```bash
node tools/mascot-rig/mascot.ts mannequin 角色/人偶
```
（在 `wp` 根目錄跑）圖層切法、關節位置照它做就對了（吉他、下巴、帽子是額外的）。

### 8.4 生圖提示（完整的一張，先確認造型）
```
Full-body standing show-off cartoon SKELETON street musician, same character as
the Wild symbol: a cute round skull (#F4EBDD) with colourful sugar-skull face
paint (flowers around the eye sockets, dots on the forehead), big glowing eyes in
the sockets, a cheeky grin, a huge wide-brimmed black hat with a pink and teal
embroidered band and little pom-poms around the brim, a short black musician's
jacket with silver buttons and embroidery, a white shirt and red bow tie, slim
black trousers with silver buttons down the sides, a hot-pink sash, pointy
ankle boots, cartoon bones chunky (not thin), a guitar slung on his BACK.
Facing the viewer, standing relaxed, feet apart at hip width, knees slightly
bent, BOTH ARMS HELD CLEARLY AWAY FROM THE BODY with a visible gap between each
arm and the torso, elbows slightly bent, bony hands open. Nothing crossing in
front of the body. Painterly casual game art, warm string-light key light, teal
rim light. Transparent background, no text, entire body including hat and feet
in frame. Funny and charming, not creepy.
```

---

## 9. 商店縮圖 → `muertos_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景** |
| `cover_16x9_bg.png` | 1920×1080，不透明 |
| `cover_16x9_fg.png` | 1920×1080，透明 |

- **FG 只放主角**（骷髏樂手彈吉他、帽子往上飛），**不要放遊戲名稱、字、Logo**
- **BG 用大塊明亮色塊**（例如萬壽菊橘＋桃紅的大片剪紙、亮色彩燈），不要只是暗夜廣場
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% ≥ 35、低於 32 的像素 ≤ 30%
- 封面另存一份到 `E:/stake/wp/Muertos/封面圖/`（去背人物＋背景兩張，同光向同色調，不覆蓋舊版）

---

## 10. UI → `muertos_delivery/ui/`

第四版 bar（Katana Kash 編排）按鈕、底板、讀數都由程式畫，**不用交圖**。要交的：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buy_icon.png` | 512×512，透明 | 左下黃色買入方塊的圖示：**黑色單色、粗線**，**不能用閃電**（Turbo 已是閃電）；建議萬壽菊或糖骷髏剪影（目前程式畫的是萬壽菊）。不能用參考廠商的標誌 |
| `buy_art_bonus.jpg` | 800×450 | FG 卡片場景（遊樂場摩天輪點亮） |
| `buy_art_holdandspin.jpg` | 800×450 | H&S 卡片場景（彩繪陶幣從皮納塔裡掉出來） |
| `buy_hero_bonus.png` | 512×512，透明 | FG 卡片主角物件：鈴鼓按鈕 |
| `buy_hero_holdandspin.png` | 512×512，透明 | H&S 卡片主角物件：一疊陶幣 |
| `buy_art_fiesta.jpg` | 800×450 | 激活卡片 FIESTA SPIN／FIESTA SURE WIN 共用場景 |
| `buy_art_marigold.jpg` | 800×450 | 激活卡片 MARIGOLD BOOST 場景（一朵巨大萬壽菊開花） |
| `buy_hero_fiesta5.png` `buy_hero_fiesta10.png` `buy_hero_marigold.png` | 512×512，透明 | 三張激活卡片主角物件：一個／兩個沙鈴、一朵萬壽菊 |

所有場景圖**沒有文字**、16:9。

---

## 11. 轉場（FG 進場／離場）→ `muertos_delivery/transition/`

改成**一大波剪紙彩旗和萬壽菊花瓣掃過畫面**：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `papel_strip.png` | 2400×420，透明 | 一長串剪紙彩旗（5–6 面旗、各種顏色、鏤空花紋），程式讓 6–8 串斜著掃過蓋滿畫面 |
| `petal_big.png` | 512×512，透明 | 一片**大的**萬壽菊花瓣（程式複製成一陣花瓣雨，大片的，不是小點） |

**要做到的事**：約 0.5 秒內彩旗把畫面完全蓋住，那一刻換場景，再 0.5 秒掀開、花瓣飄散。**剪紙的鏤空要夠小**，不然蓋不住後面。圖上不要畫陰影。

---

## 12. 字型

| 用途 | 建議 | 備註 |
|---|---|---|
| 標題、牌匾、輪盤數字、FG 局數 | **Lilita One**（粗圓、好笑；從 Mummy 繼承） | `×` 用字母 `X` 代替 |
| 下注列 | Nunito（第四版 bar 規定） | 不換 |
| 規則頁、付費表內文 | 系統無襯線 | 不變 |

讀取頁標題是一個字 MUERTOS，拆成兩色（MUER 骨白／TOS 萬壽菊橘）。畫在圖上的字要粗圓、像彩繪木牌字。

---

## 13. 交件清單

```
muertos_delivery/
  symbols/         h1 h2 h3 h4 w s l1 l2 l3 l4 l5 p x                        (13)
  backgrounds/     bg_base bg_feature bg_holdandspin ＋各自 _far ＋每物件 _obj_
                   ＋ _sky ＋ petal_1-3 balloon_1-2 ＋ objects.txt
  frame/           frame_edge frame_bg fs_sign fs_counter_panel               (4)
  fiesta_wheel/    arch_base tile_normal tile_hot tile_top tile_result_glow
                   plate plate_flash pointer button button_lit button_burst  (11)
  marigold_wheel/  disc_lv1-4 ring ring_glow_lv1-4 needle hub wedge_win
                   title levelup rays                                        (16)
  banners/         big superwin mega epic max                                 (5)
  mascot/          §8.1 身體 11 張（＋選用毛球）＋換圖頭 3 張＋full_body＋joints.json
  thumbnail/       thumb_bg thumb_fg cover_16x9_bg cover_16x9_fg              (4)
  ui/              buy_icon ＋購買卡 9 張                                     (10)
  title/         logo_wordmark logo_wordmark_small                       (2)
  transition/      papel_strip petal_big                                      (2)
```

**建議交件順序**：符號 → 吉祥物（先交全身圖確認造型，再拆層）→ **背景（含分層）** → 兩個輪盤 → 框 → UI／牌匾 → 轉場 → 縮圖。

### 交件前自己檢查

- [ ] 13 張符號縮到 120px 排一列，每張都認得出來；高分每張只有一個主色
- [ ] 轉灰階看，高分比低分**彩度高**、低分的字**清楚**
- [ ] 除了 S 和萬壽菊輪第 4 級，沒有任何東西是金色當主色（小號用檸檬黃）
- [ ] W、吉祥物、縮圖上的骷髏是同一隻（臉部花紋、帽子、蝴蝶結一致）
- [ ] 吉祥物：手臂離開身體、骨頭夠粗、吉他在背後、全身含帽子在畫面內、下巴是分開的一塊
- [ ] **每張背景有 5–8 個可動物件**，完整、沒被擋住、跟背景分得開；旋轉的是正圓、擺動的有懸掛點、彩旗兩端固定
- [ ] **`_far` 乾淨背景跟完整那張同構圖**，物件拿掉的地方有補完
- [ ] 背景底部一條、左下、右下角沒有可動物件
- [ ] 沒有真實人骨、腐爛、真實人物照片
- [ ] 所有畫在圖上的字拼對了；透明的那幾張真的是透明

### 我這邊收到後會量的（不用你做）

- 每個高分符號中央 60% 平均亮度 ≥ 70；低分亮區覆蓋率 ≤ 高分最低值
- 背景各物件的軸心／懸掛點、`_far` 和完整圖的差異
- 縮圖三項亮度門檻
- 吉祥物 `build` 報告：流暢度 ≥ 80、網格摺疊 0、手追不上 ≤ 3%、遊戲檔重播 < 0.05 px；下巴、帽子掛點不露縫

---

## 14. 讀取頁標題字標（每款各自的設計方向）→ `muertos_delivery/title/`

讀取頁的遊戲名稱**不再用程式字拼兩色**（前幾款都長一樣），每款畫一個自己風格的字標。字標到之前，程式先用本款配色的文字頂著。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `logo_wordmark.png` | 1600×700，**透明** | 讀取頁大標題，字畫在圖上 |
| `logo_wordmark_small.png` | 800×350，透明 | 同一個設計的簡化版（細節少一點），給手機直式和左上角遊戲名 |

**共同規則**
- 字一定要拼對（M-U-E-R-T-O-S），生完逐字核對
- **小尺寸要讀得出來**：縮到 400px 寬還要一眼認出每個字母；裝飾不能蓋過字母本身
- 字標是**一整塊**（不要畫成兩塊板疊在一起），透明背景，外圍留約 5% 空白
- 不要畫星星、光點；光暈由程式加
- 主體字母和裝飾分得開（字母之後可能會單獨做進場動畫：一個個彈出來）

**這款的設計方向**

**剪紙＋彩繪節慶**：
- 一個字 **MUERTOS**，每個字母像**剪紙彩旗**剪出來的：字母內部有小小的鏤空花紋（鏤空要小，不能讓字母散掉）
- 每個字母**不同的節慶色**（橘、桃紅、湖水青、檸檬黃、紫輪流），外圈一條統一的深靛粗描邊把整個字綁在一起
- 「O」換成一朵**萬壽菊**（花心留一個圓，讀起來還是 O）
- 「U」上面點兩個**糖骷髏的眼睛花紋**（小小的，不要變成骷髏頭）
- 字母微微高低錯落（像掛在繩子上的彩旗），但**底線要整齊**，不要歪成一團
- 上方掛一條細細的剪紙彩旗串當頂邊

```
A game title wordmark logo reading "MUERTOS" on a transparent background. Each
chunky rounded letter looks cut from papel picado paper with tiny flower
cut-outs inside, every letter a different festive colour (marigold orange, hot
pink, lagoon teal, lemon yellow, purple), all tied together by one thick deep
indigo (#2B1B4A) outline. The "O" is a marigold flower with a round centre so it
still reads as O, the "U" has two tiny sugar-skull eye flourishes, letters bob
slightly up and down like flags on a string but share a neat baseline, a thin
string of papel picado flags runs along the top. Festive and funny, no sparkles.
Only the word "MUERTOS".
```
