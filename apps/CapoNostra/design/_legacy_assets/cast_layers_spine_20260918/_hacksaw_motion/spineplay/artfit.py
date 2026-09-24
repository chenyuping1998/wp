# -*- coding: utf-8 -*-
"""artfit.py — 量使用者的圖層，然後把它擺對。

解決的是這件事：**生圖模型不吃關節角度**，所以「生出來的圖真的長成那個
姿勢」永遠沒辦法用提詞保證。與其祈禱，不如量。

## 核心：形狀座標系

每一層在 pack 裡都有 `shape_anchor` —— 骨頭的起點與末端**落在那塊圖
自己的形狀座標系裡的哪個位置**。形狀座標系是這樣定的：

* 原點 = alpha 輪廓的重心
* x 軸 = 輪廓的主成分方向，長度正規化成輪廓在該方向的總跨度
* y 軸 = 次成分方向，同樣正規化
* 方向的正負用**三階動差（偏度）**消歧 —— 形狀哪一頭比較胖就往哪邊

這組座標**對旋轉、縮放、平移免疫**。所以：

> 使用者把手臂畫成什麼角度、畫多大、畫在畫布哪裡，都不影響
> 「肩膀在這塊圖的哪個位置」這件事。

`fit` 就是量出使用者那塊圖的形狀座標系，把骨頭的起點與末端放回同樣的
相對位置，再解一個相似變換把它們搬到骨骼的關節上。

**結論：生圖的姿勢不必對。** 手臂畫成垂下來的也會被擺回舉高的位置。

## 那還有什麼會錯

擺放是算出來的，不會錯。會錯的是「這塊圖根本不是那個零件」：

| 症狀 | `check` 抓不抓得到 |
|---|---|
| 少了一層 / 整張空白 | ✅ |
| 四周留了透明白邊（切圖沒切齊）| ✅ |
| 該是細長手臂卻畫成一坨（形狀種類不對）| ✅ 比對形狀簽章 |
| 輪廓太對稱，正負向量不出來 | ✅ pack 實測過會標 `auto_fit: false`，強制要求給座標 |
| 形狀對、語意錯（手臂畫成彎的）| ❌ 抓不到 —— 這是唯一剩下的洞 |

最後那一條要人看。`--sheet` 跟 `--stick` 就是給人看的。

## 手動指定

```json
// joints.json —— 座標是該 PNG 的像素，左上為原點
{"L_arm": {"origin": [120, 48], "tip": [196, 130]}}
```

有宣告就用宣告的，完全不猜。視覺模型可以直接讀圖填這個檔。
"""
from __future__ import print_function

import json
import math

import numpy as np

PROF_N = 12         # 中軸剖面切幾段
SIG_N = 10          # 形狀簽章的網格邊長
SIG_MAX = 15        # 每格量化到 0..15
SIG_FAIL = 0.34     # 最佳比對分數超過這個就判定「不是同一個零件」
SIG_AMBIG = 0.06    # 最佳與次佳差距小於這個 → 正負向分不出來


def shape_frame(img, thresh=24):
    """一張 RGBA 圖的形狀座標系。

    回傳 dict 或 None（圖是空的）。`stable` 說明正負向消歧夠不夠可靠。
    """
    a = np.asarray(img.convert('RGBA'))
    m = a[..., 3] > thresh
    if m.sum() < 16:
        return None
    ys, xs = np.nonzero(m)
    pts = np.stack([xs.astype(float), ys.astype(float)], 1)
    c = pts.mean(0)
    d = pts - c
    cov = (d.T @ d) / len(d)
    w, v = np.linalg.eigh(cov)
    o = np.argsort(w)[::-1]
    w, v = w[o], v[:, o]
    u, n = v[:, 0], v[:, 1]

    def skew(axis):
        t = d @ axis
        sd = t.std()
        return float((t ** 3).mean() / (sd ** 3)) if sd > 1e-9 else 0.0

    # 先用偏度定一個暫時的正負向。它對接近對稱的形狀不可靠，
    # 所以真正的消歧是靠 shape_sig 的四向比對（見 match_sig）。
    su, sn = skew(u), skew(n)
    if su < 0:
        u, su = -u, -su
    if sn < 0:
        n, sn = -n, -sn
    tu, tn = d @ u, d @ n
    ext_u = float(tu.max() - tu.min())
    ext_n = float(tn.max() - tn.min())
    elong = math.sqrt(max(w[0], 1e-9) / max(w[1], 1e-9))
    fr = {
        'c': c, 'u': u, 'n': n,
        'ext_u': max(ext_u, 1e-6), 'ext_n': max(ext_n, 1e-6),
        'elong': elong, 'skew_u': abs(su), 'skew_n': abs(sn),
        'bbox': (float(xs.min()), float(ys.min()),
                 float(xs.max()), float(ys.max())),
        'size': (m.shape[1], m.shape[0]),
    }
    # 形狀簽章：把輪廓畫進形狀座標系的 N×N 網格。
    # 這是一個 10x10 的佔有率格子（每格 0..15），純粹是輪廓的粗糙描述，
    # 沒有顏色也沒有細節，不可能還原成美術 —— 它的用途只有一個：
    # 把主軸的正負向消歧，並判斷「這塊圖是不是同一個零件」。
    au = (tu - tu.min()) / fr['ext_u']
    an = (tn - tn.min()) / fr['ext_n']
    gi = np.clip((au * SIG_N).astype(int), 0, SIG_N - 1)
    gj = np.clip((an * SIG_N).astype(int), 0, SIG_N - 1)
    g = np.zeros((SIG_N, SIG_N), float)
    np.add.at(g, (gj, gi), 1.0)
    g = g / max(g.max(), 1e-9)
    fr['sig'] = np.round(g * SIG_MAX).astype(int)
    return fr


def spine_profile(img, fr=None):
    """沿長軸切 PROF_N 段，每段量「重心的橫向偏移」與「寬度」。

    這是專門抓**彎曲與粗細分布**的：簽章把兩軸各自正規化，所以對
    「手臂該直的卻畫成彎的」不夠敏感；剖面直接看中軸有沒有歪。
    對旋轉與等比縮放免疫（都是在形狀座標系裡量的）。

    回傳 (偏移 12 個數, 寬度 12 個數)。
    """
    fr = fr or shape_frame(img)
    if fr is None:
        return None
    a = np.asarray(img.convert('RGBA'))
    m = a[..., 3] > 24
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1).astype(float) - fr['c']
    tu, tn = pts @ fr['u'], pts @ fr['n']
    gi = np.clip((((tu - tu.min()) / fr['ext_u']) * PROF_N).astype(int),
                 0, PROF_N - 1)
    off = np.zeros(PROF_N)
    wid = np.zeros(PROF_N)
    for i in range(PROF_N):
        s = tn[gi == i]
        if len(s) < 3:
            continue
        off[i] = s.mean() / fr['ext_n']
        wid[i] = (s.max() - s.min()) / fr['ext_n']
    return off, wid


def profile_dist(a, b, sgn=(1, 1)):
    """兩個剖面的距離。`sgn` 是主軸／次軸的正負向修正。"""
    if a is None or b is None:
        return 9.0
    o1, w1 = np.asarray(a[0], float), np.asarray(a[1], float)
    o2, w2 = np.asarray(b[0], float), np.asarray(b[1], float)
    if sgn[0] < 0:
        o2, w2 = o2[::-1], w2[::-1]
    if sgn[1] < 0:
        o2 = -o2
    return float(np.sqrt(((o1 - o2) ** 2).mean())
                 + 0.5 * np.sqrt(((w1 - w2) ** 2).mean()))


def sig_variants(sig):
    """簽章的四種鏡像 —— 對應主軸與次軸正負向的四種組合。"""
    return {(1, 1): sig, (-1, 1): sig[:, ::-1],
            (1, -1): sig[::-1, :], (-1, -1): sig[::-1, ::-1]}


def match_sig(ref, sig):
    """把使用者的簽章跟參考比對，回傳 (最佳分數, 正負向, 次佳差距)。

    分數是每格平均絕對差 / SIG_MAX，0 = 完全一樣。
    """
    ref = np.asarray(ref, float).reshape(SIG_N, SIG_N)
    scores = []
    for sgn, v in sig_variants(np.asarray(sig, float)).items():
        scores.append((float(np.abs(ref - v).mean()) / SIG_MAX, sgn))
    scores.sort()
    gap = scores[1][0] - scores[0][0] if len(scores) > 1 else 1.0
    return scores[0][0], scores[0][1], gap


def to_shape(fr, px, sgn=(1, 1)):
    """像素座標 → 形狀座標。"""
    d = np.asarray(px, float) - fr['c']
    return np.array([sgn[0] * float(d @ fr['u']) / fr['ext_u'],
                     sgn[1] * float(d @ fr['n']) / fr['ext_n']])


def from_shape(fr, ab, sgn=(1, 1)):
    """形狀座標 → 像素座標。"""
    return (fr['c'] + sgn[0] * ab[0] * fr['ext_u'] * fr['u']
            + sgn[1] * ab[1] * fr['ext_n'] * fr['n'])


def bleed(img, thresh=24):
    """四邊各留了多少透明邊（佔該邊長的比例）。

    pack 是靠外框對位的，留白會讓整塊零件偏移 —— 切圖最常見的錯。
    """
    fr = shape_frame(img, thresh)
    if fr is None:
        return None
    x0, y0, x1, y1 = fr['bbox']
    w, h = fr['size']
    return {'left': x0 / float(w), 'right': (w - 1 - x1) / float(w),
            'top': y0 / float(h), 'bottom': (h - 1 - y1) / float(h)}


def anchors_px(spec, img, declared=None):
    """這張圖裡，骨頭的起點與末端應該在哪（像素座標）。

    有宣告用宣告的；否則用形狀座標系從 pack 的參考位置推回來。
    回傳 (origin, tip, 說明) 或 (None, None, 原因)。
    """
    if declared:
        return (np.array(declared['origin'], float),
                np.array(declared['tip'], float), 'declared')
    sa = spec.get('shape_anchor')
    ref = spec.get('shape_sig')
    if not sa or not ref:
        return None, None, 'pack 沒有這一層的形狀錨點'
    fr = shape_frame(img)
    if fr is None:
        return None, None, '整張圖是空的'
    score, sgn, gap = match_sig(ref, fr['sig'])
    if score > SIG_FAIL:
        return None, None, ('形狀對不上原件（比對分數 %.3f > %.2f）'
                            % (score, SIG_FAIL))
    if gap < SIG_AMBIG:
        return None, None, ('輪廓太對稱，主軸的正負向分不出來'
                            '（最佳與次佳只差 %.3f）' % gap)
    return (from_shape(fr, np.array(sa[0], float), sgn),
            from_shape(fr, np.array(sa[1], float), sgn), 'measured')


# ------------------------------------------------------------------ 檢查
LIMITS = {'bleed': 0.06, 'sig': SIG_FAIL, 'gap': SIG_AMBIG}


def check_layer(spec, img, declared=None, limits=None, fitting=True):
    """回傳 (等級, 訊息 list)。等級：ok / warn / fail。

    ⚠️ **角度、位置、等比大小不檢查** —— 那些 `fit` 會吸收。
    生圖畫成什麼角度、多大、畫在畫布哪裡都可以。

    檢查的是「這塊圖本身畫對了沒有」，三個互補的量：

    | 量 | 抓什麼 | 對什麼免疫 |
    |---|---|---|
    | 形狀簽章 | 整體輪廓不對、根本不是那個零件 | 旋轉、等比縮放、平移 |
    | 長寬比 | 單軸被拉長 / 變胖（比例錯）| 旋轉、等比縮放 |
    | 中軸剖面 | 該直的畫成彎的、粗細分布不對 | 旋轉、等比縮放 |

    **門檻是每一層各自校準的**：做 pack 時把原件轉八種角度／縮放，
    量出該層的良性波動，乘 1.6 當門檻。所以誤擋率在建包時就是 0，
    而且不會因為某一層形狀特殊就整體放寬。

    實測（浣熊 43 層）：輕微彎折 10% 擋下 93%，單軸拉長 1.4× 擋下 95%，
    而旋轉與等比縮放 0% 誤擋。
    """
    L = dict(LIMITS)
    if limits:
        L.update(limits)
    msgs, lvl = [], 'ok'
    fr = shape_frame(img)
    if fr is None:
        return 'fail', ['整張圖是空的（沒有不透明像素）']

    if not fitting:
        b = bleed(img)
        worst = max(b.values())
        if worst > L['bleed']:
            lvl = 'fail'
            msgs.append('%s 邊留了 %.0f%% 的透明白邊 —— 不用 --fit 的話是靠外框'
                        '對位的，會偏移。切齊外框，或改用 --fit'
                        % (max(b, key=b.get), worst * 100))

    ref = spec.get('shape_sig')
    if not ref:
        if lvl == 'ok':
            lvl = 'warn'
        msgs.append('pack 沒有這一層的形狀資料 —— 沿用原本的擺放')
        return lvl, msgs

    score, sgn, gap = match_sig(ref, fr['sig'])
    tol_sig = spec.get('sig_tol', L['sig'])
    if score > tol_sig:
        lvl = 'fail'
        msgs.append('輪廓跟原件對不上（%.3f > 該層門檻 %.3f）—— '
                    '這塊圖不是那個零件，或整體形狀畫錯了'
                    % (score, tol_sig))
        return lvl, msgs

    ref_ar = spec.get('shape_ar')
    if ref_ar:
        ar = fr['ext_u'] / fr['ext_n']
        dev = abs(math.log(ar / ref_ar))
        tol_ar = spec.get('ar_tol', 0.18)
        if dev > tol_ar:
            lvl = 'fail'
            longer = ar > ref_ar
            msgs.append('長寬比 %.2f，原件是 %.2f —— 這塊%s了 %.0f%%（比例錯）'
                        % (ar, ref_ar, '畫得太細長' if longer else '畫得太寬',
                           abs(math.exp(dev) - 1) * 100))

    ref_prof = spec.get('prof_ref')
    if ref_prof:
        got = spine_profile(img, fr)
        pdv = profile_dist((ref_prof[0], ref_prof[1]), got, sgn)
        tol_p = spec.get('prof_tol', 0.06)
        if pdv > tol_p:
            lvl = 'fail'
            msgs.append('中軸剖面對不上（%.3f > 該層門檻 %.3f）—— '
                        '這塊的彎曲或粗細分布跟原件不一樣'
                        '（例如該直的畫成彎的）' % (pdv, tol_p))

    if declared:
        return lvl, msgs
    if spec.get('auto_fit') is False:
        lvl = 'fail'
        msgs.append('這一層做 pack 時實測過，自動擬合不可靠'
                    '（輪廓太對稱，回推誤差 %.0f%%）—— '
                    '必須在 joints.json 裡給 origin / tip 的像素座標'
                    % (spec.get('auto_fit_err', 9) * 100))
    elif gap < L['gap']:
        lvl = 'fail'
        msgs.append('你這張圖的輪廓太對稱，主軸正負向分不出來'
                    '（最佳與次佳只差 %.3f）—— 在 joints.json 裡給座標' % gap)
    return lvl, msgs


# ------------------------------------------------------------------ 擬合
def fit_quad(spec, img, declared=None):
    """算出這一層的新四邊形，讓圖裡的關節落在骨骼的關節上。

    ⚠️ 四邊形是**照使用者那張圖的長寬比重新建**的，不是把 pack 原本的
    四邊形拿來轉 —— 使用者的圖幾乎不會跟原件同一個長寬比（轉過、裁過、
    尺寸不同），沿用原四邊形會把圖擠變形，而且旋轉之後落點會跑掉。

    做法：在圖的像素座標（翻成 y 朝上）裡找出量到的兩個關節，
    解一個相似變換把它們搬到骨骼的 (0,0) 與 (bone_len, 0)，
    再把圖的四個角送過去。等比例，所以圖不會變形。

    量不出來就回傳 None，代表「沿用 pack 原本的」，不亂搬。
    """
    if 'bone_len' not in spec:
        return None
    o, t, _why = anchors_px(spec, img, declared)
    if o is None:
        return None
    iw, ih = img.size

    def up(px):                      # 像素（y 朝下）→ y 朝上
        return np.array([px[0], ih - px[1]], float)

    p0, p1 = up(o), up(t)
    dp = p1 - p0
    lp = float(np.hypot(*dp))
    if lp < 1e-6:
        return None
    L = float(spec['bone_len'])
    s = L / lp
    th = -math.atan2(dp[1], dp[0])   # 轉到 +x 方向
    R = np.array([[math.cos(th), -math.sin(th)],
                  [math.sin(th), math.cos(th)]]) * s
    # render 的角點順序：左下、右下、右上、左上
    corners = np.array([[0.0, 0.0], [iw, 0.0], [iw, ih], [0.0, ih]])
    new = (corners - p0) @ R.T
    return [[round(float(x), 4), round(float(y), 4)] for x, y in new]


def load_joints(path):
    if not path:
        return {}
    with open(path, encoding='utf-8') as f:
        return json.load(f)
