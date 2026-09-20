# -*- coding: utf-8 -*-
"""motionlib.py — 動作庫：挑一隻角色的動作，接到自己的圖上。

```bash
python motionlib.py --list                          # 有哪些角色
python motionlib.py -c le_bandit_raccoon --anims    # 那隻有哪些動作
python motionlib.py -c le_bandit_raccoon --spec     # 要畫哪些圖、多大、什麼姿勢
python motionlib.py -c le_bandit_raccoon --sheet pose.png   # 姿勢對照圖
python motionlib.py -c le_bandit_raccoon --verify   # 確認這台機器算得跟原機一樣
python motionlib.py -c le_bandit_raccoon -a idle --layers my_art/ --gif out.gif
```

`--layers` 是一個資料夾，裡面放 `<attachment 名>.png`。`--spec` 會列出
要哪些、每張建議多少像素。缺的層會被跳過並列出來，不會安靜地少畫。

## 為什麼要有 --spec 跟 --sheet

動作對了但姿勢不對，看起來就是「完全不一樣」。骨架的動畫是疊加在
**bind pose** 上的 —— 浣熊的 bind pose 是「右手往上舉、身體側 12 度」，
你生了一張正面立正的圖接上去，同樣的關鍵幀跑起來就會歪掉。

`--spec` 給的是數字（每根骨的角度、長度比例、每層的尺寸），
`--sheet` 把它畫成圖。**生圖之前先看這兩個，生完再對一次。**
"""
from __future__ import print_function

import argparse
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spine import Skeleton                                   # noqa: E402
import artfit                                                # noqa: E402

PACK_DIR = os.path.join(HERE, 'packs')


class MotionPack(object):
    """一個 motion pack ＋（可選）使用者自己的圖層。"""

    def __init__(self, path, layers=None, quiet=True):
        with open(path, encoding='utf-8') as f:
            self.p = json.load(f)
        d = {
            'skeleton': self.p['skeleton'],
            'bones': self.p['bones'],
            'slots': self.p['slots'],
            'ik': self.p['ik'],
            'transform': self.p['transform'],
            'path': self.p['path'],
            'skins': {'default': self.p.get('path_attachments') or {}},
            'animations': self.p['animations'],
        }
        self.sk = Skeleton.from_dict(d, quiet=quiet)
        self.layers = layers or {}
        self.missing = []
        self.fitted = {}          # key -> 覆寫的四邊形（--fit 算出來的）

    # ---------------------------------------------------------- 查詢
    @property
    def name(self):
        return self.p['character']

    @property
    def animations(self):
        return self.sk.animations

    def duration(self, an):
        return self.sk.duration(an)

    def layer_specs(self):
        """(key, 規格) 依 bind pose 由大到小 —— 大片的先畫比較好對。"""
        items = list(self.p['layers'].items())
        items.sort(key=lambda kv: -(kv[1]['px'][0] * kv[1]['px'][1]))
        return items

    # ---------------------------------------------------------- 播放
    def pose(self, an, t):
        self.sk.pose(an, t)
        return self

    def render(self, scale=1.0, bg=(0, 0, 0, 0), pad=8, stick=False):
        sk = self.sk
        sd = self.p['skeleton']
        sw = sd.get('width') or 1000.0
        sh = sd.get('height') or 1000.0
        W = int(sw * scale) + pad * 2
        H = int(sh * scale) + pad * 2
        ox = -sd.get('x', 0.0) * scale + pad
        oy = (sd.get('y', 0.0) + sh) * scale + pad
        dst = np.zeros((H, W, 4), np.float64)
        dst[:, :] = np.array(bg, float)

        st, order, _ = sk._posed
        for si in order:
            s = sk.slots[si]
            sn = s['name']
            info = st[sn]
            att = info['att']
            if not att or info['color'][3] <= 0.002:
                continue
            spec = self.p['layers'].get('%s/%s' % (sn, att))
            if spec is None:
                continue
            img = _lay(self.layers, sn, att)
            if img is _EMPTY:
                continue
            if img is None:
                if att not in self.missing:
                    self.missing.append(att)
                continue
            M = sk.W[spec['bone']]
            key = '%s/%s' % (sn, att)
            local = np.array(self.fitted.get(key, spec['quad']), float)
            world = (local @ M[:, :2].T) + M[:, 2]
            scr = np.stack([world[:, 0] * scale + ox,
                            oy - world[:, 1] * scale], 1)
            a = np.asarray(img.convert('RGBA')).astype(np.float64)
            ih, iw = a.shape[:2]
            uv = np.array([[0, ih], [iw, ih], [iw, 0], [0, 0]], float)
            for tri in np.array([[0, 1, 2], [0, 2, 3]]):
                Skeleton._tri(dst, a, scr[tri], uv[tri],
                              info['color'], info['blend'], sk.v38)
        out = Image.fromarray(np.clip(dst, 0, 255).astype('uint8'), 'RGBA')
        if stick:
            out = self._draw_stick(out, scale, ox, oy)
        return out

    def _draw_stick(self, im, scale, ox, oy):
        from PIL import ImageDraw
        dr = ImageDraw.Draw(im)
        sk = self.sk
        for b in sk.bones:
            n = b['name']
            p = b.get('parent')
            M = sk.W[n]
            x, y = M[0, 2] * scale + ox, oy - M[1, 2] * scale
            if p is not None:
                P = sk.W[p]
                px, py = P[0, 2] * scale + ox, oy - P[1, 2] * scale
                dr.line([px, py, x, y], fill=(255, 90, 90, 255), width=2)
            ln = sk._bone_len.get(n, 0.0)
            if ln:
                tip = (M[:, :2] @ np.array([ln, 0.0])) + M[:, 2]
                dr.line([x, y, tip[0] * scale + ox, oy - tip[1] * scale],
                        fill=(90, 200, 255, 255), width=2)
            dr.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 220, 90, 255))
        return im

    # ---------------------------------------------------------- 驗證
    def verify(self, tol=2e-4):
        g = self.p.get('golden')
        if not g:
            return None
        names = g['bones']
        worst, worst_at, n = 0.0, '', 0
        for an, frames in g['data'].items():
            for row in frames:
                t = row[0]
                self.sk.pose(an, t)
                for i, bn in enumerate(names):
                    M = self.sk.W[bn]
                    w = row[1 + i * 6: 7 + i * 6]
                    got = (M[0, 0], M[0, 1], M[1, 0], M[1, 1], M[0, 2], M[1, 2])
                    dd = max(abs(a - b) for a, b in zip(got, w))
                    n += 1
                    if dd > worst:
                        worst, worst_at = dd, '%s t=%.3f %s' % (an, t, bn)
        return worst, worst_at, n, tol


def placeholder_layers(mp):
    """用規格尺寸生出一組彩色方塊當暫代圖。

    還沒生圖之前就能先看動作長什麼樣、哪一塊是哪一塊 —— 也順便證明
    pack 本身是完整的（不需要任何原始素材）。
    """
    from PIL import ImageDraw
    import colorsys
    out = {}
    keys = [k for k, _ in mp.layer_specs()]
    for i, (key, spec) in enumerate(mp.layer_specs()):
        w = max(8, spec['px'][0])
        h = max(8, spec['px'][1])
        r, g, b = colorsys.hsv_to_rgb((i * 0.618) % 1.0, 0.45, 0.95)
        col = (int(r * 255), int(g * 255), int(b * 255), 210)
        im = Image.new('RGBA', (w, h), col)
        dr = ImageDraw.Draw(im)
        dr.rectangle([0, 0, w - 1, h - 1], outline=(30, 30, 40, 255), width=3)
        dr.text((6, 6), spec['attachment'], fill=(20, 20, 30, 255))
        out[spec['attachment']] = im
    return out


_EMPTY = object()


def joint_key(joints, slot, att):
    """joints.json 的查表：<slot>/<att> → <slot>__<att> → <att>。

    同一個 attachment 被多個 slot 用、而且各有自己的圖時（boss 的 `ch3_body2`），
    一個以 attachment 為鍵的條目會同時套到兩張不同的圖上，其中一張必錯。
    跟 `_lay` 的 `<slot>__<att>.png` 是同一個道理，所以查表順序也一致。
    """
    for k in ('%s/%s' % (slot, att), '%s__%s' % (slot, att), att):
        if k in joints:
            return joints[k]
    return None


def _lay(layers, slot, att):
    """先找 <slot>__<att>.png（同名 attachment 在不同 slot 是不同圖時用），
    再找 <att>.png。檔案完全透明 = 刻意留空（例如角色不戴眼鏡），直接跳過。"""
    img = layers.get('%s__%s' % (slot, att))
    if img is None:
        img = layers.get(att)
    if img is not None and img.convert('RGBA').getchannel('A').getextrema()[1] == 0:
        return _EMPTY
    return img


def load_layers(folder):
    out = {}
    for f in glob.glob(os.path.join(folder, '*.png')):
        out[os.path.splitext(os.path.basename(f))[0]] = Image.open(f)
    return out


def _draw_bones(dr, sk, scale, ox, oy, label=False):
    for b in sk.bones:
        n = b['name']
        M = sk.W[n]
        x, y = M[0, 2] * scale + ox, oy - M[1, 2] * scale
        p = b.get('parent')
        if p is not None:
            P = sk.W[p]
            dr.line([P[0, 2] * scale + ox, oy - P[1, 2] * scale, x, y],
                    fill=(150, 55, 55, 255), width=1)
    for b in sk.bones:
        n = b['name']
        M = sk.W[n]
        x, y = M[0, 2] * scale + ox, oy - M[1, 2] * scale
        ln = sk._bone_len.get(n, 0.0)
        if ln:
            tip = (M[:, :2] @ np.array([ln, 0.0])) + M[:, 2]
            dr.line([x, y, tip[0] * scale + ox, oy - tip[1] * scale],
                    fill=(90, 205, 255, 255), width=4)
            if label and ln * scale > 26:
                dr.text((x + 4, y - 12), n, fill=(190, 225, 250, 255))
        dr.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5],
                   fill=(252, 208, 70, 255))


def pose_sheet(mp, path, scale=0.5, pad=44, all_layers=False):
    """把 bind pose 畫成兩欄對照圖，當生圖的依據。

    左欄只有骨架（要對的姿勢），右欄是每一層的方框（要切的零件）。
    畫的全是**幾何** —— 關節座標、骨長、方框；整張圖沒有一個像素
    來自別人的美術。

    右欄預設只畫 setup pose 掛著的那一組 attachment；換臉、換嘴、
    備用道具全畫出來會糊成一團，要全部就加 `--sheet-all`。
    """
    from PIL import ImageDraw
    sk = mp.sk
    sk.pose(mp.animations[0], -1e9)
    sd = mp.p['skeleton']
    sw = sd.get('width') or 1000.0
    sh = sd.get('height') or 1000.0
    PW = int(sw * scale) + pad * 2
    H = int(sh * scale) + pad * 2 + 22
    im = Image.new('RGBA', (PW * 2, H), (16, 16, 22, 255))
    dr = ImageDraw.Draw(im)
    oy = (sd.get('y', 0.0) + sh) * scale + pad + 22

    # 左：骨架
    ox = -sd.get('x', 0.0) * scale + pad
    _draw_bones(dr, sk, scale, ox, oy, label=True)
    dr.text((pad, 6), '%s  BIND POSE - generate art in this pose' % mp.name,
            fill=(232, 232, 238, 255))

    # 右：圖層方框
    ox2 = ox + PW
    dr.line([PW, 0, PW, H], fill=(48, 48, 60, 255), width=1)
    setup_att = {s['name']: s.get('attachment') for s in sk.slots}
    shown = 0
    for key, spec in mp.layer_specs():
        if not all_layers and setup_att.get(spec['slot']) != spec['attachment']:
            continue
        M = sk.W[spec['bone']]
        world = (np.array(spec['quad'], float) @ M[:, :2].T) + M[:, 2]
        pts = [(x * scale + ox2, oy - y * scale) for x, y in world]
        dr.line(pts + [pts[0]], fill=(98, 134, 180, 255), width=1)
        tx = min(p[0] for p in pts) + 2
        ty = min(p[1] for p in pts) + 1
        dr.text((tx, ty), spec['attachment'], fill=(150, 185, 220, 255))
        shown += 1
    _draw_bones(dr, sk, scale, ox2, oy)
    dr.text((PW + pad, 6), 'LAYERS to cut (%d shown%s)'
            % (shown, '' if all_layers else ', setup set only'),
            fill=(232, 232, 238, 255))
    im.save(path)
    return path


def cmd_checkart(mp, joints, fitting=True):
    """量使用者的每一層，對不上就 fail。

    這是「生出來的圖到底有沒有長成那個姿勢」唯一能機械回答的地方 ——
    不是靠提詞保證，是量完再說。
    """
    setup_att = {s['name']: s.get('attachment') for s in mp.sk.slots}
    rows, nfail, nwarn, nmiss = [], 0, 0, 0
    for key, spec in mp.layer_specs():
        att = spec['attachment']
        img = _lay(mp.layers, spec['slot'], att)
        if img is _EMPTY:
            continue
        if img is None:
            if setup_att.get(spec['slot']) == att:
                nmiss += 1
                rows.append(('miss', att, ['setup pose 會用到這一層，但沒有這張圖']))
            continue
        lvl, msgs = artfit.check_layer(spec, img,
                                       joint_key(joints, spec['slot'], att),
                                       fitting=fitting)
        if lvl == 'fail':
            nfail += 1
        elif lvl == 'warn':
            nwarn += 1
        rows.append((lvl, att, msgs))
    mark = {'ok': '✅', 'warn': '⚠️ ', 'fail': '❌', 'miss': '❌'}
    for lvl, att, msgs in rows:
        if lvl == 'ok':
            continue
        print('%s %s' % (mark[lvl], att))
        for m in msgs:
            print('     %s' % m)
    nok = sum(1 for r in rows if r[0] == 'ok')
    print()
    print('%d 層：%d 通過、%d 警告、%d 不合格、%d 缺圖'
          % (len(rows), nok, nwarn, nfail, nmiss))
    if nfail or nmiss:
        print()
        print('❌ 這組圖還不能用。')
        print('   角度、大小、位置畫錯【不會】出現在上面 —— 那些 --fit 會吸收掉。')
        print('   上面每一條都是真的沒辦法用：缺圖、空白、不是那個零件、')
        print('   或是輪廓太對稱必須在 joints.json 給座標。')
        return 1
    print('✅ art check OK')
    return 0


def cmd_fit(mp, joints, out_path=None):
    """量出每張圖裡關節的實際位置，重算四邊形。

    這一步之後，**生圖的姿勢不必對** —— 量到哪就擺到哪。
    """
    fitted, skipped = {}, []
    for key, spec in mp.layer_specs():
        att = spec['attachment']
        img = _lay(mp.layers, spec['slot'], att)
        if img is _EMPTY:
            continue
        if img is None:
            continue
        q = artfit.fit_quad(spec, img, joint_key(joints, spec['slot'], att))
        if q is None:
            skipped.append(att)
        else:
            fitted[key] = q
    mp.fitted = fitted
    print('擬合 %d 層，沿用原擺放 %d 層' % (len(fitted), len(skipped)))
    if skipped:
        print('  沿用的（量不出方向或沒有骨長）：%s'
              % ', '.join(sorted(skipped)[:12])
              + (' …' if len(skipped) > 12 else ''))
    if out_path:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(fitted, f, ensure_ascii=False, indent=1)
        print('寫出', out_path)
    return fitted


def cmd_verifypose(mp, joints, tol=1e-3):
    """證明擬合之後每一層的關節【真的】落在骨骼的關節上。

    這是「姿勢有沒有被強制寫進去」唯一能機械回答的問題。
    不是比對長相，是算關節的殘差：把圖裡量到的關節位置，透過擬合出來的
    四邊形換算到骨骼座標，跟骨頭的起點 / 末端相減。

    沒被擬合的層（量不出來又沒宣告座標）會單獨列出來 —— 那些是
    **沿用 pack 原本的擺放**，姿勢沒有被強制，要自己負責。
    """
    mp.sk.pose(mp.animations[0], -1e9)
    setup_att = {s['name']: s.get('attachment') for s in mp.sk.slots}
    worst, who, n = 0.0, '', 0
    loose, missing = [], []
    for key, spec in mp.layer_specs():
        att = spec['attachment']
        img = _lay(mp.layers, spec['slot'], att)
        if img is _EMPTY:
            continue
        if img is None:
            if setup_att.get(spec['slot']) == att:
                missing.append(att)
            continue
        q = artfit.fit_quad(spec, img, joint_key(joints, spec['slot'], att))
        if q is None:
            if setup_att.get(spec['slot']) == att:
                loose.append(att)
            continue
        o, t, _ = artfit.anchors_px(spec, img,
                                    joint_key(joints, spec['slot'], att))
        if o is None:
            loose.append(att)
            continue
        iw, ih = img.size
        Q = np.array(q, float)
        c0, e1, e2 = Q[0], Q[1] - Q[0], Q[3] - Q[0]
        L = float(spec['bone_len'])
        for px, want in ((o, np.array([0.0, 0.0])), (t, np.array([L, 0.0]))):
            loc = c0 + (px[0] / iw) * e1 + (1.0 - px[1] / ih) * e2
            d = float(np.hypot(*(loc - want))) / max(L, 1e-6)
            n += 1
            if d > worst:
                worst, who = d, att
    print('檢查 %d 個關節，最大殘差 %.2e × 骨長（在 %s）' % (n, worst, who))
    bad = worst > tol
    if loose:
        print()
        print('⚠️  這 %d 層沒有被擬合，姿勢【沒有】被強制，沿用 pack 原擺放：'
              % len(loose))
        print('     %s' % ', '.join(sorted(loose)))
        print('     在 joints.json 給 origin / tip 的像素座標就會被納入。')
    if missing:
        print()
        print('❌ setup pose 會用到但沒有圖的層：%s' % ', '.join(sorted(missing)))
    print()
    if bad or missing:
        print('❌ 姿勢沒有完全鎖住')
        return 1
    if loose:
        print('⚠️  已擬合的 %d 個關節全部鎖死（殘差 < %g × 骨長），'
              '但上面那幾層是例外' % (n, tol))
        return 0
    print('✅ pose lock OK —— 全部 %d 個關節都落在骨骼關節上，'
          '殘差 < %g × 骨長' % (n, tol))
    print('   不管生圖畫成什麼姿勢，接上去之後就是 bind pose。')
    return 0


def cmd_prompt(mp):
    """從實際的關節角度產生生圖提詞 —— 數字是量的，不是我寫的。"""
    po = mp.p['pose']
    B = po['bones']
    parts = [
        ('head', ['head', 'neck', 'skull']),
        ('torso', ['chest', 'spine', 'body', 'torso', 'hip', 'pelvis']),
        ('left arm', ['arm_l', 'l_arm', 'l_sholder', 'l_shoulder', 'l_elbow',
                      'arm_bones_l', 'biceps_l']),
        ('right arm', ['arm_r', 'r_arm', 'r_sholder', 'r_shoulder', 'r_elbow',
                       'biceps_r', 'sholder_bone', 'elbow_bone', 'forearm']),
        ('hands', ['hand', 'finger']),
        ('legs / feet', ['leg', 'shoe', 'foot', 'knee', 'thigh']),
        ('tail', ['tail']),
        ('props', ['bat', 'crowbar', 'chain', 'hat', 'glass', 'lens']),
    ]
    used = set()
    print('# %s —— 生圖提詞用的姿勢數字' % mp.name)
    print()
    print('骨架高 %.0f。角度是**世界角度**：0° = 指向畫面右方，'
          '90° = 指向正上方，逆時針為正。' % po['source_height'])
    print()
    for label, keys in parts:
        rows = []
        for n, j in B.items():
            if j['len'] < 6 or n in used:
                continue
            ln = n.lower()
            if any(k in ln for k in keys):
                rows.append((n, j))
                used.add(n)
        if not rows:
            continue
        rows.sort(key=lambda kv: -kv[1]['len'])
        print('## %s' % label)
        for n, j in rows[:8]:
            print('   %-22s 指向 %+7.1f°   長度 %6.1f（佔身高 %.1f%%）'
                  % (n, j['angle'], j['len'], j['len'] / 10.0))
        print()
    rest = [(n, j) for n, j in B.items() if j['len'] >= 6 and n not in used]
    if rest:
        rest.sort(key=lambda kv: -kv[1]['len'])
        print('## 其他')
        for n, j in rest[:10]:
            print('   %-22s 指向 %+7.1f°   長度 %6.1f' % (n, j['angle'], j['len']))
        print()
    print('---')
    print()
    print('把上面的角度翻成句子寫進提詞，並且**明確禁止模型自動擺正**：')
    print('  「這是指定姿勢，不要改成對稱或標準站姿」')
    print()
    print('提詞對不準不會毀掉成果 —— `--fit` 會把每個零件擺回上面這些角度。')
    print('提詞的目的只是讓零件本身好切：關節看得見、四肢不要貼在一起。')
    return 0


def cmd_list():
    packs = sorted(glob.glob(os.path.join(PACK_DIR, '*.motion.json')))
    if not packs:
        print('packs/ 是空的。用 export_pack.py 從骨架檔產生，')
        print('或把別台機器產好的 .motion.json 複製進來。')
        return 1
    print('%-22s %5s %5s %6s  %s' % ('角色', '骨', '層', '動畫', '檔案大小'))
    for p in packs:
        with open(p, encoding='utf-8') as f:
            d = json.load(f)
        print('%-22s %5d %5d %6d  %.0f KB'
              % (d['character'], len(d['bones']), len(d['layers']),
                 len(d['animations']), os.path.getsize(p) / 1024.0))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true')
    ap.add_argument('-c', '--character')
    ap.add_argument('-a', '--anim')
    ap.add_argument('--anims', action='store_true')
    ap.add_argument('--spec', action='store_true')
    ap.add_argument('--sheet')
    ap.add_argument('--sheet-all', action='store_true',
                    help='連換臉／備用道具那些 attachment 也畫進去')
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--layers')
    ap.add_argument('--placeholder', action='store_true',
                    help='用彩色方塊當圖層，先看動作（不需要任何美術）')
    ap.add_argument('--checkart', action='store_true',
                    help='量 --layers 的每一層，對不上就 fail')
    ap.add_argument('--no-fit', action='store_true',
                    help='不要擬合，直接用 pack 的四邊形（圖要完全照規格切）')
    ap.add_argument('--joints',
                    help='joints.json：手動指定某些層的關節像素座標')
    ap.add_argument('--save-fit', help='把擬合結果存成 JSON')
    ap.add_argument('--verify-pose', action='store_true',
                    help='證明擬合後每個關節都落在骨骼關節上')
    ap.add_argument('--prompt', action='store_true',
                    help='印出這隻角色 bind pose 的實測角度，給生圖用')
    ap.add_argument('--gif')
    ap.add_argument('--png')
    ap.add_argument('-t', '--time', type=float, default=None)
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--scale', type=float, default=0.5)
    ap.add_argument('--stick', action='store_true',
                    help='疊上骨架線，看動作對不對')
    a = ap.parse_args()

    if a.list or not a.character:
        return cmd_list()

    path = os.path.join(PACK_DIR, a.character + '.motion.json')
    if not os.path.exists(path):
        print('沒有這隻：%s' % a.character)
        return cmd_list()
    mp = MotionPack(path, load_layers(a.layers) if a.layers else None)
    if a.placeholder and not mp.layers:
        mp.layers = placeholder_layers(mp)
    layers = mp.layers

    if a.anims:
        print('%s —— %d 段動作' % (mp.name, len(mp.animations)))
        drop = set(mp.p.get('deform_dropped') or [])
        for an in mp.animations:
            print('  %-34s %6.2f 秒%s'
                  % (an, mp.duration(an),
                     '   ⚠ 原本有 mesh deform，這裡當剛性片' if an in drop else ''))
        return 0

    if a.spec:
        po = mp.p['pose']
        print('# %s 的美術規格' % mp.name)
        print()
        print('骨架高 %.0f（正規化成 1000 來比比例）' % po['source_height'])
        print()
        print('## 要準備的圖層（檔名 = attachment 名，放在 --layers 資料夾）')
        print()
        h = po['source_height']
        print('%-26s %-16s %11s %8s %7s  %s'
              % ('檔名.png', '掛在哪根骨', '建議像素', '佔身高', '長寬比', '備註'))
        for key, spec in mp.layer_specs():
            pw, ph = spec['px']
            note = []
            if spec['weighted']:
                note.append('原本是加權網格')
            if spec.get('auto_fit') is False:
                note.append('★ 必須在 joints.json 給座標')
            print('%-26s %-16s %5d x %-5d %6.1f%% %7s  %s'
                  % (spec['attachment'] + '.png', spec['bone'], pw, ph,
                     100.0 * max(pw, ph) / h,
                     ('%.2f' % spec['shape_ar']) if spec.get('shape_ar')
                     else '-',
                     '；'.join(note)))
        print()
        print('「佔身高」是這塊零件的長邊除以角色全高 —— **各部位的大小比例**。')
        print('「長寬比」是輪廓自己的長邊 / 短邊，會被 --checkart 逐層把關。')
        print()
        print('⚠️ 等比縮放不必對（--fit 會吸收），但**長寬比要對** ——')
        print('   單軸拉長或變胖就是比例錯，實測 1.3 倍就會被擋下來。')
        print()
        print('## bind pose 的關節角度（生圖要對的姿勢）')
        print()
        print('%-20s %9s %9s %8s' % ('骨', '世界角度', '長度', '父骨'))
        for n, j in sorted(po['bones'].items(),
                           key=lambda kv: -kv[1]['len']):
            if j['len'] < 1:
                continue
            print('%-20s %8.1f° %9.1f %8s'
                  % (n, j['angle'], j['len'], j['parent'] or '-'))
        print()
        print('用 --sheet 把這個姿勢畫成圖，生圖前後各對一次。')
        return 0

    if a.sheet:
        print('寫出', pose_sheet(mp, a.sheet, a.scale, all_layers=a.sheet_all))
        return 0

    if a.verify:
        r = mp.verify()
        if r is None:
            print('這個 pack 沒有黃金值，沒辦法驗證')
            return 1
        worst, at, n, tol = r
        print('比對 %d 個值，最大差 %.3e（在 %s）' % (n, worst, at))
        if worst > tol:
            print('❌ 超過容許值 %g —— 這台機器算出來跟原機不一樣' % tol)
            return 1
        print('✅ motion pack verify OK')
        return 0

    joints = artfit.load_joints(a.joints)
    if a.prompt:
        return cmd_prompt(mp)
    if a.verify_pose:
        if not layers:
            print('要 --layers <資料夾>')
            return 1
        return cmd_verifypose(mp, joints)
    if a.checkart:
        if not layers:
            print('要 --layers <資料夾>')
            return 1
        return cmd_checkart(mp, joints, fitting=not a.no_fit)
    # 預設就擬合：量出每張圖裡關節的實際位置再擺放。
    # 對正確切好的圖是無損的（實測 IoU 0.9996），對歪掉的圖是救命的。
    if layers and not a.no_fit:
        cmd_fit(mp, joints, a.save_fit)

    if not a.anim:
        print('要 -a <動作>。可用的：')
        for an in mp.animations:
            print('  ', an)
        return 1
    if not layers:
        print('要 --layers <資料夾>，或加 --placeholder 先用方塊看動作。')
        print('跑 --spec 看要準備哪些圖。')
        return 1

    dur = mp.duration(a.anim)
    if a.png or a.time is not None:
        t = a.time if a.time is not None else dur * 0.5
        im = mp.pose(a.anim, t).render(scale=a.scale, stick=a.stick)
        out = a.png or (a.character + '_' + a.anim.replace('/', '_') + '.png')
        im.save(out)
        print('寫出', out)
    if a.gif:
        n = max(2, int(dur * a.fps))
        frames = [mp.pose(a.anim, dur * i / n).render(scale=a.scale,
                                                      bg=(20, 20, 28, 255),
                                                      stick=a.stick)
                  for i in range(n)]
        frames[0].save(a.gif, save_all=True, append_images=frames[1:],
                       duration=int(1000.0 / a.fps), loop=0)
        print('寫出 %s（%d 幀 %.2f 秒）' % (a.gif, n, dur))
    if mp.missing:
        print()
        print('少了 %d 層（那些位置是空的）：%s'
              % (len(mp.missing), ', '.join(sorted(mp.missing))))
    return 0


if __name__ == '__main__':
    sys.exit(main())
