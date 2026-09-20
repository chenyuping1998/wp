# Capo Nostra 人物重做：分層 Spine 版美術需求（2026-09-18）

> ⚠ **已停用（2026-09-18）**：改成照 Hacksaw 動作庫完全複製，見 `ART_BRIEF_CAST_PACKS.md`。
> 🛑 **那份也在 2026-09-20 停用了** —— 切層整條路收掉，角色回到蒙皮網格。檔案搬到
> `design/_legacy_assets/cast_layers_spine_20260918/`。

取代 `ART_BRIEF.md` §1 的「單張圖＋mesh rig」路線。人物改成**分層切件**，
由我們自己的 Spine 骨架播放（前端已有 `spine-pixi-v8 4.2`）。
動作參考 Hacksaw 的 miami_boss idle / miami_main_guy reaction 的**節奏與幅度**，
關鍵幀由我們自己重寫，不直接使用原始資料。

角色設定不變（見 `ART_BRIEF.md` §1）：50 多歲、厚實、三件式深炭色細條紋西裝、
白圍巾、懷錶鍊、手拿雪茄、不拿武器、平靜俯視。**現在的 `guy.png` 長相與畫風保留。**

---

## 1. 為什麼可以保留寫實畫風

實測參考動作的幅度：

| 部位 | 幅度 |
|---|---|
| 全身（以腳為支點）擺動 | −4.4° ～ +1.9° |
| 胸口呼吸 | 縮放約 0.9–1.2 |
| 手臂 | 待機約 1°，反應時手腕最多 20°、前臂 8° |
| 頭 | 點頭最多 10° |
| 雪茄煙 | 大幅飄散（主要的生命感來源） |

角度都很小，所以不需要粗描邊的卡通風格。唯一的硬性要求是 **§4 的遮擋補畫**：
被蓋住的地方一定要畫完整，不然一轉就露出洞。

---

## 2. 姿勢

以現在的 `guy.png` 為準，但有三處要改：

1. **左手（畫面左邊）自然垂下、空手、手掌放鬆**，手臂與身體之間**全程有可見的空隙**
   （現在的圖已經差不多，保持即可）。
2. **右手（畫面右邊）彎肘，雪茄拿在胸口高度**，前臂與身體之間**留空隙**，
   手肘不要貼著腰。
3. **兩隻腳分開站**，兩腿之間要看得到空隙（現在的圖已經有）。

正面偏 3/4、站直、不傾斜、全身含鞋、不要地面陰影。

---

## 3. 圖層清單

**所有圖層都用同一個畫布、同一個位置輸出**：畫布 **1024 × 2048**（遊戲內 512×1024 的 2 倍），
每一層就擺在它在完整人物裡的位置，其餘全透明。
這樣疊起來就是完整的人，我不用猜對位。

另外交一張**完整合成圖** `full.png`（同畫布），當對位的標準答案。

由後往前的疊放順序：

| # | 檔名 | 內容 | 一定要畫到 |
|---|---|---|---|
| 1 | `leg_l.png` | 左腿（褲管＋鞋） | 上端**往上延伸進外套下擺裡約 80px** |
| 2 | `leg_r.png` | 右腿（褲管＋鞋） | 同上 |
| 3 | `torso.png` | 身體：外套、馬甲、襯衫、領帶、懷錶鍊、口袋巾，含髖部 | **沒有手臂、沒有圍巾、沒有頭**。肩膀畫圓、畫完整；**被手臂和圍巾蓋住的部分全部補畫**；領口內畫出脖子根部 |
| 4 | `arm_l_upper.png` | 左上臂（袖子） | 上端**畫進肩膀裡約 60px**，兩端圓收 |
| 5 | `arm_l_fore.png` | 左前臂（袖子＋襯衫袖口） | 上端**畫進上臂裡約 40px**（肘部重疊） |
| 6 | `hand_l.png` | 左手，放鬆張開 | 手腕**畫進袖口裡約 30px** |
| 7 | `arm_r_upper.png` | 右上臂 | 同 4 |
| 8 | `arm_r_fore.png` | 右前臂（彎肘） | 同 5 |
| 9 | `hand_r.png` | 右手，**握著的雪茄不要畫進去**，但手指保持握的形狀 | 同 6 |
| 10 | `cigar.png` | 雪茄本體（含菸灰） | 單獨一層，會跟著手動 |
| 11 | `cigar_ember.png` | 雪茄頭的橘紅火光（柔邊發光） | 單獨一層，會做明暗呼吸 |
| 12 | `scarf_l.png` | 左邊垂下的圍巾（含流蘇） | 上端**塞進領子後面**，整條畫完 |
| 13 | `scarf_r.png` | 右邊垂下的圍巾 | 同上 |
| 14 | `head.png` | 頭＋頭髮＋脖子 | 脖子**往下延伸約 60px 進領口**；下巴底下畫完整 |
| 15 | `head_blink.png` | 同一顆頭，**只有眼睛閉上**，其他一模一樣 | 與 14 同位置同大小，整張替換用 |
| 16 | `smoke_a.png` | 一團煙（柔邊、半透明灰白） | 約 160×160，畫布置中即可，**這張不用對位** |
| 17 | `smoke_b.png` | 另一團形狀不同的煙 | 同上 |

先交 1–17 做一般遊戲狀態。**免費遊戲／Don 兩個狀態先用打光處理**，
確定動作可以之後，再決定要不要重畫 `torso`（外套解開）一層就好。

---

## 4. 遮擋補畫：最重要的一節

分層後每一片會轉、會位移，**被蓋住的地方會露出來**。只要沒補畫，動起來就會看到破洞。

- `torso`：手臂、圍巾、頭後面的布料**全部畫出來**，不能留空白或透明。
- 每一段手臂都要**多畫一截塞進上一段裡**（上面表格寫的 px 數），兩端畫成圓弧，
  不要平切。
- `head` 的脖子一定要夠長，點頭 10° 時領口裡不能出現空隙。
- 關節重疊處**不要畫陰影**：陰影會跟著錯的那片移動。

---

## 5. 用生圖模型怎麼做（建議）

分開生 17 張「同一個人」很難一致。建議**拿現在的 `guy.png` 當參考圖，用 image-edit 一層一層拆**：

**身體（最難的一張）**
```
Using the reference image, output ONLY the man's torso: suit jacket, waistcoat,
shirt, tie, watch chain and pocket square, including the hips. REMOVE the head,
both arms and the white scarf, and PAINT IN the jacket fabric that was hidden
behind them so the torso is complete, with rounded full shoulders. Keep exactly
the same position, scale, lighting and painting style. Transparent background.
```

**手臂某一段**
```
Using the reference image, output ONLY the man's LEFT UPPER ARM (sleeve from
shoulder to elbow), isolated, in exactly the same position and scale.
Extend the top of the sleeve about 60px further INTO the shoulder than it is
visible, with a rounded end. Same lighting and style. Transparent background.
```

**閉眼頭**
```
Same head as the reference, identical in every way, only the eyes are closed
naturally. Same position, scale and lighting. Transparent background.
```

**煙**
```
A single soft wisp of cigar smoke, pale grey-white, semi-transparent, soft
airbrushed edges, no hard outline, isolated on transparent background.
```

負面提詞（每層都加）：
```
background, ground shadow, drop shadow, extra limbs, different face,
different suit, cropped, text, watermark
```

生完如果位置跑掉沒關係，**對齊到 `full.png` 就好**；我這邊會量每一層的對位誤差。

---

## 6. 交件

放在 `wp/apps/CapoNostra/design/cast_layers/`（**不要放 static/**，原始檔不出貨）：

```
design/cast_layers/full.png
design/cast_layers/leg_l.png … smoke_b.png   （共 17 張）
```

PNG-32、透明背景、1024×2048（煙兩張除外）。

## 7. 我收到之後會驗的東西

- 17 層疊回去跟 `full.png` 比，差異要小（對位錯的層會列出來）。
- 每個關節重疊量夠不夠：把該層轉到動作的最大角度，檢查有沒有露洞。
- `torso` 被遮住的區域有沒有透明洞。
- 雪茄／手、頭／閉眼頭是否同位置。

沒過的層我會列出來請你重生那一張，不用全部重來。
