// Paste into the Pragmatic Play game page through the browser tool's javascript_tool, once the game has loaded.
// Defines window.__pp with helpers that read the LIVE scene (game00N.json's serializer misaligns fields, the live
// components do not). Nothing here talks to the network.
//
//   __pp.find(/Main\/Reels\/SymbolsManager\/Symbols\/S05$/)   -> Transform
//   __pp.tree(transform)                                      -> text: objects, Spine/V3Animator settings, CAT events
//   __pp.own(component)                                       -> plain object of a component's fields
//   __pp.of('TumblingManager_GRM')                            -> every live instance of a class
//   __pp.record() / __pp.log                                  -> timeline of CAT events, V3Animator plays and tumbles,
//                                                                stamped with Time.time (game clock; the pane throttles rAF)
(() => {
	const pathOf = tr => { const p = []; while (tr) { p.unshift(tr.gameObject ? tr.gameObject.name : '?'); tr = tr.parent; } return p.join('/'); };
	const short = tr => pathOf(tr)
		.replace(/^GameRoot\/UI Root\/XTRoot\/Root\/Game\//, '')
		.replace(/Main\/Reels\/ReelsManager\/Reel(\d)\/Pos(\d+)\/(S\d+)\(Clone\)(\/CAT)?/, 'R$1P$2:$3');

	// Every component in the scene, from every root.
	const all = [];
	// Seed from objects the game registers on its XT bus: works even when the pane has stopped the game loop
	// (Time.time frozen), which a per-frame Update hook would not.
	const roots = new Set();
	const collect = () => {
		for (const k of ['ReelsManagerObject', 'CoinCounterObject']) {
			let s = null; try { s = XT.GetObject(Vars[k] || k); } catch (e) { }
			if (s && s.transform) { let r = s.transform; while (r.parent) r = r.parent; roots.add(r); }
		}
		all.length = 0;
		const walk = tr => { for (const c of tr.gameObject.components) all.push(c); for (const ch of tr.children || []) walk(ch); };
		for (const r of roots) walk(r);
		return all.length;
	};

	const SKIP = new Set(['parent', 'gameObject', 'transform', '_rawData', '_model', 'flags', 'internalUpdateIdx', 'enabled',
		'skeleton', 'state', 'spineData', 'skeletonData', 'atlas', 'renderer', 'mesh', 'material', 'pixiObject', 'spine', 'callback']);
	const fmt = (v, d = 0) => {
		if (v == null || typeof v !== 'object') return typeof v === 'number' ? +v.toFixed(3) : typeof v === 'function' ? undefined : v;
		if (v.transform && v.gameObject) return v.constructor.name + '@' + short(v.transform);
		if (v.transform && v.components) return 'GO@' + short(v.transform);
		if (d > 4) return '…';
		if (Array.isArray(v)) return v.slice(0, 16).map(x => fmt(x, d + 1));
		const o = {}; for (const k of Object.keys(v)) { if (SKIP.has(k) || k.endsWith('@GUID')) continue; const s = fmt(v[k], d + 1); if (s !== undefined) o[k] = s; } return o;
	};
	const own = c => { const o = {}; for (const k of Object.keys(c)) { if (SKIP.has(k) || k.endsWith('@GUID')) continue; const s = fmt(c[k], 1); if (s !== undefined) o[k] = s; } return o; };
	const crv = c => c && c.keys ? c.keys.map(k => `${+k.time.toFixed(3)}:${+k.value.toFixed(3)}`).join(' ') : '';
	const AP = ['Pos', 'Scale', 'LocPos', 'Rot'];
	const LINK = ['Start', 'Stop', 'StopAll', 'Start~', 'StopOthers']; // CAT_Action_CATLink.ActionType; ~ = no wait

	const comp = k => {
		const n = k.constructor.name;
		if (n === 'SpineController') return `Spine[${k.animationName}${k.animationMode === 2 ? ' loop' : ''}${k.onEnable ? ' onEnable' : ''}]`;
		if (n === 'V3Animator') return `V3[${AP[k.animationProperty]} ${+k.animationTime.toFixed(3)}s from=${JSON.stringify(k.useManualFrom ? k.manualFrom : 'obj')} to=${JSON.stringify(k.useManualTo ? k.manualTo : 'obj')} {${crv(k.animationCurve)}}]`;
		if (n === 'Animation') return `Anim[${k.clip && k.clip.name}]`;
		if (/ColorAnimator|AlphaAnimator|TwoValuesAnimator/.test(n)) return n + JSON.stringify(own(k)).slice(0, 300);
		return null;
	};
	const catTxt = c => {
		const name = (cat, id) => { const e = cat && cat.events && cat.events.find(e => e.id === id); return e ? e.userFriendlyName : '#' + id; };
		return c.events.map(e => `▶ ${e.userFriendlyName}\n` + e.actions.map(a => {
			const t = a.constructor.name.replace('CAT_Action_', '');
			let s;
			if (t === 'CATLink') { const cat = a.eventId && a.eventId.cat; s = `${LINK[a.actionType]} ${cat === c ? '' : short(cat.transform) + ':'}${name(cat, a.eventId.id)}`; }
			else if (t === 'ObjActivate') s = `on[${(a.ToEnableList || []).map(g => g.name)}] off[${(a.ToDisableList || []).map(g => g.name)}]`;
			else if (t === 'SendMessage') s = `${a.data.eventReceiver && a.data.eventReceiver.name}.${a.data.methodToCall}`;
			else if (t === 'SwitchLayer') s = 'layer ' + a.newLayer.mask;
			else if (/AudioClip/.test(t)) s = '♪';
			else if (/SpineAnimation/.test(t)) s = `${short(a.controller.transform)} ${a.animationName}${a.animationMode === 2 ? ' loop' : ''}`;
			else s = JSON.stringify(fmt(a, 1)).replace(/"delay":[^,}]*,?/, '').slice(0, 240);
			return `   ${a.delay ? ('+' + (+a.delay.toFixed(3)) + 's').padEnd(8) : '        '}${t} ${s}`;
		}).join('\n')).join('\n');
	};
	const tree = (tr, d = 0, out = []) => {
		const go = tr.gameObject, pad = '  '.repeat(d);
		const cs = go.components.map(comp).filter(Boolean);
		out.push(pad + go.name + (go.activeSelf ? '' : ' (off)') + (cs.length ? '  ' + cs.join(' | ') : ''));
		for (const k of go.components) if (k.constructor.name === 'CAT_Container') out.push(catTxt(k).split('\n').map(l => pad + '  ' + l).join('\n'));
		for (const ch of tr.children) tree(ch, d + 1, out);
		return out.join('\n');
	};

	const log = [];
	const record = () => {
		const L = s => log.push((+Time.time.toFixed(3)) + ' ' + s);
		const os = CAT_Event.prototype.Start;
		CAT_Event.prototype.Start = function () {
			try { const p = this.parent && this.parent.transform ? short(this.parent.transform) : '?'; if (!/Trex|AnteBet|FeaturePurchase|ClientRoot|Interface/.test(p)) L(`CAT ${p} ▶ ${this.userFriendlyName}`); } catch (e) { }
			return os.apply(this, arguments);
		};
		const ov = V3Animator.prototype.Play;
		V3Animator.prototype.Play = function () { const r = ov.apply(this, arguments); try { L(`V3 ${short(this.transform)} ${this.animationTime}s`); } catch (e) { } return r; };
		if (window.SymbolTumbler_GRM) {
			const ot = SymbolTumbler_GRM.prototype.StartTumble;
			SymbolTumbler_GRM.prototype.StartTumble = function () { L(`TUMBLE ${short(this.transform)} ${+this.initialPosY.toFixed(1)}→${+this.targetPosY.toFixed(1)} ${this.tumbleDuration}s`); return ot.apply(this, arguments); };
		}
		return 'recording';
	};

	window.__pp = {
		collect, all, pathOf, short, own, tree, catTxt, log, record,
		find: re => { if (!all.length) collect(); const c = all.find(c => re.test(pathOf(c.transform))); return c && c.transform; },
		of: cls => { if (!all.length) collect(); return all.filter(c => c.constructor.name === cls); },
	};
	return `ready — ${collect()} components`;
})();
