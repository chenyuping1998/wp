# GO BANANEON（霓虹）— 音效需求清單

> 交件放在 `design/source/neon_delivery/audio/`，**檔名照表格寫**。
> 我收到後會負責音量對齊、裁頭尾靜音、檢查 loop 接縫，再換掉 `static/assets/audio/jungle/` 裡的同名檔。
>
> ⚠️ ChatGPT 本身**不會輸出音檔**。BGM 建議用 Suno／Udio，音效建議用 ElevenLabs Sound Effects
> 或類似工具。下面每一條的英文描述可以直接貼進那些工具。

---

## 0. 聲音方向

**80 年代合成器波（synthwave）＋ 復古街機**，輕鬆、帶點搞笑，不要黑暗的賽博龐克。

- 主要音色：類比合成器 pad、方波／鋸齒波 lead、電子鼓（808／LinnDrum）、街機嗶嗶聲、雷射「啾」聲
- **爆炸要是卡通的電流「啵─滋」，不要寫實的轟炸聲**。Boomana 的經驗是：其他聲音都很卡通的時候，混一個寫實爆炸進來，聽起來像 bug
- 保留系列識別：猩猩的吼聲和捶胸的「呼呼」聲（`voice_roar`、`monkey_expand`）可以加一點合成器效果，但**還是要聽得出是猩猩**

## 1. 交件格式

| 項目 | 規格 |
|---|---|
| 格式 | WAV，44.1 kHz，16-bit（`monkey_expand` 可以是 mp3） |
| 聲道 | BGM 立體聲；音效單聲道或立體聲都可以 |
| 頭尾 | 音效開頭**不要有靜音**（按下就要響）；結尾自然收掉 |
| 音量 | 不要壓到爆音（峰值 −1 dBFS 以下），音量我會統一對齊 |
| Loop | 標「循環」的要能**無縫接回開頭**，不要淡入淡出 |

時長是**目前遊戲裡的長度**，演出時間是照它對的。可以差 ±20%，差更多請先跟我說。

---

## 2. 背景音樂（2 首）

| 檔名 | 時長 | 循環 | 說明 |
|---|---|---|---|
| `bgm_main.wav` | 30–60 秒 | ✅ | 主遊戲 |
| `bgm_freespin.wav` | 25–45 秒 | ✅ | 免費遊戲 |

**bgm_main**
```
Instrumental 80s synthwave groove, 105 BPM, warm analog pads, funky slap
synth bass, gated LinnDrum beat, a playful catchy square-wave lead, relaxed
night-drive mood with a cheeky arcade feel. Seamless loop, no intro or outro,
no vocals.
```

**bgm_freespin**
```
Instrumental high-energy synthwave / outrun, 128 BPM, driving arpeggiated
bass, bright saw-wave lead, big gated snares, rising excitement, same musical
key family as a relaxed 105 BPM synthwave main theme. Seamless loop, no intro
or outro, no vocals.
```
免費遊戲要明顯**更快、更亮**，一聽就知道進了特色遊戲。

---

## 3. 轉輪與操作（6 個）

| 檔名 | 時長 | 說明 | 英文描述 |
|---|---|---|---|
| `btn.wav` | 0.08s | 一般按鈕 | `tiny clean digital UI click, retro arcade` |
| `spin.wav` | 0.5s | 按下旋轉 | `short upward synth whoosh with a laser zap, arcade spin start` |
| `reel_stop.wav` | 0.16s | 每一輪停下 | `short punchy electronic thud with a tiny metallic click, reel stop` |
| `reel_tension.wav` | 2.0s | 等 Scatter 時的拉長緊張 | `rising synth riser with pulsing filter sweep, building tension, 2 seconds` |
| `pluck_low.wav` | 0.9s | 小獎、低分符號中獎 | `soft low synth pluck, short and friendly` |
| `symbol_reveal.wav` | 1.25s | 符號揭示 | `shimmering synth sparkle sweep with a soft chime, reveal` |

## 4. Scatter（5 個，音高一個比一個高）

| 檔名 | 時長 | 說明 |
|---|---|---|
| `scatter_1.wav`～`scatter_5.wav` | 各 1.0s | 第 1～5 顆 Scatter 落地 |

```
Bright golden synth bell hit with a sparkle tail, arcade coin-like, 1 second.
```
**五個是同一個聲音，每顆往上升一個音**（例如 C → D → E → G → C 高八度），第 5 顆最華麗。
可以生一個，再請我用程式移調出另外四個。

## 5. 脈衝彈（取代炸藥）＋ Overdrive 階梯（7 個）

這組是照爆炸演出的四個節拍（蓄力 → 引爆 → 換符號 → 落定）對時間的。

| 檔名 | 時長 | 說明 | 英文描述 |
|---|---|---|---|
| `fuse_sizzle.wav` | 0.38s | 脈衝彈落地、引信通電 | `short crackling electric sizzle, tiny sparks` |
| `dynamite_blast.wav` | 1.3s | 單輪引爆 | `cartoon electric pulse blast: a bright "bwoom-zap" synth hit with a crackle tail, playful not realistic` |
| `dynamite_blast_big.wav` | 1.5s | 多輪引爆（比上面更大） | `bigger cartoon electric pulse blast, deeper synth boom with a wide crackling shockwave and glitter tail` |
| `symbol_shatter.wav` | 1.0s | 舊符號碎裂 | `glassy digital shatter with glitch stutter, short` |
| `smoke_puff.wav` | 1.1s | 爆完的煙／電流消散 | `soft fizzing electric dissipation with a gentle whoosh` |
| `press_blast.wav` | 0.7s | 盤面被衝擊壓一下 | `short heavy synth thump with a low sub drop` |
| `ladder_up.wav` | 1.1s | Overdrive 升一階 | `power-up charge: a battery charging blip followed by a rising synth note` |

> 檔名保留 `dynamite_*`，是為了不用改程式。內容換成電流脈衝就好。

## 6. 全盤同圖（Overdrive 滿階，2 個）

| 檔名 | 時長 | 說明 | 英文描述 |
|---|---|---|---|
| `fullboard_chain.wav` | 1.3s | 五輪連鎖過載 | `rapid chain of five electric zaps rising in pitch, overload` |
| `fullboard_stamp.wav` | 2.2s | 全盤定格、蓋章 | `huge triumphant synth stab with a bass drop and sparkle tail, overload complete` |

## 7. 特色遊戲觸發（6 個）

| 檔名 | 時長 | 說明 | 英文描述 |
|---|---|---|---|
| `gong_feature.wav` | 3.0s | 觸發免費遊戲的大鑼 | `massive synthwave power chord hit with gated reverb and a laser sweep, feature triggered` |
| `fs_intro.wav` | 2.4s | 免費遊戲開場 | `short heroic outrun fanfare on bright saw synths` |
| `cave_quake.wav` | 3.3s | 觸發時整個場景震動 | `deep rumbling sub-bass wobble with electric hum, the city shaking` |
| `voice_roar.wav` | 2.7s | 猩猩吼叫 | `friendly gorilla roar, cartoon but clearly a gorilla, light vocoder sheen` |
| `voice_effort.wav` | 0.4s | 猩猩用力的短哼 | `short gorilla grunt of effort` |
| `monkey_expand.mp3` | ~1.8s | 捶胸的「呼呼」聲 | `gorilla chest-beat hoots, six quick hoots, playful` |

**monkey_expand 的節奏要保留**：程式是對著原本六下的位置做捶胸動作。新檔請盡量維持**約 1.8 秒、六下**。

## 8. 中獎（12 個）

| 檔名 | 時長 | 說明 |
|---|---|---|
| `win_gliss.wav` | 1.3s | 一般中獎的上滑音 |
| `win_gliss_big.wav` | 3.0s | 較大中獎的上滑音 |
| `win_panel.wav` | 2.1s | 中獎金額面板出現 |
| `win_big.wav` | 2.7s | BIG WIN 號角 |
| `win_super.wav` | 3.3s | SUPER WIN |
| `win_mega.wav` | 3.9s | MEGA WIN |
| `win_epic.wav` | 4.5s | EPIC WIN |
| `win_max.wav` | 5.1s | MAX WIN |
| `win_cap.wav` | 3.8s | 達到最高贏分上限 |
| `bigwin_blast.wav` | 2.4s | 大獎牌匾彈出的衝擊 |
| `coin_shimmer.wav` | 2.4s | 代幣灑落的閃亮聲 |
| `wild_expand.wav` | 2.6s | Wild 演出 |

**五個大獎號角（big → max）要一個比一個大**，同一段旋律越疊越多層：
```
Synthwave victory fanfare, bright brass-like synth stabs over a gated drum
fill, celebratory, [2.7] seconds.   ← big
```
super／mega／epic／max 依序加長、加層（加琶音、加合唱 pad、加雷射掃頻），max 最長也最滿。

其他幾個：
- `win_gliss`：`quick upward synth glissando sparkle`
- `win_gliss_big`：`long upward synth glissando with sparkle and a soft cymbal swell`
- `win_panel`：`synth chime panel pop with a short arpeggio`
- `win_cap`：`grand final synth fanfare ending on a sustained bright chord`
- `bigwin_blast`：`punchy synth impact with a laser zap and sparkle burst`
- `coin_shimmer`：`cascade of bright digital token clinks with sparkle`
- `wild_expand`：`electric DJ scratch into a rising synth swell`

## 9. 其他（2 個）

| 檔名 | 時長 | 說明 | 英文描述 |
|---|---|---|---|
| `mult_update.wav` | 0.7s | 倍數／數值更新 | `short bright synth blip-up` |
| `grenade_blast.wav` | 0.72s | 小型爆裂（演出點綴用） | `small cartoon electric pop with crackle` |

---

## 10. 交件清單

```
neon_delivery/audio/
  bgm_main bgm_freespin                                         (2)
  btn spin reel_stop reel_tension pluck_low symbol_reveal       (6)
  scatter_1 scatter_2 scatter_3 scatter_4 scatter_5             (5)
  fuse_sizzle dynamite_blast dynamite_blast_big symbol_shatter
  smoke_puff press_blast ladder_up                              (7)
  fullboard_chain fullboard_stamp                               (2)
  gong_feature fs_intro cave_quake voice_roar voice_effort
  monkey_expand                                                 (6)
  win_gliss win_gliss_big win_panel win_big win_super win_mega
  win_epic win_max win_cap bigwin_blast coin_shimmer wild_expand (12)
  mult_update grenade_blast                                     (2)
```
共 **42 個**。

**優先順序**（缺的會先沿用 Boomana 的叢林音效，遊戲不會壞）：
1. `bgm_main`、`bgm_freespin`：這兩首最決定整體感覺
2. 脈衝彈那組（第 5 節）：這是這款的招牌
3. 中獎號角（第 8 節）
4. 其他

> 遊戲裡還有一包舊的合成音效（`sounds.mp3`，大獎背景循環、預期音之類），那包我會用程式
> 重新配色或從上面這些音效裡剪出來，**不用另外生**。
