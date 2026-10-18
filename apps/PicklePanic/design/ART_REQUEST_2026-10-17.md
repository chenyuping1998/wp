# Pickle Panic — 退件 5.3 後的美術需求單（2026-10-17）

2026-10-18 latest repair: F–H implemented and verified (quiet tile, 894x200 phone tickets, narrow bottom-anchored rays). Print theme now maps base_ticker to the actual ticket sprite. H4 middle spear rotates independently +/-0.22 rad. Steam 1/5/6 soft: 20.7/20.8/29.9%; FG wall peak local contrast: 5.31%; tile inner luminance range: 5.04%. Nine UI/steam style gates pass. Production build passes with 15 existing type diagnostics, no new errors; review tags: 0 FAIL / 8 WARN (7 retired assets and existing portrait sizing reminder). Alpha/atlas audits pass. Local MG/FG, 375x812 tickets, EPIC/MAX and H4 book preview inspected with no observed console errors. Evidence: design/qa/review_1018/. Originals and exact prompts: design/source/review_1018/prompts_full.json. Package: /Users/stone/stake-engine/upload/PicklePanic/, including current 10/17 cover and thumbnail. Math unchanged. Platform NOT updated. Three-unfamiliar-human H4 recognition and real platform/touch-device checks remain outstanding.

Earlier audit/history below is superseded by the repair results above.

**10-18 逐項補查：尚未全部驗收完成。** 素材已接入，但上一輪檢查漏掃蒸氣圖：`door_steam_1/5/6_v2.png` 的 soft 分別為 42.4%／40.0%／47.4%，超過本單 38% 上限。H4 三條已有獨立圖層，但 `LayeredSymbol.svelte` 的 `spear_middle` 旋轉仍為 0，只有左右條擺動；三名陌生觀者的 70px 辨識亦未做。FG 右壁既有局部對比量測峰值 9.09%（25px 平滑參照法），因此不能宣稱 ≤8% 嚴格目標已驗收通過。B 服裝與 D 外框的數值檢查通過；279 個打包檔案 hash 全部正確，27 張／項新素材與來源一致，平台未於本任務更新。下列「實作交付」只表示已接入，不代表以上未通過項目已完成。

**10-17 A–E 實作交付**：H4 分層重畫、FG 紅色廚師背心（軀幹／買特色／砍牌分層與合成圖／MAX 招牌／封面）、全部門零件與大徽章、搪瓷外框、MG/FG 低對比牆面均已接入。原稿、提詞集與舊檔在 `design/source/review_1017_ae/`；驗證在 `design/qa/review_1017_ae/`。H4 的「三名陌生觀者辨識」尚待真人執行；實作不宣稱此項已完成。這批未上傳或發佈至平台。

審核標籤：**Low quality assets／Inconsistent art style／Poor animations**（截圖 `design/qa/review_1017/reviewer_tags.png`）。

本單只列**要重畫**的東西。程式能處理的動畫與介面問題已在 10-17 改掉（見文末），不用再做。
畫風、色卡、量測閘門照舊：`ART_BRIEF.md` §0（粗墨線美式地下科幻漫畫、外線約內線 2 倍、平塗兩色調＋墨黑、無漸層無 glow），新圖閘門 colors95 ≤ 140、soft ≤ 38%、palette-fit ≥ 60%。
**檔名、畫布尺寸、軸心、九宮 inset 一律不變**，交件後直接覆蓋就能上，不用改程式。原檔留 `*_pre1017.png`。

## 判斷依據：哪些東西跟其他東西不是同一套

把全遊戲畫面並排看，現在有三種畫法混在一起：

| 畫法 | 出現在 | 結論 |
|---|---|---|
| 粗糙乾筆印刷漫畫（主流） | 背景、圖騰、兩位角色、大獎五階、Logo | 基準，保留 |
| 乾淨向量卡通、飽和平塗 | 換場門（紫鐵皮＋黃黑警示條）、門中央徽章 | **重畫**（C） |
| 粗獷塗鴉、高彩亮黃 | 盤面外框（裂紋黃框） | **重畫**（D） |

另外兩項是「看了會被扣品質」的單件問題（A、B），一項是背景沒畫完的區塊（E）。

---

## 優先順序

| 級 | 項目 | 為什麼 |
|---|---|---|
| P0 | **A. H4 醃黃瓜條重畫** | 三根尖條從一點扇形張開，70px 盤面上看起來像**大麻葉**；審核與玩家第一眼都會誤讀 |
| P0 | **B. FG 女廚師上衣** | 上身裸露且畫了胸部，搭配細長比例，讀起來粗糙又敏感；所有出現她的圖都要一起換 |
| P1 | **C. 換場門改成主流畫法** | 全遊戲最大的一個畫面，畫風跟背景不同一套 |
| P1 | **D. 盤面外框** | 每一手都看到；高彩裂紋黃框和其他元素不同調 |
| P2 | **E. 背景右側角色區** | MG／FG 右側都是一整塊平塗淡藍，看起來像沒畫完 |

---

## A. H4 Dill Spears（P0）

現況：`h4.png` 與分層 `h4_body_v2` / `h4_spear_left_v2` / `h4_spear_middle_v2` / `h4_spear_right_v2`（`design/qa/review_1017/h4_layers.jpg`）。三根條從底部一點放射張開＝大麻葉的剪影。

- **構圖**：3–4 根醃黃瓜條**斜放平行**躺在一個小盤或紅白格紙船裡，切面朝上（看得到籽）、**切口是平的**（不要尖頭）。整體剪影是**橫長或斜長的船形**，不是扇形。
- 不要從同一點放射、不要對稱扇開、不要尖端朝上。
- 層：`h4_body_v2`（盤／紙船）＋三根條各一層（沿用 `spear_left/middle/right` 名稱，程式的中獎動作是各自繞軸心擺 ±0.22 rad，條要能單獨動），補畫被遮住的盤面。
- 規格同其他圖騰：512² 透明、四邊 ≥ 8%、ink 邊盒約 0.82。`symbolLayers.ts` 的 `h4` 區塊（pivot／box／polygon）交件時一起給新值。
- **驗收**：70px 灰階表與 H2 熱狗、H3 炸圈分得開；**找三個沒看過的人看 70px 圖，問「這是什麼」，不能有人說葉子／植物**。

## B. FG 女廚師（picklePepper）上衣（P0）

現況：上身只有圍裙，胸部有畫出來（`design/qa/review_1017/fg_cast_flip_before.jpg`）。

- **加一件衣服**：番茄紅短袖廚師上衣或捲袖背心，奶油色滾邊，領口有紅頭巾的同色系。胸部不再畫出形狀。圍裙保留。
- **不動骨架**：只換 `design/source/fg/torso_0_trunk.png`（同畫布、同位置），手臂層不換；若袖口蓋到上臂，另交 `left/right_arm_0_upper_arm.png` 的袖子版（同畫布）。切層規則照 `ART_BRIEF` §1，軀幹層**不能**在手臂下方留色塊（10-16 殘影問題，`design/trim_trunk_smear.py` 的檢查要過）。
- **同一角色的其他圖要一起換**，不然變成兩套：
  - `static/assets/pickle/buy_chef.png`（買特色卡）
  - `static/assets/pickle/upgrade_cutin_body.png`（砍圖騰卡，三層裡的身體層；手臂層 `upgrade_cutin_arm.png` 若有衣袖也要）
  - `static/assets/pickle/win_max_base.png` 右側的她
  - 封面 `design/cover/` 與縮圖（若有她）
- **驗收**：`check_cast_underlay.py`、雙人並排身高差 ≤ 5%、在 FG 背景上 200px 大廳尺寸讀得出輪廓。

## C. 換場門（P1）

現況：`door_l_base_v2`、`door_r_base_v2`、`door_wheel_v2`、`door_latch_v2`、`door_hazard_v2`、`door_badge_v2`、`door_liquid_v2`、`door_steam_1..6_v2`（`design/qa/review_1017/door_and_fg_intro.jpg`）。乾淨向量、亮紫平塗、規整黃黑斜條，跟背景的乾筆印刷不是同一枝筆。

- **畫法改成背景那一套**：胖瘦不均的墨線、偏斜實黑陰影、少量乾筆斷墨、鉚釘不規則；黃黑警示條要手繪、不等寬、有缺角。
- **顏色往背景色盤靠**：鐵皮用 #8583B5 灰紫＋#514567 暗李紫陰影（不要現在的亮薰衣草），警示條芥末 #E9B83E＋墨黑。
- 中央徽章：現在是奶油圓片上一根小酸黃瓜，太小太空。改成**鑄鐵大徽章**，佔兩扇門接縫處約 22% 畫面高，酸黃瓜浮雕＋一圈鉚釘。
- **全部檔名、畫布、軸心不變**（`design/source/production_v2/door_parts_manifest.json`）；兩扇併起來的接縫一樣不烘雙層陰影。
- 驗收：和 `bg_base.webp` 同一張圖上並排截圖，看不出是兩個人畫的。

## D. 盤面外框（P1）

現況：`frame.png`（1280²，九宮），高彩亮黃＋白色裂紋筆觸，粗到像塗鴉。

- 照 `ART_BRIEF` §4：**搪瓷出餐窗口**——墨邊、芥末窄邊條、橄欖／暗李紫搪瓷面、四角鉚釘、底部窄出餐台。黃色只留窄邊條，不要整圈大面積亮黃。
- 裂紋改成少量掉漆缺角（每邊 1–2 處），不要滿版斜線。
- 畫布、透明開口、九宮 inset 與現檔完全相同（交件附開口 alpha 邊盒量測）。
- 驗收：盤面截圖上外框比圖騰**安靜**（框的平均彩度低於 H1–H4 的平均）。

## E. 背景右側角色區（P2）

現況：`bg_base.webp`、`bg_feature_v2.webp` 右側三分之一是整片平塗淡藍，像沒畫完。

- 補**低對比**細節：牆板接縫、幾顆鉚釘、一張小菜單海報或時鐘、地面與牆的交界陰影。明度差控制在 ±8% 以內，不能有綠／黃大塊，角色站的地方仍然是安靜亮色（`ART_BRIEF` §7、memory「Cast reads off background」）。
- FG 版同一處理，另外把整張 FG 背景的暗部提亮一階（現在 FG 開場壓暗後整片灰泥）。
- 縮圖／封面背景依「Store art not dark」規則檢查。

---

## 10-17 已用程式處理（不用畫）

動畫：
- 轉輪模糊改成整條輪帶真模糊（`BoardBase.svelte` 每輪一個 BlurFilter），拿掉半透明殘影複本。
- FG 女廚師大獎慶祝：原本 root scale.x 1→0.25→−1→−0.2→1，人被壓成一條線兩次 → 改成蹲跳加擠壓伸展（`design/fix_cast_cheer_1017.py`）。
- MG 店長大獎慶祝：垂手與舉手兩組手臂在 0.18–0.36 s 交叉淡入淡出（兩組半透明疊在一起）→ 0.14 s 硬切。
- 中獎圖騰：整顆從牌面彈出（0.94→1.24→1.12，收尾回 1），加芥末墨線中獎框（`WinCellFrame.svelte`）。
- 小額中獎金額：淡入 500 ms 比整段顯示還長，最高只到 63% 不透明 → 140 ms 淡入、停留 650 ms；奶油字粗墨邊＋墨色位移陰影，蓋章式彈入。
- 第三顆 Scatter 的「DING」：鈴鐺複本畫在偏右下半格、壓到外框上 → 移除複本。
- 壓暗改用背景墨紫 #252735（中獎 50%、大獎 55%、聽牌 30%），不再是灰黑塊。

介面／素材：
- 買特色彈窗、確認彈窗：粗墨框＋位移墨影、票卡微斜、芥末／番茄按鈕、hover 變暖不反灰；罐子空白標籤補上 JAR。
- 開場第三張卡（MAX WIN）：原本只有紅字，改放 MAX 大獎招牌圖、10,000× 寫在招牌上。
- BIG WIN 招牌上的空白紅點 → 「UP!」橡皮章，招牌落定後蓋上去。
- FG 砍圖騰卡：被砍的 10／J／Q 改用真正的圖騰圖（原本是空白牌上的字）；罐子標籤補字。
