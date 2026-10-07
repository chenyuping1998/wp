"""Pick a pose archetype -> write the art brief for a layered cast figure.

    python archetype/brief.py --list
    python archetype/brief.py -c 2 --game "Turf War" --out design/cast_brief/ \
        --feet-y 1674 --top-y 176 [--canvas 1024x2048] [--center-x 537] \
        [--variants base,feature,kingpin] [--mirror] \
        [--style ART_BRIEF.md] [--style-kind comic] [--style-frame frame.png ...]

Writes into --out:
    README.md             the brief (Traditional Chinese), ready to hand to an artist
    pose_guide.png        joints and bone lines ONLY, scaled to your canvas
    layers.template.json  layer order + joint pivots the artist corrects and returns
    style_frame/          copies of the --style-frame images, when given

What the brief carries over from the archetype is STRUCTURE: which arm is
raised, which hangs, what is held, what dangles, the back-to-front order,
where the joints sit. No outline, silhouette or part shape leaves the pack --
the pose guide is a stick figure on purpose (rig/PROVENANCE.md: a pose a
person could describe from watching the game is craft; a traced outline is
not). The figure's look comes from the game's own art brief.

That look has to reach this brief, or the figure comes back in the image
model's default glossy render beside symbols drawn in the game's chosen
style. --style takes the game's art brief: if it has a "## 0" section (the
style lock in game-reskin's art-brief template) only that section is
embedded, otherwise the whole file. --style-kind adds the rules a style needs
BECAUSE the figure is cut into layers and bent by a mesh (where outlines
stop, which layers may carry hatching, paper never in a layer).
--style-frame copies the approved style-frame images next to the brief so
every prompt can attach them. Without --style the README says so at the top,
so a style-less brief cannot pass for a finished one.
"""
import argparse, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

HIPS_AT = 0.48   # pelvis height as a fraction of a standing figure, from the top

HAND_ZH = {'hanging': '自然垂下、手肘微彎，手是空的', 'raised_prop': '舉到肩膀握住道具',
           'crossed': '交叉在胸前', 'other': '—'}

# Keyed like the catalogue in game-reskin's references/art-direction.md. Each
# entry is the style's name plus the rules it needs because the figure is
# LAYERED and BENT BY A MESH -- not a restatement of the style, which comes
# from the game's own section 0.
LINE_EDGE = ('外框只畫在這一層**看得見的輪廓**上；伸進別層底下的部分（肩端那 40px、頸部那 30px）**不畫線**，'
             '否則手臂一轉，肩膀上就多出一條線。')
ONE_PEN = '全身同一支筆：手臂、手指、道具的外框粗細跟軀幹一致。'
NO_PAPER = '紙張底色、紙紋**不進任何圖層**：圖層外一律全透明，紙由背景提供。生圖常把整張紙一起畫出來，交件前要去掉。'
LIMB_TEXTURE = ('排線、刻痕、網點這類線狀質感只放在 `body`、`head`（幾乎不動）；`arm_*`、`fingers_*`、`prop_*` '
                '用實心或很粗的質感 —— 網格彎曲時細線會被拉成波浪，一看就破。質感方向不要跨過切口。')
STYLE_KINDS = {
    'comic': ('美式漫畫（粗描線＋平塗＋網點）', [
        LINE_EDGE, ONE_PEN,
        '陰影用硬邊黑塊，不用漸層。**網點不要畫進圖**，由程式統一套；手臂維持平塗（網點在關節會被拉變形）。']),
    'noir': ('黑白高反差＋單一點綴色', [
        '只有黑、白（加上 §0 允許的那一階灰）。點綴色只出現在 §0 指定的東西上，其餘部位一律不用。',
        '大黑塊跨過切口時，被蓋住的那一層也要把黑塊延續畫完，手臂移開時黑塊不能斷。',
        '去背底色**不可用白或灰**（會吃掉角色本身的白色區塊），用色盤沒有的飽和色。']),
    'woodcut': ('木刻／麻膠版畫', [LIMB_TEXTURE, NO_PAPER]),
    'engraving': ('銅版雕刻／鈔票線刻', [
        LIMB_TEXTURE, NO_PAPER,
        '排線要沿著形體走、方向一致；亂方向的排線是最明顯的 AI 痕跡，退件重生。']),
    'screenprint': ('絹印／Risograph 復古海報', [
        NO_PAPER,
        '每層只用 §0 的油墨色。**套色偏移與紙紋由程式統一套**（每層同一個位移、同一張紋理），生圖時不要畫。']),
    'flat': ('扁平向量／中世紀現代', ['最適合網格變形。陰影每個顏色最多一階硬邊色塊。', ONE_PEN]),
    'cel': ('日式賽璐璐動畫', [
        LINE_EDGE, ONE_PEN, '兩階硬邊陰影（底色＋一階影）；臉照 §0 的具體描述，不要模型預設的漂亮臉。']),
    'inkwash': ('水墨＋朱印', [
        NO_PAPER,
        '暈染在切口處淡出，不要在肩端、頸部留下一道乾筆邊（手一轉就變成一條縫）。朱紅只用在 §0 指定的東西上。',
        '圖裡不能有任何書法字 —— 生成的字都是亂碼。']),
    'constructivist': ('構成主義／宣傳海報', [
        '平塗剪紙色塊，只用 §0 的三色；斜向構圖由姿勢本身承擔，圖層不要自帶斜切背景。', ONE_PEN]),
    'nouveau': ('新藝術／塔羅', [LINE_EDGE, ONE_PEN, '裝飾花紋放在外框與底板，不放在會動的手臂上。']),
    'gouache': ('不透明水彩／厚塗', [
        '筆觸沿形體走；關節附近（肩、肘、腕）用較平的筆觸，筆觸會被網格拉長。',
        '霧面，不要亮面高光 —— 這個畫風最容易滑回模型預設的光亮數位繪畫，照風格基準圖的數字驗。']),
    'cartoon': ('美式電視卡通吉祥物', [
        LINE_EDGE, ONE_PEN,
        '平塗＋一階硬邊影；表情靠眉毛、嘴的形狀，不靠細節描繪。「卡通」兩個字不夠 —— §0 沒寫描線粗細和單階陰影時，'
        '生圖會滑回亮面 3D 休閒卡通。',
        '要換手、甩道具、鬍子飛出去這類演出的吉祥物，Le Bandit 用的是零件路線（references/le-bandit-art-spec.md），'
        '不是網格；需求單發出前先決定走哪條。']),
    'rubberhose': ('1930 年代橡皮管卡通', [
        LINE_EDGE, ONE_PEN,
        '手腳是沒有手肘膝蓋的橡皮管：**整條粗細一致、兩端圓頭**。這是唯一「網格彎曲就是畫風本身」的畫風 —— '
        '但彎的時候管徑要維持，內側被擠細就又變回「沒骨頭」的破綻。',
        '只有黑、白（加 §0 允許的灰階）；點綴色只給 §0 指定的東西。身體的實心黑塊跨過切口時，被蓋住的那層也要畫完。',
        '底片顆粒、刮痕、暗角由程式統一套，不畫進圖層。去背底色**不可用白或灰**，用色盤沒有的飽和色。']),
    'manga': ('日漫黑白網點＋單一點綴色', [
        LINE_EDGE, LIMB_TEXTURE, NO_PAPER,
        '**網點不要畫進圖**：要上網點的區域留白（或實心灰），網點由程式用同一個網距、角度統一套；生成的網點大小不一，一看就是 AI。',
        '點綴色只出現在 §0 指定的東西上。去背底色不可用白或灰。']),
    'street': ('街頭貼紙塗鴉', [
        LINE_EDGE, ONE_PEN,
        '貼紙白邊跟描線一樣只畫在這一層**看得見的外輪廓**；切口處不畫白邊，否則每個關節都是一條白縫。',
        '噴漆滴流、潑濺只放在符號和背景，不放在會動的手臂上。任何塗鴉字都由字型處理，圖裡不畫。']),
    'caricature': ('怪誕諷刺肖像', [
        LINE_EDGE, LIMB_TEXTURE,
        '臉照 §0 寫死：年齡、胖瘦、皮膚狀況、牙齒、一個缺陷、指定表情。**看起來好看的臉一律退件** —— 模型預設會把臉美化。',
        '毛孔、皺紋、汗只畫在 `head`、`body`；手臂是平塗膚色加一階影。符號的色卡底板不進角色圖層。']),
    'grime': ('褪色髒污寫實＋單一警示色', [
        LIMB_TEXTURE, NO_PAPER,
        '髒污、刮痕、顆粒**不要畫進圖層**，由程式在背景板統一疊一張；畫進手臂的污漬會跟著網格被拉長。',
        '警示色只出現在 §0 指定的東西上，角色其餘部位維持褐、灰、骨白。']),
    'collage': ('現成物拼貼', [
        LINE_EDGE,
        '影印感的顆粒可以留在 `head`、`body`；手臂用平塗灰階。',
        '噴漆、麥克筆塗鴉、膠帶另外畫成一層或由程式疊，不要生圖時一起畫（生出來的塗鴉一看就假），也不要跨過切口。']),
    'render': ('半寫實 3D 渲染', [
        '這是模型預設、AI 感最重的畫風。全身高光方向一致、只有一個光源；不要全身都是金屬亮面。',
        '跟符號放一起比：質感、光向、飽和度要跟 §0 的風格基準圖同一套。']),
}
COMMON_STYLE_RULES = [
    '**每一張生圖提示詞前面都貼本款 §0 的畫風段落**，並附上風格基準圖；只寫「角色是誰、穿什麼」的提示詞，'
    '會得到模型預設的亮面寫實樣子。',
    '**邊緣要有反鋸齒**：在 2 倍畫布（{w2} × {h2}）上畫或量化色盤，再用 Lanczos 縮回交件尺寸。'
    '沒有反鋸齒的純色塊，網格一轉就出現鋸齒（驗收會擋：輪廓半透明 < 50%）。',
    '圖裡不能有任何文字（布章、刺青、招牌）：要字的地方留空白底板，字由程式或字型處理。',
    '光源方向、視角跟符號與背景一致（照 §0）。',
]


def style_section(path):
    """The game's style lock: the '## 0' section of its art brief if it has
    one, else the whole file. Its top heading level becomes #### so it nests
    under this README's '## 畫風' > '### 本款畫風鎖定'."""
    lines = open(path, encoding='utf-8').read().splitlines()
    start = next((i for i, l in enumerate(lines) if re.match(r'##\s*0\b', l)), None)
    if start is not None:
        end = next((i for i in range(start + 1, len(lines)) if re.match(r'##\s', lines[i])), len(lines))
        lines = lines[start:end]
    while lines and lines[-1].strip() in ('', '---'):
        lines.pop()
    levels = [len(l) - len(l.lstrip('#')) for l in lines if re.match(r'#+\s', l)]
    shift = '#' * (4 - min(levels)) if levels and min(levels) < 4 else ''
    return '\n'.join((shift + l) if re.match(r'#+\s', l) else l for l in lines), start is not None


def anat(screen_side, mirror):
    """Screen side -> the figure's OWN side (front-facing figure: screen-left is
    its right hand). Layer files are named by the figure's own side."""
    own = 'r' if screen_side == 'screen_left' else 'l'
    return ({'l': 'r', 'r': 'l'}[own]) if mirror else own


def side_zh(own):
    return '角色自己的%s手（畫面%s）' % ('左' if own == 'l' else '右', '右' if own == 'l' else '左')


def layer_of(token, mirror):
    kind, _, side = token.partition(':')
    if kind in ('arm', 'fingers'):
        return '%s_%s' % (kind, anat(side, mirror))
    return token


def build(arch, a):
    W, H = map(int, a.canvas.lower().split('x'))
    gap = round(48 * W / 1024)
    mp = common.load(arch)
    idle = next((x for x in mp.animations if x.endswith('idle')), mp.animations[0])
    J, _ = common.joints(mp, arch, idle, 0.0)
    # The references are HALF-BODY figures (cut at the thigh); a game cast
    # figure stands full length. So scale by head-top -> pelvis, and put the
    # pelvis where a standing adult's is: ~48% of the height down from the top.
    top = J.get('head_top', (0, J['_top_y']))[1]
    hips = J.get('hips', J.get('waist'))
    hips_y = a.top_y + HIPS_AT * (a.feet_y - a.top_y)
    s = (hips_y - a.top_y) / max(top - hips[1], 1e-6)
    hx = hips[0]
    cx = a.center_x if a.center_x is not None else W / 2
    sign = -1 if a.mirror else 1

    def to_canvas(p):
        return [round(cx + sign * (p[0] - hx) * s), round(hips_y - (p[1] - hips[1]) * s)]

    # game joint names, by the figure's own side
    joints = {}
    for role, nm in [('neck', 'neck'), ('chest', 'chest'), ('waist', 'waist'), ('hips', 'hips'), ('head_top', 'head_top')]:
        if role in J:
            joints[nm] = to_canvas(J[role])
    for pack_side, screen in (('l', 'screen_left'), ('r', 'screen_right')):
        own = anat(screen, a.mirror)
        for role, nm in (('arm_', 'shoulder_'), ('fore_', 'elbow_'), ('wrist_', 'wrist_')):
            if role + pack_side in J:
                joints[nm + own] = to_canvas(J[role + pack_side])
    extras = {e['layer']: to_canvas(J[e['layer']]) for e in arch.get('props', []) + arch.get('dangles', []) if e['layer'] in J}

    order = [layer_of(t, a.mirror) for t in arch['order']]
    return dict(W=W, H=H, gap=gap, joints=joints, extras=extras, order=order, scale=s)


def guide_png(arch, b, a, path):
    from PIL import Image, ImageDraw, ImageFont
    W, H = b['W'], b['H']
    k = 0.5
    im = Image.new('RGB', (int(W * k), int(H * k)), (34, 34, 40))
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 15)
    except Exception:
        font = ImageFont.load_default()
    P = lambda p: (p[0] * k, p[1] * k)
    d.rectangle([0, 0, W * k - 1, H * k - 1], outline=(90, 90, 100))
    for y, lab in ((a.feet_y, '腳底 y=%d' % a.feet_y), (a.top_y, '頭頂 y=%d' % a.top_y)):
        d.line([(0, y * k), (W * k, y * k)], fill=(200, 80, 80), width=1)
        d.text((6, y * k - 18), lab, fill=(230, 120, 120), font=font)
    J = b['joints']
    col = {'l': (90, 220, 120), 'r': (240, 140, 90)}
    for a_, b_ in [('hips', 'waist'), ('waist', 'chest'), ('chest', 'neck'), ('neck', 'head_top')]:
        if a_ in J and b_ in J:
            d.line([P(J[a_]), P(J[b_])], fill=(120, 160, 240), width=4)
    for side in 'lr':
        chain = ['chest', 'shoulder_' + side, 'elbow_' + side, 'wrist_' + side]
        pts = [J[c] for c in chain if c in J]
        for p, q in zip(pts, pts[1:]):
            d.line([P(p), P(q)], fill=col[side], width=4)
    # legs: the references stop at the thigh, so the guide draws a plain
    # standing stance (feet about shoulder width) down to the feet line
    if 'hips' in J and 'shoulder_l' in J and 'shoulder_r' in J:
        hw = abs(J['shoulder_l'][0] - J['shoulder_r'][0]) * 0.32
        for sx in (-1, 1):
            foot = (J['hips'][0] + sx * hw, a.feet_y)
            d.line([P(J['hips']), P(foot)], fill=(120, 160, 240), width=3)
        d.text((P(J['hips'])[0] + 8, (P(J['hips'])[1] + a.feet_y * k) / 2), '腿：參考只畫到大腿，自然站姿即可', fill=(160, 170, 200), font=font)
    names = {'neck': '頸（頭切線）', 'shoulder_l': '左肩', 'shoulder_r': '右肩', 'elbow_l': '左肘', 'elbow_r': '右肘',
             'wrist_l': '左腕', 'wrist_r': '右腕', 'hips': '骨盆', 'chest': '胸', 'waist': '腰', 'head_top': '頭頂'}
    for n, p in J.items():
        d.ellipse([P(p)[0] - 4, P(p)[1] - 4, P(p)[0] + 4, P(p)[1] + 4], fill=(255, 255, 255))
        d.text((P(p)[0] + 6, P(p)[1] - 8), names.get(n, n), fill=(235, 235, 235), font=font)
    zh = dict(arch.get('props_zh', {}), **arch.get('dangles_zh', {}))
    for n, p in b['extras'].items():
        d.ellipse([P(p)[0] - 6, P(p)[1] - 6, P(p)[0] + 6, P(p)[1] + 6], outline=(250, 210, 80), width=2)
        d.text((P(p)[0] + 8, P(p)[1] + 2), n, fill=(250, 210, 80), font=font)
    y = H * k - 20 * (len(b['extras']) + 1)
    for n in b['extras']:
        d.text((6, y), '%s：%s' % (n, zh.get(n, '')), fill=(250, 210, 80), font=font)
        y += 20
    d.text((6, 6), '#%d %s — 只有關節與骨架線，外形照自己的設計' % (arch['number'], arch['name_zh']), fill=(240, 240, 240), font=font)
    d.text((6, 26), '綠＝角色自己的左手（畫面右）  橘＝右手（畫面左）', fill=(200, 200, 200), font=font)
    im.save(path)


def style_block(b, a):
    L = ['## 畫風（生圖前先讀）', '']
    if a.style_kind:
        L += ['畫風：**%s**（`%s`）' % (STYLE_KINDS[a.style_kind][0], a.style_kind), '']
    if b['frames']:
        L += ['風格基準圖（每次生圖都附上，成品跟它比）：' + '、'.join('`%s`' % f for f in b['frames']), '']
    if a.style:
        body, from_section = style_section(a.style)
        L += ['### 本款畫風鎖定（出自 `%s`%s，原文照貼）' % (b['style_src'], ' §0' if from_section else ''), '', body, '']
    else:
        L += ['> ⚠ **這份需求單還沒帶入畫風，不能直接交出去。** 用 `--style <本款美術需求>` 重新產生（會取它的 §0），',
              '> 否則角色會用生圖模型預設的亮面寫實樣子回來，跟符號不是同一套。', '']
    rules = [r.format(w2=b['W'] * 2, h2=b['H'] * 2) for r in COMMON_STYLE_RULES]
    if a.style_kind:
        rules += STYLE_KINDS[a.style_kind][1]
    L += ['### 分層時的畫風規則', '']
    L += ['%d. %s' % (i, r) for i, r in enumerate(rules, 1)]
    return L + ['']


def readme(arch, b, a):
    L = []
    own_arms = {}
    for screen in ('screen_left', 'screen_right'):
        own_arms[anat(screen, a.mirror)] = arch['arms'][screen]
    grip = [s for s, v in own_arms.items() if v == 'raised_prop']
    L += ['# %s 角色分層需求單（姿勢：#%d %s）' % (a.game, arch['number'], arch['name_zh']), '',
          '由 `hacksaw-character-motion/archetype/brief.py` 產生。角色造型、服裝、打光、配色照 **%s 自己的美術需求**；' % a.game,
          '這份只規定**姿勢、怎麼拆圖層、交件格式**。姿勢參考只取結構（哪隻手舉起、拿什麼、什麼會晃），',
          '**不可描、不可取樣任何參考遊戲的圖**。', '',
          '附件：`pose_guide.png`（關節與骨架線，已換算到你的畫布）、`layers.template.json`（圖層順序＋支點，交件時照實際修正）。', '']
    L += style_block(b, a)
    L += ['---', '', '## 0. 姿勢', '', arch['pose_zh'], '']
    for own in ('r', 'l'):
        L.append('- %s：%s' % (side_zh(own), HAND_ZH[own_arms[own]]))
    if arch.get('note_zh'):
        L += ['', '> ' + arch['note_zh']]
    if not arch.get('has_reaction', True):
        L += ['', '> ⚠ 這個姿勢的參考**只有待機動作**。']
    L += ['', '## 1. 交件格式', '',
          '- **PSD 一份**＋**每個圖層各一張 PNG**，全部都是 **%d × %d** 完整畫布、零件在原位、其他透明，疊起來就是完整的人。' % (b['W'], b['H']),
          '- 另附 `full.png`（全部圖層合併，同尺寸）與 `layers.json`（照 `layers.template.json` 填實際支點）。',
          '- **腳底 y = %d、頭頂 y ≈ %d**，水平置中於 x ≈ %d。上下至少留 40px 空白；**左右兩側（手、道具最外緣）到畫布邊至少 150px** —— 動作閘門要求擺動中仍留 40px，手離邊只有 60px 的話手臂幾乎不能往外張（Capo 的 Don 2026-09-28 因此只能做「手肘外張、前臂收回」）。' % (a.feet_y, a.top_y, a.center_x if a.center_x is not None else b['W'] // 2),
          '- `l`／`r` 一律指**角色自己的左／右**：正面角色的 `arm_l` 在畫面**右邊**。', '',
          '## 2. 圖層（由後到前）', '', '| # | 檔名 | 內容 | 要點 |', '|---|---|---|---|']
    notes = {
        'body': ('軀幹＋骨盆＋雙腿＋鞋，一整張', '腰、膝不切。被手臂擋住的軀幹要**完整畫出來**，就像手臂不存在一樣。前胸、背側邊緣畫滿。'),
        'head': ('頭、臉、頭髮／帽子、脖子', '只在領口切一刀。脖子往下多畫 **30px** 伸進衣領底下。臉、髮際不要再分層。'),
    }
    for i, n in enumerate(b['order'], 1):
        if n in notes:
            c, t = notes[n]
        elif n.startswith('arm_'):
            own = n[-1]
            kind = own_arms.get(own, 'hanging')
            c = '%s，從肩膀到指尖一整張' % side_zh(own)
            t = '手肘不切。肩端往軀幹裡多畫 **40px**、邊緣柔和。' + (
                ' 手掌畫在這張（在道具後面），手指另一層。' if kind == 'raised_prop' else
                ' 前臂和手離身體至少 **%dpx**。' % b['gap'] if kind == 'hanging' else
                ' 交叉在胸前，另一隻手臂的前後照這張表的順序。')
        elif n.startswith('fingers_'):
            c, t = '%s蓋在道具前面的手指' % side_zh(n[-1]), '只有握道具的手才要。道具夾在手掌（手臂那張）和手指中間。'
        elif n.startswith('prop_'):
            c, t = arch.get('props_zh', {}).get(n, '道具'), '整支完整畫出來，包括被手或身體擋住的部分。只能碰一隻手。'
        elif n.startswith('dangle_'):
            c, t = arch.get('dangles_zh', {}).get(n, '會晃的附屬物'), '懸空、四周留透明，一件一層。可以換成你們自己的東西，只要掛在同一個位置。'
        else:
            c, t = n, ''
        L.append('| %d | `%s.png` | %s | %s |' % (i, n, c, t))
    L += ['', '若你的姿勢需要不同的前後順序，照 PSD 實際排好，`layers.json` 的 `order` 跟著改。', '',
          '## 3. 姿勢規則', '',
          '1. **空著的手不固定在任何東西上**：不插口袋、不貼大腿、不握拄地的東西。拿道具的手例外，但道具只跟這隻手連在一起。',
          '2. **垂下的手臂離開身體**：前臂和手跟身體之間至少 **%dpx** 透明空隙。上臂在肩膀附近靠著身體沒關係。' % b['gap'],
          '3. 手肘自然微彎（約 10–25°）。',
          '4. 關節附近（肩縫、手肘、手腕）不要有硬邊細節：縫線、鉚釘、條紋、格紋會被網格扭出來。',
          '5. 道具不可經過頭或臉的後面，跟頭的輪廓至少留 **%dpx**。' % round(60 * b['W'] / 1024), '']
    if a.variants:
        vs = [v.strip() for v in a.variants.split(',') if v.strip()]
        L += ['## 4. 變化圖', '',
              '同一姿勢的變化圖：%s。**每個圖層的位置和 alpha 輪廓逐像素相同**，只改遮罩內的顏色、打光、質感；' % '、'.join('`%s`' % v for v in vs),
              '請從同一份分層底稿修改，不要每套各自生圖。各放一個資料夾：`cast_parts/<變化名>/`。', '']
    L += ['## 5. 關節參考位置（已換算到 %d × %d）' % (b['W'], b['H']), '',
          '依參考姿勢的比例換算，**照你的角色比例調整即可**；交件時把實際位置寫進 `layers.json`。',
          '參考角色是頭偏大的半身像，腿是依自然站姿補的：頭、肩、手的**相對姿勢**照表，頭身比例照這款遊戲自己的設定。', '',
          '| 關節 | x | y |', '|---|---:|---:|']
    for n, p in b['joints'].items():
        L.append('| `%s` | %d | %d |' % (n, p[0], p[1]))
    for n, p in b['extras'].items():
        L.append('| `%s`（掛點）| %d | %d |' % (n, p[0], p[1]))
    L += ['', '## 6. 驗收（交件後跑）', '',
          '1. 每張 PNG 都是 %d × %d，疊起來跟 `full.png` 一致；PSD 圖層與 PNG 逐像素一致。' % (b['W'], b['H']),
          '2. `body.png` 在手臂後面畫滿，手臂移開不露洞。',
          '3. 垂下的手臂：前臂與手離身體 ≥ %dpx；手沒有碰到身體、口袋或地面。' % b['gap'],
          '4. 肩部重疊 ≥ 40px、頸部重疊 ≥ 30px，並在動作極值定格確認沒有露縫。',
          '5. 變化圖各圖層 alpha 逐像素相同。',
          '6. 每層邊緣有反鋸齒：輪廓像素至少一半是半透明（`check_layered_art.py` 會量）。']
    n = 7
    if a.style or a.style_kind:
        L.append('%d. 跟風格基準圖、符號放在一起看：同一套筆法、色盤、光向。專案裡有 `game-reskin` 的話，'
                 '把 `full.png` 跑一次 `scripts/check_style.py`，用 §0 寫的門檻。' % n)
        n += 1
    L += ['%d. 接上骨架跑完整動作：網格不摺疊、不翻面，手臂在反應中維持剛性；做 GIF 確認。' % n, '',
          '## 7. 界線', '',
          '姿勢參考來自研究用的動作量測，**只取結構、時序、比例**。不可描、不可取樣、不可拿任何參考遊戲的圖當底；',
          '成品的造型必須是這款遊戲自己的設計。']
    return '\n'.join(L) + '\n'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--list', action='store_true')
    ap.add_argument('-c', '--character')
    ap.add_argument('--game', default='（遊戲名）')
    ap.add_argument('--out')
    ap.add_argument('--canvas', default='1024x2048')
    ap.add_argument('--feet-y', type=int, default=1774)
    ap.add_argument('--top-y', type=int, default=172)
    ap.add_argument('--center-x', type=int, default=None)
    ap.add_argument('--variants', default='')
    ap.add_argument('--mirror', action='store_true', help='draw the archetype facing the other way')
    ap.add_argument('--style', help="the game's art brief; its '## 0' section (else the whole file) is embedded")
    ap.add_argument('--style-kind', choices=sorted(STYLE_KINDS),
                    help='catalogue key from game-reskin references/art-direction.md; adds the layer/mesh rules for it')
    ap.add_argument('--style-frame', action='append', default=[],
                    help='approved style-frame image; copied to <out>/style_frame/ (repeatable)')
    a = ap.parse_args()
    if a.list or not a.character:
        for x in common.ARCHETYPES['archetypes']:
            ok = '' if x.get('layered', True) else '  （零件路線，分層需求單不適用）'
            print('%d  %-8s %s%s' % (x['number'], x['name_zh'], x['pose_zh'], ok))
        return
    arch = common.archetype(a.character)
    if not arch.get('layered', True):
        raise SystemExit(arch['note_zh'])
    for p in [a.style] + a.style_frame:
        if p and not os.path.isfile(p):
            raise SystemExit('no such file: %s' % p)
    b = build(arch, a)
    out = a.out or '.'
    os.makedirs(out, exist_ok=True)
    b['frames'] = []
    b['style_src'] = None
    if a.style:   # relative to the brief when it sits in the same app, else absolute
        rel = os.path.relpath(a.style, out)
        b['style_src'] = rel if rel.count('..') <= 3 else os.path.abspath(a.style)
    if a.style_frame:
        os.makedirs(os.path.join(out, 'style_frame'), exist_ok=True)
        for p in a.style_frame:
            rel = 'style_frame/' + os.path.basename(p)
            shutil.copy2(p, os.path.join(out, rel))
            b['frames'].append(rel)
    open(os.path.join(out, 'README.md'), 'w', encoding='utf-8').write(readme(arch, b, a))
    guide_png(arch, b, a, os.path.join(out, 'pose_guide.png'))
    arms = {anat(screen, a.mirror): arch['arms'][screen] for screen in ('screen_left', 'screen_right')}
    tmpl = dict(version=1, archetype=arch['id'], size=[b['W'], b['H']], feet_y=a.feet_y, top_y=a.top_y,
                sides='anatomical', mirrored=a.mirror, order=b['order'], joints=b['joints'], anchors=b['extras'], arms=arms,
                variants=[v.strip() for v in a.variants.split(',') if v.strip()] or ['base'],
                style=dict(kind=a.style_kind, source=b['style_src'], frames=b['frames']))
    json.dump(tmpl, open(os.path.join(out, 'layers.template.json'), 'w'), ensure_ascii=False, indent=1)
    print('wrote', out, '(README.md, pose_guide.png, layers.template.json%s)' % (', style_frame/' if b['frames'] else ''))
    if not a.style:
        print("WARNING: no --style -- the README has no style block and says so at the top. Re-run with "
              "--style <the game's art brief> before handing it over.", file=sys.stderr)


if __name__ == '__main__':
    main()
