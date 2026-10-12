# Go Banalchemy 美術交接

本專案由 GoBoomana 複製。遊戲 ID 是 `GoBanalchemy`，前端開發埠為 3021。

## 人物

- 可編輯 PSD：`design/source/GoBanalchemy_alchemist.psd`
- 高解析原稿：`design/source/alchemist_mascot_v1.png`
- 遊戲骨架：`static/assets/spines/goBananasMonkey/monkey.json`；新增 `alchemy_body` 加權網格，沿用 Boom 的九種骨架動作。舊礦工附件在設定姿勢中隱藏。
- 驗證：`node design/check_alchemist_mesh.mjs`，檢查所有動作的網格翻面及靜止姿勢。

## 獎圖與場景

- `static/assets/sprites/goBanalchemySymbols/`：H1–H4 高分圖分別是綠、紫、青、琥珀主色；L1–L5 用低彩度陶瓷底和黑字。W、S、B、P、X 都已換成煉金主題。
- `static/assets/sprites/goBanalchemyBackground/`：一般、免費遊戲、Hold and Spin 三張背景。
- `static/assets/sprites/goBananasFrame/`：新銅管與綠寶石盤面框，素材鍵沿用原遊戲以保留佈局與盤面動態。
- `static/assets/sprites/goBananasUi/`：主 UI bar 與 Buy Bonus 按鈕面板。
- `static/assets/sprites/goBanalchemyUi/`：Bonus Buy 卡牌場景、試劑與金幣插畫。

`src/game/assets.ts`、`src/game/uiTheme.ts`、`src/components/ui/ModalBuyBonus.svelte` 已接入上述素材。中獎網格使用新畫作的完整圖層，避免顯示 Boom 的舊礦工圖層。

## 建置

在本專案執行 `npm run build`。目前透過本機 `node_modules` junction 共用 Boom 的工作區依賴；若換機，請依工作區方式重新安裝依賴。
