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

Whole-game transcription (references/hacksaw-style-transcripts.json, 140 games;
what the numbers mean is references/hacksaw-style-transcripts.md):
  hacksaw_styles.py game  NAME|SLUG|ID [--section S ...] [--json]
  hacksaw_styles.py norms [--family F] [--key K] [--theme T] [--series S] [--ids 1,2]
  hacksaw_styles.py find  [--font F] [--sound S] [--anim A] [--skeleton K] [--atlas A] [--text-role R]
  hacksaw_styles.py shots [--family F] [--key K] [--theme T] [--series S] [--ids 1,2]
                          [--kind splash|base|base_late|mobile_base|mobile_splash|palette|load]
                          [--cols N] [--limit N] --out OUT.jpg

`game` prints one title's transcription (sections: rules, loading, splash,
feature, flow, reel, tiers, spine, sound, text, palette, atlas, files).
`norms` recomputes the cross-game norms over any subset, so "what does a
rubber-hose game's win ladder look like" is one command. `find` lists the
games that use a font / sound cue / animation / skeleton / atlas / text role.
`shots` builds contact sheets from the local screenshots of the research
library (splash = the intro panels, base_late = the board after a few spins,
palette = the colour-share strip), which the lobby survey above does not have.
The library lives outside the repo ($HACKSAW_STYLE_LIBRARY, default
/Users/stone/stake-engine/research/hacksaw-motion-kit/materials/style-library);
`game` and `norms` work from the JSON alone.

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
TRANSCRIPTS = HERE.parent / "references" / "hacksaw-style-transcripts.json"
LIBRARY = Path(os.environ.get(
    "HACKSAW_STYLE_LIBRARY",
    "/Users/stone/stake-engine/research/hacksaw-motion-kit/materials/style-library"))
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


# ── whole-game transcription ────────────────────────────────────────────────

def load_tx() -> list[dict]:
    return json.loads(TRANSCRIPTS.read_text(encoding="utf-8"))["games"]


def pick_tx(games: list[dict], a: argparse.Namespace) -> list[dict]:
    ids = {int(x) for x in a.ids.split(",")} if getattr(a, "ids", None) else None
    series = {g["id"]: g["series"] for g in load()["games"]}
    out = []
    for g in games:
        if a.family and g["family"] != a.family:
            continue
        if a.key and g["style_key"] != a.key:
            continue
        if a.theme and a.theme not in (g["theme"] or ""):
            continue
        if a.series and a.series.lower() not in series.get(g["id"], "").lower():
            continue
        if ids is not None and g["id"] not in ids:
            continue
        out.append(g)
    return out


def find_game(games: list[dict], q: str) -> dict | None:
    ql = q.lower().replace(" ", "-")
    for g in games:
        if str(g["id"]) == q or g["slug"].lower() == ql or g["name"].lower() == q.lower():
            return g
    hits = [g for g in games if ql in g["slug"].lower() or q.lower() in g["name"].lower()]
    if len(hits) > 1:
        print("ambiguous: " + ", ".join(f"{g['name']} ({g['id']})" for g in hits), file=sys.stderr)
    return hits[0] if len(hits) == 1 else None


def stats(xs: list[float]) -> str:
    xs = sorted(x for x in xs if isinstance(x, (int, float)) and not isinstance(x, bool))
    n = len(xs)
    if not n:
        return "-"
    f = lambda v: f"{v:g}"
    return f"n={n:<3} median {f(xs[n // 2])}  (p25 {f(xs[n // 4])} · p75 {f(xs[(3 * n) // 4])} · {f(xs[0])}–{f(xs[-1])})"


def fmt_text(role: str, t: dict) -> str:
    bits = [f"{t.get('font')} {t.get('size')} {t.get('color')}"]
    if t.get("outline"):
        bits.append(f"outline {t['outline'][0]} w{t['outline'][1]}")
    if t.get("outline2"):
        bits.append(f"outline2 {t['outline2'][0]} w{t['outline2'][1]}")
    if t.get("shadow"):
        bits.append(f"shadow {t['shadow'][0]} d{t['shadow'][1]}")
    if t.get("tracking"):
        bits.append(f"tracking {t['tracking']}")
    return f"    {role:<20} " + ", ".join(bits) + (f"   [{', '.join(t['strings'][:3])}]" if t.get("strings") else "")


SPLASH_ROLES = ("splashTopHeader", "splashHeader", "splashBody", "splashFooter", "clickToContinue")
FEATURE_ROLES = ("featureHeader", "featureBody", "featureInfo", "featureFooter", "featureDigits",
                 "featureTotalWin", "retrigger", "winAnimationTier", "winAnimationAmount")


def cmd_game(a: argparse.Namespace) -> int:
    games = load_tx()
    g = find_game(games, a.name)
    if not g:
        print(f"no single title matches {a.name!r}")
        return 1
    if a.json:
        print(json.dumps(g, ensure_ascii=False, indent=1))
        return 0
    want = set(a.section or ["rules", "loading", "splash", "feature", "flow", "reel", "tiers",
                             "spine", "sound", "text", "palette", "atlas", "files"])
    print(f"{g['name']}  id {g['id']} v{g['version']}  family {g['family']} ({g['style_key'] or '-'})"
          f"  theme {g['theme'] or '-'}  assets {g['asset']['files']} files / {g['asset']['MB']} MB")
    if "rules" in want:
        print(f"\n  board {g['shape'] or '?'}  max win {g['max_win'] or '?'}x  mechanics {', '.join(g['mechanics'])}")
        print(f"  features: {' · '.join(g['feature_titles']) or '-'}")
        print(f"  pitch: {g['pitch']}")
    if "loading" in want and g["preloader"]:
        p = g["preloader"]
        print(f"\n  loading bar {p.get('width')}x{p.get('height')} at y {p.get('offset', {}).get('y')}"
              f"  bar {p.get('color')} on {p.get('backgroundColor')}  plate {p.get('backplate')}")
    if "splash" in want:
        print("\n  intro splash")
        if g["splash"]:
            s = g["splash"]
            print(f"    {s['panels']} panels: {', '.join(h or '(art only)' for h in s['headers'])}"
                  f"  · xSpacing {s['x_spacing']} · header max w {s['header_max_w']} · body max {s['body_max']}"
                  f" · top header {s['top_header']} · volatility meter {s['volatility']}")
        for r in SPLASH_ROLES:
            if r in g["text"]:
                print(fmt_text(r, g["text"][r]))
        sp = [x for x in g["atlases"] if "splash" in x["name"]]
        for x in sp:
            print(f"    atlas {x['name']} {x['page']} · {x['regions']} regions: {', '.join(x['names'][:14])}")
    if "feature" in want:
        print("\n  feature panels / count-up")
        for r in FEATURE_ROLES:
            if r in g["text"]:
                print(fmt_text(r, g["text"][r]))
        if g.get("countup"):
            print(f"    countup {json.dumps(g['countup'])}")
    if "flow" in want:
        print("\n  states (after = waits in s, tint = scene dim factor, fade = scene fade s)")
        for cls, d in g["states"].items():
            bits = []
            for k in ("scenes", "after", "tint", "fade", "spine_anims"):
                if d.get(k):
                    bits.append(f"{k} {d[k]}")
            ev = [e for e in d.get("events", []) if e.startswith("game/")]
            if ev:
                bits.append("events " + ", ".join(ev[:8]))
            print(f"    {cls:<34} " + "  ".join(bits))
    if "reel" in want:
        print("\n  reel timing (spinRevealProps)")
        if not g["reel"]:
            print("    (not in gameconfig: this title drives its reels from code)")
        for m, v in g["reel"].items():
            print(f"    {m:<20} " + ", ".join(f"{k} {x}" for k, x in v.items()))
    if "tiers" in want:
        print("\n  win ladder (x bet → label, ms)")
        print("    " + " | ".join(f"{t[0]:g}x {t[1] or '-'} {t[2]}" for t in g["tiers"]))
    if "spine" in want:
        print(f"\n  spine ({len(g['spine'])} skeletons)")
        for s in sorted(g["spine"], key=lambda s: -(s["bones"] or 0)):
            anims = ", ".join(f"{k} {v:g}" for k, v in list(s["anims"].items())[:12])
            more = f" … +{len(s['anims']) - 12}" if len(s["anims"]) > 12 else ""
            print(f"    {s['name']:<24} {s['bones'] or 0:>4} bones {s['size']}  {anims}{more}"
                  + (f"  events {s['events'][:6]}" if s["events"] else ""))
    if "sound" in want:
        print(f"\n  sound ({g['sounds']['count']} cues)")
        for k, v in sorted(g["sounds"]["groups"].items(), key=lambda kv: -len(kv[1])):
            print(f"    {k:<14} {len(v):>3}  {', '.join(v[:8])}" + (" …" if len(v) > 8 else ""))
    if "text" in want:
        rest = [r for r in g["text"] if r not in SPLASH_ROLES + FEATURE_ROLES]
        if rest:
            print("\n  other text styles")
            for r in rest:
                print(fmt_text(r, g["text"][r]))
    if "palette" in want:
        print("\n  palette by atlas kind (area-weighted; sat/val means, dark = V<0.2 share, grey = S<0.12 share)")
        for k, p in g["palette"].items():
            print(f"    {k:<6} sat {p['sat']} val {p['val']} dark {p['dark']} grey {p['grey']}  "
                  + " ".join(f"{h}:{w:.0%}" for h, w in p["top"][:8]))
    if "atlas" in want:
        print(f"\n  atlases ({len(g['atlases'])})")
        for x in g["atlases"]:
            print(f"    {x['name']:<26} {x['page']} {x['regions']:>3}  {', '.join(x['names'][:10])}")
    if "files" in want:
        d = LIBRARY / g["folder"]
        print(f"\n  research files: {d}/style.md" + ("" if d.is_dir() else "   (library not on this machine)"))
        print(f"    shots: {', '.join(s for s in g['shots'] if 'load' not in s)} (+ load frames)")
    return 0


def cmd_norms(a: argparse.Namespace) -> int:
    gs = pick_tx(load_tx(), a)
    if not gs:
        print("nothing matches")
        return 1
    print(f"{len(gs)} titles: " + ", ".join(g["name"] for g in gs[:12]) + (" …" if len(gs) > 12 else ""))
    print("\nboard  " + ", ".join(f"{k} {n}" for k, n in Counter(g["shape"] or "?" for g in gs).most_common(6)))
    print(f"assets MB {stats([g['asset']['MB'] for g in gs])}")
    pl = [g["preloader"] for g in gs if g["preloader"]]
    print(f"\nloading bar  width {stats([p.get('width') for p in pl])}")
    print(f"             height {stats([p.get('height') for p in pl])}")
    print(f"             bar colours {Counter(p.get('color') for p in pl).most_common(5)}  "
          f"behind {Counter(p.get('backgroundColor') for p in pl).most_common(2)}")
    for speed in ("normal", "turbo", "superTurbo"):
        rows = [g["reel"][speed] for g in gs if speed in g["reel"]]
        if not rows:
            continue
        print(f"\nreel {speed} ({len(rows)} titles with spinRevealProps)")
        for k in ("speed", "startDuration", "reelDelay", "stopDuration", "reelStopDelay", "stopSpeed",
                  "presentDelay", "attentionSpeed", "attentionStopSpeed", "attentionStopDuration"):
            print(f"  {k:<22} {stats([r.get(k) for r in rows])}")
    lad = Counter(tuple((t[0], t[2]) for t in g["tiers"]) for g in gs if g["tiers"])
    print("\nwin ladders (x bet:ms)")
    for k, n in lad.most_common(4):
        print(f"  {n:>3}×  " + "  ".join(f"{x:g}:{ms}" for x, ms in k))
    print("\nintro splash")
    sp = [g["splash"] for g in gs if g["splash"]]
    if sp:
        print(f"  panels {Counter(s['panels'] for s in sp).most_common()}  xSpacing {stats([s['x_spacing'] for s in sp])}")
    for r in SPLASH_ROLES + FEATURE_ROLES:
        ts = [g["text"][r] for g in gs if r in g["text"]]
        if len(ts) >= 2:
            ol = sum(1 for t in ts if t.get("outline"))
            print(f"  {r:<20} size {stats([t['size'] for t in ts])}  outlined {ol}/{len(ts)}"
                  f"  colours {', '.join(str(c) for c, _ in Counter(t['color'] for t in ts).most_common(3))}")
    fonts = Counter(f for g in gs for f in g["fonts"])
    print(f"\nfonts per title {stats([len(g['fonts']) for g in gs])}  most used: "
          + ", ".join(f"{f} {n}" for f, n in fonts.most_common(10)))
    print("\nanimation seconds")
    def anims(pred):
        return [v for g in gs for s in g["spine"] for k, v in s["anims"].items() if pred(s["name"], k) and v > 0]
    for label, pred in (
        ("symbol land", lambda s, k: re.match(r"(lows|highs|specials)/.+/land(ing)?$", k)),
        ("symbol win", lambda s, k: re.match(r"(lows|highs|specials)/.+/win$", k)),
        ("symbol remove", lambda s, k: re.match(r"(lows|highs|specials)/.+/remove$", k)),
        ("special idle", lambda s, k: re.match(r"specials/.+/idle$", k)),
        ("big-win trigger", lambda s, k: re.match(r"(big|mega|super_mega|epic)_win/trigger$", k)),
        ("big-win idle loop", lambda s, k: re.match(r"(big|mega|super_mega|epic)_win/idle$", k)),
        ("big-win remove", lambda s, k: re.match(r"(big|mega|super_mega|epic)_win/remove$", k)),
        ("character idle", lambda s, k: CHAR.search(s) and k.split("/")[-1].startswith("idle")),
        ("character react", lambda s, k: CHAR.search(s) and re.search(r"win|react|laugh|dance|loos|welcome", k)),
    ):
        print(f"  {label:<18} {stats(anims(pred))}")
    print(f"  character bones    {stats([s['bones'] for g in gs for s in g['spine'] if CHAR.search(s['name'])])}")
    print(f"\nsound cues per title {stats([g['sounds']['count'] for g in gs])}")
    grp = Counter(k for g in gs for k in g["sounds"]["groups"])
    print("  groups in most titles: " + ", ".join(f"{k} {n}" for k, n in grp.most_common(18)))
    lv = [len([x for x in g["sounds"]["groups"].get("music", []) if "level" in x]) for g in gs]
    print(f"  layered music stems {stats(lv)}")
    print("\npalette (area-weighted means per title)")
    for kind in ("bg", "splash", "other"):
        ps = [g["palette"][kind] for g in gs if kind in g["palette"]]
        if ps:
            print(f"  {kind:<6} sat {stats([p['sat'] for p in ps])}")
            print(f"  {'':<6} val {stats([p['val'] for p in ps])}")
            print(f"  {'':<6} dark {stats([p['dark'] for p in ps])}  grey {stats([p['grey'] for p in ps])}")
    return 0


CHAR = re.compile(r"character|raccoon|smokey|robber|girl|guy|boss|princess|knight|hero|zeus|hades|"
                  r"persephone|anubis|bastet|bear|dog|cat_|monkey|panda|clown|vamp|demon|priest|"
                  r"neander|barkeeper|fred|danny|donny|cowgirl|bounty|tutan|medusa|siren|diver")


def cmd_find(a: argparse.Namespace) -> int:
    n = 0
    for g in load_tx():
        hits = []
        if a.font:
            hits += [f for f in g["fonts"] if a.font.lower() in f.lower()]
        if a.sound:
            hits += [c for v in g["sounds"]["groups"].values() for c in v if a.sound.lower() in c.lower()][:6]
        if a.anim:
            hits += [f"{s['name']}:{k} {v:g}s" for s in g["spine"] for k, v in s["anims"].items()
                     if a.anim.lower() in k.lower()][:6]
        if a.skeleton:
            hits += [f"{s['name']} ({s['bones']} bones)" for s in g["spine"] if a.skeleton.lower() in s["name"].lower()]
        if a.atlas:
            hits += [f"{x['name']} ({x['regions']})" for x in g["atlases"] if a.atlas.lower() in x["name"].lower()]
        if a.text_role:
            hits += [fmt_text(r, t).strip() for r, t in g["text"].items() if a.text_role.lower() in r.lower()]
        if hits:
            n += 1
            print(f"{g['id']:>5}  {g['family']:<13} {g['name']:<34} " + " · ".join(hits))
    print(f"\n{n} titles")
    return 0


def cmd_shots(a: argparse.Namespace) -> int:
    from PIL import Image, ImageDraw, ImageFont

    if not LIBRARY.is_dir():
        print(f"research library not found at {LIBRARY} (set HACKSAW_STYLE_LIBRARY)")
        return 1
    games = pick_tx(load_tx(), a)
    files = []
    for g in games:
        d = LIBRARY / g["folder"]
        if a.kind == "palette":
            cand = [d / "palette.png"]
        elif a.kind == "load":
            loads = sorted(p for p in (d / "shots").glob("desktop_load_*") if p.suffix in (".jpg", ".png"))
            cand = loads[len(loads) // 2: len(loads) // 2 + 1]
        else:
            cand = [d / "shots" / f"{a.kind if a.kind.startswith('mobile') else 'desktop_' + a.kind}{ext}"
                    for ext in (".jpg", ".png")]
        p = next((c for c in cand if c.exists()), None)
        if p:
            files.append((g, p))
    if a.limit:
        files = files[: a.limit]
    if not files:
        print("nothing matches (or no shot of that kind)")
        return 1
    mobile = a.kind.startswith("mobile")
    cell = (300, 560) if mobile else (560, 315)
    cols = a.cols or (6 if mobile else 3)
    rows = (len(files) + cols - 1) // cols
    label = 24
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except OSError:
        font = ImageFont.load_default()
    sheet = Image.new("RGB", (cols * cell[0], rows * (cell[1] + label)), "white")
    draw = ImageDraw.Draw(sheet)
    for n, (g, p) in enumerate(files):
        im = Image.open(p).convert("RGB")
        im.thumbnail(cell, Image.Resampling.LANCZOS)
        x, y = (n % cols) * cell[0], (n // cols) * (cell[1] + label)
        sheet.paste(im, (x + (cell[0] - im.width) // 2, y + label))
        draw.text((x + 4, y + 4), f"{g['name']} · {g['family']}"[:48], fill="black", font=font)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out, quality=88)
    print(f"{a.out}  ({len(files)} titles, {a.kind})")
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
    g = sub.add_parser("game")
    g.add_argument("name", help="title, slug or game id")
    g.add_argument("--section", action="append", choices=("rules", "loading", "splash", "feature", "flow", "reel",
                                                          "tiers", "spine", "sound", "text", "palette", "atlas", "files"))
    g.add_argument("--json", action="store_true")
    for name in ("norms", "shots"):
        p = sub.add_parser(name)
        p.add_argument("--family")
        p.add_argument("--key")
        p.add_argument("--theme")
        p.add_argument("--series")
        p.add_argument("--ids")
        if name == "shots":
            p.add_argument("--kind", default="splash", choices=("splash", "base", "base_late", "mobile_base",
                                                                 "mobile_splash", "palette", "load"))
            p.add_argument("--cols", type=int)
            p.add_argument("--limit", type=int)
            p.add_argument("--out", type=Path, required=True)
    f = sub.add_parser("find")
    for opt in ("--font", "--sound", "--anim", "--skeleton", "--atlas", "--text-role"):
        f.add_argument(opt)
    a = ap.parse_args()
    return {"summary": cmd_summary, "list": cmd_list, "sheet": cmd_sheet, "refresh": cmd_refresh,
            "game": cmd_game, "norms": cmd_norms, "find": cmd_find, "shots": cmd_shots}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
