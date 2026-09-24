# Capo Nostra cast layers — A / miami_boss

Generated from `ART_BRIEF_CAST_PACKS.md` on 2026-09-18.

- `full.png`: identity and cut reference master (built-in imagegen)
- Layer files: eight isolated transparent PNG parts for the copied `miami_boss` bind pose
- `ch3_glasses.png`: intentionally transparent because Capo does not wear glasses

Alpha-bounding-box aspect checks (target / delivered):

- `ch3_body2.png`: 2.03 / 2.023
- `ch3_arm_l.png`: 3.25 / 2.748
- `ch3_arm_r.png`: 5.34 / 4.896
- `ch3_head.png`: 1.63 / 1.705
- `Cigg.png`: 3.90 / 3.894
- `smoke.png`: 3.40 / 3.259
- `smoke2.png`: 3.40 / 3.765
- `ch3_pocket__ch3_body2.png`: 2.03 / 1.965

All deviations are below the brief's 1.3x rejection threshold.

## Current verification status（2026-09-20 更新）

- `fit.json`: generated with the copied `miami_boss` pack.
- `joints.json`: 宣告了 11 層的關節座標。`Cigg` 是原本手寫的；其餘 10 層由
  `../_hacksaw_motion/spineplay/resolve_joints.py` 解出來（見下），
  `ch3_pocket/ch3_body2` 是用眼睛挑的。
- `idle_preview.gif`: 133 frames / 6.67 seconds at 20 fps.
- **擬合 21 層、沿用 pack 擺位 0 層**（之前是 11 / 10）。
- `--verify-pose`：**42 個關節全部通過**，最大殘差 `2.68e-06 × 骨長`（之前只驗 22 個）。
- `--checkart`：**仍然不過**，但原因跟擺放無關，見下。

## 那 10 個「沿用 pack 擺位」的槽位 —— 已解（2026-09-20）

10 層全部卡在**同一件事**：`artfit` 用輪廓的三階動差判斷主軸該往哪一頭，輪廓夠對稱時
最佳與次佳差不到 `SIG_AMBIG = 0.06`（實測 0.001–0.045），它就拒絕猜。
**沒有一層是形狀對不上或缺骨長。**

`resolve_joints.py` 把四種正負向各算一次擺放，跟 pack 自己那一層的四邊形比角點平均
距離，取最小的 —— 判準成立是因為美術需求本來就是「照原版的 bind pose 畫」。

| 層 | 選中 | 誤差 / 次佳 | 判斷 |
|---|---|---|---|
| `ch3_body/ch3_body2` | (1,−1) | 0.163 / 0.322 | ✅ 2.0x |
| `ch3_arm_l` | (−1,1) | 0.575 / 0.906 | ✅ 1.6x，目視：起點在手肘、終點在袖口 |
| `ch3_arm_r` | (−1,−1) | 0.472 / 0.485 | ⚠ 1.0x，但目視手肘→手腕正確 |
| `ch3_head` | (1,1) | 0.222 / 0.232 | ⚠ 1.0x，但目視下巴→頭頂方向正確 |
| `ch3_pocket/ch3_body2` | (1,1) | 四種都 >0.5 倍骨長 | ❌ 幾何分不出來，**用眼睛挑**：這個讓口袋落在手旁邊而不是蓋住手 |
| `smoke2` ×5 | (1,−1) | 0.648–0.810 / 1.52–1.82 | ✅ 2.3–2.4x |

**效果**：手臂不再是一塊跟身體分開的暗板、手掌也不再浮在袖口下面。
反應動起來之後整個人是連在一起的。

### ⚠ `--checkart` 還是不過 —— 那是**另一件事**

補完 joints 之後 21 層裡 20 層仍然 fail，訊息全部是
「輪廓跟原件對不上」（例如 `ch3_body2` 0.144 對門檻 0.025、`ch3_arm_r` 0.189 對 0.073）。
那是**形狀簽章**在比對「這塊圖跟 `miami_boss` 的原件像不像」，門檻是拿原件轉八種角度
量出來的良性波動 ×1.6。

Capo 的大佬是**另一個角色**（三件式西裝、圍巾、雪茄，不是 Miami 那個），輪廓本來就不會
跟原件一樣 —— **這一關對換皮而言不可能過，也不該拿它當驗收條件**。
機械上能回答「姿勢有沒有被強制寫進去」的是 `--verify-pose`，那一關現在全過。

真正還要人看的，是 `--checkart` 抓不到的那一類：`ch3_pocket/ch3_body2` 的圖是一塊
灰色補丁，條紋方向跟褲子對不上，四種擺法都不對 —— **那一層要重畫**。

This directory is still evaluation art and must not be shipped.

The reference master is evaluation art only. Original Hacksaw motion data must not ship.

## 中獎反應（2026-09-20）

B 版停做之後，`miami_main_guy` 的 1 秒中獎反應改用
`../_hacksaw_motion/spineplay/retarget_reaction.py` 重定向到 boss 的骨架上，
用這個資料夾裡的七張圖播。三個版本各 1.5 秒、30fps：

| 檔案 | 對應方式 |
|---|---|
| `reaction_name.gif` | 骨頭照名字對 |
| `reaction_swap.gif` | 照角色對（main_guy 揮的是垂在身側的**右**臂；boss 是**右手插口袋**、左臂垂著），左右鏡像 |
| `reaction_torso.gif` | 不碰手臂鏈，只有軀幹／脖子／頭 |

搬進來的是 14 條骨骼通道。**沒有**搬：球棒鏈、金鍊、IK 與 transform 約束、
四條加亮 slot（boss 沒有這些 slot —— 打光閃要做的話用 runtime 的加色 overlay，
不要當成美術層），以及 `biceps_*` 與 `body_perspective` 這兩根網格變形輔助骨
（理由寫在 `../_hacksaw_motion/README.md`）。

### 手臂張成翅膀 —— boss 的 IK 目標掛在 root 底下

補完 joints 之後第一次重播反應，左臂會整條張出去像翅膀。原因不在重定向的數值：
boss 的 IK 目標 `hand_l/r_target`、`shoulder_l/r_target` **全部掛在 `root` 底下**，
而 IK 驅動的正是扛著手臂圖層的 `boss_arm2_l/r` 與兩個肩膀。軀幹往上搬、目標留在原地，
手就被往下拉、手肘外翻。**同一個位移要一起搬給那四個目標**（腿的目標不搬，腳要留在地上）。
修完之後整個上半身是連著動的。

另外 `reaction_name` / `reaction_swap` 的軀幹會抬高約身高的 8.5%（照轉錄原值），
算圖畫布是照骨架框切的，所以頭頂會被切到一點 —— 那是畫布，不是動作。

