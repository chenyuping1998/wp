"""Sync src/game/config.ts from the math-sdk output.

    python sync_math_config.py [path/to/math-sdk]

The math SDK writes `config_fe_<game_id>.json`, but its `symbols` field is a
list of single-key objects while the frontend indexes symbols by name
(`types.ts`: `keyof typeof config.symbols`). This script flattens that and
stamps the studio/game identifiers.
"""

import json
import os
import sys
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
DEFAULT_SDK = os.path.abspath(os.path.join(APP, "..", "..", "..", "math-sdk"))

GAME_ID = "hot_miami"
PROVIDER_NAME = "igs"
FRONTEND_GAME_ID = "HotMiami"

# Presentation order for the paytable modal: specials first, then high to low.
SYMBOL_ORDER = ["W", "S", "C", "H1", "H2", "H3", "H4", "H5", "L1", "L2", "L3", "L4"]


def main():
    sdk = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SDK
    source = os.path.join(sdk, "games", GAME_ID, "library", "configs", f"config_fe_{GAME_ID}.json")
    if not os.path.exists(source):
        raise SystemExit(f"math config not found: {source}\nRun games/{GAME_ID}/run.py first.")

    config = json.load(open(source, encoding="UTF-8"))
    config["providerName"] = PROVIDER_NAME
    config["gameName"] = GAME_ID
    config["gameID"] = FRONTEND_GAME_ID

    flat = {}
    for entry in config["symbols"]:
        flat.update(entry)

    missing = set(flat) - set(SYMBOL_ORDER)
    if missing:
        raise SystemExit(f"SYMBOL_ORDER is missing symbols emitted by the math: {sorted(missing)}")
    config["symbols"] = OrderedDict((name, flat[name]) for name in SYMBOL_ORDER if name in flat)

    target = os.path.join(APP, "src", "game", "config.ts")
    with open(target, "w", encoding="UTF-8") as handle:
        handle.write(
            f"// Generated from math-sdk games/{GAME_ID}/library/configs/config_fe_{GAME_ID}.json\n"
            "// Regenerate with design/sync_math_config.py after re-running the math.\n"
            "export default " + json.dumps(config, indent="\t") + " as const;\n"
        )

    print(f"wrote {target}")
    print(f"  modes    {list(config['betModes'])}")
    print(f"  symbols  {list(config['symbols'])}")
    print(f"  grid     {config['numReels']}x{config['numRows'][0]}, {len(config['paylines'])} paylines")


if __name__ == "__main__":
    main()
