<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundFrameBigLand' }
		// The transition sweep. Was 'soundGrenadeBlast' — GoBananas' name for it;
		// 'soundMonkeyExpand' sat beside it and was never broadcast by anything.
		| { type: 'soundNeonZap' }
		// `rate` is playbackRate on the drone loop, i.e. its pitch and speed.
		// Broadcasting again while it is already running retunes it in place
		// rather than restarting it, so the tension can climb reel by reel.
		| { type: 'soundReelTensionStart'; rate?: number }
		| { type: 'soundReelTensionStop' }
		// Anticipation music duck: a lowpass closing over the music bed while a
		// reel teases, and snapping back open when it resolves.
		| { type: 'soundMusicDuck' }
		| { type: 'soundMusicRelease' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';

	const context = getContext();

	// ─── Capo crime-jazz sound set (see design/generate_capo_audio.py) ───
	//
	// These were the sibling GoBananas app's jungle samples: gongs, wooden
	// plucks, a monkey hoot. They are now a purpose-built synthwave set — detuned
	// saw stacks, FM bells, filtered-noise sweeps and gated reverb.
	// Standalone HTML5 Audio; the howler sprite (sounds.json) stays as a
	// fallback for anything not mapped here (e.g. win-level bgm stingers).
	type CnSfxName =
		| 'gong_feature'
		| 'bigwin_blast'
		| 'reel_tension'
		| 'reel_stop'
		| 'btn'
		| 'spin'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'pluck_low'
		| 'win_gliss'
		| 'win_gliss_big'
		| 'win_line_tick'
		| 'win_step_1'
		| 'win_step_2'
		| 'win_step_3'
		| 'win_step_4'
		| 'win_tier_big'
		| 'win_tier_super'
		| 'win_tier_mega'
		| 'win_tier_epic'
		| 'win_tier_max'
		| 'fs_intro'
		| 'fs_outro'
		| 'win_cap'
		| 'coin_shimmer'
		| 'wild_expand'
		| 'frame_big_land'
		| 'mult_update'
		| 'neon_zap'
		| 'light_land'
		| 'light_sweep_1'
		| 'light_sweep_2'
		| 'light_sweep_3'
		| 'light_sweep_4'
		| 'light_double'
		| 'lights_carry'
		| 'tier_lockdown'
		| 'tier_riot'
		| 'tier_breakout';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'hard_time/sfx/gong_feature.wav',
		bigwin_blast: 'hard_time/sfx/bigwin_blast.wav',
		reel_tension: 'hard_time/sfx/reel_tension.wav',
		reel_stop: 'hard_time/sfx/reel_stop.wav',
		btn: 'hard_time/sfx/btn.wav',
		spin: 'hard_time/sfx/spin.wav',
		scatter_1: 'hard_time/sfx/scatter_1.wav',
		scatter_2: 'hard_time/sfx/scatter_2.wav',
		scatter_3: 'hard_time/sfx/scatter_3.wav',
		scatter_4: 'hard_time/sfx/scatter_4.wav',
		scatter_5: 'hard_time/sfx/scatter_5.wav',
		pluck_low: 'hard_time/sfx/pluck_low.wav',
		win_gliss: 'hard_time/sfx/win_gliss.wav',
		win_gliss_big: 'hard_time/sfx/win_gliss_big.wav',
		win_line_tick: 'hard_time/sfx/win_line_tick.wav',
		win_step_1: 'hard_time/sfx/win_step_1.wav',
		win_step_2: 'hard_time/sfx/win_step_2.wav',
		win_step_3: 'hard_time/sfx/win_step_3.wav',
		win_step_4: 'hard_time/sfx/win_step_4.wav',
		win_tier_big: 'hard_time/sfx/win_tier_big.wav',
		win_tier_super: 'hard_time/sfx/win_tier_super.wav',
		win_tier_mega: 'hard_time/sfx/win_tier_mega.wav',
		win_tier_epic: 'hard_time/sfx/win_tier_epic.wav',
		win_tier_max: 'hard_time/sfx/win_tier_max.wav',
		fs_intro: 'hard_time/sfx/fs_intro.wav',
		fs_outro: 'hard_time/sfx/fs_outro.wav',
		win_cap: 'hard_time/sfx/win_cap.wav',
		coin_shimmer: 'hard_time/sfx/coin_shimmer.wav',
		wild_expand: 'hard_time/sfx/wild_expand.wav',
		frame_big_land: 'hard_time/sfx/frame_big_land.wav',
		mult_update: 'hard_time/sfx/mult_update.wav',
		// Key kept, file swapped: the slot is named for Hot Miami's neon zap and is
		// wired to Hard Time's power-cut alarm. Renaming the key means touching
		// every broadcast site, so the name is the stale half and the sound is
		// correct. `neon_zap.wav` itself was generated and never referenced — it
		// has been deleted rather than left as a decoy next to the file that is
		// actually used.
		neon_zap: 'hard_time/sfx/alarm_transition.wav',
		light_land: 'hard_time/sfx/light_land.wav',
		light_sweep_1: 'hard_time/sfx/light_sweep_1.wav',
		light_sweep_2: 'hard_time/sfx/light_sweep_2.wav',
		light_sweep_3: 'hard_time/sfx/light_sweep_3.wav',
		light_sweep_4: 'hard_time/sfx/light_sweep_4.wav',
		light_double: 'hard_time/sfx/light_double.wav',
		lights_carry: 'hard_time/sfx/lights_carry.wav',
		tier_lockdown: 'hard_time/sfx/tier_lockdown.wav',
		tier_riot: 'hard_time/sfx/tier_riot.wav',
		tier_breakout: 'hard_time/sfx/tier_breakout.wav',
	};

	// Sprite sound names re-routed to the Chinese set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// ONE stop click for all five reels, and a raised one for a teasing reel.
	//
	// The history is worth keeping because it is a full circle: originally every
	// reel played `_1` (five identical clicks, `_2.._5` dead). That was replaced
	// with a five-rung pitch ladder, 0.94 → 1.14, one step per reel. The ladder
	// is now gone too, on purpose — a 5% step is under what most players can
	// hear as pitch, and spending a rise on every ordinary losing spin leaves
	// nothing to spend when a reel actually teases. So: flat for a normal stop,
	// and one clear jump (1.18, a little louder) for the reel that is teasing,
	// which is the only stop that is supposed to carry tension.
	const SPRITE_TO_CN: Partial<
		Record<SoundEffectName, { name: CnSfxName; volume?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop: { name: 'reel_stop', volume: 0.38, rate: 1 },
		sfx_reel_stop_tease: { name: 'reel_stop', volume: 0.46, rate: 1.18 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		sfx_multiplier_landing: { name: 'pluck_low' },
		// The "a line paid" tick, fired on every winInfo.
		sfx_winlevel_small: { name: 'win_line_tick', volume: 0.72 },
		// Win-ladder stingers for winLevelMap levels 2-5, fired at setWin once the
		// level is known. Same pitch-ladder idiom as the reel stops above: two
		// rungs of win_gliss, then two of win_gliss_big, each louder than the last,
		// so the ear can tell a 0.3x from a 4.9x. Unmapped, these four names would
		// have fallen through to the template's howler sprite and played the
		// original non-Miami samples.
		sfx_winlevel_standard: { name: 'win_step_1', volume: 0.72 },
		sfx_multiplier_win: { name: 'win_step_2', volume: 0.76 },
		sfx_winlevel_nice: { name: 'win_step_3', volume: 0.80 },
		sfx_winlevel_substantial: { name: 'win_step_4', volume: 0.84 },
		sfx_winlevel_big: { name: 'win_tier_big', volume: 0.86 },
		sfx_winlevel_superwin: { name: 'win_tier_super', volume: 0.88 },
		sfx_winlevel_mega: { name: 'win_tier_mega', volume: 0.90 },
		sfx_winlevel_epic: { name: 'win_tier_epic', volume: 0.92 },
		sfx_winlevel_max: { name: 'win_tier_max', volume: 0.94 },
		sfx_scatter_win: { name: 'win_gliss' },
		sfx_scatter_win_v2: { name: 'win_gliss_big' },
		sfx_superfreespin: { name: 'win_gliss_big', volume: 0.8 },
		jng_intro_fs: { name: 'fs_intro' },
		sfx_light_land: { name: 'light_land' },
		sfx_light_sweep_1: { name: 'light_sweep_1' },
		sfx_light_sweep_2: { name: 'light_sweep_2' },
		sfx_light_sweep_3: { name: 'light_sweep_3' },
		sfx_light_sweep_4: { name: 'light_sweep_4' },
		sfx_light_double: { name: 'light_double' },
		sfx_lights_carry: { name: 'lights_carry', volume: 0.45 },
		jng_tier_lockdown: { name: 'tier_lockdown' },
		jng_tier_riot: { name: 'tier_riot' },
		jng_tier_breakout: { name: 'tier_breakout' },
		// The free-game outro panel and the max-win stop. Both were unmapped, so
		// both fell through to the template sprite below and played GoBananas'
		// jungle samples — audible at the end of every single feature, which is
		// how it was reported ("FG 結束後有以前的範例音效"). sounds.json still
		// carries `sfx_youwon_panel` and `sfx_winlevel_end`, so the fallback was
		// not silent; it was wrong and confident.
		sfx_youwon_panel: { name: 'fs_outro' },
		sfx_winlevel_end: { name: 'win_cap' },
		sfx_wild_explode: { name: 'wild_expand' },
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_anticipation_start: { name: 'mult_update', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.3 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.3 },
	};

	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement>> = {};

	function getCnSfx(name: CnSfxName) {
		let audio = cnSfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
			audio.preload = 'auto';
			cnSfxAudio[name] = audio;
		}
		return audio;
	}

	// ── voices ────────────────────────────────────────────────────────────────
	//
	// getCnSfx caches ONE element per file, and a one-shot cannot overlap itself
	// on one element: `currentTime = 0` on an element that is still playing
	// restarts it, so the second call replaces the first instead of sounding
	// beside it.
	//
	// All five reel stops are the SAME file (reel_stop.wav, 105ms) — now at ONE
	// rate, which makes them literally identical — so any two stops falling
	// inside 105ms of each other collide:
	// the second resets the first and the player hears one click instead of two.
	// Turbo's stagger is 150ms — only 45ms of margin — so it takes very little
	// jitter to lose clicks there, and a quick-stop collapses the gap entirely.
	// That is the whole of "sometimes five, sometimes not".
	//
	// Measured before and after, by hooking HTMLAudioElement.prototype.play and
	// recording whether the element was already playing at each call:
	//
	//   before   5 plays, 4 of them onto an element still playing
	//   after    5 plays, 0 of them onto an element still playing
	//
	// (Both runs came out of the browser-pane harness, which freezes rAF while
	// the pane is hidden and then resolves the pending reel animations in one
	// frame — so the volley there is tighter than real play. It is a fair test of
	// the collision, not a measurement of the real inter-reel gap.)
	//
	// pluck_low (the Wild landing) has it worse — one per landing W, several in
	// the same millisecond.
	//
	// So a one-shot takes a free VOICE instead of the shared element. Six is past
	// the point where more simultaneous copies of one short sample are separable
	// anyway; beyond that the oldest is reused, which is what a hardware sampler
	// does.
	const CN_SFX_VOICES = 6;
	const cnSfxPool: Partial<Record<CnSfxName, HTMLAudioElement[]>> = {};

	function getCnSfxVoice(name: CnSfxName) {
		let pool = cnSfxPool[name];
		if (!pool) {
			// Seeded with the cached element so the first play still uses the one
			// that has been preloading since getCnSfx created it.
			pool = [getCnSfx(name)];
			cnSfxPool[name] = pool;
		}
		// `loop` excludes the element playCnLoop is holding — reel_tension and
		// coin_shimmer are loops only, but a one-shot must never steal a running
		// loop's element if a name is ever used both ways.
		const free = pool.find((voice) => !voice.loop && (voice.paused || voice.ended));
		if (free) return free;
		if (pool.length < CN_SFX_VOICES) {
			const voice = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
			voice.preload = 'auto';
			pool.push(voice);
			return voice;
		}
		// All busy: take the oldest and rotate it to the back.
		const oldest = pool.shift() as HTMLAudioElement;
		pool.push(oldest);
		return oldest;
	}

	// ── SFX through Web Audio ─────────────────────────────────────────────────
	//
	// The element path below is now only a fallback. HTMLAudioElement is the
	// wrong tool for short one-shots that overlap:
	//
	//   · one element cannot play twice at once — `currentTime = 0` on a playing
	//     element RESTARTS it, so the second call replaces the first
	//   · a pool of elements fixes that on paper, but the extra voices are
	//     created on first collision and have to fetch and decode before they can
	//     sound, so the volley that needed them is exactly the one they miss
	//   · every element carries its own network/decode/readyState machinery for
	//     a 105ms click
	//
	// That mattered here because ALL FIVE reel stops are the same file
	// (reel_stop.wav, 105ms) at one rate, and turbo's stop stagger is
	// 150ms — 45ms of margin. Any jitter, or a quick-stop, and stops collide.
	// The reported symptom was "sometimes five clicks, sometimes two or three".
	//
	// An AudioBufferSourceNode has none of that. The sample is decoded ONCE at
	// mount; each play builds a throwaway source node over the shared buffer, so
	// overlapping copies are free and start immediately. The AudioContext already
	// exists in this file for the music duck (routeThroughFilter), so this adds
	// a decode pass, not a second audio stack.
	const sfxBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const sfxLoops: Partial<Record<CnSfxName, { source: AudioBufferSourceNode; gain: GainNode }>> = {};

	/**
	 * The shared context, created on demand. Constructing one before a user
	 * gesture is allowed — it just starts suspended, which is enough to decode.
	 * Resuming needs the gesture, and the game always has one (the intro card's
	 * tap) before any sfx plays.
	 */
	const ensureAudioContext = () => {
		try {
			const Ctor =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			audioContext = audioContext ?? new Ctor();
			if (audioContext.state === 'suspended') void audioContext.resume();
			return audioContext;
		} catch {
			return null;
		}
	};

	/**
	 * Decode every sample once. A file that fails to fetch or decode simply has
	 * no buffer, and the element fallback covers it — one bad sample must not
	 * take the whole sound set down.
	 */
	const loadSfxBuffers = async () => {
		const ctx = ensureAudioContext();
		if (!ctx) return;
		await Promise.all(
			(Object.keys(CN_SFX_FILES) as CnSfxName[]).map(async (name) => {
				try {
					const response = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
					sfxBuffers[name] = await ctx.decodeAudioData(await response.arrayBuffer());
				} catch {
					// leave it undefined; playCnSfx falls through to the element
				}
			}),
		);
	};

	const sfxVolume = (volumeScale: number) =>
		Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);

	// ── reel-stop probe (?hmdebug=1) ──────────────────────────────────────────
	//
	// The five reel-stop clicks are the SAME 105ms sample at five pitches, so
	// "did all five play?" is hard to answer by ear and impossible to answer from
	// a screenshot. This records each one on the AUDIO clock, which keeps running
	// when requestAnimationFrame does not — the reason every timing number taken
	// through a throttled or backgrounded tab is worthless.
	//
	//     window.__HM_REELSTOP__()      // { count, gapsMs, rates }
	//     window.__HM_REELSTOP__(true)  // read and clear, ready for the next spin
	//
	// Costs nothing unless the flag is on.
	const REELSTOP_DEBUG =
		typeof window !== 'undefined' && /[?&]hmdebug=1(&|$)/.test(window.location.search);
	const reelStopLog: { ctxTime: number; rate: number }[] = [];

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1, delaySeconds = 0) {
		const ctx = ensureAudioContext();
		if (REELSTOP_DEBUG && name === 'reel_stop' && ctx) {
			reelStopLog.push({ ctxTime: ctx.currentTime + delaySeconds, rate });
		}
		const buffer = sfxBuffers[name];
		if (ctx && buffer) {
			const gain = ctx.createGain();
			gain.gain.value = sfxVolume(volumeScale);
			gain.connect(ctx.destination);
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			// playbackRate on a short percussive sample reads as pitch — this is
			// what gives the five reel stops their rising step.
			source.playbackRate.value = rate;
			source.connect(gain);
			// Nodes are single-use. Disconnect on end so a long session does not
			// accumulate a graph of finished sources.
			source.onended = () => {
				source.disconnect();
				gain.disconnect();
			};
			source.start(ctx.currentTime + delaySeconds);
			return;
		}
		if (delaySeconds > 0) {
			window.setTimeout(() => playCnSfxElement(name, volumeScale, rate), delaySeconds * 1000);
		} else {
			playCnSfxElement(name, volumeScale, rate);
		}
	}

	// Natural 150ms reel staggers pass straight through. Quick-stop and browser
	// frame catch-up can deliver several stop callbacks in one frame; schedule
	// those on the audio clock 72ms apart so five identical clicks cannot collapse
	// perceptually into one impact. The queue expires by itself between spins.
	const REEL_STOP_MIN_GAP = 0.072;
	let nextReelStopTime = 0;
	function playReelStop(volume: number, rate: number) {
		const ctx = ensureAudioContext();
		if (!ctx) {
			playCnSfx('reel_stop', volume, rate);
			return;
		}
		const when = Math.max(ctx.currentTime, nextReelStopTime);
		nextReelStopTime = when + REEL_STOP_MIN_GAP;
		playCnSfx('reel_stop', volume, rate, when - ctx.currentTime);
	}

	// `rate` mirrors playCnSfx: playbackRate, which on a sustained drone reads as
	// pitch and speed together. The loop had no rate parameter at all, so
	// soundReelTensionStart could not rise while the five reel-stop clicks
	// already did (SPRITE_TO_CN above) — the tension bed was the one thing in the
	// spin that stayed flat all the way to the payoff.
	//
	// Retunes rather than restarts when the loop is already playing: a tease
	// climbs across reels, and starting a new source on every step would chop the
	// drone into pieces instead of bending it upward.
	function playCnLoop(name: CnSfxName, volumeScale = 1, rate = 1) {
		const ctx = ensureAudioContext();
		const buffer = sfxBuffers[name];
		if (ctx && buffer) {
			const running = sfxLoops[name];
			if (running) {
				running.gain.gain.value = sfxVolume(volumeScale);
				running.source.playbackRate.value = rate;
				return;
			}
			const gain = ctx.createGain();
			gain.gain.value = sfxVolume(volumeScale);
			gain.connect(ctx.destination);
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;
			source.playbackRate.value = rate;
			source.connect(gain);
			source.start();
			sfxLoops[name] = { source, gain };
			return;
		}
		playCnLoopElement(name, volumeScale, rate);
	}

	function stopCnSfx(name: CnSfxName) {
		const running = sfxLoops[name];
		if (running) {
			try {
				running.source.stop();
			} catch {
				// already stopped
			}
			running.source.disconnect();
			running.gain.disconnect();
			delete sfxLoops[name];
		}
		// the fallback element, if this name ever played through it
		const audio = cnSfxAudio[name];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
	}

	// ── element fallback ──────────────────────────────────────────────────────
	// Used only when there is no AudioContext, or when a sample failed to decode.

	function playCnSfxElement(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfxVoice(name);
		audio.loop = false;
		audio.volume = sfxVolume(volumeScale);
		// Always assign, never skip when rate is 1: a voice is reused across
		// callers, so a rate left over from the previous one would carry into every
		// later play through that voice.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function playCnLoopElement(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(name);
		const alreadyRunning = audio.loop && !audio.paused;
		audio.loop = true;
		audio.volume = sfxVolume(volumeScale);
		audio.playbackRate = rate;
		if (alreadyRunning) return;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// ─── the anticipation duck ────────────────────────────────────────────────
	//
	// A lowpass filter closing over the MUSIC while a reel teases, and opening
	// again when it resolves. From the Hacksaw spec the user supplied: their
	// anticipation is three things at once — the reel slows to half speed, its
	// strip is swapped for a scatter-dense one, and the music bus gets a lowpass
	// that takes 0.7s to close to 150Hz and only 0.3s to snap back to 20kHz.
	//
	// The asymmetry is the whole trick and it is worth stating: closing slowly is
	// tension arriving without being announced, opening fast is the release. A
	// symmetrical fade reads as a volume dip and nothing more.
	//
	// This needs Web Audio, because an HTMLAudioElement has no filter. The graph
	// is built lazily around whichever element playBgm has just created —
	// createMediaElementSource can only be called once per element, so it is
	// created there and remembered here. Everything is guarded: if the browser
	// has no AudioContext, or it refuses to resume, the game simply plays with no
	// duck rather than with no music.
	const DUCK_HZ = 150;
	const OPEN_HZ = 20000;
	const DUCK_CLOSE_S = 0.7;
	const DUCK_OPEN_S = 0.3;
	let audioContext: AudioContext | null = null;
	let musicFilter: BiquadFilterNode | null = null;
	let filteredElement: HTMLAudioElement | null = null;

	const routeThroughFilter = (element: HTMLAudioElement) => {
		try {
			const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return;
			audioContext = audioContext ?? new Ctor();
			if (audioContext.state === 'suspended') void audioContext.resume();
			if (!musicFilter) {
				musicFilter = audioContext.createBiquadFilter();
				musicFilter.type = 'lowpass';
				musicFilter.frequency.value = OPEN_HZ;
				musicFilter.connect(audioContext.destination);
			}
			// One source node per element, and a new element arrives on every track
			// change. Reconnecting an element that already has a source throws.
			if (filteredElement === element) return;
			const source = audioContext.createMediaElementSource(element);
			source.connect(musicFilter);
			filteredElement = element;
		} catch {
			// no Web Audio, or the element is already routed: play unfiltered
		}
	};

	const rampFilter = (hz: number, seconds: number) => {
		if (!audioContext || !musicFilter) return;
		if (audioContext.state === 'suspended') void audioContext.resume();
		const now = audioContext.currentTime;
		musicFilter.frequency.cancelScheduledValues(now);
		musicFilter.frequency.setValueAtTime(musicFilter.frequency.value, now);
		// Exponential, not linear: pitch and filter cutoff are heard
		// logarithmically, and a linear ramp to 150Hz spends most of its time in
		// the range where nothing audible is happening yet.
		musicFilter.frequency.exponentialRampToValueAtTime(Math.max(40, hz), now + seconds);
	};

	// ─── BGM (both loops are standalone HTML5 Audio) ───
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	// Reproducible, royalty-free period crime-jazz loops: walking bass, brushes,
	// piano and muted brass. M4A keeps the upload smaller than WAV masters.
	const BGM_FILES = {
		base: 'hard_time/bgm_base.wav',
		freespin: 'hard_time/bgm_feature.wav',
	} as const;

	function playBgm(type: 'base' | 'freespin') {
		if (currentBgm === type && bgmAudio && !bgmAudio.paused) return;
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio = null;
		}
		bgmAudio = new Audio(`${base}/assets/audio/${BGM_FILES[type]}`);
		routeThroughFilter(bgmAudio);
		bgmAudio.loop = true;
		bgmAudio.volume = stateSoundDerived.volumeMusic();
		bgmAudio.play().catch(() => {});
		currentBgm = type;
	}

	function stopBgm() {
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio.currentTime = 0;
		}
		currentBgm = null;
	}

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmAudio) bgmAudio.volume = vol;
	});

	context.eventEmitter.subscribeOnMount({
		// ui
		// Every Hot Miami mode - base and all three feature buys - sits in the base
		// track until the round actually enters free spins, at which point
		// freeSpinTrigger switches the music. A bought feature gets a flourish so
		// the purchase is acknowledged before the reels start.
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey !== 'BASE') {
				playCnSfx('win_gliss_big', 0.7);
				await waitForTimeout(SECOND);
			}
			playBgm('base');
		},
		soundPressGeneral: () => playCnSfx('btn', 0.7),
		soundPressBet: () => playCnSfx('spin', 0.9),
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') {
				playBgm('base');
			} else if (name === 'bgm_freespin') {
				playBgm('freespin');
			} else {
				// Other music (win levels etc) — pause bgm, play via sprite
				if (bgmAudio) bgmAudio.pause();
				currentBgm = null;
				sound.players.music.play({ name });
			}
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') {
				playCnLoop('coin_shimmer', 0.8);
			} else if (name === 'sfx_anticipation') {
				// covered by the reel_tension tremolo loop (soundReelTensionStart)
			} else {
				sound.players.loop.play({ name });
			}
		},
		soundOnce: ({ name, forcePlay }) => {
			const mapped = SPRITE_TO_CN[name];
			if (mapped) {
				if (name === 'sfx_reel_stop' || name === 'sfx_reel_stop_tease') {
					playReelStop(mapped.volume ?? 1, mapped.rate ?? 1);
				} else {
					playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
				}
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playCnSfx('gong_feature'),
		soundBigWinBlast: () => playCnSfx('bigwin_blast'),
		soundFrameBigLand: () => playCnSfx('frame_big_land'),
		soundNeonZap: () => playCnSfx('neon_zap'),
		soundReelTensionStart: ({ rate }) => playCnLoop('reel_tension', 0.8, rate ?? 1),
		soundReelTensionStop: () => stopCnSfx('reel_tension'),
		soundMusicDuck: () => rampFilter(DUCK_HZ, DUCK_CLOSE_S),
		soundMusicRelease: () => rampFilter(OPEN_HZ, DUCK_OPEN_S),
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') {
				stopBgm();
			} else if (name === 'sfx_bigwin_coinloop') {
				stopCnSfx('coin_shimmer');
			} else if (name === 'sfx_anticipation') {
				stopCnSfx('reel_tension');
				sound.stop({ name });
			} else {
				sound.stop({ name });
			}
		},
		soundFade: async ({ name, duration, from, to }) => await sound.fade({ name, duration, from, to }), // prettier-ignore
	});

	onMount(() => {
		// The duck is the one part of the presentation with no visual trace at
		// all: a probe can screenshot a slowed reel and a scatter-dense strip, but
		// a lowpass on the music is only observable from inside. Behind the same
		// ?hmdebug=1 flag as the other hooks (game/stateGame.svelte.ts), so a
		// submission build does not carry it.
		if (/[?&]hmdebug=1(&|$)/.test(window.location.search)) {
			(
				window as unknown as { __HM_REELSTOP__: (clear?: boolean) => unknown }
			).__HM_REELSTOP__ = (clear?: boolean) => {
				const out = {
					count: reelStopLog.length,
					// gaps on the audio clock, in ms. Five reels should give four gaps.
					gapsMs: reelStopLog.map((entry, index) =>
						index ? Math.round((entry.ctxTime - reelStopLog[index - 1].ctxTime) * 1000) : 0,
					),
					rates: reelStopLog.map((entry) => Number(entry.rate.toFixed(2))),
				};
				if (clear) reelStopLog.length = 0;
				return out;
			};

			(window as unknown as { __HM_AUDIO__: () => unknown }).__HM_AUDIO__ = () => ({
				context: audioContext?.state ?? 'none',
				filtered: !!filteredElement,
				hz: musicFilter ? Math.round(musicFilter.frequency.value) : null,
			});
		}

		// Decode the one-shot sfx up front. This is what makes overlapping plays
		// possible at all — see the Web Audio note above playCnSfx — and it also
		// means the first play is in sync rather than stalling on a fetch.
		//
		// Only if there is no AudioContext do we fall back to preloading elements,
		// so the 22 samples are fetched once, not twice.
		if (ensureAudioContext()) {
			void loadSfxBuffers();
		} else {
			(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);
		}

		playBgm('base');

		return () => {
			for (const name of Object.keys(sfxLoops) as CnSfxName[]) stopCnSfx(name);
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.src = '';
				bgmAudio = null;
			}
			for (const name of Object.keys(cnSfxAudio) as CnSfxName[]) {
				const audio = cnSfxAudio[name];
				if (audio) {
					audio.pause();
					audio.src = '';
					delete cnSfxAudio[name];
				}
			}
			// The extra voices too: they are held by cnSfxPool, not cnSfxAudio, so
			// the loop above frees the first of each pool and leaks the rest.
			for (const name of Object.keys(cnSfxPool) as CnSfxName[]) {
				for (const voice of cnSfxPool[name] ?? []) {
					voice.pause();
					voice.src = '';
				}
				delete cnSfxPool[name];
			}
		};
	});
</script>
