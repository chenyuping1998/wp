"""Export Jade Teahouse's existing painted room and transparent cast for cover."""

from pathlib import Path
from PIL import Image, ImageOps

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / "design/source/jade"
OUT = APP / "design/cover"
SIZE = (1920, 1080)


def cutout(name: str, height: int) -> Image.Image:
    image = Image.open(SOURCE / name).convert("RGBA")
    image = image.crop(image.getbbox())
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    background = ImageOps.fit(
        Image.open(SOURCE / "background_base.png").convert("RGB"),
        SIZE,
        Image.Resampling.LANCZOS,
    )
    background.save(OUT / "JadeTeahouse-Cover-BG.png", optimize=True)

    # Keep both figures in their original ink and costume colours. The cover
    # foreground stays genuinely transparent, with room for platform overlays.
    foreground = Image.new("RGBA", SIZE)
    master = cutout("master_full.png", 810)
    apprentice = cutout("apprentice_full.png", 680)
    foreground.alpha_composite(master, (950, 270))
    foreground.alpha_composite(apprentice, (1475, 400))
    foreground.save(OUT / "JadeTeahouse-Cover-FG.png", optimize=True)

    # Individual clean cutouts are useful to the cover designer as separate layers.
    cutout("master_full.png", 1599).save(OUT / "JadeTeahouse-Master-Cutout.png", optimize=True)
    cutout("apprentice_full.png", 1599).save(OUT / "JadeTeahouse-Apprentice-Cutout.png", optimize=True)


if __name__ == "__main__":
    main()
