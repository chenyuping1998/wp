"""Stage the 2026-11-10 UI-nit fixes + new wide A/J tags into upload/SumoMonkey (on top of the published front v14).

Expected frontend delta vs v14: new hashed bundle (+ old one removed), index.html, _app/version.json,
sumoSymbols/l1_a.png, sumoSymbols/l4_j.png, sumoUi/bar_strip.png. Anything else stops the script.
Math, thumbnail and cover must stay byte-identical. Never uploads anything.
"""
from pathlib import Path
import hashlib, json, shutil, subprocess, tarfile, time
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
U = ROOT / 'upload/SumoMonkey'
B = APP / 'build'
AJ = ROOT / '角色生圖_相撲猴/AJ牌加寬_20261110'
QA = APP / 'design/qa/ui_nits_20261110'
BACKUP = ROOT / '_upload_backups/SumoMonkey-before-ui-nits-20261110'
SRC = U / 'art-source/ui-nits-aj-20261110'


def h(p):
    d = hashlib.sha256()
    with open(p, 'rb') as f:
        for blk in iter(lambda: f.read(1 << 20), b''):
            d.update(blk)
    return d.hexdigest()


tree = lambda d: {str(p.relative_to(d)): h(p) for p in sorted(Path(d).rglob('*')) if p.is_file()}
SKIP_TOP = ('frontend', 'art-source', 'spine43', 'README.md')


def outside_frontend():
    out = {}
    for top in sorted(U.iterdir()):
        if top.name in SKIP_TOP or top.name.startswith(('archive-', 'preview-', 'sumo-')):
            continue
        for p in ([top] if top.is_file() else sorted(top.rglob('*'))):
            if p.is_file():
                out[str(p.relative_to(U))] = h(p)
    return out


# ---------- 1. the build is clean and contains every change
idx = (B / 'index.html').read_bytes()
assert b'stub-data.js' not in idx and b'__SUMO_QA__' not in idx and b'qa-ext.js' not in idx
changed_src = ['src/components/Game.svelte', 'src/components/GameNameClock.svelte', 'src/components/FeatureIntro.svelte',
               'src/components/ui/ModalBuyBonus.svelte', 'src/game/symbolIdleMotion.ts',
               'static/assets/sprites/sumoSymbols/l1_a.png', 'static/assets/sprites/sumoSymbols/l4_j.png',
               'static/assets/sprites/sumoUi/bar_strip.png']
for s in changed_src:
    assert (B / 'index.html').stat().st_mtime >= (APP / s).stat().st_mtime, f'build predates {s}'
for k in ['l1_a', 'l4_j']:
    assert h(AJ / '交件' / f'{k}.png') == h(APP / f'static/assets/sprites/sumoSymbols/{k}.png') == h(B / f'assets/sprites/sumoSymbols/{k}.png')
bar = np.asarray(Image.open(B / 'assets/sprites/sumoUi/bar_strip.png').convert('RGB')).astype(int)
assert (bar[19:24, 1546:1584].sum(-1) > 600).all(), 'window buttons still on the bar strip'
assert subprocess.run(['git', 'diff', '--quiet', '--', 'src/game/config.ts'], cwd=APP).returncode == 0, 'config.ts changed'

# ---------- 2. delta vs the staged v14 frontend is exactly the expected one
bt, ut = tree(B), tree(U / 'frontend')
delta = sorted([n for n in bt if bt.get(n) != ut.get(n)] + [n for n in ut if n not in bt])
expected = {'_app/version.json', 'index.html', 'assets/sprites/sumoSymbols/l1_a.png', 'assets/sprites/sumoSymbols/l4_j.png',
            'assets/sprites/sumoUi/bar_strip.png'}
bundles = [n for n in delta if n.startswith('_app/immutable/bundle.')]
assert set(delta) - set(bundles) == expected and len(bundles) == 2, f'unexpected delta: {delta}'

# ---------- 3. baseline + backup
outside = outside_frontend()
BACKUP.mkdir(parents=True, exist_ok=True)
fb = BACKUP / 'frontend.tgz'
if not fb.exists():
    with tarfile.open(fb, 'w:gz') as t:
        t.add(U / 'frontend', arcname='frontend')
        t.add(U / 'README.md', arcname='README.md')
        for n in ['preview-current-desktop.jpg', 'preview-current-desktop-fg.jpg']:
            t.add(U / n, arcname=n)

# ---------- 4. frontend
changed, removed = [], []
for n, v in bt.items():
    d = U / 'frontend' / n
    if ut.get(n) != v:
        d.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(B / n, d); changed.append(n)
for p in sorted((U / 'frontend/_app/immutable').rglob('*')):
    if p.is_file() and not (B / p.relative_to(U / 'frontend')).exists():
        removed.append(str(p.relative_to(U / 'frontend'))); p.unlink()
assert tree(B) == tree(U / 'frontend'), 'upload frontend != build'

# ---------- 5. previews that showed the old A/J and the doubled logo
shutil.copy2(QA / '14_桌機_新AJ_底遊戲.jpg', U / 'preview-current-desktop.jpg')
shutil.copy2(QA / '17_桌機_免費遊戲7列_A與K.jpg', U / 'preview-current-desktop-fg.jpg')
shutil.copy2(QA / '19_小圖96px_新AJ.png', U / 'preview-low-symbols-96px.png')

# ---------- 6. sources + evidence
(SRC / 'aj').mkdir(parents=True, exist_ok=True)
for p in (AJ / '交件').glob('*'):
    shutil.copyfile(p, SRC / 'aj' / p.name)
for f in ['export_aj.py', '需求單.md', '給Codex的訊息.txt']:
    shutil.copyfile(AJ / f, SRC / 'aj' / f)
shutil.copytree(QA, SRC / 'qa', dirs_exist_ok=True, copy_function=shutil.copyfile)
for s in changed_src[:5] + ['design/sumo_port_ui_plates.py', 'design/stage_uinits_20261110.py']:
    t = SRC / 'source' / s
    t.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(APP / s, t)

# ---------- 7. final checks
assert tree(B) == tree(U / 'frontend')
assert outside_frontend() == outside, 'math / thumbnail / cover changed'
result = {'time': time.strftime('%Y-%m-%d %H:%M'), 'changed': changed, 'removed': removed,
          'frontend_files': len(tree(U / 'frontend')), 'math_thumbnail_cover_unchanged': True, 'platform_updated': False}
(BACKUP / 'staging.json').write_text(json.dumps(result, indent=1, ensure_ascii=False))
shutil.copyfile(BACKUP / 'staging.json', SRC / 'staging.json')
print(json.dumps(result, indent=1, ensure_ascii=False))
