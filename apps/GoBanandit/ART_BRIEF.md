# Go Banandit — 美術需求單

> 2026-09-30 第一版。畫風由使用者選定：**絲印大盜海報**（`art-direction.md` 目錄 #5 screenprint）。
> 流程：先做 **§10 風格測試**（6 張），通過後那組就是「風格定稿圖」，量出來的數字填進 §0 的閘門，
> 之後每一批交件都用那組數字驗，不憑印象。
> 舊的 Boomana 素材（礦坑、礦工猴、炸藥、厚塗符號）**一律不可沿用**，只沿用角色的骨架與動作。

---

## 0. 畫風鎖定（每一張圖都繼承這一節）

**畫風＋理由：** 1960 年代偷竊片海報的絲網印刷。大盜題材自己的媒材就是這種海報：
幾個油墨色塊疊印、剪紙般的輪廓、套色微微對不準、米色紙張。色彩策略＝**三個專色＋紙色，
香蕉黃保留給收集機制**。

### 技法規則（數字，不是形容詞）

| 規則 | 值 |
|---|---|
| 油墨數 | 3 個專色（深綠、磚紅、墨黑）＋紙色；疊印產生第 4、5 個色 |
| 輪廓 | **不畫描邊線**。形狀靠色塊邊緣分開（剪紙感）；墨黑只用在陰影塊與五官 |
| 陰影 | 只用「墨黑或深綠的一塊平塗陰影」，一個形體最多 2 個明度 |
| 漸層 | 0。任何漸層、噴槍、柔邊都算不合格 |
| 細節預算 | 只在焦點那 1/3（臉、手、袋口）；其餘大塊安靜色面 |
| 最小可讀細節 | 畫布邊長的 6%（眼睛、袋口繩結） |
| 光源 | 左上一個方向，全套一致；陰影塊一律落在右下 |
| 視角 | 正面或 3/4 正面，全套一致 |

### 色卡（生圖後由程式量化鎖色）

| 色 | hex | 角色 | 面積上限 |
|---|---|---|---|
| 紙色 | `#F2E8D0` | 底色、高光 | 不限 |
| 深綠墨 | `#1F5C4A` | 叢林、衣服、冷色面 | 45% |
| 磚紅墨 | `#D24A2C` | 大盜、警示、Scatter | 35% |
| 墨黑 | `#1E1B1A` | 陰影塊、五官、剪影 | 30% |
| 疊印棕（紅疊綠） | `#4E2E22` | 深陰影、木頭 | 20% |
| **香蕉黃（保留色）** | `#F4C21B` | **只給香蕉袋、收集、大獎** | 符號內 ≤ 40%；非收集相關素材 **0%** |

香蕉黃是這款遊戲的訊號：玩家看到黃色＝錢要進來了。**猴子、背景、框、按鈕都不准用黃色**
（包括香蕉以外的「金色」裝飾——金色本來就是 AI 預設味的第一名）。

### 明度階層（誰最搶眼）

1. 特殊符號：香蕉袋（唯一黃）、Scatter（大面積紅）、百搭大盜（紅＋黑面罩）
2. 高分 H1–H4：**每個一張色卡底**（見 §2），全彩
3. 低分 A K Q J 10：程式用字型排版，印在麻布標籤上，色少、明度低
4. 背景：無墨黑、彩度比符號低一截，大色塊

### 風格提詞（每一個提詞前面都貼這段）

```
screen printed 1960s caper movie poster illustration, three flat spot inks
(deep jungle green #1F5C4A, brick red #D24A2C, near-black #1E1B1A) on cream
paper #F2E8D0, inks overlap to make darker tones, cut-paper shapes with clean
hard edges, no outlines, one flat shadow shape per form, light from the upper
left, bold simplified graphic composition, large quiet colour areas, detail
only on the focal area
```

保留色要出現的素材（香蕉袋、收集特效牌）才在後面補：`plus a fourth spot ink, banana yellow #F4C21B, used only on {物件}`。

### 負面提詞（每一張都加）

```
yellow, gold, golden, outlines, line art, ink contour, gradient, airbrush,
soft shading, texture, halftone, grain, paper texture, misregistration,
3D render, CGI, octane, unreal engine, photorealistic, glossy, shiny,
specular highlights, metallic sheen, bloom, glow, lens flare, god rays,
volumetric light, depth of field, bokeh, sparkles, particles,
text, letters, numbers, watermark, signature, logo
```

（香蕉袋那幾張把 `yellow, gold, golden` 從負面拿掉。紙紋、網點、套色偏移**不要讓模型畫**，
程式會統一套，見下。）

### 程式負責、模型不負責的事

| 項目 | 由誰做 |
|---|---|
| 所有字：WILD、FREE SPINS、數值、A K Q J 10、按鈕字 | 執行期字型（見下）；模型**永遠不畫字** |
| 紙紋、套色偏移、油墨顆粒 | 一張共用顆粒圖＋固定 2px 偏移，由 `design/screenprint_finish.py`（待寫）統一套 |
| 鎖色 | 2× 尺寸量化到上表 6 色 → Lanczos 縮回，保留抗鋸齒（`asset-pipeline`） |
| 發光、閃光、粒子 | 執行期 FX（用紙色與香蕉黃，不用白光） |
| UI 圓鈕圖示 | 幾何繪製腳本（§6），不生圖 |

### 去背色

生圖背景一律用 **洋紅 `#FF00FF`**（色卡裡沒有，也不會吃到紙色）。**不要用白或灰底**——紙色會被當成背景挖掉。

### 字型

| 用途 | 字型 | 備註 |
|---|---|---|
| 標題、大獎牌、FREE SPINS | **Bungee** | 目錄 #5 建議；無 CJK，中日韓語系走 fallback 需測 |
| 數字（贏分、袋子數值） | **Anton** | 窄、粗、讀得快 |
| 內文（規則、付費表） | **Archivo** | |

### 風格定稿圖（2026-09-30 使用者核准）

- 路徑：`design/style_frame/`：`H1.png`（已重生為光頭、無雪茄）、`P.png`、`W.png`、`low_label.png`、`bg_base_crop.png`
- `mg_face.png` 已依 W 的米色臉、黑眼罩與缺牙特徵重生；正式角色另見 `design/cast_delivery/`
- `check_style.py`（六色卡）量測：

| 圖 | colors95 | soft | fit | 香蕉黃 |
|---|---:|---:|---:|---:|
| H1 | 12 | 8.6% | 97.9% | 0% |
| P | 24 | 10.7% | 96.2% | 14.6% |
| W | 17 | 11.0% | 97.0% | 0% |
| 低分標籤 | 3 | 4.9% | 99.1% | 0% |
| 背景 | 17 | 9.5% | 97.2% | 0% |

- **之後每批交件的閘門**：`--max-colors 36`（24×1.5）、`--max-soft 0.16`（16%）、`--min-fit 0.91`（91%）；
  香蕉黃只准出現在 P 與收集相關素材，其他一律 0%
- 定稿 200px 盤面縮圖：平均亮度 119、p10 28、<32 的暗部 23%（縮圖閘門另計，見 §11）

---

## 1. 角色（兩隻猴，一隻 MG、一隻 FG）

**動作沿用 Boomana**：骨架與動畫（待機 idle、歡呼 cheer、捶胸 chestbeat、點頭 nod、投擲 throwit、
縮一下 flinch、警覺 alert、瞄一眼 glance、晃動 flutter）不改。骨架的關節位置是**從各圖層的邊界框
讀出來的**，所以新角色必須照同一套切法交件：

- 畫布 **560 × 912**，腳底貼齊最下緣，正面站姿，重心在兩腳中間
- **24 個圖層、同名**（見 `design/cast_brief/layer_guide.png`；左邊是切塊框、右邊是站姿剪影
  `pose_silhouette_560x912.png` 可以直接墊在底下當姿勢參考）
- 每個圖層是**整張 560×912 的透明 PNG**（或一個 PSD，圖層名照舊），部件留在自己的位置
- 關節處要**重疊**：上臂蓋過肩膀 15–20px、前臂和上臂重疊、大腿蓋進褲腰——轉動時才不會露縫
- 手要**離開身體**：垂下的前臂離軀幹至少 30px，手不插口袋、不貼大腿（不然手臂轉動時會像沒骨頭）
- 平塗、無描邊（§0）：手臂彎曲時看不出網格變形

| 圖層群 | 圖層 |
|---|---|
| 頭 | `head_0_hair` `head_1_hair` `head_2_face` `head_3_ear` `head_4_hat` `head_5_decoration` |
| 軀幹 | `torso_0_trunk` `torso_1_decoration`～`torso_5_decoration` |
| 左臂／右臂 | `*_arm_0_upper_arm` `*_arm_1_forearm` `*_arm_2_hand` |
| 左腿／右腿 | `*_leg_0_thigh` `*_leg_1_calf` `*_leg_2_foot` |
| 道具（另交） | `prop_sack.png`：投擲動作丟出去的東西，從炸藥改成**香蕉袋**（約 160×160） |

`decoration` 圖層可以是空的透明圖（沒有對應配件就交空圖），但**名稱與數量要齊**，產生器才對得上。

### 1a. MG：大盜猴「Banandit」

- 黑猩猩，矮壯、手長。紅白橫條毛衣（磚紅＋紙色）、**黑色眼罩面具**、深綠平頂鴨舌帽
- 臉：**就是 W 百搭那隻**（`design/style_frame/W.png`）：米色臉＋深棕毛、黑色眼罩面具、缺一顆門牙的得意笑、左耳缺口。
  面具畫在 `head_5_decoration`，帽子在 `head_4_hat`，臉 `head_2_face` 只畫臉。
  第一次的 `mg_face.png`（紅綠臉、無面具）不採用
- 腰間繫一條麻繩（`torso_4_decoration`）
- 捶胸、投擲（丟香蕉袋）、歡呼都要好看——所以兩手空著
- **不能是任何一個付費符號的畫像**（W 百搭是他的臉特寫，這是唯一例外，見 §2）

### 1b. FG：把風兼司機「Lookout」

- **紅毛猩猩（母）**，高瘦、手臂更長。深綠飛行夾克、磚紅圍巾、額頭推著一副飛行護目鏡
- 臉：圓臉、半閉的冷靜眼神、嚼口香糖的側嘴
- 和 MG 的對比：矮壯 vs 高瘦、紅條紋 vs 深綠夾克、得意 vs 冷靜
- 同一套 §0、同一個光源、同一條腳底線，頭頂高度差在 5% 以內

### 1c. 交件後的流程（我做）

`design/extract_monkey_psd.py` → `design/generate_monkey_spine.mjs`（改成吃兩套圖層、輸出
`banandit` / `lookout` 兩個 skin）→ MG/FG 在轉場黑幕下換人。

---

## 2. 符號

所有符號 **1:1，512×512 生圖，交 256×256**，洋紅底。高分的色卡是符號本身的一部分（圓角方卡）。

| 符號 | 內容 | 色卡／主色 | 備註 |
|---|---|---|---|
| **W 百搭（大盜）** | 大盜猴的臉特寫：眼罩面具、咧嘴、帽子 | 磚紅圓形徽章底 | WILD 字由程式疊 |
| **P 香蕉袋** | 鼓鼓的麻布袋，袋口綁繩，袋面印一根香蕉的模板圖 | 紙色袋＋**香蕉黃**香蕉 | **數值由程式寫在袋子上**，袋面中間留一塊空白 |
| **S Scatter** | 圓形金庫門，中間是香蕉形狀的轉盤把手 | 大面積磚紅 | SCATTER 字不畫 |
| **H1** | 大猩猩老大：寬方臉、**光頭不戴帽**、深色西裝領＋紅領帶、眉骨一道疤；**不要雪茄**（菸草送審風險） | 磚紅色卡 | 最大、最重；平頂鴨舌帽是 W 大盜專屬，高分都不准戴 |
| **H2** | 長鼻猴開鎖手：大鼻子、耳邊別著聽診器 | 深綠色卡 | |
| **H3** | 狐猴小弟：大眼、條紋尾巴繞過畫面 | 疊印棕色卡 | |
| **H4** | 小獼猴扒手：戴過大的毛帽、手指比「噓」 | 紙色色卡＋墨黑剪影 | |
| **L1–L5**（A K Q J 10） | **不生圖**：程式用 Bungee 排字，印在一塊麻布標籤上（標籤圖生一張共用） | 深綠／墨黑字 | 見下 |

- **靠剪影分辨，不靠顏色**：四個高分是四種不同頭形（大猩猩方頭、長鼻猴大鼻、狐猴圓眼長尾、獼猴毛帽），
  縮到 70px 灰階也要認得出來
- 高分都是**不同的猴**，而且都不是 MG/FG 角色
- 低分標籤：生 **1 張**空白麻布標籤（紙色＋深綠縫線，無字，512×512 洋紅底），字由程式排；
  低分亮度與面積必須 **≤ 高分最小值**（§9 會量）
- 不准出現：武器、槍、刀、炸藥、真實品牌、錢幣符號（$）、"cash"/"money" 字樣

### 符號提詞（接在 §0 風格提詞後面）

- W：`close-up portrait of a grinning chimpanzee bandit wearing a black domino eye mask and a flat cap, one chipped front tooth, notched left ear, centred on a round brick-red badge, plain magenta #FF00FF background`
- P：`a plump burlap sack tied at the neck with rope, a single banana stencil printed on the front, empty flat area in the middle of the sack, plus a fourth spot ink banana yellow #F4C21B used only on the banana stencil, plain magenta #FF00FF background`
- S：`a round bank vault door seen straight on, the central handle shaped like a banana, rivets as simple circles, large brick-red shapes, plain magenta #FF00FF background`
- H1：`portrait of a heavy bald gorilla crime boss with a wide square face, a heavy brow with one scar across it, dark suit collar and red tie, no hat, nothing in his mouth, on a rounded brick-red card, plain magenta #FF00FF background`（定稿 H1 戴了和 W 一樣的鴨舌帽、叼點著的雪茄，重生）
- H2：`portrait of a proboscis monkey safecracker with a huge drooping nose, a stethoscope hanging around his neck, on a rounded deep-green card, plain magenta #FF00FF background`
- H3：`portrait of a wide-eyed ring-tailed lemur lookout, striped tail curling around the frame, on a rounded dark brown card, plain magenta #FF00FF background`
- H4：`portrait of a small macaque pickpocket in an oversized knitted beanie, one finger raised to his lips, near-black silhouette shapes on a rounded cream card, plain magenta #FF00FF background`
- 低分標籤：`a blank rectangular burlap cloth label with deep-green stitched border, flat, no text, plain magenta #FF00FF background`

---

## 3. 中獎與收集的疊層

- **收集飛行物**：香蕉袋數值被大盜吸走時，飛過去的是「一小串香蕉」剪紙片（生 1 張 128×128，
  黃＋紙色，洋紅底）；軌跡、拖尾由程式做
- 中獎框：程式畫（紙色 2px 雙線框＋2px 偏移的紅色套印影），不生圖

## 4. 盤面外框

- 是**一個香蕉貨運木箱的正面**：深綠木板、墨黑鐵角、箱板上的模板噴字位置留空（字由程式噴）
- 交 `frame_edge.png`（1280×1280，中間 5×4 盤面區完全透明）與 `frame_bg.png`（盤面底板，紙色＋極淡的深綠木紋塊）
- 內框量測：透明區必須完整蓋住 5×4 格，交件後我量 alpha 邊界

## 5. 轉場與大場面

- **FG 觸發轉場**：Boomana 是炸藥爆炸，這款改成**「探照燈掃過＋鐵捲門拉下」**：
  機制上要做到的事＝在黑幕下換盤面、換角色、換背景。畫面：
  - `shutter.png`：一片鐵捲門（深綠橫條＋墨黑縫），1920×1080，**不要畫陰影**（程式自己畫接縫陰影）
- **FG 開場**（遊戲裡最大的場面）：大盜與把風站在一張「行動計畫」海報前，計數器砸上去。
  - `fs_plate.png`：一張紙色海報牌（1000×600），中間留空給程式寫 FREE SPINS 與轉數
- **升級（大盜計數到 4/8/12）**：牌子由程式做，沿用 `fs_plate.png`，倍率字由程式寫

## 6. UI

- **Buy Bonus 按鈕**（下注列常駐那顆）：`buybonus_plate.png`，一塊麻布袋造型的按鈕底（無字），尺寸待我量 `ButtonBuyBonus.svelte` 後補
- **Buy 選單卡片**：兩張卡的底圖 `card_bonus.png` / `card_superbonus.png`（600×840，無字）：
  - bonus（100×）：一個香蕉袋
  - superbonus（150×）：兩個香蕉袋＋一個「×2」位置留空（程式寫）
- **圓鈕圖示**（選單、付費表、資訊、設定、聲音、自動、＋／−）：**不生圖**，由幾何腳本畫細線圖示，
  筆畫≈畫布 7–8%，孔洞保持打開
- **按鈕底板** `button_plate.png` / `spin_plate.png`：紙色圓片＋深綠套印環（無字）
- 共用 UI（設定、彈窗）的顏色 token 由我在程式裡換成 §0 色卡

## 7. 背景（1920×1080，無墨黑、彩度低於符號）

| 檔名 | 內容 |
|---|---|
| `bg_base.png` | 黃昏的香蕉種植園與貨運倉庫：大塊深綠叢林剪影、磚紅夕陽、倉庫屋頂 |
| `bg_feature.png` | 夜裡的倉庫內部：成排木箱、兩道探照燈光束（用紙色的平塗梯形，不是發光） |

## 8. 字與系統字型稽核

- 圖裡**沒有任何字**。WILD、SCATTER、FREE SPINS、數值、大獎等級全部執行期用 Bungee／Anton 寫
- 程式端要清掉 Boomana 的字型與色（金色漸層字 `GoldText`、礦坑色 uiTheme）——我做

## 9. 驗收清單（交件後我跑）

- [ ] 全套符號（含 W、S、P、低分標籤）在定稿圖的 `check_style.py` 閘門內
- [ ] AI 味清單（180px／70px）：無光澤、無發光、無字、無假網點、數量對、同一光源
- [ ] 灰階後高分→低分明度階梯正確
- [ ] 香蕉黃只出現在 P、收集、大獎
- [ ] 角色 24 圖層齊、名稱對、關節重疊足夠，骨架套上後九個動作都正常
- [ ] 縮圖 200px 看得出是「猴子大盜」
- [ ] 沒有任何 Boomana 的礦坑／炸藥／厚塗素材殘留

## 10. 風格測試（2026-09-30 已完成，定稿見 §0；H1 與 MG 臉重生）

1. H1（大猩猩老大）
2. P（香蕉袋，含黃）
3. W（大盜臉）
4. 低分麻布標籤（空白）
5. `bg_base.png` 左上 1/4 的區域（可以只生 960×540）
6. MG 大盜的 `head_2_face` 單一圖層

我會把它們合到真的盤面上截圖、做 200px 縮圖、跑 `check_style.py`，你點頭後那組就是定稿圖。

## 11. 縮圖

- BG：自己的主視覺（不要拿遊戲背景直接壓暗），紙色系、明亮；200px 時平均亮度 ≥ 80
- FG：**只有大盜猴一個**（全身或半身），真正的透明 PNG，不含標題字
