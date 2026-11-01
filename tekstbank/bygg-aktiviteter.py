"""Build the activity provider after editing aktiviteter.json. No build is needed to run the site."""
from pathlib import Path
import json
folder=Path(__file__).resolve().parent
bank=json.loads((folder/'aktiviteter.json').read_text('utf-8-sig'))
assert bank['version']==1 and isinstance(bank['activities'],list)
ids=set()
for row in bank['activities']:
 assert row['id'] and row['id'] not in ids;ids.add(row['id'])
 assert row['title'].strip() and row['description'].strip()
 assert isinstance(row['enabled'],bool)
 assert isinstance(row['level'],int) and 1<=row['level']<=5
 assert isinstance(row['minutes'],int) and row['minutes']>0
 assert row['groups'] and all(value in [2,3,4] for value in row['groups'])
 assert row['requires'] and all(r['anyOf'] for r in row['requires'])
 assert row['steps'] and all(isinstance(text,str) and text.strip() for text in row['steps'])
(folder.parent/'activity-database.js').write_text('window.DypereActivityDatabase = '+json.dumps(bank,ensure_ascii=False,indent=2)+';\n','utf-8')
print(f"Built {len(bank['activities'])} activities. Check topic IDs, matching, version and cache before publication.")
