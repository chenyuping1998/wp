# Medusa Gaze 音訊來源與授權

2026-10-24。範圍僅 `MedusaGaze梅杜莎凝視`，未修改共用套件或其他遊戲。

## 本次素材

`static/assets/audio/medusa/` 的 57 個音檔由 `../medusagaze/audio/generate_audio.py` 原創程序合成。主題旋律、編曲、泛音合成、噪音、調頻、共振與包絡均在原始碼定義；亂數種子為 `20261024`。未下載、使用或取樣現有曲目、卡通 / 情境喜劇主題曲、希臘民謠、第三方音效、真人聲音或罐頭笑聲。這些新生成檔與程式依本遊戲專案的 MIT 授權管理；不另加採樣授權或署名費用。

合成用 numpy、scipy；FFmpeg 7.1 為本機 `imageio_ffmpeg` 提供的工具，僅用於格式轉換、Vorbis 編碼和量測。未將工具程式或第三方聲音內容包入遊戲。

**`vo_medusa_*` 全部為同一套中音鼻音 formant 演算法的合成預聽，並非真人演出或定稿配音。** 仍需同一位真人演員完成非語言表演。蛇聲、環境動物聲同樣為程序合成。未提供選配的最大獎罐頭笑聲 / 掌聲錄音。

## 交付與規格取捨

- SFX：WAV、44,100 Hz、16-bit、單聲道。起音防爆音坡度為 0.15 ms；音效起音均在 5 ms 內。峰值皆低於 −1 dBTP，詳見 [LEVELS](../medusagaze/audio/LEVELS.md)。
- BGM：兩首各 64 秒、相同 C 大調原創主題。主遊戲 120 BPM / 32 小節；免費遊戲 135 BPM / 36 小節。以循環緩衝區混音，尾音繞回開頭；不以硬切或一般檔尾淡出假裝無縫。遊戲以 Web Audio 的解碼 PCM 取樣迴圈播放。
- 母帶：`../medusagaze/audio/masters/*.wav`，48,000 Hz、24-bit。BGM / 環境為立體聲；SFX 母帶為單聲道。
- 需求單同時要求兩首 60–90 秒的 WAV 立體聲配樂與全部音訊 ≤12 MB。單是兩首 64 秒的 44.1 kHz / 16-bit 立體聲 WAV 就需 **22,579,200 bytes PCM**（另有檔頭），無法同時滿足。因此遊戲 BGM / 環境改交 Ogg Vorbis q5、44.1 kHz 立體聲，保留未壓縮母帶。原創執行音訊總計 **6,690,574 bytes / 6.69 MB**。這項取捨已明列於試聽頁與 LEVELS，未把壓縮檔宣稱為 WAV。
- 需求的兩份 44.1 kHz / 16-bit 立體聲 WAV 配樂已另交 `../medusagaze/audio/wav-reference/bgm_base.wav`、`bgm_feature.wav`。它們與 48 kHz / 24-bit 母帶一起保留在設計來源資料夾，未加入正式下載包，以免超出預算。
- 短於 3 秒的檔案量 LUFS 時，完整重複至至少 3 秒，解決 R128 缺乏有效 400 ms 視窗的問題；數值為 audition 參考，不宣稱等於短檔原始 integrated LUFS。`audio_metadata.json` 每檔記錄方法。

## 重建與驗證

在本 app 執行：

```powershell
python design/source/medusagaze/audio/generate_audio.py
python design/source/medusagaze/audio/build_preview.py
node design/sync_audio_manifest.mjs
node design/check_audio.mjs
```

Python 需 numpy、scipy、imageio-ffmpeg（或以 `FFMPEG` 環境變數指定執行檔）。試聽頁：`../medusagaze/audio/preview.html`，可直接開啟；本機 HTTP 模式另可聽 Web Audio 的交叉淡入淡出。試聽不會提交任何外部資料。

## 接線與仍待驗收

`Sound.svelte` 將既有 sprite 事件全部映射到新素材；支援 5 段連消升調、綠 / 紫 / 金寶珠、2 種落空與笑聲變體、大獎 5 階、主遊戲 / 免費遊戲與環境交叉淡入淡出。下一手的 `soundScatterCounterClear` 或手動 Spin 將一次性 / 計數 / 大獎音效以 150 ms 淡出，BGM / 環境保留。靜音及音量變動即時作用於 Web Audio 匯流排。視窗隱藏會暫停音訊。

Buy Bonus hover / confirm 的獨立 cue 已提供，現有共用 UI 只發一般按鈕事件，尚無精準獨立事件。蛇待機哈欠與石像碎裂 cue 已提供，待對應動作觸發；未偽造不存在的視覺事件。最大獎人群笑聲為選配，未製作。真人配音、筆電喇叭聽感、連按 20 次的主觀疲勞度仍需人工驗收。

## 舊範本素材

`legacy-template/` 保留原 app 的 9 個舊音訊 / sprite 描述檔（21,511,091 bytes），供回復與來源追蹤；本次沒有創作或重新授權這些舊素材。它們已離開 `static/`，`assets.ts` / `EnableSound.svelte` 也不再載入，故不列入正式遊戲音訊大小或原創交付。恢復舊音訊時請自行核對原有授權。
