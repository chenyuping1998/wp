#!/usr/bin/env python3
"""style_shots.py — 進 demo 拍 loading、開場說明格、主遊戲（橫式＋直式），不轉輪。

    python scripts/style_shots.py --all
    python scripts/style_shots.py le-viking le-king

直接開遊戲本體的網址（官網 iframe 裡載的那個 index.html），全畫面拍，不經過官網外框。
不轉輪、不吃手數：只載入、拍照、點一下關掉開場說明格。

輸出 Games/<slug>/reports/style/shots/：
  desktop_load_XX.png    載入過程（每 0.6 秒一張，畫面沒變的去掉）
  desktop_splash.png     載完、還沒點的那一格（多半是開場說明格）
  desktop_base.png       點掉之後的主遊戲
  desktop_base_late.png  再等幾秒（看環境動態）
  mobile_*.png           同上，390×844 直式
  shots.json             每張的時間點與畫面變化量
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent
URL = ("https://static-live.hacksawgaming.com/{id}/{ver}/index.html?language=en&channel={ch}"
       "&gameid={id}&mode=2&token=123131&lobbyurl=https%3A%2F%2Fwww.hacksawgaming.com"
       "&currency=EUR&partner=demo&env=https://rgs-demo.hacksawgaming.com/api"
       "&realmoneyenv=https://rgs-demo.hacksawgaming.com/api")
HEADLESS = "--headless" in sys.argv
VIEWS = {"desktop": ({"width": 1280, "height": 720}, "desktop"),
         "mobile": ({"width": 390, "height": 844}, "mobile")}


def changed(a, b):
    """兩張截圖有多少比例的像素明顯不同（縮小到 160×90 比）。"""
    import io as _io
    from PIL import Image, ImageChops
    x = Image.open(_io.BytesIO(a)).convert("L").resize((160, 90))
    y = Image.open(_io.BytesIO(b)).convert("L").resize((160, 90))
    d = ImageChops.difference(x, y).point(lambda v: 255 if v > 40 else 0)
    return sum(1 for v in d.getdata() if v) / float(160 * 90)


async def shoot(browser, gid, ver, kind, out: Path, log: list):
    vp, ch = VIEWS[kind]
    ctx = await browser.new_context(viewport=vp, device_scale_factor=2 if kind == "mobile" else 1,
                                    is_mobile=kind == "mobile", has_touch=kind == "mobile")
    page = await ctx.new_page()
    seen = []
    last_resp = [0.0]

    def on_resp(r):
        seen.append(r.url)
        last_resp[0] = asyncio.get_event_loop().time()
    page.on("response", on_resp)
    t0 = asyncio.get_event_loop().time()
    await page.goto(URL.format(id=gid, ver=ver, ch=ch), wait_until="domcontentloaded", timeout=90000)
    last, n = None, 0
    loaded_at = None
    api_at, ref = None, None
    # 載入過程：每 0.6 秒一張，畫面沒變的不存；看到 gameInfo/authenticate 回來後再等 3 秒算載完
    last_saved = -9.0
    for i in range(300):
        await asyncio.sleep(0.6)
        png = await page.screenshot()
        h = hashlib.md5(png).hexdigest()
        t = asyncio.get_event_loop().time() - t0
        # 前 10 秒每次變化都存；之後最多每 3 秒存一張（進度條一直在動）
        if h != last and (t < 10 or t - last_saved >= 3):
            last_saved = t
            p = out / ("%s_load_%02d.png" % (kind, n))
            p.write_bytes(png)
            log.append({"file": p.name, "t": round(t, 2)})
            n += 1
            last = h
        if api_at is None and any(k in u for u in seen for k in ("gameLaunch", "/play/authenticate")):
            api_at, ref = t, png
        # 載完 = API 已經回來、而且 4 秒沒有再抓任何資產（載入頁在抓圖時一直有請求）
        quiet = asyncio.get_event_loop().time() - last_resp[0]
        if api_at is not None and loaded_at is None and t - api_at > 2 and quiet >= 4:
            loaded_at = t
        if loaded_at is not None and t - loaded_at > 3:
            break
        if api_at is not None and t - api_at > 150:
            break
    await asyncio.sleep(2)
    (out / ("%s_splash.png" % kind)).write_bytes(await page.screenshot())
    log.append({"file": "%s_splash.png" % kind, "t": round(asyncio.get_event_loop().time() - t0, 2),
                "loaded_at": round(loaded_at, 2) if loaded_at else None,
                "api_seen": sorted({u.split("?")[0][-60:] for u in seen if "/api/" in u})[:20]})
    # 點掉開場說明格（點畫面中間偏下，避開按鈕）
    await page.mouse.click(vp["width"] // 2, int(vp["height"] * 0.55))
    await asyncio.sleep(4)
    (out / ("%s_base.png" % kind)).write_bytes(await page.screenshot())
    await asyncio.sleep(6)
    (out / ("%s_base_late.png" % kind)).write_bytes(await page.screenshot())
    log.append({"file": "%s_base.png / %s_base_late.png" % (kind, kind),
                "t": round(asyncio.get_event_loop().time() - t0, 2)})
    await ctx.close()


async def run(slugs):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS, args=["--use-gl=angle", "--ignore-gpu-blocklist"])
        for slug in slugs:
            g = ROOT / "Games" / slug
            meta = json.loads((g / "game.json").read_text(encoding="utf-8"))
            out = g / "reports" / "style" / "shots"
            out.mkdir(parents=True, exist_ok=True)
            log = []
            for kind in ("desktop", "mobile"):
                try:
                    await asyncio.wait_for(shoot(browser, meta["gameId"], meta["version"], kind, out, log), 260)
                except Exception as e:
                    log.append({"error": "%s: %s" % (kind, e)})
            (out / "shots.json").write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")
            errs = [l["error"] for l in log if "error" in l]
            print("== %-36s %d 張%s" % (slug, len(list(out.glob("*.png"))),
                                         "  ⚠️ " + "；".join(errs) if errs else ""), flush=True)
        await browser.close()


def main(argv):
    if argv[:1] == ["--list"]:
        slugs = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
        for s_ in slugs:
            d = ROOT / "Games" / s_ / "reports" / "style" / "shots"
            if d.exists():
                for p in d.glob("*.png"):
                    p.unlink()
    elif argv[:1] == ["--all"]:
        slugs = sorted(json.loads((ROOT / "Games" / "_scan_characters.json").read_text(encoding="utf-8")))
        slugs = [s for s in slugs if not (ROOT / "Games" / s / "reports" / "style" / "shots" / "desktop_base.png").exists()]
    else:
        slugs = argv
    asyncio.run(run([s for s in slugs if not s.startswith("--") and not s.endswith(".json")]))


if __name__ == "__main__":
    main(sys.argv[1:])
