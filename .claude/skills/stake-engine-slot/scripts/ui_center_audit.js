// Text-centring audit — paste into the running game (Browser pane:
// javascript_tool) after the game has loaded. Pickle Panic 2026-10-16: an '∞'
// sat low on its round badge and the user had to point at it; a sweep then found
// four more (autoplay-menu ∞, bet-menu ± signs, bar and portrait readouts 3-4px
// low). None were visible at a glance at 1x; all were measurable.
//
// Three checks, each returns only the offenders:
//
//   __centerAudit.html()          every HTML text inside a button/bordered box:
//                                 ink centre vs box centre (px). Opens nothing —
//                                 open each modal (autoplay incl. ADVANCED, bet
//                                 menu, buy menu, buy confirm, settings, message,
//                                 replay card) and run it once per modal.
//   __centerAudit.glyphs()        every visible single-line pixi Text whose ink
//                                 centre differs from the same face's capitals by
//                                 >6% of the font size: a glyph the face lacks fell
//                                 back to another font ('∞', '±', emoji, CJK) and
//                                 will sit off-centre on whatever plate was tuned
//                                 for the caps. capsLowInBoxPct is context: pixi's
//                                 text box includes the accent of 'É', so even
//                                 plain capitals sit ~8% of the font size BELOW the
//                                 box centre (Bungee/Anton). anchor 0.5 is not
//                                 optical centre — that is why stacked readouts and
//                                 plates read low until offset.
//                                 Calibrated 2026-10-16: Anton '∞' 6.8% (flagged),
//                                 '$' in a money string 5.3% (not), Bungee '∞' 1%.
//   __centerAudit.plate(x0,x1,y0,y1,isPlate)
//                                 pixel scan of a vertical band through a pixi
//                                 plate (bar strip, portrait Balance/Win/Bet tile,
//                                 FS counter …): plate rows vs ink rows, returns the
//                                 offset in px (+ = text sits low). isPlate(r,g,b)
//                                 says which colour is the plate; default is a
//                                 light paper/cream fill. Take x0..x1 through glyphs
//                                 (not a gap) and y0..y1 a little past the plate.
//
// Tolerance: 1px for HTML, 1px for plates. Fix with layout (theme offsets,
// inkOffsetY in components-ui-pixi/src/inkCenter.ts, CSS-drawn signs) — never by
// nudging one game's string.
(() => {
	const ctx = document.createElement('canvas').getContext('2d');
	const app = globalThis.__PIXI_APP__;

	const html = (minPx = 1) => {
		const out = [];
		const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		while (tw.nextNode()) {
			const n = tw.currentNode;
			const txt = n.textContent.trim();
			if (!txt) continue;
			const el = n.parentElement;
			const cs = getComputedStyle(el);
			if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
			const r = document.createRange();
			r.selectNodeContents(n);
			const rr = r.getBoundingClientRect();
			if (!rr.width || rr.bottom < 0 || rr.top > innerHeight) continue;
			let b = el;
			while (b && b !== document.body) {
				const s = getComputedStyle(b);
				const h = b.getBoundingClientRect().height;
				if (b.tagName === 'BUTTON' || b.getAttribute('role') === 'button' ||
					(parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') ||
					(s.backgroundColor !== 'rgba(0, 0, 0, 0)' && h < 90)) break;
				b = b.parentElement;
			}
			if (!b || b === document.body) continue;
			const br = b.getBoundingClientRect();
			if (br.height > 90) continue;
			// skip a box holding two lines of text: judge the block, not each line
			if (b.innerText.trim().includes('\n')) continue;
			ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
			const m = ctx.measureText(txt);
			const base = rr.top + rr.height / 2 + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
			const ink = base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
			const dy = ink - (br.top + br.height / 2);
			const dx = rr.left + rr.width / 2 - (br.left + br.width / 2);
			if (Math.abs(dy) >= minPx || Math.abs(dx) >= 3 * minPx)
				out.push({ text: txt.slice(0, 24), dy: +dy.toFixed(1), dx: +dx.toFixed(1), box: `${Math.round(br.width)}x${Math.round(br.height)}` });
		}
		return out;
	};

	const glyphs = (minRel = 0.06) => {
		if (!app) return 'no window.__PIXI_APP__';
		const out = [];
		const walk = (o) => {
			if (!o.visible || o.worldAlpha === 0) return;
			if (o.text !== undefined && o.style && String(o.text).trim() && !String(o.text).includes('\n')) {
				const st = o.style;
				const fam = Array.isArray(st.fontFamily) ? st.fontFamily.join(',') : st.fontFamily;
				ctx.font = `${st.fontStyle || 'normal'} normal ${st.fontWeight || 'normal'} ${st.fontSize}px ${fam}`;
				const box = ctx.measureText('|ÉqÅM'); // pixi's own box metrics string
				const mid = (t) => {
					const m = ctx.measureText(t);
					return (box.actualBoundingBoxAscent - box.actualBoundingBoxDescent) / 2 -
						(m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
				};
				// Relative to the same face's capitals, which every plate offset was
				// tuned against: only a glyph that sits differently from 'M' is news.
				const rel = (mid(String(o.text)) - mid('M')) / st.fontSize;
				if (Math.abs(rel) >= minRel)
					out.push({ text: String(o.text).slice(0, 24), lowerThanCapsByFontPct: +(rel * 100).toFixed(1), capsLowInBoxPct: +((mid('M') / st.fontSize) * 100).toFixed(1) });
			}
			(o.children || []).forEach(walk);
		};
		walk(app.stage);
		return out;
	};

	const cream = (r, g, b) => r > 215 && g > 200 && b > 150;
	const plate = (x0, x1, y0, y1, isPlate = cream) => {
		if (!app) return 'no window.__PIXI_APP__';
		const R = app.stage.getBounds().rectangle.constructor;
		const p = app.renderer.extract.pixels({ target: app.stage, frame: new R(x0, y0, x1 - x0, y1 - y0), resolution: 1 });
		const W = p.width;
		const rows = [];
		for (let r = 0; r < p.height; r++) {
			let n = 0;
			for (let c = 0; c < W; c++) {
				const i = (r * W + c) * 4;
				if (isPlate(p.pixels[i], p.pixels[i + 1], p.pixels[i + 2])) n++;
			}
			rows.push(n === W ? 'p' : n > 0 ? 'm' : 'x');
		}
		const s = rows.join('');
		const pT = s.indexOf('p'), pB = s.lastIndexOf('p');
		if (pT < 0) return { error: 'no plate rows — adjust isPlate or the band' };
		const inner = s.slice(pT, pB + 1);
		const iT = pT + inner.search(/[mx]/);
		const iB = pT + inner.length - 1 - [...inner].reverse().join('').search(/[mx]/);
		return { plate: [y0 + pT, y0 + pB], ink: [y0 + iT, y0 + iB], lowBy: (iT + iB - (pT + pB)) / 2, rows: s };
	};

	window.__centerAudit = { html, glyphs, plate };
	return 'window.__centerAudit ready: html(), glyphs(), plate(x0,x1,y0,y1[,isPlate])';
})();
