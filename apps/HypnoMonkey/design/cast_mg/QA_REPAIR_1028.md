# MG 1028 獨立驗收退回 — 來源修正與自查

原始退回單 `QA_CLAUDE_1028.md` 與其證據完整保留，不改寫原判定。本文件記錄後續實作與自查，不冒稱原驗收者已重新核准。

| 退回項目 | 來源處理 | 對照證據 |
|---|---|---|
| 直管袖子、圓球肘／肩 | 四段袖子重畫為曲線收窄的布料，加入衣褶；關節端不畫橫向圈線，補繪端收進相鄰部件 | `qa/repaired_1028/elbows-comparison.png`，同一 frame244、同一幅度 |
| 尾巴兩個鼓包與描邊中斷 | 前端補繪半徑縮到 23–24px，低於 24.5px 的棕色尾身；後段在原尾身外框寬內補足被前段遮住的邊緣，增加正確圓端重疊；不再用大棕圓覆掉描邊。另清除 bicubic 造成的平塗 RGB 過衝亮線 | `qa/repaired_1028/tail-comparison.png` |
| 大笑頭下巴外陰影 | 只清除從透明區可達的外側棕色殘影，黑色嘴線與內部口腔保留；不把這張的清理 alpha 套到其他表情 | `qa/repaired_1028/grin-comparison.png` |
| 插腰手毛邊 | alpha 收邊、移除細小突起，建立連續描邊 | `qa/repaired_1028/hand_l_hip.png` |
| 右手三張手腕碎線 | 袖口端局部去除細線與尖角，保留完整手腕供袖口重疊 | 同目錄 `hand_r_grip`、`hand_r_pinch`、`hand_r_hatheld` 及 `final-layers-*.jpg` |

- 來源全部維持 1024×1536 原位，未降低原動作幅度或縮小整個角色。
- `joints.json`、`motion.params.json`、骨架 bones 與所有 animations 關鍵影格，與退回前逐項／逐 byte 核對未變；見 `qa/repaired_1028/amplitude-check.json`。
- 官方 stand34 重新產生 32 層／八動作，八項接縫及反折通過。數值結果不替代目視；`all-motion-*.jpg` 以真實官方矩陣每四格重出，包含過渡與膝部，另有三倍解析度問題部位對照。
- 同步重建 source layers、實際 assembled/master、Spine images、runtime atlas/crop；預覽 GIF 另以 `preview-source-manifest.json` 綁定確切來源 SHA256，避免用舊乾淨預覽證明新版本。
- 笑臉外側清理會使其 alpha 與其他頭相差 1130 像素；五頭仍同畫布、同關節及同位置，不能再以「alpha 全同」當作品質通過理由。

保留 Claude 新增的直式上半身構圖：腰部以下藏在盤框，尾巴不畫；這是構圖，不用來掩飾來源缺陷。亦保留 da72cccf 的懷錶第一列優先與結算牌避讓。

FG 女助手與馬戲團背景／盤框／標題／片頭等完整換皮仍待完成。未打包、上傳或更新平台。

最終實機補驗：桌機 1280×720、直式 375×812 八動作、320×640 一般盤面。最新焦點暫停程式下的 mock baseThrow 回合正常結束（win 0.40、balance 999.40），console error 0。`final-mobile-round.png` 保留完整結算後畫面。`game-desktop.png` 與 `game-mobile-320.png` 為無 DEV 面板實際畫面。
