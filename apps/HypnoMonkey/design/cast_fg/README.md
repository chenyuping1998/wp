# FG 女助手 · 2026-10-28

## 第二輪 A–E 補修

最新證據是 `qa/repairs-r2/README.md` 與 `verification.json`。兩腕與前臂碎線／缺口、肘端圓球、兩膝重疊明暗邊已修正；六張手勢圖統一收邊，避免切換回舊袖口。原生預覽採用與 Pixi 一致的線性取樣，原始退件報告及 16:10 證據仍保留。既有官方 rig、joints、十段動作、角色大小與 throw 620ms 未改。

## 16:10 退件後的新修正

舊 `QA_CLAUDE_1028.md` 保留為退件紀錄。新版來源在 `source/repairs-1028/`，生圖原始檔與提示詞在 `source/generated-repairs-1028/`。正式手臂採四張獨立完整解剖部件（`clean_arm_*`），依原關節定位；較早的整條彎臂拆層稿夾帶了另一段手臂，已停用，不再以裁細來源掩蓋。腿部保留原稿的連續輪廓，修圓弧重疊與方邊。尾根、短褲腰側、領口及手腕同步修正。未改骨架、IK、動作鍵、角色大小或 throw 620ms。

原生暗底同格前後對照及桌機／375×812／320×640 證據見 `qa/repairs-1610/`。`coverage.json` 列起終格與各部位轉角極值；`motion-invariants.json` 比對原始動畫、rig、joints 和 recipe。數值及 hash 通過不代表自動美術驗收。

重建來源前先執行 `python3 design/cast_fg/import_generated_repairs.py`，再按下方原順序重建；腿部生圖改變了比例，已標為不採用，正式腿部由原始分層修正。未打包 upload、未更新平台。

Stone 已確認「沿用造型與上述動作」。正式來源是 `master-approved.png`；實際交付組裝圖為 `assembled.png`，包括來源補畫、乾淨袖子／手／表情的定位、腕部與尾根殘片清除，以及單條連續懷錶鏈修正。因此組裝圖不是母圖逐像素複製。

32 張 1024×1536 RGBA 層在 `layers/`。使用 spine-motion-kit stand34 建立骨架，再由同工具的 `compileRecipe` 產生助手動作，另接三節錶鏈與獨立懷錶骨骼。工具的初始男角模板只是中間產物，正式動畫為 `assistant.recipe.json` 的十段：idle、idle_fidget、gaze、react_small、gaze_dud、win_big、win_big_loop、win_big_end、fg_trigger、fg_end。

`gaze` 的 throw event 在 620ms。遊戲依 MG／FG、正常／快速播放速度換算至既有 book 時點；錶離手至回收期間隱藏持握道具，飛行懷錶由遊戲效果呈現。倍率與獎金依原始 book。

第二輪僅修來源，保留既有官方 Spine 4.3 rig；本機最新版工具已不含舊 stand34 / stand-idle，不能把這份分層交給預設拳擊模板重建。來源重建順序：

```sh
python3 design/cast_fg/import_generated_repairs.py
python3 design/cast_fg/build_layers.py
python3 design/cast_fg/sync_source_images.py
node design/cast_fg/export_motion_frames.mjs
python3 design/cast_fg/render_review.py
HYPNO_REPAIR_REVIEW=repairs-r2 HYPNO_REPAIR_BASELINE=before-repair-r2 HYPNO_NATIVE_FILTER=bilinear python3 design/cast_fg/review_repairs_1028.py
python3 design/cast_fg/review_requested_r2.py
node design/cast_fg/update_final_report.mjs
spine-motion check design/cast_fg/cast_fg_spine/cast_fg.json --loops idle,win_big_loop
node design/cast_fg/check_character.mjs
node design/check_assistant_revision.mjs
```

最終來源、Spine images、裁切、atlas、runtime JSON、預覽 SHA256 由 `check_assistant_revision.mjs` 核對。預覽是正式 JSON 透過 Spine 4.3 runtime 算出的 501 格，固定鏡頭；`qa/all-frames-*.jpg` 每四格一張，包含完整動作、極值與大獎連續進出。`preview.gif` 和 light/dark 分層表皆同一版。已檢視十段動作與來源層，並在遊戲驗收桌面、375×812 和 320×640 直式構圖。

工具檢查：十段流暢度各100、0錯誤、0警告，但此數字不代替畫面驗收。預設接縫檢查仍保留尾巴第三節在 rest 的 368px² 提示；40px 形態閉合把 S 尾內側空白算進預期輪廓，連接點實際有不透明重疊。`qa/final-character-check.json` 保留原始提示；8px 輪廓檢查 `qa/seams-natural-tail.json` 無缺口，實際全幅深底中間格亦檢查過。沒有縮小動作掩蓋缺陷。

尚未交付正式助手人聲；既有 Medusa 角色聲仍靜音。此資料夾未代表平台已更新或通過整款遊戲送審。
