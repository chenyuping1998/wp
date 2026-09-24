<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { MAGENTA, WHITE_HOT } from '../game/palette';

	const context = getContext();

	// The global multiplier already had a rich readout — a comet flies in from the
	// wild, the odometer rolls, the panel squashes and flashes. What none of that
	// did was tell the BOARD anything: the number that just changed governs every
	// win on it, and the playfield sat perfectly still while it changed.
	//
	// This is that missing half: one magenta band crossing the reels when the
	// multiplier climbs. It reads as the new value propagating outward, and it is
	// deliberately a single fast pass rather than a pulse, so a multiplier that
	// climbs several times in a free-spin round does not turn the board into a
	// strobe.
	const DURATION = 420;

	// Subscribes to the existing globalMultiplierUpdate rather than introducing a
	// new emitter event — one less type to keep in sync across
	// typesEmitterEvent.ts, and the trigger is exactly the same moment.
	let last = $state(1);
	let start = $state(0);
	let t = $state(1);

	context.eventEmitter.subscribeOnMount({
		globalMultiplierUpdate: ({ multiplier }) => {
			// only on a climb: the reset back to 1x at the end of a round is not a
			// win event and should not be celebrated
			if (multiplier > last) {
				start = performance.now();
				t = 0;
			}
			last = multiplier;
		},
	});

	onMount(() => {
		let raf = 0;
		const tick = (now: number) => {
			if (start) t = Math.min(1, (now - start) / DURATION);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const width = BOARD_SIZES.width;
	const height = BOARD_SIZES.height;

	const wave = $derived.by(() => {
		if (t >= 1) return null;
		// fast in, trailing out
		const e = 1 - (1 - t) * (1 - t) * (1 - t);
		return { x: e * width, alpha: Math.sin(t * Math.PI) };
	});

	// BoardContainer positions into board-local space but does NOT mask — Board
	// keeps BoardMask inside its own copy. So anything drawn here that strays
	// outside 0..width is painted straight over the reel housing and the club
	// behind it. Clamping each band to the board's own bounds is the fix; a
	// runtime mask is not, because a mask here would isolate this container into
	// its own render target for no other benefit.
	const band = (centre: number, halfWidth: number) => {
		const x0 = Math.max(0, centre - halfWidth);
		const x1 = Math.min(width, centre + halfWidth);
		return x1 > x0 ? { x: x0, w: x1 - x0 } : null;
	};
</script>

<!--
	Drawn as a sibling of Board inside MainContainer, so it is NOT under
	BoardMask — Board keeps its mask inside its own BoardContainer. Ordinary alpha
	regardless: an additive child inside a masked container composites against an
	empty render target and disappears, and this file should not be the one that
	rediscovers that.
-->
{#if wave}
	<BoardContainer>
		<Graphics
			draw={(g) => {
				const w = SYMBOL_SIZE * 0.42;
				g.clear();
				// wide soft body
				const body = band(wave.x, w);
				if (body) {
					g.beginFill(MAGENTA, 0.2 * wave.alpha);
					g.drawRect(body.x, 0, body.w, height);
					g.endFill();
				}
				// hot leading edge
				const core = band(wave.x, w * 0.14);
				if (core) {
					g.beginFill(WHITE_HOT, 0.34 * wave.alpha);
					g.drawRect(core.x, 0, core.w, height);
					g.endFill();
				}
			}}
		/>
	</BoardContainer>
{/if}
