# spineplay — 自己寫的 Spine 3.8 / 4.0 播放器

```bash
pip install numpy pillow
python play.py <skeleton.json> <anim> --gif
```

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
