# Volt Monster 美術、遊戲接入與動態交付

2026-11-08。使用者確認範圍為「製作美術並接進遊戲」，追加獎圖及背景動態；UI bar 指定第四版。

## 完成項目

- [x] 第四版 SplitBar / customLayout / Nunito / barHeight 190；桌機角色依最新偏好放大並下移，允許前景 UI 稍微遮住腿部。
- [x] 13 張獎圖：H1 腦罐、H2 閘刀、H3 燒瓶、H4 電池、W 怪人、S 電漿球、A/K/Q/J/10、電能幣、空插槽。
- [x] 三套背景及 19 張原位透明物件層：主遊戲 7、免費遊戲 6、電池庫 6；乾淨遠景、完整合成、天空、物件表及軸心均齊備。
- [x] 背景動態：齒輪／飛輪／閥門慢轉、吊燈擺動、電纜兩端固定形變、氣泡、指示燈、雅各天梯／線圈電弧、示波器、錶針、警示燈、窗外閃電；鏡頭固定。
- [x] 獎圖專屬 48×48 網格：腦浮動與電線彈性、開關把手、瓶塞／液面／泡泡、端子與逐格充電、怪人頭髮／嘴與螺栓電弧、球心與電漿觸手、低分字母單獨跳離固定底板。
- [x] 正面吉祥物 Spine 4.2：8 動作、4 表情、2 頭髮附件；與 W 和封面同一隻角色。
- [x] Volt Meter、四級 Tesla Wheel、盤框、牌匾、購買場景與英雄物件、五級獎金牌、電能幣雨及閃電白光轉場。
- [x] 直式開場說明放大；Hold & Spin 回放模式名正規化、電池庫場景及 RESPINS 顯示修正。
- [x] 本案三個自製視窗改用 VoltPopup，避免目前共享 Popup 在視窗外額外複製一份內容；共享檔案未改。
- [x] 獨立背景／去背人物封面，版本另存遊戲內 `封面圖/`。

## 交件

`source/volt_delivery/` 保存 51 張生成原檔、85 張規格要求 PNG、19 張原位背景物件層及執行／驗證成果；清單見 `delivery_manifest.json`。

- `backgrounds/objects.json`、`objects.txt`：座標、懸掛點／軸心、動態類型、週期。
- `mascot/`：完整角色、拆層、關節、表情和頭髮。
- `mascot_built/`：Spine 遊戲檔、逐格圖及骨架報告。
- `symbol_motion_preview.gif`：以正式 rig / pose / skin 函式輸出之部件動態預覽；遊戲另加充電、電漿／接點電弧。
- `symbols_120px.png`：13 符號小尺寸檢視。
- `thumbnail/`：正方形和 16:9 獨立 BG/FG，及合成預覽。
- `qa_desktop.png`、`qa_hold_portrait.png`、`qa_mobile_320.png`、`qa_tesla.png`、`qa_buy_menu.png`：實際畫面驗證。

生成來源與提示記錄在 `volt_generated_sources.json`。原始圖保留；PNG 交件與 WebP 執行素材分開保存。

## 驗證

- 最新完整 `pnpm build`：`volt_build_final.log`。148 個素材路徑、音訊檔案、未定義參照、社交模式文案、網格與 idle/land 檢查均通過。型別檢查保留專案既存 22 項基線，沒有新增錯誤；本次視窗修正另見 `volt_types_final.log`；最後購買卡前景物件與電池充電對位的純繪圖更新另經 Vite production build 通過，見 `volt_build_ui_final.log`。
- 11 組符號動作：權重、首尾對位、逐毫秒連續性、墨色區面積、部件所有權及位移檢查通過；網格翻面 0。
- 角色 8 動作流暢度全部 100、網格翻面 0、手追不上 0%；最大腳底滑動 3.3px，門檻 5.7px。相同 Spine runtime 最大頂點重播誤差 0.0038px；4 表情／2 頭髮附件共 833 幀皆為有效資料。
- `art_metrics.json`：高分中央 60% 平均亮度 76.7–94.1；低分均值及亮區覆蓋率低於高分最小值。封面亮度、最暗 10% 與低於 32 的比例皆通過需求單。
- 三套背景重新疊合的最大像素誤差 0；最短背景物件週期 16 秒。
- 瀏覽器：1280×720 桌機、390×844 直式、320×640 窄螢幕；基礎／Volt／免費遊戲／Hold & Spin 回放、第四版操作列和購買卡。Tesla 四級使用明確標記的離線視覺 fixture，已觀察 LV 1→2→3→4 完整升級，無瀏覽器 error。

離線 QA 由 `make_volt_qa.mjs` 建立 `build-replaytest/`，真實 books 來自現有 publish files。只有四級輪盤測試為合成路徑；所有請求限 `mock.local`，不使用真實錢包，不加入正式 build。

## 範圍與注意

- 依據 `VOLT_ART_REQUIREMENTS.md`、`VOLT_MONSTER_RIG_SPEC.md`、`VOLT_SPEC.md`。
- 未改數學、books、賠率、模式與共用 Spine runtime；未修改其他遊戲或共用套件。
- 音效需求單尚未定義，音效沿用原案，本次未製作新音效。
- `finish_volt_delivery.py` 補上天空、輪盤光層、英雄充電差異；`audit_volt_delivery.py` 可重跑逐像素與亮度檢查。
- 封面位置遵從根目錄 AGENTS.md：本遊戲的 `封面圖/`，不另建 `wp/VoltMonster/`。

## 角色站位調整（使用者後續偏好）

人物高度上限由主畫面 47% 提高到 62%，側邊寬度上限由 82% 提高到 96%；落腳位置由高度 55% 下移至 78%（仍以盤面下緣限制）。保留第四版 UI 在人物前方，允許遮住小腿／腳部。

本次調整已經 Vite production build 通過（`volt_build_mascot_placement.log`），1280×720 實際畫面確認，瀏覽器 error 為 0；新截圖為 `source/volt_delivery/qa_desktop_mascot_large.png`。
