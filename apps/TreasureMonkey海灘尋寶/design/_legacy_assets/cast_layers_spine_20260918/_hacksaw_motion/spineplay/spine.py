# -*- coding: utf-8 -*-
"""spine.py — 夠用的 Spine 3.8 / 4.x 播放器（純 Python + Pillow + numpy）。

    from spine import Skeleton
    sk = Skeleton('raccoon.json')       # .atlas 與 .png 要在旁邊
    sk.pose('idle', 0.4).render().save('frame.png')

做得到：骨骼階層（rotate/translate/scale/shear，含 4.0 的單軸通道）、
兩種格式的貝茲曲線、**IK / transform / path 三種約束**、transform 繼承模式、
slot 的 attachment 抽換與 color / rgb / alpha 補間、drawOrder、
region 與 mesh attachment、mesh deform、加權綁定、clipping attachment（凸多邊形）、
additive 混合。

做不到：skin 切換（只用第一個 skin，skin-required 的骨與約束視為停用）、
two-color tint（dark 色）、multiply / screen 混合、凹多邊形的 clipping。
碰到會警告。

## 驗證狀態：跟官方 spine-ts 逐幀比對過

以 EsotericSoftware 官方 runtime 當標準答案 —— 3.8 的骨架用
`spine-webgl-3.8.js`、4.0 的用 `spine-webgl-4.0.js`（`bonediff.py`／
`sweep.py` 會看骨架版本自動選）。比對範圍：

| 骨架 | 約束 | 動畫×時間點×骨 | 矩陣最大差 | 座標最大差 |
|---|---|---|---|---|
| Le Bandit raccoon（3.8）| path 1 | 21×4×36 | 1.1e-6 | 1.5e-4 |
| Miami character_main_guy | ik 4、tr 9、path 1 | 4×5×49 | 4.0e-7 | 4.5e-5 |
| Miami expand | ik 9、tr 24、path 2 | 22×3×259 | 3.0e-6 | 2.1e-4 |
| Miami 其餘 6 隻角色／符號 | ik 0–7、tr 0–5 | — | < 6.3e-7 | < 2.1e-4 |

**殘差已到官方 runtime 自己的精度下限**：spine-ts 的 timeline 用
`Float32Array` 存關鍵幀，float32 的 eps 是 1.2e-7；座標的相對誤差量到
1.7e-7，就是這個。不是我們算錯，是官方比較不準。

畫面（`compare_official.py`，scale=0.32，**不需要事後對位**，dx=dy=0）：
raccoon IoU **0.996** RGB **0.42/255**，Miami 主角 IoU **0.999** RGB
**0.76/255**。殘差幾乎全落在輪廓邊緣 2px 內，來源是抗鋸齒與貼圖濾波。

### 過程中靠這個比對抓到的真 bug

1. **第一個關鍵幀之前要回到 setup 值**，不是停在第一幀。
   浣熊 `welcome` 的 `bubble_bone` 第一幀在 0.7333 秒，錯的話前 0.7 秒
   那根骨就已經擺好姿勢了。修正後 `welcome` 從 0.592 → 2.2e-7。
2. **曲線是 10 段查表近似，不是精確貝茲** —— 3.8 與 4.0 都是。
   4.0 的取樣在絕對 (時間, 值) 空間，見 `_solve_bezier`。
3. **transform 繼承模式**（浣熊的 `hip_bone` 是 `noRotationOrReflection`，
   而整個上半身掛在它底下）。
4. **`noRotationOrReflection` 的前兩項是減不是加** ——
   官方寫的是 `a = pa*la - pb*lc`。這個 bug 在 path 約束實作之前不會顯現，
   因為那時 `bone` 是單位矩陣、`pb` 剛好是 0；一接上 path 約束，
   28 根骨立刻差到 685 單位。
5. **3.8 與 4.0 的 `Bone.update()` 取值來源不同**：3.8 用本地值重算，
   所以約束結果會被後續的重算洗掉（因此 3.8 才有 `updateCacheReset`）；
   4.0 用 applied 值重算，約束結果留得住。搞錯的話 Miami 主角的
   `hand_opposite` 會差 2.1 度。
6. **`mixY` 在每個關鍵幀裡的預設值是該幀自己的 `mixX`**，不是 1、
   也不是約束上的值。Miami 的 `bat_transform` 只寫 `mixX: 0`，
   當成 1 的話球棒會被拉走 7 個單位。
7. **atlas 的 `offsets` 是打包時裁掉的透明邊**，uv 要對【原圖】的框。
   Miami 把 925x1109 的原圖裁成 284x337，漏掉這段會貼到隔壁的圖上去，
   IoU 只有 0.53。
8. **4.0 的 `alpha` 是獨立的 slot 時間軸**，不是 `rgba` 的一部分。
   Miami 用它關掉 additive 高光，漏掉的話球棒與手臂整片發亮。
9. **t 剛好落在關鍵幀上時，取的是【後面】那一段**，不是前面那一段。
   曲線正常時兩者同值；控制點超出區段範圍時會差很多。
10. **官方 spine-ts 4.0.28 自己有一個 bug**：transform 約束的時間軸
   讀取時漏了 `mixShearY = mixShearY2`（寫成兩次 `mixScaleX = mixScaleX2`），
   整條時間軸的 mixShearY 都停在第一幀。預設照著它做（見
   `V40_MIXSHEARY_FREEZE`），因為目標是跟實際在跑遊戲的 runtime 一致。

前四項是靠 Hacksaw 的骨架發現的；第 9、10 項是靠 `example/rigtest.json`
這個合成骨架 —— 真實素材剛好沒踩到那兩條路徑。

踩過的坑：Spine 存的 mesh uv 是【該塊圖內部】的 0..1，**不是整頁座標**。
runtime 會在載入時用 atlas region 換算（updateUVs）。少了這一步，
每一塊圖都會被貼上整張 atlas，畫面看起來像角色被打散。見 `_page_uv`。
"""
from __future__ import print_function

import json
import math
import os
import re

import numpy as np
from PIL import Image


# --------------------------------------------------------------- 曲線
def _solve_bezier(t, t0, v0, t1, v1, cx1, cy1, cx2, cy2):
    """Spine **4.x** 的曲線求值。控制點是絕對座標 (時間, 值)。

    ⚠️ 跟 3.8 一樣，**官方不是解精確的貝茲**：`CurveTimeline.setBezier()`
    用前向差分把曲線取樣成 10 段（存 9 個中間點），求值時在 x 上做線性
    內插。之前這裡用二分法解精確解，Miami 的骨頭因此差到 0.06 個單位 ——
    肉眼看不出來，但要逐像素對答案就會卡在那裡。
    """
    if t1 <= t0:
        return v1
    tmpx = (t0 - cx1 * 2 + cx2) * 0.03
    tmpy = (v0 - cy1 * 2 + cy2) * 0.03
    dddx = ((cx1 - cx2) * 3 - t0 + t1) * 0.006
    dddy = ((cy1 - cy2) * 3 - v0 + v1) * 0.006
    ddx, ddy = tmpx * 2 + dddx, tmpy * 2 + dddy
    dx = (cx1 - t0) * 0.3 + tmpx + dddx * 0.16666667
    dy = (cy1 - v0) * 0.3 + tmpy + dddy * 0.16666667
    x, y = t0 + dx, v0 + dy
    px, py = t0, v0
    for k in range(9):
        if x >= t:
            return py + (t - px) / (x - px) * (y - py)
        px, py = x, y
        dx += ddx
        dy += ddy
        ddx += dddx
        ddy += dddy
        x += dx
        y += dy
    # 落在最後一個取樣點與終點之間
    return py + (t - px) / (t1 - px) * (v1 - py)


def _curve38_percent(cx1, cy1, cx2, cy2, percent):
    """Spine **3.8** 的曲線求值 —— 它不是解精確的貝茲。

    3.8 的 CurveTimeline 用前向差分把貝茲取樣成 10 段存成查表，
    再用線性內插。要跟官方 runtime 對到 1e-7，就得照它的近似做，
    解精確貝茲反而會差 0.002～0.05。
    """
    SIZE = 10 * 2 - 1
    tmpx = (-cx1 * 2 + cx2) * 0.03
    tmpy = (-cy1 * 2 + cy2) * 0.03
    dddfx = ((cx1 - cx2) * 3 + 1) * 0.006
    dddfy = ((cy1 - cy2) * 3 + 1) * 0.006
    ddfx = tmpx * 2 + dddfx
    ddfy = tmpy * 2 + dddfy
    dfx = cx1 * 0.3 + tmpx + dddfx * 0.16666667
    dfy = cy1 * 0.3 + tmpy + dddfy * 0.16666667
    curves = []
    x, y = dfx, dfy
    for _ in range(0, SIZE - 1, 2):
        curves.append((x, y))
        dfx += ddfx
        dfy += ddfy
        ddfx += dddfx
        ddfy += dddfy
        x += dfx
        y += dfy
    prevx = prevy = 0.0
    for cx, cy in curves:
        if cx >= percent:
            return prevy + (cy - prevy) * (percent - prevx) / (cx - prevx)
        prevx, prevy = cx, cy
    # 最後一段：往 (1,1) 收
    return prevy + (1.0 - prevy) * (percent - prevx) / (1.0 - prevx)


FIELDS = {
    'translate': [('x', 0.0), ('y', 0.0)],
    'scale':     [('x', 1.0), ('y', 1.0)],
    'shear':     [('x', 0.0), ('y', 0.0)],
}


def _sample(keys, fields, t, v38):
    """一條時間軸在 t 的值；t 在第一個關鍵幀之前回傳 None。

    ⚠️ 這是踩過的坑：Spine 在第一個關鍵幀【之前】會把該通道還原成
    **setup 值**，不是停在第一個關鍵幀上。很多動畫的軌道不是從 0 開始
    （浣熊 welcome 的 bubble_bone 從 0.7333 秒才有第一幀），
    回傳第一幀的值會讓那根骨在前 0.7 秒就已經擺好姿勢。
    """
    if not keys:
        return None
    if t < keys[0].get('time', 0.0):
        return None
    if t >= keys[-1].get('time', 0.0):
        return [keys[-1].get(n, d) for n, d in fields]
    # ⚠️ t 剛好落在某個關鍵幀上時，Spine 取的是【後面】那一段，不是前面那一段。
    # 官方 `Timeline.search` 找的是第一個 time > t 的幀，所以區段起點是最後一個
    # time <= t 的幀。曲線正常時兩種取法同值（段首值 == 關鍵幀值），但曲線的
    # 控制點若超出區段範圍，兩者會差很多。
    i = 0
    while i + 1 < len(keys) and keys[i + 1].get('time', 0.0) <= t:
        i += 1
    a, b = keys[i], keys[i + 1]
    t0, t1 = a.get('time', 0.0), b.get('time', 0.0)
    c = a.get('curve')
    p = 0.0 if t1 <= t0 else (t - t0) / (t1 - t0)
    out = []
    for fi, (n, d) in enumerate(fields):
        v0, v1 = a.get(n, d), b.get(n, d)
        if c is None:
            out.append(v0 + (v1 - v0) * p)
        elif c == 'stepped':
            out.append(v0)
        elif v38:
            # 3.8：curve/c2/c3/c4 是 0..1 的比例，而且是查表近似
            cx1 = float(c) if not isinstance(c, list) else 0.0
            pc = _curve38_percent(cx1, a.get('c2', 0.0),
                                  a.get('c3', 1.0), a.get('c4', 1.0), p)
            out.append(v0 + (v1 - v0) * pc)
        else:
            seg = c[fi * 4:fi * 4 + 4] if isinstance(c, list) else []
            if len(seg) < 4:
                out.append(v0 + (v1 - v0) * p)
            else:
                out.append(_solve_bezier(t, t0, v0, t1, v1, *seg))
    return out


def _key_at_or_before(keys, t):
    """時間 t 當下生效的那一個關鍵幀（階梯取值）。

    IK 的 bendPositive / compress / stretch 不做內插，官方直接取
    「前一幀」的值；transform 與 path 的 mix 才是內插的。
    """
    k = keys[0]
    for kk in keys:
        if kk.get('time', 0.0) > t:
            break
        k = kk
    return k


_COLOR_FIELDS = [('_r', 1.0), ('_g', 1.0), ('_b', 1.0), ('_a', 1.0)]

# spine-ts 4.0 的 JSON reader 在讀 transform 約束的時間軸時有一個 copy-paste
# bug：往下一幀推進時寫了兩次 `mixScaleX = mixScaleX2`，**漏掉 mixShearY**，
# 於是整條時間軸的 mixShearY 都停在第一幀的值。
#   官方 4.0.28 `SkeletonJson`：
#       time = time2; mixRotate = mixRotate2; mixX = mixX2; mixY = mixY2;
#       mixScaleX = mixScaleX2; mixScaleY = mixScaleY2;
#       mixScaleX = mixScaleX2;      // ← 這裡本來該是 mixShearY = mixShearY2
# 預設照著官方走（目標是跟實際在跑遊戲的 runtime 一致）；
# 想要「正確」的內插就把它設成 False。
# 對手上這批 Hacksaw 骨架沒有影響 —— 它們的 mixShearY 都 <= 0，
# 兩種行為都會跳過 shear 那一段。
V40_MIXSHEARY_FREEZE = True


def _rgba(s):
    s = (s or 'ffffffff').lstrip('#')
    if len(s) < 8:
        s = (s + 'ffffffff')[:8]
    return [int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4, 6)]


def _lerp_rgba(ka, kb, t):
    t0, t1 = ka.get('time', 0.0), kb.get('time', 0.0)
    p = 0.0 if t1 <= t0 else (t - t0) / (t1 - t0)
    ca, cb = _rgba(ka.get('color')), _rgba(kb.get('color'))
    return [ca[i] + (cb[i] - ca[i]) * p for i in range(4)]



# ------------------------------------------------- PathConstraint（Spine 3.8）
# 照 spine-ts 3.8 的 PathConstraint 實作。這是 Spine 最複雜的約束：
# 把骨頭吸附到一條貝茲路徑上，並可依切線方向轉動它。
# 浣熊的 `hip_path` 就是這個，而且綁的是根骨 `bone` —— 沒實作的話整隻角色
# 會偏移最多 22 單位（身高 1.6%）。

_PC_NONE, _PC_BEFORE, _PC_AFTER = -1, -2, -3
_PC_EPS = 0.00001


def _add_before(p, temp, i, out, o):
    x1, y1 = temp[i], temp[i + 1]
    dx, dy = temp[i + 2] - x1, temp[i + 3] - y1
    r = math.atan2(dy, dx)
    out[o] = x1 + p * math.cos(r)
    out[o + 1] = y1 + p * math.sin(r)
    out[o + 2] = r


def _add_after(p, temp, i, out, o):
    x1, y1 = temp[i + 2], temp[i + 3]
    dx, dy = x1 - temp[i], y1 - temp[i + 1]
    r = math.atan2(dy, dx)
    out[o] = x1 + p * math.cos(r)
    out[o + 1] = y1 + p * math.sin(r)
    out[o + 2] = r


def _add_curve(p, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o, tangents):
    if p == 0 or p != p:
        out[o] = x1
        out[o + 1] = y1
        out[o + 2] = math.atan2(cy1 - y1, cx1 - x1)
        return
    tt = p * p
    ttt = tt * p
    u = 1 - p
    uu = u * u
    uuu = uu * u
    ut = u * p
    ut3 = ut * 3
    uut3 = u * ut3
    utt3 = ut3 * p
    x = x1 * uuu + cx1 * uut3 + cx2 * utt3 + x2 * ttt
    y = y1 * uuu + cy1 * uut3 + cy2 * utt3 + y2 * ttt
    out[o] = x
    out[o + 1] = y
    if tangents:
        if p < 0.001:
            out[o + 2] = math.atan2(cy1 - y1, cx1 - x1)
        else:
            out[o + 2] = math.atan2(y - (y1 * uu + cy1 * ut * 2 + cy2 * tt),
                                    x - (x1 * uu + cx1 * ut * 2 + cx2 * tt))


# --------------------------------------------------------------- atlas
# ------------------------------------------------ clipping attachment
def _make_clockwise(poly):
    """就地把多邊形轉成順時針（Spine 的 `SkeletonClipping.makeClockwise`）。

    注意官方是 `if (area < 0) return;` —— area 為 0 時也會反轉。
    """
    n = len(poly)
    area = poly[n - 2] * poly[1] - poly[0] * poly[n - 1]
    for i in range(0, n - 3, 2):
        area += poly[i] * poly[i + 3] - poly[i + 2] * poly[i + 1]
    if area < 0:
        return
    last = n - 2
    for i in range(0, n >> 1, 2):
        other = last - i
        poly[i], poly[other] = poly[other], poly[i]
        poly[i + 1], poly[other + 1] = poly[other + 1], poly[i + 1]


def _is_convex(poly):
    """多邊形是不是凸的（叉積不變號）。"""
    n = len(poly) // 2
    sign = 0
    for i in range(n):
        ax, ay = poly[i * 2], poly[i * 2 + 1]
        bx, by = poly[(i + 1) % n * 2], poly[(i + 1) % n * 2 + 1]
        cx, cy = poly[(i + 2) % n * 2], poly[(i + 2) % n * 2 + 1]
        cr = (bx - ax) * (cy - by) - (by - ay) * (cx - bx)
        if abs(cr) < 1e-9:
            continue
        s = 1 if cr > 0 else -1
        if sign and s != sign:
            return False
        sign = s
    return True


def _clip_triangle(x1, y1, x2, y2, x3, y3, area):
    """Sutherland–Hodgman：把一個三角形裁進一個【凸】多邊形。

    照 spine-ts `SkeletonClipping.clip()`，回傳裁完的多邊形頂點
    [x, y, x, y, ...]，完全被裁掉時回傳空 list。
    `area` 要是順時針、而且尾端重複第一個點（[x0,y0,...,x0,y0]）。
    """
    inp = [x1, y1, x2, y2, x3, y3, x1, y1]
    out = []
    last = len(area) - 4
    i = 0
    while True:
        ex, ey = area[i], area[i + 1]
        ex2, ey2 = area[i + 2], area[i + 3]
        dxe, dye = ex - ex2, ey - ey2
        out = []
        for ii in range(0, len(inp) - 2, 2):
            ix, iy = inp[ii], inp[ii + 1]
            ix2, iy2 = inp[ii + 2], inp[ii + 3]
            side2 = dxe * (iy2 - ey2) - dye * (ix2 - ex2) > 0
            if dxe * (iy - ey2) - dye * (ix - ex2) > 0:
                if side2:
                    out.append(ix2); out.append(iy2)
                    continue
                c0, c2 = iy2 - iy, ix2 - ix
                s = c0 * (ex2 - ex) - c2 * (ey2 - ey)
                if abs(s) > 0.000001:
                    ua = (c2 * (ey - iy) - c0 * (ex - ix)) / s
                    out.append(ex + (ex2 - ex) * ua)
                    out.append(ey + (ey2 - ey) * ua)
                else:
                    out.append(ex); out.append(ey)
            elif side2:
                c0, c2 = iy2 - iy, ix2 - ix
                s = c0 * (ex2 - ex) - c2 * (ey2 - ey)
                if abs(s) > 0.000001:
                    ua = (c2 * (ey - iy) - c0 * (ex - ix)) / s
                    out.append(ex + (ex2 - ex) * ua)
                    out.append(ey + (ey2 - ey) * ua)
                else:
                    out.append(ex); out.append(ey)
                out.append(ix2); out.append(iy2)
        if not out:
            return []
        out.append(out[0]); out.append(out[1])
        if i == last:
            break
        inp = out
        i += 2
    return out[:-2]


def _clip_tri_uv(x1, y1, x2, y2, x3, y3, u1, v1, u2, v2, u3, v3, area):
    """裁一個三角形並用重心座標補回 uv，回傳 (頂點 Nx2, uv Nx2, 三角形 Mx3)。"""
    out = _clip_triangle(x1, y1, x2, y2, x3, y3, area)
    if len(out) < 6:
        return None
    d0, d1, d2, d4 = y2 - y3, x3 - x2, x1 - x3, y3 - y1
    den = d0 * d2 + d1 * (y1 - y3)
    if den == 0:
        return None
    d = 1.0 / den
    pts, uvs = [], []
    for ii in range(0, len(out), 2):
        x, y = out[ii], out[ii + 1]
        c0, c1 = x - x3, y - y3
        a = (d0 * c0 + d1 * c1) * d
        b = (d4 * c0 + d2 * c1) * d
        c = 1.0 - a - b
        pts.append((x, y))
        uvs.append((u1 * a + u2 * b + u3 * c, v1 * a + v2 * b + v3 * c))
    tris = [(0, k, k + 1) for k in range(1, len(pts) - 1)]
    return pts, uvs, tris


def read_atlas(path):
    """讀 libgdx atlas。回傳 {region 名: 資訊}，並用 `None` 這個 key 夾帶
    頁面檔名清單 —— atlas 宣告的頁面檔名【不一定】等於 .atlas 的檔名
    （The Luxe 的 `countup_tiers.atlas` 指向的是 `wintiers.png`）。"""
    out, cur = {}, None
    pages = []
    for line in open(path, encoding='utf-8').read().splitlines():
        if not line.strip():
            continue
        bare = (not line.startswith((' ', '\t'))) and ':' not in line
        if bare and line.lower().endswith(('.png', '.ktx2', '.jpg', '.jpeg')):
            pages.append(line.strip())
            cur = None
        elif bare:
            cur = line.strip()
            out[cur] = {'rotate': False, 'degrees': 0}
        elif cur is not None:
            m = re.match(r'\s*(\w+):\s*(.*)', line)
            if not m:
                continue
            k, v = m.group(1), m.group(2).strip()
            if k in ('bounds', 'offsets', 'xy', 'size', 'orig', 'offset'):
                out[cur][k] = [int(x) for x in v.split(',')]
            elif k == 'rotate':
                # 官方支援 90/180/270；'true' 等同 90
                deg = 90 if v == 'true' else (0 if v == 'false' else int(v))
                out[cur]['degrees'] = deg
                out[cur]['rotate'] = deg == 90
    for r in out.values():
        if 'bounds' not in r and 'xy' in r and 'size' in r:
            r['bounds'] = r['xy'] + r['size']
        # 兩種寫法：舊的 offset(ox,oy)+orig(ow,oh)，新的 offsets(ox,oy,ow,oh)
        if 'offsets' in r:
            r['off'] = r['offsets'][:2]
            r['orig_size'] = r['offsets'][2:]
        else:
            r['off'] = r.get('offset', [0, 0])
            r['orig_size'] = r.get('orig') or (r['bounds'][2:] if 'bounds' in r
                                               else [0, 0])
    out[None] = pages
    return out


class Skeleton(object):
    def __init__(self, json_path, atlas_path=None, page_path=None, quiet=False):
        self.path = json_path
        stem = os.path.splitext(json_path)[0]
        self.d = json.load(open(json_path, encoding='utf-8'))
        apath = atlas_path or stem + '.atlas'
        self.atlas = read_atlas(apath)
        pages = self.atlas.pop(None, [])
        if page_path is None:
            # 先照 atlas 自己宣告的頁面檔名找，找不到才退回 <stem>.png
            adir = os.path.dirname(os.path.abspath(apath))
            cand = [os.path.join(adir, os.path.splitext(p)[0] + '.png')
                    for p in pages]
            cand.append(stem + '.png')
            page_path = next((c for c in cand if os.path.exists(c)), None)
            if (page_path is not None and pages and not quiet
                    and page_path != cand[0]):
                print('注意：atlas 宣告的頁面是 %s，那個檔不在，改用 %s。'
                      'Hacksaw 的 loader 會做這種改名對應，但如果內容不對，'
                      '整張圖都會貼錯。' % (pages[0], os.path.basename(page_path)))
            if page_path is None:
                raise IOError('找不到貼圖頁：atlas 宣告的是 %s，'
                              '但這些路徑都不存在：%s' % (pages or '(無)', cand))
        if len(pages) > 1 and not quiet:
            print('警告：這個 atlas 有 %d 個頁面（%s），本播放器只用第一個，'
                  '跨頁的圖會貼錯' % (len(pages), ', '.join(pages)))
        self.page = Image.open(page_path).convert('RGBA')
        self.page_np = np.asarray(self.page).astype(np.float64)
        self._init_rig(quiet)

    @classmethod
    def from_dict(cls, d, quiet=False):
        """沒有 atlas／貼圖的骨架 —— 只算骨骼，不能 render()。

        motion pack（`export_pack.py` 產出的純動作資料）用這條路載入：
        它刻意不含任何貼圖、uv 或網格頂點。
        """
        sk = cls.__new__(cls)
        sk.path = None
        sk.d = d
        sk.atlas = {}
        sk.page = None
        sk.page_np = None
        sk._init_rig(quiet)
        return sk

    def _init_rig(self, quiet=False):
        ver = str(self.d.get('skeleton', {}).get('spine', '4'))
        self.v38 = ver.startswith('3.')
        self.rotf = 'angle' if self.v38 else 'value'

        self.bones = self.d['bones']
        self.slots = self.d.get('slots') or []
        sk = self.d.get('skins')
        if not sk:
            self.skin = {}
        elif isinstance(sk, list):
            self.skin = sk[0]['attachments']
        else:
            self.skin = sk['default']
        self.slot_bone = {s['name']: s['bone'] for s in self.slots}
        self._bone_len = {b['name']: b.get('length', 0.0) for b in self.bones}
        self._by_name = {b['name']: b for b in self.bones}
        self._slot_by_name = {s['name']: s for s in self.slots}
        self._parent = {b['name']: b.get('parent') for b in self.bones}
        self._local = {}
        self._applied = {}
        self._valid = {}
        self._build_cache()
        self._normalize_constraint_keys()
        self._expand_color_keys()

        if not quiet:
            skin_req = [k for k in ('bones', 'ik', 'transform', 'path')
                        if any(c.get('skin') for c in (self.d.get(k) or []))]
            if skin_req or (isinstance(sk, list) and len(sk) > 1):
                print('注意：這個骨架有多個 skin%s。'
                      '本播放器只用第一個 skin，官方 runtime 會依當前 skin '
                      '決定哪些骨與約束生效，複雜的換裝骨架可能對不上。'
                      % ('（而且有 skin-required 的骨／約束）' if skin_req else ''))
        self._posed = None

    def _region_of(self, a, sn):
        """attachment 對應的 atlas region。名字優先序：path → attachment 名 → slot 名。"""
        for cand in (a.get('path'), a.get('_name'), sn):
            if cand and cand in self.atlas:
                return self.atlas[cand]
        return None

    def _page_uv(self, uvs, reg):
        """Spine 存的 mesh uv 是【該塊圖內部】的 0..1，不是整頁的座標。

        runtime 在載入時用 atlas region 換算成頁座標（`MeshAttachment.updateUVs`）。
        ⚠️ 換算不是單純「縮放到 bounds」：打包器會把圖四周的透明邊裁掉，
        `offsets` 記的就是裁掉多少（ox, oy）與原圖尺寸（ow, oh），
        uv 要對的是【原圖】的框，不是裁過的框。Miami 的圖裁得很兇
        （925x1109 的原圖裁成 284x337），漏掉這一段會貼到隔壁的圖上去。
        """
        pw, ph = float(self.page.width), float(self.page.height)
        bx, by, bw, bh = reg['bounds']
        ox, oy = reg['off']
        ow, oh = reg['orig_size']
        u0, v0 = bx / pw, by / ph
        u = uvs[:, 0]
        v = uvs[:, 1]
        deg = reg.get('degrees', 0)
        if deg == 90:
            u0 -= (oh - oy - bh) / pw
            v0 -= (ow - ox - bw) / ph
            pu = u0 + v * (oh / pw)
            pv = v0 + (1.0 - u) * (ow / ph)
        elif deg == 180:
            u0 -= (ow - ox - bw) / pw
            v0 -= oy / ph
            pu = u0 + (1.0 - u) * (ow / pw)
            pv = v0 + (1.0 - v) * (oh / ph)
        elif deg == 270:
            u0 -= oy / pw
            v0 -= ox / ph
            pu = u0 + (1.0 - v) * (oh / pw)
            pv = v0 + u * (ow / ph)
        else:
            u0 -= ox / pw
            v0 -= (oh - oy - bh) / ph
            pu = u0 + u * (ow / pw)
            pv = v0 + v * (oh / ph)
        return np.stack([pu, pv], 1)

    @property
    def animations(self):
        return sorted(self.d.get('animations', {}))

    def duration(self, name):
        mx = [0.0]

        def walk(o):
            if isinstance(o, dict):
                t = o.get('time')
                if isinstance(t, (int, float)):
                    mx[0] = max(mx[0], t)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(self.d['animations'][name])
        return mx[0]

    # ----------------------------------------------------------- 擺姿勢
    def pose(self, anim, t):
        A = self.d['animations'][anim]
        # 照 Spine 自己的 Bone.update() 實作，不是單純的矩陣相乘 ——
        # transform 繼承模式（noRotationOrReflection 等）會改寫旋轉的部分，
        # 而且 worldX/Y 是用【未改寫前】的父矩陣算的。
        # 浣熊的 hip_bone 就是 noRotationOrReflection，而整個上半身掛在它底下，
        # 用矩陣相乘會讓所有骨差到 22 單位。
        # slot 狀態與 deform 要先算：path 約束需要知道 target slot 現在掛
        # 哪個 attachment、以及那個 attachment 有沒有被 deform 變形。
        st = self._slot_state(A, t)
        order = self._draw_order(A, t)
        dfm = self._deform_state(A, t)

        B = {}
        self._applied = {}
        self._valid = {}
        for b in self.bones:
            n = b['name']
            rot = b.get('rotation', 0.0)
            x, y = b.get('x', 0.0), b.get('y', 0.0)
            sx, sy = b.get('scaleX', 1.0), b.get('scaleY', 1.0)
            shx, shy = b.get('shearX', 0.0), b.get('shearY', 0.0)
            ch = A.get('bones', {}).get(n, {})
            v = _sample(ch.get('rotate'), [(self.rotf, 0.0)], t, self.v38)                 if 'rotate' in ch else None
            if v is not None:
                rot += v[0]
            v = _sample(ch.get('translate'), FIELDS['translate'], t, self.v38)                 if 'translate' in ch else None
            if v is not None:
                x += v[0]; y += v[1]
            v = _sample(ch.get('scale'), FIELDS['scale'], t, self.v38)                 if 'scale' in ch else None
            if v is not None:
                sx *= v[0]; sy *= v[1]
            v = _sample(ch.get('shear'), FIELDS['shear'], t, self.v38)                 if 'shear' in ch else None
            if v is not None:
                shx += v[0]; shy += v[1]
            # Spine 4.0 可以只給單軸。這是獨立的 timeline，不是 translate
            # 的別名 —— Miami 的 body_perspective 只有 translatex/translatey，
            # 漏掉會讓整條上半身差到 17 個單位。
            for name, field, mul in (('translatex', 'x', False),
                                     ('translatey', 'y', False),
                                     ('scalex', 'sx', True),
                                     ('scaley', 'sy', True),
                                     ('shearx', 'shx', False),
                                     ('sheary', 'shy', False)):
                if name not in ch:
                    continue
                v = _sample(ch[name], [('value', 1.0 if mul else 0.0)],
                            t, self.v38)
                if v is None:
                    continue
                if field == 'x':   x += v[0]
                elif field == 'y': y += v[0]
                elif field == 'sx': sx *= v[0]
                elif field == 'sy': sy *= v[0]
                elif field == 'shx': shx += v[0]
                else:              shy += v[0]

            self._local[n] = (rot, x, y, sx, sy, shx, shy)

        cv = self._constraint_values(A, t)

        # 3.8 與 4.0 在這裡有個結構性差異，踩到會整隻手臂錯位：
        #   3.8 的 `Bone.update()` 是從【本地】值(x/y/rotation)重算，所以一根骨
        #        若在約束之後又出現在更新序列裡，約束的結果會被洗掉 ——
        #        3.8 因此才需要 `updateCacheReset` 與 `appliedValid` 這套機制。
        #   4.0 的 `Bone.update()` 是從【applied】值重算，約束寫進 applied 之後
        #        就算再被重算一次也留得住，所以 4.0 拿掉了 updateCacheReset。
        # Miami 的 `hand_opposite` 正好是這個情形：IK 算完它之後，
        # `bat_transform` 的 sortReset 會把它排到後面再更新一次。
        if self.v38:
            for n in self._cache_reset:
                self._applied[n] = self._local[n]
                self._valid[n] = True
        else:
            for n, loc in self._local.items():
                self._applied[n] = loc
                self._valid[n] = True

        for kind, item in self._cache:
            if kind == 'bone':
                n = item['name']
                self._compose(B, item, self._local[n] if self.v38
                              else self._update_applied(B, n))
            elif kind == 'ik':
                self._apply_ik(B, item, cv)
            elif kind == 'transform':
                self._apply_transform(B, item, cv)
            else:
                self._apply_path_one(B, item, cv, st, dfm)

        self._Bw = B          # clipping attachment 要用原始的 6 元組矩陣
        W = {n: np.array([[v[0], v[1], v[4]], [v[2], v[3], v[5]], [0, 0, 1]], float)
             for n, v in B.items()}
        self.W = {k: v[:2] for k, v in W.items()}
        self._posed = (st, order, dfm)
        return self

    def _slot_state(self, A, t):

        st = {}
        for s in self.slots:
            st[s['name']] = {'att': s.get('attachment'),
                             'color': _rgba(s.get('color')),
                             'blend': s.get('blend')}
        for sn, ch in A.get('slots', {}).items():
            if sn not in st:
                continue
            if 'attachment' in ch:
                cur = st[sn]['att']
                for k in ch['attachment']:
                    if k.get('time', 0.0) <= t:
                        cur = k.get('name')
                st[sn]['att'] = cur
            # color(3.8) / rgba(4.0) 是四通道；4.0 另外拆出 rgb 與 alpha
            for key, comps in (('color', 4), ('rgba', 4), ('rgb', 3)):
                if key not in ch:
                    continue
                v = _sample(ch[key], _COLOR_FIELDS[:comps], t, self.v38)
                if v is not None:
                    st[sn]['color'][:comps] = v
            if 'alpha' in ch:
                # ⚠️ 4.0 專用的單通道時間軸。漏掉的話該 slot 會以全不透明畫出來
                # —— Miami 用它把 bat_highlight / arm_r2 / body_lights 這幾個
                # additive 高光關掉，不處理的話球棒與手臂會整片發亮。
                v = _sample(ch['alpha'], [('value', 0.0)], t, self.v38)
                if v is not None:
                    st[sn]['color'][3] = v[0]
            if 'rgba2' in ch or 'rgb2' in ch or 'twoColor' in ch:
                self._warn_once('two-color tint（dark 色）還沒實作，'
                                '有用到的 slot 顏色會跟官方不同')
        return st

    def _warn_once(self, msg):
        if not hasattr(self, '_warned'):
            self._warned = set()
        if msg not in self._warned:
            self._warned.add(msg)
            print('警告：' + msg)

    def _draw_order(self, A, t):
        order = list(range(len(self.slots)))
        if A.get('drawOrder'):
            cur = None
            for k in A['drawOrder']:
                if k.get('time', 0.0) <= t:
                    cur = k
            if cur and cur.get('offsets'):
                order = self._apply_draw_order(cur['offsets'])
        return order

    def _deform_state(self, A, t):
        dfm = {}
        for _skin, ss in A.get('deform', {}).items():
            for sl, atts in ss.items():
                for att, ks in atts.items():
                    if t < ks[0].get('time', 0.0):
                        continue              # 第一幀之前 → 不變形
                    if t <= ks[0].get('time', 0.0):
                        v = self._dverts(ks[0])
                    elif t >= ks[-1].get('time', 0.0):
                        v = self._dverts(ks[-1])
                    else:
                        i = 0
                        while i + 1 < len(ks) and ks[i + 1].get('time', 0.0) < t:
                            i += 1
                        a_, b_ = ks[i], ks[i + 1]
                        t0, t1 = a_.get('time', 0.0), b_.get('time', 0.0)
                        p = 0.0 if t1 <= t0 else (t - t0) / (t1 - t0)
                        va, vb = self._dverts(a_), self._dverts(b_)
                        n = max(len(va), len(vb))
                        va += [0.0] * (n - len(va))
                        vb += [0.0] * (n - len(vb))
                        v = [va[j] + (vb[j] - va[j]) * p for j in range(n)]
                    if v:
                        dfm[(sl, att)] = v
        return dfm


    def _compose(self, B, b, loc):
        """一根骨的世界變換。

        照 Spine 的 `Bone.update()` 實作，不是單純的矩陣相乘 ——
        transform 繼承模式會改寫旋轉的部分，而 worldX/Y 是用【未改寫前】的
        父矩陣算的。浣熊的 `hip_bone` 是 `noRotationOrReflection`，
        而整個上半身掛在它底下，用矩陣相乘會整批錯。
        """
        rot, x, y, sx, sy, shx, shy = loc
        n = b['name']
        # 官方 updateWorldTransformWith() 會同時寫入 ax/ay/arotation/...，
        # 後面的 IK 與 local transform 約束會讀這些值
        self._applied[n] = loc
        self._valid[n] = True
        cd, sd, r = math.cos, math.sin, math.radians
        skx = sky = 1.0
        p = b.get('parent')
        if p is None:
            ra, rb = r(rot + shx), r(rot + shy + 90.0)
            B[n] = [cd(ra) * sx, cd(rb) * sy, sd(ra) * sx, sd(rb) * sy, x, y]
            return
        pa, pb, pc, pdd, pwx, pwy = B[p]
        wx = pa * x + pb * y + pwx
        wy = pc * x + pdd * y + pwy
        mode = b.get('transform', 'normal')
        if mode == 'normal':
            ra, rb = r(rot + shx), r(rot + shy + 90.0)
            la, lb = cd(ra) * sx, cd(rb) * sy
            lc, ld = sd(ra) * sx, sd(rb) * sy
            B[n] = [pa * la + pb * lc, pa * lb + pb * ld,
                    pc * la + pdd * lc, pc * lb + pdd * ld, wx, wy]
        elif mode == 'onlyTranslation':
            ra, rb = r(rot + shx), r(rot + shy + 90.0)
            B[n] = [cd(ra) * sx, cd(rb) * sy, sd(ra) * sx, sd(rb) * sy, wx, wy]
        elif mode == 'noRotationOrReflection':
            ss = pa * pa + pc * pc
            if ss > 0.0001:
                ss = abs(pa * pdd - pb * pc) / ss
                pa2 = pa / skx
                pc2 = pc / sky
                pb2 = pc2 * ss
                pd2 = pa2 * ss
                prx = math.degrees(math.atan2(pc2, pa2))
            else:
                pa2 = pc2 = 0.0
                pb2, pd2 = pb, pdd
                prx = 90.0 - math.degrees(math.atan2(pdd, pb))
            rx = r(rot + shx - prx)
            ry = r(rot + shy - prx + 90.0)
            la, lb = cd(rx) * sx, cd(ry) * sy
            lc, ld = sd(rx) * sx, sd(ry) * sy
            # 官方 Bone.update() 在這個分支的前兩項是【減】，不是加；
            # 之前沒被抓到是因為 path 約束沒實作時 bone 是單位矩陣，pb2=0。
            B[n] = [pa2 * la - pb2 * lc, pa2 * lb - pb2 * ld,
                    pc2 * la + pd2 * lc, pc2 * lb + pd2 * ld, wx, wy]
        else:   # noScale / noScaleOrReflection
            cosr, sinr = cd(r(rot)), sd(r(rot))
            za = (pa * cosr + pb * sinr) / skx
            zc = (pc * cosr + pdd * sinr) / sky
            sl = math.sqrt(za * za + zc * zc)
            if sl > 0.00001:
                sl = 1.0 / sl
            za *= sl
            zc *= sl
            sl = math.sqrt(za * za + zc * zc)
            if (mode == 'noScale'
                    and (pa * pdd - pb * pc < 0) != ((sx < 0) != (sy < 0))):
                sl = -sl
            rr = math.pi / 2.0 + math.atan2(zc, za)
            zb = math.cos(rr) * sl
            zd = math.sin(rr) * sl
            ra2, rb2 = r(shx), r(shy + 90.0)
            la, lb = cd(ra2) * sx, cd(rb2) * sy
            lc, ld = sd(ra2) * sx, sd(rb2) * sy
            B[n] = [za * la + zb * lc, za * lb + zb * ld,
                    zc * la + zd * lc, zc * lb + zd * ld, wx, wy]

    # ------------------------------------------------------- path 約束
    def _path_world_verts(self, B, att, bone_mat, deform, start, count, out, o):
        """path attachment 的世界頂點（含加權綁定與 deform）。

        照官方 `VertexAttachment.computeWorldVertices`。Spine 的 JSON 把
        「每頂點綁幾根骨 / 骨 index / 位置 / 權重」交錯存在同一個陣列裡，
        所以要取第 `start` 個頂點得先把前面的骨數掃過一遍。
        """
        v = att['vertices']
        n = att['vertexCount'] * 2
        if len(v) == n:
            if deform:
                v = deform
            a, b, x = bone_mat[0], bone_mat[1], bone_mat[4]
            c, d, y = bone_mat[2], bone_mat[3], bone_mat[5]
            i = start
            while i < start + count:
                vx, vy = v[i], v[i + 1]
                out[o] = vx * a + vy * b + x
                out[o + 1] = vx * c + vy * d + y
                o += 2
                i += 2
            return
        # 加權：先跳過前 start/2 個頂點
        vi = 0
        skip = 0
        for _ in range(start // 2):
            nb = int(v[vi])
            vi += 1 + nb * 4
            skip += nb
        di = skip * 2
        for _ in range(count // 2):
            wx = wy = 0.0
            nb = int(v[vi]); vi += 1
            for _ in range(nb):
                bidx = int(v[vi]); vx = v[vi + 1]; vy = v[vi + 2]; wt = v[vi + 3]
                vi += 4
                if deform:
                    vx += deform[di] if di < len(deform) else 0.0
                    vy += deform[di + 1] if di + 1 < len(deform) else 0.0
                di += 2
                m = B[self.bones[bidx]['name']]
                wx += (vx * m[0] + vy * m[1] + m[4]) * wt
                wy += (vx * m[2] + vy * m[3] + m[5]) * wt
            out[o] = wx
            out[o + 1] = wy
            o += 2

    def _apply_path_one(self, B, cdef, cv, st, dfm):
        """把一串骨吸附到一條貝茲路徑上（Spine 最複雜的約束）。

        照 spine-ts 的 `PathConstraint.update()`。3.8 與 4.0 的差別：
        4.0 多了 `proportional` 間距模式，而且平移拆成 X／Y 兩個 mix。
        """
        slot = self._slot_by_name.get(cdef['target'])
        if slot is None:
            return
        att = (self.skin.get(cdef['target']) or {}).get(
            (st.get(cdef['target']) or {}).get('att'))
        if att is None or att.get('type') != 'path':
            return
        bones = cdef['bones']
        position, spacing, rotate_mix, mix_x, mix_y = cv['path'][cdef['name']]
        if (rotate_mix <= 0 and mix_x <= 0) if self.v38 else                 (rotate_mix == 0 and mix_x == 0 and mix_y == 0):
            return

        spacing_mode = cdef.get('spacingMode', 'length')
        rotate_mode = cdef.get('rotateMode', 'tangent')
        offset_rotation = cdef.get('rotation', 0.0)
        tangents = rotate_mode == 'tangent'
        scale = rotate_mode == 'chainScale'
        deform = dfm.get((cdef['target'], (st.get(cdef['target']) or {}).get('att')))

        bone_count = len(bones)
        spaces_count = bone_count if tangents else bone_count + 1
        spaces = [0.0] * spaces_count
        lengths = [0.0] * bone_count if scale else None

        if spacing_mode == 'percent':
            if scale:
                for i in range(spaces_count - 1):
                    setup_len = self._bone_len.get(bones[i], 0.0)
                    if setup_len < _PC_EPS:
                        lengths[i] = 0.0
                    else:
                        bm = B[bones[i]]
                        xx, yy = setup_len * bm[0], setup_len * bm[2]
                        lengths[i] = math.sqrt(xx * xx + yy * yy)
            for i in range(1, spaces_count):
                spaces[i] = spacing
        elif spacing_mode == 'proportional':
            # 4.0 才有的模式：先量各段實際長度，再整體正規化到 spacing
            total = 0.0
            i = 0
            while i < spaces_count - 1:
                setup_len = self._bone_len.get(bones[i], 0.0)
                if setup_len < _PC_EPS:
                    if scale:
                        lengths[i] = 0.0
                    i += 1
                    spaces[i] = spacing
                else:
                    bm = B[bones[i]]
                    xx, yy = setup_len * bm[0], setup_len * bm[2]
                    ln = math.sqrt(xx * xx + yy * yy)
                    if scale:
                        lengths[i] = ln
                    i += 1
                    spaces[i] = ln
                    total += ln
            if total > 0:
                total = spaces_count / total * spacing
                for i in range(1, spaces_count):
                    spaces[i] *= total
        else:
            length_spacing = spacing_mode == 'length'
            i = 0
            while i < spaces_count - 1:
                setup_len = self._bone_len.get(bones[i], 0.0)
                if setup_len < _PC_EPS:
                    if scale:
                        lengths[i] = 0.0
                    i += 1
                    spaces[i] = spacing
                else:
                    bm = B[bones[i]]
                    xx, yy = setup_len * bm[0], setup_len * bm[2]
                    ln = math.sqrt(xx * xx + yy * yy)
                    if scale:
                        lengths[i] = ln
                    i += 1
                    spaces[i] = ((setup_len + spacing) if length_spacing
                                 else spacing) * ln / setup_len

        out = self._path_positions(B, att, B[slot['bone']], deform, spaces,
                                   spaces_count, tangents, cdef, position)
        bone_x, bone_y = out[0], out[1]
        tip = False
        if offset_rotation == 0:
            tip = rotate_mode == 'chain'
        else:
            pb = B[slot['bone']]
            offset_rotation *= (math.pi / 180.0
                                if pb[0] * pb[3] - pb[1] * pb[2] > 0
                                else -math.pi / 180.0)

        p_i = 3
        for i in range(bone_count):
            bn = bones[i]
            bm = B[bn]
            bm[4] += (bone_x - bm[4]) * mix_x
            bm[5] += (bone_y - bm[5]) * mix_y
            x, y = out[p_i], out[p_i + 1]
            dx, dy = x - bone_x, y - bone_y
            if scale:
                ln = lengths[i]
                if ln != 0:
                    sc = (math.sqrt(dx * dx + dy * dy) / ln - 1) * rotate_mix + 1
                    bm[0] *= sc
                    bm[2] *= sc
            bone_x, bone_y = x, y
            if rotate_mix > 0:
                a_, b_, c_, d_ = bm[0], bm[1], bm[2], bm[3]
                if tangents:
                    r = out[p_i - 1]
                elif spaces[i + 1] == 0:
                    r = out[p_i + 2]
                else:
                    r = math.atan2(dy, dx)
                r -= math.atan2(c_, a_)
                if tip:
                    cs, sn = math.cos(r), math.sin(r)
                    ln = self._bone_len.get(bn, 0.0)
                    bone_x += (ln * (cs * a_ - sn * c_) - dx) * rotate_mix
                    bone_y += (ln * (sn * a_ + cs * c_) - dy) * rotate_mix
                else:
                    r += offset_rotation
                if r > math.pi:
                    r -= math.pi * 2
                elif r < -math.pi:
                    r += math.pi * 2
                r *= rotate_mix
                cs, sn = math.cos(r), math.sin(r)
                bm[0] = cs * a_ - sn * c_
                bm[1] = cs * b_ - sn * d_
                bm[2] = sn * a_ + cs * c_
                bm[3] = sn * b_ + cs * d_
            p_i += 3
            self._valid[bn] = False

    def _path_positions(self, B, att, tbone, deform, spaces, spaces_count,
                        tangents, cdef, position):
        """沿路徑取樣出每根骨該擺的位置（與切線角）。

        3.8 的做法是「把 spaces 事先乘上 pathLength」，4.0 改成一個
        `multiplier`，多了 proportional 模式。兩者在 percent 模式下等價
        （spaces[0] 恆為 0，乘不乘都一樣）。
        """
        pos_percent = cdef.get('positionMode', 'percent') == 'percent'
        spacing_mode = cdef.get('spacingMode', 'length')
        if spacing_mode == 'percent':
            multiplier = None          # = path_len，長度算出來才知道
        elif spacing_mode == 'proportional':
            multiplier = 0.0           # = path_len / spaces_count
        else:
            multiplier = 1.0
        closed = att.get('closed', False)
        vlen = att['vertexCount'] * 2
        curve_count = vlen // 6
        out = [0.0] * (spaces_count * 3 + 2)
        const_speed = att.get('constantSpeed', True)

        if not const_speed:
            path_lengths = att['lengths']
            curve_count -= 1 if closed else 2
            path_len = path_lengths[curve_count]
            if pos_percent:
                position *= path_len
            mul = (path_len if multiplier is None else
                   (path_len / spaces_count if multiplier == 0.0 else 1.0))
            world = [0.0] * 8
            prev_curve = _PC_NONE
            curve = 0
            o = 0
            for i in range(spaces_count):
                space = spaces[i] * mul
                position += space
                p = position
                if closed:
                    p %= path_len
                    if p < 0:
                        p += path_len
                    curve = 0
                elif p < 0:
                    if prev_curve != _PC_BEFORE:
                        prev_curve = _PC_BEFORE
                        self._path_world_verts(B, att, tbone, deform, 2, 4, world, 0)
                    _add_before(p, world, 0, out, o)
                    o += 3
                    continue
                elif p > path_len:
                    if prev_curve != _PC_AFTER:
                        prev_curve = _PC_AFTER
                        self._path_world_verts(B, att, tbone, deform, vlen - 6, 4, world, 0)
                    _add_after(p - path_len, world, 0, out, o)
                    o += 3
                    continue
                while True:
                    ln = path_lengths[curve]
                    if p > ln:
                        curve += 1
                        continue
                    if curve == 0:
                        p /= ln
                    else:
                        prev = path_lengths[curve - 1]
                        p = (p - prev) / (ln - prev)
                    break
                if curve != prev_curve:
                    prev_curve = curve
                    if closed and curve == curve_count:
                        self._path_world_verts(B, att, tbone, deform, vlen - 4, 4, world, 0)
                        self._path_world_verts(B, att, tbone, deform, 0, 4, world, 4)
                    else:
                        self._path_world_verts(B, att, tbone, deform, curve * 6 + 2, 8, world, 0)
                _add_curve(p, world[0], world[1], world[2], world[3],
                           world[4], world[5], world[6], world[7], out, o,
                           tangents or (i > 0 and space == 0))
                o += 3
            return out

        # constantSpeed：先把整條路徑取樣成長度表
        if closed:
            vlen += 2
            world = [0.0] * vlen
            self._path_world_verts(B, att, tbone, deform, 2, vlen - 4, world, 0)
            self._path_world_verts(B, att, tbone, deform, 0, 2, world, vlen - 4)
            world[vlen - 2] = world[0]
            world[vlen - 1] = world[1]
        else:
            curve_count -= 1
            vlen -= 4
            world = [0.0] * vlen
            self._path_world_verts(B, att, tbone, deform, 2, vlen, world, 0)

        curves = [0.0] * curve_count
        path_len = 0.0
        x1, y1 = world[0], world[1]
        w = 2
        for i in range(curve_count):
            cx1, cy1 = world[w], world[w + 1]
            cx2, cy2 = world[w + 2], world[w + 3]
            x2, y2 = world[w + 4], world[w + 5]
            tmpx = (x1 - cx1 * 2 + cx2) * 0.1875
            tmpy = (y1 - cy1 * 2 + cy2) * 0.1875
            dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 0.09375
            dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 0.09375
            ddfx = tmpx * 2 + dddfx
            ddfy = tmpy * 2 + dddfy
            dfx = (cx1 - x1) * 0.75 + tmpx + dddfx * 0.16666667
            dfy = (cy1 - y1) * 0.75 + tmpy + dddfy * 0.16666667
            path_len += math.sqrt(dfx * dfx + dfy * dfy)
            dfx += ddfx
            dfy += ddfy
            ddfx += dddfx
            ddfy += dddfy
            path_len += math.sqrt(dfx * dfx + dfy * dfy)
            dfx += ddfx
            dfy += ddfy
            path_len += math.sqrt(dfx * dfx + dfy * dfy)
            dfx += ddfx + dddfx
            dfy += ddfy + dddfy
            path_len += math.sqrt(dfx * dfx + dfy * dfy)
            curves[i] = path_len
            x1, y1 = x2, y2
            w += 6

        if pos_percent:
            position *= path_len
        elif self.v38:
            # 3.8 在等速路徑上還會再換算一次；4.0 拿掉了這一行
            position *= path_len / att['lengths'][curve_count - 1]
        mul = (path_len if multiplier is None else
               (path_len / spaces_count if multiplier == 0.0 else 1.0))

        segments = [0.0] * 10
        curve_length = 0.0
        prev_curve = _PC_NONE
        curve = 0
        segment = 0
        o = 0
        x1 = y1 = cx1 = cy1 = cx2 = cy2 = x2 = y2 = 0.0
        for i in range(spaces_count):
            space = spaces[i] * mul
            position += space
            p = position
            if closed:
                p %= path_len
                if p < 0:
                    p += path_len
                curve = 0
            elif p < 0:
                _add_before(p, world, 0, out, o)
                o += 3
                continue
            elif p > path_len:
                _add_after(p - path_len, world, vlen - 4, out, o)
                o += 3
                continue
            while True:
                ln = curves[curve]
                if p > ln:
                    curve += 1
                    continue
                if curve == 0:
                    p /= ln
                else:
                    prev = curves[curve - 1]
                    p = (p - prev) / (ln - prev)
                break
            if curve != prev_curve:
                prev_curve = curve
                ii = curve * 6
                x1, y1 = world[ii], world[ii + 1]
                cx1, cy1 = world[ii + 2], world[ii + 3]
                cx2, cy2 = world[ii + 4], world[ii + 5]
                x2, y2 = world[ii + 6], world[ii + 7]
                tmpx = (x1 - cx1 * 2 + cx2) * 0.03
                tmpy = (y1 - cy1 * 2 + cy2) * 0.03
                dddfx = ((cx1 - cx2) * 3 - x1 + x2) * 0.006
                dddfy = ((cy1 - cy2) * 3 - y1 + y2) * 0.006
                ddfx = tmpx * 2 + dddfx
                ddfy = tmpy * 2 + dddfy
                dfx = (cx1 - x1) * 0.3 + tmpx + dddfx * 0.16666667
                dfy = (cy1 - y1) * 0.3 + tmpy + dddfy * 0.16666667
                curve_length = math.sqrt(dfx * dfx + dfy * dfy)
                segments[0] = curve_length
                for ii2 in range(1, 8):
                    dfx += ddfx
                    dfy += ddfy
                    ddfx += dddfx
                    ddfy += dddfy
                    curve_length += math.sqrt(dfx * dfx + dfy * dfy)
                    segments[ii2] = curve_length
                dfx += ddfx
                dfy += ddfy
                curve_length += math.sqrt(dfx * dfx + dfy * dfy)
                segments[8] = curve_length
                dfx += ddfx + dddfx
                dfy += ddfy + dddfy
                curve_length += math.sqrt(dfx * dfx + dfy * dfy)
                segments[9] = curve_length
                segment = 0
            p *= curve_length
            while True:
                ln = segments[segment]
                if p > ln:
                    segment += 1
                    continue
                if segment == 0:
                    p /= ln
                else:
                    prev = segments[segment - 1]
                    p = segment + (p - prev) / (ln - prev)
                break
            _add_curve(p * 0.1, x1, y1, cx1, cy1, cx2, cy2, x2, y2, out, o,
                       tangents or (i > 0 and space == 0))
            o += 3
        return out

    def _expand_color_keys(self):
        """把 slot 顏色關鍵幀的 16 進位字串展開成四個數值欄位。

        這樣 `_sample` 就能跟其他通道一樣走曲線內插 —— 原本的寫法是
        直接線性內插，忽略了 curve。
        """
        for A in self.d.get('animations', {}).values():
            for ch in (A.get('slots') or {}).values():
                for key in ('color', 'rgba', 'rgb'):
                    for k in (ch.get(key) or []):
                        c = _rgba(k.get('color'))
                        k.setdefault('_r', c[0]); k.setdefault('_g', c[1])
                        k.setdefault('_b', c[2]); k.setdefault('_a', c[3])

    def _normalize_constraint_keys(self):
        """把 4.0 約束關鍵幀裡省略的欄位補回來。

        ⚠️ 這是個很容易漏的坑：`mixY` 在**每一個關鍵幀裡**的預設值是
        **該幀自己的 `mixX`**，不是約束資料上的 mixY，也不是 1。
        Miami 的 `bat_transform` 只寫 `mixX: 0`，沒寫 mixY ——
        當成 1 的話球棒會被拉走 7 個單位。`mixScaleY` 對 `mixScaleX` 同理。
        """
        if self.v38:
            return
        for A in self.d.get('animations', {}).values():
            for ks in (A.get('transform') or {}).values():
                for k in ks:
                    k.setdefault('mixY', k.get('mixX', 1.0))
                    k.setdefault('mixScaleY', k.get('mixScaleX', 1.0))
                if V40_MIXSHEARY_FREEZE and ks:
                    frozen = ks[0].get('mixShearY', 1.0)
                    for k in ks:
                        k['mixShearY'] = frozen
            for ch in (A.get('path') or {}).values():
                for k in (ch.get('mix') or []):
                    k.setdefault('mixY', k.get('mixX', 1.0))

    # ---------------------------------------------------- update cache
    def _build_cache(self):
        """照 Spine 的 `Skeleton.updateCache()` 排出更新順序。

        這不是「先算完所有骨、再套約束」—— 約束會插在骨頭中間。
        被約束的骨的子孫會被 `sortReset` 標成未排序，於是排到約束【後面】，
        自然就重算了。之前 path 用的 `_rebuild_children` 是土法煉鋼的替代品，
        碰到多個約束互相串接就會錯，現在照官方的做法。
        """
        by_name = {b['name']: b for b in self.bones}
        children = {b['name']: [] for b in self.bones}
        for b in self.bones:
            p = b.get('parent')
            if p is not None:
                children[p].append(b['name'])
        # `"skin": true` 的骨與約束只有在【當前 skin】宣告它們時才生效。
        # 官方 runtime 若沒呼叫 setSkin，skeleton.skin 就是 null，這些東西
        # 全部 inactive（但貼圖仍會從 default skin 拿）。本播放器沒有換 skin
        # 的概念，所以照 null skin 處理 —— Miami 的 expand 有 4 個
        # skin-required 的 transform 約束，硬套會讓 reference_graphic 偏 339。
        active = {b['name']: not b.get('skin', False) for b in self.bones}
        done = {b['name']: not a for b, a in
                zip(self.bones, (active[b['name']] for b in self.bones))}
        cache, reset, pushed = [], [], set()

        def sort_bone(n):
            if n is None or done.get(n, True):
                return
            sort_bone(by_name[n].get('parent'))
            done[n] = True
            cache.append(('bone', by_name[n]))
            pushed.add(n)

        def sort_reset(names):
            for n in names:
                if not active[n]:
                    continue
                if done[n]:
                    sort_reset(children[n])
                done[n] = False

        def finish(c, bones, cache_kind):
            cache.append((cache_kind, c))
            for n in bones:
                sort_reset(children[n])
            for n in bones:
                done[n] = True

        slots_by_name = {s['name']: s for s in self.slots}
        cons = [(k, c) for k in ('ik', 'transform', 'path')
                for c in (self.d.get(k) or [])]
        for order in range(len(cons)):
            for kind, c in cons:
                if c.get('order', 0) != order:
                    continue
                bones = c['bones']
                if c.get('skin', False):
                    break          # skin-required：null skin 下不生效
                if kind == 'ik':
                    sort_bone(c['target'])
                    sort_bone(bones[0])
                    if len(bones) > 1 and bones[-1] not in pushed:
                        reset.append(bones[-1])
                    cache.append(('ik', c))
                    sort_reset(children[bones[0]])
                    done[bones[-1]] = True
                elif kind == 'transform':
                    sort_bone(c['target'])
                    if c.get('local', False):
                        for n in bones:
                            sort_bone(by_name[n].get('parent'))
                            if n not in pushed:
                                reset.append(n)
                    else:
                        for n in bones:
                            sort_bone(n)
                    finish(c, bones, 'transform')
                else:
                    slot = slots_by_name.get(c['target'])
                    if slot is not None:
                        # path attachment 的頂點可能綁在別的骨上，那些骨要先算
                        for att in (self.skin.get(c['target']) or {}).values():
                            if att.get('type') != 'path':
                                continue
                            v = att.get('vertices') or []
                            if len(v) == att['vertexCount'] * 2:
                                sort_bone(slot['bone'])
                            else:
                                i = 0
                                while i < len(v):
                                    nb = int(v[i]); i += 1
                                    for _ in range(nb):
                                        sort_bone(self.bones[int(v[i])]['name'])
                                        i += 4
                    for n in bones:
                        sort_bone(n)
                    finish(c, bones, 'path')
                break

        for b in self.bones:
            sort_bone(b['name'])
        self._cache = cache
        self._cache_reset = reset

    # ------------------------------------------------ applied transform
    def _update_applied(self, B, n):
        """從世界矩陣反解回本地變換（Spine 的 `Bone.updateAppliedTransform`）。

        約束直接改寫世界矩陣之後，後面的約束若要讀這根骨的【本地】值
        （IK、local 模式的 transform 約束都會），就得先反解。
        3.8 是延遲反解（`appliedValid` 旗標），4.0 改成改完就立刻反解；
        兩者結果一樣，這裡用旗標統一處理。
        """
        if self._valid.get(n):
            return self._applied[n]
        m = B[n]
        a, b, c, d, wx, wy = m
        deg = math.degrees
        p = self._parent.get(n)
        if p is None:
            self._applied[n] = (deg(math.atan2(c, a)), wx, wy,
                                math.sqrt(a * a + c * c), math.sqrt(b * b + d * d),
                                0.0, deg(math.atan2(a * b + c * d, a * d - b * c)))
            self._valid[n] = True
            return self._applied[n]
        pa, pb, pc, pd, pwx, pwy = B[p]
        pid = 1.0 / (pa * pd - pb * pc)
        dx, dy = wx - pwx, wy - pwy
        ax = dx * pd * pid - dy * pb * pid
        ay = dy * pa * pid - dx * pc * pid
        ia, idd, ib, ic = pid * pd, pid * pa, pid * pb, pid * pc
        ra = ia * a - ib * c
        rb = ia * b - ib * d
        rc = idd * c - ic * a
        rd = idd * d - ic * b
        shx = 0.0
        sx = math.sqrt(ra * ra + rc * rc)
        if sx > 0.0001:
            det = ra * rd - rb * rc
            sy = det / sx
            shy = deg(math.atan2(ra * rb + rc * rd, det))
            rot = deg(math.atan2(rc, ra))
        else:
            sx = 0.0
            sy = math.sqrt(rb * rb + rd * rd)
            shy = 0.0
            rot = 90.0 - deg(math.atan2(rd, rb))
        self._applied[n] = (rot, ax, ay, sx, sy, shx, shy)
        self._valid[n] = True
        return self._applied[n]

    # ------------------------------------------------------- IK 約束
    def _apply_ik(self, B, c, cv):
        mix, softness, bend, compress, stretch = cv['ik'][c['name']]
        if mix == 0 and not self.v38:
            return                 # 4.0 在約束層就直接跳過；3.8 沒有這一行
        bones = c['bones']
        tm = B[c['target']]
        if len(bones) == 1:
            self._ik1(B, bones[0], tm[4], tm[5], compress, stretch,
                      c.get('uniform', False), mix)
        elif len(bones) == 2:
            if self.v38 and mix == 0:
                # 3.8 在 mix=0 時只把子骨重算一次就結束；4.0 沒有這個捷徑
                b = self._by_name[bones[1]]
                self._compose(B, b, self._local[bones[1]])
                return
            self._ik2(B, bones[0], bones[1], tm[4], tm[5], bend, stretch,
                      c.get('uniform', False), softness, mix)

    def _ik1(self, B, n, tx_, ty_, compress, stretch, uniform, alpha):
        rot, ax, ay, asx, asy, ashx, ashy = self._update_applied(B, n)
        b = self._by_name[n]
        p = b['parent']
        pa, pb, pc, pd = B[p][0], B[p][1], B[p][2], B[p][3]
        m = B[n]
        mode = b.get('transform', 'normal')
        rot_ik = -ashx - rot
        tx = ty = 0.0
        if mode == 'onlyTranslation':
            tx = tx_ - m[4]
            ty = ty_ - m[5]
        else:
            if mode == 'noRotationOrReflection':
                s = abs(pa * pd - pb * pc) / (pa * pa + pc * pc)
                sa, sc = pa, pc           # skeleton.scaleX/Y 都是 1
                pb = -sc * s
                pd = sa * s
                rot_ik += math.degrees(math.atan2(sc, sa))
            x, y = tx_ - B[p][4], ty_ - B[p][5]
            dd = pa * pd - pb * pc
            tx = (x * pd - y * pb) / dd - ax
            ty = (y * pa - x * pc) / dd - ay
        rot_ik += math.degrees(math.atan2(ty, tx))
        if asx < 0:
            rot_ik += 180.0
        if rot_ik > 180.0:
            rot_ik -= 360.0
        elif rot_ik < -180.0:
            rot_ik += 360.0
        sx, sy = asx, asy
        if compress or stretch:
            if mode in ('noScale', 'noScaleOrReflection'):
                tx = tx_ - m[4]
                ty = ty_ - m[5]
            bl = self._bone_len.get(n, 0.0) * sx
            dist = math.sqrt(tx * tx + ty * ty)
            if (compress and dist < bl) or (stretch and dist > bl and bl > 0.0001):
                s = (dist / bl - 1) * alpha + 1
                sx *= s
                if uniform:
                    sy *= s
        self._compose(B, b, (rot + rot_ik * alpha, ax, ay, sx, sy, ashx, ashy))

    def _ik2(self, B, pn, cn, tx_, ty_, bend, stretch, uniform, softness, alpha):
        prot, px, py, psx0, psy0, pshx, pshy = self._update_applied(B, pn)
        crot, cx, cy0, csx0, csy0, cshx, cshy = self._update_applied(B, cn)
        pbone, cbone = self._by_name[pn], self._by_name[cn]
        psx, psy, sx, sy, csx = psx0, psy0, psx0, psy0, csx0
        os1 = os2 = 0.0
        s2 = 1.0
        if psx < 0:
            psx = -psx; os1 = 180.0; s2 = -1.0
        if psy < 0:
            psy = -psy; s2 = -s2
        if csx < 0:
            csx = -csx; os2 = 180.0
        pm = B[pn]
        a, b, c, d = pm[0], pm[1], pm[2], pm[3]
        u = abs(psx - psy) <= 0.0001
        # 4.0 在 stretch 時也走「當成單關節」那條路，3.8 沒有
        straight = (not u) if self.v38 else (not u or stretch)
        if straight:
            cy = 0.0
            cwx = a * cx + pm[4]
            cwy = c * cx + pm[5]
        else:
            cy = cy0
            cwx = a * cx + b * cy + pm[4]
            cwy = c * cx + d * cy + pm[5]
        ppn = pbone['parent']
        pp = B[ppn]
        a, b, c, d = pp[0], pp[1], pp[2], pp[3]
        idd = 1.0 / (a * d - b * c)
        x, y = cwx - pp[4], cwy - pp[5]
        dx = (x * d - y * b) * idd - px
        dy = (y * a - x * c) * idd - py
        l1 = math.sqrt(dx * dx + dy * dy)
        l2 = self._bone_len.get(cn, 0.0) * csx
        if l1 < 0.0001:
            self._ik1(B, pn, tx_, ty_, False, stretch, False, alpha)
            self._compose(B, cbone, (0.0, cx, cy, csx0, csy0, cshx, cshy))
            return
        x, y = tx_ - pp[4], ty_ - pp[5]
        tx = (x * d - y * b) * idd - px
        ty = (y * a - x * c) * idd - py
        dd = tx * tx + ty * ty
        if softness != 0:
            softness *= psx * (csx + 1) * 0.5
            td = math.sqrt(dd)
            sd = td - l1 - l2 * psx + softness
            if sd > 0:
                p_ = min(1.0, sd / (softness * 2)) - 1
                p_ = (sd - softness * (1 - p_ * p_)) / td
                tx -= p_ * tx
                ty -= p_ * ty
                dd = tx * tx + ty * ty
        a1 = a2 = 0.0
        solved = False
        if u:
            l2 *= psx
            cos = (dd - l1 * l1 - l2 * l2) / (2 * l1 * l2)
            if cos < -1:
                cos = -1.0
            elif cos > 1:
                cos = 1.0
                if stretch:
                    s = (math.sqrt(dd) / (l1 + l2) - 1) * alpha + 1
                    sx *= s
                    if uniform and not self.v38:   # 3.8 的 apply2 沒有 uniform
                        sy *= s
            # 官方 4.0 把 acos(-1)=pi、acos(1)=0 兩個特例展開寫，數值相同
            a2 = math.acos(cos) * bend
            a = l1 + l2 * cos
            b = l2 * math.sin(a2)
            a1 = math.atan2(ty * a - tx * b, tx * a + ty * b)
        else:
            a = psx * l2
            b = psy * l2
            aa, bb = a * a, b * b
            ta = math.atan2(ty, tx)
            c = bb * l1 * l1 + aa * dd - aa * bb
            c1 = -2 * bb * l1
            c2 = bb - aa
            d = c1 * c1 - 4 * c2 * c
            if d >= 0:
                q = math.sqrt(d)
                if c1 < 0:
                    q = -q
                q = -(c1 + q) * 0.5
                r0, r1 = q / c2, c / q
                r = r0 if abs(r0) < abs(r1) else r1
                if r * r <= dd:
                    y = math.sqrt(dd - r * r) * bend
                    a1 = ta - math.atan2(y, r)
                    a2 = math.atan2(y / psy, (r - l1) / psx)
                    solved = True
            if not solved:
                min_angle, min_x = math.pi, l1 - a
                min_dist, min_y = min_x * min_x, 0.0
                max_angle, max_x = 0.0, l1 + a
                max_dist, max_y = max_x * max_x, 0.0
                c = -a * l1 / (aa - bb)
                if -1 <= c <= 1:
                    c = math.acos(c)
                    x = a * math.cos(c) + l1
                    y = b * math.sin(c)
                    d = x * x + y * y
                    if d < min_dist:
                        min_angle, min_dist, min_x, min_y = c, d, x, y
                    if d > max_dist:
                        max_angle, max_dist, max_x, max_y = c, d, x, y
                if dd <= (min_dist + max_dist) * 0.5:
                    a1 = ta - math.atan2(min_y * bend, min_x)
                    a2 = min_angle * bend
                else:
                    a1 = ta - math.atan2(max_y * bend, max_x)
                    a2 = max_angle * bend
        os = math.atan2(cy, cx) * s2
        a1 = (a1 - os) * (180.0 / math.pi) + os1 - prot
        if a1 > 180:
            a1 -= 360
        elif a1 < -180:
            a1 += 360
        # 3.8 只縮 x（沒有 uniform），4.0 兩軸都傳
        psy_out = psy0 if self.v38 else sy
        self._compose(B, pbone, (prot + a1 * alpha, px, py, sx, psy_out, 0.0, 0.0))
        a2 = ((a2 + os) * (180.0 / math.pi) - cshx) * s2 + os2 - crot
        if a2 > 180:
            a2 -= 360
        elif a2 < -180:
            a2 += 360
        self._compose(B, cbone, (crot + a2 * alpha, cx, cy, csx0, csy0, cshx, cshy))

    # ------------------------------------------------ transform 約束
    def _apply_transform(self, B, c, cv):
        mr, mx, my, msx, msy, mshy = cv['transform'][c['name']]
        if c.get('local', False):
            self._transform_local(B, c, mr, mx, my, msx, msy, mshy,
                                  c.get('relative', False))
        else:
            self._transform_world(B, c, mr, mx, my, msx, msy, mshy,
                                  c.get('relative', False))

    def _transform_world(self, B, c, mr, mx, my, msx, msy, mshy, relative):
        tm = B[c['target']]
        ta, tb, tc, td = tm[0], tm[1], tm[2], tm[3]
        rad = math.pi / 180.0
        refl = rad if ta * td - tb * tc > 0 else -rad
        off_rot = c.get('rotation', 0.0) * refl
        off_shy = c.get('shearY', 0.0) * refl
        off_x, off_y = c.get('x', 0.0), c.get('y', 0.0)
        off_sx, off_sy = c.get('scaleX', 0.0), c.get('scaleY', 0.0)
        translate = (mx != 0 or my != 0) if not self.v38 else (mx != 0)
        for n in c['bones']:
            m = B[n]
            if mr != 0:
                ba, bb, bc, bd = m[0], m[1], m[2], m[3]
                if relative:
                    r = math.atan2(tc, ta) + off_rot
                else:
                    r = math.atan2(tc, ta) - math.atan2(bc, ba) + off_rot
                if r > math.pi:
                    r -= math.pi * 2
                elif r < -math.pi:
                    r += math.pi * 2
                r *= mr
                cs, sn = math.cos(r), math.sin(r)
                m[0] = cs * ba - sn * bc
                m[1] = cs * bb - sn * bd
                m[2] = sn * ba + cs * bc
                m[3] = sn * bb + cs * bd
            if translate:
                # target.localToWorld(offsetX, offsetY)
                wx = off_x * ta + off_y * tb + tm[4]
                wy = off_x * tc + off_y * td + tm[5]
                if relative:
                    m[4] += wx * mx
                    m[5] += wy * my
                else:
                    m[4] += (wx - m[4]) * mx
                    m[5] += (wy - m[5]) * my
            if msx != 0:
                if relative:
                    s = (math.sqrt(ta * ta + tc * tc) - 1 + off_sx) * msx + 1
                else:
                    s = math.sqrt(m[0] * m[0] + m[2] * m[2])
                    if (s > 0.00001) if self.v38 else (s != 0):
                        s = (s + (math.sqrt(ta * ta + tc * tc) - s + off_sx) * msx) / s
                m[0] *= s
                m[2] *= s
            if msy != 0:
                if relative:
                    s = (math.sqrt(tb * tb + td * td) - 1 + off_sy) * msy + 1
                else:
                    s = math.sqrt(m[1] * m[1] + m[3] * m[3])
                    if (s > 0.00001) if self.v38 else (s != 0):
                        s = (s + (math.sqrt(tb * tb + td * td) - s + off_sy) * msy) / s
                m[1] *= s
                m[3] *= s
            if mshy > 0:
                bb, bd = m[1], m[3]
                by = math.atan2(bd, bb)
                if relative:
                    r = math.atan2(td, tb) - math.atan2(tc, ta)
                else:
                    r = (math.atan2(td, tb) - math.atan2(tc, ta)
                         - (by - math.atan2(m[2], m[0])))
                if r > math.pi:
                    r -= math.pi * 2
                elif r < -math.pi:
                    r += math.pi * 2
                if relative:
                    r = by + (r - math.pi / 2 + off_shy) * mshy
                else:
                    r = by + (r + off_shy) * mshy
                s = math.sqrt(bb * bb + bd * bd)
                m[1] = math.cos(r) * s
                m[3] = math.sin(r) * s
            self._valid[n] = False

    def _transform_local(self, B, c, mr, mx, my, msx, msy, mshy, relative):
        tn = c['target']
        trot, tax, tay, tsx, tsy, tshx, tshy = self._update_applied(B, tn)
        off_rot = c.get('rotation', 0.0)
        off_x, off_y = c.get('x', 0.0), c.get('y', 0.0)
        off_sx, off_sy = c.get('scaleX', 0.0), c.get('scaleY', 0.0)
        off_shy = c.get('shearY', 0.0)
        for n in c['bones']:
            rot, ax, ay, asx, asy, ashx, ashy = self._update_applied(B, n)
            if relative:
                rot = rot + (trot + off_rot) * mr
                x = ax + (tax + off_x) * mx
                y = ay + (tay + off_y) * my
                scale_x = asx * ((tsx - 1 + off_sx) * msx + 1)
                scale_y = asy * ((tsy - 1 + off_sy) * msy + 1)
                shear_y = ashy + (tshy + off_shy) * mshy
            else:
                if mr != 0:
                    r = trot - rot + off_rot
                    r -= (16384 - int(16384.499999999996 - r / 360)) * 360
                    rot += r * mr
                x = ax + (tax - ax + off_x) * mx
                y = ay + (tay - ay + off_y) * my
                scale_x, scale_y = asx, asy
                if msx != 0 and scale_x != 0:
                    scale_x = (scale_x + (tsx - scale_x + off_sx) * msx) / scale_x
                if msy != 0 and scale_y != 0:
                    scale_y = (scale_y + (tsy - scale_y + off_sy) * msy) / scale_y
                shear_y = ashy
                if mshy != 0:
                    r = tshy - shear_y + off_shy
                    r -= (16384 - int(16384.499999999996 - r / 360)) * 360
                    shear_y += r * mshy
            self._compose(B, self._by_name[n],
                          (rot, x, y, scale_x, scale_y, ashx, shear_y))

    # ----------------------------------------------- 約束的動畫參數
    def _constraint_values(self, A, t):
        """把三種約束在時間 t 的參數一次算好。

        欄位名稱 3.8 與 4.0 不同（`rotateMix` ↔ `mixRotate`、
        4.0 的平移／縮放拆成 X、Y 兩軸），這裡統一成 4.0 的六個值；
        3.8 讀進來時 X 與 Y 用同一個值。
        """
        out = {'ik': {}, 'transform': {}, 'path': {}}
        v38 = self.v38
        for c in (self.d.get('ik') or []):
            mix = c.get('mix', 1.0)
            soft = c.get('softness', 0.0)
            bend = 1 if c.get('bendPositive', True) else -1
            comp = c.get('compress', False)
            stre = c.get('stretch', False)
            ks = A.get('ik', {}).get(c['name'])
            if ks:
                v = _sample(ks, [('mix', 1.0), ('softness', 0.0)], t, v38)
                if v is not None:
                    mix, soft = v
                    # bendPositive / compress / stretch 是階梯值，取前一幀
                    k = _key_at_or_before(ks, t)
                    bend = 1 if k.get('bendPositive', True) else -1
                    comp = k.get('compress', False)
                    stre = k.get('stretch', False)
            out['ik'][c['name']] = (mix, soft, bend, comp, stre)
        for c in (self.d.get('transform') or []):
            if v38:
                mr = c.get('rotateMix', 1.0)
                mx = my = c.get('translateMix', 1.0)
                msx = msy = c.get('scaleMix', 1.0)
                mshy = c.get('shearMix', 1.0)
                fields = [('rotateMix', 1.0), ('translateMix', 1.0),
                          ('scaleMix', 1.0), ('shearMix', 1.0)]
            else:
                mr = c.get('mixRotate', 1.0)
                mx = c.get('mixX', 1.0)
                my = c.get('mixY', mx)
                msx = c.get('mixScaleX', 1.0)
                msy = c.get('mixScaleY', msx)
                mshy = c.get('mixShearY', 1.0)
                # 時間軸的預設值是字面量 1，不是約束資料上的值
                fields = [('mixRotate', 1.0), ('mixX', 1.0), ('mixY', 1.0),
                          ('mixScaleX', 1.0), ('mixScaleY', 1.0),
                          ('mixShearY', 1.0)]
            ks = A.get('transform', {}).get(c['name'])
            if ks:
                v = _sample(ks, fields, t, v38)
                if v is not None:
                    if v38:
                        mr, mx, msx, mshy = v
                        my, msy = mx, msx
                    else:
                        mr, mx, my, msx, msy, mshy = v
            out['transform'][c['name']] = (mr, mx, my, msx, msy, mshy)
        for c in (self.d.get('path') or []):
            position = c.get('position', 0.0)
            spacing = c.get('spacing', 0.0)
            if v38:
                mr = c.get('rotateMix', 1.0)
                mx = my = c.get('translateMix', 1.0)
                mix_fields = [('rotateMix', 1.0), ('translateMix', 1.0)]
            else:
                mr = c.get('mixRotate', 1.0)
                mx = c.get('mixX', 1.0)
                my = c.get('mixY', mx)
                mix_fields = [('mixRotate', 1.0), ('mixX', 1.0), ('mixY', 1.0)]
            pa = A.get('path', {}).get(c['name'], {})
            # 3.8 的關鍵幀把值存在跟通道同名的欄位（position / spacing），
            # 4.0 統一改成 `value`。兩者的預設值都是 0，不是約束上的設定值。
            for chan, setter in (('position', 0), ('spacing', 1)):
                if chan not in pa:
                    continue
                v = _sample(pa[chan], [(chan if v38 else 'value', 0.0)], t, v38)
                if v is None:
                    continue
                if setter == 0:
                    position = v[0]
                else:
                    spacing = v[0]
            if 'mix' in pa:
                v = _sample(pa['mix'], mix_fields, t, v38)
                if v is not None:
                    if v38:
                        mr, mx = v
                        my = mx
                    else:
                        mr, mx, my = v
            out['path'][c['name']] = (position, spacing, mr, mx, my)
        return out

    @staticmethod
    def _dverts(k):
        return ([0.0] * k.get('offset', 0)) + list(k.get('vertices') or [])

    def _apply_draw_order(self, offsets):
        n = len(self.slots)
        idx = {s['name']: i for i, s in enumerate(self.slots)}
        shifted = {idx[o['slot']]: o['offset'] for o in offsets if o['slot'] in idx}
        out = [None] * n
        for si, off in shifted.items():
            tgt = min(max(si + off, 0), n - 1)
            while out[tgt] is not None and tgt < n - 1:
                tgt += 1
            out[tgt] = si
        rest = (i for i in range(n) if i not in shifted)
        for i in range(n):
            if out[i] is None:
                out[i] = next(rest)
        return out

    # ------------------------------------------------------------- 畫
    def render(self, scale=1.0, bg=(0, 0, 0, 0), pad=8):
        sk = self.d['skeleton']
        sw, sh = sk.get('width', 1000.0), sk.get('height', 1000.0)
        W = int(sw * scale) + pad * 2
        H = int(sh * scale) + pad * 2
        ox = -sk.get('x', 0.0) * scale + pad
        oy = (sk.get('y', 0.0) + sh) * scale + pad
        dst = np.zeros((H, W, 4), np.float64)
        dst[:, :] = np.array(bg, float)

        st, order, dfm = self._posed
        clip_area = None      # 生效中的裁切多邊形（世界座標，順時針）
        clip_end = None       # 裁切到哪個 slot（含）為止
        for si in order:
            s = self.slots[si]
            sn = s['name']
            info = st[sn]
            att = info['att']
            a = self.skin.get(sn, {}).get(att) if att else None
            if a is not None and a.get('type') == 'clipping':
                # 裁切本身不畫，只是開啟一個裁切區
                if clip_area is None:
                    clip_area = self._clip_polygon(a, sn, att, dfm)
                    clip_end = a.get('end', sn)
                continue
            area = clip_area
            if clip_area is not None and clip_end == sn:
                clip_area = None      # 官方是【畫完這個 slot】才 clipEnd
            if not att or info['color'][3] <= 0.002:
                continue
            if a is None or a.get('type', 'region') not in ('region', 'mesh'):
                continue
            a = dict(a, _name=att)
            if a.get('type', 'region') == 'region':
                world, uv, tris = self._region_geom(a, sn)
            else:
                world, uv, tris = self._mesh_geom(a, sn, att, dfm)
            if world is None:
                continue
            scr = np.stack([world[:, 0] * scale + ox,
                            oy - world[:, 1] * scale], 1)
            uvpix = np.stack([uv[:, 0] * self.page.width,
                              uv[:, 1] * self.page.height], 1)
            for tri in tris:
                if area is None:
                    self._tri(dst, self.page_np, scr[tri], uvpix[tri],
                              info['color'], info['blend'], self.v38)
                    continue
                P, T = world[tri], uvpix[tri]
                r = _clip_tri_uv(P[0, 0], P[0, 1], P[1, 0], P[1, 1],
                                 P[2, 0], P[2, 1],
                                 T[0, 0], T[0, 1], T[1, 0], T[1, 1],
                                 T[2, 0], T[2, 1], area)
                if r is None:
                    continue
                pts, uvs, sub = r
                pw = np.array(pts, float)
                ps = np.stack([pw[:, 0] * scale + ox, oy - pw[:, 1] * scale], 1)
                pu = np.array(uvs, float)
                for t3 in sub:
                    self._tri(dst, self.page_np, ps[list(t3)], pu[list(t3)],
                              info['color'], info['blend'], self.v38)
        return Image.fromarray(np.clip(dst, 0, 255).astype('uint8'), 'RGBA')

    def _clip_polygon(self, a, sn, att, dfm):
        """clipping attachment 的世界多邊形（順時針、尾端接回起點）。

        只支援【凸】多邊形 —— 官方會先把凹多邊形拆成數個凸多邊形再逐一裁，
        這裡不做，凹的會警告。Hacksaw 這幾支用的都是四邊形。
        """
        n = a['vertexCount'] * 2
        world = [0.0] * n
        self._path_world_verts(self._Bw, a, self._Bw[self.slot_bone[sn]],
                               dfm.get((sn, att)), 0, n, world, 0)
        _make_clockwise(world)
        if not _is_convex(world):
            print('警告：%s 的 clipping 是凹多邊形，本播放器只做凸的，'
                  '裁切結果會跟官方不同' % sn)
        return world + [world[0], world[1]]

    def _region_geom(self, a, sn):
        reg = self._region_of(a, sn)
        if reg is None:
            return None, None, None
        w = a.get('width', reg['bounds'][2])
        h = a.get('height', reg['bounds'][3])
        rs = math.radians(a.get('rotation', 0.0))
        sx_, sy_ = a.get('scaleX', 1.0), a.get('scaleY', 1.0)
        local = np.array([[math.cos(rs) * sx_, -math.sin(rs) * sy_, a.get('x', 0.0)],
                          [math.sin(rs) * sx_, math.cos(rs) * sy_, a.get('y', 0.0)],
                          [0.0, 0.0, 1.0]])
        M = np.vstack([self.W[self.slot_bone[sn]], [0, 0, 1]]) @ local
        pts = np.array([[-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2]])
        world = (pts @ M[:2, :2].T) + M[:2, 2]
        # 四角對應的 region-local uv：左下、右下、右上、左上（y 向下為 1）
        corner = np.array([[0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]])
        uv = self._page_uv(corner, reg)
        tris = np.array([[0, 1, 2], [0, 2, 3]])
        return world, uv, tris

    def _mesh_geom(self, a, sn, att, dfm):
        v = list(a['vertices'])
        nuv = len(a['uvs']) // 2
        d = dfm.get((sn, att))
        if len(v) == nuv * 2:
            base = np.array(v, float).reshape(-1, 2)
            if d:
                dd = np.array((d + [0.0] * (nuv * 2 - len(d)))[:nuv * 2],
                              float).reshape(-1, 2)
                base = base + dd
            M = self.W[self.slot_bone[sn]]
            world = (base @ M[:, :2].T) + M[:, 2]
        else:
            world = np.zeros((nuv, 2))
            i = k = di = 0
            while k < nuv:
                n = int(v[i]); i += 1
                px = py = 0.0
                for _ in range(n):
                    bidx = int(v[i]); vx = v[i+1]; vy = v[i+2]; wt = v[i+3]
                    i += 4
                    if d:
                        vx += d[di] if di < len(d) else 0.0
                        vy += d[di+1] if di + 1 < len(d) else 0.0
                    di += 2
                    M = self.W[self.bones[bidx]['name']]
                    px += (M[0, 0]*vx + M[0, 1]*vy + M[0, 2]) * wt
                    py += (M[1, 0]*vx + M[1, 1]*vy + M[1, 2]) * wt
                world[k] = (px, py); k += 1
        reg = self._region_of(a, sn)
        if reg is None:
            return None, None, None
        uv = self._page_uv(np.array(a['uvs'], float).reshape(-1, 2), reg)
        tris = np.array(a['triangles']).reshape(-1, 3)
        return world, uv, tris

    @staticmethod
    def _tri(dst, page, P, T, col, blend, self_v38=False):
        H, W = dst.shape[:2]
        ph, pw = page.shape[:2]
        x0 = max(0, int(np.floor(P[:, 0].min())))
        x1 = min(W, int(np.ceil(P[:, 0].max())) + 1)
        y0 = max(0, int(np.floor(P[:, 1].min())))
        y1 = min(H, int(np.ceil(P[:, 1].max())) + 1)
        if x1 <= x0 or y1 <= y0:
            return
        yy, xx = np.mgrid[y0:y1, x0:x1]
        px = xx.ravel() + 0.5
        py = yy.ravel() + 0.5
        a, b, c = P
        den = (b[1]-c[1])*(a[0]-c[0]) + (c[0]-b[0])*(a[1]-c[1])
        if abs(den) < 1e-9:
            return
        w0 = ((b[1]-c[1])*(px-c[0]) + (c[0]-b[0])*(py-c[1])) / den
        w1 = ((c[1]-a[1])*(px-c[0]) + (a[0]-c[0])*(py-c[1])) / den
        w2 = 1.0 - w0 - w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not m.any():
            return
        u = w0[m]*T[0, 0] + w1[m]*T[1, 0] + w2[m]*T[2, 0]
        vv = w0[m]*T[0, 1] + w1[m]*T[1, 1] + w2[m]*T[2, 1]
        # 雙線性取樣 —— atlas 的 filter 是 Linear,Linear，用最近鄰會讓
        # 邊緣鋸齒並讓跟官方 runtime 的差異放大一個量級
        fu = np.clip(u - 0.5, 0, pw - 1.001)
        fv = np.clip(vv - 0.5, 0, ph - 1.001)
        u0 = fu.astype(int); v0 = fv.astype(int)
        u1 = np.minimum(u0 + 1, pw - 1); v1 = np.minimum(v0 + 1, ph - 1)
        au = (fu - u0)[:, None]; av = (fv - v0)[:, None]
        s = ((page[v0, u0] * (1 - au) + page[v0, u1] * au) * (1 - av)
             + (page[v1, u0] * (1 - au) + page[v1, u1] * au) * av)
        sa = (s[:, 3] / 255.0) * col[3]
        rgb = s[:, :3] * np.array(col[:3], float)
        Y = yy.ravel()[m]
        X = xx.ravel()[m]
        d = dst[Y, X]
        da = d[:, 3] / 255.0
        # dst 存的是 straight alpha，但 GL 的混合是在【預乘】值上做的，
        # 所以要先乘回去、混完再除。additive 之前直接把 rgb*sa 加到 straight
        # 值上，在半透明處會偏亮 —— Miami 的球棒與右臂高光就是這樣糊掉的。
        if blend == 'additive':
            # srcColor=SRC_ALPHA dst=ONE；alpha 端 4.0 是 ONE、3.8 是 SRC_ALPHA
            prem = np.clip(d[:, :3] * da[:, None] + rgb * sa[:, None], 0, 255)
            oa = np.clip((sa * sa if self_v38 else sa) + da, 0, 1)
        else:
            prem = np.clip(rgb * sa[:, None] + d[:, :3] * (da * (1 - sa))[:, None],
                           0, 255)
            oa = sa + da * (1 - sa)
        safe = np.maximum(oa, 1e-6)
        dst[Y, X, :3] = prem / safe[:, None]
        dst[Y, X, 3] = oa * 255.0
