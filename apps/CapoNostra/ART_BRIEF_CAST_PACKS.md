# Capo Nostra 人物：照 Hacksaw 動作庫完全複製（兩版並做）— 美術需求

2026-09-18 開。取代 `ART_BRIEF_CAST_SPINE.md`（那份是「自己寫關鍵幀」的做法，已停用）。

> 🛑 **整份停用（2026-09-20）。** 使用者看過 A 版接上原始關鍵幀的 GIF 之後：
> 「完全不行，重來，回到類似 hot miami 的動態」。**切層／動作庫這條路整條收掉**，
> 角色回到單張插畫 + 蒙皮網格（`src/game/castMotion.ts`），動作照 Hot Miami 的寫法重做。
> 這份只作存查。做過的東西與踩過的四個坑搬到
> `design/_legacy_assets/cast_layers_spine_20260918/`，入口是那裡的 `STOPPED.md`。
> 下面所有 `design/cast_layers/...` 的路徑都要改讀那個資料夾。

> ⚠ **B 版（`miami_main_guy`）已停做（2026-09-20，使用者決定）。**
> 一張圖都沒生就停了 —— 停的原因是需求本身組不起來，不是生圖生壞了，詳見
> [§B 版為什麼停](#b-版為什麼停)。**只做 A 版**；B 版真正想要的「中獎反應」
> 改走重定向，見 [§中獎反應改走重定向](#中獎反應改走重定向)。

| 版本 | 複製對象 | 有的動作 | 圖數 | 狀態 |
|---|---|---|---|---|
| **A 版** | `miami_boss` | 待機 6.7 秒（全身擺、呼吸、雪茄煙） | 7 張 | 圖已交，`--checkart` 未過 |
| ~~B 版~~ | ~~`miami_main_guy`~~ | ~~待機 8 秒＋中獎反應 1 秒~~ | ~~14 張~~ | **停做** |

**姿勢和比例都照原版**，所以 Capo 會變成大頭的卡通比例（頭約佔身高 1/4），
跟現在的 `full.png` 不一樣，這是刻意的。

參考檔都在 `design/cast_layers/ref/`：

- `*_pose.png`：左欄是**要畫的姿勢**（骨架），右欄是**每一塊零件的位置和大小**。**生圖前後各對一次。**
- `*_placeholder.gif`：用色塊代替美術的動作預覽。
- `*_pose_numbers.md`：實測的骨頭角度和長度。
- `*_spec.md`：每一層的尺寸和長寬比。

---

## 共通規則（兩版都一樣）

1. **一個檔案只放一個零件**，透明背景，檔名**完全照下表**（大小寫要一樣）。
2. 零件的**角度、大小、留白都不用對**：工具會量輪廓自動擺正、縮放。
3. **長寬比一定要對**：每一層的輪廓長邊／短邊要接近表上的數字。
   拉長或變胖到 1.3 倍就會被擋下來。
4. **該直的不要畫彎**：例如一整條手臂的彎折角度要照姿勢圖，不要自己加彎。
5. 被別的零件蓋住的地方**要畫完整**：身體要畫出手臂後面、頭後面的布料。
   零件接頭處多畫一截塞進去。
6. 零件之間**不要畫投影**。
7. 畫風：現在 Capo 的厚塗寫實風格可以保留，但**描邊清楚、輪廓乾淨**比較好切。
8. 不需要的零件，放一張**全透明的 PNG**（1×1 就可以），工具會當成刻意留空。

角色本身不變：50 多歲黑幫老大、三件式深炭色細條紋西裝、白圍巾、懷錶金鍊、金戒指。

---

## A 版：`miami_boss`（放 `design/cast_layers/boss/`）

### 姿勢（照 `ref/miami_boss_pose.png` 左欄）

- 正面站直，身體幾乎垂直，胸口往畫面左邊微傾（約 9°）。
- **畫面左邊那隻手**：上臂往下、手肘略往外張，前臂往身體內收，
  **手插進褲子口袋**（手掌蓋在口袋位置）。
- **畫面右邊那隻手**：整條直直垂在身側，手掌自然下垂、微向內。
- **雪茄叼在嘴上**（不是拿在手上），朝畫面左下方。
- 兩腿幾乎並攏直立。
- 頭大：頭（含脖子）約佔身高 **24%**。

### 圖層

| 檔名 | 內容 | 佔身高 | 長寬比 |
|---|---|---|---|
| `ch3_body2.png` | **身體＋兩條腿＋鞋**：外套、馬甲、襯衫、領帶、圍巾、錶鍊。**不含頭、不含兩隻手臂** | 87% | 2.0 |
| `ch3_arm_l.png` | 畫面左邊**整條手臂**（肩到手，手是插口袋的形狀） | 62% | 3.3 |
| `ch3_arm_r.png` | 畫面右邊**整條手臂**（肩到手，直直垂下，很瘦長） | 43% | 5.3 |
| `ch3_head.png` | 頭＋頭髮＋脖子（脖子往下多畫一截塞進領口） | 24% | 1.6 |
| `Cigg.png` | 雪茄（含火光頭），很短小 | 3% | 3.9 |
| `smoke.png` | 一團煙（柔邊、半透明灰白、長條狀） | 8% | 3.4 |
| `smoke2.png` | 另一團形狀不同的煙 | 10% | 3.4 |
| `ch3_pocket__ch3_body2.png` | **口袋蓋片**：左腿褲子口袋那一小塊布，蓋在插口袋的手上面 | 13% | 2.0 |
| `ch3_glasses.png` | 原版戴墨鏡。**Capo 不戴 → 放全透明 PNG** | — | — |

---

## ~~B 版：`miami_main_guy`（放 `design/cast_layers/mainguy/`）~~ —— 已停做

<a name="b-版為什麼停"></a>
### B 版為什麼停

2026-09-20 把 `packs/miami_main_guy.motion.json` 拆開量過，**下面整段的需求做不到**，
四個原因都是結構性的、跟美術品質無關：

1. **15 個 slot 裡有 13 個原本是加權網格**（`weighted: true`）。原版的輪廓是骨頭帶著
   頂點變形出來的；換成一張平面四邊形貼圖只能是近似，一動輪廓就跑掉。
   這跟 A 版 `--checkart` 過不了是**同一個原因**，不是 A 版生圖生壞了。
2. **五個 slot 是 `len_synthetic`** —— 骨長是推出來的、沒有真實軸向，`artfit` 的
   自動擺放在這些層上不成立。而它們**全部集中在臉**：
   `guy_head`、`guy_head_light`、`Glasses`、`lenses`、`lenses2`。
   （對照 A 版：boss 也有 16 個 `len_synthetic`，但全部集中在**煙**，
   角色本體 `ch3_arm_l/ch3_arm_r/ch3_body2/ch3_head/Cigg/ch3_pocket` 都有真的
   `shape_anchor`。所以 A 版組得起來，B 版的模糊直接落在臉和武器上。）
3. **`bat` 的兩個 slot 都是 `auto_fit: false`**，一定要人工填 `joints.json` 座標。
4. **機器導出的 `ref/miami_main_guy_spec.md` 自相矛盾**：`body.png` 同時列成
   522×959 和 179×209、`arm_r.png` 同時是 228×654 和 180×444。導出時沒有處理
   「同一個 attachment 出現在多個 slot」，所以重複 slot 各印了一行 ——
   照著那張表畫的人不可能畫對。

打光層（`body_lights` / `guy_head_light` / `bat_highlight` / `arm_r2`）**不是**停做的原因：
`motionlib.py` 的 `<slot>__<att>.png` 修補本來就支援它們，下表也已經照那個命名列了。
難的是它們要跟同一塊**變形過的**網格逐像素對齊，而那又回到第 1 點。

<a name="中獎反應改走重定向"></a>
### 中獎反應改走重定向

B 版唯一 A 版沒有的東西是 **1 秒的中獎反應**。那要的是 `miami_main_guy` 的**動作**，
不是它的切層 —— 所以改成把反應的骨骼通道重定向到 **boss 的骨架**上，用 A 版已經交的
七張圖播。工具與覆蓋率見 `design/cast_layers/_hacksaw_motion/`。

---

### 以下為停做前的原需求，僅供存查


### 道具要先決定

原版右肩扛的是**球棒**。建議 Capo **也扛球棒**：

- 這是《鐵面無私》裡 Al Capone 的經典形象。
- Hot Miami 就是扛球棒過審的。
- 道具的長寬比要 **7.5**，細長的手杖（約 20:1）會被比例檢查擋下來，球棒剛好符合。

（`ART_BRIEF.md` 原本寫「不拿武器」，如果你不要球棒，要換一個同樣粗細比例的長條道具，
例如收起來的粗柄長傘。）

### 姿勢（照 `ref/miami_main_guy_pose.png` 左欄）

- 四分之三側身，**上半身往畫面右邊傾**（胸口約 16°），頭擺正。
- **畫面左邊那隻手**：手肘朝左下，前臂往**外上方**舉，**手在肩膀高度、身體外側握住球棒握把**
  （手比手肘更靠外，不是收在胸前）。
- **球棒斜扛在肩上**：從左手的握把往畫面右上方延伸，經過脖子後方。
- **畫面右邊那隻手**：整條垂在身側，手掌自然下垂。
- 胸前一條**金鍊**（Capo 可以畫成懷錶金鍊掛在胸前）。
- 頭大：頭約佔身高 **27%**。

### 圖層

| 檔名 | 內容 | 佔身高 | 長寬比 |
|---|---|---|---|
| `body.png` | **身體＋兩條腿＋鞋**，不含頭、不含兩隻手臂 | 90% | 2.0 |
| `guy_head.png` | 頭＋頭髮＋脖子 | 27% | 1.6 |
| `arm_r.png` | 畫面右邊**整條手臂**（垂下，含手） | 61% | 3.1 |
| `arm_l.png` | 畫面左邊的**上臂＋前臂**（肘朝下、前臂往上折），**不含手** | 31% | 1.5 |
| `hand_l.png` | 左手的**手掌後半**（握把在它前面） | 12% | 1.3 |
| `fingers.png` | 左手**包住握把的手指**（蓋在球棒前面） | 12% | 1.1 |
| `bat.png` | 球棒整支 | 67% | 7.5 |
| `chain.png` | 胸前金鍊 | 15% | 2.1 |
| `Glasses.png` | 原版是墨鏡框。**Capo 不戴 → 全透明** | — | — |
| `lenses.png` | 墨鏡鏡片。**不戴 → 全透明** | — | — |

**中獎反應的打光層**：中獎時這幾層會用「加亮」的方式閃一下，這是反應好看的主因。
每一張都是**對應零件的受光邊緣**，只畫亮的部分（暖白或金色），其他全透明：

| 檔名 | 內容 | 佔身高 | 長寬比 |
|---|---|---|---|
| `bat_highlight__bat.png` | 球棒的高光邊 | 67% | 7.5 |
| `body_lights__body.png` | 胸口到領口一帶的受光面 | 20% | 2.0 |
| `arm_r2__arm_r.png` | 右手臂的受光邊 | 42% | 3.1 |
| `guy_head_light__guy_head.png` | 頭部的受光面 | 20% | 1.6 |

---

## 生圖建議

**先生一張完整的全身圖**（照上面的姿勢），確定長相和比例後，
再用那張當參考圖，一次拆一個零件出來（image-edit）。這樣每一塊才會是同一個人。

全身圖提詞（英文，A 版）：

```
Full-body character illustration of a 1930s mafia boss in his fifties, heavy
build, charcoal pinstripe three-piece suit, white silk scarf, gold pocket-watch
chain, gold ring. Stylised proportions with a LARGE HEAD, about one quarter of
total height. Standing upright facing the viewer. His right arm (on the left of
the image) hangs with the elbow slightly out and the HAND TUCKED INTO THE
TROUSER POCKET. His left arm (on the right of the image) hangs straight down at
his side, hand relaxed. A cigar held IN HIS MOUTH, pointing down to the left.
Legs straight and close together. Clear gaps between arms and torso.
This is a specified pose: do NOT change it into a symmetric or standard pose.
Painterly semi-realistic rendering, clean readable outline, transparent
background, full body including shoes, no ground shadow.
```

全身圖提詞（英文，B 版）：

```
Full-body character illustration of a 1930s mafia boss in his fifties, heavy
build, charcoal pinstripe three-piece suit, gold chain across the chest.
Stylised proportions with a LARGE HEAD, about one quarter of total height.
Three-quarter view, upper body leaning to the right of the image. His right arm
(on the left of the image) is bent with the elbow pointing down and out, the
forearm raised outward, the hand OUTSIDE the body at shoulder height gripping
the handle of a wooden baseball bat; the bat rests diagonally across his shoulders behind his neck, pointing up
to the right of the image. His other arm hangs straight down at his side.
This is a specified pose: do NOT change it into a symmetric or standard pose.
Painterly semi-realistic rendering, clean readable outline, transparent
background, full body including shoes, no ground shadow.
```

拆零件（每一層改中間那句）：

```
Using the reference image, output ONLY <the torso and legs, with the head and
both arms removed and the suit fabric behind them painted in completely>.
Same character, same lighting and style. Transparent background.
```

負面提詞（全部加）：
```
symmetric pose, arms against body, background, ground shadow, drop shadow,
extra limbs, different face, text, watermark
```

---

## 交件

```
design/cast_layers/boss/      A 版 9 個檔（含 1 張全身圖 full.png 當參考）
design/cast_layers/mainguy/   B 版 14 個檔（含 full.png）
```

可以先交一版。

## 我收到之後會做的事

1. 逐層檢查：零件對不對、長寬比、有沒有畫彎。沒過的會列出來，只要重生那一張。
2. 證明姿勢鎖住：每個關節都落在原版骨頭上（`--verify-pose`）。
3. `Cigg.png`、`bat.png` 這兩層工具沒辦法自動判斷方向，我會手動標關節位置。
4. 接原始關鍵幀，出 A 版待機、B 版待機＋中獎反應的動畫給你並排看。

⚠ 原始關鍵幀是 Hacksaw 的資料，**這一輪只做評估用，不打包出貨**。選定之後再決定正式版怎麼做。
