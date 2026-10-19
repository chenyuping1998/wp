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
		| { type: 'banditCollectClear' }
		// the last pin has landed on a collector (ComicPop puts its word there)
		| { type: 'banditCollectFinale'; reel: number; row: number; pins: number };
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

	import { stateBet } from 'state-shared';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, isBigPrize } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import SackBadge from './SackBadge.svelte';
	import PropMesh from './PropMesh.svelte';
	import { P_PICK, pPickLift } from '../game/meshWin';
	import { CANVAS } from '../game/meshWin/meshRig';
	import { NUMBER_FONT } from '../game/fonts';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	const context = getContext();

	const PAPER = 0xf7ead0;
	const RED = 0xe8502e;
	const INK = 0x14262e;

	const PICK_MS = 420;
	const FLY_MS = 460;
	// THE PINS GO AS A CHAIN (2026-10-18, user: make the collection fun): each
	// one leaves a little sooner after the last, 110ms down to 55, so a big haul
	// gathers pace like pins going down in a strike, and the clacks climb a
	// scale with it (soundPinClack). Four pins or more end on the strike crash.
	const staggerAt = (i: number) => Math.max(55, 110 - 12 * i);
	const STRIKE_PINS = 4;
	const IMPACT_MS = 520;
	const STAMP_MS = 520;
	const HOLD_MS = 450;

	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE
	const cellY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const cellX = (reel: number) => getSymbolX(reel);

	type Tag = { x: number; y: number; shown: number; stamped: boolean; pop: number; catchAt: number };
	type Flyer = { fromX: number; fromY: number; toX: number; toY: number; start: number; done: boolean; spin: number; lift: number };
	// a pin landing on the Bowler: a comic hit, wood chips and its value
	type Impact = { x: number; y: number; at: number; label: string; seed: number; big: boolean };
	let impacts = $state<Impact[]>([]);

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

	// The collection is this game's centrepiece: it plays at full length under
	// turbo too (turbo shortens the reels and the win acts, not this). Only
	// turbo 2 (two bolts, uiTheme.turboTiers) quickens it, and only to 1.5x —
	// so everything here runs on a virtual clock, `vt`, that the loop advances
	// by real time times that pace.
	const pace = () => (stateBet.isTurbo && stateBet.turboLevel === 2 ? 1.5 : 1);
	let vt = 0;
	let previous = 0;
	let raf = 0;
	let running = false;
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

	const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
	const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

	// ms into prize i's pick act, or -1 outside it (the prizes go 40ms apart)
	const pickAge = (i: number) => {
		if (pickStart < 0) return -1;
		const t = clock - pickStart - i * 40;
		return t > 0 && t < PICK_MS ? t : -1;
	};
	const CUP_SIZE = SYMBOL_SIZE * 0.88;

	// a knocked pin's flight: higher the farther it goes, tumbling end over
	// end one full turn toward the Bowler so it arrives head up
	const flightPoint = (f: Flyer, t: number) => {
		const e = easeInOut(t);
		const lift = Math.sin(t * Math.PI) * f.lift;
		return { x: f.fromX + (f.toX - f.fromX) * e, y: f.fromY + (f.toY - f.fromY) * e - lift };
	};
	const flyerPos = (f: Flyer) => {
		const t = Math.min(1, Math.max(0, (clock - f.start) / FLY_MS));
		const point = flightPoint(f, t);
		const prev = flightPoint(f, Math.max(0, t - .085));
		return {
			...point, prevX: prev.x, prevY: prev.y,
			trailAlpha: Math.min(1, t * 7) * (1 - t) * .55,
			scale: 0.42 + 0.18 * Math.sin(t * Math.PI),
			rotation: f.spin * Math.PI * 2 * easeInOut(t),
			visible: t > 0 && t < 1,
		};
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
			// each prize tips toward the first collector to take it
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

			// one Chef at a time: with two or three collecting at once, every Plate
			// flying everywhere at the same moment is unreadable
			for (let b = 0; b < tags.length; b++) {
				const tag = tags[b];
				const base = vt;
				const catchX = tag.x, catchY = tag.y + SYMBOL_SIZE * 0.36;
				let launch = 0;
				flyers = sacks.map((s, i) => {
					if (i > 0) launch += staggerAt(i - 1);
					const dist = Math.hypot(catchX - s.x, catchY - s.y);
					return {
						fromX: s.x,
						fromY: s.y,
						toX: catchX,
						toY: catchY,
						start: base + launch,
						done: false,
						spin: catchX < s.x ? -1 : 1,
						lift: SYMBOL_SIZE * (0.3 + 0.32 * Math.min(1, dist / (SYMBOL_SIZE * 4))),
					};
				});
				context.eventEmitter.broadcast({ type: 'soundCollectGrab' });
				// a whoosh as each pin takes off, a clack as each lands, on the clock
				const beats = flyers
					.flatMap((f, i) => [
						{ at: f.start, i, land: false },
						{ at: f.start + FLY_MS, i, land: true },
					])
					.sort((a, c) => a.at - c.at);
				for (const beat of beats) {
					if (beat.at > vt) await waitMs(beat.at - vt);
					if (!beat.land) {
						context.eventEmitter.broadcast({ type: 'soundPinWhoosh' });
						continue;
					}
					const i = beat.i;
					context.eventEmitter.broadcast({ type: 'soundPinClack', step: i });
					tag.shown += sacks[i].value;
					tag.pop = vt;
					tag.catchAt = tag.pop;
					impacts = [
						...impacts.filter((m) => vt - m.at < IMPACT_MS),
						{ x: catchX, y: catchY, at: vt, seed: b * 7 + i, label: `+${sacks[i].value / 100}x`, big: isBigPrize(sacks[i].value) },
					];
					if (i === sacks.length - 1) {
						const c = event.collectors[b];
						context.eventEmitter.broadcast({ type: 'banditCollectFinale', reel: c.reel, row: c.row, pins: sacks.length });
						if (sacks.length >= STRIKE_PINS) {
							context.eventEmitter.broadcast({ type: 'soundPinStrike' });
							context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.7 });
						}
					}
				}
				await waitMs(120);
				flyers = [];
			}

			if (mult > 1) {
				stampStart = vt;
				await waitMs(STAMP_MS * 0.35);
				context.eventEmitter.broadcast({ type: 'soundCollectStamp' });
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
			impacts = [];
			stampStart = -1;
			pickStart = -1;
			stopClock();
		},
	});

	// the hit: a jagged comic star that snaps out and goes, four wood chips
	// flung off it, and the pin's value floating up off the Bowler
	const drawImpacts = (g: PixiGraphics) => {
		g.clear();
		for (const m of impacts) {
			const k = (clock - m.at) / IMPACT_MS;
			if (k < 0 || k > 1) continue;
			const star = Math.min(1, k / 0.35);
			if (star < 1) {
				const r = SYMBOL_SIZE * (0.2 + 0.14 * star) * (m.big ? 1.25 : 1);
				const pts: number[] = [];
				for (let j = 0; j < 18; j++) {
					const jag = j % 2 === 0 ? 1 : 0.5 + 0.12 * Math.sin(m.seed * 3.1 + j);
					const a = (j / 18) * Math.PI * 2 + m.seed;
					pts.push(m.x + Math.cos(a) * r * jag, m.y + Math.sin(a) * r * jag);
				}
				const alpha = 1 - star;
				g.poly(pts).fill({ color: m.big ? 0xffcf4a : PAPER, alpha }).stroke({ width: 3, color: INK, alpha });
			}
			for (let j = 0; j < 4; j++) {
				const a = -Math.PI / 2 + (j - 1.5) * 0.7 + Math.sin(m.seed + j) * 0.25;
				const d = SYMBOL_SIZE * (0.22 + 0.5 * k);
				const cx = m.x + Math.cos(a) * d;
				const cy = m.y + Math.sin(a) * d + SYMBOL_SIZE * 0.9 * k * k;
				const rot = a + k * 8 * (j % 2 ? 1 : -1);
				const w = SYMBOL_SIZE * 0.06, h = SYMBOL_SIZE * 0.025;
				const c = Math.cos(rot), sn = Math.sin(rot);
				g.poly([
					cx - w * c + h * sn, cy - w * sn - h * c,
					cx + w * c + h * sn, cy + w * sn - h * c,
					cx + w * c - h * sn, cy + w * sn + h * c,
					cx - w * c - h * sn, cy - w * sn + h * c,
				])
					.fill({ color: j % 2 ? 0xf2d9a8 : RED, alpha: 1 - k })
					.stroke({ width: 1.5, color: INK, alpha: 1 - k });
			}
		}
	};

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
	<!-- 1. the Plates hop in place before they are taken -->
	{#each sacks as sack, i (i)}
		{@const age = pickAge(i)}
		{#if age >= 0}
			<PropMesh spec={P_PICK} env={{ t: age, side: sack.side }} x={sack.x} y={sack.y} width={CUP_SIZE} height={CUP_SIZE} anchor={0.5} />
			<!-- the copy lies over the reel's sack, so it carries the value too -->
			<SackBadge
				prize={sack.value / 100}
				x={sack.x}
				y={sack.y - pPickLift(age) * (CUP_SIZE / CANVAS)}
			/>
		{/if}
	{/each}

	<!-- 2. copies in flight -->
	{#each flyers as flyer, i (i)}
		{@const p = flyerPos(flyer)}
		{#if p.visible}
			<Graphics draw={(g) => {g.clear();g.moveTo(p.prevX,p.prevY).lineTo(p.x,p.y).stroke({color:RED,width:2.5,alpha:p.trailAlpha});}}/>
			<Sprite
				key="gbP"
				anchor={0.5}
				x={p.x}
				y={p.y}
				rotation={p.rotation}
				width={SYMBOL_SIZE * p.scale}
				height={SYMBOL_SIZE * p.scale}
			/>
			<!-- the value it carries, so the count-up on the tag can be followed -->
			<SackBadge
				prize={(sacks[i]?.value ?? 0) / 100}
				x={p.x}
				y={p.y}
				rotation={p.rotation}
				scale={p.scale / 0.88}
			/>
		{/if}
	{/each}

	<!-- 3. each Chef's tag: a paper ticket with a red offset print, the way
	     the screenprint plates are built (flat inks, no glow) -->
	<Container alpha={tagAlpha}>
	{#each tags as tag, i (i)}
		{#if tag.shown > 0}
			{@const s = tagPop(tag)}
			{@const amountText = bookEventAmountToCurrencyString(tag.shown)}
			{@const catchPulse = tag.catchAt < 0 ? 0 : Math.max(0, 1 - (clock - tag.catchAt) / 260)}
			{#if catchPulse > 0}<Graphics draw={(g) => {g.clear();g.circle(tag.x,tag.y,SYMBOL_SIZE*(.22+.16*(1-catchPulse))).stroke({color:RED,width:3*catchPulse,alpha:catchPulse});}}/>{/if}
			<Container x={tag.x} y={tag.y} scale={s}>
				<Graphics
					draw={(g) => {
						g.clear();
						const w = SYMBOL_SIZE * 0.92;
						const h = SYMBOL_SIZE * 0.34;
						g.roundRect(-w / 2 + 4, -h / 2 + 4, w, h, 8).fill(RED);
						g.roundRect(-w / 2, -h / 2, w, h, 8).fill(PAPER).stroke({ width: 3, color: INK });
					}}
				/>
				{@render ink(amountText, Math.min(30, 180 / Math.max(6, amountText.length)), isBigPrize(tag.shown) ? RED : INK)}
			</Container>
			{#if tag.stamped || stampStart >= 0}
				{@const st = stampScale()}
				{#if st > 0}
					<Container x={tag.x + SYMBOL_SIZE * 0.38} y={tag.y - SYMBOL_SIZE * 0.22} scale={st} rotation={-0.18}>
						<Graphics
							draw={(g) => {
								g.clear();
								g.circle(0, 0, SYMBOL_SIZE * 0.2).fill(RED).stroke({ width: 3, color: INK });
							}}
						/>
						{@render ink(`×${mult}`, 30, PAPER)}
					</Container>
				{/if}
			{/if}
		{/if}
	{/each}
	</Container>

	<!-- 4. the hits, over the tags (always mounted, so it stays on top) -->
	<Graphics draw={drawImpacts} />
	{#each impacts as m (m.at)}
		{@const k = Math.min(1, Math.max(0, (clock - m.at) / IMPACT_MS))}
		{#if k < 1}
			<Text
				anchor={0.5}
				x={m.x + SYMBOL_SIZE * 0.32}
				y={m.y - SYMBOL_SIZE * (0.3 + 0.45 * easeOutCubic(k))}
				alpha={k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3}
				scale={k < 0.15 ? 0.6 + 0.6 * (k / 0.15) : 1.2 - 0.2 * Math.min(1, (k - 0.15) / 0.2)}
				text={m.label}
				style={{
					fontFamily: NUMBER_FONT,
					fontSize: SYMBOL_SIZE * 0.2,
					fill: m.big ? 0xffcf4a : PAPER,
					stroke: { color: INK, width: SYMBOL_SIZE * 0.035, join: 'round' },
				}}
			/>
		{/if}
	{/each}
</BoardContainer>
