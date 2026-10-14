"""Measured production cuts for the two original pickle drawings, #7 own rig."""
from pathlib import Path
import json

APP = Path(__file__).resolve().parents[1]

def rect(x0, y0, x1, y1):
    return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]

CUTS = {
 'mg': [
  ('head_2_face',30,[(140,0),(445,0),(437,307),(364,325),(230,327),(139,301)],None),
  ('left_arm_0_upper_arm',22,[(142,309),(213,306),(214,367),(185,435),(160,455),(84,446),(118,369)],None),
  ('left_arm_2_hand',20,[(88,431),(174,431),(156,495),(155,638),(63,638),(66,517)],None),
  ('right_arm_0_upper_arm',26,[(370,326),(444,335),(470,446),(416,464),(384,412)],None),
  ('right_arm_2_hand',24,[(413,435),(493,435),(507,638),(402,638),(398,524)],None),
  ('left_leg_2_foot',12,rect(61,760,296,897),None),
  ('right_leg_2_foot',16,rect(312,758,521,901),None),
  ('left_leg_1_calf',11,rect(181,681,290,788),None),
  ('right_leg_1_calf',15,rect(321,681,433,789),None),
  ('left_leg_0_thigh',10,rect(165,626,300,724),None),
  ('right_leg_0_thigh',14,rect(307,620,429,725),None),
 ],
 'fg': [
  ('head_2_face',30,[(164,0),(486,0),(486,226),(363,270),(344,286),(231,285),(170,250)],None),
  ('left_arm_0_upper_arm',22,[(176,286),(238,282),(237,335),(195,395),(177,438),(132,421),(153,348)],None),
  ('left_arm_2_hand',20,[(130,407),(191,413),(162,475),(159,611),(90,612),(91,520)],None),
  ('right_arm_0_upper_arm',26,[(335,287),(391,284),(417,365),(427,428),(384,439),(363,384)],None),
  ('right_arm_2_hand',24,[(386,412),(437,413),(477,611),(400,613),(394,484)],None),
  ('left_leg_2_foot',12,rect(87,756,284,911),None),
  ('right_leg_2_foot',16,rect(311,756,514,911),None),
  ('left_leg_1_calf',11,rect(187,660,286,783),None),
  ('right_leg_1_calf',15,rect(312,660,416,786),None),
  ('left_leg_0_thigh',10,rect(181,595,299,709),None),
  ('right_leg_0_thigh',14,rect(300,595,408,710),None),
 ],
}

p=APP/'design/cut_cast_layers.py'
s=p.read_text();start=s.index('CUTS = {');end=s.index('TRUNK = ',start)
s=s[:start]+'CUTS = '+repr(CUTS)+'\n'+s[end:]
s=s.replace('MIRROR = True','MIRROR = False')
p.write_text(s)
for cast in ('mg','fg'):
    fg=cast=='fg'
    rig={
      '_note':'Own #7 rig. Coordinates measured on original pickle art, facing screen-left.',
      'out':'picklePepper' if fg else 'pickleBoss',
      'root':[280,888], 'hip':[285,582 if fg else 622],
      'waist':[283,430 if fg else 484], 'neck':[283,284 if fg else 317],
      'helmet':{'at':[300,82],'dir':[300,35]},
      'banana':{'at':[254,190],'dir':[254,224]},
      'pocket':{'at':[290,483],'dir':[290,430]},
      'cuffL':{'at':[187,345],'dir':[153,420]},
      'cuffR':{'at':[394,353],'dir':[428,439]},
      'handL':[128,566] if fg else [108,572],
      'handR':[438,565] if fg else [457,567],
      'prop':[133,584] if fg else [113,590],
      'pantL':{'at':[235,624],'dir':[233,710]},
      'pantR':{'at':[355,627],'dir':[370,716]},
    }
    (APP/f'design/cast_cut/{cast}_rig.json').write_text(json.dumps(rig,indent=2)+'\n')
    out=APP/f'design/cast_brief/{cast}';out.mkdir(parents=True,exist_ok=True)
    brief=(APP/'ART_BRIEF.md').read_text();style=brief[brief.index('## 0.'):brief.index('## 1.')]
    (out/'README.md').write_text('# Pickle Panic '+cast.upper()+' — 自有 #7 製作需求\n\n'+style+'\n人物朝左，完整雙手自由垂下；腳底統一，兩位各自量關節與切層。使用自有九段動作，不配送研究骨架或素材。裁切後驗證不漏像素、權重和接縫，再在實機確認idle、cheer、chestbeat、throwit峰值。\n')
print('Configured two independent measured pickle rigs and style-propagated cast briefs.')
