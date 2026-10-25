# Treasure Monkey 海灘尋寶

海灘尋寶的美術、動畫與原創合成音訊整合版。最新規格見 SPEC.md，實作狀態與限制見 HANDOFF.md，動畫方向見 design/ANIMATION_DIRECTION.md。

使用 E 槽 Node 工具鏈。首次取得專案執行 `pnpm setup:local`，在 workspace 安裝依賴後執行 `pnpm dev`。

- http://127.0.0.1:3043/setup：人物裝備樣張與開案預覽。
- http://127.0.0.1:3043/studio：使用本款實際元件與素材的美術、動作、音效檢視；含完整演出、半速、角色／符號／手繪碎浪逐格滑桿。
- http://127.0.0.1:3043/animationlab：實際 Pixi 沙粒元件，支援依序停輪、急停與 Turbo。
- 根路徑為平台引擎，需有效 RGS session。

目前使用獨立海灘背景、12 個符號、兩套人物分件、兩張眨眼、寶箱蓋／沙堡旗幟分件、木框介面、尋寶演出、33 個音效及兩首合成配樂。角色有獨立動作軌與腳掌／握持約束，正式中獎元件使用本款物件演出。原始圖與提詞在 design/source/treasure，生成與檢查腳本在 design。舊 donor 檔案仍保留供比對。

正式數學、RGS 整場驗證與最終動畫／聆聽調校仍待完成；預覽沒有評獎或平台 session，不能作為正式上傳版本。
