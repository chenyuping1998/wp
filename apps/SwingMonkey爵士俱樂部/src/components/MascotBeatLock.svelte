<script lang="ts">
	/**
	 * HE SWAYS WITH THE BAND (2026-11-06, adapted from Go Bananeon).
	 *
	 * jazzIdle (4.8 s / 6 s) and jazzGroove (the conducting phrase, authored on a
	 * 0.58 s beat) used to run at their own speed and whatever phase they started
	 * in, so the bandleader conducted a tempo the band was not playing. This is a
	 * small phase-locked loop on track 0:
	 *
	 *   - jazzIdle is stretched to a whole, even number of the band's beats and
	 *     its loop is kept on the bar: the breath and the arm sway turn over with
	 *     the music instead of against it;
	 *   - jazzGroove runs at the band's tempo with each downstroke (the peak of
	 *     its authored beat) on a heard beat.
	 *
	 * A NEW entry is seated straight onto the grid while it is still inside its
	 * 0.16 s mix-in (the seat is hidden by the crossfade); after that only its
	 * speed is nudged (at most ±25%). Anything else (cheer, chestbeat, bow, …) is
	 * left alone, and with no music running nothing is touched.
	 */
	import { getContextSpine } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { beatsHeard, musicBpm } from '../game/musicClock';

	const spine = getContextSpine();

	/** jazzGroove's authored beat (design/build_jazz_performance.mjs) and where its stroke peaks */
	const GROOVE_BEAT = 0.58;
	const GROOVE_PEAK = GROOVE_BEAT / 4;
	const GAIN = 1.2; // speed correction per second of phase error
	const MAX_NUDGE = 0.25;

	const seated = new WeakSet<object>();
	const wrap = (v: number, span: number) => ((v % span) + span) % span;

	const lock = () => {
		const beats = beatsHeard();
		if (beats < 0) return;
		const entry = spine.state.tracks[0];
		const name = entry?.animation?.name;
		if (!entry || !name) return;
		const beatS = 60 / musicBpm();
		let tempo: number, span: number, want: number;
		if (name === 'jazzIdle') {
			const length = entry.animation!.duration;
			const n = Math.max(4, 2 * Math.round(length / beatS / 2));
			tempo = length / (n * beatS);
			span = length;
			want = (wrap(beats, n) / n) * length;
		} else if (name === 'jazzGroove') {
			tempo = GROOVE_BEAT / beatS;
			span = GROOVE_BEAT;
			want = GROOVE_PEAK + wrap(beats, 1) * GROOVE_BEAT;
		} else return;
		const now = wrap(entry.trackTime, span);
		const error = wrap(want - now + span / 2, span) - span / 2;
		if (!seated.has(entry)) {
			seated.add(entry);
			if (entry.trackTime < 0.2) {
				entry.trackTime = Math.max(0, entry.trackTime + error);
				entry.timeScale = tempo;
				return;
			}
		}
		entry.timeScale = tempo * (1 + Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, GAIN * error)));
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
