# 煉金 動畫與音效節奏強化（2026-11-06）

使用者：「繼續幫我優化煉金，動畫跟音效節奏方面要更強」。

## 診斷（改之前量到的）

| 項目 | 問題 |
|---|---|
| 停輪 | 檔案 −8 dB 母帶再乘 0.5 播放，RMS 約 −22～−30 dB；第一軸 60% 能量在 400 Hz 以下 → 在 BGM 底下幾乎聽不到 |
| 重擊（大獎爆擊、FG 鑼、炸藥、蓋章…） | 83–87% 能量在 400 Hz 以下，手機/筆電喇叭放不出來 |
| 小獎 | 只有 winInfo 開頭一段 1.2 秒琶音；掃描每軸 90 ms，和 128 BPM 的十六分音符（117 ms）對不上；獎圖跳起落地完全沒聲音 |
| 大獎號角 | 內部鼓點每 0.34 s，和 BGM 每拍 0.469 s 互相打架；滾分 tick 每 0.125 s（120 BPM）也和 128 BPM 錯開 |
| 大獎牌 | 自己的時鐘：正弦呼吸＋每 2.3 秒閃一次，跟音樂無關 |
| 落地壓扁 | 對稱的 sin² 隆起，觸地前 50 ms 就開始壓，像落在枕頭上 |

## 改了什麼

**拍子時鐘** `src/game/beatClock.ts`：Sound.svelte 起 BGM 時公布 AudioContext 時鐘、起點和 BPM（主遊戲 128／FG 154，兩條 BGM 都是 16 小節剛好循環）。沒有 BGM 時所有等待都是 0，不會卡住流程。

**中獎掃描（WinWays）**：正式演出（`live: true`，閒置重播不出聲）等到下一個十六分音符（最多 ~117 ms）才開始，每軸間隔一個十六分音符，每亮一軸播一個上行音（Eb Bb Eb F Bb，四個和弦都容得下）；每軸獎圖落地時播一聲「叮」（高獎/W/S 用較重的版本）。Turbo 維持 40 ms 快掃、不等拍。原本開頭那段琶音拿掉。

**獎圖跳躍（leapWin / meshRig）**：每種獎圖整體時間拉伸到落地正好是整數個十六分音符（燈籠/水晶/鉗子/礦車 8 個、字母 7 個、徽章 9 個，伸縮 <7%，部件演出跟著一起拉伸）。下落改快（210→175 ms），落地壓扁改成「最後 35 ms 急壓、觸地那格最扁、阻尼彈簧回彈成拉長」。主遊戲裡畫面落地、叮聲、鼓點三者同一格。

**停輪**：重做成 400–4000 Hz 的玻璃 tick＋木頭敲擊（86–96% 在 400 Hz 以上），播放音量照霓虹 0.66 → 0.86 逐軸遞增，Turbo 減半、60 ms 內疊音再減半。

**重擊加中頻**：8 個重擊音把低頻驅動出諧波、留在 450–2200 Hz，加一點小鼓 crack，並把 140 Hz 以下削掉一些：400 Hz 以上能量 13–17% → 29–43%。刺耳頻段（2.4–5.8k）和高頻預算照舊通過。

**大獎**：爆擊音在大獎牌砸下那一格；號角改成 128 BPM（旋律十六分、鼓每拍、tier 2 起有八分反拍），從 BGM 下一個八分音符進；FG 裡 BGM 壓得更低（0.22）避免 154 對 128 打架。滾分 tick 分成 128／154 兩個版本，從十六分音符起。大獎牌改成每拍輕頂一下（2.2%）、每小節第一拍閃一下、光暈兩拍一呼吸。

## 檔案

- 新：`src/game/beatClock.ts`、`design/rebuild_rhythm_cues.py`（只重做這 27 個音檔，不需 imageio_ffmpeg）、`design/preview_rhythm_20261106.py`
- 改：`Sound.svelte`、`WinWays.svelte`、`Win.svelte`、`bookEventHandlerMap.ts`（winInfo 帶 live、拿掉開頭琶音）、`meshWin/leapWin.ts`、`meshWin/meshRig.ts`、`build_sampled_audio.py`、`check_presentation_polish.mjs`
- 新音檔：`win_step_1..5`、`win_land`、`win_land_big`、`win_rollup_fg`；重做：`reel_stop_1..5`、`win_rollup_loop`、`win_big/super/mega/epic/max`、8 個重擊。共 56 檔 7.87 MB（上限 10 MB）。快取參數改 `sampled-v3-rhythm-20261106`。

## 試聽

[rhythm_20261106.wav](source/sampled_audio_v1/preview/rhythm_20261106.wav)：前 12 秒是 11-01 版、0.8 秒空白後是新版，同一條時間軸（停輪 → 三軸小獎 → Mega 大獎滾分 → 收尾）。時間表在同名 json。

## 驗證

`pnpm run build` 整條通過（含 check_mesh_wins、check_idle_land、check_alchemist_mesh、型別基線、vite build）。`check_sampled_audio.py` 本機缺 imageio_ffmpeg，用 scratchpad 的墊片模組指到 math-sdk env 的 ffmpeg 執行檔後跑過。

**未上機**：實際畫面與聽感（手機喇叭、耳機）尚待 Stake 上傳試玩確認。FG 裡落地聲跟畫面同步，但和 154 BPM 的鼓點不一定同格（跳躍是照 128 拍子調的）。

## 第二輪（同日，「繼續優化」）

- **FG 落地也在拍點上**：`src/game/winTempo.ts` 依當下 BGM 的十六分音符微調每個中獎演出的速度（`gridSpeed`），SymbolMeshWin 播放和 WinWays 排落地聲用同一個數字。FG（154 BPM）：燈籠/水晶/鉗子/礦車 938→974 ms（慢 4%）、字母 820→779（快 5%）、徽章 1055→1071、W 1180→1169；主遊戲幾乎都是 1。Turbo 不調。
- **小獎、中型獎的金額滾動有聲音了**：原本完全無聲。現在滾動時有 tick（比大獎輕、從十六分音符起），數字落定那一格補兩個音（Eb→Bb，相隔一個十六分）`win_count_end`。中途按跳過也會正確收尾。
- **期待音循環對拍**：舊的 `reel_tension.wav` 是 2 秒、每 0.25 秒一下（等於 120 BPM），兩條 BGM 都對不上。改成 `reel_tension_beat`（128）／`reel_tension_fg`（154）：一小節四拍的八分音符逐漸加強，最後一拍有十六分音符推進下一圈，從十六分音符起。舊檔已移除。
- 守門：check_presentation_polish 加了小獎滾分測試；check_sampled_audio 的循環接縫檢查加入新的三個循環。
- 音檔 58 檔、8.05 MB（上限 10 MB）。試聽檔已重做，新版段落多了小獎滾分和落定音。
- `pnpm run build` 整條通過。仍未上機。
