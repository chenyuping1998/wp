#!/usr/bin/env python3
"""Build the six 2026-10-15 samples without changing production art.

The blue key, palette quantisation and 512px delivery follow STYLE_TEST_STREET.md.
Stage into a private copy of the existing local playtest for actual Pixi QA.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DESIGN = Path(__file__).resolve().parent
ROOT = DESIGN.parents[3]
SOURCE = DESIGN / '_incoming/style_test_street'
OUT = DESIGN / '_style_test_street'
INKS = ['121212', 'F7F5F0', '55585D', '9A9CA0', 'D8D6D1']
ORANGE = ['9C5A22', 'F5893D', 'FFC38A']
NAMES = ['h1', 'l1', 'w', 'sw', 'bg_crop', 'cast_head']

def palette(name):
    codes = INKS if name in ('l1', 'bg_crop') else INKS + (['B22222'] if name == 'sw' else ORANGE)
    return np.array([[int(h[i:i+2], 16) for i in (0, 2, 4)] for h in codes], dtype=float)

def process(name):
    im = Image.open(SOURCE / f'{name}.png').convert('RGB')
    im = im.resize((1920, 1080) if name == 'bg_crop' else (1024, 1024), Image.Resampling.LANCZOS)
    rgb = np.asarray(im, dtype=float)
    if name == 'bg_crop':
        alpha = np.ones(rgb.shape[:2])
        fg = rgb
    else:
        # Blue is forbidden in the ink palette. Remove it in internal holes too.
        strength = (rgb[..., 2] - np.maximum(rgb[..., 0], rgb[..., 1])) / np.maximum(rgb[..., 2], 1)
        alpha = np.clip((0.85 - strength) / 0.55, 0, 1)
        alpha[np.max(rgb, axis=-1) < 40] = 1
        a = alpha[..., None]
        fg = np.clip((rgb - (1-a) * np.array([0, 0, 255])) / np.maximum(a, .02), 0, 255)
    inks = palette(name)
    # Chunk rows to keep memory bounded on the 8GB workstation.
    quantised = np.empty_like(fg)
    for y in range(0, len(fg), 64):
        part = fg[y:y+64]
        distance = ((part[..., None, :] - inks) ** 2).sum(-1)
        quantised[y:y+64] = inks[distance.argmin(-1)]
    rgba = np.dstack([quantised, alpha * 255]).round().astype('uint8')
    rgba[alpha == 0, :3] = 0
    result = Image.fromarray(rgba).resize((1920, 1080) if name == 'bg_crop' else (512, 512), Image.Resampling.LANCZOS)
    result.save(OUT / f'{name}.png')
    return result

def font(size):
    return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', size)

def sheet(images):
    canvas = Image.new('RGB', (1200, 790), '#D8D6D1')
    draw = ImageDraw.Draw(canvas)
    for i, name in enumerate(NAMES):
        x, y = (i % 3) * 400, (i // 3) * 395
        draw.text((x+18, y+12), name, fill='#121212', font=font(22))
        im = images[name].copy()
        im.thumbnail((350, 265))
        canvas.paste(im, (x+25+(350-im.width)//2, y+48), im)
        if name != 'bg_crop':
            for j, size in enumerate((70, 96)):
                small = images[name].resize((size, size), Image.Resampling.LANCZOS)
                canvas.paste(small, (x+40+j*160, y+290), small)
    canvas.save(OUT / 'samples.png')
    # Actual old low pays beside the proposed L1 at portrait cell size.
    compare = Image.new('RGB', (720, 175), '#28292C')
    d = ImageDraw.Draw(compare)
    for i, name in enumerate(['l1', 'l2', 'l3', 'l4', 'new l1']):
        im = images['l1'] if name == 'new l1' else Image.open(DESIGN.parent / f'static/assets/sprites/turfSymbols/{name}.png').convert('RGBA')
        im = im.resize((96, 96), Image.Resampling.LANCZOS)
        compare.paste(im, (i*144+24, 20), im)
        d.text((i*144+24, 125), name, fill='white', font=font(18))
    compare.save(OUT / 'low_pay_compare.png')
    # Lobby readability study only; a head sample is not the final full-body FG.
    tile = images['bg_crop'].convert('RGBA')
    tile = tile.crop((420, 0, 1500, 1080)).resize((512, 512), Image.Resampling.LANCZOS)
    hero = images['cast_head'].resize((440, 440), Image.Resampling.LANCZOS)
    tile.alpha_composite(hero, (64, 72))
    tile.resize((200, 200), Image.Resampling.LANCZOS).save(OUT / 'lobby_200.png')

def stage():
    baseline = ROOT / 'dist/turfwar-playtest'
    target = ROOT / 'dist/turfwar-street-test'
    shutil.copytree(baseline, target, dirs_exist_ok=True)
    sprites = target / 'assets/sprites'
    for name in ('h1', 'l1', 'w', 'sw'):
        shutil.copy2(OUT / f'{name}.png', sprites / f'turfSymbols/{name}.png')
    shutil.copy2(OUT / 'bg_crop.png', sprites / 'turfBackground/bg_base.png')
    # Old near layer depicts the night scene, so suppress it in this sample.
    near = sprites / 'turfBackground/bg_base_near.png'
    Image.new('RGBA', Image.open(near).size).save(near)
    print(f'LOCAL ONLY: {target}')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stage-playtest', action='store_true')
    args = ap.parse_args()
    missing = [n for n in NAMES if not (SOURCE / f'{n}.png').exists()]
    if missing:
        raise SystemExit(f'Missing samples: {missing}')
    OUT.mkdir(exist_ok=True)
    images = {n: process(n) for n in NAMES}
    sheet(images)
    manifest = {}
    for n, im in images.items():
        a = np.asarray(im)
        lum = a[..., :3] @ np.array([.2126, .7152, .0722])
        manifest[n] = {'size': im.size, 'sha256': hashlib.sha256((OUT / f'{n}.png').read_bytes()).hexdigest(), 'opaque_share': float(np.mean(a[..., 3] >= 128)), 'mean_luminance': float(lum.mean())}
    (OUT / 'metrics.json').write_text(json.dumps(manifest, indent=2)+'\n')
    if manifest['bg_crop']['mean_luminance'] < 140.25:
        raise SystemExit('Background below brief minimum 55% luminance')
    if args.stage_playtest:
        stage()
    print(json.dumps(manifest, indent=2))

if __name__ == '__main__':
    main()
