"""Write Sushi Monkey's reel strips (reels/BR0.csv, FR0.csv, FRWCAP.csv).

Deterministic (fixed seed) so a re-run reproduces the same strips. Counts are
per reel, per strip; W never sits on reel 1 (the SDK's ways evaluator cannot
start a win with a wild on the first reel), and S / W / P are spaced so that one
4-row window rarely shows two of the same special.

    python make_reels.py
"""

import csv
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
ROWS = 4

PAY = ["H1", "H2", "H3", "H4", "L1", "L2", "L3", "L4", "L5"]

STRIPS = {
    # base: sacks common enough to be seen every spin, Bandits rare enough that
    # a collection is an event.
    "BR0": {
        "pay": [7, 8, 9, 10, 11, 11, 12, 12, 13],
        "P": [4, 4, 4, 4, 4],
        "W": [0, 1, 1, 1, 1],
        "S": [2, 2, 2, 2, 2],
        "stack": 2,
    },
    # free spins: more sacks and more Bandits; no Scatters (no retrigger).
    "FR0": {
        "pay": [5, 6, 7, 8, 11, 12, 13, 14, 15],
        "P": [12, 12, 12, 12, 12],
        "W": [0, 2, 2, 2, 2],
        "S": [0, 0, 0, 0, 0],
        "stack": 2,
    },
    # max-win chase strip.
    "FRWCAP": {
        "pay": [6, 6, 6, 6, 6, 6, 6, 6, 6],
        "P": [30, 30, 30, 30, 30],
        "W": [0, 10, 10, 10, 10],
        "S": [0, 0, 0, 0, 0],
        "stack": 2,
    },
}

SPACING = {"S": ROWS, "W": ROWS, "P": 1}


def build_reel(rng, spec, reel):
    specials = []
    for sym in ("S", "W", "P"):
        specials += [sym] * spec[sym][reel]
    pays = []
    for sym, n in zip(PAY, spec["pay"]):
        # short stacks of the same pay symbol, as ways games use
        left = n
        while left > 0:
            k = min(left, rng.randint(1, spec["stack"]))
            pays.append([sym] * k)
            left -= k
    for _ in range(2000):
        rng.shuffle(pays)
        strip = [s for block in pays for s in block]
        ok = True
        # insert specials at spaced positions
        rng.shuffle(specials)
        placed = []
        for sym in specials:
            for _attempt in range(200):
                pos = rng.randrange(len(strip) + 1)
                gap = SPACING[sym]
                clash = False
                for p, s in placed:
                    if s == sym or {s, sym} == {"S", "W"}:
                        if abs(p - pos) < gap:
                            clash = True
                            break
                if not clash:
                    break
            else:
                ok = False
                break
            strip.insert(pos, sym)
            placed = [(p + (1 if p >= pos else 0), s) for p, s in placed] + [(pos, sym)]
        if ok:
            return strip
    raise RuntimeError(f"could not space specials on reel {reel}")


def main():
    rng = random.Random(20260930)
    os.makedirs(os.path.join(HERE, "reels"), exist_ok=True)
    for name, spec in STRIPS.items():
        reels = [build_reel(rng, spec, r) for r in range(5)]
        length = max(len(r) for r in reels)
        # pad shorter reels with low pays so the CSV is rectangular
        for r in reels:
            while len(r) < length:
                r.insert(rng.randrange(len(r)), "L5")
        with open(os.path.join(HERE, "reels", f"{name}.csv"), "w", newline="") as f:
            w = csv.writer(f)
            for i in range(length):
                w.writerow([reels[r][i] for r in range(5)])
        counts = {s: [r.count(s) for r in reels] for s in ("W", "P", "S")}
        print(name, "len", length, counts)


if __name__ == "__main__":
    main()
