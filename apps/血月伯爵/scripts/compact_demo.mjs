import fs from 'node:fs';

// Generated reference books contain presentation data, not whitespace-sensitive text.
// Keep all values/events intact and avoid shipping the generator's indentation.
const file = new URL('../static/data/demo-books.json', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const compact = JSON.stringify(JSON.parse(original));
if (compact !== original) {
 fs.writeFileSync(file, compact);
 console.log(`Reference books compacted: ${Buffer.byteLength(original)} → ${Buffer.byteLength(compact)} bytes`);
}
