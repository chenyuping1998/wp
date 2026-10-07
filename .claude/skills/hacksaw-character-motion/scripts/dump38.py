# -*- coding: utf-8 -*-
"""dump38.py — 印出 Spine 骨架的動畫內容（逐骨通道、幅度、關鍵幀）。

**3.8 與 4.x 都能讀 —— 它會看 skeleton.spine 自己判斷。**

    python dump38.py raccoon.json              全部動畫
    python dump38.py raccoon.json idle big_win 只印名字含這些字的

跟 4.x 的差別（踩過才知道）：
  * rotate 的欄位叫 **angle**，不是 value —— 用 4.x 的讀法會全部讀成 0
  * curve 是 "curve": cx1, "c2", "c3", "c4" 四個純量，不是陣列
  * 省略的欄位代表預設值：rotate/translate/shear = 0，scale = 1
"""
from __future__ import print_function
import json, sys

def rot_field(d):
    """3.8 的 rotate 叫 angle，4.x 叫 value。讀錯會全部變成 0，
    而且不會報錯 —— 只會安靜地告訴你這個角色完全沒有旋轉。"""
    ver = str(d.get('skeleton', {}).get('spine', '4'))
    return 'angle' if ver.startswith('3.') else 'value'


DEF = {'rotate': {'angle': 0.0},
       'translate': {'x': 0.0, 'y': 0.0},
       'scale': {'x': 1.0, 'y': 1.0},
       'shear': {'x': 0.0, 'y': 0.0}}


def rng(ks, chan):
    f = DEF[chan]
    out = {}
    for name, dv in f.items():
        vs = [k.get(name, dv) for k in ks]
        out[name] = (min(vs), max(vs))
    return out


def dump(path, filters=None):
    d = json.load(open(path, encoding='utf-8'))
    if 'skeleton' not in d or 'animations' not in d:
        raise SystemExit(
            path.split('/')[-1]
            + ' 不是 Spine 骨架檔（缺 skeleton / animations）。'
            + ' 這支只吃 Spine 匯出的 .json；'
            + 'rig/*.rig.json 是我們自己的格式，用 rig/ 的工具讀。')
    rf = rot_field(d)
    DEF['rotate'] = {rf: 0.0}
    print('# %s  spine %s  → rotate 欄位讀 %r'
          % (path.split('/')[-1], d.get('skeleton', {}).get('spine'), rf))
    par = {b['name']: b.get('parent') for b in d['bones']}
    for name in sorted(d.get('animations', {})):
        if filters and not any(f in name for f in filters):
            continue
        a = d['animations'][name]
        print('\n##### %s :: %s' % (path.split('/')[-1], name))
        rows = []
        for bn, ch in a.get('bones', {}).items():
            e = {'bone': bn, 'parent': par.get(bn), 'mag': 0.0}
            for c in ('rotate', 'translate', 'scale', 'shear'):
                if c in ch:
                    r = rng(ch[c], c)
                    e[c] = (len(ch[c]), r)
                    for lo, hi in r.values():
                        e['mag'] = max(e['mag'], hi - lo)
            rows.append(e)
        rows.sort(key=lambda e: -e['mag'])
        for e in rows:
            s = '  %-22s <%-20s' % (e['bone'], e['parent'])
            if 'rotate' in e:
                n, r = e['rotate']
                s += ' rot n=%2d [%7.2f,%7.2f]' % ((n,) + r[rf])
            if 'translate' in e:
                n, r = e['translate']
                s += ' tr n=%2d x[%7.1f,%7.1f] y[%7.1f,%7.1f]' % ((n,) + r['x'] + r['y'])
            if 'scale' in e:
                n, r = e['scale']
                s += ' sc n=%2d x[%.2f,%.2f] y[%.2f,%.2f]' % ((n,) + r['x'] + r['y'])
            if 'shear' in e:
                n, r = e['shear']; s += ' sh n=%2d x[%.1f,%.1f]' % ((n,) + r['x'])
            print(s)
        for slot, v in a.get('slots', {}).items():
            for c, ks in v.items():
                vals = ' '.join('%.2f=%s' % (k.get('time', 0),
                                             k.get('name', k.get('color', '')))
                                for k in ks)
                print('  [slot] %-26s %-10s %s' % (slot, c, vals[:120]))
        for extra in ('deform', 'drawOrder', 'events', 'ik', 'path'):
            if extra in a:
                v = a[extra]
                if extra == 'deform':
                    for skn, ss in v.items():
                        for sl, atts in ss.items():
                            for att, ks in atts.items():
                                mx = max((max(abs(x) for x in k['vertices'])
                                          for k in ks if k.get('vertices')), default=0)
                                print('  [deform] %-22s %-18s %2d keys  最大位移 %.1f'
                                      % (sl, att, len(ks), mx))
                elif extra == 'events':
                    print('  [events]', ', '.join('%.2f=%s' % (e.get('time', 0), e.get('name'))
                                                  for e in v))
                else:
                    print('  [%s] %s' % (extra, json.dumps(v)[:200]))


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    dump(sys.argv[1], sys.argv[2:] or None)
