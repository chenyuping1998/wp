"""Assert the searchlight mechanic against the books that were actually generated.

Nothing else in the toolchain does this. `run.py` proves internal consistency and
`check_math_bundle.py` proves RTP, counts and payout hashes — neither of them
knows what the Game Info promises a player. A doubling rule in Hot Miami was
broken across THREE submissions (1,521 lost doublings in 4,000 books, all on
spins where a second feature also fired) and was found by a reviewer playing one
hand, not by any check in this repo.

So this walks the real books and checks every clause of SPEC.md's rule 3:

  1. A beam runs from its landing row DOWN to the bottom of its reel — every
     cell in between, none above, nothing past the floor.
  2. A cell flagged `doubled` is exactly twice what that cell held before the
     beam arrived (or pinned at MAX_LIGHT_MULTIPLIER).
  3. A cell NOT flagged `doubled` carries the landing light's own `mult`.
  4. Feature beams are sticky: every cell lit on spin N is still lit on N+1.
  5. Base-game beams are not sticky: no `updateLights` outside a feature.
  6. Nothing ever exceeds MAX_LIGHT_MULTIPLIER.

Run it on EVERY regeneration:
    python design/check_searchlight.py
"""

import io
import json
import os
import sys

import zstandard as zstd

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, os.pardir))

# Imported, never re-declared. An earlier version of this file hard-coded
# MAX_LIGHT_MULTIPLIER = 200; the game was then tuned to 100 and this check
# reported hundreds of "doubled to 100x, expected 200x" violations that were
# entirely its own. A guard that duplicates a constant eventually lies about
# the code it is guarding.
from game_executables import MAX_LIGHT_MULTIPLIER  # noqa: E402
from game_config import GameConfig  # noqa: E402

_config = GameConfig()
ROWS = _config.num_rows[0]
PADDING = 1 if _config.include_padding else 0

PUBLISH = os.path.join(HERE, os.pardir, "library", "publish_files")

# Padded row indices: the board occupies PADDING .. PADDING + ROWS - 1, so the
# bottom row a beam can reach is this.
BOTTOM = PADDING + ROWS - 1


def read_books(path, limit=None):
    dctx = zstd.ZstdDecompressor()
    with open(path, "rb") as fh:
        text = io.TextIOWrapper(dctx.stream_reader(fh), encoding="utf-8")
        for i, line in enumerate(text):
            if limit is not None and i >= limit:
                return
            yield json.loads(line)


def check_book(book, problems, mode):
    """Replay one book's light state and check every rule against it."""
    lit = {}
    in_feature = False
    book_id = book.get("id", "?")

    def fail(rule, detail):
        problems.append(f"{mode} book {book_id}: [{rule}] {detail}")

    for event in book["events"]:
        kind = event["type"]

        if kind == "bonusTier":
            in_feature = True
            lit = {}

        elif kind == "freeSpinEnd":
            in_feature = False
            lit = {}

        elif kind == "updateLights":
            if not in_feature:
                fail("rule 5", "updateLights emitted outside a feature — base-game beams must not be sticky")
            carried = {(c["reel"], c["row"]): c["mult"] for c in event["cells"]}
            missing = set(lit) - set(carried)
            if missing:
                fail("rule 4", f"cells lit last spin but not carried into this one: {sorted(missing)}")
            changed = {k for k in set(lit) & set(carried) if lit[k] != carried[k]}
            if changed:
                fail("rule 4", f"carried cells changed value with no light landing: {sorted(changed)}")
            lit = carried

        elif kind == "searchlight":
            for light in event["lights"]:
                reel, row, mult = light["reel"], light["row"], light["mult"]
                cells = light["cells"]

                # rule 1 — the beam's footprint
                expected = [(reel, r) for r in range(row, BOTTOM + 1)]
                actual = [(c["reel"], c["row"]) for c in cells]
                if actual != expected:
                    fail("rule 1", f"beam from ({reel},{row}) covered {actual}, expected {expected}")
                    continue

                for cell in cells:
                    key = (cell["reel"], cell["row"])
                    value = cell["mult"]

                    # rule 6 — the ceiling
                    if value > MAX_LIGHT_MULTIPLIER:
                        fail("rule 6", f"cell {key} at {value}x exceeds MAX {MAX_LIGHT_MULTIPLIER}x")

                    if cell["doubled"]:
                        # rule 2 — doubled means exactly twice what was there
                        if key not in lit:
                            fail("rule 2", f"cell {key} flagged doubled but was not lit before")
                        else:
                            want = min(lit[key] * 2, MAX_LIGHT_MULTIPLIER)
                            if value != want:
                                fail("rule 2", f"cell {key} was {lit[key]}x, doubled to {value}x, expected {want}x")
                    else:
                        # rule 3 — a fresh cell takes the light's own value
                        if key in lit:
                            fail("rule 3", f"cell {key} was already lit at {lit[key]}x but was not flagged doubled")
                        if value != mult:
                            fail("rule 3", f"fresh cell {key} took {value}x, expected the light's own {mult}x")

                    lit[key] = value


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if not os.path.isdir(PUBLISH):
        print(f"!! no books at {PUBLISH} — run run.py first")
        return 1

    files = sorted(f for f in os.listdir(PUBLISH) if f.startswith("books_") and f.endswith(".jsonl.zst"))
    if not files:
        print(f"!! no book files in {PUBLISH}")
        return 1

    problems = []
    checked = 0
    lights_seen = 0
    doubles_seen = 0

    for name in files:
        mode = name[len("books_"):-len(".jsonl.zst")]
        for book in read_books(os.path.join(PUBLISH, name), limit):
            checked += 1
            for event in book["events"]:
                if event["type"] == "searchlight":
                    lights_seen += len(event["lights"])
                    doubles_seen += sum(
                        1 for light in event["lights"] for cell in light["cells"] if cell["doubled"]
                    )
            check_book(book, problems, mode)

    print(f"checked {checked} books across {len(files)} modes")
    print(f"  searchlights landed: {lights_seen}")
    print(f"  cells doubled:       {doubles_seen}")

    # A probe must prove it can see its target before its zero means anything.
    # Zero doublings anywhere would mean rules 2 and 3 were never exercised, and
    # a clean run would be telling you nothing at all.
    if doubles_seen == 0:
        print("!! NO DOUBLING FOUND IN ANY BOOK — rules 2 and 3 were never exercised.")
        print("   This is a failure of the check, not a pass: the same-reel doubling")
        print("   rule is the core of the mechanic and it must appear in the books.")
        return 1

    if problems:
        print(f"\n!! {len(problems)} violations (first 25):")
        for line in problems[:25]:
            print("   " + line)
        return 1

    print("\nOK — every beam ran downward to the floor, every doubling was exact,")
    print("     every fresh cell took its own light's value, and feature beams stuck.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
