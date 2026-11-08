# Mummy Mayhem 美術、動畫、音效交付紀錄

## 最新交付：七項 UI／人物／輪盤修訂

見 [七項修訂交付](MUMMY_SEVEN_FIXES_20261107.md)。最新完整前端為 `release/MummyMayhem_frontend_review_20261107_seven_fixes.zip`，涵蓋價格價牌、揮手／跳起修正、四條長繃帶、BET hover、Autospin 選擇、貓臉輪盤入口、Turbo 減速及倍率落下遞增震動。以下為前版紀錄。

## 最新交付：獎圖、背景與繃帶接點精修

見 [人物／獎圖／背景動態修訂紀錄](MUMMY_MOTION_POLISH_20261107.md)。已加入沿繃帶傳遞的波紋、完全遮蓋的接點、各獎圖的動作節奏，以及同一氣流下的植栽、帷幕、繃帶與火舌。最新封包為 `release/MummyMayhem_frontend_review_20261107_motion_polish.zip`；以下較早版本保留供追溯。

## 人物修訂 v2

依回饋重畫較小、較平的腹部，保留原本頭部與四肢。原先落在腳邊的尾根改為 `[652,1053]`，接入骨盆後方；尾巴網格與髖骨共用父層，並保留實際遮蓋重疊。8 動作重新檢查均無網格翻面；419 格動態取樣中，尾根周圍 81 個採樣點全部持續同時落在尾巴與骨盆的不透明區域。原版保存在 `source/mummy_delivery/mascot_versions/v1_tail_belly/`。

新圖的內建 imagegen 提示與來源在 `source/mummy_delivery/originals/rig_torso_refine_v2.json`；比較圖為 `preview_mummy_20261107/character_tail_belly_v2.png`。換圖頭改由 `build_mummy_expressions.py` 單獨重建，`refresh_mummy_character.py` 僅更新人物與封面前景。

2026-11-07。範圍為本 app；共用 packages 與數學規則未改動。

## 最新修訂：加長繃帶與飄動

腰側與尾端各增加一條長繃帶，沿用目前已修好頸肩、尾根與較小腹部的角色。兩條繃帶各有 6 根獨立骨骼與 32 × 4 加權網格；保留柔和 S 形，採 6.4 秒循環、每節 75 ms 延遲，以 shear 為主、少量旋轉。`Mascot.svelte` 使用 track 1 播放 `bandage_flow`，身體 track 0 換動作或在 point 停格時，布條仍持續飄動。

新布條以內建 imagegen 製作，透明原圖在 `source/mummy_delivery/originals/flow_bandage_painted_v1.png`；完整提示與參考來源在 `source/mummy_delivery/mascot/flow/imagegen_provenance.json`。執行貼圖為 `static/assets/spines/mummyCat/flow_bandage.png`。

8 個身體動作搭配布條共取樣 3,080 格：無翻面、接點誤差 < 0.00002 骨架單位、循環接縫誤差 < 0.00002；既有身體骨骼、貼圖網格與 8 動作資料逐項比對未改動。停住 point 後布尾仍有約 26.6 單位的位移。報告在 `source/mummy_delivery/mascot/flow/verification.json`。離線預覽在 `preview_mummy_20261107/bandage_flow/預覽.gif`，由實際 Spine 4.2 網格逐格輸出，尚未做 Stake 實機驗收。

重建此修訂：`python design/prepare_mummy_flow_texture.py` → `node design/build_mummy_flow.mjs` → `node design/verify_preview_mummy_flow.mjs` → `pnpm build`。加長布條前的**目前人物完整版本**保存在 `source/mummy_delivery/mascot_versions/before_flow_runtime/`，包含最新頸肩修正；請勿以早期 v2 安裝腳本覆蓋它。布條腳本僅替換自己的 `flow_` 葉骨骼、網格與動畫，可重複執行。

最新完整前端包：`release/MummyMayhem_frontend_review_20261107_bandage_flow.zip`；SHA-256 與對應驗證資料在 `release/PACKAGE_bandage_flow.json`。完整 `pnpm build` 再次通過；型別檢查為 22 項既有診斷，未超出基準。4.2 runtime 含表情與布條共檢查 1,245 格；尾根重疊另驗 612 格，每格 81/81 個採樣點持續接合。先前封包保留供比較。

## 本次交付

- 13 個符號、3 套拆層墓室背景、砂岩盤框、Scarab／Sun Wheel 材質、5 級大獎牌、購買場景、繃帶轉場、商店方形／16:9 雙層封面。
- 圖像使用 **imagegen 內建工具**；生成原圖保存在 `source/mummy_delivery/originals/`，完整提示詞與原始生成位置在 `generated_sources.json`。所有執行用資產均已存入本專案，不依賴生成快取。
- 執行貼圖另編為 WebP，112 張由 63.91 MiB 降至 9.71 MiB；PNG 交付母圖與 Spine PNG 保留。檔案與尺寸見 `source/mummy_delivery/runtime_texture_budget.json`。
- 主角使用指定的 `wp/tools/mascot-rig` 套版，Spine 4.2.74；8 個動作：idle、wave、point、throw、cheer、laugh、disappoint、dance。3 種表情共用同一網格與輪廓。耳朵保留在頭部圖層，尾巴為獨立加權網格。
- Sun Wheel 在 `release` 事件啟動；cheer 聲音對齊 `takeoff`／`land`。一次性反應使用重置計時器；手機側邊空間不足時不繪角色。
- 盤框靜止；符號中獎只演主體細節；Scatter 僅做光澤掃過；750 ms 落地曲線不疊加第二支落地動作。25 格 idle 有長停頓，幅度 0.2%。
- 68 個音檔，以 VCSL 樂器實錄與 Joseph Sardin 的布料、石頭、貓叫錄音製作。音階為 D Hijaz；目前旋律採撥弦詩琴、木笛取樣，並非 oud／ney 實錄。鼓、鈴鼓、指鈸、定音鼓為實錄取樣，沒有以振盪器代替成品。
- 執行音效在 `static/assets/audio/mummy/`；無損 WAV 母帶在 `source/mummy_delivery/audio/`；來源、作者、CC0 授權及雜湊在 `source/mummy_audio/LICENSES.json`。
- BGM 與循環使用 Web Audio buffer；450 ms 換曲、Sun Wheel 壓至 30%、300／600 ms ducking、設定音量即時套用。大獎有獨立循環床與單次收尾，下一手會淡出前一手得分聲音。
- 舊礦坑美術與 jungle 音效移出 static，保留在 `source/legacy_boomana/` 以供追溯。

## 驗證

- 完整 `pnpm build` 通過：資產、音效、未定義引用、社交文案、型別基準、網格、idle／落地與 Vite 靜態建置。
- 型別檢查使用既有基準；仍有 23 項既有診斷，沒有新增超出基準的檔案。這不是「整個 monorepo 零型別錯誤」的宣告。
- 吉祥物 8 動作的網格翻面均為 0；原套版的流暢度評分均為 100，最大腳滑 1.5 px。含換圖頭的最終 4.2 runtime 再跑 857 格，網格頂點均有限值，出手／起跳／落地事件存在。
- 高分符號中央亮度 95.46–129.91（門檻 70）；低分亮區覆蓋率不超過高分最低值。數據見 `source/mummy_delivery/art_report.json`。
- 縮圖 200 px 合成的平均亮度 190.77、最暗 10% 為 136.78、低於 32 的比例 0.14%。
- 音效總大小約 4.34 MiB；44.1 kHz、真峰值不高於 −1 dBTP；BGM 約 −20 LUFS。每個新檔皆有來源紀錄，循環接點有解碼後檢查。
- 需求同時指定 tick 長度 ≤30–40 ms 與最後 50 ms 低於 −42 dBFS，兩者不能同時成立。本次對 **≤50 ms 的短 cue 驗尾端 5 ms**，其餘非循環檔仍驗 50 ms；另檢查 tick 的峰值不能低於 −25 dBTP，避免形式過關卻聽不見。
- 輪盤動畫有牆鐘期限，避免背景分頁的 rAF 暫停造成流程卡住。
- 依需求單未開瀏覽器。`preview_mummy_20261107/` 是素材合成預覽，**不是實際遊戲截圖**；尚未做 Stake 上傳與實機聽感／互動驗收。

## 查看

- `preview_mummy_20261107/base_art_composite.png`：主遊戲素材合成。
- `preview_mummy_20261107/sun_four_levels.png`：四級太陽輪。
- `source/mummy_delivery/symbol_contact_118px.png`：實際格子尺寸的符號表。
- `source/mummy_delivery/mascot_built/逐格.png`：8 動作逐格表。
- `source/mummy_audio/preview/showcase.wav`：音效示範。
- `source/mummy_delivery/DELIVERY_MANIFEST.json`：交付 PNG 清單。

## 重建

使用 E 槽 Node 22 工具鏈。一般改程式直接在 app 執行 `pnpm build`。

重建美術時依序執行 `build_mummy_art.py`、`finish_mummy_assets.py`、`package_mummy_environment.py`、`preview_mummy_delivery.py`，最後執行 `optimize_mummy_runtime.py` 與 `verify_mummy_runtime.mjs`。原圖均使用專案內的 originals。

若重建角色骨架，先執行 `assemble_mummy_rig.py`，以 `wp/tools/mascot-rig/mascot.ts build` 搭配 `--spine 4.2 --grid 18 --no-gif` 輸出至 `source/mummy_delivery/mascot_built`，複製 game 的三個檔案到 `static/assets/spines/mummyCat`，再執行 `finish_mummy_assets.py` 加入換圖頭。

音效使用 `build_mummy_audio.py` 從保留的 raw 取樣重建，再執行 `verify_mummy_audio.py`。`fetch_mummy_samples.py` 僅在缺少原始取樣時需要連線。`install_*`、`integrate_*`、`clean_mummy_runtime.py` 為本次遷移腳本，不是例行建置步驟。
