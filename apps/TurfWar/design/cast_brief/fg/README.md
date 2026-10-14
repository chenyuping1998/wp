# Turf War 角色分層需求單（姿勢：#1 白西裝老大）

> **先讀最後的「Turf War 補充」**：角色是誰、修正後的關節位置、英文提詞、交件位置都在那裡，它覆蓋下面第 0、2、5 節的對應內容。

由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **Turf War 自己的美術需求**；
這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），
**不可描、不可取樣任何參考遊戲的圖**。

附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。

## 畫風（生圖前先讀）

畫風：**半寫實 3D 渲染**（`render`）

風格基準圖（每次生圖都附上，成品跟它比）：`style_frame/full.png`

### 本款畫風鎖定（出自 `../../../ART_BRIEF.md` §0，原文照貼）

#### 0. 總方向：髒、冷、廉價

Capo Nostra 是「一盞吊燈、其餘沉在暗處」的低調貴氣。
Turf War **不要那個**。這款是後半夜的壞區：鈉燈把一切染成橘、柏油是濕的、
牆上噴滿別人的名字。金色不再是主角 —— 街頭的「值錢」是鍍層會掉的假金鍊、
是一捲橡皮筋綁的鈔票。

三條硬規則，比任何一張參考圖都重要：

1. **一張圖裡最多兩個色相。** 底色（水泥灰／柏油黑）＋一個重點（鈉燈橘 或 一個塗鴉色）。
   第三個色相要有理由。
2. **塗鴉螢光色（洋紅／青／酸綠）是唯一允許高彩度的顏色，面積不得超過畫面 15%。**
   它靠稀有度發亮，不是靠面積 —— 就像真的塗鴉，是灰牆上的一筆，不是整面牆。
3. **血紅（`#B22222`）整款只保留給 The Bruiser 擴展 Wild。** 別的地方一律不准用這個紅。
   玩家一看到血紅就知道是那個機制在動 —— 這是全款唯一的警報色。
   （對照 Capo Nostra 的訊號紅 `#C1272D` 只給 Tommy Gun，同一條規則、換了紅。）

##### 色票

| 用途 | Hex | 說明 |
|---|---|---|
| 底 / 最深 | `#0E0F11` | 近黑的冷灰，背景與符號底板 |
| 底 / 次深 | `#17191C` | 面板、UI 底 |
| 水泥 中 | `#3A3D42` | 牆面、地面、符號底板亮階 |
| 水泥 亮 | `#5B5F66` | 受光的水泥、金屬邊 |
| 鈉燈橘 暗 | `#9C5A22` | 街燈陰影面、暖色中階 |
| 鈉燈橘 主 | `#F5893D` | 主要暖色、街燈光暈、標準字 |
| 鈉燈橘 亮 | `#FFC38A` | 高光，只點在邊緣 |
| 骨白 | `#D9D6CE` | 帽 T、鈔票、文字 |
| 冷鐵藍 | `#2A343E` / `#465562` | 冷色調劑，讓橘不悶（鐵絲網、鐵捲門陰影） |
| 塗鴉 洋紅 | `#E0338A` | 塗鴉點綴，≤15% 面積 |
| 塗鴉 青 | `#2EC4C6` | 塗鴉點綴，≤15% 面積 |
| 塗鴉 酸綠 | `#9BD437` | 塗鴉點綴，≤15% 面積 |
| ⚠ 警報血紅 | `#B22222` | **只給 The Bruiser 擴展 Wild（`sw.png` 與 `turfFx/`）** |

##### 質感

粗噴漆 stencil、水泥的孔洞與水漬、鐵鏽、刮花的金屬、鐵絲網的菱形網格、
被雨打過的紙、日光燈管的死白。
**不要**：Art Deco 幾何、燙金、雕版細線、老照片顆粒、大理石。
光源想像成「巷口一盞鈉氣路燈」—— 高處單一橘色硬光，陰影長而藍。

### 分層時的畫風規則

1. **每一張生圖提示詞前面都貼本款 §0 的畫風段落**，並附上風格基準圖；只寫「角色是誰、穿什麼」的提示詞，會得到模型預設的亮面寫實樣子。
2. **邊緣要有反鋸齒**：在 2 倍畫布（2048 × 4096）上畫或量化色盤，再用 Lanczos 縮回交件尺寸。沒有反鋸齒的純色塊，網格一轉就出現鋸齒（驗收會擋：輪廓半透明 < 50%）。
3. 圖裡不能有任何文字（布章、刺青、招牌）：要字的地方留空白底板，字由程式或字型處理。
4. 光源方向、視角跟符號與背景一致（照 §0）。
5. 這是模型預設、AI 感最重的畫風。全身高光方向一致、只有一個光源；不要全身都是金屬亮面。
6. 跟符號放一起比：質感、光向、飽和度要跟 §0 的風格基準圖同一套。

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

## Turf War 補充（2026-10-10，覆蓋上面第 0、2、5 節的對應內容）

### 是誰

**Kingpin**——這片地盤真正的老大，主遊戲那位扛球棒的打手（Bruiser）替他做事。只在免費遊戲出現：
進 FG 轉場時換他上場，FG 結束轉場時換回打手，兩人不會同時站在盤面旁。

- 四十多歲、肩膀寬、身形比打手**更厚實**（不是更高）。平頭或極短髮，修整過的短鬍。
- **不戴帽 T、不拿球棒**——剪影要一眼跟打手分開：長版黑色皮外套（到大腿中段、敞開、直直垂下），
  裡面深灰素 T，深色長褲，乾淨的白球鞋。
- 脖子一條**粗的假金鍊**（鍍層掉漆、露出底下的灰金屬，§0「鍍層會掉的假金鍊」），手指兩三枚同款假金戒指。
- 嘴角叼一支細雪茄（畫面右側），煙往上飄。表情：冷、篤定，下巴微抬，不笑。
- 身體正面，**頭微微轉向畫面左**——跟 `style_frame/full.png` 的打手同一個朝向，遊戲裡用同一個翻轉設定。

顏色：底色黑／水泥灰，重點只用鈉燈橘（皮外套的邊緣受光、金鍊反光）。
**不准用警報血紅 `#B22222`**（整款只給 Bruiser 的擴展 Wild）；塗鴉螢光色不上身。

### 身高與位置

腳底 y=1674、頭頂 y≈176，**跟打手完全一樣**（頭頂差不能超過 5%），人站上去才不會跳位。
手和雪茄最外緣離畫布左右兩邊至少 150px。

### 關節位置（依打手的身形重定，覆蓋第 5 節）

附件 `pose_guide.png` 已照這張表重畫（腳本原本照參考比例換算的那張改名為 `pose_guide.archetype.png`，只供對照）。

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

- 兩隻手都垂在身側、手肘微彎，**前臂和手離皮外套外緣至少 48px**。外套要直直垂、不要往外張，空隙才留得出來。
- 外套下襬屬於 `body.png`；手臂那兩張只有袖子和手。袖口、肩縫不要有拉鍊、鉚釘這類硬邊細節。

### 圖層（由後到前，檔名照範本）

`arm_l.png` → `body.png`（皮外套、T 恤、褲子、鞋，手臂拿掉後完整畫滿）→ `head.png`（頭、臉、脖子；金鍊畫在 body）→
`prop_cigar.png`（細雪茄）→ `dangle_smoke.png`（煙）→ `arm_r.png`。全部 1024×2048 同畫布原位。

### 英文提詞（每張前面都接這段共用開頭）

**共用開頭：**

```
Same game and same rendering as the attached reference image (full.png, the hooded street enforcer):
semi-realistic painted illustration, same line weight, same gritty texture, same single hard
sodium-orange street light from high on the upper left with long cool blue-grey shadows.
Palette: near-black and concrete grey, sodium orange (#F5893D) only as edge light and on metal.
NO blood red anywhere, no neon colours on the figure, no text, no logos.
1024x2048 canvas, the part in its exact position on the full figure, everything else fully transparent.
```

**full（先生一張完整的人，拿來對位與檢查）：**

```
Full figure, front view, standing: "the Kingpin", a broad-shouldered man in his forties, close-cropped
hair and short trimmed beard, cold and sure of himself, chin slightly raised, head turned a few degrees
toward the left of the image. Long black leather car coat to mid-thigh, open, hanging straight; plain
dark grey T-shirt; dark trousers; clean white sneakers. A thick fake-gold chain with the plating worn
off in places, two or three matching rings. A thin cigar in the corner of his mouth on the image's
right side, a thin wisp of smoke rising. Both arms hang at his sides with elbows slightly bent, hands
empty and clearly away from the coat (a visible gap of background between forearm and coat).
Feet at y=1674, top of head at y=176.
```

**body：** `The coat, T-shirt, chain, trousers and shoes ONLY, drawn complete as if the arms did not exist — the coat front and sides fully painted where the arms would cover them.`

**arm_r：** `ONLY his right arm (image left) in its coat sleeve, shoulder to fingertips, hanging with the elbow slightly bent; extend 40px of sleeve into the shoulder with a soft edge.`

**arm_l：** `ONLY his left arm (image right) in its coat sleeve, shoulder to fingertips, hanging with the elbow slightly bent; extend 40px of sleeve into the shoulder with a soft edge.`

**head：** `ONLY the head, face, hair, beard and neck; extend the neck 30px down under the collar. No cigar in this layer.`

**prop_cigar：** `ONLY the thin cigar, drawn whole, at the corner of the mouth position.`

**dangle_smoke：** `ONLY one thin wisp of smoke rising from the cigar tip, soft and semi-transparent, free of everything else.`

### 交件

放進 `wp/apps/TurfWar/design/_incoming/fg/`：PSD、`full.png`、六張圖層 PNG、`layers.json`（照 `layers.template.json` 填實際支點）。
背景可以是透明，或純洋紅 `#FF00FF`（我去背）。收到後我跑 `check_layered_art.py` → `build_layered_rig.py` → 動作表與閘門，
再接進遊戲（FG 轉場換人、FG 開場卡、cover 重跑）。

> 給接手的人：#1 這個原型**只有待機、沒有反應動畫**。中獎反應要另外設計，節奏借打手（#2）的 snap → hold → release，
> 幅度放在肩膀與外套下襬，不要讓垂下的手甩起來。


## 2026-10-11 完成記錄

新版 FG 角色已產出分層 PNG、PSD 與實測骨架，並接入遊戲。原始生成圖及提詞規格位於 design/_incoming/fg/source；可用 build_fg_cast.py、pack_fg_cast.py 重建。完整身體底圖含遮蔽部位，動畫與手臂間距檢查通過。FG 切換在黑幕中更换並预載入兩套角色。封面同時呈現 MG 與 FG，縮圖使用當前 MG。驗證紀錄在 design/qa/fg-20261011。
