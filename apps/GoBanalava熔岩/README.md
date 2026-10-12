# Go Banalava 熔岩

Go Bananas 的火山探險換皮。角色穿熔岩防護服，盤面使用黑曜石與發光裂縫；高分符號與功能符號改為火山石、熔岩果、探測器等主題物件。

## 來源與規則

- 前端以 `GoBanalchemy煉金` 的版型、流程與遊戲事件為基礎；本資料夾使用獨立的遊戲名稱、素材路徑與開發埠 3022。
- 數學設定與產物位於 `E:\stake\math-sdk\games\GoBanalava`。玩法、賠付、轉輪與 95% RTP 沿用煉金版；五種模式的 books、lookup tables、force、最佳化與統計產物已完整複製。前端、後端與索引設定已由 GoBanalava 的 `GameConfig` 重新產生，所有複製檔與後端引用的 SHA-256 雜湊均通過比對。這是相同數學模型的複製，沒有重新模擬；獨立發佈前仍應跑 RGS 與 RTP 驗收。
- `npm run sync:math` 從數學設定產生 `src/game/config.ts`；`npm run build` 會先同步設定，再檢查素材、音效、引用、角色網格與動作，最後建置前端。

## 美術交接

- 可編輯角色檔：`design/source/GoBanalava_explorer.psd`。高解析主圖：`design/source/banalava_mascot_v2_boom.png`；以 Boom 原始角色的體型、站姿、頭部、手臂與腿部位置為基準，只重畫火山防護服與配件。舊的 v1 主圖留在 `design/source/` 作比較，不作為遊戲素材。
- 遊戲角色：`static/assets/spines/goBananasMonkey/monkey.json`、`monkey.atlas`、`lava_body.png`。`design/build_banalava_mascot.py` 可從主圖重建 PSD 與 Spine 加權網格，並將熔岩版 B 符號放入投擲道具圖集。
- 角色沿用 Boom 的 25 根骨骼與九段原始動畫：`alert`、`cheer`、`chestbeat`、`flinch`、`flutter`、`glance`、`idle`、`nod`、`throwit`。原有動作時間線未修改。`npm run check:mascot` 會在 Spine runtime 中逐格檢查九段動畫的網格是否翻面、靜止姿勢是否對齊。
- 主題符號：`static/assets/sprites/goBanalavaSymbols/`；明亮版背景：`goBanalavaBackground/`；UI 插畫：`goBanalavaUi/`。H1–H4 使用琥珀金、青藍、銅橘、金黃四色，但採用獨立的火焰果、圓形渦流、三角探測器、放射狀種莢輪廓，沒有 Boom 的方形石板底座。前兩版備份於 `design/source/old_high_symbols/` 與 `design/source/boom_color_high_symbols/`。L1–L5 的字形可見高度已校準一致，特別放大原本偏小的 10；`design/generate_volcanic_low_symbols.mjs` 可重建。原暗色背景備份於 `design/source/dark_backgrounds/`。`design/generate_heat_probe_ladder.mjs` 可重建探測器階梯。
- `design/banalava_actions_contact.png` 和 `design/banalava_symbols_140.png` 是交接用檢查圖，不參與遊戲載入。

## 素材產生摘要

新繪圖以影像生成的 bitmap 模式製作：火山熔岩洞穴三種遊戲場景、黑曜石裂縫盤框與 UI 板、熔岩探險猴、火山石與熔岩果等主題符號。背景第二版將洞穴改為日光、淺陶土色火山岩、金色礦物與明亮熔岩；低分字母符號由 SVG 腳本產生。複製來源中尚有煉金版設計參考檔和未使用的素材；以本檔列出的熔岩版路徑為交付來源。
