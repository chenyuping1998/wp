<script lang="ts" module>
	import { base } from '$app/paths';

	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundTumbleHit'; chain: number }
		| { type: 'soundTransitionBlast' }
		| { type: 'soundEntryFire' }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };

	// ??? forge sound set (synthesized ??see design/generate_audio_yard.mjs) ???
	// Standalone HTML5 Audio; the howler sprite (sounds.json) stays as a
	// fallback for anything not mapped here (e.g. win-level bgm stingers).
	//
	// The file map and the element cache live in the MODULE script, not the
	// instance script, so the fetches start when this module is first imported ??
	// at app boot, while the loading screen is still up. They used to be created
	// in onMount, which is the same tick <EntryReveal> mounts and fires the
	// opening cue: the element existed but had no data yet, so the fire was
	// audible only once the board was already on screen. Several seconds of
	// loading screen is exactly the time to spend buffering these.
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
		| 'fire_sweep'
		| 'chain_hit';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'yard/gong_feature.wav',
		bigwin_blast: 'yard/bigwin_blast.wav',
		reel_tension: 'yard/reel_tension.wav',
		reel_stop: 'yard/reel_stop.wav',
		btn: 'yard/btn.wav',
		spin: 'yard/spin.wav',
		scatter_1: 'yard/scatter_1.wav',
		scatter_2: 'yard/scatter_2.wav',
		scatter_3: 'yard/scatter_3.wav',
		scatter_4: 'yard/scatter_4.wav',
		scatter_5: 'yard/scatter_5.wav',
		pluck_low: 'yard/pluck_low.wav',
		win_gliss: 'yard/win_gliss.wav',
		win_gliss_big: 'yard/win_gliss_big.wav',
		fs_intro: 'yard/fs_intro.wav',
		coin_shimmer: 'yard/coin_shimmer.wav',
		wild_expand: 'yard/wild_expand.wav',
		mult_update: 'yard/mult_update.wav',
		grenade_blast: 'yard/grenade_blast.wav',
		fire_sweep: 'yard/fire_sweep.wav',
		chain_hit: 'yard/chain_hit.wav',
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

	// Start buffering everything now. Creating the elements is not playback, so
	// this is unaffected by autoplay policy ??by the time anything is played the
	// player has already pressed through the loading screen.
	if (typeof window !== 'undefined') {
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet, stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';

	const context = getContext();

	// Sprite sound names re-routed to the Chinese set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// The five reel stops share one file and used to be indistinguishable ??worse,
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
		// Fires on EVERY tumble link. At full volume it was the loudest thing in
		// the free game and it repeated ten to twenty times a round, which is what
		// buried the bed under it.
		sfx_wild_explode: { name: 'wild_expand', volume: 0.5 },
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_anticipation_start: { name: 'mult_update', volume: 0.5 },
		// ── Crusher Yard's own mechanics ──────────────────────────────────────
		// Mapped onto existing samples rather than given new ones. The synth in
		// design/generate_audio_yard.mjs could make three more, but every custom
		// sound is a file the loader waits on, and these three are close enough in
		// character to samples already resident that a new one would be a download
		// for a pitch shift.
		//
		// The gauge tick fires on a real advance only (the math emits its event on
		// every tumble, most of them unchanged) but a hot chain still ratchets it
		// several times in a row, so it sits well under the strike that caused it.
		sfx_gauge_tick: { name: 'mult_update', volume: 0.35, rate: 1.35 },
		// A tank arriving: heavy, pitched below the chain strike so it does not read
		// as another link.
		sfx_tank_land: { name: 'chain_hit', volume: 0.8, rate: 0.72 },
		// A tank resolving: gas release, which is what fire_sweep already is.
		sfx_tank_burst: { name: 'fire_sweep', volume: 0.95, rate: 1.12 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
	};

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

	// ??? BGM (both loops are standalone HTML5 Audio) ???
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	const BGM_FILES = {
		base: 'yard/bgm_main.wav',
		freespin: 'yard/bgm_freespin.wav',
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
		soundBetMode: async () => playBgm('base'),
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
				// Other music (win levels etc) ??pause bgm, play via sprite
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
		// The wipe between base game and feature.
		soundTransitionBlast: () => playCnSfx('grenade_blast'),
		// The opening flare. Its own cue, not the transition's: same fire, but
		// swelling with the front instead of detonating ahead of it, and cut to the
		// length of the shot so nothing rings on over a board that is already up.
		soundEntryFire: () => playCnSfx('fire_sweep', 0.9),
		// Each link of a tumble chain is the same strike pitched a semitone higher,
		// so a long chain climbs. Capped at an octave: past that it stops reading as
		// "higher" and just sounds thin.
		//
		// The free game hits harder and a touch brighter. Same sample, so the two
		// modes stay recognisably one instrument ??the feature should feel like the
		// forge working faster, not like a different game.
		soundTumbleHit: ({ chain }) => {
			const feature = context.stateGame.gameType === 'freegame';
			const rate = Math.pow(2, Math.min(chain - 1, 12) / 12) * (feature ? 1.06 : 1);
			// Its own sample. This played scatter_1 until now, which made a cluster
			// paying and a Scatter landing the same sound ??the one symbol that has
			// to stand out was indistinguishable from the most common event there is.
			// Also once per link. Pulled down for the same reason ??the ladder still
			// climbs, it just no longer competes with the music.
			playCnSfx('chain_hit', feature ? 0.7 : 0.6, rate);
			// a low thump under the strike, so a feature chain has weight as well as pitch
			if (feature) playCnSfx('pluck_low', 0.5, 1.15);
		},
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
		// The one-shot sfx are already buffering ??the module script started that
		// at app boot, which is a whole loading screen earlier than here.
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
