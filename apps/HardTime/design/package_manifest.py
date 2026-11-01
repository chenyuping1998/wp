#!/usr/bin/env python3
"""Create/check hashes for the staged frontend and store art, excluding math."""
import argparse
import hashlib
import json
from pathlib import Path
from game_settings import WORKSPACE

def entries(root):
    for folder in ('frontend', 'thumbnail', 'cover'):
        if not (root / folder).is_dir() or not any(p.is_file() for p in (root / folder).rglob('*')):
            raise SystemExit(f'FAIL: missing/empty staged {folder}')
    if not (root / 'frontend/index.html').is_file():
        raise SystemExit('FAIL: staged frontend index.html missing')
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for folder in ('frontend', 'thumbnail', 'cover')
            for p in sorted((root / folder).rglob('*')) if p.is_file()}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--root', type=Path, default=WORKSPACE / 'upload/HardTime')
    args = parser.parse_args()
    actual = entries(args.root)
    target = args.root / 'ART-PACKAGE-SHA256.json'
    if args.write:
        target.write_text(json.dumps(actual, indent=2) + '\n')
    expected = json.loads(target.read_text())
    changed = [p for p in expected.keys() | actual.keys() if expected.get(p) != actual.get(p)]
    if changed:
        raise SystemExit('FAIL: staged manifest differs: ' + ', '.join(changed[:10]))
    print(f'OK: {len(actual)} staged frontend/art hashes match')
