#!/usr/bin/env python3
"""fetch_style.py — 風格抄錄要的素材：圖集、spine、gameconfig、英文字型、前端 bundle、規則頁。

    python scripts/fetch_style.py --all          # Games/_scan_characters.json 裡的全部
    python scripts/fetch_style.py le-viking      # 指定幾款

全部從 static CDN 抓，不進 demo。每款約 10–25 MB（不抓 30 國語言字型、不抓音檔本體，
音效只留 desc.json 裡的檔名清單）。ktx2 會轉成 png（style_report.py 要取色）。
"""
from __future__ import annotations

import glob
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable
INCLUDE = ["common/atlas/", "common/spine/", "/config/", "font/localized/en-us/",
           "gameinfoassets/templates/en-us/"]
EXT = [".ktx2", ".png", ".webp", ".jpg", ".json", ".atlas", ".fnt", ".html"]
EXTRA = ["main.js", "index.html", "ui.min.css"]


def one(slug):
    g = ROOT / "Games" / slug
    gj = g / "game.json"
    if not gj.exists():
        return slug, "❌ 沒有 game.json（先跑 scan_characters.py）"
    meta = json.loads(gj.read_text(encoding="utf-8"))
    gid, ver = meta["gameId"], meta["version"]
    p = subprocess.run([PY, "scripts/fetch_assets.py", "--game", gid, "--ver", ver,
                        "--out", str(g / "assets"), "--include", *INCLUDE, "--ext", *EXT,
                        "--extra", *EXTRA],
                       cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    lines = p.stdout.decode("utf-8", "replace").strip().splitlines()
    msg = lines[-2] if len(lines) > 1 else (lines[-1] if lines else "")
    dirs = {os.path.dirname(f) for f in glob.glob(str(g / "assets" / "**" / "*.ktx2"), recursive=True)}
    for d in dirs:
        subprocess.run(["node", "scripts/ktx2png.mjs", d], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ok = (g / "assets" / gid / ver / "main.js").exists()
    return slug, "%s %s  %s%s" % (gid, ver, msg, "" if ok else "  ⚠️ 沒有 main.js")


def main(argv):
    if argv[:1] == ["--all"]:
        slugs = sorted(json.loads((ROOT / "Games" / "_scan_characters.json").read_text(encoding="utf-8")))
    else:
        slugs = argv
    print("抓 %d 款的風格素材" % len(slugs), flush=True)
    with ThreadPoolExecutor(4) as ex:
        for slug, msg in ex.map(one, slugs):
            print("== %-36s %s" % (slug, msg), flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
