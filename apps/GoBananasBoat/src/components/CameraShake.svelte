<script lang="ts" module>
	// A shake of the WHOLE SCENE, not of one thing in it.
	//
	// The game already had `boardFrameImpact`, which rattles the brass housing and
	// flashes it. That is the right cue for a symbol slamming into the board — it
	// says "something hit the frame". It is the wrong cue for the manifest reel
	// locking onto the run's cargo, because nothing hit the frame: the machine the
	// whole room is bolted to just came to a stop, and the room should know.
	//
	// `strength` 1 is the manifest lock. One thing is allowed above it: an x5
	// multiplier landing on a winning board (MultiplierStrike), which is the
	// biggest single moment inside a free spin. Keep everything else below 1 — a
	// scene shake spent freely is a scene shake nobody feels.
	export type EmitterEventCameraShake = {
		type: 'cameraShake';
		strength?: number;
		ms?: number;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	// Peak displacement in game-box pixels at strength 1. The board is 590 tall, so
	// this is a shade under 3% of it — enough to be unmistakable, short of the
	// point where the scene visibly slides rather than jolts.
	const PEAK = 17;
	const DEFAULT_MS = 620;
	const TICK_MS = 16;

	// Energy left in the shake currently running, so a small one cannot cut a big
	// one short. Same rule and the same reason as BoardFrame's `impactEnergy`:
	// reel stops fire constantly and would otherwise interrupt the lock.
	let energy = 0;
	let timer: ReturnType<typeof setInterval> | null = null;

	const stop = () => {
		if (timer !== null) clearInterval(timer);
		timer = null;
		energy = 0;
		context.stateGame.cameraShake = { x: 0, y: 0 };
	};

	onDestroy(stop);

	const run = (strength: number, ms: number) => {
		if (strength < energy) return;
		if (timer !== null) clearInterval(timer);
		energy = strength;
		const start = Date.now();
		// setInterval AND Date.now(), not requestAnimationFrame.
		//
		// rAF does not run at all in a backgrounded tab, so a shake started just
		// before the player switches away would leave the entire scene frozen at
		// whatever offset it had reached — permanently, and visibly, when they came
		// back. setInterval is throttled in a hidden tab but still fires, so this
		// always reaches p >= 1 and puts the scene back. Same rule as the rest of
		// the presentation timing here.
		timer = setInterval(() => {
			const p = (Date.now() - start) / ms;
			if (p >= 1) {
				stop();
				return;
			}
			energy = strength * (1 - p);
			// A hard jolt that dies fast: squared decay, and the vertical throw is
			// larger than the horizontal one because the reel is stopping against
			// gravity and that is the axis the weight is on.
			const amp = PEAK * strength * (1 - p) ** 2;
			// Two incommensurable rates per axis rather than one, so the wobble does
			// not settle into a visible sine — a single frequency reads as the screen
			// being waved rather than as an impact ringing out.
			const t = (Date.now() - start) / 1000;
			context.stateGame.cameraShake = {
				x: (Math.sin(t * 61) * 0.7 + Math.sin(t * 37 + 2.1) * 0.3) * amp * 0.55,
				y: Math.sin(t * 52 + 0.7) * 0.75 * amp + Math.sin(t * 29 + 1.3) * 0.25 * amp,
			};
		}, TICK_MS);
	};

	context.eventEmitter.subscribeOnMount({
		cameraShake: ({ strength, ms }) => run(strength ?? 1, ms ?? DEFAULT_MS),
	});
</script>
