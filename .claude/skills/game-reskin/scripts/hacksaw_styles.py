#!/usr/bin/env python3
"""Look up Hacksaw Gaming's slots by art style, and build contact sheets of them.

The data is references/hacksaw-slots.json: every slot listed on
hacksawgaming.com/games/slots (183 on 2026-09-27), each tagged with an atlas
family, the art-direction catalogue key it maps to, a theme and a series. The
atlas itself (what each family is, how Hacksaw executes it on the reels, what
it costs in this engine) is references/hacksaw-style-atlas.md.

Images are NOT stored in the repo. `sheet` downloads the ones it needs into a
cache folder and composes a labelled contact sheet, so you can look at a style
before shortlisting it, and show the user what a candidate style looks like
when asking the 畫風 question. These images are for looking at only: never
attach them to a generation prompt, never trace them, never ship them.

usage:
  hacksaw_styles.py summary
  hacksaw_styles.py list  [--family F] [--key K] [--theme T] [--series S]
  hacksaw_styles.py sheet [--family F] [--key K] [--theme T] [--series S] [--ids 1,2]
                          [--kind thumb|screen|bg] [--cols N] [--limit N] --out OUT.jpg
  hacksaw_styles.py refresh [--write]    # re-scrape the site, report new/removed titles

--kind thumb is the 367 px lobby key art (all titles), screen is the in-game
desktop screenshot (69 titles), bg is the base-game background (59 titles).
The screen kind is the one to study for symbol treatment: key art and in-game
art are not always the same style.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "references" / "hacksaw-slots.json"
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "hacksaw-styles"
SITE = "https://www.hacksawgaming.com"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"


def load() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def pick(games: list[dict], a: argparse.Namespace) -> list[dict]:
    ids = {int(x) for x in a.ids.split(",")} if getattr(a, "ids", None) else None
    out = []
    for g in games:
        if a.family and g["family"] != a.family:
            continue
        if a.key and g["style_key"] != a.key:
            continue
        if a.theme and a.theme not in g["theme"]:
            continue
        if a.series and a.series.lower() not in g["series"].lower():
            continue
        if ids is not None and g["id"] not in ids:
            continue
        out.append(g)
    return out


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def cached(url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / url.rsplit("/", 1)[-1]
    if not path.exists() or path.stat().st_size == 0:
        path.write_bytes(fetch(url))
    return path


def screen_crop(im):
    """The device mockups are a laptop on transparency: keep the screen only."""
    im = im.convert("RGBA")
    im = im.crop(im.getbbox())
    w, h = im.size
    return im.crop((int(w * 0.09), int(h * 0.05), int(w * 0.91), int(h * 0.88)))


def cmd_sheet(a: argparse.Namespace) -> int:
    from PIL import Image, ImageDraw, ImageFont

    games = [g for g in pick(load()["games"], a) if g[a.kind]]
    if a.limit:
        games = games[: a.limit]
    if not games:
        print("nothing matches (or no images of that kind for the match)")
        return 1
    cell = (360, 360) if a.kind == "thumb" else (560, 330)
    cols = a.cols or (5 if a.kind == "thumb" else 3)
    rows = (len(games) + cols - 1) // cols
    label = 24
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except OSError:
        font = ImageFont.load_default()
    sheet = Image.new("RGB", (cols * cell[0], rows * (cell[1] + label)), "white")
    draw = ImageDraw.Draw(sheet)
    for n, g in enumerate(games):
        try:
            im = Image.open(cached(g[a.kind]))
        except Exception as e:  # a title the CDN no longer serves
            print(f"skip {g['name']}: {e}", file=sys.stderr)
            continue
        if a.kind == "screen":
            im = screen_crop(im)
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        bg.alpha_composite(rgba)
        tile = bg.convert("RGB")
        tile.thumbnail(cell, Image.Resampling.LANCZOS)
        x, y = (n % cols) * cell[0], (n // cols) * (cell[1] + label)
        sheet.paste(tile, (x + (cell[0] - tile.width) // 2, y + label))
        draw.text((x + 4, y + 4), f"{g['name']} · {g['family']}"[:48], fill="black", font=font)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out, quality=88)
    print(f"{a.out}  ({len(games)} titles, {a.kind})")
    return 0


def cmd_list(a: argparse.Namespace) -> int:
    for g in pick(load()["games"], a):
        kinds = "".join(k[0] for k in ("thumb", "screen", "bg") if g[k])
        print(f"{g['id']:>5}  {g['family']:<14} {g['style_key']:<11} {g['theme']:<17} "
              f"{kinds:<3} v{g['volatility']}  {g['name']}" + (f"  — {g['note']}" if g["note"] else ""))
    return 0


def cmd_summary(a: argparse.Namespace) -> int:
    d = load()
    games = d["games"]
    print(f"{d['count']} slots surveyed {d['surveyed']} from {d['source']}\n")
    fam = Counter(g["family"] for g in games)
    for f, n in fam.most_common():
        vol = sum(g["volatility"] for g in games if g["family"] == f) / n
        key = d["families"][f]
        print(f"{n:>4} {n / len(games):6.1%}  {f:<14} -> {key:<11} mean volatility {vol:.1f}/5")
    print("\nby theme:")
    for t, n in Counter(g["theme"] for g in games).most_common():
        fams = Counter(g["family"] for g in games if g["theme"] == t)
        print(f"{n:>4}  {t:<17} " + ", ".join(f"{f} {c}" for f, c in fams.most_common()))
    return 0


def scrape() -> list[dict]:
    page = fetch(SITE + "/games/slots").decode("utf-8", "replace")
    found, seen = [], set()
    for m in re.finditer(r'<li class="GridListItem[^"]*" data-gameid="(\d+)" aria-label="([^"]+?)\s*\|[^"]*">(.*?)</li>',
                         page, re.S):
        gid, name, body = int(m.group(1)), html.unescape(m.group(2).strip()), m.group(3)
        if gid in seen:
            continue
        seen.add(gid)
        thumb = re.search(r'data-bg-image="([^"]+)"', body)
        link = re.search(r'href="(/games/[^"]+)"', body)
        found.append(dict(id=gid, name=name, thumb=thumb.group(1) if thumb else "",
                          page=SITE + link.group(1) if link else "",
                          volatility=len(re.findall(r"h_white", body))))
    return found


def cmd_refresh(a: argparse.Namespace) -> int:
    d = load()
    known = {g["id"]: g for g in d["games"]}
    live = scrape()
    new = [g for g in live if g["id"] not in known]
    gone = [g for g in d["games"] if g["id"] not in {x["id"] for x in live}]
    print(f"site lists {len(live)} slots; {len(new)} new, {len(gone)} no longer listed")
    for g in new:
        print(f"  NEW  {g['id']:>5}  {g['name']}  {g['thumb']}")
    for g in gone:
        print(f"  GONE {g['id']:>5}  {g['name']}")
    if a.write and new:
        for g in new:
            d["games"].insert(0, dict(id=g["id"], name=g["name"], family="untagged", style_key="",
                                      theme="", series="", volatility=g["volatility"], note="",
                                      page=g["page"], thumb=g["thumb"], screen="", bg=""))
        d["count"] = len(d["games"])
        DATA.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"added {len(new)} as family 'untagged': look at them (sheet --ids ...) and tag them by hand")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("summary")
    for name in ("list", "sheet"):
        p = sub.add_parser(name)
        p.add_argument("--family")
        p.add_argument("--key", help="art-direction catalogue key, e.g. noir, rubberhose, cartoon")
        p.add_argument("--theme", help="substring of the theme tag, e.g. horror, western, greek")
        p.add_argument("--series")
        p.add_argument("--ids", help="comma-separated game ids")
        if name == "sheet":
            p.add_argument("--kind", choices=("thumb", "screen", "bg"), default="thumb")
            p.add_argument("--cols", type=int)
            p.add_argument("--limit", type=int)
            p.add_argument("--out", type=Path, required=True)
    r = sub.add_parser("refresh")
    r.add_argument("--write", action="store_true", help="append new titles to the JSON as 'untagged'")
    a = ap.parse_args()
    return {"summary": cmd_summary, "list": cmd_list, "sheet": cmd_sheet, "refresh": cmd_refresh}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
