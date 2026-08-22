<script lang="ts" module>
	export type FrameEntry = { reel: number; row: number; mult: number };

	export type EmitterEventNeonFrames =
		| { type: 'framesNew'; frames: FrameEntry[] }
		| { type: 'framesUpdate'; frames: FrameEntry[] }
		| { type: 'framesDoubled'; frames: FrameEntry[] }
		| {
				type: 'collectorSweep';
				position: { reel: number; row: number };
				frames: FrameEntry[];
				totalMultiplier: number;
		  }
		| {
				type: 'bonusTierEnter';
				tier: 'neon_nights' | 'sunset_hits' | 'ocean_drive';
				seedFrames: number;
		  }
		| { type: 'framesPending'; frames: FrameEntry[] }
		| { type: 'framesClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { featureScaled, featureTimeScale } from '../game/timeScale';
	// Orbitron, not Titan One. The frame multipliers are the one thing on the
	// board that is permanently visible and is pure money — the place Hacksaw's
	// Chaos Crew also lets display type get loud. Square geometric figures also
	// sit better inside a square frame than Titan One's rounded bubble digits.
	// fontSize steps down a little because Orbitron sets wider per glyph, so
	// "100x" still clears the cell.
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { getSymbolX } from '../game/utils';
	import { FRAME_TIMING as T } from '../game/frameTiming';
	import { frameEntry, ENTRY_MS, sweepFlight, collectorTick, tierOf as beatTierOf } from '../game/frameBeat';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// The math emits padded row indices, and a padded row r renders centred at
	// (r - 0.5) * SYMBOL_SIZE — the same convention every other board overlay
	// uses. getSymbolX already returns the reel's centre (ReelSymbol passes it
	// straight through as `x`), so it must not be offset by half a cell.
	const rowCenterY = (row: number) => (row - 0.5) * SYMBOL_SIZE;
	const keyOf = (frame: { reel: number; row: number }) => `${frame.reel},${frame.row}`;

	type ActiveFrame = FrameEntry & {
		scale: Tween<number>;
		glow: Tween<number>;
		fly: Tween<number>;
		/**
		 * ms since this Frame appeared, or -1 once its arrival is over.
		 *
		 * The arrival is NOT a tween any more: a 2x and a 100x used to share one
		 * 260ms backOut pop, so a fifty-fold difference in money arrived with the
		 * identical gesture. It is now a per-tier motion from game/frameBeat.ts,
		 * sampled per frame, and `design/check_frame_beat.mjs` fails the build if
		 * the three tiers stop escalating or start sharing a shape.
		 */
		entryT: number;
		/** the tier this Frame ENTERED as, so a re-roll cannot restyle mid-arrival */
		entryTier: 'plain' | 'premium' | 'elite';
	};

	let active = $state<ActiveFrame[]>([]);

	// Collector sweep state. The sweep is this game's headline moment, so the
	// frames physically travel to the Collector and their values stack up on it.
	let sweepTarget = $state<{ x: number; y: number } | null>(null);
	let sweepTotal = $state(0);
	let sweepShow = $state(false);
	// Turbo halves the spin, so presentation has to shorten with it. Hot Miami
	// used stateBetDerived.timeScale() in exactly one place (a Spine track), which
	// left this - the headline mechanic - running ~2s of fixed-duration tweens
	// while the reels finished in a third of the time.
	//
	// Durations are passed at .set() time rather than baked into the Tween, so a
	// turbo toggle takes effect on the very next beat instead of the next spawn.
	// featureScaled, not timeScale(): the Frames and the Collector sweep are the
	// headline mechanic, so turbo shortens them rather than halving them. See
	// game/timeScale.ts.
	const scaled = (ms: number) => featureScaled(ms);
	const pause = (ms: number) => waitForTimeout(scaled(ms));

	const sweepScale = new Tween(0, { duration: 220, easing: backOut });

	const makeFrame = (frame: FrameEntry, from: number): ActiveFrame => ({
		...frame,
		scale: new Tween(from, { duration: 260, easing: backOut }),
		glow: new Tween(0.55, { duration: 260, easing: cubicOut }),
		fly: new Tween(0, { duration: 420, easing: cubicOut }),
		// `from === 0` means this Frame is arriving on the board; anything else is
		// a Frame already there being restated (a re-roll or a doubling), which
		// has its own punch and must not replay the arrival.
		entryT: from === 0 ? 0 : -1,
		entryTier: beatTierOf(frame.mult),
	});

	// One clock for every arriving Frame. Ocean Drive can put twenty on the grid
	// at once, so this is a single rAF loop over the list rather than a timer per
	// Frame — and it stops itself as soon as nothing is arriving.
	let entryRaf = 0;
	const runEntries = () => {
		if (entryRaf) return;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = (now - last) * featureTimeScale();
			last = now;
			let live = false;
			for (const frame of active) {
				if (frame.entryT < 0) continue;
				frame.entryT += dt;
				if (frame.entryT >= ENTRY_MS[frame.entryTier]) frame.entryT = -1;
				else live = true;
			}
			// reassign so Svelte sees the mutation of the array's members
			active = active;
			entryRaf = live ? requestAnimationFrame(tick) : 0;
		};
		entryRaf = requestAnimationFrame(tick);
	};

	/** The arrival pose, or the resting pose once the arrival is done. */
	const entryPose = (frame: ActiveFrame) =>
		frame.entryT < 0 ? null : frameEntry(frame.entryT, frame.entryTier);

	// While flying, a frame lerps from its cell to the Collector along an arc so
	// the paths fan out instead of overlapping into one straight line.
	// Flight shaping per Frame, assigned when the sweep starts. The arc used to be
	// one constant for every Frame, under a comment claiming the paths "fan out
	// instead of overlapping into one straight line" — two Frames on the same reel
	// flew the identical path, one under the other. Shapes come from
	// game/frameBeat.ts and design/check_frame_beat.mjs asserts that neighbouring
	// Frames in a sweep really do differ.
	let flightOf = $state(new Map<string, ReturnType<typeof sweepFlight>>());

	const frameX = (frame: ActiveFrame) => {
		const origin = getSymbolX(frame.reel);
		if (!sweepTarget) return origin;
		const t = frame.fly.current;
		const bow = flightOf.get(keyOf(frame))?.lateral ?? 0;
		return origin + (sweepTarget.x - origin) * t + Math.sin(Math.PI * t) * SYMBOL_SIZE * bow;
	};
	const frameY = (frame: ActiveFrame) => {
		const origin = rowCenterY(frame.row);
		if (!sweepTarget) return origin;
		const t = frame.fly.current;
		const arc = flightOf.get(keyOf(frame))?.arc ?? 0.55;
		return origin + (sweepTarget.y - origin) * t - Math.sin(Math.PI * t) * SYMBOL_SIZE * arc;
	};

	const upsert = (frames: FrameEntry[], entryScale: number) => {
		const incoming = new Map(frames.map((frame) => [keyOf(frame), frame]));
		const kept = active.filter((frame) => !incoming.has(keyOf(frame)));
		const updated = frames.map((frame) => {
			const existing = active.find((candidate) => keyOf(candidate) === keyOf(frame));
			if (existing) {
				existing.mult = frame.mult;
				return existing;
			}
			return makeFrame(frame, entryScale);
		});
		active = [...kept, ...updated];
		// Frames that are ARRIVING run their per-tier motion; the tween is only
		// still used for the restate/re-roll/doubling punches and for the sweep.
		updated.forEach((frame) => {
			if (frame.entryT >= 0) {
				frame.scale.set(1, { duration: 0 });
				frame.glow.set(1, { duration: 0 });
			} else {
				frame.scale.set(1, { duration: scaled(T.entryMs), easing: backOut });
			}
		});
		if (updated.some((frame) => frame.entryT >= 0)) runEntries();
	};

	// per-reel reveal: hold the spin's Frames until each one's own reel stops, so
	// a Frame lands with its symbol instead of the whole set appearing at once.
	// This is the reference behaviour — The Luxe draws a reel's Golden Frames the
	// moment that reel comes to rest, while later reels are still turning.
	let pending = $state<FrameEntry[]>([]);
	$effect(() => {
		if (pending.length === 0) return;
		const landed = pending.filter(
			(frame) => context.stateGame.board[frame.reel]?.reelState.motion === 'stopped',
		);
		if (landed.length === 0) return;
		upsert(landed, 0);
		pending = pending.filter((frame) => !landed.some((l) => keyOf(l) === keyOf(frame)));
	});

	context.eventEmitter.subscribeOnMount({
		framesPending: async ({ frames }) => {
			pending = frames;
		},
		framesNew: async ({ frames }) => {
			upsert(frames, 0);
			await pause(T.entryMs);
		},
		framesUpdate: async ({ frames }) => {
			// Neon Nights refills every sticky Frame with a new multiplier between
			// spins. That used to swap the numbers silently, so the re-roll the
			// rules promise was invisible; pulse each one as its value changes.
			const changed = active.filter((frame) =>
				frames.some((candidate) => keyOf(candidate) === keyOf(frame) && candidate.mult !== frame.mult),
			);
			upsert(frames, 1);
			if (changed.length === 0) return;
			await Promise.all(changed.map((frame) => frame.scale.set(1.18, { duration: scaled(T.rerollOutMs), easing: backOut })));
			await Promise.all(changed.map((frame) => frame.scale.set(1, { duration: scaled(T.rerollInMs), easing: cubicOut })));
		},
		framesDoubled: async ({ frames }) => {
			// Punch each doubled frame so the new value is noticed.
			const touched = active.filter((frame) =>
				frames.some((candidate) => keyOf(candidate) === keyOf(frame)),
			);
			frames.forEach((frame) => {
				const target = active.find((candidate) => keyOf(candidate) === keyOf(frame));
				if (target) target.mult = frame.mult;
			});
			await Promise.all(touched.map((frame) => frame.scale.set(1.35, { duration: scaled(T.doubleOutMs), easing: backOut })));
			await Promise.all(touched.map((frame) => frame.scale.set(1, { duration: scaled(T.doubleInMs), easing: cubicOut })));
		},
		collectorSweep: async ({ position, frames, totalMultiplier }) => {
			// Frames fly into the Collector, stacking their values onto it as they
			// arrive, and the total lands with a punch. This used to shrink every
			// frame in place and discard `position` and `totalMultiplier` entirely,
			// so the game's headline feature resolved with no payoff at all.
			const swept = active.filter((frame) =>
				frames.some((candidate) => keyOf(candidate) === keyOf(frame)),
			);
			if (swept.length === 0) {
				active = [];
				return;
			}

			flightOf = new Map(swept.map((frame, index) => [keyOf(frame), sweepFlight(index, swept.length, frame.mult)]));
			sweepTarget = { x: getSymbolX(position.reel), y: rowCenterY(position.row) };
			sweepTotal = 0;
			sweepShow = true;
			sweepScale.set(1, { duration: scaled(T.sweepOpenMs), easing: backOut });

			// Charge up, then release in a stagger so the values land one at a time
			// and the counter visibly climbs rather than jumping to the answer.
			await Promise.all(swept.map((frame) => frame.glow.set(1, { duration: scaled(T.sweepChargeMs), easing: cubicOut })));
			const stagger = Math.max(T.sweepStaggerMinMs, Math.min(T.sweepStaggerMaxMs, T.sweepStaggerTotalMs / swept.length));
			await Promise.all(
				swept.map(async (frame, index) => {
					await waitForTimeout(scaled(index * stagger));
					const flight = flightOf.get(keyOf(frame));
					await frame.fly.set(1, {
						duration: scaled(T.sweepFlyMs * (flight?.flightScale ?? 1)),
						easing: cubicOut,
					});
					sweepTotal += frame.mult;
					// The kick scales with what was just absorbed. It was a fixed 1.3
					// for every Frame, so taking in a 2x looked exactly like taking in
					// a 100x — in the one moment of the game whose entire subject is
					// what each Frame was worth.
					sweepScale.set(collectorTick(frame.mult), { duration: scaled(T.sweepTickOutMs), easing: backOut });
					void frame.scale.set(0, { duration: scaled(T.sweepAbsorbMs), easing: cubicOut });
					sweepScale.set(1, { duration: scaled(T.sweepTickInMs), easing: cubicOut });
				}),
			);

			// Settle on the authoritative total from the maths, not the running sum.
			sweepTotal = totalMultiplier;
			await sweepScale.set(1.45, { duration: scaled(T.sweepTotalPunchMs), easing: backOut });
			await sweepScale.set(1, { duration: scaled(T.sweepTotalSettleMs), easing: cubicOut });
			await pause(T.sweepHoldMs);

			sweepShow = false;
			await sweepScale.set(0, { duration: scaled(T.sweepCloseMs), easing: cubicOut });
			sweepTarget = null;
			flightOf = new Map();
			active = [];
		},
		bonusTierEnter: async () => {
			active = [];
		},
		framesClear: async () => {
			pending = [];
			active = [];
		},
	});

	// Frame tiers.
	//
	// Every Frame looked identical whether it carried 2x or 100x — the number was
	// the only difference, and at 132px on a moving grid a number is the last
	// thing the eye reads. With the multiplier ladder now weighted down (25x/50x/
	// 100x are deliberately rare in game_config.py's rich_mult), the big ones are
	// worth marking as a different object rather than the same object with a
	// bigger label.
	//
	// Three tiers, split at the values a player already thinks in:
	//   plain    2x-9x    the working Frame — gold on magenta, as before
	//   premium  10x-24x  hotter gold, a halo, a slow travelling shine
	//   elite    25x+     white-gold, a bigger halo, a second casting, faster shine
	//
	// All drawn from the same `hmFrame` sprite tinted differently rather than from
	// new art, so the three read as one family and no asset is added.
	const PLAIN = 0xffd166; // the existing frame gold
	const PREMIUM = 0xffe9a3; // hotter, closer to white
	const ELITE = 0xfffdf2; // white-gold, near-white

	const tierOf = (mult: number) => (mult >= 25 ? 'elite' : mult >= 10 ? 'premium' : 'plain');
	const tintOf = (mult: number) => (mult >= 25 ? ELITE : mult >= 10 ? PREMIUM : PLAIN);
	// `plain` gets no halo at all, so an ordinary spin does not turn the grid into
	// a field of glows.
	const haloOf = (mult: number) => (mult >= 25 ? 2.4 : mult >= 10 ? 1.7 : 0);

	// One shared sweep drives the shine on every premium/elite frame — Ocean Drive
	// can have twenty of them on the grid, so this must not be a tween per frame.
	let shine = $state(0);
	onMount(() => {
		const id = setInterval(() => {
			shine = (Date.now() % 2600) / 2600;
		}, 40);
		return () => clearInterval(id);
	});
</script>

<BoardContainer>
	{#each active as frame (keyOf(frame))}
		{@const tier = tierOf(frame.mult)}
		{@const tint = tintOf(frame.mult)}
		{@const halo = haloOf(frame.mult)}
		{@const pose = entryPose(frame)}
		{@const glow = pose ? pose.glow : frame.glow.current}
		<Container
			x={frameX(frame)}
			y={frameY(frame)}
			scale={(pose ? pose.scale : 1) * frame.scale.current}
			rotation={pose ? pose.rotation : 0}
		>
			<!-- arrival shock ring: premium throws a small one, elite a big one,
			     plain none at all — see game/frameBeat.ts -->
			{#if pose && pose.ringAlpha > 0.01}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					tint={tint}
					blendMode="add"
					width={SYMBOL_SIZE * pose.ring}
					height={SYMBOL_SIZE * pose.ring}
					alpha={pose.ringAlpha}
				/>
			{/if}
			<!-- halo: nothing on a plain 2x-9x, a warm bloom on premium, bigger and
			     brighter on elite -->
			{#if halo > 0}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					tint={tint}
					blendMode="add"
					width={SYMBOL_SIZE * halo}
					height={SYMBOL_SIZE * halo}
					alpha={(tier === 'elite' ? 0.55 : 0.3) * (0.6 + 0.4 * glow)}
				/>
			{/if}

			<Sprite
				key="hmFrame"
				anchor={{ x: 0.5, y: 0.5 }}
				width={SYMBOL_SIZE}
				height={SYMBOL_SIZE}
				tint={tint}
				alpha={0.55 + 0.45 * glow}
			/>

			<!-- arrival flash: a white copy of the casting, fading out of the hit -->
			{#if pose && pose.flash > 0.01}
				<Sprite
					key="hmFrame"
					anchor={{ x: 0.5, y: 0.5 }}
					width={SYMBOL_SIZE}
					height={SYMBOL_SIZE}
					tint={0xffffff}
					blendMode="add"
					alpha={pose.flash}
				/>
			{/if}

			<!-- second, slightly larger casting on an elite: reads as heavier metal
			     rather than as a different shape -->
			{#if tier === 'elite'}
				<Sprite
					key="hmFrame"
					anchor={{ x: 0.5, y: 0.5 }}
					width={SYMBOL_SIZE * 1.06}
					height={SYMBOL_SIZE * 1.06}
					tint={ELITE}
					blendMode="add"
					alpha={0.45 * (0.5 + 0.5 * glow)}
				/>
			{/if}

			<!-- travelling shine, premium and elite only. A streak crossing the frame
			     is what makes gold read as metal rather than as yellow. -->
			{#if tier !== 'plain'}
				{@const t = (shine * (tier === 'elite' ? 2 : 1)) % 1}
				<Sprite
					key="fxStreak"
					anchor={{ x: 0.5, y: 0.5 }}
					x={(t - 0.5) * SYMBOL_SIZE * 1.5}
					y={(0.5 - t) * SYMBOL_SIZE * 0.5}
					rotation={-0.6}
					tint={0xffffff}
					blendMode="add"
					width={SYMBOL_SIZE * 0.42}
					height={SYMBOL_SIZE * 1.15}
					alpha={(tier === 'elite' ? 0.5 : 0.3) * Math.sin(Math.PI * t)}
				/>
			{/if}

			<Text
				text={`${frame.mult}x`}
				anchor={{ x: 0.5, y: 0.5 }}
				y={SYMBOL_SIZE * 0.34}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					// the number grows with the tier as well, so the ladder is legible
					// without actually reading the digits
					fontSize: SYMBOL_SIZE * (tier === 'elite' ? 0.33 : tier === 'premium' ? 0.28 : 0.24),
					fill: tint,
					stroke: { color: 0x2b0a2e, width: SYMBOL_SIZE * 0.045 },
				}}
			/>
		</Container>
	{/each}

	<!-- Running total riding on the Collector while the frames pour in -->
	{#if sweepShow && sweepTarget}
		<Container x={sweepTarget.x} y={sweepTarget.y} scale={sweepScale.current}>
			<!--
				The Collector's own lettering, electrified, for as long as it is
				sweeping.

				It is drawn here rather than through the symbol's win animation
				because a Collector round has no payline: its win arrives with
				lineIndex 0, WinLines finds no such line and returns before animating
				anything, so the symbol at the centre of the game's headline feature
				was the one symbol on the board that never lit up. The sweep knows
				where the Collector is — it is flying every Frame to it — so the
				light belongs here.
			-->
			<Sprite
				key="hmCCoreActive"
				anchor={{ x: 0.5, y: 0.5 }}
				width={SYMBOL_SIZE}
				height={SYMBOL_SIZE}
				blendMode="add"
				alpha={0.55 + 0.45 * Math.min(1, sweepScale.current)}
			/>
			<Sprite
				key="fxGlow"
				anchor={{ x: 0.5, y: 0.5 }}
				tint={0xff2e88}
				blendMode="add"
				width={SYMBOL_SIZE * 1.9}
				height={SYMBOL_SIZE * 1.9}
				alpha={0.75}
			/>
			<Text
				text={`${sweepTotal}x`}
				anchor={{ x: 0.5, y: 0.5 }}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					fontSize: SYMBOL_SIZE * 0.4,
					fill: 0xffd166,
					stroke: { color: 0x2b0a2e, width: SYMBOL_SIZE * 0.06 },
				}}
			/>
		</Container>
	{/if}
</BoardContainer>
