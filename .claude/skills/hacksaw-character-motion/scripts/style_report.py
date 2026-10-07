#!/usr/bin/env python3
"""style_report.py — 每款一份「整體風格抄錄」：載入頁、開場說明格、FG 說明面板、
轉場、節奏、畫風、版面。全部從已下載的資產與 bundle 算出來，每個數字都有出處。

    python scripts/style_report.py --all
    python scripts/style_report.py le-viking

先跑：scan_characters.py（gameId/version）→ fetch_style.py（素材＋bundle）
→（可選）style_shots.py（截圖）。

輸出 Games/<slug>/reports/style/：
  style.md        給人讀的完整紀錄
  style.json      同樣內容的機器可讀版
  crops/          每個圖集區塊切出來的圖（開場說明格、FG 面板、logo、背景…）
  palette.png     關鍵美術的取色板
  states/*.js     這款自己寫的每個 state（開場、FG 進出場、轉場…）的原始碼，斷行過
"""
from __future__ import annotations

import glob
import html as htmlmod
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

ROOT = Path(__file__).resolve().parent.parent
KEY_ATLAS = re.compile(r"splash|bonus|feature|fs|intro|logo|background|bg|loading|preload|misc|ui|frame|reel|title|popup|panel", re.I)
TRANSITION = re.compile(r"intro|outro|transition|enter|exit|appear|remove|start|end|trigger|reveal|in$|out$|open|close|show|hide|land", re.I)
LOOP = re.compile(r"idle|loop|static|setup|ambient", re.I)


# ------------------------------------------------------------------ 讀檔

def res_glob(base, kind, pat):
    """圖集/骨架多半在 default/common/<kind>/，有些款（如 toshi-ways-club）只有 hd/、sd/ —— 退回 hd。"""
    for sub in ("common", "hd"):
        fs = glob.glob(str(base / "assets" / "default" / sub / kind / pat))
        if fs:
            return fs
    return []

def game_dir(slug):
    g = ROOT / "Games" / slug
    meta = json.loads((g / "game.json").read_text(encoding="utf-8"))
    base = g / "assets" / meta["gameId"] / meta["version"]
    return g, meta, base


def desc_files(base):
    f = base / "assets" / "desc.json"
    if not f.exists():
        return []
    out = []

    def walk(n):
        if n.get("type") == "file":
            out.append((n["path"], n.get("size", 0)))
        for c in n.get("children") or []:
            walk(c)
    walk(json.loads(f.read_text(encoding="utf-8")))
    return out


def parse_atlas(path):
    """[(page 檔名, size, {region: {bounds, degrees}})]，多頁也行。"""
    pages, cur, reg = [], None, None
    for raw in open(path, encoding="utf-8", errors="replace").read().splitlines():
        line = raw.rstrip()
        if not line.strip():
            cur = None
            continue
        if cur is None and not line.startswith(" ") and ":" not in line:
            cur = {"page": line.strip(), "size": None, "regions": {}}
            pages.append(cur)
            reg = None
            continue
        if cur is None:
            continue
        if ":" in line:
            k, v = [x.strip() for x in line.split(":", 1)]
            tgt = reg if (reg is not None and (raw.startswith(" ") or k in ("bounds", "xy", "size", "rotate", "offsets", "orig", "offset", "index"))) else None
            if reg is None and k == "size":
                cur["size"] = [int(x) for x in v.split(",")]
            elif tgt is not None:
                if k in ("bounds", "xy", "size", "orig", "offsets", "offset"):
                    try:
                        tgt[k] = [int(x) for x in v.split(",")]
                    except ValueError:
                        pass
                elif k == "rotate":
                    tgt["degrees"] = 90 if v == "true" else (0 if v == "false" else int(v))
            continue
        reg = {"degrees": 0}
        cur["regions"][line.strip()] = reg
    for p in pages:
        for r in p["regions"].values():
            if "bounds" not in r and "xy" in r and "size" in r:
                r["bounds"] = r["xy"] + r["size"]
    return pages


def crop(img, r):
    x, y, w, h = r["bounds"]
    if r.get("degrees") == 90:
        return img.crop((x, y, x + h, y + w)).rotate(90, expand=True)
    return img.crop((x, y, x + w, y + h))


def palette(img, n=8):
    im = img.convert("RGBA")
    im.thumbnail((256, 256))
    px = [p[:3] for p in im.getdata() if p[3] > 200]
    if len(px) < 50:
        return []
    q = Image.new("RGB", (len(px), 1))
    q.putdata(px)
    q = q.quantize(colors=n, method=Image.MEDIANCUT)
    pal = q.getpalette()[:n * 3]
    cnt = Counter(q.getdata())
    tot = float(sum(cnt.values()))
    return [{"hex": "#%02x%02x%02x" % tuple(pal[i * 3:i * 3 + 3]), "share": round(c / tot, 3)}
            for i, c in cnt.most_common(n)]


def anim_duration(a):
    best = 0.0

    def walk(x):
        nonlocal best
        if isinstance(x, dict):
            t = x.get("time")
            if isinstance(t, (int, float)):
                best = max(best, float(t))
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(a)
    return round(best, 3)


def html_text(s):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", s, flags=re.S)
    sections, cur = [], None
    for m in re.finditer(r"<h([1-4])[^>]*>(.*?)</h\1>|<p[^>]*>(.*?)</p>|<li[^>]*>(.*?)</li>", s, re.S):
        if m.group(2) is not None:
            cur = {"title": htmlmod.unescape(re.sub("<[^>]+>", "", m.group(2))).strip(), "text": []}
            sections.append(cur)
        else:
            t = htmlmod.unescape(re.sub("<[^>]+>", " ", m.group(3) or m.group(4) or ""))
            t = re.sub(r"\s+", " ", t).strip()
            if t and cur is not None:
                cur["text"].append(t)
    return sections


def argb(v):
    """'0xFF47E4AE' / '0xD3E349' → '#47e4ae'（含 alpha 時另外回傳）。"""
    if not isinstance(v, str) or not v.startswith("0x"):
        return v
    h = v[2:]
    if len(h) == 8:
        return "#" + h[2:].lower() + ("" if h[:2].upper() == "FF" else " (alpha %s)" % h[:2])
    return "#" + h.lower()


# ------------------------------------------------------------------ bundle
def bundle_info(js, spine_anims):
    out = {}
    ns = sorted(set(re.findall(r'"hacksaw\.games\.([a-z0-9_]+)\.([A-Za-z0-9_.]+)"', js)))
    keys = Counter(k for k, _ in ns)
    gkey = keys.most_common(1)[0][0] if keys else None
    out["namespace"] = gkey
    classes = sorted({c for k, c in ns if k == gkey})
    out["classes"] = classes
    # 每個 state / scene 的 enter() 原始碼
    states = {}
    for c in classes:
        if not re.search(r"states?\.|State$|Scene$|Transition|Splash|Popup|Presenter", c):
            continue
        m = re.search(r'\["hacksaw\.games\.%s\.%s"\]=' % (re.escape(gkey), re.escape(c)), js)
        if not m:
            continue
        seg = js[m.end(): m.end() + 9000]
        nxt = re.search(r'\["hacksaw\.(games|core)\.[a-z0-9_.]+"\]=', seg[200:])
        if nxt:
            seg = seg[: 200 + nxt.start()]
        st = {
            "scenes": sorted(set(re.findall(r'addScene\(new [A-Za-z_$]{1,3}\("([A-Za-z0-9_]+)"', seg)))
                      + sorted({"show:" + x for x in re.findall(r'showScene\("([A-Za-z0-9_]+)"', seg)}),
            "events": sorted(set("%s/%s" % e for e in re.findall(r'publish\("([a-z]+)","([A-Za-z0-9_]+)"', seg))),
            "spine_anims": sorted({a for a in re.findall(r'"([A-Za-z0-9_/]+)"', seg) if a in spine_anims}),
            "numbers": [],
        }
        for mm in re.finditer(r"(?<![\w.$])(\d*\.\d+|\d+)(?=[,)])", seg):
            v = float(mm.group(1))
            if 0.05 <= v <= 12 and v not in (1.0,) and "." in mm.group(1):
                ctx = seg[max(0, mm.start() - 50): mm.end() + 20].replace("\n", " ")
                st["numbers"].append({"value": v, "context": ctx})
        st["code"] = seg
        states[c] = st
    out["states"] = states
    # TierDef（中獎展示階梯）
    m = re.search(r'\(i\["hacksaw\.core\.data\.TierDef"\]=([A-Za-z_$]{1,3})\)', js)
    tiers = []
    if m:
        for a in re.finditer(r"new %s\(([^()]{1,120})\)" % re.escape(m.group(1)), js):
            tiers.append(a.group(1))
    out["tier_defs"] = tiers[:40]
    # 版面：遊戲自己的類別裡所有 setPosition / setScale
    lay = []
    for c in classes:
        m = re.search(r'\["hacksaw\.games\.%s\.%s"\]=' % (re.escape(gkey), re.escape(c)), js)
        if not m:
            continue
        seg = js[m.end(): m.end() + 12000]
        for p in re.finditer(r"([A-Za-z_$][\w$.]{0,60})\.setPosition\((-?[\d.]+),(-?[\d.]+)(?:,(-?[\d.]+))?\)", seg):
            lay.append({"class": c, "target": p.group(1)[-40:], "x": float(p.group(2)),
                        "y": float(p.group(3)), "z": float(p.group(4)) if p.group(4) else None})
    out["layout"] = lay[:400]
    cams = re.findall(r"new [A-Za-z_$]{1,3}\(new [A-Za-z_$]{1,3}\(null,null,null,[A-Za-z_$]{1,3}\.fromBacking\(new [A-Za-z_$]{1,3}\((-?[\d.]+),(-?[\d.]+),(-?[\d.]+),null\)\),null,null,null,(\d+)", js)
    out["cameras"] = Counter("pos(%s,%s,%s) fov %s" % c for c in cams).most_common(6)
    out["orientation_strings"] = len(re.findall(r'"portrait"', js))
    return out


# ------------------------------------------------------------------ 主流程
def build(slug):
    g, meta, base = game_dir(slug)
    out = g / "reports" / "style"
    (out / "crops").mkdir(parents=True, exist_ok=True)
    (out / "states").mkdir(parents=True, exist_ok=True)
    R = {"slug": slug, "name": meta.get("name"), "gameId": meta["gameId"], "version": meta["version"]}
    files = desc_files(base)
    R["asset_tree"] = {"files": len(files), "MB": round(sum(s for _, s in files) / 1e6, 1)}

    # 規則頁
    gi = glob.glob(str(base / "gameinfoassets" / "**" / "*.html"), recursive=True)
    R["rules"] = html_text(open(gi[0], encoding="utf-8", errors="replace").read()) if gi else []

    # gameconfig
    cfgs = glob.glob(str(base / "assets" / "**" / "config" / "gameconfig.json"), recursive=True)
    cfg = json.loads(open(cfgs[0], encoding="utf-8").read()) if cfgs else {}
    R["text_styles"] = {k: {kk: (argb(vv) if "olor" in kk else vv) for kk, vv in v.items()}
                        for k, v in ((cfg.get("style") or {}).get("text") or {}).items()}
    R["preloader"] = json.loads(json.dumps(cfg.get("preloader") or {}), object_hook=lambda d: {k: argb(v) for k, v in d.items()})
    R["reel_timing"] = (cfg.get("reel") or {}).get("spinRevealProps") or {}
    R["config_other"] = {k: v for k, v in cfg.items() if k not in ("style", "preloader", "reel")}

    # 字型
    fonts = {}
    for f in glob.glob(str(base / "assets" / "**" / "en-us" / "*.fnt"), recursive=True):
        s = open(f, encoding="utf-8", errors="replace").read(3000)
        face = re.search(r'face="([^"]*)"', s)
        size = re.search(r'\bsize="(-?\d+)"', s)
        lh = re.search(r'lineHeight="(\d+)"', s)
        fonts[Path(f).stem] = {"face": face.group(1) if face else None,
                               "size": int(size.group(1)) if size else None,
                               "lineHeight": int(lh.group(1)) if lh else None}
    R["fonts"] = fonts

    # 圖集：區塊清單、關鍵圖切出來、取色
    atl = []
    board = []
    for f in sorted(res_glob(base, "atlas", "*.atlas")):
        name = Path(f).stem
        pages = parse_atlas(f)
        regs = sum(len(p["regions"]) for p in pages)
        entry = {"atlas": name, "pages": [p["page"] for p in pages],
                 "size": pages[0]["size"] if pages else None, "regions": []}
        key = bool(KEY_ATLAS.search(name)) and not name.startswith("digits")
        for p in pages:
            pimg = Path(f).with_name(Path(p["page"]).stem + ".png")
            img = Image.open(pimg).convert("RGBA") if pimg.exists() else None
            for rn, r in p["regions"].items():
                if "bounds" not in r:
                    continue
                w, h = r["bounds"][2], r["bounds"][3]
                ent = {"name": rn, "w": w, "h": h}
                if key and img is not None and w * h >= 40 * 40:
                    try:
                        c = crop(img, r)
                        fn = re.sub(r"[^A-Za-z0-9_.-]+", "_", "%s__%s.png" % (name, rn))
                        c.save(out / "crops" / fn)
                        ent["crop"] = "crops/" + fn
                        ent["palette"] = palette(c, 6)
                        if w * h >= 150 * 150:
                            board.append(("%s/%s" % (name, rn), c, ent["palette"]))
                    except Exception:
                        pass
                entry["regions"].append(ent)
        entry["region_count"] = regs
        atl.append(entry)
    R["atlases"] = atl

    # spine：每具每段動畫的長度
    sk = []
    names = set()
    seen = set()
    for f in sorted(res_glob(base, "spine", "*.json")):
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(d, dict) or "bones" not in d:
            continue
        stem = Path(f).stem
        if stem in seen:
            continue
        seen.add(stem)
        anims = {a: anim_duration(v) for a, v in (d.get("animations") or {}).items()}
        names |= set(anims)
        ev = sorted((d.get("events") or {}).keys())
        hdr = d.get("skeleton") or {}
        sk.append({"skeleton": stem, "spine": hdr.get("spine"),
                   "bones": len(d["bones"]), "size": [hdr.get("width"), hdr.get("height")],
                   "anims": anims, "events": ev})
    R["spine"] = sk

    # 音效
    snd = sorted({Path(p).stem for p, _ in files if "/sound/" in p})
    groups = defaultdict(list)
    for s_ in snd:
        groups[re.split(r"[_\d]", s_)[0] or s_].append(s_)
    R["sounds"] = {"count": len(snd), "groups": {k: v for k, v in sorted(groups.items(), key=lambda kv: -len(kv[1]))},
                   "music_levels": sorted(s_ for s_ in snd if re.search(r"level_?\d|music|theme|loop", s_))}

    # bundle
    js_path = base / "main.js"
    if js_path.exists():
        js = js_path.read_text(encoding="utf-8", errors="replace")
        bi = bundle_info(js, names)
        for c, st in bi["states"].items():
            code = re.sub(r"([;{}])", r"\1\n", st.pop("code"))
            (out / "states" / (re.sub(r"[^A-Za-z0-9_.]+", "_", c) + ".js")).write_text(code, encoding="utf-8")
        R["bundle"] = bi
    else:
        R["bundle"] = None

    # 截圖
    shots = out / "shots"
    R["shots"] = sorted(p.name for p in shots.glob("*.png")) if shots.exists() else []

    # 取色板
    if board:
        board = sorted(board, key=lambda b: -(b[1].width * b[1].height))[:16]
        W, row = 1400, 190
        im = Image.new("RGB", (W, row * len(board)), (24, 24, 30))
        dr = ImageDraw.Draw(im)
        for i, (lbl, c, pal) in enumerate(board):
            t = c.copy()
            t.thumbnail((300, row - 20))
            bgc = Image.new("RGBA", t.size, (24, 24, 30, 255))
            bgc.alpha_composite(t)
            im.paste(bgc.convert("RGB"), (10, i * row + 10))
            dr.text((330, i * row + 12), lbl, fill=(230, 230, 236))
            for j, p in enumerate(pal):
                x = 330 + j * 175
                col = tuple(int(p["hex"][k:k + 2], 16) for k in (1, 3, 5))
                dr.rectangle([x, i * row + 40, x + 160, i * row + 140], fill=col)
                dr.text((x, i * row + 146), "%s  %d%%" % (p["hex"], round(100 * p["share"])), fill=(200, 200, 210))
        im.save(out / "palette.png")
    (out / "style.json").write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "style.md").write_text(markdown(R), encoding="utf-8")
    return R


def table(rows, head):
    L = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    for r in rows:
        L.append("| " + " | ".join(str(x) for x in r) + " |")
    return L


def markdown(R):
    L = ["# %s · 整體風格抄錄" % R["name"], "",
         "gameId **%s**、版本 **%s**。資產樹 %d 個檔、%.1f MB。所有數字出自 `gameconfig.json`、"
         "圖集 `.atlas`、spine `.json` 與前端 `main.js`（標了出處）；截圖在 `shots/`。"
         % (R["gameId"], R["version"], R["asset_tree"]["files"], R["asset_tree"]["MB"]), "",
         "> 素材是 Hacksaw Gaming 的著作，這份是研究筆記：抄手法與數字，不要拿圖去用。", ""]
    # 0 規則
    L += ["## 1. 這款在演什麼（官方規則頁）", ""]
    for s in R["rules"][:12]:
        if s["title"].upper() in ("GENERAL", "INTERRUPTED GAME", "HISTORY", "GENERAL TERMS AND CONDITIONS", "ADDITIONAL INFORMATION"):
            continue
        L.append("**%s**" % s["title"])
        L.append("")
        txt = " ".join(s["text"])
        L.append(txt[:900] + (" …" if len(txt) > 900 else ""))
        L.append("")
    # 1 載入頁
    L += ["## 2. 載入頁（loading）", ""]
    pre = (R["preloader"] or {}).get("progress") or {}
    if pre:
        L += table([(k, json.dumps(v, ensure_ascii=False)) for k, v in pre.items()], ["進度條欄位", "值"])
        L += ["", "出處：`gameconfig.json → preloader.progress`。載入畫面本體是 Hacksaw 共用的 "
              "`PreSplash`／`ProgressIndicator`（`index.html`＋`ui.min.css`），這款自己給的只有進度條的"
              "位置、尺寸、顏色與底色；logo 與背景圖見下面的圖集。", ""]
    load_shots = [s for s in R["shots"] if "_load_" in s]
    if load_shots:
        L += ["載入過程截圖：" + "、".join("`shots/%s`" % s for s in load_shots[:12]), ""]
    # 2 開場說明格
    L += ["## 3. 開場說明格（Splash）", ""]
    sp = [a for a in R["atlases"] if re.search("splash|intro", a["atlas"], re.I)]
    for a in sp:
        L.append("圖集 `%s`（%s，頁 %s）：" % (a["atlas"], "×".join(map(str, a["size"] or [])), "、".join(a["pages"])))
        L.append("")
        L += table([(r["name"], "%d×%d" % (r["w"], r["h"]), "![](%s)" % r["crop"] if r.get("crop") else "",
                     " ".join(p["hex"] for p in r.get("palette", [])[:4])) for r in a["regions"]],
                   ["區塊", "尺寸", "圖", "主色"])
        L.append("")
    sty = {k: v for k, v in R["text_styles"].items() if k.lower().startswith("splash")}
    if sty:
        L += ["文字樣式（`gameconfig.json → style.text`）：", ""]
        L += table([(k, v.get("font"), v.get("size"), v.get("color"), v.get("outlineColor"), v.get("outlineWidth"),
                     ", ".join(v.get("strings") or [])) for k, v in sty.items()],
                   ["角色", "字型", "字級", "顏色", "描邊色", "描邊寬", "字串 key"])
        L.append("")
    # 3 FG 面板
    L += ["## 4. FG 說明面板（進場／結算）", ""]
    fg = [a for a in R["atlases"] if re.search("bonus|feature|fs|popup|panel", a["atlas"], re.I)]
    for a in fg:
        L.append("圖集 `%s`（%s）：" % (a["atlas"], "×".join(map(str, a["size"] or []))))
        L.append("")
        L += table([(r["name"], "%d×%d" % (r["w"], r["h"]), "![](%s)" % r["crop"] if r.get("crop") else "",
                     " ".join(p["hex"] for p in r.get("palette", [])[:4])) for r in a["regions"]],
                   ["區塊", "尺寸", "圖", "主色"])
        L.append("")
    sty = {k: v for k, v in R["text_styles"].items() if not k.lower().startswith("splash")}
    if sty:
        L += ["其餘文字樣式（FG 面板、計分板…）：", ""]
        L += table([(k, v.get("font"), v.get("size"), v.get("color"), v.get("outlineColor"), v.get("outlineWidth"),
                     ", ".join(v.get("strings") or [])) for k, v in sty.items()],
                   ["角色", "字型", "字級", "顏色", "描邊色", "描邊寬", "字串 key"])
        L.append("")
    # 4 轉場與狀態
    b = R.get("bundle") or {}
    L += ["## 5. 轉場與流程（`main.js` 裡這款自己的 state）", ""]
    if b.get("states"):
        L.append("命名空間 `hacksaw.games.%s`，共 %d 個類別。每個 state 的完整原始碼在 `states/`。"
                 % (b["namespace"], len(b["classes"])))
        L.append("")
        for c, st in b["states"].items():
            L.append("### `%s`" % c)
            L.append("")
            if st["scenes"]:
                L.append("- 場景：" + "、".join("`%s`" % x for x in st["scenes"]))
            if st["events"]:
                L.append("- 發出的事件：" + "、".join("`%s`" % x for x in st["events"][:20]))
            if st["spine_anims"]:
                L.append("- 播的 spine 動畫：" + "、".join("`%s`" % x for x in st["spine_anims"][:20]))
            if st["numbers"]:
                L.append("- 時間／比例常數（前後文）：")
                for n in st["numbers"][:14]:
                    L.append("  - **%g** —— `…%s…`" % (n["value"], n["context"].replace("`", "'")))
            L.append("")
    else:
        L += ["（沒有 bundle 或找不到這款的命名空間）", ""]
    tr = []
    for s in R["spine"]:
        for a, d in s["anims"].items():
            if TRANSITION.search(a.split("/")[-1]) and not LOOP.search(a.split("/")[-1]):
                tr.append((s["skeleton"], a, d))
    if tr:
        L += ["spine 裡的進出場類動畫（名字像 intro／trigger／appear／remove…）：", ""]
        L += table(sorted(tr)[:120], ["骨架", "動畫", "秒"])
        L.append("")
    # 5 節奏
    L += ["## 6. 節奏", "", "### 6.1 轉輪（`gameconfig.json → reel.spinRevealProps`）", ""]
    for mode, lst in (R["reel_timing"] or {}).items():
        for e in lst:
            v = e.get("values") or {}
            L.append("- **%s / %s**：" % (mode, e.get("mode")) + "，".join("%s=%s" % (k, json.dumps(x, ensure_ascii=False)) for k, x in v.items()))
    L += ["", "### 6.2 環境循環（idle／loop 類動畫的長度）", ""]
    lp = [(s["skeleton"], a, d) for s in R["spine"] for a, d in s["anims"].items()
          if LOOP.search(a.split("/")[-1]) and d > 0]
    L += table(sorted(lp, key=lambda x: (x[0], x[1]))[:150], ["骨架", "動畫", "秒"]) if lp else ["（沒有）"]
    L += ["", "### 6.3 中獎展示階梯（`TierDef`）", ""]
    if b.get("tier_defs"):
        L += ["```"] + b["tier_defs"][:20] + ["```", "（參數順序同 The Luxe：門檻倍數、文字 key、展示秒數、id）", ""]
    else:
        L += ["bundle 裡沒有字面值的 TierDef（多半寫在 countup 骨架的動畫長度裡）", ""]
    ct = [s for s in R["spine"] if re.search("countup|tier|big_win|win_tiers", s["skeleton"], re.I)]
    for s in ct:
        L += ["`%s`：" % s["skeleton"] + "、".join("%s %gs" % (a, d) for a, d in s["anims"].items()), ""]
    L += ["### 6.4 音效（%d 個；音樂分級：%s）" % (R["sounds"]["count"], "、".join(R["sounds"]["music_levels"][:12]) or "—"), ""]
    for k, v in list(R["sounds"]["groups"].items())[:25]:
        L.append("- `%s*`（%d）：%s" % (k, len(v), "、".join(v[:10]) + (" …" if len(v) > 10 else "")))
    L.append("")
    # 6 畫風
    L += ["## 7. 畫風", "", "取色板：`palette.png`（每張關鍵圖的主色與佔比）。", ""]
    if R["fonts"]:
        L += table([(k, v["face"], v["size"], v["lineHeight"]) for k, v in R["fonts"].items()],
                   ["字型檔", "face", "字級", "行高"])
        L.append("")
    big = [(a["atlas"], r["name"], "%d×%d" % (r["w"], r["h"]), " ".join(p["hex"] for p in r.get("palette", [])[:6]))
           for a in R["atlases"] for r in a["regions"] if r.get("palette") and r["w"] * r["h"] >= 200 * 200]
    if big:
        L += table(big[:60], ["圖集", "區塊", "尺寸", "主色（多→少）"])
        L.append("")
    L += ["spine 骨架一覽（骨數＝做工精細度的指標）：", ""]
    L += table([(s["skeleton"], s["spine"], s["bones"], "×".join(str(int(x)) if x else "?" for x in (s["size"] or [])),
                 len(s["anims"])) for s in sorted(R["spine"], key=lambda s: -s["bones"])],
               ["骨架", "版本", "骨", "畫布", "動畫數"])
    L.append("")
    # 7 版面
    L += ["## 8. 版面", ""]
    if b.get("cameras"):
        L += ["3D 場景相機（出現次數）：" + "、".join("`%s`×%d" % c for c in b["cameras"]), ""]
    if b.get("layout"):
        L += ["這款自己的類別裡寫死的擺放（`setPosition`，場景座標）：", ""]
        L += table([(x["class"], x["target"], x["x"], x["y"], x["z"] if x["z"] is not None else "") for x in b["layout"][:120]],
                   ["類別", "物件", "x", "y", "z"])
        L.append("")
    if R["shots"]:
        L += ["截圖：" + "、".join("`shots/%s`" % s for s in R["shots"] if "_load_" not in s), ""]
    else:
        L += ["（還沒有截圖：demo 進不去時 `style_shots.py` 之後再補）", ""]
    # 8 素材
    L += ["## 9. 圖集總表", ""]
    L += table([(a["atlas"], "×".join(map(str, a["size"] or [])), a["region_count"],
                 "、".join(r["name"] for r in a["regions"][:12]) + (" …" if len(a["regions"]) > 12 else ""))
                for a in R["atlases"]], ["圖集", "頁尺寸", "區塊數", "區塊"])
    L.append("")
    return "\n".join(L)


def main(argv):
    if argv[:1] == ["--all"]:
        slugs = sorted(json.loads((ROOT / "Games" / "_scan_characters.json").read_text(encoding="utf-8")))
    else:
        slugs = argv
    for slug in slugs:
        try:
            R = build(slug)
            b = R.get("bundle") or {}
            print("== %-36s 圖集 %2d、骨架 %2d、state %2d、截圖 %d" % (
                slug, len(R["atlases"]), len(R["spine"]), len(b.get("states") or {}), len(R["shots"])), flush=True)
        except Exception as e:
            print("== %-36s ❌ %s: %s" % (slug, type(e).__name__, e), flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
