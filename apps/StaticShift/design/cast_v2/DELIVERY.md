# Static Shift 第七輪美術修正 — r7

版本：`staticshift-cast-20261106-r7`。正式檔位於 `交件/dj/`、`交件/host/`；每位 26 張 1024×1536 真透明 PNG。

本輪替換八張來源 PNG：

- DJ：`arm_r_lower`、`hand_r_hatheld`。
- 主持人：`hand_r_grip`、`arm_r_lower`、`arm_l_lower`、`hand_l_open`、`hand_l_point`，及 Stone 明確追加同意的 `hand_r_hatheld` 腕根。

其餘 44 張 r6 PNG 位元組完全相同。所有上臂、關節、骨長、原疊序、原骨架及動作角度保留。DJ 近側前臂肘端前 40 px、主持人近側前臂肘端前 40 px、遠側前臂肘端與近端前 110 px 均逐像素保留。

## 修正內容

1. **#20 DJ 舉耳機**：整理前臂腕側的透明邊與連續墨線，清掉腕根碎墨；把手圖層多帶的長前臂殘段收短成圓順的隱藏重疊段，與前臂同色，避免腕根邊界跨在前臂中段形成淡縫。僅在原動作確實會露出的腕側補墨線；耳機與手指保留。
2. **#21 主持人舉麥**：修正腕側漸層和根部底色的銜接，清掉方形補色痕。經原 r6 骨架核對，`win_big 1.0 s` 的實際圖片為 `hand_r_hatheld`；黑方點位於該圖層原座標 `[744,495,749,501]`，共 22 個黑色像素。依追加授權，清掉該點並把多帶的腕根收回手環下；手指、麥克風、戒指及手環逐像素保留。
3. **#22 主持人遠手**：處理開掌／指向手圖層長腕根的交界與同色底襯，讓淡縫不再跨在前臂中段；只在腕部末段重接平滑有機弧線和墨線，消除原本的直角台階。已通過的遠側肘端與前臂近端保持原檔。

## 驗收圖片

- `第七輪_三處原角度3倍_修前修後站姿.jpg`：每處均為原生 200×200 裁切後以 nearest 放大 3 倍，依序列出 r6 修前、r7 修後、同版站姿。紙底 `#e5e2d6`。
- #20：`win_big_loop 0.5 s`；#21：`win_big 1.0 s`；#22：`win_big 1.0 s`。全部直接使用未改動 r6 骨架的原姿勢。
- `第七輪_遠手指向_補充3倍.jpg`：另列 `gaze 0.9 s` 的指向手修前／修後，覆查第二張受影響的遠手圖片。
- 各角色 `qa/all-layers-paper-dark.jpg`、`qa/all-wrists-paper.jpg`：來源亮／暗底與全部換手。
- `qa/exact-alpha-diffs/`：相對正式 r6 的完整 alpha 移除、新增範圍及逐區對照。
- `qa/actual-wrists/`：各八個動作、每 0.1 s 及末格取樣，收手另加 0.25 s；每位 149 格，兩位共 298 格、596 個腕部裁切。`report.json` 記錄來源與骨架 SHA256、原角度取樣及檢查結果。

原版 `check_outline_ink.py` 於正式交件路徑執行，兩位均 PASS、uninked_px 0。另有各八個靜態姿勢的外輪廓結果與全部原幅度動作腕部複查；不以站姿 PASS 代替動作驗收。

本輪使用內建 image_gen 產生局部補繪參考，搭配已授權的精準遮罩、腕根對位、同色底襯、透明邊與輪廓整理。完整提示詞及生成原圖保存於 `精修/退件1106c/GENERATION_PROMPTS.json`、`EXTRA_GENERATION_PROMPT.txt` 和同目錄 `*-generated.png`。沒有把整張新生成的手指或道具替換進交件。

`scope-report.json`、`proof-poses.json`、`visual-review.json`、`delivery-manifest.json` 與 `STATUS.json` 保存於 `精修/退件1106c/`；`精修/delivery-manifest.json` 為最新索引。正式來源、合成圖及全部 QA 證據對應同版雜湊。

本次只更新本機美術交件及證據；未改動既有 Spine JSON、遊戲、upload 或平台。舊第三輪、第五輪、第六輪圖片與說明均為歷史資料，不代表 r7。
