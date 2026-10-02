# Go Banandit 絲印美術交件

`ART_BRIEF.md` §0 的 1960 年代大盜海報風格。原始生成圖保留為 `*_source*.png`；正式 PNG 經 `design/screenprint_finish.py` 鎖到紙色、深綠、磚紅、墨黑、疊印棕與保留的香蕉黃。H1 已重生為光頭、無雪茄；MG 臉已依 W 大盜的黑眼罩、缺牙特徵重生。

- 符號：`H1.png`–`H4.png`、`P.png`、`S.png`、`W.png`、`low_label.png`。正式 256px 版本在 `static/assets/sprites/bananditSymbols/`，低分字由執行期 Bungee 排版。
- 背景：`bg_base.png`、`bg_feature.png`，正式 1920×1080 版本在 `static/assets/sprites/bananditBackground/`。
- 角色：全身原稿、`mg_layers/`、`fg_layers/`（各 24 張 560×912 RGBA；空圖只在 decoration 槽）與 `prop_sack.png` 在 `design/cast_delivery/`。`design/export_cast_layers.py` 可重建這份交件；目前執行期骨架吃較精簡的裁片，放在 `design/source/{mg,fg}/`、`static/assets/spines/{bananditBandit,bananditLookout}/`。
- 其他：盤面框、捲門、紙牌、按鈕與香蕉收集片由 `design/build_flat_assets.py` 產生。UI 圖示由 `design/build_icons.py` 產生。大獎牌由 `design/build_screenprint_ui.py` 產生。
- 縮圖：`design/thumbnail/BG.png`、`FG.png`、`provider_logo.png`、`composite_200.png`。

## 風格閘門

使用 `/Users/stone/.codex/skills/game-reskin/scripts/check_style.py`，參數 `--max-colors 36 --max-soft 0.16 --min-fit 0.91`，色卡 `#F2E8D0,#1F5C4A,#D24A2C,#1E1B1A,#4E2E22,#F4C21B`。`soft` 與 `fit` 參數是 0–1 的比例。

| 圖 | colors95 | soft | fit |
|---|---:|---:|---:|
| H1 | 12 | 8.6% | 97.9% |
| H2 | 29 | 12.3% | 96.5% |
| H3 | 34 | 12.3% | 95.9% |
| H4 | 22 | 12.1% | 96.7% |
| P | 24 | 10.7% | 96.2% |
| S | 23 | 13.4% | 96.2% |
| W | 17 | 11.0% | 97.0% |
| 低分標籤 | 3 | 4.9% | 99.1% |
| MG 背景 | 26 | 10.7% | 96.2% |
| FG 背景 | 4 | 2.6% | 99.3% |
| MG 臉 | 23 | 14.1% | 95.7% |

以上全部通過；香蕉黃僅在 P 等收集／大獎素材。`symbol_sheet_latest.png` 同時列出 180px、70px、70px 灰階對照，`board_preview_200.png` 是靜態盤面縮圖。執行期畫面應使用本機 playtest shell 驗證。
