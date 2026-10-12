"""The music note that floats up from the jukebox in the free game
(FloatingNotes.svelte): white with a black keyline, so the game tints it
red / cyan / pink without losing the ink. 96 px, drawn at 4x and reduced."""
from pathlib import Path
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/dinerMesh/note.png"
K = 4
S = 96 * K


def shape(d: ImageDraw.ImageDraw, grow: int, fill) -> None:
    g = grow * K
    # head: a tilted oval, drawn as a polygon so it can lean
    import math
    cx, cy, rx, ry, a = 34 * K, 70 * K, 17 * K + g, 12 * K + g, math.radians(-25)
    pts = [(cx + rx * math.cos(t) * math.cos(a) - ry * math.sin(t) * math.sin(a),
            cy + rx * math.cos(t) * math.sin(a) + ry * math.sin(t) * math.cos(a))
           for t in [i * 2 * math.pi / 48 for i in range(48)]]
    d.polygon(pts, fill=fill)
    # stem
    d.rectangle([46 * K - g, 14 * K - g, 53 * K + g, 68 * K], fill=fill)
    # flag
    d.polygon([(46 * K - g, 12 * K - g), (56 * K, 12 * K - g), (78 * K + g, 34 * K), (74 * K + g, 52 * K + g),
               (66 * K, 40 * K), (53 * K, 30 * K + g)], fill=fill)


im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
shape(d, 4, (20, 20, 20, 255))
shape(d, 0, (255, 255, 255, 255))
OUT.parent.mkdir(parents=True, exist_ok=True)
im.resize((96, 96), Image.LANCZOS).save(OUT, optimize=True)
print("wrote", OUT)
