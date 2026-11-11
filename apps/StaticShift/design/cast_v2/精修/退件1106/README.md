# 第五輪 #14–#16 — r5 肘端局部修正

baseline/：修前正式 r4 完整備份。candidate/：本輪最終美術。只改兩位 4 張 arm_* PNG 的肘端；其餘 44 張逐檔相同。scope-report.json 記錄局部差異及肩根／前臂手腕保留檢查。

GENERATION_PROMPTS.json 保存內建 image_gen 提示詞，兩張 *-straight-generated.png 是連續肘部參考，不是整隻替換稿。repair_elbows.py 只處理肘端；verify_revision.py 沿用六個姿勢並加伸直與 V 字過頭；check_pose_ink.py、check_overlap.py、final_diff_evidence.py、make_evidence.py 輸出本輪證據。

sample_existing.mjs 用工具真正 Spine 4.3 runtime 取樣原 spine_r4 JSON，不編寫或改動 Spine 動作。render_actual_elbows.py 將本輪圖層套入原取樣矩陣，產生全部 8 動作、每 0.12 s 及末格的雙肘圖。report.json 與 sampled-frame-hashes.json 可核對來源及原動作未變。

完整目視後記錄 visual-review.json；finalize_revision.py 只覆蓋 8 個指定來源檔及相關合成／QA，再於正式路徑執行原版檢查。STATUS.json、delivery-manifest.json 為本輪正式結果。

本次僅美術與 QA，不改遊戲、Spine、upload 或平台。既有 spine_r4 輸出為歷史，後續整合須重建為 r5 貼圖。
