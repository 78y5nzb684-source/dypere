"""Validate editable card packs and build the app's board-cards.js."""
from pathlib import Path
import argparse
from datetime import datetime, timezone
import json
import os
import re
import tempfile

KINDS = {'Samtale': 'talk', 'Gjett': 'guess', 'Utfordring': 'challenge', 'Joker': 'joker', 'Ønskekort': 'wish'}
ROOT = Path(__file__).resolve().parent
MAX_CARDS = 2000


def fail(path, line, message):
    raise ValueError(f'{path.name}, linje {line}: {message}')


def parse_pack(path):
    if path.stat().st_size > 2_000_000:
        raise ValueError(f'{path.name}: filen er større enn 2 MB.')
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    if not lines or lines[0].strip() != 'DYPERE KORTPAKKE 1':
        fail(path, 1, 'Filen må begynne med DYPERE KORTPAKKE 1.')
    meta, cards, i = {}, [], 1
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('#'):
            i += 1
            continue
        if line.startswith('[KORT '):
            break
        if ':' not in line:
            fail(path, i+1, 'Forventet PAKKE-ID:, NAVN: eller BESKRIVELSE:.')
        key, value = line.split(':', 1)
        if key not in {'PAKKE-ID', 'NAVN', 'BESKRIVELSE'} or key in meta:
            fail(path, i+1, 'Ukjent eller gjentatt pakkefelt.')
        meta[key] = value.strip()
        i += 1
    if set(meta) != {'PAKKE-ID', 'NAVN', 'BESKRIVELSE'}:
        fail(path, 1, 'Pakken mangler ID, navn eller beskrivelse.')
    if not re.fullmatch(r'[a-z0-9-]{1,32}', meta['PAKKE-ID']):
        fail(path, 2, 'PAKKE-ID må bruke små bokstaver a–z, tall eller bindestrek, maks 32 tegn.')
    if not 1 <= len(meta['NAVN']) <= 50 or not 1 <= len(meta['BESKRIVELSE']) <= 300:
        fail(path, 1, 'Navn må være 1–50 tegn og beskrivelse 1–300 tegn.')
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('#'):
            i += 1
            continue
        match = re.fullmatch(r'\[KORT (base-board-[a-z0-9-]+)\]', line)
        if not match or len(match[1]) > 100:
            fail(path, i+1, 'Forventet [KORT base-board-unik-id], maks 100 tegn i ID.')
        card_id, start, fields = match[1], i+1, {}
        i += 1
        while i < len(lines) and lines[i].strip() != 'TEKST:':
            line = lines[i].strip()
            if not line or line.startswith('#'):
                i += 1
                continue
            if ':' not in line:
                fail(path, i+1, 'Forventet TYPE:, NIVÅ:, AKTIV: eller TEKST:.')
            key, value = line.split(':', 1)
            if key not in {'TYPE', 'NIVÅ', 'AKTIV'} or key in fields:
                fail(path, i+1, 'Ukjent eller gjentatt kortfelt.')
            fields[key] = value.strip()
            i += 1
        if i >= len(lines):
            fail(path, start, 'Kortet mangler TEKST:.')
        i += 1
        text = []
        while i < len(lines) and lines[i].strip() != '[SLUTT]':
            if re.fullmatch(r'\[KORT .*\]', lines[i].strip()):
                fail(path, i+1, 'Forrige kort mangler [SLUTT].')
            text.append(lines[i])
            i += 1
        if i >= len(lines):
            fail(path, start, 'Kortet mangler [SLUTT].')
        i += 1
        copy = '\n'.join(text).strip()
        if fields.get('TYPE') not in KINDS or fields.get('NIVÅ') not in {'1', '2', '3'} or fields.get('AKTIV') not in {'ja', 'nei'}:
            fail(path, start, 'Ugyldig TYPE, NIVÅ eller AKTIV. Se les-meg-filen.')
        if not 1 <= len(copy) <= 1200:
            fail(path, start, 'Kortteksten må være 1–1200 tegn.')
        cards.append({'id': card_id, 'kind': KINDS[fields['TYPE']], 'role': 'Alle', 'audience': 'pair', 'text': copy, 'pack': meta['NAVN'], 'level': int(fields['NIVÅ']), 'enabled': fields['AKTIV'] == 'ja'})
    if not cards:
        fail(path, 1, 'Pakken må ha minst ett kort. Deaktiver kort med AKTIV: nei hvis de ikke skal brukes.')
    return {'id': meta['PAKKE-ID'], 'name': meta['NAVN'], 'copy': meta['BESKRIVELSE']}, cards


def load_bank(folder):
    files = sorted(folder.glob('*.kort.txt'))
    if not files or len(files) > 100:
        raise ValueError('Velg en mappe med 1–100 filer som slutter på .kort.txt.')
    packs, cards = [], []
    for path in files:
        pack, content = parse_pack(path)
        packs.append(pack)
        cards.extend(content)
    if len(cards) > MAX_CARDS:
        raise ValueError(f'Banken kan ha maksimalt {MAX_CARDS} kort.')
    for label, values in [('kort-ID', [c['id'] for c in cards]), ('pakke-ID', [p['id'] for p in packs]), ('pakkenavn', [p['name'].casefold() for p in packs])]:
        if len(set(values)) != len(values):
            raise ValueError(f'Banken har gjentatt {label}. Ingen appfil er skrevet.')
    return {'version': 1, 'packs': packs, 'cards': cards}


def javascript(bank):
    payload = json.dumps(bank, ensure_ascii=False, indent=1).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return "/* Generated from kortbank-tekst/*.kort.txt. Edit source text packs; preserve card IDs. */\n(function(root){\n 'use strict';\n const api=" + payload + ";\n if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.DypereBoardLibrary=api;root.DyperePlayCards=[...(root.DyperePlayCards||[]),...api.cards];}\n})(globalThis);\n"


def write_bank(bank, target, backup_dir):
    target = target.resolve()
    if not target.parent.is_dir():
        raise ValueError('Målmappen finnes ikke. Bruk --target med sti til appens board-cards.js.')
    backup = None
    if target.exists():
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup = backup_dir / ('board-cards-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.js')
        backup.write_bytes(target.read_bytes())
    fd, name = tempfile.mkstemp(prefix='board-cards-', suffix='.tmp', dir=target.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as output:
            output.write(javascript(bank))
        os.replace(name, target)
    finally:
        Path(name).unlink(missing_ok=True)
    return backup


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT)
    default_target=ROOT.parent/'dypere'/'board-cards.js'
    if not default_target.is_file():
        default_target=ROOT.parent/'board-cards.js'
    parser.add_argument('--target', type=Path, default=default_target)
    parser.add_argument('--backup-dir', type=Path, default=ROOT.parent/'kortbank-backups')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--check', action='store_true', help='Validate only; this is the default.')
    mode.add_argument('--json', action='store_true', help='Print parsed bank without changing files.')
    mode.add_argument('--write', action='store_true', help='Back up and replace the app file after validation.')
    args = parser.parse_args()
    try:
        bank = load_bank(args.source)
        if args.json:
            print(json.dumps(bank, ensure_ascii=True))
            return
        backup = write_bank(bank, args.target, args.backup_dir) if args.write else None
        print(json.dumps({'status':'PASS', 'packs':len(bank['packs']), 'cards':len(bank['cards']), 'active':sum(c['enabled'] for c in bank['cards']), 'written':bool(args.write), 'backup':str(backup) if backup else None}, ensure_ascii=True))
    except (OSError, ValueError, UnicodeError) as error:
        parser.exit(1, str(error).encode('ascii', errors='backslashreplace').decode()+'\n')


if __name__ == '__main__':
    main()
