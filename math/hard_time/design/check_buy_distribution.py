#!/usr/bin/env python3
"""Measure the buy modes' payout shape — the numbers the 2026-09-13 retune targets.

    /Applications/anaconda3/envs/math-sdk/bin/python design/check_buy_distribution.py [lut_dir]

"高均率" is the share of WEIGHT that pays strictly above the mode's own mean
payout. That is the user's definition, and it is what this reports first.

Why it needs its own script: the mean of a buy mode sits just under its cost
(mean = cost x rtp, e.g. 947.8x against a 1000x price), so "above the mean" and
Stake's "Probability of Payout < Bet" are near-complements. Moving one moves the
other, in opposite directions, and the two constraints cannot both be chosen
freely — 28% above-mean forces prob_less_bet to roughly 72%.

Buckets match the win_range spans used by ConstructScaling in
game_optimization.py, so a measurement here maps directly onto the lever that
moves it. Tail probabilities are reported because bonus_epic has failed Stake's
volatility dashboard on them before (2026-09-03) and any change that shifts
weight upward risks failing them again.
"""

import csv
import os
import sys

BUCKETS = [
    (0, 1, "<1x"),
    (1, 20, "1-20x"),
    (20, 200, "20-200x"),
    (200, 1000, "200-1000x"),
    (1000, 2000, "1000-2000x"),
    (2000, 5000, "2000-5000x"),
    (5000, 20000, "5000-20000x"),
    (20000, float("inf"), "20000x cap"),
]

# name -> (lookup table stem, cost in x of bet, target above-mean share)
MODES = [
    ("bonus", "bonus", 100.0, None),
    ("bonus_hits", "bonus_hits", 500.0, 0.28),
    ("bonus_epic", "bonus_epic", 1000.0, 0.28),
]

TAIL_LIMITS = [(5000, 0.0100), (10000, 0.0050)]


def load(path):
    """Rows of (weight, payout in x-of-bet). The LUT stores payout x100."""
    rows = []
    with open(path) as handle:
        for row in csv.reader(handle):
            if len(row) < 3:
                continue
            try:
                rows.append((float(row[1]), float(row[2]) / 100.0))
            except ValueError:
                continue
    return rows


def main():
    lut_dir = sys.argv[1] if len(sys.argv) > 1 else "library/publish_files"
    failed = []
    for name, stem, cost, target in MODES:
        path = None
        for candidate in (
            os.path.join(lut_dir, f"lookUpTable_{stem}_0.csv"),
            os.path.join(lut_dir, f"lookUpTable_{stem}.csv"),
        ):
            if os.path.exists(candidate):
                path = candidate
                break
        if path is None:
            print(f"{name:12} lookup table not found under {lut_dir}")
            continue

        rows = load(path)
        total = sum(w for w, _ in rows)
        rtp_sum = sum(w * p for w, p in rows)
        mean = rtp_sum / total

        # The OPTIMIZED tables live in library/publish_files and carry the _0
        # suffix. library/lookup_tables holds the RAW pre-optimization tables,
        # whose weights have not been solved to the RTP target — measuring those
        # reports an RTP of 300-800% and a 高均率 that looks perfectly precise
        # and means nothing. Refuse rather than report it.
        if not 0.5 <= mean / cost <= 1.2:
            print(f"{name:12} REFUSING: RTP {mean / cost:.4f} from {path} is not a "
                  f"solved table — point at library/publish_files (the _0 files).")
            failed.append(f"{name} (unsolved table)")
            continue
        above = sum(w for w, p in rows if p > mean) / total
        less_bet = sum(w for w, p in rows if p < cost) / total

        head = f"== {name} ({cost:.0f}x buy) ==  mean {mean:.2f}x  RTP {mean / cost:.4f}"
        print(head)
        flag = ""
        if target is not None:
            delta = (above - target) * 100
            # +-1.5pt, not +-0.5: two runs of an IDENTICAL config measured
            # 20.20% vs 21.74% on bonus_hits and 29.07% vs 30.39% on
            # bonus_epic, so 1.5pt is the run-to-run simulation noise floor at
            # 20k sims. A tighter tolerance would just be chasing noise.
            ok = abs(delta) <= 1.5
            flag = "  OK" if ok else f"  <-- off target by {delta:+.2f}pt"
            if not ok:
                failed.append(name)
        print(f"   高均率 (above-mean)  {above:8.2%}   target "
              f"{'%.0f%%' % (target * 100) if target else '   -'}{flag}")
        print(f"   prob_less_bet        {less_bet:8.2%}   (moves opposite to the line above)")
        print(f"   {'bucket':<13}{'weight %':>10}{'RTP share %':>13}")
        for lo, hi, label in BUCKETS:
            w = sum(wt for wt, p in rows if lo <= p < hi)
            r = sum(wt * p for wt, p in rows if lo <= p < hi)
            print(f"   {label:<13}{w / total * 100:9.3f}%{r / rtp_sum * 100:12.2f}%")
        for thr, limit in TAIL_LIMITS:
            p = sum(wt for wt, pp in rows if pp >= thr) / total
            state = "OK" if p <= limit else "OVER"
            if p > limit:
                failed.append(f"{name} tail {thr}")
            print(f"   p(>={thr}x) = {p:.5f}   Stake limit {limit:.4f}   {state}")
        print()

    if failed:
        print("NOT ON TARGET: " + ", ".join(failed))
        return 1
    print("all measured modes on target")
    return 0


if __name__ == "__main__":
    sys.exit(main())
