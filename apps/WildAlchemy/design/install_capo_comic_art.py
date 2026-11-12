#!/usr/bin/env python3
"""Install the approved crime-comic art pass and build deterministic type assets."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from collections import deque

ROOT = Path(__file__).resolve().parent.parent
GEN = Path('/Users/stone/.codex/generated_images/01a05ddd-de7a-7db0-b2c0-2b2a94ba477e')
ASSETS = ROOT / 'static/assets/sprites'
INK = (20, 16, 13, 255)
GOLD = (201, 162, 39, 255)
BONE = (230, 223, 209, 255)
BURGUNDY = (58, 26, 28, 255)


def remove_checker(image: Image.Image) -> Image.Image:
    """Remove the white/light-gray checker that image generation may bake in."""
    image = image.convert('RGBA')
    data = np.array(image)
    rgb = data[..., :3].astype('int16')
    candidate = (rgb.min(axis=2) > 202) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 16)
    h, w = candidate.shape
    background = np.zeros_like(candidate)
    q = deque()
    for x in range(w):
        if candidate[0,x]: q.append((0,x))
        if candidate[h-1,x]: q.append((h-1,x))
    for y in range(h):
        if candidate[y,0]: q.append((y,0))
        if candidate[y,w-1]: q.append((y,w-1))
    while q:
        y, x = q.popleft()
        if background[y,x] or not candidate[y,x]: continue
        background[y,x] = True
        if y: q.append((y-1,x))
        if y+1<h: q.append((y+1,x))
        if x: q.append((y,x-1))
        if x+1<w: q.append((y,x+1))
    data[background, 3] = 0
    enclosed_checker = (rgb.min(axis=2) > 236) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 9)
    data[enclosed_checker, 3] = 0
    return Image.fromarray(data, 'RGBA')


def contain(source: Path, destination: Path, size: tuple[int, int], margin: float = .04):
    image = remove_checker(Image.open(source))
    bbox = image.getchannel('A').getbbox() or (0, 0, image.width, image.height)
    image = image.crop(bbox)
    max_w, max_h = int(size[0] * (1 - margin * 2)), int(size[1] * (1 - margin * 2))
    scale = min(max_w / image.width, max_h / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', size)
    out.alpha_composite(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    destination.parent.mkdir(parents=True, exist_ok=True)
    out.save(destination, optimize=True)


symbol_sources = {
    'h1': 'exec-6521688e-acda-42cc-8f1f-cc372425f8f7.png',
    'h2': 'exec-d305dcb3-2704-40c9-a970-fd17d95f6491.png',
    'h3': 'exec-b072841e-d509-4e7c-bdfc-f00cf95264f9.png',
    'h4': 'exec-44d5c488-3b1a-482e-b856-f70de7709d45.png',
    'h5': 'exec-b9f1ca23-6b54-4c90-99ac-756fd59fd6df.png',
    'l1': 'exec-0f8bdf2e-c373-4aa1-9c12-e04fbe6c53ed.png',
    'l2': 'exec-46005441-db79-4b25-b4d0-3469d8232502.png',
    'l3': 'exec-b1d1adce-aad6-4bc7-846c-7221ceeacce2.png',
    'l4': 'exec-e197d8fa-b39d-49d3-8a80-fac38a5826fe.png',
    'w': 'exec-4e818ef2-9161-40cc-8f5d-1bd6cae5ed08.png',
    'fs': 'exec-6613aab3-f005-4418-9170-478a0649a39e.png',
    'sw': 'exec-8be4def0-a286-416d-8450-f2d913e68985.png',
}
for stem, source in symbol_sources.items():
    contain(GEN / source, ASSETS / 'hotMiamiSymbols' / f'{stem}.png', (512, 512), .045)

# Character: force the existing mesh contract exactly (figure box and plant line).
guy = remove_checker(Image.open(GEN / 'exec-a935406c-472e-40ad-a197-7b5fa3514c85.png'))
guy = guy.crop(guy.getchannel('A').getbbox()).resize((269, 801), Image.Resampling.LANCZOS)
rig = Image.new('RGBA', (512, 1024)); rig.alpha_composite(guy, (134, 39))
rig_dir = ROOT / 'static/assets/meshRigs/cast_guy'; rig_dir.mkdir(parents=True, exist_ok=True)
for name in ('guy.png', 'guy_feature.png', 'guy_don.png'):
    rig.save(rig_dir / name, optimize=True)
small = rig.crop((123, 60, 389, 879)).resize((266, 819), Image.Resampling.LANCZOS)
small.save(ASSETS / 'hotMiamiCast/guy.png', optimize=True)

# Dedicated cash frames and edge flashes.
frame_sources = {
    1: ('exec-dddc5efd-bf26-4b07-8bb6-9da740014926.png', 256),
    2: ('exec-c592321e-466e-4482-bce2-c4967ee3e765.png', 512),
    3: ('exec-86a7f155-e1a5-49be-b34c-c36c6666d9c3.png', 768),
}
frame_dir = ASSETS / 'capoFrames'; frame_dir.mkdir(parents=True, exist_ok=True)
for side, (source, pixels) in frame_sources.items():
    target = frame_dir / f'frame_{side}x{side}.png'
    contain(GEN / source, target, (pixels, pixels), .015)
    frame = Image.open(target).convert('RGBA')
    # The multiplier is drawn by Pixi. Guarantee a quiet translucent centre even
    # if the model painted detail there, while leaving the structural rim opaque.
    alpha = frame.getchannel('A')
    px = alpha.load(); radius = pixels * .24
    for y in range(pixels):
        for x in range(pixels):
            if ((x - pixels/2) ** 2 + (y - pixels/2) ** 2) ** .5 < radius:
                px[x, y] = min(px[x, y], 178)
    frame.putalpha(alpha); frame.save(target, optimize=True)
    alpha = frame.getchannel('A')
    outer = alpha.filter(ImageFilter.MaxFilter(15 if side == 1 else 21))
    inner = alpha.filter(ImageFilter.MinFilter(9 if side == 1 else 13))
    edge_alpha = Image.eval(Image.fromarray(__import__('numpy').maximum(0, __import__('numpy').array(outer, dtype='int16') - __import__('numpy').array(inner, dtype='int16')).astype('uint8')), lambda x: x)
    edge = Image.new('RGBA', frame.size, BONE); edge.putalpha(edge_alpha)
    edge.save(frame_dir / f'frame_edge_{side}x{side}.png', optimize=True)
    sticky = Image.new('RGBA', frame.size)
    d = ImageDraw.Draw(sticky); r = pixels * .10
    d.ellipse((pixels/2-r, pixels/2-r, pixels/2+r, pixels/2+r), fill=GOLD, outline=INK, width=max(3, pixels//128))
    d.line((pixels/2-r*.55, pixels/2, pixels/2+r*.55, pixels/2), fill=INK, width=max(3, pixels//96))
    sticky.save(frame_dir / f'frame_sticky_{side}x{side}.png', optimize=True)
Image.open(frame_dir / 'frame_1x1.png').save(ASSETS / 'hotMiamiSymbols/frame.png', optimize=True)

# Store tile and dedicated Tommy Gun effects.
contain(GEN / 'exec-9894654d-a583-4e84-85cb-f3e26b761a7c.png', ASSETS / 'hotMiamiBrand/tile_foreground.png', (1024, 1024), 0)
fx_dir = ASSETS / 'capoFx'; fx_dir.mkdir(parents=True, exist_ok=True)
for source, name, size in (
    ('exec-674080b7-4b60-4d0e-98f8-7e4e30d7d145.png', 'sw_muzzle_flash.png', (512, 512)),
    ('exec-a6e79099-a2d3-4c90-aca2-bbfab5b0de9e.png', 'sw_column_beam.png', (256, 1024)),
    ('exec-4060c7f3-4044-43d6-a9d6-113c23d34ea5.png', 'sw_shell.png', (64, 64)),
    ('exec-cc7e3538-1874-4402-abac-285473d8edd8.png', 'sw_bullet_holes.png', (512, 512)),
): contain(GEN / source, fx_dir / name, size, .01)


def fitted_font(path: Path, text: str, max_width: int, start: int):
    size = start
    while size > 10:
        font = ImageFont.truetype(path, size)
        if font.getbbox(text)[2] <= max_width: return font
        size -= 2
    return ImageFont.truetype(path, size)


cinzel = ROOT / 'design/source/Cinzel.ttf'
saira = ROOT / 'static/fonts/Saira-latin.woff2'

def type_plate(size, lines, destination, density=1):
    out = Image.new('RGBA', size)
    d = ImageDraw.Draw(out)
    y0 = size[1] * .18
    for i in range(density):
        inset = 24 + i * 16
        d.rounded_rectangle((inset, inset, size[0]-inset, size[1]-inset), radius=24, outline=GOLD if i == 0 else BONE, width=5 if i == 0 else 2)
    line_h = size[1] * .24
    for i, text in enumerate(lines):
        font = fitted_font(cinzel, text, int(size[0]*.84), int(size[1]*.24))
        box = d.textbbox((0,0), text, font=font, stroke_width=2)
        x = (size[0] - (box[2]-box[0])) / 2
        y = y0 + i * line_h
        d.text((x+4,y+5), text, font=font, fill=INK, stroke_width=7, stroke_fill=INK)
        d.text((x,y), text, font=font, fill=GOLD, stroke_width=2, stroke_fill=BONE)
    # restrained comic rays / print registration marks
    for x in range(80, size[0]-80, 80): d.line((size[0]/2,size[1]/2,x,24), fill=(201,162,39,90), width=2)
    destination.parent.mkdir(parents=True, exist_ok=True); out.save(destination, optimize=True)

type_plate((1200,520), ['CAPO','NOSTRA'], ASSETS/'hotMiamiBrand/logo.png', 2)
splash = ASSETS/'hotMiamiSplash'
for filename, text, density in (
    ('title_neon_nights.png','SOLDIER',1), ('title_soldier.png','SOLDIER',1),
    ('title_sunset_hits.png','CAPO',2), ('title_capo.png','CAPO',2),
    ('title_ocean_drive.png','THE DON',3), ('title_don.png','THE DON',3),
): type_plate((1024,360), [text], splash/filename, density)

banner = ASSETS/'hotMiamiWinBanners'
for name, text, density in (
    ('big','BIG WIN',1), ('superwin','SUPER WIN',2), ('mega','MEGA WIN',3),
    ('epic','EPIC WIN',4), ('max','MAX WIN',5),
): type_plate((1000,560), [text], banner/f'{name}.png', density)

# Preserve every inherited icon silhouette but flatten it to one antique-gold ink.
for path in (ASSETS/'hotMiamiUiIcons').glob('*.png'):
    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A')
    flat = Image.new('RGBA', image.size, GOLD); flat.putalpha(alpha)
    flat.save(path, optimize=True)

# Retired Miami part sheets still ship because their registry keys are part of
# inherited checks. Neutralise their forbidden alarm-red pixels so the complete
# asset package, not only the visible path, respects the Capo palette contract.
for path in ASSETS.rglob('*.png'):
    if 'capoFx' in path.parts or path.name in {'sw.png', 'tile_foreground.png'}:
        continue
    image = Image.open(path).convert('RGBA')
    data = np.array(image)
    rgb = data[..., :3].astype('int16')
    red = (rgb[...,0] > 130) & (rgb[...,1] < 95) & (rgb[...,2] < 105) & (rgb[...,0] > rgb[...,1] * 1.55)
    data[red, :3] = (92, 33, 38)
    Image.fromarray(data, 'RGBA').save(path, optimize=True)

print('Installed comic symbols, cast, frames, brand, titles, banners, icons and Tommy Gun FX.')
