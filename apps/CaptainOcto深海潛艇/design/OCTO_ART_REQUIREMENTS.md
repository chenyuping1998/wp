# CAPTAIN OCTO — 美術需求單

> 這份是 Captain Octo 美術的**唯一依據**。遊戲裡現在的圖全是 Mummy Mayhem（木乃伊貓、墓室）的佔位，**不要參考它們的內容**。
>
> 交件放在 `design/source/octo_delivery/<類別>/`，**檔名照表格寫**。收到後我負責去背、縮放、切 glow／sheen 圖層、量亮度、接進遊戲。
>
> 配套文件：
> - 人物（側面）的完整模板規格：`E:\stake\spine-generator\docs\生圖交付規格.md`、姿勢參考圖 `E:\stake\spine-generator\docs\pose-reference.png`（要拆的圖層以本單 §8.1 為準）
> - 規則：[../OCTO_SPEC.md](../OCTO_SPEC.md)
> - 音效需求單：還沒寫，音效目前沿用 Mummy Mayhem

---

## 0. 主題

### 0.1 一句話

**深海裡開著黃銅潛艇的章魚船長。** 一隻圓滾滾的紅珊瑚色章魚，戴藍色船長帽、穿海軍藍雙排扣船長外套，自以為是硬漢，兩條觸手總是擺出拳擊架式。好笑來自**愛逞強**：揮拳揮到自己打結、一緊張就噴墨、帽子在水裡飄走又追回來。**明亮、好笑、不恐怖**（沒有沉船屍骨、沒有深海怪物張大嘴）。

### 0.2 兩個輪盤的美術身分

| 機制 | 名稱 | 長相 |
|---|---|---|
| FG 倍率輪盤（每局有連線必轉） | **SONAR WHEEL（聲納輪）** | 盤面下緣升起的半圓拱，做成**黃銅潛艇的聲納儀表**：黃銅外框＋鉚釘，內側是綠色聲納螢幕，格子是一格格掃描扇區；中央圓牌顯示目前倍數；拱頂一根固定指針；一顆按鈕 |
| 稀有輪盤（一局結束隨機） | **ABYSS WHEEL（深淵輪）** | 全螢幕的大轉盤，**像一個往下旋的漩渦**；四級照海的深度往下：**淺海陽光（湖水藍）→ 暮光層（深藍）→ 午夜層（靛紫）→ 深淵（螢光粉）**；外圈是潛艇舷窗的黃銅圈；中心伸出一根魚叉形指針 |

兩個輪盤上的**數字都由程式寫上去**，圖上一律不要畫數字。

### 0.3 調色盤

| 角色 | 色 | Hex |
|---|---|---|
| 深海底色 | 深海藍 | `#0B1E3A` |
| 海水中景 | 海青 | `#127A8A` |
| 金屬（潛艇、盤框） | 黃銅 | `#C9A04A` |
| 點綴 1（聲納） | 聲納綠 | `#5CFFB0` |
| 點綴 2（主角） | 珊瑚紅 | `#FF6F59` |
| 點綴 3 | 沙色 | `#F2E3C2` |
| 點綴 4 | 海軍藍（船長服） | `#1F3D7A` |
| **Scatter／深淵輪第 4 級專用** | **螢光粉** | `#FF5FCF` |

**螢光粉只屬於 Scatter（發光水母）和深淵輪最高級。** 其他地方不准用粉紅當主色。黃銅可以到處用（它是金屬，不是獎勵色）。

> 跟前幾款分得開：這款是**唯一一款在水裡的**，主色是藍綠漸層＋黃銅，光從上方的海面灑下來（光束），深處有螢光。

### 0.4 從前幾款量出來的規則

1. **符號不能整片暗**：深藍底最容易糊，每個高分符號在中央 60% 的**平均亮度 ≥ 70**（0–255）。
2. **高分靠「色相＋剪影」兩層分辨**，低分靠字形。
3. **低分的亮度／亮區覆蓋率不能超過高分的最低值。**
4. **背景中央要暗、要安靜**。
5. **不要小星星、硬邊光環、方框特效**。**泡泡也不要畫在圖上**（泡泡、光束、浮游生物由程式做；畫上去會跟程式的疊兩層）。

---

## 1. 給生圖的共用風格開頭（每次開新對話先貼）

```
You are producing a matched set of game art for a cartoon slot game called
"Captain Octo": a bright deep-sea adventure with a brass submarine, starring a
chubby coral-red cartoon OCTOPUS sea captain in a blue captain's hat and a navy
double-breasted captain's coat, who thinks he is a tough guy and always holds
two tentacles up like a boxer. Style for EVERY image in this conversation:
painterly hand-illustrated casual game art, bold simple readable shapes, thick
clean silhouettes, soft cel shading, glossy highlights, soft sunlight beams
from the sea surface above and a sonar-green (#5CFFB0) rim light. Palette: deep
sea blue (#0B1E3A), sea teal (#127A8A), polished brass (#C9A04A), coral red
(#FF6F59), sand (#F2E3C2), navy (#1F3D7A). Bright, friendly and funny, never
scary: NO skeletons, NO shipwreck bodies, NO monster jaws. Glowing pink
(#FF5FCF) is reserved for one glowing jellyfish and the top level of the abyss
wheel only; do not use pink as a main colour anywhere else. Never draw bubbles,
sparkle dots or particles. Never include any text, letters, numbers, logos or
watermarks unless the prompt explicitly asks for a specific letter.
```

**生成方式**：同一個對話裡依序生，風格才一致。每張縮到 120px 看一眼，認不出是什麼就重生。

---

## 2. 符號（13 張）→ `octo_delivery/symbols/`

| 檔名 | 規格 | 內容 |
|---|---|---|
| `h1.png` `h2.png` `h3.png` `h4.png` | 1024×1024 正方、不透明 | 高分 |
| `w.png` | 1024×1024 正方、不透明 | Wild：章魚船長胸像 |
| `s.png` | 1024×1024 正方、不透明 | Scatter：發光水母 |
| `l1.png`～`l5.png` | 1024×1024 正方、不透明 | A K Q J 10 |
| `p.png` | 1024×1024 **透明背景** | Hold & Spin 珍珠貝幣（中央留白，金額由程式寫） |
| `x.png` | 1024×1024 **透明背景** | Hold & Spin 的空格 |

**通則**
- 主體佔格子寬約 80%，四周留約 8%，不要貼邊
- 高分／W／S 放在同一塊**深海藍舷窗底板**上（`#0B1E3A`，一圈黃銅邊、四角各一顆鉚釘）；低分放在**淡沙色石板**上。底板我會切掉，但生的時候一定要有
- **每張高分的主色相都不一樣**，剪影也不一樣（直、圓頂、圓、橫各一）
- **中獎動畫要切出主體、讓它自己動**：主體完整、輪廓和底板分得開、不碰邊框；每張高分要有 1–2 個**會自己動的部件**

### 2.1 高分（由高到低）

**H1 — 船錨**（黃銅＋紅繩，直立）
```
A big cartoon ship's anchor standing upright, polished brass (#C9A04A) with a
thick coral-red rope coiled around its shank and one loose rope end, a little
starfish stuck on one fluke, filling most of the frame. Tall vertical
silhouette. Centred on a deep sea-blue porthole plate (#0B1E3A) with a brass
rim and a rivet in each corner. Square 1:1, no text, no bubbles.
```
會動的部件：繩子的鬆頭（甩）、海星（揮手）。

**H2 — 黃銅潛水頭盔**（海青玻璃＋黃銅，圓頂）
```
A classic brass deep-sea diving helmet seen from the front, polished brass with
round sea-teal (#127A8A) glass windows, a small coral-red air hose curling off to
one side, a little hermit crab peeking out of the front window, filling most of
the frame. Dome silhouette. Centred on a deep sea-blue porthole plate (#0B1E3A)
with a brass rim and a rivet in each corner. Square 1:1, no text, no bubbles.
```
會動的部件：寄居蟹（探頭縮回）、軟管（甩）。

**H3 — 河豚**（沙黃，圓形）
```
A round cartoon pufferfish puffed up into a ball, sand-yellow (#F2E3C2) with
soft orange spots and short rounded spikes, big surprised eyes, tiny fins and
tail, filling most of the frame. Round silhouette. Centred on a deep sea-blue
porthole plate (#0B1E3A) with a brass rim and a rivet in each corner.
Square 1:1, no text, no bubbles.
```
會動的部件：整隻脹大縮小（這張用網格脹）、小鰭和尾巴（擺）。刺要短、圓，不要尖銳嚇人。

**H4 — 劍魚**（聲納綠＋銀藍，橫向）
```
A cartoon swordfish swimming horizontally across the frame, silvery blue body
with a sonar-green (#5CFFB0) stripe, a long pointed bill to the right, a tall
sail fin on its back, a confident grin. Clean horizontal silhouette. Centred on
a deep sea-blue porthole plate (#0B1E3A) with a brass rim and a rivet in each
corner. Square 1:1, no text, no bubbles.
```
會動的部件：背鰭（扇）、尾巴（甩）。**尾巴和身體的接縫要清楚**。

### 2.2 特殊符號

**W — 章魚船長胸像（Wild）**
```
A chubby coral-red (#FF6F59) cartoon OCTOPUS sea captain seen from the chest up,
facing forward, filling the frame. A big round head with big expressive eyes
and a confident grin, a blue captain's hat with a gold-brass anchor badge and a
black visor, two ribbons fluttering from the back of the hat, a navy (#1F3D7A)
double-breasted captain's coat with brass buttons, two tentacles raised in front
like a boxer's fists. Funny and charming, not scary. Centred on a deep sea-blue
porthole plate (#0B1E3A) with a brass rim and a rivet in each corner.
Square 1:1, no text, no bubbles.
```
- **必須跟第 8 節的吉祥物是同一隻**：帽子、外套、臉都要對得上（W 是正面胸像，吉祥物是側面全身，帽徽和配色要一樣）
- 會動的部件：舉起的兩條觸手（揮拳）、帽子緞帶（飄）、眼睛（眨）

**S — 發光水母（Scatter）**
```
A cute round cartoon jellyfish glowing bright pink (#FF5FCF), a translucent bell
with a soft inner glow and a happy little face, six wavy tentacles hanging
below, a warm pink glow around it. This is the ONLY pink object in the whole set
and the brightest symbol on the board. Centred on a deep sea-blue porthole plate
(#0B1E3A) with a brass rim and a rivet in each corner. Square 1:1, no text, no
bubbles.
```
會動的部件：傘蓋（一收一放地游）、觸手（波浪擺）。觸手畫 5–6 條粗的就好。

**p.png — Hold & Spin 珍珠貝幣**
```
A thick round coin made of iridescent mother-of-pearl, seen straight on, a brass
rim with tiny scallop-shell notches, the flat centre left EMPTY and smooth (a
number will be printed there by the game). Transparent background, no plate.
Square 1:1, no text.
```
**不要用粉紅當主色**（粉紅是 Scatter 的）。中央一定要乾淨。

**x.png — Hold & Spin 空格**
```
An empty recessed sandy seabed tile, seen straight on, a shallow square hollow
in pale sand with a faint ripple pattern, very low contrast and calm.
Transparent background outside the tile. Square 1:1, no text.
```
它要**比珍珠貝幣暗很多**。

### 2.3 低分 L1–L5（A K Q J 10）

**五張一起生，只換字母**。
```
The single letter "A" carved deeply INTO a pale sandstone seabed tile (#E6DCC4),
almost colourless, with softly rounded corners and a thin darker edge. The letter
is a dark recessed carving (deep sea blue #0B1E3A), thick blocky rounded
sans-serif, with a clean unbroken outline; the upper edge of the carving catches
a bright highlight. A tiny coral-red seashell in the tile's top-left corner.
Maximum contrast between the dark letter and the pale tile. Any cracks belong to
the TILE only — the letterform itself must stay perfectly clean and unbroken.
Square 1:1, only the single character "A" and no other text.
```
把 `"A"` 換成 **K / Q / J / 10**，其餘一字不改。Q 加一句：
```
The tail of the "Q" must be long and clearly cross outside the bowl, so it can
never be mistaken for an O or D at small size.
```
L1=A、L2=K、L3=Q、L4=J、L5=10。**不要幫低分上顏色**（小貝殼是唯一的顏色）。中獎時字母會自己跳出來、空中左右轉一圈再落回，字母要是完整、邊緣清楚的深色形狀。

---

## 3. 背景（3 張）→ `octo_delivery/backgrounds/` ★ 重點

**背景要做動態，每張背景一定要有「容易做動態的物體或配件」**，畫成能拆出來單獨動的樣子。海底題材本來就很適合：海草、水母、魚群、潛艇零件都能動。

| 檔名 | 用途 | 場景 |
|---|---|---|
| `bg_base.png` | 主遊戲 | 陽光灑下的淺海海床，旁邊一艘半埋的老帆船 |
| `bg_feature.png` | 免費遊戲（Sonar Wheel） | 黃銅潛艇的駕駛艙內部，大舷窗看出去是深海 |
| `bg_holdandspin.png` | Hold & Spin | 深海珍珠洞窟，巨大的貝殼和發光海葵 |

### 3.1 構圖的硬性規格

- **16:9，至少 1920×1080**，直接生 16:9
- **畫面會被拉伸**：不要靠正圓撐構圖（**會旋轉的物件本身要畫成正圓**）
- **中央約 55% 寬 × 70% 高會被盤面蓋住**：細節放頂部和左右兩側
- **盤面下緣中央會有 Sonar Wheel 的半圓拱升起**，那一塊不要放亮的東西
- **第四版 bar**：左下角、右下角各約畫面寬 25% × 高 40% 被按鈕蓋住，**底部一整條約 12% 高被 BALANCE／WIN／BET 底板蓋住**。可動物件不要放在這些地方
- 右側會站章魚船長（盤面右邊），右側中段不要放最搶眼的物件
- 直式手機也用這張（左右會被裁），可動物件左右兩側都要有
- 沒有人物、沒有文字、**沒有泡泡**

### 3.2 可動物件要怎麼畫（每張背景 5–8 個）

| 類型 | 例子 | 畫法規定 |
|---|---|---|
| **擺動（根部固定）** | 海草、海帶、珊瑚扇、海葵觸手 | **根部要畫清楚、固定在岩石或沙上**，整株從根到尖一整條，**每株分開不要糾成一團**（水流會讓它們從根部搖） |
| **擺動（懸掛）** | 駕駛艙的吊燈、掛著的潛水頭盔、鐵鏈 | **懸掛點要畫出來**，在物件正上方，四周留空 |
| **旋轉** | 舵輪、儀表指針、螺旋槳、閥門手輪 | **正面看、畫成正圓**，軸心清楚；**指針另外一層**，錶面另一層 |
| **開合** | 寶箱蓋、巨大貝殼、舷窗蓋 | **鉸鏈畫清楚**，蓋子和本體接縫明顯；畫關著或半開的狀態 |
| **發光** | 發光海葵、聲納螢幕、駕駛艙燈 | 本體畫出來，**光暈不要畫**；螢幕畫成暗綠空螢幕，掃描線由程式畫 |
| **游動** | 魚群、水母、海龜、遠處的鯨魚剪影 | **另交透明小圖**（程式讓它游過畫面） |

**通用規則**
1. **每個物件完整、輪廓清楚**，不被擋住一半、不跟其他物件疊在一起
2. **物件跟背後的顏色分得開**（深藍海水前面放暖色珊瑚、黃銅；或亮色海草前面是暗岩石）
3. **物件背後要單純**（海水漸層、素色岩壁），物件拿掉後補得回來
4. 一張背景**大物件 2–3 個、小物件 3–5 個**
5. 動態很慢很小（循環 15 秒以上、擺幅 5° 以內，海草可以到 8°），物件不用畫很大，但要清楚

### 3.3 要交的分層（每張背景都要）

| 檔名 | 內容 |
|---|---|
| `bg_base.png` | 完整的一張 |
| `bg_base_far.png` | **拿掉所有可動物件後的乾淨背景**：岩石、沙地、海水延續畫完 |
| `bg_base_obj_<名稱>.png` | **每個可動物件一張**，透明背景、**1920×1080 整張畫布、物件留在原位**。例：`bg_base_obj_kelp_1.png`、`bg_base_obj_chest_lid.png` |
| `fish_school.png`、`fish_1.png`～`fish_3.png`、`turtle.png`、`whale_silhouette.png` | 共用的游動小圖：透明，512–1024px |

另附 `objects.txt`：每個物件的檔名、類型、根部／懸掛點／軸心位置。
> 生圖工具做不到分層：至少交完整那張＋`_far`，而且**兩張同構圖、同角度、同光**（用完整那張改出 `_far`）。

### 3.4 三張背景的物件清單與提示

**bg_base — 淺海海床＋老帆船**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 一叢海帶（4–5 株，根部在岩石上） | 擺動（根部） | 左側 |
| 一叢海草（3 株） | 擺動（根部） | 右側 |
| 半埋帆船上的破旗 | 擺動（懸掛在桅杆） | 右上 |
| 帆船的舵輪（正面） | 旋轉（慢慢晃） | 右側 |
| 沙地上的寶箱（蓋子另一層） | 開合 | 左側中段（避開按鈕區） |
| 珊瑚扇 ×2 | 擺動（根部） | 左右上方的岩石 |
| 魚群、海龜（共用小圖） | 游動 | 遠景 |

```
16:9 game BACKGROUND plate, no characters, no text, no bubbles. A bright shallow
seabed with soft sunlight beams from the surface: a clump of 4-5 tall kelp
strands on the left rooted in rocks (each strand separate, root to tip), a clump
of 3 sea-grass strands on the right, an old half-buried wooden sailing ship on
the right with a tattered flag on its mast and a ship's wheel seen face-on, a
treasure chest on the sand on the left with its lid clearly separate, two fan
corals on rocks at the upper left and upper right, sea teal water fading to deep
blue. Every object is complete, clearly separated from the others, with plain
water or rock behind it. The CENTRE is darker, calmer and less detailed (a slot
board will cover it); keep the bottom strip and the bottom-left and
bottom-right corners plain. No bubbles, no fish, no sparkles drawn. Painterly
casual game art, bright and friendly.
```

**bg_feature — 潛艇駕駛艙（FG）**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 大圓舷窗（**窗外深海另一層** `window`） | 發光＋游動（窗外） | 左側（不在正中） |
| 儀表板上 3 個圓錶（**指針另一層**） | 旋轉 | 左上 |
| 潛望鏡（從天花板下來） | 擺動（懸掛） | 右上 |
| 黃銅吊燈 | 擺動（懸掛） | 上方 |
| 舵輪（正面） | 旋轉 | 右側 |
| 綠色聲納螢幕（空的） | 發光 | 右側中段 |

```
16:9 game BACKGROUND plate, no characters, no text, no bubbles. Inside the
cockpit of a cosy brass submarine: a big round porthole window on the LEFT (not
behind the middle) looking out into deep blue sea, a dashboard with three round
gauges on the upper left seen face-on, a periscope hanging down from the ceiling
on the upper right, a brass lamp hanging on a chain from the ceiling, a ship's
wheel on the right seen face-on, an empty glowing-green sonar screen on the
right, riveted brass and navy panels. Warmer and more exciting than the seabed.
Every object is complete and clearly separated, with plain panelling behind it.
The CENTRE stays calmer and slightly darker (a slot board covers it); keep the
bottom strip and the bottom-left and bottom-right corners plain. No glows, no
sparkles, nothing drawn outside the porthole except plain deep water.
Painterly casual game art.
```

**bg_holdandspin — 深海珍珠洞窟**

| 物件 | 類型 | 位置建議 |
|---|---|---|
| 兩個巨大的硨磲貝（**上殼另一層**，鉸鏈清楚） | 開合 | 左右兩側 |
| 發光海葵 ×3 | 擺動（根部）＋發光 | 岩壁上 |
| 一堆一堆的珍珠貝幣 | 發光（反光閃） | 左右兩側 |
| 掛在洞頂的鐵鏈和舊燈籠 | 擺動（懸掛） | 頂部 |
| 水母、鯨魚剪影（共用小圖） | 游動 | 遠景 |

```
16:9 game BACKGROUND plate, no characters, no text, no bubbles. A deep-sea pearl
cave: two giant clams on the left and right sides (top shells clearly separate,
hinges visible), three glowing sea anemones rooted on the rock walls, piles of
mother-of-pearl coins, an old chain with a lantern hanging from the cave ceiling,
deep indigo water with a faint teal glow. Cooler and more mysterious than the
seabed, but friendly. Every object is complete and clearly separated, with plain
rock behind it. The CENTRE stays darker and calmer (a slot board covers it); keep
the bottom strip and the bottom-left and bottom-right corners plain. No glows,
no sparkles, no creatures drawn. Painterly casual game art.
```

---

## 4. 盤面框與 FG 牌 → `octo_delivery/frame/`

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `frame_edge.png` | 1280×1280，透明 | 盤面外框：**中間完全透明**，只有外框一圈 |
| `frame_bg.png` | 1280×1280 | 盤面底板：深海藍半透明，像隔著一層玻璃看，幾乎沒細節 |
| `fs_sign.png` | 1280×1000，透明 | FG 標題牌（字由程式寫） |
| `fs_counter_panel.png` | 1280×966，透明 | FG 局數面板（上方中央留小凹槽放圖示） |

```
A square slot-machine board frame, 1:1, a thick riveted brass submarine hull
frame with round bolts all the way around, a little coral and seaweed growing on
the bottom corners, a thin sonar-green indicator strip along the top edge. The
ENTIRE INSIDE of the frame is empty and fully transparent — only the border band
exists. Border thickness about 6% of the width. Transparent background, no text,
no bubbles.
```
- 下緣正中**留一塊約框寬 40% 的平整黃銅板**：Sonar Wheel 的小圓牌平常停在那裡
- 框是**靜止的**；**不要畫兩塊板疊在一起**

**fs_sign**：一整塊黃銅鉚釘牌，中間留空寫字。**fs_counter_panel**：同材質一整塊，上方中央一個小凹槽，透明背景，無字。

---

## 5. Sonar Wheel（FG 倍率輪盤）零件 → `octo_delivery/sonar_wheel/`

幾何、拆件、程式行為都跟 Mummy 的 Scarab Wheel 一樣，只換長相。

**幾何（以盤面寬 W＝1 計）**：拱的圓心在盤面下緣正中；外半徑 0.40W、內半徑 0.275W；中央圓牌半徑 0.20W；一次露出 7 格，每格約 25.7°。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `arch_base.png` | 1600×860，透明 | 半圓拱本體：黃銅聲納儀表外框（鉚釘、刻度），內側是暗綠聲納螢幕。**圓心在圖下緣正中**，外緣半徑 = 圖寬 0.5 |
| `tile_normal.png` | 360×300，透明 | 一格（給 2–10×），**扇形、尖端朝下**，暗綠螢幕格，中間留空寫數字 |
| `tile_hot.png` | 360×300，透明 | 同形狀，珊瑚紅（給 12–16×） |
| `tile_top.png` | 360×300，透明 | 同形狀，亮聲納綠＋黃銅邊（給 32×，最稀有） |
| `tile_result_glow.png` | 360×300，透明 | 停中那格的外光（柔和，不要星芒） |
| `plate.png` | 640×640，透明 | 中央倍數圓牌：黃銅舷窗（玻璃後面是深海），中間留空寫「×N」 |
| `plate_flash.png` | 800×800，透明 | 倍數更新時的聲納綠光環（柔和漸層環，像聲納波） |
| `pointer.png` | 180×240，透明 | 拱頂的固定指針：黃銅三角，尖端朝下、在圖下緣正中 |
| `button.png` | 420×420，透明 | 唯一的按鈕：紅色潛艇警報按鈕（待按） |
| `button_lit.png` | 420×420，透明 | 同一顆，亮起；構圖完全一樣 |
| `button_burst.png` | 600×600，透明 | 按下時的一張爆光圖（柔和的一圈聲納波，**不要光點、不要泡泡**） |

- 格子扇形的**左右兩邊沿半徑方向**，尖端角度 ≈ 25°；三種格子**形狀完全一樣**，只換顏色
- 按鈕上不要畫字；`plate.png` 縮小一半也要清楚

---

## 6. Abyss Wheel（稀有輪盤）零件 → `octo_delivery/abyss_wheel/`

拆層照東海龍王：盤面、外框、等級光、指針、中心蓋分開，數字由程式寫。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `disc_lv1.png`～`disc_lv4.png` | 1200×1200，透明 | 四級盤面：**12 個扇形、帶一點漩渦扭轉感、不畫數字**；第 0 格（正上方）和第 6 格（正下方）是特殊格 |
| `ring.png` | 1400×1400，透明 | 四級共用的外框：潛艇舷窗的黃銅大圈（一圈螺栓），中間挖空 |
| `ring_glow_lv1.png`～`lv4.png` | 1400×1400，透明 | 各級的外框光暈 |
| `needle.png` | 280×760，透明 | 魚叉形指針，**旋轉中心在圖的 (140, 620)**，尖端朝上 |
| `hub.png` | 320×320，透明 | 中心蓋：一個小舵輪 |
| `wedge_win.png` | 640×640，透明 | 停中那格的亮光（**白色**，形狀＝一格扇形，尖端在圖下緣正中） |
| `title.png` | 1200×300，透明 | 標題牌，**字畫在圖上：「ABYSS WHEEL」** |
| `levelup.png` | 1000×420，透明 | **字畫在圖上：「LEVEL UP!」**（這款的意思是「再往下潛」，字還是 LEVEL UP） |
| `rays.png` | 1920×1080 | 全螢幕背景：從上方海面往下灑的光束（程式慢慢晃） |

| 等級 | 深度 | 主色 | 第 0 格（上） | 第 6 格（下） |
|---|---|---|---|---|
| 1 | 淺海陽光層 | 湖水藍 `#3EC6E0` | LEVEL UP（深藍） | 最大值 30× |
| 2 | 暮光層 | 深藍 `#1F5FBF` | LEVEL UP（靛紫） | 90× |
| 3 | 午夜層 | 靛紫 `#4B2C9E` | LEVEL UP（螢光粉） | 200× |
| 4 | 深淵 | 螢光粉 `#FF5FCF`＋深藍 | 2000×（特殊色） | 3000×（最亮） |

- 其餘 10 格兩種深淺交錯；特殊格要有花紋或黃銅邊；LEVEL UP 格只畫底色＋往下的小箭頭（往深處潛）
- 四級構圖、格子角度完全一致，只換顏色

```
A flat circular wheel face seen straight on, divided into 12 equal wedge
segments with a gentle whirlpool twist, radiating from the centre, NO numbers
and NO text on it. Alternating light and dark lagoon-blue (#3EC6E0) wedges with
a subtle water-ripple texture and thin brass divider lines. The wedge pointing
straight UP is deep blue with a small downward arrow motif; the wedge pointing
straight DOWN is bright aqua with a brass border. Clean, readable, no clutter, no
bubbles. Transparent background outside the circle. Square 1:1.
```
等級 2–4 換表裡的顏色，其餘一字不改。`title.png`／`levelup.png` 字要拼對（A-B-Y-S-S W-H-E-E-L、L-E-V-E-L U-P），粗圓好笑的展示字，黃銅鉚釘字。

---

## 7. 大獎牌匾（5 張）→ `octo_delivery/banners/`

`big.png` BIG WIN、`superwin.png` SUPER WIN、`mega.png` MEGA WIN、`epic.png` EPIC WIN、`max.png` MAX WIN，各 1000×560 透明。
```
A horizontal riveted brass plaque, about 16:9, shaped a little like a submarine
nameplate, with rope trim around its edges, seaweed and a starfish clinging to
the corners, and the words "BIG WIN" in large chunky rounded letters. The lower
40% of the plaque is a plain EMPTY panel (the game prints the win amount there).
Transparent background, no bubbles. Only the words "BIG WIN", no other text.
```
- 等級越高越華麗：**湖水藍 → 海青 → 珊瑚紅 → 靛紫 → 螢光粉**（MAX 可以有章魚船長的觸手從牌子後面伸出來抓著）
- **一塊完整的板子**；字要拼對

---

## 8. 吉祥物：章魚船長（全身，**側面**）→ `octo_delivery/mascot/`

**人物是側面（使用者 11-08 確認）。** 骨架用 **spine-generator 的側面模板**（`spine-motion character`）：面向右的拳擊架式，6 個預設動作 idle、idle_weave、punch、hit、jump、celebrate。

- 模板規格全文：`E:\stake\spine-generator\docs\生圖交付規格.md`；**姿勢參考圖** `docs\pose-reference.png`，生整身圖時一定要附上
- 這款 Spine runtime 是 4.2：模板輸出 4.3，收件後我用 mascot-rig 的 `to42` 轉成 4.2
- **畫面向右**（模板規定）。人物站在盤面右邊，遊戲裡我會整隻水平翻轉讓他面向盤面，所以**身上不要有一定要朝某一邊才對的東西**（例如字、只在右邊的徽章）

### 8.1 要拆的圖層

**通用規則**
- 畫布 **1024×1536**，每個圖層都是**整張畫布的透明 PNG**，部件**留在原位**（疊起來就是完整角色）
- **腳底踩在 y = 1456 的地面線**，兩腳中點約在 x = 512
- 「前」＝靠近觀眾的那一側，「後」＝遠離觀眾的那一側
- 這隻沒有手腳，用**觸手**代替：兩條觸手當手臂（舉成拳擊架式）、兩條當腿（站在地上）、其餘四條是額外圖層
- **三條鐵律**（破圖幾乎都是違反這三條）：
  1. **被擋住的地方要畫完**（手臂擋住的胸口、頭擋住的部分）
  2. **關節兩邊要重疊**：觸手每一段的接頭端畫成圓頭、伸進上一段至少 40px
  3. **不要在關節處切平**
- 觸手**畫粗一點**，每段粗細變化平順，吸盤畫在觸手內側
- 先交一張完整全身圖（§8.4）確認造型，再照下表拆

**模板圖層（由後往前疊；檔名照模板，部位換成章魚的）**

| # | 檔名 | 章魚的哪個部位 | 必要 | 被擋住、要多畫的地方 |
|---|---|---|---|---|
| 1 | `hair_back.png` | 船長帽後面垂下的兩條緞帶（遠的那條） | 選用 | 緞帶根部多畫進帽子裡 |
| 2 | `arm_back_upper.png` | 後觸手（舉起當手臂）的上半段 | 必要 | 根部多畫進身體裡、彎曲處畫成圓頭 |
| 3 | `arm_back_lower.png` | 後觸手的下半段 | 必要 | 接頭端畫成圓頭，與上半段重疊 |
| 4 | `fist_back.png` | 後觸手的尖端（捲成一個拳頭似的圓捲） | 必要 | 和下半段重疊一段 |
| 5 | `leg_back_upper.png` | 後腿觸手的上半段 | 必要 | 根部多畫進外套下襬裡、彎曲處畫成圓頭 |
| 6 | `leg_back_lower.png` | 後腿觸手的下半段（尖端捲在地上當腳） | 必要 | 接頭端畫成圓頭，與上半段重疊 |
| 7 | `pelvis.png` | 外套下襬（觸手從這裡長出來） | 必要 | 上緣多畫進軀幹裡；四條觸手的根部畫滿 |
| 8 | `leg_front_upper.png` | 前腿觸手的上半段 | 必要 | 同後腿 |
| 9 | `leg_front_lower.png` | 前腿觸手的下半段（尖端捲在地上） | 必要 | 同後腿 |
| 10 | `neck.png` | （章魚沒有脖子，**不用交**） | 不交 | — |
| 11 | `torso.png` | 海軍藍雙排扣船長外套（身體） | 必要 | 被觸手擋住的胸口、側面全部畫完 |
| 12 | `head.png` | 圓滾滾的章魚頭＋臉＋船長帽 | 必要 | 沒有脖子層：**頭下緣多畫一段伸進外套領口** |
| 13 | `hair_front.png` | 帽子後面垂下的另一條緞帶（近的那條） | 選用 | 緞帶根部多畫進帽子裡 |
| 14 | `arm_front_upper.png` | 前觸手（舉起當手臂）的上半段 | 必要 | 同後觸手 |
| 15 | `arm_front_lower.png` | 前觸手的下半段 | 必要 | 同後觸手 |
| 16 | `fist_front.png` | 前觸手的尖端（捲成拳頭） | 必要 | 同後觸手 |

**額外圖層（不在模板裡，收件後我另外掛上去加水流擺動）**

| 檔名 | 部位 | 疊在哪裡 | 要畫什麼 |
|---|---|---|---|
| `tentacle_extra_1.png`～`tentacle_extra_4.png` | 其餘四條觸手 | 全部在身體**最後面**（第 1 層之前） | 從外套下襬後面伸出、自然彎曲垂在身後，**每條分開、不要互相交疊**；根部多畫進下襬後面 |
| `ink_puff.png`（選用） | 一團墨汁 | 不疊（另外播放） | 一團圓圓的黑紫色墨雲（被打到時噴出來，好笑用） |

**換圖用的頭（表情，共 3 張）**

| 檔名 | 換掉哪一層 | 內容 | 什麼時候用 |
|---|---|---|---|
| `head_blink.png` | `head` | 眼睛閉上 | 眨眼 |
| `head_laugh.png` | `head` | 張大嘴得意大笑 | 中獎、慶祝 |
| `head_hit.png` | `head` | 眼睛變成兩個漩渦、嘴巴歪掉 | 被打到（hit 動作）、輪盤停在小倍數 |

三張換圖頭和 `head.png` 的**外輪廓、帽子位置要一模一樣**，只換眼睛和嘴。

**疊圖順序**：額外觸手在最後面，所以要附 `layers.json`：
```json
{ "order": ["tentacle_extra_1.png", "tentacle_extra_2.png", "tentacle_extra_3.png", "tentacle_extra_4.png",
  "hair_back.png", "arm_back_upper.png", "arm_back_lower.png", "fist_back.png",
  "leg_back_upper.png", "leg_back_lower.png", "pelvis.png", "leg_front_upper.png", "leg_front_lower.png",
  "torso.png", "head.png", "hair_front.png", "arm_front_upper.png", "arm_front_lower.png", "fist_front.png"] }
```

**關節點**：工作室會從圖層自動猜 19 個關節，猜不準我再拖；有空的話照模板的關節表（`生圖交付規格.md` 的「關節位置」）標一份 `joints.json` 更快。觸手的「肘、膝」就是觸手中間彎曲的地方，「腕、踝」是尖端捲起來的地方。

**交件資料夾長這樣**

```
octo_delivery/mascot/
  full_body.png                                   （§8.4 完整全身圖）
  hair_back.png hair_front.png                    （帽子緞帶，選用）
  arm_back_upper.png arm_back_lower.png fist_back.png
  leg_back_upper.png leg_back_lower.png pelvis.png
  leg_front_upper.png leg_front_lower.png torso.png head.png
  arm_front_upper.png arm_front_lower.png fist_front.png   （模板必要 13 張）
  tentacle_extra_1.png ~ tentacle_extra_4.png     （額外觸手 4 張）
  ink_puff.png                                    （選用）
  head_blink.png head_laugh.png head_hit.png      （換圖 3 張）
  layers.json  joints.json（選用）
```

### 8.2 姿勢與比例

1. **全身、側面偏 3/4，面向畫面右方**，拳擊架式：前觸手捲成拳頭在下巴高度往前伸，後觸手護在臉頰旁，兩條手臂觸手在中間彎約 90°
2. 兩條腿觸手站穩、中間微彎，尖端捲在地上（像腳），兩腿之間留空隙
3. 其餘四條觸手垂在身後，不要擋到前面的手腳
4. **觸手之間要分得開**：舉起的觸手不要整條貼在身體上
5. 全身在畫面內（含帽子和緞帶），角色水平置中
6. 比例照模板參考圖；頭可以比人類大（章魚頭大很可愛），但**頭不要寬過身體 1.5 倍**，不然揮拳時會撞到自己的頭

### 8.3 交件後我怎麼做

1. 用 spine-generator 工作室（或 `spine-motion character` 指令）「從圖層建立角色」，對 19 個關節，建立骨架
2. 跑 6 個預設動作，看流暢度分數和**接縫檢查**（每一幀關節沒露底才算過）；有紅圈就請你補那個關節的圖層
3. 額外觸手、緞帶、墨汁另外掛上去，加水流擺動
4. 轉 4.2、翻轉成面向盤面、接進遊戲

### 8.4 生圖提示（完整的一張，附上姿勢參考圖）
```
Draw a chubby coral-red (#FF6F59) cartoon OCTOPUS sea captain, same character as
the Wild symbol: a big round head with big expressive eyes and a confident grin,
a blue captain's hat with a brass anchor badge and a black visor, two ribbons
hanging from the back of the hat, a navy (#1F3D7A) double-breasted captain's coat
with brass buttons. Painterly casual game art, bold readable shapes, soft cel
shading.
Requirements:
- Full body, side view turned slightly toward the viewer (3/4), facing RIGHT, in
  a boxing guard: the front tentacle curled into a fist-like coil held forward at
  chin height, the rear tentacle guarding the cheek, both "arm" tentacles bent
  about 90 degrees in the middle.
- Two tentacles act as legs, planted on the ground with their tips curled like
  feet, slightly bent, a gap between them. The other four tentacles hang behind
  the body, each one separate, not crossing the front limbs.
- Tentacles are thick and smooth with suckers on the inner side.
- Soles about 5% above the bottom edge, character centered horizontally.
- Canvas 1024x1536 (portrait 2:3), fully transparent background, no ground
  shadow, no effects, no bubbles, no text.
- Match the pose and proportions of the attached reference image.
```
拆層時照模板文件的「提示詞 B」一張一張拆，把部位換成上表的章魚部位。

---

## 9. 商店縮圖 → `octo_delivery/thumbnail/`

| 檔名 | 規格 |
|---|---|
| `thumb_bg.png` | 1024×1024，**不透明** |
| `thumb_fg.png` | 1024×1024，**真正的透明背景** |
| `cover_16x9_bg.png` | 1920×1080，不透明 |
| `cover_16x9_fg.png` | 1920×1080，透明 |

- **FG 只放主角**（章魚船長擺拳擊架式，或從潛艇艙口探出來），**不要放遊戲名稱、字、Logo**
- **BG 用明亮的淺海**（陽光光束、亮湖水藍、黃銅潛艇大色塊），不要用深海暗藍，200px 會變一塊黑
- 量化門檻（縮到 200×200 量）：平均亮度 ≥ 80、最暗 10% ≥ 35、低於 32 的像素 ≤ 30%
- 封面另存一份到 `E:/stake/wp/CaptainOcto/封面圖/`（去背人物＋背景兩張，同光向同色調，不覆蓋舊版）

---

## 10. UI → `octo_delivery/ui/`

第四版 bar（Katana Kash 編排）按鈕、底板、讀數都由程式畫，**不用交圖**。要交的：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `buy_icon.png` | 512×512，透明 | 左下黃色買入方塊的圖示：**黑色單色、粗線**，**不能用閃電**（Turbo 已是閃電）；建議船錨或潛艇剪影（目前程式畫的是船錨）。不能用參考廠商的標誌 |
| `buy_art_bonus.jpg` | 800×450 | FG 卡片場景（潛艇駕駛艙、聲納亮起） |
| `buy_art_holdandspin.jpg` | 800×450 | H&S 卡片場景（巨大貝殼打開、湧出珍珠貝幣） |
| `buy_hero_bonus.png` | 512×512，透明 | FG 卡片主角物件：紅色警報按鈕 |
| `buy_hero_holdandspin.png` | 512×512，透明 | H&S 卡片主角物件：一疊珍珠貝幣 |
| `buy_art_sonar.jpg` | 800×450 | 激活卡片 SONAR SPIN／SONAR SURE WIN 共用場景 |
| `buy_art_abyss.jpg` | 800×450 | 激活卡片 ABYSS BOOST 場景（往深海漩渦潛下去） |
| `buy_hero_sonar5.png` `buy_hero_sonar10.png` `buy_hero_abyss.png` | 512×512，透明 | 三張激活卡片主角物件：一圈／兩圈聲納波、發光漩渦 |

所有場景圖**沒有文字**、16:9。

---

## 11. 轉場（FG 進場／離場）→ `octo_delivery/transition/`

改成**黃銅潛艇從畫面前方游過、一大團墨汁噴開蓋住畫面**：

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `submarine.png` | 1600×800，透明 | 黃銅潛艇側面（面向右），程式讓它從左游到右 |
| `ink_cloud.png` | 2048×2048，透明 | 一大團墨汁雲（深紫黑、邊緣是柔軟的圓團），程式放大蓋滿畫面 |

**要做到的事**：潛艇游過，船尾噴出一大團墨汁，約 0.5 秒內把畫面完全蓋住，那一刻換場景，再 0.5 秒墨汁散開。墨汁邊緣要是**大的圓團**（不是一堆小點）。

---

## 12. 字型

| 用途 | 建議 | 備註 |
|---|---|---|
| 標題、牌匾、輪盤數字、FG 局數 | **Lilita One**（粗圓、好笑；從 Mummy 繼承） | `×` 用字母 `X` 代替 |
| 下注列 | Nunito（第四版 bar 規定） | 不換 |
| 規則頁、付費表內文 | 系統無襯線 | 不變 |

---

## 13. 交件清單

```
octo_delivery/
  symbols/       h1 h2 h3 h4 w s l1 l2 l3 l4 l5 p x                          (13)
  backgrounds/   bg_base bg_feature bg_holdandspin ＋各自 _far ＋每物件 _obj_
                 ＋ bg_feature_window ＋ 游動小圖（魚群/魚/海龜/鯨魚）＋ objects.txt
  frame/         frame_edge frame_bg fs_sign fs_counter_panel                 (4)
  sonar_wheel/   arch_base tile_normal tile_hot tile_top tile_result_glow
                 plate plate_flash pointer button button_lit button_burst    (11)
  abyss_wheel/   disc_lv1-4 ring ring_glow_lv1-4 needle hub wedge_win
                 title levelup rays                                          (16)
  banners/       big superwin mega epic max                                   (5)
  mascot/        §8.1 模板 13 張（＋選用緞帶 2 張）＋額外觸手 4 張＋換圖頭 3 張
                 ＋full_body ＋layers.json
  thumbnail/     thumb_bg thumb_fg cover_16x9_bg cover_16x9_fg                (4)
  ui/            buy_icon ＋購買卡 9 張                                       (10)
  title/         logo_wordmark logo_wordmark_small                            (2)
  transition/    submarine ink_cloud                                          (2)
```

**建議交件順序**：符號 → 吉祥物（先交全身圖確認造型，再拆層）→ **背景（含分層）** → 兩個輪盤 → 框 → UI／牌匾／字標 → 轉場 → 縮圖。

### 交件前自己檢查

- [ ] 13 張符號縮到 120px 排一列，每張都認得出來；深藍底上主體夠亮
- [ ] 轉灰階看，高分比低分**彩度高**、低分的字**清楚**
- [ ] 除了 S 和深淵輪第 4 級，沒有任何東西是粉紅當主色
- [ ] W、吉祥物、縮圖上的章魚是同一隻（帽子、外套、臉一致）
- [ ] 吉祥物：面向右、拳擊架式、觸手粗而分開、關節端圓頭重疊、全身在畫面內、`layers.json` 有附
- [ ] **每張背景有 5–8 個可動物件**，完整、沒被擋住、跟背景分得開；海草根部清楚、每株分開；旋轉的是正圓
- [ ] **`_far` 乾淨背景跟完整那張同構圖**
- [ ] 背景底部一條、左下、右下角沒有可動物件
- [ ] 圖上沒有泡泡、光點；沒有骷髏、怪物張大嘴
- [ ] 所有畫在圖上的字拼對了；透明的那幾張真的是透明

### 我這邊收到後會量的（不用你做）

- 每個高分符號中央 60% 平均亮度 ≥ 70；低分亮區覆蓋率 ≤ 高分最低值
- 背景各物件的根部／軸心、`_far` 和完整圖的差異
- 縮圖三項亮度門檻
- 吉祥物：spine-generator 的流暢度分數、每個動作的接縫檢查（每一幀關節都沒露底）、轉 4.2 後重播誤差

---

## 14. 讀取頁標題字標（每款各自的設計方向）→ `octo_delivery/title/`

讀取頁的遊戲名稱**不再用程式字拼兩色**（前幾款都長一樣），每款畫一個自己風格的字標。字標到之前，程式先用本款配色的文字頂著。

| 檔名 | 尺寸 | 說明 |
|---|---|---|
| `logo_wordmark.png` | 1600×700，**透明** | 讀取頁大標題，字畫在圖上 |
| `logo_wordmark_small.png` | 800×350，透明 | 同一個設計的簡化版，給手機直式和左上角遊戲名 |

**共同規則**
- 字一定要拼對（C-A-P-T-A-I-N O-C-T-O），生完逐字核對
- **小尺寸要讀得出來**：縮到 400px 寬還要一眼認出每個字母；裝飾不能蓋過字母本身
- 字標是**一整塊**，透明背景，外圍留約 5% 空白
- 不要畫星星、光點、泡泡
- 主體字母和裝飾分得開（字母之後可能會做進場動畫）

**這款的設計方向：航海冒險**
- **CAPTAIN** 小一號、做成**黃銅鉚釘名牌**上的沖壓字，像潛艇的船名牌
- **OCTO** 大字，珊瑚紅、圓胖的字形，外圈深海藍粗描邊
- OCTO 的兩個「O」做成**潛艇舷窗**（黃銅圈＋玻璃，玻璃後面是藍色海水）
- 一條**觸手**從字的後面伸出來，捲住「C」
- 字標下緣掛一小段**粗麻繩**當底線
- 整體微微像在水裡浮著（輕微的波浪弧），但**每個字母都要正、讀得清楚**

```
A game title wordmark logo reading "CAPTAIN OCTO" on a transparent background.
"CAPTAIN" in smaller stamped letters on a riveted brass nameplate like a
submarine's name badge; "OCTO" in big chunky rounded coral-red (#FF6F59) letters
with a thick deep sea-blue (#0B1E3A) outline, both "O" letters drawn as brass
submarine portholes with blue water behind the glass, one coral-red tentacle
reaching out from behind the word and curling around the "C", a short length of
thick rope along the bottom as an underline, the whole word sitting on a gentle
wave curve but every letter upright and readable. Fun nautical adventure, no
bubbles, no sparkles. Only the words "CAPTAIN OCTO".
```
