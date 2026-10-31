# Go Bananeon 音效 V3 需求單（Stake 審查 2026-10-31：Bad sound design）

給執行者（Codex）。範圍只限 `wp/apps/GoBananeon霓虹`：不要改 `wp/packages/*`，也不要動其他遊戲。

## 1. 為什麼被退

Stake 審查的評語是 **Bad sound design**。

目前 44 個音檔裡，除了 `monkey_expand.mp3` 和兩個人聲，全部是 `design/build_neon_audio_v2.py` 用 deterministic DSP 從零合成的：正弦、噪音、濾波、重取樣。檢查腳本量得到的東西（峰值、RMS、尾音、時間點）都合格，但成品聽起來單薄、像電子玩具，沒有真實樂器、真實撞擊的質感和空間感。這是根本原因，調參數救不回來。

另外還有三個結構問題：

1. **大獎沒有跑分聲。** 跑分期間只打一次 `coin_shimmer`（`Sound.svelte` 的 `soundLoop` → `sfx_bigwin_coinloop` 被刻意改成單發），之後整段只剩 BGM，慶祝感薄弱。
2. **五軸停輪是同一個 140 ms 檔案變速**（rate 0.92–1.30），高軸聽起來像快轉。
3. **範本的 `audio/sounds.mp3`（4.7 MB）仍在 `assets.ts` 被 preload**，但幾乎所有事件都已改走 `neon/`，等於白載。

## 2. 硬性規則

1. **成品必須以真實取樣為基礎。** 可以是實錄素材、素材庫取樣、取樣式樂器（鼓組、貝斯、合成器音色取樣都可以）。DSP 只能拿來做後製：EQ、壓縮、剪接、疊層、變調、殘響。**不接受**純程式生成的波形當成品。
2. **授權要乾淨、要留紀錄。** 只用 CC0 或允許商用、免署名的 royalty-free 素材，例如 Sonniss GDC Game Audio Bundle、Kenney、Freesound 上標 CC0 的檔案、OpenGameArt 上標 CC0 的檔案。每個用到的來源都要記進 `design/source/neon_audio_v3/LICENSES.json`，欄位為：成品檔名、來源網址、作者、授權、原始檔名。
   **禁止**用任何商業 slot 的音檔，包括 Pragmatic Play、Hacksaw、Push 等，也不准從它們的 demo 抓。
3. **檔名、事件、時間點不變。** 下表「時間鎖定」欄標了的檔案，長度和重拍位置必須照抄現值，因為畫面動畫是對著它們做的（`blastTimeline.ts`、`FullBoard.svelte`、`mascotDirector`）。
4. **母帶**
   - 44.1 kHz。SFX 用單聲道，BGM 和大獎音樂用立體聲。
   - 真峰值不超過 −1 dBTP。
   - 尾端 50 ms 要淡到 −42 dBFS 以下，避免切掉時爆音。
   - 響度目標：BGM 約 −20 LUFS（integrated）；常用 SFX（停輪、按鈕、小獎）比 BGM 突出但不刺耳；大獎與 Feature 觸發最響。
   - 播放端已經有 compressor 和 0.82 headroom，不要再把檔案壓扁。
5. **循環要無縫。** BGM、跑分 loop、`reel_tension` 都用 `AudioBufferSourceNode.loop` 播放，首尾要對齊零交越點，並且在小節線上。
6. **檔案大小。** 現在 `neon/` 共 17 MB，大多是兩首 WAV BGM。短 SFX 可以維持 WAV。BGM 若改成 mp3，必須處理編碼器 padding（設定 `loopStart`／`loopEnd`，或在解碼後裁掉），並且實際驗證循環沒有空隙；做不到就維持 WAV。整包目標 ≤ 10 MB。

## 3. 風格

霓虹不夜城、街頭 DJ、synthwave。參考的是**氣質**，不是任何特定遊戲的聲音：

- **鼓組**：真實或取樣的 kick、snare、clap、hat，有 swing，不要 8-bit 感。
- **低頻**：取樣貝斯或 analog synth bass；合成器 pad 和 stab 用取樣音色。
- **刷碟**：用真實唱盤刷碟取樣。現有的「wicka-wicka」節奏設計和時間點保留，音色換成真的。
- **爆炸系（Pulse Bomb）**：真實撞擊或爆炸取樣，加電流、玻璃破碎、低頻衝擊疊層。重點是「電漿彈」，不是礦坑炸藥。
- **金色只屬於 Scatter**：只有 Scatter 系列可以用鐘、鈴、閃亮的金屬聲，其他獎圖不要。
- **節制**：一般 spin 的聲音要短、乾淨。大部分時間要安靜，好讓大獎有落差。

## 4. 檔案清單

路徑都是 `static/assets/audio/neon/`，觸發點都在 `src/components/Sound.svelte`。

### A. 最常聽到（優先度最高）

| 檔案 | 現長 | 觸發 | 要求 |
| --- | --- | --- | --- |
| `bgm_main.wav` | 36.57 s | 主遊戲 | 約 105 BPM、16 小節循環。真鼓、貝斯、pad 加少量 scratch fill。要耐聽，前景元素不要太多 |
| `bgm_freespin.wav` | 30 s | FG／H&S | 約 128 BPM，比主遊戲更有能量；與主曲同調性，450 ms 交叉淡化時不衝突 |
| `spin.wav` | 0.42 s | 按旋轉 | 唱盤啟動或 crossfader 甩出加一個短 kick，乾淨俐落 |
| `btn.wav` | 0.06 s | 一般按鈕 | 真實的按鍵或推桿 click，很短 |
| `reel_stop_1..5.wav`（**新**） | 約 0.14 s | 每軸停輪 | **五個不同檔案**，不再變速。依序升高或加重，最後一軸最有份量。見 §5.1 |
| `reel_tension.wav` | 2.0 s loop | 期待（Scatter 差一顆） | 漸強張力，riser、心跳 kick 或 filter sweep，可循環 |
| `scatter_1..5.wav` | 各 0.9 s | 第 n 顆 Scatter 落地 | 唯一可以用金屬鈴的系列。五顆逐步升調、加厚，第 3 顆以上要明顯興奮 |
| `win_gliss.wav` | 1.12 s | 一般小獎 | 短樂句，乾淨不吵 |
| `win_gliss_big.wav` | 2.6 s | Scatter 中獎／較大的獎 | 比上面多一層 |
| `pluck_low.wav` | 0.75 s | 倍數落地 | 貝斯 pluck 或 808 |

### B. 大獎（第二優先，需要改程式，見 §5.2）

| 檔案 | 現長 | 觸發 | 要求 |
| --- | --- | --- | --- |
| `bigwin_blast.wav` | 2.05 s | 大獎進場重擊 | 撞擊、bass drop、短和弦 |
| `win_big` / `win_super` / `win_mega` / `win_epic` / `win_max.wav` | 2.45 / 3.05 / 3.6 / 4.2 / 4.8 s | 各級 fanfare（疊在 BGM 上） | 逐級更長、更厚、更高。同一個動機逐級發展，不要五段互不相干的旋律 |
| `win_rollup_loop.wav`（**新**） | 2–4 s loop | 大獎跑分期間 | 持續的跑分床：節奏性的錢幣或數位計數聲加輕節拍，可無縫循環、不刺耳，在整個 count-up 期間循環 |
| `win_rollup_end.wav`（**新**） | 約 1 s | 跑分結束或玩家跳過 | 收尾的重音，讓 loop 有乾淨的結束 |
| `win_panel.wav` | 1.78 s | 總贏分牌出現 | |
| `win_cap.wav` | 3.5 s | 觸頂 wincap | 全場最隆重 |
| `coin_shimmer.wav` | 2.15 s | 大獎開頭點綴 | 保留，但不要再是唯一的跑分聲 |

### C. Feature 與 Pulse Bomb（**時間鎖定**，長度和重拍照現值）

| 檔案 | 現長 | 觸發 | 時間鎖定 |
| --- | --- | --- | --- |
| `fuse_sizzle.wav` | 0.38 s | `soundBlastFuse` 蓄力 | 380 ms 內四次短拉碟，結尾正好是引爆點 |
| `dynamite_blast.wav` | 1.10 s | 單軸引爆 | 撞擊在 0 ms |
| `dynamite_blast_big.wav` | 1.34 s | 滿盤引爆 | 撞擊在 0 ms，加低頻殼 |
| `symbol_shatter.wav` | 0.7 s | 碎片 | 玻璃或數位碎片 |
| `smoke_puff.wav` | 0.9 s | 氣浪 | 輕、快速衰減 |
| `symbol_reveal.wav` | 1.03 s | 揭示 | 主體要在前 300 ms 內 |
| `symbol_land.wav` | 0.21 s | 每欄落位 | 乾脆的 pad，程式會逐欄升調 |
| `grenade_blast.wav` | 0.64 s | `soundDynamiteBlast` | |
| `press_blast.wav` | 0.58 s | 按鈕觸發的爆擊 | |
| `fullboard_chain.wav` | 1.2 s | 滿盤連鎖（`FullBoard.svelte`） | 照 FullBoard 常數的節拍 |
| `fullboard_stamp.wav` | 1.88 s | 「OVERDRIVE!」蓋章 | 撞擊在 0 ms |
| `ladder_up.wav` | 0.94 s | 階梯升一格 | 程式會依等級調音量 |
| `mult_update.wav` | 0.58 s | 倍數更新 | |
| `wild_expand.wav` | 2.25 s | W 擴展 | |
| `fs_intro.wav` | 2.2 s | FG 開場 | |
| `gong_feature.wav` | 2.65 s | Feature 觸發 | 名稱是舊的，內容要符合霓虹主題：大型 synth 撞擊加 riser 尾巴 |
| `cave_quake.wav` | 3.0 s | 觸發時的低頻震動 | 低頻轟鳴（名稱是舊的） |
| `dj_scratch.wav` | 3.2 s | 吉祥物刷碟表演 | 0.60／1.08／1.56／2.04 s 四次刷碟（125 BPM），2.54 s 收尾；音量要輕 |

### D. 保留不動

`voice_roar.wav`、`voice_effort.wav`、`monkey_expand.mp3`：角色聲音，使用者提供或已核可。

## 5. 程式改動（只在本 app）

### 5.1 停輪五個檔案

在 `Sound.svelte` 的 `CN_SFX_FILES` 新增 `reel_stop_1..5`，`SPRITE_TO_CN` 的 `sfx_reel_stop_n` 改成對應各自的檔案，`rate` 一律設為 1（音高差異做在檔案裡）。`sfx_symbols_landing`／`sfx_royals_landing` 改用 `reel_stop_3`。舊的 `reel_stop.wav` 刪掉。

### 5.2 跑分循環

`soundLoop` 收到 `sfx_bigwin_coinloop` 時：

- 先打一次 `coin_shimmer`（保留現在的點綴），再用 `playCnLoop` 播 `win_rollup_loop`。

`soundStop` 收到 `sfx_bigwin_coinloop` 時：

- 用 120 ms 把 loop 淡出，接著播 `win_rollup_end`。

注意事項：

- 現有註解說明了當初為什麼把 loop 拿掉：短鐘聲重複播放很煩。新 loop 必須是**平順的床**，不能是會重複起音的鐘聲。
- `FreeSpinOutro.svelte` 和 `bookEventHandlerMap.ts` 的 `winLevelSoundsStop` 已經會送 `soundStop`，確認兩條路徑都會收尾，並且不會重複播放 `win_rollup_end`。
- 玩家跳過跑分（點擊）時也要正確收尾。

### 5.3 範本 sound sprite

先清點 `sounds.json` 裡哪些名字仍會走 `sound.players.*`（`soundOnce` 沒有對應到 neon 的那些）。目前推測沒有任何事件真的會播到它，請以實際廣播的事件清單為準。

- **確認沒有任何事件會播到它**：把 `assets.ts` 的 `sound` 改成不 preload，或整個移除，同時刪掉 `audio/sounds.mp3`、`audio/sounds.json` 和 `audio/jungle/`（9.2 MB）。
- **還有事件會播到它**：先把那些事件補上 neon 的對應，再移除。

### 5.4 建置腳本

新增 `design/build_neon_audio_v3.py`：從 `design/source/neon_audio_v3/` 的素材做剪接、疊層、母帶，輸出到 `static/assets/audio/neon/`，並同步寫一份到 `design/source/neon_delivery/audio/`。

`build_neon_audio.py`／`build_neon_audio_v2.py` 全量重建時**不可以**把 V3 蓋回去：把它們改成直接呼叫 V3，或加上明確的警告後退出。

## 6. 驗收

1. 以下檢查全部通過；`check_audio.mjs`／`check_neon_audio.py` 要更新成新的檔案清單，包括 `reel_stop_1..5` 和 rollup：
   ```
   node design/check_audio.mjs
   python design/check_neon_audio.py
   node design/check_neon_audio_bus.mjs
   node design/check_types.mjs
   node design/check_assets.mjs
   ```
   最後用 `pnpm build` 確認能建置。
2. `check_neon_audio.py` 新增以下檢查：
   - 每個檔案的真峰值不超過 −1 dBTP
   - 尾端 50 ms 低於 −42 dBFS
   - 循環檔的首尾樣本差夠小
   - `LICENSES.json` 涵蓋每個新檔
3. 在 `design/source/neon_audio_v3/preview/` 輸出一段約 60 秒的試聽 `v3_showcase.wav`，依序是：
   1. 主 BGM 一段
   2. spin 和五軸停輪
   3. 小獎
   4. 三顆 Scatter 加期待
   5. FG 觸發
   6. Pulse Bomb 單軸
   7. Pulse Bomb 滿盤
   8. Big → Mega 跑分，含 rollup loop 和收尾
   9. Max 收尾

   使用者會用這段試聽驗收。
4. 在本檔最後補一節「交付紀錄」：改了哪些檔、每個成品的來源摘要、總大小、已知限制。
5. **不需要**開瀏覽器驗證；使用者會自己上傳到 Stake Engine 驗。


## 7. 交付紀錄（2026-10-31）

- 完成 sample-based V3：47 個新成品加 3 個保持原檔的核可角色聲音，共 **50 檔、9,764,659 bytes（9.76 MB）**。已同步到 `static/assets/audio/neon/` 和 `design/source/neon_delivery/audio/`。
- 新增 `build_neon_audio_v3.py`、`requirements-audio-v3.txt`、原始取樣／授權證據與 `TIMING_BASELINE.json`；V1／V2 完整重建入口均改呼叫 V3。
- 原件來自 VCSL（真鼓／clap／hat、Yamaha TX81Z 取樣）、il112 的 Technics SL-1200 刷碟、rubberduck 的錄製撞擊／玻璃、Kenney 的 CC0 Interface 與 Sci-Fi Sounds。**逐成品來源摘要**見 [OUTPUT_SOURCES.md](source/neon_audio_v3/OUTPUT_SOURCES.md)；159 筆來源關係、網址、作者、原檔名、授權與 SHA-256 見 [LICENSES.json](source/neon_audio_v3/LICENSES.json)。沒有使用商業 slot 音檔或程式波形生成。
- 五軸停輪改為 `reel_stop_1..5.wav`，各自取樣與音色，播放 rate=1；符號落位／royals 使用第三軸檔。移除舊 `reel_stop.wav`。
- 大獎保留單次 `coin_shimmer`，新增獨立 `win_rollup_loop.wav` 平順跑分床；自然完成／點擊跳過時淡出 120 ms，再播 `win_rollup_end.wav`。更新 `Sound.svelte`、`Win.svelte`，保留 `FreeSpinOutro`／book handler 的停止路徑；收尾有去重、取消晚到解碼、重啟與卸載保護。
- 清點本 app 廣播與共用 UI 的 SoundEffectName，補齊所有 logical aliases 的 neon 對應，移除 sprite fallback、`EnableSound.svelte`／Game 引用、`assets.ts` 的 sound registration，以及 `audio/sounds.mp3`、`sounds.json`、`audio/jungle/`。只移除音效 registration，保留工作區原有美術改動。
- BGM 改為 192 kbps stereo MP3：主曲 105 BPM、36.571429 s；FG 128 BPM、30 s，各 16 小節。量測解碼延遲後，使用產生的 `neonAudioLoops.ts`／JSON 在 Web Audio 依實際 sample rate 裁切 guard／padding。44.1 kHz 與 48 kHz 的接縫、裁切與相關性驗證通過。兩首 decoded BGM 分別約 −20.27 LUFS。
- Feature 時長逐樣本沿用 baseline；FullBoard 五次點火照 190 ms 常數；DJ 保留四次手勢與 2.54 s 收尾，fuse 保留 380 ms 四次拉碟。新檔真峰值均 ≤ −1 dBTP，最後 50 ms 低於 −42 dBFS；三個角色檔案與保存原件逐位元相同。
- 試聽：[60 秒 v3_showcase.wav](source/neon_audio_v3/preview/v3_showcase.wav)。時間表見 `preview/TIMELINE.json`，另有兩首 BGM 雙循環試聽、`audio_metrics.json`、`validation.json`。

驗證：`node design/check_audio.mjs`、`python design/check_neon_audio.py`、`node design/check_neon_audio_bus.mjs`、`node design/check_types.mjs`、`node design/check_assets.mjs` 均通過。型別 gate 依專案既有逐檔基線通過，仍有 19 項既有錯誤，沒有新增錯誤。`pnpm build`：**通過**（adapter-static 已輸出 `build/`，並確認其中 50 個音檔與 live 原檔的 SHA-256 全部相同，沒有殘留舊音效包）。

已知限制：依本需求單未開瀏覽器、未上傳 Stake；主觀音色與 Stake 審查待使用者試聽／平台驗收。循環已用 FFmpeg 44.1／48 kHz 解碼及實際播放程式的 VM 測試驗證；無 Web Audio 的舊瀏覽器走 HTML Audio 備援，該備援不保證 MP3 無縫循環。離線試聽未模擬執行時的全部 ducking／compressor，遊戲內混音仍以實際平台驗收為準。
