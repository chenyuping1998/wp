#!/usr/bin/env python3
"""export_all_characters.py — Games/_character_candidates.json 裡每具角色骨架做成 motion pack。

    python scripts/export_all_characters.py            # 全部（做過的跳過）
    python scripts/export_all_characters.py --jobs 4

每具：export_pack.py（含三條路線的重現度實測）→ motionlib --verify。
結果寫 Games/_packs_status.json：id、來源、骨／動畫數、重現度、verify、失敗原因。
pack id = <遊戲>__<骨架名>（小寫、非英數換底線）。已經在動作庫的（Miami 五隻、
三代浣熊）不重做。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable
PACKS = ROOT / "spineplay" / "packs"
STATUS = ROOT / "Games" / "_packs_status.json"
SKIP = {("miami-mayhem", n) for n in ("character_boss", "character_main_guy", "character_main_girl",
                                      "character_bikinigirl", "character_green_guy", "high_4", "high_5")}
SKIP |= {("le-bandit", "raccoon"), ("le-bandit-hold-%26-win", "smokey"),
         ("le-bandit-hold-and-win", "smokey"), ("le-prechaun", "smokey")}
lock = threading.Lock()


def pack_id(slug, name):
    s = re.sub(r"[^a-z0-9]+", "_", unquote(slug).lower()).strip("_")
    n = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return "%s__%s" % (s, n)


def save(status):
    with lock:
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=1), encoding="utf-8")


def one(c, status, timeout):
    pid = pack_id(c["slug"], c["name"]) + ("__" + pack_id("", c["skin"]).strip("_") if c.get("skin") else "")
    if status.get(pid, {}).get("verify") == "ok" and (PACKS / (pid + ".motion.json")).exists():
        return pid, "已做過"
    t0 = time.time()
    rec = {"slug": c["slug"], "skeleton": c["file"], "bones": c["bones"], "anims": c["anims"],
           "skin": c.get("skin")}
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    try:
        p = subprocess.run([PY, "spineplay/export_pack.py", c["file"], "--name", pid, "-o", str(PACKS)]
                           + (["--skin", c["skin"]] if c.get("skin") else []),
                           cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env,
                           timeout=timeout)
        out = p.stdout.decode("utf-8", "replace")
        if p.returncode != 0 or not (PACKS / (pid + ".motion.json")).exists():
            rec["error"] = out.strip().splitlines()[-1][:300] if out.strip() else "export 失敗"
        else:
            pk = json.loads((PACKS / (pid + ".motion.json")).read_text(encoding="utf-8"))
            rec.update({"fidelity": pk.get("fidelity"), "route": pk.get("route"),
                        "kb": round((PACKS / (pid + ".motion.json")).stat().st_size / 1024)})
            v = subprocess.run([PY, "spineplay/motionlib.py", "-c", pid, "--verify"], cwd=ROOT,
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env, timeout=1800)
            vo = v.stdout.decode("utf-8", "replace")
            rec["verify"] = "ok" if "verify OK" in vo else (vo.strip().splitlines()[-1][:200] if vo.strip() else "?")
    except subprocess.TimeoutExpired:
        rec["error"] = "逾時（%d 秒）" % timeout
    rec["seconds"] = round(time.time() - t0)
    status[pid] = rec
    save(status)
    msg = rec.get("error") or "fid %s  verify %s" % (rec.get("fidelity"), rec.get("verify"))
    return pid, msg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--timeout", type=int, default=3600)
    ap.add_argument("--only", nargs="*")
    a = ap.parse_args()
    cands = json.loads((ROOT / "Games" / "_character_candidates.json").read_text(encoding="utf-8"))
    cands = [c for c in cands if (c["slug"], c["name"]) not in SKIP]
    if a.only:
        cands = [c for c in cands if pack_id(c["slug"], c["name"]) in a.only or c["slug"] in a.only]
    # 換裝骨架（多個具名 skin）：每個 skin 各做一個 pack
    exp = []
    for c in cands:
        d = json.loads(Path(ROOT / c["file"]).read_text(encoding="utf-8"))
        sk = d.get("skins")
        names = [x["name"] for x in sk if x.get("name") != "default"] if isinstance(sk, list) else []
        exp += [dict(c, skin=n) for n in names] if names else [c]
    cands = exp
    cands.sort(key=lambda c: c["bones"] * max(1, c["anims"]))      # 小的先做，早點看到結果
    status = json.loads(STATUS.read_text(encoding="utf-8")) if STATUS.exists() else {}
    print("要做 %d 具" % len(cands), flush=True)
    done = 0
    with ThreadPoolExecutor(a.jobs) as ex:
        futs = [ex.submit(one, c, status, a.timeout) for c in cands]
        for fu in as_completed(futs):
            pid, msg = fu.result()
            done += 1
            print("[%3d/%d] %-52s %s" % (done, len(cands), pid, msg), flush=True)
    ok = sum(1 for v in status.values() if v.get("verify") == "ok")
    print("\n完成：%d 具 verify OK、%d 具失敗" % (ok, sum(1 for v in status.values() if v.get("error"))))


if __name__ == "__main__":
    main()
