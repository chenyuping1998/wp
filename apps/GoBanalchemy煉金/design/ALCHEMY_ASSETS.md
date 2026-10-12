# Go Banalchemy 美術交接

本專案由 GoBoomana 複製。遊戲 ID 是 `GoBanalchemy`，前端開發埠為 3021。

## 人物

- 可編輯 PSD：`design/source/GoBanalchemy_alchemist.psd`
- 高解析原稿：`design/source/alchemist_mascot_v1.png`
- 遊戲骨架：`static/assets/spines/goBananasMonkey/monkey.json`；新增 `alchemy_body` 加權網格，沿用 Boom 的九種骨架動作。舊礦工附件在設定姿勢中隱藏。
- 驗證：`node design/check_alchemist_mesh.mjs`，檢查所有動作的網格翻面及靜止姿勢。

## 獎圖與場景

- `static/assets/sprites/goBanalchemySymbols/`：H1–H4 高分圖分別是綠、紫、青、琥珀主色；L1–L5 用低彩度陶瓷底和黑字。W、S、B、P、X 都已換成煉金主題。
- `static/assets/sprites/goBanalchemyBackground/`：一般、免費遊戲、Hold and Spin 三張背景。
- `static/assets/sprites/goBananasFrame/`：新銅管與綠寶石盤面框，素材鍵沿用原遊戲以保留佈局與盤面動態。
- `static/assets/sprites/goBananasUi/`：主 UI bar 與 Buy Bonus 按鈕面板。
- `static/assets/sprites/goBanalchemyUi/`：Bonus Buy 卡牌場景、試劑與金幣插畫。

`src/game/assets.ts`、`src/game/uiTheme.ts`、`src/components/ui/ModalBuyBonus.svelte` 已接入上述素材。

## 建置

在本專案執行 `npm run build`。目前透過本機 `node_modules` junction 共用 Boom 的工作區依賴；若換機，請依工作區方式重新安裝依賴。

## 網格動態（2026-10-04）

- **得分不再有亮光**：`SymbolMeshWin.svelte` 拿掉整圖加法閃光、掃光、光暈、光束、發光粒子、外框流光、角落星芒；`ImpactDust` 拿掉加法地面閃光。舊的 `*_glow / *_sheen / h3_plate…` 圖層已從 `assets.ts` 移除。
- **每個得分獎圖各自的網格動作**（全部 panel 模式，照新畫作重描）：`h1Lantern`（燈籠搖、藥水晃、香蕉轉）、`h2Crystal`（兩側水晶張開、主柱膨脹）、`h3Tongs`（夾子開合兩次、法杖寶珠充能）、`h4Cart`（礦車蹲跳、燒瓶晃、銅線圈彈）、`wGorilla`（護目鏡彈起、咬香蕉）、`sMedallion`（圓章搖、香蕉串跳）、`lowLetters`（座標微調）。`landS`、`landB`、`coinP` 也改成新圖座標。
- **待機小動作**（移植自 Boat）：`meshWin/idles.ts` + `game/idleDirector.ts` + `IdleDirector.svelte`；`Symbol.svelte` 讓靜止可見格子登記。
- **背景**：一般背景左右兩盞壁燈搖晃（`bgProps.ts` 的 `BG_BASE` / `BG_BASE_R`，`Background.svelte` 掛載）；免費遊戲背景沒有懸掛物，不做。
- **人物飄動**：`design/alchemist_flow.py`（由 `build_alchemist_mascot.py` 呼叫）把身體網格加密到 28×44，新增 `coatL1/2`、`coatR1/2`、`flask`、`vials`、`goggles` 骨頭，並把香蕉、下巴畫進網格；物理 14 條各自 order，`flutter` 軌加關鍵影格。飾品只接手「非手臂」權重（手臂權重保留），否則捶胸/丟東西時拳頭邊緣會被扯開。
- 驗證：`check_mesh_wins.mjs`（含待機動作）、`check_alchemist_mesh.mjs`（跑物理＋flutter，量飾品三角形與擺幅）都已接進 `npm run build`。離線渲染：`design/render_mesh_wins.py`。本機沙盒（假登入）確認可開機、待機動作與背景燈籠實際有播放；**中獎動作未在實機轉過**（沙盒不能轉）。

## 第二輪（2026-10-04）：背景清晰、圖案本身跳

- **背景清晰**：`Game.svelte` 拿掉背景模糊濾鏡（原 0.6／1.0）；三張背景用 Lanczos＋輕銳化離線放大到 1920×1080（原圖備份在 `design/source/backgrounds_1672/`）。
- **格子不動、圖案跳**：`design/make_alchemy_layers.py` 把 H1–H4、L1–L5 從底板切下（底板補洞，光暈一起挖掉重補），S 圓章本身就是去背主體；輸出 `static/assets/sprites/goBanalchemyMesh/{n}_plate|subject|shadow.png`，已加進 `assets.ts`。
- 各獎圖改成切圖模式（cut）：主體整個跳起（`meshRig.leap`），空中招式——H1 後空翻、H2 像卡片翻轉、H3 繞交叉點轉一圈、H4 像衝下坡的礦車點頭、S 像拋硬幣轉兩圈、字母跳起懸停；落地壓扁＋小二次彈，底板上有影子。W 猩猩是滿版肖像無法切，仍在格內演但不再整格震動。
- `SymbolMeshWin.svelte` 拿掉整格放大／彈跳與 `highJump.ts`（已刪）。`meshRig.settled` 收尾前先把角度取 360 餘數，否則翻完會倒轉一圈。
- 改了美術要重跑：`python design/make_alchemy_layers.py`，再跑 `node design/check_mesh_wins.mjs` 與 `render_mesh_wins.py` 看圖。
