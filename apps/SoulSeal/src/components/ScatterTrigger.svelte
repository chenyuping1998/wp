<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventScatterTrigger =
		| { type: 'scatterTriggerShow'; positions: Position[] }
		| { type: 'scatterTriggerHide' };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// The trigger, in the game's own language.
	//
	// This has now been three things, and the first two were both a SIREN in
	// different clothes. It began as an alarm: three red rings pulsing out of every
	// scatter under a red pool, with right-angle brackets clamped on the cell -
	// a trading desk's klaxon, in the scaffold's red. Re-themed, it became the same
	// three rings as octagons in cinnabar, which is the bagua's own figure and
	// still five cells throwing rings across each other. The board read as shaking.
	//
	// What it is now is the SPIN BUTTON'S CHARGE, moved onto the board: a breathing
	// halo with motes circling it. That is deliberate rather than convenient - the
	// button already uses it to say "this is charged and it is going to cost you",
	// and a scatter landing is the same kind of statement about the same kind of
	// moment. Two effects that mean related things should look related.
	// See components-ui-pixi ButtonBetSpinIcon and game/uiTheme spinButtonCharge.
	//
	// The one thing NOT borrowed is the colour. The button charges in spirit-cyan
	// because the active modes sell a board thick with spirits. The scatter is not
	// a spirit - it is the seal itself - so it charges in candle and brass, which
	// also keeps art-bible 2.2 intact: cyan belongs to the spirits, and a player
	// has to be able to find one by colour alone.

	const CANDLE = 0xffcb6b;
	const BRASS_HI = 0xd9a85c;
	const PALE = 0xfff0c4;
	// How many motes circle a scatter. Fewer than the spin button's six: this
	// draws at cell size, not at button size, and six at this radius is a ring of
	// dots rather than something orbiting.
	const ORBITS = 4;

	let positions = $state<Position[]>([]);
	let clock = $state(0);
	let raf = 0;

	const start = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = (now - t0) / 1000;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		scatterTriggerShow: ({ positions: next }) => {
			positions = next;
			clock = 0;
			start();
		},
		scatterTriggerHide: () => {
			positions = [];
			cancelAnimationFrame(raf);
		},
	});

	onDestroy(() => cancelAnimationFrame(raf));

	// How long one breath takes. Slower than the rings this replaced, which ran at
	// a siren's rate because they were a siren.
	const CYCLE = 1.6;
	// How long one orbit takes. Deliberately not a multiple of CYCLE, so the
	// halo's breath and the motes' circuit drift against each other instead of
	// locking into one repeating pose.
	const ORBIT_CYCLE = 2.9;
</script>

{#if positions.length > 0}
	<Container>
		{#each positions as position (`${position.reel},${position.row}`)}
			{@const cx = getSymbolX(position.reel)}
			{@const cy = getSymbolY(position.row)}
			<Graphics
				draw={(g) => {
					g.clear();

					const breathe = 0.5 + 0.5 * Math.sin((clock / CYCLE) * Math.PI * 2);
					const orbit = (clock / ORBIT_CYCLE) * Math.PI * 2;

					// ── the halo ─────────────────────────────────────────────────
					//
					// Stacked low-alpha rings standing in for a blur, widest and
					// faintest first, so the falloff reads as light rather than as
					// outlines. Same construction as the spin button's.
					for (const [mult, width, alpha] of [
						[1.42, SYMBOL_SIZE * 0.26, 0.1],
						[1.14, SYMBOL_SIZE * 0.2, 0.16],
						[0.92, SYMBOL_SIZE * 0.14, 0.22],
					] as [number, number, number][]) {
						g.circle(cx, cy, SYMBOL_SIZE * 0.5 * mult);
						g.stroke({ width, color: CANDLE, alpha: alpha * (0.55 + 0.45 * breathe) });
					}

					// ── the motes ────────────────────────────────────────────────
					//
					// This is the part that says CHARGED rather than LIT. A halo alone
					// is a glow; something going round it is a thing being held.
					for (let i = 0; i < ORBITS; i += 1) {
						const angle = orbit + (Math.PI * 2 * i) / ORBITS;
						const ring = SYMBOL_SIZE * (0.62 + 0.06 * Math.sin(orbit * 2 + i));
						const mx = cx + Math.cos(angle) * ring;
						const my = cy + Math.sin(angle) * ring;
						const size = SYMBOL_SIZE * 0.05 * (0.7 + 0.3 * Math.sin(orbit * 3 + i));
						// a soft body under a bright head - the same two-part falloff as
						// the halo, at mote scale
						g.circle(mx, my, size * 2.1);
						g.fill({ color: CANDLE, alpha: 0.2 * (0.6 + 0.4 * breathe) });
						g.circle(mx, my, size);
						g.fill({ color: PALE, alpha: 0.7 * (0.6 + 0.4 * breathe) });
					}

					// A single steady brass ring at the disc's edge: a mark that does
					// not move at all, so there is something for the moving parts to be
					// moving around.
					g.circle(cx, cy, SYMBOL_SIZE * 0.46);
					g.stroke({ width: 3, color: BRASS_HI, alpha: 0.8 });
				}}
			/>
		{/each}
	</Container>
{/if}
