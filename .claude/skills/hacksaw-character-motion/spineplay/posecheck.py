# -*- coding: utf-8 -*-
"""posecheck.py — 在【切層之前】就擋掉綁不了的生成圖。

之前的 `--checkart` 是在切完層之後才跑的，所以一張「雙手貼在身體兩側、
雙腿併攏」的立正圖可以一路走到切層才發現切不開 —— 那時候已經白做了。

這支在**還是一整張圖**的時候就判斷：這個姿勢有沒有辦法切成骨架要的零件。

## 量什麼

### 1. 橫向分段數（主要依據）

把圖依高度切成 N 條橫帶，每條數「輪廓被切成幾段」。

```
手臂張開的姿勢：        手臂貼身的姿勢：
  ▓   ▓▓▓   ▓   → 3 段      ▓▓▓▓▓▓▓  → 1 段
  ▓   ▓▓▓   ▓   → 3 段      ▓▓▓▓▓▓▓  → 1 段
```

**手臂跟軀幹之間有沒有背景縫隙，這個數字直接說了算。**
沒有縫隙就切不出手臂層 —— 不是「比較難切」，是幾何上不可能。

參考值是建包時量 bind pose 剪影得到的 24 個整數（每條橫帶幾段），
不是圖 —— 但它確實描述了原角色的姿勢輪廓，所以跟 pack 的其他部分一樣
只作研究用途。

### 2. 輪廓重疊度

把使用者的圖跟目標 bind pose 的輪廓對齊之後比 IoU，抓「整體姿勢就不對」。

## 用法

```bash
python motionlib.py -c le_bandit_raccoon --checkpose my_character.png
```
"""
from __future__ import print_function

import numpy as np


def mask_of(img, thresh=24):
    a = np.asarray(img.convert('RGBA'))
    m = a[..., 3] > thresh
    if not m.any():
        return None
    ys, xs = np.nonzero(m)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def band_runs(mask, bands=24, min_run=0.012, min_gap=0.012):
    """每條橫帶的「分段數」與「填滿比例」。

    `min_run` / `min_gap` 是相對於圖寬的門檻 —— 太細的毛邊與縫隙不算，
    否則抗鋸齒跟頭髮絲會讓數字亂跳。
    """
    h, w = mask.shape
    mr = max(1, int(w * min_run))
    mg = max(1, int(w * min_gap))
    runs, fill = [], []
    for b in range(bands):
        y0 = int(h * b / bands)
        y1 = max(y0 + 1, int(h * (b + 1) / bands))
        row = mask[y0:y1].any(0)
        fill.append(float(row.mean()))
        # 先把太窄的縫隙補起來，再數段
        idx = np.nonzero(row)[0]
        if len(idx) == 0:
            runs.append(0)
            continue
        segs = []
        s = idx[0]
        prev = idx[0]
        for i in idx[1:]:
            if i - prev > mg:
                segs.append((s, prev))
                s = i
            prev = i
        segs.append((s, prev))
        runs.append(sum(1 for a, b_ in segs if b_ - a + 1 >= mr))
    return np.array(runs), np.array(fill)


def compare(mp, img, bands=24):
    """回傳 (等級, 訊息 list, 診斷 dict)。"""
    um = mask_of(img)
    if um is None:
        return 'fail', ['整張圖是空的，或沒有透明背景 —— '
                        '要去背的 PNG，不是白底 JPG'], {}
    pp = mp.p.get('pose_profile')
    if not pp:
        return 'warn', ['這個 pack 沒有 bind pose 剪影，跳過姿勢檢查'], {}
    bands = pp['bands']
    ur, uf = band_runs(um, bands)
    qr = np.array(pp['runs'])
    qar = pp['aspect']
    msgs, lvl = [], 'ok'

    # 目標姿勢在哪些高度是「分開的」（手臂離開身體 / 兩腿分開）
    want_split = qr >= 2
    got_split = ur >= 2
    need = int(want_split.sum())
    hit = int((want_split & got_split).sum())
    if need:
        ratio = hit / float(need)
        if ratio < 0.5:
            lvl = 'fail'
            zones = []
            for i in range(bands):
                if want_split[i] and not got_split[i]:
                    zones.append(100.0 * (bands - i - 0.5) / bands)
            lo, hi = min(zones), max(zones)
            msgs.append(
                '目標姿勢有 %d 條橫帶是「輪廓分成兩段以上」（四肢離開軀幹），'
                '你的圖只有 %d 條對上。' % (need, hit))
            msgs.append(
                '從腳底算起 %.0f%%～%.0f%% 的高度整段連在一起 —— '
                '手臂／腿貼著身體，**切不出零件**。' % (lo, hi))
            msgs.append(
                '這不是「比較難切」，是幾何上不可能：'
                '沒有背景縫隙就沒有邊界。重生圖，把四肢張開。')
        elif ratio < 0.8:
            lvl = 'warn'
            msgs.append('目標有 %d 條橫帶是分開的，你的圖只對上 %d 條 —— '
                        '有些部位可能切不乾淨。' % (need, hit))

    # 最寬處的寬高比：立正姿勢會明顯比目標窄
    uar = um.shape[1] / float(um.shape[0])
    if uar < qar * 0.62:
        if lvl == 'ok':
            lvl = 'warn'
        msgs.append('你的圖寬高比 %.2f，目標是 %.2f —— 整體太瘦長，'
                    '通常就是四肢收在身體旁邊。' % (uar, qar))
    return lvl, msgs, {'need': need, 'hit': hit,
                       'user_runs': ur.tolist(), 'want_runs': qr.tolist(),
                       'user_ar': uar, 'want_ar': qar}


def ascii_profile(runs_user, runs_want, bands=24):
    """把兩邊的分段數畫成一欄，由上而下。"""
    out = ['   高度   目標  你的圖']
    for i in range(bands):
        pct = 100.0 * (bands - i - 0.5) / bands
        w, u = runs_want[i], runs_user[i]
        mark = '  ' if (w < 2 or u >= 2) else ' ❌'
        out.append('   %3.0f%%   %s   %s%s'
                   % (pct, '▓' * max(w, 0) or '·', '▓' * max(u, 0) or '·',
                      mark))
    return '\n'.join(out)
