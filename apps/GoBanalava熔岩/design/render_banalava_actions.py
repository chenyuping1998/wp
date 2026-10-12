"""Contact sheet from Spine runtime mesh samples, for visual mascot QA."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'design/source/banalava_action_mesh.json').read_text())
SOURCE = np.asarray(Image.open(ROOT / 'static/assets/spines/goBananasMonkey/lava_body.png').convert('RGBA'))
H, W = SOURCE.shape[:2]
uv = np.array(DATA['uv'], dtype=np.float32).reshape(-1, 2)
src_points = (uv * [W, H]).astype(np.float32)
triangles = np.array(DATA['triangles'], dtype=np.int32).reshape(-1, 3)


def render(sample: dict) -> Image.Image:
    xy = np.array(sample['xy'], dtype=np.float32).reshape(-1, 2)
    dst_points = np.column_stack((xy[:, 0] + W / 2, H - xy[:, 1])).astype(np.float32)
    canvas = np.zeros((H, W, 4), dtype=np.uint8)
    for ids in triangles:
        src = src_points[ids]
        dst = dst_points[ids]
        if abs(cv2.contourArea(src)) < 0.1 or abs(cv2.contourArea(dst)) < 0.1:
            continue
        x, y, w, h = cv2.boundingRect(dst)
        left, top = max(0, x), max(0, y)
        right, bottom = min(W, x + w), min(H, y + h)
        if right <= left or bottom <= top:
            continue
        matrix = cv2.getAffineTransform(src, dst)
        matrix[0, 2] -= left
        matrix[1, 2] -= top
        warped = cv2.warpAffine(SOURCE, matrix, (right - left, bottom - top), flags=cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_CONSTANT)
        mask = np.zeros((bottom - top, right - left), dtype=np.uint8)
        polygon = np.rint(dst - [left, top]).astype(np.int32)
        cv2.fillConvexPoly(mask, polygon, 255)
        alpha = (warped[:, :, 3].astype(np.float32) / 255) * (mask.astype(np.float32) / 255)
        area = canvas[top:bottom, left:right]
        area[:, :, :3] = np.rint(warped[:, :, :3] * alpha[:, :, None] +
                                  area[:, :, :3] * (1 - alpha[:, :, None])).astype(np.uint8)
        area[:, :, 3] = np.clip(warped[:, :, 3] * (mask / 255) + area[:, :, 3] * (1 - alpha), 0, 255).astype(np.uint8)
    return Image.fromarray(canvas, 'RGBA')


samples = DATA['samples']
cell_w, cell_h = 360, 575
sheet = Image.new('RGB', (cell_w * 3, cell_h * 9), '#1a181a')
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)
for i, sample in enumerate(samples):
    row, col = divmod(i, 3)
    image = render(sample)
    image.thumbnail((cell_w - 16, cell_h - 38), Image.Resampling.LANCZOS)
    x = col * cell_w + (cell_w - image.width) // 2
    y = row * cell_h + 30
    sheet.paste(image, (x, y), image)
    draw.text((col * cell_w + 12, row * cell_h + 6),
              f"{sample['animation']}  {sample['fraction']:.1f}", font=font, fill='#ffca8a')
out = ROOT / 'design/banalava_actions_contact.png'
sheet.save(out)
print(out)
