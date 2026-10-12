# Mardi Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Mardi Monkey is a 5×4, 1,024-ways slot set in a New Orleans carnival parade, built like a papier-mâché parade float, with a 10,000× max win.
>
> Beads land carrying values from 1× to 50×. Whenever the Marshal Wild
> lands beside them, every Marshal on the board collects every Bead — two Marshals
> collect them twice.
>
> Land 3, 4 or 5 Golden Masks for 10, 12 or 15 Free Spins, where a float-riding monkey takes the stage and Beads reach 250×.
> Every Marshal that lands fills the Marshal meter: at 4, 8 and 12 Marshals you get +10 spins and all 10s,
> then Js, then Qs turn into Beads for the rest of the feature.
>
> Two ways straight in: Second Line at 100× for 10 Free Spins, or Fat Tuesday
> at 150×, which opens with the meter at 4 and every 10 already a Bead.

## 一句話版

> Every Marshal collects every Bead — and in Free Spins the Marshal meter turns the
> low symbols into more Beads, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以紐奧良嘉年華遊行為主題、紙糊花車畫風的老虎機，最高獎金 10,000 倍。
>
> 串珠（Bead）落下時帶有 1 倍到 50 倍的數值。只要百搭隊長（Marshal）同時
> 在盤面上，**每一位隊長都會收走所有串珠**——兩位隊長就收兩次。
>
> 3、4、5 個金面具（Golden Mask）開啟 10、12、15 次免費遊戲，由花車猴登台，串珠最高 250 倍。
> 每落下一位隊長都會累積計量表：滿 4、8、12 位各加 10 次免費遊戲，並依序把所有 10、J、Q 換成串珠，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Second Line（10 次免費遊戲），或 150 倍的 Fat Tuesday，
> 計量表從 4 開始，所有 10 一開場就已是串珠。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** social 版請改成 "Two ways to play: Second Line (100× amount) …"，
  並避免任何 bet、buy、pay 等限制字（見 `design/check_social_words.mjs`）。
- 數字沿用 Jade Teahouse 的數學（數學全等）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、
  計量表 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）/ 150×（meter 4）各 10 手；
  P 數值主遊戲 1–50×、免費遊戲最高 250×。Wild 只在第 2–5 輪。
  **用 MardiMonkey 重跑 run.py 後，要再拿新 books 驗證一次這些說法**。
- 遊戲內名稱：Scatter = Golden Mask、Wild = Marshal、收集符號 = Bead、
  兩個買入 = Second Line / Fat Tuesday，與規則頁、WIN TABLE、買入選單一致。
