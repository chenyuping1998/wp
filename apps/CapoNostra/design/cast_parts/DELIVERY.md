# Capo Nostra 角色美術交件

完成日期：2026-09-28。依 `design/cast_brief/` 製作，使用內建 ImageGen 生圖與補畫；所有生成來源及提示詞保留在本資料夾。

| 版本 | 路徑 | 圖層 | PSD |
|---|---|---:|---|
| MG / The Don | `mg/` | 6 | `mg/cast.psd` |
| FG / Soldier | `fg/` | 9 | `fg/cast.psd` |
| FG / Capo | `fg/capo/` | 9 | `fg/capo/cast.psd` |
| FG / Don | `fg/don/` | 9 | `fg/don/cast.psd` |

各版本都有 1024×2048 RGBA 原位 PNG、`full.png`、`layers.json` 及可編輯的多圖層 PSD。`l`／`r` 為角色自身左右。`layers.json` 是實際支點與疊放順序，`layers.manifest.json` 是已建好的網格與骨架；不可互相覆蓋。

## 已完成的驗收

- 33 張零件 PNG + 4 張合併 PNG；4 份 PSD 逐層讀回 RGBA 逐像素一致。
- 所有圖層依 `layers.json` 疊放，逐像素重現 `full.png`。
- MG 頭頂 y=224；FG 髮頂 y=259（需求約 260，羽毛另向上延伸）；兩隻腳底皆 y=1822，以 alpha >16 的可見輪廓量測。
- MG 空手前臂最小空隙 52.95 / 55.01px；FG 空手前臂 53.14px。均大於 48px。
- 肩部重疊至少 53px；頸部重疊 MG 80px、FG 50px。
- FG 麥克風架與整個 head 圖層（含頸部）最小距離 70.18px，超過 60px。
- Capo／Don 每個圖層及合併圖的 alpha 與 Soldier 逐像素一致。打光參考由 ImageGen 製作，再轉移到鎖定輪廓的底稿；Don 金色邊光限制在原 alpha 內。
- 兩具骨架各檢查 3,784 個姿勢，含 32 秒待機、三種反應、1×／2×／4× 速度與八個待機相位：零翻面、手臂仿射殘差 0px。
- 動作中最小可見邊界留白：MG 70.93px，FG 113.29px。網格面積比例 MG 0.9244–1.0546、FG 0.9420–1.0551。
- 已執行 `check_style.py` 的金色區域上限檢查；結果在各角色 `style-check.txt`。此為 Lab 色差量測，並非對美術風格的完整自動判定。

完整數據：`validation.json`、各角色 `delivery-check.json`／`motion-check.json`、`variant-check.json`。

## 預覽與動作

直接開 `preview.html` 看四個版本，`motion.html` 看動畫，`layers.html` 看每張零件。頁面不需要 JavaScript、npm 或網路依賴。

`mg/motion-preview.gif`、`fg/motion-preview.gif` 各含 68 幀，涵蓋待機與 Win／Win Big／Trigger。`motion-extremes.jpg` 是抽樣定格。

`motion.mjs` 是本次交件用的原創保守動作表，手臂保持剛性，煙跟隨嘴上的雪茄，麥克風跟隨握持手，羽毛與耳環跟隨頭部。它是獨立交件預覽，**尚未替換遊戲中的 Cast 或現行動作表**；套用其他幅度前需重跑動作閘門。

## 可重製來源

- `source_generated/`：補畫身體、頭部、獨立袖臂、完整直桿麥克風、兩份打光參考。
- `production-prompts.json`：本輪完整生圖與修圖提示詞；`concept-v1-prompts.json`：前輪角色原畫提示詞。
- `mg/full-concept-v1.png`、`fg/full-concept-v1.png`：前輪概念圖留存，不是最終交件。
- `design/build_cast_delivery.py`：原位分層、生成補畫對位、PNG／PSD 封裝。
- `design/build_cast_variants.py`：將生圖光色轉移到同一分層底稿並鎖定 alpha。
- `design/finalize_cast_rigs.py`：建網格並校正道具父骨。
- `design/render_cast_delivery.py`、`cast_parts/export_frames.mjs`：由交件網格實際頂點輸出 GIF。
- `design/verify_cast_delivery.py`：逐層 PSD RGBA 比对、非空層、腳底／頭頂位置、麥克風間距與變化图 alpha 檢查。

製作腳本使用 `/Applications/anaconda3/bin/python`。建骨架及驗收依賴本機 `hacksaw-character-motion` skill 的工具；PSD/GIF/PNG/HTML 成品不依賴該 skill。
