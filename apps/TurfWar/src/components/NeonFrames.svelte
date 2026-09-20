<script lang="ts" module>
	import type { FrameEntry, BonusTier } from '../game/typesBookEvent';
	export type { FrameEntry };

	export type EmitterEventNeonFrames =
		| { type: 'framesNew'; frames: FrameEntry[] }
		| { type: 'framesUpdate'; frames: FrameEntry[] }
		| { type: 'framesDoubled'; frames: FrameEntry[] }
		| { type: 'bonusTierEnter'; tier: BonusTier; seedFrames: number }
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
	import { frameEntry, ENTRY_MS, tierOf as beatTierOf } from '../game/frameBeat';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// The math emits padded row indices, and a padded row r renders centred at
	// (r - 0.5) * SYMBOL_SIZE — the same convention every other board overlay
	// uses. getSymbolX already returns the reel's centre (ReelSymbol passes it
	// straight through as `x`), so it must not be offset by half a cell.
	const rowCenterY = (row: number) => (row - 0.5) * SYMBOL_SIZE;
	const keyOf = (frame: { reel: number; row: number }) => `${frame.reel},${frame.row}`;

	// A frame covers `size` x `size` cells anchored at its TOP-LEFT, so its
	// centre is half a footprint down and right of the anchor cell's centre.
	// A 1x1 falls out of this as an offset of zero, which is why there is no
	// separate path for the ordinary case.
	const sizeOf = (frame: { size?: number }) => frame.size ?? 1;
	const centreOffset = (frame: { size?: number }) => ((sizeOf(frame) - 1) * SYMBOL_SIZE) / 2;

	type ActiveFrame = FrameEntry & {
		scale: Tween<number>;
		glow: Tween<number>;
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

	// Turbo halves the spin, so presentation has to shorten with it. Hot Miami
	// used stateBetDerived.timeScale() in exactly one place (a Spine track), which
	// left this - the headline mechanic - running ~2s of fixed-duration tweens
	// while the reels finished in a third of the time.
	//
	// Durations are passed at .set() time rather than baked into the Tween, so a
	// turbo toggle takes effect on the very next beat instead of the next spawn.
	// featureScaled, not timeScale(): the Frames are the headline mechanic, so
	// turbo shortens them rather than halving them. See game/timeScale.ts.
	const scaled = (ms: number) => featureScaled(ms);
	const pause = (ms: number) => waitForTimeout(scaled(ms));

	const makeFrame = (frame: FrameEntry, from: number): ActiveFrame => ({
		...frame,
		scale: new Tween(from, { duration: 260, easing: backOut }),
		glow: new Tween(0.55, { duration: 260, easing: cubicOut }),
		// `from === 0` means this Frame is arriving on the board; anything else is
		// a Frame already there being restated (a re-roll or a doubling), which
		// has its own punch and must not replay the arrival.
		entryT: from === 0 ? 0 : -1,
		entryTier: beatTierOf(frame.mult),
	});

	// One clock for every arriving Frame — a single rAF loop over the list rather
	// than a timer per Frame, which stops itself as soon as nothing is arriving.
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

	const frameX = (frame: ActiveFrame) => getSymbolX(frame.reel) + centreOffset(frame);
	const frameY = (frame: ActiveFrame) => rowCenterY(frame.row) + centreOffset(frame);

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
		// still used for the restate/re-roll/doubling punches.
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
			if (frames.some((frame) => sizeOf(frame) > 1)) {
				context.eventEmitter.broadcast({ type: 'soundFrameBigLand' });
			}
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

	/**
	 * What a Frame is WORTH, for styling purposes — not what it says on it.
	 *
	 * A big Frame contributes its value once per cell a winning line crosses, so
	 * a 3x3 carrying 8x can add 24x to a line while a 1x1 carrying 8x adds 8x.
	 * Styling on the printed number alone would therefore put every big Frame in
	 * the `plain` band, because the big-Frame ladders in game_config.py top out
	 * at 10x and 8x precisely so that size, not face value, is what makes them
	 * heavy. Multiplying by the side length restores the ordering the player
	 * actually experiences.
	 */
	const weightOf = (frame: { mult: number; size?: number }) => frame.mult * sizeOf(frame);

	const tierOf = (weight: number) => (weight >= 25 ? 'elite' : weight >= 10 ? 'premium' : 'plain');
	const tintOf = (weight: number) => (weight >= 25 ? ELITE : weight >= 10 ? PREMIUM : PLAIN);
	// `plain` gets no halo at all, so an ordinary spin does not turn the grid into
	// a field of glows.
	const haloOf = (weight: number) => (weight >= 25 ? 2.4 : weight >= 10 ? 1.7 : 0);
	const artKeyOf = (frame: { size?: number }) =>
		sizeOf(frame) >= 3 ? 'hmFrame3x3' : sizeOf(frame) >= 2 ? 'hmFrame2x2' : 'hmFrame1x1';
	const edgeKeyOf = (frame: { size?: number }) =>
		sizeOf(frame) >= 3 ? 'hmFrameEdge3x3' : sizeOf(frame) >= 2 ? 'hmFrameEdge2x2' : 'hmFrameEdge1x1';

	// One shared sweep drives the shine on every premium/elite frame, so this is
	// never a tween per frame however many are on the grid.
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
		{@const weight = weightOf(frame)}
		{@const tier = tierOf(weight)}
		{@const tint = tintOf(weight)}
		{@const halo = haloOf(weight)}
		{@const pose = entryPose(frame)}
		{@const artKey = artKeyOf(frame)}
		{@const edgeKey = edgeKeyOf(frame)}
		{@const glow = pose ? pose.glow : frame.glow.current}
		<!--
			`span` is the frame's footprint in pixels. Every sprite below is sized
			from it rather than from SYMBOL_SIZE, so a 2x2 and a 3x3 cover the cells
			they actually own.

			The art is still the 1x1 casting stretched to fit — frame_2x2.png and
			frame_3x3.png are specified in ART_BRIEF.md and not drawn yet. When they
			land, this is the one place that has to choose between them, and the
			brief's rule about NOT scaling the border weight with the footprint is
			what those separate files exist to satisfy.
		-->
		{@const span = SYMBOL_SIZE * sizeOf(frame)}
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
					width={SYMBOL_SIZE * pose.ring * (1 + (sizeOf(frame) - 1) * 0.25)}
					height={SYMBOL_SIZE * pose.ring * (1 + (sizeOf(frame) - 1) * 0.25)}
					alpha={pose.ringAlpha}
				/>
			{/if}
			<!-- halo: nothing on a plain 2x-9x, a warm bloom on premium, bigger and
			     brighter on elite -->
			<!--
				The halo is sized off ONE CELL, not off the frame's footprint.

				It used to be `span * halo`, which was invisible while every frame was
				1x1 and became the loudest thing on the board once big frames landed:
				an elite 3x3 is 354px, so `span * 2.4` put an 850px additive bloom over
				the middle of a 472px-tall board and washed the symbols underneath it
				to white. A halo says "this frame is valuable"; a frame's footprint
				already says how much board it covers. Scaling one by the other states
				the same fact twice and blows out the cells the frame exists to
				multiply.

				A modest bump with size keeps a big elite frame from looking
				under-lit next to a small one, without the area growing with span².
			-->
			{#if halo > 0}
				{@const haloSpan = SYMBOL_SIZE * halo * (1 + (sizeOf(frame) - 1) * 0.25)}
				<Sprite
					key="fxGlow"
					anchor={{ x: 0.5, y: 0.5 }}
					tint={tint}
					blendMode="add"
					width={haloSpan}
					height={haloSpan}
					alpha={(tier === 'elite' ? 0.4 : 0.24) * (0.6 + 0.4 * glow)}
				/>
			{/if}

			<Sprite
				key={artKey}
				anchor={{ x: 0.5, y: 0.5 }}
				width={span}
				height={span}
				tint={tint}
				alpha={0.55 + 0.45 * glow}
			/>

			<!-- arrival flash: a white copy of the casting, fading out of the hit -->
			{#if pose && pose.flash > 0.01}
				<Sprite
					key={edgeKey}
					anchor={{ x: 0.5, y: 0.5 }}
					width={span}
					height={span}
					tint={0xffffff}
					blendMode="add"
					alpha={pose.flash}
				/>
			{/if}

			<!-- second, slightly larger casting on an elite: reads as heavier metal
			     rather than as a different shape -->
			{#if tier === 'elite'}
				<Sprite
					key={edgeKey}
					anchor={{ x: 0.5, y: 0.5 }}
					width={span * 1.06}
					height={span * 1.06}
					tint={ELITE}
					blendMode="add"
					alpha={0.28 * (0.5 + 0.5 * glow)}
				/>
			{/if}

			<!-- travelling shine, premium and elite only. A streak crossing the frame
			     is what makes gold read as metal rather than as yellow. -->
			{#if tier !== 'plain'}
				{@const t = (shine * (tier === 'elite' ? 2 : 1)) % 1}
				<Sprite
					key="fxStreak"
					anchor={{ x: 0.5, y: 0.5 }}
					x={(t - 0.5) * span * 1.5}
					y={(0.5 - t) * span * 0.5}
					rotation={-0.6}
					tint={0xffffff}
					blendMode="add"
					width={span * 0.42}
					height={span * 1.15}
					alpha={(tier === 'elite' ? 0.5 : 0.3) * Math.sin(Math.PI * t)}
				/>
			{/if}

			{#if context.stateGame.gameType === 'freegame'}
				<!-- One fixed-size wax lock on the corner: sticky is a state, not a
				     bigger reward, so the badge must not scale with a 2x2/3x3 frame. -->
				<Sprite
					key="capoFrameStickySeal"
					anchor={0.5}
					x={span * 0.39}
					y={-span * 0.39}
					width={SYMBOL_SIZE * 0.28}
					height={SYMBOL_SIZE * 0.28}
				/>
			{/if}

			<!-- The multiplier sits at 0.22 of the span below centre, not 0.34.
			     The plates carry a cleared centre circle of radius ~0.31 x span
			     (design/soften_frames.py), and 0.34 put the number just OUTSIDE
			     it — printed over the lower rim, the dial and the rivets, which is
			     the least legible band on the whole plate. Inside the clear zone
			     the digits sit on glass. -->
			<Text
				text={`${frame.mult}x`}
				anchor={{ x: 0.5, y: 0.5 }}
				y={span * 0.22}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					// The number grows with the tier, so the ladder is legible without
					// actually reading the digits — but it is sized off SYMBOL_SIZE, not
					// off `span`. A 3x3's label scaled to its footprint would be three
					// times the height of a 1x1's for a value that is only worth three
					// times as much through geometry the player can already see; the
					// footprint IS the size cue, and doubling up on it just makes the
					// board shout. It gets a modest bump instead.
					fontSize:
						SYMBOL_SIZE *
						(tier === 'elite' ? 0.33 : tier === 'premium' ? 0.28 : 0.24) *
						(1 + (sizeOf(frame) - 1) * 0.18),
					fill: tint,
					stroke: { color: 0x0e0f11, width: SYMBOL_SIZE * 0.045 },
				}}
			/>
		</Container>
	{/each}

</BoardContainer>
