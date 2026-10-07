# Go Bananas 100 — 「Out of the Woods」畫風獎圖生圖提示詞

程序化版本（`generate_symbols_pp.mjs`）已經對到構圖、框、配色和字的造型，
但**手繪墨線和彩繪筆觸用 SVG 做不出來**。要做到跟參考圖幾乎一樣，
照這份文件去生圖，再用 `slice_symbol_sheet.mjs` 切圖。

## 畫風規則（每一段 prompt 都要帶）

```
modern American TV-cartoon illustration, slot game symbol, clean confident dark-brown
ink linework with slight line-weight variation, painted cel shading (flat base + one
hard-edged shadow + soft painted gradient), strong colored rim light on the shadow side,
subtle brush grain texture, saturated but not neon palette, high detail, crisp edges,
centered, no text, no watermark
```

不要：`3D render, photorealistic, anime, chibi, thick black comic outline, halftone dots, glossy plastic`

## 高賠 h1–h4：彩色木板框卡片

共同段落：

```
square card, frame made of four thick painted wooden planks overlapping at the corners,
visible wood grain, chipped paint, small metal nails at each corner and mid-plank,
inside the frame a dark moody jungle background with glowing colored light behind the
subject, subject fills about 80% of the card
```

| 檔名 | 框色 | 主體 |
|---|---|---|
| `h1` | **紅** | olive-green steel army helmet with aviator goggles pushed up on top, big bevelled red star on the front, leather chin strap with brass buckle, warm orange rim light |
| `h2` | **綠** | pineapple-shaped hand grenade, segmented green body, silver pull ring and lever, lush pineapple leaves on top, yellow-green rim light |
| `h3` | **琥珀** | half-open wooden ammo crate overflowing with a bunch of yellow bananas, dark iron corner brackets, stenciled word "AMMO" on the side, warm golden rim light |
| `h4` | **青藍** | open steel pocket compass (no brass or gold on the case), glowing teal dial, compass rose with N E S W, red and gold needle, glass reflection, cyan rim light |

## 低賠 l1–l5：無框圓胖字＋道具

共同段落：

```
single chunky rounded display letter, thick dark outline, extruded bottom edge for depth,
glossy highlight on the top half, the letter is combined with a small themed prop,
transparent background, no frame
```

| 檔名 | 字 | 字色 | 道具 |
|---|---|---|---|
| `l1` | A | 紫 | a row of brass bullets on a canvas ammo belt at its feet |
| `l2` | K | 橘 | military dog tags on a ball chain hanging from its arm |
| `l3` | Q | 金黃 | big jungle leaves behind the base (tail must stay visible) |
| `l4` | J | 藍 | a coiled rope next to it |
| `l5` | 10 | 紅 | a stack of burlap sandbags underneath |

> **跟 GEN2_ART_SPEC.md 的衝突**：該規格要求 l1–l5 全部無彩冷灰；參考畫風是每個字一個
> 飽和色。這份照參考畫風走，色相避開了 h 的四個框色以外能避的部分，但 A 紫／K 橘／10 紅
> 仍會跟 h 框色相近——靠「有框 vs 無框」分高低賠。

## 交付

- 高賠：正方、≥1024px；框外透明或一起切掉都可以
- 低賠：正方、≥1024px、**透明背景**
- 一張聯絡表出的話**每格等高**（見 GEN2_ART_SPEC.md 開頭的切圖說明）
- 參考用的程序化版本在 `design/source/pp_symbols/`，構圖和比例可以直接當草稿餵給生圖
