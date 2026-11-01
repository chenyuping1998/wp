"""Export the approved ImageGen redraws; retain raw sources and existing rig canvas.

Run after integrate_ink_pass.py and before build_store_v2.py. This only crops
transparent margins and resizes exports; it does not recolour or stylize art.
"""
from pathlib import Path
import hashlib
import json
import re
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / 'design/source-v3'
SP = APP / 'static/assets/sprites'


def integrate():
    manifest = json.loads((SOURCE / 'generation.json').read_text())
    for item in manifest['assets']:
        im = Image.open(SOURCE / item['source']).convert('RGBA')
        assert im.getchannel('A').getextrema() == (0, 255), item
        box = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        assert box, item
        if item['key'] == 'fg':
            # Same normalized texture canvas as the existing continuous mesh.
            # Keep the full image: cropping would shift head and foot anchors.
            out = im.resize((629, 1122), Image.Resampling.LANCZOS)
            target = SP / 'staticShiftCastInk/fg.png'
        else:
            tile = im.crop(box)
            scale = 480 / max(tile.size)
            tile = tile.resize(tuple(round(v * scale) for v in tile.size), Image.Resampling.LANCZOS)
            out = Image.new('RGBA', (512, 512))
            out.alpha_composite(tile, ((512 - tile.width) // 2, (512 - tile.height) // 2))
            target = SP / f"staticShiftSymbolsInk/{item['key']}.png"
        out.save(target)
        print(item['key'], out.size, hashlib.sha256(target.read_bytes()).hexdigest()[:10])

    registry = APP / 'src/game/assets.ts'
    def revision(match):
        rel = match.group(1)
        digest = hashlib.sha256((APP / 'static' / rel).read_bytes()).hexdigest()[:10]
        return "new URL('../../" + rel + "', import.meta.url).href + '?v=" + digest + "'"
    registry.write_text(re.sub(
        r"new URL\('../../(assets/sprites/staticShift(?:Symbols|Cast|Background)Ink/[^']+)'\, import.meta.url\)\.href(?: \+ '\?v=[a-f0-9]+')?",
        revision, registry.read_text()))


if __name__ == '__main__':
    integrate()
