# CAPTAIN OCTO — 規格（2026-11-08 開案）

從 **Fang Frenzy** 複製（→ Volt Monster → Mummy Mayhem 一脈）。前端 `wp/apps/CaptainOcto深海潛艇`、數學 `math-sdk/games/CaptainOcto深海潛艇`。
`game_id` = `CaptainOcto`、套件 `captain-octo`、dev **3055** / storybook **6055**、launch.json 名稱 `captainocto-dev`。
主題：深海冒險＋開黃銅潛艇、愛逞強的章魚船長（明亮、好笑）。美術需求單：[design/OCTO_ART_REQUIREMENTS.md](design/OCTO_ART_REQUIREMENTS.md)。

使用者 11-08 決定：名稱 Captain Octo、底款 Fang Frenzy、**下注列第四版**、**人物側面**（spine-generator 側面模板）、**讀取頁標題要有自己的設計方向**（需求單 §14）。

## 規則（跟 Mummy Mayhem 完全相同）

| 項目 | 內容 |
|---|---|
| 盤面 | 5 輪 × 5 列，30 條固定連線 |
| 主遊戲 | 3/4/5 個 S → 10/12/15 次 FG，不能再觸發 |
| FG 倍率輪盤（**SONAR WHEEL**） | 每局有連線必轉；值 2/4/6/8/10/12/14/16/32；只升不降、保留到 FG 結束；一顆按鈕 |
| 稀有輪盤（**ABYSS WHEEL**） | 四級 LEVEL UP 輪盤（淺海→暮光→午夜→深淵）；主遊戲一局結束隨機出現 |
| Hold & Spin | 50× 獨立模式 |
| 買入 | 100× 買 10 次 FG；50× Hold & Spin |
| 激活 | **SONAR SPIN 5×**、**SONAR SURE WIN 10×**、**ABYSS BOOST 1.5×**（數學模式名仍是 `scarab5`／`scarab10`／`sunboost`） |
| wincap | 10,000×（H&S 1,000×）；RTP 96% |

數學沒改，同一份 books。

## 名稱對照

| Mummy Mayhem | Captain Octo | 程式內部名 |
|---|---|---|
| SCARAB WHEEL | SONAR WHEEL（黃銅聲納儀表） | `FgArcWheel` |
| SUN WHEEL | ABYSS WHEEL（漩渦，越升級越深） | `RareRoulette` |
| H1–H4 | 船錨 / 潛水頭盔 / 河豚 / 劍魚 | 符號代號不變 |
| W / S | 章魚船長胸像 / 發光水母 | |
| 木乃伊貓 | 章魚船長（側面、面向右，遊戲裡翻轉面向盤面） | `Mascot` |
| 繃帶轉場 | 潛艇游過、墨汁雲蓋住畫面 | `TransitionAnimation` |

## 人物（側面）

- 用 spine-generator 側面模板（拳擊架式，idle／idle_weave／punch／hit／jump／celebrate），模板輸出 Spine 4.3，這款 runtime 是 4.2 → 用 mascot-rig `lib/export42.ts` 的 `to42` 轉
- 一行指令 `character` 只在 spine-generator 的遠端分支 `origin/claude/motion-research-into-character`，**不要在 E:\stake\spine-generator 切分支**（其他款的設計腳本 import 那個 checkout），用 scratchpad worktree；或用 main 的 `studio/spine-motion-studio.html`
- 額外觸手 4 條、緞帶、墨汁不在模板裡，收件後另外掛、加水流擺動
- 側面角色接進遊戲的 atlas 裁切打包流程還沒建（character-pipeline skill 註明第一個側面角色出貨時補）
- 現在的 `Mascot.svelte` 還是正面木乃伊貓的那套，換側面要改元件

## 下注列與讀取頁

- 第四版 SplitBar（Katana Kash 編排）、barHeight 190；買入方塊圖示是程式畫的**船錨**佔位
- 讀取頁標題暫時是程式字 CAPTAIN（沙色）＋OCTO（珊瑚紅）；字標美術到了換成 `logo_wordmark.png`（需求單 §14：黃銅名牌＋舷窗 O＋觸手捲住 C）
- **待處理**：16:9 右下旋轉鈕組會蓋到人物腳邊，等美術到了再定位置

## 現況（2026-11-08 複製完）

- 只換了名稱、port、機制名稱、付費表符號名、讀取頁標題與配色、買入圖示
- **畫面上的美術、音效、動態全部還是 Mummy Mayhem 的**；音效需求單還沒寫
