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
	import { cubicOut, backOut } from 'svelte/easing';
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';

	type WildEntry = {
		reel: number;
		mult: number;
		phase: 'grow' | 'idle';
		y: Tween<number>;
		badgeScale: Tween<number>;
		oncomplete?: () => void;
	};

	const context = getContext();
	const REEL_CENTER_Y = BOARD_SIZES.height / 2;
	// visible padded row r sits at reelY(-SYMBOL_SIZE) + (r + 0.5) * SYMBOL_SIZE
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// spine grow timeline marks (see design/generate_spines.mjs)
	const BITE_TIMES_MS = [520, 840, 1160];
	const BURST_TIME_MS = 1500;

	let wilds = $state<WildEntry[]>([]);

	// ── chomp crumbs + lock-in burst particles ─────────────────────────────────
	type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; color: number; r: number };
	type Ring = { x: number; y: number; age: number; life: number; delay: number };
	let sparks = $state<Spark[]>([]);
	let rings = $state<Ring[]>([]);
	let rafId = 0;
	let particlesRunning = false;
	let pulse = $state(0);

	const startParticleLoop = () => {
		if (particlesRunning) return;
		particlesRunning = true;
		let last = performance.now();
		const step = (now: number) => {
			const dt = now - last;
			last = now;
			for (const s of sparks) {
				s.age += dt;
				s.x += s.vx * (dt / 16);
				s.y += s.vy * (dt / 16);
				s.vy += 0.06 * (dt / 16);
			}
			for (const ring of rings) ring.age += dt;
			sparks = sparks.filter((s) => s.age < s.life);
			rings = rings.filter((r) => r.age < r.life + r.delay);
			if (sparks.length > 0 || rings.length > 0) {
				rafId = requestAnimationFrame(step);
			} else {
				particlesRunning = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	// banana crumbs sprayed from the chomping mouth
	const spawnCrumbs = (x: number, y: number) => {
		for (let i = 0; i < 10; i++) {
			const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
			const speed = 1 + Math.random() * 2.4;
			sparks.push({
				x: x + (Math.random() - 0.5) * SYMBOL_SIZE * 0.4,
				y: y + (Math.random() - 0.5) * SYMBOL_SIZE * 0.3,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed - 0.8,
				age: 0,
				life: 380 + Math.random() * 240,
				color: Math.random() < 0.5 ? 0xfff2b0 : 0xffd75e,
				r: 2.5 + Math.random() * 3.5,
			});
		}
		startParticleLoop();
	};

	// golden shockwave when the wx panel slams in
	const spawnLockBurst = (x: number) => {
		for (let k = 0; k < 3; k++) rings.push({ x, y: REEL_CENTER_Y, age: 0, life: 540, delay: k * 110 });
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * Math.PI * 2;
			const speed = 2 + Math.random() * 3;
			sparks.push({
				x,
				y: REEL_CENTER_Y,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				age: 0,
				life: 460 + Math.random() * 260,
				color: 0xffe98a,
				r: 3 + Math.random() * 3,
			});
		}
		startParticleLoop();
	};

	const drawParticles = (g: PixiGraphics) => {
		g.clear();
		for (const ring of rings) {
			const t = (ring.age - ring.delay) / ring.life;
			if (t < 0 || t > 1) continue;
			g.lineStyle(10 * (1 - t) + 2, 0xffd75e, 0.9 * (1 - t));
			g.drawCircle(ring.x, ring.y, SYMBOL_SIZE * (0.3 + t * 1.15));
		}
		g.lineStyle(0);
		for (const s of sparks) {
			const t = s.age / s.life;
			g.beginFill(s.color, 0.95 * (1 - t));
			g.drawCircle(s.x, s.y, s.r * (1 - t * 0.5));
			g.endFill();
		}
	};

	onMount(() => {
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 540);
		}, 40);
		return () => {
			clearInterval(id);
			cancelAnimationFrame(rafId);
		};
	});

	context.eventEmitter.subscribeOnMount({
		// A Wild landed in the free game: the monkey wolfs down his golden banana,
		// growing a size with every chomp until he bursts into the full-reel wx
		// pose. Resolves when the grow spine animation completes.
		expandingWildNew: async ({ reel, row, mult }) => {
			const entry: WildEntry = {
				reel,
				mult,
				phase: 'grow',
				y: new Tween(rowCenterY(row)),
				badgeScale: new Tween(0),
			};
			wilds = [...wilds.filter((wild) => wild.reel !== reel), entry];
			// drift from the landing row to the reel center across the three chomps
			entry.y.set(REEL_CENTER_Y, { duration: 1200, delay: 300, easing: cubicOut });
			// crumb sprays timed to the spine bites; golden shockwave on the wx slam
			const x = getSymbolX(reel);
			for (const t of BITE_TIMES_MS) {
				waitForTimeout(t).then(() => {
					if (entry.phase === 'grow') spawnCrumbs(x, entry.y.current);
				});
			}
			waitForTimeout(BURST_TIME_MS).then(() => spawnLockBurst(x));
			await waitForResolve((resolve) => (entry.oncomplete = resolve));
			entry.phase = 'idle';
			entry.badgeScale.set(1, { duration: 320, easing: backOut });
		},
		// Sticky wilds get a fresh multiplier on each reveal — pulse the badge.
		expandingWildsUpdate: async ({ wilds: updated }) => {
			let touched = false;
			for (const update of updated) {
				const entry = wilds.find((wild) => wild.reel === update.reel);
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
		// Bet resume: rebuild sticky wilds instantly, no animation.
		expandingWildsRestore: ({ wilds: restored }) => {
			wilds = restored.map((wild) => ({
				reel: wild.reel,
				mult: wild.mult,
				phase: 'idle' as const,
				y: new Tween(REEL_CENTER_Y),
				badgeScale: new Tween(1),
			}));
		},
		expandingWildsClear: () => {
			wilds = [];
		},
		// A win line crossing a sticky reel: pulse that wild so the locked reel
		// still reads as participating in the win.
		winLinesShow: ({ wins }) => {
			if (wilds.length === 0) return;
			const winningReels = new Set(wins.flatMap((win) => win.positions.map((p) => p.reel)));
			for (const entry of wilds) {
				if (entry.phase !== 'idle' || !winningReels.has(entry.reel)) continue;
				entry.badgeScale.set(1.45, { duration: 200, easing: cubicOut }).then(() => {
					entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
				});
			}
		},
	});
</script>

<BoardContainer>
	{#each wilds as wild (wild.reel)}
		<!-- opaque reel-takeover plate: drawn from the very start of the eat
		     animation so the W stack underneath is NEVER visible (jungle-green
		     to match the wx panel art) -->
		<Graphics
			draw={(g) => {
				const x = getSymbolX(wild.reel);
				g.clear();
				g.beginFill(0x0a1508, 0.97);
				g.drawRoundedRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height, 14);
				g.endFill();
				g.beginFill(0x14301a, 0.92);
				g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 6, 6, SYMBOL_SIZE - 12, BOARD_SIZES.height - 12, 10);
				g.endFill();
				g.lineStyle(3, 0xffd43b, 0.75);
				g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 3, 3, SYMBOL_SIZE - 6, BOARD_SIZES.height - 6, 12);
			}}
		/>
		{#if wild.phase === 'idle'}
			<!-- breathing golden aura so the locked WILD reel keeps reading alive -->
			<Graphics
				draw={(g) => {
					const x = getSymbolX(wild.reel);
					g.clear();
					g.lineStyle(9, 0xffd75e, 0.08 + 0.1 * pulse);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 - 3, -3, SYMBOL_SIZE + 6, BOARD_SIZES.height + 6, 16);
					g.lineStyle(4, 0xffe98a, 0.16 + 0.18 * pulse);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height, 14);
				}}
			/>
		{/if}
		<SpineProvider
			key="gbSpWx"
			x={getSymbolX(wild.reel)}
			y={wild.y.current}
			width={SYMBOL_SIZE}
			height={BOARD_SIZES.height}
		>
			<SpineTrack
				trackIndex={0}
				animationName={wild.phase === 'grow' ? 'grow' : 'idle'}
				loop={wild.phase === 'idle'}
				listener={{
					complete: (entry) => {
						if (entry.animation?.name === 'grow') wild.oncomplete?.();
					},
				}}
			/>
		</SpineProvider>
		{#if wild.phase === 'idle'}
			<!-- multiplier badge: brass plaque — THE display of the wild multiplier -->
			<Container
				x={getSymbolX(wild.reel)}
				y={BOARD_SIZES.height - SYMBOL_SIZE * 0.46}
				scale={wild.badgeScale.current}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						const r = SYMBOL_SIZE * 0.36;
						g.clear();
						g.beginFill(0x11200a, 0.94);
						g.drawCircle(0, 0, r);
						g.endFill();
						g.lineStyle(5, 0xd8a334, 1);
						g.drawCircle(0, 0, r);
						g.lineStyle(2, 0xfff3bd, 0.85);
						g.drawCircle(0, 0, r - 6);
					}}
				/>
				<GoldText text={`${wild.mult}X`} fontSize={SYMBOL_SIZE * 0.34} maxWidth={SYMBOL_SIZE * 0.58} />
			</Container>
		{/if}
	{/each}

	{#if sparks.length > 0 || rings.length > 0}
		<Graphics draw={drawParticles} />
	{/if}
</BoardContainer>
