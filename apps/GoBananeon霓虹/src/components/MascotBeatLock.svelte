<script lang="ts">
	/**
	 * KEEPS HIS GROOVE ON THE TRACK'S BEAT.
	 *
	 * club_idle / club_flutter are 8 beats at 125 BPM, played at 105/125 or
	 * 128/125 — the right tempo, but at whatever phase the track happened to
	 * start, so his drop on the beat (design/adapt_club_motion.mjs) landed
	 * anywhere between two kicks. This is a small phase-locked loop on the two
	 * track entries:
	 *
	 *   - a NEW groove entry (after a gesture, or on mount) is seated straight
	 *     onto the beat grid; it is still inside its 200ms mix-in, so the
	 *     seat is hidden by the crossfade;
	 *   - after that, only the speed is nudged (at most ±30%) toward the grid,
	 *     which absorbs clock drift and a change of scene without a jump.
	 *
	 * Anything that is not the groove (gestures, the DJ scratch with its own
	 * tempo) is left alone, and with no music anchor nothing is touched: the
	 * timeScale props in Mascot.svelte stay in charge.
	 */
	import { getContextSpine } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { musicAt, type MusicScene } from '../game/beatClock';

	type Props = { scene: MusicScene };
	const props: Props = $props();
	const spine = getContextSpine();

	/** the clips' authored tempo (CLUB_BPM) */
	const AUTHORED_BPM = 125;
	const AUTHORED_BEAT = 60 / AUTHORED_BPM;
	/** align modulo one bar: sway and the beat drop both repeat on it */
	const LOCK_SPAN = 4 * AUTHORED_BEAT;
	const GROOVE: Record<number, string[]> = { 0: ['club_idle', 'idle'], 1: ['club_flutter'] };
	const GAIN = 1.2; // speed correction per second of phase error
	const MAX_NUDGE = 0.3;

	const seated = new WeakSet<object>();
	const wrap = (v: number, span: number) => ((v % span) + span) % span;

	const lock = () => {
		const music = musicAt(performance.now(), props.scene);
		if (!music.live) return;
		const tempo = music.bpm / AUTHORED_BPM;
		// where in the clip the grid says he should be (beat k ↔ k * AUTHORED_BEAT)
		const want = wrap(music.beats, 4) * AUTHORED_BEAT;
		const djActive = spine.state.tracks[0]?.animation?.name === 'dj_scratch';
		for (const index of [0, 1]) {
			const entry = spine.state.tracks[index];
			const name = entry?.animation?.name;
			if (!entry || !name || !GROOVE[index].includes(name)) continue;
			// the flutter runs at the DJ's own speed while he scratches
			if (index === 1 && djActive) continue;
			const now = wrap(entry.trackTime, LOCK_SPAN);
			const error = wrap(want - now + LOCK_SPAN / 2, LOCK_SPAN) - LOCK_SPAN / 2;
			if (!seated.has(entry)) {
				seated.add(entry);
				// Only a fresh entry is seated: it is still inside its mix-in, so
				// the jump is covered. One already playing when the music first
				// starts (game load) catches up through the nudge instead.
				if (entry.trackTime < 0.25) {
					entry.trackTime = Math.max(0, entry.trackTime + error);
					entry.timeScale = tempo;
					continue;
				}
			}
			entry.timeScale = tempo * (1 + Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, GAIN * error)));
		}
	};

	onMount(() => {
		let raf = 0;
		const tick = () => {
			lock();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>
