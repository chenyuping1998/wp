# Saucer Monkey（飛碟農場）規則

> 2026-10-16 開案，從 StrikeMonkey（Jade Teahouse 底）換皮，數學全等。名詞對照：茶師／球王 → Captain（外星猴艦長，W）、玉杯／球瓶 → Cow（乳牛，P）、燈籠／金保齡球 → Golden Saucer（金飛碟，S）、FG 角色 → Farm Kid。買入名稱 Close Encounter（100×）／Mothership（150×）。

- 5 輪 × 4 列，1,024 Ways，從第 1 輪起連續 3 輪以上同符號給獎。
- W 艦長出現在第 2–5 輪，替代一般獎圖。每個 W 收取盤面全部乳牛 P 的獎值；收集倍率固定 ×1，與 Ways 獎分開計算。
- 基礎遊戲出現 3／4／5 個金飛碟 S，給 10／12／15 次免費轉盤。免費轉盤不重觸發。
- 免費轉盤每落下 1 個 W，艦長計數 +1。達到 4／8／12 時各加 10 轉；之後依序把 10、J、Q 整種符號替換為 P，舊替換持續有效。
- 免費轉盤買入：`bonus` 100×，10 轉、計數 0；`superbonus` 150×，10 轉、計數 4。上限 10,000×。
- 乳牛獎值：基礎遊戲 1／2／3／5／10／15／20／30／40／50×；免費轉盤再加入 100／150／200／250×。
- 前端事件仍沿用 `banditMeter`、`collect` 等內部 key。

數學：`math-sdk/games/SaucerMonkey飛碟農場`（junction `games/SaucerMonkey`）。base 與兩種買入 RTP 皆 96%；2026-10-17 已跑 10 萬本／模式並通過 SDK 驗證。重跑後請跑 `pnpm check:claims` 驗證規則說法。
