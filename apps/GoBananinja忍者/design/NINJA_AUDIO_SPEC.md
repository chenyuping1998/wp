# Go Bananinja 音效交付（取樣版 2026-10-31）

目前以 CC0 取樣重製，採木擊、實錄鼓、psaltery 撥弦及 recorder 木笛；斬擊由氣流、撞擊及少量玻璃碎片疊層。五軸改為 `reel_stop_1..5.wav`，播放 rate=1。主曲 108 BPM、免費遊戲 138 BPM，各 16 小節；角色原檔保留。大獎有五個分級 fanfare、獨立跑分床與 120 ms 收尾。

詳見 [本版交付紀錄](PRESENTATION_POLISH_20261031.md)、[逐檔來源](source/sampled_audio_v1/OUTPUT_SOURCES.md) 與 [45 秒試聽](source/sampled_audio_v1/preview/showcase.wav)。

執行 `python design/build_sampled_audio.py` 可離線重建；舊 `generate_audio_ninja.mjs` 入口亦轉呼叫此版。新 SFX 為 44.1 kHz／16-bit WAV；BGM 為有解碼後裁切的 192 kbps stereo MP3。先前 22.05 kHz 純合成版本與舊 `NINJA_AUDIO_PREVIEW.wav` 僅是歷史產物，本次驗收請用上述試聽與正式資產。
