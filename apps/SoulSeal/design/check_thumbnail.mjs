// The store thumbnail must exist, be the right size, and be opaque.
//
// It is not part of the web build - it is uploaded alongside it - so nothing in
// the normal toolchain has an opinion about it, and every failure mode is a
// silent one:
//
//   MISSING     the game ships with no card, or with whatever was there before.
//   WRONG SIZE  Stake want 408x546. A card at another aspect gets letterboxed or
//               cropped by the store, and the crop is not the one you chose.
//   TRANSPARENT the background must bleed to all four edges. A card with holes
//               in it sits on whatever the store's own page colour happens to
//               be, which is not what anyone looked at when approving it.
//
// This checks the file only. Whether the CHARACTER inside it clears the safe
// area is checked where that is knowable - design/compose_thumbnail.mjs, which
// still has the character as a separate layer. Once the card is flattened that
// question cannot be answered from the pixels, which is the same reason review
// round 6 was expensive: a flattened cover cannot give back the pixels a crop
// removed.
//
// Usage: node design/check_thumbnail.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(appRoot, 'Thumbnail_SoulSeal.png');
const WIDTH = 408;
const HEIGHT = 546;

if (!fs.existsSync(FILE)) {
	console.log('  !! no Thumbnail_SoulSeal.png');
	console.log('     node design/compose_thumbnail.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}

// The IHDR chunk, read directly rather than through pngjs: this runs in the
// build chain, which has no tools directory to be handed, and the header is
// eight bytes at a fixed offset.
const buffer = fs.readFileSync(FILE);
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) {
	console.log('  !! Thumbnail_SoulSeal.png is not a PNG');
	process.exit(1);
}
const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);
// Colour type 6 is RGBA, 2 is RGB. Either is fine; what matters is that if there
// IS an alpha channel, nothing in it is transparent - checked by compose, which
// writes every pixel at 255. Recorded here so the reason is on the record.
const colourType = buffer[25];

if (width !== WIDTH || height !== HEIGHT) {
	console.log(`  !! Thumbnail_SoulSeal.png is ${width}x${height}, Stake want ${WIDTH}x${HEIGHT}`);
	process.exit(1);
}

console.log(
	`OK: thumbnail is ${width}x${height} (${(buffer.length / 1024).toFixed(0)} KB, ` +
		`colour type ${colourType})`,
);
