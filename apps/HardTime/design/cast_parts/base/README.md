# Hard Time — 完成版分層角色

2026-09-25。已完成一款角色的美術交付、四層共用骨架、遊戲整合與瀏覽器驗證。

## 交付

- `prisoner.psd`：四個可編輯圖層，重新讀取逐層與 PNG 一致。
- `head.png`、`arm_r.png`、`arm_l.png`、`body.png`：全部 1024×2048 RGBA，同畫布原位疊合。
- `full.png`：以上四層由後至前合成，逐像素一致。
- `layers.json`：繪製順序、共同骨架支點、各層網格與權重。左右採角色自身方向，左手在畫面右側。
- `idle-trigger.gif`：使用正式動作函式輸出的頂點製作的待機／觸發預覽；為方便看接縫，離線 GIF 省略加亮效果，正式 Pixi 預覽保留。
- `motion-contact.png`、`pose_*.png`：動作定格。
- `delivery-check.json`、`motion-check.json`：實測結果。

造型來自自有囚犯素材，使用內建 ImageGen 生成部位；原始輸出和提示詞保留在 `../sample_v1/`。本版以可重現的素材整理程序完成等比縮放、對位、去除遠處透明雜點與藏在領口下的脖子延伸，沒有使用競品圖層。手銬本輪不加。

## 驗證結果

| 項目 | 結果 |
|---|---|
| 左／右前臂最小離身距離（從肘支點往下） | 49.0 / 53.24px，均 ≥48px |
| 肩部重疊最大橫向寬度 | 60 / 81px；另以動作定格確認接縫 |
| 頸部與軀幹重疊的垂直範圍 | 123px；下頸跟隨軀幹，臉與頭頂保持同一層 |
| 人物頂部／腳底基準 | y=172 / 1774（alpha >16；柔邊另有少量低 alpha 像素） |
| 合成及 PSD 回讀 | 逐像素一致；部署用圖與交付圖逐位元組一致 |
| 待機及三種反應掃描 | 3,232 個姿勢，包含 1×／2×／4× |
| 網格面積比例 | 0.862–1.147，翻面 0 |
| 動態有色頂點的最小畫布留白 | 45.72px |
| 權重隔離 | 身體對手臂骨權重為 0；每隻手臂只綁自己的上臂及前臂 |

瀏覽器已檢查一般得獎、大獎及免費遊戲觸發峰值，並在完整遊戲 Storybook 驗證事件會驅動角色。角色在窄直向版面沿用原本的隱藏規則；桌面盤面右側會預留最大動作空間，避免手掌超出螢幕。

Hard Time 正式 build 與新增角色 TypeScript 模組檢查通過。全專案 `check:types` 尚未全綠（最後一次 885 個錯誤／61 個檔案，含既有專案與離線設計腳本診斷）；不把 build 通過等同全專案型別檢查通過。

## 預覽與再製

互動角色：http://localhost:6017/iframe.html?id=art-layered-prisoner--review&viewMode=story

完整遊戲事件：http://localhost:6017/iframe.html?id=components-game--layered-prisoner-trigger&viewMode=story

在遊戲目錄執行 `corepack pnpm@10.34.4 storybook`，再開啟上述頁面。互動預覽與遊戲使用同一個 `LayeredFigure`，不是另一套動畫。

在專案根目錄重建交付：

```sh
/Applications/anaconda3/bin/python wp/apps/HardTime/design/build_layered_cast.py
/Applications/anaconda3/bin/python wp/apps/HardTime/design/check_layered_art.py
node wp/apps/HardTime/design/check_layered_cast.mjs --frames
/Applications/anaconda3/bin/python wp/apps/HardTime/design/render_layered_cast.py
```

遊戲已使用 `src/game/layeredFigure.ts` 與 `layeredCastMotion.ts`；後者保留原有反應時序、身體與頭部動作，僅依新圖的解剖左右和空隙調整手臂。舊的全身單網格和原有動作表保留供追溯。尚未上傳 Stake。
