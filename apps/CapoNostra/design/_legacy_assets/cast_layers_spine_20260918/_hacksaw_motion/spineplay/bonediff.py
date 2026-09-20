# -*- coding: utf-8 -*-
"""bonediff.py — 比對 spine.py 與官方 runtime 算出來的【骨骼世界矩陣】。

    python bonediff.py <skeleton.json> <anim> [--times ...]

比像素精準得多：像素會被取樣、混合、抗鋸齒糊掉，骨骼矩陣是純數字。
官方回報每根骨的 (a, b, c, d, worldX, worldY)。
"""
from __future__ import print_function
import argparse, asyncio, os, sys, functools, http.server, socketserver, threading
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spine import Skeleton
from compare_official import serve


async def grab(url_dir, name, anim, times, port, page='official.html'):
    from playwright.async_api import async_playwright
    out = []
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True,
            args=['--use-gl=angle', '--use-angle=swiftshader',
                  '--enable-unsafe-swiftshader'])
        pg = await b.new_page()
        for t in times:
            await pg.goto('http://127.0.0.1:%d/%s' % (port, page), wait_until='load')
            await pg.evaluate('p => window.runRender(p)',
                              {'skeleton': url_dir + '/' + name, 'anim': anim,
                               'time': t, 'scale': 0.32, 'pad': 8})
            await pg.wait_for_function('window.RENDER_DONE === true', timeout=60000)
            err = await pg.evaluate('window.RENDER_ERROR')
            if err:
                print('瀏覽器錯誤:', err[:300]); await b.close(); return None
            out.append(await pg.evaluate('window.RENDER_BONES'))
        await b.close()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton'); ap.add_argument('anim')
    ap.add_argument('--times', nargs='*', type=float)
    ap.add_argument('--top', type=int, default=6)
    ap.add_argument('--page', default=None,
                    help='用哪一份 official html（預設看骨架版本自動選 3.8 / 4.0）')
    ap.add_argument('--relative-to', default=None,
                    help='扣掉這根骨的世界位移再比 —— 用來把「沒實作的約束對根骨的'
                         '影響」跟「其餘計算是否正確」分開')
    a = ap.parse_args()
    path = os.path.abspath(a.skeleton)
    sk = Skeleton(path, quiet=True)
    dur = sk.duration(a.anim)
    times = a.times or [dur*f for f in (0.1, 0.25, 0.4, 0.55, 0.7, 0.85)]
    h1, p1 = serve(HERE); h2, p2 = serve(os.path.dirname(path))
    page = a.page or ('official.html' if sk.v38 else 'official40.html')
    print('官方 runtime：%s' % page)
    off = asyncio.run(grab('http://127.0.0.1:%d' % p2, os.path.basename(path),
                           a.anim, times, p1, page))
    if off is None: return 1
    print('比對 %s 的骨骼世界座標，%d 個時間點，%d 根骨'
          % (a.anim, len(times), len(sk.bones)))
    print('%8s %12s %12s %s' % ('時間', '位置最大差', '矩陣最大差', '差最多的骨'))
    worst_all = 0.0
    for t, ob in zip(times, off):
        sk.pose(a.anim, t)
        rx = ry = 0.0
        if a.relative_to:
            rm = sk.W[a.relative_to]; ro = ob[a.relative_to]
            rx = rm[0, 2] - ro[4]
            ry = rm[1, 2] - ro[5]
        dp, dm, who = 0.0, 0.0, ''
        for bn, M in sk.W.items():
            o = ob.get(bn)
            if not o: continue
            # 官方: a,b,c,d,worldX,worldY  我方: [[a,b,x],[c,d,y]]
            pdiff = max(abs((M[0,2]-rx)-o[4]), abs((M[1,2]-ry)-o[5]))
            mdiff = max(abs(M[0,0]-o[0]), abs(M[0,1]-o[1]),
                        abs(M[1,0]-o[2]), abs(M[1,1]-o[3]))
            if pdiff > dp: dp, who = pdiff, bn
            dm = max(dm, mdiff)
        worst_all = max(worst_all, dp)
        print('%8.3f %12.4f %12.6f  %s' % (t, dp, dm, who))
    print()
    print('整體最大位置差 %.4f 單位（骨架高 %.0f，相當於 %.4f%%）'
          % (worst_all, sk.d['skeleton']['height'],
             100*worst_all/sk.d['skeleton']['height']))
    h1.shutdown(); h2.shutdown()
    return 0


if __name__ == '__main__':
    sys.exit(main())
