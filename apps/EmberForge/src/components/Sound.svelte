<script lang="ts" module>
	import { base } from '$app/paths';

	import type { MusicName, SoundEffectName, SoundName } from '../game/sound';

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

	// ─── forge sound set (synthesized — see design/generate_audio_forge.mjs) ───
	// Standalone HTML5 Audio. This is now the ONLY sound bank: the template's
	// howler sprite is gone, so every name has to resolve here or be silent.
	//
	// The file map and the element cache live in the MODULE script, not the
	// instance script, so the fetches start when this module is first imported —
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
		gong_feature: 'forge/gong_feature.wav',
		bigwin_blast: 'forge/bigwin_blast.wav',
		reel_tension: 'forge/reel_tension.wav',
		reel_stop: 'forge/reel_stop.wav',
		btn: 'forge/btn.wav',
		spin: 'forge/spin.wav',
		scatter_1: 'forge/scatter_1.wav',
		scatter_2: 'forge/scatter_2.wav',
		scatter_3: 'forge/scatter_3.wav',
		scatter_4: 'forge/scatter_4.wav',
		scatter_5: 'forge/scatter_5.wav',
		pluck_low: 'forge/pluck_low.wav',
		win_gliss: 'forge/win_gliss.wav',
		win_gliss_big: 'forge/win_gliss_big.wav',
		fs_intro: 'forge/fs_intro.wav',
		coin_shimmer: 'forge/coin_shimmer.wav',
		wild_expand: 'forge/wild_expand.wav',
		mult_update: 'forge/mult_update.wav',
		grenade_blast: 'forge/grenade_blast.wav',
		fire_sweep: 'forge/fire_sweep.wav',
		chain_hit: 'forge/chain_hit.wav',
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
	// this is unaffected by autoplay policy — by the time anything is played the
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
		// Fires on EVERY tumble link. At full volume it was the loudest thing in
		// the free game and it repeated ten to twenty times a round, which is what
		// buried the bed under it.
		sfx_wild_explode: { name: 'wild_expand', volume: 0.5 },
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_anticipation_start: { name: 'mult_update', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
		// The last two names that were still falling through to the template bank.
		// Mapping them is what made it possible to delete that bank: sounds.mp3 and
		// its three transcodes were 17MB of a 50MB build, and nothing in the game
		// played a single sprite out of them any more.
		sfx_winlevel_end: { name: 'pluck_low', volume: 0.6 },
		sfx_youwon_panel: { name: 'win_gliss', volume: 0.8 },
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

	// ─── BGM (both loops are standalone HTML5 Audio) ───
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	const BGM_FILES = {
		base: 'forge/bgm_main.wav',
		freespin: 'forge/bgm_freespin.wav',
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
		// A fresh element, so it has to be told the current state rather than
		// inheriting it: the bed switches to the free-game loop on transitions, and
		// one of those can land while the tab is hidden.
		bgmAudio.muted = document.visibilityState === 'hidden';
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
		// Only the two forge beds exist. The win-level stingers (bgm_winlevel_*)
		// never had audio in this set and are deliberately not switched to — see
		// winLevelSoundsPlay, which explains why interrupting the bed for a track
		// that does not exist left the celebration silent.
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') playBgm('base');
			else if (name === 'bgm_freespin') playBgm('freespin');
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') playCnLoop('coin_shimmer', 0.8);
			// sfx_anticipation is covered by the reel_tension tremolo loop
			// (soundReelTensionStart), so it is deliberately silent here.
		},
		soundOnce: ({ name }) => {
			const mapped = SPRITE_TO_CN[name];
			if (mapped) playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
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
		// modes stay recognisably one instrument — the feature should feel like the
		// forge working faster, not like a different game.
		soundTumbleHit: ({ chain }) => {
			const feature = context.stateGame.gameType === 'freegame';
			const rate = Math.pow(2, Math.min(chain - 1, 12) / 12) * (feature ? 1.06 : 1);
			// Its own sample. This played scatter_1 until now, which made a cluster
			// paying and a Scatter landing the same sound — the one symbol that has
			// to stand out was indistinguishable from the most common event there is.
			// Also once per link. Pulled down for the same reason — the ladder still
			// climbs, it just no longer competes with the music.
			playCnSfx('chain_hit', feature ? 0.7 : 0.6, rate);
			// a low thump under the strike, so a feature chain has weight as well as pitch
			if (feature) playCnSfx('pluck_low', 0.5, 1.15);
		},
		soundReelTensionStart: () => playCnLoop('reel_tension', 0.8),
		soundReelTensionStop: () => stopCnSfx('reel_tension'),
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') stopBgm();
			else if (name === 'sfx_bigwin_coinloop') stopCnSfx('coin_shimmer');
			else if (name === 'sfx_anticipation') stopCnSfx('reel_tension');
		},
		// Kept as a no-op subscriber rather than dropped. `broadcastAsync` awaits its
		// subscribers, and the shared UI fades the bed on some paths; with no
		// handler at all the event is silent in both senses, which is fine, but the
		// subscription documents that it was considered.
		soundFade: async () => {},
	});

	onMount(() => {
		// The one-shot sfx are already buffering — the module script started that
		// at app boot, which is a whole loading screen earlier than here.
		playBgm('base');

		// Silence while the tab is not being looked at.
		//
		// This used to be EnableSound's job via Howler, which was ineffective: these
		// are HTMLAudioElements created with `new Audio()`, so they are not in the
		// document and Howler does not own them. Switching tabs mid-round left the
		// forge hammering away behind you.
		const onVisibilityChange = () => {
			const muted = document.visibilityState === 'hidden';
			if (bgmAudio) bgmAudio.muted = muted;
			for (const audio of Object.values(cnSfxAudio)) {
				if (audio) audio.muted = muted;
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
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
