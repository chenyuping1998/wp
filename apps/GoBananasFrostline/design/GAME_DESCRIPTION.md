# Go Bananas 100 — 遊戲介紹

## 短版（listing 用，英文）

> Go Bananas 100 is a 5×5, 15-line jungle-commando slot with a 92% RTP and a
> 25,000× max win.
>
> Land 4 or 5 golden Scatters to open 12 or 15 Free Spins. There, every Wild
> expands to cover its whole reel and sticks for the rest of the feature — and
> its multiplier never resets. It climbs on every spin, up to 100× on a single
> Wild, and multipliers from every Wild on a winning line are added together.
>
> Three ways in: 200× for Free Spins, 500× for a guaranteed 5-Scatter start with
> 18 spins and faster-growing Wilds, or 50× for Super Spin — a hold-and-spin
> round where every Coin that lands resets the respins.

## 一句話版

> Sticky expanding Wilds whose multipliers only ever climb — to 100× each, added
> together across the line, up to 25,000×.

## 中文

> 5×5、15 線的叢林突擊隊主題老虎機，RTP 92%，最高獎金 25,000 倍。
>
> 集滿 4 或 5 個金色 Scatter 進入 12 或 15 次免費遊戲。免費遊戲中每個百搭都會
> 擴展覆蓋整條轉軸並黏著到結束，而它的倍率**只增不減**——每一轉都往上長，單個
> 百搭最高 100 倍，同一條線上所有百搭的倍率會**相加**。
>
> 三種進場方式：200 倍買免費遊戲、500 倍買保底 5 Scatter 的 18 轉強化版、
> 或 50 倍買 Super Spin 連線續轉，每落下一枚金幣就重置續轉次數。

---

## 注意事項

- **social 模式不能用這版。** `buy` 和 `bet` 都在 Stake 的限制字表上
  （`design/check_social_words.mjs`）。social 版本要把 "Three ways in: 200× for…"
  改成 "Three ways to play: 200× …"，並把任何 "bet" 換成 "amount"。
- 數字與 `math-sdk/games/GoBananas100` 目前的設定一致：RTP 0.92、wincap 25000、
  `freespin_triggers` 4→12 / 5→15、`max_wild_multiplier` 100、三個買入模式
  200 / 500 / 50。**改動數學後這份要跟著更新**，文案與數學不符認證會擋。
