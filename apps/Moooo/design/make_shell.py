#!/usr/bin/env python3
"""Assemble the Moooo play shell: the production build + a fake RGS.

The shell is the built app with two script tags injected at the top of <head>.
stub.js patches window.fetch and answers the wallet routes from real books, so a
build can be played locally without an RGS.

IT MUST BE OPENED WITH QUERY PARAMS. Without rgs_url the app builds
`https:///wallet/authenticate`, the stub's origin regex cannot strip it, the
request escapes to the real network and the game shows "TypeError: Failed to
fetch". That cost a session's time on Hot Miami; the URL is printed at the end.
"""
import gzip, json, os, shutil, sys, io

ROOT = "/Users/stone/stake-engine"
BUILD = f"{ROOT}/wp/apps/Moooo/build"
DEST = f"{ROOT}/dist/moooo-playtest"
LIB = f"{ROOT}/math-sdk/games/moooo/library/publish_files"
MODES = {"BASE": "base", "BONUS": "bonus", "SUPER": "super"}
PER_MODE = 400

import zstandard

def load(mode_file, limit):
    books = {}
    with open(f"{LIB}/books_{mode_file}.jsonl.zst", "rb") as fh:
        reader = zstandard.ZstdDecompressor().stream_reader(fh)
        for i, line in enumerate(io.TextIOWrapper(reader, encoding="utf-8")):
            if i >= limit: break
            b = json.loads(line)
            books[str(b["id"])] = b
    return books

def main():
    if os.path.exists(DEST): shutil.rmtree(DEST)
    shutil.copytree(BUILD, DEST)

    # Per-mode cost, read from the bundle's own index.json rather than restated.
    #
    # Leaving it out is not a small omission: stub.js does `stake * m.cost`, and
    # with cost undefined the wager becomes NaN, the balance becomes NaN, and
    # `if (cost > balance)` is FALSE for NaN — so the insufficient-funds guard
    # waves it through and the only symptom is a balance that reads $0.00 while
    # the round quietly plays on.
    costs = {m["name"]: float(m["cost"]) for m in json.load(open(f"{LIB}/index.json"))["modes"]}

    data, catalogue = {}, {}
    for key, mode in MODES.items():
        books = load(mode, PER_MODE)
        pool = [int(k) for k in books]
        data[key] = {"books": books, "pool": pool, "cost": costs[mode]}
        # Interesting book ids, so a scenario can be summoned rather than waited for.
        def find(pred):
            for k, b in books.items():
                if pred(b): return int(k)
            return None
        types = lambda b: {e["type"] for e in b["events"]}
        catalogue[key] = {
            "maxWin": find(lambda b: b["payoutMultiplier"] >= 1000000),
            "freeSpins": find(lambda b: "milkMeterInit" in types(b)),
            "meterUpgrade": find(lambda b: "milkMeterUpdate" in types(b)),
            "cowExpands": find(lambda b: "expandCows" in types(b)),
            "cowNoExpand": find(lambda b: "newCows" in types(b) and "expandCows" not in types(b)),
            "dead": find(lambda b: b["payoutMultiplier"] == 0),
        }

    with open(f"{DEST}/stub-data.js", "w") as fh:
        fh.write("window.__STUB_DATA__ = " + json.dumps(data) + ";\n")
        fh.write("window.__STUB_CATALOGUE__ = " + json.dumps(catalogue) + ";\n")
    # The fake-RGS shim. Shared with Hot Miami's shell because it is generic —
    # it answers wallet routes out of whatever books stub-data.js carries and
    # knows nothing about either game.
    shutil.copy(f"{ROOT}/dist/playtest/stub.js", f"{DEST}/stub.js")

    index = f"{DEST}/index.html"
    html = open(index).read()
    assert "stub.js" not in html
    html = html.replace("<head>", '<head>\n<script src="./stub-data.js"></script>\n<script src="./stub.js"></script>\n', 1)
    open(index, "w").write(html)

    print(f"shell at {DEST}")
    print("catalogue:", json.dumps(catalogue, indent=1))


if __name__ == "__main__":
    main()
