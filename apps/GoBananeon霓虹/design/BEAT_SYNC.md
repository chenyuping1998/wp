# 霓虹節奏同步（2026-11-06）

目標：畫面與音效都踩在玩家聽到的 BGM 鼓點上，而不是各跑各的拍子。

## 拍點時鐘 `src/game/beatClock.ts`

- Sound.svelte 以音訊時鐘排定 BGM 起點（`src.start(ctx.currentTime + 0.03)`），經 `getOutputTimestamp` 換算成 `performance.now`（含輸出延遲）後 `setMusicAnchor`；每 3 秒與 AudioContext 恢復時重新對拍。
- `musicAt(now)`：拍位、小節、`kick`（實際鼓型：主曲 1、2&、3、4 前推；FG 四拍踩底）、`downbeat`。常數鏡像 `build_neon_audio_v3.py music()`，`check_beat_clock.mjs` 會比對。

## 畫面

| 位置 | 做法 |
| --- | --- |
| 背景燈 `backgroundStage.ts` | 光束／招牌／倒影吃 `kick + downbeat`（權重加大），燈管追光一小節一圈；引信充能時律動收住 |
| 人物 `adapt_club_motion.mjs` | beat 項從正弦改成「拍點下沉＋長回彈」，幅度約 2–3 倍；`check_neon_spine` 全過 |
| 人物鎖拍 `MascotBeatLock.svelte` | 新的 groove 軌道在混入期間直接對齊拍格，之後只微調速度（±30%） |
| 中獎燈管框 `SymbolMeshWin.svelte` | 亮起後隨鼓點閃亮、外光暈變寬，全盤同步 |
| 金額跑分 `textMesh.ts` roll | 每個鼓點數字由左到右跳一下並微寬；無音樂時退回舊的正弦 |

## 音效

- 節奏音序器（Sound.svelte）：25ms 計時、預排 120ms，把 `seq_tick/kick/note` 排在 BGM 的 16 分音格上。
  - 大獎跑分：16 分音 tick、跟主曲同鼓型的輕 kick、8 分音琶音（取當下和弦音）。舊 120 BPM `win_rollup_loop` 只在沒有 Web Audio 時使用。
  - 期待音：心跳 kick 第 1 小節四分、第 2 小節八分、之後十六分，逐小節變大；`reel_tension.wav` 改成只剩空氣聲底。
- DJ 濾波：期待音兩小節內把 BGM 低通收到 1.1 kHz、停輪 0.16 秒打開；脈衝彈引信收到 520 Hz、爆炸 0.06 秒打開（drop）。
- 壓 BGM：小獎 0.68 短壓、大獎各級 0.42 重壓後停在 0.7 直到跑分結束。

## 重建／檢查

- `python design/build_neon_rhythm_kit.py`（只重建四個節奏音檔，不需 ffmpeg）
- `node design/check_beat_clock.mjs`、`node design/check_neon_audio_bus.mjs`（已接進 `pnpm build`）

未上機：實際聽感、拍點對齊誤差（不同裝置的輸出延遲）、人物鎖拍收斂速度都要在 Stake 上看。

## 第二輪（同日）

- **號角在拍格上現場演奏**：五級大獎號角原是自己時鐘的成品檔（8 分音 .235 s、小鼓每 .23 s），疊在 105 BPM 主曲與跑分格上＝三種速度。現在由音序器在 BGM 的 8 分音上演奏同一段勝利動機（轉到當下和弦），隨級數加八度、反拍、十六分快跑、epic 起每小節前小鼓滾奏；尾聲落在拍上、位置等同原檔長度；結束後自行放掉。跑分琶音在號角期間讓位。原 WAV 只在沒有 Web Audio 時播放。
- **中獎掃描踩格**：winInfo 的 live 演出等下一個十六分音（FG 三十二分）才亮第一軸，每軸一格，每軸 `soundWinStep` 播一個和弦內上行音（最後一軸加八度與低音），對齊最近的三十二分；開頭不對拍的 win_gliss 在有拍格時拿掉。Turbo 維持 40 ms、不等拍。
- **大獎牌跟拍**：每拍輕頂 2.2%、每小節重拍閃一下（高級更亮）、光暈兩拍一呼吸；牌框小星星與 FxBurst（星星＋硬邊光環）移除。跑馬燈每十六分音走一格。
- **手機喇叭可聽度**：重擊音（大獎爆擊、FG 鑼、全盤蓋章、爆炸）加 presence（低頻推成 450–2200 Hz 泛音＋小鼓 crack＋削 200 Hz 以下），400 Hz 以上能量 13–17% → 29–62%；seq_kick 加打擊頭（0.9% → 17%）；起轉 11% → 26%；第 2 軸停輪 39% → 95%。`cave_quake` 刻意維持低頻。
- 新音檔 `seq_snare`、`seq_pad`；總量 9.95 MB（預算 10 MB，幾乎用完）。`build_neon_rhythm_kit.py` 現在重建整個節奏批次（20 檔），借用 math-sdk env 內的 ffmpeg；`check_neon_audio.py` 完整版（含 MP3）也可用同樣墊片在本機跑。
