<script lang="ts" module>
	export type EmitterEventMultiplierStrike = {
		type: 'multiplierStrike';
		multiplier: number;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { tierOf } from '../game/multiplierTiers';
	import { badgeLayout } from './FreeSpinMultiplier.svelte';
	import GoldText from './GoldText.svelte';

	// ── THE SECOND BEAT: the multiplier comes down onto the win ────────────────
	//
	// A free-game win is presented in two stages when the round carries a
	// multiplier above x1:
	//
	//   1. the board pays what the WAYS actually made — the pre-multiplier figure
	//   2. the multiplier drops out of the corner into the middle of the board,
	//      lands on it, and every amount becomes what the book pays
	//
	// JUST THE NUMBER FLIES, not the badge. The plate, its rim and its halo are
	// how the badge holds its corner and how the wheel's cells tell each other
	// apart — carried into the middle of the board they are a box flying at the
	// player, and the box is not the point. What the player has to read is "x3".
	// The tier still arrives with it, as the colour of the light behind the
	// number, so an x5 lands hotter than an x2 without a frame around it.
	//
	// One event split into two is the whole point. In one stage the player is
	// handed a finished number and has nothing to hope for while it counts; in
	// two, the first number is a floor and the second is the part with upside —
	// and they already know from the corner how big that part is.
	//
	// IT IS SKIPPED AT x1, always. There the two stages would show the same
	// number twice and the flight would be a ceremony for nothing, which is worse
	// than no ceremony at all — it teaches the player to sit through it.
	//
	// NO ARITHMETIC HAPPENS HERE. The strike is a picture; the amounts on either
	// side of it are both the book's (WinWays takes winBase then win). If this
	// component multiplied anything, a rounding could put a number on screen the
	// game does not pay.

	const context = getContext();

	// Drop, land, hold. Short: this runs on most winning spins of a round.
	const FLY_MS = 420;
	const FLY_MS_TURBO = 260;
	const HOLD_MS = 520;
	const HOLD_MS_TURBO = 300;

	let show = $state(false);
	let value = $state(1);
	let t = $state(0); // 0..1 through the flight
	let landed = $state(false);
	// 1 at the instant of impact, decaying to 0 — the squash that makes the plate
	// arrive rather than simply stop
	let pop = $state(0);
	// ...and how far through the hold it is, which is what clears it off the board
	let after = $state(0);
	let raf = 0;
	let killTimer = 0;
	let popTimer: ReturnType<typeof setInterval> | null = null;

	onDestroy(() => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		if (popTimer !== null) clearInterval(popTimer);
	});

	// THE PLATE HAS TO GET OUT OF THE WAY, and that is not a detail.
	//
	// It lands in the middle of the board, which is exactly where the amounts it
	// is multiplying are. Rendered, it covered the number it had just changed —
	// the one thing the player is there to read. So the impact squashes it (pop)
	// and then it swells and fades out over the rest of the hold, which also reads
	// better than a plate that simply vanishes: the multiplier goes INTO the
	// board rather than sitting on it.
	const POP_MS = 240;
	const startAfter = (holdMs: number) => {
		if (popTimer !== null) clearInterval(popTimer);
		const t0 = Date.now();
		pop = 1;
		after = 0;
		popTimer = setInterval(() => {
			const dt = Date.now() - t0;
			pop = Math.max(0, 1 - dt / POP_MS) ** 2;
			after = Math.min(1, dt / holdMs);
			if (after >= 1) {
				if (popTimer !== null) clearInterval(popTimer);
				popTimer = null;
			}
		}, 16);
	};

	const tier = $derived(tierOf(value));
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const from = $derived(badgeLayout(layout));
	const board = $derived(context.stateGameDerived.boardLayout());

	// Cubic ease-in: it falls, rather than travelling at a constant speed and
	// stopping. The landing is the beat, so the speed has to be highest there.
	const easeInCubic = (p: number) => p * p * p;

	const place = $derived.by(() => {
		const startX = from.x + from.size / 2;
		const startY = from.y + from.size / 2;
		const p = easeInCubic(t);
		return {
			x: startX + (board.x - startX) * p,
			y: startY + (board.y - startY) * p,
			// grows on the way in; on impact it overshoots, settles, then swells
			// away as it fades
			scale: landed ? 1.5 + 0.5 * pop + 0.55 * after : 0.7 + 1.1 * p,
			// holds for the first 45% of the hold, then clears
			alpha: landed ? 1 - Math.max(0, (after - 0.45) / 0.55) : 1,
		};
	});

	context.eventEmitter.subscribeOnMount({
		multiplierStrike: async (event) => {
			// x1 never flies — see the note above.
			if (event.multiplier <= 1) return;
			const fly = stateBet.isTurbo ? FLY_MS_TURBO : FLY_MS;
			value = event.multiplier;
			t = 0;
			landed = false;
			show = true;

			const t0 = performance.now();
			const step = (now: number) => {
				t = Math.min(1, (now - t0) / fly);
				if (t >= 1) return;
				raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
			// the timer owns the ending, not the frame loop — rAF stops dead in a
			// hidden tab, the rule the rest of this game's presentation follows
			killTimer = setTimeout(() => {
				cancelAnimationFrame(raf);
				t = 1;
			}, fly + 30) as unknown as number;

			await waitForTimeout(fly);
			landed = true;
			startAfter(stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS);

			// IT LANDS ON THE BOARD, and the board answers: the housing takes the
			// hit and the scene is thrown, scaled by the tier — an x5 arriving is
			// the biggest thing that happens inside a free spin, and it is allowed
			// to hit HARDER than the manifest lock (strength 1) for that reason.
			//
			// The ramp is superlinear (k^1.35) rather than straight. Shake amplitude
			// is not perceived linearly: a flat ramp spent most of its range on the
			// low tiers and left x4 and x5 feeling like the same event. The curve
			// keeps x2 modest and puts the separation where the player cares.
			// Duration climbs too — a bigger hit should also ring out longer, or the
			// top tiers read as loud rather than as heavy.
			const k = (event.multiplier - 1) / 4;
			const ramp = k ** 1.35;
			context.eventEmitter.broadcast({ type: 'soundCargoLock' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.7 + 0.3 * ramp });
			context.eventEmitter.broadcast({
				type: 'cameraShake',
				strength: 0.45 + 0.7 * ramp,
				ms: 480 + 320 * ramp,
			});
			// ...and only now do the amounts become the book's final numbers
			context.eventEmitter.broadcast({ type: 'winLinesMultiply' });

			await waitForTimeout(stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS);
			show = false;
		},
	});
</script>

{#if show}
	<MainContainer>
		<Container x={place.x} y={place.y} scale={place.scale} alpha={place.alpha}>
			<!-- the tier's light, behind the number: additive, so it reads as the
			     number glowing rather than as a disc behind it. It brightens as the
			     thing falls and flares on the landing. -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				width={SYMBOL_SIZE * 1.9}
				height={SYMBOL_SIZE * 1.9}
				tint={tier.rim}
				blendMode="add"
				alpha={(landed ? 0.5 + 0.35 * pop : 0.2 + 0.3 * t) * place.alpha}
			/>
			<GoldText text={`x${value}`} fontSize={SYMBOL_SIZE * 0.5} maxWidth={SYMBOL_SIZE * 0.9} />
		</Container>
	</MainContainer>
{/if}
