<script lang="ts">
	/**
	 * THE TOMB PAYS OUT — what falls during a win count-up.
	 *
	 * It replaces WinCoins, which was the template's `fountain` particle config
	 * with a banana sheet swapped in: the same arc out of the bottom of the
	 * screen that every sample-built game throws, and the one motion a reviewer
	 * has seen a thousand times. On the biggest presentation in the game it was
	 * the loudest thing on screen and it was not ours.
	 *
	 * So the treasure comes DOWN, out of the tomb's ceiling, the way it would:
	 *
	 *   pour    gold coins (cut from the P symbol — design/cut_fx_coin.py)
	 *           flipping edge over face as they fall, the odd carnelian scarab
	 *           (H1's own cut-out) tumbling among them, and chips of the sealed
	 *           tablet's stone. Gravity, a little air, one bounce off the floor
	 *           and they are gone.
	 *   sand    on the big tiers, streams of gold sand run from cracks in the
	 *           ceiling — a few at a time, each pouring a couple of seconds and
	 *           moving on, so the screen never settles into one pattern
	 *   gush    when the amount lands (`burst` ticks over), a spray of coins and
	 *           stone thrown UP out of the plaque, which then rains back down
	 *           with the rest — the payoff beat has the treasure answer it
	 *
	 * The tier sets how much: a substantial win drops a few coins, max fills
	 * the screen and pours sand from six places.
	 *
	 * Plain sprites on the app ticker, pooled. Must sit inside a MainContainer:
	 * it works in main-layout space and sizes itself to the visible canvas every
	 * frame, so it covers a phone in portrait as well as a desktop. Drawn where
	 * it is placed — Win puts it behind the plaque, so nothing falls across the
	 * figure the presentation exists to show.
	 */
	import { Container, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { WinLevelAlias } from '../game/winLevelMap';

	type Props = {
		/** pour while true (the count-up); what is already falling finishes */
		emit: boolean;
		levelAlias?: WinLevelAlias;
		/** each change throws a gush up from (gushX, gushY) */
		burst?: number;
		/** main-layout px; default the board's centre */
		gushX?: number;
		gushY?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const context = getContext();

	// per tier: pieces a second, sand streams at once, pieces in the gush
	const TIER: Partial<Record<WinLevelAlias, { rate: number; streams: number; gush: number }>> = {
		substantial: { rate: 3, streams: 0, gush: 10 },
		big: { rate: 7, streams: 2, gush: 22 },
		superwin: { rate: 11, streams: 3, gush: 28 },
		mega: { rate: 16, streams: 4, gush: 34 },
		epic: { rate: 23, streams: 5, gush: 40 },
		max: { rate: 32, streams: 6, gush: 48 },
	};

	const GRAVITY = 1500;
	const MAX_PIECES = 230;
	const MAX_GRAINS = 420;
	const SAND = [0xf2d68c, 0xe8c070, 0xffe7a8, 0xd9a94e];

	type Kind = 'coin' | 'scarab' | 'chip';
	type Piece = {
		s: Sprite;
		glint: Sprite | null;
		kind: Kind;
		x: number;
		y: number;
		vx: number;
		vy: number;
		rot: number;
		spin: number;
		/** the coin's flip, radians; its width is |cos| of this */
		flip: number;
		flipSpeed: number;
		size: number;
		bounced: boolean;
		age: number;
		fade: number;
		live: boolean;
	};
	type Grain = { s: Sprite; x: number; y: number; vx: number; vy: number; age: number; live: boolean };
	type Stream = { x: number; until: number; streak: Sprite; age: number };

	const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
	const rand = (a: number, b: number) => a + Math.random() * (b - a);

	onMount(() => {
		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const coinTex = tex('fxCoin');
		const scarabTex = tex('gbH1Subject');
		const chipTex = [tex('gbMShardL'), tex('gbMShardR')].filter(Boolean) as Texture[];
		const starTex = tex('fxStar');
		const glowTex = tex('fxGlow');
		const streakTex = tex('fxStreak');
		if (!coinTex || !scarabTex || !starTex || !glowTex || !streakTex || chipTex.length === 0) {
			console.error('TreasureFall: textures not loaded');
			return;
		}

		const root = new Container();
		root.label = 'treasureFall';
		const streamLayer = new Container();
		const grainLayer = new Container();
		const pieceLayer = new Container();
		root.addChild(streamLayer, grainLayer, pieceLayer);
		parent.parent.addChild(root);

		// ── pools ───────────────────────────────────────────────────────────
		const pieces: Piece[] = [];
		const grains: Grain[] = [];
		const streams: Stream[] = [];

		const spawnPiece = (x: number, y: number, vx: number, vy: number, kind?: Kind) => {
			let p = pieces.find((q) => !q.live);
			if (!p) {
				if (pieces.length >= MAX_PIECES) return;
				const s = new Sprite();
				s.anchor.set(0.5);
				const glint = new Sprite(starTex);
				glint.anchor.set(0.5);
				glint.blendMode = 'add';
				glint.visible = false;
				pieceLayer.addChild(s, glint);
				p = {
					s, glint, kind: 'coin', x: 0, y: 0, vx: 0, vy: 0, rot: 0, spin: 0, flip: 0,
					flipSpeed: 0, size: 0, bounced: false, age: 0, fade: 0, live: false,
				};
				pieces.push(p);
			}
			const r = Math.random();
			p.kind = kind ?? (r < 0.62 ? 'coin' : r < 0.8 ? 'scarab' : 'chip');
			p.x = x;
			p.y = y;
			p.vx = vx;
			p.vy = vy;
			p.rot = rand(0, Math.PI * 2);
			p.age = 0;
			p.fade = 0;
			p.bounced = false;
			p.live = true;
			p.s.visible = true;
			// a pooled sprite may have been a coin mid-glint
			if (p.glint) p.glint.visible = false;
			p.s.alpha = 1;
			p.flip = rand(0, Math.PI * 2);
			if (p.kind === 'coin') {
				p.s.texture = coinTex;
				p.size = rand(44, 64);
				p.spin = rand(-1.5, 1.5);
				p.flipSpeed = rand(7, 14) * (Math.random() < 0.5 ? -1 : 1);
				p.s.tint = 0xffffff;
			} else if (p.kind === 'scarab') {
				p.s.texture = scarabTex;
				// the cut-out sits in a 256 tile with air round it
				p.size = rand(80, 104);
				p.spin = rand(-4, 4);
				p.flipSpeed = rand(3, 6);
				p.s.tint = 0xffffff;
			} else {
				p.s.texture = pick(chipTex);
				p.size = rand(34, 52);
				p.spin = rand(-9, 9);
				p.flipSpeed = 0;
				// the tablet's painted face, dulled to read as broken stone at this size
				p.s.tint = 0xd9cbb0;
			}
		};

		const spawnGrain = (x: number, y: number, vy: number) => {
			let g = grains.find((q) => !q.live);
			if (!g) {
				if (grains.length >= MAX_GRAINS) return;
				const s = new Sprite(glowTex);
				s.anchor.set(0.5);
				grainLayer.addChild(s);
				g = { s, x: 0, y: 0, vx: 0, vy: 0, age: 0, live: false };
				grains.push(g);
			}
			g.x = x;
			g.y = y;
			g.vx = rand(-14, 14);
			g.vy = vy;
			g.age = 0;
			g.live = true;
			g.s.visible = true;
			g.s.tint = pick(SAND);
			const d = rand(7, 13);
			g.s.setSize(d, d);
		};

		// ── the visible canvas, in main-layout px ───────────────────────────
		const view = () => {
			const main = context.stateLayoutDerived.mainLayout();
			const canvas = context.stateLayoutDerived.canvasSizes();
			const halfW = canvas.width / main.scale / 2;
			const halfH = canvas.height / main.scale / 2;
			const cx = main.width / 2, cy = main.height / 2;
			return { left: cx - halfW, right: cx + halfW, top: cy - halfH, bottom: cy + halfH, cx };
		};

		// ── the gush ────────────────────────────────────────────────────────
		let lastBurst = props.burst ?? 0;
		const gush = (n: number) => {
			const board = context.stateGameDerived.boardLayout();
			const x0 = props.gushX ?? board.x;
			const y0 = props.gushY ?? board.y;
			for (let i = 0; i < n; i++) {
				// a fan upward, widest at the sides
				const a = -Math.PI / 2 + rand(-1.15, 1.15);
				const speed = rand(650, 1250);
				spawnPiece(
					x0 + rand(-60, 60),
					y0 + rand(-20, 20),
					Math.cos(a) * speed,
					Math.sin(a) * speed,
					i % 4 === 3 ? 'chip' : i % 7 === 0 ? 'scarab' : 'coin',
				);
			}
		};

		let carry = 0;
		let clock = 0;
		// the first moments of a big tier pour harder, under the slam
		let emitAge = 0;

		const tick = () => {
			const dt = Math.min(0.05, (app.stateApp.pixiApplication?.ticker.deltaMS ?? 16) / 1000);
			clock += dt;
			const v = view();
			const floor = v.bottom - 24;
			const tier = props.levelAlias ? TIER[props.levelAlias] : undefined;

			if ((props.burst ?? 0) !== lastBurst) {
				lastBurst = props.burst ?? 0;
				if (tier) gush(tier.gush);
			}

			// ── pour ──
			if (props.emit && tier) {
				emitAge += dt;
				const surge = tier.streams > 0 && emitAge < 0.7 ? 2.2 : 1;
				carry += tier.rate * surge * dt;
				const w = v.right - v.left;
				while (carry >= 1) {
					carry -= 1;
					// biased to the middle: the eye is on the plaque
					const u = (Math.random() + Math.random() + Math.random()) / 3;
					spawnPiece(v.left + w * (0.04 + 0.92 * u), v.top - rand(40, 120), rand(-90, 90), rand(80, 380));
				}
			} else {
				emitAge = 0;
				carry = 0;
			}

			// ── sand streams ──
			const wanted = props.emit && tier ? tier.streams : 0;
			for (let i = streams.length - 1; i >= 0; i--) {
				const st = streams[i];
				st.age += dt;
				const ending = clock > st.until || wanted === 0;
				// the sheet of falling sand: a faint streak that fades in and out
				const life = Math.min(1, st.age / 0.35) * (ending ? Math.max(0, 1 - (clock - st.until) / 0.5) : 1);
				st.streak.alpha = 0.22 * life;
				st.streak.position.set(st.x, v.top);
				// fx_streak is a horizontal smear, its ink in the middle ~16% of its
				// height: turned a quarter so it hangs from the ceiling, 150 across
				// draws a sheet about 24px wide
				st.streak.setSize((floor - v.top) * Math.min(1, st.age / 0.6), 150);
				if (!ending) {
					const n = Math.round(rand(2, 4));
					for (let k = 0; k < n; k++) spawnGrain(st.x + rand(-7, 7), v.top + rand(0, 20), rand(250, 420));
				}
				if (ending && life <= 0) {
					st.streak.destroy();
					streams.splice(i, 1);
				}
			}
			const running = streams.filter((st) => clock <= st.until).length;
			for (let i = running; i < wanted; i++) {
				const streak = new Sprite(streakTex);
				streak.anchor.set(0, 0.5);
				streak.rotation = Math.PI / 2;
				streak.blendMode = 'add';
				streak.tint = 0xffd98a;
				streak.alpha = 0;
				streamLayer.addChild(streak);
				const w = v.right - v.left;
				streams.push({ x: v.left + w * rand(0.08, 0.92), until: clock + rand(1.4, 3), streak, age: 0 });
			}

			// ── grains ──
			for (const g of grains) {
				if (!g.live) continue;
				g.age += dt;
				g.vy += GRAVITY * 0.6 * dt;
				g.x += g.vx * dt;
				g.y += g.vy * dt;
				if (g.y > floor) {
					g.live = false;
					g.s.visible = false;
					continue;
				}
				g.s.position.set(g.x, g.y);
				g.s.alpha = 0.85;
			}

			// ── pieces ──
			for (const p of pieces) {
				if (!p.live) continue;
				p.age += dt;
				p.vy += GRAVITY * dt;
				p.vx *= 1 - 0.6 * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.spin * dt;
				p.flip += p.flipSpeed * dt;
				if (p.y > floor && p.vy > 0) {
					if (!p.bounced) {
						p.bounced = true;
						p.y = floor;
						p.vy = -p.vy * (p.kind === 'chip' ? 0.22 : 0.34);
						p.vx *= 0.7;
						p.spin *= 1.6;
					} else {
						p.fade = Math.max(p.fade, 0.001);
					}
				}
				if (p.fade > 0 || p.age > 5) p.fade += dt / 0.35;
				if (p.fade >= 1 || p.y > v.bottom + 200 || p.x < v.left - 200 || p.x > v.right + 200) {
					p.live = false;
					p.s.visible = false;
					if (p.glint) p.glint.visible = false;
					continue;
				}
				const alpha = 1 - Math.min(1, p.fade);
				p.s.position.set(p.x, p.y);
				p.s.alpha = alpha;
				if (p.kind === 'coin') {
					// edge over face: width follows the flip, and the coin darkens as
					// it turns edge-on — it reads as a disc turning, not a squashing one
					const c = Math.cos(p.flip);
					const face = Math.abs(c);
					p.s.rotation = p.rot;
					p.s.setSize(p.size * Math.max(0.08, face), p.size);
					const shade = 0.55 + 0.45 * face;
					const ch = Math.round(255 * shade);
					p.s.tint = (ch << 16) | (Math.round(ch * 0.97) << 8) | Math.round(ch * 0.9);
					// a glint as it comes face-on to the light
					const g = p.glint!;
					const shine = c > 0 ? face ** 24 : 0;
					g.visible = shine > 0.05;
					if (g.visible) {
						g.position.set(p.x - p.size * 0.18, p.y - p.size * 0.18);
						g.setSize(p.size * 0.9 * shine, p.size * 0.9 * shine);
						g.rotation = p.flip;
						g.alpha = shine * alpha;
					}
				} else if (p.kind === 'scarab') {
					// tumbling: turns, and its shell rocks on the long axis
					p.s.rotation = p.rot;
					p.s.setSize(p.size * (0.75 + 0.25 * Math.cos(p.flip)), p.size);
				} else {
					p.s.rotation = p.rot;
					p.s.setSize(p.size, p.size);
				}
			}
		};

		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
		};
	});
</script>
