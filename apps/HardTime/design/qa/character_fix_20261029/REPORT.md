> 後續發布：2026-10-29 已依使用者指示上傳並發布 front v19，math v3未變。詳 `../release_20261029/RELEASE.md`；本報告下方「未發布」描述驗收當時狀態。

# HardTime 角色修正驗收 — 2026-10-29

結論：本次修正 PASS。依同步後的 Claude/Codex 角色 skill 與 workspace 10/25–10/28 規則驗收。這是本機實際 runtime 與遊戲驗證，未宣稱平台驗收或真實 RGS 已測。

## 修正結果

- 囚犯：493 像素的前臂透明洞改為完整 ImageGen 袖子；移除下緣身體碎片。手、腕與肘仍對回原座標；衣料筆觸有刻意更新，不宣稱零差異。
- 囚犯毛巾由零散片段改成一條連續布料並放在雙臂後。上臂原本模糊的手指清除區，改成實際補繪袖面；亮／暗底逐層檢視。
- 典獄長：上臂握棍手指殘影、褲子裡鑰匙尖殘影已以補繪來源移除。forearm_r、baton、fingers_r 都排在 head 後方（視覺前景）。
- 主盤與桌機 feature entry 統一 CastSpine，移除進場舊 8 層 mesh 路徑。直式進場維持規則面板，不額外塞入角色。
- 以完整動作邊界調整水平位置；1280×720 最大反應的外側手掌約保留 12px。進場腳部上移至安全底線，鞋子完整；角色大小及動作幅度均未縮小。

## 動作與來源

既有骨架為真正 4.2.43，沿用 4.2.74 官方 runtime；spine-motion-kit 只支援 4.3，未把不支援當通過，也未改版本字串冒充。保留既有生成製程，沒有從零手寫新骨架。

兩人現有交付各 4 clips：idle、react、reactBig、blink。這不是新增角色的六動作模板。本次所有既有 clips 均檢查，四組待機相位、每秒 60 格，每人 1,936 格，共 3,872 格；另每 clip 實際錄製 121 格，共 968 張 1200×1600 渲染，重出八組 GIF、過渡／極值 contact sheets 與眨眼特寫。

- 翻面：0；三角面積比囚犯 0.681–1.211、典獄長 0.628–1.365。
- 腳踝最大誤差 < 3.2e-13 art px。
- bones、animations、IK、physics 與備份逐項相同；mesh/crop/atlas 依新來源重建。
- 前臂、毛巾皆為單一連續部件，內部洞 0。舊 493px 破洞來源確實被 guard 拒絕。
- 歷史母圖含被移除碎片及舊袖面，因此保留新舊對照。`check_cast_spine_holes.py` 只將明確重畫的袖子矩形列為刻意變更；其餘區域保持原 0.6% RGB 門檻，實測囚犯 0.22%、典獄長 0.32%，其餘洞 0。這不代替逐層／動作目視驗收。

補繪原檔及指示在 `../../_incoming/cast_repair_20261029/README.md`，登記合成在 `../../repair_cast_sources_20261029.py`。`prisoner_setup.png`／`warden_setup.png` 是新版組合 full；舊 `cast_brief/spine_v2/full_*.png` 留作歷史參考，並非本次新版 full。

## 遊戲與建置

實測桌機 1280×720 MG 反應、RIOT entry 及 entry 最大反應、FG、直式 390×844 MG/FG 反應、RIOT entry、8/8 結算。檢視肩肘、頸、腕、髖膝及層序，未見破口、碎片、分離或不自然關節輪廓。MG 腿部沿用 bet bar／畫面構圖裁切；桌機 entry 則完整顯示鞋子。主控台 error 0。手機另獨立進場跑完第二次 8/8（$66.40），保留 portrait_second_outro.png。

完整 `pnpm build` 通過；最後 entry 安全底線修正後重新執行 types 與 Vite build。型別 0 errors / 1 既有 warning。來源與 runtime gates 已接入 build；`pnpm check:cast-spine` 通過。保留 build.log、final-ui-build.log、types.log、runtime-validation.txt。

## 同步及交付範圍

- source → build → final preview → upload 的 43 個角色檔逐 SHA-256 一致；QA 固定快照的 6 個 Spine 檔也一致，詳 `revision-consistency.json`。
- 預覽在 `http://localhost:8177/hardtime-cast-final/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`，僅預覽注入本機 stub／QA 控制。
- 正式 staging：`/Users/stone/stake-engine/upload/HardTime/`。正式 code 與 build 相同；無 stub 注入。177 個 frontend／商店圖檔雜湊核對通過。
- 此前 staging 與來源備份保留於 before/。首次建立 source hash 紀錄時，明確刷新三個角色資料夾，避免保留舊壓縮圖而漏更新；其他既有壓縮美術保留。縮圖／封面本次未重製，原檔雜湊均保持一致。
- 數學權重／RTP 未改，既有 100,000 books 的 upload math 檢查通過。未產生 zip，未上傳或更新平台。

## 圖像證據

- desktop_peak.png：最終主盤峰值。
- desktop_intro.png、desktop_intro_peak.png：統一 Spine、完整鞋子與最大反應。
- desktop_fg.png：桌機 FG（原始 viewport 檔名因存檔時 resize 產生 390x844 名稱；實際 PNG 為 1280×720，此處已按實際像素正確命名）。
- portrait_mg_peak.png、portrait_fg_peak.png、portrait_intro.png、portrait_outro.png。
- *_comparison.jpg：同動作時間的新舊對照；*_layers_*.jpg：所有來源層亮暗底。
- *_joints.jpg、*_contact.jpg、*_blink_detail.jpg、八組 *.gif：本次固定最終 hash 的實際渲染。

先前 `character_audit_20261029/REPORT.md` 的 FAIL 保留作修前紀錄，以本報告及 results.json 表示修後狀態。
