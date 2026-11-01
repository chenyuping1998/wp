# 完整盤面美術示意

1920×1440 主圖：`HypnoMonkey-full-board.png`／`.jpg`。包含主遊戲帳篷外背景、6×6 盤面、全部十種圖騰、MG 角色、倍率懷錶，以及下排完整圖鑑。FG 助手列在盤面外的參考區，不是兩位角色同時出現在 MG。

`HypnoMonkey-all-symbols.jpg` 是放大圖騰圖鑑。十種圖騰為 H1 禮帽、H2 棒棒糖、H3 水晶球、H4 手搖鈴、H5 香蕉、L1 星票、L2 月票、L3 菱形票、L4 愛心票、S 螺旋散付；倍率懷錶不是一般圖騰。

七款缺少的圖騰以內建 image_gen 補齊，其他素材沿用 V3。原圖保留在 source，去綠幕及色票處理後圖片在 sprites。實際提示詞及生成來源見 PROMPTS.md、provenance.json；來源 hash、每格配置與色票見 manifest.json。

重建藍盤底歷史版：從 app 資料夾執行 `python3 design/build_full_board_preview.py --out design/board_preview_v1 --board-fill '#24508C'`。工具預設現在產生暖灰盤底的 v2。

這是美術配置示意，非遊戲截圖。盤面配置及 UI 數字為展示用；尚未把此全套素材整合進正式 runtime，也未打包、上傳或更新平台。
