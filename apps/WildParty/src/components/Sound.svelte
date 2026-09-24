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
		freegame_bell: 'fg_trigger.mp3',
		bigwin_blast: 'bigwin_blast.wav',
		reel_tension: 'reel_tension.wav',
	};

	// fg_trigger.mp3 runs 0.758s; the previous bell (FeatureTrigger.mp3) rang for
	// 1.608s — chain two rings via Web Audio with sample-accurate scheduling so
	// there is no audible gap (the second ring starts 15ms early to mask the seam).
	const BELL_OVERLAP_S = 0.015;
	let bellCtx: AudioContext | null = null;
	let bellBuffer: AudioBuffer | null = null;

	async function loadBell() {
		try {
			bellCtx = new AudioContext();
			const res = await fetch(`${base}/assets/audio/${WP_SFX_FILES.freegame_bell}`);
			bellBuffer = await bellCtx.decodeAudioData(await res.arrayBuffer());
		} catch {
			bellBuffer = null;
		}
	}

	function playFreeGameBell() {
		if (!bellCtx || !bellBuffer) {
			// decode failed — fall back to two HTML5 plays (small gap possible)
			playWpSfx('freegame_bell');
			setTimeout(() => playWpSfx('freegame_bell'), 758);
			return;
		}
		if (bellCtx.state === 'suspended') bellCtx.resume().catch(() => {});
		const gain = bellCtx.createGain();
		gain.gain.value = Math.min(1, stateSoundDerived.volumeSoundEffect());
		gain.connect(bellCtx.destination);
		const start = bellCtx.currentTime + 0.03;
		for (const offset of [0, bellBuffer.duration - BELL_OVERLAP_S]) {
			const source = bellCtx.createBufferSource();
			source.buffer = bellBuffer;
			source.connect(gain);
			source.start(start + offset);
		}
	}
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

	// ─── Optional themed audio, with a fall-back to the template sprite ───
	//
	// The free-game music and the jingle that opens the round are still the
	// template's, sitting inside sounds.json's 52-clip sprite. Replacing them
	// there would mean re-encoding a 4.8MB sheet in four formats (mp3/ogg/m4a/ac3)
	// to change two clips, so custom versions are loaded as standalone files
	// instead — the same approach background.mp3 already uses for the base music.
	//
	// Each lookup is probed once and cached. A missing or undecodable file simply
	// leaves the sprite playing, so the game is never left silent while the new
	// audio is still being produced.
	// .m4a (AAC), not .mp3: this machine has no MP3 encoder — afconvert decodes
	// MP3 but cannot write it — and the game's own sound sprite already ships an
	// .m4a alongside its .mp3, so AAC support is an existing assumption, not a
	// new one. See design/process_fg_audio.py.
	const OPTIONAL_AUDIO = {
		bgm_freespin: 'bgm_freespin.m4a',
		jng_intro_fs: 'fg_intro.m4a',
		// The free-spin trigger hit. Unlike the two above this needs no new
		// plumbing: soundOnce already prefers a custom file over the sprite for any
		// key listed here, so the sprite's 6s template fanfare is superseded by
		// simply naming a file.
		sfx_superfreespin: 'trigger_hit.m4a',
	} as const;
	type OptionalAudioName = keyof typeof OPTIONAL_AUDIO;

	const optionalAudio: Partial<Record<OptionalAudioName, HTMLAudioElement>> = {};

	// Preloaded on mount, and readiness is judged by readyState rather than by
	// `error`. That distinction is the whole point: for a missing file `error` is
	// not set synchronously, so a first-play check against it passes, the custom
	// branch is taken, play() rejects into a catch — and the round runs SILENT
	// with the sprite fallback never reached. readyState only leaves 0 once real
	// data has arrived, so an absent file can never win the branch.
	function preloadOptionalAudio() {
		for (const name of Object.keys(OPTIONAL_AUDIO) as OptionalAudioName[]) {
			const audio = new Audio(`${base}/assets/audio/${OPTIONAL_AUDIO[name]}`);
			audio.preload = 'auto';
			audio.load();
			optionalAudio[name] = audio;
		}
	}

	/** The custom file, or null when it is absent/unloaded and the sprite should play. */
	function getOptionalAudio(name: OptionalAudioName) {
		const audio = optionalAudio[name];
		if (!audio || audio.error || audio.readyState < 2) return null;
		return audio;
	}

	/** Returns true if the custom file handled it; false means "use the sprite". */
	function playOptionalOnce(name: OptionalAudioName) {
		const audio = getOptionalAudio(name);
		if (!audio) return false;
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect());
		audio.currentTime = 0;
		audio.play().catch(() => {});
		return true;
	}

	// ─── Free-game music: Web Audio, not an <audio loop> ───
	//
	// The loop is cut to a whole 16 bars and crossfaded at the wrap
	// (design/process_fg_audio.py), but AAC encoding adds priming and padding
	// frames — the file measures 30.72s and the element reports 30.79s. HTML5
	// `loop` restarts at the padded boundary, so that ~70ms turns straight back
	// into the gap the crossfade existed to remove.
	//
	// A decoded AudioBuffer looped by a BufferSource wraps sample-accurately, so
	// the seam survives. Same mechanism the double-ring bell above already uses.
	// Both music beds go through here, keyed by track. It was free-spin-only at
	// first; the base track then moved off <audio loop> for exactly the reason
	// described above, and two copies of this logic would have been two places to
	// get the seam wrong.
	type MusicTrack = 'base' | 'freespin';
	const MUSIC_FILES: Record<MusicTrack, string> = {
		base: 'bgm_main.m4a',
		freespin: OPTIONAL_AUDIO.bgm_freespin,
	};

	let musicCtx: AudioContext | null = null;
	const musicBuffers: Partial<Record<MusicTrack, AudioBuffer>> = {};
	const musicNodes: Partial<Record<MusicTrack, { source: AudioBufferSourceNode; gain: GainNode }>> =
		{};

	async function loadMusicLoops() {
		musicCtx = bellCtx ?? new AudioContext();
		for (const track of Object.keys(MUSIC_FILES) as MusicTrack[]) {
			try {
				const res = await fetch(`${base}/assets/audio/${MUSIC_FILES[track]}`);
				if (!res.ok) throw new Error(String(res.status));
				musicBuffers[track] = await musicCtx.decodeAudioData(await res.arrayBuffer());
			} catch {
				// Left undefined on purpose — each caller falls back on its own:
				// 'base' to background.mp3, 'freespin' to the sprite.
				delete musicBuffers[track];
			}
			// Hand over if this track is already playing its fallback.
			//
			// Decoding 730KB of AAC cannot beat the first playBgm('base'), which
			// fires the moment the game finishes loading — so base music always
			// took the fallback branch, and `currentBgm === 'base'` then made
			// playBgm return early forever after. The themed track was in the
			// build, was fetched, decoded fine, and never once played.
			//
			// The free-spin track hid this: it only starts minutes into a session,
			// by which time the decode has long since finished.
			if (currentBgm === track) {
				const wasFallback = track === 'base' ? bgmAudio && !bgmAudio.paused : !musicNodes[track];
				if (wasFallback && playMusicLoop(track)) {
					if (track === 'base' && bgmAudio) {
						bgmAudio.pause();
						bgmAudio.currentTime = 0;
					} else {
						sound.players.music.stop?.({ name: 'bgm_freespin' } as any);
					}
				}
			}
		}
	}

	/** Returns false when that track has no custom loop and the caller should fall back. */
	function playMusicLoop(track: MusicTrack) {
		const buffer = musicBuffers[track];
		if (!musicCtx || !buffer) return false;
		if (musicCtx.state === 'suspended') musicCtx.resume().catch(() => {});
		stopMusicLoop(track);
		const gain = musicCtx.createGain();
		gain.gain.value = stateSoundDerived.volumeMusic();
		gain.connect(musicCtx.destination);
		const source = musicCtx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;
		source.connect(gain);
		source.start();
		musicNodes[track] = { source, gain };
		return true;
	}

	function stopMusicLoop(track: MusicTrack) {
		const node = musicNodes[track];
		if (!node) return;
		try {
			node.source.stop();
		} catch {
			/* already stopped */
		}
		node.source.disconnect();
		node.gain.disconnect();
		delete musicNodes[track];
	}

	function playBgm(type: 'base' | 'freespin') {
		if (type === 'base') {
			if (currentBgm === 'base') return;
			stopMusicLoop('freespin');
			// Stop any playing sprite bgm
			sound.players.music.stop?.({ name: 'bgm_main' } as any);
			currentBgm = 'base';
			if (playMusicLoop('base')) return;
			// No themed loop decoded — the template mp3 is the last resort.
			if (!bgmAudio) {
				bgmAudio = new Audio(`${base}/assets/audio/background.mp3`);
				bgmAudio.loop = true;
			}
			bgmAudio.volume = stateSoundDerived.volumeMusic();
			bgmAudio.currentTime = 0;
			bgmAudio.play().catch(() => {});
		} else {
			stopMusicLoop('base');
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.currentTime = 0;
			}
			currentBgm = 'freespin';
			if (!playMusicLoop('freespin')) {
				sound.players.music.play({ name: 'bgm_freespin' });
			}
		}
	}

	function stopBgm() {
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio.currentTime = 0;
		}
		stopMusicLoop('base');
		stopMusicLoop('freespin');
		currentBgm = null;
	}

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmAudio) bgmAudio.volume = vol;
		for (const node of Object.values(musicNodes)) node.gain.gain.value = vol;
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
				// Other music (win levels etc) — pause custom bgm, play via sprite.
				// The buffer loops have to stop too, or the bed keeps running
				// underneath the win-level track instead of giving way to it.
				stopMusicLoop('base');
				stopMusicLoop('freespin');
				if (bgmAudio) bgmAudio.pause();
				currentBgm = null;
				sound.players.music.play({ name });
			}
		},
		soundLoop: ({ name }) => sound.players.loop.play({ name }),
		soundOnce: ({ name, forcePlay }) => {
			if (name in OPTIONAL_AUDIO && playOptionalOnce(name as OptionalAudioName)) return;
			sound.players.once.play({ name, forcePlay });
		},
		soundFreeGameBell: () => playFreeGameBell(),
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
		// Sound mounts after the first user interaction, so the AudioContext for
		// the gapless double-ring bell is allowed to start here.
		loadBell();
		// themed free-game audio, if it has been produced yet
		preloadOptionalAudio();
		loadMusicLoops();

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
			bellCtx?.close().catch(() => {});
			bellCtx = null;
			bellBuffer = null;
		};
	});
</script>
