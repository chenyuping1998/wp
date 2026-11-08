# BET、表情、轉盤音效與背景修訂

完整前端：`release/MummyMayhem_frontend_review_20261107_living_scene.zip`；雜湊及各檢查報告：`release/PACKAGE_living_scene.json`。前一版封包保留。

1. BET 改為靠近按鈕的深色／金色面板，與 Autospin 視覺一致。兩欄、每格至少 52px，原生上下捲動及觸控滑動，重新開啟會捲回目前金額。使用伺服器金額選項、既有下注設定方法與幣別格式，保留全域 modal 的輸入封鎖。可點外側、DONE 或 Escape 關閉；隨畫面尺寸重新定位。
2. 人物新增獨立表情軌，待機時左右掃視，眼珠先動、臉部稍後跟隨，停留後回正，偶爾張口；揮手與笑／慶祝另有表情節奏。新增 mouth-open 貼圖只合成口部區域，保留原頭部輪廓、繃帶及眼睛。原人物與四條繃帶的接點、細身比例維持。實際 Spine 4.2 檢查 2,021 格，沒有臉部網格反轉；四條布根在 2,316 格採樣中保持完整遮蓋。
3. 一般轉盤出現音效加長至 0.95 秒，以保留的 CC0 石塊、石面摩擦及定音鼓錄音疊出低頻隆隆聲；同時提高播放音量。相對舊音效與舊播放增益，RMS 約提高 9.25dB；素材 true peak 約 −3.88dBTP。太陽輪盤出現也加入隆隆底聲，仍遵循玩家音量與靜音。68 個音效的音量、尾段、來源檢查全數通過。
4. 背景保留原本的埃及場景構圖，新增可獨立變形的垂掛飄布，並加強既有葉片、布幔、火焰、暖光及由火盆升起的小餘燼。風從左向右有延遲，布根固定，石柱及地面不跟著彎。三個場景 16,337 格網格檢查通過，固定點最大誤差約 0.0000153，沒有反轉。

## 預覽與驗證範圍

- `preview_mummy_20261107/living_scene/face_performance.mp4`：實際 Spine 4.2 頭部網格與四個表情片段的離線預覽。
- 同目錄 `face_contact.png`：左右掃視、張口、笑的對照圖。
- 同目錄 `backgrounds.mp4`：三場景布料、火焰及葉片實際網格的離線預覽；此輸出器不含遊戲內新增的暖光 sprite 與小餘燼。
- `source/mummy_delivery/audio/wheel_rumble_before_after.wav`：先舊版，短暫停頓，再新版，按各自的遊戲播放增益輸出。
- BET 的實際 Svelte 元件以獨立 Vite 頁面驗證，桌機 1280×720 與手機 390×844 均通過 60 選項捲動、最後金額選取、目前值恢復、DONE／Escape 關閉及畫面邊界。報告為 `living_scene/bet_component_verification.json`；沒有真實下注。

完整 `pnpm build` 通過；型別檢查維持既有 22 項診斷，沒有新增超過基準的診斷。人物骨架、尾根、四條布條、揮手／肩根及前輪修訂檢查均通過。這些是本地建置、隔離元件與離線動態檢查，仍需 Stake 執行環境的整體流程及實機聽感驗收。

## 素材與重建

本輪使用內建 imagegen 產生張口參考與獨立布條。原圖、完整提示與工具來源保存在 `source/mummy_delivery/originals/` 及 `source/mummy_delivery/living_scene_prompts.json`，不是商品頁截圖。

資產加工：`prepare_living_assets.py`；表情軌：`build_mummy_face.mjs`；布條：`build_mummy_flow.mjs`。兩個骨架工具會依骨名重映射網格索引，避免覆蓋對方的權重；依序重建後再跑臉部、布條、接縫與 runtime 檢查。原頭部備份在 `mascot_versions/before_living_face/`。勿用舊版 `build_mummy_expressions.py` 或原始整套骨架組裝工具覆蓋目前交付骨架。

音效修訂：`build_mummy_wheel_rumble.py`；完整音效生成器已加入最後重套此版本的步驟。既有 showcase 音檔是先前版本示例，新音效以本輪 before/after 為準。
