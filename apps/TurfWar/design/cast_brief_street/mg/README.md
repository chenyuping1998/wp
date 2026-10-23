# Turf War 角色分層需求單（姿勢：#2 扛球棒男）

由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **Turf War 自己的美術需求**；
這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），
**不可描、不可取樣任何參考遊戲的圖**。

附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。

## 畫風（生圖前先讀）

畫風：**街頭貼紙塗鴉**（`street`）

風格基準圖（每次生圖都附上，成品跟它比）：`style_frame/cast_head.png`、`style_frame/h1.png`、`style_frame/sw.png`

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

站姿，畫面左側的手舉到肩膀、把球棒扛在肩上（棒子從肩後往外斜出）；畫面右側的手自然垂下、手肘微彎。脖子掛鍊子，臉上的面罩／頭巾有一截會晃。

- 角色自己的右手（畫面左）：舉到肩膀握住道具
- 角色自己的左手（畫面右）：自然垂下、手肘微彎，手是空的

> 反應的力道在「垂下那隻手的上臂鼓起、扛棒那隻手的前臂收緊」，加上軀幹往前推（視差）。

## 1. 交件格式

- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **1024 × 2048** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。
- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。
- **腳底 y = 1674、頭頂 y ≈ 176**，水平置中於 x ≈ 537。上下至少留 40px 空白；**左右兩側（手、道具最外緣）到畫布邊至少 150px** —— 動作閘門要求擺動中仍留 40px，手離邊只有 60px 的話手臂幾乎不能往外張（Capo 的 Don 2026-09-28 因此只能做「手肘外張、前臂收回」）。
- `l`／`r` 一律指**角色自己的左／右**：正面角色的 `arm_l` 在畫面**右邊**。

## 2. 圖層（由後到前）

| # | 檔名 | 內容 | 要點 |
|---|---|---|---|
| 1 | `arm_r.png` | 角色自己的右手（畫面左），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 手掌畫在這張（在道具後面），手指另一層。 |
| 2 | `prop_bat.png` | 球棒（扛在肩上，只碰握棒那隻手） | 整支完整畫出來，包括被手或身體擋住的部分。只能碰一隻手。 |
| 3 | `body.png` | 軀幹＋骨盆＋雙腿＋鞋，一整張 | 腰、膝不切。被手臂擋住的軀幹要**完整畫出來**，就像手臂不存在一樣。前胸、背側邊緣畫滿。 |
| 4 | `arm_l.png` | 角色自己的左手（畫面右），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 前臂和手離身體至少 **48px**。 |
| 5 | `dangle_chain.png` | 頸鍊（掛在胸前，懸空的一段） | 懸空、四周留透明，一件一層。可以換成你們自己的東西，只要掛在同一個位置。 |
| 6 | `head.png` | 頭、臉、頭髮／帽子、脖子 | 只在領口切一刀。脖子往下多畫 **30px** 伸進衣領底下。臉、髮際不要再分層。 |
| 7 | `dangle_mask.png` | 面罩／頭巾垂下的尾端 | 懸空、四周留透明，一件一層。可以換成你們自己的東西，只要掛在同一個位置。 |
| 8 | `fingers_r.png` | 角色自己的右手（畫面左）蓋在道具前面的手指 | 只有握道具的手才要。道具夾在手掌（手臂那張）和手指中間。 |

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
| `neck` | 623 | 413 |
| `chest` | 568 | 612 |
| `waist` | 534 | 875 |
| `hips` | 537 | 895 |
| `head_top` | 599 | 176 |
| `shoulder_r` | 492 | 488 |
| `elbow_r` | 339 | 714 |
| `wrist_r` | 252 | 537 |
| `shoulder_l` | 783 | 453 |
| `elbow_l` | 859 | 687 |
| `wrist_l` | 820 | 940 |
| `prop_bat`（掛點）| 250 | 483 |
| `dangle_chain`（掛點）| 623 | 462 |
| `dangle_mask`（掛點）| 563 | 293 |

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

## 8. Turf War 補充（2026-10-15，貼紙塗鴉版；覆蓋上面對應內容）

### 是誰

**打手（Bruiser）**——主遊戲站盤面右側。長相照 `style_frame/cast_head.png`（定稿頭）：
二十出頭、瘦、繃緊；**灰色連帽衫帽子戴上**、**黑頭巾遮住鼻子以下**、眉頭壓低。
寬垮的深灰褲、白球鞋。肩上扛一根木球棒（棒身骨白 `#F7F5F0` 系、握把纏黑膠布）。
脖子一條細鈉燈橘假金鍊。腰間一罐灰色噴漆罐（人物身上不放螢光色）。
**頭微微轉向畫面左**（站在盤面右側要看向盤面）。

顏色：灰／黑為主，膚色用暖棕三階（照定稿頭，**不准畫成金色或橘色**），重點只用鈉燈橘（金鍊）。
**不准用血紅**（那是 Bruiser 符號 SW 的，人物本身不用）。

### 英文提詞（每張前面都接這段共用開頭）

```
Same game and same drawing style as the attached reference images (cast_head.png is this exact
character's head): flat street cartoon illustration, bold black outline, black interior lines at
half the outline weight, flat colour fills with no gradients, one hard-edged flat shadow shape per
form, no lighting effects, no texture. Palette: ink black #121212, greys #55585D #9A9CA0
#D8D6D1, sticker white #F7F5F0, warm brown skin tones, sodium orange #F5893D only on the chain.
NO red anywhere, no text, no logos. White sticker border ONLY along outlines that face the
background, never along a cut edge where another layer joins.
1024x2048 canvas, the part in its exact position on the full figure, everything else pure blue #0000FF.
```

**full（先生完整的一張拿來對位）：**
```
Full figure, front view, standing: a lean young street enforcer in his early twenties, grey hoodie
with the hood up, black bandana over nose and mouth, narrowed eyes, head turned a few degrees toward
the left of the image. His right arm (image left) raised, hand at the shoulder holding a wooden
baseball bat resting on the shoulder, bat angled up and out behind him. His left arm (image right)
hanging relaxed with the elbow slightly bent, hand empty, clearly away from the body. Baggy dark grey
trousers, white sneakers, thin orange fake-gold chain, a grey spray can clipped at the waist.
Feet at y=1674, top of head at y=176.
```
各圖層照第 2 節的拆法，每層句子＝「ONLY the …（那一層的內容）, drawn complete where other layers cover it」。

### 交件

放 `design/_incoming/street_cast/mg/`：`full.png`、各圖層 PNG、`layers.json`、PSD（若有）。藍幕或透明都可以。
