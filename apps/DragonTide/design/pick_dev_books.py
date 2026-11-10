"""Fill src/dev/devBooks.json (the ?mock=1 dev server) with real Dragon Tide books.

Picks one book per shape from the published set, so every presentation path can be
replayed locally: pearls that settle, pearls on a spin with no win, S pay, a feature
trigger, a big TOTAL, a retrigger, the super buy, an EXTRA BET spin.

  /Applications/anaconda3/envs/math-sdk/bin/python design/pick_dev_books.py
"""
import io
import json
from pathlib import Path

import zstandard as zstd

PUB = Path(__file__).resolve().parents[4] / "math-sdk/games/dragon_tide/library/publish_files"
OUT = Path(__file__).resolve().parents[1] / "src/dev/devBooks.json"


def books(mode):
    # streamed line by line: the bonus books are ~2 GB once decompressed
    with open(PUB / f"books_{mode}.jsonl.zst", "rb") as f:
        for line in io.TextIOWrapper(zstd.ZstdDecompressor().stream_reader(f), encoding="utf-8"):
            yield json.loads(line)


def types(b):
    return [e["type"] for e in b["events"]]


def spins(b):
    """Events split per spin (each starts at a reveal)."""
    out, cur = [], []
    for e in b["events"]:
        if e["type"] == "reveal" and cur:
            out.append(cur)
            cur = []
        cur.append(e)
    out.append(cur)
    return out


def pearls_on(spin):
    n = 0
    for e in spin:
        if e["type"] == "reveal":
            n += sum(s["name"] == "M" for col in e["board"] for s in col[1:-1])
        if e["type"] == "tumbleBoard":
            n += sum(s["name"] == "M" for col in e["newSymbols"] for s in col[1:])
    return n


def top_pearl(spin):
    """Largest visible pearl of a spin (reveal rows 1-5 and refill drops)."""
    vals = [0]
    for e in spin:
        if e["type"] == "reveal":
            vals += [s.get("multiplier", 0) for col in e["board"] for s in col[1:-1] if s["name"] == "M"]
        if e["type"] == "tumbleBoard":
            vals += [s.get("multiplier", 0) for col in e["newSymbols"] for s in col[1:] if s["name"] == "M"]
    return max(vals)


def first(mode, pred, limit=100000):
    for i, b in enumerate(books(mode)):
        if i > limit:
            break
        if pred(b):
            return b
    raise SystemExit(f"no book in {mode} for a predicate")


def base_only(b):
    return "freeSpinTrigger" not in types(b)


picks = {
    "baseWin": first("base", lambda b: base_only(b) and "tumbleBoard" in types(b) and pearls_on(spins(b)[0]) == 0 and b["payoutMultiplier"] >= 150),
    "basePearl": first("base", lambda b: base_only(b) and "boardMultiplierInfo" in types(b)),
    "basePearlMulti": first("base", lambda b: base_only(b) and any(e["type"] == "boardMultiplierInfo" and len(e["multInfo"]["positions"]) >= 2 for e in b["events"])),
    "basePearlNoWin": first("base", lambda b: base_only(b) and b["payoutMultiplier"] == 0 and pearls_on(spins(b)[0]) >= 1),
    "baseRefillPearl": first("base", lambda b: base_only(b) and "boardMultiplierInfo" in types(b) and any(e["type"] == "tumbleBoard" and any(s["name"] == "M" for col in e["newSymbols"] for s in col[1:]) for e in b["events"])),
    # x100+ pearls (board shake + quake): wasted on a spin with no win, and settling a win
    "baseHeavyNoWin": first("base", lambda b: base_only(b) and b["payoutMultiplier"] == 0 and 100 <= top_pearl(spins(b)[0]) < 250),
    "baseTopNoWin": first("base", lambda b: base_only(b) and b["payoutMultiplier"] == 0 and top_pearl(spins(b)[0]) >= 250),
    "baseHeavyWin": first("base", lambda b: base_only(b) and "boardMultiplierInfo" in types(b) and 100 <= top_pearl(spins(b)[0]) < 250),
    "baseTopWin": first("base", lambda b: base_only(b) and "boardMultiplierInfo" in types(b) and top_pearl(spins(b)[0]) >= 250),
    "baseScatterPay": first("base", lambda b: b["payoutMultiplier"] < 200000 and any(e["type"] == "winInfo" and e["wins"] and e["wins"][0]["symbol"] == "S" for e in b["events"])),
    "baseTrigger": first("base", lambda b: "freeSpinTrigger" in types(b) and 50 <= b["payoutMultiplier"] / 100 <= 400),
    "anteSpin": first("ante", lambda b: base_only(b) and b["payoutMultiplier"] > 0),
    "bonusPlain": first("bonus", lambda b: 30 <= b["payoutMultiplier"] / 100 <= 150),
    "bonusBigTotal": max((b for i, b in zip(range(20000), books("bonus")) if b["payoutMultiplier"] < 2000000), key=lambda b: max([e["globalMult"] for e in b["events"] if e["type"] == "updateGlobalMult"] or [0])),
    "bonusWincap": first("bonus", lambda b: b["payoutMultiplier"] == 2000000),
    "bonusRetrigger": first("bonus", lambda b: "freeSpinRetrigger" in types(b)),
    "superBuy": first("super_bonus", lambda b: 150 <= b["payoutMultiplier"] / 100 <= 800),
}

out = {k: [{"id": b["id"], "payoutMultiplier": b["payoutMultiplier"], "state": b["events"]}] for k, b in picks.items()}
OUT.write_text(json.dumps(out))
for k, b in picks.items():
    gm = max([e["globalMult"] for e in b["events"] if e["type"] == "updateGlobalMult"] or [0])
    print(f"{k:16s} id {b['id']:6d}  {b['payoutMultiplier']/100:9.2f}x  events {len(b['events']):4d}  maxTOTAL {gm}")
