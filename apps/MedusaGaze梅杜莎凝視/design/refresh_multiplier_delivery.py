"""Refresh written handoff records from the delivered audio and rig reports."""
from pathlib import Path
import json, re, runpy
APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze'
meta=json.loads((ROOT/'audio/audio_metadata.json').read_text(encoding='utf-8'))
levels=(ROOT/'audio/LEVELS.md').read_text(encoding='utf-8').split('| File |')[0]
levels=re.sub(r'Runtime library:.*?Masters excluded from download budget\.',f"Runtime library: **{meta['runtime_bytes']:,} bytes ({meta['runtime_bytes']/1e6:.2f} MB), {len(meta['files'])} files**. Masters excluded from download budget.",levels)
levels+='Signature v4 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.\n\n'
levels+='| File | Seconds | Format / Hz / channels | Peak dBTP | LUFS-I | Bytes |\n|---|---:|---|---:|---:|---:|\n'
for f in meta['files']:
    levels+=f"| `{f['file']}` | {f['duration']:.3f} | {f['format']} / {f['sample_rate']} / {f['channels']} | {f['true_peak_db']:.2f} | {f['lufs']:.2f} | {f['bytes']:,} |\n"
(ROOT/'audio/LEVELS.md').write_text(levels,encoding='utf-8')
runpy.run_path(str(ROOT/'audio/build_preview.py'),run_name='__main__')
path=ROOT/'multiplier/preview/index.html'
path.write_text(path.read_text(encoding='utf-8').replace('招牌演出 · v2','招牌演出 · v3').replace('src="./scene.js"','src="./scene.js?v=3"'),encoding='utf-8')
path=ROOT/'review.html';html=path.read_text(encoding='utf-8')
if '倍率招牌演出 v4' not in html:
    section='<section><h2>倍率招牌演出 v4</h2><p>拉下墨鏡、瞳孔聚焦、雙眼綠光、石化紋理、聚能寶珠、加速飛行與命中停頓，搭配 13 支重製音效。倍率數字維持正向，中央顯示原得分 × 倍率 = 最終得分，免費遊戲另列 TOTAL 累積倍率。</p><nav><a href="multiplier/preview/index.html">互動逐格檢視</a><a href="audio/MULTIPLIER_V4_SOUND_DESIGN.wav">同步音效示例</a><a href="../../../multiplier-performance-validation.json">動態驗證</a></nav></section>'
    html=html.replace('<section><h2>實際遊戲畫面',section+'<section><h2>實際遊戲畫面')
html=html.replace('../../../multiplier-performance-validation.json','../../multiplier-performance-validation.json')
if 'signature_v4_result.png' not in html:
    html=html.replace('<a href="../../multiplier-performance-validation.json">動態驗證</a></nav></section>','<a href="../../multiplier-performance-validation.json">動態驗證</a><a href="_sheets/signature_v4_radiance.png">雙眼綠光檢查畫面</a></nav><img src="_sheets/signature_v4_result.png" alt="倍率與完整加倍公式檢查畫面"></section>')
path.write_text(html,encoding='utf-8')
path=APP/'design/completion-progress.json';progress=json.loads(path.read_text(encoding='utf-8'))
progress['character']['bones']=74
progress['multiplierSignature']={'version':4,'pupilMarkers':2,'clearReadout':'upright orb value, central multiplier and full multiplication equation, result hold, labelled TOTAL plaque','audioRedesign':13,'verification':'design/multiplier-performance-validation.json','review':'design/source/medusagaze/multiplier/preview/index.html'}
path.write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Updated audio measurements, preview, handoff and multiplier completion record.')
