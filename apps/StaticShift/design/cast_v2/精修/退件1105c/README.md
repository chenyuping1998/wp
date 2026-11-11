# 第三輪 #11–#13 — r4 正式美術交件

baseline/ 備份修前正式 r3；candidate/ 保存本輪最終來源。僅 DJ arm_r_upper、兩位 leg_l_upper／leg_r_upper 局部修改，47 張其他圖層位元組相同；膝部半徑 80px RGBA 與全部小腿均不變。附圖中的肩角對應 arm_r_upper，另一肩未動。

內建生圖提示詞：GENERATION_PROMPTS.json、fabric-prompt.json。採用 dj-thigh-generated.png、host-thigh-generated.png、dj-fabric-generated.png；左肩試稿及服務拒絕的獨立上臂試稿均未採用。

製程順序：apply_local_repairs.py、verify_revision.py、check_pose_ink.py、check_overlap.py、final_diff_evidence.py、make_detail_evidence.py、check_scope.py。verify_revision.py 修正 cubic 過衝：以 raw alpha 反算 RGB，接著才裁切 alpha，消除假膝圈。

確認原生放大、淺暗底與 alpha 移除區域後記錄 visual-review.json。finalize_revision.py --stage 核對已驗收來源 SHA 與檢查，覆蓋正式交件、重跑指定檢查並產生最終 manifest。不可用先前精修腳本回蓋。

STATUS.json、delivery-manifest.json 保存正式狀態。只交美術，不整合 Spine／遊戲／upload，平台未更新。
