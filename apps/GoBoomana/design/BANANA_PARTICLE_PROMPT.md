# 噴發香蕉粒子 — AI 生圖提示詞

用途：取代得分／大獎報獎時噴出的日圓硬幣粒子（`static/assets/sprites/coin/SD2_Coin.png`，
柴犬五円硬幣，模板遺留資產）。

參考對象是 `w.png` 裡大猩猩**嘴上叼的那根香蕉**——不是帽子上那根（那根偏暗綠、被陰影蓋住，
不適合當粒子）。

---

## 取樣到的實際顏色

| 部位 | 色值 |
|---|---|
| 主體亮面 | `#f6b115` |
| 稜脊高光 | `#fef1b1` |
| 中間調 | `#de9803` |
| 暗部 | `#854b01` |
| 描邊／最深陰影 | `#6b390b` |

**重點：是飽和的金琥珀色，不是淡黃色。** 一般 AI 生「banana」預設會給偏淡的
香蕉黃，必須明確指定。

---

## 主提示詞（英文，直接貼）

```
A single ripe banana, unpeeled, crescent-curved, isolated on a fully
transparent background.

Style: painted stylised game art, comic-realist — the same treatment as a
premium slot-machine symbol. Bold dark-brown outline (#6b390b), clean
readable silhouette, no photographic texture.

Colour: rich saturated golden amber (#f6b115) as the body, deep amber shadow
along the underside (#854b01), and a pale cream specular highlight running
the length of the upper ridge (#fef1b1). Glossy, almost lacquered finish.
NOT pale yellow — this is a deep golden banana.

Form: the banana's natural facets are visible as soft ridge lines down its
length, with a brighter top plane and a darker underside. Short dark-brown
stem at one end and a small dark tip at the other.

Lighting: single key light from the upper left, strong specular sheen on the
top edge, soft ambient fill underneath.

Framing: one object only, centred, entire banana inside the frame with a
small margin, no cropping at the edges. Square canvas.
```

## 負面提示詞

```
bunch of bananas, multiple bananas, peeled banana, banana peel, hands,
holding, monkey, gorilla, character, text, watermark, logo, background,
scenery, ground shadow, drop shadow, plate, frame, border, tile, sparkle,
star, lens flare, photorealistic, 3d render, low contrast, pale yellow,
washed out
```

> `sparkle` / `star` 特別要排除：原圖那根香蕉上有一顆四角星閃光，那是符號的裝飾。
> 粒子會**自轉**，烘在圖上的閃光跟著轉會很怪。

---

## 需要幾張、什麼角度

粒子系統會把整張圖集交給發射器，**每顆粒子隨機取一格再自轉**。所以你要的是
**同一根香蕉的不同立體角度**，不是不同的香蕉。

建議 **10 格**，在主提示詞後面接一句視角描述：

| # | 追加句 |
|---|---|
| 1 | `side view, banana lying horizontally, curve opening downward` |
| 2 | `side view, curve opening upward` |
| 3 | `three-quarter view, tilted 30 degrees toward the viewer` |
| 4 | `three-quarter view, tilted 30 degrees away from the viewer` |
| 5 | `viewed end-on at a slight angle, foreshortened, stem tip toward the viewer` |
| 6 | `viewed from slightly above, curve opening left` |
| 7 | `viewed from slightly below, curve opening right` |
| 8 | `steep three-quarter view, strongly foreshortened` |
| 9 | `near end-on, almost pointing at the viewer, heavily foreshortened` |
| 10 | `side view, curve opening downward, rotated 45 degrees` |

角度分散是關鍵——十張都是側面的話，噴出來會像同一張圖在轉，看不出立體感。

---

## 交付規格

| 項目 | 規格 |
|---|---|
| 尺寸 | **512×512**，正方形 |
| 背景 | **全透明 PNG**。若工具只能出純色背景，用**純黑或純洋紅**，我這邊去背 |
| 命名 | `banana_01.png` … `banana_10.png` |
| 放置 | `design/source/banana_particles/` |
| 主體佔比 | 約畫面 80%，四邊留一點邊避免被裁 |

丟進去之後我會打包成 TexturePacker 格式的圖集接上粒子系統。

---

## 一個實務提醒

粒子在畫面上很小而且高速旋轉，所以**輪廓和明暗對比比細節重要**。如果生出來的圖
細節很漂亮但整體偏暗、或跟背景對比不夠，縮到粒子尺寸就會糊成一團黃點。

驗收方法：把圖縮到 **48px** 看還認不認得出是香蕉。認不出就要加大明暗對比、
加粗描邊。
