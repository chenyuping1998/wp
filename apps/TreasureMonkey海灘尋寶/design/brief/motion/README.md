# 動作表說明（MG 阿寶叔、FG 小救共用）

`le_fisherman__smokey__base.motion-table.{json,ts}` 是 `hacksaw-character-motion/archetype/motion_table.py -c 8 --sides anatomical`
從 Le Fisherman 研究包量出來的**時序、幅度、比例**，不含關鍵幀曲線、網格、權重，可以進遊戲；研究包本身不出貨。

- 角度：度，y 向下，正值＝畫面順時針。`arm_l`／`fore_l`＝角色自己的左手＝**畫面右、握道具那隻**。
- `bones: {骨: [峰值角度, 起動延遲 ms]}`；`snap`／`hold`＝到峰值、離開峰值佔全長的比例；`rise`／`lean`＝身體抬升、側移（身高比例）。
- `extras`＝尾巴、帽繩相對自己父骨的峰值擺角；`swaps`＝參考在第幾 ms 換了哪個臉／手件（只取時間點，換件圖要自己畫）。

## 1. 遊戲事件 → 動作

| 遊戲事件 | 動作 | 長度 | 備註 |
|---|---|---:|---|
| 待機 | `idle` | 1067 ms 循環 | 握道具那隻手 ±9°、前臂 ±10°，尾巴 ±7° 落後 600 ms |
| 進場、FG 開場 | `welcome` | 2067 ms | 叉腰那隻手抬起揮手（600 ms 換「揮手」件） |
| 小獎 | `win_1` | 2067 ms | 433 ms 換「驚喜張嘴」 |
| 中獎 | `win_2` | 2900 ms | 身體抬升 0.28、驚喜＋開心嘴，尾巴甩到 20° |
| 大獎、觸發 FG | `win_3` | 3067 ms | 抬升 0.41；367–867 ms 換「往下握拳伸臂」件 |
| Scatter 期待、盤面高亮 | `reel_highlight` | 1967 ms | 不換臉，靠身體前傾與兩手收緊 |
| 期待落空 | `loosing_1`／`loosing_2` 輪流 | 2833 ms | 200 ms 驚訝 → 767 ms 生氣；`loosing_2` 握道具的手甩到 119°（要縮，見 §3） |
| FG 結算慶祝 | `dance_start` → `dance`／`dance_long` → `dance_end` | 0.5 / 2–3 / 0.53 s | 733–1567 ms 閉眼陶醉 |
| 尋寶演出（掃描 → 挖） | `fishing_start` → `fishing_idle` 循環 → `fishing_end_hit`／`fishing_end_fail` | 2.1 s / 0.83 s / 1.67 s / 1.87 s | MG 是探測器掃沙、嗶嗶響；FG 是鏟子插沙。命中＝挖到金幣，落空＝瓶蓋 |
| （不用） | `lost_mustache` | 7433 ms | 太長、換件太多；要搞笑大失敗另外設計 |

分級照 `LADDER`（trigger 1／winBig 0.75／win 0.5）是設計值；這裡三級有各自量好的動作，優先用各自的表。

## 2. 要多交的換件（兩隻各一套）

參考的表情靠換件，不靠網格。下面這些另外畫成同畫布、同位置的圖層，交件時放 `cast_parts/<角色>/swap/`：

| 換件 | 用在 | 說明 |
|---|---|---|
| `face_surprise` | win_1–3、loosing、掃描開始、命中 | 眉毛高挑、嘴張成 O |
| `mouth_happy` | win_2、win_3 | 大笑露齒，疊在驚喜臉上 |
| `face_angry` | loosing、掃描開始（專注） | 眉頭下壓、咬牙 |
| `eyes_closed` | dance、落空 | 閉眼弧線 |
| `hand_wave` | welcome | 叉腰那隻手張開的手掌，取代原本的手 |
| `arm_punch_down` | win_3 | 握道具那隻手放開道具、往下握拳的整隻手臂 |
| `arm_reach` | 掃描開始 | 握道具那隻手伸直的整隻手臂（把道具往前推出去） |
| `hand_grip_button` | 掃描循環 | 叉腰那隻手改成扶住探測器（FG：扶鏟柄）的手 |

參考在 welcome、win_1、loosing 會冒出寫字的對話框；**這款不用字**，改成無字圖示泡泡（驚嘆號、金幣、烏雲），
避開擬聲字和受限字的問題。

## 3. 一定要縮的幅度

參考裡有幾段是**換手件＋大角度**的演出，直接套在我們的 10 骨網格上一定撕裂：

| 動作 | 參考值 | 處理 |
|---|---|---|
| `fishing_start` 握道具的上臂 | 217.8° | 參考是整隻手甩過頭拋竿；探測器只要往前推，改成 `arm_reach` 換件＋上臂 ≤ 60° |
| `fishing_end_fail` 握道具的上臂 | −191.8° | 同上，改成換件＋≤ 60° |
| `fishing_end_hit` 骨盆 −85°、頭 70°、側移 −2.29、尾巴 91° | 參考是被魚拖出畫面的搞笑段 | **重新設計**：命中改成往後一坐、舉起金幣；骨盆 ≤ 10°、側移 ≤ 0.05 |
| `loosing_2` 握道具的上臂 | 119° | 縮到 ≤ 60°，整組等比例縮 |
| `welcome` 叉腰手的前臂 | −218.9° | 前臂翻上來揮手靠 `hand_wave` 換件；網格只轉 ≤ 70° |

照 `archetype/README.md` 的規矩：squash 的 k 從 0.42 起，用 `check_layered_cast.mjs` 往上找；撐不住時**整組縮小**，不要只砍一根。
