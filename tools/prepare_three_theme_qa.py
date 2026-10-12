"""Make local-only browser QA shells from the three built themes and Jade books.

Run with the math-sdk Python environment (contains zstandard). Never deploy
these shells: they replace RGS with design/playtest_stub.js.
"""
from pathlib import Path
import io
import json
import shutil
import zstandard as zstd

ROOT = Path(__file__).resolve().parents[1]
MATH = ROOT.parents[0] / 'math-sdk/games/JadeTeahouse/library/publish_files'
SHELLS = (
    ('MonkeyKingRush齊天大聖', 'qa_mk_20261009'),
    ('PochaMonkey韓式路邊攤', 'qa_pocha_20261009'),
    ('SwingMonkey爵士俱樂部', 'qa_swing_20261009'),
)

def first_book(mode):
    with (MATH / f'books_{mode}.jsonl.zst').open('rb') as compressed:
        stream = io.TextIOWrapper(zstd.ZstdDecompressor().stream_reader(compressed), encoding='utf8')
        return json.loads(next(stream))

books = {'BASE': first_book('base'), 'BONUS': first_book('bonus'),
         'SUPERBONUS': first_book('superbonus')}
data = {name: {'cost': cost, 'pool': [books[name]['id']],
               'books': {str(books[name]['id']): books[name]}}
        for name, cost in [('BASE', 1), ('BONUS', 100), ('SUPERBONUS', 150)]}
stub_data = 'window.__STUB_DATA__ = ' + json.dumps(data, ensure_ascii=False) + '; window.__STUB_CATALOGUE__ = {};'
for app, folder in SHELLS:
    source = ROOT / 'apps' / app
    target = ROOT.parent / 'tmp' / folder
    shutil.copytree(source / 'build', target, dirs_exist_ok=True)
    shutil.copyfile(source / 'design/playtest_stub.js', target / 'stub.js')
    (target / 'stub-data.js').write_text(stub_data, encoding='utf8')
    index = target / 'index.html'
    html = index.read_text(encoding='utf8')
    html = html.replace('<head>', '<head><script src="./stub-data.js"></script><script src="./stub.js"></script>', 1)
    index.write_text(html, encoding='utf8')
    print(target)
