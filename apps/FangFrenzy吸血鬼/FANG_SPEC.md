# FANG FRENZY — 規格（2026-11-08 開案）

從 **Volt Monster** 複製（Volt 本身是 Mummy Mayhem 的換皮）。前端 `wp/apps/FangFrenzy吸血鬼`、數學 `math-sdk/games/FangFrenzy吸血鬼`。
`game_id` = `FangFrenzy`、套件 `fang-frenzy`、dev **3053** / storybook **6053**、launch.json 名稱 `fangfrenzy-dev`。
主題：月夜古堡＋愛面子又膽小的吸血鬼伯爵（好笑路線，沒有血）。美術需求單：[design/FANG_ART_REQUIREMENTS.md](design/FANG_ART_REQUIREMENTS.md)。

使用者 11-08 決定：名稱 Fang Frenzy、底款 Volt Monster、**下注列第四版**、**人物正面**（mascot-rig）。

## 規則（跟 Mummy Mayhem 完全相同）

| 項目 | 內容 |
|---|---|
| 盤面 | 5 輪 × 5 列，30 條固定連線 |
| 符號 | H1–H4、L1–L5、W（百搭）、S（只在主遊戲） |
| 主遊戲 | 3/4/5 個 S → 10/12/15 次 FG，不能再觸發 |
| FG 倍率輪盤（**BAT WHEEL**） | 每局有連線必轉；值 2/4/6/8/10/12/14/16/32；只升不降、套用本局所有線、保留到 FG 結束；一顆按鈕，自動轉／Turbo 自動按，3 秒不按自動轉 |
| 稀有輪盤（**MOON WHEEL**） | 四級 LEVEL UP 輪盤（新月→上弦→盈凸→滿月）；主遊戲一局結束隨機出現，Hold & Spin 不會出 |
| Hold & Spin | 50× 獨立模式 |
| 買入 | 100× 買 10 次 FG；50× Hold & Spin |
| 激活 | **BAT SPIN 5×**、**BAT SURE WIN 10×**、**MOON BOOST 1.5×**（數學模式名仍是 `scarab5`／`scarab10`／`sunboost`，只換顯示文字） |
| wincap | 10,000×（H&S 1,000×）；RTP 96% |

數學沒改：`library/publish_files`、`lookup_tables` 是同一份 books（從 Mummy → Volt → 這裡）。要重跑就 `run.py`。

## 名稱對照

| Mummy Mayhem | Fang Frenzy | 程式內部名（沒改） |
|---|---|---|
| SCARAB WHEEL | BAT WHEEL（蝙蝠輪，張開的翅膀拱） | `FgArcWheel` |
| SUN WHEEL | MOON WHEEL（月亮輪，四級月相） | `RareRoulette` |
| Scarab Spin／Sure Win | Bat Spin／Bat Sure Win | `SCARAB5`／`SCARAB10` |
| Sun Boost | Moon Boost | `SUNBOOST` |
| 木乃伊貓 | 吸血鬼伯爵（The Count） | `Mascot` |
| H1–H4 | H1 棺材 / H2 高腳酒杯 / H3 大蒜 / H4 蝙蝠 | 符號代號不變 |
| W / S | W 伯爵胸像 / S 滿月護身符 | |
| 繃帶轉場 | 披風一甩掃過畫面＋蝙蝠群飛散 | `TransitionAnimation` |

## 下注列：第四版（拆分式，Katana Kash 編排）

`src/components/ui/SplitBar.svelte`（同 `wp/tools/ui-bar-v4`），`uiTheme.ts` 以 `customLayout` 接上，barHeight 190。
- 底部一排：左下角買入方塊（上方圓形選單鈕）→ BALANCE 底板 → 置中 WIN 底板 → ▲▼ → BET 底板；右下角旋轉大圓鈕，上方弧線排 Turbo、自動播放
- 買入方塊圖示是程式畫的**棺材**佔位（不能用閃電，Turbo 已是閃電）；規則頁 `BarIcon.svelte` 同步
- **待處理**：16:9 右下旋轉鈕組會蓋到站在盤面右側的人物腳邊，等伯爵美術到了再定位置

## 現況（2026-11-08 複製完）

- 只換了名稱、port、玩家看得到的機制名稱與付費表符號名、讀取頁標題 FANG／FRENZY、買入圖示
- **畫面上的美術、音效、動態全部還是 Mummy Mayhem 的**
- Volt Monster 進行中的美術（背景物件、`VoltAtmosphere`）沒有帶過來，背景元件還原成 Mummy 的版本
- `design/` 裡的 `*_mummy_*` 腳本留著當新美術的處理範本；`check_mesh_wins` 讀的切圖暫放 `design/source/inherited_mummy/symbols_cut`
- 音效授權檔在 `design/source/mummy_audio`（`check_audio` 要讀，Mummy 音效仍在出貨）
- 音效需求單還沒寫
