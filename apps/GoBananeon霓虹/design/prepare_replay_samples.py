"""Copy two real math books into the local replay harness's small fixtures.

Run with the math-sdk virtual environment (it supplies zstandard):
    E:/stake/math-sdk/env/Scripts/python.exe design/prepare_replay_samples.py

The source books stay untouched. The selected ids are printed so the same
presentation can be replayed during animation reviews.
"""

import json
from pathlib import Path

import zstandard as zstd


APP = Path(__file__).resolve().parents[1]
MATH_BOOKS = (
    Path(__file__).resolve().parents[4]
    / "math-sdk/games/GoBananeon霓虹/library/publish_files"
)
OUT = APP / "src/stories/data"


def find_book(mode, predicate):
    source = MATH_BOOKS / f"books_{mode}.jsonl.zst"
    if not source.is_file():
        raise FileNotFoundError(source)
    with zstd.open(source, "rt", encoding="utf-8") as books:
        for line in books:
            book = json.loads(line)
            if predicate(book):
                return book
    raise RuntimeError(f"No suitable {mode} book in {source}")


def has_multi_win(book):
    return any(
        event.get("type") == "winInfo" and len(event.get("wins", [])) >= 2
        for event in book["events"]
    )


def save(name, book):
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{name}_books.ts"
    target.write_text("export default " + json.dumps([book], ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"{name}: id={book['id']} x{book['payoutMultiplier']} -> {target}")


def main():
    base = find_book(
        "base",
        lambda book: has_multi_win(book)
        and not any(event.get("type") == "freeSpinTrigger" for event in book["events"]),
    )
    bonus = find_book(
        "bonus100",
        lambda book: has_multi_win(book)
        and any(event.get("type") == "blastReels" for event in book["events"])
        and any(event.get("type") == "freeSpinEnd" for event in book["events"]),
    )
    save("base", base)
    save("bonus100", bonus)


if __name__ == "__main__":
    main()
