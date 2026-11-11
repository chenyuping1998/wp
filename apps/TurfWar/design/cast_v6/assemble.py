"""rig.base.json + motions.py clips -> out/<who>/rig.json (finalize.mjs installs)."""
import json, sys
from pathlib import Path
D = Path(__file__).resolve().parent
sys.path.insert(0, str(D))
import motions

SHIP = ['idle', 'jab', 'combo', 'celebrate']
for who in sys.argv[1:] or ['mg', 'fg']:
  rig = json.loads((D / 'out' / who / 'rig.base.json').read_text())
  rig['animations'] = {}
  for make in motions.CLIPS:
    c = make(who)
    # the deltoid helper turns half as far as the upper arm, on the same curve
    if ('upperArmF', 'rotate') in c.tracks:
      c.tracks[('deltF', 'rotate')] = [tuple((p[0], p[1] * 0.5) for p in seg) for seg in c.tracks[('upperArmF', 'rotate')]]
    rig['animations'][c.name] = c.to_spine()
  rig['turf'].update({
    'idle': 'idle', 'layering': 'overlay', 'mix': {'in': 0.12, 'out': 0.25},
    'reactions': {'win': 'jab', 'winBig': 'combo', 'trigger': 'celebrate'},
    'ship': SHIP, 'speed': {},
  })
  (D / 'out' / who / 'rig.json').write_text(json.dumps(rig))
  print(who, list(rig['animations']))
