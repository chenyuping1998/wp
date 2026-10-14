#!/usr/bin/env python3
"""Assemble the crossed-arms prisoner (2026-09-27) into rig-ready layers.

    python3 design/build_crossed_arms_layers.py

Input: design/_incoming/crossed_arms/ (Codex ImageGen, 887x1774). Output:
design/cast_parts/crossed_arms/{head,body,full}.png + layers.json on the
1024x2048 canvas, feet at y=1773 like the A-pose prisoner, so the new figure
stands exactly where the old one did.

Why only TWO layers, and why they are cut from full.png:

  * The delivered head/arm/towel parts came back at their own scale and
    position, and the two ARM parts are a different drawing from full.png
    (open flat hand, different forearm angles) — they matched it at NCC <0.5.
  * With arms folded they cannot move independently anyway; the #5
    archetype's reaction is a torso/head shake. So the arms stay IN the body
    layer, weighted to the chest.
  * The towel was briefed as a dangle, but in the drawing it runs BEHIND the
    upper arm (on the shoulder, behind the arm, out again below the elbow):
    there is no continuous free-hanging strip to cut. Two attempts to cut it
    left a black fill and caught the (equally off-white) chest number patch.
    It stays in the body layer and moves with the torso.
  * Every visible pixel comes from full.png, so the assembled figure IS the
    approved drawing. Generated art is used only where nothing is visible: the
    neck below the collar, from the delivered head registered onto full.png at
    NCC 0.944 (match_template on face + hair).

Layer order is back to front: head BEHIND the body, so the collar covers the
neck extension and the join never opens when the head turns.
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(APP, 'design/_incoming/crossed_arms')
OUT = os.path.join(APP, 'design/cast_parts/crossed_arms')

HEAD_SCALE, HEAD_XY = 0.396, (384, 114)  # delivered head -> full.png px
# Below this row (full.png px) the neck belongs to the body: the collar and the
# open V of the undershirt ride the chest, and the head's own neck hides behind.
COLLAR_Y = 318

# Target placement: the A-pose prisoner's top/feet (y 172 / 1773) and centre.
TARGET_TOP, TARGET_FEET, TARGET_CX = 172, 1773, 541
CANVAS = (1024, 2048)


def rgba(path):
	return np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)


def main():
	os.makedirs(OUT, exist_ok=True)
	for stale in ('dangle_towel.png',):
		if os.path.exists(os.path.join(OUT, stale)):
			os.remove(os.path.join(OUT, stale))
	full = rgba(os.path.join(SRC, 'full.png'))
	H, W = full.shape[:2]
	fa = full[..., 3]
	ys = np.arange(H)[:, None] * np.ones((1, W))

	hp = Image.open(os.path.join(SRC, 'head.png')).convert('RGBA')
	hp = hp.crop(hp.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
	hp = hp.resize((int(hp.width * HEAD_SCALE), int(hp.height * HEAD_SCALE)), Image.LANCZOS)
	reg = Image.new('RGBA', (W, H))
	reg.alpha_composite(hp, HEAD_XY)
	reg = np.asarray(reg).astype(np.float32)

	head_vis = (reg[..., 3] > 128) & (ys < COLLAR_Y)
	# grow into the hair's antialiased fringe so no halo stays on the body
	head_vis = ndimage.binary_dilation(head_vis, iterations=3) & (fa > 0) & (ys < COLLAR_Y)
	head = np.zeros_like(full)
	head[head_vis] = full[head_vis]
	below = (reg[..., 3] > 0) & (ys >= COLLAR_Y)
	head[below] = reg[below]  # hidden neck extension, behind the collar

	body = full.copy()
	body[head_vis] = 0

	ys_ink, xs_ink = np.where(fa > 16)
	top, feet = ys_ink.min(), ys_ink.max()
	cx = (xs_ink.min() + xs_ink.max()) / 2
	k = (TARGET_FEET - TARGET_TOP) / (feet - top)
	ox, oy = TARGET_CX - cx * k, TARGET_FEET - feet * k

	def place(arr):
		im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
		im = im.resize((round(W * k), round(H * k)), Image.LANCZOS)
		canvas = Image.new('RGBA', CANVAS)
		canvas.paste(im, (round(ox), round(oy)))
		return canvas

	layers = {'head': place(head), 'body': place(body)}
	for name, im in layers.items():
		im.save(os.path.join(OUT, f'{name}.png'), optimize=True)
	comp = Image.new('RGBA', CANVAS)
	for name in ('head', 'body'):
		comp.alpha_composite(layers[name])
	comp.save(os.path.join(OUT, 'full.png'), optimize=True)

	J = {  # measured on full.png (px), carried through the same transform
		'head_top': (462, top), 'neck': (462, 330), 'chest': (462, 450),
		'waist': (462, 700), 'hips': (462, 860),
		'shoulder_r': (265, 380), 'elbow_r': (215, 620), 'wrist_r': (560, 510),
		'shoulder_l': (660, 385), 'elbow_l': (680, 620), 'wrist_l': (410, 560),
	}
	T = lambda p: [round(p[0] * k + ox), round(p[1] * k + oy)]
	spec = {
		'version': 1, 'archetype': 'miami_green_guy', 'size': list(CANVAS),
		'feet_y': TARGET_FEET, 'top_y': TARGET_TOP, 'sides': 'anatomical', 'mirrored': False,
		'order': ['head', 'body'],
		'joints': {n: T(p) for n, p in J.items()},
		'anchors': {},
		'arms': {'r': 'crossed', 'l': 'crossed'},
		'note': 'arms and towel are part of the body layer; see build_crossed_arms_layers.py',
	}
	json.dump(spec, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)
	print('scale', round(k, 4), 'offset', round(ox, 1), round(oy, 1))


if __name__ == '__main__':
	main()
