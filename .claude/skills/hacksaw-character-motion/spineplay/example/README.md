# example/ — 約束自我檢查用的合成骨架

`rigtest.json` / `rigtest.atlas` / `rigtest.png` 是 `make_rigtest.py` 產生的，
**完全是自己編的**：骨架是手寫的，貼圖是四個色塊，沒有任何第三方內容。

它刻意把這些分支都走一遍：

| 分支 | 在哪 |
|---|---|
| 兩節 IK（stretch / uniform / softness / bendPositive 中途反轉）| `ik2` |
| 單節 IK（compress / stretch / uniform）| `ik1` |
| IK 打在 `noRotationOrReflection` 的骨上 | `ik_nrr` |
| IK 打在 `noScale` 的骨上 | `ik_nsc` |
| transform 約束 world / absolute | `tw`（六個 mix 都有動畫）|
| transform 約束 world / relative | `twr` |
| transform 約束 local / absolute | `tl` |
| transform 約束 local / relative | `tlr` |
| path 約束：proportional 間距 + chainScale + mixX≠mixY | `pc` |
| 4.0 的單軸通道 `translatex` / `translatey` / `scalex` | `ik_target`、`src` |
| 控制點超出區段範圍的曲線（會逼出關鍵幀邊界的取段行為）| `ik_target.translatex` |

**不要動這三個檔案** —— `constraint_selftest.py` 的黃金值是照它們算的。
真要改就重跑 `make_rigtest.py`，然後用 `bonediff.py` 對官方 runtime
重新產一次黃金值。
