# 封面圖（store thumbnail）生成規格與提示詞

Go Bananas 100 · `Thumbnail_GoBananas100.png`

---

## 0. 先讀這一條，它讓一代被退過件

Stake 審核第 6 輪對 Go Bananas 的原文：

> "The main character in the cover image does not follow the Stake artwork
> guidelines. The character extends from edge to edge, which should not be the
> case."

**角色必須完整地待在安全區內，四邊都要有留白。會出血到邊緣的是背景，不是角色。**

這是唯一一條「畫得再好也會被打回來」的規則，所以它排在所有美術考量前面。

---

## 1. 交付格式

| 項目 | 規格 |
|---|---|
| 最終尺寸 | **408 × 546**（Stake 規定，其他九款都是這個尺寸） |
| 生成尺寸 | **3:4 直式，1224 × 1638**（正好 3 倍）。模型不支援任意尺寸就用 1024 × 1365，比例差 0.4%，可接受 |
| 格式 | PNG，**完全不透明**，背景出血到四邊 |
| 文字 | **圖上不可有任何文字**。標題和「SILVER STARS」是事後疊上去的 |

比例 408/546 = 0.747，3:4 = 0.75。

---

## 2. 版面分區（以 1224 × 1638 生成尺寸計）

```
┌──────────────────────────────┐  y=0
│        （背景出血區）         │
│   ┌──────────────────────┐   │  y=82   ← 角色不可越過此線（上緣 5%）
│   │                      │   │
│   │    KEY FOCUS AREA    │   │
│   │      主體區域         │   │
│   │   角色完整放在這裡     │   │
│   │                      │   │
│   └──────────────────────┘   │  y≈900
│  x=86              x=1138    │         ← 角色不可越過此二線（左右各 7%）
│                              │
│      標題疊字區（下 45%）      │
│   這一段要暗、要空、要單純      │
│                              │
└──────────────────────────────┘  y=1638
```

- **左右各留 7%**（1224 × 0.07 ≈ 86px）
- **上緣留 5%**（1638 × 0.05 ≈ 82px）
- **下方 45% 是疊字區**：`GO BANANAS 100` 三行字加副標會壓在這裡。這一段要**明顯壓暗、細節要少**，不要有高對比的圖案或亮色塊跟字搶。
- 角色的**腳可以被下方疊字區蓋住**，但不要在畫面裡被硬切斷——讓它自然沒入陰影或前景植被。

---

## 3. 角色（必須跟遊戲內一致）

主體是遊戲裡那隻**大猩猩士兵**，遊戲中的美術特徵要全部保留：

- **橄欖綠貝雷帽**，帽徽是一根金香蕉
- **飛行員式墨鏡**，琥珀色鏡片
- **橘色頸巾**
- **橄欖綠戰術背心**，前方有彈匣袋、口袋、扣具
- **迷彩長褲＋護膝＋軍靴**
- **嘴上叼著一根金黃色香蕉**
- 體型厚重、肩膀寬、手臂是濃密的深棕色毛

姿勢：**正面站姿，雙手自然垂放或微微握拳**，重心穩、下巴微收——是一個守著門口的哨兵，不是在擺姿勢。

---

## 4. 場景

叢林中的**古代石造神廟門洞**，猩猩站在門洞正中央。

- 兩側是覆滿藤蔓與苔蘚的**石柱／浮雕壁面**，往畫面外延伸（這部分負責出血到邊緣）
- 背後是**暖色的逆光**：夕陽或神廟深處的光，從角色背後打過來形成剪影邊光
- 地面是**石板階梯**，有落葉和碎石
- 空氣中有**懸浮的塵埃／花粉顆粒**被光照亮
- 上方可以有垂落的藤蔓當前景框

---

## 5. 色彩與光線

| 區域 | 色彩 |
|---|---|
| 主光 | 暖橘／琥珀，從角色背後 |
| 角色 | 橄欖綠、卡其、深棕毛髮、金香蕉是全圖最亮的暖點 |
| 石材 | 灰褐、青苔綠、風化的赭色 |
| 陰影 | 深綠偏藍，不要純黑 |
| **下方 45%** | **明顯壓暗**，往深綠／深褐收，讓白色標題壓得住 |

整體要跟遊戲內的叢林軍事調性一致：**溫暖、飽和、髒舊的軍綠加金色**。

---

## 6. 提示詞（直接貼給 AI）

### 正向

```
Vertical 3:4 game cover art, no text.

A heavy-set gorilla soldier standing centred in the doorway of an ancient
overgrown jungle temple, seen from the front, full body, feet on worn stone
steps. He wears an olive-green beret with a small golden banana badge, amber
aviator sunglasses, an orange neck scarf, and an olive tactical vest with
magazine pouches; camouflage trousers, knee pads and combat boots. Thick dark
brown fur on his arms and shoulders. A ripe golden banana held in his mouth.
Calm, grounded sentry pose, arms relaxed at his sides.

Behind him, warm amber backlight pours out of the temple interior, throwing a
bright rim light along his shoulders and beret. Flanking him, vine-covered
carved stone pillars and mossy relief walls run out past the edges of the frame.
Floating dust and pollen catch the light. Fallen leaves and rubble on the steps.
Hanging vines framing the top of the frame.

Painted illustration, rich saturated colour, cinematic backlight, warm amber and
olive green palette, weathered stone and moss, soft volumetric haze, high
detail, dramatic but friendly, mobile game cover art style.

Composition: the gorilla is COMPLETE inside the frame with clear empty margin on
the left, right and top — he must not touch or cross any edge. The bottom 45% of
the image is dark, simple and uncluttered, fading into deep green shadow, with
no bright shapes or detail there.
```

### 負向

```
text, letters, words, logo, watermark, signature, numbers, UI, buttons, frames,
borders, playing cards, poker chips, dice, slot machine, coins, money, currency
symbols, jackpot, casino, character cropped at the edge, character touching the
frame edge, close-up, portrait crop, cluttered bottom, bright bottom, busy
foreground, multiple characters, transparent background, blurry, low detail,
photo, 3d render
```

**負向裡的博弈類詞是必要的**：這款有 social 版本，畫面上不能出現任何賭博物件或金額。

---

## 7. 產出後自己先檢查

- [ ] 猩猩**四邊都碰不到畫面邊緣**，左右各留約 7%、上方約 5%
- [ ] 圖上**沒有任何文字**
- [ ] 背景**滿版出血**，沒有透明、沒有白邊
- [ ] 下方 45% 夠暗、夠空，白字壓上去讀得到
- [ ] 沒有撲克、籌碼、金幣、金額、賭場元素
- [ ] 角色特徵對得上遊戲內：貝雷帽＋香蕉徽章、琥珀墨鏡、橘頸巾、戰術背心、嘴叼香蕉

---

## 8. 目前的狀況

現在 repo 裡的是 **一代的封面**，直接複製過來沒有換：

```
apps/GoBananas100/Thumbnail_GoBananas.png       408×546
apps/GoBananas100/Thumbnail_GoBananas.orig.png
```

檔名是 `GoBananas` 不是 `GoBananas100`，圖上寫「GO BANANAS」沒有 100，猴子也是舊的角色設計。**送審前一定要換掉。**

圖生好交給我，我會：

1. 疊上「GO BANANAS 100」與「SILVER STARS」
2. 輸出成 `Thumbnail_GoBananas100.png`（408×546）
3. 照 SoulSeal 的做法補 `check_thumbnail.mjs`，把尺寸／不透明的驗證接進 build——這個資產不在 web build 裡，出錯是**靜默的**，沒有守門就只會在審核時才發現
