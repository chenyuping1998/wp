# mascot-rig：正面吉祥物 → 加權網格 Spine 骨架＋動作 → Spine 4.3（或 4.2）給遊戲

把一隻**正面站姿**的吉祥物（照模板拆好的圖層）做成可以直接放進遊戲的 Spine 骨架：加權網格（手腳尾巴在關節處連續彎曲）、手腳 IK、半角輔助骨、8 個吉祥物動作、尾巴耳朵的物理烘焙；自動檢查流暢度、網格摺疊、腳底滑動，輸出 Spine 4.3 骨架＋atlas（舊遊戲可選 4.2），並用同版的 spine-core 逐格重播驗證。

流程是**先定動作、再畫角色**：動作庫和比例規則先定好（佔位人偶就能跑全部動作），生圖照規格交件，交件後一行指令套上同一組動作。

```bash
node tools/mascot-rig/mascot.ts mannequin 角色/人偶            # 佔位猴子：照模板畫好的圖層＋關節
node tools/mascot-rig/mascot.ts brief 角色/生圖規格.md          # 給生圖端的規格（圖層、關節、比例）
node tools/mascot-rig/mascot.ts build 角色/人偶                 # 骨架＋動作＋檢查＋預覽＋Spine 4.3
```

在 `wp` 根目錄執行（指令裡的路徑相對於目前目錄）。`build` 不出 GIF 約 7 秒，出 GIF 約 2 分鐘（`--no-gif` 只出逐格圖）。

## 需要

- Node 22.18 以上（直接跑 TypeScript）：用 `E:\stake\tools\node-v22.23.1-win-x64`。
- [spine-generator](https://github.com/stone8000/spine-generator)（main 就夠）：預設 `E:/stake/spine-generator`，或設 `SPINE_MOTION_KIT`。用它的動作編譯（`compileRecipe`、strike／彈簧緩動、物理烘焙）、流暢度檢查和 Spine 4.3 runtime。
- spine-core 4.2（只有 `--spine 4.2` 用到）：wp 跑過 `pnpm install` 就有（`node_modules/.pnpm/@esotericsoftware+spine-core@4.2.*`），或設 `SPINE_CORE_42`。
- Python 3＋Pillow＋numpy（`PYTHON` 可指定）：讀圖層、打包 atlas、離線算繪。

## 交件資料夾

```
角色/
  layers/           ← 圖層 PNG（也可以直接放在角色/底下）
    tail.png  ear_l.png  ear_r.png  leg_l.png  leg_r.png  pelvis.png  neck.png  torso.png  arm_l.png  arm_r.png  head.png
  joints.json       ← 關節點（畫布像素，y 向下），必要
  layers.json       ← 選用：疊圖順序 { "order": [...] }
  mascot.json       ← 選用：{ "name": "bananaMascot", "reels": "left", "scale": 0.5, "spine": "4.3", "grid": 18 }
```

- 圖層、關節的完整規格跑 `brief` 產生（從 `template.json` 來，模板改了規格就跟著改）。`tail`、`ear_*`、`neck` 是選用。
- L／R 是**畫面的**左右。`reels` 是盤面在吉祥物的哪一邊（預設左邊）：指、丟往那邊，揮手用另一隻手。
- `scale`：輸出給遊戲時整體縮放（骨架數值、atlas 圖都縮）；預覽、檢查都用原尺寸。
- `spine`（`--spine`）：遊戲檔的 Spine 版本。**新遊戲用 4.3（預設）**，app 要裝 `@esotericsoftware/spine-pixi-v8` 4.3.x；還在 4.2.74 的舊遊戲用 `--spine 4.2`。不要把 4.2 遊戲整個換成 4.3 runtime：4.3 不讀舊格式的 IK／物理，舊角色會靜靜地不動。

## 輸出（`<角色名>_mascot/`，`-o` 可改）

| 檔案 | 用途 |
|---|---|
| `game/<名>.json`、`.atlas`、`.png` | Spine 4.3（或 4.2）骨架、atlas、貼圖，直接放進 app 的 `static/assets/spines/<名>/` |
| `<名>.spine43.json` | 同一份的 Spine 4.3 版（spine-generator 的 `check`／`preview` 可以直接讀） |
| `報告.md` | 結論、每個動作的檢查、關節轉幅、比例警告、遊戲檔重播驗證結果、放進遊戲的寫法 |
| `預覽.gif`、`逐格.png` | 全部動作連播（待機穿插、0.12 s 混合，和遊戲一樣）；每個動作三格 |
| `_work/` | 中間檔，可刪 |

## 動作庫（`lib/motions.ts`）

| 動畫 | 用在 | 手臂 | 事件 |
|---|---|---|---|
| `idle` | 平常待機（3.2 s 循環：呼吸、尾巴慢擺、耳朵） | FK | |
| `wave` | 進場、選單、閒置太久 | 外側手 FK | |
| `point` | 期待（差一個 Scatter） | 盤面側 FK | `point` |
| `throw` | 收集、丟東西進盤面 | FK | `release` |
| `cheer` | 大獎、觸發免費遊戲（kit 的跳躍＋雙手 V） | FK | `takeoff`、`land` |
| `laugh` | 中獎（手按肚子、身體一抖一抖） | IK | |
| `disappoint` | 期待落空（聳肩攤手、垂下） | FK | |
| `dance` | 大獎跑分循環（1.6 s） | FK | |

- 數值都從骨架量出來（臂長、畫好的手臂角度、身高），照模板畫的角色都套得上。時間用 kit 的 strike：蓄力 → 極快出手 → 過衝 → 停 → 收。
- 尾巴、耳朵的跟隨用 Spine 物理模擬後**烘成關鍵影格**：遊戲不用跑物理，每次播放都一樣。
- 新增動作：在 `mascotMotions` 加一個 recipe（kit 的軌道：`poses`、`strike`、`wave`、`spring`、`shake`，見 spine-generator 的 `docs/配方格式.md`），手臂角度用 `fkUpper`／`fkFore`（世界角度，另一側自動鏡像），手放到定點用 IK 目標的 `toward`。

## 檢查（報告裡的欄位）

| 欄位 | 意思 | 門檻 |
|---|---|---|
| 流暢度 | spine-generator 的頓挫、停頓、折角、循環接縫 | ≥ 80 |
| 網格摺疊／擠扁 | 只算**看得到**的三角形（有畫、沒被上層蓋住）；翻面會出鋸齒，擠扁（面積 < 25%）多在關節內側、正常 | 摺疊 0 |
| 手追不上 | IK 手離動作規劃的位置多遠（扣掉原圖就有的柔化距離），以臂長計 | ≤ 3% |
| 腳底滑動 | 腳的 IK 目標沒動時腳踝移動幾 px | ≤ 身高 0.4% |
| 第一格離原圖 | 待機第 0 格和畫好的姿勢差幾度（遊戲從靜態圖切進來會跳） | ≤ 5° |
| 遊戲檔重播 | 用目標版本的 spine-core（4.3.13 或 4.2.74）讀 `game/` 的檔案和 atlas 逐格重播，比骨頭與每個網格頂點；另外測 `skeleton.scaleX = -1` 鏡像 | < 0.05 px |
| 比例 | 臂長 ≥ 肩到頭頂（舉手才過得了頭）、手肘膝蓋要微彎、脖子方向 | 警告 |

## 放進遊戲

```ts
// assets.ts
bananaMascot: {
	type: 'spine',
	src: {
		atlas: new URL('../../assets/spines/bananaMascot/bananaMascot.atlas', import.meta.url).href,
		skeleton: new URL('../../assets/spines/bananaMascot/bananaMascot.json', import.meta.url).href,
		scale: 1,
	},
},
```

播 `idle` 循環；事件觸發時 `setAnimation(0, 'cheer', false)` 再 `addAnimation(0, 'idle', true, 0)`，混合 0.12 s 左右。左右翻轉用 `scaleX = -1` 可以（已驗證）；這時 `reels` 也要反過來設。

## 骨架怎麼做的（為什麼）

- **加權網格**：每層一張格網（約身高 1/70 的格距），權重沿骨鏈的位置算，關節處漸變，所以手腳尾巴是彎的、不是兩片繞釘子轉。
- **肩膀是球**：整條手臂都歸上臂，肩膀頂端的圓繞自己的圓心轉（鎖骨和上臂的權重交界如果切過圓頭，舉手會撕開）。
- **半角輔助骨**：手肘、膝蓋多一根骨，只轉下一節的一半（transform 約束；4.3 是 `properties.rotate.to.rotate {scale 0.5}`，4.2 是 `local` 的 `mixRotate 0.5`），關節帶的權重走「上 → 輔助 → 下」，內側才不會摺。手肘帶寬 ±3.6 倍手臂半寬（±2 倍時彎超過約 115° 會摺）。
- **手臂 FK／IK**：手舉過肩用 IK 會讓手肘往頭內側折、沒在動的手 IK 會被身體拉直，所以只有「手要放到定點」的動作開 IK，其餘動畫把手臂 IK 的 mix 設 0，手臂跟著肩膀走。手臂 IK 有柔化（臂長 12%），手的目標跟著骨盆。
- **腳踩住**：腳掌掛在小腿下、不繼承旋轉（貼平地面）；腿的 IK 柔化只給到原圖姿勢以外，目標就在畫好的腳踝上，蹲下時腳不會陷進地板。動作裡骨盆不高過站姿、只轉約 2.5°，身體的傾斜交給腰和胸（一節晚一點，有跟隨感）。
- **鎖骨不繼承縮放**：呼吸、跳躍的擠壓縮放胸口時，手臂不跟著變長。

## 限制

- 只有正面站姿一套模板；側面、四足、長裙披風要另做模板。
- 沒有表情、換手這類換圖（attachment 切換）；要的話在遊戲端或另外加 slot。
- 網格的 `hull` 寫 0：runtime 不需要，但匯入 Spine 編輯器後網格不能用編輯器改形狀（骨架、動畫可以改）。
- 關節點要手標（`joints.json`），沒有自動猜；佔位人偶的 `joints.json` 可以當起點改。
- 骨架 JSON 約 380 KB（網格頂點多）；`--grid 24` 約 310 KB，檢查一樣全過。
