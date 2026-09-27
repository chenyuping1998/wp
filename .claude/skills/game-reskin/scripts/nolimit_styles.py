#!/usr/bin/env python3
"""Look up Nolimit City's slots by art style, and build contact sheets of them.

The data is references/nolimit-slots.json: every slot in
nolimitcity.com/sitemap-0.xml (143 on 2026-09-27, released 2016-2026), each
tagged with a survey family, the art-direction catalogue key it maps to, a
theme, the site's own volatility number and max win. The survey itself (what
each family is, how Nolimit builds a board in it, what transfers to our
reskins) is references/nolimit-city-styles.md.

Images are NOT stored in the repo. `sheet` downloads the ones it needs into a
cache folder and composes a labelled contact sheet, so you can look at a style
before shortlisting it, and show the user what a candidate style looks like
when asking the 畫風 question. These images are for looking at only: never
attach them to a generation prompt, never trace them, never ship them.

usage:
  nolimit_styles.py summary
  nolimit_styles.py list  [--family F] [--key K] [--theme T] [--name N] [--since YEAR]
  nolimit_styles.py sheet [--family F] [--key K] [--theme T] [--name N] [--since YEAR] [--ids 1,2]
                          [--kind thumb|screen] [--cols N] [--limit N] --out OUT.jpg
  nolimit_styles.py refresh [--write]    # re-read the sitemap, report new/removed titles

--kind thumb is the 1200x630 key art (all titles; fetched at the CDN's
750 px "medium_" size), screen is a base-game reel area or screenshot (36
titles). Study screen for symbol treatment: the key art sells characters, the
board shows how highs, lows and specials are separated.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "references" / "nolimit-slots.json"
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "nolimit-styles"
SITE = "https://nolimitcity.com"
CDN = "https://fan-cdn.nolimitcity.com/"
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
        if a.name and a.name.lower() not in g["name"].lower():
            continue
        if a.since and g["release"][:4] < str(a.since):
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
    """The CDN serves a 750 px copy under a medium_ prefix; fall back to the original."""
    CACHE.mkdir(parents=True, exist_ok=True)
    name = url.rsplit("/", 1)[-1]
    path = CACHE / name
    if not path.exists() or path.stat().st_size == 0:
        data = b""
        if url.startswith(CDN):
            try:
                data = fetch(CDN + "medium_" + name)
            except Exception:
                data = b""
        if not data or data[:5] == b"<?xml":  # the CDN answers a missing size with an XML error
            data = fetch(url)
        path.write_bytes(data)
    return path


def cmd_sheet(a: argparse.Namespace) -> int:
    from PIL import Image, ImageDraw, ImageFont

    games = [g for g in pick(load()["games"], a) if g[a.kind]]
    if a.limit:
        games = games[: a.limit]
    if not games:
        print("nothing matches (or no images of that kind for the match)")
        return 1
    cell = (480, 252) if a.kind == "thumb" else (560, 400)
    cols = a.cols or (4 if a.kind == "thumb" else 3)
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
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (64, 64, 64, 255))  # reel areas are cut out on alpha
        bg.alpha_composite(rgba)
        tile = bg.convert("RGB")
        tile.thumbnail(cell, Image.Resampling.LANCZOS)
        x, y = (n % cols) * cell[0], (n // cols) * (cell[1] + label)
        sheet.paste(tile, (x + (cell[0] - tile.width) // 2, y + label))
        draw.text((x + 4, y + 4), f"{g['name']} ({g['release'][:4]}) · {g['family']}"[:52], fill="black", font=font)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out, quality=88)
    print(f"{a.out}  ({len(games)} titles, {a.kind})")
    return 0


def cmd_list(a: argparse.Namespace) -> int:
    for g in pick(load()["games"], a):
        kinds = "".join(k[0] for k in ("thumb", "screen") if g[k])
        vol = f"{g['volatility']:>5}" if g["volatility"] is not None else "    -"
        print(f"{g['id']:>4}  {g['release'][:4]}  {g['family']:<11} {g['style_key']:<11} {g['theme']:<21} "
              f"{kinds:<2} vol{vol}  {g['name']}" + (f"  — {g['note']}" if g["note"] else ""))
    return 0


def cmd_summary(a: argparse.Namespace) -> int:
    d = load()
    games = d["games"]
    print(f"{d['count']} slots surveyed {d['surveyed']} from {d['source']}\n")
    fam = Counter(g["family"] for g in games)
    for f, n in fam.most_common():
        years = sorted(g["release"][:4] for g in games if g["family"] == f)
        print(f"{n:>4} {n / len(games):6.1%}  {f:<11} -> {d['families'][f]:<11} {years[0]}–{years[-1]}")
    print("\nby year:")
    for y in sorted({g["release"][:4] for g in games}):
        fams = Counter(g["family"] for g in games if g["release"][:4] == y)
        print(f"  {y}  " + ", ".join(f"{f} {c}" for f, c in fams.most_common()))
    print("\nby theme:")
    for t, n in Counter(g["theme"] for g in games).most_common():
        fams = Counter(g["family"] for g in games if g["theme"] == t)
        print(f"{n:>4}  {t:<21} " + ", ".join(f"{f} {c}" for f, c in fams.most_common()))
    return 0


def scrape() -> list[str]:
    index = fetch(SITE + "/sitemap.xml").decode("utf-8", "replace")
    slugs = []
    for sm in re.findall(r"<loc>([^<]+)</loc>", index):
        body = fetch(sm).decode("utf-8", "replace")
        slugs += re.findall(r"<loc>https://nolimitcity\.com/games/([^/<]+)</loc>", body)
    return sorted(set(slugs))


def cmd_refresh(a: argparse.Namespace) -> int:
    d = load()
    known = {g["slug"] for g in d["games"]}
    live = scrape()
    new = [s for s in live if s not in known]
    gone = [g for g in d["games"] if g["slug"] not in set(live)]
    print(f"sitemap lists {len(live)} slots; {len(new)} new, {len(gone)} no longer listed")
    for s in new:
        print(f"  NEW  {SITE}/games/{s}")
    for g in gone:
        print(f"  GONE {g['name']}")
    if a.write and new:
        nid = max(g["id"] for g in d["games"]) + 1
        for s in new:
            page = fetch(f"{SITE}/games/{s}").decode("utf-8", "replace")
            og = re.search(r'og:image" content="([^"]+)', page)
            name = re.search(r'og:site_name" content="([^"|]+)', page)
            rel = re.search(r'releaseDate\\?":\\?"([0-9-]+)', page)
            d["games"].append(dict(id=nid, name=name.group(1).strip() if name else s, slug=s,
                                   release=rel.group(1) if rel else "", family="untagged", style_key="",
                                   theme="", volatility=None, max_win=None, note="",
                                   page=f"{SITE}/games/{s}", thumb=og.group(1) if og else "", screen=""))
            nid += 1
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
        p.add_argument("--family", help="caricature, grime, sticker, inkcomic, collage, digital, legacy")
        p.add_argument("--key", help="art-direction catalogue key, e.g. caricature, grime, noir, cartoon")
        p.add_argument("--theme", help="substring of the theme tag, e.g. prison, western, horror")
        p.add_argument("--name", help="substring of the title")
        p.add_argument("--since", type=int, help="release year from, e.g. 2022")
        p.add_argument("--ids", help="comma-separated survey ids")
        if name == "sheet":
            p.add_argument("--kind", choices=("thumb", "screen"), default="thumb")
            p.add_argument("--cols", type=int)
            p.add_argument("--limit", type=int)
            p.add_argument("--out", type=Path, required=True)
    r = sub.add_parser("refresh")
    r.add_argument("--write", action="store_true", help="append new titles to the JSON as 'untagged'")
    a = ap.parse_args()
    return {"summary": cmd_summary, "list": cmd_list, "sheet": cmd_sheet, "refresh": cmd_refresh}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
