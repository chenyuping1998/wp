// Compact generated Spine skeletons in the upload build without changing the
// editable source files. Spine consumes JSON data, so whitespace is unnecessary.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), process.argv[2] ?? 'build', 'assets', 'spines');
if (!fs.existsSync(root)) throw new Error(`Missing built Spine assets: ${root}`);

let files = 0;
let before = 0;
let after = 0;
function visit(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			visit(file);
			continue;
		}
		if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
		const source = fs.readFileSync(file, 'utf8');
		const compact = JSON.stringify(JSON.parse(source));
		// Parse again before replacing the build output, so a bad serialization
		// fails the build rather than shipping a broken character rig.
		JSON.parse(compact);
		const temp = `${file}.compact-tmp`;
		fs.writeFileSync(temp, compact);
		fs.renameSync(temp, file);
		files++;
		before += Buffer.byteLength(source);
		after += Buffer.byteLength(compact);
	}
}
visit(root);
if (files === 0) throw new Error(`No built Spine JSON files found in ${root}`);
console.log(`Spine JSON: ${files} files, ${(before / 1048576).toFixed(2)} → ${(after / 1048576).toFixed(2)} MiB`);
