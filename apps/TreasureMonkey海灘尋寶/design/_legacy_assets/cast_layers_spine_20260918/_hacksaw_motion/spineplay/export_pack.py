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
from retarget import attachment_quad, slice_original        # noqa: E402
import artfit                                                # noqa: E402

# 黃金值抽樣：每段動畫取這幾個相對時間點
GOLDEN_FRACTIONS = (0.0, 0.23, 0.47, 0.71, 0.93)
# 驗證自動擬合可不可靠時，把原件轉這些角度
FIT_PROBE_ANGLES = (17, -33, 61, -84, 128, 196)
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


def probe_autofit(ent, im):
    """實測這一層的自動擬合可不可靠 —— 把原件轉幾個角度，看錨點回不回得來。

    不是憑經驗猜門檻，是拿真的美術跑一遍再把結論寫進 pack。
    使用者那邊看到 `auto_fit: false` 就知道這一層一定要自己給座標。
    """
    import math
    from PIL import Image as _I
    base = artfit.shape_frame(im)
    if base is None:
        return False, 9.0
    a0 = np.array(ent['shape_anchor'][0], float)
    a1 = np.array(ent['shape_anchor'][1], float)
    ref = from_frame(base, a0), from_frame(base, a1)
    worst = 0.0
    for ang in FIT_PROBE_ANGLES:
        r = im.rotate(ang, expand=True, resample=_I.BICUBIC)
        fr = artfit.shape_frame(r)
        if fr is None:
            return False, 9.0
        score, sgn, gap = artfit.match_sig(ent['shape_sig'], fr['sig'])
        if gap < artfit.SIG_AMBIG:
            return False, 9.0
        got = (artfit.from_shape(fr, a0, sgn), artfit.from_shape(fr, a1, sgn))
        th = math.radians(-ang)
        R = np.array([[math.cos(th), -math.sin(th)],
                      [math.sin(th), math.cos(th)]])
        cr = np.array(r.size) / 2.0
        c0 = np.array(im.size) / 2.0
        flip = np.array([1.0, -1.0])
        for g, w in zip(got, ref):
            back = (R @ ((g - cr) * flip)) * flip + c0
            worst = max(worst, float(np.hypot(*(back - w))) / max(im.size))
    return worst <= FIT_PROBE_TOL, worst


def from_frame(fr, ab):
    return artfit.from_shape(fr, ab)


def calibrate_checks(im):
    """量這一層在**良性擾動**下的波動，據此訂它自己的檢查門檻。

    良性 = 旋轉與等比縮放，那些 `fit` 會吸收，絕對不該被擋。
    門檻訂在良性波動最大值的 1.6 倍 —— 所以誤擋率在建包時就是 0，
    而且不會為了遷就某個形狀特殊的層而把全體放寬。

    回傳 (sig_tol, ar_tol, prof_tol, prof_ref)。
    """
    from PIL import Image as _I
    fr0 = artfit.shape_frame(im)
    if fr0 is None:
        return None
    ref_sig = fr0['sig']
    ref_ar = fr0['ext_u'] / fr0['ext_n']
    ref_prof = artfit.spine_profile(im, fr0)
    variants = []
    for ang, sc in CAL_VARIANTS:
        v = im.rotate(ang, expand=True, resample=_I.BICUBIC) if ang else im
        if sc != 1.0:
            v = v.resize((max(4, int(v.width * sc)),
                          max(4, int(v.height * sc))), _I.LANCZOS)
        p = _I.new('RGBA', (int(v.width * (1 + CAL_PAD)),
                            int(v.height * (1 + CAL_PAD))), (0, 0, 0, 0))
        p.paste(v, (int(v.width * CAL_PAD / 2), int(v.height * CAL_PAD / 2)))
        variants.append(p)
    ds, da, dp = [], [], []
    for v in variants:
        fr = artfit.shape_frame(v)
        if fr is None:
            continue
        score, sgn, _gap = artfit.match_sig(ref_sig, fr['sig'])
        ds.append(score)
        da.append(abs(math.log((fr['ext_u'] / fr['ext_n']) / ref_ar)))
        dp.append(artfit.profile_dist(ref_prof,
                                      artfit.spine_profile(v, fr), sgn))
    if not ds:
        return None
    return (round(max(ds) * CAL_MARGIN + 0.02, 5),
            round(max(da) * CAL_MARGIN + 0.05, 5),
            round(max(dp) * CAL_MARGIN + 0.015, 5),
            [[round(float(x), 5) for x in ref_prof[0]],
             [round(float(x), 5) for x in ref_prof[1]]],
            round(float(ref_ar), 5))


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
                    ok, err = probe_autofit(ent, im)
                    ent['auto_fit'] = bool(ok)
                    ent['auto_fit_err'] = round(float(err), 4)
                    cal = calibrate_checks(im)
                    if cal:
                        (ent['sig_tol'], ent['ar_tol'], ent['prof_tol'],
                         ent['prof_ref'], ent['shape_ar']) = cal
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
            'note': '只含動作與幾何；沒有貼圖、uv 或網格頂點。研究用途。',
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
        'layers': layer_table(sk, art),
        'pose': joint_sheet(sk),
        'animations': {an: {k: v for k, v in a.items() if k != 'deform'}
                       for an, a in sk.d['animations'].items()},
        'deform_dropped': sorted(an for an, a in sk.d['animations'].items()
                                 if 'deform' in a),
    }
    if with_golden:
        pack['golden'] = golden(sk, anims)
    return pack


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('--name', required=True)
    ap.add_argument('-o', '--out', default='.')
    ap.add_argument('--no-golden', action='store_true')
    a = ap.parse_args()
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
    sys.exit(main())
