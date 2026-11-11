"""Deterministic reel-strip generator for Capo Nostra.

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
    # 8 on the first three reels, 7 on the last two: the extra position is the
    # one freed by thinning the scatters below, and H5 is where it does the most
    # good — it is the cheapest premium, so it lifts mid-tier line frequency
    # rather than adding yet another low.
    "H5": [9, 8, 8, 7, 8],
    "H4": [6, 6, 6, 6, 6],
    "H3": [5, 5, 5, 5, 5],
    "H2": [4, 4, 4, 4, 4],
    "H1": [3, 3, 3, 3, 3],
    # No wild on reel 1 - standard lines-game convention, keeps 5-OAK wild rare.
    "W": [0, 2, 2, 2, 2],
    # Scatters thinned on the first three reels, 2,2,2,2,2 -> 1,1,1,2,2.
    #
    # Anticipation starts on the reel AFTER the board's running scatter count
    # reaches 2 (`anticipation_triggers[basegame]` is 3-1=2, applied in
    # src/calculations/board.py). With two scatters on every reel that happened
    # on 10.7% of base spins — one spin in nine — and 30% of those had two or
    # three reels left to tease through. Meanwhile the published trigger rate is
    # 1 in 220, because the basegame distributions carry `force_freegame: False`
    # and a 3-scatter board is rejected there outright. So the player was being
    # promised a feature roughly 23 times for every time they got one.
    #
    # Thinning the FIRST three reels rather than all five is the shape that
    # matters, and it was measured rather than guessed:
    #
    #   S per reel      2 scatters     >=2 reels teased    teases per trigger
    #   2,2,2,2,2       1 in 9.3       1 in 31             23.5
    #   1,1,2,2,2       1 in 13.7      1 in 72             16.1
    #   1,1,1,2,2       1 in 17.2      1 in 118            12.8   <- chosen
    #   1,1,1,1,2       1 in 22.6      1 in 110             9.7
    #   1,1,1,1,1       1 in 30.8      1 in 104             7.2
    #
    # Note the last two rows: taking scatters off the LAST reels too makes the
    # long tease worse again in proportion, because the second scatter drifts
    # back onto the early reels where there is still board left to run. Keeping
    # two on reels 4 and 5 is what makes the second scatter arrive late, with
    # little or nothing left to anticipate through. 1,1,1,2,2 is the best shape
    # available, not a midpoint compromise.
    "S": [1, 1, 1, 2, 2],
    # The Tommy Gun, on the middle three reels only.
    #
    # It took the Collector's slot, but it is a far stronger symbol: one on the
    # board fills its whole reel with Wilds. At 1 on every reel it landed on
    # 34% of base spins, measured across the distributions at their real quotas
    # — not the 28% a bare 4-row window calculation predicts, because
    # `check_repeat` throws out non-winning boards in the `basegame` criteria
    # and a wild column is exactly what makes a board win. One base spin in
    # three is not a feature, it is the wallpaper.
    #
    # Reels 2-4 is the standard expanding-wild shape and it does three things
    # at once here: it takes the rate to 24.5%, it keeps a wild column off
    # reel 1 so a 5-OAK wild line stays rare, and it gives the expansion a
    # readable place on the board instead of it happening anywhere.
    #
    # 24.5% is still generous, and it is the first dial to turn if the game
    # plays too flat - dropping to [0, 1, 0, 1, 0] takes it to roughly 17%.
    # What the split under it buys is worth keeping either way: the gun shows
    # on 36% of winning boards but only 10% of dead ones, so seeing it land is
    # a real signal rather than noise.
    "SW": [0, 1, 1, 1, 0],
}

# The strip the feature-triggering books are generated on.
#
# It has to exist. The freegame and wincap distributions carry
# `force_freegame: True` with an exact `scatter_triggers` count, and the
# generator gets there by rejection — it redraws until the board happens to show
# 3, 4 or 5 scatters. On the thinned BASE strip a 5-scatter board is roughly a
# 1-in-500,000 draw, and `freegame_strong` needs a thousand of them; that run
# would not finish. Three scatters per reel brings a 5-scatter board back to
# about 1 in 4,000, which is cheaper than the old 2,2,2,2,2 strip managed.
#
# Everything except the scatters is BASE, so a trigger board is the same game
# the player was already looking at. This is not a hidden second base game:
# those books ARE the trigger spins, and a 3+ scatter board cannot occur in any
# other distribution anyway.
TRIGGER_COMPOSITION = dict(BASE_COMPOSITION)
TRIGGER_COMPOSITION["S"] = [3, 3, 3, 3, 3]
# Pay the extra scatters for out of the two commonest lows, so strip length and
# the premium mix are untouched.
# Reels 1-3 give up two lows each (scatters 1 -> 3); reels 4 and 5 give up one
# (scatters 2 -> 3). The assert in main() is what caught this being wrong the
# first time — every strip must come to exactly 64 or the CSV goes ragged and
# the config loader trips on an empty cell.
TRIGGER_COMPOSITION["L1"] = [8, 8, 8, 8, 8]
TRIGGER_COMPOSITION["L2"] = [8, 8, 8, 9, 9]

# Free game: richer in high symbols, wild on every reel, fewer scatters
# (retriggers stay meaningful but not frequent).
FREE_COMPOSITION = {
    # Reels 1-2 take the slots freed by clearing their scatters; reels 4-5 give
    # one back each to pay for a second scatter. Every strip stays at 64.
    "L1": [9, 9, 8, 7, 7],
    "L2": [8, 8, 8, 8, 8],
    "L3": [7, 7, 7, 7, 7],
    "L4": [7, 7, 7, 7, 7],
    # 7 -> 8: the position freed by halving the special wild below (the Collector
    # sat at 2 per reel; two Tommy Guns per reel would put a double wild column
    # on most free spins). H5 takes it for the same reason it does on the base
    # strip - cheapest premium, so it lifts mid-tier line frequency.
    "H5": [8, 8, 8, 8, 8],
    "H4": [6, 6, 6, 6, 6],
    "H3": [6, 6, 6, 6, 6],
    "H2": [5, 5, 5, 5, 5],
    "H1": [4, 4, 4, 4, 4],
    "W": [3, 3, 3, 3, 3],
    # Free-game scatters moved to the back of the board: 1,1,1,1,1 -> 0,0,1,2,2.
    #
    # A retrigger needs only 2 scatters, so `anticipation_triggers[freegame]` is
    # 1 — the FIRST scatter to land starts the tease. With one on every reel that
    # fired on 24% of free spins, and 17.6% of spins (1 in 6) had two or more
    # reels still to grind through. Ten spins a feature means roughly two and a
    # half of them were spent watching reels crawl.
    #
    # Measured, and the count is not the lever — the position is:
    #
    #   S per reel     1 scatter     >=2 reels teasing     retrigger
    #   1,1,1,1,1      1 in 4.1      1 in 6                1 in 29
    #   0,1,1,1,1      1 in 4.9      1 in 8                1 in 47
    #   0,0,1,1,1      1 in 6.1      1 in 16               1 in 89
    #   0,0,1,1,2      1 in 4.7      1 in 16               1 in 54
    #   0,0,1,2,2      1 in 4.0      1 in 16               1 in 34   <- chosen
    #
    # Simply removing scatters (0,0,1,1,1) cuts the tease but takes the retrigger
    # down with it, from 1 in 29 to 1 in 89 — and the retrigger is an advertised
    # feature. Moving them to the back instead gets the same 2.7x cut in long
    # teases while leaving the retrigger almost untouched, because a scatter on
    # the last reel has nothing left to tease through. The 1-scatter rate barely
    # moves and that is fine: what hurt was the grind, not the symbol.
    "S": [0, 0, 1, 2, 2],
    "SW": [1, 1, 1, 1, 1],
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
    "SW": [3, 3, 3, 3, 3],
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
        # this too, but only after the shuffle — catching it here names the reel
        # and the count, which is what you need to fix the composition. (Lengths
        # differ BETWEEN strips: WCAP is 63, the others 64. That is fine; the
        # requirement is within a strip.)
        totals = [sum(counts[reel] for counts in composition.values()) for reel in range(NUM_REELS)]
        assert len(set(totals)) == 1, f"{filename} reels are ragged: {totals}"
        reels = build_reels(composition, seed)
        write_csv(os.path.join(here, filename), reels)
        counts = {}
        for sym in reels[0]:
            counts[sym] = counts.get(sym, 0) + 1
        print(f"  reel-1 composition: {counts}")


if __name__ == "__main__":
    main()
