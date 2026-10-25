# Don 立繪 v2 — 為「完美動作」重生的美術需求

> ⚠️ **2026-09-17 更正**：這份文件裡所有 `check_cast_motion.mjs` 的 fold / stretch 數字
> （32%、52%、1.88x…）都是在**手臂骨不在手臂上**的 rig 上量的——自動偵測把左手抓成肩膀、
> 右手抓成雪茄的煙，兩隻手臂分到自己骨頭的權重是 0，所以那些數字沒有在彎任何一隻手臂。
> 美術需求本身（手臂離身、自由垂掛物）仍然成立；數字請以 `design/build_cast_guy_rig.py`
> 綁定之後重量的結果為準（見 `ART_STATUS.md`）。


> 這份取代 `ART_BRIEF.md` §1 的人物段。理由：現行 `guy.png` 跑
> `inspect_art.py` 只拿到 `VERDICT: usable`，兩條關鍵指標不及格，
> 而 `check.py` 在反應幅度下 `REACTION FOLD 47% (floor 50%)` 失敗。
> 動作做不「完美」不是程式問題，是這張圖沒有給動作可用的空間。

---

## 0. 現行圖失敗在哪（量出來的，不是意見）

| 指標 | 現行 guy.png | 門檻 | |
|---|---|---|---|
| clear band（手臂離身的連續帶佔身高） | **19%** | 越接近 62% 越好 | ❌ |
| 自由垂掛物（完全離開軀幹輪廓的東西） | **無** | 至少一個 | ❌ |
| 手臂分離取樣 | 11 / 60 | ≥ 6 | ✅ |
| 色階 | 12360 | ≥ 200 | ✅ |
| soft alpha | 2.13% | ≥ 1% | ✅ |
| headroom 上 | 5% | ≥ 4% | ⚠ 擦邊 |
| 頸部橫向硬邊 | 35% of width | < 50% | ⚠ |

工具原話：

> nothing reaches clear of the torso. Body sway alone reads as subtle —
> the reference character gets most of its life from a mask tail at ±6.7 deg.

**關鍵事實**：這條管線的單關節上限只有 肩 5°／胸 7°／肘 16°／頸 19°。
幅度不來自關節，來自**自由垂掛物**和**根位移**。Don 身上沒有任何東西能甩，
所以他再怎麼綁都只會是「微微晃」。這就是退件評語 poor animation 的來源。

---

## 1. 姿勢（這一節決定成敗，比畫風重要）

**作廢**：`ART_BRIEF.md` 寫的「雙手交握身前或插口袋」。那個姿勢直接判死 clear band。

### 兩手不對稱，兩手都離開軀幹

```
角色右手（畫面左）  垂在身側，空手，手掌自然張開
                    ── 從腋下到指尖，全程與軀幹保持可見縫隙
                    ── 這條帶子要佔身高 55% 以上

角色左手（畫面右）  手肘微彎，前臂抬到腰腹高度，夾著雪茄
                    ── 往身體外側偏，**絕對不可橫過身前**
                    ── 橫過胸口 = 手臂把軀幹蓋掉 = clear band 歸零
```

縫隙寬度：在 1024×2048 的稿上，手臂與軀幹之間**最窄處不得少於 40px**。
不是「看得出有縫」，是網格要有頂點擠進去。

### 站姿

正面偏三七分，體重平均落兩腳，**全身含腳**，不可蹲坐、不可大幅側身、
轉頭不超過 15°、身體主軸離垂直不超過 5°。

腳要當支點釘住（`check.py` 限制腳位移 < 身高 0.15%），所以**不要畫地面投影**——
投影會跟著身體晃，看起來像人浮在地上。

---

## 2. 自由垂掛物 ⭐ 這次最重要的新增

背後沒有東西的部位**沒有幅度上限**。參考角色的生命感主力就是一條 ±6.7° 的尾巴。
Don 需要同一個東西，而且要符合「不拿武器、低調、兩個色相」的設定。

### 主件：白絲晚禮圍巾（primary，非有不可）

1930 年代晚宴正裝的絲質長圍巾，繞頸後兩端自然垂下到大腿高度。

- 骨白 `#E6DFD1`，深炭西裝上的最高明度 — 動起來一眼看得到
- **至少一端要完全離開軀幹輪廓**（往外側飄開，不要貼著胸口垂）
  離開的那一段長度 ≥ 身高 12%
- 兩端**不等長、不對稱**，末端帶流蘇或斜切
- 期別正確、不是武器、不吃色相額度（白是明度不是色相）

這條就是 Don 的「面具尾巴」。沒有它，這張圖重生也是白做。

### 副件：懷錶金鍊（secondary）

從馬甲口袋垂出一段**自由的弧**，不要貼著馬甲畫成一條線。
金 `#C9A227`，面積極小，符合「金靠稀有度發亮」。

### 副件：不扣釦的西裝外套

外套不扣，下擺兩片微微向外張開，讓下襬邊緣脫離大腿輪廓。
這同時解決 §4 的腰部硬邊問題。

### 不要用的

- 雪茄煙霧 — soft alpha 太低，`inspect_art.py` 讀不到它是 protrusion
- 領帶 — 貼在襯衫上，不是自由垂掛
- 任何武器、任何會被判成武器的東西

---

## 3. 造型（沿用 ART_BRIEF，這裡只列不變的）

50 多歲，厚實但非健身型，「坐了三十年談判桌」那種厚。
三件式深炭細直條紋西裝、馬甲、領帶夾、袖釦，襯衫骨白 `#E6DFD1`。
不笑不兇，「已經知道結果了」的平靜，眼神略微俯視玩家。

**色相上限兩個**：深炭/暖棕底 + 金重點。金面積 ≤ 15%。
雪茄火光用 `#E8D48B`／`#C9A227`，**絕對不可用 `#C1272D`** — 那個紅整款只留給
Tommy Gun 特殊 Wild，是全款唯一的警報色。

---

## 4. 不要畫的東西（`joint detail` 會抓）

網格在關節處剪力最大，**橫跨關節的硬直邊會被折成彎的，讀起來像關節斷掉**。
門檻是該處硬邊寬度 < 軀幹寬 50%，現行圖頸部已經到 35%。

| 位置 | 不要 | 改成 |
|---|---|---|
| 頸 | 硬挺的橫向領口線、水平領帶結 | 敞開的領片 + 圍巾斜向打斷 |
| 腰 | 橫貫全寬的皮帶／馬甲下緣 | 不扣的外套下擺遮斷中央 |
| 肘 | 袖口強對比橫帶、袖子接縫 | 連續布料明暗，無硬邊 |
| 膝 | 褲子橫向反摺線 | 垂墜褶，方向偏垂直 |

另外：**關節畫圓，不要畫尖角**。肩、肘、腕、髖的輪廓轉折圓一點，
`REACTION FOLD` 那 3% 的缺口有一半是從這裡補回來的。

---

## 5. 技術規格

| 項目 | 要求 |
|---|---|
| 生成尺寸 | **1024 × 2048** PNG-32，透明背景 |
| 出貨尺寸 | 降到 **512 × 1024**（rig 綁在出貨的那張上） |
| 人物佔畫面高 | **75–82%** |
| 四邊留白 | 各 ≥ 圖的 4%；**上方留 ≥ 60px（1024 稿）**，reaction 會拉到 1.11× |
| 邊緣 | 反鋸齒，**部分透明像素 ≥ 1%**；不可硬切邊 |
| 色階 | **≥ 200 色**；不可平塗、不可 posterise |
| 投影 | 無地面投影、無 cast shadow |
| 其他 | 單一角色、置中、無背景、無文字浮水印、道具不可觸框 |

**姿勢改了 = rig 必須重綁**（`build.py`），不能沿用現有的
`figure_box 134,86→403,887` / `plant_y 839`。那組數字是舊姿勢量出來的。

三種狀態（`guy.png` / `guy_feature.png` / `guy_don.png`）**必須同一個姿勢、
同一個 figure_box**，只換打光與外套開合，這樣一具 rig 撐三張。
先把一般遊戲那張做到過閘，再用它當底改另外兩張。

---

## 6. 提詞（英文，直接貼）

```
full-body illustration of a heavy-set Italian-American mafia boss in his
fifties, three-quarter view, standing upright, weight even on both feet,
calm unsmiling expression, looking slightly down at the viewer.

BOTH ARMS HELD CLEARLY AWAY FROM THE TORSO with a visible gap between each
arm and the body along their WHOLE length. His right arm hangs relaxed at his
side, hand open and empty. His left elbow is slightly bent, the forearm raised
to waist height and angled OUTWARD AWAY FROM THE BODY, fingers holding a lit
cigar. Neither arm crosses in front of the chest.

wearing a dark charcoal pinstripe three-piece suit, waistcoat, bone-white
dress shirt, suit jacket UNBUTTONED with the front panels hanging loose and
slightly open.

A LONG BONE-WHITE SILK EVENING SCARF is draped around his neck, both ends
hanging freely down to thigh height, one end swinging clearly OUT AND AWAY
from his silhouette against empty background, ends uneven in length.
A thin gold pocket watch chain hangs in a free loop from the waistcoat pocket.

soft anti-aliased edges, rich painterly shading with many colour steps,
semi-realistic rendering, warm single overhead light source, deep shadows,
restrained palette of dark charcoal brown with gold accents only,
clean readable silhouette, rounded shoulder and elbow and wrist contours.

transparent background, single character, centred, full body including feet,
generous empty margin on all four sides, no ground shadow, no cast shadow,
nothing touching the frame edge.
```

**負面提詞：**

```
hands in pockets, arms crossed, hands clasped, hands on hips, arms against
body, arm across chest, hands touching, holding a weapon, gun, tommy gun,
knife, baseball bat, flat vector, cel shading with hard edges, posterised,
limited palette, hard horizontal collar line, wide belt, sash across waist,
cropped limbs, cropped feet, tight crop, drop shadow, ground shadow,
background, scenery, multiple characters, text, watermark, bright red,
crimson, neon, cyberpunk glow, rainbow gradient
```

---

## 7. 驗收（生完先跑，不要直接綁）

```bash
SK=~/.claude/skills/hacksaw-character-motion     # 裝好之後
python $SK/rig/dekey.py guy_raw.jpg              # 沒有 alpha 才需要
python $SK/rig/inspect_art.py guy.png
```

**這幾行要到標才算過：**

```
limbs        N of 60 sampled heights show 3+ separate runs   ← N ≥ 6
             arms read as CLEAR of the body
             clear band spans N% of figure height            ← 目標 ≥ 55%（現行 19%）
protrusions  ... HELD OBJECT or free appendage               ← 至少一個（現行 0）
style        N distinct colours ... soft alpha N%            ← ≥ 200 色、≥ 1%
headroom     left / right / top / bottom                     ← 各 ≥ 4%
joint detail neck / waist / elbow / knee                     ← 全部 < 50%
```

`clear band` 或 `protrusions` 沒過就**重生，不要硬做**。
手臂貼著身體時硬切出來，等於要重畫被遮住的軀幹，那已經是路線 B 的工序。

過了之後：

```bash
python $SK/rig/build.py guy.png       # 產生 guy.rig.json 並自動跑閘
python $SK/rig/check.py guy.rig.json  # 要看到 all checks passed
python $SK/rig/preview.py guy.png --react 900
```

`check.py` 的 `REACTION FOLD` 必須 ≥ 50%（現行 47%）。
