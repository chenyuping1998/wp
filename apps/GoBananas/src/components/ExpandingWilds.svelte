<script lang="ts" module>
	export type EmitterEventExpandingWilds =
		| { type: 'expandingWildNew'; reel: number; row: number; mult: number }
		| { type: 'expandingWildsUpdate'; wilds: { reel: number; row: number; mult: number }[] }
		| { type: 'expandingWildsRestore'; wilds: { reel: number; mult: number }[] }
		| { type: 'expandingWildsClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import FxBurst from './FxBurst.svelte';

	// ── the takeover, in three readable beats ────────────────────────────────
	//
	//   1. INFECT  a Wild lands, and the rest of the reel turns Wild — the
	//              change spreads outward from the landed cell, one cell at a
	//              time, each with a flash and a pop.
	//   2. MERGE   the five Wilds are pulled into the middle of the reel and
	//              collapse into one another.
	//   3. LOCK    the impact throws the full-reel WILD banner open, multiplier
	//              plaque included, and the reel stays locked.
	//
	// Everything here is drawn by this component. The previous version handed the
	// finished art off to a spine `idle` animation partway through, and when that
	// handoff slipped there was a window with nothing drawn at all — the reel went
	// blank behind the opaque backing. One owner, no handoff, no window.

	const ROWS = BOARD_DIMENSIONS.y;
	const INFECT_MS = 840;
	const MERGE_MS = 460;
	const BANNER_MS = 260;
	// fraction of the infect phase each cell takes to pop in
	const CELL_POP = 0.26;

	type Phase = 'infect' | 'merge' | 'idle';
	type WildEntry = {
		reel: number;
		row: number;
		mult: number;
		phase: Phase;
		infect: Tween<number>;
		merge: Tween<number>;
		banner: Tween<number>;
		badgeScale: Tween<number>;
		// What the badge actually prints. During a re-roll it cycles through random
		// values while `mult` already holds the settled figure from the math, so the
		// roll is pure presentation and can never show a number the book did not
		// pay. They are equal at every other moment.
		displayMult: number;
		// Badge shake amplitude in px, spiked on landing and eased back to 0. The
		// jitter itself is derived from the pulse clock at render time.
		shake: Tween<number>;
		// Drives the whole win light-up on the card's gold frame. A Tween, not a
		// boolean, on purpose: a plain-boolean mutation on an array element is not
		// reliably reactive in Svelte 5, and a Tween also runs a fixed envelope that
		// stays visible even when the free-game volley hides the lines after ~0.5s.
		winFlash: Tween<number>;
	};

	const context = getContext();
	const REEL_CENTER_Y = BOARD_SIZES.height / 2;
	// padded row r (1..ROWS) is centred at r*SYMBOL_SIZE - SYMBOL_SIZE/2
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const visibleRows = Array.from({ length: ROWS }, (_, i) => i + 1);

	let wilds = $state<WildEntry[]>([]);
	let bursts = $state<{ id: number; x: number }[]>([]);
	let sparks = $state<Spark[]>([]);
	let nextId = 0;
	let clock = $state(0);
	let pulse = $state(0);
	let rafId = 0;
	let sparksRunning = false;

	// ── conversion sparks (additive, texture-based) ──────────────────────────
	type Spark = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		born: number;
		life: number;
		size: number;
		star: boolean;
	};

	const startSparkLoop = () => {
		if (sparksRunning) return;
		sparksRunning = true;
		const step = (now: number) => {
			clock = now;
			sparks = sparks.filter((s) => now - s.born < s.life);
			if (sparks.length > 0) rafId = requestAnimationFrame(step);
			else sparksRunning = false;
		};
		rafId = requestAnimationFrame(step);
	};

	const spawnSparks = (x: number, y: number, count = 8) => {
		const now = performance.now();
		sparks = [
			...sparks,
			...Array.from({ length: count }, (_, i) => {
				const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
				const speed = 70 + Math.random() * 120;
				return {
					id: nextId++,
					x,
					y,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed,
					born: now,
					life: 300 + Math.random() * 220,
					size: 12 + Math.random() * 16,
					star: i % 3 === 0,
				};
			}),
		];
		startSparkLoop();
	};

	const sparkState = (s: Spark) => {
		const t = Math.max(0, (clock - s.born) / 1000);
		const p = Math.min(1, (clock - s.born) / s.life);
		return {
			x: s.x + s.vx * t,
			y: s.y + s.vy * t + 260 * t * t,
			size: s.size * (1 - p * 0.5),
			alpha: (1 - p) ** 1.4,
		};
	};

	// Each locked reel breathes on its own phase and rate — sharing one made
	// several locked reels flare in lockstep, which reads as a single object.
	const auraPulse = (reel: number) => 0.5 + 0.5 * Math.sin(pulse / (540 + reel * 47) + reel * 1.7);

	// Plan B: a distinctly faster beat for a reel that is part of a win. The idle
	// aura breathes on a ~3.4s period; this runs ~2.5x quicker (~1.3s) so the
	// change from "locked" to "winning" reads as a shift in tempo, not just
	// brightness. Per-reel phase, same as auraPulse, so several winning reels do
	// not flare in lockstep.
	const winPulse = (reel: number) => 0.5 + 0.5 * Math.sin(pulse / (205 + reel * 17) + reel * 1.7);

	// ── beat 1: which cells have turned, and how far ─────────────────────────
	// Cells convert in order of distance from the landed one, so the change
	// visibly spreads out of it rather than appearing all at once.
	const cellOrder = (wild: WildEntry) =>
		visibleRows
			.filter((r) => r !== wild.row)
			.sort((a, b) => Math.abs(a - wild.row) - Math.abs(b - wild.row));

	const cellProgress = (wild: WildEntry, row: number) => {
		if (row === wild.row) return 1;
		const rank = cellOrder(wild).indexOf(row);
		if (rank < 0) return 0;
		const start = (rank / ROWS) * (1 - CELL_POP);
		return Math.min(1, Math.max(0, (wild.infect.current - start) / CELL_POP));
	};

	// opaque backing spans only the cells that have actually turned, so the
	// original symbols are hidden exactly as fast as they are replaced
	const backingRect = (wild: WildEntry) => {
		const turned = visibleRows.filter((r) => cellProgress(wild, r) > 0.35);
		if (turned.length === 0) return null;
		const top = rowCenterY(Math.min(...turned)) - SYMBOL_SIZE / 2;
		const bottom = rowCenterY(Math.max(...turned)) + SYMBOL_SIZE / 2;
		return { top: Math.max(0, top), bottom: Math.min(BOARD_SIZES.height, bottom) };
	};

	// ── beat 2: the five Wilds collapse toward the middle ────────────────────
	const mergedCell = (wild: WildEntry, row: number) => {
		const m = wild.merge.current;
		const from = rowCenterY(row);
		// The tween itself carries the acceleration (cubicIn below), so the
		// mapping stays linear — easing it twice cancelled out into a drift.
		const t = m;
		return {
			y: from + (REEL_CENTER_Y - from) * t,
			scale: 1 - 0.62 * t,
			alpha: 1 - Math.max(0, (m - 0.78) / 0.22),
		};
	};

	// ── multiplier re-roll (free game, once per spin per locked reel) ─────────
	// Range comes from the rules panel: an expanded Wild carries 2x-50x. Only the
	// values shown while spinning are invented — the figure it lands on is always
	// the one the math sent.
	const MULT_MIN = 2;
	const MULT_MAX = 50;
	// Budget matters more than it looks: this runs once per locked reel on every
	// free spin, and by the end of a feature four reels are locked across 15
	// spins. The roll below is ~420ms, so a four-reel group finishes in about a
	// second — long enough to register, short enough not to add 20s to a feature.
	const ROLL_STAGGER = 160;
	const ROLL_STEPS = 7;

	const rollMultiplier = async (entry: WildEntry, finalMult: number) => {
		// Spin the digits, decelerating: step delay grows toward the landing so it
		// reads as a wheel losing momentum rather than a flicker that stops dead.
		for (let step = 0; step < ROLL_STEPS; step++) {
			let next = MULT_MIN + Math.floor(Math.random() * (MULT_MAX - MULT_MIN + 1));
			// never flash the real answer early — it would spoil the landing
			if (next === finalMult) next = next === MULT_MAX ? MULT_MIN : next + 1;
			entry.displayMult = next;
			entry.badgeScale.set(1.16, { duration: 40 });
			// Every third step only. The sound layer keeps one Audio element per
			// file, so a tick on every step — times four overlapping reels — would
			// retrigger the same element ~30 times a second and turn into a rattle.
			if (step % 3 === 0) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			await waitForTimeout(24 + step * 12);
		}

		// land on the real value
		entry.displayMult = finalMult;
		entry.mult = finalMult;

		// Force scales with the multiplier across its whole range, so the knock is
		// information rather than decoration: 2x barely stirs, 50x slams.
		const t = Math.min(1, Math.max(0, (finalMult - MULT_MIN) / (MULT_MAX - MULT_MIN)));
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		entry.badgeScale.set(1.5 + 0.55 * t, { duration: 130, easing: backOut }).then(() => {
			entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
		});
		entry.shake.set(2.5 + 13 * t, { duration: 60 }).then(() => {
			entry.shake.set(0, { duration: 300 + 260 * t, easing: cubicOut });
		});
		spawnSparks(getSymbolX(entry.reel), BOARD_SIZES.height - SYMBOL_SIZE * 0.44, 4 + Math.round(10 * t));
		// Every multiplier knocks the housing now, not only the big ones — a 2x
		// gives it a barely-there nudge (0.07 ≈ 0.6px) and a 50x slams it (0.7 ≈
		// 6px), so the force is a readout of the value across the whole range.
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.07 + 0.63 * t });
		await waitForTimeout(160);
	};

	onMount(() => () => cancelAnimationFrame(rafId));

	// The pulse clock only feeds auraPulse/winPulse, and both are called only from
	// inside the {#each wilds} block — so with no locked reels nothing reads it.
	// It used to run unconditionally from mount, updating $state ~42x a second for
	// the whole session even though base game never has an expanding wild. Tie it
	// to the list instead: the effect re-runs when wilds becomes empty or non-empty
	// and its cleanup stops the timer.
	$effect(() => {
		if (wilds.length === 0) return;
		const id = setInterval(() => (pulse = Date.now()), 24);
		return () => clearInterval(id);
	});

	const runTakeover = async (created: WildEntry) => {
		// Mutate through the $state proxy, not the object the handler built.
		//
		// expandingWildNew creates a plain object literal and pushes it with
		// `wilds = [...]`. Svelte then proxies the array, but the caller's reference
		// still points at the RAW object — so `created.phase = 'idle'` writes past
		// the proxy's set trap and nothing is invalidated. The two blocks gated on
		// `{#if wild.phase !== 'idle'}` (the opaque backing and the individual W
		// sprites) therefore keep rendering with the stale phase until something
		// else reassigns the array — which is why the old W layer stayed visible
		// under the finished panel on later spins.
		//
		// Reading it back out of `wilds` yields the proxy, so every write below
		// invalidates properly. (expandingWildsUpdate already does this via
		// wilds.find, which is why its multiplier updates were never affected.)
		const entry = wilds.find((w) => w.reel === created.reel) ?? created;
		const x = getSymbolX(entry.reel);

		// The monkey hoots as he lands and eats his way across the reel. Fired here,
		// at the very start of the takeover, and the sound fades itself out as the
		// grow finishes (~1.5s of visual, the clip holds ~2s then fades) so it reads
		// as one continuous beat rather than a bark that stops before the panel does.
		context.eventEmitter.broadcast({ type: 'soundMonkeyExpand' });

		// beat 1 — the reel turns Wild, cell by cell, out of the landed one
		spawnSparks(x, rowCenterY(entry.row), 10);
		const order = cellOrder(entry);
		order.forEach((row, rank) => {
			waitForTimeout(((rank + 0.6) / ROWS) * INFECT_MS).then(() => {
				if (entry.phase !== 'infect') return;
				spawnSparks(x, rowCenterY(row), 7);
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			});
		});
		entry.infect.set(1, { duration: INFECT_MS });
		await waitForTimeout(INFECT_MS + 90);

		// beat 2 — pull them together
		entry.phase = 'merge';
		// accelerate inward: they are being pulled, not drifting
		entry.merge.set(1, { duration: MERGE_MS, easing: cubicIn });
		await waitForTimeout(MERGE_MS * 0.78);

		// beat 3 — impact, and the banner is thrown open by it
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
		bursts = [...bursts, { id: nextId++, x }];
		spawnSparks(x, REEL_CENTER_Y, 16);
		entry.banner.set(1, { duration: BANNER_MS, easing: backOut });
		await waitForTimeout(BANNER_MS);

		entry.phase = 'idle';
		entry.badgeScale.set(1, { duration: 300, easing: backOut });
	};

	context.eventEmitter.subscribeOnMount({
		expandingWildNew: async ({ reel, row, mult }) => {
			const entry: WildEntry = {
				reel,
				// a Wild can land on a padding row; clamp so the spread has a real origin
				row: Math.min(ROWS, Math.max(1, row)),
				mult,
				displayMult: mult,
				shake: new Tween(0),
				phase: 'infect',
				infect: new Tween(0),
				merge: new Tween(0),
				banner: new Tween(0),
				badgeScale: new Tween(0),
				winFlash: new Tween(0),
			};
			wilds = [...wilds.filter((w) => w.reel !== reel), entry];
			await runTakeover(entry);
		},

		// Sticky wilds get a fresh multiplier on each reveal. Each one rolls its
		// number before it settles, then lands with a knock whose force scales with
		// the value — a 50x should feel like it hit the board harder than a 2x.
		//
		// Reels are STAGGERED, not run one after another. Fully sequential reads
		// better in isolation but costs ~600ms per locked reel, and by the end of a
		// feature four reels are locked — that is 2.4s added to every one of 15
		// spins. Starting each roll ROLL_STAGGER after the last keeps the
		// one-at-a-time reading while the whole group finishes in about a second.
		expandingWildsUpdate: async ({ wilds: updated }) => {
			const targets = updated
				.map((update) => ({ update, entry: wilds.find((w) => w.reel === update.reel) }))
				.filter((t): t is { update: (typeof updated)[number]; entry: WildEntry } => !!t.entry);
			if (targets.length === 0) return;

			// Turbo keeps the roll, just compressed. The number still flickers a few
			// times before it locks, so the multiplier reads as "selected" rather
			// than appearing from nowhere — only much faster, and without the frame
			// knock, sparks and sound the full presentation layers on. All reels roll
			// together (no stagger) to stay inside turbo's tight budget: ~3 flickers
			// then a settle, ~230ms total, matching the flat delay it replaces.
			if (stateBet.isTurbo) {
				await Promise.all(
					targets.map(async ({ update, entry }) => {
						for (let s = 0; s < 3; s++) {
							let next = MULT_MIN + Math.floor(Math.random() * (MULT_MAX - MULT_MIN + 1));
							if (next === update.mult) next = next === MULT_MAX ? MULT_MIN : next + 1;
							entry.displayMult = next;
							entry.badgeScale.set(1.12, { duration: 24 });
							await waitForTimeout(45);
						}
						entry.displayMult = update.mult;
						entry.mult = update.mult;
						entry.badgeScale.set(1.5, { duration: 90, easing: backOut }).then(() => {
							entry.badgeScale.set(1, { duration: 150, easing: cubicOut });
						});
					}),
				);
				return;
			}

			await Promise.all(
				targets.map(async ({ update, entry }, i) => {
					await waitForTimeout(i * ROLL_STAGGER);
					await rollMultiplier(entry, update.mult);
				}),
			);
			await waitForTimeout(180);
		},

		// Bet resume: rebuild locked reels instantly, no animation.
		expandingWildsRestore: ({ wilds: restored }) => {
			wilds = restored.map((wild) => ({
				reel: wild.reel,
				row: Math.ceil(ROWS / 2),
				mult: wild.mult,
				displayMult: wild.mult,
				shake: new Tween(0),
				phase: 'idle' as const,
				infect: new Tween(1),
				merge: new Tween(1),
				banner: new Tween(1),
				badgeScale: new Tween(1),
				winFlash: new Tween(0),
			}));
		},

		expandingWildsClear: () => {
			wilds = [];
		},

		// A win line crossing a locked reel. The individual W symbols underneath
		// deliberately do not animate (see WinLines.animatePositions), so the
		// panel itself has to carry the win.
		winLinesShow: ({ wins }) => {
			if (wilds.length === 0) return;
			const winningReels = new Set(wins.flatMap((win) => win.positions.map((p) => p.reel)));
			for (const entry of wilds) {
				if (entry.phase !== 'idle' || !winningReels.has(entry.reel)) continue;
				// The whole light-up is driven by this one Tween. It used to be gated
				// by a separate winHold boolean, but (a) a plain-boolean mutation on an
				// array element is not reliably reactive in Svelte 5 — the badge below
				// animates only because a Tween carries its own reactivity — and (b)
				// winLinesHide cleared the boolean the instant the volley ended, which
				// in a fast free-game volley (~0.5s) killed the frame before it could
				// register. A Tween is always reactive and runs its full envelope
				// regardless of when the lines are hidden.
				//
				// Envelope: snap to full, hold bright, then a long fade — ~1.1s of
				// clearly-lit frame, not a flash. winPulse adds the shimmer on top.
				entry.badgeScale.set(1.45, { duration: 200, easing: cubicOut }).then(() => {
					entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
				});
				entry.winFlash.set(1, { duration: 120, easing: cubicOut }).then(() => {
					entry.winFlash.set(0.72, { duration: 520 }).then(() => {
						entry.winFlash.set(0, { duration: 480, easing: cubicOut });
					});
				});
			}
		},
	});
</script>

<BoardContainer>
	{#each wilds as wild (wild.reel)}
		{@const x = getSymbolX(wild.reel)}

		<!-- opaque backing: covers the original symbols exactly as far as the
		     conversion has actually reached -->
		{#if wild.phase !== 'idle'}
			{@const rect = backingRect(wild)}
			{#if rect}
				<Graphics
					draw={(g: PixiGraphics) => {
						const h = rect.bottom - rect.top;
						g.clear();
						if (h <= 0) return;
						g.beginFill(0x0a1508, 1);
						g.drawRect(x - SYMBOL_SIZE / 2, rect.top, SYMBOL_SIZE, h);
						g.endFill();
						g.lineStyle(3, 0xffd43b, 0.7);
						g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 3, rect.top + 3, SYMBOL_SIZE - 6, h - 6, 10);
					}}
				/>
			{/if}
		{/if}

		<!-- beat 1 + 2: the individual Wilds -->
		{#if wild.phase !== 'idle'}
			{#each visibleRows as row (row)}
				{@const p = cellProgress(wild, row)}
				{#if p > 0}
					{@const m = mergedCell(wild, row)}
					{@const pop = wild.phase === 'merge' ? 1 : backOut(p)}
					<Sprite
						key="gbW"
						anchor={0.5}
						{x}
						y={wild.phase === 'merge' ? m.y : rowCenterY(row)}
						width={SYMBOL_SIZE * pop * (wild.phase === 'merge' ? m.scale : 1)}
						height={SYMBOL_SIZE * pop * (wild.phase === 'merge' ? m.scale : 1)}
						alpha={wild.phase === 'merge' ? m.alpha : 1}
					/>
					<!-- conversion flash: brightest at the instant the cell turns -->
					{#if wild.phase === 'infect' && p < 1}
						<Sprite
							key="fxGlow"
							anchor={0.5}
							{x}
							y={rowCenterY(row)}
							width={SYMBOL_SIZE * 1.5}
							height={SYMBOL_SIZE * 1.5}
							tint={0xfff3bd}
							blendMode="add"
							alpha={0.85 * (1 - p)}
						/>
					{/if}
				{/if}
			{/each}
		{/if}

		<!-- beat 2: streaks converging on the middle as they are pulled in -->
		{#if wild.phase === 'merge'}
			{@const mp = wild.merge.current}
			{#each [-1, 1] as dir (dir)}
				<Sprite
					key="fxStreak"
					anchor={0.5}
					{x}
					y={REEL_CENTER_Y + dir * BOARD_SIZES.height * 0.26 * (1 - mp)}
					width={BOARD_SIZES.height * 0.42 * (1 - mp)}
					height={SYMBOL_SIZE * 0.24}
					rotation={Math.PI / 2}
					tint={0xffe98a}
					blendMode="add"
					alpha={0.6 * mp}
				/>
			{/each}
		{/if}

		<!-- beat 3: the locked banner. Height is driven by `banner`, so it is
		     thrown open by the impact rather than fading in. -->
		{#if wild.banner.current > 0}
			{@const b = Math.min(1, wild.banner.current)}
			<Sprite
				key="gbWxPanel"
				anchor={0.5}
				{x}
				y={REEL_CENTER_Y}
				width={SYMBOL_SIZE}
				height={BOARD_SIZES.height * b}
			/>
		{/if}

		{@const winGlow = wild.winFlash.current}
		{#if wild.phase === 'idle' && winGlow <= 0.01}
			<!-- breathing aura so the locked reel keeps reading alive. Suppressed
			     while the reel is winning, so the brighter win frame stands alone. -->
			<Graphics
				draw={(g: PixiGraphics) => {
					const glow = auraPulse(wild.reel);
					g.clear();
					g.lineStyle(9, 0xffd75e, 0.08 + 0.1 * glow);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 - 3, -3, SYMBOL_SIZE + 6, BOARD_SIZES.height + 6, 16);
					g.lineStyle(4, 0xffe98a, 0.16 + 0.18 * glow);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height, 14);
				}}
			/>
		{/if}

		<!--
			Win light-up — on the wild CARD's own gold frame, not a halo around the
			reel. The wx card art (256x1280) draws its frame inset ~14px from the edge;
			rendered at SYMBOL_SIZE x BOARD_SIZES.height (scale 0.461) that inset is
			~6.5px and the corner radius ~9px on screen, so the highlight traces exactly
			the gold frame line.

			Driven entirely by winFlash (a Tween, so always reactive and running its
			full ~1.1s envelope) — see the winLinesShow handler for why the old winHold
			boolean was dropped. Every alpha is scaled by winGlow so the frame is
			plainly lit at the peak and fully gone at the end; winPulse only shimmers on
			top of it.
		-->
		{#if winGlow > 0.01}
			{@const p = winPulse(wild.reel)}
			{@const left = x - SYMBOL_SIZE / 2}
			{@const inset = SYMBOL_SIZE * (14 / 256)}
			{@const fx0 = left + inset}
			{@const fy0 = inset}
			{@const fw = SYMBOL_SIZE - inset * 2}
			{@const fh = BOARD_SIZES.height - inset * 2}
			{@const rad = SYMBOL_SIZE * (20 / 256)}
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();
					// soft bloom hugging the frame, so the gold reads as glowing metal
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 13, color: 0xffe050, alpha: winGlow * (0.3 + 0.18 * p) });
					// the frame line itself, bright — this is what "lights up"
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 5, color: 0xfff3bd, alpha: winGlow * (0.85 + 0.15 * p) });
					// crisp white highlight riding on top of the frame line
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 2, color: 0xffffff, alpha: winGlow * (0.65 + 0.35 * p) });
				}}
			/>
		{/if}

		<!--
			Multiplier. Deliberately NOT a filled plate any more: the opaque banner
			was as wide as the reel and tall enough to sit on the housing's gold
			frame. It is now a compact ring — brass outline, no fill — pulled up off
			the bottom rail, and the WILD lettering behind it was shrunk (see
			design/generate_symbols_realistic.mjs) to leave it clear space.
		-->
		{#if wild.badgeScale.current > 0}
			{@const r = SYMBOL_SIZE * 0.26}
			{@const sh = wild.shake.current}
			<!-- Shake jitter is read off the pulse clock rather than kept in state:
			     that clock already ticks at 24ms whenever any wild exists, so the
			     rattle costs nothing extra. Two different divisors keep x and y out
			     of phase, otherwise the badge just slides on a diagonal. -->
			<Container
				x={x + (sh > 0.05 ? Math.sin(pulse / 7) * sh : 0)}
				y={BOARD_SIZES.height - SYMBOL_SIZE * 0.44 + (sh > 0.05 ? Math.cos(pulse / 5.5) * sh : 0)}
				scale={wild.badgeScale.current}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						const glow = auraPulse(wild.reel);
						g.clear();
						// soft halo only — enough to lift the number off the art behind
						// it without boxing it in
						g.lineStyle(10, 0xffd75e, 0.1 + 0.1 * glow);
						g.drawCircle(0, 0, r);
						g.lineStyle(3.5, 0xd8a334, 1);
						g.drawCircle(0, 0, r);
						g.lineStyle(1.5, 0xfff3bd, 0.7);
						g.drawCircle(0, 0, r - 5);
					}}
				/>
				<GoldText text={`${wild.displayMult}X`} fontSize={SYMBOL_SIZE * 0.27} maxWidth={r * 1.7} />
			</Container>
		{/if}
	{/each}

	{#each sparks as spark (spark.id)}
		{@const s = sparkState(spark)}
		<Sprite
			key={spark.star ? 'fxStar' : 'fxGlow'}
			anchor={0.5}
			x={s.x}
			y={s.y}
			width={s.size}
			height={s.size}
			tint={0xfff2b0}
			blendMode="add"
			alpha={s.alpha}
		/>
	{/each}

	{#each bursts as burst (burst.id)}
		<FxBurst
			x={burst.x}
			y={REEL_CENTER_Y}
			scale={1.5}
			flavour="jungle"
			oncomplete={() => (bursts = bursts.filter((b) => b.id !== burst.id))}
		/>
	{/each}
</BoardContainer>
