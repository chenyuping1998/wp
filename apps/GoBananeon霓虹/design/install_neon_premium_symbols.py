"""Install the Neon symbol pack together with every mesh lighting layer.

The importer for the old framed pack crops ten percent from each high symbol.
This importer deliberately preserves the complete square RGBA canvas and UVs.
It stages the original sprites, bakes glow/sheen from those exact PNGs, verifies
the derived silhouettes and hashes, and only then replaces the live set. A
timestamped backup makes each installation reversible.

  python design/install_neon_premium_symbols.py design/source/neon_premium/symbols
  python design/install_neon_premium_symbols.py design/source/neon_premium/symbols --apply
  python design/install_neon_premium_symbols.py --check

Input: h1,h2,h3,h4,w,s,b.png (required), l1..l5,p,x.png (optional).
Square 1024..2048px canvases are retained at native resolution. The runtime's
256-unit rig scales its UVs independently of the PNG resolution.
Use --allow-partial when deliberately updating a subset, such as the royals.
By default this only stages and verifies; --apply installs the staged result.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
BASELINE = APP / "static/assets/sprites/goBananasSymbolsV3"
SPRITES = APP / "static/assets/sprites/goBananeonSymbolsV4"
DELIVERY = APP / "design/source/neon_premium"
REQUIRED = {"h1", "h2", "h3", "h4", "w", "s", "b"}
KNOWN = REQUIRED | {"l1", "l2", "l3", "l4", "l5", "p", "x"}
GLOW_KEYS = KNOWN - {"x"}
MANIFEST = "_layers_manifest.json"


def sha(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def read_rgba(file: Path) -> Image.Image:
    with Image.open(file) as source:
        source.load()
        return source.convert("RGBA")


def output_files(key: str, legacy: bool = False) -> list[str]:
    files = [f"{key}.png"]
    if key in GLOW_KEYS:
        files += [f"{key}_glow.png", f"{key}_sheen.png"]
    if legacy:
        files += [f"{key}_{layer}.png" for layer in ("subject", "plate", "shadow")]
    return files


def inspect_source(file: Path, key: str) -> dict:
    image = read_rgba(file)
    if image.width != image.height:
        raise ValueError(f"{key}: expected square canvas; received {image.size}. No automatic crop is applied.")
    if image.width < 1024 or image.width > 2048:
        raise ValueError(f"{key}: expected a native square canvas between 1024 and 2048px; received {image.size}. Prepare the source at the intended UV layout.")
    alpha = np.asarray(image.getchannel("A"))
    opaque = alpha >= 128
    if opaque.sum() < alpha.size * 0.01:
        raise ValueError(f"{key}: no readable subject in the alpha channel")
    if key in REQUIRED and (alpha <= 8).mean() < 0.04:
        raise ValueError(f"{key}: the premium high symbols must have a transparent background")
    ys, xs = np.nonzero(opaque)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    return {"source": str(file.resolve()), "sourceSha256": sha(file), "canvas": list(image.size), "opaqueBounds": bbox, "transparentFraction": float((alpha <= 8).mean())}


def rig_fingerprint() -> str:
    root = APP / "src/game/meshWin"
    lines = [f"{f.name}:{sha(f)}" for f in sorted(root.glob("*.ts"))]
    return hashlib.sha256("\n".join(lines).encode()).hexdigest()


def verify(directory: Path, keys: list[str] | None = None, check_recipe: bool = False) -> dict:
    manifest_file = directory / MANIFEST
    if not manifest_file.is_file():
        raise ValueError(f"No layer manifest found at {manifest_file}; rebuild the pack before checking.")
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    keys = keys or sorted(manifest["symbols"])
    if check_recipe:
        if manifest.get("generatorSha256") != sha(APP / "design/make_symbol_layers.mjs"):
            raise ValueError("Layer generator changed since the pack was baked; rebuild the selected pack.")
        if manifest.get("rigFingerprint") != rig_fingerprint():
            print("NOTE: mesh source changed since baking. Run the mesh gate; lighting remains verified against its recorded source sprites.")
    for key in keys:
        record = manifest["symbols"].get(key)
        if not record:
            raise ValueError(f"{key}: layer manifest entry missing")
        art_file = directory / f"{key}.png"
        if record["artSha256"] != sha(art_file):
            raise ValueError(f"{key}: static art changed after mesh layers were baked")
        art = read_rgba(art_file)
        if key not in GLOW_KEYS:
            print(f"{key}: sprite hash OK (no mesh lighting layers required)")
            continue
        glow_file, sheen_file = directory / f"{key}_glow.png", directory / f"{key}_sheen.png"
        for name, file in (("glow", glow_file), ("sheen", sheen_file)):
            if record[f"{name}Sha256"] != sha(file):
                raise ValueError(f"{key}: {name} does not match the recorded bake")
        glow, sheen = read_rgba(glow_file), read_rgba(sheen_file)
        if glow.size != (512, 512) or sheen.size != (768, 512):
            raise ValueError(f"{key}: invalid glow/sheen dimensions: {glow.size}/{sheen.size}")
        art_alpha = art.getchannel("A")
        # Downsampling can spill half a source texel; compare against a one-pixel
        # dilation, rather than incorrectly reporting antialiasing as a halo.
        allowed = np.asarray(art_alpha.resize((512, 512), Image.Resampling.BOX).filter(ImageFilter.MaxFilter(3)))
        glow_alpha = np.asarray(glow.getchannel("A"))
        leak = (allowed <= 1) & (glow_alpha > 3)
        if leak.any():
            raise ValueError(f"{key}: glow has {int(leak.sum())} pixels outside the source silhouette")
        allowed_sheen = np.asarray(art_alpha.resize((128, 128), Image.Resampling.BOX).filter(ImageFilter.MaxFilter(3)))
        sheen_alpha = np.asarray(sheen.getchannel("A"))
        for frame in range(24):
            x, y = frame % 6 * 128, frame // 6 * 128
            cell = sheen_alpha[y:y + 128, x:x + 128]
            if ((allowed_sheen <= 1) & (cell > 3)).any():
                raise ValueError(f"{key}: sheen frame {frame} escapes the source silhouette")
        if not glow_alpha.max() or not sheen_alpha.max():
            raise ValueError(f"{key}: empty mesh lighting layer")
        legacy = record.get("legacyFiles", {})
        for name, digest in legacy.items():
            if sha(directory / name) != digest:
                raise ValueError(f"{key}: legacy attachment {name} is stale")
        if legacy and (directory / f"{key}_subject.png").read_bytes() != art_file.read_bytes():
            raise ValueError(f"{key}: legacy subject differs from the current sprite")
        for name, digest in record.get("aliases", {}).items():
            if sha(directory / name) != digest or digest != record["artSha256"]:
                raise ValueError(f"{key}: flying/transition prop {name} differs from the current bomb")
        print(f"{key}: static / land / win source and 24 sheen frames verified")
    return manifest


def legacy_layers(stage: Path, key: str) -> dict:
    """Keep the old H3 cut attachments coherent even though its rig is panel.

    The registry still preloads these. Transparent art needs no painted plate:
    the subject is an exact copy, its plate is empty and its shadow follows the
    same alpha. This also protects any older review tool that draws cut layers.
    """
    image = read_rgba(stage / f"{key}.png")
    shutil.copy2(stage / f"{key}.png", stage / f"{key}_subject.png")
    Image.new("RGBA", image.size).save(stage / f"{key}_plate.png", optimize=True)
    shadow = Image.new("RGBA", (256, 256), (8, 6, 18, 0))
    alpha = image.getchannel("A").resize((256, 256), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(5))
    shadow.putalpha(alpha.point(lambda a: round(a * 0.7)))
    shadow.save(stage / f"{key}_shadow.png", optimize=True)
    return {f"{key}_{layer}.png": sha(stage / f"{key}_{layer}.png") for layer in ("subject", "plate", "shadow")}


def contact_sheet(stage: Path, keys: list[str]) -> None:
    width, height = 250 * 4, 420 * ((len(keys) + 3) // 4)
    sheet = Image.new("RGB", (width, height), "#0a1026")
    draw = ImageDraw.Draw(sheet)
    for i, key in enumerate(keys):
        x, y = i % 4 * 250, i // 4 * 420
        image = read_rgba(stage / f"{key}.png")
        image.thumbnail((236, 236), Image.Resampling.LANCZOS)
        sheet.paste(image, (x + (250 - image.width) // 2, y + 8), image)
        draw.text((x + 10, y + 250), f"{key.upper()} / 140px reel size", fill="#a9caff")
        thumb = read_rgba(stage / f"{key}.png").resize((140, 140), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x + 55, y + 275), thumb)
    sheet.save(stage / "_premium_contact.jpg", quality=94)


def mesh_checks(node: str, stage: Path, keys: list[str]) -> None:
    wins = [key.upper() for key in keys if key not in {"b", "p", "x"}]
    checks = wins + [f"idle:{key}" for key in wins]
    if "b" in keys:
        checks.extend(["B:land", "dynamite", "dynamite:thrown"])
    if "s" in keys:
        checks.extend(["S:land1", "S:land2", "S:land3"])
    if "p" in keys:
        checks.append("P:land")
    if checks:
        subprocess.run([node, str(APP / "design/check_mesh_wins.mjs"), ",".join(checks), "--source-alpha", f"--sprites-dir={stage}"], check=True, cwd=APP)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", nargs="?", type=Path)
    parser.add_argument("--apply", action="store_true", help="Install the verified stage and back up replaced files")
    parser.add_argument("--check", action="store_true", help="Verify installed source/layer hashes and silhouettes")
    parser.add_argument("--allow-partial", action="store_true", help="Accept a deliberate subset of the seven high/special symbols")
    parser.add_argument("--node", default=shutil.which("node") or "node")
    parser.add_argument("--tools-dir", type=Path, default=Path("E:/stake/tools/gen"))
    args = parser.parse_args()
    if args.check:
        verify(SPRITES, check_recipe=True)
        return
    if not args.source:
        parser.error("source directory is required unless --check is used")
    source = args.source.resolve()
    files = {f.stem.lower(): f for f in source.glob("*.png") if f.stem.lower() in KNOWN}
    if not files:
        raise ValueError(f"No known symbol PNGs in {source}")
    if not args.allow_partial and REQUIRED - files.keys():
        raise ValueError(f"Missing required symbols: {', '.join(sorted(REQUIRED - files.keys()))}")
    keys = sorted(files)
    info = {key: inspect_source(files[key], key) for key in keys}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    stage = DELIVERY / "stages" / stamp
    stage.mkdir(parents=True)
    # V4 has a new URL namespace so a cached V3 symbol cannot be paired with a
    # freshly baked light pass. First install preserves every unchanged prop,
    # X/P sprite and low symbol by copying the complete V3 baseline. Later
    # partial updates begin from the current V4 set.
    baseline = SPRITES if SPRITES.is_dir() else BASELINE
    for file in baseline.iterdir():
        if file.is_file():
            shutil.copy2(file, stage / file.name)
    for key, file in files.items():
        # Copy the exact input PNG, preserving its pixels and recorded hash.
        shutil.copy2(file, stage / f"{key}.png")
    layer_keys = sorted(set(keys) & GLOW_KEYS)
    alpha_keys = [key for key in layer_keys if info[key]["transparentFraction"] >= 0.04]
    if layer_keys:
        subprocess.run([args.node, str(APP / "design/make_symbol_layers.mjs"), str(args.tools_dir), ",".join(layer_keys), f"--output-dir={stage}", f"--alpha-mask={','.join(alpha_keys)}"], check=True, cwd=APP)
    manifest_file = stage / MANIFEST
    manifest = json.loads(manifest_file.read_text(encoding="utf-8")) if manifest_file.exists() else {"version": 1, "symbols": {}, "generatorSha256": sha(APP / "design/make_symbol_layers.mjs"), "rigFingerprint": rig_fingerprint()}
    for key in keys:
        record = manifest["symbols"].setdefault(key, {"artSha256": sha(stage / f"{key}.png"), "canvas": info[key]["canvas"]})
        record["input"] = info[key]
        if (stage / f"{key}_subject.png").exists():
            record["legacyFiles"] = legacy_layers(stage, key)
        if key == "b":
            # All bomb entrances must use the same new transparent subject.
            # Leaving these V3 prop aliases in the baseline would visibly
            # change style as soon as the mascot throws the transition bomb.
            record["aliases"] = {}
            for alias in ("bomb_prop.png", "dynamite.png"):
                shutil.copy2(stage / "b.png", stage / alias)
                record["aliases"][alias] = sha(stage / alias)
    manifest_file.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    verify(stage, keys)
    mesh_checks(args.node, stage, keys)
    contact_sheet(stage, keys)
    print(f"Staged and verified: {stage}")
    if not args.apply:
        print("Live game is unchanged. Add --apply to install the complete verified pack.")
        return
    backup = DELIVERY / "backups" / stamp
    backup.mkdir(parents=True)
    first_install = not SPRITES.is_dir()
    SPRITES.mkdir(parents=True, exist_ok=True)
    installed_manifest = json.loads((SPRITES / MANIFEST).read_text(encoding="utf-8")) if (SPRITES / MANIFEST).exists() else {"version": 1, "symbols": {}}
    installed_manifest.update({k: v for k, v in manifest.items() if k != "symbols"})
    installed_manifest["symbols"].update(manifest["symbols"])
    targets = [name for key in keys for name in output_files(key, "legacyFiles" in manifest["symbols"][key])]
    targets += [name for key in keys for name in manifest["symbols"][key].get("aliases", {})]
    if first_install:
        targets = sorted(set(targets) | {f.name for f in stage.iterdir() if f.is_file() and f.suffix == ".png"})
    if (SPRITES / MANIFEST).exists():
        shutil.copy2(SPRITES / MANIFEST, backup / MANIFEST)
    for name in targets:
        if (SPRITES / name).exists():
            shutil.copy2(SPRITES / name, backup / name)
    try:
        for name in targets:
            shutil.copy2(stage / name, SPRITES / name)
        (SPRITES / MANIFEST).write_text(json.dumps(installed_manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        verify(SPRITES, keys)
    except Exception:
        for name in targets + [MANIFEST]:
            if (backup / name).exists():
                shutil.copy2(backup / name, SPRITES / name)
            elif (SPRITES / name).exists():
                (SPRITES / name).unlink()
        raise
    (DELIVERY / "latest-install.json").write_text(json.dumps({"stage": str(stage), "backup": str(backup), "symbols": keys}, indent=2) + "\n", encoding="utf-8")
    print(f"Installed {len(keys)} symbols, with matching mesh layers. Backup: {backup}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
