# GO BOOMANA — 符號生成規格與提示詞（第二版）

14 個符號。**整份貼給生圖工具，不要一張一張生。**

第一版的問題是量得出來的，不是感覺：整套比 Delta 暗 20–35%，而低分獎的字形被貼在它身上的鏽斑打碎了。這一版針對這兩件事重寫。

---

## 0. 為什麼要重寫（先讀這段，它決定了下面每一條）

拿 Delta 和第一版 Boomana 逐格量平均亮度：

| | h1 | h2 | h3 | h4 | w | s |
|---|---|---|---|---|---|---|
| Delta | 70.5 | 85.3 | 81.3 | 87.6 | 74.9 | 78.7 |
| Boomana v1 | 54.5 | 67.0 | **46.2** | 65.8 | 64.5 | 66.5 |

**問題一：高分獎是深色物件壓在近黑底板上。** 鐵鎬、深木礦車、黃銅提燈本身就暗，底板又幾乎全黑——暗中之暗。h3 只有 46.2，在盤面上幾乎看不見。Delta 的主體則普遍**比底板亮**，而且佔滿整格。

**問題二：低分獎的鏽斑畫在字上。** Delta 是**深色的字刻進淺色石板**——明度反差最大，而且字形是乾淨的剪影。Boomana v1 是**中色鏽鐵字浮在深色板岩上**，鏽的斑駁直接長在筆畫上，把字形咬掉。Q 的尾巴因此在 140px 下消失，讀成 D。

**兩張底板，不是一張。** 這是這一版最大的結構改變：低分獎用**淺色石板**，高分獎和特殊符號用**中調石板**。光看格子的明暗就分得出大小獎——那是第二層辨識，不花任何額外成本。

**明度歸低分獎，彩度歸高分獎。** 低分獎的石板亮，但**完全無彩**（灰白石頭，沒有顏色）；高分獎暗一些，但**每一個有自己的飽和色相**。這樣淺色石板不會把注意力從高分獎搶走——它們在不同的維度上競爭。

---

## 1. 硬性規格

| 項目 | 規格 |
|---|---|
| 尺寸 | **1024 × 1024，正方形** |
| 格式 | PNG 或高品質 JPEG，不要壓縮痕跡 |
| 文字 | **圖上不可有任何文字**，除了 L1–L5 本身的字母 |
| 邊界 | 主體四周留約 8% 空隙，不可貼邊 |

**在遊戲裡每個符號只有 140px 高。** 生完把整套縮到 140px 排一列看——認不出來的重生。這是唯一真正重要的測試，不是來源的像素數。

---

## 2. 底板 A —— 低分獎 L1–L5

一塊**淺灰白色的石板**，表面有細裂紋和缺角，像坑道口釘著的石製標示牌。

顏色 **#C9C4B8**（骨灰白，帶一點暖）。無彩，不要任何色偏。

**字是刻進去的，不是貼上去的。** 深色的凹刻，邊緣有一圈受光的倒角。**鏽蝕、汙漬、磨損只能出現在石板上，絕對不能出現在筆畫上**——第一版就是把鏽斑畫在字上，140px 下字形直接碎掉。

---

## 3. 底板 B —— 高分獎 H1–H4、W、S、B

一塊**中調的深板岩**，四角有鉚釘。

顏色 **#4A463C**（比第一版的 #3A362C 亮約 30%）。

這 30% 是刻意的：主體必須有東西可以讀出來。近黑底板配深色物件是第一版最大的錯。

> H1–H4 / W / S / B 的底板會被匯入腳本裁掉（那七張在遊戲裡是去框的），但**生成時仍然要有**——有固定的框，構圖會穩定得多，整套一起看比例才一致。

---

## 4. 光線與配色（全套統一）

- **主光從左上**，暖色礦燈光，主體右下留深影
- **每個主體都要有一圈受光的邊緣**（rim light），把它從底板上分離出來。這是讓深色物件在深色底板上仍然讀得出來的唯一方法
- **主體要佔滿格子**——約 80% 的可用寬度。第一版留了太多空白底板
- 金屬有磨損，但磨損在**表面**，不在**輪廓**上

---

## 5. 低分符號 L1–L5（A K Q J 10）

**五張一起生，只有字母不同。** 分開生會得到五種字體。

```
The single letter "A" carved deeply INTO a pale cracked stone slab, like a
marker plate set into a mine tunnel wall. The slab is bone-grey limestone,
colour #C9C4B8, its surface finely cracked and chipped at the corners, entirely
colourless — no rust, no paint, no tint.

The letter is a dark recess cut into the stone, not an object sitting on top of
it. Thick blocky slab-serif letterform with a clean unbroken outline. The upper
edge of the cut catches the warm light from the upper left as a bright bevel;
the inside of the cut is in deep shadow. Maximum contrast between the dark
carved letter and the pale stone around it.

CRITICAL: all weathering, cracks and staining belong to the SLAB. The letterform
itself must stay clean and unbroken — no rust, no mottling, no chipping across
the strokes.

Painterly hand-illustrated game art, extremely legible at small size. Square 1:1,
only the single character "A" and no other text.
```

把 `"A"` 換成 **K / Q / J / 10** 各生一張，**其餘文字一字不改**。

**Q 要額外加這一句**（第一版的 Q 在 140px 下讀成 D）：

```
The tail of the "Q" must be long and clearly cross the outside of the bowl, so
the letter can never be mistaken for a D or an O at small size.
```

> L1=A、L2=K、L3=Q、L4=J、L5=10，賠率由高到低就是這個順序。

---

## 6. 高分符號 H1–H4

四張各有**自己的色相**，這是它們彼此分辨的主要依據——剪影是第二層。

### H1 — 礦工提燈（琥珀）

```
A brass miner's lantern seen straight on, filling most of the frame. The flame
inside burns fiercely and floods the whole lamp with hot amber light, so the
glass and the brass around it GLOW — this is a light source, not an object that
happens to be lit. A warm halo spills onto the plate behind it. Polished brass
catching a bright rim along its left edge.

Painterly hand-illustrated game art, bold simple shapes, the brightest symbol in
the set. Centred on a mid-tone dark slate plate with riveted corners, colour
#4A463C. Square 1:1, no text.
```

**為什麼是 H1**：它自己發光。最高分符號在 140px 下必須第一眼跳出來，自體發光是唯一穩贏的做法——而第一版把它畫成一盞暗的燈，只有小小的火焰是亮的。

### H2 — 原礦晶簇（冷藍綠）

```
A cluster of raw crystals bursting out of split dark rock, filling most of the
frame. The crystals are sharp angular prisms of bright cool blue-green,
semi-transparent, glowing softly from within and catching a hard bright rim
along their left facets. The rock they sit in is dark, so the crystals read as
lit objects against it. Spiky irregular silhouette.

Painterly hand-illustrated game art, bold simple shapes, high contrast. This is
the only cool-coloured symbol in the whole set. Centred on a mid-tone dark slate
plate with riveted corners, colour #4A463C. Square 1:1, no text.
```

**為什麼**：全套唯一的冷色。在一排琥珀、黃銅、暖金裡，一塊藍綠色不可能認錯。

### H3 — 交叉鎬（亮鋼＋紅木柄）

```
Two mining pickaxes crossed in an X, filling most of the frame. The iron heads
are POLISHED BRIGHT STEEL, almost white where the light hits them, with a hard
specular edge along the top of each head — they must read as bright metal, not
dark iron. The handles are warm red-brown hardwood, lighter than the plate
behind them. Strong rim light along the whole upper-left contour of both tools.

Painterly hand-illustrated game art, bold simple shapes, high contrast against
the plate. Centred on a mid-tone dark slate plate with riveted corners, colour
#4A463C. Square 1:1, no text.
```

**這張第一版最糟**（亮度 46.2，全套最暗）。深色鏽鐵壓在近黑底板上等於消失。改成**拋光亮鋼＋暖紅木柄**，明度直接翻上來。X 形本來就是最強的剪影之一，把它照亮就好。

### H4 — 礦車（暖黃木＋金礦）

```
A small mine cart on rails seen three-quarters from the front, filling most of
the frame, heaped high with broken ore that GLITTERS with gold. The cart body is
warm honey-coloured timber with bright iron banding, lit strongly from the upper
left so its whole upper surface is light against the plate. The gold in the ore
pile is the brightest point after the highlights on the timber.

Painterly hand-illustrated game art, bold simple shapes. Centred on a mid-tone
dark slate plate with riveted corners, colour #4A463C. Square 1:1, no text.
```

**改動**：第一版是深色木頭裝煤炭，整格暗成一團。改成**暖蜜色木材＋發亮的金礦**。

---

## 7. W — 戴礦工安全帽的猩猩

```
A heavy-set gorilla miner seen from the chest up, facing forward, filling the
frame. He wears a scuffed yellow mining hard hat with a lit headlamp on the
front, and the beam throws a strong warm pool of light down across his brow,
goggles and muzzle — his face is LIT, not in shadow. Scratched safety goggles
pushed up onto the helmet. Dark coarse fur with a bright rim light along his
left shoulder and the top of his head, separating him from the plate. A pale
canvas work jacket, which keeps his silhouette light against the dark ground.
Calm, steady, slightly amused. A little coal dust on his cheek.

Painterly hand-illustrated game art, bold simple shapes, the headlamp is the
brightest thing in the picture. Centred on a mid-tone dark slate plate with
riveted corners, colour #4A463C. Square 1:1, no text.
```

**要點**：

- **頭燈是光源，不只是配件。** 它必須真的照亮他的臉——那是這張在 140px 下唯一的識別點。
- **淺色工作服**是刻意的：深色毛皮在深色底板上會糊掉，淺色的身體撐起剪影。
- 這隻要和封面的猩猩**是同一隻**。並排看臉型對不上就重生。

---

## 8. S — 金香蕉串（Scatter）

```
A bunch of five bananas cast in polished gold, filling most of the frame,
resting on broken dark rock as if just cut out of the seam. The gold is bright,
reflective and warm, with hard specular highlights along the top of each banana
and a bright rim separating the bunch from the plate. A few loose gold flakes on
the rock around it.

Painterly hand-illustrated game art, bold simple shapes. Centred on a mid-tone
dark slate plate with riveted corners, colour #4A463C. Square 1:1, no text.
```

**保留香蕉串**：三代的 scatter 就是它，玩家已經知道這個形狀開啟免費遊戲。換掉是丟掉已建立的辨識。

---

## 9. B — 炸藥

```
A tight bundle of six sticks of dynamite bound with twine into a stubby
cylinder, seen straight on, filling most of the frame. The sticks are bright
waxed red paper, worn and scuffed, their round ends facing the viewer. A single
braided fuse rises from the binding and ARCS UP AND OUT to one side, lit, with a
brilliant spark and a curl of smoke trailing off the shape. The spark is the
brightest point in the picture, and the arcing fuse is what makes this symbol's
outline unmistakable.

Painterly hand-illustrated game art, bold simple shapes, the red is saturated
and bright against the plate. Centred on a mid-tone dark slate plate with
riveted corners, colour #4A463C. Square 1:1, no text.
```

**那道往外拉的引信是關鍵**——它是整套裡唯一一條離開主體的線。香蕉的呼應留在「短短的圓頭一束」上，但輪廓不會撞到 S。

---

## 10. 完成後的檢查

生完先做這三件事再交給我：

1. **全部縮到 140px 排一列看。** 認不出來的重生。
2. **兩張底板各自比對。** L1–L5 的石板要一致，H/W/S/B 的板岩要一致。
3. **拿第一版並排。** 新的高分獎應該明顯更亮——目標是把平均亮度從 46–67 拉到 **70 以上**，也就是 Delta 那個區間。

然後把整包丟給我。匯入時我會：

- 量每一張的平均亮度並回報，跟 Delta 的數字對照
- 去框（H1–H4 / W / S / B），裁 6%——**不是 16%**，這一套的框很薄，16% 會削掉安全帽頂和引信弧線
- 不做放大：小於 1024 就原樣保留，只有過大才縮

匯入腳本的 `PLATE_TARGET` 目前是 `(58, 54, 44)`。底板改成 #4A463C 之後我會一併更新，但那只在某一張顏色跑掉時才會用到——顏色該在生成時就對，事後校正只能近似。
