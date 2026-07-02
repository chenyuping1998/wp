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

	// ─── Wild Party custom BGM player (standalone HTML5 Audio) ───
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;

	// Wild Party custom one-shot sfx (standalone HTML5 Audio, like background.mp3).
	// volumeScale lets quieter accents (coin clatter) sit under the main mix.
	type WpSfxName = 'freegame_bell' | 'bigwin_blast' | 'reel_tension';
	const WP_SFX_FILES: Record<WpSfxName, string> = {
		freegame_bell: 'FeatureTrigger.mp3',
		bigwin_blast: 'bigwin_blast.wav',
		reel_tension: 'reel_tension.wav',
	};
	const wpSfxAudio: Partial<Record<WpSfxName, HTMLAudioElement>> = {};

	function getWpSfx(name: WpSfxName) {
		let audio = wpSfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${WP_SFX_FILES[name]}`);
			audio.preload = 'auto';
			wpSfxAudio[name] = audio;
		}
		return audio;
	}

	function playWpSfx(name: WpSfxName, volumeScale = 1) {
		const audio = getWpSfx(name);
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	function playBgm(type: 'base' | 'freespin') {
		if (type === 'base') {
			if (currentBgm === 'base' && bgmAudio && !bgmAudio.paused) return;
			// Stop any playing sprite bgm
			sound.players.music.stop?.({ name: 'bgm_main' } as any);
			// Play standalone mp3
			if (!bgmAudio) {
				bgmAudio = new Audio(`${base}/assets/audio/background.mp3`);
				bgmAudio.loop = true;
			}
			bgmAudio.volume = stateSoundDerived.volumeMusic();
			bgmAudio.currentTime = 0;
			bgmAudio.play().catch(() => {});
			currentBgm = 'base';
		} else {
			// Free spin — stop custom bgm, use sprite system
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.currentTime = 0;
			}
			currentBgm = 'freespin';
			sound.players.music.play({ name: 'bgm_freespin' });
		}
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
				sound.players.once.play({ name: 'sfx_winlevel_end' });
				await waitForTimeout(SECOND);
				playBgm('freespin');
			} else {
				playBgm('base');
			}
		},
		soundPressGeneral: () => sound.players.once.play({ name: 'sfx_btn_general' }),
		soundPressBet: () => sound.players.once.play({ name: 'sfx_btn_spin' }),
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
				// Other music (win levels etc) — pause custom bgm, play via sprite
				if (bgmAudio) bgmAudio.pause();
				currentBgm = null;
				sound.players.music.play({ name });
			}
		},
		soundLoop: ({ name }) => sound.players.loop.play({ name }),
		soundOnce: ({ name, forcePlay }) => sound.players.once.play({ name, forcePlay }),
		soundFreeGameBell: () => playWpSfx('freegame_bell'),
		soundBigWinBlast: () => playWpSfx('bigwin_blast'),
		soundReelTensionStart: () => {
			const audio = getWpSfx('reel_tension');
			audio.loop = true;
			audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * 0.8);
			audio.currentTime = 0;
			audio.play().catch(() => {});
		},
		soundReelTensionStop: () => {
			const audio = wpSfxAudio['reel_tension'];
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		},
		soundStop: ({ name }) => {
			if (name === 'bgm_main') {
				stopBgm();
			} else {
				sound.stop({ name });
			}
		},
		soundFade: async ({ name, duration, from, to }) => await sound.fade({ name, duration, from, to }), // prettier-ignore
	});

	onMount(() => {
		// Fetch custom one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(WP_SFX_FILES) as WpSfxName[]).forEach(getWpSfx);

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
			for (const name of Object.keys(wpSfxAudio) as WpSfxName[]) {
				const audio = wpSfxAudio[name];
				if (audio) {
					audio.pause();
					audio.src = '';
					delete wpSfxAudio[name];
				}
			}
		};
	});
</script>
