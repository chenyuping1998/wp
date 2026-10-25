# -*- coding: utf-8 -*-
"""retarget_reaction.py — 把 miami_main_guy 的「中獎反應」接到 miami_boss 的骨架上。

為什麼要有這支：B 版（照 `miami_main_guy` 切圖）在 2026-09-20 停做——它的 15 個
slot 裡 13 個是加權網格、5 個 `len_synthetic` 全落在臉上、`bat` 兩個 slot 都是
`auto_fit: false`，平面切圖組不起來（理由寫在 `ART_BRIEF_CAST_PACKS.md`）。
但 B 版唯一 A 版沒有的東西是**那 1 秒的中獎反應**，而那要的是**動作**，不是切圖。
所以改成把反應的骨骼通道搬到 boss 的骨架上，用 A 版已經交的七張圖播。

    python retarget_reaction.py --write            # 產生 packs/capo_boss_reaction.motion.json
    python retarget_reaction.py --report           # 只印覆蓋率，不寫檔

產出的 pack = boss pack ＋ 兩段新動作：

    full_screen/reaction_name   骨頭照名字對（main_guy 的左臂 → boss 的左臂）
    full_screen/reaction_swap   骨頭照角色對（main_guy 揮的那隻 → boss 空著的那隻），左右鏡像

**兩段都產，讓使用者看過再選**——名字與手勢在這兩具骨架上不一致：
main_guy 揮的是**垂在身側的右臂**（arm_r/arm_r_2/hand_r 帶 rotate＋scale，
arm_l 只有 scale，因為左臂扛著球棒），boss 則是**右手插口袋**（`ch3_pocket`）、
左臂垂著。照名字對會把揮動塞進插口袋的那隻手。
（見記憶 `copy-transcription-means-same-gesture`。）

## 搬了什麼、沒搬什麼

搬：rotate / translate / translatex / scale，逐骨對應表在 `BONE_MAP`。
  * **translate 會按骨長換算**（目標骨長 / 來源骨長；沒有長度的骨用骨架高比例
    1000.37/1065.72 = 0.9387）。不換算的話位移會大 6.5%，而且長短臂不一致。
  * **scale 不換算**（無因次）。
  * **鏡像時 rotate 與 translate.x 連同貝茲曲線的值分量一起變號**；曲線的
    時間分量不動。
  * **兩根來源骨落到同一根目標骨的同一條通道時會合併**，不是後來的被丟掉：
    `biceps_l/biceps_r`（上臂的擠壓拉伸，`scale` 到 1.52/1.56）跟
    `arm_l/arm_r` 都對到 boss 的上臂。合併方式是把兩條時間軸用官方取值函式
    以 60 fps 重新取樣，`scale` 相乘、其餘相加，輸出線性關鍵幀。
    先丟後留那一版會把反應裡最有力的那一下（biceps 的 1.5x）整條丟掉。

**反應是疊在 boss 自己的待機上的**，不是單獨播。真的在遊戲裡也是這樣跑
（待機一條軌、反應一條軌疊上去）；這裡因為 `motionlib` 一次只播一段動畫，所以
**把待機的前 1 秒烘進去**：先整段複製 boss 的 `full_screen/idle`，再把重定向來的
通道疊上去（`scale` 相乘、其餘相加，用上面那支合併函式）。

不烘的話最明顯的症狀是**雪茄的煙**：反應沒有 smoke 通道，那 28 根 smoke 骨就會
停在 setup pose（待機是把它們從 0 放大出來的），畫面上會多一條跟身體一樣高的
黑色煙片浮在旁邊。那不是重定向算錯，是「少了底層待機」。

沒搬（boss 骨架上沒有對應物，一律丟掉並列在報告裡）：
  * 球棒鏈 `bat` / `bat_otherwise2` / `bat_tip`、金鍊 `chain_control` / `chain_back`
  * IK 目標 `arm_l_target` / `arm_bones_l_target`、`ik` 與 `transform` 約束
  * `slots` 的四條加亮通道（`body_lights` / `guy_head_light` / `bat_highlight` /
    `arm_r2`）—— boss 沒有這些 slot。打光閃要做的話用 runtime 的加色 overlay，
    不要當成美術層。
"""
from __future__ import print_function

import argparse
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import spine                                                  # noqa: E402
PACK_DIR = os.path.join(HERE, 'packs')

SRC = 'miami_main_guy'
DST = 'miami_boss'
SRC_ANIM = 'full_screen/reaction'
OUT_PACK = 'capo_boss_reaction'
BASE_ANIM = 'full_screen/idle'     # boss 自己的待機，墊在反應底下

# main_guy 的骨 -> boss 的骨。只列真的對得上的。
BONE_MAP_NAME = {
    'guy_root_pelvis':  'body_root',
    'spine':            'boss_spine1',
    'spine2':           'boss_spine2',
    'neck':             'boss_neck',
    'head':             'boss_head',
    'face_center':      'boss_face_center',
    # ⚠ main_guy 的 `body_perspective` 是**網格變形的輔助骨**：它沒有子骨，靠
    # 權重把軀幹推出透視，還當四條 transform 約束的目標。boss 的
    # `boss_body_perspective` 同樣沒有子骨，但在剛性切片下它只搬得動**身體那一片**
    # —— 照名字對會讓軀幹滑出去、手臂留在原地（實測 t=0.43 身體位移 66、手臂 0）。
    # 剛性骨架上對得起來的等價物是**軀幹根部** `boss_spine1`：軀幹、雙臂、頭一起
    # 移動，腿留在地上。
    #
    # ⚠ 但光搬 `boss_spine1` 會讓手臂張成翅膀：boss 的 IK 目標
    # （`hand_l/r_target`、`shoulder_l/r_target`）全部掛在 **root** 底下，而 IK 驅動的
    # 正是扛著手臂圖層的 `boss_arm2_l/r` 與兩個肩膀。軀幹往上搬、目標留在原地，
    # 手就被往下拉、手肘外翻。所以同一個位移要**一起搬給那四個目標**。
    # 腿的目標 `leg_l/r_target` 不搬 —— 腳要留在地上。
    'body_perspective': ['boss_spine1', 'hand_l_target', 'hand_r_target',
                         'shoulder_l_target', 'shoulder_r_target'],
    'arm_l':            'boss_arm_l',
    'arm_l_2':          'boss_arm2_l',
    'hand':             'boss_hand_l',
    'biceps_l':         'boss_arm_l',    # 上臂的擠壓拉伸，只有 scale
    'arm_r':            'boss_arm_r',
    'arm_r_2':          'boss_arm2_r',
    'hand_r':           'boss_hand_r',
    'biceps_r':         'boss_arm_r',
}

# 照角色對：把 main_guy 揮動的右臂接到 boss 空著的左臂上，反之亦然。
_SWAP = {
    'arm_l': 'boss_arm_r', 'arm_l_2': 'boss_arm2_r', 'hand': 'boss_hand_r',
    'biceps_l': 'boss_arm_r',
    'arm_r': 'boss_arm_l', 'arm_r_2': 'boss_arm2_l', 'hand_r': 'boss_hand_l',
    'biceps_r': 'boss_arm_l',
}
BONE_MAP_SWAP = dict(BONE_MAP_NAME)
BONE_MAP_SWAP.update(_SWAP)
MIRRORED = set(_SWAP)          # 這些骨在 swap 版要變號

# biceps_l / biceps_r 預設**不搬**。它們在 main_guy 是**零長度的葉節點**
# （`length` 沒有、沒有任何子骨），scale 1.52/1.56 只透過網格權重讓上臂鼓起來 ——
# 是 mesh deform，不是骨骼動作。boss 這邊是剛性切片，`boss_arm_*` 扛著整條手臂的
# 圖層，把那個倍率接上去會把手臂拉成一條貫穿畫面的細片（實測過，見 README）。
# `--with-biceps` 可以重現那個壞掉的版本。
BICEPS = {'biceps_l', 'biceps_r'}

# boss 的手臂圖層（`ch3_arm_l` 183x615、`ch3_arm_r` 87x431）在 pack 裡的主導骨是
# **前臂** `boss_arm2_l` / `boss_arm2_r` —— 原版那是一整片跨肩膀／上臂／前臂的加權
# 網格，換成剛性切片之後，前臂只要一轉，整條手臂就繞著手肘甩出去（實測：肩膀端飛到
# 身體外面變成一條直片）。boss 的 idle 幾乎不轉手臂，所以看不出來；反應會轉。
# 因此第三個版本 `torso` 只搬軀幹／脖子／頭，完全不碰手臂鏈。
ARM_BONES = {'arm_l', 'arm_l_2', 'hand', 'arm_r', 'arm_r_2', 'hand_r'}
BONE_MAP_TORSO = dict((k, v) for k, v in BONE_MAP_NAME.items()
                      if k not in ARM_BONES)

# 通道 -> (值的鍵, 該值是第幾個曲線分量, 是不是長度量)
#   長度量要按骨長換算；角度量不換算但鏡像時變號。
CHANNELS = {
    'rotate':     [('value', 0, 'angle')],
    'translate':  [('x', 0, 'len'), ('y', 1, 'len')],
    'translatex': [('value', 0, 'len')],
    'translatey': [('value', 1, 'len')],
    'scale':      [('x', 0, 'none'), ('y', 1, 'none')],
    'scalex':     [('value', 0, 'none')],
    'scaley':     [('value', 1, 'none')],
    'shear':      [('x', 0, 'angle'), ('y', 1, 'angle')],
}
# translate/scale/shear 的 curve 是 8 個數（每個分量 4 個）；單分量通道是 4 個。
# 分量 i 的值控制點落在 curve[i*4+1] 與 curve[i*4+3]。


def src_duration(pack, anim):
    """動畫長度＝所有時間軸上最晚的一個關鍵幀。"""
    d = 0.0
    a = pack['animations'][anim]
    for section in a.values():
        for chans in section.values():
            seqs = chans.values() if isinstance(chans, dict) else [chans]
            for keys in seqs:
                if isinstance(keys, list) and keys:
                    d = max(d, keys[-1].get('time', 0.0))
    return d


def bone_lengths(pack):
    return {n: j['len'] for n, j in pack['pose']['bones'].items()}


def scale_key(key, comps, factors, signs, ncomp):
    """把一個關鍵幀的值與貝茲曲線的**值分量**乘上係數。時間分量不動。"""
    out = copy.deepcopy(key)
    curve = out.get('curve')
    have_curve = isinstance(curve, list)
    for name, idx, _kind in comps:
        f = factors[name] * signs[name]
        if name in out:
            out[name] = round(out[name] * f, 6)
        if have_curve:
            base = idx * 4 if ncomp > 1 else 0
            for off in (1, 3):
                p = base + off
                if p < len(curve):
                    curve[p] = round(curve[p] * f, 6)
    return out


RESAMPLE_FPS = 60


def merge_channel(ch, comps, a_keys, b_keys, duration):
    """兩條同名通道合併成一條線性時間軸。

    `scale` 相乘（兩者都是倍率），其餘相加（都是相對 setup 的差量）。
    取值用 `spine._sample`，也就是播放時真正在用的那支函式，所以貝茲曲線
    與 stepped 的行為跟原檔一致；輸出改成線性關鍵幀（評估用，夠了）。
    """
    fields = [(n, 1.0 if ch.startswith('scale') else 0.0) for n, _i, _k in comps]
    mul = ch.startswith('scale')
    n = int(round(duration * RESAMPLE_FPS)) + 1
    out = []
    for i in range(n):
        t = round(i / float(RESAMPLE_FPS), 6)
        va = spine._sample(a_keys, fields, t, False)
        vb = spine._sample(b_keys, fields, t, False)
        key = {} if i == 0 else {'time': t}
        for fi, (name, dflt) in enumerate(fields):
            x = va[fi] if va else dflt
            y = vb[fi] if vb else dflt
            v = x * y if mul else x + y
            if abs(v - dflt) > 1e-9:
                key[name] = round(v, 6)
        out.append(key)
    return out


def retarget(src_pack, dst_pack, bone_map, mirror, with_biceps=False,
             base_idle=True):
    srclen = bone_lengths(src_pack)
    dstlen = bone_lengths(dst_pack)
    hratio = dst_pack['pose']['source_height'] / src_pack['pose']['source_height']
    dst_bones = set(b['name'] for b in dst_pack['bones'])

    anim = src_pack['animations'][SRC_ANIM]
    duration = src_duration(src_pack, SRC_ANIM)

    base = copy.deepcopy(dst_pack['animations'][BASE_ANIM]) if base_idle else {}
    out_extra = dict((k, v) for k, v in base.items() if k != 'bones')
    out = copy.deepcopy(base.get('bones', {}))
    kept, dropped, notes = [], [], []
    if base_idle:
        notes.append('底層烘進 boss 自己的 %s（%d 根骨、%d 個 slot）'
                     % (BASE_ANIM, len(out), len(base.get('slots', {}))))

    for bn, chans in anim.get('bones', {}).items():
        if bn in BICEPS and not with_biceps:
            dropped.append(('bone', bn,
                            '零長度葉節點，只驅動網格變形 —— 剛性切片無法重現'))
            continue
        tgts = bone_map.get(bn)
        if tgts is None:
            dropped.append(('bone', bn, '沒有對應的 boss 骨'))
            continue
        tgts = [tgts] if isinstance(tgts, str) else list(tgts)
        tgts = [t for t in tgts if t in dst_bones]
        if not tgts:
            dropped.append(('bone', bn, '沒有對應的 boss 骨'))
            continue
        tgt = tgts[0]
        sl, dl = srclen.get(bn, 0.0), dstlen.get(tgt, 0.0)
        if sl > 1e-6 and dl > 1e-6:
            lf, how = dl / sl, '骨長 %.1f/%.1f' % (dl, sl)
        else:
            lf, how = hratio, '骨架高'
        sign = -1.0 if (mirror and bn in MIRRORED) else 1.0

        slot = out.setdefault(tgt, {})
        for ch, keys in chans.items():
            comps = CHANNELS.get(ch)
            if comps is None:
                dropped.append(('channel', '%s.%s' % (bn, ch), '不支援的通道'))
                continue
            factors, signs = {}, {}
            for name, _i, kind in comps:
                factors[name] = lf if kind == 'len' else 1.0
                # 鏡像：角度全部變號，位移只有 x 變號
                signs[name] = sign if (kind == 'angle' or name == 'x') else 1.0
            ncomp = 2 if ch in ('translate', 'scale', 'shear') else 1
            moved = [scale_key(k, comps, factors, signs, ncomp) for k in keys]
            for one in tgts:
                slot = out.setdefault(one, {})
                if ch in slot:
                    slot[ch] = merge_channel(ch, comps, slot[ch], moved, duration)
                    notes.append('%s.%s 疊加（%s）'
                                 % (one, ch,
                                    'x' if ch.startswith('scale') else '+'))
                else:
                    slot[ch] = copy.deepcopy(moved)
            kept.append(('%s.%s' % (bn, ch),
                         ' + '.join('%s.%s' % (o, ch) for o in tgts),
                         how if any(k == 'len' for _n, _i, k in comps) else '—',
                         'mirror' if sign < 0 else ''))

    for section in ('slots', 'ik', 'transform'):
        for k in anim.get(section, {}):
            dropped.append((section, k, 'boss 骨架沒有這個'))

    result = {'bones': out}
    result.update(out_extra)
    return result, kept, dropped, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--report', action='store_true')
    ap.add_argument('--no-base-idle', action='store_true',
                    help='不要把 boss 的待機烘在底下（煙會停在 setup pose）')
    ap.add_argument('--with-biceps', action='store_true',
                    help='把 biceps_* 的網格擠壓也接到上臂骨上（會把手臂拉爛，留著重現用）')
    a = ap.parse_args()

    with open(os.path.join(PACK_DIR, SRC + '.motion.json'), encoding='utf-8') as f:
        src = json.load(f)
    with open(os.path.join(PACK_DIR, DST + '.motion.json'), encoding='utf-8') as f:
        dst = json.load(f)

    out = copy.deepcopy(dst)
    out['character'] = 'capo_boss_reaction'
    out['retarget'] = {
        'from': SRC, 'anim': SRC_ANIM, 'to': DST,
        'note': 'evaluation only — 原始關鍵幀不出貨',
    }
    # verify 的黃金值是 boss 自己那兩段 idle 的，加了新動作不影響
    for label, bmap, mirror in (('name', BONE_MAP_NAME, False),
                                ('swap', BONE_MAP_SWAP, True),
                                ('torso', BONE_MAP_TORSO, False)):
        anim, kept, dropped, notes = retarget(src, dst, bmap, mirror,
                                              a.with_biceps,
                                              not a.no_base_idle)
        out['animations']['full_screen/reaction_' + label] = anim
        print('=' * 68)
        print('full_screen/reaction_%s —— 搬了 %d 條通道，丟了 %d 條'
              % (label, len(kept), len(dropped)))
        for s_, d, how, m in kept:
            print('   %-22s -> %-40s %-16s %s' % (s_, d, how, m))
        for nt in notes:
            print('   ↻ %s' % nt)
        print('   ---- 丟掉 ----')
        for kind, what, why in dropped:
            print('   %-9s %-24s %s' % (kind, what, why))

    if a.write:
        p = os.path.join(PACK_DIR, OUT_PACK + '.motion.json')
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False)
        print()
        print('寫出', p)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
