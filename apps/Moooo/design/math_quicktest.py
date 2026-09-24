#!/usr/bin/env python3
"""Raw (pre-optimiser) measurement of Moooo's book pools.

This is the harness the game was tuned with. It runs `run_spin` directly, with
no lookup-table weights, so what it reports is the shape of the RAW pool the
optimiser will later be handed — not the shipped RTP. Both numbers matter and
they answer different questions:

    run.py                what the player gets        ~2.5 minutes
    this                  what the optimiser has to work with   ~20 seconds

The distinction is the whole reason this file exists. The optimiser can hit any
RTP target you give it by reweighting books, so a green `run.py` says nothing
about whether the pool was sane. What it cannot do is invent books that are not
there. A fence whose target average sits far below the pool's median is one the
optimiser can only reach by piling weight onto the thin bottom tail — which
produces a technically-correct RTP built from a handful of outcomes.

The rule of thumb used while tuning: a fence's **target average should sit near
or below the pool's median**, and the pool mean should be roughly 1.5-3x the
target. Both held at the numbers that shipped:

    fence            target av_win     pool mean     pool median
    basegame              2.39             5.98          0.50
    freegame             94.83           160.53         58.50
    freegame_super      237.23           349.02        139.80

Usage, from the math-sdk games/moooo directory (needs the math-sdk environment,
Python 3.12+):

    python ../../../wp/apps/Moooo/design/math_quicktest.py            # 1500 sims
    python ../../../wp/apps/Moooo/design/math_quicktest.py 4000
"""

import bisect
import collections
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
SDK = os.path.join(REPO, "math-sdk")
GAME = os.path.join(SDK, "games", "moooo")
sys.path.insert(0, SDK)
sys.path.insert(0, GAME)
os.chdir(GAME)

from game_config import GameConfig  # noqa: E402
from gamestate import GameState  # noqa: E402

# The optimiser targets from game_optimization.py, restated so the report can
# say whether the pool can actually serve them. If these drift out of step with
# game_optimization.py the report is lying, so they are printed next to the
# measured numbers rather than used to pass or fail anything.
FENCE_TARGETS = {"basegame": 2.3886, "freegame": 94.83, "freegame_super": 237.23}

BUCKETS = [0, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10001]


def measure(gamestate, betmode, criteria, n):
    """Play `n` books of one distribution and return the payouts, plus stats."""
    gamestate.betmode = betmode
    gamestate.criteria = criteria

    wins = []
    events = collections.Counter()
    tiers = collections.Counter()
    meters_end = collections.Counter()
    landed = expanded = spins = 0

    for sim in range(n):
        gamestate.run_spin(sim)
        wins.append(gamestate.final_win)
        for event in gamestate.book.events:
            events[event["type"]] += 1
            if event["type"] == "reveal":
                spins += 1
            elif event["type"] == "newCows":
                landed += len(event["cows"])
                for cow in event["cows"]:
                    tiers[cow["tier"]] += 1
            elif event["type"] == "expandCows":
                expanded += len(event["reels"])
        for level in gamestate.meters:
            meters_end[level] += 1

    wins.sort()
    return {
        "wins": wins,
        "mean": statistics.mean(wins),
        "median": statistics.median(wins),
        "max": wins[-1],
        "zero": sum(1 for w in wins if w == 0) / n,
        "cows_per_spin": landed / max(spins, 1),
        "expand_rate": expanded / max(landed, 1),
        "tiers": tiers,
        "meters_end": meters_end,
        "events": events,
    }


def histogram(wins):
    counts = [0] * (len(BUCKETS) - 1)
    for win in wins:
        counts[min(bisect.bisect_right(BUCKETS, win) - 1, len(counts) - 1)] += 1
    total = len(wins)
    return "  ".join(
        f"{BUCKETS[i]}-{BUCKETS[i + 1]}:{counts[i] * 100 // total}%"
        for i in range(len(counts))
        if counts[i]
    )


def main(n):
    config = GameConfig()
    gamestate = GameState(config)

    print(f"Moooo raw pools, {n} books per distribution (no optimiser weights)\n")
    for betmode in (bm.get_name() for bm in config.bet_modes):
        print(f"===== {betmode}")
        for dist in gamestate.get_betmode(betmode).get_distributions():
            criteria = dist._criteria
            r = measure(gamestate, betmode, criteria, n)

            target = FENCE_TARGETS.get(criteria)
            verdict = ""
            if target:
                # The check that matters: can the optimiser reach the target
                # without living in the tail? It can if the target is not far
                # above the median.
                ratio = r["mean"] / target
                ok = r["median"] <= target * 1.5
                verdict = (
                    f"  target={target:>7.2f} pool/target={ratio:4.1f}x "
                    f"{'ok' if ok else 'TARGET IS BELOW THE POOL MEDIAN — optimiser must live in the tail'}"
                )

            print(
                f"  {criteria:<16} mean={r['mean']:>9.2f} median={r['median']:>8.2f} "
                f"max={r['max']:>9.1f} zero={r['zero']:>5.1%}{verdict}"
            )
            print(
                f"                   cows/spin={r['cows_per_spin']:.3f} "
                f"expand={r['expand_rate']:.1%} tiers={dict(r['tiers'])}"
            )
            if r["meters_end"]:
                total = sum(r["meters_end"].values())
                print(
                    "                   meters at round end: "
                    + "  ".join(f"L{k}={v / total:.0%}" for k, v in sorted(r["meters_end"].items()))
                )
            print(f"                   {histogram(r['wins'])}")
        print()


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 1500)
