# Sushi Monkey — 遊戲介紹（送審用）

## 短版（listing 用，英文）

> Sushi Monkey is a 5×4, 1,024-ways slot set in a back-alley sushi bar, drawn
> in black ink and warm paper, with a 10,000× max win.
>
> Sushi Plates land carrying values from 1× to 50×. Whenever the Chef Wild
> lands beside them, every Chef on the board collects every Plate — two Chefs
> collect them twice.
>
> Land 3, 4 or 5 Order Bells for 10, 12 or 15 Free Spins, where a second chef
> takes over the counter and Plates reach 250×. Every Chef that lands fills the
> Chef meter: at 4, 8 and 12 Chefs you get +10 spins and all 10s, then Js, then
> Qs turn into Sushi Plates for the rest of the feature.
>
> Two ways straight in: Dinner Service at 100× for 10 Free Spins, or Omakase Course
> at 150×, which opens with the meter at 4 and every 10 already a Plate.

## 一句話版

> Every Chef collects every Plate — and in Free Spins the Chef meter turns the
> low symbols into more Plates, up to 10,000×.

## 中文

> 5×4、1,024 種連線方式，以巷弄壽司店為主題、黑墨線稿配暖色紙張的老虎機，
> 最高獎金 10,000 倍。
>
> 壽司盤（Sushi Plate）落下時帶有 1 倍到 50 倍的數值。只要百搭師傅（Chef）同時
> 在盤面上，**每一位師傅都會收走所有壽司盤**——兩位師傅就收兩次。
>
> 3、4、5 個點餐鈴（Order Bell）開啟 10、12、15 次免費遊戲，由另一位師傅接手
> 櫃台，壽司盤最高 250 倍。每落下一位師傅都會累積師傅計量表：滿 4、8、12 位
> 各加 10 次免費遊戲，並依序把所有 10、J、Q 換成壽司盤，直到免費遊戲結束。
>
> 兩種直接進場：100 倍的 Dinner Service（10 次免費遊戲），或 150 倍的 Omakase Course，
> 計量表從 4 開始，所有 10 一開場就已是壽司盤。

---

## 注意事項

- **依要求不寫 RTP。**
- **social 模式不能用這版。** 這版沒有 bet／buy／pay，但 "Two ways straight in:
  … at 100×" 在 social 平台仍是付費進場的說法；social 版請改成
  "Two ways to play: Dinner Service (100× amount) …"，並避免任何 bet、buy、pay、
  win table 以外的替代字（見 `design/check_social_words.mjs`）。
- 數字與目前的數學設定一致（`src/game/config.ts`，由 `design/sync_math_config.mjs`
  同步）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、banditMeter
  thresholds 4/8/12 各 +10 手、replacements L5/L4/L3（10/J/Q）、買入 100×（meter 0）
  / 150×（meter 4）各 10 手；壽司盤數值主遊戲 1–50×、免費遊戲最高 250×（已用
  published books 驗證）。Wild 只在第 2–5 輪。**改動數學後這份要跟著更新**。
- 遊戲內名稱：Scatter = Order Bell、Wild = Chef、收集符號 = Sushi Plate、
  兩個買入 = Dinner Service / Omakase Course，與規則頁、WIN TABLE、買入菜單一致。
