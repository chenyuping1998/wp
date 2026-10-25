# -*- coding: utf-8 -*-
"""resolve_joints.py — 把「主軸正負向分不出來」的那幾層解掉，寫成 joints.json。

`artfit` 是用輪廓的**三階動差（偏度）**判斷主軸該往哪一頭的。輪廓夠對稱時
最佳與次佳只差一點點（`SIG_AMBIG = 0.06`），它就拒絕猜、回傳 None，那一層
改成「沿用 pack 原本的擺放」—— 姿勢沒有被強制，動起來就會散掉。

Capo 的 boss 有 10 個槽位卡在這一關（實測 gap 0.001–0.045），**全部**都是這個
原因，沒有一層是形狀對不上或缺骨長。

## 這支怎麼解

正負向只有四種（主軸 ±、次軸 ±）。四種各算一次擺放，然後跟 **pack 自己那一層
的四邊形**比對角點平均距離，取最小的。

這個判準之所以成立，是因為美術需求就是「**照原版的 bind pose 畫**」
（`ART_BRIEF_CAST_PACKS.md` 共通規則第 4 條）。所以正確的那一個必然落在原件
附近，錯的那三個是翻 180° 或鏡像，差很遠 —— 實測最佳與次佳差 2 倍以上。

**角度、位置、等比大小仍然不要求對**：這裡只用 pack 四邊形當「哪一頭是哪一頭」
的參考，選完之後照樣是 `fit_quad` 依使用者的圖重算擺放。

    python resolve_joints.py -c miami_boss --layers ../../boss --report
    python resolve_joints.py -c miami_boss --layers ../../boss \
        --joints ../../boss/joints.json --write

`--write` 會把解出來的 `origin` / `tip` 併進既有的 joints.json（不覆蓋已經手寫的
條目，例如 `Cigg`）。寫出來的是**像素座標**，可以直接用眼睛在圖上核對。

同一個 attachment 被兩個 slot 用、而且兩個 slot 各有自己的圖時（boss 的
`ch3_body2`：`ch3_body` 用 898x1751、`ch3_pocket` 用 1774x887 的
`ch3_pocket__ch3_body2.png`），條目會寫成 `<slot>/<att>`。
`motionlib` 查表的順序已經一併改成 `<slot>/<att>` → `<slot>__<att>` → `<att>`。
"""
from __future__ import print_function

import argparse
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import artfit                                                 # noqa: E402
import motionlib                                              # noqa: E402

SIGNS = [(1, 1), (1, -1), (-1, 1), (-1, -1)]


def quad_from_anchors(spec, img, o, t):
    """跟 `artfit.fit_quad` 同一套換算，但吃已經算好的關節像素座標。"""
    iw, ih = img.size

    def up(px):
        return np.array([px[0], ih - px[1]], float)

    p0, p1 = up(o), up(t)
    dp = p1 - p0
    lp = float(np.hypot(*dp))
    if lp < 1e-6:
        return None
    s = float(spec['bone_len']) / lp
    th = -math.atan2(dp[1], dp[0])
    R = np.array([[math.cos(th), -math.sin(th)],
                  [math.sin(th), math.cos(th)]]) * s
    corners = np.array([[0.0, 0.0], [iw, 0.0], [iw, ih], [0.0, ih]])
    return (corners - p0) @ R.T


def resolve(spec, img):
    """回傳 (最佳 sgn, origin, tip, 各 sgn 的誤差) 或 None。"""
    sa = spec.get('shape_anchor')
    if not sa or 'bone_len' not in spec:
        return None
    fr = artfit.shape_frame(img)
    if fr is None:
        return None
    ref = np.asarray(spec['quad'], float)
    scored = []
    for sgn in SIGNS:
        o = artfit.from_shape(fr, np.array(sa[0], float), sgn)
        t = artfit.from_shape(fr, np.array(sa[1], float), sgn)
        q = quad_from_anchors(spec, img, o, t)
        if q is None:
            continue
        err = float(np.linalg.norm(q - ref, axis=1).mean()) / float(spec['bone_len'])
        scored.append((err, sgn, o, t))
    if not scored:
        return None
    scored.sort(key=lambda r: r[0])
    return scored


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('-c', '--character', required=True)
    ap.add_argument('--layers', required=True)
    ap.add_argument('--joints')
    ap.add_argument('--report', action='store_true')
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--margin', type=float, default=1.5,
                    help='最佳誤差要比次佳小這個倍數才算解掉（預設 1.5）')
    a = ap.parse_args()

    path = os.path.join(motionlib.PACK_DIR, a.character + '.motion.json')
    mp = motionlib.MotionPack(path, motionlib.load_layers(a.layers))
    existing = artfit.load_joints(a.joints) if a.joints else {}
    out = dict(existing)
    n_ok = n_weak = 0

    print('%-26s %-8s %-9s %-9s %s' % ('層', '選中', '誤差', '次佳', '關節像素座標'))
    for key, spec in mp.layer_specs():
        att = spec['attachment']
        slot = spec['slot']
        img = motionlib._lay(mp.layers, slot, att)
        if img is motionlib._EMPTY or img is None:
            continue
        if motionlib.joint_key(existing, slot, att) is not None:
            print('%-26s %-8s 已經手寫在 joints.json，跳過' % (key, '—'))
            continue
        o0, t0, why = artfit.anchors_px(spec, img, None)
        if o0 is not None:
            continue                       # 本來就量得出來，不要動它
        if '正負向' not in why:
            print('%-26s ❌ %s' % (key, why))
            continue
        scored = resolve(spec, img)
        if not scored or len(scored) < 2:
            print('%-26s ❌ 解不出來' % key)
            continue
        err, sgn, o, t = scored[0]
        second = scored[1][0]
        ratio = second / err if err > 1e-9 else float('inf')
        mark = '✅' if ratio >= a.margin else '⚠️ '
        if ratio >= a.margin:
            n_ok += 1
        else:
            n_weak += 1
        print('%-26s %s%-6s %-9.4f %-9.4f  origin %s tip %s  (次佳/最佳 %.1fx)'
              % (key, mark, str(sgn), err, second,
                 np.round(o).astype(int).tolist(),
                 np.round(t).astype(int).tolist(), ratio))
        # 同一個 attachment 被多個 slot 用、而且圖不同 → 用 slot 限定的鍵
        multi = sum(1 for k, s2 in mp.layer_specs() if s2['attachment'] == att)
        name = ('%s/%s' % (slot, att)) if multi > 1 else att
        out[name] = {'origin': [round(float(o[0]), 1), round(float(o[1]), 1)],
                     'tip': [round(float(t[0]), 1), round(float(t[1]), 1)],
                     'resolved_by': 'resolve_joints.py',
                     'sign': list(sgn),
                     'err': round(err, 4), 'second': round(second, 4)}

    print()
    print('解掉 %d 層，%d 層判準不夠強（次佳/最佳 < %.1fx，要用眼睛確認）'
          % (n_ok, n_weak, a.margin))

    if a.write:
        if not a.joints:
            print('要寫檔請一起給 --joints'); return 1
        with open(a.joints, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print('寫出', a.joints)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
