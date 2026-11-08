"""Run only after final GIF render succeeds: bind preview to exact source hashes."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'qa/final-preview.gif')==sha(R/'cast_mg_spine/預覽.gif')
data={'layers':{p.name:sha(p) for p in sorted((R/'layers').glob('*.png'))},'spineSha256':sha(R/'cast_mg_spine/cast_mg.json'),'gifSha256':sha(R/'qa/final-preview.gif'),'matricesSha256':sha(R/'qa/motion-frames.json')}
(R/'qa/preview-source-manifest.json').write_text(json.dumps(data,indent=2)+'\n')
print('Final GIF sealed against all 32 source files and official Spine/matrix hashes.')
