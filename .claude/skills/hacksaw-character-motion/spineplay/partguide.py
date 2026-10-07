# -*- coding: utf-8 -*-
"""partguide.py — 「每個零件一張圖」路線（浣熊）的生圖指引。

    python motionlib.py -c le_bandit_raccoon --guide --out 零件指引/
    python motionlib.py -c le_bandit_raccoon --prompt        # 同一份說明，只印不寫檔

每張要畫的零件給：

* `<零件>__shape.png` —— 輪廓範本（白＝零件、外面透明），尺寸就是建議像素。
  **形狀跟長寬比要照它**，角度、大小不用（接上骨架時會自動轉正、縮放）。
* README.md —— 每個零件是什麼、哪幾段動作看得到它、給生圖模型的提詞。
* `_bind_pose.png` —— 所有零件的色塊擺在 bind pose 上，看比例用。

只列動畫**真的看得到**的零件（逐格播過每一段動作、slot alpha > 0 才算）；
skin 裡有、但從來不出現的會另外列出來，不用畫。
"""
from __future__ import print_function

import json
import os

import numpy as np
from PIL import Image, ImageDraw

from meshproj import visibility, who_uses

# 浣熊的零件 —— 名字對不出是什麼的，才需要寫在這裡
PART_DESC = {
    'Body': '軀幹',
    'Tail': '尾巴',
    'Head_grr': '預設的頭（齜牙的臉）',
    '_0000s_0000_Angry_head': '生氣的頭',
    '_0000s_0001_Ohh_head': '驚訝的頭（嘴巴張開）',
    'happy_mouth': '開心的嘴',
    'hmm_mouth': '「嗯？」的嘴',
    'smirk': '得意的嘴（歪嘴笑）',
    'Eyes': '眼睛（眼白）',
    'Pupil': '瞳孔',
    'dollar': '錢幣眼（$）',
    'mustache': '八字鬍（會掉下來）',
    'hat': '貝雷帽',
    'leprechaun_hat_front': '妖精帽（前片）',
    'leprechaun_hat_back': '妖精帽（後片）',
    'Crowbar': '撬棍（前片）',
    'Crowbar_back': '撬棍（後片）',
    'L_arm': '左手臂',
    'R_arm': '右手臂',
    'L_hand': '左手',
    'L_hand_back': '左手（被擋住的那一側）',
    'R_hand': '右手',
    '_0000s_0002_Face_hand': '摸臉的手',
    '_0000s_0003_Forearm': '摸臉那隻手的前臂',
    '_0000s_0004_stretched_arm': '伸長的手臂',
    '_0000s_0005_Down_hand': '往下伸的手',
    'bonjour_hand': '打招呼的手',
    'Shoe_up': '鞋子（up 那一態）',
    'Shoe_down': '鞋子（down 那一態）',
    'bubble': '對話框（底圖，不含字）',
}
# 對話框裡的字：原作是法文；換成你自己的字也可以，長寬比要接近
WORDS = {
    'bonjour': 'Bonjour!', 'bien': 'Bien!', 'incroyable': 'Incroyable!',
    'lepain': 'Le pain!', 'mondieu': 'Mon Dieu!', 'merci': 'Merci!',
    'oui': 'Oui!', 'cava': 'Ça va!', 'conneries': 'Conneries!',
    'merde': 'Merde!', 'non': 'Non!', 'zutalors': 'Zut alors!', 'bleep': '（消音符號）',
}
KEYWORDS = [('head', '頭'), ('face', '臉'), ('mouth', '嘴'), ('eye', '眼睛'),
            ('ear', '耳朵'), ('hair', '頭髮'), ('arm', '手臂'), ('hand', '手'),
            ('finger', '手指'), ('leg', '腿'), ('shoe', '鞋子'), ('foot', '腳'),
            ('body', '軀幹'), ('tail', '尾巴'), ('hat', '帽子'), ('bubble', '對話框')]


WORD_SLOTS = ('good_attachments', 'bad_attachments', 'word_positive', 'word_negative',
              'pratbubbla/otroligt', 'pratbubbla/skitsnack')


def is_word(slot, att):
    """對話框裡的字（內容換成自己的字也可以）：浣熊三代各自命名不同。"""
    if att in WORDS:
        return True
    tail = att.split('/')[-1].lower()
    if tail == 'bubble':
        return False
    return slot.lower() in WORD_SLOTS


def describe(att):
    tail = att.split('/')[-1]
    if tail != att and (att.startswith('words/') or att.startswith('pratbubbla/'))             and tail.lower() != 'bubble':
        return '對話框裡的字「%s」' % tail.replace('-', ' ').replace('_', '')
    if tail.lower() == 'bubble':
        return '對話框（底圖，不含字）'
    if att in PART_DESC:
        return PART_DESC[att]
    if att in WORDS:
        return '對話框裡的字「%s」' % WORDS[att]
    low = att.lower()
    for k, v in KEYWORDS:
        if k in low:
            return v
    return att


SMOOTH = 0.25       # 磨圓半徑（格子邊長的倍數）—— 建包校準用的也是這個


def sil_mask(spec, w, h, smooth=True):
    """把 pack 的佔有格（64×64）放大成 w×h 的平滑遮罩（原作零件圖的座標系）。"""
    n = spec['sil_n']
    val = int(spec['sil'], 16)
    bits = [(val >> (n * n - 1 - k)) & 1 for k in range(n * n)]
    g = np.array(bits, float).reshape(n, n)
    w, h = max(2, int(w)), max(2, int(h))
    im = Image.fromarray((g * 255).astype('uint8'), 'L').resize((w, h), Image.BILINEAR)
    if smooth:                                    # 佔有格的鋸齒磨圓
        from PIL import ImageFilter
        im = im.filter(ImageFilter.GaussianBlur(max(w, h) / float(n) * SMOOTH))
    return np.asarray(im) > 127


def needed(mp, anims=None):
    """(要畫的零件, 不會出現的零件)。要畫的依建議尺寸由大到小，每張圖一筆。"""
    vis = visibility(mp.sk, mp.p, anims)
    groups = {}
    for _key, spec in mp.layer_specs():
        att = spec['attachment']
        g = groups.setdefault(att, {'attachment': att, 'spec': spec,
                                    'slots': [], 'used': set()})
        g['slots'].append(spec['slot'])
        g['used'] |= vis.get((spec['slot'], att), set())
    need = [g for g in groups.values() if g['used']]
    unused = [g['attachment'] for g in groups.values() if not g['used']]
    return need, unused


def tmpl_size(spec):
    """範本（與建議）的像素尺寸：原作零件圖的長寬比，長邊 = 骨架裡的大小。

    `px` 是這個位置在骨架座標裡的框；同一張圖掛在好幾個位置（Miami 的煙）
    或是加權網格時，框的長寬比跟圖本身不一樣 —— 範本要照圖本身的。
    """
    pw, ph = spec['px']
    sw, sh = spec.get('slice_size') or spec['px']
    k = max(pw, ph) / float(max(sw, sh))
    return max(2, int(round(sw * k))), max(2, int(round(sh * k)))


def _anchor_px(spec):
    """★ 零件：bone 起點與末端在範本上的像素座標（joints.json 用）。"""
    w, h = tmpl_size(spec)
    if spec.get('slice_frame') and spec.get('shape_anchor') and spec.get('slice_size'):
        f = spec['slice_frame']
        c, u, n = np.array(f[0:2]), np.array(f[2:4]), np.array(f[4:6])
        k = np.array([w, h], float) / np.array(spec['slice_size'], float)
        pts = [(c + a * f[6] * u + b * f[7] * n) * k for a, b in spec['shape_anchor']]
        return tuple(round(float(x), 1) for x in pts[0]), tuple(round(float(x), 1) for x in pts[1])
    (u0, v0), (u1, v1) = spec['anchor']
    return (round(u0 * w, 1), round((1 - v0) * h, 1)), (round(u1 * w, 1), round((1 - v1) * h, 1))


def silhouette_image(spec):
    """輪廓範本本體：白色填滿＋深色描邊，外面透明（alpha 就是輪廓）。

    尺寸見 tmpl_size（跟 --spec 的建議像素一樣）。
    建包時門檻就是拿這張（轉過、縮過、加留白）校準的 —— 照它畫一定會過。
    """
    w, h = tmpl_size(spec)
    m = sil_mask(spec, w, h)
    a = np.zeros((h, w, 4), np.uint8)
    a[m] = (236, 236, 242, 255)
    inner = m.copy()
    inner[2:-2, 2:-2] = (m[2:-2, 2:-2] & m[:-4, 2:-2] & m[4:, 2:-2]
                         & m[2:-2, :-4] & m[2:-2, 4:])
    a[m & ~inner] = (64, 64, 78, 255)
    return Image.fromarray(a, 'RGBA')


def needs_joints(spec):
    if spec.get('free_shape'):       # 對話框的字：只看外框，不用關節
        return False
    if 'orient' in spec:
        return spec['orient'] == 'declare'
    return spec.get('auto_fit') is False


def orient_word(spec):
    if spec.get('free_shape'):
        return '橫著寫'
    return {'free': '任意角度', 'upright': '照範本方向',
            'declare': '要給座標'}.get(spec.get('orient'), '任意角度')


def template(spec, marks=None):
    """給使用者的範本：輪廓；`marks` 為真就標出兩個關節（紅＝origin、藍＝tip）。

    預設只有「要給座標」的零件才標。
    """
    im = silhouette_image(spec)
    w, h = im.size
    if marks is None:
        marks = needs_joints(spec)
    if marks and (spec.get('anchor') or spec.get('shape_anchor')):
        o, t = _anchor_px(spec)
        dr = ImageDraw.Draw(im)
        dr.line([o, t], fill=(60, 140, 235, 255), width=3)
        r = max(4, min(w, h) // 30)
        dr.ellipse([o[0] - r, o[1] - r, o[0] + r, o[1] + r], fill=(235, 64, 64, 255))
        dr.ellipse([t[0] - r, t[1] - r, t[0] + r, t[1] + r], fill=(60, 140, 235, 255))
    return im


def readme(mp, need, unused, files=True):
    total = len(mp.animations)
    star = [g for g in need if needs_joints(g['spec'])]
    upright = [g for g in need if g['spec'].get('orient') == 'upright'
               and not g['spec'].get('free_shape')]
    words = [g for g in need if g['spec'].get('free_shape')]
    L = ['# %s —— 每個零件一張圖' % mp.name, '',
         '%d 段動作一共要用到 **%d 張零件圖**（各種臉、嘴型、對話框、道具會在動畫裡換上）。'
         % (total, len(need)),
         '每張只畫一個零件、透明背景 PNG，檔名 = 零件名.png，全部放進同一個資料夾。', '',
         '* **大小不用管** —— 接上骨架時會自動縮放。',
         '* **角度看清單的「方向」欄**：「任意角度」的轉幾度都行（接上去會自動轉正）；'
         '「照範本方向」的輪廓是對稱的，要跟範本同方向（轉 75° 以內）才分得出頭尾。',
         '* **形狀跟長寬比要對** —— 照 `<零件>__shape.png` 的輪廓畫'
         '（白色＝零件的形狀；它就是 `--checkart` 比對的對象）。'
         if files else
         '* **形狀跟長寬比要對** —— 跑 `--guide --out 資料夾/` 拿每個零件的輪廓範本，照它畫。',
         '* **不要左右翻** —— 畫反了 `--checkart` 會直接說「翻過來就對了」。',
         '* **被擋住的地方也要畫完整** —— 動作一大就會露出來。', '',
         '## 一、先定畫風', '',
         '先生一張你的角色的全身設定圖（比例參考 `_bind_pose.png`：每個色塊是一個零件的位置與大小），',
         '之後每一個零件都附上這張設定圖，畫風才會一致。', '',
         '## 二、每個零件的提詞（一張一張生）', '',
         '附兩張圖：角色設定圖、`<零件>__shape.png`。', '',
         '```',
         '參考第一張圖（角色設定圖）的畫風，只畫出「<零件說明>」這一個部位，輸出透明背景 PNG。',
         '這個部位的輪廓照第二張圖的白色範圍畫：形狀、長寬比都要一樣，方向也一樣，不要左右翻。',
         '其他部位都不要畫；被其他部位擋住的地方也要畫完整。',
         '平塗卡通上色、乾淨的輪廓線，不要有投影、不要有背景。',
         '```', '',
         '## 三、零件清單（由大到小）', '',
         '| 檔名 | 是什麼 | 範本尺寸 | 長寬比 | 方向 | 看得到它的動作 |',
         '|---|---|---|---|---|---|']
    for g in need:
        sp = g['spec']
        w, h = tmpl_size(sp)
        L.append('| `%s.png`%s | %s | %d×%d | %s | %s | %s%s |'
                 % (g['attachment'], ' ★' if needs_joints(sp) else '',
                    describe(g['attachment']), w, h,
                    ('%.2f' % sp['shape_ar']) if sp.get('shape_ar') else '-',
                    orient_word(sp), who_uses(g['used'], total),
                    '（%d 個位置共用這一張）' % len(g['slots']) if len(g['slots']) > 1 else ''))
    L.append('')
    if words:
        L += ['**對話框裡的字**（%d 張）：範本是一個比例正確的框（不是原作的字），'
              '在框裡寫你自己的字、大致填滿它。只檢查長寬比（±20%%），要橫著寫；'
              '長寬比差太多，接上去會被拉成原件的比例。' % len(words), '']
    if star:
        L += ['★ 輪廓在任何方向都分不出頭尾，要在 `joints.json` 給兩個點的像素座標',
              '（範本上紅點＝origin、藍點＝tip；你的圖跟範本同尺寸同方向的話直接抄下面的數字）：',
              '', '```json', '{']
        rows = []
        for g in star:
            o, t = _anchor_px(g['spec'])
            rows.append('  "%s": {"origin": [%.1f, %.1f], "tip": [%.1f, %.1f]}'
                        % (g['attachment'], o[0], o[1], t[0], t[1]))
        L += [',\n'.join(rows), '}', '```', '']
    if unused:
        L += ['## 四、不用畫', '',
              '這些 skin 裡有，但 %d 段動作都沒讓它們出現：%s' % (total, '、'.join(unused)), '']
    else:
        L += ['## 四、不用畫', '', '（沒有：skin 裡每一張都會在動畫裡出現）', '']
    L += ['## 五、要用自己的形狀（不照範本）', '',
          '照範本畫，角色的剪影會跟原作一樣。要換成自己設計的外形：每個零件照樣一張圖，',
          '但形狀可以不同（要大致落在原本那塊零件的範圍裡，超出去的會被切掉）。',
          '對位改成手動：看 `<零件>__joints.png` 上紅點（origin，這塊零件轉動的軸心）',
          '跟藍點（tip，骨頭指的方向）在零件的哪裡，在你的圖上找到對應的兩點，寫進 `joints.json`：',
          '', '```json',
          '{"L_arm": {"origin": [120, 48], "tip": [196, 130]}}',
          '```', '',
          '然後 `--layers 零件/ --joints joints.json` 播放。形狀不同時 `--checkart` 的形狀檢查'
          '一定會擋（它比的是原作的形狀），這條路不用它。', '']
    L += ['## 六、生完之後', '', '```bash',
          'python spineplay/motionlib.py -c %s --layers 零件/ --checkart' % mp.name,
          'python spineplay/motionlib.py -c %s -a idle --layers 零件/ --gif out.gif' % mp.name,
          '```', '',
          '`--checkart` 逐張量形狀簽章、長寬比、中軸剖面（門檻每一張各自校準），'
          '還會列出缺了哪張、哪幾段動作會用到它。', '']
    return '\n'.join(L)


def write(mp, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    need, unused = needed(mp)
    for g in need:
        template(g['spec']).save(os.path.join(out_dir, g['attachment'] + '__shape.png'))
        template(g['spec'], marks=True).save(
            os.path.join(out_dir, g['attachment'] + '__joints.png'))
    try:
        import gallery                    # 色塊＝各零件，擺在 bind pose
        rig = gallery.placeholder_rig(mp)
        rig.pose(mp.animations[0], -1e9)
        sd = mp.p['skeleton']
        rig.render(scale=600.0 / float(sd.get('height') or 1000.0),
                   bg=(23, 23, 29, 255), pad=8).save(os.path.join(out_dir, '_bind_pose.png'))
    except Exception as e:                # 示意圖失敗不影響範本
        print('⚠️  _bind_pose.png 沒有產生：%s' % e)
    with open(os.path.join(out_dir, 'needed.json'), 'w', encoding='utf-8') as f:
        json.dump({'character': mp.name,
                   'parts': [{'attachment': g['attachment'],
                              'what': describe(g['attachment']),
                              'size': list(tmpl_size(g['spec'])),
                              'aspect': g['spec'].get('shape_ar'),
                              'animations': sorted(g['used']),
                              'declare_joints': g['spec'].get('auto_fit') is False}
                             for g in need],
                   'unused': unused}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(readme(mp, need, unused))
    return need, unused
