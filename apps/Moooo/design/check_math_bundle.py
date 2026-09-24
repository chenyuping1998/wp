#!/usr/bin/env python3
"""Gate for the math half of the Moooo upload bundle.

Stake Engine rejected a publish with

    ERR_MATH_OUTSIDE_RANGE — event and weight payouts mismatch: lookup table CSV
    payouts do not match payoutMultiplier value in event file   (mode: bonus_hits)

and the cause was not the maths. The bundle had been copied out of
`library/publish_files/` while `run.py` was still writing it: the books for every
mode were finished, but the optimiser had only reached `base` and `bonus`, so
`bonus_hits` and `bonus_epic` shipped with the PREVIOUS run's lookup tables. Two
of four modes were internally inconsistent, 16,840 and 16,415 rows respectively,
and nothing in the repo would have said so — the frontend has four build gates
and the math bundle had none.

This is that gate. Run it against the bundle that is about to be uploaded, not
against the source tree, because copying is exactly where it went wrong.

    python design/check_math_bundle.py ../../../upload/Moooo/math

During development, before an upload folder exists, it can also be pointed
straight at what run.py wrote:

    python design/check_math_bundle.py ../../../math-sdk/games/moooo/library/publish_files

Checks, in the order they fail usefully:

  1. index.json names files that exist
  2. every book id appears in its mode's lookup table, and vice versa
  3. payoutMultiplier in the book == payout column in the lookup table, per id
  4. RTP per mode is inside Stake's band, and every mode agrees with the rest
  5. every mode reports the same largest payout, and it is the advertised max win

Exit code is non-zero on any failure, so it can be chained ahead of a copy.
"""

import csv
import io
import json
import os
import sys

import zstandard as zstd

# Stake's own limits, not this game's numbers. An earlier version pinned
# TARGET_RTP = 0.9650 here and the gate failed the moment the game moved to 0.94
# — a check that has to be edited every time the maths changes is a check that
# will one day be edited to match a mistake. What is asserted now is what Stake
# actually requires: the band, and that every mode agrees with the others.
RTP_MIN, RTP_MAX = 0.90, 0.98
MODE_SPREAD_MAX = 0.005
# Passed in, not pinned. Moooo is 10,000x, but the same reasoning that keeps
# TARGET_RTP out of this file applies here: a number that has to be edited when
# the game changes is a number that will one day be edited to agree with a
# mistake. What IS asserted unconditionally, below, is that every mode reports
# the SAME largest payout — that part needs no configuration and it is the half
# that actually caught the mid-run copy, because a stale table disagrees with
# its siblings whatever the advertised figure happens to be.
DEFAULT_MAX_WIN = 10_000
# Book amounts are in units where 100 = 1x. Established by checking collectorWin's
# `amount` against its own `totalMultiplier` across 31,649 events.
UNITS_PER_X = 100
# Cost per mode is read from index.json rather than restated here, for the same
# reason: the bundle already carries it, and a second copy is a second thing to
# forget. Buy-mode lookup payouts are quoted against the BASE stake, so the RTP
# divides by the mode's cost.
def mode_costs(bundle):
    index = json.load(open(os.path.join(bundle, "index.json")))
    return {m["name"]: float(m["cost"]) for m in index["modes"]}


def read_books(path):
    with open(path, "rb") as fh:
        with zstd.ZstdDecompressor().stream_reader(fh) as reader:
            for line in io.TextIOWrapper(reader, encoding="utf8"):
                if line.strip():
                    yield json.loads(line)


def main(bundle, max_win):
    problems = []
    rtps = {}
    biggest_per_mode = {}

    def fail(msg):
        problems.append(msg)
        print(f"  !! {msg}")

    index_path = os.path.join(bundle, "index.json")
    if not os.path.exists(index_path):
        fail("index.json missing")
        modes = []
    else:
        index = json.load(open(index_path))
        referenced = json.dumps(index)
        costs = mode_costs(bundle)
        for name in os.listdir(bundle):
            if name.endswith((".jsonl.zst", ".csv")) and name not in referenced:
                fail(f"{name} is in the bundle but not referenced by index.json")
        modes = sorted(costs)

    for mode in modes:
        books_path = os.path.join(bundle, f"books_{mode}.jsonl.zst")
        lut_path = os.path.join(bundle, f"lookUpTable_{mode}_0.csv")
        if not os.path.exists(books_path) or not os.path.exists(lut_path):
            fail(f"{mode}: books or lookup table missing from the bundle")
            continue

        lut = {}
        for row in csv.reader(open(lut_path)):
            lut[int(row[0])] = (float(row[1]), float(row[2]))

        seen = set()
        mismatched = 0
        first = None
        for book in read_books(books_path):
            book_id = int(book["id"])
            seen.add(book_id)
            if book_id not in lut:
                fail(f"{mode}: book id {book_id} has no lookup table row")
                break
            payout = float(book["payoutMultiplier"])
            if abs(lut[book_id][1] - payout) > 1e-9:
                mismatched += 1
                if first is None:
                    first = (book_id, lut[book_id][1], payout)

        if mismatched:
            book_id, table, event = first
            fail(
                f"{mode}: {mismatched} of {len(seen)} books disagree with the "
                f"lookup table (first: id {book_id}, table {table}, event {event}) "
                f"— this is the ERR_MATH_OUTSIDE_RANGE Stake reports, and it "
                f"usually means the bundle was copied mid-run"
            )

        orphans = set(lut) - seen
        if orphans:
            fail(f"{mode}: {len(orphans)} lookup table rows have no book")

        total_weight = sum(w for w, _ in lut.values())
        weighted = sum(w * p for w, p in lut.values())
        rtp = weighted / total_weight / UNITS_PER_X / costs[mode]
        biggest = max(p for _, p in lut.values()) / UNITS_PER_X

        status = "ok"
        rtps[mode] = rtp
        if not RTP_MIN <= rtp <= RTP_MAX:
            fail(f"{mode}: RTP {rtp:.4f} is outside Stake's {RTP_MIN:.0%}-{RTP_MAX:.0%} band")
            status = "FAIL"
        biggest_per_mode[mode] = biggest
        if abs(biggest - max_win) > 0.5:
            fail(f"{mode}: largest payout {biggest:,.0f}x is not the advertised {max_win:,}x")
            status = "FAIL"

        print(
            f"  {mode:<11} books={len(seen):>6} lut={len(lut):>6} "
            f"payout mismatches={mismatched:<6} RTP={rtp:.4f} max={biggest:,.0f}x  {status}"
        )

    if len(set(round(b, 2) for b in biggest_per_mode.values())) > 1:
        fail(
            "modes disagree on the largest payout: "
            + ", ".join(f"{m}={b:,.0f}x" for m, b in sorted(biggest_per_mode.items()))
            + " — a mode whose table was written by a different run"
        )

    if len(rtps) > 1:
        spread = max(rtps.values()) - min(rtps.values())
        if spread > MODE_SPREAD_MAX:
            fail(
                f"modes differ by {spread:.4f} in RTP; Stake requires every mode "
                f"within {MODE_SPREAD_MAX:.3f} of the others"
            )
        else:
            print(f"  RTP spread across modes: {spread:.4f} (limit {MODE_SPREAD_MAX:.3f})")

    print(
        "OK: math bundle is internally consistent"
        if not problems
        else f"{len(problems)} math bundle problem(s) found"
    )
    return 1 if problems else 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a.split("=")[0]: a.split("=", 1)[-1] for a in sys.argv[1:] if a.startswith("--")}
    target = args[0] if args else "upload/Moooo/math"
    sys.exit(main(target, float(flags.get("--max-win", DEFAULT_MAX_WIN))))
