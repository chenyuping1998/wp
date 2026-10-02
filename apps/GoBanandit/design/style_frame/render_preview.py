"""Compose the six style tests at the game's 5×4 board proportions."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT.parents[1] / "static/assets/sprites/goBananasFrame"
PAPER = "#F2E8D0"
GREEN = "#1F5C4A"
BLACK = "#1E1B1A"


def image(name, size):
    im = Image.open(ROOT / f"{name}.png").convert("RGBA")
    im.thumbnail(size, Image.Resampling.LANCZOS)
    return im


def main():
    # Existing board proportions: 1280px housing around a centered 1000px grid.
    scene = Image.new("RGBA", (1600, 1100), PAPER)
    bg = Image.open(ROOT / "bg_base_crop.png").convert("RGBA").resize((1600, 1100))
    scene.alpha_composite(bg)
    board = Image.new("RGBA", (1280, 1280))
    d = ImageDraw.Draw(board)
    d.rounded_rectangle((116, 116, 1164, 1164), radius=32, fill=GREEN)
    sample = ["H1", "low_label", "P", "W", "low_label", "low_label", "W", "H1", "low_label", "P", "P", "low_label", "H1", "W", "low_label", "W", "P", "low_label", "H1", "low_label"]
    font_path = ROOT.parents[1] / "static/fonts/TitanOne.ttf"
    font = ImageFont.truetype(str(font_path), 112)
    letters = iter("AKQJTAKQJ")
    for row in range(4):
        for col in range(5):
            x, y = 140 + col * 200, 140 + row * 250
            d.rounded_rectangle((x, y, x + 194, y + 244), radius=15, fill=PAPER)
            name = sample[row * 5 + col]
            art = image(name, (184, 184))
            board.alpha_composite(art, (x + (194 - art.width) // 2, y + 25))
            if name == "low_label":
                ch = next(letters)
                box = d.textbbox((0, 0), ch, font=font)
                d.text((x + (194 - (box[2] - box[0])) / 2, y + 62), ch, font=font, fill=BLACK)
    # This is a layout preview, so the housing is drawn as a flat placeholder.
    scene.alpha_composite(board.resize((900, 900), Image.Resampling.LANCZOS), (350, 105))
    scene.convert("RGB").save(ROOT / "board_preview.png")
    scene.resize((200, 138), Image.Resampling.LANCZOS).convert("RGB").save(ROOT / "board_preview_200.png")


if __name__ == "__main__":
    main()
