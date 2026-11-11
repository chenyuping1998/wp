# Deadwood Express — FG 角色：面紗女乘客（全身）需求單（2026-09-26）

免費遊戲時，盤面右邊的人物從列車長換成**面紗女乘客**（H2 符號那位）。
H2 的圖只有胸像，站在盤面旁邊需要**一張全身站姿圖**。

綁法和列車長一樣：**一張全身圖＋網格骨架**（`design/deadwood_rig.py` 那條路），
所以這張圖要能讓手臂、面紗單獨動起來 —— 下面「手臂離開身體」那條是硬性要求。

## 一定要附的參考圖（生圖時一起上傳）

1. `static/assets/deadwood/symbol_H2.png` —— **同一個人**：臉、灰白捲髮、黑色喪服高領、玫瑰帽飾、浮雕胸針、紫丁香半透明面紗
2. `static/assets/deadwood/conductor.png` —— **同一種畫法、同樣的比例與光**（她要跟他站在同一個位置）
3. `static/assets/deadwood/background_feature.png` —— FG 背景，確認她放上去不突兀

## 規格

| 項目 | 要求 | 為什麼 |
|---|---|---|
| 尺寸 | **1024×1536** 直幅 | 跟列車長同畫布，遊戲裡的擺放數字可以沿用 |
| 背景 | **純洋紅 `#FF00FF` 平塗** | 跟符號同一套去背；面紗半透明也能保留 |
| 人物大小 | 頭頂到腳底約佔畫面高度 **82%**，四邊各留 **≥ 5%** | 反應動作會把肢體拉到 1.1 倍以上，貼邊就沒地方伸（列車長只留 2–3%，偏緊）|
| 全身 | 含**雙腳**、站直、重心平均 | 腳是固定支點 |
| 朝向 | 身體 3/4 **朝畫面左邊**（她站在盤面右側，要面向盤面） | 跟列車長一樣看向盤面 |
| **手臂** | **兩隻手臂整條都離開身體和裙子，中間看得到背景**；手肘微彎、手張開、不碰身體也不互碰 | 網格骨架靠這個才能讓手動；貼著身體就只能整塊晃 |
| 自由垂掛物 | **長面紗**從帽子垂到腰下、邊緣離開身體輪廓；可再加一條手上垂下的蕾絲手帕 | 待機時的生命感主要來自垂掛物的擺動 |
| 光 | 左上方單一冷月光，霧面；**不要**發光、光暈、邊緣光 | 跟列車長一致；光效由程式加 |
| 禁止 | 文字、地面陰影、投影、背景場景、道具碰到畫面邊 | |

## 提詞（英文，直接貼）

```
Full-body character illustration for a slot game, the SAME woman as the attached
"symbol_H2" portrait: a Victorian widow ghost passenger, pale grey skin, calm sad
expression, grey-white curled hair, black lace mourning dress with high collar,
small black hat with a dark rose, cameo brooch, and a long translucent lilac
(#b08ae0) lace veil.

Standing upright on a flat surface, full body including both feet, weight evenly on
both feet, body turned three-quarters toward the LEFT side of the image.

ARMS HELD CLEARLY AWAY FROM THE TORSO AND THE SKIRT with visible background between
each arm and the body along their whole length, elbows slightly bent, hands open and
not touching the body or each other. One hand holds a small lace handkerchief that
hangs down freely.

The veil hangs long from the hat to below the waist and flows away from the body
outline on one side, clearly separated from the silhouette.

Match the painting style of the attached conductor reference exactly: matte painterly
semi-realistic illustration, same scale of detail, same dark palette of charcoal and
muted grey-teal, single soft cool moonlight from the upper left. Soft anti-aliased
edges, rich shading with many colour steps.

Single character centred on a perfectly flat solid magenta #FF00FF background, figure
height about 82% of the image, generous empty margin on all four sides, no ground
shadow, no cast shadow, no scenery.
```

**負面提詞：**

```
hands clasped, hands folded, arms against body, arms crossed, hands on hips, arms
behind back, hands hidden in the veil or skirt, cropped feet, tight crop, glow,
bloom, rim light, sparkles, glossy, 3D render, text, letters, watermark, background,
scenery, ground shadow, multiple characters
```

## 交件

- 檔名：`design/_incoming/passenger.png`（多生 2–3 張可以放 `passenger_2.png`、`passenger_3.png` 讓我挑）
- 1024×1536、洋紅背景

## 我收到後做的事

1. 去背（跟 H2 同一套，面紗保留半透明）
2. `inspect_art.py` 驗收：手臂分離 ≥ 6/60、色階 ≥ 200、四邊留白 ≥ 4%；沒過就請你重生，不硬做
3. 照 `deadwood_rig.py` 做她自己的骨架（手臂路徑量她這張圖）、跑網格閘門
4. `Cast.svelte`：主遊戲列車長、FG 換成她；Storybook 實際看待機、中獎、觸發三種反應
