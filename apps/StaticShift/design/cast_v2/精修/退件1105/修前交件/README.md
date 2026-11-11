# Static Shift — 角色美術交件（2026-11-05）

正式使用 `dj/layers/`、`host/layers/` 與各自的 `assembled.png`：每位 26 張，共 52 張 1024×1536 真透明 PNG。同畫布原位，鞋底 y=1456。另有共用接口／疊序 layout.json 與來源雜湊。

- `qa/*-light-dark.jpg`：各層亮暗底。
- `qa/native-*-joints.png`、`qa/joint-*.png`：原生尺寸的靜態來源接合檢查，並非 Spine 動畫驗收。
- `qa/alpha-diffs/`：初稿到精修的 alpha 差異。
- `qa/source-repaint/`：初版褲子到新版生圖的輪廓變化；腿部保留檢查則以新版來源為準。
- `raw/`、`reference-master.png`：保留的初版來源，不能代替正式 layers／assembled。初稿的退件紀錄另存於上一層 source-qa-notes.md。

製程與使用說明見 `../DELIVERY.md`；內建 image_gen 的完整提示詞見 `../精修/source/joint-generation-prompts.json` 及初稿 generation-complete-manifest.json。沒有使用 CLI/API。

本次只交美術，未接 Spine、未整合遊戲、未打包 upload，也未更新平台。依需求單第 5.3，後續六組實際動畫與桌機／手機遊戲驗收由整合端執行。
