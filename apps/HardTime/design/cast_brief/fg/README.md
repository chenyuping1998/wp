# Hard Time 角色分層需求單（姿勢：#2 扛球棒男）

> **先讀最後的「Hard Time 補充」**：角色是誰、修正後的關節位置、英文提詞、交件位置都在那裡，它覆蓋下面第 0、2、5 節的對應內容。

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

站姿，畫面左側的手舉到肩膀、把球棒扛在肩上（棒子從肩後往外斜出）；畫面右側的手自然垂下、手肘微彎。脖子掛鍊子，臉上的面罩／頭巾有一截會晃。

- 角色自己的右手（畫面左）：舉到肩膀握住道具
- 角色自己的左手（畫面右）：自然垂下、手肘微彎，手是空的

> 反應的力道在「垂下那隻手的上臂鼓起、扛棒那隻手的前臂收緊」，加上軀幹往前推（視差）。

## 1. 交件格式

- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **1024 × 2048** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。
- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。
- **腳底 y = 1875、頭頂 y ≈ 72**，水平置中於 x ≈ 512。上下至少留 40px 空白；**左右兩側（手、道具最外緣）到畫布邊至少 150px** —— 動作閘門要求擺動中仍留 40px，手離邊只有 60px 的話手臂幾乎不能往外張（Capo 的 Don 2026-09-28 因此只能做「手肘外張、前臂收回」）。
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
| `neck` | 616 | 358 |
| `chest` | 549 | 597 |
| `waist` | 509 | 914 |
| `hips` | 512 | 937 |
| `head_top` | 586 | 72 |
| `shoulder_r` | 458 | 448 |
| `elbow_r` | 274 | 719 |
| `wrist_r` | 168 | 507 |
| `shoulder_l` | 808 | 405 |
| `elbow_l` | 900 | 687 |
| `wrist_l` | 853 | 991 |
| `prop_bat`（掛點）| 166 | 442 |
| `dangle_chain`（掛點）| 615 | 417 |
| `dangle_mask`（掛點）| 543 | 213 |

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

## Hard Time 補充（2026-10-10，覆蓋上面第 0、2、5 節的對應內容）

### 是誰

**典獄長**（獄警隊長）——看守主角的人。主遊戲是雙臂交叉的老大囚犯；進免費遊戲（LOCKDOWN／RIOT／BREAKOUT）
轉場時換典獄長上場，FG 結束轉場時換回囚犯，兩人不會同時站在盤面旁。
（`ART_AUDIO_BRIEF.md` §1 原本寫「本作只有一個人」；2026-09-28 起每款都要兩個角色，典獄長就是那個說得通的第二人。）

- 五十多歲、壯、腰粗，灰色平頭，濃密的灰八字鬍，臉上有風霜和不耐煩。
- 深藍灰色獄警制服：長袖襯衫、肩章、**空白**的胸章與臂章（不要畫任何字或數字）、深色長褲、皮帶上一串鑰匙（畫在 body）、黑皮靴。
  頭戴有帽簷的制服大盤帽。
- 右手（畫面左）把**黑色警棍**扛在肩上，警棍往外斜上方伸出（不經過頭後面，離頭至少 60px）；左手（畫面右）自然垂下。
- 胸前掛繩上一支金屬哨子（懸空會晃）；右耳（畫面右）塞著無線電耳機，一條捲曲線垂到肩上（懸空會晃）。
- 身體正面，**頭微微轉向畫面左**——跟 `style_frame/full.png` 的囚犯同一個朝向，遊戲裡用同一個翻轉設定。

顏色：深藍灰制服、黑色皮件、鐵灰金屬，跟囚犯的卡其色分得開。
**不准用冷白偏青的光**（`#DCE8F0`／`#8FB4C8`，那是探照燈專用）；釦子、哨子用暗鐵色或舊黃銅，不要亮金。

### 身高與位置

腳底 y=1875、頭頂（含帽子）y≈72，**跟囚犯一樣**（頭頂差不能超過 5%）。
手、手肘、警棍最外緣離畫布左右兩邊至少 150px。

### 關節位置（依囚犯的身形重定，覆蓋第 5 節）

腳本照參考比例換算的那份（第 5 節）左手肘落在 x=900，超出 150px 安全邊界，軀幹也是斜的，**不要照它**。
附件 `pose_guide.png` 已照下表重畫（原本那張改名為 `pose_guide.archetype.png`，只供對照）。

| 關節 | x | y |
|---|---:|---:|
| `head_top`（帽頂）| 525 | 72 |
| `neck` | 525 | 400 |
| `chest` | 525 | 560 |
| `waist` | 525 | 900 |
| `hips` | 525 | 1040 |
| `shoulder_r`（畫面左）| 360 | 470 |
| `elbow_r` | 250 | 740 |
| `wrist_r` | 225 | 520 |
| `shoulder_l`（畫面右）| 690 | 470 |
| `elbow_l` | 790 | 750 |
| `wrist_l` | 770 | 1010 |
| `prop_bat`（警棍握點）| 220 | 455 |
| `dangle_chain`（哨子掛點）| 560 | 450 |
| `dangle_mask`（耳機線掛點）| 610 | 290 |

- 警棍尖端大約在 (175, 175)。
- 垂下的那隻手：前臂和手離身體至少 48px，不要碰到皮帶上的鑰匙。

### 圖層（由後到前，檔名照範本）

`arm_r.png`（扛警棍那隻手，含手掌）→ `prop_bat.png`（警棍，整支）→ `body.png`（制服、皮帶、鑰匙、褲子、靴子，手臂拿掉後完整畫滿）→
`arm_l.png` → `dangle_chain.png`（哨子與掛繩）→ `head.png`（頭、臉、帽子、脖子）→ `dangle_mask.png`（耳機捲曲線）→
`fingers_r.png`（握在警棍前面的手指）。全部 1024×2048 同畫布原位。

### 英文提詞（每張前面都接這段共用開頭）

**共用開頭：**

```
Same game and same rendering as the attached reference image (full.png, the prisoner in khaki):
semi-realistic painted illustration, same line weight, same matte cloth and rusty-metal texture,
same single light from the upper left. Palette: dark slate blue-grey uniform, black leather, dull
iron and old brass; NO cold white-cyan light or glow anywhere (that colour belongs to the searchlight
only), no gold shine, no text, no numbers, no logos on any badge or patch.
1024x2048 canvas, the part in its exact position on the full figure, everything else fully transparent.
```

**full（先生一張完整的人，拿來對位與檢查）：**

```
Full figure, front view, standing: a prison warden / guard captain in his fifties, heavy-set with a
thick waist, grey crew cut, thick grey moustache, weathered impatient face, head turned a few degrees
toward the left of the image. Dark slate blue-grey guard uniform: long-sleeved shirt with epaulettes,
BLANK chest badge and shoulder patch, dark trousers, belt with a ring of keys, black boots, peaked
uniform cap. His right hand (image left) rests a black nightstick on his shoulder, the stick angled up
and outward away from his head; his left arm (image right) hangs at his side, elbow slightly bent,
hand empty and clearly away from the body. A metal whistle on a lanyard hangs on his chest; a coiled
radio earpiece cord runs from his ear (image right) down to the shoulder. Feet at y=1875, top of the cap at y=72.
```

**body：** `The uniform shirt, belt, keys, trousers and boots ONLY, drawn complete as if the arms did not exist.`

**arm_r：** `ONLY his right arm (image left), shoulder to the palm, raised so the hand is at shoulder height holding a stick; NO fingers over the stick, NO stick; extend 40px of sleeve into the shoulder with a soft edge.`

**prop_bat：** `ONLY the black nightstick, drawn whole, at its position resting on the shoulder.`

**fingers_r：** `ONLY the fingers of the right hand that wrap over the front of the nightstick.`

**arm_l：** `ONLY his left arm (image right), shoulder to fingertips, hanging with the elbow slightly bent; extend 40px of sleeve into the shoulder with a soft edge.`

**head：** `ONLY the head, face, moustache, cap and neck; extend the neck 30px down under the collar. No earpiece cord in this layer.`

**dangle_chain：** `ONLY the whistle and its lanyard hanging on the chest, free of the body outline at the bottom.`

**dangle_mask：** `ONLY the coiled radio earpiece cord from the ear down toward the shoulder.`

### 交件

放進 `wp/apps/HardTime/design/_incoming/fg/`：PSD、`full.png`、八張圖層 PNG、`layers.json`（照 `layers.template.json` 填實際支點）。
背景可以是透明，或純洋紅 `#FF00FF`（我去背）。收到後我跑 `check_layered_art.py` → `build_layered_rig.py` → 動作表與閘門，
再接進遊戲（FG 轉場換人、FG 開場卡、cover 重跑）。


## 2026-10-11 完成記錄

新版 FG 角色已產出分層 PNG、PSD 與實測骨架，並接入遊戲。原始生成圖及提詞規格位於 design/_incoming/fg/source；可用 build_fg_cast.py、pack_fg_cast.py 重建。完整身體底圖含遮蔽部位，動畫與手臂間距檢查通過。FG 切換在黑幕中更换並预載入兩套角色。封面同時呈現 MG 與 FG，縮圖使用當前 MG。驗證紀錄在 design/qa/fg-20261011。
