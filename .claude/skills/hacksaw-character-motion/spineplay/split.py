# -*- coding: utf-8 -*-
"""split.py — 從一張全身圖出發，產生「完美路線」要補的零件圖層指引。

一張全身圖裡，被別的零件擋住的地方是空的（只有前面那個零件的像素）。
動作一大，那些地方就會露出來 —— 這是一張圖路線到不了 100% 的唯一原因。

完美路線 = 每個會露出來的零件都有自己的**同畫布圖層**（跟全身圖一樣大、
零件擺在原位、其餘透明），被擋住的部分也畫完整。這支告訴你：

1. **要補哪些零件**，依必要性排序：
   * 換裝件：全身圖裡根本沒有（浣熊的其他表情、對話框、道具）
   * 會被露出來的後方零件：前面的零件一動，後面空的地方就露出來
   * 會晃動的前方零件：要有自己的圖層，才不會把背景一起帶著晃
2. **每個零件的範圍**：`<零件>__area.png`，白色＝這個零件的網格範圍，
   紅色＝在全身圖裡被擋住、要補畫的地方
3. **起始稿**：`<零件>__start.png`，全身圖在這個零件範圍內、沒被擋住的像素
4. **給生圖模型的指示**：README.md

補好的圖層放進一個資料夾（檔名 = 零件名.png），播放時：

    python motionlib.py -c <角色> -a <動作> --image 全身圖.png --parts 資料夾/ --gif out.gif

有給的零件用自己的圖層，沒給的沿用全身圖。
"""
from __future__ import print_function

import json
import os

import numpy as np
from PIL import Image

from meshproj import (align_bbox, bind_world, drawable, draw_rank, raster,
                      setup_visible, tris_of, visibility, who_uses)


def plan(mp, img, motion_min=2.0):
    """算出每個零件的範圍、被擋住的範圍、必要性。"""
    sk = mp.sk
    shown = visibility(sk, mp.p)
    s, ox, oy, ratio = align_bbox(mp.p['art_bbox'], img)
    W, H = img.size
    bw = bind_world(sk)
    vis = setup_visible(sk)
    rank = draw_rank(sk)
    by_att = {}
    for sn, att, a in drawable(sk):
        if bw.get((sn, att)) is None:
            continue
        by_att.setdefault(att, []).append((sn, a))

    def fp(items):
        return raster([(bw[(sn, a['_name'])], tris_of(a)) for sn, a in items],
                      s, ox, oy, W, H)

    visible_items = [(sn, a) for sn, att, a in drawable(sk)
                     if (sn, att) in vis and bw.get((sn, att)) is not None]
    # slot 名字可能自己就有斜線（浣熊的 pratbubbla/bubble），用已知的 key 反查
    key2att = {'%s/%s' % (sn, att): att for sn, att, _a in drawable(sk)}
    moving = mp.p.get('moving_fronts') or []
    moving_front = {e['attachment'] for e in moving if e['motion'] > motion_min}
    exposed_back = set()
    for e in moving:
        if e['motion'] <= motion_min:
            continue
        for key in e['over']:
            exposed_back.add(key2att.get(key, key.split('/', 1)[-1]))

    out = []
    for att, items in by_att.items():
        area = fp(items)
        if not area.any():
            continue
        top = max(rank[sn] for sn, _a in items)
        front = [(sn, a) for sn, a in visible_items if rank[sn] > top]
        hidden = area & fp(front) if front else np.zeros_like(area)
        in_full = any((sn, att) in vis for sn, _a in items)
        used = set()
        for sn, _a in items:
            used |= shown.get((sn, att), set())
        if not used:
            need, why = 4, '動畫裡不會出現（skin 裡有，但沒有任何一段動作讓它看得見）'
        elif not in_full:
            need, why = 1, ('換裝件：全身圖裡沒有這個零件，%s 會換上它'
                            % who_uses(used, len(sk.animations)))
        elif att in exposed_back and hidden.any():
            need, why = 2, '會被露出來：前面的零件一動，被擋住的地方（紅色）就會露出來'
        elif att in moving_front:
            need, why = 3, '會晃動：要有自己的圖層，才不會把後面的背景一起帶著晃'
        else:
            need, why = 4, '不需要：全身圖就夠了'
        out.append({'attachment': att, 'slots': [sn for sn, _a in items],
                    'need': need, 'why': why,
                    'area': area, 'hidden': hidden,
                    'hidden_px': int(hidden.sum()), 'area_px': int(area.sum())})
    out.sort(key=lambda e: (e['need'], -e['area_px']))
    return out, (s, ox, oy), ratio


def write(mp, img, out_dir, motion_min=2.0):
    os.makedirs(out_dir, exist_ok=True)
    items, mapping, ratio = plan(mp, img, motion_min)
    full = np.asarray(img.convert('RGBA'))
    for e in items:
        if e['need'] == 4:
            continue
        att = e['attachment']
        guide = np.zeros(full.shape, np.uint8)
        guide[e['area']] = (255, 255, 255, 255)
        guide[e['hidden']] = (235, 64, 64, 255)
        Image.fromarray(guide, 'RGBA').save(os.path.join(out_dir, att + '__area.png'))
        start = np.zeros_like(full)
        if e['need'] != 1:        # 換裝件不在全身圖裡，那塊範圍是別的零件，起始稿留空
            keep = e['area'] & ~e['hidden']
            start[keep] = full[keep]
        Image.fromarray(start, 'RGBA').save(os.path.join(out_dir, att + '__start.png'))
    summary = [{k: v for k, v in e.items() if k not in ('area', 'hidden')}
               for e in items]
    with open(os.path.join(out_dir, 'needed.json'), 'w', encoding='utf-8') as f:
        json.dump({'character': mp.name, 'mapping': mapping, 'parts': summary},
                  f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(readme(mp, summary, img.size))
    return summary


def readme(mp, summary, size):
    W, H = size
    groups = {1: [], 2: [], 3: [], 4: []}
    for e in summary:
        groups[e['need']].append(e)
    L = ['# %s —— 完美路線要補的零件圖層' % mp.name, '',
         '全身圖尺寸 %d×%d。每個零件圖層都要**跟全身圖一樣大**，零件擺在原本的位置，'
         '其餘全透明。檔名 = 零件名.png，全部放進同一個資料夾。' % (W, H), '']
    titles = {1: '一、一定要畫：換裝件（全身圖裡沒有）',
              2: '二、要完美就得畫：會被露出來的零件',
              3: '三、要完美就得畫：會晃動的零件',
              4: '四、不用畫'}
    for k in (1, 2, 3, 4):
        if not groups[k]:
            continue
        L.append('## %s' % titles[k])
        L.append('')
        for e in groups[k]:
            if k == 4:
                L.append('- `%s` —— %s' % (e['attachment'],
                                           '動畫裡不會出現' if e['why'].startswith('動畫裡不會出現')
                                           else '全身圖就夠'))
                continue
            L.append('- **`%s.png`** —— %s；範圍 %d px，要補畫 %d px'
                     % (e['attachment'], e['why'], e['area_px'], e['hidden_px']))
        L.append('')
    L += ['## 給生圖模型的指示（每個零件各做一次）', '',
          '附上三張圖：全身圖、`<零件>__area.png`、`<零件>__start.png`。', '',
          '```',
          '參考第一張全身圖，只畫出「<零件名稱>」這一個部位，輸出跟全身圖同尺寸的透明背景 PNG。',
          '零件只能畫在第二張圖的白色與紅色範圍內，其他地方全透明。',
          '白色範圍：沿用第三張起始稿的像素，保持完全一樣。',
          '紅色範圍：這裡原本被前面的東西擋住，請畫出這個部位被擋住的樣子，'
          '接續旁邊看得到的部分，不要畫前面擋住它的東西。',
          '```', '']
    if groups[1]:
        L += ['換裝件（第一組）起始稿是空的：照全身圖的畫風，把那個部位畫在白色範圍裡。', '']
    L += ['## 播放', '', '```bash',
          'python spineplay/motionlib.py -c %s -a <動作> --image 全身圖.png --parts 這個資料夾/ --gif out.gif'
          % mp.name, '```', '',
          '有給的零件用自己的圖層，沒給的沿用全身圖 —— 可以只補一部分先看效果。', '']
    return '\n'.join(L)
