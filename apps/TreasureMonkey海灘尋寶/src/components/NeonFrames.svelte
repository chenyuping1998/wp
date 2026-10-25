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
 import DigZone from './DigZone.svelte';

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

	/**
	 * Where the plate body actually sits inside each PNG, as fractions of the
	 * image (alpha > 40 across 80% of a row/column, measured on
	 * static/assets/sprites/capoFrames). The 2x2 briefcase carries its handle
	 * ABOVE the body, so its plate only starts 11% down; stretching the whole
	 * image to the footprint left the top row of symbols poking up past the gold
	 * bar. The sprite is now sized so the BODY covers the footprint exactly and
	 * the handle hangs above it.
	 */
	const PLATE_BOX: Record<number, { top: number; bottom: number; left: number; right: number }> = {
		1: { top: 0.016, bottom: 0.98, left: 0.016, right: 0.984 },
		2: { top: 0.111, bottom: 0.975, left: 0.02, right: 0.979 },
		3: { top: 0.018, bottom: 0.969, left: 0.034, right: 0.966 },
	};
	const plateFit = (frame: { size?: number }, span: number) => {
		const box = PLATE_BOX[Math.min(3, sizeOf(frame))];
		const width = span / (box.right - box.left);
		const height = span / (box.bottom - box.top);
		return {
			width,
			height,
			x: (0.5 - (box.left + box.right) / 2) * width,
			y: (0.5 - (box.top + box.bottom) / 2) * height,
		};
	};

</script>
<BoardContainer>
 {#each active as frame (keyOf(frame))}
  <Container x={getSymbolX(frame.reel)+centreOffset(frame)} y={rowCenterY(frame.row)+centreOffset(frame)}>
   <DigZone size={sizeOf(frame)} mult={frame.mult} time={frame.entryT} duration={ENTRY_MS[frame.entryTier]} glow={frame.glow.current} pulse={Math.max(0,frame.scale.current-1)/.35} sticky={context.stateGame.gameType==='freegame'} onflip={()=>context.eventEmitter.broadcast({type:'soundTreasureFoley',cue:'plaque_flip'})}/>
  </Container>
 {/each}
</BoardContainer>
