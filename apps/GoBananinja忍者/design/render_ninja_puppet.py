"""Render Spine-computed pose vertices from _ninja_pose_vertices.json."""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
base = ROOT / 'static/assets/spines/goBananinjaMascot'
atlas = Image.open(base / 'ninja.png').convert('RGBA')
lines = (base / 'ninja.atlas').read_text().splitlines()
names = {'body', 'armL_fore', 'armR_fore', 'katana', 'sheath'}
regions = {}
for i, line in enumerate(lines):
    if line in names:
        regions[line] = tuple(map(int, lines[i + 1].split(':')[1].split(',')))
poses = json.loads((ROOT / 'design/_ninja_pose_vertices.json').read_text())
board = Image.new('RGB', (1200, 1260), (28, 32, 43))
draw = ImageDraw.Draw(board)
for idx, pose in enumerate(poses):
    canvas = Image.new('RGBA', (1024, 1536))
    for slot in pose['slots']:
        x, y, w, h = regions[slot['name']]
        art = np.array(atlas.crop((x, y, x + w, y + h)))
        source = np.float32([[0, h], [0, 0], [w, 0], [w, h]])
        dest = np.float32(np.array(slot['vertices']).reshape(4, 2))
        matrix = cv2.getPerspectiveTransform(source, dest)
        warped = cv2.warpPerspective(art, matrix, (1024, 1536),
                                     flags=cv2.INTER_LINEAR)
        canvas = Image.alpha_composite(canvas, Image.fromarray(warped))
    thumb = canvas.resize((400, 600), Image.Resampling.LANCZOS)
    bg = Image.new('RGBA', (400, 600), (39, 41, 52, 255))
    bg.alpha_composite(thumb)
    px, py = (idx % 3) * 400, (idx // 3) * 630
    board.paste(bg.convert('RGB'), (px, py + 30))
    draw.text((px + 8, py + 8), f"{pose['name']} {pose['t']:.2f}s", fill='white')
board.save(ROOT / 'design/_ninja_puppet_pose_preview.png')
