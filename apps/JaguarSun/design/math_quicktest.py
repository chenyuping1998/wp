#!/usr/bin/env python3
"""Quick read of what the published maths actually pays.

Everything here comes from the lookup tables, not from the raw simulation: the
tables carry the weights the RGS draws against, so they are what a player meets.
Reading the books instead would describe the simulation pool, which is a
different distribution and always looks flatter than the game.

    python design/math_quicktest.py <bundle-dir>

Book amounts are in units where 100 = 1x the base stake. Buy modes quote their
payouts against the BASE stake too, so their RTP divides by the mode's cost.
"""

import csv
import io
import json
import os
import sys
from collections import Counter

import zstandard as zstd

UNITS = 100
MODE_COST = {"base": 1, "bonus": 100, "bonus_hits": 250, "bonus_epic": 500}
MODE_LABEL = {
    "base": "Base game",
    "bonus": "Neon Nights (buy 100x)",
    "bonus_hits": "Sunset Hits (buy 250x)",
    "bonus_epic": "Ocean Drive (buy 500x)",
}
BUCKETS = [
    ("0 (no win)", 0, 0),
    ("0 - 1x", 0, 1),
    ("1 - 5x", 1, 5),
    ("5 - 20x", 5, 20),
    ("20 - 100x", 20, 100),
    ("100 - 1,000x", 100, 1_000),
    ("1,000 - 10,000x", 1_000, 10_000),
    ("10,000x +", 10_000, float("inf")),
]


def load_table(path):
    rows = []
    for r in csv.reader(open(path)):
        rows.append((float(r[1]), float(r[2]) / UNITS))
    return rows


def hit_str(p):
    return "never" if p <= 0 else f"1 in {1 / p:,.0f}"


def read_books(path, limit=None):
    with open(path, "rb") as fh:
        with zstd.ZstdDecompressor().stream_reader(fh) as reader:
            for i, line in enumerate(io.TextIOWrapper(reader, encoding="utf8")):
                if limit and i >= limit:
                    return
                if line.strip():
                    yield json.loads(line)


def main(bundle):
    print()
    print("=" * 78)
    print("  HOT MIAMI - MATHS QUICK TEST".ljust(60) + f"{'5x4, 14 lines':>16}")
    print("=" * 78)

    # ---- per mode, from the weighted lookup tables -------------------------
    print()
    print(f"  {'Mode':<24}{'RTP':>8}{'Hit rate':>11}{'Volatility':>12}{'Max win':>22}")
    print("  " + "-" * 74)
    for mode, cost in MODE_COST.items():
        rows = load_table(os.path.join(bundle, f"lookUpTable_{mode}_0.csv"))
        total = sum(w for w, _ in rows)
        mean = sum(w * p for w, p in rows) / total
        rtp = mean / cost
        hit = sum(w for w, p in rows if p > 0) / total
        var = sum(w * (p - mean) ** 2 for w, p in rows) / total
        sd = var**0.5
        top = max(p for _, p in rows)
        top_w = sum(w for w, p in rows if p >= top - 1e-9) / total
        print(
            f"  {MODE_LABEL[mode]:<24}{rtp * 100:>7.2f}%"
            f"{hit * 100:>10.1f}%"
            f"{sd / cost:>12.1f}"
            f"{top:>12,.0f}x {hit_str(top_w):>9}"
        )
    print()
    print("  Volatility is the standard deviation of the round payout in units of")
    print("  the mode's own cost. Higher = the same RTP delivered in fewer, bigger")
    print("  hits. Max win hit rate is per round of that mode.")

    # ---- win distribution, base game ---------------------------------------
    rows = load_table(os.path.join(bundle, "lookUpTable_base_0.csv"))
    total = sum(w for w, _ in rows)
    print()
    print("  BASE GAME - where the return comes from")
    print("  " + "-" * 74)
    print(f"  {'Payout band':<20}{'Frequency':>14}{'Share of RTP':>16}{'':>10}")
    for label, lo, hi in BUCKETS:
        if lo == 0 and hi == 0:
            sel = [(w, p) for w, p in rows if p == 0]
        else:
            sel = [(w, p) for w, p in rows if lo < p <= hi]
        freq = sum(w for w, _ in sel) / total
        share = sum(w * p for w, p in sel) / total / (sum(w * p for w, p in rows) / total)
        bar = "#" * int(round(share * 40))
        print(f"  {label:<20}{freq * 100:>13.2f}%{share * 100:>15.1f}%  {bar}")

    # ---- feature behaviour, from the books ---------------------------------
    #
    # Weighted by the lookup table, not counted raw. The book files are the
    # simulation pool and its composition is set by the distribution quotas in
    # game_config.py — the `freegame` criteria has a quota of 0.1, so one book in
    # ten reaches free spins no matter what the game does. Counting books would
    # therefore report the quota back rather than the trigger rate. The weights
    # are what the RGS draws against, so they are what a player meets.
    print()
    print("  FEATURE BEHAVIOUR (weighted by the lookup table)")
    print("  " + "-" * 74)
    for mode in ("base", "bonus"):
        books_path = os.path.join(bundle, f"books_{mode}.jsonl.zst")
        lut_path = os.path.join(bundle, f"lookUpTable_{mode}_0.csv")
        if not os.path.exists(books_path):
            continue
        weights = {}
        for r in csv.reader(open(lut_path)):
            weights[int(r[0])] = float(r[1])
        total_w = sum(weights.values())

        w_rounds = w_fg_rounds = 0.0
        w_fg_spins = w_collector = w_fg_win = 0.0
        w_frames = 0.0
        mult = Counter()
        for book in read_books(books_path):
            w = weights.get(int(book["id"]), 0.0)
            if w == 0.0:
                continue
            w_rounds += w
            gametype = None
            saw_fg = False
            for e in book["events"]:
                t = e["type"]
                if t == "reveal":
                    # winInfo carries no gametype of its own, so the spin it
                    # belongs to has to be tracked from the reveal before it —
                    # otherwise base-game wins get counted against free spins.
                    gametype = e.get("gameType")
                    if gametype == "freegame":
                        w_fg_spins += w
                        saw_fg = True
                        # visible rows only: the event board carries a padding
                        # row top and bottom that the player never sees
                        if any(s["name"] == "C" for col in e["board"] for s in col[1:-1]):
                            w_collector += w
                elif t == "newFrames":
                    for f in e["frames"]:
                        mult[f["mult"]] += w
                        if gametype == "freegame":
                            w_frames += w
                elif t == "winInfo" and gametype == "freegame":
                    w_fg_win += w
            if saw_fg:
                w_fg_rounds += w

        tot_m = sum(mult.values()) or 1.0
        print(f"  {MODE_LABEL[mode]}")
        if mode == "base":
            print(
                f"    reaches free spins          {w_fg_rounds / w_rounds * 100:>9.3f}%"
                f"   ({hit_str(w_fg_rounds / w_rounds)})"
            )
        print(f"    free spins per triggering round {w_fg_spins / max(w_fg_rounds, 1e-9):>6.1f}")
        if w_fg_spins:
            print(f"    free spins with a Collector {w_collector / w_fg_spins * 100:>9.1f}%")
            print(f"    free spins with a line win  {w_fg_win / w_fg_spins * 100:>9.1f}%")
            print(f"    new Frames per free spin    {w_frames / w_fg_spins:>10.2f}")
        big = sum(v for k, v in mult.items() if k >= 10) / tot_m
        elite = sum(v for k, v in mult.items() if k >= 25) / tot_m
        print(f"    Frame values 10x+           {big * 100:>9.1f}%")
        print(f"    Frame values 25x+           {elite * 100:>9.1f}%")
        print()

    print("=" * 78)
    print()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "upload/HotMiami/math")
