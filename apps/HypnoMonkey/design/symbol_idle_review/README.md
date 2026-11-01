# 靜止盤面逐圖騰動態 — 2026-10-28

需求來自更新後 `game-reskin/SKILL.md` 的「The symbols live too — EVERY new game（2026-10-27）」。每款需要持續 ambient 和每 4–8 秒一次的 signature act；1% 呼吸、落定及得獎不算。

這輪十款馬戲圖騰已真正接入 runtime，不再只有盤面概念。RGBA 來源／512 畫布／實際 alpha hull 在 `../hypno-symbols-manifest.json`，由 `../build_hypno_symbols.py` 可重建。S 的獨立留白供完整旋轉軌跡，不改角色大小或角色動作幅度。圖片風格尚未宣稱經 Stone 核准。

`symbolIdleMotion.ts` 每款有獨立物理支點、週期和演出；`symbolIdleClock.svelte.ts` 為所有靜止格共用一個 rAF，28 組格子相位錯開、100ms dt 上限及 120s 無縫回繞。旋轉、落定、得獎、消除和預告期間停用，`prefers-reduced-motion` 停用待機；沒有逐格 interval。

驗證：

- `pnpm check:symbol-idle`：十款 ambient 和可見 act、週期除盡 wrap、實際 alpha convex hull 不出格、停用時回到靜態；此檢查已接入 build。
- `desktop-time-*.png`：六個固定時刻的實際遊戲 screenshot。
- `ten-symbol-frames.jpg`：從上述真實畫面擷取每款原生格子，不是離線模擬。
- `actual-frame-check.json`：十款皆有實際遊戲像素改變；數值變化本身不取代視覺檢查。
- `live-*.png`、`actual-idle.gif`：正常播放時的實際盤面，保留不同格相位。
- `16x9-*`、`16x10-*`、`4x3-*`、`portrait-*`：四種比例與 MG／FG。
- `motionqa` 驗收面板只有 DEV 且明確 URL opt-in 才載入，production bundle 不含測試面板。

`python3 design/review_symbol_idle.py` 可由保留的真實截圖重建聯絡表及 GIF。

背景仍是舊神殿主題：雲層、FG 火焰與大獎事件碎裂；此次為其 dt 加上 100ms 上限並核對布局。背景效果在橫向邊緣的部分會隨直式裁切消失，不拿畫面外火焰冒稱直式可見。馬戲團 MG／FG 背景、FG 女助手、盤框／標題／片頭及其他舊 UI 尚待換皮，不能宣稱整款完成或可送審。未打包、上傳或更新平台。

結算懷錶／凝視／算式及 win 橫幅期間，透過 app-owned focusPaused/bannerPaused 停用靜止圖騰，避免焦點牌背後持續跳動。減少動態的兩張實機盤面截圖（reduced-a/b）在不同時刻的盤面區域逐像素相同；不更動 OS 偏好。
