"""Keep generated style concepts review-only until the art brief approval gate is met."""
from pathlib import Path
import argparse
import json
import shutil
from PIL import Image, ImageOps, ImageDraw, ImageFont

APP = Path(__file__).resolve().parents[1]
SLUG = "parrot"
NAME = "Parrot Radio"
ROOT = APP / "design/source" / SLUG
parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
ROOT.mkdir(parents=True, exist_ok=True)
concept = ROOT / "concept"
concept.mkdir(exist_ok=True)
original = concept / "style_test_v1_original.png"
if original.exists():
    raise SystemExit(f"Refusing to overwrite original: {original}")
shutil.copy2(args.source, original)
with Image.open(original) as im:
    source_size = list(im.size)
    canvas = ImageOps.fit(im.convert("RGB"), (1920, 1080), method=Image.Resampling.LANCZOS)
    canvas.save(ROOT / "style_test_v1.png")
sheets = ROOT / "_sheets"
sheets.mkdir(exist_ok=True)
sheet = Image.new("RGB", (1920, 1190), "#141826")
sheet.paste(canvas, (0, 80))
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 25)
draw.text((32, 22), f"{NAME} / STYLE REVIEW v1 / APPROVAL PENDING", fill="#F2C14E", font=font)
sheet.save(sheets / "style_test_v1_contact.jpg", quality=94)
record = {
    "game": NAME,
    "tool": "built-in image_gen",
    "original": "concept/style_test_v1_original.png",
    "originalSize": source_size,
    "reviewSize": [1920, 1080],
    "approval": "pending_user_review",
    "productionInstalled": False,
    "processing": "Canvas normalization only. Full generated original retained.",
    "approvalSource": "PARROT_美術需求單.md section 1",
    "uncertainty": "Squawk 的紅羽飽和度與大耳機比例是否合適；量產時旋鈕的 20 格 LED 會依程式座標精確定位。",
}
(ROOT / "style_test_v1.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(record, ensure_ascii=False))
