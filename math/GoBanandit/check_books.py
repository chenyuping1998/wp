"""Walk every published book and assert what the game tells the player.

    PYTHONPATH=. python games/GoBanandit/check_books.py

Nothing in the SDK checks the mechanic itself (run.py proves consistency, the
format checks prove shape). Each rule here is a sentence in the rules page.
"""

import json
import os
import sys
from collections import Counter

import zstandard

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from game_config import GameConfig  # noqa: E402

cfg = GameConfig()
BOOKS = os.path.join(HERE, "library", "publish_files")
THRESH = cfg.meter_thresholds
MULTS = cfg.collect_mults


def books(mode):
    with open(os.path.join(BOOKS, f"books_{mode}.jsonl.zst"), "rb") as f:
        data = zstandard.ZstdDecompressor().stream_reader(f).read()
    for line in data.splitlines():
        if line.strip():
            yield json.loads(line)


def level_of(count):
    return sum(1 for t in THRESH if count >= t)


def main():
    fails = Counter()
    seen = Counter()
    examples = {}

    def fail(key, bid):
        fails[key] += 1
        examples.setdefault(key, bid)

    for mode in ("base", "bonus", "superbonus"):
        start = cfg.buy_start_meter.get(mode, 0)
        for b in books(mode):
            bid = f"{mode}#{b['id']}"
            meter = None
            level = 0
            board = None
            gametype = None
            tot_fs = None
            for e in b["events"]:
                t = e["type"]
                if t == "freeSpinTrigger":
                    meter = start
                    level = level_of(start)
                    tot_fs = e["totalFs"]
                    seen["trigger"] += 1
                    if mode != "base" and tot_fs != cfg.buy_spins[mode]:
                        fail("buy spins", bid)
                elif t == "reveal":
                    board = [col[1:-1] for col in e["board"]]  # strip padding
                    gametype = e["gameType"]
                    for r, col in enumerate(board):
                        for sym in col:
                            if sym["name"] == "W" and r == 0:
                                fail("W on reel 1", bid)
                            if sym["name"] == "S" and gametype == "freegame":
                                fail("S in free spins", bid)
                            if sym["name"] == "P" and not sym.get("prize"):
                                fail("sack without value", bid)
                            # the rules page: 1x-50x in the base game, up to 250x in free spins
                            if sym["name"] == "P" and sym.get("prize", 0) > (250 if gametype == "freegame" else 50):
                                fail("sack value above the rules page's range", bid)
                    ws = sum(1 for col in board for s in col if s["name"] == "W")
                    ps = sum(1 for col in board for s in col if s["name"] == "P")
                    b.setdefault("_pending", []).append((ws, ps))
                elif t == "collect":
                    seen["collect"] += 1
                    ws = [(c["reel"], c["row"]) for c in e["collectors"]]
                    sacks = e["sacks"]
                    board_ws = [(r, w) for r, col in enumerate(board) for w, s in enumerate(col) if s["name"] == "W"]
                    board_ps = [
                        (r, w, s["prize"]) for r, col in enumerate(board) for w, s in enumerate(col) if s["name"] == "P"
                    ]
                    if sorted(ws) != sorted(board_ws):
                        fail("collectors != Bandits on board", bid)
                    if sorted((s["reel"], s["row"], s["value"]) for s in sacks) != sorted(board_ps):
                        fail("sacks != Sacks on board", bid)
                    per = sum(s["value"] for s in sacks)
                    if e["perCollector"] != per * 100:
                        fail("perCollector != sum of sacks", bid)
                    want_mult = MULTS[level] if gametype == "freegame" else 1
                    if e["mult"] != want_mult:
                        fail("collect mult != meter level", bid)
                    full = per * len(ws) * want_mult * 100
                    if e["amount"] != full:
                        # only a max-win cut may shorten it
                        if not any(x["type"] == "wincap" for x in b["events"]):
                            fail("collect amount wrong (no wincap)", bid)
                    if want_mult > 1:
                        seen[f"collect x{want_mult}"] += 1
                elif t == "banditMeter":
                    before = meter
                    meter = e["count"]
                    new_level = level_of(meter)
                    if meter - before != e["added"]:
                        fail("meter added != count delta", bid)
                    ups = new_level - level
                    if e["levelUp"] != ups or e["spinsAdded"] != ups * cfg.meter_spins_added:
                        fail("level-up / spins added", bid)
                    level = new_level
                    if e["level"] != level or e["mult"] != MULTS[level]:
                        fail("meter level/mult", bid)
                    if ups:
                        seen[f"reach level {level}"] += 1
            # every board with both Bandit and Sack must have collected (unless capped first)
            pend = b.pop("_pending", [])
            n_both = sum(1 for ws, ps in pend if ws and ps)
            n_coll = sum(1 for e in b["events"] if e["type"] == "collect")
            if n_coll != n_both and not any(x["type"] == "wincap" for x in b["events"]):
                fail("board with Bandit+Sack did not collect", bid)

    print("seen:", dict(seen))
    if fails:
        for k, v in fails.items():
            print(f"FAIL {k}: {v} (e.g. {examples[k]})")
        sys.exit(1)
    print("OK: every rule holds in every book")


if __name__ == "__main__":
    main()
