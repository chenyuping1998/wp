# Static Shift 圖騰動態優化 — 2026-10-29

已更新本機 upload/StaticShift；本次未呼叫平台上傳、發佈或送審。

## 實作

- 原 L1–L5 相同的 1.45 倍彈跳，改為各自的 1.4 秒起勢、接觸、持姿、收勢。
- 人像 H1–H4 原本固定 reaction 偏移且沒有中獎動作時序；現在各自有完整時間包絡、頭頸轉向與髮梢跟隨。沿用既有單張網格路線，沒有改動主角 Spine。
- RadioSymbolArt 使用連續 32×32 網格。陶瓷杯只動蒸氣、耳機耳罩回彈、麥克風從接頭回擺、鞋舌跟隨、Relay 天線微彎；硬質外殼不再整張壓扁。
- 錄音機與卡帶的捲軸用來源同張圖片的圓盤 UV 旋轉，外殼與邊框不旋轉；中獎額外轉一整圈，接回共用待機時鐘。週期能整除 104 秒時鐘 wrap。
- 中獎提示改為固定在格子四角的紙白線，與表演圖層分開。
- Signal Pack 倍數章維持固定可讀。

## 驗證

- npm build 完成；資產、音效、社交文案、未定義參照、Spine、既有網格、待機與新 radio-symbol 檢查通過。
- 型別檢查維持既有 7 個共用套件錯誤基線；沒有新增 app 型別錯誤。
- 新檢查逐 16ms 取樣 12 種符號的待機與中獎、每個 32×32 網格的兩個三角形：面積比 80.5–123.6%，零翻面。此數字只證明幾何，另有實際畫面驗收。
- 實際 Svelte/Pixi 渲染：全 12 種亮／暗底，完整中獎時序截圖與 GIF；放大檢查錄音機捲軸邊緣。
- 正式 production build：1280×720 桌機主遊戲及 book 671 收集結束至 $2.40；390×844 手機 bonus book 2，完整跑完追加至 40/40 次免費遊戲、收集 ×10、轉場及中獎，最終 $175.10 與 replay 預告相同。
- 本機使用真實發行書本及模擬錢包，並非平台 RGS session。平台評分尚未重測。

## 同版交付

- source-sha256.json 記錄本次動作來源；frontend-sha256.json 全部通過核對。
- 本次數學檔案與備份逐檔 SHA256 相同。
- 原 thumbnail / cover / provider-logo 層同步包含於 upload 包；本次未要求也未重畫商店圖。
- 動作證據：symbol-motion.gif、contact-sheet.png、light-idle.png、desktop-idle.png、desktop-collect-settled.png、手機畫面。
- 備份：_upload_backups/StaticShift-before-symbol-craft-20261029.tgz。
- lab-source 是臨時檢視器來源備存；檢視器路由與臨時 layout 已移除，沒有放進正式 frontend。
