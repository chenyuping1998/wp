"""Generate dist/playtest/stub-data.js from a published math bundle.

    python design/build_playtest_stub_data.py [bundle] [out.js]
    (defaults: upload/GoBanandit/math -> dist/gobanandit-playtest/stub-data.js)

The play shell (design/playtest_stub.js) answers /wallet/play out of
`window.__STUB_DATA__`, which is a weighted sample of the REAL published books.
That file is ~12MB of generated data and so is not in the repo — but until now
neither was the thing that generates it, which meant every re-run of the maths
silently left the shell playing the previous bundle. A stale shell is worse than
no shell: it looks like the game and disagrees with what ships.

Shape (matching what the stub reads):

    window.__STUB_DATA__ = {MODE: {cost, pool: [id...], books: {id: book}}}
    window.__STUB_CATALOGUE__ = {MODE: {maxWin, scatter3/4/5, wildExpand,
                                        bigFrame, deadWithFrames}}

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
# design -> GoBanandit -> apps -> wp-banandit -> repo root
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
BUNDLE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "upload", "GoBanandit", "math")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "dist", "gobanandit-playtest", "stub-data.js")

# Enough spins that the pool does not repeat itself in a sitting, small enough
# that the file stays loadable. The base game gets ten times as many because it
# is where a player actually spends the session.
POOL_SIZE = {"base": 2500, "bonus": 300, "superbonus": 300}
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
    """Named ids so a probe can summon a rare outcome instead of grinding for it."""
    found = {"maxWin": None, "scatter3": None, "scatter4": None, "scatter5": None,
             "collect": None, "collect2": None, "levelUp": None, "level3": None}
    best = -1.0
    for book_id in sorted(books):
        book = books[book_id]
        events = book["events"]
        payout = float(book["payoutMultiplier"])
        if payout > best:
            best, found["maxWin"] = payout, book_id
        kinds = [e for e in events if e["type"] == "freeSpinTrigger"]
        if kinds:
            key = "scatter%d" % len(kinds[0]["positions"])
            if key in found and found[key] is None:
                found[key] = book_id
        collects = [e for e in events if e["type"] == "collect"]
        if found["collect"] is None and collects and not kinds:
            found["collect"] = book_id
        if found["collect2"] is None and any(len(e["collectors"]) >= 2 for e in collects) and not kinds:
            found["collect2"] = book_id
        ups = [e for e in events if e["type"] == "banditMeter" and e["levelUp"] > 0]
        if found["levelUp"] is None and ups:
            found["levelUp"] = book_id
        if found["level3"] is None and any(e["level"] >= 3 for e in ups):
            found["level3"] = book_id
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
