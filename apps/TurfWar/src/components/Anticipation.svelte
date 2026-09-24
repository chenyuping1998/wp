<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import { isFullTier, tierIntensity, pulseRateMs, beamAt } from '../game/anticipationFocus';

	type Props = {
		reel: Reel;
		// Gated anticipation magnitude for this spin (see stateGame.anticipation).
		// 1 = two scatters on the board, so the reel *could* still trigger.
		// 2+ = three or more are already down, so this reel is spinning for a
		// bigger tier and the trigger is banked. Defaults to the full tier if a
		// caller omits it, so a missing value never silently downgrades a real
		// three-scatter tease.
		magnitude?: number;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Two tiers, not a continuous ramp: the whole point is that a player can tell
	// the two states apart at a glance. The low tier is a dimmer magenta column
	// with no chevrons and no rail flare; the full tier adds the white core, the
	// cyan chevrons converging on the reel, and the rail glow.
	//
	// The numbers live in game/anticipationFocus.ts so that
	// design/check_anticipation.mjs can assert the escalation this file's
	// comments claim — brighter, faster and closer at the higher tier, and more
	// urgent at each reel to the right.
	const fullTier = $derived(isFullTier(props.magnitude));
	const intensity = $derived(tierIntensity(props.magnitude));

	let pulse = $state(0);
	// ms since the tease started, driving the travelling beam
	let elapsed = $state(0);
	const beam = $derived(beamAt(elapsed, props.magnitude));
	let finished = $state(false);

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board. The
		// phase alone does the de-syncing, so the period is free to carry tension.
		//
		// `rate` is the sine period in ms, so SMALLER is faster. It used to be
		// `145 + reelIndex * 11`, which made every reel pulse slower than the one
		// before it — tension falling away as the payoff approached. Now it drops
		// per reel, and the low tier (two scatters, not yet a trigger) runs slower
		// still so the full tier is audibly and visibly the more urgent one.
		const phase = props.reel.reelIndex * 0.9;
		const rate = pulseRateMs(props.reel.reelIndex, props.magnitude);

		// requestAnimationFrame, not the 24ms interval this used to run on. The
		// beam travels the whole board in under a second and a 41fps sampler puts
		// a visible stagger on a shaft of light moving in a straight line — the
		// same reason the win and landing motions were moved off setInterval.
		const started = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			elapsed = now - started;
			pulse = 0.5 + 0.5 * Math.sin(now / rate + phase);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});

	$effect(() => {
		// Stop immediately when reel stops to avoid the heavy "falling/landing" outro feel.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});
</script>

<BoardContainer>
	<!--
		Neon wash over the whole teasing column, brightest at the rails.

		Was GoBananas' amber/brass (0xff9c2e / 0xffc38a / 0xffe98a / 0xffc65e) —
		this file had never been edited since day one, so the jungle-palette sweeps
		never reached it. Repainted in Hot Miami's own two signal colours: magenta
		for the tube, white for its core (which is how a real neon tube reads:
		saturated at the edge, blown out in the middle), and cyan only on the full
		tier so the escalation carries a second hue as well as more light.
	-->
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			g.beginFill(0xf5893d, (0.1 + 0.12 * pulse) * intensity);
			g.drawRoundedRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
			g.endFill();

			// full-height frame: nested strokes so the edge reads as a lit tube
			// Pixi 8 strokes: build path, then stroke. v7's lineStyle renders nothing.
			g.roundRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13);
			g.stroke({ width: 7, color: 0xf5893d, alpha: (0.3 + 0.34 * pulse) * intensity });
			g.roundRect(LEFT + 6, 6, SYMBOL_SIZE - 12, h - 12, 10);
			g.stroke({ width: 3, color: 0xd9d6ce, alpha: (0.45 + 0.4 * pulse) * intensity });
			if (fullTier) {
				// white core — the tier-2 tell that the trigger count is already met
				g.roundRect(LEFT + 10, 10, SYMBOL_SIZE - 20, h - 20, 8);
				g.stroke({ width: 1.4, color: 0xffffff, alpha: 0.25 + 0.4 * pulse });
			}

			// cell ticks down the column so the frame reads as slots, not a tube
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
			}
			g.stroke({ width: 1.5, color: 0xd9d6ce, alpha: (0.16 + 0.2 * pulse) * intensity });

			// chevrons converging on the column from above and below — full tier only
			if (fullTier) {
				const chev = 14 + 6 * pulse;
				g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
				g.lineTo(x, -chev);
				g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
				g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
				g.lineTo(x, h + chev);
				g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
				g.stroke({ width: 4, color: 0xd9d6ce, alpha: 0.5 + 0.4 * pulse });
			}
		}}
	/>

	<!--
		Travelling beam.

		This is the piece the tease was missing: the column was lit, but it was lit
		STATICALLY, so it announced "something is happening here" without ever
		looking like light. A shaft that runs down the reel and repeats gives the
		column a direction and a rhythm the eye follows, and it is the cheapest
		version of what competitors do with a full light rig.
	-->
	{#if beam.alpha > 0.01}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={beam.y * BOARD_SIZES.height}
			width={SYMBOL_SIZE * 0.92}
			height={SYMBOL_SIZE * beam.height * 3}
			tint={fullTier ? 0xffffff : 0xffc38a}
			blendMode="add"
			alpha={beam.alpha}
		/>
	{/if}

	<!-- additive glow hugging each rail, so the tease has depth over the art -->
	{#each [0, BOARD_SIZES.height] as railY (railY)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={railY}
			width={SYMBOL_SIZE * (fullTier ? 1.35 : 1.05)}
			height={SYMBOL_SIZE * (fullTier ? 0.7 : 0.5)}
			tint={0xf5893d}
			blendMode="add"
			alpha={(0.22 + 0.3 * pulse) * intensity}
		/>
	{/each}
</BoardContainer>
