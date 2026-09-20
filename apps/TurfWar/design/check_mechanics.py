"""Assert Big Score and sticky-wild mechanics match what Game Info promises.

run.py / check_math_bundle check RTP, counts and payout hashes - not
game-specific mechanics. This walks every generated book and checks:

  Big Score  - on a spin whose events include `bigScore` (mult m), every line
               win that spin has line-multiplier == (#winning positions) * m,
               because the Big Score overrides every cell to m and the line
               engine sums the per-cell multiplier across the win.
  Sticky W   - `stickyWilds` appears only inside a 5-scatter (Kingpin/"don")
               feature; the held set never shrinks; every held cell shows as a
               Wild (or a Scatter sitting over it) on every later reveal of
               that feature.

Run from wp/apps/TurfWar (paths are relative to the math game dir):
    /Applications/anaconda3/envs/math-sdk/bin/python _verify_mechanics.py
"""
import glob
import json
import os

import zstandard

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS_GLOB = os.path.abspath(
    os.path.join(HERE, "..", "..", "..", "..", "math-sdk", "games", "turf_war",
                 "library", "publish_files", "books_*.jsonl.zst")
)


def books(path):
    with open(path, "rb") as fh:
        raw = zstandard.ZstdDecompressor().stream_reader(fh).read().decode()
    for line in raw.splitlines():
        line = line.strip()
        if line:
            yield json.loads(line)


def check_mode(path):
    mode = path.split("books_")[1].split(".")[0]
    n = big_spins = sticky_events = big_checked = 0
    problems = []

    for b in books(path):
        ev = b["events"]
        tier = None
        held = set()
        pending_big = None

        for e in ev:
            t = e["type"]

            if t == "bonusTier":
                tier = e["tier"]
                held = set()

            elif t == "bigScore":
                big_spins += 1
                pending_big = e["mult"]

            elif t == "reveal":
                if held:
                    bd = e["board"]
                    for reel, row in held:
                        try:
                            name = bd[reel][row]["name"]
                        except (IndexError, KeyError, TypeError):
                            problems.append(f"{b['id']}: held ({reel},{row}) off board")
                            continue
                        if name not in ("W", "S"):
                            problems.append(
                                f"{b['id']}: held cell ({reel},{row}) is {name!r} not W/S"
                            )

            elif t == "wildExpand":
                # At most one Bruiser expands per spin (dedupe_special_wilds),
                # except on force_wincap books where the cap is intentionally off.
                if len(e.get("reels", [])) > 1 and b.get("payoutMultiplier", 0) < 2000000:
                    problems.append(
                        f"{b['id']}: {len(e['reels'])} Bruisers expanded on one spin"
                    )

            elif t == "stickyWilds":
                sticky_events += 1
                if tier != "don":
                    problems.append(f"{b['id']}: stickyWilds in tier {tier!r} (not don)")
                now = {(c["reel"], c["row"]) for c in e["cells"]}
                if not held <= now:
                    problems.append(f"{b['id']}: sticky set shrank, lost {sorted(held - now)}")
                held = now

            elif t == "winInfo":
                if pending_big is not None:
                    m = pending_big
                    for w in e.get("wins", []):
                        k = len(w["positions"])
                        lm = w.get("meta", {}).get("multiplier")
                        big_checked += 1
                        if lm != k * m:
                            problems.append(
                                f"{b['id']}: bigScore m={m}, {k} positions -> line mult "
                                f"{lm}, expected {k * m}"
                            )
                pending_big = None

            elif t in ("setWin", "setTotalWin"):
                pending_big = None  # spin ended (win event already handled)

    n = sum(1 for _ in books(path))
    print(
        f"{mode:12s} books={n:6d}  bigScore spins={big_spins:5d} "
        f"(wins checked {big_checked})  stickyWilds events={sticky_events:5d}  "
        f"problems={len(problems)}"
    )
    for p in problems[:15]:
        print("   !!", p)
    return len(problems)


if __name__ == "__main__":
    total = sum(check_mode(f) for f in sorted(glob.glob(BOOKS_GLOB)))
    print("\nOK - mechanics match Game Info" if total == 0 else f"\n{total} problem(s)")
