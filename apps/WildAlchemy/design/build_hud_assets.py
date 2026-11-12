"""Wild Alchemy — HUD / UI / big-win runtime sprites from the keyed delivery.

Source: new-games/wild-alchemy/art/game-ready-1110/keyed/{hud,fx,ui,icons,win}
(manifest.json + layout/{hud,win}.json). Output: static/assets/sprites/
wildAlchemyHud/. Picks follow manifest.ab_recommendations.

Only resizing, padding to square, and three derived plates:
  * spin_plate.png      ui-spin with its cream well repainted deep ink, because
                        the shared spin mark is drawn white (ButtonBetSpinIcon
                        takes no theme colour) and white on cream disappears;
  * button_disc.png     the two round ends of the ochre pill ui-button-a joined
                        into one disc for the round rail controls (the delivery
                        has no round small-button plate);
  * buy_plate_lit.png   the Buy plate at 40% brightness, drawn ADDITIVE over the
                        resting plate on hover — the plate itself brightens
                        (house rule D4), and the lit key is its own file.

Win tiers: BG scaled (and centre-cropped where the layout says so) to 1920x1080
JPG; FG split at x=960 into a left and a right piece, each trimmed, with its
position on the 1920x1080 canvas printed for src/game/assetsHud.ts.

    /Applications/anaconda3/bin/python3 -I design/build_hud_assets.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = Path('/Users/stone/stake-engine/new-games/wild-alchemy/art/game-ready-1110')
KEYED = SRC / 'keyed'
OUT = APP / 'static/assets/sprites/wildAlchemyHud'
OUT.mkdir(parents=True, exist_ok=True)

INK = (59, 42, 26)  # #3b2a1a, ART_REQUEST §0 sepia ink


def load(rel: str) -> Image.Image:
    return Image.open(KEYED / rel).convert('RGBA')


def save(im: Image.Image, name: str) -> None:
    path = OUT / name
    if name.endswith('.jpg'):
        im.convert('RGB').save(path, quality=86, optimize=True, progressive=True)
    else:
        im.save(path, optimize=True)
    print(f'  {name:28s} {im.size[0]}x{im.size[1]}')


def scale_to(im: Image.Image, width: int | None = None, height: int | None = None) -> Image.Image:
    w, h = im.size
    if width is not None:
        s = width / w
    else:
        s = height / h
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def pad_square(im: Image.Image, side: int, ink: float) -> Image.Image:
    """Fit `im` so its longer side is `ink` of a transparent `side` square."""
    w, h = im.size
    s = side * ink / max(w, h)
    im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
    return canvas


def main() -> int:
    print('HUD')
    # flask: body and liquid share one canvas (layout/hud.json); keep the
    # registration by scaling both by the same factor (0.5)
    hud = json.loads((SRC / 'layout/hud.json').read_text())
    body = load('hud/flask_body.png')
    liquid = load('hud/flask_liquid.png')
    s = 0.5
    save(body.resize((round(body.size[0] * s), round(body.size[1] * s)), Image.LANCZOS), 'flask_body.png')
    save(liquid.resize((round(liquid.size[0] * s), round(liquid.size[1] * s)), Image.LANCZOS), 'flask_liquid.png')
    save(scale_to(load('hud/flask_top_flame.png'), width=360), 'flask_flame.png')
    print('  flask registration', json.dumps({k: hud['flask'][k] for k in ('body', 'liquid')}))
    # the five plaques of one state are the same blank drawing (layout note)
    for state in ('unlit', 'lit', 'current'):
        save(scale_to(load(f'hud/ladder_{state}_3.png'), width=420), f'ladder_{state}.png')

    print('FX')
    save(scale_to(load('fx/fx-collect-orb-a.png'), width=96), 'orb.png')
    save(scale_to(load('fx/fx-upgrade-fireball-a.png'), width=300), 'fireball.png')

    print('UI')
    save(scale_to(load('ui/ui-ticker-b.png'), height=182), 'bar_plate.png')
    save(scale_to(load('ui/ui-fs-counter-b.png'), width=724), 'fs_counter.png')
    save(scale_to(load('ui/ui-modal-b.png'), width=1060), 'panel.png')

    buy = load('ui/ui-buy-a.png')
    buy_sq = pad_square(buy, 640, 1.0)
    save(buy_sq, 'buy_plate.png')
    arr = np.array(buy_sq).astype(np.float32)
    arr[..., :3] *= 0.4
    save(Image.fromarray(arr.clip(0, 255).astype(np.uint8)), 'buy_plate_lit.png')

    spin = np.array(load('ui/ui-spin.png')).astype(np.float32)
    h, w = spin.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - (w - 1) / 2, yy - (h - 1) / 2)
    lum = spin[..., 0] * 0.3 + spin[..., 1] * 0.59 + spin[..., 2] * 0.11
    # the cream well: inside r 330 (well edge measured at ~326 of 572) and light
    well = (r < 330) & (lum > 120)
    # soft edge: blend by how light the pixel is, so the inked ring keeps its AA
    t = np.clip((lum - 120) / 100, 0, 1)[well][:, None]
    spin[..., :3][well] = spin[..., :3][well] * (1 - t) + np.array(INK, np.float32) * t
    save(Image.fromarray(spin.clip(0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS), 'spin_plate.png')

    pill = load('ui/ui-button-a.png')
    pw, ph = pill.size
    half = ph // 2
    disc = Image.new('RGBA', (half * 2, ph), (0, 0, 0, 0))
    disc.alpha_composite(pill.crop((0, 0, half, ph)), (0, 0))
    disc.alpha_composite(pill.crop((pw - half, 0, pw, ph)), (half, 0))
    save(pad_square(disc, 256, 0.98), 'button_disc.png')

    print('ICONS')
    icons = {
        'menu': 'ui-icon-menu-b', 'menuExit': 'ui-icon-close-b', 'settings': 'ui-icon-settings-a',
        'info': 'ui-icon-info-b', 'payTable': 'ui-icon-paytable', 'soundOn': 'ui-icon-sound-on-b',
        'soundOff': 'ui-icon-sound-off-b', 'autoSpin': 'ui-icon-autoplay-a', 'increase': 'ui-icon-plus-a',
        'decrease': 'ui-icon-minus-b', 'turbo': 'ui-icon-turbo-a',
    }
    for key, name in icons.items():
        save(pad_square(load(f'icons/{name}.png'), 256, 0.82), f'icon_{key}.png')

    print('WIN')
    layout = json.loads((SRC / 'layout/win.json').read_text())
    picks = {'big': ('b', 'a'), 'super': ('b', 'a'), 'mega': ('b', 'b'), 'epic': ('a', 'a')}
    geometry: dict[str, dict] = {}
    for tier, (bg_pick, fg_pick) in picks.items():
        bg_entry = layout['tiers'][tier]['bg'][bg_pick]
        bg = load(bg_entry['file'].replace('keyed/', ''))
        crop = bg_entry['to_canvas'].get('step1_centre_crop')
        if crop:
            x, y, cw, ch = crop
            bg = bg.crop((x, y, x + cw, y + ch))
        save(bg.resize((1920, 1080), Image.LANCZOS), f'win_{tier}_bg.jpg')

        fg_entry = layout['tiers'][tier]['fg'][fg_pick]
        fg = load(fg_entry['file'].replace('keyed/', ''))
        # drawn in place on the BG's 1672x941 canvas; trimmed with a 4 px margin
        # at `position` (x, y of the art without the margin) on 1920x1080
        sx, sy = fg_entry['scale']
        pos = fg_entry['position']
        fw, fh = fg.size
        full = Image.new('RGBA', (1920, 1080), (0, 0, 0, 0))
        fg_s = fg.resize((round(fw * sx), round(fh * sy)), Image.LANCZOS)
        full.alpha_composite(fg_s, (round(pos['x'] - 4 * sx), round(pos['y'] - 4 * sy)))
        pieces = {}
        for side, box in (('l', (0, 0, 960, 1080)), ('r', (960, 0, 1920, 1080))):
            part = full.crop(box)
            bbox = part.getbbox()
            if not bbox:
                continue
            piece = part.crop(bbox)
            # runtime size: half, drawn at x2 in the 1920 scene
            save(piece.resize((max(1, piece.size[0] // 2), max(1, piece.size[1] // 2)), Image.LANCZOS), f'win_{tier}_fg_{side}.png')
            pieces[side] = {'x': box[0] + bbox[0], 'y': bbox[1], 'w': bbox[2] - bbox[0], 'h': bbox[3] - bbox[1]}
        geometry[tier] = pieces
    save(scale_to(load('win/win-title-plate-a.png'), width=1078), 'win_title_plate.png')
    print('WIN FG GEOMETRY (1920x1080 scene px):')
    print(json.dumps(geometry))
    return 0


if __name__ == '__main__':
    sys.exit(main())
