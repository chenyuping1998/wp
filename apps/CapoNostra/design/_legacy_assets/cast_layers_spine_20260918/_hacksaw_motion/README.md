hacksaw-character-motion 2026-09-18 版（985e6b76）的 spineplay，motionlib.py 已加 <slot>__<att>.png 與全透明=留空的支援（原檔 motionlib.orig.py）。僅供評估，不出貨。

## 2026-09-20 新增 `spineplay/retarget_reaction.py`

B 版（照 `miami_main_guy` 切圖）停做之後，用來把 **`miami_main_guy` 的 1 秒中獎反應
重定向到 `miami_boss` 的骨架**上，用 A 版已經交的七張圖播。

    /Applications/anaconda3/envs/math-sdk/bin/python retarget_reaction.py --report
    /Applications/anaconda3/envs/math-sdk/bin/python retarget_reaction.py --write

產出 `packs/capo_boss_reaction.motion.json`（= boss pack ＋ 三段新動作），
**同樣只供評估、不出貨**：

| 動作 | 對應方式 |
|---|---|
| `full_screen/reaction_name` | 骨頭照名字對 |
| `full_screen/reaction_swap` | 照角色對（揮動的那隻接到 boss 空著的手），左右鏡像 |
| `full_screen/reaction_torso` | 完全不碰手臂鏈，只有軀幹／脖子／頭 |

三段都把 boss 自己的 `full_screen/idle` 烘在底下（真的在遊戲裡是兩條軌疊播）。

### 踩過的三個坑，都是同一類：**把網格變形的輔助骨當成骨骼動作搬過來**

1. `biceps_l` / `biceps_r` —— 零長度葉節點，`scale` 1.52/1.56 在原版只透過權重讓上臂
   鼓起來。接到 boss 扛著整條手臂圖層的上臂骨上，手臂被拉成一條貫穿畫面的細片。
   **預設不搬**，`--with-biceps` 可重現。
2. `body_perspective` —— 同樣沒有子骨。照名字接到 `boss_body_perspective` 只搬得動
   **身體那一片**：實測 t=0.43 身體位移 66、手臂 0，軀幹直接滑出手臂外面。
   改接 **`boss_spine1`**（軀幹根部）才是剛性骨架上的等價物：軀幹、雙臂、頭一起動，
   腿留在地上。
3. 沒有把待機烘在底下時，那 28 根 smoke 骨會停在 setup pose（待機是把它們從 0 放大
   出來的），畫面上多一條跟身體一樣高的黑色煙片。**那不是重定向算錯，是少了底層待機。**

診斷方法：不要用眼睛猜。逐層算出 bind pose 與當下的世界四邊形，比中心位移與邊長，
一次就指得出是哪一層、被哪根骨帶走的。

## 2026-09-20 新增 `spineplay/resolve_joints.py`，並改了 `motionlib` 的 joints 查表

`resolve_joints.py` 解「主軸正負向分不出來」那一類：四種正負向各算一次擺放，跟 pack
自己那一層的四邊形比角點平均距離，取最小的，寫進 joints.json（像素座標，可以用眼睛核對）。
Capo boss 的 10 個 fallback 槽位**全部**卡在這一關，沒有一層是形狀對不上或缺骨長；
解完之後擬合 21 層、沿用 0 層，`--verify-pose` 42 個關節全過。

`motionlib.joint_key()`：joints.json 的查表順序改成
`<slot>/<att>` → `<slot>__<att>` → `<att>`。同一個 attachment 被兩個 slot 用、而且各有
自己的圖時（boss 的 `ch3_body2`：`ch3_body` 用 898x1751、`ch3_pocket` 用 1774x887），
一個以 attachment 為鍵的條目會同時套到兩張不同的圖上，其中一張必錯。
跟 `_lay` 的 `<slot>__<att>.png` 是同一個道理。

### 第四個坑：IK 目標掛在 root 底下

`retarget_reaction.py` 把軀幹位移接到 `boss_spine1` 之後，手臂會張成翅膀。
boss 的 `hand_l/r_target`、`shoulder_l/r_target` **都掛在 `root`**，而 IK 驅動的正是扛著
手臂圖層的 `boss_arm2_l/r` 與兩個肩膀 —— 軀幹搬了、目標沒搬，手就被往下拉、手肘外翻。
**搬軀幹就要一起搬那四個目標**；腿的目標不搬，腳要留在地上。

### `--checkart` 對換皮不是驗收條件

補完 joints 之後 21 層裡 20 層仍然 fail，全部是「輪廓跟原件對不上」。那是**形狀簽章**
在比「這塊圖跟原角色的同一個零件像不像」，門檻是拿原件轉八種角度量出來的波動 ×1.6。
換皮畫的是**另一個角色**，輪廓本來就不一樣 —— 這一關過不了，也不該拿來當驗收。
機械上能回答「姿勢有沒有被強制寫進去」的是 `--verify-pose`。

