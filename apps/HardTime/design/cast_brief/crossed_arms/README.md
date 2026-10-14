# Hard Time 角色分層需求單（姿勢：#5 雙臂交叉）

> **先讀最後的「Hard Time 補充」**：同一個囚犯、關節位置、鬍子換成毛巾、英文提詞都在那裡。它覆蓋下面第 5 節的關節表。

由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **Hard Time 自己的美術需求**；
這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），
**不可描、不可取樣任何參考遊戲的圖**。

附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。

## 畫風（生圖前先讀）

畫風：**半寫實 3D 渲染**（`render`）

風格基準圖（每次生圖都附上，成品跟它比）：`style_frame/full.png`

### 本款畫風鎖定（出自 `../../../ART_AUDIO_BRIEF.md` §0，原文照貼）

#### 0. 保留色（先讀這條，它約束後面每一條）

**探照燈的光色是本作唯一的訊號色，任何其他地方一律不准用。**

Capo Nostra 把警報紅鎖給 Tommy Gun 專用，後來在免費遊戲層級名上發現同一個紅，
被判定為「第二個東西穿了警報色」而必須改掉——因為那會破壞「紅色＝Tommy Gun」
這個唯一讀法。本作繼承同一條紀律：探照燈是整台機器唯一的機制，它的光色必須
一看就知道是它。

建議：冷白偏青的探照燈光（例如 `#DCE8F0` 光芯、`#8FB4C8` 光暈）。監獄場景其餘
部分走水泥灰、鏽鐵、卡其囚服的暖濁色，讓冷光在其中唯一地「亮」起來。

### 分層時的畫風規則

1. **每一張生圖提示詞前面都貼本款 §0 的畫風段落**，並附上風格基準圖；只寫「角色是誰、穿什麼」的提示詞，會得到模型預設的亮面寫實樣子。
2. **邊緣要有反鋸齒**：在 2 倍畫布（2048 × 4096）上畫或量化色盤，再用 Lanczos 縮回交件尺寸。沒有反鋸齒的純色塊，網格一轉就出現鋸齒（驗收會擋：輪廓半透明 < 50%）。
3. 圖裡不能有任何文字（布章、刺青、招牌）：要字的地方留空白底板，字由程式或字型處理。
4. 光源方向、視角跟符號與背景一致（照 §0）。
5. 這是模型預設、AI 感最重的畫風。全身高光方向一致、只有一個光源；不要全身都是金屬亮面。
6. 跟符號放一起比：質感、光向、飽和度要跟 §0 的風格基準圖同一套。

---

## 0. 姿勢

站姿，雙臂交叉在胸前；下巴有鬍子（或其他從下巴垂下的東西）。

- 角色自己的右手（畫面左）：交叉在胸前
- 角色自己的左手（畫面右）：交叉在胸前

> 反應只有 0.7 秒、幾乎沒有停頓，讀起來像「抖一下」。雙臂交叉擋住胸口，胸口仍要完整補畫。

## 1. 交件格式

- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **1024 × 2048** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。
- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。
- **腳底 y = 1773、頭頂 y ≈ 172**，水平置中於 x ≈ 541。四周至少留 40px 空白（動作會往外甩）。
- `l`／`r` 一律指**角色自己的左／右**：正面角色的 `arm_l` 在畫面**右邊**。

## 2. 圖層（由後到前）

| # | 檔名 | 內容 | 要點 |
|---|---|---|---|
| 1 | `body.png` | 軀幹＋骨盆＋雙腿＋鞋，一整張 | 腰、膝不切。被手臂擋住的軀幹要**完整畫出來**，就像手臂不存在一樣。前胸、背側邊緣畫滿。 |
| 2 | `arm_r.png` | 角色自己的右手（畫面左），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 交叉在胸前，另一隻手臂的前後照這張表的順序。 |
| 3 | `arm_l.png` | 角色自己的左手（畫面右），從肩膀到指尖一整張 | 手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。 交叉在胸前，另一隻手臂的前後照這張表的順序。 |
| 4 | `head.png` | 頭、臉、頭髮／帽子、脖子 | 只在領口切一刀。脖子往下多畫 **30px** 伸進衣領底下。臉、髮際不要再分層。 |
| 5 | `dangle_beard.png` | 鬍子（從下巴垂下，兩節會晃） | 懸空、四周留透明，一件一層。可以換成你們自己的東西，只要掛在同一個位置。 |

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
| `neck` | 466 | 433 |
| `chest` | 500 | 630 |
| `waist` | 521 | 933 |
| `hips` | 541 | 940 |
| `head_top` | 469 | 172 |
| `shoulder_r` | 153 | 432 |
| `elbow_r` | 31 | 759 |
| `wrist_r` | 460 | 774 |
| `shoulder_l` | 731 | 511 |
| `elbow_l` | 890 | 845 |
| `wrist_l` | 676 | 785 |
| `dangle_beard`（掛點）| 469 | 358 |

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

## Hard Time 補充（2026-09-27，覆蓋上面第 0、2、5 節的對應內容）

### 是誰

**同一個囚犯**，只換姿勢：灰白後梳頭髮、嚴肅中年臉、卡其囚服、胸口口袋上**空白**的號碼布標（不要畫數字）。
生每一張都附上 `style_frame/full.png`（現在的他），臉、服裝、質感、光向照它。

姿勢氣質：**雙臂交叉、下巴微抬、嘴角一點冷笑**——「老大進去了還是老大」。身體正面、頭微微轉向畫面左邊（盤面那側）。

### 關節位置（量自現在的骨架，肩、頸、胯不動）

| 關節 | x | y | 說明 |
|---|---:|---:|---|
| `neck` | 537 | 427 | 同現在 |
| `chest` | 537 | 535 | 同現在 |
| `hips` | 537 | 1053 | 同現在 |
| `shoulder_r`（畫面左）| 364 | 486 | 同現在 |
| `elbow_r` | 318 | 770 | 上臂沿身體側邊往下，手肘略往外 |
| `wrist_r` | 640 | 705 | 前臂橫過胸前，手掌塞在另一隻上臂下 |
| `shoulder_l`（畫面右）| 717 | 486 | 同現在 |
| `elbow_l` | 765 | 770 | 同上，對稱 |
| `wrist_l` | 430 | 690 | 前臂橫過胸前、**疊在上面**，手掌搭在另一隻上臂上 |

- 前後：**角色自己的左前臂（畫面右來的那隻）在上面**，右前臂在下面——對應圖層順序 `arm_r` → `arm_l`。
- 兩隻手肘外側要看得到一點背景，不要整條手臂黏進軀幹輪廓裡。

### 晃動物：鬍子 → 毛巾

他沒有鬍子。改成**一條舊的灰白毛巾搭在畫面右邊那側肩膀上**，一端垂到胸口側邊、在手臂外側，不擋住交叉的前臂。
檔名改成 `dangle_towel.png`，掛點約 (700, 470)。

### 圖層再說一次

`body.png`（手臂拿掉後的完整胸口與囚服，口袋布標空白）→ `arm_r.png` → `arm_l.png` → `head.png` → `dangle_towel.png`，
全部 1024×2048 同畫布原位。腳底 y=1773、頭頂 y≈172 不變，人才不會在畫面上跳位。

### 英文提詞（每張前面都接這段共用開頭）

**共用開頭：**

```
Same prisoner as the attached reference image (full.png): stern middle-aged man, grey slicked-back
hair, khaki prison uniform shirt and trousers with a BLANK cloth number patch above the chest pocket
(no digits, no text). Match its rendering exactly: semi-realistic painted illustration, same line
weight, same muted khaki / concrete-grey palette, single light from the upper left, matte cloth.
Front view, standing, feet at the same positions as the reference. 1024x2048 canvas, the part in its
exact position on the full figure, everything else fully transparent. No glow, no cold white-cyan
light anywhere (that colour belongs to the searchlight only), no text.
```

**full（先生一張完整的人，拿來對位與檢查）：**

```
Full figure: arms folded across the chest — his right forearm underneath, his left forearm on top
with the hand resting on the right upper arm; elbows slightly out from the body. Chin raised, faint
cold smirk, head turned a few degrees toward the left of the image. An old grey-white towel hangs over
the shoulder on the image's right side, one end falling down the outside of that arm.
```

**body：** `The torso, hips, legs and shoes ONLY, drawn complete as if the arms did not exist — the whole shirt front, pocket and blank patch fully painted.`

**arm_r：** `ONLY his right arm (image left), shoulder to fingertips, folded across the chest as in the full figure; extend 40px of sleeve into the shoulder with a soft edge.`

**arm_l：** `ONLY his left arm (image right), shoulder to fingertips, folded across the chest on top of the other forearm; extend 40px of sleeve into the shoulder with a soft edge.`

**head：** `ONLY the head, face, hair and neck; extend the neck 30px down under the collar.`

**dangle_towel：** `ONLY the towel hanging over the shoulder on the image's right side, loose and free of the body outline.`

### 交件

放進 `wp/apps/HardTime/design/_incoming/crossed_arms/`：`full.png`、`body.png`、`arm_r.png`、`arm_l.png`、`head.png`、`dangle_towel.png`。
背景可以是透明，或純洋紅 `#FF00FF`（我去背）。
