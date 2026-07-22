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
	import { Container, Graphics, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import FxBurst from './FxBurst.svelte';

	type WildEntry = {
		reel: number;
		mult: number;
		phase: 'grow' | 'idle';
		y: Tween<number>;
		// 0 = one cell tall (just the landed W), 1 = the full reel. The takeover
		// plate tracks this, so the reel is covered exactly as far as the monkey
		// has actually grown — no full-height plate popping in on frame 1.
		cover: Tween<number>;
		badgeScale: Tween<number>;
		// horizontal squash/stretch: <1 pinches the plate in, >1 flares it out.
		// Volume-preserving motion is what stops the growth reading as a resize.
		squeeze: Tween<number>;
		// vertical speed streaks during the burst
		streak: Tween<number>;
		// 0 = banner not started, 1 = fully unrolled down the reel. The spine no
		// longer swaps to the finished wx art (that hard cut is what made the
		// takeover read as a jump between two pictures) — this drives a masked
		// copy of the same panel so the banner visibly unrolls instead.
		unroll: Tween<number>;
		// whole-panel win reaction, now that the symbols underneath no longer
		// animate individually — this is what makes the locked reel read as the
		// thing that won
		winFlash: Tween<number>;
		// white-hot line along the top/bottom frame edge right after the slam
		edgeFlash: Tween<number>;
		oncomplete?: () => void;
	};

	const context = getContext();
	const REEL_CENTER_Y = BOARD_SIZES.height / 2;
	// visible padded row r sits at reelY(-SYMBOL_SIZE) + (r + 0.5) * SYMBOL_SIZE
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// spine grow timeline marks (see design/generate_spines.mjs)
	const BITE_TIMES_MS = [520, 840, 1160];
	const BURST_TIME_MS = 1500;
	// The plate used to jump between four fixed sizes, one per bite, which is
	// exactly what made the takeover read as "a picture being resized". It now
	// creeps continuously between the bites and each chomp adds a short surge on
	// top, so there is never a frame where nothing is moving.
	const COVER_STEPS = [0.16, 0.3, 0.46] as const;
	const CREEP_AHEAD = 0.075;

	let wilds = $state<WildEntry[]>([]);

	// ── chomp crumbs (additive sprites) + lock-in burst ───────────────────────
	type Crumb = { id: number; x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; leaf: boolean };
	let crumbs = $state<Crumb[]>([]);
	let bursts = $state<{ id: number; x: number }[]>([]);
	let nextId = 0;
	let clock = $state(0);
	let rafId = 0;
	let crumbsRunning = false;
	let pulse = $state(0);

	const startCrumbLoop = () => {
		if (crumbsRunning) return;
		crumbsRunning = true;
		const step = (now: number) => {
			clock = now;
			crumbs = crumbs.filter((c) => now - c.born < c.life);
			if (crumbs.length > 0) {
				rafId = requestAnimationFrame(step);
			} else {
				crumbsRunning = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	// banana crumbs sprayed out of the chomping mouth
	const spawnCrumbs = (x: number, y: number) => {
		const now = performance.now();
		crumbs = [
			...crumbs,
			...Array.from({ length: 9 }, (_, i) => {
				const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
				const speed = 60 + Math.random() * 130;
				return {
					id: nextId++,
					x: x + (Math.random() - 0.5) * SYMBOL_SIZE * 0.4,
					y: y + (Math.random() - 0.5) * SYMBOL_SIZE * 0.3,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed - 40,
					born: now,
					life: 420 + Math.random() * 260,
					size: 14 + Math.random() * 16,
					leaf: i % 4 === 0,
				};
			}),
		];
		startCrumbLoop();
	};

	const crumbState = (crumb: Crumb) => {
		const seconds = Math.max(0, (clock - crumb.born) / 1000);
		const p = Math.min(1, (clock - crumb.born) / crumb.life);
		return {
			x: crumb.x + crumb.vx * seconds,
			y: crumb.y + crumb.vy * seconds + 420 * seconds * seconds,
			size: crumb.size * (1 - p * 0.45),
			rot: seconds * 6,
			alpha: (1 - p) ** 1.3,
		};
	};

	// golden shockwave when the wx panel slams in
	const spawnLockBurst = (x: number) => {
		bursts = [...bursts, { id: nextId++, x }];
	};

	// Each locked reel breathes on its own phase and a slightly different rate.
	// Sharing one pulse made three locked reels flare in perfect lockstep, which
	// reads as one object rather than three.
	const auraPulse = (reel: number) =>
		0.5 + 0.5 * Math.sin(pulse / (540 + reel * 47) + reel * 1.7);

	// The moment the panel reaches the housing: dust and shards squirt sideways
	// along the top and bottom rails, the way something heavy hitting a stop
	// throws material out of the seam.
	const spawnEdgeImpact = (x: number, wild: WildEntry) => {
		const now = performance.now();
		const rails = [
			{ y: 2, dir: 1 },
			{ y: BOARD_SIZES.height - 2, dir: -1 },
		];
		crumbs = [
			...crumbs,
			...rails.flatMap((rail) =>
				Array.from({ length: 7 }, (_, i) => {
					const side = i % 2 === 0 ? 1 : -1;
					// hug the rail: mostly horizontal, kicked slightly inward
					const speed = 110 + Math.random() * 150;
					return {
						id: nextId++,
						x: x + side * SYMBOL_SIZE * 0.1,
						y: rail.y,
						vx: side * speed,
						vy: rail.dir * (20 + Math.random() * 70),
						born: now,
						life: 340 + Math.random() * 200,
						size: 12 + Math.random() * 18,
						leaf: i % 3 === 0,
					};
				}),
			),
		];
		startCrumbLoop();
		void wild;
	};

	// The plate spans from one symbol cell (centred on the monkey) out to the
	// whole reel as `cover` goes 0 → 1. Clamped to the board so it never draws
	// past the housing.
	const plateRect = (wild: WildEntry) => {
		const t = wild.cover.current;
		const half = (SYMBOL_SIZE + (BOARD_SIZES.height - SYMBOL_SIZE) * t) / 2;
		const centre = wild.y.current;
		const top = Math.max(0, centre - half);
		const bottom = Math.min(BOARD_SIZES.height, centre + half);
		// squeeze pinches the plate horizontally; it is inverted so a wind-up
		// (squeeze < 1) narrows the plate and the burst (> 1) flares it wide
		const width = SYMBOL_SIZE * (2 - wild.squeeze.current);
		return { top, height: Math.max(0, bottom - top), width };
	};

	onMount(() => {
		const id = setInterval(() => {
			// just advances the clock — each reel derives its own phase from it
			pulse = Date.now();
		}, 24);
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
				cover: new Tween(0),
				badgeScale: new Tween(0),
				squeeze: new Tween(1),
				streak: new Tween(0),
				unroll: new Tween(0),
				winFlash: new Tween(0),
				edgeFlash: new Tween(0),
			};
			wilds = [...wilds.filter((wild) => wild.reel !== reel), entry];
			// drift from the landing row to the reel centre across the three chomps
			entry.y.set(REEL_CENTER_Y, { duration: 1200, delay: 300, easing: cubicOut });

			const x = getSymbolX(reel);
			// each chomp: crumbs spray, the plate surges, and it keeps creeping
			// between bites so the takeover reads as continuous growth
			BITE_TIMES_MS.forEach((t, index) => {
				waitForTimeout(t).then(() => {
					if (entry.phase !== 'grow') return;
					spawnCrumbs(x, entry.y.current);
					// squash on the bite, then stretch past the target and settle —
					// the plate behaves like something being forced open, not resized
					entry.squeeze.set(0.94, { duration: 90, easing: cubicOut }).then(() => {
						entry.squeeze.set(1, { duration: 320, easing: backOut });
					});
					entry.cover.set(COVER_STEPS[index], { duration: 190, easing: backOut }).then(() => {
						if (entry.phase !== 'grow') return;
						// keep inching toward the next bite so nothing ever sits still
						const nextAt = BITE_TIMES_MS[index + 1] ?? BURST_TIME_MS;
						entry.cover.set(COVER_STEPS[index] + CREEP_AHEAD, {
							duration: Math.max(120, nextAt - t - 190),
						});
					});
				});
			});

			// the slam: the panel shoots to full height, overshoots into the
			// housing, and the frame takes the hit
			waitForTimeout(BURST_TIME_MS - 110).then(() => {
				// wind-up: it pulls in on itself a beat before letting go, which is
				// what sells the burst as an effort rather than a cut
				if (entry.phase !== 'grow') return;
				entry.squeeze.set(0.86, { duration: 110, easing: cubicOut });
			});

			waitForTimeout(BURST_TIME_MS).then(() => {
				spawnLockBurst(x);
				spawnEdgeImpact(x, entry);
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
				entry.cover.set(1, { duration: 210, easing: backOut });
				// stretch thin as it shoots up, then snap back to full width
				entry.squeeze.set(1.1, { duration: 130, easing: cubicOut }).then(() => {
					entry.squeeze.set(1, { duration: 260, easing: backOut });
				});
				entry.streak.set(1, { duration: 70, easing: cubicOut }).then(() => {
					entry.streak.set(0, { duration: 300, easing: cubicOut });
				});
				// the banner unrolls out of the monkey's row to fill the reel
				entry.unroll.set(1, { duration: 340, easing: cubicOut });
				entry.edgeFlash.set(1, { duration: 60, easing: cubicOut }).then(() => {
					entry.edgeFlash.set(0, { duration: 420, easing: cubicOut });
				});
			});

			await waitForResolve((resolve) => (entry.oncomplete = resolve));
			entry.phase = 'idle';
			entry.cover.set(1, { duration: 120, easing: cubicOut });
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
				cover: new Tween(1),
				badgeScale: new Tween(1),
				squeeze: new Tween(1),
				streak: new Tween(0),
				unroll: new Tween(1),
				winFlash: new Tween(0),
				edgeFlash: new Tween(0),
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
				// the panel itself lights up, twice, so the whole reel reads as the
				// winning element rather than the cells behind it
				entry.winFlash.set(1, { duration: 160, easing: cubicOut }).then(() => {
					entry.winFlash.set(0.25, { duration: 220, easing: cubicOut }).then(() => {
						entry.winFlash.set(0.85, { duration: 180, easing: cubicOut }).then(() => {
							entry.winFlash.set(0, { duration: 420, easing: cubicOut });
						});
					});
				});
			}
		},
	});
</script>

<BoardContainer>
	{#each wilds as wild (wild.reel)}
		<!-- reel-takeover plate: grows out of the landed W cell with the monkey,
		     so it always hides the W underneath without ever popping in at full
		     height (jungle-green to match the wx panel art) -->
		<Graphics
			draw={(g) => {
				const x = getSymbolX(wild.reel);
				const { top, height, width } = plateRect(wild);
				const left = x - width / 2;
				g.clear();
				if (height <= 0) return;
				// Once the reel is fully taken over, lay a square full-bleed base
				// first. The rounded plate alone left the reel corners uncovered and
				// sat at 0.97 alpha, so symbols still travelling behind it showed
				// through — the reel read as two layers instead of one panel.
				if (wild.cover.current > 0.99) {
					g.beginFill(0x0a1508, 1);
					g.drawRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height);
					g.endFill();
				}
				g.beginFill(0x0a1508, 1);
				g.drawRoundedRect(left, top, width, height, 14);
				g.endFill();
				if (height > 16 && width > 12) {
					g.beginFill(0x14301a, 0.92);
					g.drawRoundedRect(left + 6, top + 6, width - 12, height - 12, 10);
					g.endFill();
				}
				g.lineStyle(3, 0xffd43b, 0.75);
				g.drawRoundedRect(left + 3, top + 3, Math.max(0, width - 6), Math.max(0, height - 6), 12);
			}}
		/>

		{#if wild.streak.current > 0}
			<!-- Vertical speed streaks: the eye needs motion smear to accept that the
			     panel travelled the reel rather than being swapped in. fxStreak is a
			     horizontal smear, so width is its long axis and the quarter turn
			     stands it upright along the reel. -->
			{@const sx = getSymbolX(wild.reel)}
			{#each [-0.26, 0, 0.26] as offset (offset)}
				<Sprite
					key="fxStreak"
					anchor={0.5}
					x={sx + offset * SYMBOL_SIZE}
					y={REEL_CENTER_Y}
					width={BOARD_SIZES.height * (0.55 + 0.45 * wild.streak.current)}
					height={SYMBOL_SIZE * 0.3}
					rotation={Math.PI / 2}
					tint={0xffe98a}
					blendMode="add"
					alpha={0.5 * wild.streak.current}
				/>
			{/each}
		{/if}

		{#if wild.edgeFlash.current > 0}
			<!-- white-hot seam where the panel is jammed against the housing -->
			{@const x = getSymbolX(wild.reel)}
			{#each [0, BOARD_SIZES.height] as railY (railY)}
				<Sprite
					key="fxStreak"
					anchor={0.5}
					x={x}
					y={railY}
					width={SYMBOL_SIZE * 1.5}
					height={SYMBOL_SIZE * 0.34}
					tint={0xfff3bd}
					blendMode="add"
					alpha={wild.edgeFlash.current}
				/>
			{/each}
		{/if}
		{#if wild.phase === 'idle'}
			<!-- breathing golden aura so the locked WILD reel keeps reading alive -->
			<Graphics
				draw={(g) => {
					const x = getSymbolX(wild.reel);
					g.clear();
					const glow = auraPulse(wild.reel);
					g.lineStyle(9, 0xffd75e, 0.08 + 0.1 * glow);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 - 3, -3, SYMBOL_SIZE + 6, BOARD_SIZES.height + 6, 16);
					g.lineStyle(4, 0xffe98a, 0.16 + 0.18 * glow);
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
		{#if wild.unroll.current > 0 && wild.unroll.current < 1}
			<!--
				The WILD banner unrolling. The spine no longer swaps to the finished
				wx art at the end of `grow` — that hard cut between two pictures was
				the whole reason the takeover looked like a still being resized.
				Instead the same panel art is drawn here behind a mask that opens out
				of the monkey's row, so the banner visibly unrolls up and down the
				reel. Once `grow` finishes, the spine's idle animation shows the
				finished panel and this copy stops drawing.
			-->
			{@const ux = getSymbolX(wild.reel)}
			{@const uy = wild.y.current}
			{@const half = (BOARD_SIZES.height * wild.unroll.current) / 2}
			<Container>
				<Graphics
					isMask
					draw={(g) => {
						g.clear();
						g.beginFill(0xffffff, 1);
						g.drawRect(
							ux - SYMBOL_SIZE / 2,
							Math.max(0, uy - half),
							SYMBOL_SIZE,
							Math.min(BOARD_SIZES.height, uy + half) - Math.max(0, uy - half),
						);
						g.endFill();
					}}
				/>
				<Sprite
					key="gbWxPanel"
					anchor={0.5}
					x={ux}
					y={REEL_CENTER_Y}
					width={SYMBOL_SIZE}
					height={BOARD_SIZES.height}
				/>
			</Container>
			<!-- hot seam riding the leading edges of the unroll -->
			{#each [-1, 1] as dir (dir)}
				<Sprite
					key="fxStreak"
					anchor={0.5}
					x={ux}
					y={uy + dir * half}
					width={SYMBOL_SIZE * 1.3}
					height={SYMBOL_SIZE * 0.26}
					tint={0xfff3bd}
					blendMode="add"
					alpha={0.85 * (1 - wild.unroll.current)}
				/>
			{/each}
		{/if}

		{#if wild.winFlash.current > 0}
			<!-- Whole-reel win reaction. The W symbols under the plate deliberately
			     no longer animate (see WinLines.animatePositions), so the panel has
			     to carry the win itself: a hot rim plus an additive wash. -->
			{@const fx = wild.winFlash.current}
			{@const wx = getSymbolX(wild.reel)}
			<Graphics
				draw={(g) => {
					g.clear();
					g.lineStyle(6, 0xfff3bd, 0.9 * fx);
					g.drawRoundedRect(wx - SYMBOL_SIZE / 2 + 3, 3, SYMBOL_SIZE - 6, BOARD_SIZES.height - 6, 12);
					g.lineStyle(14, 0xffd43b, 0.35 * fx);
					g.drawRoundedRect(wx - SYMBOL_SIZE / 2 - 2, -2, SYMBOL_SIZE + 4, BOARD_SIZES.height + 4, 15);
				}}
			/>
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={wx}
				y={REEL_CENTER_Y}
				width={SYMBOL_SIZE * 1.25}
				height={BOARD_SIZES.height}
				tint={0xffe98a}
				blendMode="add"
				alpha={0.3 * fx}
			/>
		{/if}

		{#if wild.phase === 'idle'}
			<!--
				Multiplier plaque — THE display of the wild multiplier, so it has to
				survive being read at a glance. It used to be a small circle sitting
				right on top of the busy hands artwork at the foot of the wx panel,
				which made it easy to miss entirely. It is now a solid full-width
				banner clamped to the bottom rail (below the "D"), with an opaque
				backing so it reads over whatever art is behind it.
			-->
			{@const plaqueH = SYMBOL_SIZE * 0.52}
			{@const plaqueY = BOARD_SIZES.height - plaqueH * 0.5 - 4}
			<Container x={getSymbolX(wild.reel)} y={plaqueY} scale={wild.badgeScale.current}>
				<Graphics
					draw={(g: PixiGraphics) => {
						const w = SYMBOL_SIZE - 8;
						const h = plaqueH;
						// a touch of the idle breathing so the plaque reads as live
						const glow = auraPulse(wild.reel);
						g.clear();
						// outer halo first, so the plaque separates from the art behind
						g.lineStyle(7, 0xffd75e, 0.18 + 0.16 * glow);
						g.drawRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12);
						g.lineStyle(0);
						g.beginFill(0x0d1806, 1);
						g.drawRoundedRect(-w / 2, -h / 2, w, h, 10);
						g.endFill();
						g.lineStyle(3.5, 0xd8a334, 1);
						g.drawRoundedRect(-w / 2, -h / 2, w, h, 10);
						g.lineStyle(1.5, 0xfff3bd, 0.75);
						g.drawRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 7);
					}}
				/>
				<GoldText
					text={`${wild.mult}X`}
					fontSize={SYMBOL_SIZE * 0.4}
					maxWidth={SYMBOL_SIZE - 22}
				/>
			</Container>
		{/if}
	{/each}

	{#each crumbs as crumb (crumb.id)}
		{@const state = crumbState(crumb)}
		<Sprite
			key={crumb.leaf ? 'fxLeaf' : 'fxGlow'}
			anchor={0.5}
			x={state.x}
			y={state.y}
			rotation={state.rot}
			tint={crumb.leaf ? 0xffe98a : 0xfff2b0}
			blendMode={crumb.leaf ? 'normal' : 'add'}
			width={state.size}
			height={state.size}
			alpha={state.alpha}
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
