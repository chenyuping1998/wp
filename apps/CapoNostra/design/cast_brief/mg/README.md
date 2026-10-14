# Capo Nostra 角色分層需求單（姿勢：#1 白西裝老大）

由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **Capo Nostra 自己的美術需求**；
這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），
**不可描、不可取樣任何參考遊戲的圖**。

附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。

## 2026-10-04 最新：重塑 Don，姿勢與動作照已通過審核的 Deadwood

使用者退回厚重六層版：人物融入背景、肩臂身體比例不自然。以下取代舊版 4.5 頭身、過寬腰肩與垂雙手要求。

- 自然厚實的成人比例，約 6–6.5 頭身；關節在實際人體位置，不對生成圖局部拉寬或壓短。
- 參考 Deadwood 自製 conductor 的姿勢：三分之四面向左，一手屈肘向盤面持雪茄，另一手垂下，兩足穩定站立。
- 保持 Don 的黑幫身份、寬下顎、帽子、圍巾；外套主面積改中灰，陰影近黑，肩臂外緣有清晰紙白／淺灰硬邊照明。黑色面积不吞掉四肢。
- 保持 Art Deco 幾何平面語言與灰階，不用照片或 Deadwood 寫實材質。
- 一張完整透明人物重新建骨架；使用 Deadwood 的自製動作時序、幅度與作用角色映射，不沿用舊 Don 的關節或權重。
- 必須在遊戲背景與 intro 內觀察，不能以只有透明底的單張圖宣稱完成。

## 舊版要求（已由下面新要求取代）：Don 要厚重，不要瘦長

第一版 Don（`_incoming/cast_artdeco_20261004/mg/`）畫風對，但**體型太細長**，使用者退回。量出來的問題：

| 量測（佔身高） | 第一版 | 女主人 | **重生目標** |
|---|--:|--:|--:|
| 兩肩關節距離 | 0.16 | 0.16 | **≥ 0.24**（約 380px） |
| 腰寬 | 0.19 | 0.14 | **≥ 0.27**（約 430px） |
| 頭身比 | 5.0 頭 | 6.2 頭 | **4.5–5 頭**（頭大一點、臉寬） |
| 胯部高度（從頭頂算） | 59% | 48% | **62–64%**（腿短一點） |

- 臉照 `style_frame/don_head.png`：下顎寬、**雙下巴、垂肉**、歪鼻、垂眼皮。第一版的臉太窄太長。
- 體型：**桶狀胸腹、厚肩、粗脖子**，西裝外套扣不太起來；站姿兩腳張開到約肩寬，重心低。
- 剪影一眼要跟女主人分得出來：她細高，他寬矮。
- 其他全部照舊：同一套圖層（`head` `arm_l` `body` `arm_r` `prop_cigar` `dangle_smoke`）、1024×2048 畫布、
  腳底 y=1822、頭頂 y≈224、手臂離開身體、四階灰、紙白圍巾、不准有紅。
- 寬度注意：左右各留 ≥ 120px，手臂張開時不能出畫布。

整張概念圖提示詞（先生這張，過了再拆層）：
```
[STYLE], full-body portrait of a heavy-set 1930s mob boss in his late fifties standing
facing three-quarter to the viewer's left, a short wide barrel-chested build, thick
neck, broad shoulders, a big round belly straining his black three-piece suit, legs
apart at shoulder width, short sturdy legs, about 4.5 heads tall, broad square jaw with
heavy jowls and a double chin, nose broken and set crooked to the right, left eyelid
drooping lower than the right, black fedora with a mid grey band, a long paper white
silk scarf hanging down both sides of the chest, a thick cigar in the right corner of
the mouth with smoke built from three parallel arcs, arms hanging slightly away from the
body with a clear gap between arm and torso, film-noir key light from top-left: lit
side paper white, shadow side solid ink black, flat solid magenta #FF00FF background,
[NEG]
```

---

## 畫風（生圖前先讀）

畫風：**黑白高反差＋單一點綴色**（`noir`）

風格基準圖（每次生圖都附上，成品跟它比）：`style_frame/don_head.png`、`style_frame/h1.png`

### 本款畫風鎖定（出自 `../../../ART_BRIEF.md` §0，原文照貼）

#### 0. 畫風鎖定（每一張都照這個）

##### 0.1 畫風與理由

**Art Deco 海報造型＋黑白四階＋單一紅。** 1930 年代黑幫題材自己的印刷語言（Deco 海報）配上黑色電影的
黑白。紅色只給金庫倍數框，讓「紅＝倍數」成為全款唯一的訊號。Hacksaw／Nolimit 都沒有 Deco 幾何的
黑白遊戲，跟它們的黑白作品（蝕刻、寫意筆觸）靠造型分開。

##### 0.2 技法規則（數字，不是形容詞）

| 規則 | 數值 |
|---|---|
| 造型 | 只用圓、弧、直線、等距平行線；能對稱就對稱 |
| 明暗 | 階梯色帶，每個形體最多 3 階，階與階是硬邊，**不准平滑漸層** |
| 外框線 | 沒有描邊，形體靠明度差分開 |
| 最小形狀 | 短邊 ≥ 畫布邊長 2.5%（512px 上 ≥ 13px） |
| 裝飾 | 放射線、階梯（ziggurat）、流線平行線；**不要**花草捲曲 |
| 光 | 單一硬光由左上打下，所有圖同一方向 |

##### 0.3 色票

| 用途 | Hex | 規則 |
|---|---|---|
| 墨黑 | `#121212` | 大塊陰影、底 |
| 深灰 | `#333333` | 暗面 |
| 中灰 | `#8C8C8C` | 本色 |
| 紙白 | `#ECE8DF` | 亮面 |
| 紅 深／主／淺 | `#5A0F12` / `#C1272D` / `#F2D6D0` | **只給金庫倍數框、倍數字、倍數相乘特效**；任何畫面紅色面積 ≤ 10% |

**全款其他任何東西都不准有顏色**：符號、角色、背景、UI、特殊 Wild、轉場、縮圖。

##### 0.4 風格定稿圖（`design/style_frame/`，每次生圖都附）

| 檔 | 管什麼 | 量測（512px） |
|---|---|---|
| `h1.png` 權戒 | 符號 | colors95 8、soft 11.5%、色票吻合 98.5%、彩度 1.8 |
| `don_head.png` Don 頭 | 角色 | colors95 6、soft 8.0%、色票吻合 99.1%、彩度 1.0 |
| `frame_1x1.png` 紅框（量測用 `frame_1x1_512.png`） | 倍數框 | colors95 35、soft 28.1%、紅色票吻合 92.8% |

`source/` 是原始生成圖。

##### 0.5 驗收門檻（`check_style.py`，對照定稿圖）

| 類別 | colors95 | soft | 色票吻合 | 彩度 |
|---|--:|--:|--:|--:|
| 符號、角色、背景、UI | ≤ 15 | ≤ 18% | ≥ 97% | ≤ 4 |
| 倍數框（紅） | ≤ 40 | ≤ 32% | ≥ 90%（紅色票） | — |

##### 0.6 `[STYLE]` 共通風格段

```
Art Deco poster illustration, 1930s, geometric stylisation built only from circles,
arcs, straight lines and evenly spaced parallel lines, symmetrical composition,
large flat shapes, high-contrast black and white, stepped tonal bands with hard
edges (at most three values per form), only four tones: ink black #121212, dark grey
#333333, mid grey #8C8C8C, paper white #ECE8DF, no colour at all, no outlines, forms
separated by value contrast, single hard light from top-left, crisp vector-like edges
```

紅框類（§3）把最後一行的四色換成：`deep red #5A0F12, signal red #C1272D, pale rose #F2D6D0,
ink black #121212 for shadow faces, no other colours`。

##### 0.7 `[NEG]` 共通負面詞

```
3D render, CGI, octane, unreal engine, photorealistic, glossy, shiny, specular
highlights, metallic sheen, chrome reflections, bloom, glow, lens flare, god rays,
volumetric light, depth of field, bokeh, sparkles, particles, airbrushed gradient,
smooth gradient, soft shading, art nouveau, floral curls, vines, filigree, engraving
hatching, cross-hatching, halftone dots, paper texture, grain, black outlines,
comic ink lines, text, letters, numbers, watermark, signature, logo,
colour, color, sepia, gold, yellow, green, blue, red
```

紅框類拿掉最後的 `red`。

##### 0.8 模型不准做的事（全部由程式做）

文字與數字（16 種語言）、UI 圖示、網點／紙紋／印刷錯位、光暈與粒子、色票本身（量化在 2× 做）。

### 分層時的畫風規則

1. **每一張生圖提示詞前面都貼本款 §0 的畫風段落**，並附上風格基準圖；只寫「角色是誰、穿什麼」的提示詞，會得到模型預設的亮面寫實樣子。
2. **邊緣要有反鋸齒**：在 2 倍畫布（2048 × 4096）上畫或量化色盤，再用 Lanczos 縮回交件尺寸。沒有反鋸齒的純色塊，網格一轉就出現鋸齒（驗收會擋：輪廓半透明 < 50%）。
3. 圖裡不能有任何文字（布章、刺青、招牌）：要字的地方留空白底板，字由程式或字型處理。
4. 光源方向、視角跟符號與背景一致（照 §0）。
5. 只有 §0 的四階：墨黑、深灰、中灰、紙白（本款允許兩階灰）。點綴色紅只給金庫倍數框，**角色身上完全沒有紅**。
6. 大黑塊跨過切口時，被蓋住的那一層也要把黑塊延續畫完，手臂移開時黑塊不能斷。
7. 去背底色**不可用白或灰**（會吃掉角色本身的白色區塊），用色盤沒有的飽和色。

---

---

## 角色設定：MG 主遊戲角色「The Don」（Capo Nostra 自己的設計）

這張是**重畫**，取代現在的 Don。臉照 `style_frame/don_head.png`（打樣定稿圖）畫，**同一個人、同一種打光**。
舊圖雙手貼著身體，網格只能把動作縮到 0.18 倍，手臂一動就摺；這次照第 3 節的姿勢規則，手要離開身體。

- **是誰**：家族老大，只在主遊戲出現。免費遊戲時換成 FG 那隻（夜總會女主人），兩隻不會同時在畫面上。
- **臉（寫死，照定稿圖）**：快 60 歲、下顎寬、雙下巴、鼻樑斷過往右歪、眼睛細而深、左眼皮比右邊垂、
  油頭往後梳。表情：無聊又瞧不起人。
- **打光（黑色電影）**：硬光從左上打下，亮面紙白、本色中灰、暗面那半邊**沉進墨黑**；每個形體最多 3 階。
- **服裝**：墨黑三件式西裝（背心＋懷錶鍊用中灰細線）、紙白絲質長圍巾垂在胸前兩側（辨識點，也是他在暗背景上的
  亮邊）、墨黑軟呢帽配中灰帽帶（帽子畫在 `head.png`）、黑皮鞋。**不要**披在肩上的大衣：會把手臂和軀幹連成一塊。
- **道具**：雪茄叼在嘴上（`prop_cigar.png`），煙往上飄（`dangle_smoke.png`，煙用三條平行弧線組成）。**不拿槍**。
- **配色**：只有 `#121212 / #333333 / #8C8C8C / #ECE8DF` 四階。**不准有紅**（紅只給倍數框）。
- **四肢**：手臂、腿以平塗為主，階梯色帶只放在頭和軀幹（四肢彎折時色帶會被拉扯）。
- **跟 FG 那隻的對比**：他「寬、重、黑」，她「細、高、紙白手套」。剪影一眼分得出。
- **朝向**：照原型姿勢畫即可；接進遊戲時由 `Cast.svelte` 的 `flip` 讓臉朝盤面，在瀏覽器確認。
- **沒有變化圖**：主遊戲只有一種打光。

## 0. 姿勢

站姿，雙手自然垂在身側（可以穿長大衣、披圍巾）；雪茄叼在嘴上，煙往上飄。

- 角色自己的右手（畫面左）：自然垂下、手肘微彎，手是空的
- 角色自己的左手（畫面右）：自然垂下、手肘微彎，手是空的

> 參考裡這隻**沒有反應動畫**，只有待機。遊戲的中獎反應要另外設計（可用其他角色的節奏）。

> ⚠ 這個姿勢的參考**只有待機動作**。

## 1. 交件格式

- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **1024 × 2048** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。
- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。
- **腳底 y = 1822、頭頂 y ≈ 224**，水平置中於 x ≈ 512。上下至少留 40px 空白；**左右兩側（手、道具最外緣）到畫布邊至少 150px** —— 動作閘門要求擺動中仍留 40px，手離邊只有 60px 的話手臂幾乎不能往外張（Capo 的 Don 2026-09-28 因此只能做「手肘外張、前臂收回」）。
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
| `neck` | 485 | 448 |
| `chest` | 510 | 631 |
| `waist` | 513 | 921 |
| `hips` | 512 | 991 |
| `head_top` | 493 | 224 |
| `shoulder_r` | 255 | 455 |
| `elbow_r` | 192 | 750 |
| `wrist_r` | 292 | 1009 |
| `shoulder_l` | 678 | 573 |
| `elbow_l` | 660 | 805 |
| `wrist_l` | 715 | 1046 |
| `prop_cigar`（掛點）| 489 | 354 |
| `dangle_smoke`（掛點）| 436 | 373 |

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
