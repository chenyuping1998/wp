# Go Bananubis — 符號美術規格與提示詞

> **狀態（2026-09-07）**：這份文件之前是 **GoBananasDelta 的逐字複本**——叢林軍事主題、
> 鋼盔、鳳梨手榴彈、指北針。那是另一款遊戲的規格。這一版是 Go Bananubis 自己的。
>
> 目前盤上跑的還是 Delta 那套圖（`static/assets/sprites/goBananasSymbolsV3/`）。
> 吉祥物已經換成阿努比斯大猩猩，神秘獎圖石板已經上線（暫時是向量畫的），
> 但**背景、盤面框和 UI 底色都還是叢林綠**——見第 7 節。

全套重生用。這份文件是**唯一的真實來源**：照著做，產出的圖丟進
`design/source/gen2_symbols/`，然後跑

```bash
node design/generate_symbols_gen2.mjs "E:/stake/tools/gen"
```

腳本會自動補正方形、縮到 256、銳化、產 spine，並在結尾列出還缺哪些。
**只要那份清單非空就不要出貨。**

---

## 1. 交付格式

| 項目 | 規格 |
|---|---|
| 尺寸 | **1024×1024**（最低 512×512）。遊戲內是 256×256，來源大才有銳利度餘裕 |
| 長寬比 | **正方形**。非正方會被補邊，邊框粗細就不一致了 |
| 格式 | PNG，不透明（整塊底板，不留透明區）。例外：`cudgel` 是透明去背道具 |
| 命名 | 全小寫、無空格，見第 4 節表格 |
| 色彩空間 | sRGB |

> **出聯絡表的話請讓每一格等高。** 上一批三列分別是 381 / 355 / 322px 高，管線只能把
> 每張非等比壓成 256×256，結果第一列被壓扁的幅度比第三列多約 15%，主體會矮胖。
> 等高就是純等比縮放、零變形。

---

## 2. 顏色系統（**本文件最重要的一節**）

老虎機符號的辨識度不是「好不好看」，是**玩家在 0.3 秒的滾停瞬間能不能分辨這格是什麼**。
規則只有一條：**同一階層共用一種調性，不同階層之間必須用顏色一眼分開。**

### 2.1 這個主題特有的難題：金色只能有一個

埃及題材的預設反應是「全部鍍金」。**這裡不行。** Scatter 必須是全盤唯一的金色，
它是玩家在等的東西。金色一旦散出去，等 scatter 的那 0.3 秒就沒有著力點。

所以：**金只當作所有符號的鑲邊與底板斜角**（統一的、低調的、暗的），
**只有 `s` 可以有大面積、高飽和、會反光的金**。

同理，**砂岩米色只屬於 `m`**（封印石板）。石板是盤面上的一個洞，它必須看起來像
別的東西蓋住了那一格——盤上唯一的淺色石頭就是這個作用。

### 2.2 階層與配色

| 階層 | 符號 | 主色 | 明度 | 為什麼 |
|---|---|---|---|---|
| Wild | `w` | 毛色棕＋深藍金頭巾 | 暗 | 全盤唯一有臉的，形狀已經夠獨特 |
| Scatter | `s` | **高飽和金屬金** | 最亮 | 全盤最亮的一張。玩家在等的就是它 |
| 神秘 | `m` | **砂岩米色**＋黑曜石封蠟 | 亮，但無彩 | 全盤唯一的淺色石頭。中央一顆大黑點是它的識別記號 |
| 高賠 1 | `h1` | **紅玉髓紅** | 中暗 | 最高賠＝最搶眼的顏色 |
| 高賠 2 | `h2` | **青金石深藍** | **暗** | |
| 高賠 3 | `h3` | **孔雀石綠**＋自然黃 | 中 | |
| 高賠 4 | `h4` | **淡綠松石** | **亮** | |
| 低賠 | `l1`–`l5` | **無彩灰花崗岩**（全部一樣） | 中 | 它們是背景噪音，不該搶戲。靠**字形**分辨，不靠顏色 |

四個高賠是**紅／深藍／綠／淺青**，色相繞一圈、明度拉開。`h2` 和 `h4` 是這組裡最危險的
一對（藍與青綠相鄰），所以**用明度分開**：`h2` 是深到接近黑的青金石，`h4` 是粉粉的、
接近白的釉面淺青。縮到 64px 也不會混。

### 2.3 三個必須避開的撞色（前一批真的撞到了）

- **`h1` 不可以是綠的。** Delta 的規格白紙黑字寫「h1 改走紅」，交付出來還是綠鋼盔配一顆
  紅星——綠色面積遠大於紅色，滾動時和 `h2` 的綠手榴彈分不出來。**紅色要佔主導，
  不是當點綴。** 紅玉髓聖甲蟲的甲殼本身就是紅的，這是這次選它的原因之一。
- **`h4` 不可以是黃銅／金色。** 會撞 scatter。釉面淺青，金屬部分壓成暗鋼。
- **`h3` 的香蕉不可以是金屬金。** `s` 是金屬金＋緞帶，`h3` 是自然、霧面的熟香蕉黃，
  而且**綠色櫃體要佔畫面主導**，香蕉只是露出來的一角。

### 2.4 硬性對比規則

顏色分得開還不夠，**明度也要分得開**——約 8% 的男性有色覺辨識障礙，只靠色相會失效。

- 主體與底板的**平均明度差 ≥ 30%**
- **瞇眼測試**：縮到 64px 再瞇眼，如果兩張高賠的色塊分佈長得像，就是失敗
- `l1`–`l5` 之間不需要明度差（它們本來就該長得像），但**每個字形的外輪廓要夠不同**

---

## 3. 底板、打光與質感（所有符號共用）

底板是把 25 格串成一面牆的東西，**必須高度一致**，否則盤面會看起來破碎。

- **深色玄武岩／花崗岩**，不是砂岩。取樣色 `#2b2f33`–`#3d4247`，帶細顆粒與磨損
  - 為什麼是深色：`m` 的砂岩石板要能從盤面上跳出來，`s` 的金要能發亮。
    淺色砂岩底板會讓這兩張最重要的符號淹掉。
  - 也為什麼是中性灰：第 7 節說明現在的背景是叢林綠、之後會換沙漠——
    中性深色是唯一兩邊都成立的選擇
- 四角各一顆**方形銅釘**（不是圓鉚釘——這是和 Delta 拉開距離的地方），邊緣一圈內凹陰影
- **邊框粗細所有符號一致**（盤面不畫格線，符號的邊框就是格線）
- **階層附加線索**：`h1`–`h4` 和 `w`/`s`/`m` 的底板加一圈**暗金內斜角**；
  `l1`–`l5` 維持素石。這讓玩家不靠顏色也能分出高低賠
- 左上主光源，右下陰影，全套一致
- 整體偏暗、風化的石造感；**只有主體的識別色可以高飽和**
- 石材崩角、砂塵、刻痕磨損。避免乾淨塑膠感、卡通描邊、外發光
- 主體置中，佔畫面約 **70%**，不要頂到邊框
- **畫面上不可出現任何金額或博弈字眼**（Stake social 限制字，見 `design/check_social_words.mjs`）。
  象形文字沒問題，因為它不是可讀的英文；但不要寫阿拉伯數字

### 3.1 共用提示詞前綴

每一張都用這段開頭，只換主體：

```
Slot machine symbol icon, single object centred on a square riveted stone plate,
ancient Egyptian theme. Dark basalt backplate (#2b2f33 to #3d4247), fine grain,
weathered chipped corners, one square bronze stud at each corner, thin dark-gold
inner bevel, recessed shadow around the inner edge. Painted semi-realistic game
art, rich but desaturated palette, key light from upper left, shadow lower right.
Subject fills about 70% of the frame and does not touch the border. Opaque square
1024x1024, no transparency, no text, no numbers, no outer glow, no cartoon
outline, no drop shadow outside the plate.
```

低賠五張把 `thin dark-gold inner bevel` 換成 `no gold bevel, plain stone edge`。

---

## 4. 完整檔案清單與提示詞

### 4.1 你要畫的（12 張）

---

#### `w.png` — Wild：阿努比斯大猩猩頭像

**你說你會用那張人物的臉去做，所以這張不用從零生。** 要注意的是**構圖**：

- 從 `design/source/anubis/` 的 `head_1_face` + `head_3_hair` + `head_0_ear` +
  `head_4_decoration`（聖蛇）合成，或直接從 `_compare.png` 裁頭
- **裁到下巴以下一點就好，不要把整片項圈帶進來。** 人物的 usekh 項圈是青金石藍＋
  綠松石，那正好是 `h2` 和 `h4` 的顏色。項圈在畫面裡佔太大，遠看會變成一塊藍綠色塊，
  和那兩張高賠打架。**留一線項圈當領口即可**
- 嘴上叼的金香蕉**保留**（人物 psd 的 `head_5_decoration`），它是這個 IP 的記號。
  它是金的，但面積小、而且被臉包住，不會和 scatter 混
- 頭巾的深色是這張的主調——`w` 應該是盤上**最暗**的一張，和最亮的 `s` 成對

```
Use the attached character face. Crop tight to the head: jackal-eared nemes
headdress, gold browband with cobra uraeus, gorilla face, gold banana held in the
mouth. Include only a sliver of the beaded collar at the very bottom edge — do not
show the broad collar. Place it on the shared dark basalt plate with the dark-gold
inner bevel. Keep the headdress dark; this should be the darkest symbol in the set.
```

---

#### `s.png` — Scatter：金香蕉串＋青金石緞帶

**全盤最亮、最飽和、唯一的大面積金。**

- Delta 用紅緞帶；這裡改成**青金石藍緞帶**。紅色在這套裡屬於 `h1`，
  scatter 不可以帶紅
- 金屬金：會反光、有高光稜線，不是霧面黃
- 香蕉串本身的**新月群集輪廓**是它的第二層識別

```
A bunch of five polished golden bananas, high-saturation reflective metallic gold
with crisp specular highlights, bound at the stem with a deep lapis-blue silk
ribbon tied in a bow, tiny gold end-caps on the ribbon. The brightest and most
saturated object in the whole symbol set. On the shared dark basalt plate with the
dark-gold inner bevel.
```

---

#### `m.png` — 神秘獎圖：封印石板

**新符號，Delta 沒有這張。這是遊戲的名字所指的東西。**

- 目前是 `src/game/tabletArt.ts` 程序化畫的向量佔位圖。真圖進來要**對齊那個構圖**，
  否則翻牌動畫會對不上——見下面的 4.3
- 它必須看起來像**蓋住那一格的東西**，不是一個符號。所以：**填滿整格、平的、
  正面、對稱**，不要有透視或斜擺
- **中央一顆黑曜石封蠟是它的識別記號**，遠看是一個大黑點。全盤沒有第二個東西
  在正中央有黑點
- 砂岩米色只屬於它

```
A flat sandstone slab filling the whole plate, sun-bleached pale limestone
(#c9b48c), a recessed carved inner panel one step darker (#b09a72) with a thin
gilt border, and a single round obsidian wax seal struck dead centre, rimmed in
gold, with an almond jackal eye of lapis lazuli inlaid into the wax. Two hairline
scratches across the stone. Matte, chalky, no metallic sheen. Perfectly frontal
and symmetrical, no perspective. The seal is the focal point and reads as a large
dark dot from a distance.
```

---

#### `h1.png` — 最高賠：紅玉髓聖甲蟲　🔴 **紅**

Delta 的 `h1` 是「頭盔」——可穿戴、上寬下窄。這裡**不能**沿用頭部造型，因為 `w`
已經是一顆戴頭巾的頭，兩顆頭在 64px 會撞。改用**橢圓甲蟲**：全盤唯一的蟲形輪廓。

- **紅色必須佔主導**，這是上一批最大的失誤（見 2.3）
- 金只在甲殼縫線與腳的邊緣，細細一條

```
A carved carnelian scarab beetle amulet, deep translucent blood-orange red stone
(#a8321f to #d94f2b) polished smooth, wing cases closed with a fine incised seam,
six stylised legs tucked under, thin dark-gold outlines along the seams and leg
edges only. The red stone dominates the silhouette; gold is a hairline accent, not
a surface. On the shared dark basalt plate with the dark-gold inner bevel.
```

---

#### `h2.png` — 高賠 2：荷魯斯之眼護符　🔵 **深青金石藍**

- **這是四張高賠裡最暗的一張**，用明度和 `h4` 拉開
- 眼線用黑曜石黑，不要用金——金線會讓它變亮，就靠近 `h4` 了

```
A wedjat Eye of Horus amulet carved from deep lapis lazuli, dark saturated navy
blue (#1f3a6e to #2a4f8f) with faint natural gold-pyrite flecks in the stone, the
brow, teardrop and curled tail lines inlaid in matte obsidian black. Dark and
heavy in value — the darkest of the four high-pay symbols. On the shared dark
basalt plate with the dark-gold inner bevel.
```

---

#### `h3.png` — 高賠 3：供奉櫃＋熟香蕉　🟢 **孔雀石綠＋自然黃**

沿用 Delta `h3` 的形狀類別（半開的容器，露出香蕉），主題換掉。

- **綠色櫃體要佔主導**，香蕉只露一角
- 香蕉是**霧面自然黃**，不是金屬金——這是和 `s` 分開的關鍵
- 櫃身可以有象形文字浮雕，**但不要有任何阿拉伯數字或英文字**

```
An ancient Egyptian offering chest, lid tilted half open, body panelled in
malachite green (#1f6b4a to #35a06d) with dark-gold banding and small carved
hieroglyph reliefs on the front panel, short lotus-carved legs. A few ripe
bananas in matte natural yellow spill out of the opening — soft, non-metallic,
clearly fruit rather than gold. The green chest dominates the frame; the bananas
are a corner accent. No lettering or digits anywhere. On the shared dark basalt
plate with the dark-gold inner bevel.
```

---

#### `h4.png` — 高賠 4：綠松石釉安卡　🩵 **淡綠松石**

- **這是四張高賠裡最亮的一張**
- 金屬部分壓成暗鋼，**絕對不要黃銅或金**（會撞 scatter）

```
An ankh amulet in pale turquoise Egyptian faience, chalky glazed ceramic in light
desaturated cyan (#7fd4cf to #b8ece8) with fine crackle glaze and darker turquoise
settling in the recesses, a narrow dark-steel band at the base of the loop. Light
and airy in value — the brightest of the four high-pay symbols. No brass, no gold
on the object itself. On the shared dark basalt plate with the dark-gold inner
bevel.
```

---

#### `l1.png` – `l5.png` — 低賠：A / K / Q / J / 10　⚫ 無彩

五張同一套風化花崗岩刻字，壓在**素石底板**（無金斜角）上。

- **無彩**。任何色偏都會讓它們往高賠靠
- 字形用埃及風的方硬襯線，但**必須是清楚可讀的拉丁字母**，不要做成象形文字
- 五張的外輪廓差異就是它們的全部辨識度，所以字要撐滿、筆畫要粗

```
The letter "A" carved in weathered grey granite, chiselled square-serif letterform
with squared terminals, deep carved bevels catching the upper-left light, chipped
edges, dust in the recesses. Completely achromatic — cool grey stone, no colour
cast at all. On the shared dark basalt plate, plain stone edge, NO gold bevel. The
letter fills most of the plate with thick strokes.
```

> 其餘四張把 `"A"` 換成 `"K"` / `"Q"` / `"J"` / `"10"`。
> **低賠順序是 A > K > Q > J > 10**，賠付表就是照這個順序遞減的。
> 檔名和字必須照這個順序對應（`l1`=A … `l5`=10），弄反了高賠的字會排在低賠位置。
> 上一批就把 J 標成 l3、10 標成 l4，並且整批漏掉 Q。

---

### 4.2 腳本程序化生成的（你不用畫）

| 檔名 | 內容 |
|---|---|
| `p.png` | Superspin 金幣獎項符號 |
| `x.png` | Superspin 空格底板 |
| `w_fg.png` | Wild 中獎特寫卡（從你的 `w.png` 裁切放大） |
| `cudgel.png` | Wild 中獎動畫揮舞的金香蕉道具（**透明背景**，非石板） |
| `wx.png` | 整輪 WILD 直立面板，**256×1280** |

**這幾張想自己畫也可以** —— 只要在 `design/source/gen2_symbols/` 放同名檔案，
腳本就會優先用你的。`wx.png` 要自己畫請直接出 1:5 直幅。

> **建議至少補 `p` 和 `x`。** 程序化的底板明顯比手繪的扁平，質感對不上。
> 兩張都用**素石**底板（同 `l` 系列）：`p` = 金幣獎項、`x` = 空格死板。
> `p` 是這套裡第二個可以用大面積金的地方——但它只出現在 superspin 的獨立盤面上，
> 那個盤面沒有 scatter，所以不衝突。

### 4.3 石板碎片（如果你要畫 `m`，這兩張也要一起給）

翻牌動畫是把石板**沿一條裂縫裂成兩半往下掉**，兩半目前是
`src/game/tabletArt.ts` 的 `drawTabletShard()` 用向量畫的。

**如果 `m.png` 換成手繪圖但碎片還是向量，裂開的瞬間會從一塊畫出來的石板噴出兩塊
畫風不同的碎片。** 兩個選項，二選一：

- **A（推薦，省事）**：`m.png` 就照 `tabletArt.ts` 的構圖畫，碎片繼續用向量。
  向量碎片只出現 0.3 秒而且在動，畫風差一點看不太出來
- **B（完整）**：另外交 `m_shard_l.png` / `m_shard_r.png`，兩張沿**同一條裂縫剖面**
  切開（一個是另一個的鏡射），合起來要嚴絲合縫。裂口是**生石茬**、沒有鎏金邊，
  外緣才有——那個對比就是「剛裂開」的說服力來源

---

## 5. 交付前自檢

1. 12 張都是正方、≥512px、不透明
2. `h1` 是**紅色主導**（不是綠的配一點紅）、`h4` 是淺青（不是金的、不是黃銅的）
3. `h2` 明顯比 `h4` 暗——把兩張並排轉灰階確認
4. `s` 是全盤唯一的大面積高飽和金；`m` 是全盤唯一的砂岩淺色
5. `l1`–`l5` 是 A / K / Q / J / 10，順序沒錯，五張都**完全無彩**
6. `w` 沒有把整片項圈帶進來
7. 全部縮到 64px 排成一排，**每一張都能認出來**
8. 畫面上沒有任何阿拉伯數字或英文單字（象形文字可以）
9. 邊框粗細目視一致，銅釘都在四角

跑完 `generate_symbols_gen2.mjs` 後，結尾不該再出現 `!! STILL ON GEN-1 ART`。

---

## 6. `m` 進來之後要動的程式（目前是佔位）

石板是新符號，管線還沒有它的位置。真圖交付後這三處要改：

1. `design/generate_symbols_gen2.mjs:238` — `REQUIRED` 陣列加上 `'m'`
2. `src/game/assets.ts` — 新增 `gbM` 條目指向 `goBananasSymbolsV3/m.png`
   （順序上要先有檔案，否則 `check_assets.mjs` 會擋）
3. `src/game/constants.ts:239` — `M: mixedSymbol('gbX', 'gbSpX', SPECIAL_RATIOS)`
   改指 `gbM`。**維持 `SPECIAL_RATIOS`**：石板要和 `w`/`s` 一樣大，它是盤面上的事件
4. `src/game/tabletArt.ts` 整個檔案可以刪掉，只有 `Symbol.svelte` 和
   `MysteryReveal.svelte` 兩處引用（除非你選了 4.3 的方案 A，那就留著碎片那半）

---

## 7. 這套圖以外還在叢林裡的東西

符號換成埃及風之後，**盤面周圍還是叢林**。這不是這份文件的範圍，但先寫下來免得
出圖之後才發現對不上：

- `static/assets/sprites/goBananasBackground/bg_base.png` — 棕櫚樹與綠灌木叢
- `src/game/uiTheme.ts` — 按鈕與面板底色是深橄欖綠（`0x1e2a0e`、`0x2c3812`）
- `static/assets/sprites/goBananasFrame/frame_bg.png` — 盤面框
- `design/generate_mode_cards.mjs` 產的三張買入卡（還畫著已經不存在的鎖定百搭轉輪）
- `TransitionAnimation.svelte` 丟的鳳梨手榴彈、`jungle/` 底下整套音效

第 3 節把底板訂成**中性深玄武岩**就是為了這件事：它在現在的綠背景上成立，
之後換成沙漠背景也成立。先出符號、背景後補，不會白做。
