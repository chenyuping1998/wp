"""Refresh local stub preview only; never stages platform upload."""
from pathlib import Path
import shutil
APP=Path(__file__).resolve().parents[1]
DEST=APP.parents[2]/'dist/picklepanic-playtest'
for name in ['_app','assets/pickle','assets/audio/pickle','assets/spines/pickleBoss','assets/spines/picklePepper','fonts/pickle']:
 dst=DEST/name
 if dst.exists():shutil.rmtree(dst)
 shutil.copytree(APP/'build'/name,dst)
s=(APP/'build/index.html').read_text().replace('</head>','<script src="./qa-audio.js"></script><script src="./stub-data.js"></script><script src="./stub.js"></script></head>')
(DEST/'index.html').write_text(s)
shutil.copy2(APP/'design/playtest_stub.js',DEST/'stub.js')
shutil.copy2(APP/'design/qa_audio_capture.js',DEST/'qa-audio.js')
print(DEST)
