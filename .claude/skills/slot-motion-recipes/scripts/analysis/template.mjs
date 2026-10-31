// Motion templates: lift an animation off one rig by ROLE (beat, spine, head, look, ear chains...), normalise
// translations by the symbol's unit U, and write it back onto another rig through a role map.
//
//   node template.mjs extract <skeleton> <animation> <roles.json> <U> <out.json>
//   node template.mjs apply   <template.json> <targetSkeleton> <roles.json> <U> <newAnimName> [outName]
//
// roles.json: { "role": "boneName" | ["bone", ...] }. A leading "-" on a bone name mirrors it (rotation and x negated)
// when applying. Reads the 3.7 originals in spine/ (handles are still segment fractions there, so they carry over to
// any rig unchanged) and writes 4.2 into spine-42/ via pp_extract's conversion rules.
import fs from 'node:fs';
import { convert } from '../spine37to42.mjs';

const ROOT = (process.env.RESEARCH ?? 'E:/stake/archive/research/sweet-loot').replaceAll('\\', '/');
const [cmd, ...a] = process.argv.slice(2);
const flat = (roles) => Object.entries(roles).flatMap(([role, v]) => (Array.isArray(v) ? v : [v]).map((b, i) => ({ role, link: i, bone: b })));

if (cmd === 'extract') {
	const [skel, anim, rolesFile, U, out] = a;
	const j = JSON.parse(fs.readFileSync(`${ROOT}/spine/${skel}.json`, 'utf8'));
	const an = j.animations[anim];
	const roles = JSON.parse(fs.readFileSync(rolesFile, 'utf8'));
	const tracks = [];
	for (const { role, link, bone } of flat(roles)) {
		for (const [channel, keys] of Object.entries(an.bones?.[bone] ?? {})) {
			tracks.push({
				role, link, channel,
				keys: keys.map((k) => {
					const o = { f: Math.round((k.time ?? 0) * 30) };
					if (channel === 'rotate') o.v = +(k.angle ?? 0).toFixed(2);
					else if (channel === 'translate') { o.x = +((k.x ?? 0) / +U).toFixed(4); o.y = +((k.y ?? 0) / +U).toFixed(4); }
					else { o.x = +(k.x ?? (channel === 'scale' ? 1 : 0)).toFixed(4); o.y = +(k.y ?? (channel === 'scale' ? 1 : 0)).toFixed(4); }
					if (k.curve) o.curve = k.curve;
					return o;
				}),
			});
		}
	}
	// glow: the additive copies' alpha, averaged per key time (one curve drives every copy)
	const glow = {};
	for (const [slot, tl] of Object.entries(an.slots ?? {})) {
		const sd = j.slots.find((s) => s.name === slot);
		if (sd?.blend !== 'additive' || !tl.color) continue;
		for (const k of tl.color) { const f = Math.round((k.time ?? 0) * 30); (glow[f] ??= []).push(parseInt(k.color.slice(6), 16) / 255); }
	}
	const tpl = {
		source: `${skel} / ${anim}`, fps: 30, frames: Math.round(Math.max(...Object.values(an.bones ?? {}).flatMap((t) => Object.values(t).flatMap((ks) => ks.map((k) => k.time ?? 0)))) * 30),
		unit: 'translate x/y are fractions of U (the symbol frame height); rotate in degrees, relative to setup; scale multiplies setup',
		roles: Object.fromEntries(Object.entries(roles).map(([r, v]) => [r, Array.isArray(v) ? v.length : 1])),
		tracks,
		glowAlpha: Object.entries(glow).map(([f, v]) => ({ f: +f, a: +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(3) })).sort((p, q) => p.f - q.f),
	};
	fs.writeFileSync(out, JSON.stringify(tpl, null, 1));
	console.log(`template: ${tracks.length} tracks, ${tpl.frames} frames -> ${out}`);
} else if (cmd === 'apply') {
	const [tplFile, target, rolesFile, U, animName, outName = `${target}__tpl`] = a;
	const tpl = JSON.parse(fs.readFileSync(tplFile, 'utf8'));
	const roles = JSON.parse(fs.readFileSync(rolesFile, 'utf8'));
	const j = JSON.parse(fs.readFileSync(`${ROOT}/spine/${target}.json`, 'utf8'));
	const map = new Map(flat(roles).map((r) => [`${r.role}#${r.link}`, r.bone]));
	const bones = {};
	let applied = 0, missing = new Set();
	for (const t of tpl.tracks) {
		let bone = map.get(`${t.role}#${t.link}`);
		// a target chain shorter than the template's: drop the extra links; longer: the last template link repeats
		if (!bone) { missing.add(`${t.role}#${t.link}`); continue; }
		const mirror = bone.startsWith('-');
		bone = bone.replace(/^-/, '');
		if (!j.bones.some((b) => b.name === bone)) { missing.add(bone); continue; }
		// The source animation starts from the SOURCE's idle pose, not its setup pose; on another rig that offset is
		// just a wrong pose. Re-base every track on its first key so the template starts (and ends) at rest.
		const k0 = t.keys[0];
		const keys = t.keys.map((k) => {
			const o = { time: +(k.f / 30).toFixed(4) };
			if (t.channel === 'rotate') { const v = k.v - k0.v; o.angle = mirror ? -v : v; }
			else if (t.channel === 'translate') { o.x = +((k.x - k0.x) * +U * (mirror ? -1 : 1)).toFixed(2); o.y = +((k.y - k0.y) * +U).toFixed(2); }
			else if (t.channel === 'shear') { const x = k.x - k0.x; o.x = mirror ? -x : x; o.y = k.y - k0.y; }
			else { o.x = k.x / k0.x; o.y = k.y / k0.y; }
			if (k.curve) o.curve = k.curve;
			return o;
		});
		(bones[bone] ??= {})[t.channel] = keys;
		applied++;
	}
	const slots = {};
	// Which picture each slot shows (eyes open, the right mouth) is set by the target's own animations at frame 0,
	// not by its setup pose: carry its idle's first-frame attachments over, or the eyes stay on the blink drawing.
	const idle = Object.entries(j.animations).find(([n]) => /idle|loop/.test(n))?.[1] ?? Object.values(j.animations)[0];
	for (const [s, tl] of Object.entries(idle?.slots ?? {})) if (tl.attachment) slots[s] = { attachment: [{ time: 0, name: tl.attachment[0].name ?? null }] };
	if (tpl.glowAlpha?.length) for (const s of j.slots.filter((s) => s.blend === 'additive')) {
		(slots[s.name] ??= {}).color = tpl.glowAlpha.map((g) => ({ time: +(g.f / 30).toFixed(4), color: `ffffff${Math.round(g.a * 255).toString(16).padStart(2, '0')}` }));
	}
	// keep the target's own animations next to the applied one, so the gallery can compare them directly
	j.animations = { ...j.animations, [animName]: { bones, slots } };
	fs.writeFileSync(`${ROOT}/spine/${outName}.json`, JSON.stringify(j));
	fs.writeFileSync(`${ROOT}/spine-42/${outName}.json`, JSON.stringify(convert(j)));
	fs.copyFileSync(`${ROOT}/spine-42/${target}.atlas`, `${ROOT}/spine-42/${outName}.atlas`);
	const index = JSON.parse(fs.readFileSync(`${ROOT}/spine-index.json`, 'utf8')).filter((s) => s.name !== outName);
	index.push({ name: outName, derivedFrom: target, animations: Object.keys(j.animations) });
	fs.writeFileSync(`${ROOT}/spine-index.json`, JSON.stringify(index, null, 1));
	console.log(`applied ${applied} tracks onto ${target} as ${outName}/${animName}; unmapped: ${[...missing].join(', ') || 'none'}`);
}
