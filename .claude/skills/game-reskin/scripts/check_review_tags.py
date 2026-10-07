#!/usr/bin/env python3
"""Static audit of one app against the three presentation tags Stake review uses.

    Low quality assets   "generic or AI art, standard fonts, emoji icons or
                          gradient fills"
    Poor animations      "janky, missing in key moments, short of polish"
    Poor bet UI bar      "unclear, hard to use, not the expected UX"

Deadwood Express was rejected twice on these (2026-09-23, 2026-09-26). Every
check below is something that was actually found in it, or in the shared
packages every reskin inherits, and was invisible to the build and to the
existing guards. See references/review-findings.md, "Deadwood Express, second
review".

What it cannot see: whether the art itself looks AI-made, and whether a moment
FEELS flat. It finds the mechanical causes; the playthrough is still required.

usage: check_review_tags.py APP_DIR [--palette HEX,HEX,...]

  APP_DIR    e.g. wp/apps/DeadwoodExpress
  --palette  the SOURCE game's signature colours (without 0x/#), grepped as
             leftovers. Hot Miami: ff8ede,2b0a2e,ffe6f7,ff65c9,ff2aa9,ff5ccf

Exit 1 if any FAIL, else 0. WARN lines need a human decision.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

SYSTEM_FONTS = r"Georgia|Arial|Helvetica|Times(?: New Roman)?|Verdana|Tahoma|Trebuchet(?: MS)?|Courier(?: New)?|Impact|Comic Sans(?: MS)?|Segoe UI"
CODE_EXT = {".svelte", ".ts", ".js", ".mjs", ".css", ".scss", ".html"}
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆⏩-⏺]")

findings: list[tuple[str, str, str, str]] = []  # (tag, level, where, message)


def add(tag: str, level: str, where: str, message: str) -> None:
    findings.append((tag, level, where, message))


def strip_comment(line: str) -> str:
    """Drop // and single-line /* */ and <!-- --> comments (good enough for grep)."""
    line = re.sub(r"/\*.*?\*/", "", line)
    line = re.sub(r"<!--.*?-->", "", line)
    if re.match(r"\s*(//|\*|/\*|<!--)", line):
        return ""
    return re.sub(r"(?<![:\"'])//.*$", "", line)


def blank_block_comments(text: str) -> str:
    """Blank /* */ and <!-- --> blocks, keeping newlines so line numbers hold."""
    keep_lines = lambda m: re.sub(r"[^\n]", " ", m.group(0))
    text = re.sub(r"/\*.*?\*/", keep_lines, text, flags=re.S)
    return re.sub(r"<!--.*?-->", keep_lines, text, flags=re.S)


def first_family(value: str) -> str:
    return value.split(",")[0].strip().strip("'\"")


def scan_code(path: Path, rel: str, palette: list[str]) -> None:
    text = blank_block_comments(path.read_text(errors="ignore"))
    lines = text.splitlines()
    is_intro = path.name == "FreeSpinIntro.svelte"
    for n, raw in enumerate(lines, 1):
        line = strip_comment(raw)
        if not line.strip():
            continue
        where = f"{rel}:{n}"

        # ── fonts ────────────────────────────────────────────────────────────
        # CSS: font-family: X  /  font: <size> X  — only the FIRST family
        # matters; a system face as a fallback after a webfont is fine.
        for m in re.finditer(r"font-family\s*:\s*([^;}\"]+)", line):
            fam = first_family(m.group(1))
            if re.fullmatch(SYSTEM_FONTS, fam, re.I):
                add("assets", "FAIL", where, f"system font first in stack: font-family:{fam}")
        for m in re.finditer(r"\bfont\s*:\s*([^;}\"]+)", line):
            val = m.group(1)
            fam_part = re.sub(r"^(?:[\w.%-]+\s+)*?(?:[\d.]+(?:px|rem|em|%)|calc\([^)]*\)|clamp\([^)]*\))(?:/[\d.]+)?\s*", "", val.strip())
            fam = first_family(fam_part) if fam_part else ""
            if fam and re.fullmatch(SYSTEM_FONTS, fam, re.I):
                add("assets", "FAIL", where, f"system font first in shorthand: font:{val.strip()}")
        # pixi / canvas: fontFamily: 'Georgia'   ctx.font = 'bold 100px Georgia'
        for m in re.finditer(r"fontFamily\s*:\s*['\"]([^'\"]+)['\"]", line):
            if re.fullmatch(SYSTEM_FONTS, first_family(m.group(1)), re.I):
                add("assets", "FAIL", where, f"pixi Text in a system font: {m.group(1)}")
        for m in re.finditer(r"['\"]((?:bold|normal|\d00)?\s*\d+px\s+([^'\"]+))['\"]", line):
            if re.fullmatch(SYSTEM_FONTS, first_family(m.group(2)), re.I):
                add("assets", "FAIL", where, f"canvas font string in a system font: {m.group(1)}")

        # ── emoji as icons / copy ────────────────────────────────────────────
        if EMOJI.search(line) and ("'" in line or '"' in line or "`" in line or ">" in line):
            add("assets", "WARN", where, "emoji glyph in a string/markup — must never be the shipped icon")

        # ── pixi 8 array fills ───────────────────────────────────────────────
        if re.search(r"\bfill\s*[:=]\s*\{?\s*\[\s*0x", line):
            add("assets", "WARN", where, "array fill — pixi 8 draws only the FIRST colour; pass one value if a tint is intended")

        # ── source-game palette ──────────────────────────────────────────────
        low = line.lower()
        for hexv in palette:
            if f"0x{hexv}" in low or f"#{hexv}" in low:
                add("assets", "FAIL", where, f"source-game colour {hexv}")
            else:
                r, g, b = int(hexv[0:2], 16), int(hexv[2:4], 16), int(hexv[4:6], 16)
                if re.search(rf"rgba?\(\s*{r}\s*,\s*{g}\s*,\s*{b}\b", low):
                    add("assets", "FAIL", where, f"source-game colour {hexv} as rgb()")

        # ── count-up precision ───────────────────────────────────────────────
        m = re.search(r"bookEventAmountToCurrencyString\(([^)]*)\)", line)
        if m and re.search(r"countUp|\.current|tween", m.group(1), re.I):
            add("animations", "FAIL", where,
                "per-frame count-up formatted with bookEventAmountToCurrencyString — prints 4 decimals mid-count; use bookEventAmountToCountUpString(frame, final)")

        # ── timer-driven animation ───────────────────────────────────────────
        m = re.search(r"setInterval\([^,]+,\s*(\d+)\s*\)", line)
        if m and int(m.group(1)) <= 60:
            add("animations", "WARN", where, f"animation stepped by setInterval({m.group(1)}) — drive it from requestAnimationFrame / the pixi ticker")

        # ── modal chrome ─────────────────────────────────────────────────────
        if re.search(r"\.pop-up-wrap\)?\s*(?:,\s*:global\([^)]*\))?\s*\{[^}]*background(?:-color)?\s*:\s*#[0-9a-f]{6}\b(?!\w)", line, re.I):
            add("bet bar", "WARN", where, ".pop-up-wrap painted opaque — every pop-up blacks out the game behind it")

    if is_intro:
        art = len(re.findall(r"<Sprite\b|CastFigure|<FreeSpinAnimation\b|FeatureSplashPanel", text))
        motion = len(re.findall(r"requestAnimationFrame|Tween|ticker", text))
        if art == 0 or motion == 0:
            add("animations", "FAIL", rel,
                f"free-game intro has {art} art element(s) and {motion} animation driver(s) — the feature trigger is THE key moment; a scrim with text on it is what 'missing in key moments' means")


def scan_svg(path: Path, rel: str) -> None:
    text = path.read_text(errors="ignore")
    if "<text" in text:
        fam = re.search(r"font-family=\"([^\"]+)\"", text)
        add("assets", "FAIL", rel,
            f"SVG with baked <text> ({fam.group(1) if fam else 'default font'}) — an SVG drawn as an image cannot load web fonts, so it always renders in a system face; set the words at runtime")
    if text.count("<linearGradient") + text.count("<radialGradient") >= 2 and "<image" not in text:
        add("assets", "WARN", rel, "vector plate built from gradient fills — reads as 'gradient fills'; prefer the game's painted plate art")


def scan_png(path: Path, rel: str) -> None:
    """Flat vector art saved as PNG: a handful of fill colours, no texture.

    Hard Time's whole UI kit, titles, logo and low-pay suits were 3-4 colour
    fills (4-18 KB at 640 px) beside painted premiums - two styles on one
    screen. Anti-aliased edges add a few hundred blends, so count only colours
    that cover a real share of the opaque area.
    """
    try:
        from PIL import Image
    except ImportError:
        return
    im = Image.open(path)
    if min(im.size) < 128:
        return
    im = im.convert("RGBA")
    colours = im.getcolors(maxcolors=1 << 16)
    if colours is None:
        return  # photographic / painted: far too many colours to be flat
    opaque = [(n, c) for n, c in colours if c[3] > 200]
    total = sum(n for n, _ in opaque) or 1
    major = [c for n, c in opaque if n / total > 0.01]
    if 0 < len(major) <= 6 and len(colours) < 3000:
        add("assets", "WARN", rel,
            f"flat-fill art ({len(major)} fill colours) — reads as vector/placeholder next to painted art; texture it from the game's own painted material or regenerate")


def scan_theme(app: Path) -> None:
    theme = app / "src/game/uiTheme.ts"
    if not theme.exists():
        return
    text = theme.read_text(errors="ignore")
    head = text.split("if (skin ===")[0]  # the default skin block only
    if re.search(r"betBarLayout\s*:\s*['\"]compactBottom", head):
        step = re.search(r"stepButtonScale\s*:\s*([\d.]+)", head)
        scale = float(step.group(1)) if step else 0.28
        flank = re.search(r"stepperLayout\s*:\s*['\"]flank", head)
        if scale < 0.4:
            add("bet bar", "FAIL", "src/game/uiTheme.ts",
                f"+/- stepper at stepButtonScale {scale} ≈ {scale * 150 * 1280 / 1920:.0f}px across at 1280×720 — use stepperLayout:'flank' with stepButtonScale ≥ 0.44")
        if not flank:
            add("bet bar", "FAIL", "src/game/uiTheme.ts",
                "compactBottom with the stacked stepper leaves an empty cell between Win and Bet — set stepperLayout:'flank'")
    if "buyBonusHideInFreeSpins" not in head:
        add("bet bar", "WARN", "src/game/uiTheme.ts", "Buy Bonus stays drawn during free spins — consider buyBonusHideInFreeSpins:true")
    if "portraitMenuScale" not in head:
        add("bet bar", "WARN", "src/game/uiTheme.ts",
            "portrait spin row at template sizes (menu 1.0 > autospin 0.7 > ± 0.5) — check the hierarchy, portraitMenuScale/portraitStepScale")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("app")
    ap.add_argument("--palette", default="")
    args = ap.parse_args()
    app = Path(args.app).resolve()
    palette = [h.strip().lower().removeprefix("0x").removeprefix("#") for h in args.palette.split(",") if h.strip()]

    files = [p for p in sorted((app / "src").rglob("*"))
             if p.is_file() and p.suffix in CODE_EXT and "stories" not in p.parts]
    # Comment-free source, to tell what is actually USED: a component nothing
    # imports (Deadwood still carried HotMiamiLoader and NeonFrames) and an SVG
    # named only in a comment never reach the player.
    live = {p: blank_block_comments(p.read_text(errors="ignore")) for p in files}
    live = {p: "\n".join(strip_comment(l) for l in t.splitlines()) for p, t in live.items()}
    blob = "\n".join(live.values())
    skipped = []
    for path in files:
        if path.suffix == ".svelte" and path.parent.name != "routes":
            others = "\n".join(t for q, t in live.items() if q != path)
            if not re.search(rf"\b{re.escape(path.stem)}\b", others):
                skipped.append(str(path.relative_to(app)))
                continue
        scan_code(path, str(path.relative_to(app)), palette)
    for path in sorted((app / "static").rglob("*.svg")):
        if path.name in blob:
            scan_svg(path, str(path.relative_to(app)))
    for path in sorted((app / "static").rglob("*.png")):
        # line icons are meant to be flat (art-brief-template §6); FX sprites
        # are soft masks; thin frame edges are overlays
        name = (path.parent.name + "/" + path.name).lower()
        if path.name in blob and not any(k in name for k in ("icon", "fx", "frame_edge")):
            scan_png(path, str(path.relative_to(app)))
    scan_theme(app)
    kept = findings
    if skipped:
        print("skipped (imported nowhere): " + ", ".join(skipped))

    fails = 0
    for tag in ("assets", "animations", "bet bar"):
        rows = [f for f in kept if f[0] == tag]
        title = {"assets": "Low quality assets", "animations": "Poor animations", "bet bar": "Poor bet UI bar"}[tag]
        print(f"\n== {title}: {len(rows)} finding(s)")
        for _, level, where, msg in rows:
            print(f"  {level:4} {where}  {msg}")
            fails += level == "FAIL"
    print(f"\n{fails} FAIL, {sum(f[1] == 'WARN' for f in kept)} WARN")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
