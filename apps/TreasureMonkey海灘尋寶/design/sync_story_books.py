"""Export real independently verified TreasureMonkey books to Storybook."""
import json
from pathlib import Path
APP=Path(__file__).resolve().parents[1]
SDK=APP.parents[2]/'math-sdk/games/TreasureMonkey'
OUT=APP/'src/stories/data'
def export(name,modes):
    selected={}
    for mode in modes:
        source=SDK/f'library/configs/verified_fixtures_{mode}.json'
        for label,book in json.loads(source.read_text(encoding='utf-8')).items():
            selected.setdefault((mode,book['id']),book)
    books=list(selected.values());events={}
    for book in books:
        for event in book['events']:events.setdefault(event['type'],event)
    header='// Generated from independently verified TreasureMonkey published books by design/sync_story_books.py.\n'
    for suffix,data in [('books',books),('events',events)]:
        (OUT/f'{name}_{suffix}.ts').write_text(header+'export default '+json.dumps(data,indent=1)+';\n',encoding='utf-8')
    print(f'{name}: {len(books)} real books from {modes}; events {sorted(events)}')
if __name__=='__main__':
    export('base',['base'])
    export('bonus',['bonus','bonus_hits','bonus_epic'])
