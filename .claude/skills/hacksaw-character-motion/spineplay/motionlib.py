# -*- coding: utf-8 -*-
"""motionlib.py — 動作庫：挑一隻角色的動作，原封不動套到自己的圖上。

```bash
python motionlib.py --list                  # 帶編號的角色清單（GIF 示意圖在 ../gallery/）
python motionlib.py -c 1 --verify           # 換一台機器先跑：骨骼＋網格跟原機一樣

# Miami（1–5）：一張 bind pose 全身圖
python motionlib.py -c 1 --mask ref.png     # 剪影（ControlNet／img2img 起始遮罩）
python motionlib.py -c 1 --prompt           # 提詞
python motionlib.py -c 1 --checkpose 全身圖.png
python motionlib.py -c 1 -a full_screen/idle --image 全身圖.png --gif out.gif
python motionlib.py -c 1 --split 全身圖.png --out 補圖/      # 要完美：補哪些零件圖層
python motionlib.py -c 1 -a full_screen/idle --image 全身圖.png --parts 補好的/ --gif out.gif

# 浣熊（6）：每個零件一張圖
python motionlib.py -c 6 --guide --out 零件指引/   # 輪廓範本＋每個零件的提詞
python motionlib.py -c 6 --layers 零件/ --checkart
python motionlib.py -c 6 -a idle --layers 零件/ --gif out.gif
```

原理：pack 帶著原本的網格（頂點、權重、三角形、deform、clipping），你的圖
對齊到 bind pose 之後，每個頂點的 uv 就是它投影到你的圖上的位置 —— 動起來
時頂點照原本的權重跟骨頭走，你的像素跟著頂點走。詳見
`../references/motion-library.md`。
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
import imageroute                                            # noqa: E402
from meshproj import ProjRig, visibility, who_uses            # noqa: E402
import partguide                                             # noqa: E402

PACK_DIR = os.path.join(HERE, 'packs')

# 給人看的名字 —— 描述外觀，不是官方角色名。順序就是 --list 的編號。
CHARACTERS = [
    ('miami_boss', '白西裝老大', 'Miami Mayhem', '毛領白西裝、手指夾菸、雙手垂在身側'),
    ('miami_main_guy', '扛球棒男', 'Miami Mayhem', '蒙面頭巾、球棒扛在右肩'),
    ('miami_main_girl', '扛球棒女', 'Miami Mayhem', '粉紅丸子頭、球棒扛在肩上、耳環會晃'),
    ('miami_bikinigirl', '比基尼女', 'Miami Mayhem', '頭巾墨鏡、雙手握拳站姿'),
    ('miami_green_guy', '綠背心壯漢', 'Miami Mayhem', '白鬍子、纏繃帶的手臂、雙拳相抵'),
    ('le_bandit_raccoon', '浣熊大盜', 'Le Bandit', '撬棍、貝雷帽、八字鬍；會換臉、冒對話框、丟帽子'),
    ('le_bandit_hw_smokey', '浣熊大盜（新版）', 'Le Bandit Hold & Win', '同一隻浣熊重畫：扁帽、撬棍；換臉、法文對話框、變身妖精'),
    ('le_prechaun_smokey', '妖精浣熊', 'Le Prechaun', '綠色妖精帽與外套、橘鬍子；會跳舞，bonus 有整套獨立動作'),
]


def all_characters():
    """編號順序：上面手寫名字的八隻在前，其餘 pack 依遊戲、骨架名排。

    回傳 [(id, 名字, 遊戲, 一句話)]。自動加進來的用 pack id 拆出遊戲與骨架名
    （id = <遊戲>__<骨架名>，見 scripts/export_all_characters.py）。
    """
    have = sorted(os.path.basename(p)[:-len('.motion.json')]
                  for p in glob.glob(os.path.join(PACK_DIR, '*.motion.json')))
    out = [c for c in CHARACTERS if c[0] in have]
    known = {c[0] for c in out}
    for cid in have:
        if cid in known:
            continue
        game, _, name = cid.partition('__')
        out.append((cid, name.replace('_', ' ') or cid, game.replace('_', ' ').title(), ''))
    return out


def resolve_character(key):
    """`-c` 可以給編號（--list 的順序）或 id。"""
    ids = [c[0] for c in all_characters()]
    if key.isdigit() and 1 <= int(key) <= len(ids):
        return ids[int(key) - 1]
    return key


def _merge_skin(p):
    """path attachment（path 約束要用）＋網格幾何（網格投影要用）。"""
    out = {}
    for src in (p.get('skin_geometry') or {}, p.get('path_attachments') or {}):
        for sn, atts in src.items():
            out.setdefault(sn, {}).update(atts)
    return out


class MotionPack(object):
    """一個 motion pack ＋（可選）使用者自己的圖層。"""

    @classmethod
    def from_dict(cls, p, layers=None, quiet=True):
        mp = cls.__new__(cls)
        mp._init(p, layers, quiet)
        return mp

    def __init__(self, path, layers=None, quiet=True):
        with open(path, encoding='utf-8') as f:
            p = json.load(f)
        self._init(p, layers, quiet)

    def _init(self, p, layers, quiet):
        self.p = p
        d = {
            'skeleton': self.p['skeleton'],
            'bones': self.p['bones'],
            'slots': self.p['slots'],
            'ik': self.p['ik'],
            'transform': self.p['transform'],
            'path': self.p['path'],
            'skins': {'default': _merge_skin(self.p)},
            'animations': self.p['animations'],
        }
        sp = self.p.get('skin')
        skin = None
        if sp:   # 換裝骨架：pack 記著匯出時用的 skin（attachment 已經合併進 skin_geometry）
            skin = {'name': sp['name'], 'bones': sp.get('bones') or [],
                    'ik': sp.get('constraints') or [], 'attachments': {}}
        self.sk = Skeleton.from_dict(d, quiet=quiet, skin=skin)
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
            img = self.layers.get(att)
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


def cmd_checkart(mp, joints, fitting=True, anims=None):
    """量使用者的每一張零件圖，對不上就 fail。

    這是「生出來的圖到底有沒有長成那個零件」唯一能機械回答的地方 ——
    不是靠提詞保證，是量完再說。動畫看得到、卻沒有圖的也算不合格
    （`anims` 給了就只算那幾段）。
    """
    need, unused = partguide.needed(mp, anims)
    total = len(mp.animations)
    rows, nfail, nwarn, nmiss = [], 0, 0, 0
    for g in need:
        att = g['attachment']
        img = mp.layers.get(att)
        if img is None:
            nmiss += 1
            rows.append(('miss', att, ['%s 看得到它，但沒有這張圖'
                                       % who_uses(g['used'], total)]))
            continue
        lvl, msgs = artfit.check_layer(g['spec'], img, joints.get(att),
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
    print('%d 張：%d 通過、%d 警告、%d 不合格、%d 缺圖%s'
          % (len(rows), nok, nwarn, nfail, nmiss,
             '（只算 %s）' % '、'.join(anims) if anims else ''))
    extra = sorted(a for a in mp.layers if a in unused)
    if extra:
        print('（%s 動畫裡不會出現，沒有檢查）' % '、'.join(extra))
    if nfail or nmiss:
        print()
        print('❌ 這組圖還不能用。')
        print('   角度、大小、位置畫錯【不會】出現在上面 —— 那些接上去會自動吸收。')
        print('   上面每一條都是真的沒辦法用：缺圖、空白、不是那個零件、')
        print('   或是輪廓太對稱必須在 joints.json 給座標。')
        if nmiss and not anims:
            print('   只做其中幾段動作的話，加 -a <動作> 就只檢查那幾段會用到的圖。')
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
        img = mp.layers.get(att)
        if img is None:
            continue
        q = artfit.fit_quad(spec, img, joints.get(att))
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
        img = mp.layers.get(att)
        if img is None:
            if setup_att.get(spec['slot']) == att:
                missing.append(att)
            continue
        q = artfit.fit_quad(spec, img, joints.get(att))
        if q is None:
            if setup_att.get(spec['slot']) == att:
                loose.append(att)
            continue
        o, t, _ = artfit.anchors_px(spec, img, joints.get(att))
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


_DIRS = [(-180, -158, '朝左'), (-157, -113, '朝左下'), (-112, -68, '朝正下'),
         (-67, -23, '朝右下'), (-22, 22, '朝右'), (23, 67, '朝右上'),
         (68, 112, '朝正上'), (113, 157, '朝左上'), (158, 180, '朝左')]


def _dir_word(a):
    for lo, hi, w in _DIRS:
        if lo <= a <= hi:
            return w
    return '朝右'


def cmd_list(find=None):
    chars = all_characters()
    if not chars:
        print('packs/ 是空的。用 export_pack.py 從骨架檔產生，')
        print('或把別台機器產好的 .motion.json 複製進來。')
        return 1
    print('挑一隻（-c 後面給編號或 id）。GIF 示意圖：gallery/index.html')
    print('共 %d 隻；--find <字> 只列名字或遊戲含這個字的。' % len(chars))
    print()
    last_game = None
    for i, (cid, title, game, look) in enumerate(chars, 1):
        if find and find.lower() not in (cid + ' ' + title + ' ' + game).lower():
            continue
        with open(os.path.join(PACK_DIR, cid + '.motion.json'), encoding='utf-8') as f:
            d = json.load(f)
        fid = d.get('fidelity') or {}
        easy = fid.get('image', 0)
        perfect = max(fid.get('parts', 0), fid.get('layers', 0))
        if look:
            print('%d  %-6s %-18s %-12s 動作 %2d 段' % (i, title, cid, game, len(d['animations'])))
            print('   %s' % look)
            if d.get('route') == 'image':
                print('   一張全身圖：%.2f%%   補零件圖層：%.2f%%' % (100 * easy, 100 * perfect))
            else:
                print('   每個零件一張圖：%.2f%%   （一張全身圖不夠：%.2f%%）'
                      % (100 * perfect, 100 * easy))
            print()
            continue
        if game != last_game:
            print('— %s' % game)
            last_game = game
        route = ('一張全身圖 %.2f%%' % (100 * easy) if d.get('route') == 'image'
                 else '每個零件一張圖 %.2f%%' % (100 * perfect))
        print('%4d  %-24s %-44s 動作 %3d 段  %s' % (i, title[:24], cid[:44], len(d['animations']), route))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true', help='帶編號的角色清單')
    ap.add_argument('--find', help='跟 --list 一起用：只列名字或遊戲含這個字的')
    ap.add_argument('-c', '--character', help='角色：編號或 id（--list 看）')
    ap.add_argument('-a', '--anim', help='動作名（--anims 看有哪些）')
    ap.add_argument('--anims', action='store_true', help='列出這隻的所有動作與秒數')
    ap.add_argument('--spec', action='store_true', help='零件清單、大小比例、bind pose 角度')
    ap.add_argument('--sheet', help='把 bind pose 畫成對照圖（輸出路徑）')
    ap.add_argument('--sheet-all', action='store_true',
                    help='連換臉／備用道具那些 attachment 也畫進去')
    ap.add_argument('--verify', action='store_true',
                    help='確認這台機器算出來的骨骼與網格跟原機一樣（換機器先跑）')
    ap.add_argument('--image',
                    help='一張 bind pose 全身圖（image 路線：Miami 角色用這個，不用切層）')
    ap.add_argument('--mask', help='輸出 bind pose 剪影（ControlNet／比對用）')
    ap.add_argument('--outline', action='store_true',
                    help='跟 --mask 一起用：描出每個零件並標名字')
    ap.add_argument('--layers',
                    help='獨立零件圖的資料夾（檔名 = 零件名.png，每張只有那個零件）')
    ap.add_argument('--parts',
                    help='同畫布零件圖層的資料夾（跟 --image 一樣大、零件在原位）')
    ap.add_argument('--split', metavar='全身圖.png',
                    help='產生完美路線要補的零件圖層指引（搭配 --out）')
    ap.add_argument('--guide', action='store_true',
                    help='每個零件的輪廓範本＋提詞（浣熊這種每個零件一張圖的角色；搭配 --out）')
    ap.add_argument('--out', help='--split / --guide / --gallery 的輸出資料夾')
    ap.add_argument('--gallery', action='store_true',
                    help='產生全部角色的 GIF 示意圖與挑選頁（輸出到 --out，預設 ../gallery）')
    ap.add_argument('--placeholder', action='store_true',
                    help='用色塊代替美術先看動作（跟 gallery 的 GIF 一樣，不需要任何美術）')
    ap.add_argument('--checkart', action='store_true',
                    help='量 --layers 的每一層，對不上就 fail')
    ap.add_argument('--no-fit', action='store_true',
                    help='不要擬合，直接用 pack 的四邊形（圖要完全照規格切）')
    ap.add_argument('--joints',
                    help='joints.json：手動指定某些層的關節像素座標')
    ap.add_argument('--save-fit', help='把擬合結果存成 JSON')
    ap.add_argument('--verify-pose', action='store_true',
                    help='證明擬合後每個關節都落在骨骼關節上')
    ap.add_argument('--checkpose',
                    help='檢查一張全身圖（Miami 路線）：每個零件的位置上有沒有東西')
    ap.add_argument('--prompt', action='store_true',
                    help='印出生圖提詞（Miami：全身圖；浣熊：每個零件）')
    ap.add_argument('--gif', help='輸出動畫 GIF（搭配 -a）')
    ap.add_argument('--png', help='輸出單格 PNG（搭配 -a，-t 指定秒數）')
    ap.add_argument('-t', '--time', type=float, default=None)
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--scale', type=float, default=0.5)
    ap.add_argument('--stick', action='store_true',
                    help='疊上骨架線，看動作對不對')
    a = ap.parse_args()

    if a.gallery:
        import gallery
        out = a.out or os.path.join(HERE, '..', 'gallery')
        cat = gallery.build(os.path.abspath(out))
        print('寫出 %s（%d 隻角色）' % (os.path.join(os.path.abspath(out), 'index.html'),
                                      len(cat)))
        return 0
    if a.list or not a.character:
        return cmd_list(a.find)

    a.character = resolve_character(a.character)
    path = os.path.join(PACK_DIR, a.character + '.motion.json')
    if not os.path.exists(path):
        print('沒有這隻：%s' % a.character)
        return cmd_list()
    mp = MotionPack(path, load_layers(a.layers) if a.layers else None)
    if a.placeholder and not mp.layers:
        mp.layers = placeholder_layers(mp)
    layers = mp.layers

    route = mp.p.get('route', 'layers')
    fid = mp.p.get('fidelity') or {}

    if a.split:
        import split
        if not a.out:
            print('要 --out <資料夾>')
            return 1
        summary = split.write(mp, Image.open(a.split), a.out)
        groups = {}
        for e in summary:
            groups.setdefault(e['need'], []).append(e['attachment'])
        labels = {1: '一定要畫（換裝件）', 2: '要完美就得畫（會被露出來）',
                  3: '要完美就得畫（會晃動）', 4: '不用畫'}
        for k in (1, 2, 3, 4):
            if groups.get(k):
                print('%-24s %d 個：%s' % (labels[k], len(groups[k]),
                                           ', '.join(groups[k][:10])
                                           + (' …' if len(groups[k]) > 10 else '')))
        print()
        print('寫出 %s（每個零件的範圍、起始稿、給生圖模型的指示在 README.md）'
              % os.path.abspath(a.out))
        return 0

    if a.guide:
        if route == 'image':
            print('%s 走一張全身圖：--mask ref.png 拿剪影、--prompt 拿提詞；' % mp.name)
            print('要完美再用 --split 全身圖.png --out 補圖/ 列出要補的零件圖層。')
            return 0
        if not a.out:
            print('要 --out <資料夾>')
            return 1
        need, unused = partguide.write(mp, a.out)
        print('%d 張零件的輪廓範本＋提詞 → %s' % (len(need), os.path.abspath(a.out)))
        if unused:
            print('不用畫（動畫裡不會出現）：%s' % '、'.join(unused))
        print('照 README.md 一張一張生，生完跑 --layers 零件/ --checkart')
        return 0

    if a.mask:
        imageroute.reference_mask(mp, outline=a.outline).save(a.mask)
        print('寫出', a.mask)
        return 0

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
        need, unused = partguide.needed(mp)
        total = len(mp.animations)
        print('# %s 的美術規格' % mp.name)
        print()
        if route == 'image':
            print('**路線：一張 bind pose 全身圖**（要完美再補零件圖層）')
            print('建包時實測（拿原作當輸入、所有動作裡最差的一格）：'
                  '一張全身圖 %.2f%%、補零件圖層 %.2f%%'
                  % (100 * fid.get('image', 0), 100 * fid.get('parts', 0)))
            print()
            print('一張全身圖用 --mask 拿剪影、--prompt 拿提詞、--checkpose 檢查；')
            print('要補哪幾個零件圖層用 --split 全身圖.png --out 補圖/ 算出來，'
                  '播放時用 --parts（不是 --layers）。')
            print('下面的清單是每個零件的大小比例，讓你知道哪些部位會各自動。')
        else:
            print('**路線：每個零件一張圖**（--layers 資料夾）')
            print('建包時實測（拿原作當輸入、所有動作裡最差的一格）：'
                  '每個零件一張圖 %.2f%%（一張全身圖只有 %.2f%%）'
                  % (100 * fid.get('layers', 0), 100 * fid.get('image', 0)))
            print()
            print('每個零件的輪廓範本＋提詞：--guide --out 零件指引/')
        print()
        print('骨架高 %.0f（正規化成 1000 來比比例）' % po['source_height'])
        print()
        print('## %s（%d 張，檔名 = 零件名.png）'
              % ('要準備的零件圖' if route != 'image' else '各零件的大小比例',
                 len(need)))
        print()
        h = po['source_height']
        print('%-26s %-18s %11s %8s %7s  %s'
              % ('檔名.png', '是什麼', '建議像素', '佔身高', '長寬比', '看得到它的動作／備註'))
        for g in need:
            spec = g['spec']
            pw, ph = partguide.tmpl_size(spec)
            note = [who_uses(g['used'], total)]
            if len(g['slots']) > 1:
                note.append('%d 個位置共用這一張' % len(g['slots']))
            if spec.get('free_shape'):
                note.append('對話框的字：寫自己的字，只檢長寬比')
            elif partguide.needs_joints(spec):
                note.append('★ 要在 joints.json 給座標')
            elif spec.get('orient') == 'upright':
                note.append('照範本方向畫（輪廓對稱）')
            print('%-26s %-18s %5d x %-5d %6.1f%% %7s  %s'
                  % (g['attachment'] + '.png', partguide.describe(g['attachment']),
                     pw, ph, 100.0 * max(pw, ph) / h,
                     ('%.2f' % spec['shape_ar']) if spec.get('shape_ar')
                     else '-',
                     '；'.join(note)))
        print()
        if unused:
            print('不用畫（skin 裡有，但 %d 段動作都沒讓它出現）：%s'
                  % (total, '、'.join(unused)))
            print()
        print('「佔身高」是這塊零件的長邊除以角色全高 —— **各部位的大小比例**。')
        print('「長寬比」是輪廓自己的長邊 / 短邊，會被 --checkart 逐層把關。')
        print()
        print('⚠️ 等比縮放不必對（接上去會自動縮放），但**長寬比要對** ——')
        print('   單軸拉長或變胖就是比例錯，實測 1.3 倍就會被擋下來。')
        print()
        print('## bind pose 的關節角度（參考）')
        print()
        print('%-20s %9s %9s %8s' % ('骨', '世界角度', '長度', '父骨'))
        for n, j in sorted(po['bones'].items(),
                           key=lambda kv: -kv[1]['len']):
            if j['len'] < 1:
                continue
            print('%-20s %8.1f° %9.1f %8s'
                  % (n, j['angle'], j['len'], j['parent'] or '-'))
        print()
        print('用 --sheet 把這個姿勢畫成圖。')
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
        print('骨骼：比對 %d 個值，最大差 %.3e（在 %s）' % (n, worst, at))
        if worst > tol:
            print('❌ 超過容許值 %g —— 這台機器算出來跟原機不一樣' % tol)
            return 1
        mg = mp.p.get('mesh_golden')
        if mg:
            import meshproj
            mw, mat, mn = 0.0, '', 0
            for an, rows in mg.items():
                for t, cx, cy, sp, cnt in rows:
                    mp.sk.pose(an, t)
                    _st, _o, dfm = mp.sk._posed
                    pts = []
                    for sl in mp.sk.slots:
                        sn = sl['name']
                        for att, att_d in sorted((mp.sk.skin.get(sn) or {}).items()):
                            if att_d.get('type', 'region') not in ('region', 'mesh'):
                                continue
                            if mp.sk.att_inactive(sn, att_d):
                                continue
                            w = meshproj.world_verts(mp.sk, sn,
                                                     dict(att_d, _name=att), dfm)
                            if w is not None:
                                pts.append(w)
                    P = np.concatenate(pts, 0)
                    c = P.mean(0)
                    spread = float(np.sqrt(((P - c) ** 2).sum(1).mean()))
                    dd = max(abs(c[0] - cx), abs(c[1] - cy), abs(spread - sp))
                    if len(P) != cnt:
                        dd = 9e9
                    mn += 1
                    if dd > mw:
                        mw, mat = dd, '%s t=%.3f' % (an, t)
            print('網格：比對 %d 個影格的頂點（含 deform），最大差 %.3e（在 %s）'
                  % (mn, mw, mat))
            if mw > 1e-2:
                print('❌ 網格變形跟原機不一樣')
                return 1
        print('✅ motion pack verify OK')
        return 0

    joints = artfit.load_joints(a.joints)
    if a.checkpose and route == 'image':
        img = Image.open(a.checkpose)
        lvl, msgs, diag = imageroute.check_image(mp, img)
        print('# %s —— 全身圖檢查（image 路線）' % mp.name)
        print()
        for msg in msgs:
            print('   %s' % msg)
        print()
        if lvl == 'fail':
            print('❌ 這張圖接上去會有明顯破洞。用 --mask 的剪影重生，')
            print('   或把上面列的位置補上。')
            return 1
        if lvl == 'warn':
            print('⚠️  可以用，但上面那幾點會看得出來。')
            return 0
        print('✅ image check OK —— 每個零件的位置上都有東西，可以直接播。')
        return 0
    if a.checkpose:
        print('%s 走「每個零件一張圖」，不用全身圖 —— 動畫會換上 %d 張零件'
              '（各種臉、嘴型、對話框），一張圖給不出來。'
              % (mp.name, len(partguide.needed(mp)[0])))
        print('   --guide --out 零件指引/        每個零件的輪廓範本＋提詞')
        print('   --layers 零件/ --checkart      生完之後逐張檢查')
        return 1
    if a.prompt:
        if route == 'image':
            return imageroute.prompt_image(mp)
        need, unused = partguide.needed(mp)
        print(partguide.readme(mp, need, unused, files=False))
        return 0
    if a.verify_pose:
        if not layers:
            print('要 --layers <資料夾>')
            return 1
        return cmd_verifypose(mp, joints)
    if a.checkart:
        if not layers:
            print('要 --layers <資料夾>')
            return 1
        return cmd_checkart(mp, joints, fitting=not a.no_fit,
                            anims=[a.anim] if a.anim else None)
    # 預設就擬合：量出每張圖裡關節的實際位置再擺放。
    # 對正確切好的圖是無損的（實測 IoU 0.9996），對歪掉的圖是救命的。
    rig = None
    parts = load_layers(a.parts) if a.parts else None
    has_affine = any('slice_affine' in v for v in mp.p['layers'].values())
    if a.placeholder:
        import gallery
        rig = gallery.placeholder_rig(mp)
    elif a.image or parts or (layers and has_affine and not a.no_fit):
        # 全部走網格投影：一張全身圖、同畫布零件圖層、獨立零件圖可以混用
        rig = ProjRig.build(mp.sk, mp.p['layers'],
                            full=Image.open(a.image) if a.image else None,
                            art_bbox=mp.p.get('art_bbox'),
                            parts=parts, layers=layers, joints=joints)
        if parts and not a.image:
            print('⚠️  --parts 要搭配 --image 全身圖（用它對齊）')
    elif layers and not a.no_fit:
        cmd_fit(mp, joints, a.save_fit)

    if not a.anim:
        print('要 -a <動作>。可用的：')
        for an in mp.animations:
            print('  ', an)
        return 1
    if rig is not None and a.anim:
        used = {}
        for k, m in (rig.method or {}).items() if hasattr(rig, 'method') else []:
            used[m] = used.get(m, 0) + 1
        if used:
            label = {'full': '全身圖', 'part': '零件圖層', 'layer': '獨立零件圖'}
            print('貼圖來源：' + '、'.join('%s %d 個' % (label.get(k, k), v)
                                        for k, v in sorted(used.items())))
    if rig is None and not layers:
        if route == 'image':
            print('要 --image <全身圖.png>（這隻走 image 路線，不用切層），')
            print('或加 --placeholder 先看動作。')
        else:
            print('要 --layers <資料夾>，或加 --placeholder 先用方塊看動作。')
        print('跑 --spec 看要準備什麼。')
        return 1

    def frame(t, bg=(0, 0, 0, 0)):
        if rig is not None:
            rig.pose(a.anim, t)
            im = rig.render(scale=a.scale, bg=bg)
            if a.stick:
                sd = mp.p['skeleton']
                im = mp._draw_stick(
                    im, a.scale, -sd.get('x', 0.0) * a.scale + 8,
                    (sd.get('y', 0.0) + (sd.get('height') or 1000)) * a.scale + 8)
            return im
        mp.pose(a.anim, t)
        return mp.render(scale=a.scale, bg=bg, stick=a.stick)

    dur = mp.duration(a.anim)
    if a.png or a.time is not None:
        t = a.time if a.time is not None else dur * 0.5
        im = frame(t)
        out = a.png or (a.character + '_' + a.anim.replace('/', '_') + '.png')
        im.save(out)
        print('寫出', out)
    if a.gif:
        n = max(2, int(dur * a.fps))
        frames = [frame(dur * i / n, (20, 20, 28, 255)) for i in range(n)]
        frames[0].save(a.gif, save_all=True, append_images=frames[1:],
                       duration=int(1000.0 / a.fps), loop=0)
        print('寫出 %s（%d 幀 %.2f 秒）' % (a.gif, n, dur))
    miss = rig.missing if rig is not None else mp.missing
    if miss:
        print()
        print('少了 %d 層（那些位置是空的）：%s'
              % (len(miss), ', '.join(sorted(miss))))
    return 0


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
