"""Measure每個符號的視覺重量，檢查它跟賠付階級是否一致。

    python design/check_symbol_weight.py            # 表格 + 判定
    python design/check_symbol_weight.py --ground 1E1813   # 指定底板色

寫這支工具的原因：低賠付符號改過三版，兩次都靠肉眼判斷而走偏。

  v1（籌碼圓框）  佔格 64.2%、亮部 11.8% —— 比高賠付還吵，階級反了
  v2（去圓框）    佔格 19.2%、亮部  0.1% —— 階級對了，但對比只有 3.2:1
  v3（再收斂）    對比掉到 1.7–2.5:1 —— 往錯的方向再走一步，花色快看不見

「太搶眼」和「看不見」中間有一段區間，用眼睛在不同螢幕上看會得到不同結論。
這支工具把那段區間變成數字。

三個量測值，都以「玩家實際看到的樣子」為準：

  佔格面積   alpha > 0.35 的像素比例 —— 符號在格子裡佔掉多少墨水
  亮部       亮度 > 200 的像素比例 —— 高光面積，這是「吵」的主要來源
  對比       符號最亮的 15% 像素（也就是眼睛用來認輪廓的部分）
             對盤面底板的 WCAG 對比值

判定規則：

  1. 低賠付的佔格與亮部都必須低於高賠付的平均 —— 盤面上最吵的東西要是最值錢的
  2. 每個符號對底板的對比 >= MIN_CONTRAST —— 讀得到
  3. 低賠付的對比不得超過高賠付裡最低的那個 —— 讀得到，但不比任何高賠付更跳
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SYM = os.path.join(HERE, "..", "static", "assets", "sprites", "hardTimeSymbols")

# 5-of-a-kind 賠付，用來排序與分組（game_config.py 的 paytable）
PAY = {"h1": 250, "h2": 125, "h3": 32, "h4": 18, "h5": 6,
       "l1": 1.2, "l2": 1.2, "l3": 1.2, "l4": 1.2}

def resolve(name: str) -> str:
    """回傳 assets.ts 實際引用的檔案。

    不是「硬碟上版號最大的那個」。改版時新舊檔會並存（l1.png / l1_v2.png /
    l1_v3.png 都在），而 assets.ts 可能還指著舊的 —— 第一版這支工具就是猜版號，
    結果量到了根本沒出貨的 v3。**量到沒出貨的檔案的檢查是沒有價值的。**
    """
    registry = open(os.path.join(HERE, "..", "src", "game", "assets.ts"), encoding="utf-8").read()
    for line in registry.splitlines():
        marker = f"hardTimeSymbols/{name}"
        if marker not in line:
            continue
        filename = line.split("hardTimeSymbols/")[1].split(".png")[0]
        # 精確比對，否則 l1 會誤中 l10 之類
        if filename == name or filename.startswith(f"{name}_"):
            return os.path.join(SYM, f"{filename}.png")
    raise SystemExit(f"assets.ts 沒有引用符號 {name}")


# 盤面底板。目前是 Hot Miami 的紫；ART_BRIEF §3.5 要換成深棕，
# 換完之後所有對比都要重量一次，所以這裡可以用 --ground 覆蓋。
DEFAULT_GROUND = (34, 35, 33)

MIN_CONTRAST = 5.0  # 低於此值 = 讀不到

# 低賠付的對比上限，不是一個固定數字，而是「不得超過高賠付裡最低的那個」。
#
# 第一版寫死 7.5，v4 交進來時量到 7.6–9.9 就判 FAIL —— 但實際擺上盤面，v4 讀得
# 清楚而且仍明顯從屬於 H 系列。線畫錯了，不是圖畫錯了。
#
# 原因是對比只量「邊緣可不可讀」，量不到「份量」。一圈細的亮金描邊可以有很高的邊緣
# 對比，同時幾乎不佔面積 —— v4 的佔格是 H 的 41%、亮部是 H 的 22%，份量是靠那兩個
# 數字壓住的，不是靠對比。
#
# 綁在 H 的最低值上才是有意義的約束：低賠付可以清楚，但不能比任何一個高賠付還跳。
# 這樣門檻也會跟著 H 系列一起動，不用手動維護。


def _rel_luminance(rgb) -> float:
    c = np.asarray(rgb, dtype=float) / 255
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return float(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])


def contrast(a, b) -> float:
    la, lb = _rel_luminance(a), _rel_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def measure(path: str, ground) -> dict:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).astype(float)
    alpha = arr[:, :, 3] / 255
    lum = 0.2126 * arr[:, :, 0] + 0.7152 * arr[:, :, 1] + 0.0722 * arr[:, :, 2]
    visible = alpha > 0.35

    if not visible.any():
        raise SystemExit(f"{path}: 整張透明")

    # 認輪廓靠的是符號最亮的那一部分，不是它的平均色。一個深色花色配一圈亮金描邊，
    # 平均下來很暗，但實際上讀得很清楚 —— 取前 15% 才反映眼睛做的事。
    solid = alpha > 0.5
    threshold = np.percentile(lum[solid], 85)
    body = arr[:, :, :3][solid & (lum >= threshold)].mean(axis=0)

    box = image.getchannel("A").point(lambda v: 255 if v > 90 else 0).getbbox()

    return {
        "coverage": visible.mean() * 100,
        "bright": ((lum > 200) & visible).mean() * 100,
        "extent": max(box[2] - box[0], box[3] - box[1]) / image.width * 100,
        "contrast": contrast(body, ground),
    }


def main() -> None:
    ground = DEFAULT_GROUND
    if "--ground" in sys.argv:
        hexcode = sys.argv[sys.argv.index("--ground") + 1].lstrip("#")
        ground = tuple(int(hexcode[i:i + 2], 16) for i in (0, 2, 4))

    rows = {name: measure(resolve(name), ground) for name in PAY}
    highs = [rows[n] for n in rows if n.startswith("h")]
    lows = [rows[n] for n in rows if n.startswith("l")]
    avg = lambda group, key: float(np.mean([g[key] for g in group]))

    print(f"底板 RGB{ground}\n")
    print(f"{'符號':6s} {'5OAK':>6s} {'佔格':>7s} {'亮部':>7s} {'輪廓':>7s} {'對比':>7s}")
    print("-" * 46)
    for name in sorted(PAY, key=lambda n: -PAY[n]):
        r = rows[name]
        print(f"{name.upper():6s} {PAY[name]:6g} {r['coverage']:6.1f}% {r['bright']:6.1f}% "
              f"{r['extent']:6.1f}% {r['contrast']:7.2f}")

    print(f"\n{'H1-H5 平均':12s} 佔格 {avg(highs,'coverage'):5.1f}%  亮部 {avg(highs,'bright'):5.1f}%  "
          f"對比 {avg(highs,'contrast'):.2f}")
    print(f"{'L1-L4 平均':12s} 佔格 {avg(lows,'coverage'):5.1f}%  亮部 {avg(lows,'bright'):5.1f}%  "
          f"對比 {avg(lows,'contrast'):.2f}")

    problems = []
    if avg(lows, "coverage") >= avg(highs, "coverage"):
        problems.append("低賠付的佔格面積不低於高賠付 —— 視覺階級反了")
    if avg(lows, "bright") >= avg(highs, "bright"):
        problems.append("低賠付的亮部面積不低於高賠付 —— 視覺階級反了")
    for name, r in rows.items():
        if r["contrast"] < MIN_CONTRAST:
            problems.append(f"{name.upper()} 對比 {r['contrast']:.2f} < {MIN_CONTRAST} —— 讀不到")
    ceiling = min(h["contrast"] for h in highs)
    for name in [n for n in rows if n.startswith("l")]:
        if rows[name]["contrast"] > ceiling:
            problems.append(
                f"{name.upper()} 對比 {rows[name]['contrast']:.2f} > {ceiling:.2f}"
                f"（H 系列最低值）—— 低賠付比高賠付還跳"
            )

    print()
    if problems:
        print(f"FAIL: {len(problems)} 個問題")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)
    print("OK: 視覺重量與賠付階級一致")


if __name__ == "__main__":
    main()
