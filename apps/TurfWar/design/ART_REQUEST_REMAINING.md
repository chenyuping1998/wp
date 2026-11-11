# Turf War — 剩餘美術需求單（2026-10-15）

目前遊戲裡已經是新畫風的：12 個符號、三個場景背景、盤面／UI／標題／大獎牌（程式畫）、鐵捲門轉場。
**還沒換的只剩下表這些。** 依送審影響排序：A、B 不交就不能送審；C 建議交；D 可選。

| 優先 | 項目 | 張數 | 現在遊戲裡是什麼 | 交件位置 |
|---|---|---|---|---|
| **A** | MG 打手（分層） | full＋8 層 | 舊寫實人物轉灰階（審核會看成 AI 渲染） | `design/_incoming/street_cast/mg/` |
| **B** | FG Kingpin（分層） | full＋6 層 | 同上 | `design/_incoming/street_cast/fg/` |
| C | 錢框角落插畫 | 5 | 程式畫的四條膠帶框 | `design/_incoming/street_batch2/` |
| D | 場景近景層 | 3 | 空白（沒有視差） | `design/_incoming/street_near/` |

商店縮圖前景、cover、載入畫面人物**不用生**：A、B 到了我用 full.png 合成（縮圖背景已經交件）。
MG 角色原本有 base／feature／kingpin 三種打光版本 —— 新畫風是平塗、不畫光，**只要交一套**，三個模式共用。

---

## 共通規則（A–D 每一張都適用）

- **附參考圖**：`design/style_frame/cast_head.png`（打手的頭）、`h1.png`（金鍊畫法）、`sw.png`（Bruiser）。只附本款自己的圖。
- **背景**：純藍 `#0000FF` 或透明。圖裡**不准有任何字**。
- **畫法**：粗黑外框、內線約外框一半粗、平塗、每個形體一塊硬邊陰影、**不畫光源、不畫反光、不畫質感**。
- **色票**：墨黑 `#121212`、貼紙白 `#F7F5F0`、灰 `#55585D` `#9A9CA0` `#D8D6D1`、鈉燈橘 `#9C5A22` `#F5893D` `#FFC38A`、暖棕膚色三階。
  **人物身上不准有紅色**（血紅 `#B22222` 只給 Bruiser 符號）、不准有螢光色（洋紅／青／酸綠只在符號上）。
- **白色貼紙邊只畫在「看得到背景」的外輪廓**，圖層之間的切口不畫（否則關節會出現白縫）。滴漆不上手臂。

共用英文開頭（A、B 每一張都先貼這段，再接該張的句子）：

```
Same game and same drawing style as the attached reference images: flat street cartoon
illustration, bold black outline, black interior lines at half the outline weight, flat colour
fills with no gradients, one hard-edged flat shadow shape per form, no lighting effects, no
reflections, no texture. Palette: ink black #121212, greys #55585D #9A9CA0 #D8D6D1, sticker
white #F7F5F0, warm brown skin in three flat tones, sodium orange #9C5A22 #F5893D #FFC38A only
on metal jewellery. NO red anywhere, no neon colours, no text, no logos. White sticker border
ONLY along outlines that face the background, never along a cut edge where another layer joins.
1024x2048 canvas, feet at y=1674, top of head at y=176, the part in its exact position on the
full figure, everything else pure blue #0000FF.
```

---

## A. MG 打手 —— 扛球棒（最優先）

**是誰**：照 `style_frame/cast_head.png` 那顆頭。二十出頭、瘦、繃緊；灰色連帽衫帽子戴上、黑頭巾遮住鼻子以下、
寬垮深灰褲、白球鞋、脖子一條細的鈉燈橘假金鍊、腰間夾一罐**灰色**噴漆罐。**頭微微轉向畫面左**（他站在盤面右側，要看向盤面）。

**姿勢**：畫面左側那隻手舉到肩膀，把木球棒扛在肩上（棒子往肩後斜出）；畫面右側那隻手自然垂下、手肘微彎、手是空的，
**前臂和手離身體至少 48px**（中間看得到背景）。手、棒子最外緣離畫布左右邊至少 150px。關節位置照 `cast_brief_street/mg/pose_guide.png`。

**先生 full.png 對位**：
```
Full figure, front view, standing: a lean young street enforcer in his early twenties, grey
hoodie with the hood up, black bandana over nose and mouth, narrowed eyes, head turned a few
degrees toward the left of the image. His right arm (image left) raised, hand at the shoulder
holding a wooden baseball bat with black tape on the grip, resting on the shoulder, bat angled up
and out behind him. His left arm (image right) hanging relaxed with the elbow slightly bent, hand
empty, with a clear gap of background between forearm and body. Baggy dark grey trousers, white
sneakers, thin orange fake-gold chain, a grey spray can clipped at the waist.
```

**8 個圖層**（由後到前；每張 = 共用開頭 + 下面那句）：

| # | 檔名 | 句子 |
|---|---|---|
| 1 | `arm_r.png` | `ONLY his right arm (image left) in its hoodie sleeve, shoulder to palm, raised to the shoulder; the fingers that wrap the bat are NOT in this layer; extend 40px of sleeve into the shoulder with no outline there.` |
| 2 | `prop_bat.png` | `ONLY the wooden baseball bat with black tape on the grip, drawn whole including the parts hidden by the hand and shoulder.` |
| 3 | `body.png` | `ONLY the torso, hood, hips, legs, sneakers and spray can, drawn complete as if the arms did not exist — the hoodie fully drawn where the arms would cover it. No chain, no head.` |
| 4 | `arm_l.png` | `ONLY his left arm (image right) in its hoodie sleeve, shoulder to fingertips, hanging relaxed with the elbow slightly bent, hand empty, at least 48px away from the body; extend 40px of sleeve into the shoulder with no outline there.` |
| 5 | `dangle_chain.png` | `ONLY the thin orange fake-gold chain hanging on the chest, free of everything else.` |
| 6 | `head.png` | `ONLY the head inside the hood opening, face, bandana and neck; extend the neck 30px down under the collar with no outline there.` |
| 7 | `dangle_mask.png` | `ONLY the loose tail end of the black bandana hanging below the chin, free of everything else.` |
| 8 | `fingers_r.png` | `ONLY the fingers of his right hand (image left) that wrap around the bat grip, in front of the bat.` |

---

## B. FG Kingpin —— 垂手老大

**是誰**：這片地盤的老大，只在免費遊戲出現。四十多歲、肩膀寬、**比打手厚實**（不是更高）；平頭、修整過的短鬍；
長版黑皮外套到大腿中段、敞開、直直垂下；深灰素 T、深色長褲、白球鞋；**粗的鈉燈橘假金鍊**（照 `h1.png` 的畫法）、
手指兩三枚同色戒指；嘴角叼一支細雪茄（畫面右側）。表情冷、下巴微抬。**頭微微轉向畫面左**。

**姿勢**：兩手**自然垂在身側**、手肘微彎、掌心朝腿。⚠ **不要 A 字張開**（上一版就是 A-pose，看起來「超不自然」）。
空隙靠外套直直垂、不往外張來留，前臂離外套外緣至少 48px。關節照 `cast_brief_street/fg/pose_guide.png`。

**先生 full.png 對位**：
```
Full figure, front view, standing: "the Kingpin", a broad-shouldered man in his forties,
close-cropped hair and short trimmed beard, cold and sure of himself, chin slightly raised, head
turned a few degrees toward the left of the image. Long black leather coat to mid-thigh, open,
hanging straight down; plain dark grey T-shirt; dark trousers; clean white sneakers. A thick orange
fake-gold curb chain, two or three matching rings. A thin cigar in the corner of his mouth on the
image's right side, a thin flat wisp of smoke. Both arms hang relaxed close to his sides, elbows
slightly bent, palms facing his legs, NOT spread out in an A-pose, with a clear gap of background
between each forearm and the coat.
```

**6 個圖層**（由後到前）：

| # | 檔名 | 句子 |
|---|---|---|
| 1 | `arm_l.png` | `ONLY his left arm (image right) in its leather coat sleeve, shoulder to fingertips, hanging relaxed; extend 40px of sleeve into the shoulder with no outline there.` |
| 2 | `body.png` | `ONLY the coat, T-shirt, gold chain, trousers and sneakers, drawn complete as if the arms did not exist. No head.` |
| 3 | `head.png` | `ONLY the head, face, hair, beard and neck; extend the neck 30px down under the collar with no outline there. No cigar.` |
| 4 | `prop_cigar.png` | `ONLY the thin cigar, drawn whole, at the corner-of-the-mouth position.` |
| 5 | `dangle_smoke.png` | `ONLY one thin flat wisp of smoke, light grey #D8D6D1 with a black outline, free of everything else.` |
| 6 | `arm_r.png` | `ONLY his right arm (image left) in its leather coat sleeve, shoulder to fingertips, hanging relaxed; extend 40px of sleeve into the shoulder with no outline there.` |

**A、B 交件時一起附**：PSD（有的話）、`full.png`、各層 PNG、`layers.json`（照各自資料夾的 `layers.template.json` 填實際支點；不會填可以不附，我量）。
收到後我跑分層檢查 → 建骨架 → 動作閘門 → 接進遊戲，再合成商店縮圖前景、cover、載入畫面。

---

## C. 錢框角落插畫（建議）

現在的框是程式畫的四條膠帶，能用但沒有「贓物袋」的辨識。這批是**只有一圈邊帶、中間全空**的框，角落多一個袋子貼紙。
每張 1024×1024（`frame_full` 1280×1024），**中空區必須是純藍**（倍數由程式寫在角落、符號要露出來）。發光層我從框自動產生，不用生。

貼紙共用開頭（C、D 用）：
```
die-cut vinyl sticker illustration, thick clean white sticker border around the whole silhouette,
bold black outline inside the border, black interior lines at half the outline weight, flat colour
fills with no gradients, one hard-edged flat shadow shape per form, street graffiti sticker style,
limited palette of ink black #121212, sticker white #F7F5F0, sodium orange #9C5A22 #F5893D #FFC38A,
greys #55585D #9A9CA0, crisp vector-like edges, no text, no letters, no numbers
```

| 檔名 | 中空 | 主體句子 |
|---|---|---|
| `frame_1x1.png` | 中央 68% | `a square frame made of four strips of orange duct tape overlapping at the corners, a small canvas money bag sticker on the top-left corner, the frame is a thin band at the edge, the centre 68% is completely empty pure blue #0000FF, flat front view` |
| `frame_2x2.png` | 中央 78% | `the same orange duct tape square frame, a stuffed sports duffel bag sticker with its zip bursting on the top-left corner and bag straps clipped over the other three corners, the centre 78% completely empty pure blue #0000FF` |
| `frame_3x3.png` | 中央 84% | `the same orange duct tape square frame, a tied black garbage bag sticker overflowing with banknotes on the top-left corner and loose notes slipping out at two other corners, the centre 84% completely empty pure blue #0000FF` |
| `frame_full.png`（1280×1024） | 中央 88% | `a wide frame of orange duct tape and the edge of a grey tarp taped around all four sides, round metal grommets in the four corners, the centre 88% completely empty pure blue #0000FF` |
| `frame_sticky.png` | 可畫滿 | `a round acid green #9BD437 spray-painted tick inside a circle, sticker style` |

⚠ **右下角留空**（倍數牌放在那裡）。框的邊帶在三種尺寸要**接近同樣粗**，靠角落的袋子越來越大表現份量。**不准用紅色**。

---

## D. 場景近景層（可選，做了才有視差）

三張 1920×1080、**藍底**、只畫畫面**左右兩側**的前景物件，中央 60% 全空：

```
greyscale ink line drawing, clean black and grey ink lines only, no colour fills, no shading,
lines in #121212 and #55585D, foreground objects only at the far left and far right edges of the
frame, the centre 60% completely empty pure blue #0000FF: {場景}
```

| 檔名 | {場景} |
|---|---|
| `bg_base_near.png` | `a chain-link fence post and a fire escape ladder on the left, a dumpster corner and a street lamp pole on the right` |
| `bg_feature_near.png` | `boxing ring ropes and a corner post on the left, a stack of wooden pallets on the right` |
| `bg_epic_near.png` | `a rooftop railing on the left, the rear of a lowrider car on the right` |

---

## 交件後我這邊會做

1. `design/build_street_batch.py <資料夾> --check`：去藍幕、縮尺寸、量測（colors95／soft／chroma 要在 ART_BRIEF §0 門檻內）。
2. 角色：`check_layered_art` → 建骨架 → `check_turf_layered_cast`（手臂間距、翻面、彎曲量）→ 遊戲裡確認面向盤面、三種比例不壓盤。
3. 實玩一輪主遊戲＋三檔 FG 截圖給你看，再重做商店縮圖 FG 與 cover。
