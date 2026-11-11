# Static Shift UI 新圖接入 — 2026-11-05

美術：`design/source-ui-1104/`（需求單 `design/ART_REQUEST_2026-11-04.md`）。執行檔圖在 `static/assets/sprites/staticShiftUi1104/`（logo 縮 0.6，其餘原尺寸）。
只建置本機試玩版 `dist/staticshift-playtest`（`design/qa/review-prep-20261104/playtest_only.sh`）；**沒有打包到 upload，也沒有上傳**，要等角色補畫後一起出。

| 圖 | 接在哪 | 程式 |
|---|---|---|
| 盤面框 MG／FG | 開口 1400×1120 對齊盤面 700×560（scale×0.5）；FG 換紫框 | `src/components/BoardFrame.svelte` |
| VU 表 | 兩側各 12 格由程式點亮：平時慢速跳動，落地／收集／中獎／升級會往上衝再落回 | 同上 |
| 格子卡 | 20 格紙卡取代程式畫的灰藍方塊 | 同上 |
| 名牌 | 「1,024 WAYS」墨字寫在框上緣紙牌；中獎時換成「圖示＋N WAYS」（原本在盤面下方，現在那裡是框的推桿列＝壓在插圖上） | `BoardFrame.svelte`、`WinWays.svelte` |
| 大 logo | 載入畫面打字標題 → logo 圖 | `LoadingScreen.svelte` |
| 小 logo | 遊戲右上角（直式、窄於 760、開彈窗時不顯示，同相撲猴） | `Game.svelte` |
| 操作列底板 | `uiTheme.sprites.bar`，兩端 64px 端蓋不拉伸 | `src/game/uiTheme.ts` |
| FG 開場卡 | 取代木牌網格；標題落在空白標題框，落下後紙張彈一下再微微呼吸 | `FreeSpinAnimation.svelte`（開場與結算共用） |

另：直式盤面放大 1.14 → 1.08，因為加了框之後在 390px 手機上會超出左右兩邊約 7px（`portrait_before_grow_fix.png`）。

## 證據（1280×720、1280×800、1024×768、390×844）

- `d_mg.png`、`w_mg.png`、`t_mg.png`、`p_mg.png`：MG 待機
- `d_cards.png`、`p_cards.png`：載入畫面大 logo
- `d_fs11.png`、`p_fs11.png`：FG 開場卡＋紫框
- `ways_plate_win.png`：名牌在中獎時換字（上：桌機，下：直式）
- `desktop_spin_to_fs_sheet_v1.png`：第一版從旋轉到 FG 的連續畫面（WAYS 還在下方，已修）

主控台沒有錯誤。尚未重跑 social_text_audit／ui_center_audit，打包前要跑。
