# MUERTOS — 規格（2026-11-08 開案）

從 **Fang Frenzy** 複製（→ Volt Monster → Mummy Mayhem 一脈）。前端 `wp/apps/Muertos亡靈節`、數學 `math-sdk/games/Muertos亡靈節`。
`game_id` = `Muertos`、套件 `muertos`、dev **3054** / storybook **6054**、launch.json 名稱 `muertos-dev`。
主題：亡靈節之夜的熱鬧廣場＋愛現的骷髏街頭樂手（好笑、鮮豔、不陰森）。美術需求單：[design/MUERTOS_ART_REQUIREMENTS.md](design/MUERTOS_ART_REQUIREMENTS.md)。

使用者 11-08 決定：名稱 Muertos（要簡短、意義明確）、底款 Fang Frenzy、**下注列第四版**、**人物正面**（mascot-rig）、**讀取頁標題要有自己的設計方向**（需求單 §14）。

## 規則（跟 Mummy Mayhem 完全相同）

| 項目 | 內容 |
|---|---|
| 盤面 | 5 輪 × 5 列，30 條固定連線 |
| 主遊戲 | 3/4/5 個 S → 10/12/15 次 FG，不能再觸發 |
| FG 倍率輪盤（**FIESTA WHEEL**） | 每局有連線必轉；值 2/4/6/8/10/12/14/16/32；只升不降、保留到 FG 結束；一顆按鈕 |
| 稀有輪盤（**MARIGOLD WHEEL**） | 四級 LEVEL UP 輪盤（橘→粉→紫→金）；主遊戲一局結束隨機出現 |
| Hold & Spin | 50× 獨立模式 |
| 買入 | 100× 買 10 次 FG；50× Hold & Spin |
| 激活 | **FIESTA SPIN 5×**、**FIESTA SURE WIN 10×**、**MARIGOLD BOOST 1.5×**（數學模式名仍是 `scarab5`／`scarab10`／`sunboost`） |
| wincap | 10,000×（H&S 1,000×）；RTP 96% |

數學沒改，同一份 books。

## 名稱對照

| Mummy Mayhem | Muertos | 程式內部名 |
|---|---|---|
| SCARAB WHEEL | FIESTA WHEEL（摩天輪上半圈） | `FgArcWheel` |
| SUN WHEEL | MARIGOLD WHEEL（萬壽菊盤面） | `RareRoulette` |
| H1–H4 | 吉他 / 萬壽菊花盆 / 糖骷髏 / 小號 | 符號代號不變 |
| W / S | 骷髏樂手胸像 / 金色寬邊帽 | |
| 木乃伊貓 | 骷髏樂手（下巴、帽子、背上的吉他是額外圖層） | `Mascot` |
| 繃帶轉場 | 剪紙彩旗＋萬壽菊花瓣掃過 | `TransitionAnimation` |

## 下注列與讀取頁

- 第四版 SplitBar（Katana Kash 編排）、barHeight 190；買入方塊圖示是程式畫的**萬壽菊**佔位
- 讀取頁標題暫時是程式字：一個字 MUERTOS 拆兩色（MUER 骨白／TOS 萬壽菊橘、無間隔）；字標美術到了換成 `logo_wordmark.png`（需求單 §14：剪紙鏤空、每個字母不同節慶色、O 是萬壽菊）
- **待處理**：16:9 右下旋轉鈕組會蓋到人物腳邊，等美術到了再定位置

## 現況（2026-11-08 複製完）

- 只換了名稱、port、機制名稱、付費表符號名、讀取頁標題與配色、買入圖示
- **畫面上的美術、音效、動態全部還是 Mummy Mayhem 的**；音效需求單還沒寫
