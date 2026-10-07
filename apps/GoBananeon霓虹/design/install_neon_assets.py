"""Install reviewed neon delivery into Go Bananeon's runtime asset paths."""

from pathlib import Path
import shutil

APP = Path(__file__).parent.parent
SRC = APP / "design" / "source" / "neon_delivery"
SPR = APP / "static" / "assets" / "sprites"

DESTINATIONS = {
    "symbols": SPR / "goBananasSymbolsV3",
    "backgrounds": SPR / "goBananasBackground",
    "frame": SPR / "goBananasFrame",
    "banners": SPR / "goBananasWinBanners",
    "ui": SPR / "goBananasUi",
    "fx": SPR / "goBananasFx",
    "audio": APP / "static" / "assets" / "audio" / "neon",
    "thumbnail": APP / "static" / "assets" / "thumbnail",
}

for group, dest in DESTINATIONS.items():
    dest.mkdir(parents=True, exist_ok=True)
    for source in (SRC / group).iterdir():
        if source.is_file():
            shutil.copy2(source, dest / source.name)

# The runtime uses this historic asset key for the bomb that leaves the DJ's hand.
shutil.copy2(SRC / "symbols" / "bomb_prop.png", DESTINATIONS["symbols"] / "dynamite.png")
print("Installed reviewed neon images and audio into runtime asset paths")
