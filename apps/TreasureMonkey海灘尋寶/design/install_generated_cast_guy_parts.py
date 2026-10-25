"""Install independently generated cast_guy art into the bat-pose Spine rig.

The source renders are AI-generated on chroma green.  This script performs
only mechanical production work: keying, cropping, proportional scaling and
placement into the existing per-bone canvases.  It never synthesizes or
draws component artwork.
"""

from pathlib import Path

import numpy as np
from PIL import Image


APP_ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path("/Users/stone/.codex/generated_images/01a04df9-9c61-7831-bdcd-3d4b5eca55d9")
OUTPUT = APP_ROOT / "design/source/spine/images"

# Generated file -> final component.  Each source was produced in its own
# imagegen request using guy_reference_bat.png plus the matching placeholder.
SOURCES = {
    "legs": "exec-ad0398e5-d4a2-464c-8173-1bf7f21bb239.png",
    "torso": "exec-06048df2-fddc-4db6-b3de-60c2a8c1aec5.png",
    "arm_upper_l": "exec-4246c213-eedf-463c-8037-c42f3d69be9e.png",
    "arm_upper_r": "exec-9b139850-1652-418d-9031-712f8fc8710e.png",
    "arm_lower_l": "exec-3d5fd0f9-13f2-4799-aaf2-70d5019249a7.png",
    "arm_lower_r": "exec-f005d8c5-5933-4358-a422-fb13127865f1.png",
    "hand_l": "exec-725be6dd-ec58-43a4-8b7f-7029485cadd9.png",
    "hand_r": "exec-54c33db8-7dfa-43e4-a687-caef8bea86af.png",
    "bat": "exec-b5f808be-087f-4e91-98c8-75bb2bf2c4e9.png",
    "head": "exec-f3c49565-4629-48d1-80e7-3cae41bea73f.png",
    "hair": "exec-367439a7-3f47-4f8e-8755-b020bd273bf6.png",
    "hair_tip": "exec-2106e151-4132-428c-9a6b-84af2c5d3b11.png",
    "chain": "exec-81350def-17df-4301-97f5-7fc9e4c30817.png",
}

CANVAS = {
    "legs": 512, "torso": 512, "bat": 384,
    "arm_upper_l": 256, "arm_upper_r": 256,
    "arm_lower_l": 256, "arm_lower_r": 256,
    "head": 256, "hair": 256, "chain": 256,
    "hand_l": 128, "hand_r": 128, "hair_tip": 128,
}

# Placement boxes are taken from the proven shipped canvases for unchanged
# body parts and from the new bat-pose placeholders for the raised arm/bat.
TARGET = {
    "legs": (158, 30, 377, 512),
    "torso": (131, 126, 381, 381),
    "arm_upper_l": (2, 2, 254, 254),
    "arm_lower_l": (104, 86, 156, 171),
    "hand_l": (54, 36, 89, 91),
    "arm_upper_r": (2, 2, 254, 254),
    "arm_lower_r": (111, 110, 221, 243),
    "hand_r": (18, 0, 83, 83),
    "bat": (89, 100, 296, 285),
    "head": (78, 58, 178, 198),
    "hair": (66, 43, 178, 139),
    "hair_tip": (49, 47, 79, 86),
    "chain": (83, 125, 173, 215),
}

# A few independently redrawn parts came back with the wrong aspect ratio
# relative to the character reference. These are mechanical texture-space
# corrections, measured from the normalized reference/setup overlay.
DIRECT = {
    "torso": (124, 83, 265, 345),
    "arm_upper_l": (84, 13, 88, 230),
    "arm_upper_r": (2, 2, 252, 252),
    "bat": (82, 97, 220, 190),
    "head": (79, 62, 98, 150),
    "hair": (77, 48, 102, 94),
    "chain": (88, 133, 80, 70),
}


def extract_subject(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).copy()
    # int32 avoids overflow while squaring 8-bit channel deltas.
    rgb = arr[:, :, :3].astype(np.int32)
    alpha = arr[:, :, 3]
    green_distance = np.sqrt(
        rgb[:, :, 0] ** 2 + (rgb[:, :, 1] - 255) ** 2 + rgb[:, :, 2] ** 2
    )
    keep = (alpha > 16) & (green_distance > 105)
    # Feather only the keyed fringe and despill it; native transparent inputs
    # such as the generated chain/hair keep their original alpha.
    keyed_alpha = np.clip((green_distance - 80) * 3.4, 0, 255).astype(np.uint8)
    arr[:, :, 3] = np.where(keep, np.minimum(alpha, keyed_alpha), 0)
    cap = np.maximum(arr[:, :, 0], arr[:, :, 2])
    fringe = (arr[:, :, 3] > 0) & (arr[:, :, 1] > cap)
    arr[:, :, 1] = np.where(fringe, cap, arr[:, :, 1])
    ys, xs = np.where(arr[:, :, 3] > 20)
    if not len(xs):
        raise RuntimeError(f"No subject pixels found in {path}")
    return Image.fromarray(arr).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def install(name: str) -> None:
    subject = extract_subject(GENERATED / SOURCES[name])
    if name in DIRECT:
        x, y, width, height = DIRECT[name]
        subject = subject.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS[name], CANVAS[name]), (0, 0, 0, 0))
        canvas.alpha_composite(subject, (x, y))
        out = OUTPUT / f"{name}.png"
        canvas.save(out)
        print(f"{name}: {subject.size} at ({x}, {y}) -> {out}")
        return
    x0, y0, x1, y1 = TARGET[name]
    box_w, box_h = x1 - x0, y1 - y0
    scale = min(box_w / subject.width, box_h / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    x = x0 + (box_w - size[0]) // 2
    y = y0 + (box_h - size[1]) // 2
    canvas = Image.new("RGBA", (CANVAS[name], CANVAS[name]), (0, 0, 0, 0))
    canvas.alpha_composite(subject, (x, y))
    out = OUTPUT / f"{name}.png"
    canvas.save(out)
    print(f"{name}: {subject.size} at ({x}, {y}) -> {out}")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for component in SOURCES:
        install(component)
