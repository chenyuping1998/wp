"""Install independently generated cast_girl gun-pose components.

Only mechanical production operations happen here: chroma key removal,
proportional fitting and placement into the established Spine canvases.
"""

from pathlib import Path

import numpy as np
from PIL import Image


APP_ROOT = Path(__file__).resolve().parent.parent
GENERATED = Path("/Users/stone/.codex/generated_images/01a04df9-9c61-7831-bdcd-3d4b5eca55d9")
OUTPUT = APP_ROOT / "design/source/spine/images_girl"

SOURCES = {
    "legs": "exec-6f9ced0f-0fed-4bfb-ae9b-9702066b35cd.png",
    "torso": "exec-88f1c4bc-67fa-4f80-8545-af082a6b1751.png",
    # Complete shoulder-to-hand modules replace the earlier three-piece arms.
    # The generated segmented assets had outlined circular cut caps that stayed
    # visible in every possible setup pose.
    "arm_upper_l": "exec-a32dbbf6-2858-42f4-96f8-b5441ae52d76.png",
    "arm_lower_l": "exec-37f3eeeb-62f9-44d7-873d-23e57886f3ae.png",
    "hand_l": "exec-1fd75787-febb-4563-9789-9fa3adae095c.png",
    "arm_upper_r": "exec-83b91ed2-50e2-4ed7-bac7-2464a429364d.png",
    "arm_lower_r": "exec-25f72370-095f-4314-ae71-b138caaafd66.png",
    "hand_r": "exec-194f5ac0-4179-4ce3-a941-9a9b535e3a14.png",
    "gun": "exec-8394fb14-ad2a-4351-9dd1-c2bc4ccbd5f9.png",
    "head": "exec-bfb04e0e-9410-4780-891d-937a91dec252.png",
    "hair": "exec-73936821-3e5c-47bf-ba79-7748ceae4df2.png",
    "hair_tip": "exec-93093438-5258-47d4-a082-baca20eecbef.png",
    "earring": "exec-c0450647-3cad-4283-ad7a-64d448e416dc.png",
}

CANVAS = {
    "legs": 512, "torso": 512, "gun": 320,
    "arm_upper_l": 256, "arm_lower_l": 256,
    "arm_upper_r": 256, "arm_lower_r": 256,
    "head": 256, "hair": 256, "earring": 256,
    "hand_l": 128, "hand_r": 128, "hair_tip": 128,
}

# Exact component areas from the new gun-pose guides.  The torso/legs guides
# include neighbouring rig geometry, so their usable full-body areas are
# bounded explicitly rather than treating the whole guide as the component.
TARGET = {
    "legs": (127, 18, 386, 512),
    "torso": (168, 156, 343, 361),
    "arm_upper_l": (49, 49, 206, 206),
    "arm_lower_l": (113, 113, 184, 254),
    "hand_l": (24, 0, 80, 80),
    "arm_upper_r": (49, 49, 206, 206),
    "arm_lower_r": (113, 113, 255, 166),
    "hand_r": (0, 35, 76, 78),
    "gun": (72, 65, 247, 255),
    "head": (78, 64, 178, 193),
    "hair": (52, 52, 204, 204),
    "hair_tip": (19, 37, 92, 128),
    "earring": (99, 99, 158, 158),
}

DIRECT = {
    "legs": (159, 12, 194, 488),
    "torso": (188, 171, 135, 187),
    "arm_upper_l": (91, 54, 74, 148),
    "arm_upper_r": (65, 70, 126, 117),
    "gun": (112, 110, 96, 101),
    "head": (94, 68, 68, 121),
    "hair": (68, 56, 121, 143),
}


def extract_subject(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).copy()
    rgb = arr[:, :, :3].astype(np.int32)
    alpha = arr[:, :, 3]
    distance = np.sqrt(rgb[:, :, 0] ** 2 + (rgb[:, :, 1] - 255) ** 2 + rgb[:, :, 2] ** 2)
    keep = (alpha > 16) & (distance > 105)
    keyed_alpha = np.clip((distance - 80) * 3.4, 0, 255).astype(np.uint8)
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
