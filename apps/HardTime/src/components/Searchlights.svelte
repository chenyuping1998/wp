<script lang="ts" module>
	import type { LitCell, BonusTier } from '../game/typesBookEvent';
	export type { LitCell };

	export type EmitterEventSearchlights =
		/** One searchlight swept its reel. `cells` carry their RESULTING values. */
		| { type: 'searchlightSweep'; reel: number; row: number; mult: number; cells: LitCell[] }
		/** Sticky beams restated at the start of a free spin. Nothing arrives. */
		| { type: 'lightsCarry'; cells: LitCell[] }
		| { type: 'bonusTierEnter'; tier: BonusTier; seedLights: number }
		| { type: 'lightsClear' };
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
	const keyOf = (cell: { reel: number; row: number }) => `${cell.reel},${cell.row}`;

	// A lit cell is exactly one cell. Capo Nostra's frames carried a `size` and
	// every sprite below was measured against that footprint; a searchlight has
	// no footprint of its own — the BEAM has length, but each lit cell is a
	// single square carrying its own value, because same-reel doubling gives
	// neighbouring cells of one beam different multipliers.
	const SPAN = SYMBOL_SIZE;

	type ActiveCell = LitCell & {
		scale: Tween<number>;
		glow: Tween<number>;
		/**
		 * ms since this cell lit, or -1 once its arrival is over.
		 *
		 * The arrival is NOT a tween: a 1x and a 100x would otherwise share one
		 * 260ms pop, so a hundred-fold difference in money would arrive with the
		 * identical gesture. It is a per-tier motion from game/frameBeat.ts,
		 * sampled per frame, and `design/check_frame_beat.mjs` fails the build if
		 * the three tiers stop escalating or start sharing a shape.
		 */
		entryT: number;
		/** the tier this cell ENTERED as, so a doubling cannot restyle mid-arrival */
		entryTier: 'plain' | 'premium' | 'elite';
	};

	let active = $state<ActiveCell[]>([]);

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

	const makeCell = (cell: LitCell, from: number): ActiveCell => ({
		...cell,
		scale: new Tween(from, { duration: 260, easing: backOut }),
		glow: new Tween(0.55, { duration: 260, easing: cubicOut }),
		// `from === 0` means this cell is lighting up; anything else is a cell
		// already lit being restated, which has its own punch and must not replay
		// the arrival.
		entryT: from === 0 ? 0 : -1,
		entryTier: beatTierOf(cell.mult),
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
			for (const cell of active) {
				if (cell.entryT < 0) continue;
				cell.entryT += dt;
				if (cell.entryT >= ENTRY_MS[cell.entryTier]) cell.entryT = -1;
				else live = true;
			}
			// reassign so Svelte sees the mutation of the array's members
			active = active;
			entryRaf = live ? requestAnimationFrame(tick) : 0;
		};
		entryRaf = requestAnimationFrame(tick);
	};

	/** The arrival pose, or the resting pose once the arrival is done. */
	const entryPose = (cell: ActiveCell) =>
		cell.entryT < 0 ? null : frameEntry(cell.entryT, cell.entryTier);

	const cellX = (cell: ActiveCell) => getSymbolX(cell.reel);
	const cellY = (cell: ActiveCell) => rowCenterY(cell.row);

	const upsert = (cells: LitCell[], entryScale: number) => {
		const incoming = new Map(cells.map((cell) => [keyOf(cell), cell]));
		const kept = active.filter((cell) => !incoming.has(keyOf(cell)));
		const updated = cells.map((cell) => {
			const existing = active.find((candidate) => keyOf(candidate) === keyOf(cell));
			if (existing) {
				existing.mult = cell.mult;
				existing.doubled = cell.doubled;
				return existing;
			}
			return makeCell(cell, entryScale);
		});
		active = [...kept, ...updated];
		// Cells that are LIGHTING UP run their per-tier motion; the tween is only
		// still used for the restate and doubling punches.
		updated.forEach((cell) => {
			if (cell.entryT >= 0) {
				cell.scale.set(1, { duration: 0 });
				cell.glow.set(1, { duration: 0 });
			} else {
				cell.scale.set(1, { duration: scaled(T.entryMs), easing: backOut });
			}
		});
		if (updated.some((cell) => cell.entryT >= 0)) runEntries();
	};

	// Capo Nostra held a spin's frames until each frame's own reel stopped, so a
	// frame landed with its symbol. There is nothing to hold here: a beam is not
	// revealed with the board, it sweeps AFTER the reels have stopped, as a
	// consequence of the light that landed. The pending/per-reel path is gone
	// rather than disabled, because a dead code path that still compiles is how
	// the next person concludes the behaviour is configurable.

	context.eventEmitter.subscribeOnMount({
		searchlightSweep: async ({ cells }) => {
			// Split by what actually happened to each cell. They arrive in one
			// event and they are two different things to watch: a cell lighting
			// for the first time, and a cell that was already lit being doubled
			// by a second beam. Playing them identically would throw away the
			// only escalation this mechanic has.
			const fresh = cells.filter((cell) => !cell.doubled);
			const doubled = cells.filter((cell) => cell.doubled);

			if (fresh.length > 0) upsert(fresh, 0);

			if (doubled.length > 0) {
				upsert(doubled, 1);
				const touched = active.filter((cell) =>
					doubled.some((candidate) => keyOf(candidate) === keyOf(cell)),
				);
				// A harder punch than an arrival: the number on the board did not
				// appear, it JUMPED, and the gesture has to say so.
				await Promise.all(
					touched.map((cell) =>
						cell.scale.set(1.35, { duration: scaled(T.doubleOutMs), easing: backOut }),
					),
				);
				await Promise.all(
					touched.map((cell) =>
						cell.scale.set(1, { duration: scaled(T.doubleInMs), easing: cubicOut }),
					),
				);
			}

			if (fresh.length > 0) await pause(T.entryMs);
		},
		lightsCarry: async ({ cells }) => {
			// Sticky beams restated at the start of a free spin. These are not
			// arriving — they never left — so they are placed at rest with no
			// entry motion and no sound.
			upsert(cells, 1);
			active.forEach((cell) => {
				cell.entryT = -1;
				cell.scale.set(1, { duration: 0 });
				cell.glow.set(1, { duration: 0 });
			});
		},
		bonusTierEnter: async () => {
			active = [];
		},
		lightsClear: async () => {
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
	const PLAIN = 0x8fb4c8;
	const PREMIUM = 0xbcd3df;
	const ELITE = 0xdce8f0;

	/**
	 * What a lit cell is worth, for styling. Simply its multiplier.
	 *
	 * Capo Nostra multiplied by the frame's side length here, because a 3x3 was
	 * collected once per cell a line crossed and so a big frame at 8x outweighed
	 * a small one at 8x. A lit cell has no footprint — it IS one cell — so the
	 * printed number and the weight are the same thing again.
	 */
	const weightOf = (cell: { mult: number }) => cell.mult;

	const tierOf = (weight: number) => (weight >= 25 ? 'elite' : weight >= 10 ? 'premium' : 'plain');
	const tintOf = (weight: number) => (weight >= 25 ? ELITE : weight >= 10 ? PREMIUM : PLAIN);
	// `plain` gets no halo at all, so an ordinary spin does not turn the grid into
	// a field of glows.
	const haloOf = (weight: number) => (weight >= 25 ? 2.4 : weight >= 10 ? 1.7 : 0);
	// Single-cell art only. The 2x2/3x3 castings Capo Nostra chose between are
	// gone with the frames; ART_AUDIO_BRIEF.md specifies a per-cell multiplier
	// plate instead, and this is the one place that will point at it.
	const ART_KEY = 'hmFrame1x1';
	const EDGE_KEY = 'hmFrameEdge1x1';

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
	{#each active as cell (keyOf(cell))}
		{@const weight = weightOf(cell)}
		{@const tier = tierOf(weight)}
		{@const tint = tintOf(weight)}
		{@const halo = haloOf(weight)}
		{@const pose = entryPose(cell)}
		{@const artKey = ART_KEY}
		{@const edgeKey = EDGE_KEY}
		{@const glow = pose ? pose.glow : cell.glow.current}
		{@const span = SPAN}
		<Container
			x={cellX(cell)}
			y={cellY(cell)}
			scale={(pose ? pose.scale : 1) * cell.scale.current}
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
			<!-- halo: nothing on a plain 1x-9x, a warm bloom on premium, bigger and
			     brighter on elite. Sized off ONE CELL — a lit cell has no footprint
			     to scale against, and a bloom wider than the cell washes out the
			     symbol the multiplier exists to multiply. -->
			{#if halo > 0}
				{@const haloSpan = SYMBOL_SIZE * halo}
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

			<!-- The multiplier sits at 0.22 of the span below centre, not 0.34.
			     The plates carry a cleared centre circle of radius ~0.31 x span
			     (design/soften_frames.py), and 0.34 put the number just OUTSIDE
			     it — printed over the lower rim, which is the least legible band on
			     the whole plate. Inside the clear zone the digits sit on glass. -->
			<Text
				text={`${cell.mult}x`}
				anchor={{ x: 0.5, y: 0.5 }}
				y={span * 0.22}
				style={{
					fontFamily: DISPLAY_FONT,
					fontWeight: DISPLAY_FONT_WEIGHT,
					// The number grows with the tier, so the ladder is legible without
					// actually reading the digits.
					fontSize:
						SYMBOL_SIZE * (tier === 'elite' ? 0.33 : tier === 'premium' ? 0.28 : 0.24),
					fill: tint,
					stroke: { color: 0x1a1206, width: SYMBOL_SIZE * 0.045 },
				}}
			/>
		</Container>
	{/each}

</BoardContainer>
