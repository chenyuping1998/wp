#!/usr/bin/env python3
"""Measure every animation in a Go Bananas monkey skeleton into a motion table.

    python extract_motion.py spines/bananditBandit/monkey.json [--md]

Writes motion_table.json next to this script (or prints Markdown with --md).
Numbers are read from the skeleton's own keyframes: per bone, the rotate range
(degrees, Spine y-up: + is counter-clockwise), translate range (px, skeleton
units), scale range, and the key times. These are OUR rig's numbers, so a game
may ship a table built from them.
"""
import json, sys, pathlib

def span(keys, field):
    vals = [k.get(field, 0) for k in keys]
    return (min(vals), max(vals)) if vals else (0, 0)

def measure(path):
    d = json.loads(pathlib.Path(path).read_text())
    out = {}
    for name, anim in d['animations'].items():
        bones, dur = {}, 0.0
        for bone, tl in anim.get('bones', {}).items():
            row = {}
            for kind, keys in tl.items():
                if not keys:
                    continue
                times = [round(k.get('time', 0), 3) for k in keys]
                dur = max(dur, max(times))
                if kind == 'rotate':
                    lo, hi = span(keys, 'value')
                    row['rotate'] = [round(lo, 1), round(hi, 1)]
                elif kind in ('translate', 'scale'):
                    xs, ys = span(keys, 'x'), span(keys, 'y')
                    nd = 3 if kind == 'scale' else 1
                    row[kind] = {'x': [round(xs[0], nd), round(xs[1], nd)], 'y': [round(ys[0], nd), round(ys[1], nd)]}
                else:
                    continue
                row.setdefault('keys', sorted(set(row.get('keys', []) + times)))
            if row:
                bones[bone] = row
        for slot, tl in anim.get('slots', {}).items():
            for kind, keys in tl.items():
                for k in keys:
                    dur = max(dur, k.get('time', 0))
        out[name] = {'seconds': round(dur, 3), 'bones': bones,
                     'slots': sorted(anim.get('slots', {}).keys())}
    return out

def to_md(table):
    lines = []
    for name, a in table.items():
        lines.append(f"### `{name}` — {a['seconds']}s")
        lines.append('')
        lines.append('| 骨頭 | 旋轉（度） | 位移 x / y（px） | 縮放 x / y | 關鍵幀（秒） |')
        lines.append('|---|---|---|---|---|')
        for b, r in a['bones'].items():
            rot = '–' if 'rotate' not in r else f"{r['rotate'][0]} ~ {r['rotate'][1]}"
            tr = r.get('translate'); sc = r.get('scale')
            trs = '–' if not tr else f"{tr['x'][0]}~{tr['x'][1]} / {tr['y'][0]}~{tr['y'][1]}"
            scs = '–' if not sc else f"{sc['x'][0]}~{sc['x'][1]} / {sc['y'][0]}~{sc['y'][1]}"
            keys = ', '.join(str(t) for t in r['keys'][:12]) + (' …' if len(r['keys']) > 12 else '')
            lines.append(f'| {b} | {rot} | {trs} | {scs} | {keys} |')
        if a['slots']:
            lines.append(f"\n換圖／顯示的插槽：{', '.join(a['slots'])}")
        lines.append('')
    return '\n'.join(lines)

if __name__ == '__main__':
    src = sys.argv[1]
    t = measure(src)
    if '--md' in sys.argv:
        print(to_md(t))
    else:
        dst = pathlib.Path(__file__).with_name('motion_table.json')
        dst.write_text(json.dumps(t, ensure_ascii=False, indent=1))
        print(f'{dst}: ' + ', '.join(f"{k} {v['seconds']}s" for k, v in t.items()))
