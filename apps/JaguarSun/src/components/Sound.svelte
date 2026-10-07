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

	// ─── neon-sunset sound set (synthesized — see design/generate_audio.py) ───
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
		| 'fs_intro'
		| 'fs_outro'
		| 'win_cap'
		| 'coin_shimmer'
		| 'wild_expand'
		| 'mult_update'
		| 'neon_zap';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'deadwood/sfx/gong_feature.wav',
		bigwin_blast: 'deadwood/sfx/bigwin_blast.wav',
		reel_tension: 'deadwood/sfx/reel_tension.wav',
		reel_stop: 'deadwood/sfx/reel_stop.wav',
		btn: 'deadwood/sfx/btn.wav',
		spin: 'deadwood/sfx/spin.wav',
		scatter_1: 'deadwood/sfx/scatter_1.wav',
		scatter_2: 'deadwood/sfx/scatter_2.wav',
		scatter_3: 'deadwood/sfx/scatter_3.wav',
		scatter_4: 'deadwood/sfx/scatter_4.wav',
		scatter_5: 'deadwood/sfx/scatter_5.wav',
		pluck_low: 'deadwood/sfx/pluck_low.wav',
		win_gliss: 'deadwood/sfx/win_gliss.wav',
		win_gliss_big: 'deadwood/sfx/win_gliss_big.wav',
		fs_intro: 'deadwood/sfx/fs_intro.wav',
		fs_outro: 'deadwood/sfx/fs_outro.wav',
		win_cap: 'deadwood/sfx/win_cap.wav',
		coin_shimmer: 'deadwood/sfx/coin_shimmer.wav',
		wild_expand: 'deadwood/sfx/wild_expand.wav',
		mult_update: 'deadwood/sfx/mult_update.wav',
		neon_zap: 'deadwood/sfx/neon_zap.wav',
	};

	// Sprite sound names re-routed to the Chinese set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// The five reel stops share one file and used to be indistinguishable — worse,
	// only _1 was ever played, so every reel landed on the identical click. They
	// now rise reel by reel, which is what gives a spin its sense of building
	// toward the last reel.
	const SPRITE_TO_CN: Partial<
		Record<SoundEffectName, { name: CnSfxName; volume?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.92 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1.0 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.19 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.3 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		sfx_multiplier_landing: { name: 'pluck_low' },
		// The "a line paid" tick, fired on every winInfo.
		sfx_winlevel_small: { name: 'win_gliss' },
		// Win-ladder stingers for winLevelMap levels 2-5, fired at setWin once the
		// level is known. Same pitch-ladder idiom as the reel stops above: two
		// rungs of win_gliss, then two of win_gliss_big, each louder than the last,
		// so the ear can tell a 0.3x from a 4.9x. Unmapped, these four names would
		// have fallen through to the template's howler sprite and played the
		// original non-Miami samples.
		sfx_winlevel_standard: { name: 'win_gliss', volume: 0.6, rate: 0.92 },
		sfx_multiplier_win: { name: 'win_gliss', volume: 0.75, rate: 1.08 },
		sfx_winlevel_nice: { name: 'win_gliss_big', volume: 0.8, rate: 0.98 },
		sfx_winlevel_substantial: { name: 'win_gliss_big', volume: 0.95, rate: 1.12 },
		sfx_scatter_win: { name: 'win_gliss' },
		sfx_scatter_win_v2: { name: 'win_gliss_big' },
		sfx_superfreespin: { name: 'win_gliss_big', volume: 0.8 },
		jng_intro_fs: { name: 'fs_intro' },
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
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
	};

	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement>> = {};

	function getCnSfx(name: CnSfxName) {
		let audio = cnSfxAudio[name];
		if (!audio) {
			audio = new Audio(`./assets/audio/${CN_SFX_FILES[name]}`);
			audio.preload = 'auto';
			cnSfxAudio[name] = audio;
		}
		return audio;
	}

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(name);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: getCnSfx caches one element per
		// file, so a rate left over from the previous caller would carry into every
		// later play of the same sample. reel_stop is shared with symbol/royal
		// landings, which would otherwise inherit the fifth reel's pitch.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// `rate` mirrors playCnSfx: playbackRate, which on a sustained drone reads as
	// pitch and speed together. The loop had no rate parameter at all, so
	// soundReelTensionStart could not rise while the five reel-stop clicks
	// already did (SPRITE_TO_CN above) — the tension bed was the one thing in the
	// spin that stayed flat all the way to the payoff.
	//
	// Retunes rather than restarts when the loop is already playing: a tease
	// climbs across reels, and seeking back to 0 on every step would chop the
	// drone into pieces instead of bending it upward.
	function playCnLoop(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(name);
		const alreadyRunning = audio.loop && !audio.paused;
		audio.loop = true;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.playbackRate = rate;
		if (alreadyRunning) return;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function stopCnSfx(name: CnSfxName) {
		const audio = cnSfxAudio[name];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
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
	// Supplied Miami tracks. Both are ~31s at 192 kbps/48 kHz and are looped, so
	// they need to be seamless at the join — a track that ends on a decaying tail
	// will click audibly every 31 seconds.
	const BGM_FILES = {
		base: 'deadwood/base.mp3',
		freespin: 'deadwood/feature.mp3',
	} as const;

	function playBgm(type: 'base' | 'freespin') {
		if (currentBgm === type && bgmAudio && !bgmAudio.paused) return;
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio = null;
		}
		bgmAudio = new Audio(`./assets/audio/${BGM_FILES[type]}`);
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
				playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playCnSfx('gong_feature'),
		soundBigWinBlast: () => playCnSfx('bigwin_blast'),
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
			(window as unknown as { __HM_AUDIO__: () => unknown }).__HM_AUDIO__ = () => ({
				context: audioContext?.state ?? 'none',
				filtered: !!filteredElement,
				hz: musicFilter ? Math.round(musicFilter.frequency.value) : null,
			});
		}

		// Fetch the one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);

		playBgm('base');

		return () => {
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
		};
	});
</script>
