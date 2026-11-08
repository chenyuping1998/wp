<script lang="ts" module>
	type Cell = { reel: number; row: number };
	export type EmitterEventBanditCollect =
		| {
				type: 'banditCollect';
				collectors: Cell[];
				/** value in book units (100 = 1x bet) */
				sacks: (Cell & { value: number })[];
				perCollector: number;
				mult: number;
				amount: number;
		  }
		| { type: 'banditCollectClear' };
</script>

<script lang="ts">
	// Each prize travels to its collector before the amount is stamped.
	//
	// Three beats, all on one rAF clock (no setInterval — the review checker
	// flags it, and rAF pauses with the tab instead of piling frames up):
	//   1. PICK  (0..PICK_MS)       every Plate hops, so the player sees what is
	//                               about to be taken
	//   2. FLY   (per Chef)       a copy of each Plate flies into the Chef,
	//                               staggered, and the Chef's tag counts up
	//                               one Plate at a time
	//   3. STAMP (free spins only)  the tag is stamped "xN" and jumps to the
	//                               multiplied figure
	// The tags stay up through the spin's win (the setWin that follows carries
	// the total), then fade as that win is put away. They used to stay until the
	// next spin's reveal — through the whole idle, sitting on the Chefs' faces
	// long after the money had moved to the WIN box.
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, isBigPrize } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import SackBadge from './SackBadge.svelte';
	import PropMesh from './PropMesh.svelte';
	import { stateBet } from 'state-shared';
	import { NUMBER_FONT } from '../game/fonts';
	import { P_PICK, pPickLift } from '../game/meshWin';
	import { CANVAS } from '../game/meshWin/meshRig';
	import type { Graphics as PixiGraphicsType } from 'pixi.js';

	const context = getContext();

	const PAPER = 0xefeadc;
	const INK = 0x1e1b1a;

	const PICK_MS = 420;
	// THE POUR (2026-11-01, user: the collection should be more fun, sound and
	// picture). Each cup no longer just flies into the Tea Master: it flies up
	// beside his tally, TIPS, and POURS its tea into it in an inked amber
	// stream; the amount lands with the tea (a splash of ink drops, the tag
	// squashes) and rings one note higher than the cup before, so a long
	// collection plays a climbing tune; the empty cup rights itself and floats
	// away. When the tally is complete a rolled chord plays.
	const FLY_MS = 400;
	const POUR_MS = 560;
	const LEAVE_MS = 260;
	const FLYER_MS = FLY_MS + POUR_MS + LEAVE_MS;

	// A NATURAL POUR (2026-11-01, user: make the pour more natural). The cup
	// eases into place with a small overshoot, leans back a touch before it
	// tips (anticipation), then tips about its LIP, not its middle, so the lip
	// stays put and the body swings over it; holds with a slight wobble;
	// rights itself. The tea is a real falling stream: every drop leaves the
	// lip with a small sideways push and falls under gravity, so the stream
	// curves, its front accelerates down to the tally, it thins as it falls, and
	// when the cup rights itself the stream breaks at the lip and its tail
	// drops away. The amount lands when the first tea reaches the tally.
	// The easings come FIRST: POUR_ON / POUR_OFF below call tiltAt while the
	// component initialises, and an arrow const read before its line is a
	// ReferenceError (temporal dead zone) that aborts the whole Svelte tree —
	// the game opened on its background and nothing else (2026-11-06).
	const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
	const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
	const easeInOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
	// settles with a small overshoot
	const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
	const TILT_MAX = 1.2; // rad
	const tiltAt = (k: number) => {
		if (k <= 0) return 0;
		if (k < 0.12) return -0.12 * Math.sin((Math.PI * k) / 0.12);
		if (k < 0.42) return easeInOutSine((k - 0.12) / 0.3);
		if (k < 0.74) return 1 + 0.035 * Math.sin(((k - 0.42) / 0.32) * Math.PI * 2);
		if (k < 1) return 1 - easeInOutSine((k - 0.74) / 0.26);
		return 0;
	};
	// tea flows while the cup is past this much of its tip
	const FLOW_AT = 0.55;
	const POUR_ON = (() => { let k = 0; while (k < 1 && tiltAt(k) < FLOW_AT) k += 0.002; return k * POUR_MS; })();
	const POUR_OFF = (() => { let k = 0.5; while (k < 1 && tiltAt(k) >= FLOW_AT) k += 0.002; return k * POUR_MS; })();
	// the cup hangs this far above the tally's top edge, beside it
	const POUR_ABOVE = SYMBOL_SIZE * 0.78;
	const POUR_BESIDE = SYMBOL_SIZE * 0.62;
	const CUP_SCALE = 0.68;
	// the lip, relative to the cup's centre (unrotated): its top corner toward the tally
	const LIP = { x: 0.42, y: -0.3 };
	// drops leave the lip with this velocity (px/ms) and fall at this gravity (px/ms²)
	const DROP_VX = 0.3, DROP_VY = 0.04, GRAVITY = 0.011;
	// how long a drop takes from the lip to the tally (solved once)
	const FALL_MS = (() => {
		// the lip sits LIP.y (negative: above) of the cup centre, so it is that
		// much higher than POUR_ABOVE over the tally
		const H = POUR_ABOVE - SYMBOL_SIZE * CUP_SCALE * LIP.y;
		return (-DROP_VY + Math.sqrt(DROP_VY * DROP_VY + 2 * GRAVITY * H)) / GRAVITY;
	})();
	const LAND_AT = FLY_MS + POUR_ON + FALL_MS;
	// cups start this far apart, closer when there are many (FG boards)
	const staggerFor = (n: number) => Math.max(90, Math.min(190, 1500 / Math.max(1, n)));
	const TEA = 0xc8913c, JADE_RULE = 0x2f6b55, CINNABAR = 0xa8321f, CREAM = 0xfaeed6;
	const STAMP_MS = 520;
	const HOLD_MS = 450;

	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE
	const cellY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const cellX = (reel: number) => getSymbolX(reel);

	type Tag = { x: number; y: number; shown: number; stamped: boolean; pop: number; catchAt: number };
	type Flyer = { fromX: number; fromY: number; toX: number; toY: number; side: number; start: number; done: boolean };

	let sacks = $state<{ x: number; y: number; value: number; side: number }[]>([]);
	let tags = $state<Tag[]>([]);
	let flyers = $state<Flyer[]>([]);
	let mult = $state(1);
	let clock = $state(0);
	let pickStart = $state(-1);
	let stampStart = $state(-1);
	// 1 while the tags are up; eased to 0 once the spin's win is put away
	let tagAlpha = $state(1);
	let collected = false;
	const TAG_FADE_MS = 320;

	let raf = 0;
	let running = false;
	// The collection is this game's centrepiece: it plays at full length under
	// turbo too (turbo shortens the reels and the win acts, not this). Only
	// turbo 2 (two bolts, uiTheme.turboTiers) quickens it, and only to 1.5x —
	// so everything here runs on a virtual clock, `vt`, that the loop advances
	// by real time times that pace (as Strike / Putt / Swing, 2026-10-18).
	const pace = () => (stateBet.isTurbo && stateBet.turboLevel === 2 ? 1.5 : 1);
	let vt = 0;
	let previous = 0;
	const loop = (now: number) => {
		vt += Math.min(80, Math.max(0, now - previous)) * pace();
		previous = now;
		clock = vt;
		raf = requestAnimationFrame(loop);
	};
	const startClock = () => {
		if (running) return;
		running = true;
		previous = performance.now();
		clock = vt;
		raf = requestAnimationFrame(loop);
	};
	const stopClock = () => {
		running = false;
		cancelAnimationFrame(raf);
	};
	onDestroy(stopClock);

	// Wait on the (virtual) rAF clock, so a hidden tab pauses the collection
	// rather than letting timers race ahead of what is drawn.
	const waitMs = (ms: number) =>
		new Promise<void>((resolve) => {
			const until = vt + ms;
			const check = () => (vt >= until ? resolve() : requestAnimationFrame(check));
			requestAnimationFrame(check);
		});


	// ms into cup i's pick act, or -1 outside it (the cups go 40ms apart)
	const pickAge = (i: number) => {
		if (pickStart < 0) return -1;
		const t = clock - pickStart - i * 40;
		return t > 0 && t < PICK_MS ? t : -1;
	};
	const CUP_SIZE = SYMBOL_SIZE * 0.88;

	// THE CUPS STEAM while they wait to be taken (2026-11-01; as Swing's records
	// turning on their turntables while the collection runs). After its hop each
	// cup sends up two ink wisps, drawn on, held and wiped off, on a ~1.1s cycle
	// a little out of step cup to cup, until the collection is put away. Ink
	// strokes in the inkFx hand (game/meshWin/inkFx.ts): no glow, no particles.
	const STEAM_CYCLE = 1100;
	const drawSteam = (g: PixiGraphicsType) => {
		g.clear();
		if (pickStart < 0) return;
		const s = CUP_SIZE / CANVAS;
		sacks.forEach((sack, i) => {
			const t = clock - pickStart - PICK_MS - i * 40;
			if (t <= 0) return;
			for (const [k, dx, h] of [[0, -18, 70], [0.45, 14, 58]] as const) {
				const u = (((t + i * 230) / STEAM_CYCLE + k) % 1 + 1) % 1;
				const head = Math.min(1, u / 0.45);
				const tail = u < 0.7 ? 0 : (u - 0.7) / 0.3;
				if (head <= tail) continue;
				const x0 = sack.x + dx * s;
				const y0 = sack.y - 34 * s;
				const at = (q: number): [number, number] => [x0 + Math.sin(q * Math.PI * 1.6 + k * 3) * 9 * s, y0 - q * h * s];
				const p0 = at(tail);
				g.moveTo(p0[0], p0[1]);
				for (let j = 1; j <= 10; j++) {
					const q = at(tail + ((head - tail) * j) / 10);
					g.lineTo(q[0], q[1]);
				}
				g.stroke({ width: 3.5 * (1 - 0.4 * tail), color: INK, alpha: 0.75, cap: 'round', join: 'round' });
			}
		});
	};

	// the tally slip's top edge (the slip is centred 0.36 above toY, 0.34 tall)
	const tagTop = (f: Flyer) => f.toY - SYMBOL_SIZE * 0.53;
	// where the cup's centre hangs to pour, on the side it came from
	const pourPoint = (f: Flyer) => ({ x: f.toX + f.side * POUR_BESIDE, y: tagTop(f) - POUR_ABOVE });
	// the lip it pivots on while pouring (fixed in place for the whole pour)
	const lipPoint = (f: Flyer) => {
		const P = pourPoint(f);
		const c = SYMBOL_SIZE * CUP_SCALE;
		return { x: P.x - f.side * LIP.x * c, y: P.y + LIP.y * c };
	};
	// cx/cy is the container's position, ox/oy the cup's offset inside it: the
	// container sits at the cup centre in flight and at the lip while pouring,
	// so the tip turns about the lip
	const flyerState = (f: Flyer) => {
		const t = clock - f.start;
		if (t <= 0 || t >= FLYER_MS) return null;
		const P = pourPoint(f);
		const c = SYMBOL_SIZE * CUP_SCALE;
		if (t < FLY_MS) {
			const u = t / FLY_MS;
			const k = easeOutBack(u);
			const lift = Math.sin(Math.min(1, u) * Math.PI) * SYMBOL_SIZE * 0.45;
			return {
				cx: f.fromX + (P.x - f.fromX) * k,
				cy: f.fromY + (P.y - f.fromY) * k - lift,
				ox: 0,
				oy: 0,
				scale: 0.88 + (CUP_SCALE - 0.88) * easeInOut(u),
				rotation: f.side * 0.18 * Math.sin(u * Math.PI),
				alpha: 1,
				pouring: false,
			};
		}
		if (t < FLY_MS + POUR_MS) {
			const L = lipPoint(f);
			return {
				cx: L.x,
				cy: L.y,
				ox: f.side * LIP.x * c,
				oy: -LIP.y * c,
				scale: CUP_SCALE,
				rotation: -f.side * TILT_MAX * tiltAt((t - FLY_MS) / POUR_MS),
				alpha: 1,
				pouring: true,
			};
		}
		const k = (t - FLY_MS - POUR_MS) / LEAVE_MS;
		return {
			cx: P.x + f.side * 14 * k,
			cy: P.y - 30 * easeInOutSine(k),
			ox: 0,
			oy: 0,
			scale: CUP_SCALE - 0.1 * k,
			rotation: f.side * 0.1 * Math.sin(k * Math.PI),
			alpha: 1 - easeInOutSine(k),
			pouring: false,
		};
	};
	// the tea: drops emitted from the lip between POUR_ON and POUR_OFF, each
	// on its own ballistic path; the stream is the line through the drops in
	// the air right now, thick at the lip and thinning as they fall
	const drawStream = (g: PixiGraphicsType, f: Flyer) => {
		g.clear();
		const t = clock - f.start - FLY_MS;
		const e0 = Math.max(POUR_ON, t - FALL_MS);
		const e1 = Math.min(POUR_OFF, t);
		if (e1 <= e0) return;
		const L = lipPoint(f);
		const floor = tagTop(f);
		const pts: { x: number; y: number; age: number }[] = [];
		const n = 16;
		for (let j = 0; j <= n; j++) {
			const e = e1 - ((e1 - e0) * j) / n;
			const a = t - e;
			// a slight wobble along the stream, so it is not a ruled line
			const wob = Math.sin(e * 0.045) * 1.2 * Math.min(1, a / 40);
			pts.push({
				x: L.x - f.side * DROP_VX * a + wob,
				y: Math.min(floor, L.y + DROP_VY * a + 0.5 * GRAVITY * a * a),
				age: a,
			});
		}
		for (const [extra, color] of [[3, INK], [0, TEA]] as const) {
			for (let j = 0; j < n; j++) {
				const p = pts[j], q = pts[j + 1];
				const w = 6.5 - 3 * Math.min(1, p.age / FALL_MS) + extra;
				g.moveTo(p.x, p.y).lineTo(q.x, q.y).stroke({ width: w, color, cap: 'round' });
			}
		}
	};

	// the splash where the tea lands: four drops thrown up off the tag
	const drawSplash = (g: PixiGraphicsType, tag: Tag) => {
		g.clear();
		if (tag.catchAt < 0) return;
		const k = (clock - tag.catchAt) / 300;
		if (k <= 0 || k >= 1) return;
		const top = tag.y - SYMBOL_SIZE * 0.17;
		for (const [a, d] of [[-2.3, 1], [-1.9, 0.8], [-1.25, 0.8], [-0.85, 1]] as const) {
			const r0 = SYMBOL_SIZE * (0.06 + 0.16 * easeOutCubic(k));
			const x = tag.x + Math.cos(a) * r0 * d;
			const y = top + Math.sin(a) * r0 * d + SYMBOL_SIZE * 0.25 * k * k;
			g.circle(x, y, 4.2 * (1 - k)).fill(TEA).stroke({ width: 1.6, color: INK });
		}
	};

	const stampScale = () => {
		if (stampStart < 0) return 0;
		const t = Math.min(1, (clock - stampStart) / STAMP_MS);
		// slams in oversized and settles, like a rubber stamp hitting paper
		return t < 0.35 ? 2.2 - 1.3 * easeOutCubic(t / 0.35) : 0.9 + 0.1 * easeOutCubic((t - 0.35) / 0.65);
	};

	context.eventEmitter.subscribeOnMount({
		banditCollect: async (event) => {
			startClock();
			collected = false;
			tagAlpha = 1;
			mult = event.mult;
			stampStart = -1;
			// each cup tips toward the first Tea Master to collect it
			const first = event.collectors[0];
			sacks = event.sacks.map((s) => ({
				x: cellX(s.reel),
				y: cellY(s.row),
				value: s.value,
				side: first && cellX(first.reel) < cellX(s.reel) ? -1 : 1,
			}));
			tags = event.collectors.map((c) => ({
				x: cellX(c.reel),
				y: cellY(c.row) - SYMBOL_SIZE * 0.36,
				shown: 0,
				stamped: false,
				catchAt: -1,
				pop: 0,
			}));
			flyers = [];

			pickStart = vt;
			await waitMs(PICK_MS + sacks.length * 40);

			// one Tea Master at a time: with two or three collecting at once,
			// every cup pouring everywhere at the same moment is unreadable
			const stagger = staggerFor(sacks.length);
			let note = 0;
			for (let b = 0; b < tags.length; b++) {
				const tag = tags[b];
				const base = vt;
				flyers = sacks.map((s, i) => ({
					fromX: s.x,
					fromY: s.y,
					toX: tag.x,
					toY: tag.y + SYMBOL_SIZE * 0.36,
					side: s.x >= tag.x ? 1 : -1,
					start: base + i * stagger,
					done: false,
				}));
				context.eventEmitter.broadcast({ type: 'soundCollectGrab' });
				for (let i = 0; i < sacks.length; i++) {
					await waitMs(Math.max(0, base + i * stagger + LAND_AT - vt));
					// the tune keeps climbing across collectors, as one long pour
					context.eventEmitter.broadcast({ type: 'soundCoinIn', index: note++ });
					tag.shown += sacks[i].value;
					tag.pop = vt;
					tag.catchAt = tag.pop;
				}
				await waitMs(FLYER_MS - LAND_AT);
				context.eventEmitter.broadcast({ type: 'soundCollectDone' });
				flyers = [];
			}

			if (mult > 1) {
				stampStart = vt;
				context.eventEmitter.broadcast({ type: 'soundCollectStamp' });
				await waitMs(STAMP_MS * 0.35);
				for (const tag of tags) {
					tag.stamped = true;
					tag.shown = event.perCollector * mult;
					tag.pop = vt;
				}
				await waitMs(STAMP_MS * 0.65);
			}
			await waitMs(HOLD_MS);
			pickStart = -1;
			collected = true;
			stopClock();
		},
		// The setWin after a collection shows the spin's total; when it is put
		// away, the tags have done their job.
		winHide: async () => {
			if (!collected || tags.length === 0) return;
			collected = false;
			const t0 = performance.now();
			await new Promise<void>((resolve) => {
				const step = (now: number) => {
					tagAlpha = Math.max(0, 1 - (now - t0) / TAG_FADE_MS);
					if (tagAlpha > 0) requestAnimationFrame(step);
					else resolve();
				};
				requestAnimationFrame(step);
			});
			tags = [];
			stampStart = -1;
			tagAlpha = 1;
		},
		banditCollectClear: () => {
			collected = false;
			tagAlpha = 1;
			sacks = [];
			tags = [];
			flyers = [];
			stampStart = -1;
			pickStart = -1;
			stopClock();
		},
	});

	const tagPop = (tag: Tag) => {
		const t = (clock - tag.pop) / 220;
		return t >= 0 && t < 1 ? 1 + 0.25 * Math.sin(t * Math.PI) : 1;
	};
</script>

{#snippet ink(text: string, size: number, fill: number)}
	<Text
		anchor={0.5}
		{text}
		style={{ fontFamily: NUMBER_FONT, fontSize: size, fontWeight: '400', letterSpacing: 1, fill }}
	/>
{/snippet}

<BoardContainer>
	<!-- 1. each cup hops and TIPS toward the Tea Master, as if pouring itself
	     out to him (meshWin/pCup.ts P_PICK), before it is taken -->
	<Graphics draw={drawSteam} />
	{#each sacks as sack, i (i)}
		{@const age = pickAge(i)}
		{#if age >= 0}
			<PropMesh spec={P_PICK} env={{ t: age, side: sack.side }} x={sack.x} y={sack.y} width={CUP_SIZE} height={CUP_SIZE} anchor={0.5} />
			<!-- the copy lies over the reel's cup, so it carries the value too -->
			<SackBadge
				prize={sack.value / 100}
				x={sack.x}
				y={sack.y - pPickLift(age) * (CUP_SIZE / CANVAS)}
			/>
		{/if}
	{/each}

	<!-- 2. each cup flies up beside the tally, tips and pours (see THE POUR) -->
	{#each flyers as flyer, i (i)}
		{@const st = flyerState(flyer)}
		{#if st}
			<Graphics draw={(g) => drawStream(g, flyer)} />
			<Container x={st.cx} y={st.cy} rotation={st.rotation} alpha={st.alpha}>
				<Container x={st.ox} y={st.oy}>
					<Sprite key="gbP" anchor={0.5} width={SYMBOL_SIZE * st.scale} height={SYMBOL_SIZE * st.scale} />
					{#if !st.pouring && st.alpha === 1}
						<!-- the value it carries, until it has been poured -->
						<SackBadge prize={(sacks[i]?.value ?? 0) / 100} scale={st.scale / 0.88} />
					{/if}
				</Container>
			</Container>
		{/if}
	{/each}

	<!-- 3. each Chef's tag: a paper ticket with a red offset print, the way
	     the screenprint plates are built (flat inks, no glow) -->
	<Container alpha={tagAlpha}>
	{#each tags as tag, i (i)}
		{#if tag.shown > 0}
			{@const s = tagPop(tag)}
			{@const amountText = bookEventAmountToCurrencyString(tag.shown)}
			<Graphics draw={(g) => drawSplash(g, tag)} />
			<!-- squash on each pour: wider and shorter, then back -->
			<Container x={tag.x} y={tag.y} scale={{ x: s, y: 2 - s }}>
				<Graphics
					draw={(g) => {
						g.clear();
						const w = SYMBOL_SIZE * 0.92;
						const h = SYMBOL_SIZE * 0.34;
						// a paper tally slip, inked, with a jade rule inside (the misprinted
						// red offset was Sushi Monkey's)
						g.roundRect(-w / 2, -h / 2, w, h, 8).fill(PAPER).stroke({ width: 3, color: INK });
						g.roundRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 5).stroke({ width: 1.5, color: JADE_RULE });
					}}
				/>
				{@render ink(amountText, Math.min(30, 180 / Math.max(6, amountText.length)), isBigPrize(tag.shown) ? CINNABAR : INK)}
			</Container>
			{#if tag.stamped || stampStart >= 0}
				{@const st = stampScale()}
				{#if st > 0}
					<!-- the same cinnabar chop as the free-spin board, upright -->
					<Container x={tag.x + SYMBOL_SIZE * 0.4} y={tag.y - SYMBOL_SIZE * 0.24} scale={st}>
						<Sprite key="v8FgSeal" anchor={0.5} width={SYMBOL_SIZE * 0.5} height={SYMBOL_SIZE * 0.5} />
						{@render ink(`×${mult}`, 26, CREAM)}
					</Container>
				{/if}
			{/if}
		{/if}
	{/each}
	</Container>
</BoardContainer>
