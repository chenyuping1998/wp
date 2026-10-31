# Jade Teahouse — 遊戲介紹（送審用）

> 2026-10-31 重寫：這份之前一直是 Sushi Monkey 的原文（Sushi Plate／Chef／Order Bell／
> Dinner Service），從沒改成茶樓。名稱與數字已對照目前的規則頁、betModeMeta 與 config。

## 短版（listing 用，英文）

> Jade Teahouse is a 5×4, 1,024-ways slot set in a celadon-and-gold teahouse, with a
> 10,000× max win.
>
> Jade Cups land carrying values from 1× to 50×. Whenever the Tea Master Wild lands
> beside them, every Tea Master on the board collects every Jade Cup — two Tea Masters
> collect them twice.
>
> Land 3, 4 or 5 Festival Lantern Scatters for 10, 12 or 15 Free Spins, where the
> apprentice takes over and Jade Cups reach 250×. Every Tea Master that lands fills the
> meter: at 4, 8 and 12 you get +10 spins and all 10s, then Js, then Qs turn into Jade
> Cups for the rest of the feature.
>
> Two ways straight in: Tea Ceremony at 100× for 10 Free Spins, or Jade Ceremony at
> 150×, which opens with the meter at 4 and every 10 already a Jade Cup.

## 一句話版

> Every Tea Master collects every Jade Cup — and in Free Spins the meter turns the low
> symbols into more Jade Cups, up to 10,000×.

## 機制說明（英文，100 字內，2026-10-31）

> Jade Teahouse is a 5×4, 1,024-ways slot with a 10,000× max win. Jade Cups land carrying 1× to 50×; whenever a Tea Master Wild lands, every Tea Master collects every Jade Cup on the board. Land 3, 4 or 5 Festival Lantern Scatters for 10, 12 or 15 Free Spins, where Jade Cups reach 250×. During Free Spins, each Tea Master fills the meter: at 4, 8 and 12, you get +10 spins and all 10s, then Js, then Qs become Jade Cups. Buy Tea Ceremony (100×) for 10 Free Spins, or Jade Ceremony (150×), which starts with the meter at 4.

（98 字；social 版把 "Buy" 換成 "Play"。）

## 中文

> 5×4、1,024 種連線方式，以青瓷與金飾的茶樓為主題，最高獎金 10,000 倍。
>
> 玉杯（Jade Cup）落下時帶有 1 倍到 50 倍的數值。只要百搭茶師（Tea Master）同時
> 在盤面上，**每一位茶師都會收走所有玉杯**——兩位茶師就收兩次。
>
> 3、4、5 個花燈（Festival Lantern）開啟 10、12、15 次免費遊戲，由學徒接手，玉杯
> 最高 250 倍。每落下一位茶師都會累積計量表：滿 4、8、12 位各加 10 次免費遊戲，並
> 依序把所有 10、J、Q 換成玉杯，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Tea Ceremony（10 次免費遊戲），或 150 倍的 Jade Ceremony，
> 計量表從 4 開始，所有 10 一開場就已是玉杯。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** "Two ways straight in: … at 100×" 在 social 平台仍是付費
  進場的說法；social 版請改成 "Two ways to play: Tea Ceremony (100× amount) …"，並避免
  bet、buy、pay 等字（見 `design/check_social_words.mjs`）。
- 數字與目前的數學設定一致（`src/game/config.ts`，由 `design/sync_math_config.mjs`
  同步）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、banditMeter
  thresholds 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）
  / 150×（meter 4）各 10 手；玉杯數值主遊戲 1–50×、免費遊戲最高 250×。
  **改動數學後這份要跟著更新**。
- 遊戲內名稱：Scatter = Festival Lantern、Wild = Tea Master、收集符號 = Jade Cup、
  兩個買入 = Tea Ceremony / Jade Ceremony，與規則頁、買入選單一致。
