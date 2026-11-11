from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parent/'cast_parts'
BUILDER=Path('/Users/stone/.codex/skills/hacksaw-character-motion/archetype/layered/build_layered_rig.py')
for role in ['mg','fg']:
 folder=ROOT/role
 subprocess.run([sys.executable,str(BUILDER),str(folder),'--cell','32'],check=True)
 p=folder/'layers.manifest.json';m=json.loads(p.read_text());spec=json.loads((folder/'layers.json').read_text())
 for layer in m['layers']:
  bones=layer['rig']['bones'];ix={b['name']:i for i,b in enumerate(bones)}
  for name,parent in spec.get('parents',{}).items():
   bones[ix[name]]['parent']=ix[parent]
  # Smoke is attached to the cigar, and the entire cigar rides the head.
  # Use the new parent for the root of each dangling mesh as well.
  if role=='mg' and layer['name']=='dangle_smoke':
   for w in layer['rig']['weights']:
    w[ix['prop_cigar']]+=w[ix['head']];w[ix['head']]=0
 p.write_text(json.dumps(m,separators=(',',':')))
