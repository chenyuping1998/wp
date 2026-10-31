# Neon 音效 V3 重建與驗收

本版本使用 CC0 實錄鼓、Yamaha TX81Z 硬體音色取樣、Technics SL-1200 唱盤刷碟，以及錄製的玻璃／撞擊與素材庫音效。所有旋律以取樣樂器演奏，沒有程式振盪器或隨機噪音。

## 重建

安裝 `design/requirements-audio-v3.txt` 後，在 app 目錄執行 `python design/build_neon_audio_v3.py`。原始素材已留在 `raw/`，重建不需網路。V1／V2 的完整建置入口會轉呼叫 V3。

輸出同步寫入 `static/assets/audio/neon/` 與 `design/source/neon_delivery/audio/`；BGM 是 192 kbps stereo MP3，其餘新成品為 44.1 kHz／16-bit WAV，大獎 fanfare 使用 stereo。

## 授權

逐成品來源請看 [OUTPUT_SOURCES.md](OUTPUT_SOURCES.md) 和 [LICENSES.json](LICENSES.json)。`SOURCES.json` 記錄取得的原件，`VCSL-LICENSE.txt`、Kenney 原附 License.txt 與來源網頁保存了授權證據。三個原核可角色檔案不更動。

## 播放與時間

主曲 105 BPM、免費遊戲 128 BPM，各 16 小節；同一和聲組。MP3 關閉 Xing gapless metadata，保留明確 100 ms guard；FFmpeg 解碼量測 1105 samples 延遲，加 guard 後由 Web Audio 依實際 sample rate 裁切，再循環播放。`src/game/neonAudioLoops.ts` 和 JSON 由建置產生；檢查器驗證同步。

`TIMING_BASELINE.json` 保留替換前的樣本數。Feature 全部時長逐樣本相同；FullBoard 依 190 ms 節拍，DJ 依 0.60／1.08／1.56／2.04 s 及 2.54 s 收尾；fuse 四下位於 0／92／184／276 ms。

跑分床使用獨立 2 秒循環，重複開始不重啟；數字跑完／點擊跳過時淡出 120 ms，再接收尾音。重複 stop、解碼前 stop、重啟與卸載皆有回歸測試。

## 試聽

`preview/v3_showcase.wav` 為 60 秒，時間表見 `preview/TIMELINE.json`。另有兩首 BGM 的雙循環 WAV，供比對接縫。試聽是離線事件混音；遊戲另有音量設定、ducking、bus compressor 和 headroom，實際混音以遊戲為準。

## 已知限制

依需求單未開瀏覽器／未上傳 Stake。自動驗證涵蓋 FFmpeg 44.1／48 kHz 解碼、音檔母帶與實際 Sound.svelte 邏輯的 VM 測試；主觀音色及 Stake 審核仍待使用者試聽／平台驗收。無 Web Audio 的舊瀏覽器保留 HTML Audio 備援，該備援不保證無縫 MP3 循環。

`check_types.mjs` 使用專案既有的逐檔錯誤基線；本次沒有新增錯誤，既有 19 項型別錯誤未在音效任務內處理。
