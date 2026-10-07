# Soul Seal — 語音音效提示詞

W 的角色語音，兩段。目前遊戲裡跑的是合成版本（聲門脈衝過共振峰，
見 `design/generate_audio_terminal.mjs` 的 `voice`），觸發的那一行已經
先註解掉——拿到真人錄音後換檔、把那行加回來即可，兩處的註解都寫了怎麼恢復。

---

## 先決條件：不能有詞

**這兩段都必須是無語意的發聲。** 不是建議，是硬性限制。

這款出十二個語系，介面上每一個字都會跟著語系換。烤進音檔裡的**詞句換不了**——
講中文的咒語，英文、日文、阿拉伯文的玩家都會聽到同一句中文。業界的拉霸機幾乎
都用無詞的吟誦，就是為了避開這件事。

所以要的是：**張開的母音、拉長的音、咒調的形狀**，不要任何語言的字。
聽起來要像「他在念咒」，而不是「他念了什麼」。

---

## 共通的角色設定（兩段都貼）

```
A single low male voice, unaccompanied. No words in any language — wordless
vocalisation only: open vowels and held tone.

WHO IS SPEAKING
A temple exorcist, mid-rite. He is not warning anyone and not celebrating —
he is working. Both lines are addressed to what he is sealing, not to the
listener.

He has done this many times. Nothing in the voice should suggest he expects
to fail, and nothing should suggest excitement — the tension belongs to the
player, not to him.

TONE
Chest, not throat. Low: around A2 to E2. Slight natural vibrato, the kind a
held note has without being asked for. Some breath in it — a voice with no
air in it reads as an instrument.

Dry, close-mic'd, then placed in a SMALL STONE ROOM: a short hard reverb,
the sound of a shrine and not a cathedral.

NOT
Not a chant choir. Not Tibetan overtone singing. Not a monster voice, no
pitch-shifting, no growl, no whisper. One man, one breath.
```

**兩段要同一個人、同一個房間、同一支麥克風錄。** 它們在同一局裡先後出現，
差別必須在**句法**而不是在音色——換了嗓子就變成兩個角色。

---

## 一、預中（`chant_tease`）

在轉輪還在跑的時候響。它的任務是**讓人等**，不是報消息——
玩家此時還不知道會不會中。

```
DELIVERY
Three utterances. The first two are short and level, half a beat apart,
like a name being checked off. The third is longer and does NOT resolve —
it settles onto a closed hum and stays there.

Unhurried to the point of indifference. Slower than feels natural; the
reels are still turning underneath it.

LENGTH  2.0 to 2.5 seconds total.
```

**為什麼最後要停在閉口的嗡音**：這一句要在轉輪停下來之前結束，但不能聽起來
「講完了」——講完了就變成結論，而結論還沒發生。停在一個沒有收尾的嗡上，
懸念留給畫面。

---

## 二、W 收分（`chant_collect`）

百搭掃走盤面上的妖靈時響。

**這一聲每次 sweep 都會響一次，不是每回合一次。** 盤上有幾隻百搭就響幾次，
最多五次連續。所以它必須**短**，而且**不能有結尾**。

```
DELIVERY
ONE syllable, rising. It opens on a rounded vowel and lifts into an open
one, climbing about a fourth in pitch across its own length.

It does not resolve and it does not land — it is a breath being drawn in,
not a phrase being finished.

Effort, not volume: the sound of taking hold of something, made by someone
who is not straining.

LENGTH  0.7 to 0.9 seconds. Shorter is better than longer.

IMPORTANT: this cue plays up to FIVE times in a row, a fraction of a second
apart. Record it so that overlapping copies of itself do not turn to mud —
keep the low end tight and leave the tail clean.
```

**為什麼要升不要落**：升的音是「拿起」，落的音是「放下」。畫面上是符咒被
吸向百搭，聲音必須同向。而且一個會結束的音，聽第三次就沒感覺了。

---

## 交件規格

| | |
|---|---|
| 格式 | WAV，44.1 kHz，**單聲道**，16-bit |
| 峰值 | 留 -3 dBFS，不要壓到頂 |
| 房間 | 錄在錄音裡（短硬混響），遊戲不會再加 |
| 命名 | `chant_tease.wav` / `chant_collect.wav` |
| 放置 | `static/assets/audio/terminal/` |

**響度不用你處理。** 兩段會用 `MIX.chantTease`（-18 dBFS）和
`MIX.chantCollect`（-20 dBFS）重新對齊——預中那段要壓過底下的 `tension`
顫音循環，那條實測比人聲還大過，已經調過了。

**不要加淡入淡出以外的處理。** 不要壓縮、不要 EQ 修飾、不要立體聲展寬。
遊戲的混音是一整組音效一起對的，單獨修過的檔案會跟其他二十七個對不齊。

---

## 恢復觸發

拿到檔案、放進 `terminal/` 之後，把這兩行取消註解：

- `src/components/TriggerTease.svelte` — 預中
- `src/components/Collect.svelte` — W 收分（在 sweep 迴圈裡，每次 sweep 一聲）

`Sound.svelte` 的對應和 `MIX` 的響度目標都還在，不用動。
