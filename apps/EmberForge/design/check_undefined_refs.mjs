// Catches the one class of bug that neither `vite build` nor svelte-check sees:
// a Svelte template referencing an identifier that the script never declares.
// It bit us once already (Game.svelte used `filters={backgroundBlur}` after a
// patch silently failed to insert the declaration) — the build passed and the
// game only died at runtime with "backgroundBlur is not defined".
// Usage: node design/check_undefined_refs.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'src');

// identifiers that are always available and must not be reported
const GLOBALS = new Set([
	'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Set', 'Map',
	'console', 'window', 'document', 'performance', 'requestAnimationFrame', 'setTimeout',
	'setInterval', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity', 'globalThis',
	'Promise', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'Symbol',
	// keywords the identifier regex would otherwise pick up
	'if', 'else', 'return', 'const', 'let', 'var', 'await', 'async', 'function', 'new',
	'typeof', 'instanceof', 'in', 'of', 'for', 'while', 'do', 'switch', 'case', 'break',
	'continue', 'try', 'catch', 'finally', 'throw', 'this', 'void', 'delete', 'yield',
]);

// remove comments and string literals so their contents aren't read as code.
// Template literals keep their ${…} interiors — those really are expressions.
const stripLiterals = (code) => {
	let out = code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
	out = out.replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""');
	// walk backticks manually: drop the literal text, keep each ${…} body
	let result = '';
	for (let i = 0; i < out.length; i++) {
		if (out[i] !== '`') {
			result += out[i];
			continue;
		}
		i++;
		while (i < out.length && out[i] !== '`') {
			if (out[i] === '\\') {
				i += 2;
				continue;
			}
			if (out[i] === '$' && out[i + 1] === '{') {
				i += 2;
				let depth = 1;
				let body = '';
				while (i < out.length && depth > 0) {
					if (out[i] === '{') depth++;
					else if (out[i] === '}') depth--;
					if (depth > 0) body += out[i];
					i++;
				}
				result += `(${body})`;
				continue;
			}
			i++;
		}
	}
	return result;
};

// pull out every balanced {…} region of the markup, at any nesting depth
const markupExpressions = (markup) => {
	const found = [];
	for (let i = 0; i < markup.length; i++) {
		if (markup[i] !== '{') continue;
		let depth = 0;
		const start = i;
		for (let j = i; j < markup.length; j++) {
			if (markup[j] === '{') depth++;
			else if (markup[j] === '}' && --depth === 0) {
				found.push(markup.slice(start + 1, j));
				i = j;
				break;
			}
		}
	}
	return found;
};

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.name.endsWith('.svelte') ? [full] : [];
	});

let problems = 0;

for (const file of walk(SRC)) {
	const source = fs.readFileSync(file, 'utf8');

	// split script blocks from markup
	const scripts = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
	const markup = source.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

	// everything the script makes available
	const declared = new Set();
	for (const m of scripts.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
	for (const m of scripts.matchAll(/import\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
	for (const m of scripts.matchAll(/import\s*\{([^}]*)\}/g)) {
		for (const part of m[1].split(',')) {
			const name = part.trim().split(/\s+as\s+/).pop()?.trim();
			if (name) declared.add(name.replace(/^type\s+/, ''));
		}
	}
	// destructuring: const { a, b } = ... / const [a, b] = ...
	for (const m of scripts.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
		for (const part of m[1].split(',')) {
			const name = part.split(':').pop()?.split('=')[0]?.trim();
			if (name && /^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name);
		}
	}

	// names the markup itself introduces: {#each x as item}, {#snippet f(a)},
	// {@const y = …}, {#if x}{:then v}, bind:this etc.
	// `[^\n]` rather than `[^}]`: the each EXPRESSION can contain braces of its
	// own — an inline object literal, a nested call — and stopping at the first
	// `}` never reached the `as`, so the binding looked undeclared. An each tag is
	// written on one line, which is the bound that actually holds.
	for (const m of markup.matchAll(/\{#each\b[^\n]*?\s+as\s+([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?/g)) {
		declared.add(m[1]);
		if (m[2]) declared.add(m[2]);
	}
	for (const m of markup.matchAll(/\{#each\b[^\n]*?\s+as\s+\{([^}]*)\}/g)) {
		for (const part of m[1].split(',')) {
			const name = part.split(':').pop()?.trim();
			if (name) declared.add(name);
		}
	}
	for (const m of markup.matchAll(/\{#snippet\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) {
		declared.add(m[1]);
		for (const part of m[2].split(',')) {
			const name = part.split(':')[0]?.replace(/[{}]/g, '').trim();
			if (name) declared.add(name);
		}
	}
	for (const m of markup.matchAll(/\{@const\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
	for (const m of markup.matchAll(/\{:then\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
	for (const m of markup.matchAll(/\{:catch\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
	// snippet params destructured: {#snippet children({ a, b })}
	for (const m of markup.matchAll(/\{#snippet\s+\w+\s*\(\s*\{([^}]*)\}/g)) {
		for (const part of m[1].split(',')) {
			const name = part.split(':').pop()?.trim();
			if (name) declared.add(name);
		}
	}

	// leading identifier of every markup expression
	const referenced = new Map();
	for (const rawExpr of markupExpressions(markup)) {
		if (/^[#/:@]/.test(rawExpr.trim())) continue; // block syntax handled above
		const expr = stripLiterals(rawExpr);

		// an inline callback brings its own scope: params and any locals it declares
		const local = new Set();
		// innermost paren group only, so `filter((b) => …)` yields `b`, not the
		// whole enclosing expression
		for (const m of expr.matchAll(/(?:\(([^()]*)\)|([A-Za-z_$][\w$]*))\s*=>/g)) {
			for (const part of (m[1] ?? m[2] ?? '').split(',')) {
				const name = part.split(':')[0]?.replace(/[{}[\].]/g, '').trim();
				if (name && /^[A-Za-z_$][\w$]*$/.test(name)) local.add(name);
			}
		}
		for (const m of expr.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) local.add(m[1]);
		for (const m of expr.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
			for (const part of m[1].split(',')) {
				const name = part.split(':').pop()?.split('=')[0]?.trim();
				if (name && /^[A-Za-z_$][\w$]*$/.test(name)) local.add(name);
			}
		}

		for (const idm of expr.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)/g)) {
			const name = idm[2];
			if (GLOBALS.has(name) || local.has(name)) continue;
			// skip object-literal keys — `{ fill: x }` reads `fill` as a name
			if (new RegExp(`\\b${name}\\s*:`).test(expr)) continue;
			if (!referenced.has(name)) referenced.set(name, rawExpr.trim().replace(/\s+/g, ' ').slice(0, 60));
		}
	}

	for (const [name, expr] of referenced) {
		if (declared.has(name)) continue;
		// also allow anything that appears anywhere in the script (loose escape
		// hatch for patterns this crude parser misses)
		if (new RegExp(`\\b${name}\\b`).test(scripts)) continue;
		console.log(`  !! ${path.relative(appRoot, file)}: "${name}" used in template but never declared  →  {${expr}}`);
		problems++;
	}
}

console.log(problems === 0 ? 'OK: no undefined template references' : `${problems} problem(s) found`);
process.exit(problems === 0 ? 0 : 1);
