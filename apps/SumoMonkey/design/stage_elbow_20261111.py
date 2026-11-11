"""Stage the 2026-11-11 elbow fix over front v17 (upper arm underside notch bared in punch; Stone「變成手有缺角」).
Based on the leaf stage script: same checks. Original description of the leaf stage: MG armpit "leaf" (one smooth side outline), MG punching-glove wrist tuft
and pinhole specks (merge_into), MG forearm inner edge, FG front shoulder box (trapezius curve).

Expected frontend delta: assets/sumoCast/{mg,fg}/*.png, the hashed bundle (+ old one removed), index.html,
_app/version.json. Math, thumbnail and cover must stay byte-identical. Refreshes the upload previews and
art-source copies that show the cast. Never uploads anything.
"""
from pathlib import Path
import hashlib, json, shutil, subprocess, tarfile, time
from PIL import Image

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
U = ROOT / 'upload/SumoMonkey'
B = APP / 'build'
ART = ROOT / '角色生圖_相撲猴/四肢加粗_20261107'
QA = APP / 'design/qa/elbow_20261111'
BACKUP = ROOT / '_upload_backups/SumoMonkey-before-elbow-20261111'
SRC = U / 'art-source/elbow-20261111'
PAPER = (236, 226, 204)


def h(p):
    d = hashlib.sha256()
    with open(p, 'rb') as f:
        for blk in iter(lambda: f.read(1 << 20), b''):
            d.update(blk)
    return d.hexdigest()


tree = lambda d: {str(p.relative_to(d)): h(p) for p in sorted(Path(d).rglob('*')) if p.is_file()}


def outside_frontend():
    out = {}
    for top in sorted(U.iterdir()):
        if top.name in ('frontend', 'art-source', 'spine43', 'README.md') or top.name.startswith(('archive-', 'preview-', 'sumo-')):
            continue
        for p in ([top] if top.is_file() else sorted(top.rglob('*'))):
            if p.is_file():
                out[str(p.relative_to(U))] = h(p)
    return out


# ---------- 1. clean build containing every change; source chain identical
idx = (B / 'index.html').read_bytes()
assert b'stub-data.js' not in idx and b'__SUMO_QA__' not in idx and b'qa-ext.js' not in idx
for s in ['src/game/sumoMotion_mg.json', 'src/game/sumoMotion_fg.json', 'src/game/sumoCastPlacement.json']:
    assert (B / 'index.html').stat().st_mtime >= (APP / s).stat().st_mtime, f'build predates {s}'
assert subprocess.run(['git', 'diff', '--quiet', '--', 'src/game/config.ts'], cwd=APP).returncode == 0, 'config.ts changed'
order = json.loads((APP / 'design/sumo_cast/mg/layers/layers.json').read_text())['order']
for C in ['MG', 'FG']:
    c = C.lower()
    for n in order:
        d = ART / '交件' / C / 'layers' / f'{n}.png'
        assert h(d) == h(APP / f'design/sumo_cast/{c}/layers/{n}.png') == h(APP / f'design/sumo_cast/{c}/{c}_spine/images/{n}.png'), f'{c}/{n}'
    for p in (APP / f'static/assets/sumoCast/{c}').glob('*.png'):
        assert h(p) == h(B / f'assets/sumoCast/{c}/{p.name}')
    assert '可以用' in (APP / f'design/sumo_cast/{c}/{c}_spine/報告.md').read_text()

# ---------- 2. delta vs staged v17 is exactly the expected one
bt, ut = tree(B), tree(U / 'frontend')
delta = sorted([n for n in bt if bt.get(n) != ut.get(n)] + [n for n in ut if n not in bt])
odd = [n for n in delta if not (n.startswith('assets/sumoCast/') or n.startswith('_app/immutable/bundle.') or n in ('index.html', '_app/version.json'))]
assert not odd, f'unexpected delta: {odd}'

# ---------- 3. baseline + backup
outside = outside_frontend()
fb = BACKUP / 'frontend_v17.tgz'
if not fb.exists():
    with tarfile.open(fb, 'w:gz') as t:
        t.add(U / 'frontend', arcname='frontend')
        for n in ['README.md', 'preview-current-desktop.jpg', 'preview-current-desktop-fg.jpg', 'sumo-current-motion.gif']:
            t.add(U / n, arcname=n)

# ---------- 4. frontend
changed, removed = [], []
for n, v in bt.items():
    if ut.get(n) != v:
        d = U / 'frontend' / n
        d.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(B / n, d); changed.append(n)
for p in sorted((U / 'frontend/_app/immutable').rglob('*')):
    if p.is_file() and not (B / p.relative_to(U / 'frontend')).exists():
        removed.append(str(p.relative_to(U / 'frontend'))); p.unlink()
assert tree(B) == tree(U / 'frontend'), 'upload frontend != build'

# ---------- 5. previews of the cast (final renders + in-game screenshots)
FR = ART / '拆層/motion'
fr = sorted(p.name for p in (FR / 'MG_frames').glob('f*.png'))
assert fr == sorted(p.name for p in (FR / 'FG_frames').glob('f*.png')) and len(fr) >= 80
for C in ['MG', 'FG']:
    t_layers = max((ART / '交件' / C / 'layers' / f'{n}.png').stat().st_mtime for n in order)
    assert min((FR / f'{C}_frames' / f).stat().st_mtime for f in fr) >= t_layers - 60, f'{C} frames older than layers'
gif = []
for f in fr:
    a = Image.open(FR / 'MG_frames' / f).convert('RGB'); b = Image.open(FR / 'FG_frames' / f).convert('RGB')
    a.thumbnail((360, 454), Image.LANCZOS); b.thumbnail((360, 454), Image.LANCZOS)
    s = Image.new('RGB', (a.width + b.width + 8, max(a.height, b.height)), PAPER)
    s.paste(a, (0, 0)); s.paste(b, (a.width + 8, 0))
    gif.append(s.convert('P', palette=Image.ADAPTIVE, colors=128))
gif[0].save(U / 'sumo-current-motion.gif', save_all=True, append_images=gif[1:], duration=120, loop=0, optimize=True)
# MG rest pose changed (elbow notch filled) -> new in-game 1440x810 shot; FG rest pose is byte-identical -> keep its preview
Image.open(QA / '05_遊戲內_桌機1440x810_MG全畫面.png').convert('RGB').save(U / 'preview-current-desktop.jpg', quality=90)

# ---------- 6. art source / Spine / provenance
def put(src, dst):
    dst = Path(dst)
    if dst.exists():
        dst.chmod(0o644); dst.unlink()
    shutil.copyfile(src, dst)
    return str(dst)
for C in ['MG', 'FG']:
    c = C.lower()
    d = SRC / 'delivery' / C
    shutil.copytree(ART / '交件' / C / 'layers', d / 'layers', dirs_exist_ok=True, copy_function=put)
    put(ART / f'拆層/fixes_{C}.json', SRC / f'fixes_{C}.json')
    cd = U / 'art-source/cast' / c
    shutil.copytree(APP / f'design/sumo_cast/{c}/layers', cd / 'layers', dirs_exist_ok=True, copy_function=put)
    sp = U / 'spine43' / c
    for f in [f'{c}.json', '報告.md']:
        put(APP / f'design/sumo_cast/{c}/{c}_spine/{f}', sp / f)
    for p in (APP / f'design/sumo_cast/{c}/{c}_spine/images').glob('*.png'):
        put(p, sp / 'images' / p.name)
put(ART / '拆層/fix_layers.py', SRC / 'fix_layers.py')
put(ART / '拆層/assemble_layers.py', SRC / 'assemble_layers.py')
shutil.copytree(QA, SRC / 'qa', dirs_exist_ok=True, copy_function=put)
for s in ['design/stage_elbow_20261111.py']:
    t = SRC / 'source' / s; t.parent.mkdir(parents=True, exist_ok=True); put(APP / s, t)

# ---------- 7. final checks
assert tree(B) == tree(U / 'frontend')
assert outside_frontend() == outside, 'math / thumbnail / cover changed'
result = {'time': time.strftime('%Y-%m-%d %H:%M'), 'changed': changed, 'removed': removed,
          'frontend_files': len(bt), 'math_thumbnail_cover_unchanged': True, 'platform_updated': False}
(BACKUP / 'staging.json').write_text(json.dumps(result, indent=1, ensure_ascii=False))
put(BACKUP / 'staging.json', SRC / 'staging.json')
print(json.dumps({k: (v if not isinstance(v, list) else len(v)) for k, v in result.items()}, ensure_ascii=False))
print('removed', removed)
