# h1–h4 重生提示詞（2026-09-14）

## 先講量出來的結論：問題不是解析度

來源檔是 1024×1024，盤面實際只畫到 **118px**。把 1024 用 box 降到 118（跟 GPU 做的事一樣），
再和一代 GoBananas100 的同一張比。量測腳本是 `design/check_symbol_legibility.mjs`，
下面每個數字都可以自己跑出來。

| 符號 | 核心/外圍 | GB100 同值 | 銳利度 | GB100 銳利度 | 主體 vs 底板對比 | 主體色相° |
|---|---|---|---|---|---|---|
| h1 | **0.85** | 0.92 | 54.2 | 51.8 | **1.03** | 1（紅）|
| h2 | 2.15 | 1.14 | **42.3** | 64.9 | **1.08** | 136（綠）|
| h3 | **1.01** | 1.52 | 65.3 | 47.1 | 1.86 | 32（暖棕）|
| h4 | 1.72 | 1.17 | **47.7** | 69.3 | 1.83 | 28（銅）|

**「核心/外圍」** = 內 34%（主體該佔的位置）的強邊緣比例 ÷ 外圍那一圈的。
大 = 主體突出、周圍安靜；接近 1 = 底板跟主體一樣吵，眼睛找不到主體。

四個獨立的毛病，要分開修：

1. **h1、h3 沒有圖地關係。** h3 外圍邊緣密度和核心幾乎相同（比值 1.01），
   一代同一張是 1.52。底板上的冰晶紋理跟主體一樣密。
   這是「看不清主圖案」的主因：**不是主體糊，是主體周圍太吵**，主體沒有安靜的場可以站。
   注意 h1、h3 的銳利度其實**高於**一代（54 vs 52、65 vs 47）——**再加細節只會更糟**。

2. **h2、h4 是真的軟。** 銳利度 42 / 48，一代是 65 / 69。這兩張要的是硬邊、硬輪廓。

3. **四張的明度都貼著自己的底板。** 主體平均色與底板平均色的 WCAG 對比全部低於 2.0，
   h1 只有 **1.03**、h2 **1.08** —— 等於主體和底板一樣亮。
   顏色是對的，但**亮度沒有分層**，所以在 118px 下主體是「浮在同一片藍上的一塊藍」。
   這四張裡最該修的就是這個數字。

4. **h3 和 h4 撞色，只差 5°。** 主體色相 32° 對 28°，兩張都是暖棕橘。
   h1（紅 1°）也在同一個暖色帶裡，和 h3 差 31°、和 h4 差 26°。
   只有 h2（綠 136°）是清楚分開的。轉輪上這三張會糊成同一張。

> 先前版本的這份文件把「整張圖的平均色相」（218/206/212/235）當成主體色相，
> 得到「四張都是冰藍」的結論。那個平均被底板的藍主導了，是錯的 ——
> 主體的顏色一直都在，問題在明度與 h3/h4 撞色。上表已改用核心區域量測。

**驗收門檻**（拿到圖跑腳本，不是用看的）：

| 指標 | 門檻 | 現在最差 |
|---|---|---|
| 核心/外圍 邊緣密度比 | ≥ 1.6 | h1 0.85 |
| 銳利度 | ≥ 55 | h2 42.3 |
| 主體 vs 底板 WCAG 對比 | ≥ 2.0 | h1 1.03 |
| 四張主體色相彼此 | ≥ 60° | h3/h4 差 5° |

```bash
node design/check_symbol_legibility.mjs "E:/stake/tools/gen"
```

---

## 共通規則（四張都要，寫進每一段提詞）

```
Slot machine symbol tile, 1024x1024, square, fully opaque, no transparency.

COMPOSITION — this is the part that failed last time:
The subject is ONE solid object, centred, filling 62-68% of the tile width.
The area AROUND the subject must be QUIET: a plain dark slate-blue plate with a
smooth vertical gradient and a single soft ice-blue inner bevel at the very edge.
NO frost crystals, NO snowflakes, NO ice texture, NO cracks, NO falling snow and
NO sparkle anywhere on the plate. Every piece of detail in the image belongs to
the subject itself. The plate is background, and background must be empty.

VALUE SEPARATION — the single most important instruction here:
The subject must be clearly LIGHTER than the plate it sits on, not merely a
different colour. Converted to greyscale, the subject must still stand out as an
obvious bright shape against a dark ground. The last batch failed exactly this:
subject and plate measured the same brightness, so the motif disappeared into
its own background even though its colour was correct.

SILHOUETTE:
The subject must be recognisable as a pure black silhouette at 100x100 pixels.
One dominant shape with a clean unbroken outline. No thin protruding parts, no
wispy edges, no smoke, no steam, no motion trails.

EDGES:
Crisp, hard, illustrated edges with a defined dark outline around the subject.
Painterly, poster-like, high local contrast. NOT airbrushed, NOT soft-focus,
NOT depth-of-field blurred, NOT glowing or bloomed.

COLOUR:
Do NOT apply a global cold colour grade over the finished image. The plate is
cold blue; THE SUBJECT KEEPS ITS OWN COLOUR at full saturation.

LIGHT: single cool key light from the upper left, shadow to the lower right.
FORBIDDEN: any text, letters, numbers, currency, logos or gambling wording.
FORBIDDEN: a white or light-coloured plate. The plate stays dark.
```

## h1 — 毛裡鋼盔（紅星）

現在最大的毛病是**底板和主體一樣吵、一樣亮**（核心/外圍 0.85，對比 1.03）。

```
A winter military helmet with a thick fur lining and fur ear flaps, seen
three-quarter front, with snow goggles pushed up onto the brow. A single flat
RED five-pointed star badge on the front of the helmet, large and unmistakable.

The helmet is the whole subject: a single heavy rounded dome shape, noticeably
BRIGHTER than the dark plate behind it. The red star is the most saturated thing
in the tile and must read at a glance — large, flat and clean, not a small
detailed emblem.

Fur is rendered as a few bold clumps of shape, NOT as thousands of fine hairs:
fine fur detail dissolves into noise when this is drawn at 118 pixels.
Helmet steel: light desaturated warm grey-green, NOT blue, and clearly lighter
than the plate.
```

## h2 — 信號彈／煙罐

構圖是四張裡最好的（核心/外圍 2.15），問題純粹是**軟**（銳利度 42，一代 65）。

```
A hand-held signal flare canister standing upright: a straight cylinder with
flat top and bottom, a bright GREEN body, and a polished SILVER pull-ring and
cap at the top.

Hard, flat, poster-like rendering with a strong dark outline — this symbol was
the softest of the four last time and it needs the crispest edges of any of them.
The cylinder gets one clear vertical highlight band down its left side and one
dark band on the right, so the round form reads instantly. The highlight should
be genuinely bright, so the canister is lighter overall than its plate.

The green must be a true saturated green, clearly not blue-tinted.
The silver ring stays neutral metal and should be the brightest small accent.
No smoke, no flame, no glow. The canister is unlit.
```

## h3 — 雪橇補給箱

底板和主體一樣吵（核心/外圍 1.01，一代 1.52），而且**和 h4 撞色只差 5°**。
這張要往**黃**走，把暖橘讓給 h4。

```
A wooden supply crate on a sled, seen three-quarter front. Warm mid-brown timber
planks with visible plank joins and dark iron corner brackets. The lid is open
and a big bunch of bright SATURATED YELLOW bananas sits proudly above the rim,
taking up roughly the top third of the subject.

This symbol failed hardest last time because the plate behind it carried as much
ice detail as the crate did. The crate must sit on a COMPLETELY PLAIN plate.
A thin even cap of snow along the top edges of the crate is allowed; nothing
else frosty anywhere.

The bananas are the identifying feature and must be a clear LEMON YELLOW, not
orange and not golden — another symbol in this set is warm copper-orange and
these two must not land in the same colour family. Big simple planks, few of
them, thick dark joins.
NO writing, markings, stencils or numbers anywhere on the crate.
```

## h4 — 銅製手提暖爐

軟（銳利度 48，一代 69），而且**和 h3 撞色**。這張要往**紅銅**走。

```
A hand-held brass hand-warmer / oil lantern: a rounded copper body with a
hinged carrying handle across the top and a simple pierced vent pattern on the
front. Deep, red-leaning POLISHED COPPER — the colour of a new penny, not the
colour of yellow brass or gold.

Pushing it red matters: the supply-crate symbol in this set is warm yellow-brown
and these two currently sit five degrees apart in hue, which makes them the same
tile at a glance on a spinning reel.

Keep the copper deeper and more matte than polished yellow gold, because another
symbol is the game's only bright gold object and those must not be confused
either. Hard edges, strong dark outline, simple form, few large pierced holes
rather than a fine grille. The body carries one bright specular highlight so the
lantern reads lighter than its plate.
```

---

## 拿到圖之後

丟進 `design/source/gen2_symbols/`（同名覆蓋），**先量再接**：

```bash
node design/check_symbol_legibility.mjs "E:/stake/tools/gen"
node design/generate_symbols_gen2.mjs "E:/stake/tools/gen"
```

第一支會印出四個門檻有沒有過，沒過就 exit 1。沒過不要接進去 ——
一代的 h1–h4 在 git 裡，隨時可還原。
