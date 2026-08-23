// Every path built with moveTo/lineTo must be committed by stroke(), not
// swallowed by a later fill().
//
// This is a Pixi v8 trap with two silent symptoms:
//
//   * the path draws NOTHING, because it sits in the buffer unrendered, or
//   * the path is swallowed by the NEXT fill() and comes out as a solid shape
//
// The win lines hit the second. `lineStyle()` in the v7 compat layer only sets a
// style - it commits nothing - so a polyline built with moveTo/lineTo and never
// stroked stayed in the path buffer until the fill() that drew the little node
// circles picked the whole thing up. Nine paylines rendered as nine filled
// polygons across the board.
//
// Two inherited components had the first symptom and nobody had noticed:
// ScatterTrigger's corner brackets and Anticipation's chevrons were building
// paths with no commit at all and simply never appeared.
//
// Neither the type checker nor the build can see either one - every call is a
// real method with the right arguments.
//
// SO THIS WALKS THE CALLS IN ORDER. A first version only counted "does this
// callback commit at all", which the buggy win lines PASSED: the node circles
// were filling, so the count was non-zero. Order is the whole point.
//
// Usage: node design/check_graphics_paths.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const COMPONENTS = path.join(appRoot, 'src/components');

// Any g.<method>( in source order.
const CALL = /\bg\.([a-zA-Z]+)\s*\(/g;

const BUILD = new Set(['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arcTo']);
const STROKE = new Set(['stroke']);
const FILL = new Set(['fill', 'endFill']);
// The v7 compat shapes commit themselves and reset the buffer, so they close an
// open path.
const AUTO_SHAPE = new Set(['drawCircle', 'drawRect', 'drawRoundedRect', 'drawPolygon', 'drawEllipse']);
// The v8 primitives do NOT. They ADD to the current path, exactly like lineTo,
// and only fill()/stroke() commit it. Modelling these as commits is what made
// the first version of this guard pass the very bug it was written for: the win
// lines went moveTo -> lineTo -> circle() -> fill(), and the fill took the
// polyline with it.
const PATH_SHAPE = new Set(['circle', 'rect', 'roundRect', 'ellipse', 'poly', 'arc']);
const CLEAR = new Set(['clear']);

// A polyline that is deliberately filled - a closed shape drawn point by point.
// Mark the callback with this comment and the fill check is skipped for it.
const ALLOW = 'graphics-path: polyline is filled on purpose';

const problems = [];
let checked = 0;

const walk = (dir, out = []) => {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) walk(full, out);
		else if (e.name.endsWith('.svelte')) out.push(full);
	}
	return out;
};

for (const file of walk(COMPONENTS)) {
	const source = fs.readFileSync(file, 'utf8');
	const rel = path.relative(appRoot, file);

	let from = 0;
	while (true) {
		const start = source.indexOf('draw={(g)', from);
		if (start === -1) break;
		const end = source.indexOf('\n\t\t\t}}', start);
		const body = source.slice(start, end === -1 ? source.length : end);
		from = start + 1;
		checked += 1;

		const allowFill = body.includes(ALLOW);
		const lineOf = (offset) => source.slice(0, start + offset).split('\n').length;

		// `open` is the offset where the current uncommitted path started.
		let open = -1;
		for (const m of body.matchAll(CALL)) {
			const method = m[1];
			if (BUILD.has(method)) {
				if (open === -1) open = m.index;
			} else if (PATH_SHAPE.has(method)) {
				// adds to the path; does not commit. An open polyline stays open.
			} else if (STROKE.has(method) || AUTO_SHAPE.has(method) || CLEAR.has(method)) {
				open = -1;
			} else if (FILL.has(method)) {
				if (open !== -1 && !allowFill) {
					problems.push(
						`${rel}:${lineOf(open)}  a moveTo/lineTo path is committed by ${method}() with no ` +
							`stroke() first - it will render as a FILLED shape, not a line`,
					);
				}
				open = -1;
			}
		}

		if (open !== -1) {
			problems.push(
				`${rel}:${lineOf(open)}  a moveTo/lineTo path is never committed - ` +
					`it will not render at all`,
			);
		}
	}
}

if (problems.length > 0) {
	console.log(`  !! ${problems.length} graphics path problem(s)`);
	for (const p of problems) console.log(`     ${p}`);
	console.log('  A path built with moveTo/lineTo renders only when stroke() commits it.');
	console.log(`  If a polyline really is meant to be filled, say so with: ${ALLOW}`);
	process.exit(1);
}

console.log(`OK: every graphics path is committed by a stroke (${checked} draw callback(s))`);
