"""Copy the original Game145 art into a self-contained Blood Moon skin.

Run with the workspace Python environment (Pillow and imageio-ffmpeg are
already installed there). No game code is generated and source files are
    never modified. PNGs and MP4s are copied byte-for-byte; audio is encoded
    to browser-friendly MP3 and fallback PNGs decode packed RGB/alpha video.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image


APP = Path(__file__).resolve().parents[1]
STAKE = APP.parents[2]
DEFAULT_SOURCE = STAKE / "星城抄錄" / "血月伯爵" / "extracted" / "game145"
DEFAULT_OUTPUT = APP / "static" / "bloodmoon"


def prepare(source: Path, output: Path) -> dict:
    source = source.resolve(strict=True)
    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    assets: dict[str, dict] = {}
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def copy(relative_source: str, relative_output: str) -> str:
        src = source / relative_source
        if not src.is_file() and relative_source.startswith("textures/"):
            relative_source = "sprites/_loose/" + Path(relative_source).name
            src = source / relative_source
        dst = output / relative_output
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        url = "/bloodmoon/" + relative_output
        entry = {
            "source": relative_source,
            "bytes": dst.stat().st_size,
            "sha256": hashlib.sha256(dst.read_bytes()).hexdigest(),
        }
        if dst.suffix.lower() == ".png":
            with Image.open(dst) as image:
                entry["width"], entry["height"] = image.size
        assets[url] = entry
        return url

    scene_sources = {
        "base": "NG_Bkg_01",
        "free": "FG_Bkg",
        "freeBackgroundGlow": "FG_Bkg_Glow",
        "moon": "Moon",
        "bloodMoon": "BloodMoon",
        "treeLeft": "NG_Bkg_Tree_L",
        "treeRight": "NG_Bkg_Tree_R",
        "transitionCrest": "NGtoFG_Outer",
        "wildHuntTitle": "WILD-HUNT",
    }
    scene = {
        key: copy(f"textures/{name}.png", f"scene/{key}.png")
        for key, name in scene_sources.items()
    }

    environment = {
        key: copy(f"textures/{name}.png", f"environment/{key}.png")
        for key, name in {
            "mist": "G145_LineSmoke_01_Tex",
            "glint": "G145_GlowLight_0001_Tex",
            "batBase": "G145_NG_Bat_FrontA_00_Tex", "batFree": "G145_FG_Bat_FrontA_01_Tex",
        }.items()
    }
    celebrations = {
        key: copy(f"textures/G145_{name}Win_TXT1.png", f"celebrations/{key}.png")
        for key, name in {"big": "Big", "super": "Super", "mega": "Mega", "epic": "Epic"}.items()
    }

    symbol_sources = {
        **{str(i): f"icon_{i:02d}" for i in range(8)},
        "8": "icon_10",       # Protocol 8 is BONUS, not the source filename.
        "9": "icon_08_6x6",  # Protocol 9 is FREE SPINS.
        **{str(i + 10): f"icon_09-{i + 1}" for i in range(4)},
    }
    symbols = {
        key: copy(f"textures/{name}.png", f"symbols/{key}.png")
        for key, name in symbol_sources.items()
    }

    ui_sources = {
        "freeEnergyFrame": "G145_FG_Accum1",
    }
    ui = {
        key: copy(f"textures/{name}.png", f"ui/{key}.png")
        for key, name in ui_sources.items()
    }
    ui["multipliers"] = {
        str(value): copy(f"sprites/FG/X{value}.png", f"ui/multiplier-{value}.png")
        for value in [2, 3, 5, 8, 12]
    }

    sound_names = [
        "ngBgm", "fgBgm", "ngStart", "stop", "stop_6x6", "iconExpansion",
        "WildHuntWord", "CharaForecastWild1", "CharaForecastWild2", "CharaWild",
        "CharaBack", "ngWILDvibe", "ngWILDbat", "fgWILDvibe", "fgWILDbat",
        "WildSuccess", "WildFail", "wildIconSuccess", "wildIconCollect",
        "fgGet", "FgIn", "fgInto", "fgEnter",
        "fgSpinsPlus", "fgSpinsReduce", "fgPoint", "fgPointNew",
        "fgMultiplierGet", "ScoreMultiplier", "Line", "Score",
        "CharaWin1", "CharaWin2", "CharaWin2.5", "CharaWin3", "WUI_Touch",
        "Big_Start", "Super_Start", "Mega_Start", "Epic_Start", "Big_Loop", "Mega_Loop",
        "Big_RunNum", "Mega_RunNum", "WinShow_End", "sceneBat_S",
        "fgNumberGet", "freeForecast", "TitleIn",
    ]
    audio = {}
    for name in sound_names:
        src = source / "audio" / f"{name}.wav"
        target = output / "audio" / f"{name}.mp3"
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
            "-codec:a", "libmp3lame", "-b:a", "160k", str(target),
        ], check=True)
        url = f"/bloodmoon/audio/{name}.mp3"
        audio[name] = url
        assets[url] = {
            "source": f"audio/{name}.wav", "operation": "MP3 160 kbps; original duration and sample rate",
            "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        }
        previous = output / "audio" / f"{name}.wav"
        if previous.is_file():
            previous.unlink()

    character: dict[str, dict] = {}
    for stage, prefix in [("base", "NG"), ("free", "FG")]:
        states = {}
        for src in sorted((source / "videos").glob(f"Game145_{prefix}_Dracula_*.mp4")):
            state = src.stem.removeprefix(f"Game145_{prefix}_Dracula_")
            states[state] = copy(f"videos/{src.name}", f"character/{stage}-{state}.mp4")
        character[stage] = states

    # Textures preserve the full, equal-sized source frame canvases. Cropped
    # Sprite exports have changing extents and would jitter when played alone.
    sequence_patterns = {
        "merge": "3X6_*.png",
        "wildIn": "G145_Dracula_WildTrans_Icon_In_*.png",
        "wildLoop": "G145_Dracula_WildTrans_Icon_Loop_*.png",
        "wildSuccess": "G145_Dracula_WildTrans_Icon_Out_Success_*.png",
        "wildFail": "G145_Dracula_WildTrans_Icon_Out_Fail_*.png",
    }
    sequences = {}
    for key, pattern in sequence_patterns.items():
        frames = sorted((source / "textures").glob(pattern))
        sequences[key] = [
            copy(f"textures/{frame.name}", f"effects/{key}/{index:03d}.png")
            for index, frame in enumerate(frames)
        ]

    fallback = {}
    for stage, prefix in [("base", "NG"), ("free", "FG")]:
        src = source / "videos" / f"Game145_{prefix}_Dracula_Idle.mp4"
        frames = imageio_ffmpeg.read_frames(str(src), pix_fmt="rgb24")
        metadata = next(frames)
        try:
            frame = Image.frombytes("RGB", metadata["size"], next(frames))
        finally:
            frames.close()
        width, height = frame.size
        rgb = frame.crop((0, 0, width, height // 2))
        alpha = frame.crop((0, height // 2, width, height)).convert("L")
        rgb.putalpha(alpha)
        target = output / "character" / f"{stage}-idle.png"
        rgb.save(target)
        url = f"/bloodmoon/character/{stage}-idle.png"
        fallback[stage] = url
        assets[url] = {
            "source": f"videos/{src.name}",
            "operation": "first RGB24 decoded frame; top half RGB, bottom half luminance alpha",
            "width": rgb.width,
            "height": rgb.height,
            "bytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        }

    manifest = {
        "schemaVersion": 1,
        "gameId": "blood-moon-count",
        "sourceGame": "XinStar Game145",
        "assetBase": "/bloodmoon/",
        "scene": scene,
        "environment": environment,
        "celebrations": celebrations,
        "symbols": symbols,
        "symbolContract": {
            "protocolIds": {"bonus": 8, "free": 9, "wilds": [10, 11, 12, 13]},
            "logicalCell": [108, 108],
            "board": [6, 6],
            "supportsSquareSizes": [1, 2, 3, 4, 5, 6],
            "wildOriginalSymbol": {str(i + 10): i for i in range(4)},
            "note": "Use bar/head geometry and clip to visible board; do not tile a large icon into separate images.",
        },
        "ui": ui,
        "audio": audio,
        "character": character,
        "characterFallback": fallback,
        "characterFormat": {
            "packedSize": [512, 1456], "displaySize": [512, 728],
            "fps": 30, "rgb": "top-half", "alpha": "bottom-half luminance",
            "note": "MP4 is packed alpha, not directly transparent. Use compositing or the RGBA fallback.",
        },
        "sequences": sequences,
        "sequenceFps": 30,
        "assets": assets,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Vite cannot import JSON from the public/static tree during development.
    if output.resolve() == DEFAULT_OUTPUT.resolve():
        app_manifest = APP / "src" / "game" / "bloodmoonAssets.json"
        app_manifest.parent.mkdir(parents=True, exist_ok=True)
        app_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    manifest = prepare(args.source, args.output)
    print(json.dumps({
        "output": str(args.output),
        "assets": len(manifest["assets"]),
        "bytes": sum(asset["bytes"] for asset in manifest["assets"].values()),
        "sequences": {key: len(frames) for key, frames in manifest["sequences"].items()},
    }, ensure_ascii=False))
