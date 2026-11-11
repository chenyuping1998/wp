"""Re-compose the store thumbnail + cover with the 2026-11 thick-limb cast (design/sumo_cast/{mg,fg}/full.png).

Same arena BG, same figure heights and positions as design/build_sumo_store.py (the 10-30 store art); only the
figures change. Unlike that script it touches nothing else in upload/ except art-source/cast (refreshed to the
current cast so the store art's provenance matches). Backup first; evidence → design/qa/store_20261110/.
"""
from pathlib import Path
import io, json, shutil, sys, tarfile
from PIL import Image, ImageOps, ImageDraw

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP / 'design'))
import build_sumo_store as store  # noqa: E402  (cast(), SOURCE, UPLOAD)

U = store.UPLOAD
BACKUP = APP.parents[2] / '_upload_backups/SumoMonkey-before-store-20261110'
QA = APP / 'design/qa/store_20261110'
BACKUP.mkdir(parents=True, exist_ok=True); QA.mkdir(parents=True, exist_ok=True)

tgz = BACKUP / 'store.tgz'
if not tgz.exists():
    with tarfile.open(tgz, 'w:gz') as t:
        for rel in ['thumbnail', 'cover', 'art-source/cast']:
            t.add(U / rel, arcname=rel)
# "before" always comes from the backup, so a re-run never compares the new art with itself
with tarfile.open(tgz) as t:
    old_prev = {c: Image.open(io.BytesIO(t.extractfile(f'{c}/SumoMonkey-{c.title()}-PREVIEW-only.png').read())).convert('RGB')
                for c in ['thumbnail', 'cover']}


def put(src, dst):
    """copy that also replaces read-only targets (joints.json ships chmod a-w)"""
    dst = Path(dst)
    if dst.exists():
        if dst.read_bytes() == Path(src).read_bytes():
            return str(dst)
        dst.chmod(0o644); dst.unlink()
    shutil.copyfile(src, dst)
    return str(dst)

arena = Image.open(store.SOURCE / 'arena.png').convert('RGB')
report = {}
for category, size in [('thumbnail', (1024, 1024)), ('cover', (1920, 1080))]:
    out = U / category
    bg = ImageOps.fit(arena, size, Image.Resampling.LANCZOS, centering=(.5, .55))
    fg = Image.new('RGBA', size)
    mg, mg_path = store.cast('mg', round(size[1] * (.87 if category == 'thumbnail' else .84)))
    fgpic, fg_path = store.cast('fg', round(size[1] * (.66 if category == 'thumbnail' else .70)))
    if category == 'thumbnail':
        positions = [('mg', mg, (round(size[0] * .50 - mg.width * .5), round(size[1] * .09)))]
    else:
        # 10-30 used MG .61 / FG .82; the thicker MG then hid half of FG's body, so the pair is spread a little
        # (bottom-left stays empty, FG stays below the top-right corner)
        positions = [('fg', fgpic, (round(size[0] * .835 - fgpic.width * .5), round(size[1] * .26))),
                     ('mg', mg, (round(size[0] * .59 - mg.width * .5), round(size[1] * .12)))]
    boxes = {}
    for name, pic, xy in positions:
        fg.alpha_composite(pic, xy)
        boxes[name] = [xy[0], xy[1], xy[0] + pic.width, xy[1] + pic.height]
        assert xy[0] >= 0 and xy[1] >= 0 and xy[0] + pic.width <= size[0] and xy[1] + pic.height <= size[1], f'{category} {name} off canvas {boxes[name]}'
    stem = f'SumoMonkey-{category.title()}'
    bg.save(out / f'{stem}-BG.png', optimize=True)
    fg.save(out / f'{stem}-FG.png', optimize=True)
    prev = bg.convert('RGBA'); prev.alpha_composite(fg); prev = prev.convert('RGB')
    prev.save(out / f'{stem}-PREVIEW-only.png', optimize=True)
    h200 = lambda im: im.resize((round(200 * size[0] / size[1]), 200), Image.Resampling.LANCZOS)
    h200(prev).save(APP / f'design/sumo/boxing-{category}-composite-200h.png')
    # before | after at review size (200 px tall) and at 540 px tall
    for H in (200, 540):
        a = old_prev[category].resize((round(H * size[0] / size[1]), H), Image.Resampling.LANCZOS)
        b = prev.resize(a.size, Image.Resampling.LANCZOS)
        s = Image.new('RGB', (a.width * 2 + 30, H + 24), 'white'); d = ImageDraw.Draw(s)
        s.paste(a, (10, 22)); s.paste(b, (a.width + 20, 22))
        d.text((12, 4), 'before (10-30, thinner limbs)', fill='black'); d.text((a.width + 22, 4), 'after (2026-11 thick limbs)', fill='black')
        s.save(QA / f'{category}_before_after_{H}h.png')
    report[category] = {'size': size, 'figures': boxes, 'sources': [str(mg_path), str(fg_path)]}

# provenance: upload art-source/cast = the cast actually used (thick-limb revision)
for mode in ['mg', 'fg']:
    src = APP / 'design/sumo_cast' / mode
    dst = U / 'art-source/cast' / mode
    dst.mkdir(parents=True, exist_ok=True)
    put(src / 'full.png', dst / 'full.png')
    put(src / 'crops.json', dst / 'crops.json')
    shutil.copytree(src / 'layers', dst / 'layers', dirs_exist_ok=True, copy_function=put)
shutil.copyfile(__file__, U / 'art-source/build_sumo_store_20261110.py')
(QA / 'report.json').write_text(json.dumps(report, indent=1))
print(json.dumps(report, indent=1))
