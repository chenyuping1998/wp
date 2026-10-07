#!/usr/bin/env python3
"""fetch_assets.py — 照 desc.json 的檔案樹批次下載遊戲資產。

    # 先用 assets.py 抓到 gameId/version,或直接給
    python fetch_assets.py --game 1897 --ver 1.5.1 --out <資料夾> --list
    python fetch_assets.py --game 1897 --ver 1.5.1 --out <資料夾> \
        --include spine/ atlas/ gameinfoassets/ --ext .ktx2 .atlas .json .png

`assets/desc.json` 是遊戲自己的檔案樹（含每個檔的 size),所以：
  1. 下載前就算得出總量,不用邊抓邊猜
  2. 拿得到【延遲載入】的資產 —— 不必真的把遊戲玩到 FG 才看得到請求

預設排除 .ttf（多語系字型 73MB,用不到）和 .mp4（.webm 的 Safari 備援,重複）。
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

CDN = "https://static-live.hacksawgaming.com"
UA = {"User-Agent": "Mozilla/5.0", "Referer": CDN + "/"}

# Windows 主控台預設 cp950,摘要裡的 ✅／✗ 會炸 UnicodeEncodeError
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass


def fetch(url: str, timeout: int = 90) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA),
                                  timeout=timeout).read()


def flatten(node: dict) -> list[tuple[str, int, str]]:
    """desc.json 的樹 → [(path, size, extension)]。"""
    out: list[tuple[str, int, str]] = []

    def walk(n: dict) -> None:
        if n.get("type") == "file":
            out.append((n["path"], n.get("size", 0), n.get("extension", "")))
        for c in n.get("children") or []:
            walk(c)

    walk(node)
    return out


def main(args) -> int:
    base = f"{args.cdn}/{args.game}/{args.ver}/"
    out = Path(args.out) / args.game / args.ver
    out.mkdir(parents=True, exist_ok=True)

    desc_local = out / "assets" / "desc.json"
    if desc_local.exists() and not args.refresh:
        desc = json.loads(desc_local.read_text("utf-8"))
    else:
        print(f"抓檔案樹 {base}assets/desc.json")
        raw = fetch(base + "assets/desc.json")
        desc_local.parent.mkdir(parents=True, exist_ok=True)
        desc_local.write_bytes(raw)
        desc = json.loads(raw.decode("utf-8"))

    files = flatten(desc)
    # 額外的非 assets/ 檔案（desc.json 只涵蓋 assets/ 底下）
    extra = [(p, 0, Path(p).suffix) for p in args.extra]

    def wanted(path: str, ext: str) -> bool:
        if ext in args.exclude_ext:
            return False
        if args.ext and ext not in args.ext:
            return False
        if args.include and not any(inc in path for inc in args.include):
            return False
        return True

    picked = [(p, s, e) for p, s, e in files if wanted(p, e)] + extra
    total = sum(s for _, s, _ in picked)
    print(f"\n選中 {len(picked)} 檔 / {total / 1e6:.2f} MB"
          f"（全樹 {len(files)} 檔 / {sum(s for _, s, _ in files) / 1e6:.2f} MB）")
    if args.list:
        for p, s, _ in sorted(picked, key=lambda x: -x[1])[:args.list]:
            print(f"   {s / 1e6:8.3f} MB  {p}")
        print("\n（--list 只看不抓。確認後去掉 --list）")
        return 0

    done = skipped = failed = 0
    got_bytes = 0

    def one(item: tuple[str, int, str]) -> None:
        nonlocal done, skipped, failed, got_bytes
        rel, size, _ = item
        fp = out / rel
        if fp.exists() and (size == 0 or fp.stat().st_size == size):
            skipped += 1
            return
        try:
            body = fetch(base + rel)
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as ex:
            failed += 1
            print(f"   ✗ {rel}  {ex}")
            return
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_bytes(body)
        done += 1
        got_bytes += len(body)
        if done % 20 == 0:
            print(f"   … {done} 檔 / {got_bytes / 1e6:.1f} MB")

    with ThreadPoolExecutor(max_workers=args.jobs) as ex:
        list(ex.map(one, picked))

    print(f"\n✅ 新抓 {done} 檔 / {got_bytes / 1e6:.2f} MB"
          f"　已存在跳過 {skipped}　失敗 {failed}")
    print(f"💾 {out}")
    return 1 if failed else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="照 desc.json 批次下載遊戲資產")
    ap.add_argument("--game", required=True, help="gameId,例 1897")
    ap.add_argument("--ver", required=True, help="版本,例 1.5.1")
    ap.add_argument("--out", required=True, help="輸出根目錄")
    ap.add_argument("--cdn", default=CDN)
    ap.add_argument("--include", nargs="*", default=[],
                    help="路徑要含這些字串之一（空=全部）")
    ap.add_argument("--ext", nargs="*", default=[], help="只要這些副檔名（空=全部）")
    ap.add_argument("--exclude-ext", nargs="*", default=[".ttf", ".mp4"],
                    help="排除的副檔名（預設排 .ttf 字型 73MB / .mp4 音效備援）")
    ap.add_argument("--extra", nargs="*",
                    default=["gameinfoassets/templates/en-us/en-us-gameinfo.html"],
                    help="desc.json 沒涵蓋、但要一起抓的相對路徑")
    ap.add_argument("--jobs", type=int, default=8)
    ap.add_argument("--refresh", action="store_true", help="重抓 desc.json")
    ap.add_argument("--list", type=int, nargs="?", const=40, default=0, metavar="N",
                    help="只列出不下載（顯示最大的 N 個）")
    raise SystemExit(main(ap.parse_args()))
