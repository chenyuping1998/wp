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
		winFlash: Tween<number>;
		// Held for as long as the win lines are on screen. winFlash is a one-shot
		// accent that decays in under a second, so on its own the locked reel went
		// dark while the ordinary winning symbols carried on pulsing — the reel that
		// caused the win was the only thing on the board not lit up. This keeps the
		// full-reel frame breathing for the whole presentation, matching what
		// SymbolWinAnim does for a normal symbol.
		winHold: boolean;
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

	onMount(() => {
		const id = setInterval(() => (pulse = Date.now()), 24);
		return () => {
			clearInterval(id);
			cancelAnimationFrame(rafId);
		};
	});

	const runTakeover = async (entry: WildEntry) => {
		const x = getSymbolX(entry.reel);

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
				phase: 'infect',
				infect: new Tween(0),
				merge: new Tween(0),
				banner: new Tween(0),
				badgeScale: new Tween(0),
				winFlash: new Tween(0),
				winHold: false,
			};
			wilds = [...wilds.filter((w) => w.reel !== reel), entry];
			await runTakeover(entry);
		},

		// Sticky wilds get a fresh multiplier on each reveal — pulse the plaque.
		expandingWildsUpdate: async ({ wilds: updated }) => {
			let touched = false;
			for (const update of updated) {
				const entry = wilds.find((w) => w.reel === update.reel);
				if (!entry) continue;
				entry.mult = update.mult;
				entry.badgeScale.set(1.7, { duration: 220, easing: cubicOut });
				touched = true;
			}
			if (!touched) return;
			await waitForTimeout(320);
			for (const entry of wilds) entry.badgeScale.set(1, { duration: 220, easing: cubicOut });
			await waitForTimeout(240);
		},

		// Bet resume: rebuild locked reels instantly, no animation.
		expandingWildsRestore: ({ wilds: restored }) => {
			wilds = restored.map((wild) => ({
				reel: wild.reel,
				row: Math.ceil(ROWS / 2),
				mult: wild.mult,
				phase: 'idle' as const,
				infect: new Tween(1),
				merge: new Tween(1),
				banner: new Tween(1),
				badgeScale: new Tween(1),
				winFlash: new Tween(0),
				winHold: false,
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
				// sustained: the reel stays lit for as long as the lines are up
				entry.winHold = true;
				entry.badgeScale.set(1.45, { duration: 200, easing: cubicOut }).then(() => {
					entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
				});
				// one-shot on top, as the impact accent
				entry.winFlash.set(1, { duration: 160, easing: cubicOut }).then(() => {
					entry.winFlash.set(0.25, { duration: 220, easing: cubicOut }).then(() => {
						entry.winFlash.set(0.85, { duration: 180, easing: cubicOut }).then(() => {
							entry.winFlash.set(0, { duration: 420, easing: cubicOut });
						});
					});
				});
			}
		},

		winLinesHide: () => {
			for (const entry of wilds) entry.winHold = false;
		},

		winLinesClear: () => {
			for (const entry of wilds) entry.winHold = false;
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

		{#if wild.phase === 'idle' && !wild.winHold}
			<!-- breathing aura so the locked reel keeps reading alive. Suppressed
			     while the reel is winning, so the brighter win frame stands alone and
			     the tempo change is not muddied by the slow idle beat underneath. -->
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
			Plan B win light-up — on the wild CARD's own gold frame, not a halo around
			the reel. The wx card art (256x1280) draws its frame inset ~14px from the
			edge; rendered at SYMBOL_SIZE x BOARD_SIZES.height the scale is 0.461, so
			that inset is ~6.5px and the corner radius ~9px on screen. The highlight
			traces exactly that line so it reads as the card's frame catching light,
			pulsing on the faster winPulse beat with winFlash spiking it brightest as
			the win lands. Nothing is drawn outside the card.
		-->
		{#if wild.winHold}
			{@const p = winPulse(wild.reel)}
			{@const fl = wild.winFlash.current}
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
					g.stroke({ width: 12, color: 0xffe050, alpha: 0.12 + 0.16 * p + 0.22 * fl });
					// the frame line itself, bright — this is what "lights up"
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 5, color: 0xfff3bd, alpha: 0.55 + 0.4 * p + 0.4 * fl });
					// crisp white highlight riding on top of the frame line
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 2, color: 0xffffff, alpha: 0.35 + 0.35 * p + 0.45 * fl });
				}}
			/>
		{/if}

		<!--
			Flash tail. winFlash decays over ~1s and outlives winHold (winLinesHide
			clears the hold, the tween keeps running), so this carries the fade-out
			after the sustained frame is gone. While winHold is still on, fl is also
			folded into the frame above — the two together give the border its
			brightest spike right as the win lands. v8 API; the v7 stroke calls it
			used before are deprecated and leak state on this shared Graphics.
		-->
		{#if wild.winFlash.current > 0 && !wild.winHold}
			{@const fx = wild.winFlash.current}
			{@const left = x - SYMBOL_SIZE / 2}
			{@const inset = SYMBOL_SIZE * (14 / 256)}
			{@const rad = SYMBOL_SIZE * (20 / 256)}
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();
					// same card-frame line as the sustained highlight, so the fade-out
					// happens on the frame the win lit up — not a stroke around the reel
					g.roundRect(left + inset, inset, SYMBOL_SIZE - inset * 2, BOARD_SIZES.height - inset * 2, rad);
					g.stroke({ width: 10, color: 0xffd43b, alpha: 0.3 * fx });
					g.roundRect(left + inset, inset, SYMBOL_SIZE - inset * 2, BOARD_SIZES.height - inset * 2, rad);
					g.stroke({ width: 4, color: 0xfff3bd, alpha: 0.85 * fx });
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
			<Container {x} y={BOARD_SIZES.height - SYMBOL_SIZE * 0.44} scale={wild.badgeScale.current}>
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
				<GoldText text={`${wild.mult}X`} fontSize={SYMBOL_SIZE * 0.27} maxWidth={r * 1.7} />
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
