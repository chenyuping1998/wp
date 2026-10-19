# Go Banalchemy — 遊戲介紹

> 2026-10-16 重寫。前一版是 Go Bananas 100 留下的內容（5×5、15 線、92%），與本款無關。

## 英文機制說明（100 字內）

> Go Banalchemy is a 5×4, 1,024-ways slot with 96% RTP and a 10,000× max win. Wins pay for 3+ matching symbols on adjacent reels from the left. A Reagent transmutes its whole reel into the highest-value symbol already on it. Land 3, 4 or 5 Scatters for 8, 10 or 12 Free Spins, where every Reagent fills a meter that widens each reaction from 1 reel up to all 5. Buy Free Spins at 100×, 200× or 300×—higher tiers start further up the meter—or play Hold and Spin at 50×: every Coin resets the respins to 3, up to 1,000×.

## 注意

- 數字對應 `math-sdk/games/GoBanalchemy`（2026-10-16 起與 GoBoomana 同一份分布）：RTP 0.96、wincap 10000、Scatter 3/4/5 → 8/10/12、買入 100/200/300（8 轉，能量條起點 0/2/4）、Hold and Spin 50×、上限 1000×。**數學改了這份要跟著改。**
- **social 模式不能直接用：** `Buy` 在 Stake 限制字表上，要改成 "Get Free Spins at 100×…" 之類的說法（見 `design/check_social_words.mjs`）。
- 全遊戲名稱已統一（2026-10-16）：Reagent（原 Dynamite）、Alchemist Wild（原 Foreman Wild）、reaction／transmuted（原 blast／blasted）、獎圖 Elixir Lantern／Amethyst Crystal／Crucible Tongs／Flask Cart（原 Miner's Lamp／Golden Banana Ore／Crossed Pickaxes／Ore Cart）。規則、賠付表、買入視窗、讀取頁、說明卡用詞一致。
