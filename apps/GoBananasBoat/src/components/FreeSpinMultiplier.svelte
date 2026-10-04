<script lang="ts" module>
	import { SYMBOL_SIZE as BADGE_SYMBOL_SIZE } from '../game/constants';

	/**
	 * Where the badge sits, in MainContainer coordinates.
	 *
	 * Exported because MultiplierStrike flies a copy of this plate from here to
	 * the middle of the board, and it has to leave from where the badge actually
	 * is — the illusion is that the badge itself came down. Two copies of this
	 * arithmetic would drift the moment one of them was tuned.
	 */
	export const badgeLayout = (layout: { width: number; height: number }) => {
		const size = BADGE_SYMBOL_SIZE * 0.92;
		return { size, x: layout.width - size - BADGE_SYMBOL_SIZE * 0.45, y: layout.height * 0.05 };
	};
</script>

<script lang="ts">
	import { Container, Graphics, getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { tierOf, MULTIPLIER_LIT } from '../game/multiplierTiers';
	import GoldText from './GoldText.svelte';

	// THE ROUND'S MULTIPLIER, IN THE TOP CORNER.
	//
	// It is decided once, on the wheel before the round starts, and then applies
	// to every win in the round — so it has to stay in view for the whole round,
	// or by the fourth spin a player has no way to tell why a win paid three times
	// what the pay table says.
	//
	// TOP RIGHT, not beside the board. It first hung under the Free Spins counter,
	// which is a reasonable place for a standing fact but put two numbers in one
	// plaque — the spin count changes every spin and this never does, and read
	// together they invite being read as one thing. The two opposite corners keep
	// them apart. The RIGHT corner specifically because the counter already owns
	// the left, and the captain stands against the board's right edge lower down,
	// so the corner above him is clear.
	//
	// It wears the tier's own colours (game/multiplierTiers), so the badge is
	// visibly the same plate the player just watched land.

	const context = getContext();

	const multiplier = $derived(context.stateGame.fgMultiplier);
	const tier = $derived(tierOf(multiplier ?? 1));

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const placed = $derived(badgeLayout(layout));
	const size = $derived(placed.size);
	const position = $derived({ x: placed.x, y: placed.y });

	// ── THE BADGE IS SOFT (2026-09-27) ───────────────────────────────────────
	//
	// A jelly spring on the whole badge: it lands when the wheel sets the
	// round's multiplier (a big squash-and-wobble, it has just been handed
	// something), and it RECOILS every time MultiplierStrike launches a copy of
	// it at the board — the kick of the throw, before the copy lands. + is
	// wider and shorter, - taller and narrower; about the badge's centre.
	let jelly = $state(0);
	let jellyV = 0;
	const J_K = (2 * Math.PI * 3.6) ** 2;
	const J_C = 2 * 0.16 * Math.sqrt(J_K);
	const app = getContextApp();
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => {
			const dt = Math.min(0.05, (ticker?.deltaMS ?? 16) / 1000);
			jellyV += (-J_K * jelly - J_C * jellyV) * dt;
			jelly += jellyV * dt;
		};
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});
	let lastMultiplier: number | null = null;
	$effect(() => {
		const m = multiplier;
		if (m !== null && m !== lastMultiplier) jellyV += 5.5;
		lastMultiplier = m;
	});
	context.eventEmitter.subscribeOnMount({
		// the throw pulls it tall, then it wobbles back
		multiplierStrike: () => (jellyV -= 4),
	});

	const draw = (g: PixiGraphics) => {
		const w = size;
		const r = 12;
		g.clear();
		if (tier.halo > 0) {
			for (const [spread, width, k] of [
				[9, 8, 0.45],
				[4, 5, 0.8],
			] as [number, number, number][]) {
				g.roundRect(-spread, -spread, w + spread * 2, w + spread * 2, r + spread);
				g.stroke({ width, color: tier.rim, alpha: tier.halo * k });
			}
		}
		g.roundRect(0, 0, w, w, r);
		g.fill({ color: tier.face });
		g.roundRect(5, 5, w - 10, w - 10, r - 4);
		g.stroke({ width: 7, color: tier.rim, alpha: tier.inner * 0.5 });
		g.roundRect(0, 0, w, w, r);
		g.stroke({ width: tier.width, color: tier.rim });
		if ((multiplier ?? 1) >= 3) {
			g.roundRect(tier.width * 0.7, tier.width * 0.7, w - tier.width * 1.4, w - tier.width * 1.4, r - 3);
			g.stroke({ width: 1.4, color: MULTIPLIER_LIT, alpha: 0.3 });
		}
	};
</script>

<MainContainer>
	<!-- FadeContainer so it arrives and leaves with the round rather than popping.
	     `multiplier !== null` is the whole condition: it is set when the wheel
	     lands and cleared when the round hands back to the base game. -->
	<FadeContainer show={multiplier !== null} {...position}>
		<Container x={size / 2} y={size / 2} scale={{ x: 1 + 0.22 * jelly, y: 1 - 0.22 * jelly }}>
		<Container x={-size / 2} y={-size / 2}>
		<Graphics {draw} />
		<GoldText
			x={size / 2}
			y={size * 0.44}
			text={`x${multiplier ?? 1}`}
			fontSize={size * 0.42}
			maxWidth={size * 0.8}
		/>
		<Container y={size * 0.78}>
			<GoldText
				x={size / 2}
				text="MULTIPLIER"
				fontSize={size * 0.13}
				maxWidth={size * 0.86}
				letterSpacing={1}
			/>
		</Container>
		</Container>
		</Container>
	</FadeContainer>
</MainContainer>
