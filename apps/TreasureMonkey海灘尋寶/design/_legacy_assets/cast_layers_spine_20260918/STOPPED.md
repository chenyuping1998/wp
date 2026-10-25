# 切層 / Spine 這條路 —— 已停用（2026-09-20）

2026-09-18 到 09-20 的評估。使用者看過產出的 GIF 之後的結論是
「完全不行，重來，回到類似 hot miami 的動態」，所以整條路收掉，角色回到
**單張完整插畫 + 蒙皮網格**（`src/game/castMotion.ts` + `skinnedFigure.ts`），
動作照 Hot Miami 的寫法重做。

**這個資料夾不出貨，也不要當成現行做法。** 留著是因為下面這四個坑，
下次有人再想走切層／動作庫這條路一定會再撞一次。

## 四個坑

1. **B 版（`miami_main_guy`）的切層需求結構上組不起來** —— 15 個 slot 裡 13 個是加權
   網格、5 個 `len_synthetic` 全落在臉上、`bat` 兩個 slot 都 `auto_fit: false`，
   而且機器導出的 spec 自相矛盾（同一個檔名兩種尺寸，導出時沒處理「一個 attachment
   出現在多個 slot」）。一張圖都沒生就停了。
2. **把網格變形的輔助骨當骨骼動作搬** —— `biceps_*`（零長度葉節點）接到扛著整條手臂
   圖層的上臂骨上，手臂被拉成一條貫穿畫面的細片；`body_perspective` 照名字接到
   `boss_body_perspective` 只搬得動身體那一片，軀幹滑出手臂外面。
3. **boss 的 IK 目標掛在 `root` 底下** —— `hand_l/r_target`、`shoulder_l/r_target`
   驅動的正是扛著手臂圖層的骨頭。軀幹搬了、目標沒搬，手臂就張成翅膀。
4. **`--checkart` 對換皮不是驗收條件** —— 它比的是「這塊圖跟原角色的同一個零件像不像」，
   門檻由原件轉八種角度的波動 ×1.6 校準。換皮畫的是另一個角色，過不了也不該當驗收。
   能機械回答「姿勢有沒有被強制寫進去」的是 `--verify-pose`。

細節寫在 `_hacksaw_motion/README.md` 與 `boss/README.md`；停做的理由寫在
`../../ART_BRIEF_CAST_PACKS.md`。原始關鍵幀只供評估，不得出貨。
