# Turf War 角色分層需求單（姿勢：#1 白西裝老大）

由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **Turf War 自己的美術需求**；
這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），
**不可描、不可取樣任何參考遊戲的圖**。

附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。

## 畫風（生圖前先讀）

畫風：**街頭貼紙塗鴉**（`street`）

風格基準圖（每次生圖都附上，成品跟它比）：`style_frame/cast_head.png`、`style_frame/h1.png`

### 本款畫風鎖定（出自 `../../../ART_BRIEF.md` §0，原文照貼）

#### 0. 風格鎖定（每張圖都照這個；角色需求單會原文引用這一節）

**畫風**：街頭貼紙塗鴉 —— 灰階線稿城市當背景，值錢的東西是貼在上面的**白邊模切貼紙**，
不值錢的東西是牆上的**灰色麥克筆／噴漆線條**。

**風格定稿圖**（2026-10-15 打樣通過）：`design/style_frame/`
＝ `h1.png`（金鍊）、`w.png`（指虎）、`sw.png`（Bruiser）、`l1.png`（王冠 tag）、`bg_base.png`（後巷線稿）、`cast_head.png`（打手頭）。
生圖時把同類的定稿圖當**風格參考**附上（只給本款自己的圖，不附任何別家遊戲的圖）。

##### 技法

| 規則 | 數值 |
|---|---|
| 高分／特殊符號 | 模切貼紙：**白邊** `#F7F5F0` 寬＝畫布邊長 3–4%，白邊內**黑外框** `#121212` 1.5–2% |
| 內線 | 黑線，約外框一半粗；**沒有漸層**，陰影是一塊硬邊深色平塗 |
| 每張貼紙的色 | 黑＋白邊＋**一個主色**（含它的深／亮階）。第二色相只能是極小點綴 |
| 小圖 L1–L4 | **沒有白邊**，灰色粗麥克筆線條、下方 1–2 條平面滴漆；只有灰 |
| 背景 | 灰階**線稿**，只有線、沒有色塊；淺紙灰底 `#D8D6D1`；中央留空給盤面 |
| 滴漆／噴點 | 平面形狀；**不上角色會動的手臂** |
| 最小形狀 | 色塊短邊 ≥ 畫布 2.5% |
| 光 | 不畫光源、不畫反光、不畫鏽、不畫髒污質感 —— 貼紙是平的 |
| 文字 | **圖裡不准有任何字、字母、數字**；全部程式用字型排 |

##### 色票

| 用途 | Hex |
|---|---|
| 墨黑 | `#121212` |
| 貼紙白 | `#F7F5F0` |
| 牆灰 亮／中／暗 | `#D8D6D1` / `#9A9CA0` / `#55585D` |
| 盤面底（程式畫） | `#3A3D42` |
| 鈉燈橘 暗／主／亮 | `#9C5A22` / `#F5893D` / `#FFC38A` |
| 塗鴉 洋紅 | `#E0338A` |
| 塗鴉 青 | `#2EC4C6` |
| 塗鴉 酸綠 | `#9BD437` |
| ⚠ 警報血紅 | `#B22222` —— **只給 The Bruiser（SW、它的特效、Kingpin 黏住標記）** |

##### 量測門檻（交件後我跑 `check_style.py`，定稿圖的數字）

| 項目 | 定稿實測 | 門檻 |
|---|---|---|
| 高分貼紙 colors95 | 44–60 | ≤ 80 |
| 高分貼紙 soft% | 28–32% | ≤ 38% |
| 小圖 colors95 / chroma | 8 / 1.3 | ≤ 14 / ≤ 4 |
| 70px 判讀 | 全部讀得出 | 必過 |

##### 共通風格段（貼在每則貼紙提示詞最前面，`{…}` 填該張主色）

```
die-cut vinyl sticker illustration, thick clean white sticker border around the whole
silhouette, bold black outline inside the border, black interior lines at half the
outline weight, flat colour fills with no gradients, one hard-edged flat shadow shape
per form, street graffiti sticker style, limited palette of ink black #121212, sticker
white #F7F5F0, {main colour hexes}, crisp vector-like edges, bold simplified shapes
```

##### 共通負面詞（貼在每則最後面）

```
3D render, CGI, octane, unreal engine, photorealistic, realistic lighting, glossy,
shiny, specular highlights, metallic sheen, chrome reflections, rust texture, grunge
texture, bloom, glow, lens flare, god rays, volumetric light, depth of field, bokeh,
sparkles, particles, airbrushed gradient, smooth gradient, soft shading, painterly,
dark moody background, text, letters, numbers, graffiti lettering, watermark,
signature, logo
```

##### 生圖共通設定

- 符號／框／道具：**1024×1024**（或該項指定尺寸），背景**純藍 `#0000FF`**，主體置中、四邊留 8%。
- 背景圖：**1920×1080 或 16:9 更大**，不用藍幕。
- 交件後我跑 `design/build_street_batch.py <批次資料夾>`：藍幕去背、縮尺寸、量測、上真盤面。

### 分層時的畫風規則

1. **每一張生圖提示詞前面都貼本款 §0 的畫風段落**，並附上風格基準圖；只寫「角色是誰、穿什麼」的提示詞，會得到模型預設的亮面寫實樣子。
2. **邊緣要有反鋸齒**：在 2 倍畫布（2048 × 4096）上畫或量化色盤，再用 Lanczos 縮回交件尺寸。沒有反鋸齒的純色塊，網格一轉就出現鋸齒（驗收會擋：輪廓半透明 < 50%）。
3. 圖裡不能有任何文字（布章、刺青、招牌）：要字的地方留空白底板，字由程式或字型處理。
4. 光源方向、視角跟符號與背景一致（照 §0）。
5. 外框只畫在這一層**看得見的輪廓**上；伸進別層底下的部分（肩端那 40px、頸部那 30px）**不畫線**，否則手臂一轉，肩膀上就多出一條線。
6. 全身同一支筆：手臂、手指、道具的外框粗細跟軀幹一致。
7. 貼紙白邊跟描線一樣只畫在這一層**看得見的外輪廓**；切口處不畫白邊，否則每個關節都是一條白縫。
8. 噴漆滴流、潑濺只放在符號和背景，不放在會動的手臂上。任何塗鴉字都由字型處理，圖裡不畫。

---

## 0. 姿勢

站姿，雙手自然垂在身側（可以穿長大衣、披圍巾）；雪茄叼在嘴上，煙往上飄。

- 角色自己的右手（畫面左）：自然垂下、手肘微彎，手是空的
- 角色自己的左手（畫面右）：自然垂下、手肘微彎，手是空的

> 參考裡這隻**沒有反應動畫**，只有待機。遊戲的中獎反應要另外設計（可用其他角色的節奏）。

> ⚠ 這個姿勢的參考**只有待機動作**。

## 1. 交件格式

- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **1024 × 2048** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。
- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。
- **腳底 y = 1674、頭頂 y ≈ 176**，水平置中於 x ≈ 512。上下至少留 40px 空白；**左右兩側（手、道具最外緣）到畫布邊至少 150px** —— 動作閘門要求擺動中仍留 40px，手離邊只有 60px 的話手臂幾乎不能往外張（Capo 的 Don 2026-09-28 因此只能做「手肘外張、前臂收回」）。
- `l`／`r` 一律指**角色自己的左／右**：正面角色的 `arm_l` 在畫面**右邊**。

## 2. 圖層（由後到前）

| # | 檔名 | 內容 | 要點 |
|---|---|---|---|
| 1 | `arm_l.png` | 角色自己的左手（畫面右），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 前臂和手離身體至少 **48px**。 |
| 2 | `body.png` | 軀幹＋骨盆＋雙腿＋鞋，一整張 | 腰、膝不切。被手臂擋住的軀幹要**完整畫出來**，就像手臂不存在一樣。前胸、背側邊緣畫滿。 |
| 3 | `head.png` | 頭、臉、頭髮／帽子、脖子 | 只在領口切一刀。脖子往下多畫 **30px** 伸進衣領底下。臉、髮際不要再分層。 |
| 4 | `prop_cigar.png` | 雪茄／菸斗（叼在嘴上） | 整支完整畫出來，包括被手或身體擋住的部分。只能碰一隻手。 |
| 5 | `dangle_smoke.png` | 從雪茄往上飄的煙（一條，懸空） | 懸空、四周留透明，一件一層。可以換成你們自己的東西，只要掛在同一個位置。 |
| 6 | `arm_r.png` | 角色自己的右手（畫面左），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 前臂和手離身體至少 **48px**。 |

若你的姿勢需要不同的前後順序，照 PSD 實際排好，`layers.json` 的 `order` 跟著改。

## 3. 姿勢規則

1. **空著的手不固定在任何東西上**：不插口袋、不貼大腿、不握拄地的東西。拿道具的手例外，但道具只跟這隻手連在一起。
2. **垂下的手臂離開身體**：前臂和手跟身體之間至少 **48px** 透明空隙。上臂在肩膀附近靠著身體沒關係。
3. 手肘自然微彎（約 10–25°）。
4. 關節附近（肩縫、手肘、手腕）不要有硬邊細節：縫線、鉚釘、條紋、格紋會被網格扭出來。
5. 道具不可經過頭或臉的後面，跟頭的輪廓至少留 **60px**。

## 5. 關節參考位置（已換算到 1024 × 2048）

依參考姿勢的比例換算，**照你的角色比例調整即可**；交件時把實際位置寫進 `layers.json`。
參考角色是頭偏大的半身像，腿是依自然站姿補的：頭、肩、手的**相對姿勢**照表，頭身比例照這款遊戲自己的設定。

| 關節 | x | y |
|---|---:|---:|
| `neck` | 486 | 386 |
| `chest` | 510 | 558 |
| `waist` | 513 | 829 |
| `hips` | 512 | 895 |
| `head_top` | 494 | 176 |
| `shoulder_r` | 271 | 393 |
| `elbow_r` | 212 | 669 |
| `wrist_r` | 305 | 912 |
| `shoulder_l` | 667 | 503 |
| `elbow_l` | 651 | 720 |
| `wrist_l` | 702 | 947 |
| `prop_cigar`（掛點）| 490 | 298 |
| `dangle_smoke`（掛點）| 440 | 315 |

## 6. 驗收（交件後跑）

1. 每張 PNG 都是 1024 × 2048，疊起來跟 `full.png` 一致；PSD 圖層與 PNG 逐像素一致。
2. `body.png` 在手臂後面畫滿，手臂移開不露洞。
3. 垂下的手臂：前臂與手離身體 ≥ 48px；手沒有碰到身體、口袋或地面。
4. 肩部重疊 ≥ 40px、頸部重疊 ≥ 30px，並在動作極值定格確認沒有露縫。
5. 變化圖各圖層 alpha 逐像素相同。
6. 每層邊緣有反鋸齒：輪廓像素至少一半是半透明（`check_layered_art.py` 會量）。
7. 跟風格基準圖、符號放在一起看：同一套筆法、色盤、光向。專案裡有 `game-reskin` 的話，把 `full.png` 跑一次 `scripts/check_style.py`，用 §0 寫的門檻。
8. 接上骨架跑完整動作：網格不摺疊、不翻面，手臂在反應中維持剛性；做 GIF 確認。

## 7. 界線

姿勢參考來自研究用的動作量測，**只取結構、時序、比例**。不可描、不可取樣、不可拿任何參考遊戲的圖當底；
成品的造型必須是這款遊戲自己的設計。

---

## 8. Turf War 補充（2026-10-15，貼紙塗鴉版；覆蓋上面第 0、2、5 節的對應內容）

### 是誰

**Kingpin**——這片地盤真正的老大，只在免費遊戲出現（進 FG 轉場換他、FG 結束換回打手）。

- 四十多歲、肩膀寬、身形比打手**更厚實**（不是更高）。平頭、修整過的短鬍。
- **不戴帽 T、不拿球棒**：長版黑皮外套（到大腿中段、敞開、直直垂下）、深灰素 T、深色長褲、白球鞋。
- 脖子一條**粗的鈉燈橘假金鍊**（同 `style_frame/h1.png` 的畫法），手指兩三枚同色戒指。
- 嘴角叼一支細雪茄（畫面右側）。表情冷、篤定，下巴微抬。
- 身體正面，**頭微微轉向畫面左**。

顏色：黑／灰為主，膚色暖棕三階，重點只用鈉燈橘（金鍊、戒指）。**不准用血紅**、塗鴉螢光色不上身。

⚠ **手臂不要畫成 A 字張開**（10-14 上一版就是 A-pose，看起來「超不自然」）：兩手**自然垂在身側**、
手肘微彎、手掌朝內，前臂離外套外緣 **48px 以上**——靠外套直直垂、不往外張來留空隙，不是把手往外撐。

### 身高、位置、關節

腳底 y=1674、頭頂 y≈176，跟打手一樣。關節照 `pose_guide.png`（依打手身形重定，原型換算版是 `pose_guide.archetype.png`）：

| 關節 | x | y |
|---|---:|---:|
| `head_top` | 540 | 176 |
| `neck` | 540 | 410 |
| `chest` | 540 | 540 |
| `waist` | 540 | 840 |
| `hips` | 540 | 930 |
| `shoulder_r`（畫面左）| 385 | 450 |
| `elbow_r` | 330 | 700 |
| `wrist_r` | 300 | 945 |
| `shoulder_l`（畫面右）| 695 | 450 |
| `elbow_l` | 750 | 700 |
| `wrist_l` | 780 | 945 |
| `prop_cigar`（掛點）| 600 | 345 |
| `dangle_smoke`（掛點）| 630 | 330 |

### 圖層（由後到前）

`arm_l.png` → `body.png`（外套、T 恤、金鍊、褲、鞋，手臂拿掉後完整畫滿）→ `head.png` → `prop_cigar.png` → `dangle_smoke.png` → `arm_r.png`。

### 英文提詞

**共用開頭：**
```
Same game and same drawing style as the attached reference images (cast_head.png is the OTHER
character of this game, h1.png shows how the gold chain is drawn): flat street cartoon illustration,
bold black outline, black interior lines at half the outline weight, flat colour fills with no
gradients, one hard-edged flat shadow shape per form, no lighting effects, no texture. Palette: ink
black #121212, greys #55585D #9A9CA0 #D8D6D1, sticker white #F7F5F0, warm brown skin tones, sodium
orange #9C5A22 #F5893D #FFC38A only on the chain and rings. NO red anywhere, no neon on the figure,
no text, no logos. White sticker border ONLY along outlines that face the background, never along a
cut edge where another layer joins.
1024x2048 canvas, the part in its exact position on the full figure, everything else pure blue #0000FF.
```

**full：**
```
Full figure, front view, standing: "the Kingpin", a broad-shouldered man in his forties, close-cropped
hair and short trimmed beard, cold and sure of himself, chin slightly raised, head turned a few degrees
toward the left of the image. Long black leather coat to mid-thigh, open, hanging straight down; plain
dark grey T-shirt; dark trousers; clean white sneakers. A thick orange fake-gold curb chain, two or
three matching rings. A thin cigar in the corner of his mouth on the image's right side, a thin flat
wisp of smoke. Both arms hang relaxed close to his sides, elbows slightly bent, palms facing his legs,
NOT spread out in an A-pose, with a clear gap of background between each forearm and the coat.
Feet at y=1674, top of head at y=176.
```

**body：** `The coat, T-shirt, chain, trousers and shoes ONLY, drawn complete as if the arms did not exist.`
**arm_r：** `ONLY his right arm (image left) in its coat sleeve, shoulder to fingertips, hanging relaxed; extend 40px of sleeve into the shoulder.`
**arm_l：** `ONLY his left arm (image right) in its coat sleeve, shoulder to fingertips, hanging relaxed; extend 40px of sleeve into the shoulder.`
**head：** `ONLY the head, face, hair, beard and neck; extend the neck 30px down under the collar. No cigar.`
**prop_cigar：** `ONLY the thin cigar, drawn whole.`
**dangle_smoke：** `ONLY one thin flat wisp of smoke, light grey #D8D6D1 with a black outline.`

### 交件

放 `design/_incoming/street_cast/fg/`：`full.png`、六張圖層 PNG、`layers.json`、PSD（若有）。

> #1 原型只有待機、沒有反應動畫：中獎反應借打手的 snap → hold → release，幅度放在肩膀與外套下襬。
