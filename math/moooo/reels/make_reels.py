"""Deterministic reel-strip generator for Moooo.

Run from this directory:
    python make_reels.py

Reel composition is expressed as symbol counts per reel. The optimizer sets the
final RTP via lookup-table weights, so these counts control hit-rate and
volatility shape rather than RTP itself.

The MOOOO cow (`W`) is deliberately ABSENT from every strip. Cows are not drawn
from the reels: `place_cows` writes them onto the board after the draw, one per
reel at most, using the `cow_counts` weighting on the active distribution. That
is what gives each distribution control over how many cows a spin can show, and
it is what enforces the reference's "each reel can land only one" rule for free.
The cow is written in before the reveal event, so the player still sees it land.
"""

import csv
import os
import random

NUM_REELS = 5

# name -> per-reel counts (index 0 == leftmost reel)
#
#   L1-L4  royals, one pay tier wearing four faces
#   H5 H4  the shared premium tier
#   H3 H2 H1  the three premiums above it
#   S      free-spin scatter
#   M      Milk Churn, the free-game meter upgrade
BASE_COMPOSITION = {
    "L1": [9, 9, 9, 9, 9],
    "L2": [9, 9, 9, 9, 9],
    "L3": [9, 9, 9, 9, 9],
    "L4": [9, 9, 9, 9, 9],
    "H5": [8, 8, 8, 7, 7],
    "H4": [6, 6, 6, 6, 6],
    "H3": [5, 5, 5, 5, 5],
    "H2": [4, 4, 4, 4, 4],
    "H1": [3, 3, 3, 3, 3],
    "S": [1, 1, 1, 2, 2],
    # The Milk Churn only means something while a Milk Meter exists, and the
    # meters only exist inside the feature. None on the base strip.
    "M": [0, 0, 0, 0, 0],
}

# The strip the feature-triggering books are generated on.
#
# It has to exist. The freegame and wincap distributions carry
# `force_freegame: True` with an exact `scatter_triggers` count, and
# `force_special_board` gets there by rejection - it redraws until the board
# happens to show exactly 3 or 4 scatters. On the thinned BASE strip a 4-scatter
# board is rare enough that the run would crawl; three scatters per reel brings
# it back to a cheap draw.
#
# Everything except the scatters is BASE, so a trigger board is the same game
# the player was already looking at. This is not a hidden second base game:
# those books ARE the trigger spins, and a 3+ scatter board cannot occur in any
# other base distribution anyway (`draw_board` redraws them away).
TRIGGER_COMPOSITION = dict(BASE_COMPOSITION)
TRIGGER_COMPOSITION["S"] = [3, 3, 3, 3, 3]
# Pay the extra scatters for out of the two commonest royals, so strip length
# and the premium mix are untouched. Reels 1-3 give up two royals each
# (scatters 1 -> 3); reels 4 and 5 give up one (scatters 2 -> 3). The assert in
# main() is what catches this being wrong: every reel in a strip must come to
# exactly the same length or the CSV goes ragged and the config loader trips on
# an empty cell.
TRIGGER_COMPOSITION["L1"] = [8, 8, 8, 8, 8]
TRIGGER_COMPOSITION["L2"] = [8, 8, 8, 9, 9]

# Free game: richer in premiums, and the only strip carrying Milk Churns.
#
# Two churns per reel in 64 positions over a 4-row window is about a 12% chance
# that a given reel shows one on a given spin, so across a 10-spin feature a
# reel averages a little over one upgrade. That is the shape the meter wants:
# most reels finish at level 2, a few reach 3, and none of it is guaranteed.
FREE_COMPOSITION = {
    "L1": [11, 11, 10, 9, 9],
    "L2": [9, 9, 9, 9, 9],
    "L3": [8, 8, 8, 8, 8],
    "L4": [7, 7, 7, 7, 7],
    "H5": [7, 7, 7, 7, 7],
    "H4": [6, 6, 6, 6, 6],
    "H3": [6, 6, 6, 6, 6],
    "H2": [5, 5, 5, 5, 5],
    "H1": [4, 4, 4, 4, 4],
    "S": [0, 0, 1, 2, 2],
    "M": [1, 1, 1, 1, 1],
}

# Wincap-hunting strip: dense in H1 so that forced max-win simulations converge
# without distorting the standard strips. The cap is reached through a five of a
# kind on the top premium multiplied by summed Champion bells, so H1 density is
# the lever that matters here.
WINCAP_COMPOSITION = {
    "L1": [4, 4, 4, 4, 4],
    "L2": [4, 4, 4, 4, 4],
    "L3": [4, 4, 4, 4, 4],
    "L4": [4, 4, 4, 4, 4],
    "H5": [6, 6, 6, 6, 6],
    "H4": [6, 6, 6, 6, 6],
    "H3": [7, 7, 7, 7, 7],
    "H2": [8, 8, 8, 8, 8],
    "H1": [16, 16, 16, 16, 16],
    "S": [1, 1, 1, 1, 1],
    "M": [3, 3, 3, 3, 3],
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
        ("BR1.csv", TRIGGER_COMPOSITION, 20260816),
        ("FR0.csv", FREE_COMPOSITION, 20260803),
        ("WCAP.csv", WINCAP_COMPOSITION, 20260804),
    ):
        # Every reel in a strip must come to the same length. write_csv asserts
        # this too, but only after the shuffle - catching it here names the file
        # and the counts, which is what you need to fix the composition.
        # (Lengths differ BETWEEN strips: FR0 is 64, the others 63. That is
        # fine; the requirement is within a strip.)
        totals = [sum(counts[reel] for counts in composition.values()) for reel in range(NUM_REELS)]
        assert len(set(totals)) == 1, f"{filename} reels are ragged: {totals}"
        assert "W" not in composition, f"{filename}: cows are placed, never drawn - keep W off the strips"
        reels = build_reels(composition, seed)
        write_csv(os.path.join(here, filename), reels)
        counts = {}
        for sym in reels[0]:
            counts[sym] = counts.get(sym, 0) + 1
        print(f"  reel-1 composition: {counts}")


if __name__ == "__main__":
    main()
