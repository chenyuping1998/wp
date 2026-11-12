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

	// ─── Wild Alchemy sound set (design/generate_wild_alchemy_audio.py) ───
	//
	// The game's own synthesized set: struck glass, bubbles, flame, a brass bowl,
	// wood and parchment taps, and two harp/cello/glass-harmonica music loops.
	// It replaced the Hard Time files this app was scaffolded with (2026-11-10);
	// design/check_wild_alchemy_audio.py checks levels, loop seams, escalation and
	// that no file is byte-identical to a sibling's.
	// Standalone Web Audio / HTML5 Audio; the howler sprite (sounds.json) is a
	// silent stand-in, so a name missing here plays nothing rather than another
	// game's sample (design/check_sounds.mjs fails the build on such a name).
	type CnSfxName =
		| 'btn'
		| 'spin'
		| 'reel_stop'
		| 'reel_stop_block'
		| 'vial_fill'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'wild_charge'
		| 'wild_release'
		| 'ladder_step'
		| 'plus_spins'
		| 'line_win'
		| 'feature_bell'
		| 'transition'
		| 'fs_intro'
		| 'fs_outro'
		| 'win_tier_big'
		| 'win_tier_super'
		| 'win_tier_mega'
		| 'win_tier_epic'
		| 'win_tier_max'
		| 'win_cap'
		| 'coin_shimmer'
		| 'reel_tension';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'wild_alchemy/sfx/btn.wav',
		spin: 'wild_alchemy/sfx/spin.wav',
		reel_stop: 'wild_alchemy/sfx/reel_stop.wav',
		reel_stop_block: 'wild_alchemy/sfx/reel_stop_block.wav',
		vial_fill: 'wild_alchemy/sfx/vial_fill.wav',
		scatter_1: 'wild_alchemy/sfx/scatter_1.wav',
		scatter_2: 'wild_alchemy/sfx/scatter_2.wav',
		scatter_3: 'wild_alchemy/sfx/scatter_3.wav',
		scatter_4: 'wild_alchemy/sfx/scatter_4.wav',
		scatter_5: 'wild_alchemy/sfx/scatter_5.wav',
		wild_charge: 'wild_alchemy/sfx/wild_charge.wav',
		wild_release: 'wild_alchemy/sfx/wild_release.wav',
		ladder_step: 'wild_alchemy/sfx/ladder_step.wav',
		plus_spins: 'wild_alchemy/sfx/plus_spins.wav',
		line_win: 'wild_alchemy/sfx/line_win.wav',
		feature_bell: 'wild_alchemy/sfx/feature_bell.wav',
		transition: 'wild_alchemy/sfx/transition.wav',
		fs_intro: 'wild_alchemy/sfx/fs_intro.wav',
		fs_outro: 'wild_alchemy/sfx/fs_outro.wav',
		win_tier_big: 'wild_alchemy/sfx/win_tier_big.wav',
		win_tier_super: 'wild_alchemy/sfx/win_tier_super.wav',
		win_tier_mega: 'wild_alchemy/sfx/win_tier_mega.wav',
		win_tier_epic: 'wild_alchemy/sfx/win_tier_epic.wav',
		win_tier_max: 'wild_alchemy/sfx/win_tier_max.wav',
		win_cap: 'wild_alchemy/sfx/win_cap.wav',
		// loops (rendered circularly, seam-checked)
		coin_shimmer: 'wild_alchemy/sfx/coin_shimmer.wav',
		// Spare: Anticipations.svelte is not mounted (this game never teases),
		// but its soundReelTensionStart handler stays wired to a real file.
		reel_tension: 'wild_alchemy/sfx/reel_tension.wav',
	};

	// Broadcast names → this set.
	//
	// `rate` sets playbackRate. Reel stops: one flat click for every ordinary
	// reel, and a DIFFERENT, heavier sound for a merged block landing as one wide
	// reel (SPEC §2.2 "大格停輪另一聲"). This game has no tease, so
	// `sfx_reel_stop_tease` is only ever the block.
	//
	// Several names share a sound because their emitters share a name today
	// (e.g. `sfx_multiplier_landing` is the point orbs, a merge frame lighting
	// and the free-spin intro count slam). Splitting them needs new names at the
	// broadcast sites, not new files here.
	const SPRITE_TO_CN: Partial<
		Record<SoundEffectName, { name: CnSfxName; volume?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop: { name: 'reel_stop', volume: 0.38, rate: 1 },
		sfx_reel_stop_tease: { name: 'reel_stop_block', volume: 0.6, rate: 1 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		// point orbs into the flask / a merge frame lighting / FS intro count slam
		sfx_multiplier_landing: { name: 'vial_fill', volume: 0.7 },
		// WILD forecast at 0.4 s (bookEventHandlerMap reveal): the brew boils.
		// This one-shot was unmapped and silent under the Hard Time set.
		sfx_anticipation: { name: 'wild_charge', volume: 0.75 },
		// trans_out (character leaps into the swarm) and the FG trigger frames
		sfx_scatter_win_v2: { name: 'wild_release', volume: 0.85 },
		// ladder step: flask bursts, giant X2
		sfx_winlevel_nice: { name: 'ladder_step', volume: 0.85 },
		// +3 free spins, and the FG trigger right before the transition
		sfx_superfreespin: { name: 'plus_spins', volume: 0.8 },
		// once per winInfo: lines paid
		sfx_winlevel_small: { name: 'line_win', volume: 0.72 },
		sfx_winlevel_big: { name: 'win_tier_big', volume: 0.86 },
		sfx_winlevel_superwin: { name: 'win_tier_super', volume: 0.88 },
		sfx_winlevel_mega: { name: 'win_tier_mega', volume: 0.9 },
		sfx_winlevel_epic: { name: 'win_tier_epic', volume: 0.92 },
		sfx_winlevel_max: { name: 'win_tier_max', volume: 0.94 },
		jng_intro_fs: { name: 'fs_intro' },
		sfx_youwon_panel: { name: 'fs_outro' },
		sfx_winlevel_end: { name: 'win_cap' },
		// Not broadcast today; routed to the nearest sound so a future emitter
		// lands on this set instead of the silent sprite.
		sfx_anticipation_start: { name: 'wild_charge', volume: 0.5 },
		sfx_wild_explode: { name: 'wild_release' },
		sfx_scatter_win: { name: 'wild_release', volume: 0.7 },
		sfx_multiplier_update: { name: 'ladder_step', volume: 0.7 },
		sfx_winlevel_standard: { name: 'line_win', volume: 0.76 },
		sfx_multiplier_win: { name: 'line_win', volume: 0.8 },
		sfx_winlevel_substantial: { name: 'line_win', volume: 0.84 },
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
	// All reel stops are the SAME file (reel_stop.wav, ~0.2 s) — now at ONE
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
	// vial_fill (the point orbs) has it worse — one per orb, several in the same
	// millisecond.
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
	const sfxLoops: Partial<Record<CnSfxName, { source: AudioBufferSourceNode; gain: GainNode; scale: number }>> = {};
	// the element fallback's own scale, for the same reason
	const loopElementScale: Partial<Record<CnSfxName, number>> = {};

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
	// The reel-stop clicks are the SAME short sample (a block uses its own), so
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
		if (REELSTOP_DEBUG && (name === 'reel_stop' || name === 'reel_stop_block') && ctx) {
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
	// `name` is reel_stop for an ordinary reel or reel_stop_block for a merged
	// block; both share the one queue so a block never lands on top of a reel.
	function playReelStop(name: CnSfxName, volume: number, rate: number) {
		const ctx = ensureAudioContext();
		if (!ctx) {
			playCnSfx(name, volume, rate);
			return;
		}
		const when = Math.max(ctx.currentTime, nextReelStopTime);
		nextReelStopTime = when + REEL_STOP_MIN_GAP;
		playCnSfx(name, volume, rate, when - ctx.currentTime);
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
				running.scale = volumeScale;
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
			sfxLoops[name] = { source, gain, scale: volumeScale };
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
		loopElementScale[name] = volumeScale;
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
	// Wild Alchemy's own loops (design/generate_wild_alchemy_audio.py): harp,
	// bowed drone, glass harmonica, frame drum and a quiet bubbling bed. MG is
	// D Dorian at 80 bpm, FG A harmonic minor at 104 bpm; both 16 bars, rendered
	// circularly so the loop point is continuous. AAC keeps the download small.
	const BGM_FILES = {
		base: 'wild_alchemy/bgm_base.m4a',
		freespin: 'wild_alchemy/bgm_feature.m4a',
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

	// A loop's gain was set once, when it started. Muting (or turning effects
	// down) during a tease or a big win left reel_tension and coin_shimmer
	// playing at the old level until they stopped — Engine guideline 107 wants
	// every sound to follow the setting immediately. No ramp: a mute is a mute.
	$effect(() => {
		const vol = stateSoundDerived.volumeSoundEffect();
		for (const node of Object.values(sfxLoops)) {
			if (!node) continue;
			const ctx = node.gain.context;
			node.gain.gain.cancelScheduledValues(ctx.currentTime);
			node.gain.gain.setValueAtTime(Math.min(1, vol * node.scale), ctx.currentTime);
		}
		for (const [name, scale] of Object.entries(loopElementScale)) {
			const audio = cnSfxAudio[name as CnSfxName];
			if (audio?.loop) audio.volume = Math.min(1, vol * (scale ?? 1));
		}
	});

	context.eventEmitter.subscribeOnMount({
		// ui
		// Every mode - base and both feature buys - sits in the base
		// track until the round actually enters free spins, at which point
		// freeSpinTrigger switches the music. A bought feature gets a flourish so
		// the purchase is acknowledged before the reels start.
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey !== 'BASE') {
				playCnSfx('plus_spins', 0.7);
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
					playReelStop(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
				} else {
					playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
				}
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playCnSfx('feature_bell'),
		// never broadcast today; kept on the nearest sound of this set
		soundBigWinBlast: () => playCnSfx('win_tier_big'),
		soundFrameBigLand: () => playCnSfx('reel_stop_block'),
		// the scene wipe (TransitionAnimation, also the loading reveal)
		soundNeonZap: () => playCnSfx('transition'),
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
		// so the samples are fetched once, not twice.
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
