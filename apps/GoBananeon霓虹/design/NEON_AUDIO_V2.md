# Neon audio — DJ scratch / sampler pads / club drops

本次重做／新增 41 個音效／音樂檔案，保留角色的 `voice_roar`、`voice_effort`、六聲 `monkey_expand` 表演。全包共 44 檔，源檔與遊戲使用的 WAV 同步。全部新內容由本地 deterministic DSP 原創生成，沒有使用 PP、Hacksaw 或其他商業遊戲的音檔。

最新方向是有趣、明確的 DJ 語彙：自製唱片 grain 前後拉動形成 **wicka-wicka**，crossfader 切拍、短 minor-seventh synth stab、sampler pad、節奏 bass fill。Scratch 是實際重取樣前後移動，不是以長科幻掃頻代替。

依「刷碟太大聲、太低沉」回饋，`neon-dj-light-v5` 將唱片基音 110 → 165 Hz（約高 7 個半音），共振往上移，重取樣後加 260–440 Hz 軟高通，顆粒／摩擦噪音約減少三分之二。保留四次前後拉碟與切拍節奏，縮短最後 pad 收尾，爆炸主撞擊與原本 BGM 節奏保留。

## 聲音演出

| 視覺事件 | 聲音 | 時間與設計 |
| --- | --- | --- |
| `soundBlastFuse` | `fuse_sizzle` | 380 ms 四組短拉碟／切拍，在同一引爆點收尾 |
| `soundBlastDetonate` | `dynamite_blast`／`dynamite_blast_big` | 1.10／1.34 s，club drop 將撞擊／kick／短 chord stab 疊合；1–4 軸逐步降低音高增加重量，滿盤另有低頻殼及 bass fill |
| `soundBlastShatter` | `symbol_shatter` | 700 ms，19 顆程序化玻璃／數位碎片，與主撞擊分離 |
| `soundBlastSmoke` | `smoke_puff` | 900 ms，濾波氣浪，輕且迅速衰減 |
| `soundBlastReveal` | `symbol_reveal` | 1.03 s 檔案中的短 sampler chord 問答，主體在前 300 ms 完成 |
| `soundBlastColumn` | `symbol_land` | 210 ms 的乾脆 sampler pad 落位聲，各欄輕微升調 |
| `soundBlastEnd` | 背景音樂還原 | 420 ms 平滑回到原始音量 |
| `soundDjScratch` | **新增 `dj_scratch`** | 3.2 s；0–.45 抬手留白，.60／1.08／1.56／2.04 s 四次前後刷碟，每週期 .48 s（125 BPM），2.54 s 短 pad 收尾 |
| `soundDjScratchStop` | 立即停止 | 停掉所有當前 DJ buffer voice／HTML fallback，不等尾音，解碼完成也不會稍後重播 |

時間跟隨 `blastTimeline.ts` 的 `blastBeats(width)`：單軸引爆 380 ms、煙柱 554 ms、揭示 810 ms；滿盤引爆 380 ms、煙柱 660 ms、揭示 1060 ms。聲音事件沿用既有 API，Detonate 增加 optional `width`。

一般按鍵、起轉、停輪、Scatter、階梯、Wild、Win plaque、五個大獎級距與兩首背景音樂皆已重做。主音樂 105 BPM / 36.571 s，免費遊戲 128 BPM / 30 s，16 小節有 swung 斷拍、ghost snare、短和弦切拍及問答留白，尾韻折回開頭。主音樂 36 秒內只有兩次短 scratch，免費遊戲 30 秒內四次；每個 reel stop 維持乾脆短擊，沒有堆 scratch。

## 播放與混音

- `Sound.svelte` 預解碼短音效到 Web Audio buffer；每種聲音最多 4 個重疊 voice，短尾韻不會因下一次觸發被硬切。
- SFX 有共用動態壓縮與 0.82 輸出 headroom；音樂與角色聲音也進入最終 master safety bus。音效設定在 SFX bus 套用一次。
- 兩首 BGM 用 `AudioBufferSourceNode.loop` 無縫循環，450 ms 交叉淡入淡出。蓄力時 BGM 在 140 ms 內降至 43%，替衝擊留空間。
- 人物刷碟期間以獨立因子將 BGM 降至 55%，保留輕快 groove。人物刷碟 runtime gain 由 .76 降至 .52，音檔本身也減量；完成／中斷在 250 ms 還原。與爆炸 duck 相乘，DJ 停止不會解除還在進行的爆炸 duck。
- 停止命令會使尚在下載／解碼中的 loop／music request 失效，不會稍後自行重新播放。
- Web Audio 無法使用時有 HTML Audio fallback。

## 檢查與預覽

```powershell
python design/build_neon_audio_v2.py
node design/check_audio.mjs
python design/check_neon_audio.py
node design/check_neon_audio_bus.mjs
node design/check_types.mjs
```

全量 `build_neon_audio.py` 最後也會呼叫新版 refresh，避免日後重建回復舊音色。

`design/source/neon_delivery/audio_preview/` 有：

- **`neon_dj_light_showcase.wav`**：最新輕快版，新檔名避免播放器 cache。12 秒依序為人物刷碟 3.2 s → 單軸拉碟／drop／pad → 滿盤 fill／drop／reveal → 獎項短旋律；人物混音 .52、BGM duck .55，與 runtime 相同。
- **`dj_light_mascot_3_2s.wav`**：最新輕快版獨立人物刷碟預覽。
- `neon_dj_showcase.wav`：同步更新為輕快版。
- `neon_audio_showcase.wav`：同步更新為同一 DJ 混音。
- `dj_mascot_3_2s.wav`：獨立人物刷碟音效預覽。
- `blast_1_reel.wav`、`blast_5_reel.wav`：依事件音量與時點的離線參考混音，供近距離比較層次。
- `audio_metrics.json`：每檔 SHA-256、時間、峰值、RMS、最後 50 ms 音量與 180–5000 Hz 能量占比。
- `dj_scratch_light_comparison.json`：新舊音色測量。音檔 RMS −21.69 → −24.97 dBFS，降低 3.28 dB；250 Hz 以下能量 15.165% → 0.001%，500 Hz 以下 37.556% → 7.232%。再加 runtime gain .76 → .52，人物總 RMS 約降低 6.58 dB。
- `dj_mascot_before_light.wav`：保留前版未乘 runtime gain 的源音效，供音色比較。`python design/measure_dj_tone.py` 可重測最新檔對比。

單軸／滿盤的**壓縮前**事件混音峰值為 −3.06／−2.48 dBFS；引爆檔手機中頻能量占比分別 43.7%／37.4%。重要爆炸、碎片、氣浪、揭示和落位的最後 50 ms RMS 均低於 −42 dBFS；人物刷碟最後 50 ms 已收至數位靜音。離線預覽以 tanh 模擬溫和輸出保護，並非瀏覽器擷取；瀏覽器實際使用上述 compressor bus。

目前工具環境不支援音訊輸入，這一輪已做可測量的檔案／事件／播放生命週期驗證並交付可播放預覽；最終主觀音色與耳機／手機實機平衡仍需聽覺驗收。
