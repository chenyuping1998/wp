MEDUSA GAZE／梅杜莎凝視 — 2026-10-25 可交付版

遊戲建置：MedusaGaze_frontend_20261025.zip，ZIP 根目錄為 index.html、assets、_app、fonts、licenses。
美術與程式來源：MedusaGaze_sources_20261025.zip，保留 app 目錄結構；此遊戲仍使用現有 wp 工作區的共用套件。

本版完成
・10 張正式獎圖，以及得分、石化消除、碎片與重力掉落。
・梅杜莎分層 PSD（1024×2048，63 層）、關節資料、轉面、10 種表情與可編輯分件。
・Spine 4.3.13 原創骨架：74 骨、9 條各自五節骨骼的蛇髮、24 段動作。每條蛇獨立錯拍，沒有整頭髮一起晃。
・拉墨鏡、凝視、失敗倍率反應、小獎拇指、FG、各級大獎、蛇尾與待機動作；前臂遮擋與捏鏡框位置已檢查。
・招牌倍率演出 v3：雙眼獨立綁定瞳孔骨骼，聚焦、雙光束前緣、石化紋理、聚能寶珠、加速弧線、命中壓縮與原畫碎片。
・倍率數字維持正向；中央明示「原得分 × 倍率 = 加倍後得分」，結果停留後退場；FG 累積牌加上 TOTAL 標示。
・MG／FG 場景、慢雲、火焰、石像碎裂重組；盤框與鏡頭固定。
・正式盤框、按鈕、Buy Bonus 神盾、三色倍率球、三級累積牌、FG 牌、五級大獎牌與同款金章撒幣。
・三張說明插畫、字標、無字 16:9 封面、分層商店縮圖、favicon、12 格蛇環讀取動畫來源。
・57 支原創合成音樂／音效已接入，含神盾 hover、confirm 與蛇髮哈欠。角色語音是合成預聽，並非真人配音。
・13 支倍率音效重新製作：鏡框摩擦、綠光聚焦、沿飛行軌跡聲像移動的掠空聲、三級命中、石化碎裂與細緻跳數；附 48k/24bit 母帶及可編輯分軌。

Spine 編輯來源
design/source/medusagaze/cast/spine43_editor/medusa.json
images/ 是保留原畫尺寸的分件；匯入 Spine 4.3 後可繼續編輯。交付為 JSON 與圖像來源，不冒充原生 .spine 二進位專案。
遊戲使用 static/assets/spines/medusa43 的 JSON、atlas、2048×2048 貼圖，搭配本款自己的官方 4.3 core 渲染接線；共用 4.2 載入器未改動。

檢查結果
・package.json 的完整建置流程通過；正式 build 已更新。
・24 段動作經官方 4.3 core 重播，沒有可見網格翻面；握持位置與 MG／FG／減少動態切換通過。
・8 連消時序、63 種欄位消除形狀、255492 個已發布中獎位置的掉落驗證通過。
・本地 bonusBigTotal 跑完 15 次免費遊戲：累積 ×110，TOTAL WIN $198.90，按繼續可回 MG。
・1280×720、390×844、320×568 排版已檢查，驗收截圖位於 _sheets。
・商店縮圖 200px 曝光與透明前景檢查通過。
・完整 svelte-check 仍有工作區原有的工具／依賴／舊靜態來源錯誤；本款 src/components 與 src/game 本次修改沒有型別錯誤。數量見 delivery-status.json。

範圍
以上是本地離線／mock 驗證，未宣稱 Stake Engine 驗證。mock 的餘額換算不能作為金流驗證。上傳 Stake Engine、真實 RGS 與送審由使用者進行。
依使用者最後指示，不另外提供影片作為交付主體。

本機開發入口（使用 E 槽 Node 22）：
E:/stake/tools/node-v22.23.1-win-x64/node.exe node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3045
本地 mock URL：http://127.0.0.1:3045/?mock=1&sessionID=dev&rgs_url=mock.local&currency=USD&device=desktop&book=baseThrow
本地檢查：design/build_local.mjs；角色檢查：design/check_medusa43.mjs。
倍率逐格檢視：design/source/medusagaze/multiplier/preview/index.html（透過本機 HTTP 開啟）。
倍率動態驗證：design/multiplier-performance-validation.json；音效量測：design/source/medusagaze/audio/MULTIPLIER_V2_SOUND_DESIGN.json。
重建音訊時先執行原始 generate_audio.py，再執行 audio/upgrade_multiplier.py 與 audio/build_preview.py，保留本版混音。
