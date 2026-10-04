<script lang="ts">
	/**
	 * A PRIZE COIN LANDING ON A REEL (Hold and Spin): the coin hits its plate
	 * and SETTLES like a coin dropped on a table — a squash on the hit, then it
	 * wobbles round its rim, the tilt dying away as the tipping edge runs round
	 * faster and faster, until it lies flat. The plate (gbPPlate) stays put; the
	 * coin is CoinMesh, tipped in perspective about an axis that turns.
	 *
	 * Face-up the whole time (a tilt, never a flip), so the value Symbol.svelte
	 * prints over it stays readable through the landing.
	 */
	import { Container, Sprite, getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import CoinMesh from './CoinMesh.svelte';

	type Props = { width: number; height: number; amp: number; speed: number };
	const props: Props = $props();
	const app = getContextApp();

	const COIN_LAND_MS = 560;
	let t = $state(0);
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const t0 = performance.now();
		const tick = () => {
			t = Math.min(COIN_LAND_MS, (performance.now() - t0) * props.speed);
			if (t >= COIN_LAND_MS) ticker?.remove(tick);
		};
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});

	// the tilt dies; the tipping edge runs round, quicker as it flattens
	const tilt = $derived(0.42 * props.amp * Math.exp(-t / 150) * (t < COIN_LAND_MS ? 1 : 0));
	const axis = $derived(t / 55 + (t * t) / 30000);
	// the hit: flat for a moment, then back
	const squash = $derived(t < 140 ? 0.12 * props.amp * Math.sin((Math.PI * t) / 140) : 0);
</script>

<Sprite key="gbPPlate" anchor={0.5} width={props.width} height={props.height} />
<!-- own container: CoinMesh adds itself at its parent's end -->
<Container scale={{ x: 1 + squash * 0.6, y: 1 - squash }}>
	<CoinMesh x={0} y={0} size={props.width} flip={tilt} {axis} />
</Container>
