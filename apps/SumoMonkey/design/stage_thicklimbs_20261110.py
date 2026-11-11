"""Stage the 2026-11 thick-limb cast (四肢加粗_20261107) into upload/SumoMonkey.

Checks the whole chain first (交件 layers == design/sumo_cast layers == Spine images; static crops == build == upload),
backs up the staged frontend, copies only changed build files, removes obsolete hashed bundles, archives the
previews/zip that show the old cast, writes fresh previews from the final renders, and leaves math, thumbnail and
cover untouched. Never uploads anything.
"""
from pathlib import Path
import hashlib, io, json, shutil, tarfile, time
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
U = ROOT / 'upload/SumoMonkey'
B = APP / 'build'
ART = ROOT / '角色生圖_相撲猴/四肢加粗_20261107'
DELIV = ART / '交件'
FRAMES = ART / '拆層/motion'
QA = APP / 'design/qa/thick_limbs_20261107/ingame_20261110'
BACKUP = ROOT / '_upload_backups/SumoMonkey-before-thicklimbs-20261110'
ARCHIVE = U / 'archive-before-thicklimbs-20261110'
SRC = U / 'art-source/thicklimbs-20261110'
def h(p):  # streamed, so the big math books never sit in memory
    d = hashlib.sha256()
    with open(p, 'rb') as f:
        for blk in iter(lambda: f.read(1 << 20), b''):
            d.update(blk)
    return d.hexdigest()
tree = lambda d: {str(p.relative_to(d)): h(p) for p in sorted(Path(d).rglob('*')) if p.is_file()}
SKIP_TOP = ('frontend', 'art-source', 'spine43', 'README.md', 'SumoMonkey-Spine43.zip')
def outside_frontend():
    out = {}
    for top in sorted(U.iterdir()):
        if top.name in SKIP_TOP or top.name.startswith(('archive-', 'preview-', 'sumo-')):
            continue
        for p in ([top] if top.is_file() else sorted(top.rglob('*'))):
            if p.is_file():
                out[str(p.relative_to(U))] = h(p)
    return out
PAPER = (236, 226, 204)

# ---------- 1. the build is the clean production build of the new cast
idx = (B / 'index.html').read_bytes()
assert b'stub-data.js' not in idx and b'__SUMO_QA__' not in idx and b'qa-ext.js' not in idx
for c in ['mg', 'fg']:
    assert (B / 'index.html').stat().st_mtime >= (APP / f'src/game/sumoMotion_{c}.json').stat().st_mtime, 'build predates motion export'
order = json.loads((APP / 'design/sumo_cast/mg/layers/layers.json').read_text())['order']
for C in ['MG', 'FG']:
    c = C.lower()
    for n in order:
        src = DELIV / C / 'layers' / f'{n}.png'
        assert h(src) == h(APP / f'design/sumo_cast/{c}/layers/{n}.png'), f'{c}/{n} source != delivery'
        assert h(src) == h(APP / f'design/sumo_cast/{c}/{c}_spine/images/{n}.png'), f'{c}/{n} spine image != delivery'
    assert h(DELIV / C / 'full.png') == h(APP / f'design/sumo_cast/{c}/full.png')
    for p in (APP / f'static/assets/sumoCast/{c}').glob('*.png'):
        assert h(p) == h(B / f'assets/sumoCast/{c}/{p.name}'), f'static != build {p}'
    rep = (APP / f'design/sumo_cast/{c}/{c}_spine/報告.md').read_text()
    assert '可以用' in rep, f'{c} kit report is not 可以用'

# ---------- 2. everything outside frontend must stay as it is
outside = outside_frontend()
for need in ['math/index.json', 'thumbnail/SumoMonkey-Thumbnail-BG.png', 'cover/SumoMonkey-Cover-BG.png']:
    assert need in outside, need

# ---------- 3. backup the staged frontend + root previews once
BACKUP.mkdir(parents=True, exist_ok=True)
fb = BACKUP / 'frontend.tgz'
if not fb.exists():
    with tarfile.open(fb, 'w:gz') as t:
        t.add(U / 'frontend', arcname='frontend')
        t.add(U / 'README.md', arcname='README.md')
(BACKUP / 'baseline_outside_frontend.json').write_text(json.dumps(outside, indent=1))
(BACKUP / 'frontend_before.json').write_text(json.dumps(tree(U / 'frontend'), indent=1))

# ---------- 4. frontend: changed files in, obsolete hashed bundles out
changed, removed = [], []
for p in sorted(B.rglob('*')):
    if not p.is_file():
        continue
    n = p.relative_to(B); d = U / 'frontend' / n
    if not d.exists() or h(d) != h(p):
        d.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, d); changed.append(str(n))
for p in sorted((U / 'frontend/_app/immutable').rglob('*')):
    if p.is_file() and not (B / p.relative_to(U / 'frontend')).exists():
        removed.append(str(p.relative_to(U / 'frontend'))); p.unlink()
assert tree(B) == tree(U / 'frontend'), 'upload frontend != build'

# ---------- 5. archive previews / Spine zip that show the old cast (moved, not deleted)
ARCHIVE.mkdir(exist_ok=True)
archived = []
for p in sorted(U.iterdir()):
    if p.is_file() and (p.name.startswith(('preview-', 'sumo-')) or p.name == 'SumoMonkey-Spine43.zip'):
        if (ARCHIVE / p.name).exists():
            continue  # re-run: the old file is already archived, this one is a preview step 6 rewrites
        shutil.move(str(p), ARCHIVE / p.name); archived.append(p.name)


# ---------- 6. fresh previews from the final revision
def on_paper(im, size=None):
    im = im.convert('RGBA')
    if size:
        im.thumbnail(size, Image.LANCZOS)
    bg = Image.new('RGBA', im.size, PAPER + (255,)); bg.alpha_composite(im)
    return bg.convert('RGB')

# 6a. motion GIF: the exact frames used for the gap check (every 3rd frame = 0.12 s), MG | FG
fr = sorted(p.name for p in (FRAMES / 'MG_frames').glob('f*.png'))
assert fr == sorted(p.name for p in (FRAMES / 'FG_frames').glob('f*.png')) and len(fr) >= 80
for C in ['MG', 'FG']:
    t_layers = max((DELIV / C / 'layers' / f'{n}.png').stat().st_mtime for n in order)
    assert min((FRAMES / f'{C}_frames' / f).stat().st_mtime for f in fr) >= t_layers - 60, f'{C} frames older than layers'
gif = []
for f in fr:
    a = Image.open(FRAMES / 'MG_frames' / f).convert('RGB'); b = Image.open(FRAMES / 'FG_frames' / f).convert('RGB')
    a.thumbnail((360, 454), Image.LANCZOS); b.thumbnail((360, 454), Image.LANCZOS)
    s = Image.new('RGB', (a.width + b.width + 8, max(a.height, b.height)), PAPER)
    s.paste(a, (0, 0)); s.paste(b, (a.width + 8, 0))
    gif.append(s.convert('P', palette=Image.ADAPTIVE, colors=128))
gif[0].save(U / 'sumo-current-motion.gif', save_all=True, append_images=gif[1:], duration=120, loop=0, optimize=True)

# 6b. before / after of the full figures (old = backup taken before install)
old = {}
with tarfile.open(BACKUP / 'cast.tgz') as t:
    for c in ['mg', 'fg']:
        old[c] = Image.open(io.BytesIO(t.extractfile(f'design/sumo_cast/{c}/full.png').read())).copy()
cells = []
for c, C in [('mg', 'MG'), ('fg', 'FG')]:
    cells += [(f'{C} before', on_paper(old[c], (420, 630))), (f'{C} after (thick limbs)', on_paper(Image.open(DELIV / C / 'full.png'), (420, 630)))]
W = sum(i.width for _, i in cells) + 10 * (len(cells) + 1); Hh = max(i.height for _, i in cells) + 40
sheet = Image.new('RGB', (W, Hh), 'white'); dr = ImageDraw.Draw(sheet); x = 10
for lab, im in cells:
    sheet.paste(im, (x, 30)); dr.text((x + 4, 8), lab, fill='black'); x += im.width + 10
sheet.save(U / 'preview-thicklimbs-before-after.png')

# 6c. in-game screenshots of this build (local playtest shell, 2026-11-10)
for src, dst in [('01_桌機_MG_底遊戲.jpg', 'preview-current-desktop.jpg'), ('05_桌機_FG_免費遊戲.jpg', 'preview-current-desktop-fg.jpg'),
                 ('09_直式_DOSUKOI轉場暫停.jpg', 'preview-current-portrait-cutin.jpg')]:
    shutil.copy2(QA / src, U / dst)

# ---------- 7. current Spine 4.3 projects (folders, no zip) + art source / evidence
SP = U / 'spine43'
if SP.exists():
    shutil.rmtree(SP)
for c in ['mg', 'fg']:
    s = APP / f'design/sumo_cast/{c}/{c}_spine'
    d = SP / c; (d / 'images').mkdir(parents=True)
    for f in [f'{c}.json', 'joints.json', 'layers.json', 'motion.params.json', '報告.md']:
        shutil.copy2(s / f, d / f)
    for p in (s / 'images').glob('*.png'):
        shutil.copy2(p, d / 'images' / p.name)
for C in ['MG', 'FG']:
    d = SRC / 'delivery' / C
    shutil.copytree(DELIV / C / 'layers', d / 'layers', dirs_exist_ok=True, copy_function=shutil.copyfile)
    for f in ['full.png', 'assembled.png', 'layers_sheet.png', 'assemble_log.json']:
        shutil.copy2(DELIV / C / f, d / f)
shutil.copytree(QA, SRC / 'qa_ingame', dirs_exist_ok=True)
for f in ['sumo_install_thicklimbs.py', 'stage_thicklimbs_20261110.py']:
    shutil.copy2(APP / 'design' / f, SRC / f)
shutil.copy2(ART / '進度_20261109.md', SRC / '進度_20261109.md')

# ---------- 8. final identity checks
assert tree(B) == tree(U / 'frontend')
assert outside_frontend() == outside, 'math / thumbnail / cover changed'
result = {'time': time.strftime('%Y-%m-%d %H:%M'), 'changed': changed, 'removed': removed, 'archived': archived,
          'frontend_files': len(tree(U / 'frontend')), 'math_thumbnail_cover_unchanged': True, 'platform_updated': False}
(BACKUP / 'staging.json').write_text(json.dumps(result, indent=1, ensure_ascii=False))
shutil.copy2(BACKUP / 'staging.json', SRC / 'staging.json')
print(json.dumps({k: (v if not isinstance(v, list) else f'{len(v)} files') for k, v in result.items()}, ensure_ascii=False, indent=1))
print('removed:', removed); print('archived:', archived)
