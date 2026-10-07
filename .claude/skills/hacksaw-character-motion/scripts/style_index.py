#!/usr/bin/env python3
"""style_index.py — 全部遊戲的風格抄錄總覽：一頁看完每款的主畫面、載入頁、開場說明格、取色板。

    python scripts/style_index.py --out <資料夾>     # 預設 Games/_style_library

把每款 Games/<slug>/reports/style/ 複製到 <out>/<slug>/（截圖轉 JPEG、載入過程最多留 6 張，
體積約為原本的 1/5），再寫 <out>/index.html 與 <out>/README.md（總表）。
"""
from __future__ import annotations

import argparse
import html
from urllib.parse import quote
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent


def copy_game(src: Path, dst: Path):
    if dst.exists():
        shutil.rmtree(dst)
    dst.mkdir(parents=True)
    for name in ("style.md", "style.json", "palette.png"):
        if (src / name).exists():
            shutil.copy(src / name, dst / name)
    for sub in ("crops", "states"):
        if (src / sub).exists():
            shutil.copytree(src / sub, dst / sub)
    shots = src / "shots"
    if shots.exists():
        (dst / "shots").mkdir()
        loads = sorted(shots.glob("*_load_*.png"))
        keep = set()
        for kind in ("desktop", "mobile"):
            ks = [p for p in loads if p.name.startswith(kind)]
            if ks:
                step = max(1, len(ks) // 6)
                keep |= set(ks[::step][:6]) | {ks[-1]}
        for p in sorted(shots.glob("*.png")):
            if "_load_" in p.name and p not in keep:
                continue
            Image.open(p).convert("RGB").save(dst / "shots" / (p.stem + ".jpg"), quality=85)
        if (shots / "shots.json").exists():
            shutil.copy(shots / "shots.json", dst / "shots" / "shots.json")
    # 報告裡的 .png 截圖連結改成 .jpg
    md = dst / "style.md"
    if md.exists():
        t = md.read_text(encoding="utf-8")
        for p in (dst / "shots").glob("*.jpg") if (dst / "shots").exists() else []:
            t = t.replace("shots/%s.png" % p.stem, "shots/%s.jpg" % p.stem)
        md.write_text(t, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "Games" / "_style_library"))
    ap.add_argument("--page-only", action="store_true", help="不重新複製，只重寫 index.html / README.md")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for st in sorted((ROOT / "Games").glob("*/reports/style/style.json")):
        R = json.loads(st.read_text(encoding="utf-8"))
        slug = R["slug"]
        if not a.page_only:
            copy_game(st.parent, out / slug)
        b = R.get("bundle") or {}
        fg = [x for x in R["atlases"] if any(k in x["atlas"].lower() for k in ("bonus", "feature", "fs", "popup"))]
        rows.append({
            "slug": slug, "name": html.unescape(R.get("name") or slug), "gameId": R["gameId"], "version": R["version"],
            "atlases": len(R["atlases"]), "skeletons": len(R["spine"]), "states": len(b.get("states") or {}),
            "fg_panels": sum(len(x["regions"]) for x in fg),
            "fonts": ", ".join(sorted({v.get("face") or k for k, v in R["fonts"].items()}))[:80],
            "rules": [s["title"] for s in R["rules"]][:8],
            "base": "%s/shots/desktop_base.jpg" % quote(slug) if (out / slug / "shots" / "desktop_base.jpg").exists() else None,
            "splash": "%s/shots/desktop_splash.jpg" % quote(slug) if (out / slug / "shots" / "desktop_splash.jpg").exists() else None,
            "palette": "%s/palette.png" % quote(slug) if (out / slug / "palette.png").exists() else None,
        })
        print("== %-36s" % slug, flush=True)
    L = ["# Hacksaw 整體風格抄錄 · 總表（%d 款）" % len(rows), "",
         "每款一份 `<slug>/style.md`：載入頁、開場說明格、FG 說明面板、轉場與流程、節奏、畫風、版面、圖集總表。",
         "截圖在 `<slug>/shots/`，取色板 `<slug>/palette.png`，關鍵美術切圖 `<slug>/crops/`，"
         "這款自己的 state 原始碼 `<slug>/states/`。", "",
         "> 圖與截圖是 Hacksaw Gaming 的著作 —— 私人研究用，不散布、不進產品。", "",
         "| 遊戲 | id／版本 | 圖集 | 骨架 | state | FG 面板區塊 | 字型 | 有截圖 |", "|---|---|---|---|---|---|---|---|"]
    for r in rows:
        L.append("| [%s](%s/style.md) | %s / %s | %d | %d | %d | %d | %s | %s |" % (
            r["name"], quote(r["slug"]), r["gameId"], r["version"], r["atlases"], r["skeletons"], r["states"],
            r["fg_panels"], r["fonts"], "✅" if r["base"] else "—"))
    (out / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    cards = []
    for r in rows:
        imgs = "".join('<img loading="lazy" src="%s" alt="">' % html.escape(x)
                       for x in (r["splash"], r["base"]) if x)
        cards.append('<article><h2><a href="%s/style.md">%s</a></h2><p>%s · v%s · 圖集 %d · 骨架 %d · state %d</p>'
                     '<div class="shots">%s</div>%s<p class="rules">%s</p></article>' % (
                         html.escape(quote(r["slug"])), html.escape(r["name"]), r["gameId"], r["version"],
                         r["atlases"], r["skeletons"], r["states"], imgs,
                         '<img class="pal" loading="lazy" src="%s" alt="取色板">' % html.escape(r["palette"]) if r["palette"] else "",
                         html.escape("、".join(r["rules"]))))
    page = """<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Hacksaw 風格庫</title>
<style>:root{color-scheme:dark;--bg:#131318;--panel:#1b1b22;--line:#2b2b36;--ink:#e9e8f0;--dim:#9a98ab;--acc:#e0b04a;
font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",system-ui,sans-serif}
body{margin:0;background:var(--bg);color:var(--ink)}header,main{max-width:1240px;margin:0 auto;padding:24px 16px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
article{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;min-width:0}
h2{margin:0 0 4px;font-size:17px}h2 a{color:var(--acc);text-decoration:none}p{margin:4px 0;color:var(--dim);font-size:13px}
.shots{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}.shots img{width:100%;border-radius:6px;display:block}
.pal{width:100%;max-height:160px;object-fit:cover;object-position:top;border-radius:6px}.rules{font-size:12px}</style></head>
<body><header><h1>Hacksaw 整體風格抄錄 · {{N}} 款</h1><p>每張卡：開場說明格、主遊戲截圖、取色板；點標題看完整紀錄
（載入頁、FG 說明面板、轉場、節奏、畫風、版面）。圖是 Hacksaw 的著作，私人研究用。</p></header>
<main>{{CARDS}}</main></body></html>""".replace("{{N}}", str(len(rows))).replace("{{CARDS}}", "".join(cards))
    (out / "index.html").write_text(page, encoding="utf-8")
    print("寫出 %s（%d 款）" % (out / "index.html", len(rows)))


if __name__ == "__main__":
    main()
