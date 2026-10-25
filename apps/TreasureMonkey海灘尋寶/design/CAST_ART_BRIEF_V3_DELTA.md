# Don 立繪 v3 — 只改姿勢的修訂

> ⚠️ **2026-09-17 更正**：這份文件裡所有 `check_cast_motion.mjs` 的 fold / stretch 數字
> （32%、52%、1.88x…）都是在**手臂骨不在手臂上**的 rig 上量的——自動偵測把左手抓成肩膀、
> 右手抓成雪茄的煙，兩隻手臂分到自己骨頭的權重是 0，所以那些數字沒有在彎任何一隻手臂。
> 美術需求本身（手臂離身、自由垂掛物）仍然成立；數字請以 `design/build_cast_guy_rig.py`
> 綁定之後重量的結果為準（見 `ART_STATUS.md`）。


> **這不是新需求，是 v2 的差異修訂。**
> 配色、服裝、圍巾、錶鍊、雪茄、臉、年紀、體型、打光 —— **v2 全部正確，全部保留**。
> 這一版只動一件事：**兩隻手臂跟軀幹之間的縫隙**。
> 完整規格仍是 [CAST_ART_BRIEF_V2.md](CAST_ART_BRIEF_V2.md)。

---

## v2 拿到了什麼

| | v1 | v2 |
|---|---|---|
| winBig 那階 | FAIL | **PASS** |
| trigger stretch | 2.27x | 1.88x |
| 自由垂掛物 | 0 | **2**（圍巾、雪茄）|
| soft alpha | 2.13% | 32.39% |
| 頸部橫向硬邊 | 35% | **16%** |
| 四邊留白 | 上只有 5% | 13–14% |
| clear band | 19% | 31% |

圍巾那一條完全解決了「身上沒有東西能甩」。**那個方向是對的，不要退回去。**

---

## 還差什麼：手臂在肩膀那一段是焊死的

逐列掃 `guy.png`（512×1024，人物佔 y 112–910，高 798px）的輪廓：

```
 y    %down   輪廓段數     縫隙
 232   15%    1 段        ← 垂下的手臂跟軀幹連在一起
 252   18%    1 段（左側從 x=104 到 336 連續）
 272   20%    1 段
 332   28%    1 段
 352   30%    1 段        ← 連拿雪茄那隻也併回去了
 372   33%    2 段        7px   ← 縫隙到這裡才開始，而且只有 7px
 412   38%    2 段       19px
 452   43%    3 段       21px / 1px
 492   48%    3 段       24px / 10px
 552   55%    3 段       29px / 20px
 572   58%    2 段       26px
```

兩個問題，位置很具體：

**1. 垂下那隻（角色右手／畫面左）— 縫隙從 33% 才開始，應該從 15% 開始**

從肩膀到 33% 這一整段，手臂跟軀幹是同一塊。網格分不出哪裡是手臂，
轉動肩膀就把胸口一起拖著走。而且縫隙最窄處只有 **7px**（在 y=372，剛好是腋下）。

**2. 拿雪茄那隻（角色左手／畫面右）— 手肘貼著肋骨**

y 332→452 之間縫隙從 35px 收到 **1px**，等於手肘到腰這一段黏在身上。
`check_cast_motion.mjs` 量到折得最兇的三角形就落在這一帶
（`fore_l` 一根就佔掉全部：拿掉它 fold 從 32% 跳到 70%）。

---

## v3 要達到的數字

以 **512×1024 出貨稿**計（1024×2048 生成稿請 ×2）：

| 要求 | 數字 |
|---|---|
| 垂下那隻：縫隙**起點** | **y ≈ 250（18% 處，腋下）**，不是現在的 372 |
| 垂下那隻：縫隙**最窄處** | **≥ 20px**（現在 7px）；1024 稿 ≥ 40px |
| 垂下那隻：縫隙**終點** | 手腕，y ≈ 570（58%）|
| 雪茄那隻：手肘離肋骨 | **≥ 20px**，整段 y 330–570 都不得低於此 |
| `clear band` 合計 | **≥ 50% of figure height**（v2 是 31%，參考值 62%）|

做法（給美術的話）：

- 垂下那隻手**往外張開約 10–15°**，不要貼著褲縫垂。像手裡拿著看不見的東西、
  手肘微微撐開那樣，不是立正站好。
- 拿雪茄那隻的**手肘往外推**，不要夾在腰側。前臂抬起的高度不用變，
  變的是手肘離身體的距離。
- 兩隻手都**不可橫過身前**（v2 沒犯這個，維持）。

---

## 最容易踩到的坑：圍巾把縫隙補起來

圍巾是 v2 最大的收穫，但它垂在胸前，**很容易剛好填進腋下那道縫**。
量到的 `[360,389]` 那一段跟軀幹只差 **1px**，就是這種情況。

縫隙是**背景色透出來**才算縫隙。圍巾、外套下擺、錶鍊任何一樣蓋過去，
輪廓就接回一整塊，前面所有的張開都白做。

所以：**圍巾兩端往身體中線垂，或往外飄，不要垂在腋下那條線上。**

---

## 不要動的

配色與兩色相規則、白絲圍巾、金錶鍊、雪茄（含煙）、不扣的外套、
體型與年紀、表情與視線、單一暖頂光、無地面投影、512×1024 / 透明背景、
人物佔畫面 75–82%、四邊留白 ≥ 4%。

---

## 提詞（在 v2 提詞上改這兩句）

原本的 ARMS 段整段換成：

```
BOTH ARMS HELD CLEARLY AWAY FROM THE TORSO, with a WIDE VISIBLE GAP OF EMPTY
BACKGROUND starting right at the ARMPIT and continuing unbroken all the way
down to the wrist on both sides.

His right arm hangs at his side but ANGLED OUTWARD about fifteen degrees, elbow
away from the ribs, hand open and empty, so daylight is visible between that
whole arm and his body from armpit to wrist.

His left elbow is pushed OUT AND AWAY FROM HIS RIBS, forearm raised to waist
height, fingers holding a lit cigar. The gap between that elbow and his side
must stay open — the elbow must not touch or overlap the waistcoat.

The hanging scarf ends must NOT fall into either armpit gap: drape them down
the CENTRE of his chest or swing them outward past the silhouette, never along
the line where an arm meets the body.
```

負面提詞補這幾個：

```
arm touching body, elbow against ribs, elbow tucked in, arm flush with torso,
scarf covering the armpit, scarf filling the gap between arm and body,
standing at attention, arms straight down
```

---

## 生完怎麼驗

```bash
cp <新圖> /tmp/v3.png
python3 ~/.claude/skills/hacksaw-character-motion/rig/inspect_art.py /tmp/v3.png
```

看 `clear band spans N% of figure height` —— **要 ≥ 50%**（v2 是 31%）。
`protrusions` 要維持至少一個 `HELD OBJECT or free appendage`（v2 有 2 個，別弄丟）。

過了之後重綁並跑閘：

```bash
python3 ~/.claude/skills/hacksaw-character-motion/rig/build.py /tmp/v3.png --cols 16 --rows 40
# 換上 static/assets/meshRigs/cast_guy/ 的 guy.png 與 guy.rig.json
node design/check_cast_motion.mjs --report
```

`guy/trigger REACTION FOLD` 要 **≥ 50%**（v2 是 32%），
`REACTION STRETCH` 要 **≤ 1.60x**（v2 是 1.88x）。

> ⚠️ **網格一定要 16×40。** 試過 24×60 與 32×80，trigger 的 fold 掉到 5.5% 和 0.2% ——
> 三角形變小，同樣的剪力集中在更少的面積上。閘的 50% 下限是綁在 16×40 上校準的。
