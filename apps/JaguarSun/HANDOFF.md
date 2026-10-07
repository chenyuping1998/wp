# HotMiami 交接文件

最後更新：2026-09-01

## 1. 目前完成狀態

- MG 右側角色是男人，FG 右側角色是女人。
- 男女都已由分件 Spine 改成「單張連續網格＋骨骼權重」動畫。
- 網格是連續的，肩膀、手肘活動時不會像舊分件版本一樣裂開。
- 男人是無袖、雙手離開口袋的版本。
- 女人持復古玩具光線槍，槍口朝身體外側。
- Loading／開場頁使用由同一份網格骨架輸出的透明 WebP 動畫，不再旋轉整張人物。
- FG 結束回 MG 時會在黑畫面內清理 FG overlay 並重建完整 MG 盤面。
- 一般連線與 FG trigger 使用兩套不同的角色反應。

## 2. 角色動畫架構

主要程式：

- `src/game/skinnedFigure.ts`
  - Pixi `MeshGeometry` 連續網格 renderer。
  - 每個 vertex 同時混合多根骨骼權重。
  - `idle`：腳固定，頭、肩、手臂小幅非同步運動。
  - `win`：720ms，小幅前臂／手肘反應，沒有 root 位移。
  - `trigger`：1250ms，胸口、頭及雙臂較明顯但仍克制，帶少量 root accent。
- `src/components/CastFigureMesh.svelte`
  - 依 `who="guy" | "girl"` 載入對應 PNG 與 rig JSON。
  - 監聽 `stateGame.castReaction`。
  - 將 mesh 直接掛到 Pixi stage，卸載時移除 ticker 與 container。
- `src/components/Cast.svelte`
  - MG／FG 角色切換入口。
  - `stateGame.gameType === 'basegame'` 顯示男人，其他模式顯示女人。
  - 女人在 FG 額外往右偏移 `std.width * 0.025`，避免槍口及火花被盤面遮住。

Runtime 資產：

- `static/assets/meshRigs/cast_guy/guy.png`
- `static/assets/meshRigs/cast_guy/guy.rig.json`
- `static/assets/meshRigs/cast_guy/guy_idle.webp`
- `static/assets/meshRigs/cast_girl/girl.png`
- `static/assets/meshRigs/cast_girl/girl.rig.json`
- `static/assets/meshRigs/cast_girl/girl_idle.webp`

男人來源與檢查圖位於：

- `design/source/cast/guy_full_standalone_sleeveless.png`
- `design/source/cast/guy_full_standalone_sleeveless.rig.json`
- `design/source/cast/guy_full_standalone_sleeveless_frames.jpg`
- `design/source/cast/guy_full_standalone_sleeveless_idle.gif`

女人使用遊戲目前的完整持槍圖。持槍手已放大檢查：拇指、四指、手掌及槍柄都有連接，沒有缺塊；手臂權重是人工依肩膀、手肘、手掌位置校正，不能重新用自動 arm detector 覆蓋，因為水平持槍姿勢會被 detector 誤判。

## 3. 動畫事件

事件來源在 `src/game/bookEventHandlerMap.ts`：

- `winInfo`
  - 有至少一條 win 時：
  - `stateGame.castReaction = { kind: 'win', seq: seq + 1 }`
  - MG 男人與 FG 女人都會收到。
- `freeSpinTrigger`
  - `stateGame.castReaction = { kind: 'trigger', seq: seq + 1 }`
  - 此時 `gameType` 仍是 `basegame`，所以反應的是男人。

不要把 `win` 與 `trigger` 合成同一套 pose。使用者明確要求：一般連線只動一點，FG trigger 要不同且較大，但自然優先。

## 4. Loading／開場頁

可見的第一頁實際是：

- `src/components/ui/IntroFeatures.svelte`

底層 Pixi loading 是：

- `src/components/LoadingScreen.svelte`

`IntroFeatures` 現在使用：

- `/assets/meshRigs/cast_guy/guy_idle.webp`
- `/assets/meshRigs/cast_girl/girl_idle.webp`

WebP 是從與 MG／FG 相同的網格 rig 輸出，因此只有骨骼局部動作。CSS 只保留一次性的進場 `castInLeft`／`castInRight`；不要重新加入 `castSwayLeft`／`castSwayRight`，也不要在人物上使用循環 `rotate` 或 `scaleY`，否則會再次變成整個身體左右晃。

男女 PNG 的透明畫布差很多：

- 男人：512×1024，alpha bbox `(131, 85, 405, 889)`。
- 女人：626×1100，alpha bbox 填滿畫布。

所以 loading CSS 是按「可見人物」校正，不是按 PNG 高度直接設相同值。男人目前使用 `height: 120vh`、`bottom: -15.8vh` 補償透明 padding；女人是基準 `94vh`。兩人的可見頭頂、腳底與左右外緣已在 1280×720 瀏覽器畫面確認對稱。

底層 `LoadingScreen.svelte` 的整張人物旋轉與 `scaleY` 已移除，避免 replay loading 路徑再次晃動。

## 5. FG 結算與回 MG

`src/game/bookEventHandlerMap.ts` 的 `freeSpinEnd` 有兩次清理：

### 結算面板顯示前

- 清空 `stateGame.winningCells`。
- 清空 `debugWinLineCount`。
- 隱藏 win lines。
- 清除 expanded wild overlays。
- 用 `stateGameDerived.boardRaw()` settle 最後盤面，讓所有 symbol 回到完整靜態狀態。
- broadcast `boardShow`。

這是為了修正半透明 TOTAL WIN 面板後面只剩零散、暗掉或 ghosted symbol 的問題。

### 黑畫面轉場回 MG 時

- `stateGame.gameType = 'basegame'`。
- 再次清空 win／sticky 狀態。
- 清除 expanded wild overlays。
- `enhancedBoard.settle(INITIAL_BOARD)`，確保回 MG 是完整 5×4 盤面。

不要再把 expanded wild overlay 保留到下一次 MG spin；那個舊策略就是 FG 結束後空格與殘影的來源。

## 6. 建置與驗證

完整檢查：

```bash
cd /Users/stone/stake-engine/wp/apps/HotMiami
PATH=/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin:$PATH npm run build
```

注意：專案的完整 script 在某些環境可能只跑完檢查而沒有刷新 `build/`。打包前一定再明確執行：

```bash
pnpm exec vite build
```

確認 `build/index.html` 修改時間有更新，並確認新的 hashed bundle 出現在：

```bash
ls build/_app/immutable/bundle.*.js
```

目前完整檢查會列出 4 個既有 H2 part 警告：

- `head` 與 `hair_back` pixel-identical。
- `hair_front` 與 `head` pixel-identical。
- stacked parts 與 shipped symbol 外觀差異。
- H2 silhouette IoU 0.74。

這些是既有 H2 圖騰問題，與人物 mesh、loading、FG outro 無關；目前 script 仍以 exit code 0 完成。

本機未啟動 RGS 時瀏覽器會顯示 `TypeError: Failed to fetch`。這是 Authenticate 呼叫失敗，不是人物或盤面程式錯誤；仍可檢查第一張 loading／intro 畫面。

## 7. Upload 同步

有兩個 upload 位置，都要更新：

1. 實際外層送審 frontend：
   - `/Users/stone/stake-engine/upload/HotMiami/frontend`
2. WP 內的保存包：
   - `/Users/stone/stake-engine/wp/upload/HotMiami/game`
   - `/Users/stone/stake-engine/wp/upload/HotMiami-upload.zip`

同步 production build：

```bash
rsync -a --delete \
  /Users/stone/stake-engine/wp/apps/HotMiami/build/ \
  /Users/stone/stake-engine/upload/HotMiami/frontend/

rsync -a --delete \
  /Users/stone/stake-engine/wp/apps/HotMiami/build/ \
  /Users/stone/stake-engine/wp/upload/HotMiami/game/
```

移除 Finder metadata 後更新 ZIP：

```bash
find /Users/stone/stake-engine/upload/HotMiami/frontend \
     /Users/stone/stake-engine/wp/upload/HotMiami/game \
     -name .DS_Store -type f -delete

cd /Users/stone/stake-engine/wp/upload
zip -r -FS HotMiami-upload.zip HotMiami
unzip -t HotMiami-upload.zip
```

打包後至少確認：

```bash
test -f /Users/stone/stake-engine/upload/HotMiami/frontend/assets/meshRigs/cast_guy/guy.rig.json
test -f /Users/stone/stake-engine/upload/HotMiami/frontend/assets/meshRigs/cast_girl/girl.rig.json
test -f /Users/stone/stake-engine/upload/HotMiami/frontend/assets/meshRigs/cast_guy/guy_idle.webp
test -f /Users/stone/stake-engine/upload/HotMiami/frontend/assets/meshRigs/cast_girl/girl_idle.webp
```

## 8. 後續測試重點

使用有 RGS／replay fixture 的環境完整跑一次：

1. MG 一般連線：男人只做短小 win 反應。
2. MG 觸發 FG：男人做較大的 trigger 反應，之後才切女人。
3. FG 一般連線：女人做短小 win 反應，槍與手掌不能扭曲或被盤面遮住。
4. FG TOTAL WIN 面板：後方 5×4 盤面完整、正常亮度、沒有 ghost symbol。
5. FG outro 回 MG：完整 MG 盤面、男人已換回、沒有 expanded-W 或 Frame 殘留。
6. Loading：男女只局部骨骼活動，身體主軸與腳底不可左右晃。

目前尚未替這一輪修改執行 git commit 或 push。工作樹還有其他 app 的既有修改，提交時只能選取 HotMiami 與對應 upload 檔案，不要一起提交 WildParty、Moooo 或共用套件的無關變更。
