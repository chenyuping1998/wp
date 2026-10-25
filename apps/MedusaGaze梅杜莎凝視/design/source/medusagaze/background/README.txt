Medusa Gaze 背景動畫 v2 / 2026-10-25

六張正式素材以內建 image_gen 依使用者核准的 style_ref.png 製作。完整提詞見 BACKGROUND_PROMPTS.md；生成母圖 *_original.png 保存在專案同資料夾。

已接入本 app：
- 白天 bg_base.jpg / 黃昏 bg_free.jpg，固定構圖，約1秒交叉淡入淡出。
- cloud.png：4個雲群錯開進出，每分鐘384場景像素，即1920寬場景的1/5；前景柱邊緣前淡出，不切斷雲形。
- statue_tourist.png / statue_icecream.png：三階裂紋 → 每座12個不規則分塊快速甩出 → 定格停一拍 → 下方先扣回、上方後回彈。完整1.2秒；底座固定，每次大獎只觸發一次。分塊保留原畫材質，以原畫的暗色厚邊呈現碎塊厚度，不加入煙霧。
- flame.png：只在免費遊戲點亮。18×28局部網格分段彎折，火舌向上翻捲，UV亮紋向上流動；兩處不同步。實際火根位置(原稿1434/1536)的幾何和UV都固定在火盆口，不把整張火焰縮放搖晃。
- 碎裂事件接入既有 sfx_statues_crack，音量0.6，不循環。

動畫程式：src/game/backgroundMotion.ts、backgroundScene.ts；接線：src/components/Background.svelte。
所有修改限本 app，未更改 wp/packages。
頁面隱藏時暫停；尊重 prefers-reduced-motion。相同Pixi場景程式供遊戲與 preview/index.html 使用。
進場時在素材到齊後直接掛入現有Pixi父容器，卸載時移除ticker並釋放場景與geometry；不在effect內延後註冊onMount。

預演：MedusaGaze_background_v2.mp4，約16秒，包含原創碎裂音效。WebM保留原始靜音畫布錄影。7–14秒的火焰和石像近看是審片裁切，遊戲內鏡頭仍固定。
直接播放：play.html（MP4同資料夾即可雙擊播放，不依賴開發伺服器）；互動檢視：preview/index.html（需HTTP開啟）。
這是共用遊戲背景程式的瀏覽器畫布錄影，並非Stake Engine實機錄影。
check_background.mjs 驗證雲速、遮罩邊緣、12塊分割的完整面積、分件錯開回彈、1.2秒原位還原、火根與UV固定，並檢查30秒火焰變形的每個三角形，避免翻面和過度擠壓。建置、型別與本機瀏覽器結果見 delivery-status.json。
MedusaGaze_background_v2.zip 包含實際圖檔、動畫程式與接線參考、碎裂音效、播放頁與MP4；這是背景交接包，並非完整遊戲執行包。v1 ZIP與影片保留供比較。

本包的透明圖為真正RGBA；背景為1920x1080 JPG。其餘角色、UI及盤框仍依各自階段製作。最終Stake Engine上機驗收由使用者上傳後確認。
