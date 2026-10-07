# -*- coding: utf-8 -*-
"""export_pack.py — 把一支骨架的【動作】抽出來，做成可攜的 motion pack。

    python export_pack.py <skeleton.json> --name le_bandit_raccoon -o packs/

產出一個 JSON，裡面只有動作，**沒有任何貼圖、uv、網格頂點或 atlas**：

| 有 | 沒有 |
|---|---|
| 骨骼階層與 setup 變換 | 貼圖頁、atlas、uv |
| IK / transform / path 約束 | 網格頂點、deform |
| 全部動畫的關鍵幀與曲線 | 任何一個像素 |
| 每一層在 bind pose 的四邊形（位置／大小／角度）| 那一層長什麼樣子 |
| bind pose 的關節座標與比例 | — |

為什麼可以這樣切：**時序、比例、幅度、結構決定**是手藝，照著做是公平的；
**美術**是財產。四邊形是「這塊圖該貼在哪、多大」的幾何，不是圖本身 ——
它描述的是使用者自己畫的那張圖要怎麼擺。

> 這些資料是從別人的骨架檔量出來的，**實驗與研究用途**。
> 產出的 pack 不要進產品，也不要散布。見 `rig/PROVENANCE.md`。

## 怎麼用

pack 本身不能 render（沒有貼圖）。`motionlib.py` 會把使用者自己的 PNG
接上去：每個 `layers` 條目對應一張使用者要準備的圖，pack 說了它該多大、
擺在哪根骨的哪個位置、bind pose 下的角度是多少。
"""
from __future__ import print_function

import argparse
import json
import os
import sys

import math

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spine import Skeleton                                   # noqa: E402
from retarget import attachment_quad, slice_original, Retargeted  # noqa: E402
import artfit                                                # noqa: E402
import partguide                                             # noqa: E402
import posecheck                                             # noqa: E402

# 黃金值抽樣：每段動畫取這幾個相對時間點
GOLDEN_FRACTIONS = (0.0, 0.23, 0.47, 0.71, 0.93)
# 驗證自動擬合可不可靠時，把原件（和輪廓範本）轉這些角度
FIT_PROBE_ANGLES = (17, -33, 61, -84, 128, 196)      # 全部過 → 畫成任何角度都行
UPRIGHT_PROBE_ANGLES = (0, 17, -33, 61, -72)          # 只過這些 → 要照範本方向畫
FIT_PROBE_TOL = 0.04     # 錨點回推誤差 / 圖的長邊
# 校準檢查門檻用的良性擾動：轉這些角度、縮這些倍率，都不該被擋
# 用【複合】擾動校準：真實的使用者圖是轉過、縮過、又帶留白的，
# 重採樣的損失會疊加。只用單一擾動校準會把門檻訂得太緊。
CAL_VARIANTS = ((23, 1.0), (-47, 0.7), (91, 1.35), (-134, 0.6),
                (178, 1.5), (0, 0.55), (0, 1.6), (61, 0.8), (-99, 1.2))
CAL_PAD = 0.3            # 額外加的透明留白比例
CAL_MARGIN = 1.6         # 門檻 = 良性波動最大值 × 這個倍數


def bind_pose(sk):
    """setup pose（任何關鍵幀之前）的骨骼世界變換。"""
    sk.pose(sk.animations[0], -1e9)
    return sk


def joint_sheet(sk):
    """bind pose 的關節座標與比例 —— 生圖時要對的就是這個。

    座標正規化成「骨架高 = 1000」，這樣不管使用者的圖多大都能比。
    """
    sd = sk.d['skeleton']
    h = float(sd.get('height') or 0) or 1000.0
    k = 1000.0 / h
    joints = {}
    for b in sk.bones:
        n = b['name']
        if n not in sk.W:            # 這個 skin 用不到的骨（換裝骨架）
            continue
        M = sk.W[n]
        ang = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        ln = sk._bone_len.get(n, 0.0)
        tip = (M[:, :2] @ np.array([ln, 0.0])) + M[:, 2]
        joints[n] = {
            'parent': b.get('parent'),
            'xy': [round(float(M[0, 2]) * k, 2), round(float(M[1, 2]) * k, 2)],
            'tip': [round(float(tip[0]) * k, 2), round(float(tip[1]) * k, 2)],
            'angle': round(ang, 2),
            'len': round(float(ln) * k, 2),
        }
    return {'normalized_height': 1000.0, 'source_height': h,
            'scale_to_normalized': round(k, 6), 'bones': joints}


def _anchor_uv(local, bone_len):
    """骨頭的起點與末端落在這張圖的哪裡，用 0..1 的圖內座標表示。

    這是「機械檢查生成的圖」的關鍵：四邊形說的是這塊圖要擺在哪，
    anchor 說的是**圖裡面的關節應該在哪個位置**。兩者一比，就知道
    使用者畫的手臂是不是指錯方向了。

    回傳 [[u0, v0], [u1, v1]]，u 從左、v 從下（跟 render 的 uv 對應）。
    """
    c0, c1, c3 = local[0], local[1], local[3]
    A = np.array([c1 - c0, c3 - c0]).T
    try:
        inv = np.linalg.inv(A)
    except np.linalg.LinAlgError:
        return None
    out = []
    for p in (np.array([0.0, 0.0]), np.array([float(bone_len), 0.0])):
        uv = inv @ (p - c0)
        out.append([round(float(uv[0]), 4), round(float(uv[1]), 4)])
    return out


SIL_N = 64


def silhouette_bits(im, n=SIL_N):
    """零件輪廓的 64×64 佔有格（零件圖本身的座標軸），存成 16 進位字串。

    `--guide` 的輪廓範本就是從這裡畫的，檢查門檻也拿範本一起校準過 ——
    照範本畫一定會過。遮罩跟檢查用的是同一個（alpha > 24、去掉雜點），
    範本才會跟檢查量到的東西一致。沒有顏色、沒有細節。
    """
    a = artfit.alpha_mask(im).astype(float)
    h, w = a.shape
    g = np.zeros((n, n))
    for j in range(n):
        for i in range(n):
            y0, y1 = int(h * j / n), max(int(h * j / n) + 1, int(h * (j + 1) / n))
            x0, x1 = int(w * i / n), max(int(w * i / n) + 1, int(w * (i + 1) / n))
            g[j, i] = a[y0:y1, x0:x1].mean()
    bits = (g > 0.5).astype(int).ravel()
    return _hex_bits(bits, n)


def box_bits(im, n=SIL_N):
    """自由形狀（對話框裡的字）：只存外框（填滿的矩形），不存原作的字形。

    這種零件使用者本來就要寫自己的字，檢查也只看長寬比 —— 範本給一個
    比例正確的框就夠了，原作的字不該跟著範本出去。
    """
    m = artfit.alpha_mask(im)
    ys, xs = np.nonzero(m)
    h, w = m.shape
    box = np.zeros((h, w), float)
    if len(xs):
        box[ys.min():ys.max() + 1, xs.min():xs.max() + 1] = 1.0
    g = np.zeros((n, n))
    for j in range(n):
        for i in range(n):
            y0, y1 = int(h * j / n), max(int(h * j / n) + 1, int(h * (j + 1) / n))
            x0, x1 = int(w * i / n), max(int(w * i / n) + 1, int(w * (i + 1) / n))
            g[j, i] = box[y0:y1, x0:x1].mean()
    return _hex_bits((g > 0.5).astype(int).ravel(), n)


def _hex_bits(bits, n):
    val = 0
    for b in bits:
        val = (val << 1) | int(b)
    return format(val, '0%dx' % (n * n // 4))


def slice_affine(sk):
    """每個零件：「原作零件圖的像素」→「bind pose 世界座標」的仿射（6 個數字）。

    這是讓切層路線也能走網格投影的關鍵。使用者畫的零件圖，先用形狀座標系
    對到原作零件圖的框架上，再用這個仿射送到 bind pose —— 每個頂點的 uv
    就這樣算出來，網格變形完整保留。

    存的是「零件圖的框放在骨架哪裡」，跟 region attachment 的 x/y/rotation/
    width/height 同一類，**不是 uv**。Le Bandit 45 個零件的仿射殘差全部
    < 0.14 像素（網格是照著圖放的，沒有事後改動），所以用它還原是精確的。
    Miami 的網格在綁定後被改過（殘差可達 27 像素），但 Miami 走一張圖路線，
    用不到這個。
    """
    sk.pose(sk.animations[0], -1e9)
    PW, PH = sk.page.size
    out = {}
    for sn, atts in sk.skin.items():
        for att, a in (atts or {}).items():
            typ = a.get('type', 'region')
            if typ not in ('region', 'mesh'):
                continue
            if sk.att_inactive(sn, a):
                continue
            a2 = dict(a, _name=att)
            if typ == 'mesh':
                w, uv, _t = sk._mesh_geom(a2, sn, att, {})
            else:
                w, uv, _t = sk._region_geom(a2, sn)
            if w is None:
                continue
            reg = sk._region_of(a2, sn)
            bx, by, bw, bh = reg['bounds']
            x = uv[:, 0] * PW - bx
            y = uv[:, 1] * PH - by
            sp = np.stack([bw - y, x], 1) if reg['rotate'] else np.stack([x, y], 1)
            X = np.hstack([sp, np.ones((len(sp), 1))])
            A = np.linalg.lstsq(X, w, rcond=None)[0]
            sc = math.sqrt(abs(np.linalg.det(A[:2, :2]))) or 1e-9
            resid = float(np.abs(X @ A - w).max()) / sc
            out['%s/%s' % (sn, att)] = (
                [[round(float(v), 7) for v in row] for row in A], round(resid, 4))
    return out


def skin_geometry(sk):
    """每個 region / mesh / clipping attachment 的幾何，去掉 uv 與 atlas 路徑。"""
    out = {}
    for sn, atts in sk.skin.items():
        for an, a in (atts or {}).items():
            typ = a.get('type', 'region')
            if typ not in ('region', 'mesh', 'clipping'):
                continue
            if sk.att_inactive(sn, a):      # 這個 skin 沒有的骨 → 這個 attachment 不存在
                continue
            g = {k: v for k, v in a.items() if k not in ('uvs', 'path')}
            if typ == 'mesh':
                g['vertexCount'] = len(a['uvs']) // 2
            out.setdefault(sn, {})[an] = g
    return out


def mesh_golden(sk):
    """網格頂點的黃金值：每段動畫取三個時間點，所有可畫 attachment 的
    頂點平均位置與分散度。

    用**原生**播放器（讀原始骨架檔、有 uv）的網格計算產生 —— 另一台機器
    用 pack（沒有 uv）重算，兩邊要一致。這證明網格變形與 deform 時間軸
    在沒有任何 Hacksaw 素材的機器上也算對了。
    """
    out = {}
    for an in sk.animations:
        dur = sk.duration(an) or 1.0
        rows = []
        for f in (0.2, 0.55, 0.9):
            t = dur * f
            sk.pose(an, t)
            _st, _order, dfm = sk._posed
            pts = []
            for sl in sk.slots:
                sn = sl['name']
                for att, a in sorted((sk.skin.get(sn) or {}).items()):
                    typ = a.get('type', 'region')
                    if sk.att_inactive(sn, a):
                        continue
                    a2 = dict(a, _name=att)
                    if typ == 'mesh':
                        w, _u, _t = sk._mesh_geom(a2, sn, att, dfm)
                    elif typ == 'region':
                        w, _u, _t = sk._region_geom(a2, sn)
                    else:
                        continue
                    if w is not None:
                        pts.append(w)
            P = np.concatenate(pts, 0)
            c = P.mean(0)
            rows.append([round(t, 6), round(float(c[0]), 4),
                         round(float(c[1]), 4),
                         round(float(np.sqrt(((P - c) ** 2).sum(1).mean())), 4),
                         int(len(P))])
        out[an] = rows
    return out


def _cmp(a, b):
    A = np.asarray(a).astype(float)
    B = np.asarray(b).astype(float)
    ca, cb = A[..., 3] > 8, B[..., 3] > 8
    u = (ca | cb).sum()
    return float((ca & cb).sum()) / u if u else 1.0


def _solo_part(sk, att, S, pad):
    """原生播放器在 bind pose 只畫一個零件（所有用到它的 slot），裁好回傳。

    這就是「完美的同畫布零件圖層」—— 被擋住的部分也是完整的。建包時用它
    量完美路線的上限；量完就丟，不會進 pack。
    """
    from PIL import Image as _I
    sk.pose(sk.animations[0], -1e9)
    st, od, df = sk._posed
    users = {k for k, atts in sk.skin.items() if att in (atts or {})}
    st2 = {k: dict(v, att=(att if k in users else None),
                   color=list(v['color'][:3]) + [1.0], blend=None)
           for k, v in st.items()}
    sk._posed = (st2, od, df)
    saved = Skeleton._clip_polygon
    Skeleton._clip_polygon = lambda self, *q, **k: None
    try:
        im = sk.render(scale=S, pad=pad)
    finally:
        Skeleton._clip_polygon = saved
    a = np.asarray(im)
    m = a[..., 3] > 0
    if not m.any():
        return None
    ys, xs = np.nonzero(m)
    x0, y0 = max(0, xs.min() - 2), max(0, ys.min() - 2)
    return _I.fromarray(a[y0:ys.max() + 3, x0:xs.max() + 3], 'RGBA'), (x0, y0)


def measure_routes(path, pack, art, quiet=True, S=2.0):
    """拿原作自己當輸入，量三條路線各自能重現到多少（跟原生渲染比最差 IoU）。

    * image：一張 bind pose 全身圖
    * parts：一張全身圖＋每個零件的同畫布圖層（被擋住的部分也完整）
    * layers：每個零件一張獨立的零件圖

    「使用者的圖」用 2 倍解析度產生 —— 真實使用時使用者的圖就是原始檔，
    只會被取樣一次；用 1 倍會多一次重新取樣，把輪廓糊掉半個像素，
    量出來的是測試的誤差不是方法的誤差。

    另外回傳每一層在 bind pose 被原作不透明像素蓋住多少（cov_ref），
    給 image 路線的 checkpose 當基準。
    """
    import motionlib
    from meshproj import ProjRig, bind_world, drawable, tris_of, raster
    nat = Skeleton(path, quiet=quiet)
    sd = nat.d['skeleton']
    pad = 8
    full = nat.pose(nat.animations[0], -1e9).render(scale=S, pad=pad)
    mapping = (S, -sd.get('x', 0.0) * S + pad,
               (sd.get('y', 0.0) + sd.get('height', 1000.0)) * S + pad)

    def rig(**kw):
        mp = motionlib.MotionPack.from_dict(dict(pack))
        return ProjRig.build(mp.sk, pack['layers'], **kw), mp

    r_img, mp_img = rig(full=full, mapping=mapping)
    solo = Skeleton(path, quiet=quiet)
    parts = {}
    for _sn, att, _a in drawable(mp_img.sk):
        if att not in parts:
            got = _solo_part(solo, att, S, pad)
            if got is not None:
                parts[att] = got
    r_parts, _m = rig(full=full, mapping=mapping, parts=parts)
    r_lay, _m = rig(layers=art)
    worst = {'image': 1.0, 'parts': 1.0, 'layers': 1.0}
    for an in nat.animations:
        dur = nat.duration(an) or 1.0
        for f in (0.15, 0.5, 0.85):
            t = dur * f
            ref = nat.pose(an, t).render(scale=0.25)
            for k, r in (('image', r_img), ('parts', r_parts), ('layers', r_lay)):
                worst[k] = min(worst[k], _cmp(ref, r.pose(an, t).render(scale=0.25)))

    alpha = np.asarray(full)[..., 3] > 24
    bw = bind_world(mp_img.sk)
    cov = {}
    H, W = alpha.shape
    for sn, att, a in drawable(mp_img.sk):
        w = bw.get((sn, att))
        if w is None:
            continue
        m = raster([(w, tris_of(a))], mapping[0], mapping[1], mapping[2], W, H)
        if m.sum() < 20:
            continue
        cov['%s/%s' % (sn, att)] = round(float((alpha & m).sum()) / m.sum(), 4)
    return {k: round(v, 4) for k, v in worst.items()}, cov


def art_bbox(sk, scale=1.0, pad=8):
    """bind pose 下，美術**實際不透明**範圍的世界座標外框（4 個數字）。

    網格會比美術多一圈透明邊，所以拿網格剪影對齊使用者的圖會偏幾個像素。
    這個外框是對齊的主要依據 —— 使用者的圖的不透明範圍對到這裡。
    """
    sd = sk.d['skeleton']
    sk.pose(sk.animations[0], -1e9)
    im = sk.render(scale=scale, pad=pad)
    a = np.asarray(im)[..., 3] > 24
    if not a.any():
        # setup pose 什麼都看不到（角色是動畫裡淡進來的，例如 bonus 角色）：
        # 改用每段動畫前段看得到的畫面聯集
        for an in sk.animations:
            d = sk.duration(an) or 0.0
            for t in (0.0, d * 0.25, d * 0.5):
                sk.pose(an, t)
                a = a | (np.asarray(sk.render(scale=scale, pad=pad))[..., 3] > 24)
            if a.any():
                break
    if not a.any():
        raise ValueError('這具骨架在任何動畫裡都看不到東西')
    ys, xs = np.nonzero(a)
    ox = -sd.get('x', 0.0) * scale + pad
    oy = (sd.get('y', 0.0) + sd.get('height', 1000.0)) * scale + pad
    # 像素 → 世界：x = (px - ox)/s，y = (oy - py)/s
    return [round(float((xs.min() - ox) / scale), 3),
            round(float((oy - ys.max() - 1) / scale), 3),
            round(float((xs.max() + 1 - ox) / scale), 3),
            round(float((oy - ys.min()) / scale), 3)]


def pose_profile(sk, art, bands=24):
    """量 bind pose 的**剪影**：每條橫帶被切成幾段、填滿多少。

    這是「這個姿勢的四肢有沒有離開軀幹」唯一可靠的參考 ——
    pack 裡的四邊形是軸對齊方框，疊起來是一整塊，量不出縫隙。

    存的是 24 個分段數 + 24 個填滿比例 + 一個寬高比，**沒有像素**。
    用途只有一個：在使用者切層之前，判斷他生的圖切不切得開。
    """
    rt = Retargeted(sk, art)
    rt.pose(sk.animations[0], -1e9)
    im = rt.render(scale=0.5)
    m = posecheck.mask_of(im)
    if m is None:
        return None
    runs, fill = posecheck.band_runs(m, bands)
    return {'bands': bands,
            'runs': [int(x) for x in runs],
            'fill': [round(float(x), 4) for x in fill],
            'aspect': round(m.shape[1] / float(m.shape[0]), 4)}


def _probe_err(src, true_px, sig, axes, sa, ang):
    """把 src 轉 ang 度，用形狀座標系把兩個關節找回來，跟真正的位置差多少（/ 長邊）。"""
    import math
    from PIL import Image as _I
    r = src.rotate(ang, expand=True, resample=_I.BICUBIC) if ang else src
    fr = artfit.shape_frame(r)
    if fr is None:
        return 9.0
    _score, sgn, _gap, _mir = artfit.resolve_sign(sig, fr, axes)
    th = math.radians(-ang)
    R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    cr = np.array(r.size) / 2.0
    c0 = np.array(src.size) / 2.0
    flip = np.array([1.0, -1.0])
    worst = 0.0
    for a, w in zip(sa, true_px):
        g = artfit.from_shape(fr, np.array(a, float), sgn)
        back = (R @ ((g - cr) * flip)) * flip + c0
        worst = max(worst, float(np.hypot(*(back - w))) / max(src.size))
    return worst


def probe_orient(ent, im, tmpl=None):
    """這塊零件畫成什麼角度，關節還找得回來 —— 拿原件跟輪廓範本實測。

    回傳 (分類, 最大誤差)：
    * `free`    —— 轉任何角度都找得回來
    * `upright` —— 輪廓對稱，照範本方向畫（±75° 內）才找得回來
    * `declare` —— 怎樣都不可靠，要在 joints.json 給座標
    """
    base = artfit.shape_frame(im)
    if base is None:
        return 'declare', 9.0
    sa = ent['shape_anchor']
    true_o = [artfit.from_shape(base, np.array(a, float)) for a in sa]
    # 每個來源都用它自己那套參考 —— 執行時也是這樣挑的：原件像原件的座標系，
    # 照範本畫的圖像範本的座標系（見 meshproj._uv_via_slice）
    srcs = [(im, true_o, ent['shape_sig'], (base['u'], base['n']), sa)]
    if tmpl is not None:
        frt = artfit.shape_frame(tmpl)
        if frt is not None:
            k = np.array([tmpl.width / float(im.width), tmpl.height / float(im.height)])
            true_t = [p * k for p in true_o]
            srcs.append((tmpl, true_t, frt['sig'], (frt['u'], frt['n']),
                         [list(artfit.to_shape(frt, p)) for p in true_t]))
    for cls, angs in (('free', FIT_PROBE_ANGLES), ('upright', UPRIGHT_PROBE_ANGLES)):
        worst = max(_probe_err(src, tp, sig, axes, sa_, ang)
                    for src, tp, sig, axes, sa_ in srcs for ang in angs)
        if worst <= FIT_PROBE_TOL:
            return cls, worst
    return 'declare', worst


def probe_autofit(ent, im):
    """舊介面：可不可以自動擬合（= 不是 declare）。"""
    cls, err = probe_orient(ent, im)
    return cls != 'declare', err


def from_frame(fr, ab):
    return artfit.from_shape(fr, ab)


def _stretch(im, k=1.3):
    """沿主軸拉長 k 倍 —— 「比例錯」的標準樣本。"""
    import math
    from PIL import Image as _I
    fr = artfit.shape_frame(im)
    ang = math.degrees(math.atan2(fr['u'][1], fr['u'][0]))
    r = im.rotate(ang, expand=True, resample=_I.BICUBIC)
    r = r.resize((int(r.width * k), r.height), _I.BICUBIC)
    return r.rotate(-ang, expand=True, resample=_I.BICUBIC)


def _bend(im, k=0.10):
    """中段往旁邊彎 k × 長度 —— 「該直的畫成彎的」的標準樣本。"""
    import math
    from PIL import Image as _I
    fr = artfit.shape_frame(im)
    ang = math.degrees(math.atan2(fr['u'][1], fr['u'][0]))
    r = im.rotate(ang, expand=True, resample=_I.BICUBIC)
    a = np.asarray(r.convert('RGBA')).astype(float)
    h, w = a.shape[:2]
    xs = np.nonzero((a[..., 3] > 24).any(0))[0]
    x0, x1 = xs.min(), xs.max()
    L = float(x1 - x0)
    pad = int(k * L) + 2
    out = np.zeros((h + 2 * pad, w, 4))
    yy = np.arange(h + 2 * pad)
    for x in range(w):
        t = (x - x0) / max(L, 1.0)
        dy = k * L * (4 * (t - 0.5) ** 2 - 1) if 0 <= t <= 1 else 0.0
        for c in range(4):
            out[:, x, c] = np.interp(yy - pad - dy, np.arange(h), a[:, x, c],
                                     left=0, right=0)
    b = _I.fromarray(np.clip(out, 0, 255).astype('uint8'), 'RGBA')
    return b.rotate(-ang, expand=True, resample=_I.BICUBIC)


def _dists(ref_sig, axes, ref_ar, ref_prof, v):
    fr = artfit.shape_frame(v)
    if fr is None:
        return None
    score, sgn, _gap, _mir = artfit.resolve_sign(ref_sig, fr, axes)
    return (score,
            abs(math.log((fr['ext_u'] / fr['ext_n']) / ref_ar)),
            artfit.profile_dist(ref_prof, artfit.spine_profile(v, fr), sgn))


def calibrate_checks(im, tmpl=None):
    """量這一層在**良性擾動**下的波動，據此訂它自己的檢查門檻。

    良性 = 旋轉、等比縮放、加留白 —— 對**原件**跟**輪廓範本**都做
    （範本就是 `--guide` 給使用者照著畫的那張）。門檻訂在良性波動最大值
    的 1.6 倍，所以原件跟照範本畫的圖在建包時誤擋率都是 0。

    回傳 (sig_tol, ar_tol, prof_tol, prof_ref, shape_ar, 抓錯能力)。
    """
    from PIL import Image as _I
    fr0 = artfit.shape_frame(im)
    if fr0 is None:
        return None
    ref_sig = fr0['sig']
    axes = (fr0['u'], fr0['n'])
    ref_ar = fr0['ext_u'] / fr0['ext_n']
    ref_prof = artfit.spine_profile(im, fr0)
    variants = []
    for src in (im, tmpl):
        if src is None:
            continue
        if src is tmpl:
            variants.append(src)
        for ang, sc in CAL_VARIANTS:
            v = src.rotate(ang, expand=True, resample=_I.BICUBIC) if ang else src
            if sc != 1.0:
                v = v.resize((max(4, int(v.width * sc)),
                              max(4, int(v.height * sc))), _I.LANCZOS)
            p = _I.new('RGBA', (int(v.width * (1 + CAL_PAD)),
                                int(v.height * (1 + CAL_PAD))), (0, 0, 0, 0))
            p.paste(v, (int(v.width * CAL_PAD / 2), int(v.height * CAL_PAD / 2)))
            variants.append(p)
    ds, da, dp = [], [], []
    for v in variants:
        d = _dists(ref_sig, axes, ref_ar, ref_prof, v)
        if d is None:
            continue
        ds.append(d[0])
        da.append(d[1])
        dp.append(d[2])
    if not ds:
        return None
    tol = (round(max(ds) * CAL_MARGIN + 0.02, 5),
           round(max(da) * CAL_MARGIN + 0.05, 5),
           round(max(dp) * CAL_MARGIN + 0.015, 5))
    catches = {}
    for name, bad in (('stretch13', _stretch(im)), ('bend10', _bend(im))):
        d = _dists(ref_sig, axes, ref_ar, ref_prof, bad)
        catches[name] = bool(d is None or d[0] > tol[0] or d[1] > tol[1] or d[2] > tol[2])
    return (tol[0], tol[1], tol[2],
            [[round(float(x), 5) for x in ref_prof[0]],
             [round(float(x), 5) for x in ref_prof[1]]],
            round(float(ref_ar), 5), catches)


def layer_table(sk, art=None):
    """每個 attachment 在 bind pose 的四邊形，換算到主導骨的區域座標。

    這就是「使用者要畫哪些圖、每張多大、貼在哪」的完整規格。
    """
    out = {}
    for s in sk.slots:
        sn = s['name']
        for att, a in (sk.skin.get(sn) or {}).items():
            typ = a.get('type', 'region')
            if typ not in ('region', 'mesh'):
                continue
            if sk.att_inactive(sn, a):
                continue
            bone, local = attachment_quad(sk, sn, att, a)
            w = float(np.linalg.norm(local[1] - local[0]))
            h = float(np.linalg.norm(local[3] - local[0]))
            key = '%s/%s' % (sn, att)
            # 很多骨沒有 length（Spine 只有需要顯示長度的骨才會設）。
            # 那就拿這塊圖在骨骼座標裡的 x 跨度當參考長度 —— 擬合要的是
            # 「同一根骨上的兩個對應點」，用哪個長度都行，只要前後一致。
            ln = sk._bone_len.get(bone, 0.0)
            synth = ln <= 0.5
            if synth:
                ln = float(np.linalg.norm(local[1] - local[0]))
            anc = _anchor_uv(local, ln) if ln > 0.5 else None
            ent = {
                'slot': sn, 'attachment': att, 'bone': bone,
                'quad': [[round(float(x), 3), round(float(y), 3)]
                         for x, y in local],
                'px': [int(round(w)), int(round(h))],
                'weighted': typ == 'mesh' and
                            len(a['vertices']) != len(a['uvs']),
            }
            if anc:
                ent['anchor'] = anc
                ent['bone_len'] = round(float(ln), 3)
                if synth:
                    ent['len_synthetic'] = True
            # 形狀錨點：骨頭的關節落在【這塊圖自己的輪廓座標系】哪裡。
            # 這是對旋轉／縮放免疫的描述子，所以使用者把零件畫成什麼
            # 角度都不影響 —— fit 靠它把關節找回來。
            # 存的是四個純量與一個細長度，不是圖。
            im = (art or {}).get(att)
            if im is not None and anc:
                fr = artfit.shape_frame(im)
                if fr is not None:
                    iw, ih = im.size
                    sa = []
                    for u, v in anc:
                        px = np.array([u * iw, (1.0 - v) * ih])
                        sa.append([round(float(x), 5)
                                   for x in artfit.to_shape(fr, px)])
                    ent['shape_anchor'] = sa
                    ent['shape_elong'] = round(float(fr['elong']), 4)
                    ent['shape_sig'] = [int(x) for x in fr['sig'].ravel()]
                    # 輪廓範本（--guide 給使用者照著畫的那張）：先做出來，
                    # 方向分類與門檻校準都要把它算進去
                    ent['free_shape'] = partguide.is_word(sn, att)
                    ent['sil'] = box_bits(im) if ent['free_shape'] else silhouette_bits(im)
                    ent['sil_n'] = SIL_N
                    ent['slice_size'] = [im.width, im.height]
                    tmpl = partguide.silhouette_image(ent)
                    frt = artfit.shape_frame(tmpl)
                    ent['tmpl_size'] = [tmpl.width, tmpl.height]
                    if frt is not None:       # 照範本畫的圖，用範本自己的座標系對最準
                        ent['tmpl_frame'] = [round(float(v), 5) for v in
                                             (frt['c'][0], frt['c'][1], frt['u'][0], frt['u'][1],
                                              frt['n'][0], frt['n'][1], frt['ext_u'], frt['ext_n'])]
                        ent['tmpl_sig'] = [int(x) for x in frt['sig'].ravel()]
                    cls, err = probe_orient(ent, im, tmpl)
                    ent['orient'] = cls
                    ent['auto_fit'] = cls != 'declare'
                    ent['auto_fit_err'] = round(float(err), 4)
                    cal = calibrate_checks(im, tmpl)
                    if cal:
                        (ent['sig_tol'], ent['ar_tol'], ent['prof_tol'],
                         ent['prof_ref'], ent['shape_ar'], ent['catches']) = cal
            out[key] = ent
    return out


def golden(sk, anims):
    """抽樣的骨骼世界矩陣 —— 換一台機器時用來證明算出來的完全一樣。

    存成扁平陣列而不是一列一個物件：骨名與欄位名重複 3780 次會讓
    pack 大四倍。`bones` 是共用的順序表。
    """
    names = sorted(sk.W)
    data = {}
    for an in anims:
        dur = sk.duration(an) or 0.001
        frames = []
        for f in GOLDEN_FRACTIONS:
            t = dur * f
            sk.pose(an, t)
            row = [round(t, 6)]
            for bn in names:
                M = sk.W[bn]
                row += [round(float(M[0, 0]), 6), round(float(M[0, 1]), 6),
                        round(float(M[1, 0]), 6), round(float(M[1, 1]), 6),
                        round(float(M[0, 2]), 4), round(float(M[1, 2]), 4)]
            frames.append(row)
        data[an] = frames
    return {'bones': names, 'fractions': list(GOLDEN_FRACTIONS), 'data': data}


def build(path, name, quiet=True, with_golden=True):
    sk = Skeleton(path, quiet=quiet)
    anims = sk.animations
    # 從原始 atlas 切出每一層，只為了量它的輪廓形狀 —— 量完就丟，
    # pack 裡存的是四個純量，沒有任何像素。
    art = slice_original(sk)
    bind_pose(sk)
    pack = {
        'pack_format': 1,
        'character': name,
        'source': {
            'spine': sk.d['skeleton'].get('spine'),
            'bones': len(sk.bones),
            'animations': len(anims),
            'note': '只含動作與幾何（骨骼、約束、關鍵幀、網格頂點與權重、'
                    '零件的粗略輪廓格）；沒有貼圖、沒有 uv、沒有任何像素。研究用途。',
        },
        'skeleton': sk.d['skeleton'],
        'bones': sk.bones,
        'ik': sk.d.get('ik') or [],
        'transform': sk.d.get('transform') or [],
        'path': sk.d.get('path') or [],
        # path 約束要靠 path attachment 的控制點，那是曲線本身，不是貼圖
        'path_attachments': {
            sn: {an: a for an, a in (atts or {}).items()
                 if a.get('type') == 'path'}
            for sn, atts in sk.skin.items()
            if any(a.get('type') == 'path' for a in (atts or {}).values())
        },
        'slots': [{k: v for k, v in s.items()} for s in sk.slots],
        # 網格幾何：頂點（綁哪幾根骨、權重、bind 位置）、三角形、clipping 多邊形。
        # **uv 不帶** —— uv 是「這個頂點對到 Hacksaw 貼圖的哪裡」，那就是美術的
        # 座標；使用者的 uv 是執行時把 bind pose 頂點投影到他自己的圖上算的。
        'skin_geometry': skin_geometry(sk),
        'layers': layer_table(sk, art),
        'pose': joint_sheet(sk),
        # deform 時間軸是「頂點位移」，也是幾何 —— 網格投影需要它
        'animations': sk.d['animations'],
        'deform_dropped': [],
    }
    if sk.skin_name:     # 換裝骨架：pack 自己記著 skin，後面量重現度時就照這個 skin 載
        pack['skin'] = {'name': sk.skin_name, 'bones': sorted(sk.skin_bones),
                        'constraints': sorted(sk.skin_constraints)}
    aff = slice_affine(Skeleton(path, quiet=quiet))
    for key, (A, resid) in aff.items():
        if key in pack['layers']:
            pack['layers'][key]['slice_affine'] = A
            pack['layers'][key]['slice_affine_resid'] = resid
    for key, ent in pack['layers'].items():
        im = art.get(ent['attachment'])
        if im is None:
            continue
        fr = artfit.shape_frame(im)
        if fr is None:
            continue
        ent['slice_size'] = [im.width, im.height]
        ent['slice_frame'] = [round(float(v), 5) for v in
                              (fr['c'][0], fr['c'][1], fr['u'][0], fr['u'][1],
                               fr['n'][0], fr['n'][1], fr['ext_u'], fr['ext_n'])]
        ent['slice_sig'] = [int(x) for x in fr['sig'].ravel()]
        if 'sil' not in ent:
            ent['sil'] = silhouette_bits(im)
            ent['sil_n'] = SIL_N
    prof = pose_profile(Skeleton(path, quiet=quiet), art)
    if prof:
        pack['pose_profile'] = prof
        bind_pose(sk)
    pack['art_bbox'] = art_bbox(Skeleton(path, quiet=quiet))
    pack['mesh_golden'] = mesh_golden(Skeleton(path, quiet=quiet))
    fid, cov = measure_routes(path, pack, art, quiet)
    pack['fidelity'] = fid
    # 簡單路線：一張圖夠好就用一張圖，否則每個零件一張
    pack['route'] = 'image' if fid['image'] >= 0.985 else 'layers'
    # 完美路線：兩種零件圖裡量出來比較準的那種
    pack['perfect_route'] = 'parts' if fid['parts'] >= fid['layers'] else 'layers'
    import motionlib
    from meshproj import moving_fronts
    pack['moving_fronts'] = moving_fronts(
        motionlib.MotionPack.from_dict(dict(pack)).sk)
    for key, c in cov.items():
        if key in pack['layers']:
            pack['layers'][key]['cov_ref'] = c
    if with_golden:
        pack['golden'] = golden(sk, anims)
    return pack


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('--name', required=True)
    ap.add_argument('-o', '--out', default='.')
    ap.add_argument('--no-golden', action='store_true')
    ap.add_argument('--skin', help='用哪個 skin 匯出（多 skin 換裝骨架；預設 = 官方 null skin）')
    a = ap.parse_args()
    Skeleton.default_skin = a.skin
    pack = build(a.skeleton, a.name, with_golden=not a.no_golden)
    if not os.path.isdir(a.out):
        os.makedirs(a.out)
    dst = os.path.join(a.out, a.name + '.motion.json')
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(pack, f, ensure_ascii=False, separators=(',', ':'))
    L = pack['layers'].values()
    auto = sum(1 for v in L if v.get('auto_fit'))
    loose = sorted((v['attachment'], v.get('prof_tol', 9)) for v in L
                   if v.get('prof_tol', 0) > 0.15)
    print('%s  %d 骨 %d 動畫 %d 層（自動擬合實測可靠 %d 層）%.1f KB'
          % (dst, len(pack['bones']), len(pack['animations']),
             len(pack['layers']), auto, os.path.getsize(dst) / 1024.0))
    judged = [v for v in L if 'catches' in v and not v.get('free_shape')]
    if judged:
        cls = {}
        for v in L:
            if 'orient' in v:
                cls[v['orient']] = cls.get(v['orient'], 0) + 1
        print('  抓錯能力（%d 層）：拉長 1.3× 擋下 %d、彎 10%% 擋下 %d；'
              '方向：任意 %d、照範本方向 %d、要給座標 %d；文字只檢長寬比 %d 層'
              % (len(judged), sum(v['catches']['stretch13'] for v in judged),
                 sum(v['catches']['bend10'] for v in judged),
                 cls.get('free', 0), cls.get('upright', 0), cls.get('declare', 0),
                 sum(1 for v in L if v.get('free_shape'))))
    if loose:
        print('  注意：這幾層的中軸剖面本身不穩，門檻被校準得比較鬆，'
              '「畫彎了」比較抓不到：%s'
              % ', '.join('%s(%.2f)' % x for x in loose[:6]))
    if pack['deform_dropped']:
        print('  注意：%d 段動畫原本有 mesh deform，pack 不保留（每層當剛性一片）：%s'
              % (len(pack['deform_dropped']),
                 ', '.join(pack['deform_dropped'][:6])
                 + (' …' if len(pack['deform_dropped']) > 6 else '')))
    return 0


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
