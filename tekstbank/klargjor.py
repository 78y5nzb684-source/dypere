"""Validate authored activity drafts and optionally export enabled records.

This tool never changes the live database or publishes anything.
"""
from pathlib import Path
import argparse
import json

HERE = Path(__file__).resolve().parent


def prepare(document, topics):
    if document.get('version') != 1 or not isinstance(document.get('activities'), list):
        raise ValueError('Forventet version 1 og activities-liste.')
    result, ids = [], set()
    for row in document['activities']:
        activity_id = row.get('id')
        if not isinstance(activity_id, str) or not activity_id.strip() or activity_id in ids:
            raise ValueError('Hver oppføring må ha en unik ID.')
        ids.add(activity_id)

        def check(condition, message):
            if not condition:
                raise ValueError(f'{activity_id}: {message}')

        check(type(row.get('enabled')) is bool, 'enabled må være true eller false.')
        for key in ['title', 'description']:
            check(isinstance(row.get(key), str) and row[key].strip(), f'{key} mangler.')
        check(type(row.get('level')) is int and 1 <= row['level'] <= 5, 'level må være 1–5.')
        check(isinstance(row.get('groups'), list) and row['groups'] and
              all(type(n) is int and n in [2, 3, 4] for n in row['groups']), 'Ugyldig deltakerantall.')
        categories = {t['category'] for t in topics.values()}
        check(isinstance(row.get('genres'), list) and row['genres'] and
              all(g in categories for g in row['genres']), 'Ukjent kategori.')
        check(isinstance(row.get('requires'), list) and row['requires'], 'Interessekrav mangler.')
        used_directions = set()
        for requirement in row['requires']:
            check(isinstance(requirement, dict), 'Ugyldig kravgruppe.')
            choices = requirement.get('anyOf')
            check(isinstance(choices, list) and choices and
                  all(isinstance(t, str) and t in topics for t in choices), 'Ukjent tema-ID.')
            routes = requirement.get('routes', [])
            check(isinstance(routes, list), 'routes må være en liste.')
            for pair in routes:
                check(isinstance(pair, list) and len(pair) == 2 and
                      all(isinstance(d, str) for d in pair), 'Ugyldig retning.')
                for topic_id in choices:
                    directions = {d['id']: d for d in topics[topic_id]['directions']}
                    check(all(d in directions for d in pair), 'Retningen finnes ikke for temaet.')
                    d = directions[pair[0]]
                    check(pair[1] in [d['complement'], *d.get('additionalComplements', [])],
                          'Retningene er ikke komplementære.')
            for topic_id in choices:
                used_directions.update(d['id'] for d in topics[topic_id]['directions'])
        labels = row.get('roleLabels', {})
        check(isinstance(labels, dict) and all(k in used_directions and isinstance(v, str) and v.strip()
              for k, v in labels.items()), 'Ugyldige rollenavn.')
        phases = row.get('phases')
        check(isinstance(phases, list) and phases, 'phases mangler.')
        total, steps = 0, []
        for phase in phases:
            check(isinstance(phase, dict), 'Ugyldig del.')
            for key in ['title', 'text']:
                check(isinstance(phase.get(key), str) and phase[key].strip(), f'Delen mangler {key}.')
            check(type(phase.get('minutes')) is int and phase['minutes'] > 0, 'Delminutter må være positive heltall.')
            check(type(phase.get('level')) is int and 1 <= phase['level'] <= row['level'],
                  'Delnivå må være 1–5 og ikke høyere enn oppføringens level.')
            total += phase['minutes']
            steps.append(f"{phase['title']} · omtrent {phase['minutes']} minutter\n{phase['text']}")
        if row['enabled']:
            check(not any('skriv ' in text.lower() for text in [row['description'], *steps]),
                  'Fjern maltekst før aktivering.')
            result.append({key: row[key] for key in
                          ['id', 'enabled', 'title', 'description', 'genres', 'level', 'groups', 'requires']}
                          | {'minutes': total, 'steps': steps, 'phases': phases, 'roleLabels': labels,
                             'source': 'manually-authored'})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--export', type=Path)
    args = parser.parse_args()
    topics = {t['id']: t for t in json.loads((HERE / 'temaoppslag.json').read_text('utf-8-sig'))}
    try:
        document = json.loads(args.input.read_text('utf-8-sig'))
        activities = prepare(document, topics)
        if args.export:
            if args.export.resolve() == args.input.resolve():
                raise ValueError('Eksport må være en annen fil enn utkastet.')
            with args.export.open('x', encoding='utf-8') as stream:
                json.dump({'version': 1, 'activities': activities}, stream, ensure_ascii=False, indent=2)
        print(f"Godkjent: {len(document['activities'])} utkast, {len(activities)} aktive oppføringer.")
        print('Nettstedet er ikke endret eller publisert.')
    except (ValueError, OSError) as error:
        parser.exit(1, f'Feil: {error}\n')


if __name__ == '__main__':
    main()
