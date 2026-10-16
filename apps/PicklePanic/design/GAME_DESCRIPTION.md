# Pickle Panic — 送審描述

格式依 game-reskin SKILL.md §9（五段、純文字、約 150–190 字）。2026-10-16 依目前上架版本（math v2 / front v6）重寫；原本的壽司版名稱已過時。

```
Base Game

Pickle Panic is a 5×4 video slot with 1,024 ways. Pickle Jars land carrying a value from 1× to 50× the bet. The Cook is the Wild and appears on reels 2 to 5; whenever a Cook and a Jar are on the board together, every Cook collects the total value of every Jar.

Free Spins

3, 4 or 5 Order Bell Scatters award 10, 12 or 15 Free Spins, where Jars reach up to 250×. Every Cook that lands fills the Cook meter: at 4, 8 and 12 Cooks 10 spins are added and all 10s, then Js, then Qs become Pickle Jars until the feature ends. Scatters do not retrigger, so a feature reaches at most 45 spins.

Buy Bonus

Diner Service buys direct entry at 100× the bet with the meter empty. Extra Dill costs 150× and opens with the meter at 4, every 10 already a Jar. Both start with 10 spins.

RTP & Max Win

RTP ranges from 96.02% (base) to 96.06% (Extra Dill), with a spread of 0.04% across all three modes. Max Win is capped at 10,000× the bet in every mode.
```

## 數字出處

- `src/game/config.ts`（由 design/sync_math_config.mjs 從數學同步）：5×4、wincap 10,000、scatterSpins 3→10 / 4→12 / 5→15、banditMeter 4/8/12 各 +10 手、替換 10/J/Q、買入 100×（meter 0）/ 150×（meter 4）各 10 手、prizeRanges 主遊戲 1–50×、免費遊戲 1–250×。
- RTP：stakecli compliance upload/PicklePanic/math → 96.02 / 96.04 / 96.06。
- 最多 45 手＝15 + 3×10（規則頁同一算式）；免費遊戲不會再觸發（規則頁 Retriggers）。
- 名稱與遊戲內一致：Pickle Jar、Cook（Wild，第 2–5 輪）、Order Bell（Scatter）、Cook meter、Diner Service、Extra Dill。
- **改數學後這份要跟著改。** social 平台不能用這版（含 bet、buys）。
