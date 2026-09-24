#!/usr/bin/env python3
"""Do the buy menu's volatility labels match the shipped maths?

`betModeMeta.ts` tells the player which buy is the calmer ride. That is a claim
about the distribution, not a piece of copy, and it is the kind of claim that
silently stops being true the moment a price or an RTP target moves — which is
exactly what happened when Super went from 175x to 250x.

So it is checked rather than remembered: read the labels out of the component,
read the distributions out of the lookup tables, and fail if the ordering
disagrees. Coefficient of variation is the measure — spread relative to what the
mode pays, which is what "volatility" means to a player choosing between two
buys at different prices.

    python design/check_volatility.py [path/to/publish_files]
"""
import csv
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
DEFAULT_LIB = os.path.abspath(
    os.path.join(APP, "..", "..", "..", "math-sdk", "games", "moooo", "library", "publish_files")
)

# Higher index = the game says it is wilder.
LADDER = ["LOW", "MEDIUM", "HIGH", "VERY HIGH"]


def read_labels():
    """`key: 'x'` inside the VOLATILITY map in betModeMeta.ts."""
    source = open(os.path.join(APP, "src", "game", "betModeMeta.ts"), encoding="UTF-8").read()
    block = source[source.index("const VOLATILITY"):]
    block = block[: block.index("};")]
    return dict(re.findall(r"(\w+):\s*'([A-Z ]+)'", block))


def read_costs():
    source = open(os.path.join(APP, "src", "game", "config.ts"), encoding="UTF-8").read()
    return {
        name: float(cost)
        for name, cost in re.findall(r'"(\w+)":\s*\{\s*"cost":\s*([0-9.]+)', source)
    }


def stats(lut_path, cost):
    rows = []
    for row in csv.reader(open(lut_path)):
        if len(row) >= 3:
            rows.append((float(row[1]), float(row[2]) / 100.0))
    total = sum(w for w, _ in rows)
    mean = sum(w * p for w, p in rows) / total
    sd = math.sqrt(sum(w * (p - mean) ** 2 for w, p in rows) / total)
    below = sum(w for w, p in rows if p < cost) / total
    return {"rtp": mean / cost, "mean": mean, "sd": sd, "cv": sd / mean, "below": below}


def main(lib):
    labels = read_labels()
    costs = read_costs()
    problems = []

    measured = {}
    for mode in labels:
        path = os.path.join(lib, f"lookUpTable_{mode}_0.csv")
        if not os.path.exists(path):
            problems.append(f"{mode}: no lookup table at {path}")
            continue
        measured[mode] = stats(path, costs[mode])

    print(f"  {'mode':<8}{'cost':>8}{'RTP':>10}{'avg':>10}{'CV':>7}{'<stake':>9}   label")
    for mode, m in measured.items():
        print(
            f"  {mode:<8}{costs[mode]:>7.0f}x{m['rtp']:>9.2%}{m['mean']:>9.2f}x"
            f"{m['cv']:>7.2f}{m['below']:>8.1%}   {labels[mode]}"
        )

    # Every pair the labels claim to order must actually be ordered that way.
    modes = list(measured)
    for i in range(len(modes)):
        for j in range(len(modes)):
            if i >= j:
                continue
            a, b = modes[i], modes[j]
            if labels[a] not in LADDER or labels[b] not in LADDER:
                problems.append(f"unknown volatility label: {labels[a]!r} / {labels[b]!r}")
                continue
            said = LADDER.index(labels[a]) - LADDER.index(labels[b])
            measured_gap = measured[a]["cv"] - measured[b]["cv"]
            if said == 0:
                continue
            if (said > 0) != (measured_gap > 0):
                problems.append(
                    f"the menu calls {a} ({labels[a]}) "
                    f"{'wilder' if said > 0 else 'calmer'} than {b} ({labels[b]}), "
                    f"but {a} measures CV {measured[a]['cv']:.2f} against {b}'s "
                    f"{measured[b]['cv']:.2f} — the label is the wrong way round"
                )

    for problem in problems:
        print(f"  !! {problem}")
    print("OK: volatility labels match the shipped maths" if not problems
          else f"{len(problems)} volatility problem(s) found")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LIB))
