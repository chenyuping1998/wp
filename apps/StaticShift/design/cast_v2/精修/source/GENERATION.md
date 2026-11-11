# 局部補繪來源

工具：內建 `image_gen`，透明 PNG。未使用 CLI/API。

原始兩位完整母圖及初稿分層提示詞：`../../generation-complete-manifest.json`。這是初稿來源清單，裡面的 NOT_ACCEPTED 是初稿狀態，不是最終交件狀態。

本次新增補繪：`host_torso_no_socket.png`，輸入 `../../交件/host/raw/torso.png`，保留原衣服輪廓、比例、位置、口袋、鈕扣、項鍊，移除肩膀內側的人偶圓圈線，補成連續白色布料。

完整提示詞：

> Production costume layer correction for adult comic radio host. Keep this EXACT isolated white jacket + black top + clothed-body waist drawing, same outline, same scale, same canvas position. Change ONLY the shoulder connection areas: REMOVE the two oval/circular armhole outlines and every black contour that rings a concealed shoulder joint. Paint continuous flat off-white jacket cloth in those oval areas; the cloth must flow smoothly from shoulder to chest, no visible socket, hole, disc or mannequin joint. Retain the outer organic shoulder cap silhouette for overlap beneath separately layered sleeves. Keep lapels, pockets, buttons, black top, necklace, colors and existing other ink strokes unchanged. No arms, hands, head or sleeves. True transparent background; no ground shadow, fog or stray fragments. No text or new elements.

精修程式只以這些既有生圖畫稿做遮罩、去背、重投影、對齊、色彩整理與遮擋區接合。保留 `reference-master.png`，最終完整圖由正式圖層重新合成，沒有拿母圖冒充 assembled.png。


## 2026-11-05 關節補繪

以下仍使用內建 image_gen；程式只裁切、去背、對齊與合成已生出的補繪。

- `dj_forearm.png`、`host_forearm.png`：參考各自 reference-master.png，要求只交肘至腕的單一完整前臂，透明背景、自然收窄、兩端圓弧多畫、不畫手掌／衣袖／手鐲／額外上臂，不在隱藏端描邊。生圖帶出的上段肘球未採用，只取完整自然收窄的前臂段對齊實際肘點、腕點。
- `dj_joint_cloth.png`、`host_joint_cloth.png`：各自母圖的局部補繪來源，要求姿勢、比例、外輪廓不變，只移除褲內口袋、縫線、黑皺褶／網點，保留同色布料體積與外描邊。這兩張是隱藏關節的布料來源，沒有直接拿它們取代角色合成圖。精修只在拆層內部端點讓被截斷的印刷墨線漸收，平常布料、可見外緣仍保留。

完整補繪提示詞見 `joint-generation-prompts.json`；最終所有來源均列入 delivery-manifest.json 的 SHA-256。


最終版改採 `dj_leg_revision.png`、`host_leg_revision.png` 的完整褲子重畫，保留工作褲配色與上大腿側袋，移除小腿側袋，將皺褶移離膝關節。這是生圖重畫的有機輪廓，沒有用直線削掉原褲管。`*_joint_cloth.png` 只留作失敗實驗來源，最終分層沒有套用整片補色。

`qa/source-repaint/` 保存初版完整圖對新版褲子來源的所有顯著 alpha 移除區；`leg-silhouette-report.json` 則核對「新版來源 → 最終分層」沒有再削掉腿部實體。兩種比較目的不同，不聲稱新褲子與初版輪廓零差異。

DJ 前臂最終另做漫畫墨線校正，使用相同輪廓與畫布，改成平塗、粗墨線與稀疏粗毛髮線。原寫實版留在 精修/history/dj_forearm-realistic-rejected.png，正式 dj_forearm.png 是內建 image_gen 的漫畫校正版，完整提示詞已收錄。
