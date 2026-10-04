<script lang="ts">
	import { onMount } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import HatchOpen, { HATCH_CRACK_MS, HATCH_STOP_MS, HATCH_DONE_MS } from './HatchOpen.svelte';
	import ThrusterPuff from './ThrusterPuff.svelte';

	// THE ENTRY REVEAL (2026-10-03, "開場揭幕學 boat 那樣做，要符合這款的風格";
	// "盡量做的不要有ai感").
	//
	// Played once, as the loading screen hands over. Go Bananas Boat yanks a tarp
	// off its hold; this game is a capsule, so the board opens behind an AIRLOCK
	// (HatchOpen): the brass latches flip open one by one, the seal cracks with a
	// knock and a little cold air leaking out of the seam, and the heavy doors
	// slide apart into the housing and stop there with a thud.
	//
	// Held back on purpose: no burst of sparks and no white flash. Those are what
	// made the old reveal read as an effect laid over the game; this one is the
	// machine itself doing something. (The old one also sprayed LEAF SHARDS — the
	// jungle flavour, three themes ago.)
	const T_TOTAL = HATCH_DONE_MS / 1000;
	// the leak: a few uneven wisps, not a matched set
	const LEAKS = [
		{ at: 0.27, angle: Math.PI + 0.45, length: 0.15, delay: 0 },
		{ at: 0.55, angle: -0.3, length: 0.11, delay: 40 },
		{ at: 0.71, angle: Math.PI + 0.2, length: 0.09, delay: 95 },
	];

	const context = getContext();

	let t = $state(0);
	let cracked = $state(false);
	let stopped = false;

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			const ms = t * 1000;
			if (!cracked && ms >= HATCH_CRACK_MS) {
				cracked = true;
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.35 });
			}
			// the doors hitting their stops: a thud through the housing
			if (!stopped && ms >= HATCH_STOP_MS) {
				stopped = true;
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.55 });
			}
			if (t >= T_TOTAL) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const board = $derived(context.stateGameDerived.boardLayout());
</script>

{#if t < T_TOTAL}
	<MainContainer>
		<!-- own container: HatchOpen adds itself at its parent's end -->
		<Container>
			<HatchOpen x={board.x} y={board.y} width={board.width * 1.02} height={board.height * 1.02} t={t * 1000} />
		</Container>
		{#if cracked}
			{#each LEAKS as leak, i (i)}
				{#if t * 1000 >= HATCH_CRACK_MS + leak.delay}
					<Container>
						<ThrusterPuff
							x={board.x}
							y={board.y - board.height / 2 + board.height * leak.at}
							angle={leak.angle}
							length={board.width * leak.length}
							alpha={0.32}
							tint={0xcfd8de}
						/>
					</Container>
				{/if}
			{/each}
		{/if}
	</MainContainer>
{/if}
