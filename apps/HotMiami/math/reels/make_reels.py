"""Deterministic reel-strip generator for Hot Miami.

Run from this directory:
    python make_reels.py

Reel composition is expressed as symbol counts per reel. The optimizer sets the
final RTP via lookup-table weights, so these counts control hit-rate and
volatility shape rather than RTP itself.
"""

import csv
import os
import random

NUM_REELS = 5

# name -> per-reel counts (index 0 == leftmost reel)
BASE_COMPOSITION = {
    "L1": [9, 9, 9, 9, 9],
    "L2": [9, 9, 9, 9, 9],
    # Reel 1 carries two extra lows in place of the wild, so every strip stays
    # the same length (ragged strips would leave empty cells in the CSV).
    "L3": [9, 8, 8, 8, 8],
    "L4": [9, 8, 8, 8, 8],
    "H5": [7, 7, 7, 7, 7],
    "H4": [6, 6, 6, 6, 6],
    "H3": [5, 5, 5, 5, 5],
    "H2": [4, 4, 4, 4, 4],
    "H1": [3, 3, 3, 3, 3],
    # No wild on reel 1 - standard lines-game convention, keeps 5-OAK wild rare.
    "W": [0, 2, 2, 2, 2],
    "S": [2, 2, 2, 2, 2],
    "C": [1, 1, 1, 1, 1],
}

# Free game: richer in high symbols, wild on every reel, fewer scatters
# (retriggers stay meaningful but not frequent).
FREE_COMPOSITION = {
    "L1": [8, 8, 8, 8, 8],
    "L2": [8, 8, 8, 8, 8],
    "L3": [7, 7, 7, 7, 7],
    "L4": [7, 7, 7, 7, 7],
    "H5": [7, 7, 7, 7, 7],
    "H4": [6, 6, 6, 6, 6],
    "H3": [6, 6, 6, 6, 6],
    "H2": [5, 5, 5, 5, 5],
    "H1": [4, 4, 4, 4, 4],
    "W": [3, 3, 3, 3, 3],
    "S": [1, 1, 1, 1, 1],
    "C": [2, 2, 2, 2, 2],
}

# Wincap-hunting strip: dense in high symbols and wilds so that forced max-win
# simulations converge without distorting the standard strips.
WINCAP_COMPOSITION = {
    "L1": [4, 4, 4, 4, 4],
    "L2": [4, 4, 4, 4, 4],
    "L3": [4, 4, 4, 4, 4],
    "L4": [4, 4, 4, 4, 4],
    "H5": [6, 6, 6, 6, 6],
    "H4": [6, 6, 6, 6, 6],
    "H3": [7, 7, 7, 7, 7],
    "H2": [8, 8, 8, 8, 8],
    "H1": [10, 10, 10, 10, 10],
    "W": [6, 6, 6, 6, 6],
    "S": [1, 1, 1, 1, 1],
    "C": [3, 3, 3, 3, 3],
}


def build_reels(composition, seed):
    """Build one reel strip per reel, shuffled deterministically."""
    rng = random.Random(seed)
    reels = []
    for reel_index in range(NUM_REELS):
        strip = []
        for name, counts in composition.items():
            strip.extend([name] * counts[reel_index])
        rng.shuffle(strip)
        strip = despace_adjacent(strip, rng)
        reels.append(strip)
    return reels


def despace_adjacent(strip, rng, max_passes=200):
    """Avoid identical neighbours (including wrap-around) where possible.

    Adjacent duplicates on a strip create unintended stacked symbols, which
    skews hit-rate in a 4-row window.
    """
    n = len(strip)
    for _ in range(max_passes):
        clashes = [i for i in range(n) if strip[i] == strip[(i + 1) % n]]
        if not clashes:
            break
        i = clashes[0]
        candidates = [
            j
            for j in range(n)
            if strip[j] != strip[i]
            and strip[j] != strip[(i + 1) % n]
            and strip[(j - 1) % n] != strip[i]
            and strip[(j + 1) % n] != strip[i]
        ]
        if not candidates:
            break
        j = rng.choice(candidates)
        strip[i], strip[j] = strip[j], strip[i]
    return strip


def write_csv(path, reels):
    """Write reels as columns; one CSV row per strip position.

    All strips must be the same length: the reader asserts on empty cells, so a
    ragged strip would break config loading. No trailing newline is written,
    matching the stock reel files.
    """
    lengths = {len(r) for r in reels}
    assert len(lengths) == 1, f"reel strips must be equal length, got {sorted(lengths)}"
    length = lengths.pop()

    rows = [",".join(reels[reel][row_index] for reel in range(NUM_REELS)) for row_index in range(length)]
    with open(path, "w", encoding="UTF-8") as handle:
        handle.write("\n".join(rows))
    print(f"wrote {path} ({length} positions x {NUM_REELS} reels)")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    for filename, composition, seed in (
        ("BR0.csv", BASE_COMPOSITION, 20260802),
        ("FR0.csv", FREE_COMPOSITION, 20260803),
        ("WCAP.csv", WINCAP_COMPOSITION, 20260804),
    ):
        reels = build_reels(composition, seed)
        write_csv(os.path.join(here, filename), reels)
        counts = {}
        for sym in reels[0]:
            counts[sym] = counts.get(sym, 0) + 1
        print(f"  reel-1 composition: {counts}")


if __name__ == "__main__":
    main()
