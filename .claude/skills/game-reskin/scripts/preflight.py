#!/usr/bin/env python3
"""製程閘門一次跑完：打包前、上傳前各跑一次。

    preflight.py APP_DIR [--upload upload/<Game>] [--source-names Old1,Old2]
                 [--palette HEX,HEX] [--docs DIR ...]

    APP_DIR         遊戲 app，例如 wp-banandit/apps/SumoMonkey
    --upload        已 stage 的上傳包（frontend/ math/ thumbnail/ cover/ README.md）
    --source-names  來源遊戲的名稱（換皮殘留檢查），逗號分隔，例如 SushiMonkey,Sushi
    --palette       來源遊戲的招牌色（傳給 check_review_tags.py）
    --docs          額外要掃「未成年用字」的需求單資料夾（例如 new-games/<game>）

它把 skill 裡散在各處、每條都退過件的機械檢查集中成一個指令，並在最後列出
「只能人工看」的閘門。FAIL 擋打包／上傳；WARN 要有人看過並說明。

這支不取代遊戲自己的 build 閘門（package.json 的 build 鏈）、官方 self-check
（stake-engine-slot references/engine-self-check.md）與實機試玩；它只保證
那些「每次都忘、每次都被退」的項目不會再漏。規則出處見 SKILL.md「製程總表」。

Exit 1 if any FAIL.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RESULTS: list[tuple[str, str, str, str]] = []  # (level, id, title, detail)

TEXT_EXT = {".svelte", ".ts", ".js", ".mjs", ".css", ".html", ".json", ".md", ".txt", ".po"}
MINOR_WORDS = re.compile(
    r"學徒|小徒弟|徒弟|少女|少年|男孩|女孩|小孩|孩童|孩子|幼|嬰兒|青少年|學生|"
    r"\b(apprentice|girl|boy|child|children|kid|kids|teen|teenager|baby|schoolgirl|schoolboy|young)\b",
    re.IGNORECASE,
)
MINOR_NEGATION = re.compile(
    r"not a (child|teen)|no minors|成年|不畫|不寫|不用|不要|不可|不得|禁止|避免|\b(never|avoid|without|no)\b", re.IGNORECASE)


def add(level: str, cid: str, title: str, detail: str = "") -> None:
    RESULTS.append((level, cid, title, detail))


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def walk(root: Path, exts: set[str] | None = None):
    skip = {"node_modules", ".svelte-kit", "build", "dist", ".git", "__pycache__"}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip]
        for f in filenames:
            p = Path(dirpath) / f
            if exts is None or p.suffix in exts:
                yield p


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


# ───────────────────────── app (source) checks ─────────────────────────


def check_build_chain(app: Path) -> None:
    pkg = app / "package.json"
    if not pkg.exists():
        add("FAIL", "A1", "package.json 不存在", str(pkg))
        return
    build = json.loads(read(pkg)).get("scripts", {}).get("build", "")
    must = {
        "check_undefined_refs": "模板引用未宣告識別字 → 整台黑畫面（stake-engine-slot「static guards」）",
        "check_social_words": "social 模式禁用字（Go Bananas 第 3、5 輪）",
        "check_assets": "資產路徑不存在",
    }
    should = {
        "check_symbol_idle": "每個符號要有自己的待機表演（Turf 10-27 5.3「too static」）",
        "sync_math_config": "config.ts 由數學設定同步（Capo 系放在 ship.sh 也可）",
    }
    for token, why in must.items():
        if token in build:
            add("PASS", "A1", f"build 鏈含 {token}")
        else:
            add("FAIL", "A1", f"build 鏈缺 {token}", why)
    for token, why in should.items():
        if token in build:
            add("PASS", "A1", f"build 鏈含 {token}")
        elif token == "sync_math_config" and "sync_math_config" in read(app / "design" / "ship.sh"):
            add("PASS", "A1", "sync_math_config 在 ship.sh")
        else:
            add("WARN", "A1", f"build 鏈缺 {token}", why)


def check_ship(app: Path) -> None:
    ship = app / "design" / "ship.sh"
    if not ship.exists():
        add("WARN", "A2", "沒有 design/ship.sh", "打包流程第一次就寫成腳本（packaging.md），不要每次手打")
        return
    text = read(ship)
    if re.search(r"^\s*zip\s+-", text, re.M) and "--zip" not in text:
        add("FAIL", "A2", "ship.sh 預設就壓 zip", "打包＝stage 到 upload/<Game>/ 就停；zip 只在 --zip 時做（Stone 09-20）")
    else:
        add("PASS", "A2", "ship.sh 不預設壓 zip")
    if app.name not in text:
        add("FAIL", "A2", f"ship.sh 裡找不到「{app.name}」", "是不是還是來源遊戲的打包腳本？（相撲猴用了好幾週壽司猴的 ship.sh）")
    if re.search(r"(^|[\s(|;])rg\s", text, re.M) and not shutil.which("rg"):
        add("WARN", "A2", "ship.sh 用到 rg，但這個 shell 找不到 rg", "檢查工具不在時不可以印 all clean（壽司猴 10-07）")


def check_assets_same_src(app: Path) -> None:
    hits = []
    for reg in list((app / "src").rglob("assets.ts")) + list((app / "src").rglob("assets/*.ts")):
        by_src: dict[str, list[str]] = {}
        for m in re.finditer(r"^\s*([A-Za-z0-9_]+)\s*:\s*\{[^\n]*?new URL\(\s*['\"]([^'\"]+)['\"]", read(reg), re.M):
            by_src.setdefault(m.group(2), []).append(m.group(1))
        for src, keys in by_src.items():
            if len(keys) > 1 and any(re.search(r"(Lit|Hover|Active|_on$|On$|_lit|_hover|Pressed)", k) for k in keys):
                hits.append(f"{', '.join(keys)} → {src}")
    if hits:
        add("FAIL", "A3", "hover／lit／on 資產和靜止圖是同一個檔", "游標移上去不會亮（Sushi 10-06）：" + "；".join(hits[:6]))
    else:
        add("PASS", "A3", "沒有 hover/lit 鍵與靜止鍵共用同一張圖")


def check_hover(app: Path) -> None:
    src = app / "src"
    blob = "\n".join(read(p) for p in walk(src, {".ts", ".svelte"}) if "heme" in p.name or "Bar" in p.name or "UI" in p.name)
    if re.search(r"hoverPlateLight|hoverRimOnly|customLayout", blob):
        add("PASS", "A4", "hover 有設定自己的亮法（hoverPlateLight／hoverRimOnly／自訂下注列）")
    else:
        add("WARN", "A4", "uiTheme 沒設 hoverPlateLight／hoverRimOnly", "共用 hoverHighlight 的白框＝反灰（Stone 10-01，所有遊戲）")
    def uses_grey(text: str) -> bool:
        for line in text.splitlines():
            m = re.search(r"(0x|#)e4e4e4", line, re.I)
            if not m:
                continue
            head = line[:m.start()]
            if "//" in head or head.lstrip().startswith(("*", "/*", "<!--")):
                continue  # 註解裡提到舊值（催眠猴的修正說明）不算
            return True
        return False
    grey = [str(p.relative_to(app)) for p in walk(src, {".ts", ".svelte"}) if uses_grey(read(p))]
    if grey:
        add("WARN", "A4", "hover 灰色 e4e4e4 還在", "v3／v4 下注列範本的 hover 灰（改主題色）：" + ", ".join(grey[:5]))


def check_review_tags(app: Path, palette: str) -> None:
    script = HERE / "check_review_tags.py"
    cmd = [sys.executable, str(script), str(app)] + (["--palette", palette] if palette else [])
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    except Exception as e:  # noqa: BLE001
        add("WARN", "A5", "check_review_tags.py 沒跑成", str(e))
        return
    lines = (out.stdout + out.stderr).splitlines()
    fails = [l.strip() for l in lines if re.match(r"\s+FAIL\s", l)]
    warns = [l.strip() for l in lines if re.match(r"\s+WARN\s", l)]
    if out.returncode != 0 or fails:
        add("FAIL", "A5", f"check_review_tags.py：{len(fails)} FAIL／{len(warns)} WARN", " ｜ ".join(fails[:5]))
    elif warns:
        add("WARN", "A5", f"check_review_tags.py：{len(warns)} WARN（要逐條決定）", " ｜ ".join(warns[:4]))
    else:
        add("PASS", "A5", "check_review_tags.py（字型／emoji／漸層／setInterval／FG 開場…）")


def check_background_life(app: Path) -> None:
    # 各系列的命名：BackgroundFx（Pickle）、StudioLife／StreetLife／SumoArenaLife／SceneLife、
    # backgroundMotion.ts／backgroundScene.ts（Hypno 系）；或 build 鏈有 check_background。
    pat = re.compile(r"Life\.svelte$|BackgroundFx|[bB]ackground(Motion|Scene|Life)|bg_?[fF]x")
    found = sorted({p.name for p in walk(app / "src", {".svelte", ".ts"}) if pat.search(p.name)})
    if "check_background" in read(app / "package.json"):
        found.append("check_background（build 鏈）")
    if found:
        add("PASS", "A6", "背景有會動的元件", ", ".join(found[:5]))
    else:
        add("WARN", "A6", "找不到背景動態元件", "MG、FG 背景都要有自己會動的東西，不只平移（Stone 10-20）")


def check_interim(app: Path) -> None:
    f = app / "design" / "INTERIM.md"
    if not f.exists():
        return
    open_items = [l.strip() for l in read(f).splitlines()
                  if re.match(r"\s*[-*]\s+(?!\[[xX]\])", l) and "~~" not in l]
    if open_items:
        add("WARN", "A7", f"design/INTERIM.md 還有 {len(open_items)} 項過渡資產", "送審前要清空（Turf 的轉場佔位圖放了三週）：" + " ｜ ".join(open_items[:4]))
    else:
        add("PASS", "A7", "過渡資產清單已清空")


def check_minor_words(app: Path, docs: list[Path]) -> None:
    files: list[Path] = []
    for root in [app] + docs:
        if root.is_file():
            files.append(root)
            continue
        for p in walk(root, {".md", ".txt"}):
            n = p.name.upper()
            if "_REFERENCE" in n or "LEGACY" in n:
                continue  # 別款遊戲留下來對照用的舊單
            if any(k in n for k in ("ART_REQUEST", "ART_BRIEF", "需求單", "PROMPT", "生圖", "補畫")) or "prompt" in str(p).lower():
                files.append(p)
    hits = []
    for p in files:
        for i, line in enumerate(read(p).splitlines(), 1):
            if re.search(r"\.(png|jpg|webp|json|svelte|ts)\b", line):
                continue  # 檔名、路徑
            if MINOR_WORDS.search(line) and not MINOR_NEGATION.search(line):
                hits.append(f"{p.name}:{i} {line.strip()[:60]}")
    if hits:
        add("WARN", "A8", f"需求單／提示詞有可能畫出未成年的字（{len(hits)} 處）",
            "Engine [217] 禁未成年形象；改寫成年齡＋成人特徵（Wild Alchemy 11-10）：" + " ｜ ".join(hits[:5]))
    elif files:
        add("PASS", "A8", f"需求單／提示詞沒有未成年用字（掃了 {len(files)} 檔）")


def check_source_names(app: Path, upload: Path | None, names: list[str]) -> None:
    if not names:
        add("SKIP", "A9", "沒給 --source-names，略過來源遊戲殘留檢查", "換皮一定要給，例如 --source-names HardTime,\"Hard Time\"")
        return
    pat = re.compile("|".join(re.escape(n) for n in names), re.IGNORECASE)
    src_hits = [str(p.relative_to(app)) for p in walk(app / "src", TEXT_EXT) if pat.search(read(p))]
    if src_hits:
        add("WARN", "A9", f"src 還有來源遊戲名稱（{len(src_hits)} 檔）",
            "內部識別字可留，玩家看得到的字不行；逐檔確認：" + ", ".join(src_hits[:6]))
    else:
        add("PASS", "A9", "src 沒有來源遊戲名稱")
    if upload and (upload / "frontend").exists():
        # 玩家看得到的：<title>、meta content、manifest 的 name。行內程式碼裡的內部識別字不算。
        vis, internal = [], 0
        for p in walk(upload / "frontend", {".html", ".json", ".webmanifest"}):
            t = read(p)
            if not pat.search(t):
                continue
            shown = " ".join(re.findall(r"<title>(.*?)</title>", t, re.S | re.I)
                             + re.findall(r"<meta[^>]+content=[\"']([^\"']*)", t, re.I)
                             + re.findall(r"\"(?:name|short_name|description)\"\s*:\s*\"([^\"]*)", t))
            if pat.search(shown):
                vis.append(str(p.relative_to(upload)))
            else:
                internal += 1
        if vis:
            add("FAIL", "A9", "staged frontend 的標題／meta／manifest 有來源遊戲名稱", ", ".join(vis[:6]))
        elif internal:
            add("INFO", "A9", f"staged frontend 有來源名稱的內部識別字（{internal} 檔）", "標題／meta 乾淨；畫面上的字用 social_text_audit.js 的 __textAudit.all() 再確認一次")
        else:
            add("PASS", "A9", "staged frontend 沒有來源遊戲名稱")


def check_km(app: Path) -> None:
    hits = []
    for p in walk(app / "src", {".ts", ".svelte"}):
        t = read(p)
        if re.search(r"notation\s*:\s*['\"]compact", t) or re.search(r"toFixed\([0-9]\)\s*\+\s*['\"][KMkm]['\"]", t):
            hits.append(str(p.relative_to(app)))
    if hits:
        add("WARN", "A12", "金額可能縮寫成 K／M", "任何金額都不可縮寫（Sushi 10-20）：" + ", ".join(hits[:5]))
    else:
        add("PASS", "A12", "沒有 K／M 金額縮寫寫法")


def check_shared_drift(app: Path) -> None:
    # app = <worktree>/apps/<Game>; main tree = sibling "wp"
    wt = app.parent.parent
    main = wt.parent / "wp"
    if not main.exists() or wt.resolve() == main.resolve() or not (wt / "packages").exists():
        return
    try:
        out = subprocess.run(
            ["diff", "-rq", str(main / "packages"), str(wt / "packages"),
             "-x", "node_modules", "-x", "dist", "-x", ".svelte-kit", "-x", ".DS_Store"],
            capture_output=True, text=True, timeout=120).stdout.splitlines()
    except Exception:  # noqa: BLE001
        return
    if not out:
        add("PASS", "C1", "共用 packages 與主 wp 相同")
        return
    add("INFO", "C1", f"共用 packages 與主 wp 有 {len(out)} 處不同",
        "審核修正常只做在某一棵樹（Deadwood→Banandit 10-05）。送審前對照 review-log 最新一輪逐條確認這棵樹有："
        f"diff -rq {main}/packages {wt}/packages -x node_modules -x dist")


# ───────────────────────── upload (staged) checks ─────────────────────────


def check_upload_structure(upload: Path) -> bool:
    ok = True
    need = {
        "frontend/index.html": "前端",
        "math/index.json": "數學",
        "README.md": "README（要寫清楚平台上目前是哪一版、這包有沒有上傳）",
    }
    for rel, what in need.items():
        if (upload / rel).exists():
            add("PASS", "B1", f"upload 有 {rel}")
        else:
            add("FAIL", "B1", f"upload 缺 {rel}", what)
            ok = False
    for kind, why in (("thumbnail", "商店縮圖三個檔：BG、FG、provider logo"), ("cover", "每款都要封面 1920×1080 BG＋FG（Stone 10-04）")):
        d = upload / kind
        bg = list(d.glob("*-BG.png")) if d.exists() else []
        fg = list(d.glob("*-FG.png")) if d.exists() else []
        if bg and fg:
            add("PASS", "B1", f"upload/{kind} 有 BG＋FG")
        else:
            add("FAIL", "B1", f"upload/{kind} 缺 BG 或 FG", why)
        if kind == "thumbnail" and d.exists() and not [p for p in d.iterdir() if "logo" in p.name.lower()]:
            add("FAIL", "B1", "upload/thumbnail 缺 provider logo", "縮圖是三個檔，不是一個（Wild Party）")
    return ok


def check_upload_contamination(upload: Path) -> None:
    fe = upload / "frontend"
    if not fe.exists():
        return
    idx = read(fe / "index.html")
    bad = re.findall(r"localhost:\d+|stub\.local|127\.0\.0\.1:\d+|stub-data\.js|stub\.js", idx)
    stray = [p.name for p in fe.iterdir() if re.search(r"stub|playtest", p.name, re.I)]
    if bad or stray:
        add("FAIL", "B2", "staged frontend 混入 playtest／stub", ", ".join(sorted(set(bad)) + stray))
    else:
        add("PASS", "B2", "staged frontend 沒有 playtest／stub／localhost")


def check_staged_is_current(app: Path, upload: Path) -> None:
    b, u = app / "build" / "index.html", upload / "frontend" / "index.html"
    if not b.exists() or not u.exists():
        add("WARN", "B3", "無法比對 build 與 staged（缺 index.html）", f"{b if not b.exists() else u}")
        return
    newest_src = max((p.stat().st_mtime for p in walk(app / "src")), default=0)
    if newest_src > b.stat().st_mtime + 1:
        add("WARN", "B3", "src 比 build/ 新", "上傳包不是目前原始碼的建置；重跑 ship.sh（「同一最終版本」規則）")
    if sha(b) != sha(u):
        add("WARN", "B3", "staged frontend 的 index.html ≠ app build/", "確認 stage 的是最後一次 build；舊包會把修好的東西蓋回去")
    else:
        add("PASS", "B3", "staged frontend ＝ 目前 build")


def check_math(upload: Path) -> list[tuple[str, float, float]]:
    math = upload / "math"
    cli = shutil.which("stakecli") or str(Path.home() / ".local/bin/stakecli")
    if not math.exists() or not Path(cli).exists():
        add("WARN", "B4", "沒跑 stakecli compliance", "math/ 不存在或找不到 stakecli")
        return []
    env = dict(os.environ, STAKE_NO_UPDATE_CHECK="1")
    out = subprocess.run([cli, "compliance", str(math)], capture_output=True, text=True, env=env, timeout=300)
    text = out.stdout + out.stderr
    fails = [l.strip() for l in text.splitlines() if l.strip().startswith("FAIL")]
    if fails:
        add("FAIL", "B4", f"stakecli compliance：{len(fails)} FAIL", " ｜ ".join(fails[:4]))
    else:
        add("PASS", "B4", "stakecli compliance 0 FAIL")
    cost = {m.group(1): float(m.group(2)) for m in re.finditer(r'Mode "([^"]+)" cost: cost=([0-9.]+)', text)}
    rtp = {m.group(1): float(m.group(2)) for m in re.finditer(r'Mode "([^"]+)" RTP: ([0-9.]+)%', text)}
    modes = sorted(((m, cost.get(m, 0.0), r) for m, r in rtp.items()), key=lambda x: x[1])
    if not modes:
        add("WARN", "B4", "讀不到各模式 RTP", text[:200])
        return []
    line = "、".join(f"{m} {r:.2f}%（{c:g}×）" for m, c, r in modes)
    out_band = [m for m, _, r in modes if not (96.00 <= round(r, 2) <= 96.10)]
    if out_band:
        add("FAIL", "B4", "RTP 不在 96.00–96.10", f"{line}；超出：{', '.join(out_band)}（Stone 10-11）")
    else:
        add("PASS", "B4", "每個模式 RTP 都在 96.00–96.10", line)
    if len(modes) > 1:
        rs = [round(r, 2) for _, _, r in modes]
        if len(set(rs)) == 1:
            add("FAIL", "B4", "所有模式同一個 RTP", "主遊戲最低、購買依價格遞增（Stone 10-15）")
        elif any(b < a for a, b in zip(rs, rs[1:])) or rs[0] != min(rs) or rs.count(rs[0]) > 1:
            add("FAIL", "B4", "RTP 沒有依價格遞增", f"{line}；主遊戲要最低，越貴的購買越高")
        else:
            add("PASS", "B4", "RTP 依模式價格遞增（主遊戲最低）")
        if rs[0] >= 96.10:
            add("WARN", "B4", "主遊戲 RTP 已在上限", "留空間給購買模式")
    return modes


def check_rtp_in_frontend(upload: Path, modes: list[tuple[str, float, float]]) -> None:
    fe = upload / "frontend"
    if not modes or not fe.exists():
        return
    blob = ""
    for p in walk(fe, {".js", ".html", ".json"}):
        if p.stat().st_size < 8_000_000:
            blob += read(p)
    missing = []
    for m, _, r in modes:
        pct, frac = f"{r:.2f}", f"{r / 100:.4f}".rstrip("0")
        if pct not in blob and frac not in blob and frac.lstrip("0") not in blob:
            missing.append(f"{m} {pct}%")
    if missing:
        add("FAIL", "B5", "前端找不到數學的 RTP 數字", "規則頁的 RTP 和 math 不同步（先跑 sync_math_config 再 build）：" + ", ".join(missing))
    else:
        add("PASS", "B5", "前端含每個模式的 RTP 數字（規則頁與 math 同步）")


def check_store_art(upload: Path) -> None:
    script = HERE / "check_thumbnail.py"
    try:
        out = subprocess.run([sys.executable, str(script), "--upload", str(upload)], capture_output=True, text=True, timeout=120)
    except Exception as e:  # noqa: BLE001
        add("WARN", "B6", "check_thumbnail.py 沒跑成", str(e))
        return
    text = (out.stdout + out.stderr).strip()
    if "No module named" in text:
        add("WARN", "B6", "check_thumbnail.py 需要 Pillow", "用 /Applications/anaconda3/bin/python3 跑這支")
    elif out.returncode != 0:
        add("FAIL", "B6", "商店圖太暗", text.replace("\n", " ｜ ")[:300])
    elif "WARN" in text:
        add("WARN", "B6", "商店圖亮度接近門檻", text.replace("\n", " ｜ ")[:300])
    else:
        add("PASS", "B6", "商店縮圖＋封面亮度（check_thumbnail.py）")


def check_provider_logo(upload: Path) -> None:
    d = upload / "thumbnail"
    mine = [p for p in d.glob("*.png") if "logo" in p.name.lower()] if d.exists() else []
    if not mine:
        return
    def pix(p: Path) -> str:
        # 同一張圖重新存檔位元組會不同（Dragon Tide 的 logo 就是），所以比解碼後的像素
        try:
            from PIL import Image
            im = Image.open(p).convert("RGBA")
            return hashlib.sha256(repr(im.size).encode() + im.tobytes()).hexdigest()
        except Exception:  # noqa: BLE001
            return sha(p)

    others: dict[str, int] = {}
    for p in upload.parent.glob("*/thumbnail/*.png"):
        if "logo" in p.name.lower() and p.parent.parent != upload and not p.parent.parent.name.startswith("_"):
            h = pix(p)
            others[h] = others.get(h, 0) + 1
    if not others:
        return
    common, n = max(others.items(), key=lambda kv: kv[1])
    if n >= 3 and pix(mine[0]) != common:
        add("WARN", "B7", f"provider logo（{mine[0].name}）和其他 {n} 款用的不是同一個檔",
            "這個檔是工作室 logo，不是遊戲標題（Turf 的曾經是 TURF WAR 字樣，還被複製到三款）。打開看一眼")
    else:
        add("PASS", "B7", "provider logo 和其他遊戲是同一個檔")


def check_audio_dupes(upload: Path) -> None:
    fe = upload / "frontend"
    if not fe.exists():
        return
    by: dict[str, list[str]] = {}
    for p in fe.rglob("*"):
        if p.suffix.lower() in {".wav", ".m4a", ".mp3", ".ogg", ".webm"} and p.is_file():
            by.setdefault(sha(p), []).append(p.name)
    dup = [v for v in by.values() if len(v) > 1]
    if dup:
        add("WARN", "B9", f"有 {len(dup)} 組內容完全相同的音檔", "同一個聲音當成不同 cue（酸黃瓜 win_max＝win_small）：" + " ｜ ".join("＝".join(g[:3]) for g in dup[:4]))
    elif by:
        add("PASS", "B9", f"音檔沒有重複內容（{len(by)} 檔）")


AUDIO_EXT = {".wav", ".m4a", ".mp3", ".ogg", ".webm"}


def check_audio_siblings(upload: Path) -> None:
    """Sound files byte-identical to another game's staged package (Reused assets / Bad sound design)."""
    fe = upload / "frontend"
    if not fe.exists():
        return
    mine = {sha(p): p.name for p in fe.rglob("*") if p.suffix.lower() in AUDIO_EXT and p.is_file() and p.stat().st_size < 40_000_000}
    if not mine:
        return
    worst, worst_n = "", 0
    for other in sorted(upload.parent.iterdir()):
        ofe = other / "frontend"
        if other == upload or other.name.startswith("_") or not ofe.is_dir():
            continue
        theirs = {sha(p) for p in ofe.rglob("*") if p.suffix.lower() in AUDIO_EXT and p.is_file() and p.stat().st_size < 40_000_000}
        n = len(set(mine) & theirs)
        if n > worst_n:
            worst, worst_n = other.name, n
    share = worst_n / len(mine)
    if share >= 0.5:
        add("FAIL", "B10", f"{worst_n}/{len(mine)} 個音檔和 {worst} 位元組相同",
            "這款沿用對方的音效，或對方沿用這款的（工具分不出誰是來源）。沿用＝「Reused assets」「Bad sound design」"
            "（Go Banandit 10-04，5.0/9）；佔位音要在 README 標明，送審前換掉")
    elif worst_n:
        add("WARN", "B10", f"{worst_n}/{len(mine)} 個音檔和 {worst} 位元組相同", "逐一確認是共用的 UI 音還是沒換的殘留")
    else:
        add("PASS", "B10", f"音檔沒有和其他遊戲相同的（{len(mine)} 檔）")


def check_readme(upload: Path) -> None:
    t = read(upload / "README.md")
    if not t:
        return
    if re.search(r"(front|math)\s*v\d+|published|未上傳|not uploaded|staged|平台", t, re.I):
        add("PASS", "B8", "README 有寫平台版本／上傳狀態")
    else:
        add("WARN", "B8", "README 沒寫平台上是哪一版", "AGENTS.md：打包更新要說明平台本身有沒有更新")


# ───────────────────────── report ─────────────────────────

MANUAL = """\
只能人工看的閘門（每條都退過件；逐條回報「看了哪一格、結果」）：
  □ 實機：桌機 1440×900、16:10、4:3、直式 390×844、320×568、pop-out S；MG、FG、購買、重播各走一次
  □ 角色零缺陷：每層亮／暗底、全部動作每 0.12 s 逐格、遊戲內桌機＋直式（AGENTS.md）
  □ 角色面向盤面、身體與所有表演都不壓盤面（16:10、4:3 最窄）
  □ 角色不被背景吃掉（MG、FG 背景各看一次）
  □ 每個符號在停輪盤面上有自己的待機表演；背景有東西自己在動
  □ 數字都在乾淨底上、不壓插圖；最暗那階也讀得清楚（不是墨字加墨邊）
  □ hover：每顆按鈕與 Buy Bonus 用真滑鼠移上去，會亮、不反灰、圖示不消失
  □ 套了範本／新下注列：不歪、不壓道具或人物、沒有 emoji、面板不透影、FG／重播時不留孤兒按鈕
  □ runtime 稽核：social_text_audit.js（?social=true&currency=GC 每個畫面）、ui_center_audit.js
  □ 帶數值的符號每一階都讀得到；說明頁列出每個數值
  □ 文案對 books 驗（不是對規格）；送審描述 150–190 字
  □ 商店圖：BG＋FG 合成後 200 px 看得出主題；封面右上、左下留空
  □ 音效：新音效 Stone 試聽過；BGM 是真的音樂；大獎音效每級更長；沒有和姊妹作相同的檔
  □ 16 個語言：新字串都有；最長語言（德文）沒有溢出
  □ 這次修的問題：另一隻角色、其他尺寸、未上線的姊妹作、每棵 worktree 都查過
  □ 官方 self-check（engine-self-check.md）跑過，FAIL 修完或 Stone 明確接受
  □ 來源層／合成圖／Spine images／runtime 裁圖／烘焙／預覽／upload 是同一最終版本
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("app", type=Path)
    ap.add_argument("--upload", type=Path)
    ap.add_argument("--source-names", default="")
    ap.add_argument("--palette", default="")
    ap.add_argument("--docs", type=Path, action="append", default=[])
    ap.add_argument("--quiet", action="store_true", help="不列 PASS")
    a = ap.parse_args()

    app = a.app.resolve()
    if not (app / "src").exists():
        print(f"不是 app 資料夾（沒有 src/）：{app}")
        return 2
    names = [n.strip() for n in a.source_names.split(",") if n.strip()]

    check_build_chain(app)
    check_ship(app)
    check_assets_same_src(app)
    check_hover(app)
    check_review_tags(app, a.palette)
    check_background_life(app)
    check_interim(app)
    check_minor_words(app, [d.resolve() for d in a.docs])
    check_source_names(app, a.upload.resolve() if a.upload else None, names)
    check_km(app)
    check_shared_drift(app)

    if a.upload:
        up = a.upload.resolve()
        if not up.exists():
            add("FAIL", "B1", "upload 資料夾不存在", str(up))
        else:
            check_upload_structure(up)
            check_upload_contamination(up)
            check_staged_is_current(app, up)
            modes = check_math(up)
            check_rtp_in_frontend(up, modes)
            check_store_art(up)
            check_provider_logo(up)
            check_audio_dupes(up)
            check_audio_siblings(up)
            check_readme(up)
    else:
        add("SKIP", "B", "沒給 --upload，略過上傳包檢查", "打包後再跑一次並加 --upload upload/<Game>")

    order = {"FAIL": 0, "WARN": 1, "INFO": 2, "SKIP": 3, "PASS": 4}
    count = {k: sum(1 for r in RESULTS if r[0] == k) for k in order}
    print(f"製程閘門 preflight：{app.name}" + (f"  ＋ {a.upload}" if a.upload else ""))
    print("  " + " · ".join(f"{count[k]} {k}" for k in order if count[k]))
    print()
    for level, cid, title, detail in sorted(RESULTS, key=lambda r: (order[r[0]], r[1])):
        if a.quiet and level == "PASS":
            continue
        print(f"  {level:<4} [{cid}] {title}")
        if detail and level != "PASS":
            print(f"         {detail}")
        elif detail:
            print(f"         {detail[:140]}")
    print()
    print(MANUAL)
    return 1 if count["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())
