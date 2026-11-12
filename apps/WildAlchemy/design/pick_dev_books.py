"""Fill src/dev/devBooks.json (the ?mock=1 dev server) with real books.

    python design/pick_dev_books.py [bundle_dir]

Default bundle: math-sdk/games/wild_alchemy/library/publish_files, falling back
to upload/WildAlchemy/math. While the math is still Hard Time's, pass
upload/HardTime/math explicitly. Picks one or two books per shape so every
presentation path can be replayed locally.
"""
import json
import sys
from pathlib import Path

import zstandard as zstd

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
OUT = APP / "src/dev/devBooks.json"

# Reference-game rounds (SPEC §6 representative books), replayed in dev with
# ?mock=1&book=ref_<mode>_<id> to compare our rhythm with the recorded one.
# Same event format as ours (no padding, 0-based lineIndex); their `B` cells
# render as the blank card (assets.ts waBlank).
REFERENCE = ROOT / "research/xinstar-angelodin/血月伯爵/stake/books"
REFERENCE_PICKS = {
    "base": [5, 12, 48, 52, 72, 83, 85, 86, 100, 111, 118, 41, 34, 114, 116, 16, 33, 43, 45],
    "bonus": [1],
    "super_bonus": [1, 2, 3],
}


def bundle_dir():
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).resolve()
    for cand in (
        ROOT / "math-sdk/games/wild_alchemy/library/publish_files",
        ROOT / "math-sdk/games/wild_alchemy/library/books",
        ROOT / "upload/WildAlchemy/math",
    ):
        if cand.exists() and any(cand.glob("books_*")):
            return cand
    raise SystemExit("no bundle found; pass one")


def books(bundle, mode):
    """Published .jsonl.zst, or the plain .jsonl a smoke run writes."""
    zst = bundle / f"books_{mode}.jsonl.zst"
    plain = bundle / f"books_{mode}.jsonl"
    if zst.exists():
        raw = zstd.ZstdDecompressor().stream_reader(open(zst, "rb")).read().decode()
    elif plain.exists():
        raw = plain.read_text(encoding="utf-8")
    else:
        return
    for line in raw.splitlines():
        if line.strip():
            yield json.loads(line)


def types(b):
    return [e["type"] for e in b["events"]]


def entry(b):
    return {"id": b["id"], "payoutMultiplier": b["payoutMultiplier"], "state": b["events"]}


def main():
    bundle = bundle_dir()
    out = {"baseWin": [], "baseTransfer": [], "baseBlock": [], "baseNoWin": [], "baseTrigger": [], "bonus": [], "superBonus": []}
    for b in books(bundle, "base"):
        t = types(b)
        reveal = b["events"][0]
        big = any(bar["size"] >= 3 for bar in reveal.get("bars", []))
        if "freeSpinTrigger" in t:
            if len(out["baseTrigger"]) < 1:
                out["baseTrigger"].append(entry(b))
        elif "wildTransfer" in t and len(out["baseTransfer"]) < 2:
            out["baseTransfer"].append(entry(b))
        elif big and len(out["baseBlock"]) < 2:
            out["baseBlock"].append(entry(b))
        elif b["payoutMultiplier"] > 0 and len(out["baseWin"]) < 2:
            out["baseWin"].append(entry(b))
        elif b["payoutMultiplier"] == 0 and len(out["baseNoWin"]) < 1:
            out["baseNoWin"].append(entry(b))
        if all(len(v) >= 1 for k, v in out.items() if k.startswith("base")) and len(out["baseWin"]) >= 2 and len(out["baseTransfer"]) >= 2 and len(out["baseBlock"]) >= 2:
            break
    for key, mode in (("bonus", "bonus"), ("superBonus", "super_bonus")):
        for b in books(bundle, mode):
            out[key].append(entry(b))
            break
    if REFERENCE.exists():
        for mode, ids in REFERENCE_PICKS.items():
            wanted = set(ids)
            for b in books(REFERENCE, mode):
                if b["id"] in wanted:
                    out[f"ref_{mode}_{b['id']}"] = [entry(b)]
    OUT.write_text(json.dumps(out, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"bundle {bundle}")
    for k, v in out.items():
        print(f"  {k:12s} {[(e['id'], e['payoutMultiplier']) for e in v]}")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
