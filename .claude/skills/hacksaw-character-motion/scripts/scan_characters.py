#!/usr/bin/env python3
"""scan_characters.py — 整個 Hacksaw 目錄：找出每款的角色骨架，只抓 spine 資產。

    python scripts/scan_characters.py --all            # 官網目錄裡全部的老虎機
    python scripts/scan_characters.py le-viking le-king  # 指定幾款

**不進 demo、不轉輪、不吃手數**：
  1. 官網遊戲頁的 HTML 有 `data-gameid`
  2. `static-live.hacksawgaming.com/<id>/version.json` 給目前版本（launcher 自己就是這樣查的）
  3. `<id>/<ver>/assets/desc.json` 是整棵檔案樹 → fetch_assets.py 只抓 spine/

每款輸出到 Games/<slug>/（game.json、assets/<id>/<ver>/…，desc.json 也留著給風格抄錄用）。
最後寫 Games/_scan_characters.json，並印一張表：骨多、網格多、動畫名像
idle/win/reaction 的就是角色。
"""
from __future__ import annotations

import glob
import json
import os
import re
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable
UA = {"User-Agent": "Mozilla/5.0"}
SITE = "https://www.hacksawgaming.com"
CDN = "https://static-live.hacksawgaming.com"
# 官網目錄裡不是老虎機的（Hacksaw Originals 與小遊戲）
NOT_SLOTS = {"speed-crash", "limbo", "dice", "baccarat", "twenty-one", "colors", "blocks",
             "wheel", "lines", "hi-lo", "plinko", "moneyplane-bail2win", "mines", "keno"}


def get(url, timeout=60):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()


def catalog():
    s = get(SITE + "/games").decode("utf-8", "replace")
    slugs = []
    for m in re.findall(r'href="(?:https://www\.hacksawgaming\.com)?/games/([^"/?#]+)"', s):
        if m not in slugs and m.lower() not in NOT_SLOTS:
            slugs.append(m)
    return slugs


def ident(slug):
    html = get("%s/games/%s" % (SITE, slug)).decode("utf-8", "replace")
    m = re.search(r'data-gameid="(\d+)"', html)
    if not m:
        return None
    gid = m.group(1)
    name = re.search(r"<title>([^<|]+)", html)
    ver = json.loads(get("%s/%s/version.json" % (CDN, gid)))["version"]
    return gid, ver, (name.group(1).strip() if name else slug)


def skeletons(folder: Path):
    rows = []
    for f in glob.glob(str(folder / "**" / "*.json"), recursive=True):
        if os.sep + "spine" + os.sep not in f and "/spine/" not in f:
            continue
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(d, dict) or "bones" not in d or "skeleton" not in d:
            continue
        skins = d.get("skins")
        sk = skins if isinstance(skins, list) else [{"attachments": v} for v in (skins or {}).values()]
        meshes = sum(1 for s in sk for sl in (s.get("attachments") or {}).values()
                     for a in sl.values() if isinstance(a, dict) and a.get("type") in ("mesh", "linkedmesh"))
        anims = list((d.get("animations") or {}).keys())
        rows.append({"file": os.path.relpath(f, ROOT).replace("\\", "/"),
                     "spine": d["skeleton"].get("spine"), "bones": len(d["bones"]),
                     "meshes": meshes, "anims": len(anims), "anim_names": anims[:12]})
    return rows


def one(slug):
    g = ROOT / "Games" / slug
    log = []
    try:
        idv = ident(slug)
    except Exception as e:
        return slug, None, ["❌ 讀不到 gameId/version：%s" % e]
    if not idv:
        return slug, None, ["❌ 頁面上沒有 data-gameid"]
    gid, ver, name = idv
    g.mkdir(parents=True, exist_ok=True)
    gj = g / "game.json"
    meta = json.loads(gj.read_text(encoding="utf-8")) if gj.exists() else {}
    meta.update({"slug": slug, "url": "%s/games/%s" % (SITE, slug), "gameId": gid, "version": ver})
    meta.setdefault("name", name)
    gj.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    p = subprocess.run([PY, "scripts/fetch_assets.py", "--game", gid, "--ver", ver,
                        "--out", str(g / "assets"), "--include", "spine/",
                        "--ext", ".json", ".atlas", ".ktx2", ".png", ".webp"],
                       cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    out = p.stdout.decode("utf-8", "replace").strip().splitlines()
    log.append("%s %s  %s" % (gid, ver, out[-2] if len(out) > 1 else (out[-1] if out else "")))
    dirs = {os.path.dirname(f) for f in glob.glob(str(g / "assets" / "**" / "*.ktx2"), recursive=True)}
    for d in dirs:
        subprocess.run(["node", "scripts/ktx2png.mjs", d], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return slug, {"gameId": gid, "version": ver, "name": meta["name"],
                  "skeletons": skeletons(g / "assets")}, log


def main(argv):
    slugs = catalog() if argv[:1] == ["--all"] else argv
    print("掃 %d 款" % len(slugs), flush=True)
    res = {}
    path = ROOT / "Games" / "_scan_characters.json"
    if path.exists():
        res = json.loads(path.read_text(encoding="utf-8"))
    with ThreadPoolExecutor(4) as ex:
        for slug, info, log in ex.map(one, slugs):
            print("== %-36s %s" % (slug, " / ".join(log)), flush=True)
            if info:
                res[slug] = info
                path.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print()
    print("%-28s %-40s %4s %4s %4s  %s" % ("game", "skeleton", "骨", "網格", "動畫", "動畫名"))
    for slug in sorted(res):
        for r in sorted(res[slug]["skeletons"], key=lambda r: -r["bones"]):
            if r["bones"] >= 20:
                print("%-28s %-40s %4d %4d %4d  %s" % (slug[:28], os.path.basename(r["file"])[:40],
                      r["bones"], r["meshes"], r["anims"], ",".join(r["anim_names"][:6])))


if __name__ == "__main__":
    main(sys.argv[1:])
