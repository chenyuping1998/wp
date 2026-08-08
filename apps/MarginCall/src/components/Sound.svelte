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
		| { type: 'soundSlam' }
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

	// ─── Margin Call sound set (synthesized — see design/generate_audio_terminal.mjs) ───
	// Standalone HTML5 Audio; the howler sprite (sounds.json) stays as a
	// fallback for anything not mapped here (e.g. win-level bgm stingers).
	type SfxName =
		| 'ui_click'
		| 'spin_start'
		| 'reel_stop'
		| 'alert_1'
		| 'alert_2'
		| 'alert_3'
		| 'alert_4'
		| 'alert_5'
		| 'margin_call'
		| 'blast'
		| 'leverage_land'
		| 'meter_tick'
		| 'board_expand'
		| 'win_small'
		| 'win_big'
		| 'feature_intro'
		| 'tension'
		| 'shimmer';

	const SFX_FILES: Record<SfxName, string> = {
		ui_click: 'terminal/ui_click.wav',
		spin_start: 'terminal/spin_start.wav',
		reel_stop: 'terminal/reel_stop.wav',
		alert_1: 'terminal/alert_1.wav',
		alert_2: 'terminal/alert_2.wav',
		alert_3: 'terminal/alert_3.wav',
		alert_4: 'terminal/alert_4.wav',
		alert_5: 'terminal/alert_5.wav',
		margin_call: 'terminal/margin_call.wav',
		blast: 'terminal/blast.wav',
		leverage_land: 'terminal/leverage_land.wav',
		meter_tick: 'terminal/meter_tick.wav',
		board_expand: 'terminal/board_expand.wav',
		win_small: 'terminal/win_small.wav',
		win_big: 'terminal/win_big.wav',
		feature_intro: 'terminal/feature_intro.wav',
		tension: 'terminal/tension.wav',
		shimmer: 'terminal/shimmer.wav',
	};

	// Sprite sound names re-routed to the synthesized set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// The five reel stops share one file and used to be indistinguishable — worse,
	// only _1 was ever played, so every reel landed on the identical click. They
	// now rise reel by reel, which is what gives a spin its sense of building
	// toward the last reel.
	const SPRITE_TO_SFX: Partial<
		Record<SoundEffectName, { name: SfxName; volume?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'ui_click', volume: 0.7 },
		sfx_btn_spin: { name: 'spin_start', volume: 0.9 },
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.92 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1.0 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.19 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.3 },
		sfx_scatter_stop_1: { name: 'alert_1' },
		sfx_scatter_stop_2: { name: 'alert_2' },
		sfx_scatter_stop_3: { name: 'alert_3' },
		sfx_scatter_stop_4: { name: 'alert_4' },
		sfx_scatter_stop_5: { name: 'alert_5' },
		// a LEVERAGE symbol landing — fires up to four times in one feature spin,
		// so it is the quietest cue in the set that still has to be heard
		sfx_multiplier_landing: { name: 'leverage_land' },
		sfx_multiplier_update: { name: 'meter_tick' },
		sfx_winlevel_small: { name: 'win_small' },
		sfx_winlevel_end: { name: 'blast', volume: 0.85 },
		sfx_scatter_win: { name: 'win_small' },
		sfx_scatter_win_v2: { name: 'win_big' },
		sfx_superfreespin: { name: 'win_big', volume: 0.8 },
		jng_intro_fs: { name: 'feature_intro' },
		sfx_wild_explode: { name: 'leverage_land' },
		sfx_anticipation_start: { name: 'meter_tick', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
	};

	const sfxAudio: Partial<Record<SfxName, HTMLAudioElement>> = {};

	function getSfx(name: SfxName) {
		let audio = sfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${SFX_FILES[name]}`);
			audio.preload = 'auto';
			sfxAudio[name] = audio;
		}
		return audio;
	}

	function playSfx(name: SfxName, volumeScale = 1, rate = 1) {
		const audio = getSfx(name);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: getSfx caches one element per
		// file, so a rate left over from the previous caller would carry into every
		// later play of the same sample. reel_stop is shared with symbol/royal
		// landings, which would otherwise inherit the fifth reel's pitch.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function playLoop(name: SfxName, volumeScale = 1) {
		const audio = getSfx(name);
		audio.loop = true;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function stopSfx(name: SfxName) {
		const audio = sfxAudio[name];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
	}

	// ─── BGM (both loops are standalone HTML5 Audio) ───
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	const BGM_FILES = {
		base: 'terminal/bgm_main.wav',
		freespin: 'terminal/bgm_feature.wav',
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
			if (betModeKey === 'BONUS') {
				playSfx('win_big', 0.7);
				await waitForTimeout(SECOND);
				playBgm('freespin');
			} else {
				playBgm('base');
			}
		},
		soundPressGeneral: () => playSfx('btn', 0.7),
		soundPressBet: () => playSfx('spin', 0.9),
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
				playLoop('shimmer', 0.8);
			} else if (name === 'sfx_anticipation') {
				// covered by the tension tremolo loop (soundReelTensionStart)
			} else {
				sound.players.loop.play({ name });
			}
		},
		soundOnce: ({ name, forcePlay }) => {
			const mapped = SPRITE_TO_SFX[name];
			if (mapped) {
				playSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playSfx('margin_call'),
		soundBigWinBlast: () => playSfx('blast'),
		soundSlam: () => playSfx('board_expand'),
		soundReelTensionStart: () => playLoop('tension', 0.8),
		soundReelTensionStop: () => stopSfx('tension'),
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') {
				stopBgm();
			} else if (name === 'sfx_bigwin_coinloop') {
				stopSfx('shimmer');
			} else if (name === 'sfx_anticipation') {
				stopSfx('tension');
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
		(Object.keys(SFX_FILES) as SfxName[]).forEach(getSfx);

		playBgm('base');

		return () => {
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.src = '';
				bgmAudio = null;
			}
			for (const name of Object.keys(sfxAudio) as SfxName[]) {
				const audio = sfxAudio[name];
				if (audio) {
					audio.pause();
					audio.src = '';
					delete sfxAudio[name];
				}
			}
		};
	});
</script>
