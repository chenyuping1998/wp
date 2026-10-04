# GO BANANEON（霓虹）— 美術需求清單

> 這份文件是 Bananeon 美術的**唯一依據**。資料夾裡其他的 `*_PROMPTS.md` / `GEN2_ART_SPEC.md`
> 是從 Boomana 繼承下來的參考，寫的是礦坑內容，**不要拿去生圖**。
>
> 交件放在 `design/source/neon_delivery/` 對應的子資料夾，**檔名照表格寫**。
> 收到後我會負責去框、縮放、切 glow/sheen 圖層、量亮度，最後接進遊戲。

---

## 0. 主題一句話

**深夜的霓虹不夜城。** 猩猩是戴 LED 墨鏡的街頭電音 DJ，原本 Boomana 的炸藥改成
**脈衝彈（Pulse Bomb）**：落下引爆後，整輪「過載」成同一個符號。免費遊戲的階梯叫做
**Overdrive**，Hold & Spin 的金幣改成**霓虹代幣**。

數學和 Boomana 完全一樣，只換美術、音效和名稱。

### 0.1 調色盤（全套共用）

| 角色 | 色 | Hex |
|---|---|---|
| 夜空／底色 | 深靛紫 | `#1A1440` |
| 高分符號底板 | 中調靛藍 | `#2E2A58` |
| 低分符號底板 | 淡霧灰（無彩） | `#CFCCD6` |
| 主霓虹 1 | 洋紅 | `#FF2BD6` |
| 主霓虹 2 | 電光青 | `#22EEFF` |
| 點綴 | 萊姆綠 | `#B8FF3C` |
| 點綴 | 夕陽橘 | `#FF8A1F` |
| 炸彈專用 | 電紫＋白熱 | `#9B5CFF` |
| **Scatter 專用** | **金** | `#FFC83A` |

**金色只屬於 Scatter。** 其他任何符號、任何 UI 都不准用金色當主色，否則 Scatter 會被淹掉。

### 0.2 一條最重要的教訓（從 Boomana 量出來的）

霓虹主題最容易犯的錯是**整片暗**：黑底加細細的燈管，縮到 140px 只剩幾條亮線。
Boomana 第一版的高分符號平均亮度只有 46～67，盤面上幾乎看不見。

所以這一套：
- **主體要是實心、受光的物件**，霓虹是它的**邊光和點綴**，不是只用線條畫出來的輪廓
- 每個高分符號在中央 60% 的**平均亮度要 ≥ 70**（0–255）
- 底板是**中調靛藍**，不是黑色

---

## 1. 給 GPT 的共用風格開頭（每次開新對話先貼這段）

```
You are producing a matched set of game art for a cartoon slot game called
"Go Bananeon": a neon synthwave city at night, starring a cool gorilla DJ.
Style for EVERY image in this conversation: painterly hand-illustrated casual
game art, bold simple readable shapes, thick clean silhouettes, soft cel
shading, glossy highlights. Solid lit objects with neon rim light — NOT thin
wireframe neon outlines on black. Key light from the upper left, magenta
(#FF2BD6) and cyan (#22EEFF) neon rim lights. Saturated but clean, never muddy
or near-black. Never include any text, letters, numbers, logos or watermarks
unless the prompt explicitly asks for a specific letter.
Gold is reserved for one symbol only (the golden banana bunch); do not use
gold as a main colour anywhere else.
```

**生成方式**：同一個對話裡依序生，風格才會一致。每張生完，自己先縮到 140px 看一眼：
認不出來是什麼的就重生。

---

## 2. 符號（14 張）→ `neon_delivery/symbols/`

| 檔名 | 格式 | 說明 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild（猩猩胸像） |
| `s.png` | 1024×1024 正方、不透明 | Scatter（金香蕉串） |
| `b.png` | 1024×1024 正方、不透明 | 脈衝彈（取代炸藥） |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 代幣（數字由程式寫上去） |
| `bomb_prop.png` | 1024×1024 **透明背景** | 脈衝彈去背的單體，用在轉場、階梯圖示、購買選單 |

**通則**
- 主體佔格子寬約 80%，四周留約 8% 空隙，不要貼邊
- 高分／W／S／B 都放在同一塊**中調靛藍底板**上（`#2E2A58`，四角有小鉚釘＋一圈細霓虹邊）。底板之後會被我裁掉，但生的時候一定要有，整套比例才會一致
- 低分的底板是另一塊**淡霧灰壓克力板**
- **每一張高分的色相都不一樣**，這是在 0.3 秒內分辨它們的主要依據，剪影是第二層

### 2.1 高分（由高到低）

**H1 — 洋紅手提音響（Boombox）**
```
A chunky retro boombox seen straight on, filling most of the frame, glossy hot
magenta (#FF2BD6) body with two big round speakers that GLOW from inside with
pink-white light, chrome handle on top with a bright rim light. The speakers
are light sources that flood the box with light — this is the brightest,
most eye-catching symbol of the set. Centred on a mid-tone indigo plate
(#2E2A58) with small riveted corners and a thin neon edge. Square 1:1, no text.
```
**為什麼是 H1**：它自己發光，最高分要第一眼跳出來。寬矩形剪影，跟其他三個都不撞。

**H2 — 電光青機車安全帽**
```
A sleek futuristic motorcycle helmet in three-quarter view, filling most of the
frame, glossy white-and-cyan shell with a large reflective visor glowing
electric cyan (#22EEFF), a hard bright specular stripe across the top. Round,
smooth silhouette. Centred on a mid-tone indigo plate (#2E2A58) with small
riveted corners and a thin neon edge. Square 1:1, no text.
```
**為什麼**：全套唯一的冷青色主體，圓形剪影。

**H3 — 萊姆綠噴漆罐**
```
A spray-paint can tilted diagonally, filling most of the frame, glossy lime
green (#B8FF3C) can with a white cap, a burst of bright lime spray mist
shooting out of the nozzle toward the upper right with a few paint droplets.
Strong rim light along the whole left contour. Tall diagonal silhouette.
Centred on a mid-tone indigo plate (#2E2A58) with small riveted corners and a
thin neon edge. Square 1:1, no text.
```
**為什麼**：斜向的長條剪影，加上往外噴的霧，輪廓跟圓形的 H2 完全不同。

**H4 — 夕陽橘高筒球鞋**
```
A single chunky high-top sneaker in side view, filling most of the frame,
bright sunset orange (#FF8A1F) with white sole and laces, small glowing LED
strip along the sole, glossy highlights on the toe. L-shaped silhouette.
Centred on a mid-tone indigo plate (#2E2A58) with small riveted corners and a
thin neon edge. Square 1:1, no text.
```

### 2.2 特殊符號

**W — 猩猩 DJ 胸像（Wild）**
```
A heavy-set friendly gorilla DJ seen from the chest up, facing forward,
filling the frame. Wears wide LED shutter sunglasses glowing magenta and cyan,
big over-ear headphones shaped like curved bananas (yellow with a cyan glow),
and a pale silver holographic bomber jacket that keeps his silhouette light
against the plate. His face is LIT by the glow of the glasses, not in shadow.
Confident grin. Dark fur with a bright cyan rim light on the shoulders and top
of the head. Centred on a mid-tone indigo plate (#2E2A58) with small riveted
corners and a thin neon edge. Square 1:1, no text.
```
- **淺色夾克是刻意的**：深色毛皮在深色底板上會糊掉，靠淺色身體撐起剪影
- 必須跟第 7 節的吉祥物**是同一隻**。臉型對不上就重生

**S — 金香蕉串（Scatter）**
```
A bunch of five bananas cast in polished chrome-gold (#FFC83A), filling most of
the frame, with thin glowing cyan circuit lines etched across the peel. Bright,
reflective and warm, hard specular highlights along the top of each banana and
a strong rim light. Small sparks around it. This is the ONLY gold object in the
whole set and the brightest symbol on the board. Centred on a mid-tone indigo
plate (#2E2A58) with small riveted corners and a thin neon edge. Square 1:1, no
text.
```
系列從一代起的 Scatter 都是香蕉串，玩家認得這個形狀，**不要改成別的東西**。

**B — 脈衝彈（取代炸藥）**
```
A round cartoon bomb made of dark chrome with a glowing electric violet
(#9B5CFF) plasma core visible through a glass window on its front, crackling
with tiny white lightning. A thick glowing cable fuse rises from the top and
ARCS UP AND OUT to one side, ending in a brilliant white-violet spark. The
spark is the brightest point in the picture. Centred on a mid-tone indigo
plate (#2E2A58) with small riveted corners and a thin neon edge. Square 1:1,
no text.
```
**那道往外彎的引信是關鍵**：整套只有它有一條線離開主體，這是 B 的識別點，不要讓它縮回去。

**bomb_prop.png** — 同一顆脈衝彈，**去背、無底板**，引信和火花完整。透明 PNG。

**p.png — 霓虹代幣（Hold & Spin）**
```
A thick round arcade token seen straight on, glossy chrome rim with a glowing
cyan neon ring inset, the flat centre left EMPTY and smooth (a number will be
printed there by the game). Transparent background, no plate. Square 1:1, no
text.
```
中間要留**乾淨的空白**，金額會由程式寫上去。不要用金色，金色是 Scatter 的。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**，分開生會變成五種字體。

```
The single letter "A" deeply engraved INTO a pale frosted acrylic tile, colour
#CFCCD6, almost colourless, with softly rounded corners and a thin white
light edge. The letter is a dark recessed cut (deep indigo #241E48), thick
blocky rounded sans-serif, with a clean unbroken outline; the upper edge of
the cut catches a bright highlight. Maximum contrast between the dark letter
and the pale tile. Any scratches or reflections belong to the TILE only — the
letterform itself must stay perfectly clean and unbroken. Square 1:1, only the
single character "A" and no other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 要額外加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。

**為什麼低分是淺色無彩**：亮度給低分，彩度給高分，兩者在不同維度上競爭，
光看格子的明暗就分得出大小獎。低分只靠字形分辨，**不要幫它們上顏色**。

---

## 3. 背景（3 張）→ `neon_delivery/backgrounds/`

| 檔名 | 用途 |
|---|---|
| `bg_base.png` | 主遊戲 |
| `bg_feature.png` | 免費遊戲（Overdrive） |
| `bg_holdandspin.png` | Hold & Spin |

**硬性規格**
- **16:9，至少 1920×1080**，不要生成寬銀幕再讓我裁
- **畫面會被拉伸、不保持比例**：不要靠正圓、完整的招牌字形撐構圖（圓會變橢圓）
- **中央約 55% 寬 × 70% 高會被盤面蓋住，右側站著猩猩**。細節放在頂部和左側，中央要暗、要安靜
- **盤面範圍內亮度要壓低**：符號是去框的，背景會從格子間透出來。中央不能有大片的亮招牌或月亮
- 直式手機也會用這張圖（左右會被裁），所以重點不要只放在最左或最右邊
- 沒有人物、沒有文字、沒有可讀的招牌字

**bg_base — 雨夜霓虹街**
```
16:9 game BACKGROUND plate, no characters, no people, no text, no readable
signs. A rain-slicked neon city street at night seen from street level: tall
buildings on both sides with glowing magenta and cyan sign shapes (abstract,
no letters), wet asphalt reflecting the colours, light haze. Deep indigo sky
(#1A1440). The CENTRE of the image is darker, calmer and less detailed (a slot
board will cover it); keep the brightest neon in the top band and the left
side. Painterly casual game art, rich but not cluttered.
```

**bg_feature — 屋頂 Overdrive**
```
16:9 game BACKGROUND plate, no characters, no people, no text. A rooftop high
above a neon city at night, a huge synthwave sunset sun on the horizon striped
with horizontal bands in magenta and orange, glowing grid lines on the floor
receding into the distance, the city skyline below in cyan glow. Energetic and
brighter than the street scene. The CENTRE stays calmer and slightly darker
(a slot board covers it); put the sun LOW and partially behind the skyline so
it does not sit behind the middle of the picture. Painterly casual game art.
```
**太陽要壓低**：Go Bananas 三代的免費遊戲背景，太陽正好在最上排符號後面，最後得另外加一層霧才救回來。

**bg_holdandspin — 代幣金庫**
```
16:9 game BACKGROUND plate, no characters, no people, no text. The inside of a
neon arcade vault: walls of shelves stacked with glowing chrome tokens with
cyan rings, cyan and violet light strips, a polished reflective floor. Cooler
and more contained than the street. The CENTRE stays darker and calmer (a
slot board covers it). Painterly casual game art.
```
這是跟主玩法無關的獨立模式，所以**刻意不用街景**，一眼就知道換了場景。

---

## 4. 盤面框與招牌 → `neon_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深靛藍半透明玻璃，幾乎沒有細節 |
| `fs_sign.png` | 1280×1000，透明 | 免費遊戲招牌：**三條橫向分隔的板子**（文字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | 免費遊戲計數面板（上方中間留一個小圖示位置） |

**frame_edge**
```
A square slot-machine board frame, 1:1, chrome and dark indigo metal with a
continuous glowing neon tube running around it (magenta on the top and bottom,
cyan on the sides), small rivets, rounded corners with chrome corner caps. The
ENTIRE INSIDE of the frame is empty and fully transparent — only the border
band exists. Border thickness about 6% of the width. Transparent background,
no text.
```

**fs_sign**
```
A wide horizontal neon signboard, about 1.28:1, dark indigo glass panel with a
chrome border and glowing magenta neon edge tubes, divided into THREE equal
horizontal strips by thin chrome bars. The strips are EMPTY (text will be
added by the game). Small bolts at the corners. Transparent background around
the board, no text.
```
**一定要是三條板子**：程式會讓三條各自晃動，文字固定騎在中間那條上。

**fs_counter_panel**：跟 fs_sign 同材質，一塊完整的面板（不分條），上方中央留一個小凹槽放圖示，透明背景、無文字。

---

## 5. 大獎牌匾（5 張）→ `neon_delivery/banners/`

| 檔名 | 字 |
|---|---|
| `big.png` | BIG WIN |
| `superwin.png` | SUPER WIN |
| `mega.png` | MEGA WIN |
| `epic.png` | EPIC WIN |
| `max.png` | MAX WIN |

1000×560，透明背景。**這五張的字是畫在圖上的**，而且等級越高越華麗。

```
A horizontal neon sign plaque, about 16:9, chrome and dark indigo frame with
glowing neon tubes, and the words "BIG WIN" in large chunky glowing neon
letters across the upper part. The lower 40% of the plaque is a plain dark
EMPTY panel (the game prints the win amount there). Transparent background.
Only the words "BIG WIN", no other text.
```
- 字換成 SUPER WIN / MEGA WIN / EPIC WIN / MAX WIN 各生一張
- 顏色由低到高：**青 → 萊姆 → 洋紅 → 紫 → 洋紅＋青雙色**，外框裝飾越來越多（星芒、閃電）
- **字一定要拼對**，生完逐字核對

---

## 6. UI → `neon_delivery/ui/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buybonus_stone.png` | 800×800，透明 | 下注列上的 **Buy Bonus 按鈕**（平常的狀態） |
| `buybonus_stone_lit.png` | 800×800，透明 | 同一顆按鈕，**燈管點亮**的狀態（滑過／可按） |
| `ticker_plate.png` | 652×146，透明 | 下注列上的長條跑馬燈底板 |
| `buy_art_bonus.jpg` | 800×450 | 購買選單：免費遊戲三檔共用的場景圖 |
| `buy_art_holdandspin.jpg` | 800×450 | 購買選單：Hold & Spin 的場景圖 |

**buybonus_stone / _lit**：兩張的**構圖要完全一樣**，只差燈有沒有亮。
```
A rounded-square button tile, dark indigo glass with a chrome bevel border and
an UNLIT neon tube outline inside the border (dim grey-pink glass tube).
Centre left empty (the game prints a label). Transparent background, no text.
```
點亮版：同一張，霓虹管點亮成洋紅、往外泛光、玻璃面有一點反光。

> 這顆按鈕和購買選單的卡片是**兩個不同的素材**，兩個都要。

**ticker_plate**：細長的深靛藍玻璃條，鉻邊加一條細青色霓虹，中間空白（放跑馬燈文字），透明背景。

**buy_art_bonus.jpg**：屋頂 Overdrive 的縮小場景（同 bg_feature 的語彙，但是更近、更有張力），中央有一顆脈衝彈在發光。
**buy_art_holdandspin.jpg**：一堆發光的霓虹代幣從畫面中央噴出來，背景是代幣金庫。
兩張都**沒有文字**、16:9。

> 購買選單的卡片框、下注列的圓形小圖示、階梯的電池格、特效粒子，都是程式畫的，**不用生**。

---

## 7. 吉祥物（全身）→ `neon_delivery/mascot/`

| 檔名 | 規格 |
|---|---|
| `mascot_full.png` | 透明背景，**直式，至少 1024×1700**，全身站姿 |

```
Full-body standing gorilla DJ character, same character as the Wild symbol:
LED shutter sunglasses glowing magenta and cyan, banana-shaped headphones
around the neck, pale silver holographic bomber jacket, baggy dark cargo
pants, chunky orange high-top sneakers. Standing relaxed, facing three-quarter
toward the LEFT, feet apart. BOTH ARMS HELD CLEARLY AWAY FROM THE BODY with a
visible gap of background between each arm and the torso (one hand raised in
a "rock on" gesture, the other relaxed at hip height but not touching it).
Nothing crossing in front of the body. Painterly casual game art, rim light in
cyan. Transparent background, no text, entire body including feet in frame.
```

**這三點會決定他能不能動**（他是用整張圖做網格骨架動起來的）：
1. **手臂和身體之間要看得到背景的縫**。手臂貼著身體的話，一動手就會把夾克一起拖走
2. **身上不要有東西擋在前面**（例如抱著東西、雙手交叉），網格扭不開
3. **全身都要在畫面內，連腳**，四周留一點空

他站在盤面**右側**，臉朝左看盤面。如果之後想要更細的動作（頭髮、耳機擺動），
可以再另外拆圖層，但先給一張完整的全身圖就能開工。

---

## 8. 商店縮圖（Stake 遊戲大廳那張圖）→ `neon_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景**（不是畫一個棋盤格） |

- **FG 只放主角**（猩猩 DJ 半身或全身，可以拿著脈衝彈），**不要放遊戲名稱、字、Logo**
- **BG 不能只是把遊戲背景調暗**：在 200px 下會變成一塊黑。要用大塊、明亮的色塊（例如粉紫夕陽天空加霓虹城市剪影）
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% 的亮度 ≥ 35、低於 32 的像素 ≤ 30%。交件後我會跑腳本量

---

## 9. 交件清單（勾完就可以給我）

```
neon_delivery/
  symbols/     h1 h2 h3 h4 w s b l1 l2 l3 l4 l5 p bomb_prop   (14)
  backgrounds/ bg_base bg_feature bg_holdandspin              (3)
  frame/       frame_edge frame_bg fs_sign fs_counter_panel   (4)
  banners/     big superwin mega epic max                     (5)
  ui/          buybonus_stone buybonus_stone_lit ticker_plate
               buy_art_bonus buy_art_holdandspin              (5)
  mascot/      mascot_full                                    (1)
  thumbnail/   thumb_bg thumb_fg                              (2)
```
共 **34 張**。

**交件前自己檢查**
- [ ] 14 張符號縮到 140px 排一列，每一張都認得出來
- [ ] 轉成灰階看，高分符號比低分符號**彩度高**、低分符號的字**清楚**
- [ ] 除了 S，沒有任何東西是金色的
- [ ] W 和吉祥物、縮圖上的猩猩是同一隻
- [ ] 五張牌匾的字拼對了
- [ ] 透明的那幾張真的是透明（不是白底或棋盤格）

**可以分批給**，建議順序：符號 → 吉祥物 → 背景 → 框 → UI／牌匾 → 縮圖。
符號先到的話我就能先上盤面看整體效果。
