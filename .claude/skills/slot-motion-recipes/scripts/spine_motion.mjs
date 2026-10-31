// Summarise a Spine 3.7 skeleton's animations: per bone timeline, key times and value ranges.
// Usage: node spine_motion.mjs <skeleton.json> [animFilter]
import fs from 'node:fs';
const [, , file, filt] = process.argv;
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const bones = Object.fromEntries((j.bones || []).map(b => [b.name, b]));
const r = n => +(+n).toFixed(2);
for (const [an, a] of Object.entries(j.animations || {})) {
	if (filt && !an.includes(filt)) continue;
	console.log(`\n## ${an}`);
	for (const [bn, tl] of Object.entries(a.bones || {})) {
		const parts = [];
		for (const [kind, keys] of Object.entries(tl)) {
			const vals = keys.map(k => kind === 'rotate' ? (k.angle ?? 0) : kind === 'translate' ? [k.x ?? 0, k.y ?? 0] : [k.x ?? 1, k.y ?? 1]);
			const times = keys.map(k => r(k.time ?? 0));
			let range;
			if (kind === 'rotate') range = `${r(Math.min(...vals))}..${r(Math.max(...vals))}°`;
			else { const xs = vals.map(v => v[0]), ys = vals.map(v => v[1]); range = `x ${r(Math.min(...xs))}..${r(Math.max(...xs))} y ${r(Math.min(...ys))}..${r(Math.max(...ys))}`; }
			const stepped = keys.some(k => k.curve === 'stepped') ? ' stepped' : '';
			const seq = kind === 'rotate' ? vals.map(r).join(',') : vals.map(v => v.map(r).join('/')).join(' ');
			parts.push(`${kind}[${keys.length}] t=${times.join(',')} ${range}${stepped}${keys.length <= 8 ? '  {' + seq + '}' : ''}`);
		}
		console.log(`  ${bn}${bones[bn]?.parent ? ' <' + bones[bn].parent : ''}: ${parts.join(' | ')}`);
	}
	for (const [sn, tl] of Object.entries(a.slots || {})) {
		const parts = [];
		if (tl.attachment) parts.push(`att ${tl.attachment.map(k => r(k.time ?? 0) + ':' + (k.name ?? '∅')).join(' ')}`);
		if (tl.color) parts.push(`color ${tl.color.map(k => r(k.time ?? 0) + ':' + k.color).join(' ')}`);
		if (parts.length) console.log(`  [slot] ${sn}: ${parts.join(' | ')}`);
	}
	if (a.deform) console.log(`  [deform] ${Object.values(a.deform).flatMap(s => Object.keys(s)).length} slots`);
	if (a.events) console.log(`  [events] ${a.events.map(e => r(e.time) + ':' + e.name).join(' ')}`);
	if (a.drawOrder) console.log(`  [drawOrder] ${a.drawOrder.length} keys`);
}
