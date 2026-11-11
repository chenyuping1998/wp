# Hard Time 分層樣品 v1 — 2026-09-24

狀態：**歷史製作實驗，不能直接替換遊戲素材。已於 2026-09-25 另交付 [完成版 ../base](../base/README.md)，以下為當時的試作紀錄。**

## 已完成

- 使用 built-in image_gen，以自有 `static/assets/sprites/hardTimeCast/prisoner.png` 為参考產出新姿勢底稿。
- 產出頭、左右連續手臂、補畫軀幹四個部位；身體 v2 修掉錯誤高領內衣，提供透明領口。
- `preview.html` 提供底稿／組裝對照、軀幹顯隱、肩旋轉與連續手肘網格測試。左右以角色自身為準。
- 瀏覽器確認載入與正反向極值；肩 ±12°、手肘 ±15.6° 掃描，測試網格最小有向面積比 0.718，無翻面。這不是正式遊戲骨架的驗證。

## 驗收發現與剩餘工作

1. 所有初版輸出實際為 **887×1774 RGBA**，不是要求的 1024×2048；生成器未遵守指定尺寸。
2. 各部位生成時放大／移位，不能原位直接疊合。預覽中使用獨立等比縮放與平移校正，只用於試裝；正式 PNG 必須烘焙到同一畫布。
3. 各層紋理和輪廓不是逐像素保留。肩接縫、袖口和頭頸需進一步修圖；不能宣稱與 master 完全相同。
4. −12° 壓力測試時手掌被軀幹遮住；+12° 時左右留白不足。正式動作應重新校正綁定姿勢與安全角度，不可直接照此測試範圍出貨。
5. 尚未完成：48px 空隙實測、40/30px 重疊驗收、正式骨架與動作表、GIF、PSD、同畫布四層 PNG 及合成 full.png。
6. 本輪不加手銬。其他兩款尚未展開，避免把未解決的分層問題複製到七個狀態。

## 檔案

- `master_generated.png`：完整姿勢參考，非正式 full.png。
- `body_v2_generated.png`：預覽採用的軀幹；`body_generated.png` 保留為原始迭代。
- `head_generated.png`、`arm_l_generated.png`、`arm_r_generated.png`：原始部位輸出。
- `prompts.json`、`body_v2_prompt.txt`：完整生成提示詞，工具為 built-in image_gen。
- `preview.html`：可從本資料夾開啟的獨立預覽；亦可用專案 HTTP 伺服器開啟。

正式交件規則見 ../../../../../../docs/cast-layers-brief/README.md。
