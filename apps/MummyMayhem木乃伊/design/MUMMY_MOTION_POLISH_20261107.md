# 木乃伊：人物接點、獎圖與背景動態修訂

本次修改只在 `wp/apps/MummyMayhem木乃伊`。參考本地 `PuttMonkey迷你高爾夫` 的 `puttFlags.ts`、`bgProps.ts`、`BgMotion.svelte`，並沿用 `slot-motion-recipes` 的預備、停頓、錯時及收勢原則。獎圖保持既有 1.5 秒流程，玩法與 Turbo 等待時間不增加。

## 人物繃帶

將整段骨鏈擺動改為沿布條傳遞的橫向波紋：固定縫合端，控制點只移動，不以多段旋轉造成折棍感。越靠近自由端幅度越大，波紋帶少量長度收縮，6.4 秒首尾相接。獨立 track 1 持續播放，人物指向停格時仍會飄動。

腰側原接點在 dance 某些姿勢會露出，已改為骨盆內的 `[410,1030]`，並收窄埋入圖層下方的縫合端；尾端接入 `[910,878]`。新布條根部前兩排網格在 8 個動作、1,544 格中，100% 採樣點都被既有不透明人物圖層覆蓋。3,080 格另驗無翻面，首尾接縫誤差 < 0.00004 骨架單位。原身體、較小腹部、頸肩、尾根及 8 個動作資料保持一致；尾根另驗 612 格，每格 81/81 個重疊點持續接合。

腳本：`build_mummy_flow.mjs`、`verify_mummy_cloth_seams.mjs`、`verify_preview_mummy_flow.mjs`。布料原圖與先前內建 imagegen 提示仍保存在 `source/mummy_delivery/originals/flow_bandage_painted_v1.png`、`source/mummy_delivery/mascot/flow/imagegen_provenance.json`。

## 獎圖

- H1：棺蓋先壓、抬起停一拍、柔和回落；眼睛與耳朵掛在蓋子上，爪子與布結跟隨。
- H2：罐蓋先往反向預備，再抬起偏轉、停頓，第二拍較小，最後收回。
- H3：毛線球先帶動，線尾與布尾增加獨立控制，晚一拍跟隨；沒有額外旋轉整張框。
- H4：魚尾以明確關鍵姿勢甩動、減速回正，避免連續等幅抖動；保留張嘴與眨眼。
- W：保留 wink、耳朵跟隨，嘴部改成兩次有停頓的笑，移除高速左右擺嘴。
- S：黃金面具形狀不變形，以光澤掃過表現金屬材質。
- L1–L5：文字有預備、抬起與小回落，結尾完全回到原圖；石板外緣不跟著跳。

正常與 2 倍速度均通過既有網格檢查：權重、首尾回原位、連續性、部位覆蓋與動作可見性，以及不翻面和拉伸限制。11 種獎圖的有效三角形面積保持約 50.6%–159.4%（扣除整體仿射縮放，眨眼區依原檢查規則處理）。

## 背景

`TombAtmosphere.svelte` 使用真實裁件的網格；`TombPlate.svelte` 在遠景原畫上控制葉片、垂布。移動由同一個 `tombWind` 氣流驅動，從左側依序到右側，17 秒一輪，較快進入、較慢釋放，中獎時只增加一陣柔和氣流。

- 主遊戲：頂部繃帶固定縫合端，布面傳遞波紋；火舌尖端流動、火盆底部固定。
- 免費遊戲：左右植栽以不同重量跟隨氣流，雕像、石柱與階梯的指定固定點保持原位。
- 金庫：上方帷幕與下方垂布緩慢起伏，火焰與局部暖光連動。

移除隨機全畫面光點與背景計時位移；沒有額外的掃光霧層。動畫改以 requestAnimationFrame 更新，未顯示的場景不重算網格；FadeContainer 管理完整場景的淡入淡出。色彩權重來自現有圖片，`build_tomb_fields.py` 只輸出稀疏頂點權重，沒有修改原圖。

13,274 格檢查涵蓋兩輪氣流與中獎反應，布條／火焰 30 fps、葉片／垂布 15 fps：沒有翻面，面積約 86.4%–118.7%；縫合端與火盆固定點誤差 < 0.00002 px，指定石構地標固定。資料在 `preview_mummy_20261107/motion_polish/ambience_verification.json`。

## 檢視與重建

離線預覽：`preview_mummy_20261107/motion_polish/awards.mp4`、`backgrounds.mp4`、`cloth/預覽.gif`。使用正式 TS／Spine 網格輸出，逐格檢視接點及形變。這些是離線素材預覽，背景影片未疊加遊戲盤面；尚未做 Stake 實機驗收。影片不含音效，既有音效與觸發時機保持原實作。

完整前端包：`release/MummyMayhem_frontend_review_20261107_motion_polish.zip`；驗證摘要與 SHA-256 在 `release/PACKAGE_motion_polish.json`。之前封包保留。

重建：

1. `python design/build_tomb_fields.py`
2. `node design/build_mummy_flow.mjs`
3. `node design/verify_preview_mummy_flow.mjs`、`node design/verify_mummy_cloth_seams.mjs`
4. `node design/preview_verify_mummy_motion.mjs`、`python design/render_mummy_motion.py`
5. `pnpm build`、`python design/package_mummy_motion_polish.py`

使用 E 槽 Node 22 工具鏈。完整建置通過既有資產、音效、引用、文案、型別基準、網格及 idle／落地檢查。型別仍有 22 項既有診斷，沒有新增超出基準的檔案。
