# 正確盤面：6 輪 × 5 格（30 格）

2026-10-28。此為美術合成示意，不是遊戲截圖，也未冒稱風格已由 Stone 核准。

`HypnoMonkey-overall-6x5.png` 由以下獨立檔案逐像素合成：

1. `background.png`：沿用 v4 的無角色馬戲團背景。
2. `frame-and-board.png`：標題、木框及暖灰 6×5 格。
3. `board-symbols.png`：全部十種圖騰分布在 30 格；沒有使用 payout book。
4. `character.png`：目前正式 32 層 MG 的實際合成，不再使用交叉腿舊角色。
5. `ui.png`：示意控制列及數值。

`source-character.png` 與 `../cast_mg/assembled.png` 逐 byte 相同。圖騰從 v4 概念各自抽出、清除原盤格及周邊殘片，保留在 `symbols/`；`all-symbols.jpg` 可檢閱全套。來源座標與 hash 在 `manifest.json`。

重建：在 app 目錄執行 `python3 design/compose_board_6x5.py`。不得用此示意冒稱完整 runtime 換皮；FG 助手及正式背景、圖騰、UI 整合仍待完成。未打包、上傳或更新平台。
