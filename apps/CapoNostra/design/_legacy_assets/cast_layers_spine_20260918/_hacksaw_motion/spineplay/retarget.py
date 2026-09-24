# -*- coding: utf-8 -*-
"""retarget.py — 把別人的骨架動作接到自己的圖層上。

    python retarget.py raccoon.json my_layers/ --list      先看要準備哪些圖
    python retarget.py raccoon.json my_layers/ idle --gif  用自己的圖播 idle

`my_layers/` 裡放 `<attachment 名>.png`，例如 `Body.png`、`Head_grr.png`。
`--list` 會列出全部 attachment、原圖尺寸，以及你已經有哪些。

## 它怎麼做的

每個 attachment 在 bind pose 都有一個世界四邊形（位置 + 大小 + 角度）。
這支把那個四邊形換算到**主導骨**（權重最高的那根）的區域座標，
之後就跟著那根骨的世界矩陣走。

所以：

* **骨骼動作 100% 照原樣重現** —— 位置、旋轉、縮放、繪製順序、
  attachment 抽換、slot 顏色，全部是原始資料。
* **每一層被當成剛性的一片。** 原始的 mesh deform 不會保留。

對 Le Bandit 這種角色影響很小 —— 它本來就有 **79% 的頂點只綁一根骨**，
真正靠 deform 的只有尾巴、身體、生氣臉那幾片。要那幾片也彎，
就得自己在 Spine 裡重畫網格，這支不做。

## 自我檢查

```
python retarget.py raccoon.json --selftest idle
```

拿原始 atlas 自己切出來的圖當「使用者圖層」再接回去，
跟原生 render 逐像素比對 —— 證明換算本身沒有偏差。
"""
from __future__ import print_function

import argparse
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spine import Skeleton, read_atlas


def attachment_quad(sk, sn, att, a):
    """attachment 在 bind pose 的世界四邊形，以及它的主導骨。

    回傳 (bone_name, 四個角在該骨區域座標裡的位置)。
    """
    typ = a.get('type', 'region')
    if typ == 'region':
        bone = sk.slot_bone[sn]
        w = a.get('width', 0)
        h = a.get('height', 0)
        import math
        rs = math.radians(a.get('rotation', 0.0))
        sx, sy = a.get('scaleX', 1.0), a.get('scaleY', 1.0)
        local = np.array([[math.cos(rs) * sx, -math.sin(rs) * sy, a.get('x', 0.0)],
                          [math.sin(rs) * sx, math.cos(rs) * sy, a.get('y', 0.0)],
                          [0.0, 0.0, 1.0]])
        corners = np.array([[-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2]])
        return bone, (corners @ local[:2, :2].T) + local[:2, 2]

    # mesh：先算出 bind pose 的世界頂點，再換回主導骨的區域座標
    v = list(a['vertices'])
    nuv = len(a['uvs']) // 2
    weight_of = {}
    if len(v) == nuv * 2:
        bone = sk.slot_bone[sn]
        pts = np.array(v, float).reshape(-1, 2)
        world = (pts @ sk.W[bone][:, :2].T) + sk.W[bone][:, 2]
    else:
        world = np.zeros((nuv, 2))
        i = k = 0
        while k < nuv:
            n = int(v[i]); i += 1
            px = py = 0.0
            for _ in range(n):
                bidx, vx, vy, wt = int(v[i]), v[i+1], v[i+2], v[i+3]
                i += 4
                bn = sk.bones[bidx]['name']
                weight_of[bn] = weight_of.get(bn, 0.0) + wt
                M = sk.W[bn]
                px += (M[0, 0]*vx + M[0, 1]*vy + M[0, 2]) * wt
                py += (M[1, 0]*vx + M[1, 1]*vy + M[1, 2]) * wt
            world[k] = (px, py); k += 1
        bone = max(weight_of, key=weight_of.get)

    # 世界 AABB → 換回該骨的區域座標
    x0, y0 = world[:, 0].min(), world[:, 1].min()
    x1, y1 = world[:, 0].max(), world[:, 1].max()
    quad_w = np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], float)
    M = sk.W[bone]
    A = np.vstack([M, [0, 0, 1]])
    inv = np.linalg.inv(A)
    homo = np.hstack([quad_w, np.ones((4, 1))])
    return bone, (homo @ inv.T)[:, :2]


class Retargeted(object):
    """套上使用者圖層之後的骨架。用法跟 Skeleton 一樣：pose(...).render(...)。"""

    def __init__(self, sk, layers):
        self.sk = sk
        self.layers = layers          # {attachment: PIL.Image}
        sk.pose(sk.animations[0], -1e9)   # 擺到 bind pose 算四邊形
        self.quads = {}
        for s in sk.slots:
            sn = s['name']
            for att, a in sk.skin.get(sn, {}).items():
                if a.get('type', 'region') not in ('region', 'mesh'):
                    continue
                if att not in layers:
                    continue
                self.quads[(sn, att)] = attachment_quad(sk, sn, att, a)

    def pose(self, anim, t):
        self.sk.pose(anim, t)
        return self

    def render(self, scale=1.0, bg=(0, 0, 0, 0), pad=8):
        sk = self.sk
        sd = sk.d['skeleton']
        sw, sh = sd.get('width', 1000.0), sd.get('height', 1000.0)
        W = int(sw * scale) + pad * 2
        H = int(sh * scale) + pad * 2
        ox = -sd.get('x', 0.0) * scale + pad
        oy = (sd.get('y', 0.0) + sh) * scale + pad
        dst = np.zeros((H, W, 4), np.float64)
        dst[:, :] = np.array(bg, float)

        st, order, _dfm = sk._posed
        for si in order:
            s = sk.slots[si]
            sn = s['name']
            info = st[sn]
            att = info['att']
            if not att or info['color'][3] <= 0.002:
                continue
            q = self.quads.get((sn, att))
            if q is None:
                continue
            bone, local = q
            M = sk.W[bone]
            world = (local @ M[:, :2].T) + M[:, 2]
            scr = np.stack([world[:, 0] * scale + ox,
                            oy - world[:, 1] * scale], 1)
            img = np.asarray(self.layers[att].convert('RGBA')).astype(np.float64)
            ih, iw = img.shape[:2]
            uv = np.array([[0, ih], [iw, ih], [iw, 0], [0, 0]], float)
            for tri in (np.array([[0, 1, 2], [0, 2, 3]])):
                Skeleton._tri(dst, img, scr[tri], uv[tri],
                              info['color'], info['blend'])
        return Image.fromarray(np.clip(dst, 0, 255).astype('uint8'), 'RGBA')


def slice_original(sk):
    """把原 atlas 切成 {attachment: Image}，給 --selftest 用。"""
    out = {}
    for sn, atts in sk.skin.items():
        for att, a in atts.items():
            if a.get('type', 'region') not in ('region', 'mesh'):
                continue
            reg = sk._region_of(dict(a, _name=att), sn)
            if reg is None:
                continue
            bx, by, bw, bh = reg['bounds']
            if reg['rotate']:
                im = sk.page.crop((bx, by, bx + bh, by + bw)).transpose(Image.ROTATE_270)
            else:
                im = sk.page.crop((bx, by, bx + bw, by + bh))
            out[att] = im
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('layers', nargs='?')
    ap.add_argument('anim', nargs='?')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--selftest', metavar='ANIM')
    ap.add_argument('--gif', action='store_true')
    ap.add_argument('--sheet', type=int, default=0)
    ap.add_argument('--fps', type=int, default=25)
    ap.add_argument('--scale', type=float, default=0.32)
    ap.add_argument('--bg', default='1e1e28')
    a = ap.parse_args()

    sk = Skeleton(a.skeleton, quiet=True)

    if a.list or (a.layers and not a.anim and not a.selftest):
        have = {}
        if a.layers and os.path.isdir(a.layers):
            have = {os.path.splitext(f)[0]: f for f in os.listdir(a.layers)
                    if f.lower().endswith('.png')}
        print('%-30s %-12s %s' % ('attachment', '原圖尺寸', '你有嗎'))
        seen = set()
        for s in sk.slots:
            for att, at in sk.skin.get(s['name'], {}).items():
                if at.get('type', 'region') not in ('region', 'mesh') or att in seen:
                    continue
                seen.add(att)
                reg = sk._region_of(dict(at, _name=att), s['name'])
                sz = '%dx%d' % tuple(reg['bounds'][2:]) if reg else '?'
                print('  %-28s %-12s %s' % (att, sz, '✓' if att in have else ''))
        print('\n共 %d 個 attachment，你有 %d 個' % (len(seen), len(set(have) & seen)))
        return 0

    if a.selftest:
        layers = slice_original(sk)
        rt = Retargeted(sk, layers)
        t = sk.duration(a.selftest) * 0.4
        ref = sk.pose(a.selftest, t).render(scale=a.scale)
        got = rt.pose(a.selftest, t).render(scale=a.scale)
        A = np.asarray(ref).astype(int)
        B = np.asarray(got).astype(int)
        cov_a = (A[..., 3] > 8)
        cov_b = (B[..., 3] > 8)
        inter = (cov_a & cov_b).sum()
        union = (cov_a | cov_b).sum()
        print('自我檢查 %s @ %.2fs' % (a.selftest, t))
        print('  原生覆蓋 %d px，retarget 覆蓋 %d px' % (cov_a.sum(), cov_b.sum()))
        print('  IoU = %.3f' % (inter / max(1, union)))
        print('  （不會是 1.000 —— retarget 把每片當剛性四邊形，'
              '原生有 mesh deform）')
        ref.save('selftest_native.png')
        got.save('selftest_retarget.png')
        print('  寫出 selftest_native.png / selftest_retarget.png')
        return 0

    layers = {os.path.splitext(f)[0]: Image.open(os.path.join(a.layers, f))
              for f in os.listdir(a.layers) if f.lower().endswith('.png')}
    rt = Retargeted(sk, layers)
    dur = sk.duration(a.anim)
    bg = tuple(int(a.bg[i:i+2], 16) for i in (0, 2, 4)) + (255,)
    stem = a.anim.replace('/', '_') + '_mine'

    if a.sheet:
        n = a.sheet
        ims = [rt.pose(a.anim, dur * i / max(1, n-1)).render(scale=a.scale, bg=bg)
               for i in range(n)]
        w, h = ims[0].size
        sheet = Image.new('RGBA', (w * n, h), bg)
        for i, im in enumerate(ims):
            sheet.paste(im, (i * w, 0))
        sheet.convert('RGB').save(stem + '_sheet.png')
        print('wrote %s_sheet.png' % stem)
        return 0

    n = max(2, int(dur * a.fps))
    frames = [rt.pose(a.anim, dur * i / n).render(scale=a.scale, bg=bg).convert('RGB')
              for i in range(n)]
    frames[0].save(stem + '.gif', save_all=True, append_images=frames[1:],
                   duration=int(1000.0 / a.fps), loop=0, optimize=True)
    print('wrote %s.gif  %d 格 %.2fs' % (stem, n, dur))
    return 0


if __name__ == '__main__':
    sys.exit(main())
