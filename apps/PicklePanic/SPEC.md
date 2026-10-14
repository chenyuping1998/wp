# Pickle Panic — 已確認規格

2026-10-12。使用者指定 Sushi Monkey 來源、美式酸黃瓜人物；已選 Pickle Panic、粗墨線美式漫畫、玩法沿用，兩位角色均選自有 #7 自然垂手骨架。

| 項目 | Sushi Monkey | Pickle Panic |
|---|---|---|
| 工程 | wp-banandit/apps/SushiMonkey | wp-banandit/apps/PicklePanic |
| 數學 | math-sdk/games/SushiMonkey | math-sdk/games/PicklePanic |
| 盤面／Ways | 5×4／1,024 Ways | 沿用 |
| paytable、轉輪、收集 | 每隻 W 收集全盤 P，固定 ×1 | 沿用；W 酸黃瓜小廚師、P 醃漬罐 |
| FG 升級 | 4／8／12 W 各 +10 轉，依序將整種 10／J／Q 換成 P | 沿用；拍碎餐館菜單演出 |
| Scatter | 主遊戲 3／4／5 S → 10／12／15 轉；FG 無 Scatter | 沿用 |
| 買入 | 100×／150×、各10轉；高階起始計數4、10已換P，不重複加轉 | 沿用 |
| 封頂 | 10,000× | 沿用 |
| RTP | 三模式96.02% | 三模式目標96.00%；原始 LUT 重加權後量測 |
| 世界 | 壽司店 | 科幻迷幻醃漬實驗站，保留美式餐館道具；彎曲管線、巨型醃漬槽與怪異星空 |
| 角色 | 兩位猴子師傅 | MG 酸黃瓜店長／FG 辣味酸黃瓜女廚師，兩位不同角色 |
| 色彩 | 米灰線稿 | 綠色前景角色；背景淡紫／冰藍、遠端少量粉紅，角色身後留亮色安靜區 |

collect／banditMeter／sacks 事件名稱保留相容協定。正式資產與 QA 完成後暫存到 `/Users/stone/stake-engine/upload/PicklePanic/`；平台尚未更新。

2026-10-12 風格修訂：使用者要求背景不只是美式快餐店，要有科幻迷幻元素；人物與背景不得因配色或輪廓堆疊而難分辨。此規則涵蓋後續MG／FG、UI、縮圖及封面。

2026-10-12 第三版方向：使用者要求再粗獷、避免AI感；採更重的不均墨線、大黑影、誇張不對稱造型與少色平塗，保持冷背景／綠角色分離。
