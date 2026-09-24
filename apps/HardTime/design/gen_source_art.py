#!/usr/bin/env python3
"""Generate painted source art for Hot Miami symbols via the Gemini API.

Writes raw model output to `design/source/`. It does NOT touch
`static/assets/` — run `process_source_art.py` next, which keys out the
background, makes real alpha and stages the result for review.

    export GEMINI_API_KEY=...
    python design/gen_source_art.py --list
    python design/gen_source_art.py h3                 # one symbol
    python design/gen_source_art.py h4 --ref h3        # match h3's style
    python design/gen_source_art.py --all --ref h3     # everything, h3 as anchor

Why a flat green background instead of asking for transparency: the Gemini
image models do not document an alpha channel, and image models in general
tend to *paint* a checkerboard when asked for transparency rather than emit
one. This repo has been bitten twice — see the opening comment of
`wp/apps/WildParty/design/process_role.mjs`. A saturated key colour that
appears nowhere in the artwork floods out cleanly; a painted checkerboard has
to be pattern-detected.

Style consistency across the five premiums is the hard part of this job. Pass
`--ref <key>` to feed an already-approved symbol back in as a reference image,
which is what the `input` array's image entry is for.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DESIGN = Path(__file__).resolve().parent
SOURCE = DESIGN / "source"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"

# Identity hues are FIXED by the 2026-08-07 procedural rebuild. The board, the
# plates and the win presentation are all tuned around them, so a repaint on
# different hues re-opens the collisions that rebuild closed. See
# docs/art-prompts-hot-miami.md.
KEY_COLOUR = "#00FF00"

STYLE = (
    "Flat vector game-symbol illustration for a neon Miami synthwave slot machine. "
    "Heavy dark outline, bold solid fills, minimal internal detail, strong simple "
    "silhouette readable at thumbnail size. Neon rim-light edging a solid object — "
    "the object is opaque, the neon is only its edge. Centred, square composition, "
    "subject fills most of the frame with a small even margin, no cropping at the "
    f"edges. Plain flat {KEY_COLOUR} chroma-key background, absolutely no gradient, "
    "no shadow cast on the background, no checkerboard, no transparency pattern. "
    "No text, no lettering, no watermark, no border."
)

# Premiums only. w/s/c/fs are plate-and-word designs whose word is typography —
# the procedural generator renders it cleanly, image models render it
# unreliably, and nothing in this pipeline composites a word onto painted art,
# so a painted special would ship as a blank plaque. Royals are typography too.
SYMBOLS: dict[str, dict[str, str]] = {
    "h1": {
        "hue": "#50F0FF",
        "prompt": "A faceted diamond gem, cyan. Angular, vertical, symmetrical, "
        "sharp cut facets catching light.",
    },
    "h2": {
        "hue": "#A86CFF",
        "prompt": "An art-deco Miami skyline block of stepped towers, violet. "
        "Flat-topped, wide, stepped ziggurat profile with lit windows. "
        "No sun, no sun disc, no circular shape behind it.",
    },
    "h3": {
        "hue": "#FF4696",
        "prompt": "A standing flamingo in profile, hot pink. Elegant S-curved neck, "
        "small refined head with a distinct hooked black-tipped bill, plump body, "
        "two thin legs. Graceful, not blobby.",
    },
    "h4": {
        "hue": "#FFC828",
        "prompt": "An UPRIGHT portable boombox radio standing vertically, gold. "
        "Carry handle on top, two round speakers STACKED one above the other, "
        "tall portrait proportions. Must NOT be a wide horizontal box.",
    },
    "h5": {
        "hue": "#96FF3C",
        "prompt": "A convertible sports car seen from a low front three-quarter "
        "angle, lime green. Low wedge-shaped body, windscreen raked back, one "
        "front wheel and one rear wheel visible in perspective. Must NOT be a flat "
        "side-profile box shape.",
    },
}


def build_prompt(key: str) -> str:
    spec = SYMBOLS[key]
    return (
        f"{spec['prompt']}\n\nPrimary colour {spec['hue']} — this is the symbol's "
        f"identity hue and must dominate the object.\n\n{STYLE}"
    )


def request_image(prompt: str, model: str, size: str, ref: Path | None, api_key: str) -> bytes:
    payload: dict = {
        "model": model,
        "input": [{"type": "text", "text": prompt}],
        "response_format": {
            # The API rejects image/png — JPEG is the only supported output, which
            # is another way of saying there is no alpha channel to hope for. The
            # chroma-key background is not a nicety, it is the only route to a
            # cut-out. JPEG ringing around the subject edge is why the keyer runs
            # with a generous tolerance and a spill pass.
            "type": "image",
            "mime_type": "image/jpeg",
            "aspect_ratio": "1:1",
            "image_size": size,
        },
    }
    if ref is not None:
        # Style anchor. Keeps five separately-generated premiums looking like one
        # set, which is the thing that otherwise drifts.
        payload["input"].insert(
            0,
            {
                "type": "image",
                "mime_type": "image/jpeg",
                "data": base64.b64encode(ref.read_bytes()).decode(),
            },
        )
        payload["input"].append(
            {
                "type": "text",
                "text": "Match the rendering style, outline weight, fill treatment "
                "and lighting of the reference image exactly. Only the subject "
                "and its colour differ.",
            }
        )

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            body = json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        sys.exit(f"HTTP {exc.code} from Gemini:\n{exc.read().decode()[:2000]}")

    data = _find_image(body)
    if data is None:
        # The response shape is the most likely thing to drift. Fail loudly with
        # the actual payload rather than a stack trace.
        sys.exit(
            "No image found in the response. Raw payload follows so the shape can "
            f"be checked against the current docs:\n{json.dumps(body)[:3000]}"
        )
    return base64.b64decode(data)


def _find_image(node) -> str | None:
    """Walk the response for base64 image data, tolerating shape changes."""
    if isinstance(node, dict):
        img = node.get("output_image")
        if isinstance(img, dict) and img.get("data"):
            return img["data"]
        if node.get("mime_type", "").startswith("image/") and node.get("data"):
            return node["data"]
        for value in node.values():
            found = _find_image(value)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_image(item)
            if found:
                return found
    return None


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("keys", nargs="*", help="symbol keys to generate, e.g. h3 h4")
    ap.add_argument("--all", action="store_true", help="generate every symbol")
    ap.add_argument("--list", action="store_true", help="list keys and exit")
    ap.add_argument("--ref", metavar="KEY", help="use design/source/<KEY>.png as a style anchor")
    ap.add_argument("--model", default="gemini-3.1-flash-image")
    ap.add_argument("--size", default="2K", choices=["512px", "1K", "2K", "4K"])
    args = ap.parse_args()

    if args.list:
        for key, spec in SYMBOLS.items():
            print(f"{key:3s} {spec['hue']}  {spec['prompt'][:70]}")
        return

    keys = list(SYMBOLS) if args.all else args.keys
    if not keys:
        ap.error("give at least one symbol key, or --all (see --list)")
    unknown = [k for k in keys if k not in SYMBOLS]
    if unknown:
        ap.error(f"unknown key(s): {', '.join(unknown)}")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY is not set. export it; do not commit it.")

    SOURCE.mkdir(parents=True, exist_ok=True)
    ref = None
    if args.ref:
        ref = SOURCE / f"{args.ref}.jpg"
        if not ref.exists():
            sys.exit(f"style reference {ref} does not exist — generate it first")

    for key in keys:
        if ref is not None and key == args.ref:
            print(f"{key}: skipped (it is the style anchor)")
            continue
        print(f"{key}: requesting {args.model} @ {args.size} …", flush=True)
        png = request_image(build_prompt(key), args.model, args.size, ref, api_key)
        out = SOURCE / f"{key}.jpg"
        out.write_bytes(png)
        print(f"{key}: wrote {out.relative_to(DESIGN.parent)} ({len(png) / 1024:.0f} KB)")

    print("\nNext: python design/process_source_art.py --all")


if __name__ == "__main__":
    main()
