#!/usr/bin/env python3
"""Look up Pragmatic Play's slots by art style, and query the 11-title deep transcription.

The data is references/pp-slots.json (669 titles from pragmaticplay.com's
sitemap, each tagged with a family by eye from its lobby thumbnail, plus a
theme, mechanics and shape parsed from the site blurb) and
references/pp-style-transcripts.json (11 full sessions captured frame by frame:
init numbers, timing, per-phase colour numbers). Both are written by
build_pp_transcripts.py. The write-up is references/pragmatic-play-styles.md.

Images are NOT stored in the repo. `sheet` downloads the thumbnails it needs
into ~/.cache/pp-styles; `shots` reads frames from the local kit (outside the
repo, $PP_STYLE_KIT). They are for looking at only: never attach them to a
generation prompt, never trace them, never ship them.

usage:
  pp_styles.py summary
  pp_styles.py list  [--family F] [--key K] [--theme T] [--mech M] [--name N] [--since YEAR]
  pp_styles.py sheet [same filters] [--ids 1,2] [--cols N] [--limit N] --out OUT.jpg
  pp_styles.py fetch                                  # cache all 669 thumbnails (~65 MB)
  pp_styles.py game "gates of olympus"               # one deep title: init, timing, phases
  pp_styles.py norms                                  # timing / economy norms over the deep titles
  pp_styles.py shots --phase fg_end [--name N] --out OUT.jpg   # one frame per deep title
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import statistics as st
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
SLOTS = HERE.parent / "references" / "pp-slots.json"
TX = HERE.parent / "references" / "pp-style-transcripts.json"
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "pp-styles"
KIT = Path(os.environ.get(
    "PP_STYLE_KIT", "/Users/stone/stake-engine/research/pp-transcripts/unpacked/PP抄錄"))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"
CAPPED = 38.0   # the capture script gives up waiting for idle at ~38.5 s; such spins are not timings


def load() -> dict:
    return json.loads(SLOTS.read_text(encoding="utf-8"))


def load_tx() -> dict:
    return json.loads(TX.read_text(encoding="utf-8"))


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
        if a.mech and a.mech not in g["mechanics"]:
            continue
        if a.name and a.name.lower() not in g["name"].lower():
            continue
        if a.since and g["uploaded"][:4] < str(a.since):
            continue
        if ids is not None and g["id"] not in ids:
            continue
        out.append(g)
    return out


def cached(url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + os.path.splitext(url)[1])
    if not path.exists() or path.stat().st_size == 0:
        req = urllib.request.Request(urllib.parse.quote(url, safe=":/%?=&"), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            path.write_bytes(r.read())
    return path


def font(size: int):
    from PIL import ImageFont
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except OSError:
        return ImageFont.load_default()


def compose(items: list[tuple[str, Path]], cell: tuple[int, int], cols: int, out: Path) -> None:
    from PIL import Image, ImageDraw
    rows = (len(items) + cols - 1) // cols
    label = 24
    sheet = Image.new("RGB", (cols * cell[0], rows * (cell[1] + label)), "white")
    draw = ImageDraw.Draw(sheet)
    f = font(16)
    for n, (text, p) in enumerate(items):
        im = Image.open(p)
        if im.mode != "RGB":
            rgba = im.convert("RGBA")
            bg = Image.new("RGBA", rgba.size, (0, 0, 0, 255))
            bg.alpha_composite(rgba)
            im = bg.convert("RGB")
        im.thumbnail(cell, Image.Resampling.LANCZOS)
        x, y = (n % cols) * cell[0], (n // cols) * (cell[1] + label)
        sheet.paste(im, (x + (cell[0] - im.width) // 2, y + label))
        draw.text((x + 4, y + 4), text[:56], fill="black", font=f)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)


# ---------- catalog ----------

def cmd_summary(a: argparse.Namespace) -> int:
    d = load()
    games = [g for g in d["games"] if g["family"] != "non-slot"]
    print(f"{d['count']} titles surveyed {d['surveyed']} ({len(games)} slots) from {d['source']}\n")
    for f, n in Counter(g["family"] for g in games).most_common():
        months = sorted(g["uploaded"] for g in games if g["family"] == f and g["uploaded"])
        print(f"{n:>4} {n / len(games):6.1%}  {f:<9} -> {d['families'][f]:<8} {months[0]}..{months[-1]}")
    print("\nby upload year:")
    for y in sorted({g["uploaded"][:4] for g in games}):
        fams = Counter(g["family"] for g in games if g["uploaded"][:4] == y)
        n = sum(fams.values())
        print(f"  {y} {n:>4}  " + ", ".join(f"{f} {c / n:.0%}" for f, c in fams.most_common()))
    print("\nby theme:")
    for t, n in Counter(g["theme"] or "-" for g in games).most_common():
        fams = Counter(g["family"] for g in games if (g["theme"] or "-") == t)
        print(f"{n:>4}  {t:<12} " + ", ".join(f"{f} {c}" for f, c in fams.most_common()))
    print("\nthumbnail numbers by family (median):  colors95  soft  sat  achromatic  lum")
    for f in Counter(g["family"] for g in games):
        xs = [g["thumb_numbers"] for g in games if g["family"] == f and g.get("thumb_numbers")]
        if xs:
            print(f"  {f:<9} {len(xs):>4}  " + "  ".join(
                f"{st.median(x[k] for x in xs):>7.3g}" for k in ("colors95", "soft", "sat", "achromatic", "lum")))
    return 0


def cmd_list(a: argparse.Namespace) -> int:
    for g in pick(load()["games"], a):
        print(f"{g['id']:>4}  {g['uploaded']:<7}  {g['family']:<9} {g['theme'] or '-':<12} {g['shape'] or '-':<5} "
              f"{','.join(g['mechanics'])[:40]:<40}  {g['name']}" + ("  [deep]" if g["deep"] else ""))
    return 0


def cmd_sheet(a: argparse.Namespace) -> int:
    games = pick(load()["games"], a)
    if a.limit:
        games = games[: a.limit]
    if not games:
        print("nothing matches")
        return 1
    items = []
    for g in games:
        try:
            items.append((f"{g['name']} ({g['uploaded'][:4]}) · {g['family']}", cached(g["thumb"])))
        except Exception as e:
            print(f"skip {g['name']}: {e}", file=sys.stderr)
    compose(items, (360, 192), a.cols or 4, a.out)
    print(f"{a.out}  ({len(items)} titles)")
    return 0


def cmd_fetch(a: argparse.Namespace) -> int:
    games = load()["games"]
    bad = 0
    for g in games:
        try:
            cached(g["thumb"])
        except Exception as e:
            bad += 1
            print(f"fail {g['name']}: {e}", file=sys.stderr)
    print(f"{len(games) - bad} thumbnails in {CACHE}")
    return 1 if bad else 0


# ---------- deep transcription ----------

def find_game(q: str) -> dict | None:
    games = load_tx()["games"]
    q = q.lower()
    for g in games:
        if q == g["symbol"].lower() or q == g["name"].lower():
            return g
    hits = [g for g in games if q in g["name"].lower() or q in g["symbol"].lower()]
    return hits[0] if hits else None


def real_spins(t: dict) -> list[float]:
    return [s for s in t.get("spin_presentation_s", []) if s < CAPPED]


def cmd_game(a: argparse.Namespace) -> int:
    g = find_game(a.title)
    if not g:
        print("no deep title matches; deep titles: " + ", ".join(x["name"] for x in load_tx()["games"]))
        return 1
    i, t = g.get("init", {}), g["timing"]
    print(f"{g['name']}  ({g['symbol']}, captured at {g['viewport'][0]}x{g['viewport'][1]})\n")
    print(f"board {i.get('shape') or '?'}   lines/bet unit {i.get('lines')}   reel sets {i.get('reel_sets')}   "
          f"coin steps {i.get('coin_steps')}   default bet {i.get('default_bet')}")
    print("RTP   " + ", ".join(f"{k} {v}" for k, v in i.get("rtp", {}).items()))
    print("max   " + ", ".join(f"{k} {v}x" for k, v in i.get("max_win_x", {}).items()))
    print("buy   " + (", ".join(f"{b['x_bet']}x" + (f" ({b['fs_count']} FS)" if 'fs_count' in b else "")
                             for b in i.get("buy", [])) or "none"))
    if i.get("ante_x_bet"):
        print("ante  " + ", ".join(f"{x}x bet" for x in i["ante_x_bet"]))
    if i.get("paytable_tops"):
        print("paytable top values (coins per line unit): " + ", ".join(map(str, i["paytable_tops"])))
    print("\ntiming")
    print(f"  loading {t['loading_s']} s, intro clicks {t['intro_clicks']}, server latency {t['server_latency_s']} s")
    spins = t.get("spin_presentation_s", [])
    print(f"  base spins: " + ", ".join(f"{s}" + ("*" if s >= CAPPED else "") for s in spins)
          + "  (* capture gave up waiting: not a timing)")
    if t.get("fg_spins"):
        print(f"  FG: award {t.get('fg_award')}, {t['fg_spins']} spin requests in {t['fg_total_s']} s, "
              f"spin-to-spin median {t['fg_spin_interval_median_s']} s (p90 {t['fg_spin_interval_p90_s']})")
        print(f"      entry {t['fg_entry_s']} s (trigger result -> 2nd FG request: wipe + intro panel + 1 spin), "
              f"exit {t['fg_exit_s']} s (last spin -> collect), total win {t.get('fg_total_win_x')}x bet")
    print("\nphases (frames saved on change; numbers are the mean of up to 3 frames)")
    print("  phase       frames   t0-t1 s      colors95   sat   achrom   lum   top colours")
    for ph, e in g["phases"].items():
        n = e["numbers"]
        print(f"  {ph:<11} {e['frames']:>5}   {e['t0']:>6}-{e['t1']:<6}  {n['colors95']:>6}  {n['sat']:>5}  "
              f"{n['achromatic']:>6}  {n['lum']:>5}   {' '.join(e['top'][:4])}")
    return 0


def q(xs: list[float]) -> str:
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return "-"
    if len(xs) < 4:
        return f"{st.median(xs):.2f} (n={len(xs)})"
    p25, p75 = xs[len(xs) // 4], xs[(3 * len(xs)) // 4]
    return f"{st.median(xs):.2f} ({p25:.2f}–{p75:.2f}, n={len(xs)})"


def cmd_norms(a: argparse.Namespace) -> int:
    games = load_tx()["games"]
    fg = [g for g in games if (g["timing"].get("fg_spins") or 0) > 1]
    T = lambda k, gs=games: [g["timing"].get(k) for g in gs]
    print(f"{len(games)} deep titles ({len(fg)} with a complete FG)\n")
    print("loading s                 ", q(T("loading_s")))
    print("server latency s          ", q(T("server_latency_s")))
    print("base spin presentation s  ", q([s for g in games for s in real_spins(g["timing"])]))
    print("  per title median        ", q([st.median(real_spins(g["timing"])) for g in games if real_spins(g["timing"])]))
    print("FG award                  ", q(T("fg_award", fg)))
    print("FG spin-to-spin s         ", q(T("fg_spin_interval_median_s", fg)))
    print("FG entry s (wipe+panel)   ", q(T("fg_entry_s", fg)))
    print("FG exit s (to collect)    ", q(T("fg_exit_s", fg)))
    print("FG total s                ", q(T("fg_total_s", fg)))
    buys = [b["x_bet"] for g in games for b in g.get("init", {}).get("buy", [])]
    print("\nbuy prices x bet          ", ", ".join(f"{p:g}" for p in sorted(buys)))
    antes = [x for g in games for x in g.get("init", {}).get("ante_x_bet", []) or []]
    print("ante levels x bet         ", ", ".join(f"{p:g}" for p in sorted(antes)))
    rtps = [v for g in games for v in g.get("init", {}).get("rtp", {}).values()]
    print("RTP per mode              ", q(rtps), f"min {min(rtps)} max {max(rtps)}")
    mw = [max(g["init"]["max_win_x"].values()) for g in games if g.get("init", {}).get("max_win_x")]
    print("max win x                 ", ", ".join(map(str, sorted(mw))))
    print("\nphase colour (median over titles):  sat   achromatic   lum")
    for ph in ("intro", "main_idle", "spin", "fg", "fg_end", "info"):
        rows = [g["phases"][ph]["numbers"] for g in games if ph in g["phases"]]
        if rows:
            print(f"  {ph:<10} n={len(rows):>2}   " + "   ".join(
                f"{st.median(r[k] for r in rows):.3f}" for k in ("sat", "achromatic", "lum")))
    return 0


def cmd_shots(a: argparse.Namespace) -> int:
    import re
    if not (KIT / "games").is_dir():
        print(f"kit not found at {KIT} (set PP_STYLE_KIT)")
        return 1
    items = []
    for g in load_tx()["games"]:
        if a.name and a.name.lower() not in g["name"].lower():
            continue
        frames = sorted((KIT / "games" / g["symbol"] / "frames").glob(f"*_{a.phase}_*.jpg"))
        frames = [p for p in frames if re.match(rf"\d+_{a.phase}_[\d.]+\.jpg$", p.name)]
        if not frames:
            continue
        sel = frames if a.all else [frames[len(frames) // 2]]
        for p in sel:
            items.append((f"{g['name']} · {p.name}", p))
    if a.limit:
        items = items[: a.limit]
    if not items:
        print("nothing matches (phases: loading intro enter main_idle first_spin spin fg fg_end after_fg info)")
        return 1
    compose(items, (480, 270), a.cols or 3, a.out)
    print(f"{a.out}  ({len(items)} frames, {a.phase})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("summary")
    for name in ("list", "sheet"):
        p = sub.add_parser(name)
        p.add_argument("--family")
        p.add_argument("--key")
        p.add_argument("--theme")
        p.add_argument("--mech")
        p.add_argument("--name")
        p.add_argument("--since", type=int)
        if name == "sheet":
            p.add_argument("--ids")
            p.add_argument("--cols", type=int)
            p.add_argument("--limit", type=int)
            p.add_argument("--out", type=Path, required=True)
    sub.add_parser("fetch")
    g = sub.add_parser("game")
    g.add_argument("title")
    sub.add_parser("norms")
    s = sub.add_parser("shots")
    s.add_argument("--phase", required=True)
    s.add_argument("--name")
    s.add_argument("--all", action="store_true", help="every frame of the phase, not the middle one")
    s.add_argument("--cols", type=int)
    s.add_argument("--limit", type=int)
    s.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    return {"summary": cmd_summary, "list": cmd_list, "sheet": cmd_sheet, "fetch": cmd_fetch,
            "game": cmd_game, "norms": cmd_norms, "shots": cmd_shots}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
