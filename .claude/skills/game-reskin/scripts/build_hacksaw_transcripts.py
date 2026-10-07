#!/usr/bin/env python3
"""Digest the Hacksaw whole-game style transcription into references/hacksaw-style-transcripts.json.

The transcription is the `materials/style-library/` folder of the user's
research kit (hacksaw-motion-kit, 2026-10-06): one folder per game with
`style.json` (numbers read out of gameconfig.json, the .atlas files, the spine
.json files and main.js), `style.md` (the same, written up), `shots/`,
`palette.png`, `crops/` and `states/`. Those folders hold Hacksaw's own art and
code and stay outside the repo. This script keeps only the numbers and names:
no pixels, no source code, nothing that could be shipped.

What it keeps per game (see hacksaw-style-transcripts.md for what each means):
  shape / max win / mechanics   from the rules page text
  preloader                     progress-bar geometry and colours
  text                          every text-style role: font, size, colour, outline, shadow
  splash                        intro-panel config (panel count, header keys, spacing)
  reel                          spinRevealProps per speed (normal / turbo / superTurbo), default mode
  tiers                         win-presentation ladder: threshold x bet, label, ms
  spine                         every skeleton: bones, canvas, animations with seconds, events
  atlases                       every atlas: page size, region count, region names
  palette                       per atlas region kind (bg / splash / other): top colours
  sounds                        count and cue names per group
  states                        state classes, scenes, events, distinct after(x) waits
  cameras, asset size, shots available

usage:
  build_hacksaw_transcripts.py [--lib PATH] [--write]

Without --write it only prints a summary. --lib defaults to $HACKSAW_STYLE_LIBRARY
or /Users/stone/stake-engine/research/hacksaw-motion-kit/materials/style-library.
"""

from __future__ import annotations

import argparse
import colorsys
import html
import json
import os
import re
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REF = HERE.parent / "references"
SLOTS = REF / "hacksaw-slots.json"
OUT = REF / "hacksaw-style-transcripts.json"
DEFAULT_LIB = Path(os.environ.get(
    "HACKSAW_STYLE_LIBRARY",
    "/Users/stone/stake-engine/research/hacksaw-motion-kit/materials/style-library"))

# Titles in the transcription that the 2026-09-27 lobby survey does not list.
# Tagged by eye from their in-game shots, 2026-10-06.
EXTRA_FAMILY = {
    2253: ("cartoon", "cartoon", "mad-science", "Dr Zappo: thick outline, flat fills, two mascots either side"),
    2582: ("cartoon", "cartoon", "horror", "Le Vampire: the Le raccoon in a cape"),
}
NON_SLOT = {"crash", "instant-win-games", "scratchcards"}
# `slots/` is a second copy of Le Vampire (same gameId 2582, same 497 files):
# the recorder landed on the lobby's generic "Slots" page. Skipped.
DUPLICATE = {"slots"}


def r3(x):
    return round(x, 3) if isinstance(x, float) else x


def hsv(hexs: str):
    h = hexs.split()[0].lstrip("#")
    return colorsys.rgb_to_hsv(*(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)))


def rules_digest(rules: list[dict]) -> dict:
    txt = " ".join(t for r in rules for t in r.get("text", []))
    shape = re.search(r"(\d+)-reel,\s*(\d+)-row", txt)
    maxwin = re.search(r"maximum win of ([\d,]+)\s*(?:times|x)", txt)
    mech = sorted({k for k, pat in {
        "paylines": r"payline", "ways": r"\bways\b", "cluster": r"cluster",
        "cascade": r"cascad|\bdrop", "respin": r"respin", "hold-and-win": r"hold (?:&|and) win",
        "gamble": r"gamble", "featurespins": r"featurespins",
    }.items() if re.search(pat, txt, re.I)})
    titles = [r["title"] for r in rules if r.get("title") and r["title"] not in {
        "GENERAL", "ADDITIONAL INFORMATION", "INTERRUPTED GAME", "GENERAL TERMS AND CONDITIONS",
        "HISTORY", "WAYS TO WIN", "ABOUT THE GAME", "FEATURES", "SYMBOL PAYOUTS", "BONUS BUY", "SPECIAL SYMBOLS", "RETURN TO PLAYER"}]
    about = next((r["text"] for r in rules if r.get("title") == "ABOUT THE GAME"), [])
    return dict(
        shape=f"{shape.group(1)}x{shape.group(2)}" if shape else None,
        max_win=int(maxwin.group(1).replace(",", "")) if maxwin and int(maxwin.group(1).replace(",", "")) >= 100 else None,
        mechanics=mech,
        feature_titles=titles,
        pitch=(about[0] if about else "")[:240],
    )


def text_digest(ts: dict) -> dict:
    out = {}
    for role, t in ts.items():
        d = dict(font=t.get("font"), size=t.get("size"), color=t.get("color"))
        if t.get("outlineColor") and t.get("outlineWidth"):
            d["outline"] = [t["outlineColor"], r3(t["outlineWidth"])]
        if t.get("outlineColor2") and t.get("outlineWidth2"):
            d["outline2"] = [t["outlineColor2"], r3(t["outlineWidth2"])]
        if t.get("shadowDistance") or t.get("shadowColor"):
            d["shadow"] = [t.get("shadowColor"), r3(t.get("shadowDistance")), r3(t.get("shadowRadius"))]
        if t.get("letterSpacing") not in (None, 0):
            d["tracking"] = r3(t["letterSpacing"])
        d["strings"] = t.get("strings", [])[:6]
        out[role] = d
    return out


def reel_digest(rt: dict) -> dict:
    out = {}
    for speed, modes in rt.items():
        for m in modes:
            key = speed if m["mode"] == "default" else f"{speed}:{m['mode']}"
            out[key] = {k: r3(v) for k, v in m["values"].items()}
    return out


def tiers_digest(defs: list[str]) -> list:
    rows = []
    for s in defs or []:
        p = s.split(",")
        try:
            rows.append([float(p[0]), p[1].strip('"'), int(float(p[2])) if p[2] != "null" else None])
        except (ValueError, IndexError):
            pass
    return rows


def spine_digest(sp: list[dict]) -> list:
    return [dict(name=s["skeleton"], v=s.get("spine"), bones=s.get("bones"),
                 size=[round(x) if isinstance(x, (int, float)) else None for x in (s.get("size") or [])],
                 anims={a: r3(d) for a, d in s.get("anims", {}).items()},
                 events=s.get("events") or [])
            for s in sp]


def atlas_digest(at: list[dict]) -> tuple[list, dict]:
    atlases, pal = [], defaultdict(Counter)
    for a in at:
        kind = ("bg" if re.search(r"background|^bg|_bg$", a["atlas"]) else
                "splash" if "splash" in a["atlas"] else
                "digits" if a["atlas"].startswith("digits") else "other")
        atlases.append(dict(name=a["atlas"], page=a.get("size"), regions=a.get("region_count"),
                            names=[r["name"] for r in a["regions"]][:40]))
        if kind == "digits":
            continue
        for r in a["regions"]:
            for c in (r.get("palette") or [])[:6]:
                pal[kind][c["hex"].split()[0]] += c["share"] * r["w"] * r["h"]
    palette = {}
    for kind, cnt in pal.items():
        tot = sum(cnt.values()) or 1
        cols = cnt.most_common()
        sv = [(hsv(h), w) for h, w in cols]
        palette[kind] = dict(
            top=[[h, round(w / tot, 3)] for h, w in cols[:10]],
            sat=round(sum(s[1] * w for s, w in sv) / tot, 3),
            val=round(sum(s[2] * w for s, w in sv) / tot, 3),
            dark=round(sum(w for s, w in sv if s[2] < 0.2) / tot, 3),
            grey=round(sum(w for s, w in sv if s[1] < 0.12) / tot, 3),
        )
    return atlases, palette


def states_digest(states: dict) -> dict:
    out = {}
    for cls, v in states.items():
        # after(.3), and the ternary form after(a?0:.5) the minifier makes of a skip
        waits = sorted({float(x) for n in v.get("numbers", [])
                        for m in re.finditer(r"after\(([^()]{1,24})\)", n["context"])
                        for x in re.findall(r"(?<![\w.])(\d*\.?\d+)(?![\w.])", m.group(1))})
        dims = sorted({float(m.group(1)) for n in v.get("numbers", [])
                       for m in [re.search(r"new Z\(([\d.]+),\1,\1,null\)", n["context"])] if m})
        fades = sorted({float(m.group(1)) for n in v.get("numbers", [])
                        for m in [re.search(r"new Ta\(\w+,([\d.]+)", n["context"])] if m})
        d = {}
        if v.get("scenes"):
            d["scenes"] = v["scenes"]
        if v.get("events"):
            d["events"] = v["events"]
        if v.get("spine_anims"):
            d["spine_anims"] = v["spine_anims"]
        if waits:
            d["after"] = waits
        if dims:
            d["tint"] = dims
        if fades:
            d["fade"] = fades
        out[cls] = d
    return out


def digest(g: dict, slot: dict | None, folder: Path) -> dict:
    gid = int(g["gameId"])
    if slot:
        family, key, theme, note = slot["family"], slot["style_key"], slot["theme"], ""
    elif gid in EXTRA_FAMILY:
        family, key, theme, note = EXTRA_FAMILY[gid]
    else:
        family, key, theme, note = ("non-slot" if g["slug"] in NON_SLOT else "untagged"), "", "", ""
    atlases, palette = atlas_digest(g.get("atlases", []))
    sp = g.get("config_other", {}).get("splash")
    splash = None
    if sp:
        splash = dict(panels=len(sp.get("splashes", [])),
                      headers=[p.get("header") for p in sp.get("splashes", [])],
                      x_spacing=sp.get("xSpacing"), header_max_w=sp.get("headerMaxWidth"),
                      body_max=[sp.get("bodyMaxWidth"), sp.get("bodyMaxHeight")],
                      top_header=sp.get("topHeader"), volatility=bool(sp.get("volatilityPos")))
    shots = sorted({Path(s).stem for s in g.get("shots", [])})
    return dict(
        slug=g["slug"], folder=folder.name, name=html.unescape(g["name"]), id=gid, version=g["version"],
        family=family, style_key=key, theme=theme, note=note,
        **rules_digest(g.get("rules", [])),
        asset=g.get("asset_tree"),
        preloader=(g.get("preloader") or {}).get("progress"),
        fonts=sorted({t["font"] for t in g.get("text_styles", {}).values() if t.get("font")}),
        text=text_digest(g.get("text_styles", {})),
        splash=splash,
        countup=g.get("config_other", {}).get("countup"),
        reel=reel_digest(g.get("reel_timing", {})),
        tiers=tiers_digest(g["bundle"].get("tier_defs")),
        spine=spine_digest(g.get("spine", [])),
        atlases=atlases,
        palette=palette,
        sounds=dict(count=g["sounds"]["count"], groups=g["sounds"]["groups"]),
        states=states_digest(g["bundle"].get("states", {})),
        cameras=g["bundle"].get("cameras"),
        shots=shots,
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lib", type=Path, default=DEFAULT_LIB)
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    if not a.lib.is_dir():
        print(f"no style library at {a.lib} (set --lib or HACKSAW_STYLE_LIBRARY)", file=sys.stderr)
        return 1
    slots = {g["id"]: g for g in json.loads(SLOTS.read_text(encoding="utf-8"))["games"]}
    games = []
    for f in sorted(a.lib.glob("*/style.json")):
        if f.parent.name in DUPLICATE:
            continue
        g = json.loads(f.read_text(encoding="utf-8"))
        games.append(digest(g, slots.get(int(g["gameId"])), f.parent))
    fam = Counter(g["family"] for g in games)
    print(f"{len(games)} games from {a.lib}")
    print("  " + ", ".join(f"{k} {n}" for k, n in fam.most_common()))
    print(f"  with reel timing {sum(1 for g in games if g['reel'])}, with tier ladder "
          f"{sum(1 for g in games if g['tiers'])}, with splash config {sum(1 for g in games if g['splash'])}")
    if a.write:
        doc = dict(source="hacksaw-motion-kit/materials/style-library (user's research kit, 2026-10-06)",
                   library_default=str(DEFAULT_LIB), count=len(games),
                   rules="numbers and names only; Hacksaw's art and code stay in the research folder, never in the repo, a prompt or a build",
                   games=games)
        OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"wrote {OUT} ({OUT.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
