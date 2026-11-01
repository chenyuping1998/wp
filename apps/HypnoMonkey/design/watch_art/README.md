# 催眠倍率懷錶 — 2026-10-28

`source-bronze.png`：內建 imagegen 生成的原稿，提示詞保留於 `PROMPT.txt`。原圖不覆寫。

`build.py` 依既有程式修圖授權統一錶面中心、透明邊緣及金屬色階，產生銅／銀／金三階。錶面空白，倍率由遊戲文字繪出，避免圖片上的固定數字和 book 不一致。輸出在 `static/assets/sprites/hypnoWatches/`，來源及輸出 hash 見 `manifest.json`。

- 銅：×2–×10；銀：×15–×50；金：×100 以上。
- 512×512 RGBA，錶面文字 anchor 為 (0.5, 300/512)，含錶冠的完整物件不裁切。
- 保留既有 mgOrbGreen/Purple/Gold 內部 key 供 FX 使用，但實際載入三張懷錶；不是舊寶珠變色。
- 圖片無角色／場景，`light-dark.jpg` 為亮暗底檢查、`tiers.jpg` 為帶範例倍率的閱讀檢查。
- 背景、圖騰、FG 助手與完整 UI 換皮仍未完成；未打包或更新平台。

重建：`python3 design/watch_art/build.py`；時序與獎金單位檢查：`pnpm check:watches`。
