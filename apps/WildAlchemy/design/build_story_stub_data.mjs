import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'src/stories/data', name), 'utf8').replace(/^.*?export default\s*/s, '').replace(/;\s*$/, ''));
const base = read('base_books.ts');
const bonus = read('bonus_books.ts');
const catalogue = (books) => {
	const out = { maxWin: null, searchlight: null, doubling: null, fullBeam: null };
	for (const book of books) {
		if (out.maxWin === null || book.payoutMultiplier > books.find((b) => b.id === out.maxWin).payoutMultiplier) out.maxWin = book.id;
		const lights = book.events.filter((event) => event.type === 'searchlight');
		if (out.searchlight === null && lights.length) out.searchlight = book.id;
		if (out.doubling === null && lights.some((event) => event.lights.some((light) => light.cells.some((cell) => cell.doubled)))) out.doubling = book.id;
		if (out.fullBeam === null && lights.some((event) => event.lights.some((light) => light.cells.length >= 4))) out.fullBeam = book.id;
	}
	return out;
};
const pack = (books, cost) => ({ cost, pool: books.map((b) => b.id), books: Object.fromEntries(books.map((b) => [String(b.id), b])) });
const data = { BASE: pack(base, 1), BONUS: pack(bonus, 100), BONUS_HITS: pack(bonus, 300), BONUS_EPIC: pack(bonus, 600) };
const cat = { BASE: catalogue(base), BONUS: catalogue(bonus), BONUS_HITS: catalogue(bonus), BONUS_EPIC: catalogue(bonus) };
fs.writeFileSync(path.join(root, 'static/stub-data.js'), `window.__STUB_DATA__=${JSON.stringify(data)}\nwindow.__STUB_CATALOGUE__=${JSON.stringify(cat)}\n`);
console.log(cat);
