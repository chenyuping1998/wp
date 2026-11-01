"""Refresh delivery previews from the installed art and verify release identity.

Run audit_v5_detail.py with its output directed to OUT, followed by
SUMO_MOTION_OUT=<OUT>/transitions python design/v5_detail_transitions.py first.
This script never changes production art, motion data, frontend or math.
"""
from pathlib import Path
from PIL import Image, ImageSequence
import hashlib
import json
import shutil
import zipfile

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
OUT = ROOT / 'dist/sumomonkey-current-20261028'
UPLOAD = ROOT / 'upload/SumoMonkey'
EVIDENCE = UPLOAD / 'art-source/current-20261028'
BACKUP = ROOT / '_upload_backups/SumoMonkey-preview-refresh-20261028'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree(path):
    return {str(p.relative_to(path)): digest(p)
            for p in path.rglob('*') if p.is_file()}


def main():
    baseline = json.loads((BACKUP / 'baseline.json').read_text())
    for name in ['frontend', 'math']:
        assert tree(UPLOAD / name) == baseline[name], name
    assert tree(APP / 'build') == baseline['frontend']
    audit = json.loads((OUT / 'source-audit.json').read_text())
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    frames = {}
    revision = {}
    for cast in ['mg', 'fg']:
        source = APP / f'design/sumo_cast/{cast}'
        crops = json.loads((source / 'crops.json').read_text())
        revision[cast] = {}
        for name, box in crops.items():
            original = source / f'layers/{name}.png'
            assert digest(original) == audit[cast]['parts'][name]['sha256']
            spine = source / f'{cast}_spine/images/{name}.png'
            crop = APP / f'static/assets/sumoCast/{cast}/{name}.png'
            original_im = Image.open(original).convert('RGBA')
            reconstructed = Image.new('RGBA', original_im.size)
            reconstructed.paste(Image.open(crop).convert('RGBA'), tuple(box[:2]))
            assert original_im.tobytes() == reconstructed.tobytes(), (cast, name, 'crop')
            assert original_im.tobytes() == Image.open(spine).convert('RGBA').tobytes()
            assert digest(crop) == digest(APP / f'build/assets/sumoCast/{cast}/{name}.png')
            revision[cast][name] = digest(original)
        with Image.open(OUT / f'{cast}-before-after.gif') as gif:
            frames[cast] = [f.convert('RGB').crop((420, 0, 840, 550))
                            for f in ImageSequence.Iterator(gif)]
        preview = source / f'{cast}_spine/預覽.gif'
        frames[cast][0].save(preview, save_all=True,
                              append_images=frames[cast][1:], duration=67, loop=0)
        for relative in [f'cast/{cast}/{cast}_spine', f'motion/{cast}_spine',
                         f'v5-detail-20261027/cast/{cast}/{cast}_spine']:
            shutil.copy2(preview, UPLOAD / 'art-source' / relative / '預覽.gif')
        shutil.copy2(preview, EVIDENCE / f'{cast}-current.gif')
        for page in range(3):
            with Image.open(OUT / f'transitions/{cast}-transitions.png') as sheet:
                sheet.crop((0, page*2200, 1680, (page+1)*2200)).save(
                    OUT / f'{cast}-transitions-{page}.png')
    assert len(frames['mg']) == len(frames['fg'])
    combined = []
    for left, right in zip(frames['mg'], frames['fg']):
        frame = Image.new('RGB', (840, 550))
        frame.paste(left, (0, 0))
        frame.paste(right, (420, 0))
        combined.append(frame)
    combined[0].save(UPLOAD / 'sumo-current-motion.gif', save_all=True,
                     append_images=combined[1:], duration=67, loop=0)
    with zipfile.ZipFile(UPLOAD / 'SumoMonkey-Spine43.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for cast in ['mg', 'fg']:
            source = APP / f'design/sumo_cast/{cast}/{cast}_spine'
            for path in source.rglob('*'):
                if path.is_file():
                    archive.write(path, f'{cast}_spine/{path.relative_to(source)}')
    with zipfile.ZipFile(UPLOAD / 'SumoMonkey-Spine43.zip') as archive:
        assert archive.testzip() is None
        for cast in ['mg', 'fg']:
            source = APP / f'design/sumo_cast/{cast}/{cast}_spine'
            for path in source.rglob('*'):
                if path.is_file():
                    assert archive.read(f'{cast}_spine/{path.relative_to(source)}') == path.read_bytes()
    for path in OUT.iterdir():
        if path.is_file():
            shutil.copy2(path, EVIDENCE / path.name)
    shutil.copytree(OUT / 'transitions', EVIDENCE / 'transitions', dirs_exist_ok=True)
    shutil.copy2('/tmp/sumo-current-20261028-front-plan.json', EVIDENCE / 'platform-front-plan.json')
    manifest = {
        'date': '2026-10-28', 'source_sha256': revision,
        'frontend_and_math_unchanged': baseline,
        'preview_frames_per_cast': len(combined),
        'current_gif_sha256': digest(UPLOAD / 'sumo-current-motion.gif'),
        'spine_archive_sha256': digest(UPLOAD / 'SumoMonkey-Spine43.zip'),
        'store_art_sha256': {n: tree(UPLOAD / n) for n in ['thumbnail', 'cover']},
        'platform_observed': {'front': 6, 'math': 1, 'approval': None,
                              'scratch_front_actions': 0},
        'platform_modified_this_run': False,
        'runtime_qa': 'Existing 2026-10-27 after_knee_fix proof; not rerun in this preview-only pass.'
    }
    (EVIDENCE / 'release-manifest.json').write_text(json.dumps(manifest, indent=2))
    print('PASS: source/Spine/crop/build/stage/archive identity; refreshed current previews; frontend/math unchanged')


if __name__ == '__main__':
    main()
