"""Run after editing JSON files. Produces the three runtime content providers."""
from pathlib import Path
import json

folder=Path(__file__).resolve().parent
app=folder.parent
load=lambda f:json.loads((folder/f).read_text(encoding='utf-8-sig'))
language=load('spraak.json')
categories=load('kategorier.json')
scenarios=load('scenarier.json')
assert isinstance(language,dict) and language
assert len({s['id'] for s in categories['groups']})==len(categories['groups'])
assert len({s['id'] for s in scenarios})==len(scenarios)
assert len(categories['tree'])==4 and len({r['id'] for r in categories['tree']})==4
assert all(r['groups'] and all(g in {s['id'] for s in categories['groups']} for g in r['groups']) for r in categories['tree'])
for key,value in language.items():
    directions=value.get('directions')
    assert isinstance(directions,list) and directions
    assert len({d['id'] for d in directions})==len(directions)
    assert all(d.get('label','').strip() and any(c['id']==d['complement'] and c['complement']==d['id'] for c in directions) for d in directions)
    assert isinstance(key,str) and key
    assert isinstance(value.get('explanation'),str) and value['explanation'].strip()
    assert all(isinstance(value.get(f),str) and value[f].strip() for f in ['topic','directTopic'])
    assert value.get('area') in [None,'anal','vaginal','uavklart']
    assert value.get('categoryId') is None or value['categoryId'] in {g['id'] for g in categories['groups']}
    questions=value.get('question')
    assert isinstance(questions,list) and len(questions)==3
    assert all(isinstance(q,str) and q.endswith('?') for q in questions)
    assert value.get('retning') in ['aktiv','passiv','sym']
    assert isinstance(value.get('repeatKey'),str) and value['repeatKey']
for s in scenarios:
    assert all(isinstance(s.get(f),str) and s[f].strip() for f in ['id','title','intro','main','closing','aftercare'])
    assert s['groups'] and all(n in [2,3,4] for n in s['groups'])
dump=lambda x:json.dumps(x,ensure_ascii=False,indent=2)
outputs={
    'journey-language.js':'window.DypereJourneyLanguage = '+dump(language)+';\n',
    'journey-categories.js':'window.DypereJourneyCategories = '+dump(categories['groups'])+';\nwindow.DypereJourneyCategoryNames = '+dump(categories['names'])+';\nwindow.DypereJourneyTree = '+dump(categories['tree'])+';\n',
    'journey-scenarios.js':'window.DypereJourneyScenarios = '+dump(scenarios)+';\n'
}
for filename,text in outputs.items():(app/filename).write_bytes(text.encode('utf-8'))
print('Built language, categories and scenarios. Run QA and bump build/cache before publishing.')
