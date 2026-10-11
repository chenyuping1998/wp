#!/usr/bin/env python3
"""Move a game's per-mode RTP by re-weighting its published lookup tables —
no re-simulation, no optimizer run.

Books paying above the mode's own mean gain weight x(1+x); books below shrink
so the total weight is unchanged; x is solved exactly for the target. Books,
payouts and max win are untouched; every tail probability moves by ~x relative
(x was 2-4% moving 94.x -> 96.0x on all six games, 2026-10-11).

    reweight_lut.py SRC_PUBLISH_DIR OUT_DIR base=0.9604 bonus=0.9605 ...

Always reweight from the ORIGINAL optimizer tables, not from an earlier
reweight, so each table carries one tilt. Prints before/after RTP, hit rate,
P(>=cost), P(>=10x cost) and max-win odds per mode; write OUT_DIR's CSVs over
library/publish_files/ only after reading that table.
"""
import csv, json, os, sys

src, out = sys.argv[1], sys.argv[2]
targets = {k: float(v) for k, v in (a.split("=") for a in sys.argv[3:])}
idx = json.load(open(f"{src}/index.json"))
os.makedirs(out, exist_ok=True)


def stats(rows, w, cost, wincap):
    W = sum(w)
    def share(pred): return sum(wi for wi, r in zip(w, rows) if pred(r[2])) / W
    rtp = sum(wi * r[2] for wi, r in zip(w, rows)) / W / 100 / cost
    return rtp, share(lambda p: p > 0), share(lambda p: p >= 100 * cost), \
        share(lambda p: p >= 1000 * cost), share(lambda p: p >= wincap * 100)


for m in idx["modes"]:
    name, cost = m["name"], m["cost"]
    if name not in targets:
        sys.exit(f"no target given for mode {name!r}")
    rows = [(int(a), int(b), int(c)) for a, b, c in csv.reader(open(f"{src}/{m['weights']}"))]
    w0 = [r[1] for r in rows]
    wincap = max(r[2] for r in rows) / 100
    W = sum(w0)
    mean = sum(wi * r[2] for wi, r in zip(w0, rows)) / W
    high = [r[2] > mean for r in rows]
    WH = sum(wi for wi, h in zip(w0, high) if h)
    WL = W - WH
    SH = sum(wi * r[2] for wi, r, h in zip(w0, rows, high) if h)
    SL = W * mean - SH
    # new mean = (SH(1+x) + SL(1 - x*WH/WL)) / W  -> solve for x
    x = (targets[name] * 100 * cost * W - SH - SL) / (SH - SL * WH / WL)
    f = 1 - x * WH / WL
    w = [max(1, round(wi * (1 + x) if h else wi * f)) for wi, h in zip(w0, high)]
    b, a = stats(rows, w0, cost, wincap), stats(rows, w, cost, wincap)
    print(f"{name:11s} x={x:+.4f}  rtp {b[0]*100:.3f}->{a[0]*100:.4f}  hit {b[1]:.4f}->{a[1]:.4f}  "
          f">=cost {b[2]:.4f}->{a[2]:.4f}  >=10x {b[3]:.5f}->{a[3]:.5f}  "
          f"maxwin 1/{1/b[4] if b[4] else 0:.0f}->1/{1/a[4] if a[4] else 0:.0f}")
    with open(f"{out}/{m['weights']}", "w", newline="") as fh:
        for r, wi in zip(rows, w):
            fh.write(f"{r[0]},{wi},{r[2]}\n")
