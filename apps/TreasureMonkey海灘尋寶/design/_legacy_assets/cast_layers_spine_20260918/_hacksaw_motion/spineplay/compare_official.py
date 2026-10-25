# -*- coding: utf-8 -*-
"""compare_official.py — 拿官方 spine-ts 3.8 當標準答案，逐像素比對 spine.py。

    python compare_official.py <skeleton.json> <anim> [--times 0 0.25 0.5]

做法：起一個本機 http server（WebGL 載素材會被 file:// 的 CORS 擋），
用 Playwright 開 official.html，把相機設成跟 spine.py 一樣的正交投影，
所以兩邊的畫面可以直接相減，不需要事後對位。

輸出：每個時間點的覆蓋 IoU、重疊區的 RGB 平均絕對誤差、以及並排比較圖。
"""
from __future__ import print_function

import argparse
import asyncio
import functools
import http.server
import os
import socketserver
import sys
import threading

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from spine import Skeleton


class _CORS(http.server.SimpleHTTPRequestHandler):
    """素材與頁面放在不同 port，WebGL 的 XHR 會被 CORS 擋，所以放行。"""

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def log_message(self, *a):
        pass


def serve(directory, port=0):
    handler = functools.partial(_CORS, directory=directory)

    class Quiet(socketserver.TCPServer):
        allow_reuse_address = True

        def handle_error(self, *a):
            pass

    httpd = Quiet(('127.0.0.1', port), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, httpd.server_address[1]


async def official_frames(skel_url_dir, skel_name, anim, times, scale, pad, port,
                          page='official.html'):
    from playwright.async_api import async_playwright
    page_name = page
    out = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader',
                  '--disable-gpu-sandbox'])
        page = await browser.new_page()
        msgs = []
        page.on('console', lambda m: msgs.append(m.text))
        page.on('pageerror', lambda e: msgs.append('PAGEERROR ' + str(e)))
        for t in times:
            await page.goto('http://127.0.0.1:%d/%s' % (port, page_name),
                            wait_until='load')
            await page.evaluate(
                'p => window.runRender(p)',
                {'skeleton': skel_url_dir + '/' + skel_name, 'anim': anim,
                 'time': t, 'scale': scale, 'pad': pad})
            await page.wait_for_function('window.RENDER_DONE === true',
                                         timeout=60000)
            err = await page.evaluate('window.RENDER_ERROR')
            if err:
                print('瀏覽器端錯誤：', err[:500])
                for m in msgs[-8:]:
                    print('   console:', m[:200])
                await browser.close()
                return None
            info = await page.evaluate('window.RENDER_INFO')
            b64 = await page.evaluate('window.RENDER_PIXELS')
            import base64
            raw = base64.b64decode(b64)
            arr = np.frombuffer(raw, np.uint8).reshape(info['H'], info['W'], 4)
            arr = arr[::-1].astype(np.float64)   # GL 原點在左下
            # GL 用 SRC_ALPHA/ONE_MINUS_SRC_ALPHA 混到透明黑底上，
            # 所以 framebuffer 裡的 RGB 是【預乘】的；還原成 straight
            # 才能跟 spine.py 的輸出比。
            al = arr[..., 3:4] / 255.0
            arr[..., :3] = np.where(al > 1e-3, arr[..., :3] / np.maximum(al, 1e-3),
                                    arr[..., :3])
            arr = np.clip(arr, 0, 255).astype(np.uint8)
            out.append((Image.fromarray(arr, 'RGBA'), info.get('nonzeroAlphaPixels')))
        await browser.close()
    return out


def _metrics(A, B):
    ca, cb = A[..., 3] > 8, B[..., 3] > 8
    iou = (ca & cb).sum() / max(1, (ca | cb).sum())
    both = ca & cb
    rgb = np.abs(A[..., :3] - B[..., :3])[both].mean() if both.any() else float('nan')
    al = np.abs(A[..., 3] - B[..., 3]).mean()
    return iou, rgb, al


def compare(a, b, search=6):
    """a=官方 b=我們。

    兩邊的相機取景慣例差幾個像素（GL 的 NDC→viewport 與我們的
    正交映射對不齊），那是固定的框位差，不是動畫算錯 —— 所以先找出
    最佳整數平移再比。回傳原始與對齊後兩組數字，以及找到的位移。
    """
    A = np.asarray(a).astype(float)
    B = np.asarray(b).astype(float)
    h = min(A.shape[0], B.shape[0])
    w = min(A.shape[1], B.shape[1])
    A, B = A[:h, :w], B[:h, :w]
    raw = _metrics(A, B)
    best = None
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            Bs = np.roll(np.roll(B, dy, 0), dx, 1)
            m = _metrics(A, Bs)
            if best is None or m[0] > best[0][0]:
                best = (m, dx, dy)
    return raw, best[0], (best[1], best[2])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('anim')
    ap.add_argument('--times', nargs='*', type=float, default=None)
    ap.add_argument('--scale', type=float, default=0.32)
    ap.add_argument('--pad', type=int, default=8)
    ap.add_argument('-o', '--out', default='official_cmp')
    a = ap.parse_args()

    skel_path = os.path.abspath(a.skeleton)
    skel_dir = os.path.dirname(skel_path)
    skel_name = os.path.basename(skel_path)

    sk = Skeleton(skel_path, quiet=True)
    dur = sk.duration(a.anim)
    times = a.times if a.times else [0.0, dur * 0.25, dur * 0.5, dur * 0.75]

    # 兩個站台：一個放 official.html + runtime，一個放素材
    httpd1, port = serve(HERE)
    # 素材用相對路徑掛進同一個 server 不好做，改成把 skeleton 目錄也開一個
    httpd2, port2 = serve(skel_dir)
    url_dir = 'http://127.0.0.1:%d' % port2

    page_name = 'official.html' if sk.v38 else 'official40.html'
    print('官方 runtime：spine-webgl %s（EsotericSoftware 官方 build）'
          % ('3.8' if sk.v38 else '4.0'))
    print('比對 %s，%d 個時間點，scale=%.2f' % (a.anim, len(times), a.scale))

    off = asyncio.run(official_frames(url_dir, skel_name, a.anim, times,
                                      a.scale, a.pad, port, page_name))
    if off is None:
        return 1

    print()
    print('%7s | %-22s | %-22s | %s'
          % ('時間', '原始（未對齊）', '對齊後', '位移'))
    print('%7s | %7s %7s %6s | %7s %7s %6s |'
          % ('', 'IoU', 'RGB', 'alpha', 'IoU', 'RGB', 'alpha'))
    panels = []
    rows = []
    for t, (oim, nz) in zip(times, off):
        mine = sk.pose(a.anim, t).render(scale=a.scale, pad=a.pad)
        if not nz:
            print('%7.3f | 官方這一幀是空的（%d 個不透明像素），跳過' % (t, nz or 0))
            continue
        raw, al2, sh = compare(oim, mine)
        print('%7.3f | %7.4f %7.2f %6.2f | %7.4f %7.2f %6.2f | dx=%d dy=%d'
              % (t, raw[0], raw[1], raw[2], al2[0], al2[1], al2[2], sh[0], sh[1]))
        rows.append((al2, sh))
        panels.append((oim, mine))
    if rows:
        shifts = set(r[1] for r in rows)
        print()
        print('對齊後平均：IoU %.4f  RGB %.2f/255  alpha %.2f/255'
              % (np.mean([r[0][0] for r in rows]),
                 np.mean([r[0][1] for r in rows]),
                 np.mean([r[0][2] for r in rows])))
        print('找到的位移：%s %s'
              % (sorted(shifts),
                 '（每幀相同 → 是固定的取景差，不是動畫差）' if len(shifts) == 1
                 else '（每幀不同 → 不只是取景問題，要查）'))

    # 並排圖：上排官方、下排我們、第三排差異
    w, h = panels[0][0].size
    n = len(panels)
    sheet = Image.new('RGB', (w * n, h * 3), (20, 20, 28))
    for i, (o, m) in enumerate(panels):
        sheet.paste(o.convert('RGB'), (i * w, 0))
        sheet.paste(m.convert('RGB').resize(o.size), (i * w, h))
        A = np.asarray(o).astype(int)
        B = np.asarray(m.resize(o.size)).astype(int)
        d = np.abs(A[..., :3] - B[..., :3]).sum(2)
        d = np.clip(d, 0, 255).astype('uint8')
        sheet.paste(Image.fromarray(np.stack([d] * 3, 2), 'RGB'), (i * w, h * 2))
    sheet.save(a.out + '.png')
    print()
    print('寫出 %s.png（上=官方 中=spine.py 下=差異）' % a.out)
    httpd1.shutdown(); httpd2.shutdown()
    return 0


if __name__ == '__main__':
    sys.exit(main())
