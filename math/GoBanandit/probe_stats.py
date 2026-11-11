"""Natural (pre-optimizer) stats per mode and criteria, read straight from the books.

    PYTHONPATH=. python games/GoBanandit/probe_stats.py
"""

import json
import os
from collections import defaultdict

import zstandard

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = os.path.join(HERE, "library", "publish_files")
SEG = os.path.join(HERE, "library", "lookup_tables")
COST = {"base": 1, "bonus": 100, "superbonus": 300}


def read_books(mode):
    path = os.path.join(BOOKS, f"books_{mode}.jsonl.zst")
    with open(path, "rb") as f:
        data = zstandard.ZstdDecompressor().stream_reader(f).read()
    for line in data.splitlines():
        if line.strip():
            yield json.loads(line)


def main():
    for mode, cost in COST.items():
        by = defaultdict(list)
        collect_share = defaultdict(float)
        levels = defaultdict(int)
        spins = []
        crit_of = {}
        with open(os.path.join(SEG, f"lookUpTableSegmented_{mode}.csv")) as f:
            for line in f:
                i, c, _bg, _fg = line.strip().split(",")
                crit_of[int(i)] = c
        for b in read_books(mode):
            crit = crit_of.get(b["id"], "?")
            pay = b["payoutMultiplier"] / 100
            by[crit].append(pay)
            coll = sum(e["amount"] for e in b["events"] if e["type"] == "collect") / 100
            collect_share[crit] += coll
            lv = max([e["level"] for e in b["events"] if e["type"] == "banditMeter"] or [0])
            if any(e["type"] == "freeSpinTrigger" for e in b["events"]):
                levels[lv] += 1
                spins.append(max(e.get("totalFs", 0) for e in b["events"] if e["type"] in ("banditMeter", "updateFreeSpin")) if any(e["type"] in ("banditMeter", "updateFreeSpin") for e in b["events"]) else 0)
        print(f"== {mode} (cost {cost})")
        for crit, pays in sorted(by.items()):
            n = len(pays)
            mean = sum(pays) / n
            hit = sum(1 for p in pays if p > 0) / n
            ge1 = sum(1 for p in pays if p >= cost) / n
            coll = collect_share[crit] / max(sum(pays), 1e-9)
            print(
                f"  {crit:9s} n={n:6d} mean={mean:9.3f}x ({mean / cost:6.3f} of cost) "
                f"hit={hit:.3f} >=cost={ge1:.3f} max={max(pays):.1f} collect_share={coll:.2f}"
            )
        if levels:
            tot = sum(levels.values())
            print("  FG meter level reached:", {k: round(v / tot, 3) for k, v in sorted(levels.items())})


if __name__ == "__main__":
    main()
