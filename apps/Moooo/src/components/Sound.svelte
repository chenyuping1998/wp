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
		| { type: 'soundPassBy' }
		// `rate` is playbackRate on the drone loop, i.e. its pitch and speed.
		// Broadcasting again while it is already running retunes it in place
		// rather than restarting it, so the tension can climb reel by reel.
		| { type: 'soundReelTensionStart'; rate?: number }
		| { type: 'soundReelTensionStop' }
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

	// ─── Moooo sound set. STILL SYNTHESISED PLACEHOLDER — sine waves out of
	// design/build_placeholder_audio.py, which reads the names from game/sound.ts.
	// (The script named here used to be design/generate_audio.py, which does not
	// exist.) ───
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
		| 'coin_shimmer'
		| 'wild_expand'
		| 'mult_update'
		| 'pass_by';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'moooo/sfx/gong_feature.wav',
		bigwin_blast: 'moooo/sfx/bigwin_blast.wav',
		reel_tension: 'moooo/sfx/reel_tension.wav',
		reel_stop: 'moooo/sfx/reel_stop.wav',
		btn: 'moooo/sfx/btn.wav',
		spin: 'moooo/sfx/spin.wav',
		scatter_1: 'moooo/sfx/scatter_1.wav',
		scatter_2: 'moooo/sfx/scatter_2.wav',
		scatter_3: 'moooo/sfx/scatter_3.wav',
		scatter_4: 'moooo/sfx/scatter_4.wav',
		scatter_5: 'moooo/sfx/scatter_5.wav',
		pluck_low: 'moooo/sfx/pluck_low.wav',
		win_gliss: 'moooo/sfx/win_gliss.wav',
		win_gliss_big: 'moooo/sfx/win_gliss_big.wav',
		fs_intro: 'moooo/sfx/fs_intro.wav',
		coin_shimmer: 'moooo/sfx/coin_shimmer.wav',
		wild_expand: 'moooo/sfx/wild_expand.wav',
		mult_update: 'moooo/sfx/mult_update.wav',
		pass_by: 'moooo/sfx/pass_by.wav',
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
		sfx_fs_intro: { name: 'fs_intro' },
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
			audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
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

	// ─── BGM (both loops are standalone HTML5 Audio) ───
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	// Placeholder loops, generated by design/build_placeholder_audio.py.
	//
	// This used to name two supplied Hot Miami tracks under `audio/miami/`. A
	// Moooo build was therefore requesting another game's folder by filename and
	// 404ing on both — the standing instruction is that the two games share
	// nothing, and a music track is the last thing to be casual about, because
	// it is the asset most likely to carry someone else's licence.
	//
	// Whatever replaces these has to be seamless at the join: they loop, so a
	// track that ends on a decaying tail clicks audibly every time round.
	const BGM_FILES = {
		base: 'moooo/bgm_base.wav',
		freespin: 'moooo/bgm_freespin.wav',
	} as const;

	function playBgm(type: 'base' | 'freespin') {
		if (currentBgm === type && bgmAudio && !bgmAudio.paused) return;
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio = null;
		}
		bgmAudio = new Audio(`${base}/assets/audio/${BGM_FILES[type]}`);
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
		// Every Moooo mode - base and all three feature buys - sits in the base
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
		soundPassBy: () => playCnSfx('pass_by'),
		soundReelTensionStart: ({ rate }) => playCnLoop('reel_tension', 0.8, rate ?? 1),
		soundReelTensionStop: () => stopCnSfx('reel_tension'),
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
