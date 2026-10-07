# -*- coding: utf-8 -*-
"""meshproj.py — 把使用者的圖投影到骨架原本的網格上。

## 為什麼要有這支

之前的「剛性片」把每個網格當成一個矩形、把整張零件圖拉到網格外框上。
拿 Hacksaw 自己的原圖、切得完美，跟原生渲染比：

    角色          剛性片    網格投影
    main_guy      0.57      0.995
    main_girl     0.43      0.987
    boss          0.55      0.995
    bikinigirl    0.45      0.995
    green_guy     0.56      0.995

矩形描述不了一塊被三根骨頭拉著彎的身體 —— 問題在方法，不在圖。

## 怎麼做

pack 帶的是**網格幾何**：每個頂點綁哪幾根骨、權重多少、bind pose 在哪、
三角形怎麼連、deform 時間軸怎麼推。**沒有 uv、沒有任何像素。**

使用者的圖進來之後：

1. 骨架擺到 bind pose，算出每個頂點的世界座標。
2. 把使用者的圖跟 bind pose 的網格剪影對齊（相似變換）。
3. 每個頂點的 uv = 它的 bind pose 位置投影到使用者的圖上。
4. 動起來時頂點照原本的權重跟骨頭走，貼圖跟著頂點走。

這就是 Spine 本來的做法，只是 uv 從「Hacksaw 的 atlas」換成「使用者的圖」。

## 兩條路

| | 輸入 | 適合 |
|---|---|---|
| **image** | 一張 bind pose 全身圖 | Miami 那種連續網格角色 —— 不用切層 |
| **layers** | 每個零件一張圖 | Le Bandit 那種會換臉、換道具的角色 |

用哪條是建包時**量出來**的（`pack['fidelity']`），不是猜的。
"""
from __future__ import print_function

import math

import numpy as np
from PIL import Image, ImageDraw

from spine import Skeleton, _clip_tri_uv
import artfit


# ------------------------------------------------------------------ 幾何
def world_verts(sk, sn, a, dfm):
    """一個 attachment 在目前姿勢下的世界頂點（只用幾何，不需要 uv）。"""
    typ = a.get('type', 'region')
    if typ == 'region':
        M = sk.W[sk.slot_bone[sn]]
        w, h = a.get('width', 0.0), a.get('height', 0.0)
        rs = math.radians(a.get('rotation', 0.0))
        sx, sy = a.get('scaleX', 1.0), a.get('scaleY', 1.0)
        L = np.array([[math.cos(rs) * sx, -math.sin(rs) * sy],
                      [math.sin(rs) * sx, math.cos(rs) * sy]])
        t = np.array([a.get('x', 0.0), a.get('y', 0.0)])
        pts = np.array([[-w / 2, -h / 2], [w / 2, -h / 2],
                        [w / 2, h / 2], [-w / 2, h / 2]]) @ L.T + t
        return pts @ M[:, :2].T + M[:, 2]
    if typ != 'mesh':
        return None
    v = a['vertices']
    n = int(a['vertexCount'])
    d = dfm.get((sn, a.get('_name')))
    if len(v) == n * 2:
        base = np.array(v, float).reshape(-1, 2)
        if d:
            dd = np.array((list(d) + [0.0] * (n * 2))[:n * 2], float)
            base = base + dd.reshape(-1, 2)
        M = sk.W[sk.slot_bone[sn]]
        return base @ M[:, :2].T + M[:, 2]
    out = np.zeros((n, 2))
    i = k = di = 0
    bones = sk.bones
    while k < n:
        cnt = int(v[i]); i += 1
        px = py = 0.0
        for _ in range(cnt):
            M = sk.W[bones[int(v[i])]['name']]
            vx, vy, wt = v[i + 1], v[i + 2], v[i + 3]
            i += 4
            if d:
                vx += d[di] if di < len(d) else 0.0
                vy += d[di + 1] if di + 1 < len(d) else 0.0
            di += 2
            px += (M[0, 0] * vx + M[0, 1] * vy + M[0, 2]) * wt
            py += (M[1, 0] * vx + M[1, 1] * vy + M[1, 2]) * wt
        out[k] = (px, py)
        k += 1
    return out


def tris_of(a):
    if a.get('type', 'region') == 'mesh':
        return np.array(a['triangles']).reshape(-1, 3)
    return np.array([[0, 1, 2], [0, 2, 3]])


def drawable(sk):
    """(slot, attachment 名, attachment) —— 所有可畫的 region / mesh。"""
    out = []
    for sl in sk.slots:
        sn = sl['name']
        for att, a in (sk.skin.get(sn) or {}).items():
            if a.get('type', 'region') in ('region', 'mesh'):
                if hasattr(sk, 'att_inactive') and sk.att_inactive(sn, a):
                    continue      # 這個 skin 裡不存在的骨 → 不畫
                out.append((sn, att, dict(a, _name=att)))
    return out


def setup_visible(sk):
    """setup pose 下看得到的 (slot, attachment) —— 剪影只算這些。"""
    vis = set()
    for sl in sk.slots:
        att = sl.get('attachment')
        col = str(sl.get('color', 'ffffffff'))
        alpha = int(col[6:8], 16) / 255.0 if len(col) >= 8 else 1.0
        if att and alpha > 0.02:
            vis.add((sl['name'], att))
    return vis


def visibility(sk, p, anims=None, fps=60, alpha_min=0.02):
    """每個 (slot, attachment) 真的看得到的動作 → set；'setup' = setup pose 就看得到。

    逐格播一次（每秒 fps 格，再加上每個 slot 關鍵幀的時間點，一幀的
    交叉淡換也抓得到），slot 掛著它而且 alpha > alpha_min 才算。
    skin 裡有、卻從來沒被看見的 attachment 不該叫人去畫。
    `anims` 給了就只算那幾段。
    """
    out = {}

    def grab(tag):
        st, _order, _ = sk._posed
        for sn, info in st.items():
            if info['att'] and info['color'][3] > alpha_min:
                out.setdefault((sn, info['att']), set()).add(tag)

    sk.pose(sk.animations[0], -1e9)
    grab('setup')
    for an in sk.animations:
        if anims is not None and an not in anims:
            continue
        dur = sk.duration(an) or 0.0
        ts = {dur * i / max(1, int(dur * fps)) for i in range(int(dur * fps) + 1)}
        for tl in ((p['animations'].get(an) or {}).get('slots') or {}).values():
            for keys in tl.values():
                for k in keys:
                    t = float(k.get('time', 0.0))
                    ts.update((t, t + 1e-4))
        for t in sorted(ts):
            sk.pose(an, t)
            grab(an)
    return out


def who_uses(names, total=None, limit=3):
    """把 visibility 的動作集合寫成一句話。"""
    anims = sorted(n for n in names if n != 'setup')
    if total and len(anims) >= total:
        return '全部 %d 段動作' % total
    if not anims:
        return 'setup pose'
    s = '、'.join(anims[:limit])
    return s + (' 等 %d 段' % len(anims) if len(anims) > limit else '')


def bind_world(sk):
    sk.pose(sk.animations[0], -1e9)
    return {(sn, att): world_verts(sk, sn, a, {}) for sn, att, a in drawable(sk)}


def raster(polys_tris, s, ox, oy, W, H):
    """把一組三角形畫成遮罩。polys_tris = [(Nx2 世界座標, Mx3 三角形)]"""
    im = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(im)
    for w, tris in polys_tris:
        px = np.stack([w[:, 0] * s + ox, oy - w[:, 1] * s], 1)
        for t in tris:
            dr.polygon([tuple(px[j]) for j in t], fill=255)
    return np.asarray(im) > 127


def silhouette(sk, height=512, pad=4, keys=None):
    """bind pose 的網格剪影（純幾何）。回傳 (遮罩, s, ox, oy)。"""
    bw = bind_world(sk)
    vis = keys if keys is not None else setup_visible(sk)
    items = [(bw[k], tris_of(a)) for sn, att, a in drawable(sk)
             for k in [(sn, att)] if k in vis and bw.get(k) is not None]
    allp = np.concatenate([w for w, _ in items], 0)
    x0, y0 = allp.min(0)
    x1, y1 = allp.max(0)
    s = (height - 2 * pad) / max(y1 - y0, 1e-6)
    W = int((x1 - x0) * s) + 2 * pad
    H = height
    ox = -x0 * s + pad
    oy = y1 * s + pad
    return raster(items, s, ox, oy, W, H), s, ox, oy


def draw_rank(sk):
    """bind pose 下每個 slot 的繪製先後（數字大 = 畫在前面）。"""
    sk.pose(sk.animations[0], -1e9)
    _st, order, _d = sk._posed
    return {sk.slots[si]['name']: r for r, si in enumerate(order)}


def _bary_hits(P, V, T):
    """點 P（n×2）各落在網格 (V, T) 的哪個三角形，回傳 (點索引, 三角形索引, u, v)。"""
    A = V[T[:, 0]]
    B = V[T[:, 1]]
    C = V[T[:, 2]]
    v0 = B - A                                        # (t, 2)
    v1 = C - A
    d = v0[:, 0] * v1[:, 1] - v1[:, 0] * v0[:, 1]     # (t,)
    ok_t = np.abs(d) > 1e-9
    v2 = P[:, None, :] - A[None, :, :]                # (n, t, 2)
    with np.errstate(divide='ignore', invalid='ignore'):
        u = (v2[..., 0] * v1[None, :, 1] - v1[None, :, 0] * v2[..., 1]) / d[None]
        v = (v0[None, :, 0] * v2[..., 1] - v2[..., 0] * v0[None, :, 1]) / d[None]
    inside = (u >= -1e-6) & (v >= -1e-6) & (u + v <= 1 + 1e-6) & ok_t[None]
    hit_any = inside.any(1)
    ti = np.argmax(inside, 1)
    idx = np.nonzero(hit_any)[0]
    return idx, ti[idx], u[idx, ti[idx]], v[idx, ti[idx]]


def moving_fronts(sk, thresh=2.0, frames_per_anim=10):
    """找出「會相對後面零件移動」的前景零件 —— 一張圖路線殘影的來源。

    對每一對在 bind pose 重疊的 (前 F, 後 K)：F 的頂點落在 K 的哪個三角形，
    之後每個影格比較「F 的頂點實際在哪」跟「K 網格把那個點帶到哪」，
    差距的最大值就是 F 相對 K 的位移（世界單位）。超過 thresh 的列出來。
    """
    bw = bind_world(sk)
    vis = setup_visible(sk)
    rank = draw_rank(sk)
    items = [(sn, att, a) for sn, att, a in drawable(sk)
             if (sn, att) in vis and bw.get((sn, att)) is not None]
    boxes = {}
    for sn, att, a in items:
        w = bw[(sn, att)]
        boxes[(sn, att)] = (w.min(0), w.max(0))
    pairs = []
    for fsn, fatt, fa in items:
        for ksn, katt, ka in items:
            if rank[fsn] <= rank[ksn] or (fsn, fatt) == (ksn, katt):
                continue
            (f0, f1), (k0, k1) = boxes[(fsn, fatt)], boxes[(ksn, katt)]
            if (f0 > k1).any() or (k0 > f1).any():
                continue
            idx, ti, u, v = _bary_hits(bw[(fsn, fatt)], bw[(ksn, katt)], tris_of(ka))
            if len(idx):
                pairs.append(((fsn, fatt, fa), (ksn, katt, ka), idx, ti, u, v))
    worst = [0.0] * len(pairs)
    for an in sk.animations:
        dur = sk.duration(an) or 1.0
        for f in np.linspace(0.0, 1.0, frames_per_anim):
            sk.pose(an, dur * f)
            _st, _o, dfm = sk._posed
            cache = {}
            for i, (F, K, idx, ti, u, v) in enumerate(pairs):
                for sn, att, a in (F, K):
                    if (sn, att) not in cache:
                        cache[(sn, att)] = world_verts(sk, sn, a, dfm)
                WF, WK = cache[F[:2]], cache[K[:2]]
                T = tris_of(K[2])[ti]
                pk = WK[T[:, 0]] + u[:, None] * (WK[T[:, 1]] - WK[T[:, 0]])                     + v[:, None] * (WK[T[:, 2]] - WK[T[:, 0]])
                d = float(np.hypot(*(WF[idx] - pk).T).max())
                if d > worst[i]:
                    worst[i] = d
    out = {}
    for (F, K, *_r), d in zip(pairs, worst):
        if d <= thresh:
            continue
        key = '%s/%s' % F[:2]
        e = out.setdefault(key, {'slot': F[0], 'attachment': F[1],
                                 'motion': 0.0, 'over': []})
        e['motion'] = max(e['motion'], round(d, 2))
        e['over'].append('%s/%s' % K[:2])
    return sorted(out.values(), key=lambda e: -e['motion'])


# ------------------------------------------------------------------ 對齊
def _mask(img, thresh=24):
    return np.asarray(img.convert('RGBA'))[..., 3] > thresh


def _iou(a, b):
    u = (a | b).sum()
    return float((a & b).sum()) / u if u else 0.0


def align_bbox(art_bbox, img, thresh=24):
    """用 bind pose 美術外框對齊：使用者圖的不透明範圍 → 世界外框。

    縮放取「高度比」與「寬度比」的平均（兩者差太多代表體型不同，
    那時候 checkpose 會提醒）；位置對齊外框中心。回傳 (s, ox, oy)。
    """
    a = np.asarray(img.convert('RGBA'))[..., 3] > thresh
    ys, xs = np.nonzero(a)
    ux0, ux1 = xs.min(), xs.max() + 1
    uy0, uy1 = ys.min(), ys.max() + 1
    wx0, wy0, wx1, wy1 = art_bbox
    sh = (uy1 - uy0) / max(wy1 - wy0, 1e-6)
    sw = (ux1 - ux0) / max(wx1 - wx0, 1e-6)
    s = 0.5 * (sh + sw)
    # 像素 = (x*s + ox, oy - y*s)
    ox = 0.5 * (ux0 + ux1) - s * 0.5 * (wx0 + wx1)
    oy = 0.5 * (uy0 + uy1) + s * 0.5 * (wy0 + wy1)
    return s, ox, oy, sh / sw


def align_image(sk, img, work=256):
    """把一張 bind pose 全身圖跟網格剪影對齊，回傳 (s, ox, oy, IoU)。

    先用外框對齊（高度比例＋底部中心），再在附近用 IoU 細找。
    使用者的圖應該是正立的；轉歪的全身圖本來就不是 bind pose。
    """
    ref, rs, rox, roy = silhouette(sk, height=work)
    um = _mask(img)
    if not um.any():
        return None
    ys, xs = np.nonzero(um)
    ux0, ux1, uy0, uy1 = xs.min(), xs.max(), ys.min(), ys.max()
    rys, rxs = np.nonzero(ref)
    rx0, rx1, ry0, ry1 = rxs.min(), rxs.max(), rys.min(), rys.max()

    # 把使用者的圖縮到工作解析度，對齊都在這裡做
    k = work / float(max(uy1 - uy0 + 1, 1))
    small = img.convert('RGBA').resize(
        (max(1, int(img.width * k)), max(1, int(img.height * k))), Image.BILINEAR)
    sm = _mask(small)

    def place(A, dx, dy):
        """ref 像素 → small 像素：q = A*p + (bx, by)。回傳 ref 座標下的使用者遮罩。"""
        H, W = ref.shape
        yy, xx = np.mgrid[0:H, 0:W]
        bx = (ux0 + ux1) / 2.0 * k - A * (rx0 + rx1) / 2.0 + dx
        by = uy1 * k - A * ry1 + dy
        qx = np.round(A * xx + bx).astype(int)
        qy = np.round(A * yy + by).astype(int)
        ok = (qx >= 0) & (qy >= 0) & (qx < sm.shape[1]) & (qy < sm.shape[0])
        out = np.zeros_like(ref)
        out[ok] = sm[qy[ok], qx[ok]]
        return out, bx, by

    A0 = (uy1 - uy0) * k / float(max(ry1 - ry0, 1))
    best = (-1.0, A0, 0.0, 0.0)
    for A in A0 * np.array([0.9, 0.94, 0.97, 1.0, 1.03, 1.06, 1.1]):
        for dx in np.arange(-10, 11, 2.5):
            for dy in np.arange(-8, 9, 2.0):
                m, _bx, _by = place(A, dx, dy)
                v = _iou(m, ref)
                if v > best[0]:
                    best = (v, A, dx, dy)
    iou, A, dx, dy = best
    _m, bx, by = place(A, dx, dy)
    # ref 像素 = (x*rs + rox, roy - y*rs)；small = A*ref + b；原圖 = small / k
    s = A * rs / k
    ox = (A * rox + bx) / k
    oy = (A * roy + by) / k
    return s, ox, oy, iou


def layer_mapping(sk, sn, att, a, img, bw):
    """單一零件圖 → 這個 attachment 的 bind pose 網格剪影。

    用 artfit 的形狀座標系對齊：零件畫成什麼角度、多大都沒關係。
    回傳一個函式：世界座標 → 使用者圖的像素；或 None。
    """
    w = bw.get((sn, att))
    if w is None:
        return None
    x0, y0 = w.min(0)
    x1, y1 = w.max(0)
    span = max(x1 - x0, y1 - y0, 1e-6)
    s = 200.0 / span
    W = int((x1 - x0) * s) + 8
    H = int((y1 - y0) * s) + 8
    ox, oy = -x0 * s + 4, y1 * s + 4
    ref = raster([(w, tris_of(a))], s, ox, oy, W, H)
    if not ref.any():
        return None
    rim = Image.fromarray((ref * 255).astype('uint8'), 'L').convert('RGBA')
    rim.putalpha(Image.fromarray((ref * 255).astype('uint8'), 'L'))
    fr_r = artfit.shape_frame(rim)
    fr_u = artfit.shape_frame(img)
    if fr_r is None or fr_u is None:
        return None
    _score, sgn, _gap, _mir = artfit.resolve_sign(fr_r['sig'], fr_u,
                                                  (fr_r['u'], fr_r['n']))

    def f(pw):
        q = np.stack([pw[:, 0] * s + ox, oy - pw[:, 1] * s], 1)
        out = np.zeros_like(q)
        for i in range(len(q)):
            ab = artfit.to_shape(fr_r, q[i])
            out[i] = artfit.from_shape(fr_u, ab, sgn)
        return out
    return f


def _crop_part(part, uv, margin=3):
    """同畫布的零件圖層：裁到內容範圍（＋網格範圍），回傳 (陣列, 位移)。

    `part` 可以是整張同畫布的 PIL 圖，或是 (PIL 圖, (x0, y0)) —— 已經裁好、
    左上角在全身圖的 (x0, y0)。
    """
    if isinstance(part, tuple):
        img, (x0, y0) = part
        return np.asarray(img.convert('RGBA')).astype(np.float64), np.array([x0, y0], float)
    a = np.asarray(part.convert('RGBA'))
    H, W = a.shape[:2]
    m = a[..., 3] > 0
    xs0, ys0 = uv.min(0)
    xs1, ys1 = uv.max(0)
    if m.any():
        ys, xs = np.nonzero(m)
        xs0, xs1 = min(xs0, xs.min()), max(xs1, xs.max())
        ys0, ys1 = min(ys0, ys.min()), max(ys1, ys.max())
    x0 = int(max(0, np.floor(xs0) - margin))
    y0 = int(max(0, np.floor(ys0) - margin))
    x1 = int(min(W, np.ceil(xs1) + margin + 1))
    y1 = int(min(H, np.ceil(ys1) + margin + 1))
    return a[y0:y1, x0:x1].astype(np.float64), np.array([x0, y0], float)


def _frame_from_list(v):
    return {'c': np.array(v[0:2]), 'u': np.array(v[2:4]), 'n': np.array(v[4:6]),
            'ext_u': v[6], 'ext_n': v[7]}


def _uv_via_slice(spec, img, bind_w, declared=None):
    """bind pose 頂點 → 使用者零件圖的像素（見 ProjRig.from_layers）。"""
    A = np.array(spec['slice_affine'], float)        # 3x2：[px, py, 1] → 世界
    L = A[:2, :].T
    t = A[2, :]
    try:
        Li = np.linalg.inv(L)
    except np.linalg.LinAlgError:
        return None
    sp = (Li @ (bind_w - t).T).T                     # 原作零件圖的像素
    fr_o = _frame_from_list(spec['slice_frame'])
    if declared:
        # 使用者自己給了兩個關節的像素座標：用相似變換，完全不猜
        o_ref = artfit.from_shape(fr_o, np.array(spec['shape_anchor'][0]))
        t_ref = artfit.from_shape(fr_o, np.array(spec['shape_anchor'][1]))
        o_u = np.array(declared['origin'], float)
        t_u = np.array(declared['tip'], float)
        d_ref, d_u = t_ref - o_ref, t_u - o_u
        lr, lu = float(np.hypot(*d_ref)), float(np.hypot(*d_u))
        if lr < 1e-6 or lu < 1e-6:
            return None
        k = lu / lr
        th = math.atan2(d_u[1], d_u[0]) - math.atan2(d_ref[1], d_ref[0])
        R = np.array([[math.cos(th), -math.sin(th)],
                      [math.sin(th), math.cos(th)]]) * k
        return (sp - o_ref) @ R.T + o_u
    fr_u = artfit.shape_frame(img)
    if fr_u is None:
        return None
    # 兩個參考：原作零件圖、輪廓範本（--guide 給的那張）。使用者照範本畫，
    # 他的輪廓比較像範本，就用範本的形狀座標系對 —— 兩個座標系差一點點
    # （範本是 64×64 格子磨圓的），選錯的話整塊零件會偏 1% 左右。
    refs = [(spec['slice_sig'], fr_o, 1.0)]
    if spec.get('tmpl_frame') and spec.get('tmpl_sig') and spec.get('slice_size'):
        k = (np.array(spec.get('tmpl_size') or spec['px'], float)
             / np.array(spec['slice_size'], float))
        refs.append((spec['tmpl_sig'], _frame_from_list(spec['tmpl_frame']), k))
    best = None
    for sig, fr_r, k in refs:
        score, sgn, _gap, _mir = artfit.resolve_sign(sig, fr_u, (fr_r['u'], fr_r['n']))
        if best is None or score < best[0]:
            best = (score, sgn, fr_r, k)
    _score, sgn, fr_r, k = best
    src = sp * k
    out = np.zeros_like(sp)
    for i in range(len(sp)):
        out[i] = artfit.from_shape(fr_u, artfit.to_shape(fr_r, src[i]), sgn)
    return out


# ------------------------------------------------------------------ 渲染
class ProjRig(object):
    """骨架＋一組「每個 attachment 用哪張圖、uv 是什麼」。"""

    def __init__(self, sk):
        self.sk = sk
        self.tex = {}          # (sn, att) -> (img_np, uv Nx2)
        self.missing = []

    @classmethod
    def from_image(cls, sk, img, mapping=None, art_bbox=None):
        """一張 bind pose 全身圖。mapping=(s, ox, oy)；不給就自動對齊。

        有 `art_bbox`（pack 裡的美術外框）就用它對齊 —— 比網格剪影準；
        沒有才退回網格剪影的 IoU 搜尋。
        """
        r = cls(sk)
        r.aspect_ratio = None
        if mapping is None and art_bbox:
            s, ox, oy, ratio = align_bbox(art_bbox, img)
            r.align_iou = None
            r.aspect_ratio = ratio
        elif mapping is None:
            s, ox, oy, iou = align_image(sk, img)
            r.align_iou = iou
        else:
            s, ox, oy = mapping
            r.align_iou = None
        r.mapping = (s, ox, oy)
        arr = np.asarray(img.convert('RGBA')).astype(np.float64)
        bw = bind_world(sk)
        for (sn, att), w in bw.items():
            if w is None:
                continue
            r.tex[(sn, att)] = (arr, np.stack([w[:, 0] * s + ox,
                                               oy - w[:, 1] * s], 1))
        return r

    @classmethod
    def from_layers(cls, sk, layers, pack_layers=None, joints=None):
        """每個零件一張圖（檔名 = attachment 名），投影到原本的網格上。

        有 pack 的 `slice_affine` 就用精確路徑：
            bind pose 頂點 →（仿射反解）→ 原作零件圖的像素
                          →（形狀座標系）→ 使用者零件圖的像素 = uv
        使用者的零件畫成什麼角度、多大都行，形狀座標系會對上。
        拿原作零件圖當輸入時兩個形狀座標系完全相同，uv 就是原本的 uv。

        沒有 `slice_affine` 才退回舊的「對網格剪影」近似。
        """
        r = cls(sk)
        r.method = {}
        bw = bind_world(sk)
        joints = joints or {}
        for sn, att, a in drawable(sk):
            img = layers.get(att)
            if img is None:
                continue
            spec = (pack_layers or {}).get('%s/%s' % (sn, att))
            uv = None
            if spec and spec.get('slice_affine') and spec.get('slice_frame'):
                uv = _uv_via_slice(spec, img, bw[(sn, att)], joints.get(att))
                if uv is not None:
                    r.method[(sn, att)] = 'affine'
            if uv is None:
                f = layer_mapping(sk, sn, att, a, img, bw)
                if f is None:
                    continue
                uv = f(bw[(sn, att)])
                r.method[(sn, att)] = 'silhouette'
            r.tex[(sn, att)] = (np.asarray(img.convert('RGBA')).astype(np.float64), uv)
        return r

    @classmethod
    def build(cls, sk, pack_layers=None, full=None, mapping=None,
              art_bbox=None, parts=None, layers=None, joints=None):
        """統一的組裝：一張全身圖、同畫布零件圖層、獨立零件圖，可以混用。

        每個零件的貼圖依序取：
          1. `layers[att]` 獨立零件圖 → 仿射＋形狀座標系（切層路線，Le Bandit 精確）
          2. `parts[att]`  同畫布圖層 → 跟全身圖同一個投影（完美路線，Miami 精確）
          3. `full`        全身圖     → 投影（簡單路線）
        都沒有就記在 `missing`。
        """
        r = cls(sk)
        r.method = {}
        r.aspect_ratio = None
        r.align_iou = None
        bw = bind_world(sk)
        if full is not None:
            if mapping is None:
                if art_bbox:
                    s, ox, oy, ratio = align_bbox(art_bbox, full)
                    r.aspect_ratio = ratio
                else:
                    s, ox, oy, r.align_iou = align_image(sk, full)
                mapping = (s, ox, oy)
        r.mapping = mapping
        full_np = (np.asarray(full.convert('RGBA')).astype(np.float64)
                   if full is not None else None)
        joints = joints or {}
        for sn, att, a in drawable(sk):
            w = bw.get((sn, att))
            if w is None:
                continue
            spec = (pack_layers or {}).get('%s/%s' % (sn, att))
            if layers and att in layers and spec and spec.get('slice_affine') and spec.get('slice_frame'):
                uv = _uv_via_slice(spec, layers[att], w, joints.get(att))
                if uv is not None:
                    r.tex[(sn, att)] = (
                        np.asarray(layers[att].convert('RGBA')).astype(np.float64), uv)
                    r.method[(sn, att)] = 'layer'
                    continue
            if mapping is None:
                continue
            s, ox, oy = mapping
            uv = np.stack([w[:, 0] * s + ox, oy - w[:, 1] * s], 1)
            if parts and att in parts:
                r.tex[(sn, att)] = (_crop_part(parts[att], uv), None)
                tex, off = r.tex[(sn, att)][0]
                r.tex[(sn, att)] = (tex, uv - off)
                r.method[(sn, att)] = 'part'
            elif full_np is not None:
                r.tex[(sn, att)] = (full_np, uv)
                r.method[(sn, att)] = 'full'
        return r

    def pose(self, anim, t):
        self.sk.pose(anim, t)
        return self

    def render(self, scale=1.0, bg=(0, 0, 0, 0), pad=8, clip=True):
        sk = self.sk
        sd = sk.d['skeleton']
        sw = sd.get('width') or 1000.0
        sh = sd.get('height') or 1000.0
        W = int(sw * scale) + pad * 2
        H = int(sh * scale) + pad * 2
        ox = -sd.get('x', 0.0) * scale + pad
        oy = (sd.get('y', 0.0) + sh) * scale + pad
        dst = np.zeros((H, W, 4), np.float64)
        dst[:, :] = np.array(bg, float)
        st, order, dfm = sk._posed
        clip_area, clip_end = None, None
        for si in order:
            sl = sk.slots[si]
            sn = sl['name']
            info = st[sn]
            att = info['att']
            a = (sk.skin.get(sn) or {}).get(att) if att else None
            if a is not None and a.get('type') == 'clipping':
                if clip and clip_area is None:
                    clip_area = sk._clip_polygon(a, sn, att, dfm)
                    clip_end = a.get('end', sn)
                continue
            area = clip_area
            if clip_area is not None and clip_end == sn:
                clip_area = None
            if not att or info['color'][3] <= 0.002 or a is None:
                continue
            tx = self.tex.get((sn, att))
            if tx is None:
                if a.get('type', 'region') in ('region', 'mesh') and \
                        att not in self.missing:
                    self.missing.append(att)
                continue
            page, uv = tx
            w = world_verts(sk, sn, dict(a, _name=att), dfm)
            if w is None:
                continue
            scr = np.stack([w[:, 0] * scale + ox, oy - w[:, 1] * scale], 1)
            for tri in tris_of(a):
                if area is None:
                    Skeleton._tri(dst, page, scr[tri], uv[tri],
                                  info['color'], info['blend'], sk.v38)
                    continue
                P, T = w[tri], uv[tri]
                r = _clip_tri_uv(P[0, 0], P[0, 1], P[1, 0], P[1, 1],
                                 P[2, 0], P[2, 1], T[0, 0], T[0, 1],
                                 T[1, 0], T[1, 1], T[2, 0], T[2, 1], area)
                if r is None:
                    continue
                pts, uvs, sub = r
                pw = np.array(pts, float)
                ps = np.stack([pw[:, 0] * scale + ox, oy - pw[:, 1] * scale], 1)
                pu = np.array(uvs, float)
                for t3 in sub:
                    Skeleton._tri(dst, page, ps[list(t3)], pu[list(t3)],
                                  info['color'], info['blend'], sk.v38)
        return Image.fromarray(np.clip(dst, 0, 255).astype('uint8'), 'RGBA')
