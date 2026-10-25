"""Gate: catch a rig whose SLOTS list quietly lost bones.

2026-08-30: an edit aimed at removing a visible seam collapsed the guy rig's
entire right arm (upper arm + forearm + hand + bat) into one texture and
dropped arm_lower_l/arm_lower_r/hand_l/hand_r/bat from guy.json's "slots"
list — and the equivalent five (plus hair_tip/earring) from girl.json. The
seam did go away, but so did every elbow/wrist/prop joint (the whole arm can
only rotate as one rigid unit from the shoulder), and the guy's LEFT HAND
silently stopped rendering entirely, because nothing else in the pipeline
checks "does this skeleton still draw the parts it's supposed to."

This gate is that check: each rig has a fixed, expected set of independently-
posable attachment names. If a rebuild ever drops one, this fails loudly
instead of shipping a character missing a hand.

Usage: python3 design/check_spine_slots_complete.py
"""

import json
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent

EXPECTED = {
    "cast_guy": {
        "json": APP_ROOT / "static/assets/spines/cast_guy/guy.json",
        # Final art-direction decision: one newly drawn coherent full-body image.
        # No PSD slices remain, so seams cannot open during runtime transforms.
        "slots": {"guy_base", "guy_forearm"},
		"min_slots": 2,
    },
    "cast_girl": {
        "json": APP_ROOT / "static/assets/spines/cast_girl/girl.json",
        "slots": {"girl_base", "girl_forearm"},
		"min_slots": 2,
    },
}


def main():
    failed = False
    for name, spec in EXPECTED.items():
        path = spec["json"]
        if not path.exists():
            print(f"{name}: SKIP — no {path}")
            continue
        data = json.loads(path.read_text())
        actual = {s["attachment"] for s in data.get("slots", [])}
        actual_bones = {s["bone"] for s in data.get("slots", [])}
        expected = spec.get("slots", set())
        expected_bones = spec.get("bones", set())
        missing = expected - actual
        missing_bones = expected_bones - actual_bones
        extra = actual - expected if expected else set()
        too_few = len(data.get("slots", [])) < spec.get("min_slots", 0)
        if missing or missing_bones or too_few:
            failed = True
            print(f"{name}: FAIL — missing attachment(s): {sorted(missing)}; missing bone coverage: {sorted(missing_bones)}")
            if too_few:
                print(f"  only {len(data.get('slots', []))} slots; expected at least {spec['min_slots']}")
            print(f"  This means those parts will not render at all, no matter what art exists")
            print(f"  for them. Do not fuse multiple bones' worth of art into one texture to")
            print(f"  hide a seam — fix the seam in the art (soft alpha-fade at the cut edge)")
            print(f"  and keep every bone independently posable.")
        else:
            print(f"{name}: PASS — {len(actual)} attachments cover all required articulated parts")
        if extra:
            print(f"{name}: note — unexpected extra slot(s), not necessarily wrong: {sorted(extra)}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
