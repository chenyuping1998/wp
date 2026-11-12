"""Read the same generated config the frontend renders; no copied caps or RTPs."""
import json
import re
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
WORKSPACE = APP.parents[2]
DEFAULT_BUNDLE = WORKSPACE / 'upload' / 'WildAlchemy' / 'math'

def frontend_config():
    source = (APP / 'src/game/config.ts').read_text(encoding='utf-8')
    match = re.search(r'export default\s*(\{.*\})\s*(?:as const)?\s*;', source, re.S)
    if not match:
        raise ValueError('Cannot parse generated WildAlchemy frontend config')
    return json.loads(match.group(1))
