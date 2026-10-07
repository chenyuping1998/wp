# -*- coding: utf-8 -*-
"""imageroute.py — 「一張 bind pose 全身圖」路線的檢查、參考遮罩、提詞。

Miami 的五隻角色走這條路（pack 裡 `route: image`）：不用切層，
一張跟 bind pose 剪影吻合的全身圖，直接投影到原本的網格上。

實測上限（拿原作自己當輸入，跟原生渲染比最差 IoU）：
main_guy 0.995、main_girl 0.986、boss 0.995、bikinigirl 0.995、green_guy 0.996。

這條路的要求跟切層**相反**：

| | 切層（layers） | 一張圖（image） |
|---|---|---|
| 四肢要跟身體分開 | 必須 | **不需要** |
| 長大衣、圍巾、裙子 | 會擋住分界，不行 | **可以**，只要剪影一樣 |
| 最重要的事 | 每個零件切得出來 | **剪影跟 bind pose 對得上** |

所以這條路的關鍵只有一個：**你的圖在每個零件該在的位置上有沒有東西。**
網格會把那個位置的像素帶著動；那裡是空的，動起來就是一塊透明。
"""
from __future__ import print_function

import numpy as np
from PIL import Image, ImageDraw

from meshproj import (align_bbox, bind_world, drawable, raster, setup_visible,
                      tris_of)


def _parts(mp):
    sk = mp.sk
    bw = bind_world(sk)
    vis = setup_visible(sk)
    out = []
    for sn, att, a in drawable(sk):
        k = (sn, att)
        if k not in vis or bw.get(k) is None:
            continue
        spec = mp.p['layers'].get('%s/%s' % (sn, att), {})
        out.append((sn, att, a, bw[k], spec.get('cov_ref'), spec.get('bone')))
    return out


def check_image(mp, img, cov_tol=0.72, spill_tol=0.06, ratio_tol=0.12):
    """一張全身圖能不能直接用。回傳 (等級, 訊息 list, 診斷 dict)。

    三件事：

    1. **每個零件的位置上有沒有東西**：對齊之後，量每個網格底下被你的圖
       蓋住多少，跟原作比（`cov_ref`，建包時量的）。低於 72% 就是那個位置
       空了一塊 —— 網格會帶著一塊透明在動。
    2. **你的圖有沒有超出網格**：網格外面的像素不會動、也不會被畫出來，
       等於被裁掉。超過 6% 就警告。
    3. **體型比例**：寬高比跟原作差太多，外框對齊就對不準。
    """
    ab = mp.p.get('art_bbox')
    if not ab:
        return 'warn', ['這個 pack 沒有美術外框，沒辦法對齊'], {}
    a = np.asarray(img.convert('RGBA'))[..., 3] > 24
    if not a.any():
        return 'fail', ['整張圖是空的，或沒有透明背景 —— 要去背的 PNG'], {}
    s, ox, oy, ratio = align_bbox(ab, img)
    H, W = a.shape
    msgs, lvl = [], 'ok'

    ys, xs = np.nonzero(a)
    fx0, fx1, fy0, fy1 = xs.min(), xs.max(), ys.min(), ys.max()

    union = np.zeros_like(a)
    empty = []
    for sn, att, att_d, w, cref, bone in _parts(mp):
        m = raster([(w, tris_of(att_d))], s, ox, oy, W, H)
        if m.sum() < 20:
            continue
        union |= m
        if not cref:
            continue
        cov = float((a & m).sum()) / m.sum()
        rel = cov / cref
        if rel < cov_tol:
            my, mx = np.nonzero(m)
            hy = 100.0 * (fy1 - my.mean()) / max(fy1 - fy0, 1)
            wx = 100.0 * (mx.mean() - fx0) / max(fx1 - fx0, 1)
            empty.append((rel, att, bone, hy, wx))
    if empty:
        empty.sort()
        worst = empty[0][0]
        lvl = 'fail' if worst < 0.5 or len(empty) >= 3 else 'warn'
        msgs.append('有 %d 個零件的位置上，你的圖是空的或只有一部分：' % len(empty))
        for rel, att, bone, hy, wx in empty[:8]:
            msgs.append('   - %-18s（%s）只蓋到原作的 %.0f%% —— 位置在離腳底 %.0f%%、'
                        '從左邊算 %.0f%% 的地方'
                        % (att, bone, rel * 100, hy, wx))
        msgs.append('網格會帶著那個位置的像素動；那裡是空的，動起來就是一塊透明。')

    spill = float((a & ~union).sum()) / max(a.sum(), 1)
    if spill > spill_tol:
        if lvl == 'ok':
            lvl = 'warn'
        msgs.append('你的圖有 %.0f%% 的像素落在所有網格外面 —— 那些不會動、'
                    '也不會被畫出來（等於被裁掉）。' % (spill * 100))

    if abs(ratio - 1.0) > ratio_tol:
        if lvl == 'ok':
            lvl = 'warn'
        msgs.append('你的圖寬高比跟原作差 %.0f%%（%s）—— 體型不同，外框對齊會偏。'
                    % (abs(ratio - 1) * 100,
                       '太瘦長' if ratio > 1 else '太矮胖'))
    return lvl, msgs, {'mapping': (s, ox, oy), 'spill': spill,
                       'empty': empty, 'ratio': ratio}


def reference_mask(mp, height=1024, outline=False):
    """bind pose 的網格剪影（純幾何）。

    `outline=False`：白色剪影、透明背景 —— 可以直接當 ControlNet／inpaint
    的遮罩，或疊在生成圖上面比對。
    `outline=True`：每個零件描邊＋標名字，給人看的。
    """
    sk = mp.sk
    parts = _parts(mp)
    allp = np.concatenate([w for _s, _a, _d, w, _c, _b in parts], 0)
    x0, y0 = allp.min(0)
    x1, y1 = allp.max(0)
    pad = int(height * 0.03)
    s = (height - 2 * pad) / max(y1 - y0, 1e-6)
    W = int((x1 - x0) * s) + 2 * pad
    ox, oy = -x0 * s + pad, y1 * s + pad
    m = raster([(w, tris_of(d)) for _s, _a, d, w, _c, _b in parts],
               s, ox, oy, W, height)
    if not outline:
        rgba = np.zeros((height, W, 4), np.uint8)
        rgba[m] = (255, 255, 255, 255)
        return Image.fromarray(rgba, 'RGBA')
    im = Image.new('RGBA', (W, height), (16, 16, 22, 255))
    base = np.asarray(im).copy()
    base[m] = (58, 64, 82, 255)
    im = Image.fromarray(base, 'RGBA')
    dr = ImageDraw.Draw(im)
    for sn, att, d, w, _c, _b in parts:
        mm = raster([(w, tris_of(d))], s, ox, oy, W, height)
        ys, xs = np.nonzero(mm)
        if len(xs):
            edge = mm & ~np.pad(mm[1:-1, 1:-1] & mm[:-2, 1:-1] & mm[2:, 1:-1]
                                 & mm[1:-1, :-2] & mm[1:-1, 2:], 1)
            ey, ex = np.nonzero(edge)
            arr = np.asarray(im).copy()
            arr[ey, ex] = (120, 170, 230, 255)
            im = Image.fromarray(arr, 'RGBA')
            dr = ImageDraw.Draw(im)
            dr.text((xs.mean() - 3 * len(att), ys.mean() - 5), att,
                    fill=(200, 220, 245, 255))
    dr.text((pad, 4), '%s  BIND POSE silhouette - match this outline'
            % mp.name, fill=(235, 235, 240, 255))
    return im


def prompt_image(mp):
    """image 路線的提詞：重點是剪影吻合，不是四肢分開。"""
    po = mp.p['pose']['bones']
    ab = mp.p['art_bbox']
    fw = ab[2] - ab[0]
    fh = ab[3] - ab[1]

    def where(n):
        j = po.get(n)
        if not j:
            return None
        k = mp.p['pose']['scale_to_normalized']
        x = j['xy'][0] / k
        y = j['xy'][1] / k
        return (100.0 * (x - ab[0]) / fw, 100.0 * (y - ab[1]) / fh)

    print('# %s —— 生圖提詞（image 路線：一張全身圖，不用切層）' % mp.name)
    print()
    print('實測上限：用這條路、圖跟原作剪影完全吻合時，跟原動作的重疊度 %.2f%%。'
          % (100 * mp.p['fidelity']['image']))
    print()
    print('## 一、最重要的一件事：剪影要跟這張對上')
    print()
    print('```bash')
    print('python spineplay/motionlib.py -c %s --mask ref.png          # 白色剪影'
          % mp.name)
    print('python spineplay/motionlib.py -c %s --mask ref.png --outline # 標零件名'
          % mp.name)
    print('```')
    print()
    print('**最穩的做法是把 ref.png 當 ControlNet（輪廓／深度／openpose 皆可）或')
    print('img2img 的起始遮罩**，讓生成模型直接照著這個剪影畫。純文字提詞很難')
    print('讓模型畫出一模一樣的站姿。')
    print()
    print('## 二、姿勢（全身寬高比 %.2f，下面座標是 [從左 %%, 從腳底 %%]）'
          % (fw / fh))
    print()
    keys = sorted(po.items(), key=lambda kv: -kv[1]['len'])
    shown = 0
    for n, j in keys:
        if j['len'] < 20:
            continue
        p = where(n)
        if p is None:
            continue
        print('- %-24s 起點在 [%3.0f%%, %3.0f%%]，指向 %+5.0f°'
              % (n, p[0], p[1], j['angle']))
        shown += 1
        if shown >= 14:
            break
    print()
    print('## 三、提詞裡要寫的')
    print()
    print('```')
    print('全身角色立繪，透明背景，正面偏向跟參考剪影相同，')
    print('站姿、手的位置、腳的位置與參考剪影完全一致，不要自己改姿勢，')
    print('不要擺成對稱立正，頭身比例與參考相同。')
    print('服裝可以自由設計（長大衣、圍巾、披風都可以），')
    print('但外輪廓要落在參考剪影裡面、而且把剪影填滿。')
    print('```')
    print()
    print('**這條路不需要**「四肢跟身體分開」—— 那是切層路線的規則。')
    print()
    print('## 四、生完一定要跑')
    print()
    print('```bash')
    print('python spineplay/motionlib.py -c %s --checkpose 你的圖.png' % mp.name)
    print('```')
    print()
    print('它會對齊之後逐一檢查每個零件的位置上你的圖有沒有東西。')
    print('哪個零件落空，它會說在離腳底幾 %、從左幾 % 的地方。')
    print()
    print('## 五、要完美：補零件圖層')
    print()
    print('一張圖裡被擋住的地方是空的，動作一大就會露出來。')
    print('```bash')
    print('python spineplay/motionlib.py -c %s --split 你的圖.png --out 補圖/' % mp.name)
    print('python spineplay/motionlib.py -c %s -a <動作> --image 你的圖.png --parts 補好的/ --gif out.gif'
          % mp.name)
    print('```')
    fid = mp.p.get('fidelity') or {}
    if fid.get('parts'):
        print('補齊之後實測 %.2f%%。' % (100 * fid['parts']))
    return 0


def placeholder_image(mp, height=900):
    """把每個零件的網格塗上不同顏色，拼成一張「假的全身圖」。

    還沒生圖之前就能看 image 路線的動作長什麼樣 —— 每一塊顏色就是
    一個網格，看得出哪裡會彎、哪裡會晃。
    """
    import colorsys
    parts = _parts(mp)
    ab = mp.p['art_bbox']
    pad = int(height * 0.03)
    s = (height - 2 * pad) / max(ab[3] - ab[1], 1e-6)
    W = int((ab[2] - ab[0]) * s) + 2 * pad
    ox, oy = -ab[0] * s + pad, ab[3] * s + pad
    arr = np.zeros((height, W, 4), np.uint8)
    order = sorted(parts, key=lambda q: -len(q[3]))
    for i, (sn, att, d, w, _c, _b) in enumerate(order):
        m = raster([(w, tris_of(d))], s, ox, oy, W, height)
        r, g, b = colorsys.hsv_to_rgb((i * 0.618) % 1.0, 0.45, 0.93)
        arr[m] = (int(r * 255), int(g * 255), int(b * 255), 255)
        edge = m & ~np.pad(m[1:-1, 1:-1] & m[:-2, 1:-1] & m[2:, 1:-1]
                           & m[1:-1, :-2] & m[1:-1, 2:], 1)
        arr[edge] = (30, 30, 40, 255)
    return Image.fromarray(arr, 'RGBA')
