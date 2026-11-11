#!/usr/bin/env python3
"""Install the v2 symbol set (design/SYMBOL_REDO_BRIEF.md) from design/_incoming/.

    python3 design/install_symbols_v2.py            # writes static/assets/deadwood/symbol_*.png
    python3 design/install_symbols_v2.py --preview  # writes only design/_review/symbols_v2/

The deliveries are 1024² on flat magenta #FF00FF. Nothing here redraws art; it
keys, places, and sets the words the image model was told not to draw:

  * Key by colour difference, not flood fill. H2's veil is translucent lilac over
    the magenta, so its pixels are a MIX of the two; `spill = min(R, B) - G` is
    255 on pure key and near 0 on the art, and unmixing by that alpha keeps the
    veil see-through instead of cutting it out or leaving it pink.
  * WILD, SCATTER and A/K/Q/J are set in Cinzel (the game's own display face,
    static/fonts/Cinzel.ttf) onto blank plates. Generated lettering was one of the
    tells called out after the second rejection.
  * The four royals share one blank enamel plate; only the enamel colour and the
    letter change, so the set is consistent by construction.

v1 stays restorable: design/restore_symbols_v1.sh.
"""
from __future__ import annotations

import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, 'design/_incoming')
OUT = os.path.join(ROOT, 'static/assets/deadwood')
REVIEW = os.path.join(ROOT, 'design/_review/symbols_v2')
FONT = os.path.join(ROOT, 'static/fonts/Cinzel.ttf')
CANVAS = 1254  # the v1 set's size; the runtime scales by cell, not by pixels

# Longest side of the ink as a share of the canvas. v1 ran 0.90-0.98 tall.
# L 0.78, not 0.86: on the board the solid-colour plates out-weighed the
# premiums, which are dark objects with one accent (checked 2026-09-26).
FILL = {'H': 0.94, 'W': 0.96, 'S': 0.96, 'L': 0.78}

# The user rejected the enamel-shield royals on sight (2026-09-26: the v1 cream
# stone letters read better), so v2 ships v1's A/K/Q/J unchanged. build_royal
# stays for a future attempt.
KEEP_V1_ROYALS = True

# Enamel runs darker than the premiums' accent colours: the royals are the most
# common symbols on the grid and must not out-shout the high pays.
ROYALS = {  # file, letter, enamel
	'L1': ('A', (98, 42, 38)),    # crimson
	'L2': ('K', (40, 60, 98)),    # cobalt
	'L3': ('Q', (74, 50, 90)),    # plum
	'L4': ('J', (42, 76, 52)),    # forest
}


def load(name: str) -> np.ndarray:
	return np.asarray(Image.open(os.path.join(INCOMING, f'{name}.png')).convert('RGB')).astype(np.float32)


def key_magenta(rgb: np.ndarray, hue_despill: bool = False) -> Image.Image:
	r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
	spill = np.minimum(r, b) - g
	# 40: the lilac veil's own pigment sits around 40-80 spill, so only what is
	# ABOVE the art's own purple counts as key. 235: generated key is not exact.
	lo, hi = 40.0, 235.0
	alpha = 1.0 - np.clip((spill - lo) / (hi - lo), 0.0, 1.0)
	# unmix: P = a*C + (1-a)*K  ->  C = (P - (1-a)*K) / a
	key = np.array([255.0, 0.0, 255.0])
	a = alpha[..., None]
	safe = np.maximum(a, 1e-3)
	col = (rgb - (1.0 - a) * key) / safe
	col = np.clip(col, 0, 255)
	# edge despill: a partly transparent pixel may not stay more magenta than
	# its opaque neighbours — pull G up to the smaller of R and B there only.
	edge = (alpha < 0.98) & (alpha > 0)
	mn = np.minimum(col[..., 0], col[..., 2])
	col[..., 1] = np.where(edge & (col[..., 1] < mn - 30), mn - 30, col[..., 1])
	if hue_despill:
		# Dark lace fringed against the key keeps a magenta cast even when opaque
		# (the passenger's cuffs and hem). Key magenta has R ~= B; the art's own
		# lilac is clearly bluer (R/B ~0.79), so only R >= 0.88 B counts as spill,
		# and it is pulled most of the way back to neutral.
		r2, g2, b2 = col[..., 0], col[..., 1], col[..., 2]
		spill2 = np.minimum(r2, b2) - g2
		cast = (spill2 > 18) & (r2 >= 0.88 * b2)
		for c in (0, 2):
			col[..., c] = np.where(cast, g2 + 0.2 * (col[..., c] - g2), col[..., c])
	alpha = np.where(alpha < 0.03, 0.0, alpha)
	out = np.dstack([col, alpha * 255]).astype(np.uint8)
	return Image.fromarray(out)


def place(im: Image.Image, fill: float) -> Image.Image:
	box = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
	im = im.crop(box)
	scale = fill * CANVAS / max(im.size)
	im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
	canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
	canvas.alpha_composite(im, ((CANVAS - im.width) // 2, (CANVAS - im.height) // 2))
	return canvas


def font(size: int, weight: str = 'Black') -> ImageFont.FreeTypeFont:
	f = ImageFont.truetype(FONT, size)
	f.set_variation_by_name(weight)
	return f


def engraved(draw_on: Image.Image, text: str, center: tuple[float, float], size: int,
             fill: tuple[int, int, int], shadow=(20, 16, 12), highlight=(255, 240, 210),
             angle: float = 0.0, tracking: float = 0.0) -> None:
	"""Letters pressed into the plate: dark lower-right cut, light upper-left lip."""
	f = font(size)
	# render on a padded layer so rotation never clips
	w = int(f.getlength(text) + tracking * (len(text) - 1) + size)
	layer = Image.new('RGBA', (w, size * 2), (0, 0, 0, 0))

	def put(dx: float, dy: float, colour, a: int) -> Image.Image:
		lyr = Image.new('RGBA', layer.size, (0, 0, 0, 0))
		d = ImageDraw.Draw(lyr)
		x = size / 2 + dx
		for ch in text:
			d.text((x, size / 2 + dy), ch, font=f, fill=(*colour, a))
			x += f.getlength(ch) + tracking
		return lyr

	# a thin lip and a tight cut; the first pass (150 alpha, blurred) read as a
	# glow around the royals rather than an edge
	off = max(2, size // 40)
	layer.alpha_composite(put(-off, -off, highlight, 70))
	layer.alpha_composite(put(off, off, shadow, 235).filter(ImageFilter.GaussianBlur(off * 0.3)))
	layer.alpha_composite(put(0, 0, fill, 255))
	bbox = layer.getbbox()
	layer = layer.crop(bbox)
	if angle:
		layer = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
	draw_on.alpha_composite(layer, (round(center[0] - layer.width / 2), round(center[1] - layer.height / 2)))


def build_wild() -> Image.Image:
	im = place(key_magenta(load('W_plate')), FILL['W'])
	# the blank bronze nameplate: warm, brighter than the teal-iron engine, in the
	# lower half. Measured rather than hard-coded so a regenerated plate still fits.
	h = CANVAS
	a = np.asarray(im).astype(np.float32)
	r, g, b = a[..., 0], a[..., 1], a[..., 2]
	warm = (r > g + 12) & (g > b + 4) & (r > 110) & (a[..., 3] > 200)
	warm[: int(h * 0.45)] = False
	rows = warm.sum(axis=1)
	band = np.where(rows > rows.max() * 0.5)[0]
	y0, y1 = band.min(), band.max()
	cols = warm[y0:y1 + 1].sum(axis=0)
	xs = np.where(cols > (y1 - y0) * 0.5)[0]
	x0, x1 = xs.min(), xs.max()
	size = int((y1 - y0) * 0.78)
	engraved(im, 'WILD', ((x0 + x1) / 2, (y0 + y1) / 2 + size * 0.02), size,
	         fill=(58, 34, 18), tracking=size * 0.12)
	return im


def build_scatter() -> Image.Image:
	im = place(key_magenta(load('S_plate')), FILL['S'])
	a = np.asarray(im)
	ys, xs = np.where(a[..., 3] > 200)
	cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
	# the ticket leans up to the right; read the lean off its bottom edge
	cols = np.arange(xs.min() + 40, xs.max() - 40, 8)
	bottoms = np.array([np.where(a[:, c, 3] > 200)[0].max() for c in cols])
	slope = np.polyfit(cols, bottoms, 1)[0]
	angle = float(np.degrees(np.arctan(-slope)))
	engraved(im, 'SCATTER', (cx, cy), int(CANVAS * 0.105), fill=(24, 104, 104),
	         shadow=(10, 40, 40), highlight=(255, 250, 235), angle=angle, tracking=CANVAS * 0.006)
	return im, angle


def build_royal(plate: Image.Image, letter: str, enamel: tuple[int, int, int]) -> Image.Image:
	a = np.asarray(plate).astype(np.float32)
	rgb, alpha = a[..., :3], a[..., 3]
	lum = rgb @ np.array([0.299, 0.587, 0.114])
	sat = rgb.max(axis=2) - rgb.min(axis=2)
	# the enamel face: neutral (low chroma) and mid-to-light; the iron rim and
	# rivets are darker, the chips expose darker metal and stay untinted.
	face = (sat < 28) & (lum > 95) & (alpha > 200)
	face_img = Image.fromarray((face * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
	m = np.asarray(face_img).astype(np.float32)[..., None] / 255.0
	ref = np.median(lum[face]) if face.any() else 160.0
	shade = (lum / ref)[..., None]
	tinted = np.clip(np.array(enamel, dtype=np.float32) * shade * 1.05, 0, 255)
	out = rgb * (1 - m) + tinted * m
	im = Image.fromarray(np.dstack([out, alpha]).astype(np.uint8))
	ys, xs = np.where(face)
	cx = (xs.min() + xs.max()) / 2
	# the shield narrows to a point: optical centre sits above the box centre
	cy = ys.min() + (ys.max() - ys.min()) * 0.45
	# 0.52 of the face height: at 0.66 the Q's tail left the plate
	size = int((ys.max() - ys.min()) * 0.52)
	engraved(im, letter, (cx, cy), size, fill=(238, 226, 196), shadow=(12, 10, 8),
	         highlight=(255, 255, 255))
	return im


def main() -> None:
	preview = '--preview' in sys.argv
	os.makedirs(REVIEW, exist_ok=True)
	built: dict[str, Image.Image] = {}
	for n in ('H1', 'H2', 'H3', 'H4', 'H5'):
		built[n] = place(key_magenta(load(n)), FILL['H'])
	built['W'] = build_wild()
	built['S'], lean = build_scatter()
	if KEEP_V1_ROYALS:
		for n in ROYALS:
			built[n] = None  # copied verbatim below
	else:
		plate = place(key_magenta(load('L_plate')), FILL['L'])
		for n, (letter, enamel) in ROYALS.items():
			built[n] = build_royal(plate, letter, enamel)
	for n, im in built.items():
		if KEEP_V1_ROYALS and n in ROYALS:
			# byte-for-byte, so restore_symbols_v1.sh and this agree on the file
			src = os.path.join(ROOT, f'design/_backup_symbols_v1/symbol_{n}.png')
			shutil.copyfile(src, os.path.join(REVIEW, f'symbol_{n}.png'))
			if not preview:
				shutil.copyfile(src, os.path.join(OUT, f'symbol_{n}.png'))
			continue
		im.save(os.path.join(REVIEW, f'symbol_{n}.png'), optimize=True)
		if not preview:
			im.save(os.path.join(OUT, f'symbol_{n}.png'), optimize=True)
	print(f'built {len(built)} symbols (scatter lean {lean:.1f}°) ->', REVIEW if preview else OUT)


if __name__ == '__main__':
	main()
