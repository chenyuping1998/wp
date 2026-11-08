# FANG FRENZY — 美術需求單

> 這份是 Fang Frenzy 美術的**唯一依據**。遊戲裡現在的圖全是 Mummy Mayhem（木乃伊貓、墓室）的佔位，**不要參考它們的內容**。
>
> 交件放在 `design/source/fang_delivery/<類別>/`，**檔名照表格寫**。收到後我負責去背、縮放、切 glow／sheen 圖層、量亮度、接進遊戲。
>
> 配套文件：
> - 人物模板規格：[FANG_COUNT_RIG_SPEC.md](FANG_COUNT_RIG_SPEC.md)（`wp/tools/mascot-rig` 正面模板；要拆的圖層以本單 §8.1 為準）
> - 規則：[../FANG_SPEC.md](../FANG_SPEC.md)
> - 音效需求單：還沒寫，音效目前沿用 Mummy Mayhem

---

## 0. 主題

### 0.1 一句話

**月夜古堡裡的吸血鬼伯爵，一個很愛面子、其實很膽小的貴族。** 瘦高、臉色蒼白偏藍、油頭美人尖、尖耳朵、兩顆小尖牙、高領黑披風（內裡酒紅）。好笑來自**愛耍帥卻一直出包**：披風一甩纏到自己、看到大蒜嚇到跳起來、一開心就笑出尖牙還吹口哨。**好笑、不恐怖、沒有血**（他喝的是「番茄汁」）。

### 0.2 兩個輪盤的美術身分

| 機制 | 名稱 | 長相 |
|---|---|---|
| FG 倍率輪盤（每局有連線必轉） | **BAT WHEEL（蝙蝠輪）** | 盤面下緣升起的半圓拱，**做成一對張開的蝙蝠翅膀**：翅骨是拱框，翅膜上一圈可捲動的格子；中央圓牌（伯爵家徽）顯示目前倍數；拱頂一根固定指針；一顆按鈕 |
| 稀有輪盤（一局結束隨機） | **MOON WHEEL（月亮輪）** | 全螢幕的月亮大轉盤，12 格；四級照**月相**往上升：**新月（銀藍）→ 上弦（紫）→ 盈凸（酒紅）→ 滿月（月光金）**；外圈是哥德式鐵窗花紋；中心伸出一根蝙蝠翅形指針 |

兩個輪盤上的**數字都由程式寫上去**（值來自數學設定），圖上一律不要畫數字。

### 0.3 調色盤

| 角色 | 色 | Hex |
|---|---|---|
| 夜色底 | 深夜紫 | `#231A3A` |
| 城堡石牆／盤框 | 紫灰石 | `#4B4560` |
| 石牆暗部 | 深紫灰 | `#2A2538` |
| 點綴 1（披風內裡） | 酒紅 | `#B3203A` |
| 點綴 2 | 皇家紫 | `#5A2A82` |
| 點綴 3（燭光） | 燭火橘 | `#FF9F43` |
| 點綴 4（月光冷光） | 月光青 | `#7FE0D8` |
| 主角膚色 | 蒼白藍 | `#CFE3E8` |
| **Scatter／月亮輪專用** | **月光金** | `#FFD34E` |

**月光金只屬於 Scatter（滿月護身符）和月亮輪。** 盤面上其他符號、盤框、UI 都不准用金色當主色（燭火是橘，不是金）。

> 跟 Mummy（砂岩＋綠松石）和 Volt Monster（鐵灰＋電光青綠）分得開：這款是**深夜紫＋酒紅＋蒼白**，光源是燭火（暖）和月光（冷）兩種。

### 0.4 從前幾款量出來的規則

1. **符號不能整片暗。** 這款底色是深夜紫，最容易整片糊在一起：每個高分符號在中央 60% 的**平均亮度 ≥ 70**（0–255），主體要有明確的亮面。
2. **高分靠「色相＋剪影」兩層分辨**，低分靠字形。低分用淡紫灰無彩石板＋深色字，亮度給低分、彩度給高分。
3. **低分的亮度／亮區覆蓋率不能超過高分的最低值。** 交件後我會量，超過就重生。
4. **背景中央要暗、要安靜**：符號是去框的，背景會從格子間透出來。
5. **不要小星星、硬邊光環、方框特效**（使用者明確要求過）。燭光、月光、光暈由程式做，**圖上不要畫飛散的光點**。
6. **沒有血**：酒杯裡是暗紅「果汁」，不要畫滴血、血跡、傷口；沒有十字架等宗教符號。

---

## 1. 給生圖的共用風格開頭（每次開新對話先貼）

```
You are producing a matched set of game art for a cartoon slot game called
"Fang Frenzy": a moonlit gothic castle, starring a tall, skinny, vain but secretly
cowardly cartoon vampire COUNT with pale blue skin, slicked-back black hair with a
widow's peak, pointy ears, two tiny fangs and a high-collared black cape with a
wine-red lining. Style for EVERY image in this conversation: painterly
hand-illustrated casual game art, bold simple readable shapes, thick clean
silhouettes, soft cel shading, glossy highlights, warm candle light (#FF9F43) from
the lower left and a cool moonlight-teal (#7FE0D8) rim light. Palette: night
violet (#231A3A), violet-grey castle stone (#4B4560), wine red (#B3203A), royal
purple (#5A2A82), pale blue skin (#CFE3E8). Funny and charming, never scary,
never gory: NO blood, NO wounds, NO skulls, NO crosses or religious symbols.
Moon gold (#FFD34E) is reserved for one full-moon amulet and the moon wheel only;
do not use gold as a main colour anywhere else. Never draw loose sparkle dots or
star particles. Never include any text, letters, numbers, logos or watermarks
unless the prompt explicitly asks for a specific letter.
```

**生成方式**：同一個對話裡依序生，風格才一致。每張生完自己先縮到 120px 看一眼，認不出是什麼就重生。

---

## 2. 符號（13 張）→ `fang_delivery/symbols/`

盤面是 5×5，一格在遊戲裡約 118px（桌機），符號要在這個大小一眼分得出來。

| 檔名 | 規格 | 內容 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild：吸血鬼伯爵胸像 |
| `s.png` | 1024×1024 正方、不透明 | Scatter：滿月護身符 |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 銀幣（中央留白，金額由程式寫） |
| `x.png` | 1024×1024 **透明背景** | Hold & Spin 的空格 |

**通則**
- 主體佔格子寬約 80%，四周留約 8%，不要貼邊（中獎時會放大到 1.3–1.55 倍，貼邊會被切）
- 高分／W／S 放在同一塊**深夜紫石板**上（`#231A3A`，四角各一個小蝙蝠翅雕紋、一圈細紫灰邊）；低分放在**淡紫灰石板**上。底板我之後會切掉，但生的時候一定要有，整套比例才一致
- **每張高分的主色相都不一樣**，剪影也不一樣（直、花瓶、圓、橫各一）
- **中獎動畫要切出主體、讓它自己動**（跳出底板、部件各自擺動），所以：
  - 主體要是**完整、清楚的一個物件**，輪廓和底板分得開（主體邊緣不要跟深紫底板同色）
  - 主體**不要碰到底板邊框**
  - 每張高分都要有 1–2 個**會自己動的部件**，畫得明顯、和主體本身分得開（下面每張都有寫）

### 2.1 高分（由高到低）

**H1 — 伯爵的棺材**（酒紅＋黑木，直立長形）
```
An upright cartoon vampire coffin, glossy black wood with a wine-red (#B3203A)
velvet lining, the lid slid slightly open at an angle showing a sliver of red
velvet, ornate silver corner fittings and a small bat-shaped latch, filling most
of the frame. Tall vertical silhouette. Centred on a deep night-violet stone plate
(#231A3A) with a small carved bat wing in each corner and a thin violet-grey
edge. Square 1:1, no text, no cross.
```
會動的部件：棺蓋（中獎時「喀」地往旁邊彈開一點再蓋回，**蓋子和棺身的接縫要畫清楚**）、蝙蝠扣（抖一下）。

**H2 — 高腳酒杯**（皇家紫＋暗紅果汁，花瓶剪影）
```
A tall ornate goblet of dark purple glass with a silver stem, filled with a
glossy dark red juice with a little swirl on the surface, a tiny paper umbrella
and a bendy straw sticking out (funny touch), filling most of the frame. Vase
silhouette. Centred on a deep night-violet stone plate (#231A3A) with a small
carved bat wing in each corner and a thin violet-grey edge. Square 1:1, no text,
no blood drips.
```
會動的部件：液面（晃）、小紙傘和吸管（甩）。**杯外不要畫滴下來的液體**。

**H3 — 大蒜**（米白＋淡紫，圓形）
```
A big glossy cartoon garlic bulb, creamy white with soft lilac stripes, a curly
green sprout on top and a little root tuft at the bottom, with a cheeky smug face
(the vampire's nemesis), filling most of the frame. Round silhouette with one
sprout leaving the top. Centred on a deep night-violet stone plate (#231A3A)
with a small carved bat wing in each corner and a thin violet-grey edge.
Square 1:1, no text.
```
笑點：伯爵最怕的東西也是高分。會動的部件：頂上的捲芽（甩）、臉（得意地瞇眼）。

**H4 — 蝙蝠**（月光青＋深紫，橫向剪影）
```
A cute round cartoon bat with its wings spread wide horizontally across the
frame, deep purple fur, teal-tinted (#7FE0D8) wing membranes catching the
moonlight, big shiny eyes and two tiny fangs, a happy open mouth. Clean
horizontal silhouette. Centred on a deep night-violet stone plate (#231A3A) with
a small carved bat wing in each corner and a thin violet-grey edge. Square 1:1,
no text.
```
會動的部件：兩邊翅膀（中獎時拍兩下）、耳朵。**翅膀和身體的接縫要清楚**（翅膀會以肩膀為軸拍）。

### 2.2 特殊符號

**W — 吸血鬼伯爵胸像（Wild）**
```
A tall skinny vain cartoon vampire COUNT seen from the chest up, facing forward,
filling the frame. Pale blue skin (#CFE3E8), slicked-back black hair with a sharp
widow's peak, pointy ears, arched eyebrows, a confident smirk showing two tiny
fangs, a tall stand-up black cape collar with a wine-red (#B3203A) lining framing
his head, a white cravat with a small purple gem. Charming and funny, not scary.
Centred on a deep night-violet stone plate (#231A3A) with a small carved bat wing
in each corner and a thin violet-grey edge. Square 1:1, no text.
```
- **必須跟第 8 節的吉祥物是同一隻**：臉型、髮型、耳朵、領子都要對得上
- 會動的部件：高領子（往外撐開）、眉毛（挑一下）、嘴（笑出尖牙）
- 高領子要和頭分得開（領子在頭後面，不要和頭髮黏成一塊黑）

**S — 滿月護身符（Scatter）**
```
A round golden (#FFD34E) amulet shaped like a glowing full moon with a soft face
carved into it, a pair of small silver bat wings on each side, a wine-red gem at
the bottom, hard bright specular highlights and a warm glow around it. This is
the ONLY gold object in the whole set and the brightest symbol on the board.
Centred on a deep night-violet stone plate (#231A3A) with a small carved bat wing
in each corner and a thin violet-grey edge. Square 1:1, no text.
```
會動的部件：兩邊的小翅膀（拍）、月亮臉（眨眼）。

**p.png — Hold & Spin 銀幣**
```
A thick round antique coin seen straight on, polished silver with a wine-red
enamel ring inset and small bat silhouettes engraved around the rim, the flat
centre left EMPTY and smooth (a number will be printed there by the game).
Transparent background, no plate. Square 1:1, no text.
```
**不要用金色**（金是 Scatter 的）。中央一定要乾淨，金額會寫在上面。

**x.png — Hold & Spin 空格**
```
An empty recessed stone niche tile, seen straight on, a shallow square hollow in
violet-grey castle stone with a faint cobweb in one corner, very low contrast and
calm. Transparent background outside the tile. Square 1:1, no text.
```
它要**比銀幣暗很多**，Hold & Spin 時一眼看出哪些格子還空著。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**，分開生會變成五種字體。
```
The single letter "A" carved deeply INTO a pale violet-grey castle stone tile
(#CFC8D8), almost colourless, with softly rounded corners and a thin darker
stone edge. The letter is a dark recessed carving (deep night violet #231A3A),
thick blocky rounded sans-serif, with a clean unbroken outline; the upper edge
of the carving catches a bright highlight. A tiny wine-red bat-wing ornament in
the tile's top-left corner. Maximum contrast between the dark letter and the
pale tile. Any cracks belong to the TILE only — the letterform itself must stay
perfectly clean and unbroken. Square 1:1, only the single character "A" and no
other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。**不要幫低分上顏色**（小蝙蝠翅是唯一的顏色）。
低分中獎時是**字母自己從石板跳出來、在空中左右轉一圈再落回**，所以字母要是一個完整、邊緣清楚的深色形狀（我會把字切出來）。

---

## 3. 背景（3 張）→ `fang_delivery/backgrounds/` ★ 重點

**背景要做動態，所以每張背景裡一定要有「容易做動態的物體或配件」**，而且要畫成能拆出來單獨動的樣子。之前幾款背景太靜態被審查點過；整張一體的背景只能整片動，看起來很假。

| 檔名 | 用途 | 場景 |
|---|---|---|
| `bg_base.png` | 主遊戲 | 古堡大廳，月光從高窗照進來 |
| `bg_feature.png` | 免費遊戲（Bat Wheel） | 城堡鐘樓頂，巨大的滿月、蝙蝠飛過 |
| `bg_holdandspin.png` | Hold & Spin | 地下墓窖寶庫，一排棺材和銀幣 |

### 3.1 構圖的硬性規格

- **16:9，至少 1920×1080**，直接生 16:9，不要生寬銀幕再讓我裁
- **畫面會被拉伸、不保持比例**：不要靠正圓或完整的圖案撐構圖（**例外：會旋轉的物件本身要畫成正圓**，見 3.2）
- **中央約 55% 寬 × 70% 高會被盤面蓋住**：細節放頂部和左右兩側，中央要暗、要安靜
- **盤面下緣中央會有 Bat Wheel 的半圓拱升起**，那一塊也不要放亮的東西
- **左下角和右下角會被下注按鈕蓋住**（第四版拆分式 bar：左下買入和選單、右下旋轉鈕），**底部一整條約 12% 高會被 BALANCE／WIN／BET 底板蓋住**。**可動物件不要放在這些地方**
- 右側會站伯爵（盤面右邊），右側中段不要放最搶眼的物件
- 直式手機也用這張（左右會被裁），可動物件左右兩側都要有，不要全擠在最左或最右
- 沒有人物、沒有文字

### 3.2 可動物件要怎麼畫（每張背景 5–8 個）

| 類型 | 例子 | 畫法規定 |
|---|---|---|
| **擺動** | 水晶吊燈、破旗幟、吊鏈、鐘擺、蜘蛛網、大鐘 | **懸掛點要畫出來**（鏈條或繩子的頂端固定在天花板／橫樑上），懸掛點在物件正上方；物件四周要有空背景，擺起來才不會撞到別的東西 |
| **旋轉** | 鐘面指針、風向雞、齒輪 | **正面看、畫成正圓**，不要斜的透視；軸心畫清楚；**指針要單獨一層**，鐘面另一層 |
| **發光／閃爍** | 燭台、壁燈、窗外月亮、魔法水晶球 | 燭台和燭身畫出來，**火焰畫小一點、光暈不要畫**（程式加）；窗外天空另交一層 |
| **開合** | 棺材蓋、窗板、箱子蓋 | **轉軸（鉸鏈）畫清楚**，蓋子和本體的接縫要明顯；關著的狀態畫，打開由程式做 |
| **飄動** | 窗簾、雲、霧、蝙蝠剪影 | 窗簾掛桿要畫；**雲和蝙蝠另交透明小圖**（程式讓它飄、飛）；霧不要畫（程式做） |

**通用規則**
1. **每個物件要完整、輪廓清楚**，不要被別的東西擋住一半，不要跟其他物件疊在一起
2. **物件跟背後的牆顏色要分得開**（暗牆配亮物件，或反過來）
3. **物件背後的牆要單純**（石牆、木牆），這樣把物件拿掉之後牆能補得回來
4. 一張背景裡**大物件 2–3 個、小物件 3–5 個**，不要塞滿
5. 動態本身很慢很小（背景一圈循環 15 秒以上、擺幅 5° 以內），所以物件**不用畫很大**，但要清楚

### 3.3 要交的分層（每張背景都要）

| 檔名 | 內容 |
|---|---|
| `bg_base.png` | 完整的一張（所有物件都在） |
| `bg_base_far.png` | **拿掉所有可動物件後的乾淨背景**：牆、地板要延續畫完，不能留空洞或剪影 |
| `bg_base_obj_<名稱>.png` | **每個可動物件一張**，透明背景、**1920×1080 整張畫布、物件留在原本的位置**（疊回去要跟完整那張一模一樣）。例：`bg_base_obj_chandelier.png`、`bg_base_obj_clock_hand.png` |
| `bg_*_sky.png` | 有窗戶看得到天空的背景：窗外天空（月亮＋雲）單獨一層 |
| `cloud_1.png`～`cloud_3.png`、`bat_1.png`～`bat_2.png` | 共用的飄動小圖：透明背景、512px 左右，三張背景都會用 |

`bg_feature`、`bg_holdandspin` 同樣規則（`bg_feature_far.png`、`bg_feature_obj_<名稱>.png`…）。

**另附一張物件表**（文字就好，`objects.txt`）：每個物件的檔名、類型（擺動／旋轉／發光／開合／飄動）、大概的懸掛點或軸心位置。沒寫我也量得出來，有寫比較快。

> 如果生圖工具做不到分層：至少交完整那張＋`_far` 乾淨背景，我從兩張的差異把物件切出來。所以**兩張一定要同一個構圖、同一個角度、同一個光**（用完整那張改出 `_far`，不要重生一張）。

### 3.4 三張背景的物件清單與提示

**bg_base — 古堡大廳**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 高窗（窗外月亮與雲另一層 `sky`） | 發光 | 左上 |
| 鐵鏈吊著的蠟燭吊燈 | 擺動 | 上方偏右 |
| 落地大鐘（鐘面＋指針分層、鐘擺另一層） | 旋轉＋擺動 | 左側 |
| 兩支壁燈燭台 | 發光／閃爍 | 左右牆面 |
| 從橫樑垂下的破旗幟 ×2 | 擺動 | 頂部兩側 |
| 角落的大蜘蛛網 | 擺動 | 右上角 |
| 窗簾（掛桿要畫） | 飄動 | 窗戶兩側 |

```
16:9 game BACKGROUND plate, no characters, no text. The great hall of a gothic
vampire castle at night: a tall arched window on the upper left showing a dark
violet sky with a pale moon, heavy wine-red curtains on a rod either side of it,
an iron candle chandelier hanging on a chain from the ceiling on the upper right,
a tall grandfather clock on the left with a round face seen perfectly face-on and
a visible pendulum, two wall-mounted candle sconces on the left and right walls,
two tattered purple banners hanging from a beam at the top, a big cobweb in the
upper-right corner. Every object is complete, clearly separated from the others
and from the wall, with plain stone wall behind it. The CENTRE is darker, calmer
and less detailed (a slot board will cover it); keep the bottom strip and the
bottom-left and bottom-right corners plain. No glows, no sparkles, no fog drawn.
Painterly casual game art, spooky-cute, not scary, no blood, no skulls.
```

**bg_feature — 鐘樓頂（FG）**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 巨大滿月（另一層 `sky`，**偏一邊、不在正中**） | 發光 | 右上 |
| 鐘樓的大銅鐘（掛在橫樑上） | 擺動 | 左上 |
| 屋脊上的蝙蝠造型風向標（正面） | 旋轉 | 右側 |
| 屋頂邊的兩支火炬 | 發光／閃爍 | 左右 |
| 掛在欄杆上的鐵鏈 | 擺動 | 左側 |
| 雲與蝙蝠（共用小圖） | 飄動 | 天空 |

```
16:9 game BACKGROUND plate, no characters, no text. The open top of the castle
bell tower at night under a huge full moon placed off to the UPPER RIGHT (not
behind the middle), a big bronze bell hanging from a wooden beam on the upper
left, a bat-shaped weathervane on a spire on the right seen face-on, two burning
torches on the parapet left and right, an iron chain hanging from the railing on
the left, gothic rooftops and spires below in the distance. Brighter and more
magical than the hall, cool moonlight. Every object is complete and clearly
separated, with plain sky or stone behind it. The CENTRE stays calmer and
slightly darker (a slot board covers it); keep the bottom strip and the
bottom-left and bottom-right corners plain. No glows, no sparkles. Painterly
casual game art.
```
**月亮要偏一邊**：Go Bananas 三代 FG 背景的太陽正好在最上排符號後面，最後得加一層霧才救回來。

**bg_holdandspin — 地下墓窖寶庫**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 一排棺材（**蓋子另一層**，鉸鏈清楚） | 開合 | 左右兩側 |
| 大寶箱（蓋子另一層） | 開合 | 左下偏上（避開按鈕區） |
| 一堆一堆的銀幣 | 發光（反光閃） | 左右兩側 |
| 牆上的燭台 ×3 | 發光／閃爍 | 牆面 |
| 從拱頂垂下的鐵鏈 | 擺動 | 頂部 |
| 魔法水晶球（台座上） | 發光 | 右側 |

```
16:9 game BACKGROUND plate, no characters, no text. A vaulted underground crypt
treasure room under the castle: a row of closed black coffins with wine-red
trim on both sides (each lid clearly separate from its box, hinges visible), a
big treasure chest with a closed lid, piles of antique silver coins, three wall
candle holders, iron chains hanging from the vaulted ceiling, a glowing violet
crystal ball on a stone pedestal on the right. Cooler and more contained than the
hall. Every object is complete and clearly separated, with plain stone wall
behind it. The CENTRE stays darker and calmer (a slot board covers it); keep the
bottom strip and the bottom-left and bottom-right corners plain. No glows, no
sparkles, no skulls. Painterly casual game art.
```

---

## 4. 盤面框與 FG 牌 → `fang_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深夜紫半透明石面，幾乎沒細節 |
| `fs_sign.png` | 1280×1000，透明 | FG 標題牌（字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | FG 局數面板（上方中央留小凹槽放圖示） |

**frame_edge**
```
A square slot-machine board frame, 1:1, gothic carved violet-grey stone with
pointed-arch details, wrought-iron filigree along the edges, small stone bat
gargoyles at the two top corners, a thin wine-red velvet band running all the
way around. The ENTIRE INSIDE of the frame is empty and fully transparent — only
the border band exists. Border thickness about 6% of the width. Transparent
background, no text.
```
- 下緣正中**留一塊約框寬 40% 的平整石面**：Bat Wheel 的小圓牌平常停在那裡
- 框是**靜止的**（只動主角，邊框裝飾不動）
- **不要畫兩塊板疊在一起**（使用者看過覺得像 AI 拼貼）

**fs_sign**：一整塊哥德式石牌（不要分好幾塊疊），鐵藝花邊，中間留空寫字。
**fs_counter_panel**：同材質的一整塊面板，上方中央一個小凹槽，透明背景，無字。

---

## 5. Bat Wheel（FG 倍率輪盤）零件 → `fang_delivery/bat_wheel/`

幾何、拆件、程式行為都跟 Mummy 的 Scarab Wheel 一樣，只換長相。

**幾何（以盤面寬 W＝1 計）**：拱的圓心在盤面下緣正中；外半徑 0.40W、內半徑 0.275W；中央圓牌半徑 0.20W；一次露出 7 格，每格約 25.7°。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `arch_base.png` | 1600×860，透明 | 半圓拱本體：**一對張開的蝙蝠翅膀**，翅骨構成外框、翅膜是內側凹槽。**圓心在圖下緣正中**，外緣半徑 = 圖寬 0.5 |
| `tile_normal.png` | 360×300，透明 | 一格（給 2–10×），**扇形、尖端朝下**（朝圓心），中間留空寫數字；深紫翅膜色 |
| `tile_hot.png` | 360×300，透明 | 同形狀，酒紅（給 12–16×） |
| `tile_top.png` | 360×300，透明 | 同形狀，皇家紫＋月光青邊（給 32×，最稀有） |
| `tile_result_glow.png` | 360×300，透明 | 停中那一格的外光（柔和，**不要星芒**），程式用 add 疊 |
| `plate.png` | 640×640，透明 | 中央倍數圓牌：伯爵家徽（銀外圈＋深紫內面＋一圈酒紅），中間留空寫「×N」 |
| `plate_flash.png` | 800×800，透明 | 倍數更新時的酒紅光環（柔和漸層環） |
| `pointer.png` | 180×240，透明 | 拱頂的固定指針：銀色尖牙造型，**尖端朝下**，尖端在圖下緣正中 |
| `button.png` | 420×420，透明 | 唯一的按鈕：圓形紅寶石按鈕鑲在銀蝙蝠底座上（待按） |
| `button_lit.png` | 420×420，透明 | 同一顆，亮起（滑過／可按）；構圖完全一樣 |
| `button_burst.png` | 600×600，透明 | 按下時的一張爆光圖（柔和，**不要光點**），程式放大淡出 |

- 格子扇形的**左右兩邊要沿半徑方向**，尖端角度 ≈ 25°，七格並排正好圍成半圓
- 三種格子**形狀完全一樣**，只換顏色
- 按鈕上**不要畫字**，「SPIN」由程式寫
- 平常只看得到 `plate.png` 縮小一半停在盤框下緣，所以圓牌縮小後也要清楚

---

## 6. Moon Wheel（稀有輪盤）零件 → `fang_delivery/moon_wheel/`

拆層跟 Mummy 的 Sun Wheel 一樣（照東海龍王）：盤面、外框、等級光、指針、中心蓋分開，數字由程式寫。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `disc_lv1.png`～`disc_lv4.png` | 1200×1200，透明 | 四級盤面：**12 個扇形、不畫數字**；第 0 格（正上方）和第 6 格（正下方）是特殊格 |
| `ring.png` | 1400×1400，透明 | 四級共用的外框：**哥德式鐵窗花紋**圍成的一圈，中間挖空 |
| `ring_glow_lv1.png`～`lv4.png` | 1400×1400，透明 | 各級的外框光暈（程式用 add 疊，換級時閃） |
| `needle.png` | 280×760，透明 | 從中心伸出的**蝙蝠翅形指針**，**旋轉中心在圖的 (140, 620)**，尖端朝上 |
| `hub.png` | 320×320，透明 | 中心蓋：當前月相的小月亮（程式依等級換色，畫成白銀色） |
| `wedge_win.png` | 640×640，透明 | 停中那一格的亮光（**白色**，程式依等級上色；形狀＝一格扇形，尖端在圖下緣正中） |
| `title.png` | 1200×300，透明 | 標題牌，**字畫在圖上：「MOON WHEEL」** |
| `levelup.png` | 1000×420，透明 | 升級時跳出的字牌，**字畫在圖上：「LEVEL UP!」** |
| `rays.png` | 1920×1080 | 全螢幕背景：從中心放射的柔和月光光束（程式慢慢轉、半透明疊在暗幕上；不要細碎光點） |

| 等級 | 月相 | 主色 | 第 0 格（上） | 第 6 格（下） |
|---|---|---|---|---|
| 1 | 新月 | 銀藍 `#8FA8D8` | LEVEL UP（紫） | 最大值 30×（亮銀＋月光青邊） |
| 2 | 上弦 | 皇家紫 `#5A2A82` | LEVEL UP（酒紅） | 90× |
| 3 | 盈凸 | 酒紅 `#B3203A` | LEVEL UP（月光金） | 200× |
| 4 | 滿月 | 月光金 `#FFD34E`＋紫 | 2000×（特殊色） | 3000×（最亮，白金） |

- 其餘 10 格**兩種深淺交錯**，格子邊界清楚
- 特殊格要有**花紋或銀邊**，一眼看出不一樣；LEVEL UP 格只畫底色＋一個往上的小月亮箭頭，字由程式寫
- 四級的盤面**構圖、格子角度完全一致**，只換顏色和花紋

```
A flat circular wheel face seen straight on, divided into 12 equal wedge
segments radiating from the centre, NO numbers and NO text on it. Alternating
deep navy and silver-blue (#8FA8D8) wedges with a subtle moonstone texture and
thin silver divider lines. The wedge pointing straight UP is royal purple with a
small upward crescent-moon arrow motif; the wedge pointing straight DOWN is bright
silver with a teal border. Clean, readable, no clutter. Transparent background
outside the circle. Square 1:1.
```
等級 2–4 換表裡的顏色，其餘一字不改。

**`title.png`／`levelup.png`**：字一定要拼對（M-O-O-N W-H-E-E-L、L-E-V-E-L U-P），生完逐字核對。字體用粗圓、好笑的展示字，銀色＋酒紅描邊。

---

## 7. 大獎牌匾（5 張）→ `fang_delivery/banners/`

| 檔名 | 字 | 尺寸 |
|---|---|---|
| `big.png` | BIG WIN | 1000×560，透明 |
| `superwin.png` | SUPER WIN | 同上 |
| `mega.png` | MEGA WIN | 同上 |
| `epic.png` | EPIC WIN | 同上 |
| `max.png` | MAX WIN | 同上 |

```
A horizontal gothic stone plaque, about 16:9, with wrought-iron filigree borders,
a pair of carved bat wings spreading from both ends and a wine-red velvet ribbon
across the top, and the words "BIG WIN" in large chunky carved letters lit with
warm candle glow. The lower 40% of the plaque is a plain EMPTY panel (the game
prints the win amount there). Transparent background. Only the words "BIG WIN",
no other text.
```
- 字換成 SUPER WIN / MEGA WIN / EPIC WIN / MAX WIN 各生一張
- 等級越高越華麗：**銀藍 → 紫 → 酒紅 → 酒紅＋紫 → 月光金**，裝飾越來越多（MAX 可以有伯爵從牌子後面探頭、披風蓋在牌子上）
- **一塊完整的板子，不要畫成兩塊疊在一起**
- 字一定要拼對，逐字核對

---

## 8. 吉祥物：吸血鬼伯爵（全身，正面）→ `fang_delivery/mascot/`

**人物是正面站姿（使用者 11-08 確認）。Spine 骨架由套版骨架製作**：用 `wp/tools/mascot-rig` 的**正面吉祥物模板**（加權網格＋8 個動作）。

> 這款從 Volt Monster／Mummy 複製，Spine runtime 是 4.2，build 用 `--spine 4.2`。

### 8.1 要拆的圖層

**通用規則**
- 畫布 **1024×1536**，每個圖層都是**整張畫布的透明 PNG**，部件**留在原本畫好的位置**（全部疊起來就是完整的伯爵，不要把部件裁下來置中）
- L／R 指**畫面的左右**（不是角色自己的左右）
- **手、腳都是一整條**畫完（肩到指尖、大腿到鞋尖），**不要在手肘、膝蓋切開**：骨架用加權網格在關節處彎，分節畫會露出切口
- **被擋住的地方要畫完**：舉手、蹲下、披風擺開時會露出來
- 先交一張完整全身圖（§8.4）確認造型，再照下表拆

**身體圖層（由後往前疊，共 13 張）**

| 順序 | 檔名 | 部件 | 這隻要畫什麼 | 被擋住的地方要畫什麼 |
|---|---|---|---|---|
| 1 | `cape_back.png` | 披風（背面那一大片） | 從肩膀垂到腳踝的黑披風，**內裡酒紅**，下襬微微往兩側張開、尖角 | **整片畫完**（身體擋住的中間部分也要畫，披風擺動時會露出來）；上緣藏進肩膀後面 |
| 2 | `collar.png` | 高立領 | 披風的立領，從肩膀往上撐開、在頭的後面像扇形，外黑內紅 | 下緣多畫進肩膀後面；被頭擋住的中間要畫完 |
| 3 | `ear_l.png` | 畫面左・尖耳朵 | 細長尖耳，蒼白藍 | 耳根多畫進頭的後面 |
| 4 | `ear_r.png` | 畫面右・尖耳朵 | 同左 | 同左 |
| 5 | `leg_l.png` | 畫面左・整條腿＋鞋 | 細長的腿，黑色窄褲，尖頭亮皮鞋 | 大腿上端多畫約 40px 藏進褲腰；膝蓋不要畫圓頭；膝蓋往外微彎 15–20° |
| 6 | `leg_r.png` | 畫面右・整條腿＋鞋 | 同左腿 | 同左腿 |
| 7 | `pelvis.png` | 骨盆／褲腰 | 黑色褲腰＋燕尾服下襬的前片 | 上緣多畫藏進背心下面；兩個腿洞畫滿 |
| 8 | `neck.png` | 脖子 | 細長蒼白的脖子 | 上端伸進頭裡、下端藏進領巾後面 |
| 9 | `torso.png` | 軀幹 | 瘦長的身體：酒紅背心、黑燕尾服外套、**白色領巾＋一顆紫寶石胸針** | **兩肩、腋下、被手臂擋住的胸側全部畫完**；領巾畫在這層 |
| 10 | `arm_l.png` | 畫面左・整條手臂＋手 | 細長手臂、黑袖子、白襯衫袖口、細長蒼白手指 | **肩膀頂端畫成以肩關節為圓心的圓**（半徑＝手臂半寬）；手肘不要畫圓頭；手肘微彎 10–20° |
| 11 | `arm_r.png` | 畫面右・整條手臂＋手 | 同左手 | 同左手 |
| 12 | `head.png` | 頭（臉＋頭髮） | 長臉、蒼白藍皮膚、油頭美人尖、挑高的眉、得意的笑露出兩顆小尖牙 | 下巴下面多畫一點蓋住脖子上端 |
| 13 | `cape_front_l.png` `cape_front_r.png`（選用） | 披風前襟（左、右） | 從肩膀垂到身體兩側的披風邊緣，在手臂後、身體前 | 上緣和肩膀接好；如果整件披風都在身後就不用交 |

（`cape_front_l/r` 算一組，13 列共 14 張檔案，選用的不交就是 12 張。）

**換圖用的圖層（表情，共 3 張）**

表情不靠骨架、靠換圖。每張都是同一張 1024×1536 畫布、同一個位置：

| 檔名 | 換掉哪一層 | 內容 | 什麼時候用 |
|---|---|---|---|
| `head_blink.png` | `head` | 眼睛閉上 | 眨眼（閒置時隨機） |
| `head_laugh.png` | `head` | 仰頭大笑「哇哈哈」、尖牙全露、眼睛笑成彎線 | 中獎大笑、大獎 |
| `head_scared.png` | `head` | **嚇一跳**：眼睛瞪大成圓、嘴巴張成 O、頭髮豎起一撮 | 盤面出現大蒜中獎、輪盤停在小倍數時（好笑反差） |

- 三張換圖頭和 `head.png` 的**外輪廓、下巴、髮際線要一模一樣**，只換眼睛、眉毛和嘴，切換時才不會跳

**關節點 `joints.json`**

畫布像素、y 向下，例如 `{ "ground": [512, 1500], "hip": [512, 905], … }`：

| 名稱 | 位置 |
|---|---|
| `ground` | 地面（兩腳中間的地板點） |
| `hip` | 骨盆中心 |
| `belly` | 腰（肚臍高度） |
| `chest` | 胸口中間 |
| `neckBase` | 脖子底（兩肩連線中點） |
| `headBase` | 下巴後方（頭頸交界） |
| `headTop` | 頭頂（含頭髮；**不含**後面的立領） |
| `shoulderL` / `shoulderR` | 肩關節（肩膀圓頭的圓心） |
| `elbowL` / `elbowR` | 手肘 |
| `wristL` / `wristR` | 手腕 |
| `handTipL` / `handTipR` | 指尖 |
| `hipL` / `hipR` | 腿根 |
| `kneeL` / `kneeR` | 膝蓋 |
| `ankleL` / `ankleR` | 腳踝 |
| `toeL` / `toeR` | 鞋尖 |
| `earLroot` / `earLtip`、`earRroot` / `earRtip` | 耳根、耳尖 |
| `capeTop` | 披風上緣中間（兩肩之間，披風掛的地方） |
| `capeHem` | 披風下襬，從左到右 3–5 個點 |

量不準沒關係，標個大概我會再校正；但一定要交。

> `cape_back`、`collar`、`cape_front_*` 不在 mascot-rig 模板的圖層裡（模板會略過），收件後我另外把披風做成加權網格掛在肩膀上、下襬加物理擺動（跟 Mummy 的領口層同一種做法）。所以披風要**一整片、下襬清楚**，不要畫成很多碎褶。

**交件資料夾長這樣**

```
fang_delivery/mascot/
  full_body.png                                    （§8.4 完整全身圖，確認造型用）
  cape_back.png collar.png ear_l.png ear_r.png
  leg_l.png leg_r.png pelvis.png neck.png torso.png
  arm_l.png arm_r.png head.png                     （身體 12 張）
  cape_front_l.png cape_front_r.png                （選用）
  head_blink.png head_laugh.png head_scared.png    （換圖 3 張）
  joints.json
```

> 模板原始規格（為什麼這樣切、骨架怎麼用）在 [FANG_COUNT_RIG_SPEC.md](FANG_COUNT_RIG_SPEC.md)，以這節為準。

### 8.2 姿勢與比例（會決定他能不能動）

1. **正面站姿**，臉朝玩家，可以微微轉向盤面（盤面在他的左邊＝畫面左）
2. **兩手離開身體**，手臂和身體之間要看得到披風內裡或背景的縫
3. **肩到手腕的長度 ≥ 肩到頭頂的高度**（瘦高型正好；頭頂量到頭髮，不含立領）
4. 手肘微彎 10–20°、膝蓋往外微彎 15–20°、兩腳與骨盆同寬、腳掌平貼地面
5. 身上**不要有東西擋在前面**（不要拿酒杯、不要雙手交叉、披風不要包住身體前面）
6. **全身在畫面內，連腳和披風下襬**，四周留空
7. **立領不要比頭高太多**（頂多高出頭頂 15%），不然人物在盤面右側會被畫面上緣切到

### 8.3 交件前先對佔位人偶

```bash
node tools/mascot-rig/mascot.ts mannequin 角色/人偶
```
（在 `wp` 根目錄跑）會畫出一隻照規格的佔位人偶，身體圖層切法、關節位置照它做就對了（披風是額外的）。

### 8.4 生圖提示（完整的一張，先用來確認造型，再照它拆圖層）
```
Full-body standing tall skinny vain cartoon vampire COUNT, same character as the
Wild symbol: pale blue skin (#CFE3E8), slicked-back black hair with a sharp
widow's peak, long pointy ears, arched eyebrows, a confident smirk showing two
tiny fangs, a tall stand-up cape collar behind his head, a long black cape with a
wine-red (#B3203A) lining hanging behind him to his ankles, a black tailcoat over
a wine-red waistcoat, a white cravat with a purple gem brooch, slim black
trousers and pointy shiny shoes. Facing the viewer, standing relaxed, feet apart
at hip width, knees slightly bent, BOTH ARMS HELD CLEARLY AWAY FROM THE BODY with
a visible gap between each arm and the torso, elbows slightly bent, long-fingered
open hands. The cape hangs BEHIND the body, not wrapped around the front. Nothing
crossing in front of the body. Painterly casual game art, warm candle key light,
cool moonlight-teal rim light. Transparent background, no text, entire body
including feet and cape hem in frame. Funny and charming, not scary, no blood.
```

---

## 9. 商店縮圖 → `fang_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景**（不是畫一個棋盤格） |
| `cover_16x9_bg.png` | 1920×1080，不透明（Stake 審查要求 16:9 封面） |
| `cover_16x9_fg.png` | 1920×1080，透明 |

- **FG 只放主角**（伯爵半身或全身，披風甩開、笑出尖牙），**不要放遊戲名稱、字、Logo**
- **BG 不能只是把夜裡的城堡調暗**：200px 下會變一塊黑。用大塊、明亮的色塊（例如一顆巨大的亮滿月佔掉半個畫面、紫紅漸層天空、城堡剪影）
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% ≥ 35、低於 32 的像素 ≤ 30%。交件後我跑 `check_thumbnail.py`
- 封面另外存一份到 `E:/stake/wp/FangFrenzy/封面圖/`（去背人物＋背景兩張，同光向同色調，不要直接覆蓋舊版）

---

## 10. UI → `fang_delivery/ui/`

這款的下注列是**第四版（拆分式，Katana Kash 編排）**，按鈕、底板、旋轉鈕、加減注、讀數都由程式畫，**不用交圖**。要交的只有買入方塊的圖示和購買選單的卡片圖：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buy_icon.png` | 512×512，透明 | 左下黃色買入方塊中央的圖示：**黑色單色、粗線**（線寬約畫布 12%、孔洞保持打開），**不能用閃電**（Turbo 鈕已經是閃電）；建議棺材或蝙蝠剪影（目前程式畫的是棺材）。不能用參考廠商的標誌 |
| `buy_art_bonus.jpg` | 800×450 | 購買選單：FG 卡片場景（鐘樓滿月、Bat Wheel 張開發光） |
| `buy_art_holdandspin.jpg` | 800×450 | 購買選單：Hold & Spin 卡片（銀幣從打開的棺材裡湧出來） |
| `buy_hero_bonus.png` | 512×512，透明 | FG 卡片主角物件：Bat Wheel 的紅寶石按鈕 |
| `buy_hero_holdandspin.png` | 512×512，透明 | Hold & Spin 卡片主角物件：一疊銀幣 |
| `buy_art_bat.jpg` | 800×450 | 激活卡片 BAT SPIN／BAT SURE WIN 共用場景（Bat Wheel 在盤面下緣亮著） |
| `buy_art_moon.jpg` | 800×450 | 激活卡片 MOON BOOST 場景（滿月從城堡後面升起） |
| `buy_hero_bat5.png` `buy_hero_bat10.png` `buy_hero_moon.png` | 512×512，透明 | 三張激活卡片主角物件：一隻／兩隻蝙蝠、滿月 |

- 所有購買場景圖都**沒有文字**、16:9
- 購買選單的卡片框、特效粒子都是程式畫的，不用生

---

## 11. 轉場（FG 進場／離場）→ `fang_delivery/transition/`

Mummy 的轉場是繃帶捲過畫面。這款改成**伯爵的披風一甩、整片酒紅內裡掃過畫面蓋住，再掀開**：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `cape_sweep.png` | 2400×1600，透明 | 一大片張開的披風（外黑內紅，內裡朝向畫面），邊緣是披風的尖角下襬；程式讓它從一側旋轉掃過、蓋滿畫面 |
| `cape_edge.png` | 2400×400，透明 | 披風的波浪下襬邊緣（接在 `cape_sweep` 後緣，讓掃過時邊緣有布的形狀） |
| `bat_swarm.png` | 1600×900，透明 | 一群**大的**蝙蝠剪影（6–10 隻，不要很多小點），跟在披風後面飛出畫面 |

**轉場要做到的事**：約 0.5 秒內披風掃過、把畫面完全蓋住，蓋住的那一刻換場景，再在 0.5 秒內掀開，蝙蝠群飛散出畫面。圖上**不要畫陰影**，陰影由程式加。

---

## 12. 字型

| 用途 | 建議 | 備註 |
|---|---|---|
| 標題、牌匾、輪盤數字、FG 局數 | **Lilita One**（粗圓、好笑；從 Mummy 繼承） | `×` 用字母 `X` 代替 |
| 下注列 | Nunito（第四版 bar 規定） | 不換 |
| 規則頁、付費表內文 | 系統無襯線 | 不變 |

畫在圖上的字（牌匾、`title.png`、`levelup.png`）要和程式字型同一種感覺：粗圓、石刻或銀邊字，**不要用尖刺哥德體**（小尺寸讀不出來）。

---

## 13. 交件清單

```
fang_delivery/
  symbols/       h1 h2 h3 h4 w s l1 l2 l3 l4 l5 p x                          (13)
  backgrounds/   bg_base bg_feature bg_holdandspin
                 ＋各自的 _far ＋ 每個可動物件一張 _obj_<名稱>
                 ＋ bg_base_sky bg_feature_sky ＋ cloud_1-3 bat_1-2 ＋ objects.txt
  frame/         frame_edge frame_bg fs_sign fs_counter_panel                 (4)
  bat_wheel/     arch_base tile_normal tile_hot tile_top tile_result_glow
                 plate plate_flash pointer button button_lit button_burst    (11)
  moon_wheel/    disc_lv1-4 ring ring_glow_lv1-4 needle hub wedge_win
                 title levelup rays                                          (16)
  banners/       big superwin mega epic max                                   (5)
  mascot/        §8.1 的身體 12 張（＋選用披風前襟 2 張）＋換圖頭 3 張
                 ＋full_body ＋joints.json
  thumbnail/     thumb_bg thumb_fg cover_16x9_bg cover_16x9_fg                (4)
  ui/            buy_icon buy_art_bonus buy_art_holdandspin buy_hero_bonus
                 buy_hero_holdandspin buy_art_bat buy_art_moon
                 buy_hero_bat5 buy_hero_bat10 buy_hero_moon                  (10)
  title/         logo_wordmark logo_wordmark_small                       (2)
  transition/    cape_sweep cape_edge bat_swarm                               (3)
```

**建議交件順序**：符號 → 吉祥物（先交一張完整全身圖確認造型，再拆層）→ **背景（含分層）** → 兩個輪盤 → 框 → UI／牌匾 → 轉場 → 縮圖。

### 交件前自己檢查

- [ ] 13 張符號縮到 120px 排一列，每張都認得出來
- [ ] 轉灰階看，高分比低分**彩度高**、低分的字**清楚**；深紫底上主體夠亮
- [ ] 除了 S 和月亮輪，沒有任何東西是金色當主色
- [ ] W、吉祥物、縮圖上的伯爵是同一隻（髮型、耳朵、領子一致）
- [ ] 吉祥物：手臂離開身體、全身含披風下襬在畫面內、所有頭的輪廓一致、披風一整片在身後
- [ ] **每張背景有 5–8 個可動物件**，每個都完整、沒被擋住、跟牆分得開；旋轉的是正圓、擺動的有懸掛點、開合的有鉸鏈
- [ ] **`_far` 乾淨背景跟完整那張同構圖**，物件拿掉的地方牆有補完
- [ ] 背景底部一條、左下、右下角沒有可動物件（被下注按鈕蓋住）
- [ ] 沒有血、傷口、骷髏、十字架
- [ ] 所有畫在圖上的字拼對了
- [ ] 透明的那幾張真的是透明（不是白底或棋盤格）

### 我這邊收到後會量的（不用你做）

- 每個高分符號中央 60% 平均亮度 ≥ 70；低分亮區覆蓋率 ≤ 高分最低值
- 背景各物件的軸心／懸掛點、`_far` 和完整圖的差異（確認拆得乾淨）
- 縮圖三項亮度門檻
- 吉祥物 `build` 報告：流暢度 ≥ 80、網格摺疊 0、手追不上 ≤ 3%、遊戲檔重播 < 0.05 px；披風擺動不穿過身體

---

## 14. 讀取頁標題字標（每款各自的設計方向）→ `fang_delivery/title/`

讀取頁的遊戲名稱**不再用程式字拼兩色**（前幾款都長一樣），每款畫一個自己風格的字標。字標到之前，程式先用本款配色的文字頂著。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `logo_wordmark.png` | 1600×700，**透明** | 讀取頁大標題，字畫在圖上 |
| `logo_wordmark_small.png` | 800×350，透明 | 同一個設計的簡化版（細節少一點），給手機直式和左上角遊戲名 |

**共同規則**
- 字一定要拼對（F-A-N-G F-R-E-N-Z-Y），生完逐字核對
- **小尺寸要讀得出來**：縮到 400px 寬還要一眼認出每個字母；裝飾不能蓋過字母本身
- 字標是**一整塊**（不要畫成兩塊板疊在一起），透明背景，外圍留約 5% 空白
- 不要畫星星、光點；光暈由程式加
- 主體字母和裝飾分得開（字母之後可能會單獨做進場動畫：一個個彈出來）

**這款的設計方向**

**哥德童話＋尖牙**：
- 字形粗、圓角，帶一點哥德式的尖角收尾（**不要**用細尖的黑體哥德字，小尺寸讀不出來）
- **FANG** 用月光銀，**FRENZY** 用酒紅，外圈深夜紫粗描邊
- 「A」和「N」的底部各長出**一顆小尖牙**（像字自己在笑）
- 「F」的頂端左右伸出一對**小蝙蝠翅膀**
- 整個字標後面有一輪**淡淡的滿月**當底（月光金只能用在這個月亮上，而且要很淡，不能比 Scatter 搶眼）
- 不要血滴、不要滴落的字

```
A game title wordmark logo reading "FANG FRENZY" on a transparent background.
Chunky rounded cartoon letters with subtle gothic pointed tips (NOT thin
blackletter), "FANG" in moonlit silver and "FRENZY" in wine red (#B3203A), a
thick night-violet (#231A3A) outline. The letters "A" and "N" each have one
tiny cute fang hanging from their bottom edge, the "F" has a pair of small bat
wings at its top, and a pale soft full moon sits behind the whole word. Fun and
spooky-cute, no blood, no drips, no sparkles. Only the words "FANG FRENZY".
```
