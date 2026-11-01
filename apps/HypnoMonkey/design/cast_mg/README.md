# 催眠猴 MG — 2026-10-28

## 最新袖子補畫

新版需求的四段袖子已由完整連續布料畫稿定位拆層，來源在 `source/sleeves-1028/` 和 `source/repairs-1028/`。重建前先執行 `python3 design/cast_mg/import_generated_sleeves.py`。保留原動作、關節與角色大小，完整比對在 `qa/source-repair-motion-invariants.json`。

肩部使用完整無描邊重疊，不以 alpha 漸隱穿過接點，避免亮底露白。桌機八動作聯絡表為 `qa/new-sleeves-desktop-contact.jpg`；`game-pose-*`、`mobile-pose-*`、GIF 與 runtime 圖集皆已重出。未打包 upload、未更新平台。

本次完成男催眠師 32 層的程式拆圖／校正，以及 stand34 八動作和主遊戲角色整合。美術風格仍待 Stone 評閱，不代表整款換皮已完成。

## 正式來源與版本

- `layers/`：32 張 1024×1536 RGBA，同畫布原位；帽頂 y=80、腳底 y=1456。
- `master.png`、`assembled.png`：由這批正式層實際合成，兩檔相同。
- `reference-master.png`：原生圖參考，與補繪校正後合成不同；保留供對照。
- `raw_layers/`、`attempts/`：未驗收原稿及歷史嘗試，不可當作最終來源。
- `registration.json`、`joints.json`、`layers.json`、`motion.params.json`：座標、關節、順序及動作參數。
- `registered-source-validation.json`：32 層、0 層失敗。此檢查只驗來源契約，視覺驗收另看實際渲染。

使用者已明確授權「改用程式完成拆圖與校正」。`native_repairs.py` 修正袖子、手部、腿與尾巴，`build_layers.py` 統一座標與表情 alpha；不覆寫 raw。

## 動作與遊戲

`cast_mg_spine/cast_mg.json` 為官方 spine-motion-kit stand34 產生的 Spine 4.3，八動作：idle、idle_fidget、gaze、react_small、gaze_dud、win_big、win_big_loop、win_big_end。正式報告八項接縫／翻面皆通過、流暢度皆 100；idle 第零格尾節約 5° 偏移為提醒。

工具修正記錄在 `stand34-tool-fixes.patch`：貼地鞋子的世界角度、IK 後求解手腕，以及捏眼鏡／摘帽的手勢方向。工具 76 測試及 typecheck 通過。

遊戲 `HypnoCastView.svelte`／`hypnoCastScene.ts` 使用真正 4.3 runtime 評估骨架和 IK，再由 Pixi 8 繪出裁圖。未修改共用 4.2 loader。桌機顯示全身；直式沿既有頭像版面顯示頭、帽及眼鏡。催眠出手時序與 throw 事件對齊至 620ms。

`build_runtime.py` 由相同正式層產生 2048² atlas，保留 crop 原點和 SHA256。`runtime-manifest.json` 記錄來源與遊戲資料對應。

## 驗收證據

- `qa/final-layers-light.jpg`、`qa/final-layers-dark.jpg`：最終來源在亮暗底逐層檢查。
- `qa/motion-01.jpg` 至 `motion-08.jpg`：官方 runtime 428 格中各動作起終及中間格；另有極限／轉場 close-frame 圖。
- `cast_mg_spine/預覽.gif`：同一批來源與官方評估矩陣重出的連續動作。
- `qa/game-desktop.png`、`qa/game-mobile.png`：實際本機遊戲整合。
- `qa/game-pose-*.png`、`qa/mobile-pose-*.png`：桌機及 320×640 直式八個實際動作狀態。
- 本機 mock 測試回合可結束；console 無 error。這不是平台 RGS 驗證。
- `pnpm build` 全流程通過。開發專用 castqa 面板沒有進 production bundle。

## 重建

在 app 目錄執行：

```sh
python3 design/cast_mg/build_layers.py
node /Users/stone/tools/spine-generator/bin/spine-motion.js character design/cast_mg/layers --no-gif
python3 design/cast_mg/build_runtime.py
node design/cast_mg/export_motion_frames.mjs
python3 design/cast_mg/render_review.py
python3 /Users/stone/tools/spine-generator/scripts/trial/render_gif.py gif design/cast_mg/layers design/cast_mg/qa/motion-frames.json design/cast_mg/qa/final-preview.gif
cp design/cast_mg/qa/final-preview.gif design/cast_mg/cast_mg_spine/預覽.gif
python3 design/check_hypno_cast_sources.py design/cast_mg --folder layers --out design/cast_mg/registered-source-validation.json
python3 design/cast_mg/check_connected.py
pnpm build
```

來源改版後必須依序重建下游，更新 manifest，不可使用歷史 GIF 當新版證據。

## 未完成範圍

FG 女助手、正式背景、圖騰、盤框、UI／標題、片頭、封面與縮圖仍待製作／整合。背景與角色必須獨立；目前遊戲仍有梅杜莎舊素材。實際最新 math/runtime 為 6 輪 × 5 格（依既有最新更正），舊 5 欄 × 6 列概念圖不代表 runtime。

未打包到 upload、未上傳、未更新平台、未發布。不可當作整款完成或送審版本。


## 2026-10-28 獨立驗收退回後修正

原版 `QA_CLAUDE_1028.md` 指出五項可見缺陷，舊 PASS 數值不代表美術通過。後續以同一 joints／params 修正來源：袖子連續收窄和布料皺褶、尾巴補繪縮進描邊內、笑臉外陰影移除、插腰手收邊、右手腕碎線清除。`finish_sources.py` 的 head_grin 僅清除外側陰影 alpha（1130 pixels），不再以五張 alpha 全同作為美術品質證據；其他四頭保持原 alpha，同畫布與關節座標未變。

直式已依新需求改成上半身演出，腰部以下藏在盤框上緣，尾巴不畫；此前「直式只畫頭像」為歷史狀態。懷錶落點與結算牌避讓沿用 da72cccf。新修正與比較見 `qa/repaired_1028/`。
