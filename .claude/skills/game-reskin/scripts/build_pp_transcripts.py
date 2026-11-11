#!/usr/bin/env python3
"""Digest the Pragmatic Play transcription kit into references/pp-slots.json and
references/pp-style-transcripts.json.

The kit is the user's 「PP抄錄」 folder (Google Drive, 2026-10-12): `catalog/games.json`
(669 titles read off pragmaticplay.com's sitemap: name, gameSymbol, the site's
blurb and RTP, lobby thumbnail URL) and `games/<symbol>/` for 11 deep captures
(desktop 1280x720 Chromium, one full session each: loading -> intro splash ->
base game -> 6 spins -> bought FG -> FG intro panel -> every FG spin -> total-win
panel -> INFO), each with `frames/NNN_<phase>_<seconds>.jpg` (saved only when
the screen changed), `timeline.json` (every click and server request, with
times) and `init.txt` (the game's doInit response: paytable, reels, RTP per
mode, max win, buy prices). Those folders hold Pragmatic's own pixels and stay
outside the repo. This script keeps only names and numbers.

What it writes:
  pp-slots.json             every catalog title: family (tagged by eye from the
                            lobby thumbnail, 2026-10-12, kept across rebuilds),
                            theme / mechanics / shape parsed from the blurb,
                            thumbnail upload month, site RTP, and (with
                            --measure) colour numbers of the thumbnail
  pp-style-transcripts.json the 11 deep captures: init numbers (shape, lines,
                            RTP per mode, max win, buy prices in x bet, ante
                            levels, bet ladder), timing (loading, intro clicks,
                            spin presentation, server latency, FG per-spin
                            interval, FG total, panel holds) and per-phase
                            frame colour numbers

usage:
  build_pp_transcripts.py [--kit PATH] [--measure] [--write]

Without --write it only prints a summary. --kit defaults to $PP_STYLE_KIT or
/Users/stone/stake-engine/research/pp-transcripts/unpacked/PP抄錄. --measure needs
the thumbnails in ~/.cache/pp-styles (`pp_styles.py sheet` fetches them, or
`pp_styles.py fetch` fetches all 669).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import statistics as st
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
REF = HERE.parent / "references"
SLOTS = REF / "pp-slots.json"
OUT = REF / "pp-style-transcripts.json"
DEFAULT_KIT = Path(os.environ.get(
    "PP_STYLE_KIT", "/Users/stone/stake-engine/research/pp-transcripts/unpacked/PP抄錄"))
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "pp-styles"

# family -> art-direction catalogue key (references/art-direction.md)
FAMILIES = {
    "semireal": "render",   # painterly semi-real people, gods, animals: the PP house look
    "cartoon": "cartoon",   # mascot cartoon: big eyes, thick shapes (Big Bass, Dog House, POP)
    "glossy": "render",     # glossy objects with no cast: candy, gems, fruit, statues, title art
    "classic": "render",    # fruit-machine 7s, bars, cherries, flames
    "anime": "cel",         # Starlight Princess line
    "photo": "render",      # photographic people (2016-2018 only)
    "non-slot": "",         # table games, scratchcards, crash games, a placeholder entry
}

# first match wins; checked against the name, then the blurb's first 400 chars
THEMES = [
    ("fishing", r"big bass|fish|angler|lake|pelican"),
    ("candy", r"sweet|sugar|candy|jelly|gummy|cake|lollipop"),
    ("fruit", r"fruit|juicy|melon|cherr|berry"),
    ("greek-myth", r"olymp|zeus|athena|hades|poseidon|hercules|\bares\b|sparta|medusa|argonaut|helios|typhon"),
    ("norse", r"\bthor\b|odin|viking|freya|loki|valhalla|asgard|hammerstorm"),
    ("egypt", r"egypt|cleopatra|pharaoh|giza|\btut\b|anubis|horus|osiris|pyramid|nile|cairo|mummy|\bra\b"),
    ("aztec", r"aztec|maya|inca|montezuma|tiki"),
    ("asian-luck", r"dragon|panda|cai ?shen|mahjong|lion dance|5 lions|samurai|sumo|peking|jade|koi|"
                   r"fortune tree|tiger|lucky new year|chinese|wealth god|oriental|orient|88"),
    ("irish", r"leprechaun|irish|clover|emerald|shamrock|rainbow"),
    ("western", r"wild west|cowboy|bandit|bounty|sheriff|outlaw|saloon|gold rush|mustang"),
    ("pirate", r"pirate|kraken|captain|smuggler|buccaneer"),
    ("horror", r"zombie|vampire|werewolf|dead|haunt|blood|hell|demon|frank|crypt|ghost|sanatorium|witch"),
    ("christmas", r"xmas|christmas|santa|snow"),
    ("animals", r"wolf|buffalo|bison|rhino|lion|safari|gorilla|elephant|cheetah|jungle|monkey|bear|"
                r"eagle|hooves|horse|wildebeest|savannah"),
    ("dogs-cats", r"dog house|\bdog|puppy|cat\b|catfather|feline"),
    ("gems", r"gem|jewel|diamond|crystal"),
    ("retro-fire", r"joker|\b7s?\b|777|hot to burn|fire hot|shining hot|burn|chilli|\bhot\b"),
    ("money-heist", r"heist|bank|money|cash|vault|robber"),
]

MECHANICS = [
    ("tumble", r"tumbl|cascad|avalanche"),
    ("pay-anywhere", r"anywhere on the (screen|reels)|scatter pays|pays anywhere"),
    ("cluster", r"cluster"),
    ("megaways", r"megaways"),
    ("hold-and-spin", r"hold (and|&) spin|money (symbol|respin)|respin|connect"),
    ("multiplier", r"multiplier"),
    ("collect", r"collect"),
    ("powernudge", r"powernudge|nudge"),
    ("super-scatter", r"super scatter"),
    ("bonus-buy", r"buy (the )?(free spins|feature|bonus)|feature buy|bonus buy"),
    ("jackpot", r"jackpot"),
]

PHASES = ["loading", "intro", "enter", "main_idle", "first_spin", "spin", "fg", "fg_end", "after_fg", "final", "info"]


def thumb_path(url: str) -> Path:
    return CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + os.path.splitext(url)[1])


def clean(name: str) -> str:
    return re.sub(r"[™®©]", "", name).strip()


def first(pattern_list, text: str) -> str:
    for tag, rx in pattern_list:
        if re.search(rx, text, re.I):
            return tag
    return ""


def every(pattern_list, text: str) -> list[str]:
    return [tag for tag, rx in pattern_list if re.search(rx, text, re.I)]


# ---------- image numbers (same definitions as check_style.py) ----------

def image_numbers(path: Path, crop: tuple | None = None) -> dict:
    import numpy as np
    from PIL import Image
    im = Image.open(path)
    if im.mode != "RGB":   # palette / alpha thumbnails: flatten onto black, the lobby colour
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (0, 0, 0, 255))
        im = Image.alpha_composite(bg, im).convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    im.thumbnail((480, 480))
    rgb = np.asarray(im, dtype=float)
    px = rgb.reshape(-1, 3)
    bins = (px.astype(int) >> 4) @ np.array([256, 16, 1])
    counts = np.bincount(bins, minlength=4096)
    order = np.sort(counts)[::-1]
    colors95 = int(np.searchsorted(np.cumsum(order), 0.95 * order.sum()) + 1)
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
    p = np.pad(lum, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    s = np.hypot(gx, gy) / 4
    soft = float(((s > 2) & (s < 24)).mean())
    mx, mn = px.max(1), px.min(1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    achro = float((sat < 0.15).mean())
    # top colours: 3-bit-per-channel bins, centre value
    b3 = (px.astype(int) >> 5) @ np.array([64, 8, 1])
    c3 = np.bincount(b3, minlength=512)
    top = []
    for idx in np.argsort(c3)[::-1][:6]:
        if c3[idx] == 0:
            break
        r, g, b = (idx >> 6) & 7, (idx >> 3) & 7, idx & 7
        top.append("#%02x%02x%02x" % (r * 32 + 16, g * 32 + 16, b * 32 + 16))
    return {
        "colors95": colors95, "soft": round(soft, 3), "lum": round(float(lum.mean()) / 255, 3),
        "sat": round(float(sat.mean()), 3), "achromatic": round(achro, 3), "top": top,
    }


# ---------- catalog ----------

def build_slots(kit: Path, measure: bool) -> dict:
    games = json.loads((kit / "catalog" / "games.json").read_text(encoding="utf-8"))
    old = {}
    if SLOTS.exists():
        for g in json.loads(SLOTS.read_text(encoding="utf-8"))["games"]:
            old[(g["name"], g["symbol"])] = g
    deep = {p.name for p in (kit / "games").iterdir() if p.is_dir()} if (kit / "games").exists() else set()
    rows = []
    for g in games:
        m = re.search(r"uploads/(\d{4})/(\d{2})", g["thumb"])
        month = f"{m.group(1)}-{m.group(2)}" if m else ""
        name = clean(g["name"])
        blurb = g["desc"].split("\n", 2)
        body = blurb[2] if len(blurb) > 2 else g["desc"]
        text = name + " " + body[:400]
        shape = re.search(r"(\d+)\s*[x×]\s*(\d+)", body)
        prev = old.get((name, g["symbol"]), {})
        row = {
            "name": name,
            "symbol": g["symbol"],
            "slug": g["slug"],
            "uploaded": month,
            "family": prev.get("family", "untagged"),
            "style_key": FAMILIES.get(prev.get("family", ""), ""),
            "theme": first(THEMES, name) or first(THEMES, text),
            "mechanics": every(MECHANICS, body),
            "shape": f"{shape.group(1)}x{shape.group(2)}" if shape else "",
            "rtp_site": float(re.match(r"[\d.]+", g["rtp_site"]).group()) if re.match(r"[\d.]+", g["rtp_site"]) else None,
            "tagline": blurb[1].strip()[:140] if len(blurb) > 1 else "",
            "deep": g["symbol"] in deep,
            "thumb": g["thumb"],
            "page": g["url"],
        }
        if measure:
            p = thumb_path(g["thumb"])
            row["thumb_numbers"] = image_numbers(p) if p.exists() else prev.get("thumb_numbers")
        elif "thumb_numbers" in prev:
            row["thumb_numbers"] = prev["thumb_numbers"]
        rows.append(row)
    rows.sort(key=lambda r: (r["uploaded"], r["name"]))
    for i, r in enumerate(rows):
        r["id"] = i
    return {
        "source": "pragmaticplay.com sitemap via the user's 「PP抄錄」 kit (catalog/games.json)",
        "surveyed": "2026-10-12",
        "count": len(rows),
        "families": FAMILIES,
        "note": ("family tagged by eye from the 339x180 lobby thumbnail; uploaded is the thumbnail's "
                 "wp-content upload month, a release proxy (2016 holds the site's first bulk upload of "
                 "older titles); theme/mechanics/shape are parsed from the site blurb and can miss"),
        "games": rows,
    }


# ---------- deep captures ----------

def parse_init(text: str) -> dict:
    kv = {}
    for part in text.strip().split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            kv[k] = v
    out = {}
    lines = int(kv.get("l", "0") or 0)
    rows = int(kv.get("sh", "0") or 0)
    cells = [c for c in kv.get("def_s", "").split(",") if c]
    if rows and len(cells) > 1:
        out["shape"] = f"{len(cells) // rows}x{rows}"
    out["lines"] = lines
    gi = kv.get("gameInfo", "")
    rtps = dict(re.findall(r'(\w+):"([\d.]+)"', gi.split("props")[0])) if gi else {}
    if not rtps and "rtp" in kv:
        rtps = {"regular": kv["rtp"].split(",")[0]}
    out["rtp"] = {k: float(v) for k, v in rtps.items()}
    wl = dict(x.split("~") for x in kv.get("wl_i", "").split(";") if "~" in x)
    out["max_win_x"] = {k: int(float(v)) for k, v in wl.items()}
    if not out["max_win_x"]:
        mw = re.search(r'max_rnd_win:"(\d+)"', gi)
        if mw:
            out["max_win_x"] = {"tbm": int(mw.group(1))}
    buys = []
    pi = kv.get("purInit", "")
    for m in re.finditer(r"\{([^}]*)\}", pi):
        d = dict(re.findall(r'(\w+):"?([\w.]+)"?', m.group(1)))
        if "bet" in d and lines:
            buys.append({"x_bet": round(float(d["bet"]) / lines, 2), "type": d.get("type", ""),
                         **({"fs_count": int(d["fs_count"])} if "fs_count" in d else {})})
    if not buys and "fspps" in kv:   # older titles: bet~fs_count~bet_level
        b = kv["fspps"].split("~")
        if b[0] and lines:
            buys.append({"x_bet": round(float(b[0]) / lines, 2), "type": "fspps"})
    out["buy"] = buys
    bls = [int(x) for x in kv.get("bls", "").split(",") if x]
    if len(bls) > 1:
        out["ante_x_bet"] = [round(b / bls[0], 3) for b in bls[1:]]
    sc = [float(x) for x in kv.get("sc", "").split(",") if x]
    out["coin_steps"] = len(sc)
    if "defc" in kv and lines:
        out["default_bet"] = round(float(kv["defc"]) * lines, 2)
    out["reel_sets"] = int(kv.get("reel_set_size", "0") or 0)
    pay = kv.get("paytable", "")
    if pay:
        rows_ = [[int(v) for v in row.split(",") if v.isdigit()] for row in pay.split(";")]
        tops = sorted({max(r) for r in rows_ if r}, reverse=True)
        out["paytable_tops"] = [t for t in tops if t][:12]
    return out


def frame_index(frames: Path) -> list[tuple[str, float, Path]]:
    out = []
    for p in sorted(frames.glob("*.jpg")):
        m = re.match(r"\d+_(.+)_(\d+(?:\.\d+)?)\.jpg$", p.name)
        if m:
            out.append((m.group(1), float(m.group(2)), p))
    return out


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), 2) if xs else None


def digest_game(gdir: Path, names: dict) -> dict:
    sym = gdir.name
    tl = json.loads((gdir / "timeline.json").read_text(encoding="utf-8"))
    ev = tl["events"]
    rec = {"symbol": sym, "name": names.get(sym, sym), "viewport": tl.get("size")}
    if (gdir / "init.txt").exists():
        rec["init"] = parse_init((gdir / "init.txt").read_text(encoding="utf-8"))

    t = {}
    loaded = next((e for e in ev if e["ev"] == "loaded"), None)
    t["loading_s"] = loaded.get("secs") if loaded else None
    clicks = [e for e in ev if e["ev"] == "click_continue"]
    t["intro_clicks"] = len(clicks)
    spins = tl.get("spins", [])
    t["spin_presentation_s"] = [s["anim_secs"] for s in spins if s.get("anim_secs") is not None]
    # ~38.5 s means the capture gave up waiting for the idle loop (autoplay prompt, a stuck overlay)
    t["spin_presentation_median_s"] = med([x for x in t["spin_presentation_s"] if x < 38])
    t["spin_wins"] = [float(s["tw"]) for s in spins if s.get("tw") not in (None, "")]
    t["server_latency_s"] = med([s["resp"] - s["press"] for s in spins if s.get("resp") and s.get("press")])

    fg = tl.get("fg") or {}
    reqs = [r for r in fg.get("requests", []) if r.get("action") == "doSpin"]
    if reqs:
        gaps = [b["t"] - a["resp_t"] for a, b in zip(reqs, reqs[1:])]
        t["fg_spins"] = len(reqs)
        t["fg_total_s"] = fg.get("secs")
        t["fg_spin_interval_median_s"] = med(gaps)
        t["fg_spin_interval_p90_s"] = round(sorted(gaps)[int(0.9 * (len(gaps) - 1))], 2) if gaps else None
        # buy press -> second FG request: the transition into FG plus the intro panel plus one spin
        t["fg_entry_s"] = round(reqs[1]["t"] - reqs[0]["resp_t"], 2) if len(reqs) > 1 else None
        last = reqs[-1]
        coll = next((r for r in fg.get("requests", []) if r.get("action") == "doCollect" and r["t"] > last["t"]), None)
        t["fg_exit_s"] = round(coll["t"] - last["resp_t"], 2) if coll else None
        t["fg_award"] = next((int(r["fsmax"]) for r in reqs if r.get("fsmax")), None)
        t["fg_total_win_x"] = None
        tw = [float(r["tw"]) for r in reqs if r.get("tw")]
        if tw:
            bet = rec.get("init", {}).get("default_bet") or 0
            body = reqs[0].get("body", "")
            c = re.search(r"[?&]c=([\d.]+)", "&" + body)
            l = re.search(r"&l=(\d+)", body)
            if c and l:
                bet = float(c.group(1)) * int(l.group(1))
            if bet:
                t["fg_total_win_x"] = round(max(tw) / bet, 1)
        t["panel_clicks"] = len([e for e in ev if e["ev"] == "click" and e.get("phase") == "fg"])
    rec["timing"] = t

    frames = frame_index(gdir / "frames") if (gdir / "frames").exists() else []
    ph = {}
    for name in PHASES:
        fs = [f for f in frames if f[0] == name]
        if not fs:
            continue
        entry = {"frames": len(fs), "t0": fs[0][1], "t1": fs[-1][1]}
        pick = [fs[len(fs) // 2]] if len(fs) < 3 else [fs[len(fs) // 4], fs[len(fs) // 2], fs[3 * len(fs) // 4]]
        nums = [image_numbers(p[2]) for p in pick]
        entry["numbers"] = {k: round(st.mean(n[k] for n in nums), 3) if k != "colors95" else int(st.median(n[k] for n in nums))
                            for k in ("colors95", "soft", "lum", "sat", "achromatic")}
        entry["top"] = nums[len(nums) // 2]["top"]
        ph[name] = entry
    rec["phases"] = ph
    rec["frames_total"] = len(frames)
    return rec


def build_transcripts(kit: Path, slots: dict) -> dict:
    names = {g["symbol"]: g["name"] for g in slots["games"]}
    gdirs = sorted(p for p in (kit / "games").iterdir() if (p / "timeline.json").exists())
    games = [digest_game(p, names) for p in gdirs]
    return {
        "source": "the user's 「PP抄錄」 kit, games/<symbol>/ (timeline.json, init.txt, frames/)",
        "captured": "2026-10-08",
        "viewport": [1280, 720],
        "note": ("panel holds are capped near 6 s: the capture script clicks a panel after 6 s with no "
                 "server request. vswaysdogs' FG stopped at a pick screen (1 spin). Wolf Gold has no buy."),
        "layout": {
            "spin_button": [0.775, 0.905],
            "bet_minus_plus": "either side of spin, AUTOPLAY under it",
            "info_menu_sound": [[0.11, 0.91], [0.14, 0.95]],
            "credit_bet": "bottom left, two lines, right of INFO",
            "win": "bottom centre",
            "buy_panel": "left of the board (2019+ titles), stacked BUY FREE SPINS / ante DOUBLE CHANCE",
            "intro_enter_button": [0.845, 0.60],
            "intro_footer": "DON'T SHOW NEXT TIME checkbox + volatility badge under the enter button",
        },
        "games": games,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--kit", type=Path, default=DEFAULT_KIT)
    ap.add_argument("--measure", action="store_true", help="measure cached thumbnails")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    if not (a.kit / "catalog" / "games.json").exists():
        print(f"no kit at {a.kit} (set --kit or $PP_STYLE_KIT)", file=sys.stderr)
        return 1
    slots = build_slots(a.kit, a.measure)
    tx = build_transcripts(a.kit, slots)
    fam = Counter(g["family"] for g in slots["games"])
    print(f"catalog: {slots['count']} titles; families {dict(fam)}")
    for g in tx["games"]:
        t = g["timing"]
        print(f"  {g['symbol']:15} {g['name'][:28]:28} load {t['loading_s']}s  spin med {t['spin_presentation_median_s']}s"
              f"  fg {t.get('fg_spins')} spins / {t.get('fg_total_s')}s  frames {g['frames_total']}")
    if a.write:
        SLOTS.write_text(json.dumps(slots, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        OUT.write_text(json.dumps(tx, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"wrote {SLOTS.name} ({SLOTS.stat().st_size // 1024} KB), {OUT.name} ({OUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
