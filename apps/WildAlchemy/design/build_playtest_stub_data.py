"""Generate dist/playtest/stub-data.js from a published math bundle.

    python design/build_playtest_stub_data.py [bundle] [out.js]
    (defaults: upload/CapoNostra/math -> dist/caponostra-playtest/stub-data.js)

The play shell (design/playtest_stub.js) answers /wallet/play out of
`window.__STUB_DATA__`, which is a weighted sample of the REAL published books.
That file is ~12MB of generated data and so is not in the repo — but until now
neither was the thing that generates it, which meant every re-run of the maths
silently left the shell playing the previous bundle. A stale shell is worse than
no shell: it looks like the game and disagrees with what ships.

Shape (matching what the stub reads):

    window.__STUB_DATA__ = {MODE: {cost, pool: [id...], books: {id: book}}}
    window.__STUB_CATALOGUE__ = {MODE: {maxWin, trigger, transfer, block3,
                                        ladderStep, superStart, dead}}

`pool` is drawn WITH the lookup table's weights, so sitting and spinning the
shell feels like the real game rather than like a uniform walk through the book
file. `books` holds exactly the ids the pool can produce (plus the catalogue's),
so the file stays around 12MB instead of carrying all 100,000 rounds.

Deterministic: same bundle in, same file out.
"""

import csv
import json
import os
import random
import sys

import zstandard as zstd

HERE = os.path.dirname(os.path.abspath(__file__))
# design -> WildAlchemy -> apps -> wp-alchemy -> repo root
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
BUNDLE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "upload", "WildAlchemy", "math")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "dist", "wildalchemy-playtest", "stub-data.js")

# Enough spins that the pool does not repeat itself in a sitting, small enough
# that the file stays loadable. The base game gets ten times as many because it
# is where a player actually spends the session.
POOL_SIZE = {"base": 2500, "bonus": 250, "bonus_hits": 250, "bonus_epic": 250}
SEED = 20260822


def read_books(path):
    with open(path, "rb") as handle:
        with zstd.ZstdDecompressor().stream_reader(handle) as reader:
            data = reader.read().decode("utf-8")
    return {json.loads(line)["id"]: json.loads(line) for line in data.splitlines() if line}


def read_weights(path):
    ids, weights = [], []
    with open(path, newline="", encoding="utf-8") as handle:
        for row in csv.reader(handle):
            if not row:
                continue
            ids.append(int(row[0]))
            weights.append(float(row[1]))
    return ids, weights


def catalogue_for(books):
    """Named book ids the play shell can force (?book=<name> in the stub), one per
    presentation shape of THIS game: the cap, a natural or bought trigger, a
    base-game conversion, a 3x3-or-larger block, a ladder step inside the
    feature, a SUPER head start (x2 from the first spin) and a dead spin."""
    found = {"maxWin": None, "trigger": None, "transfer": None, "block3": None,
             "ladderStep": None, "superStart": None, "dead": None}
    best = -1
    for book_id, book in books.items():
        payout = book["payoutMultiplier"]
        if payout > best:
            best, found["maxWin"] = payout, book_id
        types = [e["type"] for e in book["events"]]
        first = book["events"][0]
        if found["trigger"] is None and "freeSpinTrigger" in types:
            found["trigger"] = book_id
        if found["transfer"] is None and "wildTransfer" in types and first.get("gameType") == "basegame":
            found["transfer"] = book_id
        if found["block3"] is None and any(bar["size"] >= 3 for bar in first.get("bars", [])):
            found["block3"] = book_id
        if found["ladderStep"] is None and "freeSpinRetrigger" in types:
            found["ladderStep"] = book_id
        if found["superStart"] is None and any(
            e["type"] == "freeSpinTrigger" and e["totalFs"] == 9 for e in book["events"]
        ):
            found["superStart"] = book_id
        if found["dead"] is None and payout == 0 and "wildTransfer" not in types:
            found["dead"] = book_id
    return found


def main():
    index = json.load(open(os.path.join(BUNDLE, "index.json"), encoding="utf-8"))
    rng = random.Random(SEED)
    data, catalogue = {}, {}
    for mode in index["modes"]:
        name = mode["name"]
        books = read_books(os.path.join(BUNDLE, mode["events"]))
        ids, weights = read_weights(os.path.join(BUNDLE, mode["weights"]))
        pool = rng.choices(ids, weights=weights, k=POOL_SIZE.get(name, 250))
        cat = catalogue_for(books)
        keep = set(pool) | {book_id for book_id in cat.values() if book_id is not None}
        key = name.upper()
        data[key] = {
            "cost": mode["cost"],
            "pool": pool,
            "books": {str(book_id): books[book_id] for book_id in sorted(keep)},
        }
        catalogue[key] = cat
        print(f"  {name:<11} pool={len(pool):<5} books={len(keep):<5} maxWin id={cat['maxWin']}")

    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write("window.__STUB_DATA__=" + json.dumps(data, separators=(",", ":")) + "\n")
        handle.write("window.__STUB_CATALOGUE__=" + json.dumps(catalogue) + "\n")
    print(f"wrote {OUT} ({os.path.getsize(OUT) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
