"""Bring written handoff records forward to the unhurried eye-radiance signature."""
from pathlib import Path
import json,runpy,re
APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze'
p=APP/'design/finalize_delivery.py';s=p.read_text(encoding='utf-8')
s=s.replace('招牌倍率演出 v3：雙眼獨立綁定瞳孔骨骼，聚焦、雙光束前緣、石化紋理、聚能寶珠、加速弧線、命中壓縮與原畫碎片。','招牌倍率演出 v4：雙眼轉綠、近眼放射光芒、弧光與粒子匯聚倍率球、飛行、命中壓縮與原畫碎片。')
s=s.replace('・倍率數字維持正向；','・一般／TURBO 1／TURBO 2 的角色、魔法、倍率球、音效、跳數與結果停留使用同一時序；速度差異只保留在盤面消除／掉落。\n・倍率數字維持正向；') if '速度差異只保留在盤面消除／掉落' not in s else s
s=s.replace("'multiplierSignature':{'version':3","'multiplierSignature':{'version':4")
s=s.replace('glasses contact, quiet hold, pupil focus, twin advancing beams, mineral veins, charged orb, curved flight, contact hold, result count and readable result hold','glasses contact, emerald eyes, local radiating fan, curved strands and gathering motes, condensed orb, curved flight, contact hold, count and result hold; identical at all three turbo tiers')
s=s.replace("status['audio']['multiplierUpgrade']={'version':2","status['audio']['multiplierUpgrade']={'version':4").replace('MULTIPLIER_V2_SOUND_DESIGN','MULTIPLIER_V4_SOUND_DESIGN')
p.write_text(s,encoding='utf-8')
p=ROOT/'review.html';s=p.read_text(encoding='utf-8')
if '倍率招牌演出 v4' in s:s=re.sub(r'<section><h2>倍率招牌演出 v3</h2>.*?</section>','',s,flags=re.S)
s=s.replace('倍率招牌演出 v3','倍率招牌演出 v4').replace('MULTIPLIER_V2_SOUND_DESIGN','MULTIPLIER_V4_SOUND_DESIGN')
s=s.replace('拉下墨鏡、瞳孔聚焦、雙眼綠光、石化紋理、聚能寶珠、加速飛行與命中停頓，搭配 13 支重製音效。','拉下墨鏡後雙眼轉綠，再向外發散光芒，透過弧光與粒子凝聚倍率球後飛出命中。三種 TURBO 使用相同的角色、音效與倍率動畫時序，只加速盤面消除／掉落。')
s=s.replace('_sheets/multiplier_v3_gaze.png','_sheets/signature_v4_radiance.png').replace('_sheets/multiplier_v3_readout.png','_sheets/signature_v4_result.png')
p.write_text(s,encoding='utf-8')
p=APP/'design/refresh_multiplier_delivery.py';s=p.read_text(encoding='utf-8').replace('Multiplier v2 uses','Signature v4 uses').replace("{'version':3,'pupilMarkers'","{'version':4,'pupilMarkers'")
s=s.replace('倍率招牌演出 v3','倍率招牌演出 v4').replace('MULTIPLIER_V2_SOUND_DESIGN','MULTIPLIER_V4_SOUND_DESIGN').replace('multiplier_v3_gaze.png','signature_v4_radiance.png').replace('multiplier_v3_readout.png','signature_v4_result.png')
p.write_text(s,encoding='utf-8')
runpy.run_path(str(p),run_name='__main__')
# The earlier updater also maintains the completed presentation records.
p=APP/'design/completion-progress.json';d=json.loads(p.read_text(encoding='utf-8'));d['date']='2026-10-26';d['multiplierSignature']['version']=4;d['multiplierSignature']['sameTimingAcrossTurboTiers']=True;d['multiplierSignature']['effect']='Emerald eyes, local radial glow, curved gathering strands and condensed orb; no long laser beam';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Updated v4 handoff, audio measurements, review links and completion record.')
