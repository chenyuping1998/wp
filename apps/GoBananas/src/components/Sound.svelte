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
		| { type: 'soundGrenadeBlast' }
		| { type: 'soundMonkeyExpand' }
		| { type: 'soundReelTensionStart' }
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

	// ─── jungle-commando sound set (synthesized — see design/generate_audio_jungle.mjs) ───
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
		| 'grenade_blast'
		| 'monkey_expand';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'jungle/gong_feature.wav',
		bigwin_blast: 'jungle/bigwin_blast.wav',
		reel_tension: 'jungle/reel_tension.wav',
		reel_stop: 'jungle/reel_stop.wav',
		btn: 'jungle/btn.wav',
		spin: 'jungle/spin.wav',
		scatter_1: 'jungle/scatter_1.wav',
		scatter_2: 'jungle/scatter_2.wav',
		scatter_3: 'jungle/scatter_3.wav',
		scatter_4: 'jungle/scatter_4.wav',
		scatter_5: 'jungle/scatter_5.wav',
		pluck_low: 'jungle/pluck_low.wav',
		win_gliss: 'jungle/win_gliss.wav',
		win_gliss_big: 'jungle/win_gliss_big.wav',
		fs_intro: 'jungle/fs_intro.wav',
		coin_shimmer: 'jungle/coin_shimmer.wav',
		wild_expand: 'jungle/wild_expand.wav',
		mult_update: 'jungle/mult_update.wav',
		grenade_blast: 'jungle/grenade_blast.wav',
		// player-supplied monkey hoot, mp3 rather than the synthesized wav set
		monkey_expand: 'jungle/monkey_expand.mp3',
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
		sfx_winlevel_small: { name: 'win_gliss' },
		sfx_scatter_win: { name: 'win_gliss' },
		sfx_scatter_win_v2: { name: 'win_gliss_big' },
		sfx_superfreespin: { name: 'win_gliss_big', volume: 0.8 },
		jng_intro_fs: { name: 'fs_intro' },
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

	// The monkey hoot the player supplied is ~5s, but it needs to track the wild
	// expansion — which lasts about 1.5s — and then get out of the way. Play it
	// from the top, hold, then fade to silence so it covers the grow and settles
	// as the panel locks, instead of hanging on under the next spin.
	let monkeyFadeTimers: ReturnType<typeof setTimeout>[] = [];
	function playMonkeyExpand() {
		const audio = getCnSfx('monkey_expand');
		monkeyFadeTimers.forEach(clearTimeout);
		monkeyFadeTimers = [];
		audio.loop = false;
		const vol = Math.min(1, stateSoundDerived.volumeSoundEffect());
		audio.volume = vol;
		audio.playbackRate = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
		// hold at full to ~2s, fade over 600ms, stop by ~2.6s
		const HOLD_MS = 2000;
		const FADE_MS = 600;
		const STEPS = 12;
		for (let s = 1; s <= STEPS; s++) {
			monkeyFadeTimers.push(
				setTimeout(
					() => {
						audio.volume = Math.max(0, vol * (1 - s / STEPS));
						if (s === STEPS) audio.pause();
					},
					HOLD_MS + (FADE_MS / STEPS) * s,
				),
			);
		}
	}

	function playCnLoop(name: CnSfxName, volumeScale = 1) {
		const audio = getCnSfx(name);
		audio.loop = true;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
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
	const BGM_FILES = {
		base: 'jungle/bgm_main.wav',
		freespin: 'jungle/bgm_freespin.wav',
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
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey === 'SUPERSPIN') {
				playCnSfx('win_gliss_big', 0.7);
				await waitForTimeout(SECOND);
				playBgm('freespin');
			} else {
				playBgm('base');
			}
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
		soundGrenadeBlast: () => playCnSfx('grenade_blast'),
		soundMonkeyExpand: () => playMonkeyExpand(),
		soundReelTensionStart: () => playCnLoop('reel_tension', 0.8),
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

		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			playBgm('freespin');
		} else {
			playBgm('base');
		}

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
