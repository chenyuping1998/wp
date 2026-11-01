# Turf War 圖騰動態優化 — 2026-10-30

## 實作

- 5 種物件加入局部網格：項鍊頂端固定、墜飾延遲擺動；鈔票邊緣翻動；PET 瓶身局部形變；車身懸吊相對車輪運動；音響只推動振膜，固定外殼與邊圈。
- 房子採依原圖玻璃座標描出的分區窗光；車頭燈跟隨同一份車身變形計算，避免光點與原圖分離。
- 4 個塗鴉用路徑遮罩揭露原圖自己的 alpha，以濾鏡提亮筆觸；不另畫一份偏移輪廓。筆尖的橘點及少量油漆點與筆劃進度同步。
- 中獎維持原 970ms（套用既有 featureTimeScale），但新增起勢／回位，12 種都從原姿勢開始、回到原姿勢後完成。縮短白色接觸閃光，移除圖騰共用光暈／星芒，保留付獎位置標記與實際 Loot Bag 倍率框。
- 修正星星旋轉 72° 後直接還原、皇冠動作結尾、指虎蓄力接點的跳格；車子引擎待機不再使用 160ms 快速抖動。
- MG／FG 主角 Spine、數學、賠付、遊戲機制與商店圖不改動。

## 驗證

- 完整 build 與所有既有 guard PASS，新增 check_street_symbols 納入 build；svelte-check 0 errors / 0 warnings。
- 原動作差異閘門仍保留原門檻：12 win closest 0.99 / 0.9、12 land closest 0.93 / 0.9；沒有降低差異門檻。
- 5 個 40×40 網格逐 16ms 取樣待機／中獎，三角形面積比 76.5–135.9%，無翻面；12 種待機 act 起終／中獎起終皆通過接點檢查。數值只證明幾何，不代表主觀動作品質。
- 實際 Svelte/Pixi 渲染全 12 種亮／暗底與完整動作，保存 final-motion、GIF、contact-sheet；另放大檢查項鍊接點、音響振膜和車輪。
- 正式 production build 的桌機 1280×720 主遊戲：base book64 結算 $0.70，餘額 $999.70；旋轉、Loot Bag 2× 與中獎位置輪播正常。
- 手機 390×844 的 Lookout bonus book0 完整跑完追加至 12 次免費遊戲並回到主遊戲，最終 $29.80，與 Replay 預告相同；console error 記錄為空。Muscle／Kingpin 本輪未重新完整回放。
- 這是目前 upload 數學檔中直接擷取的限定真實書本＋模擬錢包；不是平台 RGS session，尚未取得新平台評分。
- Vite 仍有既有 new URL 路徑解析警告；資產閘門通過，桌機實際載入無新的執行錯誤。本次未修改該資產登錄方式。

## 同版證據與交付

- source-sha256.json 記錄動作來源；臨時 motion-qa 路由已移除，根 layout 與修改前完全相同。
- final-motion / turf-symbol-motion.gif 是本次定稿；motion-* 是較早含共用星芒的中間稿，不能作定稿驗收證據。
- 數學 9 檔與本次工作前逐檔 SHA256 相同。
- 備份：research/turfwar/before-symbol-craft-20261030/；_upload_backups/TurfWar-before-symbol-craft-20261030.tgz。
- 本次尚未呼叫平台上傳、發佈、approval 或商店圖片更新。

## 本機包完成

已同步 upload/TurfWar/frontend，152 個檔案逐檔 SHA256 與定稿 build 相同。原 thumbnail／cover 保留於同一 upload 包，本次無重畫需求。9 個數學檔 hash 未變。收據：LOCAL-SYMBOL-CRAFT-20261030.json。平台未上傳、未發佈、未重送審。
