"""Validate phased drafts and generate the static provider. No build needed to run the site."""
from pathlib import Path
import json,runpy
folder=Path(__file__).resolve().parent
prepare=runpy.run_path(str(folder/'klargjor.py'))['prepare']
bank=json.loads((folder/'aktiviteter.json').read_text('utf-8-sig'))
topics={t['id']:t for t in json.loads((folder/'temaoppslag.json').read_text('utf-8-sig'))}
rows=prepare(bank,topics)
provider={'version':1,'description':bank.get('description',''),'activities':rows}
(folder.parent/'activity-database.js').write_text('window.DypereActivityDatabase = '+json.dumps(provider,ensure_ascii=False,indent=2)+';\n','utf-8')
print(f'Godkjent og klargjort: {len(rows)} aktive forslag. Ingen publisering utført.')
