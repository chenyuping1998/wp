# MUMMY MAYHEM — 音效需求單

給執行者（使用者或 Codex）。範圍只限 `wp/apps/MummyMayhem木乃伊`：不要改 `wp/packages/*`，不要動其他遊戲。
現在遊戲裡的 44 個音檔全是 GoBoomana 的（`static/assets/audio/jungle/`：叢林、礦坑、炸藥），**全部要換掉**。

配套：節奏與每個音效的對拍時間點在 [MUMMY_RHYTHM_REQUIREMENTS.md](MUMMY_RHYTHM_REQUIREMENTS.md)；美術在 [MUMMY_ART_REQUIREMENTS.md](MUMMY_ART_REQUIREMENTS.md)。

---

## 1. 方向

**好笑的埃及墓室。** 不是恐怖片、不是莊嚴的神廟：是一隻笨木乃伊貓在金字塔裡惹麻煩。

| 元素 | 怎麼做 |
|---|---|
| 樂器 | 真實或取樣的 **oud（烏德琴）、darbuka（高腳鼓）、riq（鈴鼓）、ney（蘆笛）、手拍、指鈸（zills）**；低頻用 upright bass 或柔和 808；可以加一點 pizzicato 弦樂的卡通感 |
| 音階 | Hijaz（弗里吉亞大調色彩：D–E♭–F♯–G–A–B♭–C）當主色；主遊戲和 FG 同調，交叉淡化不衝突 |
| 貓 | 真實貓叫取樣（喵、呼嚕、哈氣、小聲的 mrrp）＋卡通處理；**每種情緒不同的叫聲**，不要一個喵到處用 |
| 繃帶 | 布料撕開、拉扯、啪一聲彈開（布條甩動）——這是全作的招牌音色，取代 Boomana 的炸藥 |
| 石頭 | 砂岩摩擦、石板滑動、石棺蓋（重但短）；**不要礦坑、不要爆炸** |
| 金色只屬於 Scatter 和太陽輪 | 只有 Scatter 系列和 Sun Wheel 可以用金屬鈴、指鈸、閃亮的金屬聲 |
| 節制 | 一般 spin 的聲音短、乾淨；大部分時間安靜，大獎才有落差 |

### 1.1 從 Bananeon 審查學到的（Stake 2026-10-31 以「Bad sound design」退件）

1. **成品必須以真實取樣為基礎。** 實錄、素材庫取樣、取樣式樂器都可以；DSP 只做後製（EQ、壓縮、剪接、疊層、變調、殘響）。**不接受純程式生成的波形當成品**，那次退件就是因為全部是程式合成，聽起來像電子玩具。
2. **五軸停輪要五個檔案**，不要同一個檔變速（高軸會像快轉）。
3. **大獎跑分要有自己的循環床**，不能只有一聲點綴就剩 BGM。
4. 範本的 `audio/sounds.mp3`（4.7 MB）要確認沒人播後移除，不要白載。

---

## 2. 硬性規則

1. **授權**：只用 CC0 或允許商用、免署名的 royalty-free 素材（Sonniss GDC Bundle、Kenney、Freesound/OpenGameArt 標 CC0 的檔、VCSL 等）。每個來源記進 `design/source/mummy_audio/LICENSES.json`：成品檔名、來源網址、作者、授權、原始檔名。**禁止**用任何商業 slot 的音檔（Pragmatic Play、Hacksaw、Push、星城…），也不准從它們的 demo 或錄影抓。競品（東海龍王）的音效只能拿來**參考長度和觸發時機**。
2. **母帶**
   - 44.1 kHz；SFX 單聲道，BGM、大獎音樂、輪盤音樂立體聲
   - 真峰值 ≤ −1 dBTP；尾端 50 ms 淡到 −42 dBFS 以下
   - 響度：BGM 約 −20 LUFS（integrated）；常用 SFX 比 BGM 突出但不刺耳；Feature 觸發、Sun Wheel、大獎最響
   - 播放端已有 compressor 和 0.82 headroom，**不要再把檔案壓扁**
3. **循環要無縫**：BGM、跑分 loop、期待 loop、Sun Wheel 等待 loop 都用 `AudioBufferSourceNode.loop` 播，首尾對齊零交越點、落在小節線上。BGM 若用 mp3，要處理編碼器 padding（`loopStart`／`loopEnd`）並實測無縫，做不到就用 WAV。
4. **檔案大小**：整包目標 **≤ 10 MB**。
5. **時間鎖定**：下表標「🔒」的檔案，長度和重拍位置要照填的數字，畫面動畫對著它做（數值來源：`src/game/wheels.svelte.ts`、節奏需求單）。改了數字兩邊都要改。

交件路徑：`static/assets/audio/mummy/`，同步一份到 `design/source/mummy_delivery/audio/`。

---

## 3. 檔案清單

觸發點都在 `src/components/Sound.svelte`（對照表 `SPRITE_TO_CN`、`CN_SFX_FILES`）。「事件」欄是遊戲裡會送出的音效名稱。

### A. 最常聽到（優先度最高）

| 檔案 | 長度 | 事件 | 要求 |
|---|---|---|---|
| `bgm_main.wav` | 約 32 s（16 小節、120 BPM） | 主遊戲 | darbuka＋oud 的輕快循環，耐聽、前景元素少；中間留空讓 SFX 站得出來 |
| `bgm_freespin.wav` | 約 27 s（16 小節、140 BPM） | FG、Hold & Spin | 同調性、更有能量：加 riq、手拍、ney 旋律；450 ms 交叉淡化不衝突 |
| `spin.wav` | 0.35–0.45 s | `sfx_btn_spin` | 石盤轉動一聲「喀」加一個短 darbuka 低音，乾淨 |
| `btn.wav` | ≤ 0.08 s | `sfx_btn_general` | 小石塊敲一下或木頭 click |
| `reel_stop_1..5.wav` | 各約 0.14 s | `sfx_reel_stop_1..5` | **五個不同檔案**，播放 rate=1。石板落下的「咚」，逐軸升高半音或加重，第 5 軸最有份量 |
| `reel_tension.wav` | 2.0 s loop | 期待（差一顆 Scatter） | 漸強：darbuka 滾奏＋上行的 ney 或弦樂 tremolo，可循環 |
| `scatter_1..5.wav` | 各約 0.9 s | `sfx_scatter_stop_1..5` | 黃金面具落地。**唯一可以用金屬鈴／指鈸的一般音效**；五顆逐步升調、加厚，第 3 顆以上明顯興奮 |
| `win_small.wav` | 約 1.1 s | `sfx_winlevel_small` | 一般小獎：oud 短樂句，乾淨 |
| `win_medium.wav` | 約 2.4 s | `sfx_scatter_win_v2` 等較大的獎 | 比上面多一層（手拍＋鈴鼓） |
| `line_draw.wav` | 約 0.4 s | 連線畫出時（新事件，見 §4） | 布條拉開的「唰」，很輕；同時多條線只播一次 |
| `cat_land.wav` | 約 0.25 s | W 落地 `sfx_multiplier_landing` | 貓掌落地「啪」加一聲小 mrrp |

### B. Scarab Wheel（FG 倍率輪盤）🔒

時間點照錄影量測（節奏單 §4），每個 FG 有連線的局都會播一輪，**一場 FG 可能聽 5–8 次，要耐聽、不能刺耳**。

| 檔案 | 長度 | 觸發 | 🔒 時間點／要求 |
|---|---|---|---|
| `scarab_rise.wav` | 0.30 s | 半圓拱升起 | 石拱滑出的摩擦聲，0.30 s 內結束 |
| `scarab_button_idle.wav` | 2.0 s loop | 等玩家按按鈕 | 輕輕的聖甲蟲翅膀振動＋低鼓心跳，可循環；按下或 3 秒自動時淡出 80 ms |
| `scarab_press.wav` | 0.30 s | 按下按鈕（或自動按） | 金幣碎開「鏘」＋甲蟲振翅；重拍在 0 ms |
| `scarab_tick.wav` | ≤ 0.04 s | 每一格經過指針 | 短促的石板「嗒」；程式每過一格播一次，越慢越稀疏（自然減速感），**要短到疊在一起不糊** |
| `scarab_stop.wav` | 約 0.6 s | 停輪 | 「喀」一聲卡住＋短殘響；重拍在 0 ms |
| `scarab_fly.wav` | 0.30 s | 結果飛進中央圓牌 | 上行的 whoosh |
| `scarab_mult_1.wav` | 約 0.9 s | 倍數更新：2–10× | 圓牌換數字的「叮」＋貓一聲短喵；重拍在 0 ms |
| `scarab_mult_2.wav` | 約 1.1 s | 倍數更新：12–16× | 更亮、加 riq |
| `scarab_mult_3.wav` | 約 1.4 s | 倍數更新：32× | 最隆重：指鈸＋貓興奮叫 |
| `scarab_sink.wav` | 0.30 s | 拱縮回 | `scarab_rise` 的反向感，較輕 |

### C. Sun Wheel（稀有輪盤）🔒

長度和用途參考東海龍王的輪盤音效（WheelShow 2.28 s、Countdown 1.0 s、WheelStart 1.82 s、每格 tick 0.03 s、WheelStop 1.28 s、WinLv 3.3 s、WinLvUp 3.0 s，另有每級的語音），**只參考長度與時機，不准取樣**。

| 檔案 | 長度 | 觸發 | 🔒 時間點／要求 |
|---|---|---|---|
| `sun_show.wav` | 約 2.2 s | 畫面變暗、太陽輪出現 | 大型 riser：ney 長音＋定音鼓滾奏＋太陽升起的金屬泛音；**0.68 s 處**太陽輪完全出現，那裡要有一個重音 |
| `sun_wait_loop.wav` | 4 小節 loop（約 4 s） | 倒數期間 | 張力床：darbuka 心跳＋低音持續音；倒數結束淡出 150 ms |
| `sun_count.wav` | ≤ 0.4 s | 倒數每一秒（5→1） | 指鈸或鈴鼓一下；**五秒五次**，程式會逐次升高 rate（1.0 → 1.25），檔案本身做中音 |
| `sun_start.wav` | 約 1.8 s | 指針開始轉 | 重拍在 0 ms，之後拖成旋轉的風聲尾巴 |
| `sun_tick.wav` | ≤ 0.03 s | 指針每過一格 | 很短的木／金屬「嗒」；程式每格播一次 |
| `sun_stop.wav` | 約 1.3 s | 指針停住 | 「鏗」＋回彈（指針有 0.8 s 回彈，聲音在 0 ms 出重拍、0.8 s 前收完主體） |
| `sun_levelup.wav` | 約 3.0 s | 停在 LEVEL UP、換下一級 | 上行的爆發：0.5 s 處（新盤彈出）有最大重音，之後是升級的光，**每一級都用同一檔**，程式依等級調音高（+2／+4／+6 半音） |
| `sun_win_1.wav`～`sun_win_4.wav` | 3.0–4.5 s | 停在值上（第 1～4 級） | 逐級更華麗；同一個動機逐級發展，不要四段互不相干的旋律 |
| `sun_score_loop.wav` | 約 1.2 s 可循環 | 獎金跑分（1.2 s） | 錢幣嘩啦＋鈴鼓，平順、不重複起音 |
| `voice_sun_start.wav` | ≤ 1.5 s | 太陽輪出現 | 木乃伊貓一聲興奮的「喵～哈！」 |
| `voice_levelup_1..3.wav` | 各 ≤ 2 s | 第 1→2、2→3、3→4 級 | 三種逐漸驚訝的貓叫（mrrp? → 喵！→ 長聲嚎叫），龍王也是每級一句 |

### D. 大獎與結算

| 檔案 | 長度 | 事件 | 要求 |
|---|---|---|---|
| `bigwin_hit.wav` | 約 2.0 s | 大獎進場重擊 `soundBigWinBlast` | 定音鼓＋石棺蓋砸下＋短和弦（不要爆炸聲） |
| `win_big.wav` `win_super.wav` `win_mega.wav` `win_epic.wav` `win_max.wav` | 2.4 / 3.0 / 3.6 / 4.2 / 4.8 s | 各級 fanfare `soundWinTier`（疊在 BGM 上） | 逐級更長、更厚、更高；同一個動機逐級發展 |
| `win_rollup_loop.wav` | 2–4 s loop | 大獎跑分期間 `soundLoop sfx_bigwin_coinloop` | 平順的跑分床：錢幣＋鈴鼓＋輕節拍，**不能是會重複起音的鐘聲** |
| `win_rollup_end.wav` | 約 1 s | 跑分結束或玩家跳過 | 收尾重音，讓 loop 乾淨結束 |
| `coin_shimmer.wav` | 約 2 s | 大獎開頭點綴 | 錢幣灑落 |
| `win_panel.wav` | 約 1.8 s | 總贏分牌出現 `sfx_youwon_panel` | |
| `win_cap.wav` | 約 3.5 s | 觸頂 wincap `sfx_winlevel_end` | 全場最隆重 |

### E. Feature 觸發、轉場、Hold & Spin

| 檔案 | 長度 | 事件 | 要求 |
|---|---|---|---|
| `fg_trigger.wav` | 約 2.6 s | FG 觸發 `soundFreeGameBell` | 取代 Boomana 的鐘：大鑼＋指鈸＋ney 長音 |
| `fg_intro.wav` | 約 2.2 s | FG 開場牌 | |
| `bandage_sweep.wav` | 🔒 1.0 s | 轉場：繃帶掃過畫面 | 0–0.5 s 布條連續撕扯掃過（蓋住）、**0.5 s 換場景處**一聲重的布料啪、0.5–1.0 s 掀開 |
| `tomb_rumble.wav` | 約 3.0 s | 觸發時的低頻震動（取代 `cave_quake`） | 石室低頻轟鳴＋落沙，音量輕 |
| `cat_cheer.wav` | 約 2.7 s | 吉祥物 `cheer` | 跳起來的開心叫聲；🔒 重音對 Spine 事件 `takeoff`（起跳）和 `land`（落地）。實際秒數等吉祥物 `build` 出來後看 `報告.md`，再回填到這格 |
| `cat_laugh.wav` | 約 1.6 s | 吉祥物 `laugh` | 摀肚子笑（貓式呵呵＋呼嚕） |
| `cat_disappoint.wav` | 約 1.2 s | 吉祥物 `disappoint`（期待落空） | 洩氣的「喵…」 |
| `cat_wave.wav` | 約 0.8 s | 吉祥物 `wave` | 打招呼的短 mrrp |
| `bandage_pop.wav` | 約 0.3 s | 吉祥物身上繃帶彈開（笑點） | 布條「啵」一聲彈開 |
| `coin_land.wav` | 約 0.4 s | Hold & Spin 錢幣落地 | 銅幣落在石頭上 |
| `coin_reset.wav` | 約 0.6 s | 新錢幣讓 respin 回到 3 | 上行三音 |
| `hs_tally.wav` | 約 1.5 s | Hold & Spin 結算 | 錢幣一個個累加 |

### F. 要刪掉的（Boomana 專屬，機制已經沒有了）

`fuse_sizzle`、`dynamite_blast`、`dynamite_blast_big`、`symbol_shatter`、`smoke_puff`、`press_blast`、`grenade_blast`、`fullboard_chain`、`fullboard_stamp`、`ladder_up`、`cave_quake`、`symbol_reveal`、`monkey_expand`、`voice_roar`、`voice_effort`，以及整個 `audio/jungle/` 和範本 `audio/sounds.mp3`／`sounds.json`。
刪之前先清點 `Sound.svelte` 和共用 UI 實際會送出的音效名稱，每個名稱都要對到新檔，再刪。

---

## 3.5 目前暫借的音檔（交件後要換）

程式裡標 `PLACEHOLDER(audio)`（`Sound.svelte` 的 `soundWheel`）。事件已經接好，**只要換檔、改那一行的檔名**：

| cue | 現在暫借 | 換成 |
|---|---|---|
| `scarabRise` / `scarabFly` / `scarabSink` | `mult_update`（變速） | `scarab_rise` / `scarab_fly` / `scarab_sink` |
| `scarabPress` | `pluck_low` | `scarab_press` |
| `scarabTick` / `sunTick` / `sunCount` | `btn`（變速） | `scarab_tick` / `sun_tick` / `sun_count` |
| `scarabStop` / `sunStop` | `reel_stop`（變速） | `scarab_stop` / `sun_stop` |
| `scarabMult` 1/2/3 | `win_gliss`、`win_gliss_big` | `scarab_mult_1..3` |
| `sunShow` | `gong_feature` | `sun_show`（＋`voice_sun_start`） |
| `sunStart` | `bigwin_blast` | `sun_start` |
| `sunLevelUp` | `win_gliss_big`（升調） | `sun_levelup`（＋`voice_levelup_n`） |
| `sunWin` 1–4 | `win_big`～`win_epic` | `sun_win_1..4` |
| `sunScore` | `coin_shimmer` | `sun_score_loop` |
| `bandageSweep` | `smoke_puff` | `bandage_sweep` |
| `lineDraw` | （不出聲） | `line_draw` |

還沒接的：`scarab_button_idle`（等按鈕的循環）、`sun_wait_loop`（倒數的循環），檔案到了再加 loop 播放。

## 4. 程式要改的地方（只在本 app）

1. **`Sound.svelte`**：`CN_SFX_FILES` 指向 `mummy/` 新檔；`SPRITE_TO_CN` 改對應；停輪五檔 rate 一律 1；刪掉 §3.F 的事件（`soundBlast*`、`soundFullBoard*`、`soundLadderUp`、`soundCaveQuake`、`soundDynamiteBlast`、`soundMonkeyExpand`）。
2. **新事件**（輪盤目前暫用舊名稱的音效，要換成專屬事件）：
   - `FgArcWheel.svelte`：`soundScarabRise`、`soundScarabButtonLoop`／`Stop`、`soundScarabPress`、`soundScarabTick`（每過一格）、`soundScarabStop`、`soundScarabFly`、`soundScarabMult { tier: 1|2|3 }`、`soundScarabSink`
   - `RareRoulette.svelte`：`soundSunShow`、`soundSunWaitLoop`／`Stop`、`soundSunCount { n }`、`soundSunStart`、`soundSunTick`、`soundSunStop`、`soundSunLevelUp { level }`、`soundSunWin { level }`、`soundSunScoreLoop`／`Stop`、`soundSunVoice { kind }`
   - `WinLines.svelte`：`soundLineDraw`（一次 winLinesShow 只播一次）
   - tick 類：同一幀只播一次、最小間隔 25 ms，避免指針一開始轉太快時疊成雜音
3. **跑分 loop**：`soundLoop sfx_bigwin_coinloop` → 先一次 `coin_shimmer`，再 loop `win_rollup_loop`；`soundStop` → 120 ms 淡出接 `win_rollup_end`；`FreeSpinOutro.svelte` 和 `winLevelSoundsStop` 兩條路都要收尾、不重複播 end；玩家點擊跳過也要收尾。
4. **Sun Wheel 播放期間**：BGM 壓到 30%（ducking 300 ms），結束後 600 ms 回復。
5. **每手音效截斷**：收集／獎金類音效在下一手開始時淡出（之前茶樓系列做過，作法照 `spin-scoped-sounds`）。
6. 新增 `design/build_mummy_audio.py`：從 `design/source/mummy_audio/` 的取樣做剪接、疊層、母帶，輸出到 `static/assets/audio/mummy/`；更新 `design/check_audio.mjs` 的檔案清單。

---

## 5. 驗收

1. 檢查全部通過：
   ```
   node design/check_audio.mjs
   node design/check_types.mjs
   node design/check_assets.mjs
   ```
   最後 `pnpm build` 能建置。
2. 檢查腳本新增：每檔真峰值 ≤ −1 dBTP、尾端 50 ms < −42 dBFS、循環檔首尾樣本差夠小、`LICENSES.json` 涵蓋每個新檔、總大小 ≤ 10 MB。
3. 輸出約 75 秒的試聽 `design/source/mummy_audio/preview/showcase.wav`，依序：
   1. 主 BGM 一段
   2. spin＋五軸停輪
   3. 小獎＋連線
   4. 三顆 Scatter＋期待
   5. FG 觸發＋繃帶轉場
   6. Scarab Wheel 一輪（含按鈕、tick、停、倍數 12×）
   7. Scarab Wheel 32× 一輪
   8. Sun Wheel：出現、倒數、轉、LEVEL UP 兩次、第 3 級中獎、跑分
   9. Big → Mega 跑分含 rollup 和收尾
   10. Max 收尾
4. 本檔最後補一節「交付紀錄」：改了哪些檔、每個成品的來源摘要、總大小、已知限制。
5. **不需要開瀏覽器驗證**，使用者會自己上傳到 Stake Engine 驗。


## 交付紀錄（2026-11-07）

已整合新素材、套版角色動作與取樣音效；詳細檔案、來源、檢查結果、已知差異與重建方式見 [MUMMY_DELIVERY_20261107.md](MUMMY_DELIVERY_20261107.md)。本文件前面的舊版佔位／待美術狀態保留作歷史對照，現況以交付紀錄為準。
