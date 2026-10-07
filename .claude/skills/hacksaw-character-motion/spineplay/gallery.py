# -*- coding: utf-8 -*-
"""gallery.py — 角色動作的 GIF 示意圖＋挑選頁。

    python gallery.py              # 產生 ../gallery/（index.html + 每段動作一張 GIF）
    python gallery.py --only miami_boss --fps 12

示意圖**不用任何原作美術**：每個零件用它自己的網格塗一個色塊，再用跟正式
播放完全相同的網格投影去演。所以網格怎麼彎、換臉換道具、裁切，全都照原
動作；畫面裡沒有一個像素來自別人的美術。

顏色代表部位：膚色＝頭臉、橘＝頭髮、藍＝身體、綠＝手臂、紫＝腿腳、
金＝道具、白＝對話框、半透明＝煙／光。
"""
from __future__ import print_function

import argparse
import colorsys
import hashlib
import html
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from motionlib import MotionPack, PACK_DIR, CHARACTERS, all_characters  # noqa: E402
from meshproj import ProjRig, bind_world, drawable, raster, tris_of  # noqa: E402
import partguide                                              # noqa: E402

NAMES = {c[0]: (c[1], c[2], c[3]) for c in CHARACTERS}
ORDER = [c[0] for c in CHARACTERS]

CATS = [
    ('fx', ('smoke', 'light', 'glow', 'shine', 'spark', 'lenses2', 'highlight'),
     (236, 238, 248), 120),
    ('bubble', ('bubble', 'bonjour', 'merci', 'oui', 'non', 'bien', 'cava',
                'merde', 'mondieu', 'zutalors', 'incroyable', 'conneries',
                'lepain', 'bleep', 'dollar'), (246, 246, 252), 235),
    ('glass', ('glass', 'lens'), (96, 206, 232), 235),
    ('hair', ('hair', 'strand', 'band'), (232, 150, 92), 235),
    ('prop', ('bat', 'crowbar', 'chain', 'cig', 'hat', 'bread', 'pain',
              'money', 'bag', 'shoe'), (228, 196, 88), 235),
    ('head', ('head', 'face', 'ear', 'nose', 'mouth', 'eye', 'brow', 'mustache',
              'beard', 'pupil', 'cheek', 'smirk', 'grr', 'ohh', 'angry', 'happy',
              'hmm', 'neck'), (236, 192, 156), 240),
    ('arm', ('arm', 'hand', 'finger', 'elbow', 'sholder', 'shoulder', 'fist',
             'bicep', 'forearm'), (118, 184, 144), 240),
    ('leg', ('leg', 'foot', 'knee', 'thigh', 'pants'), (132, 120, 204), 240),
    ('body', ('body', 'torso', 'chest', 'belly', 'shirt', 'coat', 'jacket'),
     (96, 132, 206), 240),
    ('tail', ('tail',), (176, 142, 112), 240),
]


def part_color(sn, att):
    name = ('%s %s' % (sn, att)).lower()
    base, alpha = None, 240
    for _cat, keys, col, al in CATS:
        if any(k in name for k in keys):
            base, alpha = col, al
            break
    h = int(hashlib.md5(name.encode('utf-8')).hexdigest()[:6], 16)
    if base is None:
        r, g, b = colorsys.hsv_to_rgb((h % 997) / 997.0, 0.4, 0.9)
        base = (int(r * 255), int(g * 255), int(b * 255))
    # 同一類的零件稍微錯開明暗，相鄰的才分得出來
    k = 0.86 + 0.28 * ((h >> 8) % 100) / 100.0
    return tuple(int(max(0, min(255, c * k))) for c in base), alpha


def _sil_mask(spec, w, h):
    """pack 的輪廓佔有格 → 零件圖大小的平滑遮罩（跟 --guide 的範本同一份）。"""
    from partguide import sil_mask
    return sil_mask(spec, w, h)


def _blob_texture(mask, col, al):
    tex = np.zeros(mask.shape + (4,), np.float64)
    tex[mask] = col + (al,)
    inner = mask.copy()
    inner[1:-1, 1:-1] = (mask[1:-1, 1:-1] & mask[:-2, 1:-1] & mask[2:, 1:-1]
                         & mask[1:-1, :-2] & mask[1:-1, 2:])
    tex[mask & ~inner] = (26, 26, 34, max(al, 200))
    return tex


def placeholder_rig(mp, px_per_unit=0.5):
    """每個零件一塊色塊，投影到網格上。

    Miami（網格貼著美術）：色塊就是網格本身的形狀。
    Le Bandit（切件、網格是寬鬆的矩形）：色塊用 pack 的 24×24 輪廓格，
    再用零件圖→bind pose 的仿射放上去。
    """
    sk = mp.sk
    if mp.p.get('route') == 'layers':
        rig = ProjRig(sk)
        bw = bind_world(sk)
        for sn, att, a in drawable(sk):
            spec = mp.p['layers'].get('%s/%s' % (sn, att))
            w = bw.get((sn, att))
            if not spec or w is None or 'sil' not in spec or 'slice_affine' not in spec:
                continue
            sw, sh = spec['slice_size']
            k = 0.5                      # 零件圖縮一半就夠示意用
            tw, th = max(2, int(sw * k)), max(2, int(sh * k))
            col, al = part_color(sn, att)
            tex = _blob_texture(_sil_mask(spec, tw, th), col, al)
            A = np.array(spec['slice_affine'], float)
            L, t = A[:2, :].T, A[2, :]
            sp = (np.linalg.inv(L) @ (w - t).T).T * k
            rig.tex[(sn, att)] = (tex, sp)
        return rig
    sk = mp.sk
    bw = bind_world(sk)
    s = px_per_unit
    allp = np.concatenate([w for w in bw.values() if w is not None], 0)
    x0, y0 = allp.min(0)
    x1, y1 = allp.max(0)
    ox, oy = -x0 * s + 4, y1 * s + 4
    W = int((x1 - x0) * s) + 8
    H = int((y1 - y0) * s) + 8
    rig = ProjRig(sk)
    for sn, att, a in drawable(sk):
        w = bw.get((sn, att))
        if w is None:
            continue
        uv = np.stack([w[:, 0] * s + ox, oy - w[:, 1] * s], 1)
        cx0 = int(max(0, np.floor(uv[:, 0].min()) - 2))
        cy0 = int(max(0, np.floor(uv[:, 1].min()) - 2))
        cx1 = int(min(W, np.ceil(uv[:, 0].max()) + 3))
        cy1 = int(min(H, np.ceil(uv[:, 1].max()) + 3))
        if cx1 <= cx0 or cy1 <= cy0:
            continue
        m = raster([(w, tris_of(a))], s, ox - cx0, oy - cy0, cx1 - cx0, cy1 - cy0)
        if m.sum() < 2:
            continue
        col, al = part_color(sn, att)
        tex = np.zeros(m.shape + (4,), np.float64)
        tex[m] = col + (al,)
        inner = m.copy()
        inner[1:-1, 1:-1] = (m[1:-1, 1:-1] & m[:-2, 1:-1] & m[2:, 1:-1]
                             & m[1:-1, :-2] & m[1:-1, 2:])
        edge = m & ~inner
        tex[edge] = (26, 26, 34, max(al, 200))
        rig.tex[(sn, att)] = (tex, uv - np.array([cx0, cy0], float))
    return rig


def render_gif(mp, anim, out, height=300, fps=15, max_frames=150,
               bg=(23, 23, 29)):
    rig = placeholder_rig(mp)
    sd = mp.p['skeleton']
    sh = sd.get('height') or 1000.0
    scale = height / float(sh)
    dur = mp.duration(anim) or 1.0
    n = int(min(max_frames, max(2, round(dur * fps))))
    frames = []
    for i in range(n):
        rig.pose(anim, dur * i / n)
        im = rig.render(scale=scale, bg=bg + (255,), pad=6)
        frames.append(im.convert('RGB'))
    # 所有影格共用一個調色盤，顏色才不會跳
    pal_src = Image.new('RGB', (frames[0].width, frames[0].height * min(4, n)))
    for j in range(min(4, n)):
        pal_src.paste(frames[(j * n) // min(4, n)], (0, j * frames[0].height))
    pal = pal_src.quantize(colors=96, method=Image.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.NONE) for f in frames]
    q[0].save(out, save_all=True, append_images=q[1:],
              duration=int(round(1000.0 / (n / dur))), loop=0, optimize=True)
    return n, dur


def _slug(anim):
    return anim.replace('/', '__')


_FONTS = ('C:/Windows/Fonts/msjhbd.ttc', 'C:/Windows/Fonts/msjh.ttc',
          'C:/Windows/Fonts/NotoSansTC-VF.ttf',
          '/System/Library/Fonts/PingFang.ttc',
          '/System/Library/Fonts/STHeiti Medium.ttc',
          '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
          '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
          '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc')


def _font(size):
    """找得到中文字型就用，找不到就退回預設字型（標籤改成 id）。"""
    from PIL import ImageFont
    for p in _FONTS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size), True
            except (IOError, OSError):
                pass
    return ImageFont.load_default(), False


def _gif_frames(path):
    """(影格 RGB 陣列, 每格毫秒) —— 讀回已經寫好的 GIF。"""
    from PIL import ImageSequence
    im = Image.open(path)
    frames, durs = [], []
    for fr in ImageSequence.Iterator(im):
        frames.append(fr.convert('RGB'))
        durs.append(fr.info.get('duration', im.info.get('duration', 66)) or 66)
    return frames, durs


def _main_anim(anims):
    for key in ('full_screen/idle', 'idle', 'main_game/idle', 'idles/idle_1', 'idle_1', 'base/idle'):
        if key in anims:
            return key
    for a in anims:
        if 'idle' in a.lower() and 'setup' not in a.lower():
            return a
    return anims[0]


def overview_gif(catalog, out_dir, name='overview.gif', cell_h=240, fps=12,
                 seconds=5.0, bg=(23, 23, 29)):
    """六隻角色的待機動作並排成一張 GIF，下面標編號與名字 —— 一眼挑角色用。"""
    font, cjk = _font(18)
    small, _ = _font(13)
    cells = []
    for c in [x for x in catalog if x.get('look')] or catalog:
        main = _pick_main(c['animations'])
        frames, durs = _gif_frames(os.path.join(out_dir, main['gif']))
        k = cell_h / float(frames[0].height)
        size = (max(1, int(round(frames[0].width * k))), cell_h)
        starts = np.cumsum([0] + durs[:-1])
        cells.append({'c': c, 'main': main['name'], 'frames': frames,
                      'starts': starts, 'total': float(sum(durs)), 'size': size})
    gap, label_h = 14, 56
    W = sum(e['size'][0] for e in cells) + gap * (len(cells) + 1)
    H = cell_h + label_h + gap
    n = int(round(seconds * fps))
    out = []
    for i in range(n):
        t_ms = 1000.0 * i / fps
        canvas = Image.new('RGB', (W, H), bg)
        dr = ImageDraw.Draw(canvas)
        x = gap
        for e in cells:
            j = int(np.searchsorted(e['starts'], t_ms % e['total'], side='right') - 1)
            canvas.paste(e['frames'][j].resize(e['size'], Image.BILINEAR), (x, gap))
            c = e['c']
            label = ('%d  %s' % (c['index'], c['title'])) if cjk else \
                    ('%d  %s' % (c['index'], c['id']))
            dr.text((x + 2, gap + cell_h + 6), label, fill=(233, 232, 240), font=font)
            dr.text((x + 2, gap + cell_h + 29), e['main'], fill=(154, 152, 171), font=small)
            x += e['size'][0] + gap
        out.append(canvas)
    pal_src = Image.new('RGB', (W, H * 4))
    for j in range(4):
        pal_src.paste(out[(j * n) // 4], (0, j * H))
    pal = pal_src.quantize(colors=128, method=Image.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.NONE) for f in out]
    path = os.path.join(out_dir, name)
    q[0].save(path, save_all=True, append_images=q[1:],
              duration=int(round(1000.0 / fps)), loop=0, optimize=True)
    return path


def build(out_dir, only=None, fps=15, height=300):
    packs = sorted(f[:-len('.motion.json')] for f in os.listdir(PACK_DIR)
                   if f.endswith('.motion.json'))
    every = all_characters()
    info = {c[0]: c for c in every}
    all_names = [c[0] for c in every]
    names = [c for c in all_names if c in only] if only else all_names
    os.makedirs(out_dir, exist_ok=True)
    # --only 只重算那幾隻，其他的沿用原本的 catalog（不然頁面只剩那幾隻）
    old = {}
    cat_path = os.path.join(out_dir, 'catalog.json')
    if only and os.path.exists(cat_path):
        with open(cat_path, encoding='utf-8') as f:
            old = {c['id']: c for c in json.load(f)}
    catalog = []
    for c in names:
        idx = all_names.index(c) + 1                 # 編號跟 --list 一樣
        mp = MotionPack(os.path.join(PACK_DIR, c + '.motion.json'))
        cdir = os.path.join(out_dir, c)
        os.makedirs(cdir, exist_ok=True)
        anims = []
        # 手寫名字的八隻每段都做；其餘只做主動作（idle 優先），整包才不會太大
        todo = mp.animations if c in NAMES else [_main_anim(mp.animations)]
        for an in todo:
            fn = _slug(an) + '.gif'
            n, dur = render_gif(mp, an, os.path.join(cdir, fn), height, fps)
            anims.append({'name': an, 'gif': '%s/%s' % (c, fn),
                          'seconds': round(dur, 2), 'frames': n})
            print('  %-20s %-34s %4d 幀 %5.2f 秒' % (c, an, n, dur))
            sys.stdout.flush()
        fid = mp.p.get('fidelity') or {}
        catalog.append({
            'index': idx, 'id': c,
            'title': info[c][1],
            'game': info[c][2],
            'look': info[c][3],
            'all_animations': len(mp.animations),
            'route': mp.p.get('route', 'layers'),
            'fidelity': fid,
            'bones': len(mp.p['bones']),
            'parts': len(partguide.needed(mp)[0]),     # 動畫真的看得到的零件圖
            'animations': anims,
        })
    if old:
        fresh = {c['id']: c for c in catalog}
        old.update(fresh)
        catalog = [old[c] for c in all_names if c in old]
    with open(os.path.join(out_dir, 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page(catalog))
    print('  寫出', overview_gif(catalog, out_dir))
    return catalog


def _pick_main(anims):
    for key in ('full_screen/idle', 'idle'):
        for a in anims:
            if a['name'] == key:
                return a
    return anims[0]


def page(catalog):
    cards = []
    featured = [c for c in catalog if c.get('look')]
    others = [c for c in catalog if not c.get('look')]
    for c in featured:
        main = _pick_main(c['animations'])
        f = c['fidelity']
        if c['route'] == 'image':
            route_label = '一張全身圖'
            easy = '一張全身圖 %.2f%%' % (100 * f.get('image', 0))
            perfect = '＋補零件圖層 %.2f%%' % (100 * f.get('parts', 0))
        else:
            route_label = '每個零件一張圖'
            easy = '每個零件一張圖 %.2f%%' % (100 * max(f.get('layers', 0), f.get('parts', 0)))
            perfect = '（一張全身圖只有 %.1f%%）' % (100 * f.get('image', 0))
        chips = []
        for a in c['animations']:
            chips.append(
                '<figure class="clip"><img loading="lazy" src="%s" alt="%s">'
                '<figcaption><span>%s</span><em>%.1f 秒</em></figcaption></figure>'
                % (html.escape(a['gif']), html.escape(a['name']),
                   html.escape(a['name']), a['seconds']))
        if c['route'] == 'image':
            cmd = ('python spineplay/motionlib.py -c %(id)s --prompt\n'
                   'python spineplay/motionlib.py -c %(id)s -a %(main)s --image 你的圖.png --gif out.gif\n'
                   '# 要完美：列出要補的零件圖層，補好之後加 --parts\n'
                   'python spineplay/motionlib.py -c %(id)s --split 你的圖.png --out 補圖/\n'
                   'python spineplay/motionlib.py -c %(id)s -a %(main)s --image 你的圖.png --parts 補好的/ --gif out.gif')
        else:
            cmd = ('# 每個零件的輪廓範本＋提詞，照著一張一張生\n'
                   'python spineplay/motionlib.py -c %(id)s --guide --out 零件指引/\n'
                   'python spineplay/motionlib.py -c %(id)s --layers 你的零件資料夾/ --checkart\n'
                   'python spineplay/motionlib.py -c %(id)s -a %(main)s --layers 你的零件資料夾/ --gif out.gif')
        cmd = html.escape(cmd % {'id': c['id'], 'main': main['name']})
        cards.append('''
<article class="card" id="%(id)s">
  <div class="hero"><img src="%(gif)s" alt="%(title)s 的待機動作示意"></div>
  <div class="body">
    <p class="num">%(index)d</p>
    <h2>%(title)s</h2>
    <p class="meta">%(game)s · <code>%(id)s</code></p>
    <p class="look">%(look)s</p>
    <dl>
      <div><dt>輸入</dt><dd><span class="pill %(route)s">%(route_label)s</span></dd></div>
      <div><dt>實測重現度</dt><dd>%(easy)s<br><small>%(perfect)s</small></dd></div>
      <div><dt>骨 ／ 零件圖 ／ 動作</dt><dd>%(bones)d ／ %(parts)d ／ %(nanim)d</dd></div>
    </dl>
    <pre><code>%(cmd)s</code></pre>
  </div>
  <div class="clips">%(chips)s</div>
</article>''' % {'id': c['id'], 'gif': html.escape(main['gif']),
                 'title': html.escape(c['title']), 'index': c['index'],
                 'game': html.escape(c['game']), 'look': html.escape(c['look']),
                 'route': c['route'], 'route_label': route_label,
                 'easy': easy, 'perfect': perfect,
                 'bones': c['bones'], 'parts': c['parts'],
                 'nanim': len(c['animations']),
                 'cmd': cmd, 'chips': ''.join(chips)})
    toc = ''.join('<a href="#%s"><b>%d</b>%s</a>' % (c['id'], c['index'],
                                                    html.escape(c['title']))
                  for c in featured)
    if others:
        games = []
        for c in others:
            if c['game'] not in games:
                games.append(c['game'])
        toc += '<a href="#more"><b>+%d</b>更多角色（%d 款遊戲）</a>' % (len(others), len(games))
        tiles = ['<section id="more" class="more"><h2>更多角色 · %d 隻</h2>'
                 '<p class="meta">每隻放一段主動作（idle 優先）。用 <code>-c &lt;id&gt;</code> 叫它，'
                 '<code>--anims</code> 看全部動作。</p>' % len(others)]
        for gname in games:
            tiles.append('<h3 id="g-%s">%s</h3><div class="tiles">' % (
                re.sub(r'[^a-z0-9]+', '-', gname.lower()), html.escape(gname)))
            for c in [x for x in others if x['game'] == gname]:
                m = _pick_main(c['animations'])
                f = c['fidelity']
                best = max(f.get('image', 0) if c['route'] == 'image' else 0,
                           f.get('layers', 0), f.get('parts', 0))
                tiles.append(
                    '<figure class="tile" id="%s"><img loading="lazy" src="%s" alt="%s">'
                    '<figcaption><b>%s</b><code>%s</code><span>%s · 動作 %d 段 · %.2f%%</span></figcaption></figure>'
                    % (c['id'], html.escape(m['gif']), html.escape(c['title']), html.escape(c['title']),
                       html.escape(c['id']), '一張全身圖' if c['route'] == 'image' else '每個零件一張圖',
                       c.get('all_animations', len(c['animations'])), 100 * best))
            tiles.append('</div>')
        tiles.append('</section>')
        cards.append(''.join(tiles))
    return ('''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>角色動作庫</title>
<style>
:root{color-scheme:dark;--bg:#131318;--panel:#1b1b22;--line:#2b2b36;--ink:#e9e8f0;--dim:#9a98ab;
--acc:#e0b04a;--img:#2f7fa8;--lay:#8a5bd6;
font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink)}
header{padding:40px 24px 12px;max-width:1180px;margin:0 auto}
h1{font-size:28px;margin:0 0 8px;letter-spacing:.02em}
header p{color:var(--dim);margin:0 0 6px;max-width:68ch;line-height:1.6}
nav{display:flex;flex-wrap:wrap;gap:8px;max-width:1180px;margin:12px auto 0;padding:0 24px}
nav a{color:var(--ink);text-decoration:none;border:1px solid var(--line);
border-radius:999px;padding:6px 14px;font-size:14px;background:var(--panel)}
nav a b{color:var(--acc);margin-right:6px}
nav a:hover,nav a:focus-visible{border-color:var(--acc);outline:none}
main{max-width:1180px;margin:0 auto;padding:18px 24px 64px;display:grid;gap:22px}
.card{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:0 24px;
background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
.hero{background:#17171d;border-radius:10px;display:flex;align-items:flex-end;
justify-content:center;min-height:300px}
.hero img{max-width:100%;height:auto;image-rendering:auto}
.body{min-width:0}.num{margin:0;color:var(--acc);font-size:13px;letter-spacing:.12em}
h2{margin:2px 0 4px;font-size:22px}
.meta{margin:0;color:var(--dim);font-size:13px}
.look{margin:10px 0 14px;line-height:1.6}
dl{display:grid;grid-template-columns:repeat(3,auto);gap:10px 22px;margin:0 0 14px;justify-content:start}
dl div{display:grid;gap:2px}dt{color:var(--dim);font-size:12px}dd{margin:0;font-variant-numeric:tabular-nums}
dd small{color:var(--dim);font-size:12px}
.pill{font-size:12px;padding:3px 10px;border-radius:999px;color:#fff}
.pill.image{background:var(--img)}.pill.layers{background:var(--lay)}
pre{margin:0;background:#111116;border:1px solid var(--line);border-radius:8px;
padding:10px 12px;overflow-x:auto;font-size:12.5px;line-height:1.55;color:#cfcde0}
.clips{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));
gap:10px;margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
.clip{margin:0;background:#17171d;border-radius:8px;overflow:hidden}
.clip img{width:100%;height:auto;display:block}
.clip figcaption{display:flex;justify-content:space-between;gap:6px;padding:6px 8px;font-size:12px}
.clip figcaption span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.clip figcaption em{font-style:normal;color:var(--dim);font-variant-numeric:tabular-nums}
.more h2{margin:8px 0 4px}.more h3{margin:22px 0 8px;font-size:16px;color:var(--acc)}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.tile{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.tile img{width:100%;height:auto;display:block;background:#17171d}
.tile figcaption{display:grid;gap:2px;padding:8px;font-size:12px}
.tile code{color:var(--dim);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tile span{color:var(--dim)}
.legend{display:flex;flex-wrap:wrap;gap:14px;color:var(--dim);font-size:13px;margin-top:10px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
@media (max-width:760px){header,nav,main{padding-left:16px;padding-right:16px}
.card{grid-template-columns:minmax(0,1fr)}.hero{min-height:220px;margin-bottom:14px}
dl{grid-template-columns:repeat(2,auto)}}
</style></head><body>
<header>
<h1>角色動作庫</h1>
<p>挑一隻角色，把牠的動作原封不動套到你自己畫的角色上。每張 GIF 都是真正的動作資料在演——
網格怎麼彎、什麼時候換臉換道具，全部照原作；色塊只是代替美術，畫面裡沒有任何原作的像素。</p>
<p><b>輸入</b>欄告訴你這隻要準備什麼：「一張全身圖」照 bind pose 剪影畫一張就好；
「＋補零件圖層」是再把會晃、會被露出來的零件各補一張同尺寸的圖層（<code>--split</code> 會列出要補哪些）；
「每個零件一張圖」要把會換的臉、嘴、道具分開畫。<b>實測重現度</b>是拿原作自己當輸入、
跟原作動畫逐格比對的最差一格 —— 你的圖照規格畫，最多就能做到這裡。</p>
<p>挑好了，在終端機輸入 <code>python spineplay/motionlib.py --list</code> 看編號，
<code>-c 編號</code> 或 <code>-c id</code> 就能用（編號會隨新加的角色變，寫程式請用 id）。</p>
<div class="legend"><span><i style="background:#ecc09c"></i>頭臉</span>
<span><i style="background:#e8965c"></i>頭髮</span><span><i style="background:#6084ce"></i>身體</span>
<span><i style="background:#76b890"></i>手臂</span><span><i style="background:#8478cc"></i>腿腳</span>
<span><i style="background:#e4c458"></i>道具</span><span><i style="background:#f6f6fc"></i>對話框</span>
<span><i style="background:#ecedf8;opacity:.5"></i>煙／光</span></div>
</header>
<nav>{{TOC}}</nav>
<main>{{CARDS}}</main>
</body></html>''').replace('{{TOC}}', toc).replace('{{CARDS}}', ''.join(cards))


def rebuild_page(out_dir):
    """只從 catalog.json 重建 index.html 與 overview.gif，不重算每段動作的 GIF。"""
    with open(os.path.join(out_dir, 'catalog.json'), encoding='utf-8') as f:
        catalog = json.load(f)
    for c in catalog:                 # 數字跟著 pack 走（pack 重建過也對得上）
        path = os.path.join(PACK_DIR, c['id'] + '.motion.json')
        if os.path.exists(path):
            mp = MotionPack(path)
            c['fidelity'] = mp.p.get('fidelity') or {}
            c['route'] = mp.p.get('route', 'layers')
            c['bones'] = len(mp.p['bones'])
            c['parts'] = len(partguide.needed(mp)[0])
    with open(os.path.join(out_dir, 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page(catalog))
    overview_gif(catalog, out_dir)
    return catalog


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('-o', '--out', default=os.path.join(HERE, '..', 'gallery'))
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--fps', type=int, default=15)
    ap.add_argument('--height', type=int, default=300)
    ap.add_argument('--page-only', action='store_true',
                    help='只從 catalog.json 重建 index.html 與 overview.gif')
    a = ap.parse_args()
    if a.page_only:
        cat = rebuild_page(os.path.abspath(a.out))
        print('寫出 index.html、overview.gif（%d 隻角色）' % len(cat))
        return 0
    cat = build(os.path.abspath(a.out), a.only, a.fps, a.height)
    print('寫出 %s（%d 隻角色）' % (os.path.join(os.path.abspath(a.out), 'index.html'),
                                  len(cat)))
    return 0


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
