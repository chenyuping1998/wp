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
		| { type: 'soundAlarm' }
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
	// Standalone HTML5 Audio. The howler sprite (sounds.json) is NOT a fallback
	// any more: unmapped one-shots are silent, because falling through to it meant
	// playing a different game's sound set for every cue this one chose not to
	// have. It is still loaded for soundMusic's non-bgm branch, which nothing
	// currently reaches.
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
		// A wider ladder than before, and the last reel lands hardest. Five stops
		// within a second only read as five if the steps between them are obvious;
		// the old 0.92-1.30 spread was under a major sixth and blurred into one
		// repeated click.
		// The volume ladder rises faster than it looks like it should. playbackRate
		// shortens the sample as well as raising it, so reel 5 at 1.6x carries a
		// bit over half the energy of reel 1 at 0.8x - a flat volume would make the
		// last reel, the one that matters most, the quietest of the five.
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.8, volume: 0.9 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 0.95, volume: 0.95 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.12, volume: 1.05 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.33, volume: 1.15 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.6, volume: 1.3 },
		sfx_scatter_stop_1: { name: 'alert_1' },
		sfx_scatter_stop_2: { name: 'alert_2' },
		sfx_scatter_stop_3: { name: 'alert_3' },
		sfx_scatter_stop_4: { name: 'alert_4' },
		sfx_scatter_stop_5: { name: 'alert_5' },
		// The spin itself is deliberately quiet: only the five reel stops and the
		// scatter landing above. A LEVERAGE landing, the meter tick and the
		// anticipation tick all used to fire in the same moment as a reel stop, and
		// four cues layered on one beat is what made the landing sound like mush.
		// The mappings are left here, commented, because the decision is a
		// judgement call and easy to want back.
		// sfx_multiplier_landing stays silent: it fires as the LEVERAGE symbol
		// lands, in the same moment as a reel stop, and two cues on one beat is
		// what made the landing sound like mush in the first place.
		// sfx_multiplier_landing: { name: 'leverage_land' },
		//
		// sfx_multiplier_update is a different matter and is now mapped. It no
		// longer fires on the landing: LeverageMeter broadcasts it when a chip
		// ARRIVES at the meter, which is hundreds of milliseconds later, on its
		// own, and is the exact beat the multiplier climbing is meant to register
		// on. Loud enough to be the event it is.
		sfx_multiplier_update: { name: 'meter_tick', volume: 1.1 },
		sfx_winlevel_small: { name: 'win_small' },
		sfx_winlevel_end: { name: 'blast', volume: 0.85 },
		sfx_scatter_win: { name: 'win_small' },
		sfx_scatter_win_v2: { name: 'win_big' },
		sfx_superfreespin: { name: 'win_big', volume: 0.8 },
		jng_intro_fs: { name: 'feature_intro' },
		// sfx_wild_explode: { name: 'leverage_land' },
		// sfx_anticipation_start: { name: 'meter_tick', volume: 0.5 },
		// sfx_symbols_landing and sfx_royals_landing are deliberately NOT mapped.
		// They used to play the reel-stop knock at 0.6, which meant that knock was
		// the sound of three different events at once - a reel stopping, a symbol
		// landing, a royal landing - and every spin ended in a wash of identical
		// clicks. The reel stop is the one that carries meaning (which reel, in
		// order), so it keeps the sound to itself.
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

	// One-shots need more than one element per file.
	//
	// getSfx caches a single HTMLAudioElement per cue, and playing an element that
	// is already playing does not start a second voice - it rewinds the one that
	// is running. The five reel stops all play reel_stop within about a second, so
	// four of them were silently cancelling each other and the player heard one
	// louder-sounding knock at the end, pitched at whatever the last reel set.
	// Several LEVERAGE symbols landing in one feature spin collapsed the same way.
	//
	// So one-shots take a voice from a small pool and only fall back to stealing
	// the oldest when every voice is busy. Loops are untouched: they stay on the
	// single cached element, because stopSfx has to be able to find them again.
	const VOICES_PER_CUE = 6;
	const sfxPool: Partial<Record<SfxName, HTMLAudioElement[]>> = {};

	function takeVoice(name: SfxName) {
		const pool = (sfxPool[name] ??= []);
		const free = pool.find((voice) => voice.paused || voice.ended);
		if (free) return free;
		if (pool.length < VOICES_PER_CUE) {
			const voice = new Audio(`${base}/assets/audio/${SFX_FILES[name]}`);
			voice.preload = 'auto';
			pool.push(voice);
			return voice;
		}
		// every voice busy: steal the one that started first
		const oldest = pool.reduce((a, b) => (a.currentTime >= b.currentTime ? a : b));
		return oldest;
	}

	function playSfx(name: SfxName, volumeScale = 1, rate = 1) {
		const audio = takeVoice(name);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: a voice is reused across cues
		// that share a file, so a rate left over from the previous caller would
		// carry into the next play.
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
			// Both buys drop straight into the feature, so both take the feature
			// music. Matching on 'BONUS' alone left BLACKSWAN starting the base
			// track over a 5x5 board.
			if (betModeKey === 'BONUS' || betModeKey === 'BLACKSWAN') {
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
		soundOnce: ({ name }) => {
			const mapped = SPRITE_TO_SFX[name];
			// Unmapped names are SILENT. They used to fall through to the howler
			// sprite (sounds.json), which is the template's audio - so every cue
			// this game deliberately does not have was still playing something,
			// from a different game's sound set. That is most of what "the audio
			// is a mess" was.
			if (mapped) playSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
		},
		soundFreeGameBell: () => playSfx('margin_call'),
		soundBigWinBlast: () => playSfx('blast'),
		soundSlam: () => playSfx('board_expand'),
		// the transition wipe IS the margin call landing, so it gets the klaxon
		soundAlarm: () => playSfx('margin_call', 0.85),
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
		// Fetch the one-shot sfx up front so the first play is in sync (an Audio
		// element created lazily would stall on its first fetch). Warms the pool
		// rather than the loop element, because the pool is what one-shots use.
		(Object.keys(SFX_FILES) as SfxName[]).forEach((name) => {
			takeVoice(name);
			getSfx(name);
		});

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
