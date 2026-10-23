# Turf — Spine 動作更新（2026-10-23）

已把 MG 蒙面打手與 FG Kingpin 接到 Claude 新做的 spine-motion-kit。保留目前定稿外觀、比例和抱胸姿勢，現有分層足夠，因此這次沒有重畫。

## 實作

- `build_spine_motion_cast.mjs` 將既有 measured joints、網格與權重轉成 Spine 4.3.13；沒有重新猜骨架。所有動作交給工具的 `compileRecipe` 產生。
- `idle` 用工具的 breathe 預設，加上有相位差的頸部、金鏈、口罩尾／煙霧；MG 3.6 秒、FG 4.2 秒。抱胸手臂跟隨胸口，不獨立拉伸。
- `win`／`winBig`／`trigger` 用工具的 poses 配方，演出預備、抖肩、抬下巴與配件延遲回彈；長度分別 0.9／1.15／1.35 秒。頭部轉幅依現有頸部權重限制到 2.4° × 強度，避免下緣網格壓縮。
- 遊戲的 `SpineCastFigure` 使用官方 4.3.13 runtime 計算動畫和加權網格，再用 Pixi Mesh 畫出。4.2 的既有符號 runtime 保留，版本分開。
- 反應疊在持續呼吸之上，沿用遊戲實際的得獎、重大得獎、免費遊戲觸發與倍速事件。MG／FG 轉場和免費遊戲開場卡共用這個元件。
- 卸載時釋放實例網格，不銷毀 asset loader 管理的共用貼圖。

## 驗證

- 完整 `pnpm build` PASS，包含舊有美術／比例／音效／動作檢查與新的實際 Spine 網格檢查。
- 工具流暢度：兩隻四個動作均 100 分；零 error／warning。一次性動作仍有急起急停 info，詳見 `base.check.md`、`fg.check.md`；分數不等於美術判斷。
- 每隻各 8,641 個 setup／idle／三種反應姿勢，涵蓋四個 idle 相位、1／2／4 倍速和重複打斷。無翻面、非有限頂點或超出布局包絡。三角形面積比 MG 0.700–1.356、FG 0.685–1.306；鞋底位移最大 0.000061px。完整值在 `geometry-check.json`。
- 轉換前後 setup 頂點最大誤差 <0.001px。曾以較大的頭轉幅觸發新網格檢查失敗，再收斂動作，證明該閘門能捕捉實際變形問題。
- 本機 published-book fixture 實播：MG 盤面、Kingpin 開場卡與免費遊戲盤面；1280×720、1024×768、390×844 都已檢查。角色朝盤面，橫向不壓盤，手機頭胸保留在盤面上方；影像在 `qa/`。
- 沒有對真實 RGS 下注；沒有完成這輪 fixture 的全部十次免費遊戲，未將自動回到 MG 記為已驗證。
- 全專案 `check:types` 仍 FAIL：915 errors／49 warnings，主要在既有 design 工具、備份檔、stories 與共用套件。本次 `spineCastData.ts`、`spineCastFigure.ts`、`CastFigureMesh.svelte` 沒有報錯；不能宣稱全專案型別檢查通過。

## 檔案／重跑

```bash
node design/build_spine_motion_cast.mjs
node design/check_spine_motion_cast.mjs
pnpm build
node design/stage_spine_motion_qa.mjs
python3 design/serve_spine_motion_qa.py
```

本機預覽：`http://localhost:8317/`。QA 控制頁、stub 和匯出功能只在 `dist/turf-spine-motion/`，不進 production build。Spine Import Data 完整交件在 `base/`、`fg/`，包含 JSON 與 `images/`；可重產的配方和 setup 骨架也一起保留。

本次僅更新本機程式與套件。平台未上傳、未發佈、未送審。既有 thumbnail／cover 圖層一併保留在 upload 套件；沒有新商店圖需求。
