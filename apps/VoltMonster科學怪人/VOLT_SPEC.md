# VOLT MONSTER — 規格（2026-11-07 開案）

從 **Mummy Mayhem** 複製（前端 `wp/apps/VoltMonster科學怪人`、數學 `math-sdk/games/VoltMonster科學怪人`）。
`game_id` = `VoltMonster`、套件 `volt-monster`、dev **3052** / storybook **6052**、launch.json 名稱 `voltmonster-dev`。
主題：古堡塔頂瘋狂實驗室＋笨笨的科學怪人（好笑路線）。美術需求單：[design/VOLT_ART_REQUIREMENTS.md](design/VOLT_ART_REQUIREMENTS.md)。

## 規則（跟 Mummy Mayhem 完全相同）

| 項目 | 內容 |
|---|---|
| 盤面 | 5 輪 × 5 列，30 條固定連線 |
| 符號 | H1–H4、L1–L5、W（百搭）、S（只在主遊戲） |
| 主遊戲 | 3/4/5 個 S → 10/12/15 次 FG，不能再觸發 |
| FG 倍率輪盤（**VOLT METER**） | 每局有連線必轉；值 2/4/6/8/10/12/14/16/32；只升不降、套用本局所有線、保留到 FG 結束；一顆按鈕，自動轉／Turbo 自動按，3 秒不按自動轉 |
| 稀有輪盤（**TESLA WHEEL**） | 四級 LEVEL UP 輪盤；主遊戲一局結束隨機出現，Hold & Spin 不會出 |
| Hold & Spin | 50× 獨立模式 |
| 買入 | 100× 買 10 次 FG；50× Hold & Spin |
| 激活 | **VOLT SPIN 5×**、**VOLT SURE WIN 10×**、**TESLA BOOST 1.5×**（數學模式名仍是 `scarab5`／`scarab10`／`sunboost`，只換顯示文字） |
| wincap | 10,000×（H&S 1,000×）；RTP 96% |

數學沒改：`library/publish_files`、`lookup_tables` 是從 Mummy 複製的同一份 books（模式名、RTP、事件都相同）。要重跑就 `run.py`。

## 名稱對照

| Mummy Mayhem | Volt Monster | 程式內部名（沒改） |
|---|---|---|
| SCARAB WHEEL | VOLT METER（電壓錶） | `FgArcWheel` |
| SUN WHEEL | TESLA WHEEL（特斯拉輪） | `RareRoulette` |
| Scarab Spin／Sure Win | Volt Spin／Volt Sure Win | `SCARAB5`／`SCARAB10` |
| Sun Boost | Tesla Boost | `SUNBOOST` |
| 木乃伊貓 | 科學怪人（Volt Monster） | `Mascot` |
| H1 貓臉石棺 / H2 卡諾卜罐 / H3 毛線球 / H4 魚骨 | H1 玻璃罐裡的腦 / H2 閘刀開關 / H3 冒泡燒瓶 / H4 大電池 | 符號代號不變 |
| W 木乃伊貓 / S 黃金貓面具 | W 科學怪人胸像 / S 特斯拉電漿球 | |
| 繃帶轉場 | 燈光閃、閃電劈下的白光轉場 | `TransitionAnimation` |

## 下注列：第四版（拆分式）

`src/components/ui/SplitBar.svelte`（從 `wp/tools/ui-bar-v4` 複製），`uiTheme.ts` 以 `customLayout` 接上，barHeight 190。
- 買入方塊圖示是程式畫的**燈泡**佔位（不能用閃電，Turbo 已是閃電）
- 編排照使用者給的 Katana Kash 截圖（圖示不變）：底部一排＝左下角買入方塊（上方圓形選單鈕）→ BALANCE 底板 → 置中 WIN 底板 → ▲▼ 疊放 → BET 底板；右下角旋轉大圓鈕，上方弧線排 Turbo、自動播放
- 第三版 MummyBar 已刪；購買選單底部膠囊 `BuyMenuBetPill.svelte`、規則頁 `BarIcon.svelte` 沿用（買入圖示同步改燈泡）
- **使用者最新偏好**：人物放大並往下移，腿部可稍微被第四版 UI 遮住。

## 現況（2026-11-08 美術與動態接入）

- UI 維持第四版 SplitBar、Nunito、barHeight 190；科學怪人依使用者偏好放大並下移，允許 Turbo 和旋轉鈕遮住部分腿部。
- 已換成科學怪人獎圖、三套實驗室背景、Volt Meter、四級 Tesla Wheel、盤框、字牌、購買卡與電能幣。
- 三套背景各有 6–7 個獨立物件；齒輪旋轉、吊燈擺動、兩端固定電纜形變、電弧、泡泡、指示燈、示波器、指針和窗外閃電均接入。鏡頭固定。
- H1–H4/W/S/L1–L5 使用新圖專屬部件網格；電池逐格充電、電漿觸手流動、螺栓放電另由程式繪製。連線改為電流，FG 換場改為白光閃電。
- 正面科學怪人 Spine 4.2：8 動作、4 表情、2 頭髮附件；W 和封面使用同一隻角色。
- 交付原圖、圖層、軸心、提示與驗證報告位於 `design/source/volt_delivery/`；封面另存本遊戲 `封面圖/`。
- 音效需求單尚未定義，音效仍沿用原案；本次未製作新音效。
- 數學模式、books、賠率與下注行為維持原樣。離線 QA 的四級輪盤視覺 fixture 僅存在 `build-replaytest`，不進正式建置。
