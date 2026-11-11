# Static Shift 送審前加強 — 2026-11-04

依據：相撲猴 11-03 退件 5.3、Pickle 5.3／5.7、Turf 5.3 的標籤（動畫差、素材低）對照 Static Shift front v11。

## 已做（程式，本機試玩版 dist/staticshift-playtest；**未打包到 upload、未上傳**）

照相撲猴的做法：程式修正等新圖接上後一起打包，不單獨放。

| 項目 | 檔案 | 內容 |
|---|---|---|
| 小獎金額半透明 | `src/components/Win.svelte` | 共用 FadeContainer 預設淡入 400 ms，小獎總共才顯示約 0.6 s，金額一直是半透明（Pickle 10-17 同一個問題）。小獎改 140 ms；金額蓋在墨色票卡上（不直接壓在符號圖上），1.45→1 倍砸章落下＋60 ms 回彈；停留 180→420 ms。 |
| 中獎循環閃爍 | `src/components/WinScrim.svelte` | 閒置重播每一輪都瞬間全盤變暗再恢復，看起來在閃。遮暗改淡入 160 ms／淡出 240 ms，深度 0.62→0.45（相撲猴 11-03 同修）。 |
| 停輪沒重量 | `src/game/constants.ts` | 停輪回彈 0.05→0.1 格（Iron Jaw 抄錄的 0.1 格 ease-out），FG 0.05→0.08；turbo 不變。 |
| 操作列字型 | `src/game/uiTheme.ts` | BALANCE／WIN／BET 標籤從 Archivo 粗體（一般 UI 字）改成遊戲手寫字 Permanent Marker；數字維持 Anton。底板等新圖 `bar_plate.png`。 |
| 直式盤面太小 | `src/game/stateGame.svelte.ts` | 直式盤面 ×1.14、上緣固定（角色和 FG 計數牌不動），寬 300→345 px；MG／FG 同大小。1.18 會擠到 WIN 牌。 |

修改前的原檔在 `originals/`。

## 證據

- `desktop_small_win_sheet.png`：1280×720，book 30308，每 90 ms 一格：砸章票卡、淡入淡出的遮暗。
- `desktop_small_win_ticket.png`：票卡單格。
- `portrait_mg_fg_before.png` → `portrait_mg_fg_after.png`：390×844 MG＋FG。（before 的左圖是按下旋轉那一格，最下排看起來被切是捲軸起步，不是 bug。）
- 錄製：`cap_win.cjs`、`cap_fg.cjs`（無頭 Chrome，內建面板隱藏時會節流），`sheet.py`，`playtest_only.sh`（只建置試玩版，不碰 upload）。

## 等美術

- `design/cast_v2/需求單.md`：兩位角色改 stand34 站姿分層重畫（身體畫在手臂下面，動作才能放開；現在上臂外擺鎖 4°）。
- `design/ART_REQUEST_2026-11-04.md`：盤面框（MG／FG）、格子卡、logo（大／小）、操作列底板、FG 開場卡。

圖到之後：spine-motion character 套動作 → 驗收（全動作、亮暗底）→ 4.3 動作烘焙給 4.2 runtime → 接框／logo／底板 → 全部重錄 → 一起打包。
