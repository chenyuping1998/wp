# 七項修訂交付

範圍僅 `wp/apps/MummyMayhem木乃伊`。玩法、得獎倍率與共用 packages 不變。

1. **Buy Bonus 價格**：實際金額改成獨立深底白字價牌，桌面 36 px、窄畫面至少 24 px；下面另標倍率與 BASE BET。購買標示 FEATURE PRICE，啟用型標示 PRICE PER SPIN，隨下注額與幣別格式更新；social 使用 PLAY AMOUNT。
2. **人物與繃帶**：揮手降低手肘過度彎曲與肩根位移；跳起減少肩胛拉開與胸部縮放，前臂轉成較集中、向上的姿勢。肩根相對胸口的最大位移，wave 約 10.19 → 3.26，cheer 約 18.28 → 4.07（骨架單位）。揮手的手肘網格最小面積比由 15.9% 改善至 35.8%，兩動作均沒有反轉三角形。增加胸側與右腰兩條長繃帶，共四條；同用沿自由端傳遞的波紋，並有跳起後的延遲與回落。布條均繪於身體後方，縫合端固定且收窄，保留小腹比例與尾根。8 動作、1,544 格中，四條縫合端前兩排網格採樣均完整被既有不透明人物圖層覆蓋；另跑 3,080 格布條形變及循環接縫檢查。
3. **BET hover**：可操作時反白底、深色文字與進度條，移開指標恢復；按住有同樣回饋，觸控不留下 hover 狀態。
4. **Autospin**：舊版全畫面點擊層晚掛載，蓋住既有控制列；現明確分開點擊外層、控制列及選單圖層。八個次數選項使用 pointertap，另有 START 按鈕；點外面／Escape 仍關閉。橫、直向均以安裝的 Pixi EventBoundary 重現舊錯誤，再驗八個選項、START、外側關閉。這是本機事件回歸測試，沒有發送真實下注。
5. **一般輪盤入口**：按鈕上使用同一主角的貓臉貼圖，按鈕上方輕閃 CLICK TO SPIN；自動／Turbo 模式顯示 SPIN STARTING 並自動繼續。手動與空白鍵皆保留；等待計時器在按下後清除。
6. **Turbo 一般輪盤**：旋轉 1.2 → 2.9 秒，停輪回正 0.1 → 0.34 秒；正常速度為 3.9 + 0.36 秒。最後 1.2 秒約只走 2.8 個區段，逐步減速；不會因 Turbo 瞬間完成。自動模式仍不等玩家操作。
7. **倍率落下震動**：在倍率飛入底部、數字正式更新的同一刻觸發。2X 至 32X 的震幅、收勢時間與數字彈出量遞增，最大約 0.5 秒自然衰減；控制列不晃。攝影機僅在震動期間保留足夠邊距，避免露出黑邊。飛行字的終點、大小及 anchor 對齊底部倍率，沒有換字位置跳動。

## 檔案與驗證

最新完整前端：`release/MummyMayhem_frontend_review_20261107_seven_fixes.zip`。雜湊與報告路徑在 `release/PACKAGE_seven_fixes.json`，之前封包保留。

完整 `pnpm build` 通過；資產、音效、引用、文案、型別基準、獎圖網格及落地檢查均通過。仍有 22 項既有型別診斷，沒有增加超過基準的檔案。

預覽在 `preview_mummy_20261107/seven_fixes/`：

- `prices_buy.png`、`prices_activate.png`：由實際卡牌定義、圖片與 CSS 產出的離線版面檢視，以 $1.00 基礎下注示例。
- `wheel_entry.png`：實際輪盤與主角貼圖的離線合成，檢視點擊入口與提示。
- `character/預覽.gif`：實際 Spine 4.2 網格動作逐格輸出，含揮手、跳起及四條繃帶。

這些不是完整 Stake 遊戲執行截圖；尚待 Stake 實機聽感、輸入與流程驗收。

人物重建順序為 `refine_mummy_arm_actions.mjs` → `build_mummy_flow.mjs` → `verify_mummy_arm_refinement.mjs`、`verify_mummy_cloth_seams.mjs`、`verify_preview_mummy_flow.mjs`。原人物及原動作快照保存在 `source/mummy_delivery/mascot_versions/before_seven_fixes/`；此輪僅修改 wave、cheer，其他動作與人物貼圖網格保持一致。
