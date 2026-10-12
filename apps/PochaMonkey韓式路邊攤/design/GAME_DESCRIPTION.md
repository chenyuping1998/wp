# Pocha Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Pocha Monkey is a 5×4, 1,024-ways slot set in a late-night Seoul street tent,
> drawn like a full-colour webtoon, with a 10,000× max win.
>
> Chicken Baskets land carrying values from 1× to 50×. Whenever the Boss Wild
> lands beside them, every Boss on the board collects every Basket — two Bosses
> collect them twice.
>
> Land 3, 4 or 5 Pagers for 10, 12 or 15 Free Spins, where the part-timer takes
> over the counter and Baskets reach 250×. Every Boss that lands fills the
> Boss meter: at 4, 8 and 12 Bosses you get +10 spins and all 10s, then Js, then
> Qs turn into Chicken Baskets for the rest of the feature.
>
> Two ways straight in: Late Night at 100× for 10 Free Spins, or Midnight Feast
> at 150×, which opens with the meter at 4 and every 10 already a Basket.

## 一句話版

> Every Boss collects every Basket — and in Free Spins the Boss meter turns the
> low symbols into more Baskets, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以首爾深夜帳篷路邊攤為主題、韓國條漫畫風的老虎機，
> 最高獎金 10,000 倍。
>
> 炸雞籃（Chicken Basket）落下時帶有 1 倍到 50 倍的數值。只要百搭攤主（Boss）同時
> 在盤面上，**每一位攤主都會收走所有炸雞籃**——兩位攤主就收兩次。
>
> 3、4、5 個取餐呼叫器（Pager）開啟 10、12、15 次免費遊戲，由打工生接手
> 攤位，炸雞籃最高 250 倍。每落下一位攤主都會累積攤主計量表：滿 4、8、12 位
> 各加 10 次免費遊戲，並依序把所有 10、J、Q 換成炸雞籃，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Late Night（10 次免費遊戲），或 150 倍的 Midnight Feast，
> 計量表從 4 開始，所有 10 一開場就已是炸雞籃。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** social 版請改成 "Two ways to play: Late Night (100× amount) …"，
  並避免任何 bet、buy、pay 等限制字（見 `design/check_social_words.mjs`）。
- 數字沿用 Jade Teahouse 的數學（數學全等）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、
  計量表 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）/ 150×（meter 4）各 10 手；
  籃子數值主遊戲 1–50×、免費遊戲最高 250×。Wild 只在第 2–5 輪。
  **用 PochaMonkey 重跑 run.py 後，要再拿新 books 驗證一次這些說法**。
- 遊戲內名稱：Scatter = Pager、Wild = Boss、收集符號 = Chicken Basket、
  兩個買入 = Late Night / Midnight Feast，與規則頁、WIN TABLE、買入選單一致。
