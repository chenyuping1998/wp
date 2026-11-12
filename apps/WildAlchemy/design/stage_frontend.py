#!/usr/bin/env python3
"""Refresh code exactly; preserve compressed staged art until its source changes."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from game_settings import APP, WORKSPACE

parser = argparse.ArgumentParser()
parser.add_argument('--build', type=Path, default=APP / 'build')
parser.add_argument('--root', type=Path, default=WORKSPACE / 'upload/WildAlchemy')
parser.add_argument('--refresh-assets', action='append', default=[], help='Explicit asset folder/file to refresh, including first migration')
args = parser.parse_args()
for item in args.refresh_assets:
    if Path(item).is_absolute() or '..' in Path(item).parts or not item.startswith('assets/'):
        parser.error('--refresh-assets must be a relative assets/ path')
source = args.build
root = args.root
stage = root / 'frontend'
record = root / 'SOURCE-ASSETS-SHA256.json'
previous = json.loads(record.read_text()) if record.exists() else {}
current = {}
if not (source / 'index.html').exists():
    raise SystemExit('Build WildAlchemy before staging')
stage.mkdir(parents=True, exist_ok=True)
shutil.copy2(source / 'index.html', stage / 'index.html')
# The build manifest and entry points must change together. Retain no old code.
shutil.copytree(source / '_app', stage / '_app', dirs_exist_ok=True)
immutable = stage / '_app/immutable'
expected = {p.relative_to(source / '_app/immutable') for p in (source / '_app/immutable').rglob('*') if p.is_file()}
for p in immutable.rglob('*'):
    if p.is_file() and p.relative_to(immutable) not in expected:
        p.unlink()
updated = 0
for p in source.rglob('*'):
    if not p.is_file():
        continue
    rel = p.relative_to(source)
    if rel.parts[0] == '_app' or str(rel) == 'index.html':
        continue
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    current[str(rel)] = digest
    target = stage / rel
    force = any(str(rel) == prefix.rstrip('/') or str(rel).startswith(prefix.rstrip('/') + '/') for prefix in args.refresh_assets)
    if force or not target.exists() or (str(rel) in previous and previous[str(rel)] != digest):
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
        updated += 1
# Staged files the build no longer has are leftovers of an earlier skin (2026-11-11: the first restage after
# the Hard Time interim art still shipped assets/castLayers and ten hardTime* sprite folders). Remove them.
removed = 0
for p in sorted(stage.rglob('*'), reverse=True):
    rel = p.relative_to(stage)
    if rel.parts[0] == '_app' or str(rel) == 'index.html':
        continue
    if p.is_file() and str(rel) not in current:
        p.unlink()
        removed += 1
    elif p.is_dir() and not any(p.iterdir()):
        p.rmdir()
record.write_text(json.dumps(current, indent=2) + '\n')
print(f'OK: refreshed frontend code, {updated} new/changed assets, {removed} stale files removed; existing compressed art retained')
