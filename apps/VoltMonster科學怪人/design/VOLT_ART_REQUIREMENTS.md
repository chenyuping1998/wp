# VOLT MONSTER — 美術需求單

> 這份是 Volt Monster 美術的**唯一依據**。遊戲裡現在的圖全是 Mummy Mayhem（木乃伊貓、墓室）的，只是佔位，**不要參考它們的內容**。
>
> 交件放在 `design/source/volt_delivery/<類別>/`，**檔名照表格寫**。收到後我負責去背、縮放、切 glow／sheen 圖層、量亮度、接進遊戲。
>
> 配套文件：
> - 人物圖層與關節規格：[VOLT_MONSTER_RIG_SPEC.md](VOLT_MONSTER_RIG_SPEC.md)（`wp/tools/mascot-rig` 正面模板）
> - 規則：[../VOLT_SPEC.md](../VOLT_SPEC.md)
> - 音效需求單：還沒寫，音效目前沿用 Mummy Mayhem

---

## 0. 主題

### 0.1 一句話

**古堡塔頂的瘋狂實驗室，主角是一隻笨笨的科學怪人。** 大塊頭、綠皮膚、平頭、脖子兩根螺栓、臉上有縫線，個性像大狗狗：一興奮就被電到，頭髮整片豎起來還冒煙；太用力拉閘刀，結果自己的螺栓噴火花。好笑來自**被電出包**，不是恐怖。

### 0.2 兩個輪盤的美術身分

| 機制 | 名稱 | 長相 |
|---|---|---|
| FG 倍率輪盤（每局有連線必轉） | **VOLT METER（電壓錶）** | 盤面下緣升起的半圓**指針式電壓錶**：鐵灰錶框＋銅鉚釘，錶面是一圈可捲動的刻度格；中央圓牌顯示目前倍數；錶頂一根固定指針；旁邊一顆**紅色大按鈕** |
| 稀有輪盤（一局結束隨機） | **TESLA WHEEL（特斯拉輪）** | 全螢幕的特斯拉線圈大轉盤，12 格；外圈是銅線繞的線圈環；四級由**銅綠 → 電光藍 → 警示橘黃 → 電漿紫**往上升；中心伸出一根閃電形指針 |

電壓錶「只會往上衝」跟這個輪盤「倍數只升不降」是同一件事。**兩個輪盤上的數字都由程式寫上去**，圖上一律不要畫數字。

### 0.3 調色盤

| 角色 | 色 | Hex |
|---|---|---|
| 實驗室底色 | 深石板藍灰（夜裡的古堡） | `#1B2430` |
| 牆面／盤框 | 鉚釘鐵灰 | `#5E6B78` |
| 鐵灰暗部 | 深灰 | `#2E3640` |
| 金屬點綴 | 銅（管線、線圈、鉚釘） | `#C47A3A` |
| 點綴 1（電） | 電光青綠 | `#4FF0C8` |
| 點綴 2（警示） | 警示黃 | `#F5C518` |
| 點綴 3 | 訊號紅 | `#E2483D` |
| 主角膚色 | 怪物綠 | `#7DBB4A` |
| **Scatter／特斯拉輪專用** | **電漿紫** | `#B05CFF` |

**電漿紫只屬於 Scatter（特斯拉電漿球）和特斯拉輪。** 盤面上其他符號、盤框、UI 都不准用紫色當主色。

> 跟 Go Bananeon（霓虹不夜城）分得開：霓虹是粉紅＋青色的燈管、都市夜景；這款是**鐵灰＋銅＋電光青綠**，像蒸汽龐克實驗室，光是從電弧和燈泡來的，不是霓虹招牌。

### 0.4 從前幾款量出來的規則

1. **符號不能整片暗。** 每個高分符號在中央 60% 的**平均亮度 ≥ 70**（0–255）。這款底色偏暗，所以主體要亮。
2. **高分靠「色相＋剪影」兩層分辨**，低分靠字形。低分用淡鋼灰無彩板＋深色字，亮度給低分、彩度給高分。
3. **低分的亮度／亮區覆蓋率不能超過高分的最低值。** 交件後我會量，超過就重生。
4. **背景中央要暗、要安靜**：符號是去框的，背景會從格子間透出來。
5. **不要小星星、硬邊光環、方框特效**（使用者明確要求過）。電弧、火花、光暈都由程式做，**圖上不要畫飛散的火花點點**。

---

## 1. 給生圖的共用風格開頭（每次開新對話先貼）

```
You are producing a matched set of game art for a cartoon slot game called
"Volt Monster": a mad-science laboratory at the top of an old castle tower on a
stormy night, starring a big, goofy, lovable green Frankenstein-style monster
who keeps getting zapped by his own machines. Style for EVERY image in this
conversation: painterly hand-illustrated casual game art, bold simple readable
shapes, thick clean silhouettes, soft cel shading, glossy highlights, cool
electric key light with an electric-cyan (#4FF0C8) rim light and warm copper
bounce light. Palette: riveted steel grey (#5E6B78), deep slate (#1B2430),
copper (#C47A3A), electric cyan, hazard yellow (#F5C518), signal red (#E2483D),
monster green (#7DBB4A). Bright, friendly and funny, never scary, never gory, no
blood, no skulls, no body parts other than one cartoon brain in a jar. Plasma
violet (#B05CFF) is reserved for one plasma globe and the Tesla wheel only; do
not use violet as a main colour anywhere else. Never draw loose sparkle dots or
star particles. Never include any text, letters, numbers, logos or watermarks
unless the prompt explicitly asks for a specific letter.
```

**生成方式**：同一個對話裡依序生，風格才一致。每張生完自己先縮到 120px 看一眼，認不出是什麼就重生。

**分寸**：科學怪人要像卡通大狗狗，**不要**真實的屍體縫合、傷口、血、恐怖醫院感。

---

## 2. 符號（13 張）→ `volt_delivery/symbols/`

盤面是 5×5，一格在遊戲裡約 118px（桌機），符號要在這個大小一眼分得出來。

| 檔名 | 規格 | 內容 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild：科學怪人胸像 |
| `s.png` | 1024×1024 正方、不透明 | Scatter：特斯拉電漿球 |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 電能幣（中央留白，金額由程式寫） |
| `x.png` | 1024×1024 **透明背景** | Hold & Spin 的空格 |

**通則**
- 主體佔格子寬約 80%，四周留約 8%，不要貼邊（中獎時會放大到 1.3–1.55 倍，貼邊會被切）
- 高分／W／S 放在同一塊**深石板鐵板**上（`#1B2430`，四角各一顆銅鉚釘、一圈細鐵灰邊）；低分放在**淡鋼灰板**上。底板我之後會切掉，但生的時候一定要有，整套比例才一致
- **每張高分的主色相都不一樣**，剪影也不一樣（直、斜、圓、橫各一）
- **中獎動畫要切出主體、讓它自己動**（跳出底板、部件各自擺動），所以：
  - 主體要是**完整、清楚的一個物件**，輪廓和底板分得開（主體邊緣不要跟底板同色）
  - 主體**不要碰到底板邊框**
  - 每張高分都要有 1–2 個**會自己動的部件**，畫得明顯、和主體本身分得開（下面每張都有寫）

### 2.1 高分（由高到低）

**H1 — 玻璃罐裡的腦**（粉紅＋銅，直立剪影）
```
A cute cartoon pink brain floating in a tall glass jar of glowing cyan liquid,
filling most of the frame, copper lid with two little electrodes and a curly
wire on top, a few round bubbles inside the jar, the brain has a happy little
face. Tall vertical silhouette. Centred on a deep slate steel plate (#1B2430)
with a copper rivet in each corner and a thin steel edge. Square 1:1, no text.
```
會動的部件：罐頂兩根電極和捲捲的電線（中獎時彈、甩）、腦（在液體裡上下浮）。

**H2 — 閘刀開關**（警示黃＋銅，斜向剪影）
```
A big old-fashioned knife switch on a slate base, the copper blade handle
pulled halfway up at a diagonal, a chunky red handle grip, hazard-yellow and
black stripes on the base, two copper contacts. Strong diagonal silhouette.
Centred on a deep slate steel plate (#1B2430) with a copper rivet in each
corner and a thin steel edge. Square 1:1, no text.
```
會動的部件：閘刀把手（中獎時「喀」一聲拉下去再彈回來，**轉軸要畫清楚在底座上**）。

**H3 — 冒泡燒瓶**（怪物綠，圓形＋往上冒的泡泡）
```
A round-bottom laboratory flask full of bubbling bright green liquid, filling
most of the frame, a cork stopper popping slightly, big round bubbles rising
out of the neck, glossy glass highlights. Round silhouette with bubbles rising
from the top. Centred on a deep slate steel plate (#1B2430) with a copper rivet
in each corner and a thin steel edge. Square 1:1, no text.
```
會動的部件：軟木塞（中獎時彈起）、瓶口的大泡泡（脹大）、液面（晃）。泡泡畫 2–3 顆大的就好，不要一堆小點。

**H4 — 大電池**（訊號紅，橫向剪影）
```
A chunky cartoon battery cell lying horizontally across the frame, glossy
signal red (#E2483D) body with a black end cap, a big copper terminal, a
hazard-yellow lightning-bolt sticker on its side, a little charge meter window
showing three glowing cyan bars. Clean horizontal silhouette. Centred on a deep
slate steel plate (#1B2430) with a copper rivet in each corner and a thin steel
edge. Square 1:1, no text.
```
會動的部件：電量窗的三格（中獎時一格一格亮起）、端子（彈）。

### 2.2 特殊符號

**W — 科學怪人胸像（Wild）**
```
A big goofy lovable green Frankenstein-style monster seen from the chest up,
facing forward, filling the frame. Monster green skin (#7DBB4A), a tall flat-top
head with messy black hair, two copper bolts sticking out of his neck, a few
cartoon stitches on the forehead, heavy brow but big friendly eyes, a huge
toothy grin, a torn dark jacket. Bright and friendly, not scary. Centred on a
deep slate steel plate (#1B2430) with a copper rivet in each corner and a thin
steel edge. Square 1:1, no text.
```
- **必須跟第 8 節的吉祥物是同一隻**：臉型、平頭、螺栓位置、縫線位置都要對得上
- 會動的部件：頭髮（中獎時豎起來）、兩根螺栓（冒電）、嘴（笑開）

**S — 特斯拉電漿球（Scatter）**
```
A glass plasma globe on a polished copper base, front view, filling most of the
frame, bright plasma violet (#B05CFF) lightning tendrils reaching from a small
glowing core to the glass, strong glass highlights and a soft violet glow around
it. This is the ONLY violet object in the whole set and the brightest symbol on
the board. Centred on a deep slate steel plate (#1B2430) with a copper rivet in
each corner and a thin steel edge. Square 1:1, no text.
```
會動的部件：球心（脈動）、電漿觸手（程式會加流動，**觸手畫 4–6 條粗的就好**）。

**p.png — Hold & Spin 電能幣**
```
A thick round coin seen straight on, polished copper with an electric-cyan
enamel ring inset and small lightning-bolt notches around the rim, the flat
centre left EMPTY and smooth (a number will be printed there by the game).
Transparent background, no plate. Square 1:1, no text.
```
**不要用紫色**（紫是 Scatter 的）。中央一定要乾淨，金額會寫在上面。

**x.png — Hold & Spin 空格**
```
An empty recessed steel socket tile, seen straight on, a shallow square hollow
with four small bolts at the corners and a dull unlit cyan ring, very low
contrast and calm. Transparent background outside the tile. Square 1:1, no text.
```
它要**比電能幣暗很多**，Hold & Spin 時一眼看出哪些格子還空著。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**，分開生會變成五種字體。
```
The single letter "A" stamped deeply INTO a pale brushed-steel plate (#C9CED4),
almost colourless, with softly rounded corners, four small rivets and a thin
darker steel edge. The letter is a dark recessed stamp (deep slate #1B2430),
thick blocky rounded sans-serif, with a clean unbroken outline; the upper edge
of the stamp catches a bright highlight. A small hazard-yellow-and-black stripe
tag in the plate's top-left corner. Maximum contrast between the dark letter
and the pale plate. Any scratches belong to the PLATE only — the letterform
itself must stay perfectly clean and unbroken. Square 1:1, only the single
character "A" and no other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。**不要幫低分上顏色**（警示條是唯一的顏色）。
低分中獎時是**字母自己從鋼板跳出來、在空中左右轉一圈再落回**，所以字母要是一個完整、邊緣清楚的深色形狀（我會把字切出來）。

---

## 3. 背景（3 張）→ `volt_delivery/backgrounds/` ★ 這款的重點

**背景要做動態，所以每張背景裡一定要有「容易做動態的物體或配件」**，而且要畫成能拆出來單獨動的樣子。之前幾款背景太靜態被審查點過；整張一體的背景只能整片動，看起來很假。

| 檔名 | 用途 | 場景 |
|---|---|---|
| `bg_base.png` | 主遊戲 | 古堡塔頂實驗室，窗外雷雨夜 |
| `bg_feature.png` | 免費遊戲（Volt Meter） | 實驗台全面通電：發電機飛輪轉起來、特斯拉線圈放電 |
| `bg_holdandspin.png` | Hold & Spin | 地下電池庫／發電機房 |

### 3.1 構圖的硬性規格

- **16:9，至少 1920×1080**，直接生 16:9，不要生寬銀幕再讓我裁
- **畫面會被拉伸、不保持比例**：不要靠正圓或完整的圖案撐構圖（**例外：會旋轉的物件本身要畫成正圓**，見 3.2）
- **中央約 55% 寬 × 70% 高會被盤面蓋住**：細節放頂部和左右兩側，中央要暗、要安靜
- **盤面下緣中央會有 Volt Meter 的半圓錶升起**，那一塊也不要放亮的東西
- **左下角和右下角會被下注按鈕蓋住**（這款用第四版拆分式 bar：左下是買入和選單，右下是旋轉鈕和押注），各約畫面寬 25% × 高 40%。**可動物件不要放在這兩個角落**
- 右側會站科學怪人（盤面右邊），右側中段不要放最搶眼的物件
- 直式手機也用這張（左右會被裁），可動物件左右兩側都要有，不要全擠在最左或最右
- 沒有人物、沒有文字

### 3.2 可動物件要怎麼畫（每張背景 5–8 個）

每個物件的動法分五類，畫法規定不一樣：

| 類型 | 例子 | 畫法規定 |
|---|---|---|
| **擺動** | 吊燈、垂下的電纜、吊鉤、掛著的工具 | **懸掛點要畫出來**（鏈條或電線的頂端固定在天花板／牆上），而且懸掛點在物件正上方；物件四周要有空背景，擺起來才不會撞到別的東西 |
| **旋轉** | 齒輪、發電機飛輪、通風扇、閥門手輪、旋轉警示燈 | **正面看、畫成正圓**，不要斜的透視；軸心畫清楚（一顆螺帽或圓心）；齒輪的齒要均勻（轉起來才看不出接縫） |
| **發光／閃爍** | 燈泡、指示燈、示波器螢幕、試管液體、窗外閃電 | 燈本身畫出來，**光暈不要畫太大**（光暈程式加）；螢幕畫成暗綠的空螢幕，波形程式畫 |
| **冒泡／冒煙** | 試管架、燒杯、蒸汽管 | 畫容器和液體，液面平整；**泡泡、蒸汽不要畫**（程式做），只在容器上留出口 |
| **放電** | 雅各天梯（V 形兩根電極）、特斯拉線圈頂球、兩個電極之間 | 只畫電極和線圈，**電弧不要畫**（程式做），電極之間留出乾淨的空隙 |

**通用規則**
1. **每個物件要完整、輪廓清楚**，不要被別的東西擋住一半，不要跟其他物件疊在一起
2. **物件跟背後的牆顏色要分得開**（暗牆配亮物件，或反過來）
3. **物件背後的牆要單純**（磚牆、石牆、鐵板），這樣把物件拿掉之後牆能補得回來
4. 一張背景裡**大物件 2–3 個、小物件 3–5 個**，不要塞滿
5. 動態本身很慢很小（背景一圈循環 15 秒以上、擺幅 5° 以內），所以物件**不用畫很大**，但要清楚

### 3.3 要交的分層（每張背景都要）

| 檔名 | 內容 |
|---|---|
| `bg_base.png` | 完整的一張（所有物件都在） |
| `bg_base_far.png` | **拿掉所有可動物件後的乾淨背景**：牆、地板要延續畫完，不能留空洞或剪影 |
| `bg_base_obj_<名稱>.png` | **每個可動物件一張**，透明背景、**1920×1080 整張畫布、物件留在原本的位置**（疊回去要跟完整那張一模一樣）。例：`bg_base_obj_lamp.png`、`bg_base_obj_gear_big.png` |
| `bg_base_sky.png` | 只有 `bg_base`：窗外的天空單獨一層（閃電時程式會讓它亮） |

`bg_feature`、`bg_holdandspin` 同樣規則（`bg_feature_far.png`、`bg_feature_obj_<名稱>.png`…）。

**另附一張物件表**（文字就好，貼在交件資料夾的 `objects.txt`）：每個物件的檔名、類型（擺動／旋轉／發光／冒泡／放電）、大概的懸掛點或軸心位置。沒寫我也量得出來，有寫比較快。

> 如果生圖工具做不到分層：至少交完整那張＋`_far` 乾淨背景，我從兩張的差異把物件切出來。所以**兩張一定要同一個構圖、同一個角度、同一個光**（用完整那張改出 `_far`，不要重生一張）。

### 3.4 三張背景的物件清單與提示

**bg_base — 古堡塔頂實驗室（雷雨夜）**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 大拱窗（窗外雷雨天空另一層 `sky`） | 發光／閃爍 | 左上 |
| 鐵鏈吊著的工業吊燈 | 擺動 | 上方偏右 |
| 從天花板垂下的兩條粗電纜（兩端固定、中間下垂） | 擺動 | 頂部橫跨 |
| 牆上一大一小兩個齒輪（咬在一起） | 旋轉 | 左側中段 |
| 雅各天梯（V 形兩根電極） | 放電 | 右上 |
| 試管架（三支試管，不同顏色液體） | 冒泡 | 左側 |
| 牆上一排小指示燈 | 發光／閃爍 | 右側 |

```
16:9 game BACKGROUND plate, no characters, no text. The laboratory at the top of
an old stone castle tower on a stormy night: a tall arched window on the upper
left showing a dark stormy sky, an industrial lamp hanging on a chain from the
ceiling, two thick black cables sagging across the top between wall hooks, two
interlocking copper gears on the left wall seen perfectly face-on, a Jacob's
ladder (two tall V-shaped copper electrodes with an empty gap between them, no
arc) on the upper right, a rack of three test tubes with coloured liquids on the
left, a row of small indicator lights on the right wall. Every object is
complete, clearly separated from the others and from the wall, with plain stone
wall behind it. The CENTRE is darker, calmer and less detailed (a slot board
will cover it); keep the bottom-left and bottom-right corners plain. No sparks,
no arcs, no bubbles, no steam drawn. Painterly casual game art, moody but
friendly, not scary.
```

**bg_feature — 實驗台全面通電（FG）**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 大型發電機飛輪（正圓、輪輻清楚） | 旋轉 | 左側 |
| 特斯拉線圈（頂端甜甜圈形頂球） | 放電 | 右側上方 |
| 開關面板（一排拉桿＋指示燈） | 發光／閃爍 | 左上 |
| 示波器（空的暗綠螢幕） | 發光 | 右側中段 |
| 天花板吊下的銅線圈燈 | 擺動 | 上方 |
| 屋頂開口的避雷針（閃電從這裡打下來） | 發光 | 正上方偏一邊 |

```
16:9 game BACKGROUND plate, no characters, no text. The same castle laboratory
powered up at full charge: a big generator flywheel with clear spokes on the
left seen perfectly face-on, a tall Tesla coil with a doughnut-shaped top on the
upper right (no arc drawn), a wall switch panel with a row of levers and
indicator lights on the upper left, an oscilloscope with an empty dark-green
screen on the right, a copper coil lamp hanging from the ceiling, a lightning
rod poking through an opening in the roof off to one side. Brighter and more
energetic than the base lab, electric-cyan light from the machines. Every
object is complete and clearly separated, with plain wall behind it. The CENTRE
stays calmer and slightly darker (a slot board covers it); the roof opening is
NOT behind the middle; keep the bottom-left and bottom-right corners plain. No
sparks, no arcs drawn. Painterly casual game art.
```
**亮點要偏一邊**：Go Bananas 三代 FG 背景的太陽正好在最上排符號後面，最後得加一層霧才救回來。

**bg_holdandspin — 地下電池庫**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 一排大電池（每顆一個電量窗） | 發光（電量格逐格亮） | 左右兩側的層架 |
| 蒸汽管＋閥門手輪（正圓） | 旋轉＋冒煙 | 左上 |
| 旋轉警示燈（燈罩和燈座分開畫） | 旋轉／閃爍 | 右上 |
| 能量表（圓錶面＋指針，指針另一層） | 擺動（指針） | 右側 |
| 吊掛的電線束 | 擺動 | 頂部 |

```
16:9 game BACKGROUND plate, no characters, no text. A vaulted underground power
room under the castle: shelves of big cartoon battery cells on both sides, each
with a small charge-meter window, copper steam pipes with a round valve wheel
seen face-on on the upper left (no steam drawn), a rotating hazard beacon light
on the upper right, a round power gauge with a needle on the right wall, a
bundle of hanging cables across the top. Cooler and more contained than the lab,
cyan battery glow and warm copper reflections. Every object is complete and
clearly separated, with plain brick wall behind it. The CENTRE stays darker and
calmer (a slot board covers it); keep the bottom-left and bottom-right corners
plain. Painterly casual game art.
```

---

## 4. 盤面框與 FG 牌 → `volt_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深石板半透明鐵面，幾乎沒細節 |
| `fs_sign.png` | 1280×1000，透明 | FG 標題牌（字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | FG 局數面板（上方中央留小凹槽放圖示） |

**frame_edge**
```
A square slot-machine board frame, 1:1, riveted steel girders with copper
corner brackets and a thin band of hazard-yellow-and-black stripes running along
the top edge, a copper pipe running along one side. The ENTIRE INSIDE of the
frame is empty and fully transparent — only the border band exists. Border
thickness about 6% of the width. Transparent background, no text.
```
- 下緣正中**留一塊約框寬 40% 的平整鐵板**：Volt Meter 的小圓牌平常停在那裡
- 框是**靜止的**（只動主角，邊框裝飾不動），不用為動畫設計
- **不要畫兩塊板疊在一起**（使用者看過覺得像 AI 拼貼）

**fs_sign**：一整塊鐵牌（不要分好幾塊疊），鉚釘＋銅邊，中間留空寫字。
**fs_counter_panel**：同材質的一整塊面板，上方中央一個小凹槽，透明背景，無字。

---

## 5. Volt Meter（FG 倍率輪盤）零件 → `volt_delivery/volt_meter/`

幾何、拆件、程式行為都跟 Mummy 的 Scarab Wheel 一樣，只換長相。

**幾何（以盤面寬 W＝1 計）**：拱的圓心在盤面下緣正中；外半徑 0.40W、內半徑 0.275W；中央圓牌半徑 0.20W；一次露出 7 格，每格約 25.7°。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `arch_base.png` | 1600×860，透明 | 半圓電壓錶本體（鐵灰錶框＋銅鉚釘＋內側凹槽）。**圓心在圖下緣正中**，外緣半徑 = 圖寬 0.5 |
| `tile_normal.png` | 360×300，透明 | 一格刻度（給 2–10×），**扇形、尖端朝下**（朝圓心），中間留空寫數字；淡錶面色＋細刻度線 |
| `tile_hot.png` | 360×300，透明 | 同形狀，警示黃（給 12–16×） |
| `tile_top.png` | 360×300，透明 | 同形狀，訊號紅＋電光青綠邊（給 32×，最稀有） |
| `tile_result_glow.png` | 360×300，透明 | 停中那一格的外光（柔和，**不要星芒**），程式用 add 疊 |
| `plate.png` | 640×640，透明 | 中央倍數圓牌（銅外圈＋深石板內面＋一圈電光青綠），中間留空寫「×N」 |
| `plate_flash.png` | 800×800，透明 | 倍數更新時的青綠光環（柔和漸層環） |
| `pointer.png` | 180×240，透明 | 錶頂的固定指針：紅色錶針，**尖端朝下**，尖端在圖下緣正中 |
| `button.png` | 420×420，透明 | 唯一的按鈕：紅色大按鈕裝在警示條底座上（待按） |
| `button_lit.png` | 420×420，透明 | 同一顆，亮起（滑過／可按）；構圖完全一樣 |
| `button_burst.png` | 600×600，透明 | 按下時的一張爆光圖（柔和，**不要火花點點**），程式放大淡出 |

- 格子扇形的**左右兩邊要沿半徑方向**，尖端角度 ≈ 25°，七格並排正好圍成半圓
- 三種格子**形狀完全一樣**，只換顏色
- 按鈕上**不要畫字**，「SPIN」由程式寫
- 平常只看得到 `plate.png` 縮小一半停在盤框下緣，所以圓牌縮小後也要清楚

---

## 6. Tesla Wheel（稀有輪盤）零件 → `volt_delivery/tesla_wheel/`

拆層跟 Mummy 的 Sun Wheel 一樣（照東海龍王）：盤面、外框、等級光、指針、中心蓋分開，數字由程式寫。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `disc_lv1.png`～`disc_lv4.png` | 1200×1200，透明 | 四級盤面：**12 個扇形、不畫數字**；第 0 格（正上方）和第 6 格（正下方）是特殊格 |
| `ring.png` | 1400×1400，透明 | 四級共用的外框：**銅線一圈一圈繞成的線圈環**，中間挖空 |
| `ring_glow_lv1.png`～`lv4.png` | 1400×1400，透明 | 各級的外框光暈（程式用 add 疊，換級時閃） |
| `needle.png` | 280×760，透明 | 從中心伸出的**閃電形指針**，**旋轉中心在圖的 (140, 620)**，尖端朝上 |
| `hub.png` | 320×320，透明 | 中心蓋：特斯拉線圈頂端的甜甜圈形頂球（銅＋電光青綠） |
| `wedge_win.png` | 640×640，透明 | 停中那一格的亮光（**白色**，程式依等級上色；形狀＝一格扇形，尖端在圖下緣正中） |
| `title.png` | 1200×300，透明 | 標題牌，**字畫在圖上：「TESLA WHEEL」** |
| `levelup.png` | 1000×420，透明 | 升級時跳出的字牌，**字畫在圖上：「LEVEL UP!」** |
| `rays.png` | 1920×1080 | 全螢幕背景：從中心放射的**粗電弧／光束**（程式慢慢轉、半透明疊在暗幕上；不要細碎火花） |

| 等級 | 主題 | 主色 | 第 0 格（上） | 第 6 格（下） |
|---|---|---|---|---|
| 1 | 低壓 | 銅＋電光青綠 `#4FF0C8` | LEVEL UP（電光藍） | 最大值 30×（亮青綠＋銅邊） |
| 2 | 中壓 | 電光藍 `#3A8BFF` | LEVEL UP（警示黃） | 90× |
| 3 | 高壓 | 警示黃 `#F5C518`＋橘 | LEVEL UP（電漿紫） | 200× |
| 4 | 超載 | 電漿紫 `#B05CFF` | 2000×（特殊色） | 3000×（最亮，白紫） |

- 其餘 10 格**兩種深淺交錯**，格子邊界清楚
- 特殊格要有**花紋或銅邊**，一眼看出不一樣；LEVEL UP 格只畫底色＋一個向上的閃電箭頭，字由程式寫
- 四級的盤面**構圖、格子角度完全一致**，只換顏色和花紋

```
A flat circular wheel face seen straight on, divided into 12 equal wedge
segments radiating from the centre, NO numbers and NO text on it. Alternating
dark teal and electric cyan (#4FF0C8) wedges with a subtle brushed-metal texture
and thin copper divider lines. The wedge pointing straight UP is electric blue
with a small upward lightning-arrow motif; the wedge pointing straight DOWN is
bright cyan with a copper border. Clean, readable, no clutter. Transparent
background outside the circle. Square 1:1.
```
等級 2–4 換表裡的顏色，其餘一字不改。

**`title.png`／`levelup.png`**：字一定要拼對（T-E-S-L-A W-H-E-E-L、L-E-V-E-L U-P），生完逐字核對。字體用粗圓、好笑的展示字，鐵板沖壓字＋電光青綠描邊。

---

## 7. 大獎牌匾（5 張）→ `volt_delivery/banners/`

| 檔名 | 字 | 尺寸 |
|---|---|---|
| `big.png` | BIG WIN | 1000×560，透明 |
| `superwin.png` | SUPER WIN | 同上 |
| `mega.png` | MEGA WIN | 同上 |
| `epic.png` | EPIC WIN | 同上 |
| `max.png` | MAX WIN | 同上 |

```
A horizontal riveted steel sign, about 16:9, with copper trim and hazard-yellow
stripe ends, two thick cables plugged into both sides, and the words "BIG WIN"
in large chunky stamped letters lit with electric-cyan glow across the upper
part. The lower 40% of the sign is a plain EMPTY panel (the game prints the win
amount there). Transparent background. Only the words "BIG WIN", no other text.
```
- 字換成 SUPER WIN / MEGA WIN / EPIC WIN / MAX WIN 各生一張
- 等級越高越華麗：**青綠 → 電光藍 → 警示黃 → 訊號紅 → 電漿紫**，裝飾越來越多（MAX 可以有科學怪人的平頭從牌子後面探出來）
- **一塊完整的板子，不要畫成兩塊疊在一起**
- 字一定要拼對，逐字核對

---

## 8. 吉祥物：科學怪人（全身，正面）→ `volt_delivery/mascot/`

**人物是正面站姿（使用者 11-07 確認）。Spine 骨架由套版骨架製作**：用 `wp/tools/mascot-rig` 的**正面吉祥物模板**（加權網格＋8 個動作），所以交件**一定要照模板拆圖層**，規格見 [VOLT_MONSTER_RIG_SPEC.md](VOLT_MONSTER_RIG_SPEC.md)（畫布 1024×1536、每個部件一張同尺寸透明 PNG、附 `joints.json`）。

> 這款從 Mummy 複製，Spine runtime 是 4.2，build 用 `--spine 4.2`。

### 8.1 要拆的圖層

**通用規則**
- 畫布 **1024×1536**，每個圖層都是**整張畫布的透明 PNG**，部件**留在原本畫好的位置**（全部疊起來就是完整的科學怪人，不要把部件裁下來置中）
- L／R 指**畫面的左右**（不是角色自己的左右）
- **手、腳都是一整條**畫完（肩到指尖、大腿到鞋尖），**不要在手肘、膝蓋切開**：骨架用加權網格在關節處彎，分節畫會露出切口
- **被擋住的地方要畫完**：舉手、蹲下、轉身時會露出來
- 先交一張完整全身圖（§8.4）確認造型，再照下表拆

**身體圖層（由後往前疊，共 9 張）**

| 順序 | 檔名 | 部件 | 這隻要畫什麼 | 被擋住的地方要畫什麼 |
|---|---|---|---|---|
| 1 | `leg_l.png` | 畫面左・整條腿＋靴子 | 粗壯的腿，褲管短一截露出條紋襪，大方頭靴子（厚鞋底） | 大腿上端多畫約 40px 藏進褲子；膝蓋不要畫圓頭；膝蓋往外微彎 15–20° |
| 2 | `leg_r.png` | 畫面右・整條腿＋靴子 | 同左腿 | 同左腿 |
| 3 | `pelvis.png` | 骨盆／褲子 | 深色破舊短褲（褲頭有一條粗皮帶＋銅扣） | 上緣多畫藏進外套下面；兩個腿洞（大腿根）畫滿 |
| 4 | `neck.png` | 脖子＋螺栓 | 粗短的綠脖子，**兩根銅螺栓從左右兩側伸出**（螺栓畫在這層，程式會讓它冒電） | 上端伸進頭裡、下端藏進衣領後面 |
| 5 | `torso.png` | 軀幹 | 寬肩、桶狀身體，破舊深色外套（太小件，下擺短一截露出一點肚子），胸口一塊補丁 | **兩肩、腋下、被手臂擋住的胸側全部畫完**（舉手時會露出來）；衣領畫在這層 |
| 6 | `arm_l.png` | 畫面左・整條手臂＋手 | 長手臂，袖子太短露出手腕，大綠手 | **肩膀頂端畫成以肩關節為圓心的圓**（半徑＝手臂半寬）；手肘不要畫圓頭；手肘微彎 10–20° |
| 7 | `arm_r.png` | 畫面右・整條手臂＋手 | 同左手 | 同左手 |
| 8 | `head.png` | 頭（臉，**不含頭髮**） | 方臉、額頭縫線、粗眉、大眼睛、咧嘴笑；頭頂畫成剃短的頭皮（頭髮另一層） | 下巴下面多畫一點蓋住脖子上端；頭頂頭皮畫完整（頭髮豎起來時會露出來） |
| 9 | `hair.png` | 頭髮 | 亂翹的黑色平頭，蓋在頭皮上 | 髮根多畫進頭皮一點 |

這隻**沒有耳朵圖層、沒有尾巴**（科學怪人的小耳朵直接畫在 `head.png` 上）。

> `hair.png` 不在 mascot-rig 模板的圖層裡（模板會略過它），收件後我另外把它掛在頭骨上、疊在頭的前面（跟 Mummy 的領口層同一種做法），被電到時換成 `hair_zap.png`。

**換圖用的圖層（表情、被電，共 4 張）**

表情不靠骨架、靠換圖。每張都是同一張 1024×1536 畫布、同一個位置：

| 檔名 | 換掉哪一層 | 內容 | 什麼時候用 |
|---|---|---|---|
| `head_blink.png` | `head` | 眼睛閉上 | 眨眼（閒置時隨機） |
| `head_laugh.png` | `head` | 張大嘴笑、眼睛笑成彎線 | 中獎大笑、大獎 |
| `head_zap.png` | `head` | **被電到**：眼睛睜大成圓、牙齒咬緊、臉頰抖 | 輪盤停在大倍數、LEVEL UP |
| `hair_zap.png` | `hair` | **頭髮整片直直豎起來**、髮尾冒一縷煙（煙畫在圖上） | 跟 `head_zap` 一起換 |

- 四張 `head*` 的**外輪廓、下巴、耳朵、頭皮線要一模一樣**，只換眼睛和嘴，切換時才不會跳
- `hair_zap` 的**髮根位置要跟 `hair` 一樣**，只有頭髮往上長

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
| `headTop` | 頭頂（**含頭髮**，用 `hair.png` 的最高點） |
| `shoulderL` / `shoulderR` | 肩關節（肩膀圓頭的圓心） |
| `elbowL` / `elbowR` | 手肘 |
| `wristL` / `wristR` | 手腕 |
| `handTipL` / `handTipR` | 指尖 |
| `hipL` / `hipR` | 腿根 |
| `kneeL` / `kneeR` | 膝蓋 |
| `ankleL` / `ankleR` | 腳踝 |
| `toeL` / `toeR` | 鞋尖 |

量不準沒關係，標個大概我會再校正；但一定要交。

**交件資料夾長這樣**

```
volt_delivery/mascot/
  full_body.png                         （§8.4 的完整全身圖，確認造型用）
  leg_l.png leg_r.png pelvis.png neck.png torso.png
  arm_l.png arm_r.png head.png hair.png        （身體 9 張）
  head_blink.png head_laugh.png head_zap.png hair_zap.png   （換圖 4 張）
  joints.json
```

> 完整的模板規格（為什麼這樣切、骨架怎麼用）在 [VOLT_MONSTER_RIG_SPEC.md](VOLT_MONSTER_RIG_SPEC.md)，以這節為準。

### 8.2 姿勢與比例（會決定他能不能動）

1. **正面站姿**，臉朝玩家，可以微微轉向盤面（盤面在他的左邊＝畫面左）
2. **兩手離開身體**，手臂和身體之間要看得到背景的縫
3. **肩到手腕的長度 ≥ 肩到頭頂的高度**（科學怪人本來就手長，正好）
4. 手肘微彎 10–20°、膝蓋往外微彎 15–20°、兩腳與骨盆同寬、腳掌平貼地面
5. 身上**不要有東西擋在前面**（不要抱東西、不要雙手交叉）
6. **全身在畫面內，連腳**，四周留空
7. 體型可以很寬，但**頭不要大過肩膀**：這款的旋轉鈕在右下角，人物在盤面右側會比 Mummy 那隻站得高一點、畫面上小一點

### 8.3 交件前先對佔位人偶

```bash
node tools/mascot-rig/mascot.ts mannequin 角色/人偶
```
（在 `wp` 根目錄跑）會畫出一隻照規格的佔位人偶，圖層切法、關節位置照它做就對了。

### 8.4 生圖提示（完整的一張，先用來確認造型，再照它拆圖層）
```
Full-body standing big goofy lovable green Frankenstein-style monster, same
character as the Wild symbol: monster green skin (#7DBB4A), tall flat-top head
with messy black hair, two copper bolts sticking out of his thick neck, cartoon
stitches on the forehead, big friendly eyes, huge toothy grin, a worn dark
jacket that is too small for him (short sleeves showing his wrists), short
trousers showing striped socks, huge square boots with thick soles. Facing the
viewer, standing relaxed, feet apart at hip width, knees slightly bent, BOTH
ARMS HELD CLEARLY AWAY FROM THE BODY with a visible gap between each arm and the
torso, elbows slightly bent, big open hands. Nothing crossing in front of the
body. Painterly casual game art, cool electric key light, cyan rim light.
Transparent background, no text, entire body including feet in frame.
```

---

## 9. 商店縮圖 → `volt_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景**（不是畫一個棋盤格） |
| `cover_16x9_bg.png` | 1920×1080，不透明（Stake 審查要求 16:9 封面） |
| `cover_16x9_fg.png` | 1920×1080，透明 |

- **FG 只放主角**（科學怪人半身或全身，可以抓著閘刀、頭髮被電得豎起來），**不要放遊戲名稱、字、Logo**
- **BG 不能只是把夜裡的實驗室調暗**：200px 下會變一塊黑。用大塊、明亮的色塊（例如一道巨大的青綠閃電劈開紫藍天空、亮銅色機器）
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% ≥ 35、低於 32 的像素 ≤ 30%。交件後我跑 `check_thumbnail.py`
- 封面另外存一份到 `E:/stake/wp/VoltMonster/封面圖/`（去背人物＋背景兩張，同光向同色調，不要直接覆蓋舊版）

---

## 10. UI → `volt_delivery/ui/`

這款的下注列是**第四版（拆分式）**，按鈕、面板、旋轉鈕、加減注、讀數都由程式畫，**不用交圖**。要交的只有買入方塊的圖示和購買選單的卡片圖：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buy_icon.png` | 512×512，透明 | 左下黃色買入方塊中央的圖示：**黑色單色、粗線**（線寬約畫布 12%、孔洞保持打開），**不能用閃電**（Turbo 鈕已經是閃電）；建議燈泡或閘刀開關。不能用參考廠商的標誌 |
| `buy_art_bonus.jpg` | 800×450 | 購買選單：FG 卡片場景（實驗台通電、Volt Meter 發光） |
| `buy_art_holdandspin.jpg` | 800×450 | 購買選單：Hold & Spin 卡片（電能幣從大電池裡噴出來） |
| `buy_hero_bonus.png` | 512×512，透明 | FG 卡片主角物件：Volt Meter 的紅色大按鈕 |
| `buy_hero_holdandspin.png` | 512×512，透明 | Hold & Spin 卡片主角物件：一疊電能幣 |
| `buy_art_volt.jpg` | 800×450 | 激活卡片 VOLT SPIN／VOLT SURE WIN 共用場景（Volt Meter 在盤面下緣亮著） |
| `buy_art_tesla.jpg` | 800×450 | 激活卡片 TESLA BOOST 場景（特斯拉線圈放電） |
| `buy_hero_volt5.png` `buy_hero_volt10.png` `buy_hero_tesla.png` | 512×512，透明 | 三張激活卡片主角物件：一格／兩格滿電的電池、特斯拉線圈頂球 |

- 所有購買場景圖都**沒有文字**、16:9
- 購買選單的卡片框、特效粒子都是程式畫的，不用生

---

## 11. 轉場（FG 進場／離場）→ `volt_delivery/transition/`

Mummy 的轉場是繃帶捲過畫面。這款改成**全場燈光一閃一暗、一道巨大閃電劈下來，白光蓋住畫面**：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `bolt_strike.png` | 900×2160，透明 | 一道從上劈到下的粗閃電（白芯＋電光青綠外圈，**分支 2–3 條就好**，不要細碎） |
| `flash_glow.png` | 1024×1024，透明 | 一團柔邊白青光（程式放大到蓋滿畫面） |

**轉場要做到的事**：約 0.3 秒燈光閃兩下變暗 → 0.5 秒閃電劈下、白光蓋滿畫面，蓋住的那一刻換場景 → 0.5 秒內白光退掉。圖上**不要畫陰影和火花**，程式加。

---

## 12. 字型

| 用途 | 建議 | 備註 |
|---|---|---|
| 標題、牌匾、輪盤數字、FG 局數 | **Lilita One**（粗圓、好笑；從 Mummy 繼承） | `×` 用字母 `X` 代替 |
| 下注列 | Nunito（第四版 bar 規定） | 不換 |
| 規則頁、付費表內文 | 系統無襯線 | 不變 |

畫在圖上的字（牌匾、`title.png`、`levelup.png`）要和程式字型同一種感覺：粗圓、鐵板沖壓字。

---

## 13. 交件清單

```
volt_delivery/
  symbols/       h1 h2 h3 h4 w s l1 l2 l3 l4 l5 p x                          (13)
  backgrounds/   bg_base bg_feature bg_holdandspin
                 ＋各自的 _far ＋ 每個可動物件一張 _obj_<名稱>
                 ＋ bg_base_sky ＋ objects.txt                     (3＋3＋約18＋1)
  frame/         frame_edge frame_bg fs_sign fs_counter_panel                 (4)
  volt_meter/    arch_base tile_normal tile_hot tile_top tile_result_glow
                 plate plate_flash pointer button button_lit button_burst    (11)
  tesla_wheel/   disc_lv1-4 ring ring_glow_lv1-4 needle hub wedge_win
                 title levelup rays                                          (16)
  banners/       big superwin mega epic max                                   (5)
  mascot/        照 VOLT_MONSTER_RIG_SPEC.md 的圖層＋joints.json
                 ＋hair（選用）＋head_blink head_laugh head_zap         (約14＋json)
  thumbnail/     thumb_bg thumb_fg cover_16x9_bg cover_16x9_fg                (4)
  ui/            buy_icon buy_art_bonus buy_art_holdandspin buy_hero_bonus
                 buy_hero_holdandspin buy_art_volt buy_art_tesla
                 buy_hero_volt5 buy_hero_volt10 buy_hero_tesla               (10)
  title/         logo_wordmark logo_wordmark_small                            (2)
  transition/    bolt_strike flash_glow                                       (2)
```

**建議交件順序**：符號 → 吉祥物（先交一張完整全身圖確認造型，再拆層）→ **背景（含分層）** → 兩個輪盤 → 框 → UI／牌匾 → 轉場 → 縮圖。

### 交件前自己檢查

- [ ] 13 張符號縮到 120px 排一列，每張都認得出來
- [ ] 轉灰階看，高分比低分**彩度高**、低分的字**清楚**
- [ ] 除了 S 和特斯拉輪，沒有任何東西是紫色當主色
- [ ] W、吉祥物、縮圖上的科學怪人是同一隻（平頭、螺栓、縫線位置一致）
- [ ] 吉祥物：手臂離開身體、全身在畫面內、所有頭的輪廓一致
- [ ] **每張背景有 5–8 個可動物件**，每個都完整、沒被擋住、跟牆分得開；旋轉的是正圓、擺動的有懸掛點
- [ ] **`_far` 乾淨背景跟完整那張同構圖**，物件拿掉的地方牆有補完
- [ ] 背景左下、右下角沒有可動物件（被下注按鈕蓋住）
- [ ] 圖上沒有畫火花點點、電弧、泡泡、蒸汽（全部程式做）
- [ ] 所有畫在圖上的字拼對了
- [ ] 透明的那幾張真的是透明（不是白底或棋盤格）

### 我這邊收到後會量的（不用你做）

- 每個高分符號中央 60% 平均亮度 ≥ 70；低分亮區覆蓋率 ≤ 高分最低值
- 背景各物件的軸心／懸掛點、`_far` 和完整圖的差異（確認拆得乾淨）
- 縮圖三項亮度門檻
- 吉祥物 `build` 報告：流暢度 ≥ 80、網格摺疊 0、手追不上 ≤ 3%、遊戲檔重播 < 0.05 px

---

## 14. 讀取頁標題字標（每款各自的設計方向）→ `volt_delivery/title/`

使用者 11-08 要求：讀取頁的遊戲名稱**不再用程式字拼兩色**（前幾款都長一樣），每款畫一個自己風格的字標。字標到之前，程式先用文字頂著。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `logo_wordmark.png` | 1600×700，**透明** | 讀取頁大標題，字畫在圖上 |
| `logo_wordmark_small.png` | 800×350，透明 | 同一個設計的簡化版（細節少一點），給手機直式和左上角遊戲名 |

**共同規則**
- 字一定要拼對（V-O-L-T M-O-N-S-T-E-R），生完逐字核對
- **小尺寸要讀得出來**：縮到 400px 寬還要一眼認出每個字母；裝飾不能蓋過字母本身
- 字標是**一整塊**（不要畫成兩塊板疊在一起），透明背景，外圍留約 5% 空白
- 不要畫星星、光點、飛散的火花；電光的光暈由程式加
- 主體字母和裝飾分得開（字母之後可能會做進場動畫：被電一下一個個亮起來）

**這款的設計方向：通電的實驗室鐵牌**
- **VOLT** 是**鐵板沖壓字**：鐵灰、四角鉚釘，字的邊緣一圈電光青綠，一道**閃電裂痕**斜斜劈過字母中間（裂痕是字的一部分，不是飛出去的火花）
- **MONSTER** 大一號、**怪物綠**的圓胖字形，字面上有幾道卡通**縫線**
- MONSTER 的「O」左右兩邊各伸出一根**銅螺栓**（就是科學怪人脖子上那兩根）
- 字標下緣一條**黃黑警示條**當底線
- 字可以微微抖、歪一點點（像剛被電到），但**底線整齊、每個字母都要正**
- 不要用紫色（紫是 Scatter 和特斯拉輪的）

```
A game title wordmark logo reading "VOLT MONSTER" on a transparent background.
"VOLT" in riveted steel-plate stamped letters, steel grey (#5E6B78) with an
electric-cyan (#4FF0C8) glowing edge and one lightning-shaped crack running
diagonally through the letters; "MONSTER" in bigger chunky rounded monster-green
(#7DBB4A) letters with a few cartoon stitch marks across them, the "O" of MONSTER
has a copper bolt sticking out on each side like a neck bolt, a short
hazard-yellow-and-black stripe bar runs underneath as an underline. Letters
slightly jittery as if just zapped but upright and readable, a thick dark slate
outline around everything. Fun mad-science cartoon, no purple, no sparkles, no
flying sparks. Only the words "VOLT MONSTER".
```
