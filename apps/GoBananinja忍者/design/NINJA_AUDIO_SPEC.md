# Go Bananinja 音效交付

音效以輕快忍者冒險為方向：太鼓負責節奏和大獎重量，拍子木／木魚負責介面及停輪，箏與三味線式撥弦負責連續得獎，笛音和金屬鈴負責轉場，刀風與斬擊負責切輪。音色刻意保留一點卡通感，避免所有事件都像戰鬥爆炸。

## 檔案與事件

音檔位於 `static/assets/audio/ninja/`。`src/components/Sound.svelte` 將既有遊戲事件對到以下檔案；切輪的拔刀與落刀由 `src/components/ReelSplits.svelte` 依動畫時點分別觸發。

| 時機 | 音檔 | 設計 |
|---|---|---|
| 一般盤面 | `bgm_main.wav` | 108 BPM，輕快五聲音階、箏撥弦與柔和太鼓 |
| 免費遊戲 | `bgm_freespin.wav` | 138 BPM，密集拍子木與加強太鼓 |
| 介面、轉輪 | `btn.wav`, `spin.wav` | 短木擊與啟動刀風 |
| 停輪 | `reel_stop.wav` | 木擊與鼓點，五輪在程式中逐輪升調 |
| Scatter | `scatter_1.wav` 至 `scatter_5.wav` | 五個逐漸升高的金屬鈴音 |
| 倍率、Wild | `pluck_low.wav`, `mult_update.wav`, `wild_expand.wav` | 低撥弦、雙音提示、煙霧展開 |
| 切輪 | `slash_draw.wav`, `slash_hit.wav`, `slash_finale.wav` | 拔刀風聲、斬擊、最終斬擊 |
| 小獎、大獎 | `win_gliss.wav`, `win_gliss_big.wav`, `bigwin_blast.wav`, `coin_shimmer.wav` | 上行撥弦與太鼓，獎額越大越厚實 |
| 免費遊戲開場 | `gong_feature.wav`, `fs_intro.wav` | 鈴與笛的召喚、太鼓開場 |
| 期待與爆發 | `reel_tension.wav`, `grenade_blast.wav` | 鼓點漸緊、低頻煙霧爆發 |
| 角色 | `voice_effort.wav`, `voice_roar.wav` | 無字短呼聲；`monkey_expand.mp3` 沿用先前提供的猴叫音檔 |

`design/NINJA_AUDIO_PREVIEW.wav` 是 20 秒試聽串燒，依序涵蓋一般背景、轉輪、Scatter、切輪、小獎、免費遊戲、大獎與免費遊戲背景。完整循環請直接聽兩個 BGM 原檔。

所有 `.wav` 都由 `design/generate_audio_ninja.mjs` 以固定種子產生，22,050 Hz／16-bit／mono，可重建且未使用第三方音樂素材。遊戲音量仍受現有音樂／音效設定控制。現有 `sounds.mp3` 和 `sounds.json` 仍是未改寫事件的備援資源。
