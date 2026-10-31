# 煉金轉輪、音效與背景優化（2026-10-31）

本版接續既有角色、獎圖及今天的背景改動；修改範圍限本 app，未更動共用套件、數學或其他遊戲。

## 轉輪

- `PresentationDirector.svelte` 提供共用 rAF 時鐘。轉速模糊在啟動時 110 ms 漸入，停輪時 125 ms 漸退；turbo 為 45／55 ms，不再由 1 → 0.3 → 0 硬切。每次轉換由當下 blur 銜接。
- 一般旋轉的回彈幅度由 0.30 降至 .18，停輪前速度改 2.7、回彈速度 0.18；快速、免費遊戲及金庫的專用 profile 保留。
- 加入輕量邊軌和軸底落定光，不晃動整個框、不額外延後 book event。新元件不寫入盤面或結果。

## 音效

- 採用實錄鼓、木擊、玻璃、marimba、FM 鋼琴及素材庫液體／氣流取樣，重新編排主曲與免費遊戲配樂。沒有程式振盪器或隨機噪音音色；原有三個角色錄音保持原檔。
- 五個獨立停輪檔，播放 rate 一律 1；turbo 停輪維持 0.24、60 ms 內疊加再減半，避免連停突響。
- 新增 Big → Max 各級 fanfare、平順跑分床與獨立收尾。數字跑完或點擊跳過後淡出 120 ms，再收尾；重複 stop、解碼前取消、重啟與卸載均有保護。
- BGM 改為 192 kbps stereo MP3，約 −20 LUFS；依量測的 encoder delay／guard 在 Web Audio 的實際 sample rate 裁切。44.1／48 kHz 解碼循環檢查通過。
- 音效共 48 檔、7,498,086 bytes（7.50 MB）。移除舊 sprite／jungle 資產與 EnableSound loader；所有既有 logical aliases 轉至本地對應，保留共用 UI 的按鈕與模式切換事件。
- 全部新檔真峰值 ≤ −1 dBTP、尾端 50 ms 低於 −42 dBFS。新 SFX 為 44.1 kHz／16-bit；大獎 fanfare 為立體聲。既有事件秒數依原始 sample rate 換算保留，包含忍者的 22.05 kHz 舊斬擊。

完整授權及成品來源：[OUTPUT_SOURCES.md](source/sampled_audio_v1/OUTPUT_SOURCES.md)、[LICENSES.json](source/sampled_audio_v1/LICENSES.json)。原件、授權網頁、VCSL 與 Kenney license 均保存於 `source/sampled_audio_v1/`；可離線重建。

## 背景

保留今天新增的藥霧、晶體與管道光流。BgAlive、BgLight 與背景漂移改用共用時鐘，煉金反應／Feature／大獎會擾動同一個光與霧氣包絡；BgProps 的 interval 改為 rAF，隱藏分頁跳過網格工作。

時鐘按實際時間前進，支援 30／60／144 FPS；隱藏分頁暫停背景時間，回到前景單幀最多推進 50 ms，避免整個場景突然跳動。掛載清理會取消 rAF、延遲音效與 pending 解碼。

## 試玩與試聽

- 本機 `pnpm dev` 後開 `/polish-review`：直接使用本 app 的 Background、Board、Sound 與 PresentationDirector，提供一般／快速旋轉、三個場景、音效開關、反應重擊、跑分開始與結束。沒有投注或 RGS 請求，DEV 條件在 production 不提供這些控制。
- [45 秒試聽](source/sampled_audio_v1/preview/showcase.wav)：主曲 → 五軸 → 小獎 → Scatter／期待 → Feature → 主題重擊 → Big／Mega 跑分 → 收尾／Max。
- 重建：安裝 `design/requirements-sampled-audio.txt`，執行 `python design/build_sampled_audio.py`。原主題生成器入口已轉呼叫此版。`source/sampled_audio_v1/rendered/` 與正式資產同步。

## 驗證與限制

- `python design/check_sampled_audio.py`：授權覆蓋、原件 SHA、角色未改、精確秒數、真峰值、尾音、44.1／48 kHz 解碼接縫及輸出一致性。
- `node design/check_presentation_polish.mjs`：實際 Sound 腳本的按鈕、五軸、turbo、多音上限、BGM 裁切、跑分重入／取消／卸載；實際 Director 的平順過渡、FPS 時鐘與隱藏分頁／清理。
- 專案資產、音效路徑與型別基線檢查通過；型別 gate 不代表既有錯誤已清零。
- 完整建置：**通過**。已核對 `build/assets/audio/` 全部檔案 SHA-256 與正式資產相同，沒有殘留 sprite／jungle 舊包。

瀏覽器視覺檢查未完成：Computer Use 因無法可靠判定目前 Windows 瀏覽器網址，停止本回合的瀏覽器操作。沒有改用其他方式繞過限制；未上傳 Stake，主觀音色及實際視覺效果仍待使用者試玩驗收。
