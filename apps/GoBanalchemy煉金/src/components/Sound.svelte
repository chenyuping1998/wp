<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	// What the mascot can say. One clip per animation — see
	// design/generate_voice.mjs, which synthesizes them.
	export type MascotVoice = 'roar' | 'effort';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| {
				type: 'soundFade';
				name: SoundName;
				from: number;
				to: number;
				duration: number;
		  }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundWinTier'; tier: string }
		| { type: 'soundFullBoardChain' }
		| { type: 'soundFullBoardStamp' }
		| { type: 'soundCaveQuake' }
		| { type: 'soundLadderUp'; level: number }
		| { type: 'soundDynamiteBlast' }
		| { type: 'soundBlastFuse' }
		| { type: 'soundBlastDetonate'; full: boolean }
		| { type: 'soundBlastShatter' }
		| { type: 'soundBlastSmoke' }
		| { type: 'soundBlastReveal' }
		| { type: 'soundMonkeyExpand' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundChestHoot' }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { stateBet, stateSoundDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { getContext } from '../game/context';
	const context = getContext();
	type CnSfxName =
		| SoundEffectName
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
		| 'fuse_sizzle'
		| 'dynamite_blast'
		| 'dynamite_blast_big'
		| 'symbol_shatter'
		| 'smoke_puff'
		| 'press_blast'
		| 'win_big'
		| 'win_super'
		| 'win_mega'
		| 'win_epic'
		| 'win_max'
		| 'win_panel'
		| 'win_cap'
		| 'fullboard_chain'
		| 'fullboard_stamp'
		| 'cave_quake'
		| 'ladder_up'
		| 'symbol_reveal'
		| 'monkey_expand'
		| 'voice_roar'
		| 'voice_effort';
	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'alchemy/gong_feature.wav',
		bigwin_blast: 'alchemy/bigwin_blast.wav',
		reel_tension: 'alchemy/reel_tension.wav',
		reel_stop: 'alchemy/reel_stop.wav',
		btn: 'alchemy/btn.wav',
		spin: 'alchemy/spin.wav',
		scatter_1: 'alchemy/scatter_1.wav',
		scatter_2: 'alchemy/scatter_2.wav',
		scatter_3: 'alchemy/scatter_3.wav',
		scatter_4: 'alchemy/scatter_4.wav',
		scatter_5: 'alchemy/scatter_5.wav',
		pluck_low: 'alchemy/pluck_low.wav',
		win_gliss: 'alchemy/win_gliss.wav',
		win_gliss_big: 'alchemy/win_gliss_big.wav',
		fs_intro: 'alchemy/fs_intro.wav',
		coin_shimmer: 'alchemy/coin_shimmer.wav',
		wild_expand: 'alchemy/wild_expand.wav',
		mult_update: 'alchemy/mult_update.wav',
		grenade_blast: 'alchemy/grenade_blast.wav',
		// The reel-blast set, synthesized by design/generate_audio_alchemy.py and
		// timed to ReelBlast.svelte's four beats. Cartoon, not ordnance: the rest
		// of this set is marimba and comic horn, and a realistic boom in the
		// middle of it reads as a bug rather than an effect.
		fuse_sizzle: 'alchemy/fuse_sizzle.wav',
		dynamite_blast: 'alchemy/dynamite_blast.wav',
		dynamite_blast_big: 'alchemy/dynamite_blast_big.wav',
		symbol_shatter: 'alchemy/symbol_shatter.wav',
		smoke_puff: 'alchemy/smoke_puff.wav',
		press_blast: 'alchemy/press_blast.wav',
		// One fanfare per big-win tier, each larger than the last, laid over the
		// running bed rather than replacing it. See soundWinTier below.
		win_big: 'alchemy/win_big.wav',
		win_super: 'alchemy/win_super.wav',
		win_mega: 'alchemy/win_mega.wav',
		win_epic: 'alchemy/win_epic.wav',
		win_max: 'alchemy/win_max.wav',
		win_panel: 'alchemy/win_panel.wav',
		win_cap: 'alchemy/win_cap.wav',
		// the full board's own beats, timed to FullBoard.svelte
		fullboard_chain: 'alchemy/fullboard_chain.wav',
		fullboard_stamp: 'alchemy/fullboard_stamp.wav',
		// the roof answering the chest beat on a trigger, timed to game/caveQuake
		cave_quake: 'alchemy/cave_quake.wav',
		// a rung of the blast ladder reached: stone settling, then a low rising note
		ladder_up: 'alchemy/ladder_up.wav',
		symbol_reveal: 'alchemy/symbol_reveal.wav',
		// player-supplied monkey hoot, mp3 rather than the synthesized wav set
		monkey_expand: 'alchemy/monkey_expand.wav',
		voice_roar: 'alchemy/voice_roar.wav',
		voice_effort: 'alchemy/voice_effort.wav',
		jng_intro_fs: 'alchemy/jng_intro_fs.wav',
		sfx_anticipation: 'alchemy/sfx_anticipation.wav',
		sfx_anticipation_start: 'alchemy/sfx_anticipation_start.wav',
		sfx_bigwin_coinloop: 'alchemy/sfx_bigwin_coinloop.wav',
		sfx_btn_general: 'alchemy/sfx_btn_general.wav',
		sfx_btn_spin: 'alchemy/sfx_btn_spin.wav',
		sfx_fs_respins: 'alchemy/sfx_fs_respins.wav',
		sfx_multiplier_combine_a: 'alchemy/sfx_multiplier_combine_a.wav',
		sfx_multiplier_combine_b: 'alchemy/sfx_multiplier_combine_b.wav',
		sfx_multiplier_explosion_a: 'alchemy/sfx_multiplier_explosion_a.wav',
		sfx_multiplier_explosion_b: 'alchemy/sfx_multiplier_explosion_b.wav',
		sfx_multiplier_explosion_c: 'alchemy/sfx_multiplier_explosion_c.wav',
		sfx_multiplier_landing: 'alchemy/sfx_multiplier_landing.wav',
		sfx_multiplier_reset: 'alchemy/sfx_multiplier_reset.wav',
		sfx_multiplier_up: 'alchemy/sfx_multiplier_up.wav',
		sfx_multiplier_update: 'alchemy/sfx_multiplier_update.wav',
		sfx_multiplier_win: 'alchemy/sfx_multiplier_win.wav',
		sfx_reel_stop_1: 'alchemy/sfx_reel_stop_1.wav',
		sfx_reel_stop_2: 'alchemy/sfx_reel_stop_2.wav',
		sfx_reel_stop_3: 'alchemy/sfx_reel_stop_3.wav',
		sfx_reel_stop_4: 'alchemy/sfx_reel_stop_4.wav',
		sfx_reel_stop_5: 'alchemy/sfx_reel_stop_5.wav',
		sfx_royals_landing: 'alchemy/sfx_royals_landing.wav',
		sfx_scatter_reveal: 'alchemy/sfx_scatter_reveal.wav',
		sfx_scatter_stop_1: 'alchemy/sfx_scatter_stop_1.wav',
		sfx_scatter_stop_2: 'alchemy/sfx_scatter_stop_2.wav',
		sfx_scatter_stop_3: 'alchemy/sfx_scatter_stop_3.wav',
		sfx_scatter_stop_4: 'alchemy/sfx_scatter_stop_4.wav',
		sfx_scatter_stop_5: 'alchemy/sfx_scatter_stop_5.wav',
		sfx_scatter_win: 'alchemy/sfx_scatter_win.wav',
		sfx_scatter_win_v2: 'alchemy/sfx_scatter_win_v2.wav',
		sfx_superfreespin: 'alchemy/sfx_superfreespin.wav',
		sfx_symbols_landing: 'alchemy/sfx_symbols_landing.wav',
		sfx_wild_explode: 'alchemy/sfx_wild_explode.wav',
		sfx_winlevel_end: 'alchemy/sfx_winlevel_end.wav',
		sfx_winlevel_nice: 'alchemy/sfx_winlevel_nice.wav',
		sfx_winlevel_small: 'alchemy/sfx_winlevel_small.wav',
		sfx_winlevel_standard: 'alchemy/sfx_winlevel_standard.wav',
		sfx_winlevel_substantial: 'alchemy/sfx_winlevel_substantial.wav',
		sfx_youwon_panel: 'alchemy/sfx_youwon_panel.wav',
		tumble_win_1: 'alchemy/tumble_win_1.wav',
		tumble_win_2: 'alchemy/tumble_win_2.wav',
		tumble_win_3: 'alchemy/tumble_win_3.wav',
		tumble_win_4: 'alchemy/tumble_win_4.wav',
	};
	const BGM_FILES = {
		base: 'alchemy/bgm_main.wav',
		freespin: 'alchemy/bgm_freespin.wav',
	};
	type Voice = {
		source: AudioBufferSourceNode;
		gain: GainNode;
		category: 'music' | 'effect';
		level: number;
		name: string;
	};
	let ctx: AudioContext | undefined;
	let master: DynamicsCompressorNode | undefined;
	let disposed = false;
	let musicGeneration = 0;
	let currentMusic: string | undefined;
	let musicVoice: Voice | undefined;
	let duckUntil = 0;
	const voices = new Set<Voice>();
	const loops = new Map<string, Voice>();
	const requests = new Map<string, number>();
	const buffers = new Map<string, Promise<AudioBuffer>>();
	type Fade = { from: number; to: number; start: number; end: number };
	const fades = new Map<string, Fade>();
	const fadeValue = (v: Voice) => {
		const f = fades.get(v.category === 'music' ? 'music' : v.name);
		if (!f) return 1;
		const t = Math.max(
			0,
			Math.min(1, (performance.now() - f.start) / Math.max(1, f.end - f.start)),
		);
		return f.from + (f.to - f.from) * t;
	};
	const preference = (v: Voice) =>
		v.category === 'music'
			? stateSoundDerived.volumeMusic() * (performance.now() < duckUntil ? 0.42 : 0.7)
			: stateSoundDerived.volumeSoundEffect();
	const audioContext = () => {
		if (!ctx) {
			ctx = new AudioContext();
			master = ctx.createDynamicsCompressor();
			master.threshold.value = -8;
			master.knee.value = 4;
			master.ratio.value = 12;
			master.attack.value = 0.003;
			master.release.value = 0.16;
			const output = ctx.createGain();
			output.gain.value = 0.85;
			master.connect(output);
			output.connect(ctx.destination);
		}
		if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
		return ctx;
	};
	// Up to 1.5, not 1: the win cues sit 6-9 dB under the reel stop in their
	// files (RMS -19..-22 vs -13), and at 1 they could not be lifted over it
	// (user, 2026-10-16: 得分音效要大一點). Their peaks are -3.2 dBFS, so 1.5
	// (+3.5 dB) still stays under full scale before the 0.85 master.
	const volume = (v: Voice) => Math.min(1.5, Math.max(0, v.level * preference(v) * fadeValue(v)));
	const load = (file: string) => {
		let pending = buffers.get(file);
		if (!pending) {
			const ac = audioContext();
			pending = fetch(base + '/assets/audio/' + file).then(async (response) => {
				if (!response.ok) throw new Error('Audio asset ' + file + ': ' + response.status);
				return ac.decodeAudioData(await response.arrayBuffer());
			});
			buffers.set(file, pending);
			pending.catch(() => buffers.delete(file));
		}
		return pending;
	};
	const stopVoice = (v: Voice, seconds = 0.045) => {
		if (!ctx) return;
		voices.delete(v);
		v.gain.gain.cancelScheduledValues(ctx.currentTime);
		v.gain.gain.setTargetAtTime(0, ctx.currentTime, seconds / 3);
		try {
			v.source.stop(ctx.currentTime + seconds);
		} catch {
			/* already ended */
		}
	};
	const startVoice = (
		name: string,
		buffer: AudioBuffer,
		category: Voice['category'],
		level: number,
		loop = false,
		rate = 1,
	) => {
		const ac = audioContext(),
			source = ac.createBufferSource(),
			gain = ac.createGain();
		source.buffer = buffer;
		source.loop = loop;
		source.playbackRate.value = rate;
		source.connect(gain);
		gain.connect(master ?? ac.destination);
		const voice: Voice = { source, gain, category, level, name };
		gain.gain.setValueAtTime(0, ac.currentTime);
		gain.gain.linearRampToValueAtTime(volume(voice), ac.currentTime + (loop ? 0.12 : 0.006));
		source.onended = () => {
			voices.delete(voice);
			source.disconnect();
			gain.disconnect();
		};
		voices.add(voice);
		source.start();
		return voice;
	};
	const refreshMix = () => {
		if (!ctx || disposed) return;
		for (const v of voices) {
			const f = fades.get(v.category === 'music' ? 'music' : v.name);
			if (f && f.end > performance.now()) {
				v.gain.gain.cancelScheduledValues(ctx.currentTime);
				v.gain.gain.setValueAtTime(volume(v), ctx.currentTime);
				v.gain.gain.linearRampToValueAtTime(
					Math.min(1, v.level * preference(v) * f.to),
					ctx.currentTime + Math.max(0, (f.end - performance.now()) / 1000),
				);
			} else v.gain.gain.setTargetAtTime(volume(v), ctx.currentTime, 0.04);
		}
	};
	const duckMusic = (ms = 900) => {
		duckUntil = Math.max(duckUntil, performance.now() + ms);
		refreshMix();
	};
	async function playCnSfx(name: CnSfxName, level = 1, rate = 1) {
		if (disposed) return;
		const requested = performance.now();
		audioContext();
		try {
			const buffer = await load(CN_SFX_FILES[name]);
			if (disposed || performance.now() - requested > 350) return;
			// Polyphony retains glass tails when several reels stop together.
			const active = [...voices].filter((v) => v.category === 'effect' && !v.source.loop);
			if (active.length >= 18) stopVoice(active[0]);
			startVoice(name, buffer, 'effect', level, false, rate);
		} catch (error) {
			console.warn('Alchemy cue failed:', name, error);
		}
	}
	async function playCnLoop(name: CnSfxName, level = 1) {
		if (disposed || loops.has(name)) return;
		const ticket = (requests.get(name) ?? 0) + 1;
		requests.set(name, ticket);
		try {
			const buffer = await load(CN_SFX_FILES[name]);
			if (disposed || requests.get(name) !== ticket || loops.has(name)) return;
			loops.set(name, startVoice(name, buffer, 'effect', level, true));
		} catch (error) {
			console.warn('Alchemy loop failed:', name, error);
		}
	}
	let lastReelStop = -1e9;
	function stopCnSfx(name: string) {
		requests.set(name, (requests.get(name) ?? 0) + 1);
		for (const v of voices) if (v.name === name) stopVoice(v);
		loops.delete(name);
		fades.delete(name);
	}
	async function playBgm(type: 'base' | 'freespin') {
		if (disposed || currentMusic === type) return;
		const ticket = ++musicGeneration;
		currentMusic = type;
		try {
			const buffer = await load(BGM_FILES[type]);
			if (disposed || ticket !== musicGeneration) return;
			if (musicVoice) stopVoice(musicVoice, 0.24);
			musicVoice = startVoice('bgm_' + type, buffer, 'music', 1, true);
		} catch (error) {
			if (ticket === musicGeneration) currentMusic = undefined;
			console.warn('Alchemy music failed:', error);
		}
	}
	function stopBgm() {
		musicGeneration++;
		currentMusic = undefined;
		if (musicVoice) stopVoice(musicVoice, 0.12);
		musicVoice = undefined;
	}
	const effects: Partial<
		Record<SoundEffectName, { name: CnSfxName; level?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'btn', level: 0.65 },
		sfx_btn_spin: { name: 'spin', level: 0.75 },
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.92 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.18 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.28 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		sfx_bigwin_coinloop: { name: 'coin_shimmer', level: 0.9 },
		// the score cues, louder (2026-10-16)
		sfx_winlevel_small: { name: 'sfx_winlevel_small', level: 1.35 },
		sfx_winlevel_end: { name: 'sfx_winlevel_end', level: 1.2 },
		sfx_scatter_win_v2: { name: 'sfx_scatter_win_v2', level: 1.2 },
		sfx_anticipation: { name: 'reel_tension', level: 0.55 },
	};
	$effect(() => {
		stateSoundDerived.volumeMusic();
		stateSoundDerived.volumeSoundEffect();
		refreshMix();
	});
	context.eventEmitter.subscribeOnMount({
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') void playBgm('base');
			else if (name === 'bgm_freespin') void playBgm('freespin');
			else {
				duckMusic(1500);
				void playCnSfx(
					name === 'bgm_winlevel_max'
						? 'win_max'
						: name === 'bgm_winlevel_epic'
							? 'win_epic'
							: name === 'bgm_winlevel_mega'
								? 'win_mega'
								: name === 'bgm_winlevel_superwin'
									? 'win_super'
									: 'win_big',
					0.8,
				);
			}
		},
		soundOnce: ({ name }) => {
			const m = effects[name];
			let level = m?.level ?? 0.8;
			if (name.startsWith('sfx_reel_stop_')) {
				// TURBO stops all five reels within a few ms: five full-level stops
				// stacked ~7 dB over one (user, 2026-10-16: turbo 停輪音太大聲). Quieter
				// in turbo, and any stop right on the heels of another at half.
				const now = performance.now();
				level = stateBet.isTurbo ? 0.24 : 0.5;
				if (now - lastReelStop < 60) level *= 0.5;
				lastReelStop = now;
			}
			void playCnSfx(m?.name ?? name, level, m?.rate ?? 1);
		},
		soundLoop: ({ name }) => {
			const m = effects[name];
			if (name === 'sfx_bigwin_coinloop') void playCnSfx('coin_shimmer', 0.9);
			else void playCnLoop(m?.name ?? name, m?.level ?? 0.7);
		},
		soundStop: ({ name }) => {
			if (name.startsWith('bgm_')) stopBgm();
			else stopCnSfx(effects[name as SoundEffectName]?.name ?? name);
		},
		soundFade: async ({ name, from, to, duration }) => {
			const resolved = name.startsWith('bgm_')
				? 'music'
				: (effects[name as SoundEffectName]?.name ?? name);
			const now = performance.now();
			fades.set(resolved, { from, to, start: now, end: now + duration });
			refreshMix();
			await waitForTimeout(duration);
			if (!disposed) refreshMix();
		},
		soundFreeGameBell: () => {
			duckMusic(1000);
			void playCnSfx('gong_feature');
		},
		soundBigWinBlast: () => {
			duckMusic(1400);
			void playCnSfx('bigwin_blast', 1.05);
		},
		soundWinTier: ({ tier }) => {
			duckMusic(1700);
			if (tier === 'big') void playCnSfx('win_big', 1.1);
			else if (tier === 'superwin') void playCnSfx('win_super', 1.15);
			else if (tier === 'mega') void playCnSfx('win_mega', 1.2);
			else if (tier === 'epic') void playCnSfx('win_epic', 1.25);
			else if (tier === 'max') void playCnSfx('win_max', 1.3);
		},
		soundFullBoardChain: () => {
			duckMusic(1300);
			void playCnSfx('fullboard_chain', 0.8);
		},
		soundFullBoardStamp: () => {
			duckMusic(1500);
			void playCnSfx('fullboard_stamp', 0.85);
		},
		soundCaveQuake: () => void playCnSfx('cave_quake', 0.4),
		soundLadderUp: ({ level }) => void playCnSfx('ladder_up', Math.min(0.85, 0.35 + level * 0.1)),
		soundDynamiteBlast: () => void playCnSfx('grenade_blast', 0.7),
		soundBlastFuse: () => void playCnSfx('fuse_sizzle', 0.65),
		soundBlastDetonate: ({ full }) => {
			duckMusic(950);
			void playCnSfx(full ? 'dynamite_blast_big' : 'dynamite_blast', 0.85);
		},
		soundBlastShatter: () => void playCnSfx('symbol_shatter', 0.5),
		soundBlastSmoke: () => void playCnSfx('smoke_puff', 0.55),
		soundBlastReveal: () => void playCnSfx('symbol_reveal', 0.8),
		soundMonkeyExpand: () => void playCnSfx('monkey_expand', 0.5),
		soundMascotVoice: ({ name }) =>
			void playCnSfx(name === 'roar' ? 'voice_roar' : 'voice_effort', 0.45),
		soundChestHoot: () => void playCnSfx('monkey_expand', 0.5),
		soundReelTensionStart: () => void playCnLoop('reel_tension', 0.55),
		soundReelTensionStop: () => stopCnSfx('reel_tension'),
		soundScatterCounterIncrease: () => {
			context.stateGame.scatterCounter++;
		},
		soundScatterCounterClear: () => {
			context.stateGame.scatterCounter = 0;
		},
		reelBlastClear: () => {
			for (const name of [
				'fuse_sizzle',
				'dynamite_blast',
				'dynamite_blast_big',
				'smoke_puff',
				'symbol_reveal',
			])
				stopCnSfx(name);
		},
	});
	onMount(() => {
		disposed = false;
		// Bounded predecode avoids late first-play cues and simultaneous fetch spikes.
		const files = [...new Set(Object.values(CN_SFX_FILES))];
		let next = 0;
		const worker = async () => {
			while (!disposed && next < files.length) {
				const file = files[next++];
				try {
					await load(file);
				} catch (error) {
					console.warn(error);
				}
			}
		};
		for (let i = 0; i < 4; i++) void worker();
		void playBgm(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY ? 'freespin' : 'base');
		const mixer = setInterval(refreshMix, 100);
		return () => {
			disposed = true;
			musicGeneration++;
			clearInterval(mixer);
			for (const v of voices)
				try {
					v.source.stop();
				} catch {
					/* already stopped */
				}
			voices.clear();
			loops.clear();
			buffers.clear();
			requests.clear();
			fades.clear();
			void ctx?.close();
			ctx = undefined;
		};
	});
</script>
