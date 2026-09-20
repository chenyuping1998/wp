/**
 * The alpha channel of a PNG, with no dependency.
 *
 * check_cast_motion.mjs needs to know which triangles of the cast mesh actually
 * carry ink. The mesh is a plain grid laid over the WHOLE image, so a good
 * third of its triangles sit in the transparent margin around the figure —
 * `guy.rig.json` has 697 vertices and the drawing only occupies the middle of
 * them. Those triangles fold freely under any pose and it is invisible, because
 * there is nothing inside them to crease. Gating on them fails the build for a
 * defect no player can see, which is worse than not gating at all: the first
 * thing anyone does with a gate that cries wolf is delete it.
 *
 * Nothing in the workspace can decode a PNG (no sharp, no pngjs), and pulling a
 * dependency into a build gate to read one channel of one file is a bad trade.
 * zlib is in node's standard library and the rest of PNG is a few lines.
 *
 * Deliberately narrow: 8-bit, non-interlaced, with an alpha channel. That is
 * what the cast rigs are. Anything else THROWS rather than guessing, because a
 * silent wrong answer here turns the gate off without telling anyone.
 */
import zlib from 'zlib';

export function readAlpha(buffer) {
	if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

	let width = 0;
	let height = 0;
	let depth = 0;
	let colorType = 0;
	let interlace = 0;
	const idat = [];
	for (let at = 8; at < buffer.length; ) {
		const length = buffer.readUInt32BE(at);
		const type = buffer.toString('ascii', at + 4, at + 8);
		const data = buffer.subarray(at + 8, at + 8 + length);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			depth = data[8];
			colorType = data[9];
			interlace = data[12];
		} else if (type === 'IDAT') idat.push(data);
		else if (type === 'IEND') break;
		at += length + 12;
	}
	if (depth !== 8) throw new Error(`expected an 8-bit PNG, got ${depth}-bit`);
	if (interlace !== 0) throw new Error('interlaced PNGs are not supported');
	// 6 = RGBA, 4 = grey+alpha. Anything else has no alpha to read.
	if (colorType !== 6 && colorType !== 4) throw new Error(`PNG colour type ${colorType} has no alpha channel`);
	const channels = colorType === 6 ? 4 : 2;

	const raw = zlib.inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const alpha = new Uint8Array(width * height);
	// Undo the per-scanline filters. Each row is prefixed with its filter byte
	// and is predicted from the pixel to its left (a) and the row above (b).
	const previous = Buffer.alloc(stride);
	const current = Buffer.alloc(stride);
	for (let y = 0; y < height; y += 1) {
		const filter = raw[y * (stride + 1)];
		raw.copy(current, 0, y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
		for (let i = 0; i < stride; i += 1) {
			const a = i >= channels ? current[i - channels] : 0;
			const b = previous[i];
			const c = i >= channels ? previous[i - channels] : 0;
			let value = current[i];
			if (filter === 1) value += a;
			else if (filter === 2) value += b;
			else if (filter === 3) value += (a + b) >> 1;
			else if (filter === 4) {
				const p = a + b - c;
				const pa = Math.abs(p - a);
				const pb = Math.abs(p - b);
				const pc = Math.abs(p - c);
				value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			} else if (filter !== 0) throw new Error(`unknown PNG filter ${filter} on row ${y}`);
			current[i] = value & 0xff;
		}
		for (let x = 0; x < width; x += 1) alpha[y * width + x] = current[x * channels + channels - 1];
		current.copy(previous);
	}
	return { width, height, alpha };
}
