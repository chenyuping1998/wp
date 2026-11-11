// Runtime text audit — restricted social words and K/M-abbreviated amounts.
//
// Why this exists (Sushi Monkey, review 2026-10-20): the splash card said
// "capped at 10,000× your bet" in social play, and the bet menu listed
// 1.00K … 750.00K. Both passed every static guard: the sentence was a string
// literal in a <script> array drawn by pixi (check_social_words.mjs only reads
// templates and pick()/ternary branches), and the K labels came from a shared
// component's formatter. Only the text that is ACTUALLY ON SCREEN tells the
// truth, so this reads it: every pixi Text/BitmapText under the stage
// (globalThis.__PIXI_APP__, set by pixi-svelte's InitialiseApplication) and
// every visible DOM text node.
//
// Use: open the game with ?social=true&currency=GC (plus the playtest params),
// paste this file into the console, then
//   __textAudit.scan()          // what is on screen now
// and repeat on every screen: splash, base, bet menu (with a long ladder — see
// below), buy menu + confirm, autoplay (ADVANCED open), settings, info/rules
// (scroll it), pay table, FS intro/outro, big win, replay card, low-balance
// notice. __textAudit.all() lists every hit collected so far, de-duplicated.
//
// The playtest stub's ladder stops at 100, which can never show a K. Swap the
// ladder in the dist copy of stub.js for one that reaches 750000 before
// checking the bet menu, then put the copy of record back.
//
// Hidden pixi nodes (visible=false / zero alpha) are reported with hidden:true:
// they are not on screen now but a state change can show them.
(() => {
	const RESTRICTED = [
		'win feature', 'pay out', 'paid out', 'pays out', 'place your bets', 'at the cost of', 'cost of',
		'buy bonus', 'bonus buy', 'total bet', 'stake', 'betting', 'bet', 'bets', 'rebet', 'cash', 'payer',
		'pay', 'pays', 'paid', 'money', 'buy', 'bought', 'purchase', 'credit', 'gamble', 'wager', 'deposit',
		'withdraw', 'currency', 'fund', 'funds', 'cost', 'payout', 'payline', 'paylines', 'paytable',
	].sort((a, b) => b.length - a.length);
	const wordRe = new RegExp(`(?<![\\w-])(${RESTRICTED.map((t) => t.replace(/ /g, '\\s+')).join('|')})(?![\\w-])`, 'gi');
	// 1.00K, 12K, 3.5M, 2B — an amount shortened with a magnitude letter
	const abbrRe = /(?<![\w.])\d[\d,]*(\.\d+)?\s?[KMB](?![\w])/g;

	const seen = new Map();
	const record = (source, text, extra = {}) => {
		const hits = [];
		for (const m of text.matchAll(wordRe)) hits.push({ kind: 'restricted', match: m[0] });
		for (const m of text.matchAll(abbrRe)) hits.push({ kind: 'abbreviated', match: m[0] });
		for (const h of hits) {
			const key = `${h.kind}|${h.match.toLowerCase()}|${text}`;
			if (!seen.has(key)) seen.set(key, { ...h, source, text: text.slice(0, 160), ...extra });
		}
		return hits.map((h) => ({ ...h, source, text: text.slice(0, 160), ...extra }));
	};

	const pixiTexts = () => {
		const app = globalThis.__PIXI_APP__;
		if (!app?.stage) return { error: 'no globalThis.__PIXI_APP__ — not a pixi-svelte game?' };
		const out = [];
		const walk = (node, hidden) => {
			const h = hidden || node.visible === false || node.alpha === 0 || node.renderable === false;
			if (typeof node.text === 'string' && node.text.trim()) out.push({ text: node.text, hidden: h });
			for (const c of node.children ?? []) walk(c, h);
		};
		walk(app.stage, false);
		return out;
	};

	const domTexts = () => {
		const out = [];
		const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		for (let n = tw.nextNode(); n; n = tw.nextNode()) {
			const t = n.textContent.trim();
			const el = n.parentElement;
			if (!t || !el || el.closest('script,style,noscript')) continue;
			const r = el.getBoundingClientRect();
			const cs = getComputedStyle(el);
			const shown = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0';
			if (shown) out.push(t);
		}
		// attributes a screen reader or tooltip shows
		for (const el of document.querySelectorAll('[aria-label],[title],[alt],[placeholder]')) {
			for (const a of ['aria-label', 'title', 'alt', 'placeholder']) {
				const v = el.getAttribute(a);
				if (v) out.push(v);
			}
		}
		return out;
	};

	const scan = () => {
		const social = new URLSearchParams(location.search).get('social') === 'true';
		const px = pixiTexts();
		const hits = [];
		if (Array.isArray(px)) for (const p of px) hits.push(...record('pixi', p.text, p.hidden ? { hidden: true } : {}));
		for (const t of domTexts()) hits.push(...record('dom', t));
		// restricted words only matter in social play; abbreviations always do
		const shown = hits.filter((h) => social || h.kind === 'abbreviated');
		return {
			social,
			pixiTexts: Array.isArray(px) ? px.length : px.error,
			hits: shown,
			// a throttled (hidden) pane can be scanned before the screen mounts —
			// zero canvas texts is "nothing to judge yet", not a pass
			verdict: shown.filter((h) => !h.hidden).length
				? 'FAIL'
				: Array.isArray(px) && px.length === 0
					? 'EMPTY — no canvas text yet, wait and scan again'
					: 'PASS',
		};
	};

	const all = () => {
		const social = new URLSearchParams(location.search).get('social') === 'true';
		return [...seen.values()].filter((h) => social || h.kind === 'abbreviated');
	};

	globalThis.__textAudit = { scan, all, reset: () => seen.clear() };
	return 'ready: __textAudit.scan() on every screen, __textAudit.all() at the end';
})();
