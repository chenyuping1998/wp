# Saucer Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Saucer Monkey is a 5×4, 1,024-ways slot set on a moonlit 1950s cornfield,
> drawn as a B-movie sci-fi poster, with a 10,000× max win.
>
> Cows land carrying values from 1× to 50×. Whenever the Captain Wild lands
> beside them, every Captain beams up every Cow — two Captains collect them twice.
>
> Land 3, 4 or 5 Golden Saucers for 10, 12 or 15 Free Spins, where the Farm Kid
> takes the stage and Cows reach 250×. Every Captain that lands fills the Captain
> meter: at 4, 8 and 12 Captains you get +10 spins and all 10s, then Js, then Qs
> turn into Cows for the rest of the feature.
>
> Two ways straight in: Close Encounter at 100× for 10 Free Spins, or Mothership
> at 150×, which opens with the meter at 4 and every 10 already a Cow.

## 一句話版

> Every Captain beams up every Cow — and in Free Spins the Captain meter turns
> the low symbols into more Cows, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以 1950 年代月夜玉米田為舞台、B 級科幻電影海報畫風的老虎機，最高獎金 10,000 倍。
>
> 乳牛（Cow）落下時帶有 1 倍到 50 倍的數值。只要百搭外星猴艦長（Captain）同時
> 在盤面上，**每一位艦長都會用光柱吸走所有乳牛**——兩位艦長就收兩次。
>
> 3、4、5 個金飛碟（Golden Saucer）開啟 10、12、15 次免費遊戲，由農場小猴（Farm Kid）登台，乳牛最高 250 倍。
> 每落下一位艦長都會累積計量表：滿 4、8、12 位各加 10 次免費遊戲，並依序把所有 10、J、Q 換成乳牛，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Close Encounter（10 次免費遊戲），或 150 倍的 Mothership，
> 計量表從 4 開始，所有 10 一開場就已是乳牛。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** social 版請改成 "Two ways to play: Close Encounter (100× amount) …"，
  並避免任何 bet、buy、pay 等限制字（見 `design/check_social_words.mjs`）。
- 數字取自 `src/game/config.ts`（由數學同步）：5×4、上限 10,000×、Scatter 3→10／4→12／5→15、
  計量表 4/8/12 各 +10 手、依序替換 10/J/Q（L5/L4/L3）、買入 100×（計量 0）／150×（計量 4）各 10 手；
  乳牛數值主遊戲 1–50×、免費遊戲最高 250×。Wild 只在第 2–5 輪。重跑數學後請再跑 `pnpm check:claims`。
- 遊戲內名稱：Scatter = Golden Saucer、Wild = Captain、收集符號 = Cow、FG 角色 = Farm Kid、
  兩個買入 = Close Encounter / Mothership，與規則頁、WIN TABLE、買入選單一致。
- 2026-10-17 從 Strike 版改寫（原文是保齡球館）。
