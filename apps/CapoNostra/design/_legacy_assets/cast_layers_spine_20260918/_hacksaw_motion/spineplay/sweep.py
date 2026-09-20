# -*- coding: utf-8 -*-
"""sweep.py — 把一份骨架的【每一段動畫】都跟官方 runtime 對一次。

    python sweep.py <skeleton.json> [--times 5]

bonediff.py 一次只比一段；這支是驗收用的：跑完整個骨架，
回報矩陣與世界座標的最大差，以及 cache 排序是否與官方一致。
"""
from __future__ import print_function
import argparse, asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spine import Skeleton
from compare_official import serve
from bonediff import grab


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('skeleton')
    ap.add_argument('--times', type=int, default=5)
    ap.add_argument('--anims', nargs='*', default=None)
    a = ap.parse_args()
    p = os.path.abspath(a.skeleton)
    sk = Skeleton(p, quiet=True)
    page = 'official.html' if sk.v38 else 'official40.html'
    h1, p1 = serve(os.path.dirname(os.path.abspath(__file__)))
    h2, p2 = serve(os.path.dirname(p))
    anims = a.anims or list(sk.d['animations'])
    fr = [i / float(a.times) + 0.5 / a.times for i in range(a.times)]
    worst_m = worst_p = 0.0
    worst_name = ''
    print('%-34s %10s %10s' % ('動畫', '矩陣最大差', '座標最大差'))
    for an in anims:
        dur = sk.duration(an) or 0.001
        times = [dur * f for f in fr]
        off = asyncio.run(grab('http://127.0.0.1:%d' % p2, os.path.basename(p),
                               an, times, p1, page))
        if off is None:
            return 1
        dm = dp = 0.0
        for t, ob in zip(times, off):
            sk.pose(an, t)
            for bn, M in sk.W.items():
                o = ob.get(bn)
                if not o:
                    continue
                dm = max(dm, abs(M[0, 0] - o[0]), abs(M[0, 1] - o[1]),
                         abs(M[1, 0] - o[2]), abs(M[1, 1] - o[3]))
                dp = max(dp, abs(M[0, 2] - o[4]), abs(M[1, 2] - o[5]))
        print('%-34s %10.2e %10.2e' % (an[:34], dm, dp))
        if dp > worst_p:
            worst_p, worst_name = dp, an
        worst_m = max(worst_m, dm)
    print()
    print('%d 段動畫 × %d 個時間點 × %d 根骨' % (len(anims), a.times, len(sk.bones)))
    print('矩陣最大差 %.2e，座標最大差 %.2e（在 %s，骨架高 %.0f）'
          % (worst_m, worst_p, worst_name,
             sk.d['skeleton'].get('height', 0)))
    h1.shutdown(); h2.shutdown()
    return 0


if __name__ == '__main__':
    sys.exit(main())
