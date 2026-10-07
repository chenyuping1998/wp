# 生角色圖的提詞：要套上抄錄的動作，圖該長什麼樣

抄了四款之後，我們手上有**兩套完全不同的角色動態**，而它們對圖的要求是**相反的**。
選錯路線，生出來的圖再漂亮也套不上。

這份給的是可以直接貼進圖像模型的提詞，兩條路線各一套。

---

## 先選路線（這一步決定其他所有事）

| | **A ｜ 一張圖路線** | **B ｜ 切件路線** |
|---|---|---|
| 對應抄錄 | Miami Mayhem 角色 | **Le Bandit 浣熊** |
| 工具 | 我們的 `rig/`（`character-rig.zip`）| Spine（或等效） |
| 要幾張圖 | **1 張** | **15–25 張** |
| 頂點多重綁定 | 86% | **21%** |
| 能做 | 呼吸、搖晃、1 秒的小反應 | 21 段演出：生氣、丟帽子、鬍子掉、打招呼 |
| 不能做 | 任何要露出被遮住部分的動作 | —（幾乎沒限制）|
| 關節上限 | **肩 5°、胸 7°、肘 16°、頸 19°**，拉伸 1.11× | 沒有實際上限（實測用到 ±42°、180°）|
| 接縫風險 | **零**（結構上不可能）| 高，靠畫風壓住 |
| 美術工時 | 生一張就好 | 要切、要補畫遮擋、要畫替身 |

### 一句話判斷

> **你要角色「活著」→ A。你要角色「演戲」→ B。**

中間沒有折衷。A 做不出 Le Bandit 那 21 段裡的任何一段；
B 需要的美術工序是實打實的，沒有捷徑。

---

# 路線 A ｜ 一張圖

目標：生一張圖，丟進 `rig/build.py` 就能動，而且 `rig/check.py` 會過。

## A-1 提詞（英文，直接貼）

```
full-body character illustration of a <YOUR CHARACTER>, standing upright,
facing the viewer, three-quarter view, weight evenly on both feet.

ARMS HELD CLEARLY AWAY FROM THE TORSO with visible daylight between each arm
and the body along their whole length, elbows slightly bent, hands open and
not touching the body or each other.

wearing / carrying something that hangs freely: <a long scarf / an open coat /
a long braid / a loose sash>, clearly separated from the silhouette.

soft anti-aliased edges, rich shading with many colour steps, painterly or
semi-realistic rendering, clean readable silhouette.

transparent background, single character, centred, full body including feet,
generous empty margin on all four sides, no ground shadow, no cast shadow,
no props touching the frame edge.
```

**負面提詞：**

```
hands in pockets, arms crossed, hands on hips, arms against body, arms behind
back, hands clasped, flat vector, cel shading with hard edges, posterised,
limited palette, cropped limbs, cropped feet, tight crop, drop shadow,
background, scenery, multiple characters, text, watermark
```

**輸出設定**：透明 PNG、**直幅約 2:3 或 1:2**（例如 1024×2048）、角色高度佔畫面 75–85%。

## A-2 為什麼每一條都在那裡

| 提詞裡的要求 | 對應的量測 |
|---|---|
| **手臂離開身體、全程有空隙** | `inspect_art.py` 要 60 條取樣高度裡**至少 6 條**看得到三段輪廓。Hot Miami 那兩隻角色是 **0/60 和 2/60**，所以它們只能做軀幹搖晃＋頭，做不了手臂 |
| 手臂**整條**都要分開 | 參考的手臂圖從肩畫到指尖，**佔身高 62%**。分離的帶越短，骨頭能動的段就越短 |
| 有東西**自由垂掛** | 背後沒有東西的部位**沒有幅度上限**。參考角色的生命感主力是面具尾巴 ±6.7° 與頭髮 27.5° |
| 反鋸齒邊、多色階 | 顏色少於 **200 色** = 平塗無反鋸齒，網格一轉就有階梯感；部分透明像素少於 **1%** = 硬切邊，轉起來邊緣會爬 |
| 四邊留白 | reaction 會把肢體拉到 **1.11×**、道具甩出去。貼著邊的圖沒地方伸 |
| 全身含腳、不要投影 | 腳要當支點釘住（`check.py` 限制腳位移 < 身高 0.15%）；地面投影會跟著身體一起晃，看起來很怪 |
| 站直、不要傾斜 | 傾斜超過 **20°**，自動骨鏈會斜穿過身體，要手動擺骨 |

## A-3 生完先驗收

```bash
python rig/inspect_art.py your_character.png
```

**要看到這幾行才算過：**

```
limbs        N of 60 sampled heights show 3+ separate runs      ← N ≥ 6
             arms read as CLEAR of the body
             clear band spans N% of figure height               ← 越接近 62% 越好
protrusions  ... HELD OBJECT or free appendage                  ← 至少要有一個
style        N distinct colours, ... soft alpha N%              ← 色 ≥ 200、soft ≥ 1%
headroom     left N  right N  top N  bottom N                   ← 各邊 ≥ 圖的 4%
joint detail neck / waist / elbow / knee ... N% of width         ← 都低於 50%
```

**最常見的失敗是手臂那條。** 沒過就重生，不要硬做 ——
手臂貼著身體時把它切出來，等於要重畫身體被遮住的部分，那已經是路線 B 的工序了。

`joint detail` 那條是在抓**橫跨關節的硬邊**（腰帶、衣領、下擺、橫條紋）。
網格在那裡剪力最大，一條直線會被折成彎的，讀起來像關節斷掉。
超過 50% 就把那個元素往上或往下挪幾個百分點。

---

# 路線 B ｜ 切件

目標：做出能跑 Le Bandit 那 21 段演出的一套零件。

> **要完全照浣熊的動作複製到你的角色上，照 [`motion-library.md`](motion-library.md) 的浣熊那節做**
> （`python spineplay/motionlib.py -c 6 --guide --out 零件指引/`）—— 那邊的零件清單、每個零件的
> 輪廓範本、`--checkart` 檢查都是從骨架實測、而且驗證過的。這份是早期從骨架反推的設計筆記，
> 當背景知識讀；兩邊說法不一樣時以動作庫為準。

## B-0 先定規格，再生圖

**不要先生一張完稿再想怎麼切。** 切出來的遮擋部分要自己補畫，比重生貴。
順序是：定姿勢 → 定分層 → **每層單獨生**。

比例（從 Le Bandit 骨架反推，總高 100）：

```
帽頂 ─────  100
頭頂 ─────   76        ← 頭 + 帽子佔 24%
胸  ─────   52        ← 頭佔 24%
髖  ─────   29
膝  ─────   26        ← 髖到膝只有 3%（腿極短）
地面 ─────    0        ← 膝到地 26%
```

**大頭短腿。** 頭部圖是身體圖的 78% 寬。這不是風格偏好，是**動畫需求** ——
21 段裡的情緒 80% 靠頭、耳朵、鬍子演，頭小了讀不到。

## B-1 主體提詞

```
full-body mascot illustration of a <YOUR CHARACTER>, three-quarter view facing
LEFT, standing, cartoon proportions with a LARGE HEAD (about one quarter of
total height) and SHORT LEGS.

ASYMMETRIC ARMS: one arm raised in front of the chest holding <A PROP>, the
other arm hanging relaxed at the side and EMPTY, hand open.

BOLD BLACK OUTLINES, flat cel shading, ROUNDED shoulder / elbow / wrist / hip
joints, simple readable shapes.

must have: a distinctive removable hat, a swinging appendage (tail / long
braid / scarf), prominent ears or equivalent movable protrusions, and a
distinct facial feature that could fall off (moustache / monocle / bushy
eyebrows).

transparent background, single character, no ground shadow, no scenery.
```

**負面提詞：**

```
symmetric pose, both arms down, both hands holding something, arms crossed,
hands on hips, realistic proportions, small head, long legs, thin line art,
no outline, soft airbrush shading, gradient mesh, sharp angular joints,
background, ground shadow, multiple characters, text
```

### 兩手一定要不對稱

setup pose 實測：

```
左臂（遠側）  肩(+14,+134) → 肘(+149,+217) → 手(+231, +93)   抬起、握著撬棍
右臂（近側）  肩(−236,+54) → 肘(−380, +12) → 手(−345,−118)   垂下、空手
```

**一隻拿東西、一隻空著。** 21 段動畫裡，拿東西那隻演道具，
空的那隻摸臉、丟帽子、打招呼。**雙手對稱或雙手都握東西，一半的動畫做不出來。**

## B-2 分層清單：每一層單獨生

同畫風、同角度、透明背景，一次生一個。

**必要（沒有就做不出對應動畫）：**

```
1  身體（肩窩與髖部畫完整，含手臂與尾巴會蓋住的部分）
2  頭 ─ 預設表情
3  左臂        4  右臂        5  左手        6  右手
7  尾巴 / 辮子（根部塞進身體裡）
8  左耳        9  右耳
10 帽子（整頂畫完，會被丟出去時全部可見）
11 鬍子 / 可掉落的臉部特徵（整撮畫完）
12 眼睛        13 瞳孔（單獨一層，要能追東西）
14 鞋 / 腳
```

**表情替換（同尺寸、同錨點，整張換不是拼五官）：**

```
15 生氣的臉    16 驚訝的臉
17 開心的嘴    18 哼的嘴    19 壞笑的嘴
```

**手臂替身（同一隻手的不同姿勢）：**

```
20 打招呼抬起的手
21 摸臉的手 + 前臂
22 伸長的手臂
```

每層的提詞就是在主體提詞後面接一句，例如：

```
...(同樣的畫風句子)... ONLY the character's left arm, isolated on transparent
background, same art style and same viewing angle, bold black outline, rounded
joints at both ends, drawn to extend INTO the shoulder socket with generous
overlap.
```

```
...(同樣的畫風句子)... ONLY the character's head with an ANGRY expression,
isolated, same size and same framing as the neutral head so it can be swapped
frame-for-frame.
```

## B-3 遮擋：被蓋住的地方要畫完整

| 片 | 要畫到 |
|---|---|
| 身體 | 肩膀、髖部**畫完整**，含被手臂與尾巴蓋住的部分 |
| 手臂 | **畫進肩窩裡**，留出轉 ±40° 不露縫的重疊量 |
| 頭 | 下巴與後腦畫完整（頭會轉、會位移 40px）|
| 帽子 / 鬍子 | **整件畫完**（會飛出去，那時全部可見）|

## B-4 為什麼它敢轉 ±40° 而不破

三件事缺一不可，**而且都是畫風選擇，後製補不了**：

1. **粗黑描邊** —— 接縫藏在線裡
2. **重疊量大** —— 手臂根部深深插進身體
3. **關節是圓的** —— 肩、肘、腕畫成圓弧，轉起來輪廓不變

寫實質感或細線條的角色切開來轉 40 度，一定看得出來。
**這是路線 B 對畫風的硬約束**，不是可選項。

## B-5 四個常見失敗

| 症狀 | 原因 |
|---|---|
| 切開一轉就有縫 | 描邊太細或沒描邊；關節畫成方角 |
| 一半動畫做不出來 | 雙手對稱 / 都握著東西，沒有空的手 |
| 情緒讀不到 | 頭太小 |
| 沒有生命感 | 沒有會甩的附屬物。idle 的主力是耳朵 ±13–15° 與尾巴 ±9° |

---

## 動畫資料可以直接沿用

圖生好、切好之後，動作不用重新設計：

| 要什麼 | 去哪裡拿 |
|---|---|
| A 路線的 idle / reaction 模型 | `character-rig.zip` 的 `rig/motion.py`（常數）＋ `runtime/skinned.js` |
| B 路線的 idle 完整關鍵幀 | `references/le-bandit-motion.md` §3 |
| B 路線的 21 段清單與長度 | 同上 §7 |
| idle break 的時間（10–19 秒，之後 30–39 秒）| 同上 §6 |
| 中獎階梯的門檻 | 同上 §5 |

骨骼名稱建議直接沿用 Le Bandit 的那 36 個 ——
之後要做第二隻角色，照 Le Prechaun 的做法加一條次級骨鏈（鬍鬚 ±7°、外套 ±10.8°）
就好，核心動畫一個關鍵幀都不用改。見 `le-series-comparison.md`。

---

## 沒有驗證的部分

- **這些提詞我沒有實際跑過圖像模型。** 它們是從量測反推的規格翻譯過來的，
  不是調過的成品。第一次生大概要來回幾次。
- **路線 B 的畫風三條（描邊／重疊／圓關節）是推論**：
  我只抓到 Le Bandit 的 `.json` 與 `.atlas`，**沒有貼圖可以看**，
  是從綁定比例（21% 多重綁定）與切片尺寸推出來的。
- 比例表的「總高」用 root 到帽頂估算；骨架框上緣 +859 含撬棍，
  角色淨高沒有從貼圖量過。
- 路線 A 的驗收門檻是 `inspect_art.py` 實際會印的東西，那部分跑得出來。
