# spineplay — 自己寫的 Spine 3.8 / 4.0 播放器＋動作庫

```bash
pip install numpy pillow
python motionlib.py --list                    # 動作庫：挑角色（用法見 ../references/motion-library.md）
python play.py <skeleton.json> <anim> --gif   # 播放器：直接播一個 Spine 骨架
```

## 檔案

| 檔案 | 做什麼 |
|---|---|
| `motionlib.py` | 動作庫的入口：`--list` 挑角色、`--spec`／`--prompt`／`--mask`／`--guide` 給規格、`--checkpose`／`--checkart` 驗圖、`--split` 列出要補的零件圖層、`--verify` 驗算、`--gif` 出成品 |
| `packs/*.motion.json` | 六隻角色的動作資料（骨骼、約束、關鍵幀、網格幾何、黃金值；沒有貼圖、沒有 uv） |
| `meshproj.py` | 網格投影：把你的圖貼到原本的網格上（一張全身圖／同畫布零件圖層／獨立零件圖三種輸入） |
| `imageroute.py` · `posecheck.py` | 一張全身圖路線：剪影遮罩、提詞、逐零件檢查 |
| `artfit.py` | 獨立零件圖路線：形狀座標系（去雜點）、不接受鏡像的正負向判斷、簽章／長寬比／中軸剖面檢查 |
| `split.py` | 完美路線：從全身圖算出要補哪些零件圖層、範圍遮罩、起始稿、給生圖模型的指示 |
| `partguide.py` | 浣熊路線：每個零件的輪廓範本、是什麼、哪幾段動作看得到它、方向規則、提詞（`--guide`／`--prompt`）|
| `gallery.py` | 產生 `../gallery/`（每段動作一張 GIF 示意圖＋挑選頁，不用任何原作美術） |
| `spine.py` | 播放器本體（3.8／4.0：IK、transform、path 約束、deform、clipping、混合） |
| `export_pack.py` | 從原始骨架檔建 pack（要原始檔，只在原機用） |
| `constraint_selftest.py` · `example/` | 約束的自我測試（用自製的測試骨架，不需要任何原作檔案） |
| `bonediff.py` · `sweep.py` · `compare_official.py` | 跟官方 spine-webgl 對答案（要自己抓 runtime，見下面） |

## 直接播一個 Spine 骨架

`.atlas` 與 `.png` 要跟 `.json`放在同一層。

## 要跟官方 runtime 對答案的話

比對工具（`bonediff.py` / `sweep.py` / `compare_official.py`）會開一個
headless 瀏覽器跑 **EsotericSoftware 官方的 spine-webgl**，拿它當標準答案。

那兩個 runtime 檔案**沒有附在這個包裡** —— 它們是 Esoteric Software 的東西，
授權是 Spine Runtimes License（要有 Spine 授權才能散布）。自己抓：

```bash
pip install playwright && python -m playwright install chromium

curl -o spine-webgl-3.8.js \
  https://unpkg.com/@esotericsoftware/spine-webgl@3.8.99/dist/iife/spine-webgl.js
curl -o spine-webgl-4.0.js \
  https://unpkg.com/@esotericsoftware/spine-webgl@4.0.28/dist/iife/spine-webgl.js
```

放在這個目錄下就好。3.8 的骨架用 `official.html`、4.0 的用 `official40.html`，
工具會讀 `skeleton.spine` 的版本自動選。

## 三支比對工具的分工

| 工具 | 比什麼 | 什麼時候用 |
|---|---|---|
| `bonediff.py` | 單一動畫的骨骼世界矩陣 | 除錯，會指出差最多的那根骨 |
| `sweep.py` | **整支骨架的每一段動畫** | 驗收 |
| `compare_official.py` | 逐像素 + 並排比較圖 | 確認貼圖／混合／裁切 |

判讀標準：矩陣差應該在 **1e-6** 以內，座標的**相對**差在 **2e-7** 以內
（絕對值會隨骨架大小放大到 1e-4 量級，那是官方自己用 float32 存關鍵幀的下限）。
跳到 0.01 以上就是真的算錯了。
