<script lang="ts" module>
	/** what one blast will show, built by ReelBlast when the blast starts */
	export type BlastPlan = {
		id: number;
		look: import('../game/blastTimeline').BlastLook;
		reels: number[];
		/** the bombs' cells, board px */
		origins: { x: number; y: number }[];
		/** the cells that break: their symbol's art is cut into the shards */
		shardCells: { x: number; y: number; key: string; size: number }[];
		/** the cells holding the symbol the blast will spread */
		sources: { x: number; y: number; key: string; size: number }[];
		/** one per refilled cell: the fill's copy flies from `from` and lands at `to` */
		copies: { from: { x: number; y: number }; to: { x: number; y: number }; key: string; size: number; arriveAt: number; reel: number; row: number }[];
		/** per reel: when its last copy lands (the column flashes after) */
		reelDone: Record<number, number>;
	};
</script>

<script lang="ts">
	/**
	 * THE PULSE BOMB'S SPRITE LAYER, over ReelBlast's Graphics. Everything here
	 * is drawn from the clock ReelBlast already runs (game/blastTimeline.ts),
	 * imperatively, because it is hundreds of sprites a frame:
	 *
	 *   LOCK     during the fuse the symbol the bomb will spread lights up and
	 *            brackets close in on it — the player sees WHICH symbol, and
	 *            where it came from, before anything breaks
	 *   SHARDS   the bang breaks every covered symbol's REAL ART into a 4 x 4
	 *            of pieces that fly from the bomb with spin and gravity, their
	 *            edges flaring in the rung's colours (a hit-stop first on the
	 *            top rungs: the pieces hang a beat, then go)
	 *   PILLAR   the plasma column as soft additive light, not flat bands: three
	 *            layers of glow shimmering sideways, sparks of light rising in it
	 *   COPIES   as the pillar collapses, the chosen symbol is copied out of its
	 *            source cell into each refilled cell, top to bottom, one after
	 *            another, and each lands with a flash (the cell's own landing is
	 *            set off by ReelBlast at the same moment)
	 *   FLASH    when a reel's last copy is in, the whole column flashes once
	 *
	 * Nothing here covers anything: the void that hides the swap is still
	 * ReelBlast's opaque Graphics, underneath.
	 */
	import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { CHARGE_MS, COPY_FLIGHT_MS, phasesAt, pillarAt, type Beats } from '../game/blastTimeline';

	type Props = {
		plan: BlastPlan | null;
		clock: number;
		beats: Beats;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const PIECES = 4;
	const COLUMN_FLASH_MS = 420;

	const root = new Container();
	root.label = 'blastFx';
	parent.addToParent(root);

	const hash = (a: number, b: number, c: number) => {
		const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
		return v - Math.floor(v);
	};
	const easeOut = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

	// the art cut into PIECES x PIECES sub-textures, once per symbol
	const pieceCache = new Map<string, Texture[]>();
	const piecesOf = (key: string) => {
		let list = pieceCache.get(key);
		if (list) return list;
		const tex = app.stateApp.loadedAssets?.[key] as Texture | undefined;
		if (!tex) return [];
		const f = tex.frame;
		const pw = f.width / PIECES;
		const ph = f.height / PIECES;
		list = [];
		for (let gy = 0; gy < PIECES; gy++)
			for (let gx = 0; gx < PIECES; gx++)
				list.push(new Texture({ source: tex.source, frame: new Rectangle(f.x + gx * pw, f.y + gy * ph, pw, ph) }));
		pieceCache.set(key, list);
		return list;
	};
	const tex = (key: string) => app.stateApp.loadedAssets?.[key] as Texture | undefined;

	type Shard = { s: Sprite; glow: Sprite; x0: number; y0: number; vx: number; vy: number; spin: number; tile: number; delay: number; edge: number };
	type Lock = { halo: Sprite; ghost: Sprite | null; brackets: Graphics; x: number; y: number; size: number };
	type Copy = { ghost: Sprite | null; burst: Sprite; plan: BlastPlan['copies'][number] };
	type Column = { outer: Sprite[]; sheath: Sprite[]; core: Sprite[]; motes: Sprite[]; flash: Sprite; frame: Graphics; reel: number };

	let shards: Shard[] = [];
	let locks: Lock[] = [];
	let copies: Copy[] = [];
	let columns: Column[] = [];
	let builtFor = -1;

	const glowSprite = (tint: number) => {
		const s = new Sprite(tex('fxGlow') ?? Texture.WHITE);
		s.anchor.set(0.5);
		s.blendMode = 'add';
		s.tint = tint;
		s.visible = false;
		return s;
	};

	const clear = () => {
		for (const c of root.removeChildren()) c.destroy({ children: true });
		shards = [];
		locks = [];
		copies = [];
		columns = [];
	};

	const build = (plan: BlastPlan) => {
		clear();
		builtFor = plan.id;
		const look = plan.look;
		const shardLayer = new Container();
		const pillarLayer = new Container();
		const topLayer = new Container();
		root.addChild(shardLayer, pillarLayer, topLayer);

		// PILLAR: per reel, three soft layers stacked down the column, motes in it
		for (const reel of plan.reels) {
			const make = (tint: number) => Array.from({ length: 5 }, () => glowSprite(tint));
			const col: Column = {
				reel,
				outer: make(look.outer),
				sheath: make(look.sheath),
				core: make(look.core),
				motes: Array.from({ length: 10 + 3 * look.level }, (_, i) => glowSprite(look.edge[i % look.edge.length])),
				flash: glowSprite(look.sheath),
				frame: new Graphics(),
			};
			col.frame.blendMode = 'add';
			for (const s of [...col.outer, ...col.sheath, ...col.core, ...col.motes]) pillarLayer.addChild(s);
			topLayer.addChild(col.flash, col.frame);
			columns.push(col);
		}

		// SHARDS: the real art, pieces flying from the nearest bomb
		plan.shardCells.forEach((cell, ci) => {
			const pieces = piecesOf(cell.key);
			if (pieces.length === 0) return;
			const tile = cell.size / PIECES;
			let origin = plan.origins[0] ?? { x: cell.x, y: HEIGHT / 2 };
			for (const o of plan.origins)
				if (Math.hypot(o.x - cell.x, o.y - cell.y) < Math.hypot(origin.x - cell.x, origin.y - cell.y)) origin = o;
			pieces.forEach((texture, i) => {
				const gx = i % PIECES;
				const gy = Math.floor(i / PIECES);
				const x0 = cell.x + (gx + 0.5 - PIECES / 2) * tile;
				const y0 = cell.y + (gy + 0.5 - PIECES / 2) * tile;
				// away from the bomb, plus outward from the cell's own centre, plus up
				let dx = x0 - origin.x;
				let dy = y0 - origin.y;
				const d = Math.hypot(dx, dy) || 1;
				dx /= d;
				dy /= d;
				const ox = (x0 - cell.x) / tile;
				const oy = (y0 - cell.y) / tile;
				const r1 = hash(ci + 1, i + 1, 3.3);
				const r2 = hash(ci + 7, i + 2, 9.1);
				// A fracture travels out from the bomb, rather than all 16 squares
				// detaching on the same frame. Keep the spread short enough that even
				// the single-reel blast has a crisp first hit.
				const delay = Math.min(48, (d / SYMBOL_SIZE) * 12 + r2 * 15);
				const speed = SYMBOL_SIZE * (2.4 + 2.2 * r1) * look.power * (d < SYMBOL_SIZE * 0.6 ? 1.25 : 1);
				const s = new Sprite(texture);
				s.anchor.set(0.5);
				s.width = tile;
				s.height = tile;
				s.visible = false;
				const glow = new Sprite(texture);
				glow.anchor.set(0.5);
				glow.blendMode = 'add';
				glow.tint = look.edge[(ci + i) % look.edge.length];
				glow.visible = false;
				shardLayer.addChild(s, glow);
				shards.push({
					s,
					glow,
					x0,
					y0,
					vx: dx * speed * 0.7 + ox * SYMBOL_SIZE * 0.9,
					vy: dy * speed * 0.7 + oy * SYMBOL_SIZE * 0.9 - SYMBOL_SIZE * (1.2 + 1.4 * r2),
					spin: (r2 - 0.5) * 14,
					tile,
					delay,
					edge: glow.tint as number,
				});
			});
		});

		// LOCK: the source symbol lights up and brackets close in on it
		for (const src of plan.sources) {
			const halo = glowSprite(look.sheath);
			const art = tex(src.key);
			let ghost: Sprite | null = null;
			if (art) {
				ghost = new Sprite(art);
				ghost.anchor.set(0.5);
				ghost.blendMode = 'add';
				ghost.width = ghost.height = src.size;
				ghost.position.set(src.x, src.y);
				ghost.visible = false;
			}
			const brackets = new Graphics();
			brackets.blendMode = 'add';
			topLayer.addChild(halo);
			if (ghost) topLayer.addChild(ghost);
			topLayer.addChild(brackets);
			locks.push({ halo, ghost, brackets, x: src.x, y: src.y, size: src.size });
		}

		// COPIES: the fill flying out of its source into each refilled cell
		for (const c of plan.copies) {
			const art = tex(c.key);
			let ghost: Sprite | null = null;
			if (art) {
				ghost = new Sprite(art);
				ghost.anchor.set(0.5);
				ghost.blendMode = 'add';
				ghost.visible = false;
				topLayer.addChild(ghost);
			}
			const burst = glowSprite(look.core);
			topLayer.addChild(burst);
			copies.push({ ghost, burst, plan: c });
		}
	};

	const tick = () => {
		const plan = props.plan;
		const t = props.clock;
		if (!plan || t < 0) {
			if (builtFor !== -1) {
				clear();
				builtFor = -1;
			}
			return;
		}
		if (builtFor !== plan.id) build(plan);
		const look = plan.look;
		const beats = props.beats;
		const ph = phasesAt(t, beats);

		// LOCK — through the fuse, gone by the bang's first third
		const lockFade = ph.shatter > 0 ? Math.max(0, 1 - ph.shatter * 3) : 1;
		for (const l of locks) {
			const on = ph.charge * lockFade;
			const pulse = 0.5 + 0.5 * Math.sin(t / 55);
			l.halo.visible = on > 0.01;
			l.halo.position.set(l.x, l.y);
			l.halo.width = l.halo.height = SYMBOL_SIZE * (1.3 + 0.25 * pulse) * (0.7 + 0.3 * ph.charge);
			l.halo.alpha = 0.55 * on;
			if (l.ghost) {
				l.ghost.visible = on > 0.01;
				l.ghost.alpha = (0.25 + 0.35 * pulse) * on;
			}
			// brackets: four corners closing in from wide to the cell's edge
			const g = l.brackets;
			g.clear();
			if (on > 0.01) {
				const r = SYMBOL_SIZE * (0.5 + 0.35 * (1 - easeOut(ph.charge * 1.6)));
				const arm = SYMBOL_SIZE * 0.16;
				for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
					const cx = l.x + sx * r;
					const cy = l.y + sy * r;
					g.moveTo(cx - sx * arm, cy).lineTo(cx, cy).lineTo(cx, cy - sy * arm);
				}
				g.stroke({ width: 7, color: look.sheath, alpha: 0.35 * on, cap: 'round', join: 'round' });
				for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
					const cx = l.x + sx * r;
					const cy = l.y + sy * r;
					g.moveTo(cx - sx * arm, cy).lineTo(cx, cy).lineTo(cx, cy - sy * arm);
				}
				g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.95 * on, cap: 'round', join: 'round' });
			}
		}

		// SHARDS — from the bang, hanging through the hit-stop, then flying
		const life = beats.shatter + beats.puff * 0.8 + look.hitStop;
		const since = t - CHARGE_MS;
		for (const sh of shards) {
			const age = since - sh.delay;
			const show = age >= 0 && age < life;
			sh.s.visible = sh.glow.visible = show;
			if (!show) continue;
			const fly = Math.max(0, age - look.hitStop) / 1000;
			// in the hit-stop the pieces shiver in place, the cracks between them opening
			const shiver = age < look.hitStop ? (hash(sh.x0, sh.y0, Math.floor(age / 16)) - 0.5) * 3 : 0;
			const gravity = SYMBOL_SIZE * 9;
			const x = sh.x0 + sh.vx * fly + shiver;
			const y = sh.y0 + sh.vy * fly + 0.5 * gravity * fly * fly + shiver;
			const u = age / life;
			const scale = 1 - 0.45 * u;
			sh.s.position.set(x, y);
			sh.s.rotation = sh.spin * fly;
			sh.s.width = sh.s.height = sh.tile * scale * (age < look.hitStop ? 0.94 : 1);
			sh.s.alpha = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
			// the edge light: hot on the break, burning off
			sh.glow.position.set(x, y);
			sh.glow.rotation = sh.s.rotation;
			sh.glow.width = sh.glow.height = sh.tile * scale * 1.12;
			sh.glow.alpha = Math.max(0, 1 - u / 0.45) * 0.85;
		}

		// PILLAR — soft light over the void, shimmering, motes rising through it
		const p = pillarAt(ph.puff, ph.disperse, SYMBOL_SIZE, HEIGHT);
		for (const col of columns) {
			const cx = getSymbolX(col.reel);
			const on = p.alpha > 0 && p.h > 0;
			const layers: [Sprite[], number, number][] = [
				[col.outer, 3.4, 0.4],
				[col.sheath, 2.2, 0.6],
				[col.core, 1.1, 0.85],
			];
			for (const [list, w, a] of layers)
				list.forEach((s, k) => {
					s.visible = on;
					if (!on) return;
					const shimmer = Math.sin(t / 38 + k * 1.7 + col.reel * 2.3) * SYMBOL_SIZE * 0.025 * (1 - ph.disperse);
					s.position.set(cx + shimmer, p.top + (p.h * (k + 0.5)) / 5);
					s.width = Math.max(1, p.half * w * 1.6);
					s.height = (p.h / 5) * 2.4;
					s.alpha = a * p.alpha;
				});
			col.motes.forEach((m, i) => {
				const show = on && ph.disperse < 0.7;
				m.visible = show;
				if (!show) return;
				const seed = hash(col.reel + 1, i + 1, 5.5);
				const rise = ((t / (700 + 500 * seed) + seed) % 1);
				m.position.set(
					cx + (hash(col.reel + 3, i + 5, 1.1) - 0.5) * p.half * 2.2 + Math.sin(t / 90 + i) * 4,
					HEIGHT - rise * HEIGHT,
				);
				m.width = m.height = SYMBOL_SIZE * (0.08 + 0.1 * seed);
				m.alpha = 0.9 * p.alpha * Math.sin(Math.PI * rise) * (1 - ph.disperse / 0.7);
			});

			// FLASH — the column lights once its last copy is in
			const doneAt = plan.reelDone[col.reel];
			const ft = doneAt === undefined ? -1 : t - doneAt;
			const flashOn = ft >= 0 && ft < COLUMN_FLASH_MS;
			col.flash.visible = flashOn;
			col.frame.clear();
			if (flashOn) {
				const k = 1 - ft / COLUMN_FLASH_MS;
				col.flash.position.set(cx, HEIGHT / 2);
				col.flash.width = SYMBOL_SIZE * 1.6;
				col.flash.height = HEIGHT * 1.25;
				col.flash.alpha = 0.55 * k * k;
				const left = cx - SYMBOL_SIZE / 2;
				col.frame
					.roundRect(left + 3, 3, SYMBOL_SIZE - 6, HEIGHT - 6, 12)
					.stroke({ width: 8, color: look.sheath, alpha: 0.45 * k });
				col.frame
					.roundRect(left + 3, 3, SYMBOL_SIZE - 6, HEIGHT - 6, 12)
					.stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 * k });
			}
		}

		// COPIES — out of the source, into the cell, a burst as each lands
		for (const c of copies) {
			const { from, to, size, arriveAt } = c.plan;
			const flight = from.x === to.x && from.y === to.y ? 0 : COPY_FLIGHT_MS;
			const q = flight === 0 ? (t >= arriveAt ? 1 : -1) : (t - (arriveAt - flight)) / flight;
			if (c.ghost) {
				const show = q >= 0 && q < 1;
				c.ghost.visible = show;
				if (show) {
					const e = easeOut(q);
					// an arc: copies to a lower cell dip, to a higher one rise
					const lift = Math.sin(Math.PI * q) * SYMBOL_SIZE * 0.35;
					c.ghost.position.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e - lift);
					c.ghost.width = c.ghost.height = size * (0.55 + 0.45 * e);
					c.ghost.alpha = 0.9 * Math.sin(Math.PI * Math.min(1, q * 1.15));
				}
			}
			const bt = t - arriveAt;
			const bOn = bt >= 0 && bt < 260;
			c.burst.visible = bOn;
			if (bOn) {
				const k = 1 - bt / 260;
				c.burst.position.set(to.x, to.y);
				c.burst.width = c.burst.height = SYMBOL_SIZE * (0.9 + 0.6 * (1 - k));
				c.burst.alpha = 0.8 * k;
			}
		}
	};

	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			clear();
			for (const list of pieceCache.values()) for (const t of list) t.destroy(false);
			pieceCache.clear();
		};
	});
</script>
