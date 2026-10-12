# Diner Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Diner Monkey is a 5×4, 1,024-ways slot set in a 1950s roadside diner, drawn
> like a Sunday comic strip, with a 10,000× max win.
>
> Order Trays land carrying values from 1× to 50×. Whenever the Chef Wild
> lands beside them, every Chef on the board collects every Tray — two Chefs
> collect them twice.
>
> Land 3, 4 or 5 Service Bells for 10, 12 or 15 Free Spins, where a roller-skating
> carhop takes over the counter and Trays reach 250×. Every Chef that lands fills the
> Chef meter: at 4, 8 and 12 Chefs you get +10 spins and all 10s, then Js, then
> Qs turn into Order Trays for the rest of the feature.
>
> Two ways straight in: Lunch Rush at 100× for 10 Free Spins, or Blue Plate Special
> at 150×, which opens with the meter at 4 and every 10 already a Tray.

## 一句話版

> Every Chef collects every Tray — and in Free Spins the Chef meter turns the
> low symbols into more Trays, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以 50 年代公路餐館為主題、美式漫畫畫風的老虎機，
> 最高獎金 10,000 倍。
>
> 點餐托盤（Order Tray）落下時帶有 1 倍到 50 倍的數值。只要百搭主廚（Chef）同時
> 在盤面上，**每一位主廚都會收走所有托盤**——兩位主廚就收兩次。
>
> 3、4、5 個服務鈴（Service Bell）開啟 10、12、15 次免費遊戲，由溜冰鞋服務生接手
> 櫃台，托盤最高 250 倍。每落下一位主廚都會累積主廚計量表：滿 4、8、12 位
> 各加 10 次免費遊戲，並依序把所有 10、J、Q 換成托盤，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Lunch Rush（10 次免費遊戲），或 150 倍的 Blue Plate Special，
> 計量表從 4 開始，所有 10 一開場就已是托盤。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** "Two ways straight in: … at 100×" 在 social 平台仍是付費進場的說法；
  social 版請改成 "Two ways to play: Lunch Rush (100× amount) …"，並避免任何 bet、buy、pay
  等限制字（見 `design/check_social_words.mjs`）。
- 數字沿用 Jade Teahouse 的數學（數學全等）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、
  計量表 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）/ 150×（meter 4）各 10 手；
  托盤數值主遊戲 1–50×、免費遊戲最高 250×。Wild 只在第 2–5 輪。
  **用 DinerMonkey 重跑 run.py 後，要再拿新 books 驗證一次這些說法**。
- 遊戲內名稱：Scatter = Service Bell、Wild = Chef、收集符號 = Order Tray、
  兩個買入 = Lunch Rush / Blue Plate Special，與規則頁、WIN TABLE、買入選單一致。
