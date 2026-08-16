<script lang="ts" module>
	import type { FeatureName } from '../game/types';

	export type EmitterEventFeatureBags =
		| { type: 'featureBagsShow' }
		| { type: 'featureBagsHide' }
		// awaited: resolves once every bag that was going to burst has burst and
		// been held, so the transition into the feature cannot start while the
		// player is still being told what they won
		| { type: 'featureBagsBurst'; features: FeatureName[] }
		// back to three sealed bags, for the next round
		| { type: 'featureBagsReset' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getSymbolX } from '../game/utils';
	import { BODY_FONT } from '../game/fonts';
	import { FEATURE_NAMES, type FeatureName } from '../game/types';
	import {
		SYMBOL_SIZE,
		FEATURE_BAG_ACCENT,
		FEATURE_BAG_ASSET,
		FEATURE_BAG_ASPECT,
		FEATURE_BAG_LABEL,
		FEATURE_BAG_CELL_RATIO,
		FEATURE_BAG_GAP_ABOVE_BOARD,
		BAG_SHAKE_MS,
		BAG_BURST_MS,
		BAG_STAGGER_MS,
		BAG_HOLD_MS,
		BAG_DORMANT_ALPHA,
	} from '../game/constants';

	const context = getContext();

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	// Drawn in BOARD space, inside BoardContainer - the same frame the reels and
	// ScatterTrigger use, and NOT inside BoardMask, so nothing is clipped.
	//
	// This is deliberate and it is the second attempt. The first drew in main-box
	// space and mapped board->main by hand, the way MultiplierMeter does. The
	// arithmetic was right - reels 1, 3 and 5 came out at exactly the x the reels
	// are drawn at - and the bags still did not line up on screen, which left a
	// transform I could not verify standing between "correct" and "correct where
	// the player is looking".
	//
	// Here there is no transform to get wrong. A bag's x IS the reel's x, by the
	// same call the symbols use, and the sizes are in cells because board space
	// is measured in cells. BoardContainer applies the fit once, to all of it.
	const cell = SYMBOL_SIZE;
	const bagSize = cell * FEATURE_BAG_CELL_RATIO;
	const half = bagSize / 2;

	// One bag per reel: reels 1, 3 and 5. The two empty gaps read as the two
	// reels that have no bag, rather than as loose spacing in a centred row.
	const BAG_REELS = [0, 2, 4];
	const bagX = (index: number) => getSymbolX(BAG_REELS[index]);
	// Board space puts the top edge of the visible grid at y = 0, so the bags sit
	// at negative y. They ride the board: when the feature opens it upward, they
	// are already gone.
	const bagY = -(FEATURE_BAG_GAP_ABOVE_BOARD + half);

	// Starts shown: three sealed bags are part of the idle base game, and waiting
	// for a book event to reveal them means they are missing on the screen the
	// player actually arrives at.
	let show = $state(true);
	let opened = $state<FeatureName[]>([]);
	// Set for the whole burst sequence so the bags that are NOT in it can dim
	// while the others open - the contrast is what makes "you got two of three"
	// legible at a glance.
	let decided = $state<FeatureName[]>([]);

	// Per-bag animation clocks, keyed by feature. Each runs 0..1 once.
	const shake = {
		expand: new Tween(0, { duration: BAG_SHAKE_MS }),
		mult: new Tween(0, { duration: BAG_SHAKE_MS }),
		ways: new Tween(0, { duration: BAG_SHAKE_MS }),
	} satisfies Record<FeatureName, Tween<number>>;
	const burst = {
		expand: new Tween(0, { duration: BAG_BURST_MS, easing: backOut }),
		mult: new Tween(0, { duration: BAG_BURST_MS, easing: backOut }),
		ways: new Tween(0, { duration: BAG_BURST_MS, easing: backOut }),
	} satisfies Record<FeatureName, Tween<number>>;
	const dim = new Tween(1, { duration: BAG_BURST_MS, easing: cubicOut });

	const resetClocks = () => {
		for (const name of FEATURE_NAMES) {
			shake[name].set(0, { duration: 0 });
			burst[name].set(0, { duration: 0 });
		}
		dim.set(1, { duration: 0 });
	};

	/**
	 * Shake, then split. Only ever one `set` per clock is in flight, which is what
	 * makes awaiting safe here: Svelte's Tween abandons the promise of an
	 * in-flight `set` when a later `set` retargets it, and this whole sequence is
	 * awaited by the book handler - an orphaned promise would stop the round dead.
	 */
	const burstOne = async (name: FeatureName, index: number) => {
		if (index > 0) await wait(index * BAG_STAGGER_MS);
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await shake[name].set(1);
		context.eventEmitter.broadcast({ type: 'soundSlam' });
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.5 });
		opened = [...opened, name];
		await burst[name].set(1);
	};

	context.eventEmitter.subscribeOnMount({
		featureBagsShow: () => {
			show = true;
		},
		featureBagsHide: () => {
			show = false;
		},
		featureBagsReset: () => {
			opened = [];
			decided = [];
			resetClocks();
		},
		featureBagsBurst: async ({ features }) => {
			show = true;
			opened = [];
			decided = features;
			resetClocks();
			dim.set(BAG_DORMANT_ALPHA);
			await Promise.all(features.map((name, index) => burstOne(name, index)));
			await wait(BAG_HOLD_MS);
		},
	});

	const openness = (name: FeatureName) => burst[name].current;
	// Sideways jitter that decays as the shake completes, so it settles into the
	// split rather than stopping dead before it.
	const jitter = (name: FeatureName) => {
		const t = shake[name].current;
		if (t === 0 || t === 1) return 0;
		return Math.sin(t * Math.PI * 11) * (cell * 0.11) * (1 - t);
	};
	const bagAlpha = (name: FeatureName) =>
		decided.length === 0 || decided.includes(name) ? 1 : dim.current;

	// Shards thrown by the burst. Derived from the burst clock rather than kept
	// as state - there is nothing to remember, and a per-shard object would be
	// twelve more proxies to update every frame for no gain.
	const SHARDS = 10;
	const shardAngles = Array.from({ length: SHARDS }, (_, i) => (i / SHARDS) * Math.PI * 2);
</script>

{#if show}
	<Container>
			{#each FEATURE_NAMES as name, index (name)}
				{@const accent = FEATURE_BAG_ACCENT[name]}
				{@const open = openness(name)}
				{@const cx = bagX(index) + jitter(name)}
				<Container x={cx} y={bagY} alpha={bagAlpha(name)}>
					<!--
						Modern Pixi v8 path API throughout: build the path, then fill
						and/or stroke it. The v7-style `lineStyle` + `drawRoundedRect`
						still exists behind a deprecation shim, but a STROKE-ONLY path
						written that way never reached the screen here - the first
						version of this component drew its outlines that way and the
						only thing visible on the board was the question mark.

						No additive blending either. These sit in MainContainer rather
						than inside the board's mask so it would probably work, but an
						additive layer is invisible the moment anything above it gains a
						mask or a filter, and nothing here needs it.
					-->

					<!-- glow pad, so the bag separates from the background art -->
					<Graphics
						draw={(g) => {
							g.clear();
							// Deliberately tight. The first version bloomed to nearly
							// three cells across and swamped the thing it was meant to
							// light, which is also what stole attention from the word.
							g.circle(0, 0, half * (1.02 + open * 0.35));
							g.fill({ color: accent, alpha: 0.11 * (1 - open * 0.6) });
						}}
					/>

					<!-- burst shockwave -->
					{#if open > 0}
						<Graphics
							draw={(g) => {
								g.clear();
								g.circle(0, 0, half * (0.7 + open * 1.15));
								g.stroke({ width: Math.max(2, cell * 0.045 * (1 - open)), color: 0xffffff, alpha: 0.7 * (1 - open) });
								g.circle(0, 0, half * (0.55 + open * 0.85));
								g.stroke({ width: Math.max(2, cell * 0.04 * (1 - open)), color: accent, alpha: 0.75 * (1 - open) });
							}}
						/>

						<!-- shards -->
						<Graphics
							draw={(g) => {
								g.clear();
								const dist = half * (0.4 + open * 1.4);
								const size = cell * 0.1 * (1 - open);
								if (size <= 0) return;
								for (const a of shardAngles) {
									const x = Math.cos(a) * dist;
									const y = Math.sin(a) * dist;
									g.moveTo(x, y - size);
									g.lineTo(x + size * 0.6, y);
									g.lineTo(x, y + size);
									g.lineTo(x - size * 0.6, y);
									g.closePath();
									g.fill({ color: accent, alpha: 0.9 * (1 - open) });
								}
							}}
						/>
					{/if}

					<!--
						The bag itself: supplied art, cut off its dark matte by
						design/dekey_neon_art.mjs. It is the sealed state, and the
						burst destroys it - the word takes its place at the same
						point on screen, so the bag is seen to BECOME the modifier
						rather than to sit next to a caption.
					-->
					{#if open < 1}
						<Sprite
							key={FEATURE_BAG_ASSET[name]}
							anchor={0.5}
							alpha={Math.max(0, 1 - open / 0.45)}
							width={bagSize * FEATURE_BAG_ASPECT[name] * (1 + open * 0.5)}
							height={bagSize * (1 + open * 0.5)}
						/>
					{/if}

					<!--
						A question mark in the hollow of a sealed bag. The art is an
						outline, so its middle is empty; this fills it and says what
						the empty middle means.
					-->
					{#if open === 0}
						<Text
							anchor={0.5}
							y={bagSize * 0.08}
							alpha={0.85}
							text="?"
							style={{
								fontFamily: BODY_FONT,
								fontSize: Math.round(bagSize * 0.38),
								fontWeight: '700',
								fill: accent,
								letterSpacing: 0,
							}}
						/>
					{/if}

					<!--
						The word the bag turned into. Scales in from small as the bag
						comes apart, in the bag's own colour: red says EXPAND, gold
						says MULTIPLIER, purple says WAYS, and the player only has to
						learn that once.
					-->
					{#if open > 0.22}
						{@const t = Math.min(1, (open - 0.22) / 0.38)}
						<!--
							Overshoot, then settle: 1.22 at just past half way, back to
							1.0 by the end. That is what reads as the word being thrown
							out of the bag rather than fading up in place.
						-->
						{@const pop = t < 0.55 ? (t / 0.55) * 1.22 : 1.22 - 0.22 * ((t - 0.55) / 0.45)}
						<Text
							anchor={0.5}
							alpha={Math.min(1, t * 2.5)}
							scale={pop}
							text={FEATURE_BAG_LABEL[name]}
							style={{
								fontFamily: BODY_FONT,
								// Scaled down for long words. The bags sit above reels 1,
								// 3 and 5, so each word has about two cells of room, and
								// MULTIPLIER is ten characters where WAYS is four - one
								// size for all three would either overflow the long one
								// or waste the short ones.
								fontSize: Math.round(
									cell * 0.32 * Math.min(1, 9 / FEATURE_BAG_LABEL[name].length),
								),
								fontWeight: '700',
								fill: accent,
								letterSpacing: 1.4,
								stroke: { color: 0x05100c, width: Math.max(2, cell * 0.035) },
							}}
						/>
					{/if}
				</Container>
			{/each}
	</Container>
{/if}
