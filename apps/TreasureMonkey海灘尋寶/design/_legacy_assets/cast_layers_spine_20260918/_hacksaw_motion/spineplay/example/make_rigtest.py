# -*- coding: utf-8 -*-
"""產生一個合成骨架，把 IK / transform / path 三種約束的分支都走一遍。

用途：讓 constraint_selftest.py 可以在【沒有 Hacksaw 素材、也沒有官方
runtime】的機器上驗證約束實作有沒有跑掉。素材是自己畫的四色方塊，
骨架是自己編的，兩者都沒有任何第三方內容。
"""
import json
import io
import os
import sys

import numpy as np
from PIL import Image

out_dir = sys.argv[1]
os.makedirs(out_dir, exist_ok=True)

img = np.zeros((64, 64, 4), np.uint8)
img[0:32, 0:32] = (220, 80, 80, 255)
img[0:32, 32:64] = (80, 200, 120, 255)
img[32:64, 0:32] = (90, 120, 230, 255)
img[32:64, 32:64] = (230, 200, 90, 255)
Image.fromarray(img, 'RGBA').save(os.path.join(out_dir, 'rigtest.png'))

io.open(os.path.join(out_dir, 'rigtest.atlas'), 'w',
        encoding='utf-8', newline='\n').write(
    'rigtest.png\nsize:64,64\nfilter:Linear,Linear\n'
    'blob\nbounds:0,0,32,32\noffsets:0,0,32,32\n')


def bone(name, parent=None, **kw):
    d = {'name': name}
    if parent:
        d['parent'] = parent
    d.update(kw)
    return d


sk = {
    'skeleton': {'hash': 'rigtest', 'spine': '4.0.64',
                 'x': -260, 'y': -260, 'width': 520, 'height': 520},
    'bones': [
        bone('root'),
        bone('upper', 'root', length=80, rotation=20),
        bone('lower', 'upper', length=60, rotation=-30, x=80),
        bone('ik_target', 'root', x=110, y=60),
        bone('solo', 'root', length=50, x=-120, y=40),
        bone('solo_target', 'root', x=-40, y=95),
        bone('src', 'root', rotation=35, x=30, y=-90,
             scaleX=1.3, scaleY=0.8, shearY=12),
        bone('dst_world', 'root', rotation=-10, x=-30, y=-90),
        bone('dst_wrel', 'root', rotation=-10, x=-60, y=-120),
        bone('dst_local', 'root', rotation=-10, x=-90, y=-150),
        bone('dst_lrel', 'root', rotation=-10, x=-120, y=-170),
        bone('spin', 'root', rotation=48, x=60, y=120, scaleX=1.4, scaleY=0.7),
        bone('nrr', 'spin', length=40, x=20,
             transform='noRotationOrReflection'),
        bone('nrr_target', 'root', x=140, y=150),
        bone('nsc', 'spin', length=40, x=20, y=40, transform='noScale'),
        bone('nsc_target', 'root', x=150, y=60),
        bone('p1', 'root', length=40, x=-160, y=150),
        bone('p2', 'p1', length=40, x=40),
        bone('p3', 'p2', length=40, x=40),
    ],
    'slots': [
        {'name': 'blob', 'bone': 'lower', 'attachment': 'blob'},
        {'name': 'curve', 'bone': 'root', 'attachment': 'curve'},
    ],
    'ik': [
        {'name': 'ik2', 'order': 0, 'bones': ['upper', 'lower'],
         'target': 'ik_target', 'bendPositive': True, 'stretch': True,
         'uniform': True, 'softness': 8},
        {'name': 'ik1', 'order': 1, 'bones': ['solo'],
         'target': 'solo_target', 'compress': True, 'stretch': True,
         'uniform': True},
        {'name': 'ik_nrr', 'order': 2, 'bones': ['nrr'],
         'target': 'nrr_target'},
        {'name': 'ik_nsc', 'order': 3, 'bones': ['nsc'],
         'target': 'nsc_target', 'compress': True, 'stretch': True},
    ],
    'transform': [
        {'name': 'tw', 'order': 4, 'bones': ['dst_world'], 'target': 'src',
         'rotation': 15, 'x': 10, 'y': -5, 'scaleX': 0.2, 'scaleY': -0.1,
         'shearY': 7, 'mixRotate': 0.7, 'mixX': 0.4, 'mixY': 0.9,
         'mixScaleX': 0.5, 'mixScaleY': 0.3, 'mixShearY': 0.6},
        {'name': 'twr', 'order': 5, 'bones': ['dst_wrel'], 'target': 'src',
         'relative': True, 'rotation': 15, 'x': 10, 'y': -5, 'scaleX': 0.2,
         'mixRotate': 0.7, 'mixX': 0.4, 'mixScaleX': 0.5, 'mixShearY': 0.6},
        {'name': 'tl', 'order': 6, 'bones': ['dst_local'], 'target': 'src',
         'local': True, 'rotation': 15, 'x': 10, 'y': -5, 'scaleX': 0.2,
         'mixRotate': 0.7, 'mixX': 0.4, 'mixY': 0.9, 'mixScaleX': 0.5,
         'mixShearY': 0.6},
        {'name': 'tlr', 'order': 7, 'bones': ['dst_lrel'], 'target': 'src',
         'local': True, 'relative': True, 'rotation': 15, 'x': 10,
         'mixRotate': 0.7, 'mixX': 0.4, 'mixScaleX': 0.5, 'mixShearY': 0.6},
    ],
    'path': [
        {'name': 'pc', 'order': 8, 'bones': ['p1', 'p2', 'p3'],
         'target': 'curve', 'positionMode': 'percent',
         'spacingMode': 'proportional', 'rotateMode': 'chainScale',
         'spacing': 1, 'position': 0.15,
         'mixRotate': 1, 'mixX': 1, 'mixY': 0.8},
    ],
    'skins': [{'name': 'default', 'attachments': {
        'blob': {'blob': {'type': 'mesh',
                          'uvs': [0, 0, 1, 0, 1, 1, 0, 1],
                          'triangles': [0, 1, 2, 0, 2, 3],
                          'vertices': [0, 0, 40, 0, 40, 40, 0, 40],
                          'hull': 4}},
        'curve': {'curve': {'type': 'path', 'closed': False,
                            'constantSpeed': True,
                            # 開放路徑：vertexCount 必須是 3 的倍數，
                            # 而且前後各有一個額外控制點（12 點 = 2 段曲線）
                            'lengths': [140.0, 300.0, 420.0, 500.0],
                            'vertexCount': 12,
                            'vertices': [-190, 120, -160, 200, -90, 60,
                                         -40, 190, 20, 60, 70, 200,
                                         120, 70, 150, 190, 180, 100,
                                         200, 160, 230, 90, 250, 170]}},
    }}],
    'animations': {
        'move': {
            'bones': {
                'ik_target': {
                    'translatex': [{'time': 0, 'value': 0},
                                   {'time': 0.5, 'value': -70,
                                    'curve': [0.1, 0, 0.4, -70]},
                                   {'time': 1.0, 'value': 40}],
                    'translatey': [{'time': 0, 'value': 0},
                                   {'time': 0.6, 'value': -110},
                                   {'time': 1.0, 'value': 20}]},
                'solo_target': {
                    'translate': [{'time': 0, 'x': 0, 'y': 0},
                                  {'time': 0.7, 'x': -90, 'y': -60,
                                   'curve': [0.2, 0, 0.5, -90,
                                             0.2, 0, 0.5, -60]},
                                  {'time': 1.0, 'x': 30, 'y': 40}]},
                'src': {
                    'rotate': [{'time': 0, 'value': 0},
                               {'time': 0.5, 'value': 140},
                               {'time': 1.0, 'value': -60}],
                    'scalex': [{'time': 0, 'value': 1},
                               {'time': 0.5, 'value': 0.4},
                               {'time': 1.0, 'value': 1.7}]},
                'spin': {'rotate': [{'time': 0, 'value': 0},
                                    {'time': 1.0, 'value': 300}]},
            },
            'ik': {'ik2': [{'time': 0, 'mix': 1, 'softness': 8},
                           {'time': 0.5, 'mix': 0.35, 'softness': 40,
                            'bendPositive': False},
                           {'time': 1.0, 'mix': 1, 'softness': 0}]},
            'transform': {'tw': [{'time': 0, 'mixRotate': 0.7, 'mixX': 0.4,
                                  'mixY': 0.9, 'mixScaleX': 0.5,
                                  'mixShearY': 0.6},
                                 {'time': 0.5, 'mixRotate': 0.1, 'mixX': 0.9,
                                  'mixScaleX': 0.2, 'mixShearY': 0.1},
                                 {'time': 1.0, 'mixRotate': 1, 'mixX': 0.3,
                                  'mixY': 0.2, 'mixScaleX': 1,
                                  'mixShearY': 1}]},
            'path': {'pc': {
                'position': [{'time': 0, 'value': 0.05},
                             {'time': 1.0, 'value': 0.8}],
                'spacing': [{'time': 0, 'value': 1},
                            {'time': 1.0, 'value': 1.6}],
                'mix': [{'time': 0, 'mixRotate': 1, 'mixX': 1, 'mixY': 0.8},
                        {'time': 1.0, 'mixRotate': 0.3, 'mixX': 0.5}]}},
        }
    }
}
io.open(os.path.join(out_dir, 'rigtest.json'), 'w',
        encoding='utf-8', newline='\n').write(
    json.dumps(sk, ensure_ascii=False, indent=1))
print('written to', out_dir)
