# Swing Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Swing Monkey is a 5×4, 1,024-ways slot set in a speakeasy jazz club, drawn like a 1930s rubber-hose cartoon, with a 10,000× max win.
>
> Records land carrying values from 1× to 50×. Whenever the Bandleader Wild
> lands beside them, every Bandleader on the board collects every Record — two Bandleaders
> collect them twice.
>
> Land 3, 4 or 5 Golden Mics for 10, 12 or 15 Free Spins, where a tap-dancing monkey takes the stage and Records reach 250×.
> Every Bandleader that lands fills the Bandleader meter: at 4, 8 and 12 Bandleaders you get +10 spins and all 10s,
> then Js, then Qs turn into Records for the rest of the feature.
>
> Two ways straight in: Late Set at 100× for 10 Free Spins, or Big Band Night
> at 150×, which opens with the meter at 4 and every 10 already a Record.

## 一句話版

> Every Bandleader collects every Record — and in Free Spins the Bandleader meter turns the
> low symbols into more Records, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以 1930 年代地下爵士俱樂部為主題、橡皮管卡通畫風的老虎機，最高獎金 10,000 倍。
>
> 唱片（Record）落下時帶有 1 倍到 50 倍的數值。只要百搭團長（Bandleader）同時
> 在盤面上，**每一位團長都會收走所有唱片**——兩位團長就收兩次。
>
> 3、4、5 個金麥克風（Golden Mic）開啟 10、12、15 次免費遊戲，由踢踏舞猴登台，唱片最高 250 倍。
> 每落下一位團長都會累積計量表：滿 4、8、12 位各加 10 次免費遊戲，並依序把所有 10、J、Q 換成唱片，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Late Set（10 次免費遊戲），或 150 倍的 Big Band Night，
> 計量表從 4 開始，所有 10 一開場就已是唱片。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** social 版請改成 "Two ways to play: Late Set (100× amount) …"，
  並避免任何 bet、buy、pay 等限制字（見 `design/check_social_words.mjs`）。
- 數字沿用 Jade Teahouse 的數學（數學全等）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、
  計量表 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）/ 150×（meter 4）各 10 手；
  P 數值主遊戲 1–50×、免費遊戲最高 250×。Wild 只在第 2–5 輪。
  **用 SwingMonkey 重跑 run.py 後，要再拿新 books 驗證一次這些說法**。
- 遊戲內名稱：Scatter = Golden Mic、Wild = Bandleader、收集符號 = Record、
  兩個買入 = Late Set / Big Band Night，與規則頁、WIN TABLE、買入選單一致。
