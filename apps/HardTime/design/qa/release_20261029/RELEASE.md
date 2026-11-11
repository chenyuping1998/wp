# Hard Time — 2026-10-29 發布紀錄

使用者授權：「做完的話上傳發布」。目標 silver-stars / hard-time。

- 正式frontend包177檔雜湊核對通過，來源與build／已驗證預覽一致。
- 官方自檢：31 PASS、0 FAIL、14 AT RISK（未重跑的RGS/replay/確切尺寸等覆蓋缺口）、2 NEEDS A HUMAN、1 N/A；細節及證據 SELF-CHECK.md。不宣稱平台全項認證。
- math compliance PASS，0 failures / 0 warnings；RTP96.05/96.06/96.07/96.09%。數學9檔不變，沿用math v3。
- frontend上傳16檔，刪除1個舊JS，156不變；實際7,423,871 bytes、17 actions，success=true。
- 上傳後重新plan：0 actions、0 bytes，scratch與本機包一致。
- publish(front,confirm=true)：published=true、changed=true、version=19。
- get_game回查：front v19已存在，前版v18。平台審查單open=false、locked=true；本次未更新審查版本或建立新送審，也未更動已核可/live channel設定。
- 嘗試無session直接讀v18／v19靜態素材，CDN均403；因此沒有宣稱從公開CDN逐檔讀回成功，或已完成真正RGS遊戲驗證。上傳內容由差異歸零、publish成功與get_game回查確認。

附件：front-plan.json、math-plan.json、math-compliance.txt、execute_upload.json、post_upload_plan.json、publish.json、get_game_before.json、get_game_after.json。未產生ZIP。
