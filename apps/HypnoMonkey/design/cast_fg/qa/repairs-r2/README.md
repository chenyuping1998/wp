# 第二輪退件修正 · 2026-10-28

對應 `../../QA_CLAUDE_1028.md` 第二輪 A–E。原始退件結論保留；本頁記錄後續修正，不代表 Stone 或 Claude 已再次核准。

- A／D／E：修正原生來源產生器的重疊端取樣，僅採部件內部毛色，不把外輪廓描邊複製到圓頭。清除腕毛內殘留黑線，修平接腕缺口。六張手勢圖一併處理，避免 gaze 切圖重新帶入舊袖口。
- B：上下臂的隱藏肘端都收進相鄰部件，從重疊端平順銜接到原前臂；不再保留凸出的 64px 球形端。沒有縮小角色、骨長或動作幅度。
- C：兩膝採相同膚色場，移除重疊端的圓形明暗邊；順帶清掉大腿遮蔽端原有的短褲金邊色點。所有關節與動畫保持原值。

## 原生證據

`*-native-dark.jpg` 為十段動作 × 十一部位 × 起終／角度極值四格，共 440 組同格 before/after；`coverage.json` 保留實際 frame/time。`all-actions-*.jpg` 將單一關節的十段四格集中。`requested-idle-0.00.png`、`requested-gaze_dud-0.56.png`、`requested-fg_end-0.60.png` 為驗收指定時間，各包含兩腕、右肘、兩膝。

兩版一律使用同一正式 Spine 4.3 矩陣、每個來源像素對應一個輸出像素。這輪使用與 Pixi TextureStyle 預設相同的線性取樣；舊雙三次取樣會在 premultiplied alpha 圓頭邊產生 RGB 過衝亮弧，即使上下層都是相同膚色也會出現。沒有改遊戲取樣、加遮擋或用縮圖隱藏來源。來源本身的圓球／黑線仍已修正，亦有實際遊戲畫面複核。

`after-*-light.png`／`after-*-dark.png` 是逐層原生亮暗底；`final-source-*.png` 是總覽。`connected-components.json` 記錄 29 個非錶鏈部件各為單一連通輪廓。

## 重建與驗證

`motion-invariants.json` 比對來源修正前後的 bones、IK、animations、slots、skins、joints 與配方。既有官方十段 JSON 保持逐 byte 相同，throw 為 620ms。最新版 spine-motion 已不含舊 stand34 / stand-idle，因此本輪使用既有官方 rig，加上真正 4.3 runtime 重新評估矩陣；未改寫骨架或套用拳擊模板。來源同步使用 `../../sync_source_images.py`，重建順序見 `../../README.md`。

`verification.json` 綁定最終來源、Spine images、runtime atlas／crops、GIF、建置紀錄及實際桌機／375×812／320×640 截圖。桌機與 375 直式包含十段動作，320 直式檢查甩錶、大獎與退場。歷史 15 次 FG 回歸在上一輪紀錄，本輪不冒稱重新完成該整局測試。

正式人聲／人群聲仍待交；未打包 upload、未上傳或更新平台。
