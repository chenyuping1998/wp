<script lang="ts" module>
	/**
	 * The trigger tease: the priestess rises behind the board, the talisman in her
	 * hand burns brighter and brighter, and then it goes out - and the free spins
	 * open.
	 *
	 * ── what this is and is not ──
	 *
	 * It is PRESENTATION ONLY. It plays on a spin the maths has already decided
	 * will trigger, after the reels have stopped and before the trigger event is
	 * handled. It cannot change an outcome, it cannot be skipped into a different
	 * outcome, and it never plays on a spin that does not trigger - a tease that
	 * can lie about what is coming is the one thing certification will not have.
	 *
	 * It plays on HALF of those spins, and which half is decided from the board
	 * itself rather than from Math.random - see `shouldTease` in
	 * game/bookEventHandlerMap. A replay of the same round has to show the same
	 * thing, and a round is only its book.
	 */
	export type EmitterEventTriggerTease =
		| { type: 'triggerTeasePlay' }
		| { type: 'triggerTeaseStop' };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';

	const context = getContext();

	// One light, on one object. art-bible 2.1.
	const TALISMAN = 0xf2d544;
	const CANDLE = 0xffcb6b;

	// ── where the light goes, and where it does not ──────────────────────────
	//
	// ONLY the talisman in her hand.
	//
	// The first version lit three things: an aura around her whole figure, her
	// sprite ramping toward full alpha, and an additive bloom over every carrier
	// on the board. All of it at once, all of it building - the screen went pale
	// and nothing in particular was being pointed at.
	//
	// It also inherited a fault it did not cause: the downscale that produces
	// priestess.png was unpremultiplying its box filter with an extra factor of n,
	// so the sprite itself was clipped to near-white before this component drew a
	// single pixel. That is fixed in design/import_cover.mjs; the note is here
	// because "the tease is too bright" was true and the tease was not the reason.
	//
	// She is now drawn at her own brightness and nothing is added to her. What
	// builds is the paper she is holding: measured off the sprite as a fraction of
	// it, so it follows the art rather than being placed by eye.
	const HAND_CX = 0.665;
	const HAND_CY = 0.52;
	// Radius of the glow, as a fraction of the sprite's larger side. The slip is
	// about 0.15 wide and 0.21 tall; the light spreads a little past it, the way
	// light does.
	const HAND_R = 0.155;

	// ── the beats ─────────────────────────────────────────────────────────────
	//
	// RISE   she fades up from behind the board and settles
	// BURN   the paper in her hand climbs from its own brightness to far past it
	// SNAP   it goes out, in a fraction of the time it took to build
	//
	// The asymmetry is the whole effect. A slow build and a fast cut reads as
	// something being taken; a slow build and a slow fade reads as nothing having
	// happened.
	const RISE_MS = 520;
	const BURN_MS = 900;
	const SNAP_MS = 180;
	const TOTAL_MS = RISE_MS + BURN_MS + SNAP_MS;

	let elapsed = $state(-1);
	let raf = 0;

	const stop = () => {
		cancelAnimationFrame(raf);
		raf = 0;
	};

	context.eventEmitter.subscribeOnMount({
		triggerTeasePlay: () =>
			new Promise<void>((resolve) => {
				stop();
				// NO VOICE HERE for now.
				//
				// The tease had a synthesized chant under it - formant synthesis, see
				// `voice` in design/generate_audio_terminal.mjs - and it is being
				// replaced with a recording. The cue, the file and the wiring in
				// Sound.svelte all still exist; this is the one line that fires it, so
				// putting the voice back is putting this line back.
				elapsed = 0;
				const t0 = performance.now();
				const step = (now: number) => {
					elapsed = now - t0;
					if (elapsed >= TOTAL_MS) {
						elapsed = -1;
						stop();
						resolve();
						return;
					}
					raf = requestAnimationFrame(step);
				};
				raf = requestAnimationFrame(step);
			}),
		triggerTeaseStop: () => {
			stop();
			elapsed = -1;
		},
	});

	onDestroy(stop);

	const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
	const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3;

	const playing = $derived(elapsed >= 0);

	/** 0..1 as she comes up; stays 1 until the snap takes her. */
	const rise = $derived(playing ? easeOut(elapsed / RISE_MS) : 0);

	/**
	 * How hard the talisman is burning, 0..1.
	 *
	 * Starts at 0 - the sprite is already drawn at its own brightness, and this is
	 * what is ADDED to it. "From its original brightness" is not a starting value
	 * to set; it is a starting value to leave alone.
	 */
	const burn = $derived.by(() => {
		if (!playing) return 0;
		const t = clamp01((elapsed - RISE_MS) / BURN_MS);
		// accelerating, so the last third is most of the light
		return t * t;
	});

	/** 1 until the snap, then to 0 fast. Multiplies everything. */
	const alive = $derived.by(() => {
		if (!playing) return 0;
		const from = RISE_MS + BURN_MS;
		if (elapsed < from) return 1;
		return 1 - clamp01((elapsed - from) / SNAP_MS);
	});

	const layout = $derived(context.stateGameDerived.boardLayout());

	// She is drawn at a fraction of the BOARD's height rather than the canvas's,
	// so she keeps her scale against the reels on every layout preset. 1.24 puts
	// her head above the board's top edge and her hem below it.
	const HEIGHT_OF_BOARD = 1.24;
	// priestess.png is 579x560; written by design/import_cover.mjs from the keyed
	// cover, which is where the number to change lives if the art is redrawn.
	const ASPECT = 579 / 560;

	const figure = $derived.by(() => {
		const height = layout.height * HEIGHT_OF_BOARD;
		return {
			width: height * ASPECT,
			height,
			// centred on the board, drifting up as she arrives
			x: getSymbolX(2),
			y: getSymbolY(2) + layout.height * 0.06 * (1 - rise),
		};
	});

	/** Where the talisman is, in board coordinates, once she is placed. */
	const hand = $derived({
		x: figure.x + (HAND_CX - 0.5) * figure.width,
		y: figure.y + (HAND_CY - 0.5) * figure.height,
		r: Math.max(figure.width, figure.height) * HAND_R,
	});

	/**
	 * The light on the paper.
	 *
	 * Additive, and a DIRECT SIBLING of the sprite it is lighting - not inside a
	 * mask or a filter. An additive layer in an isolated render target has nothing
	 * to add to and arrives as a faint film over the artwork instead of as light in
	 * it; that trap has cost this project an upload before.
	 */
	const drawBurn = (g: PixiGraphics) => {
		g.clear();
		if (!playing || alive <= 0) return;
		const level = burn * alive;
		if (level <= 0.001) return;

		// Four steps of falloff, widest and faintest first, so it reads as light
		// rather than as a disc with an edge. The whole stack grows a little as it
		// builds - light spreads as it gets stronger.
		const spread = 0.8 + 0.45 * level;
		for (const [mult, weight, colour] of [
			[1.9, 0.05, CANDLE],
			[1.25, 0.1, CANDLE],
			[0.8, 0.16, TALISMAN],
			[0.45, 0.24, TALISMAN],
		] as [number, number, number][]) {
			g.circle(hand.x, hand.y, hand.r * mult * spread);
			g.fill({ color: colour, alpha: weight * level });
		}
	};
</script>

{#if playing}
	<Container>
		<!--
			Her, then the light on the paper. Nothing under her and nothing over her
			except that one glow: she arrives by fading in and then stays exactly as
			painted for the rest of it.
		-->
		<Sprite
			key="mcPriestess"
			anchor={0.5}
			x={figure.x}
			y={figure.y}
			width={figure.width}
			height={figure.height}
			alpha={rise * alive}
		/>
		<Graphics draw={drawBurn} blendMode="add" />
	</Container>
{/if}
