<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Application,
		Assets,
		Container,
		Graphics,
		Mesh,
		MeshGeometry,
		Sprite,
		Text,
		type Texture,
	} from 'pixi.js';
	import {
		Spine,
		Physics,
	} from '../../../node_modules/pixi-svelte/node_modules/@esotericsoftware/spine-pixi-v8/dist/index.js';
	import { MESH_WINS, MESH_LANDS, IDLES } from '../../game/meshWin';
	import { buildRig, skin } from '../../game/meshWin/meshRig';
	import { reactionTiming, vaporParticles, vaporPose, coverOpacity } from '../../game/potionVapor';
	import { createReagentBoilLayer } from '../../game/reagentBoilLayer';
	import AlchemyFgReview from '../../components/AlchemyFgReview.svelte';
	let previewApp = $state<Application>();
	let plaqueTexture = $state<Texture>();
	let host = $state<HTMLDivElement>();
	let mode = $state<'wins' | 'idle' | 'reaction' | 'character' | 'boil' | 'plaques'>('wins');
	let character = $state('cheer');
	let characterFrame = $state(0);
	let characterDuration = $state(2);
	let seekCharacter: ((seconds: number) => void) | undefined;
	let joints = $state(false);
	let width = $state(5);
	let paused = $state(false);
	let ready = $state(false);
	let restart: (() => void) | undefined;
	let audio: HTMLAudioElement | undefined;
	let cue = $state('bgm_main');
	const names = ['H1', 'H2', 'H3', 'H4', 'W', 'S', 'B', 'L1', 'L2', 'L3', 'L4', 'L5', 'P', 'X'];
	const cues = [
		'bgm_main',
		'bgm_freespin',
		'btn',
		'spin',
		'reel_stop_3',
		'scatter_3',
		'fuse_sizzle',
		'dynamite_blast',
		'smoke_puff',
		'symbol_reveal',
		'fullboard_chain',
		'fullboard_stamp',
		'win_big',
		'win_super',
		'win_mega',
		'win_epic',
		'win_max',
	];
	const listen = () => {
		audio?.pause();
		audio = new Audio(`/assets/audio/alchemy/${cue}.${cue.startsWith('bgm_') ? 'mp3' : 'wav'}`);
		void audio.play();
	};
	onMount(() => {
		if (!import.meta.env.DEV) return;
		let disposed = false;
		const app = new Application();
		void (async () => {
			await app.init({
				width: 1064,
				height: 652,
				background: 0x101b20,
				antialias: true,
				resolution: Math.min(2, devicePixelRatio),
				autoDensity: true,
			});
			if (disposed) {
				app.destroy(true);
				return;
			}
			host?.appendChild(app.canvas);
			const font = new FontFace('Titan One', 'url(/fonts/TitanOne.ttf)');
			await font.load();
			document.fonts.add(font);
			plaqueTexture = await Assets.load('/assets/sprites/goBanalchemyUi/fg_plaque.png');
			const textures = Object.fromEntries(
				await Promise.all(
					names.map(async (n) => [
						n,
						await Assets.load(`/assets/sprites/goBanalchemySymbols/${n.toLowerCase()}.png`),
					]),
				),
			);
			const smoke = await Assets.load('/assets/sprites/goBanalchemyFx/potion_vapor.png');
			if (disposed) {
				app.destroy(true, { children: true });
				return;
			}
			const gallery = new Container();
			app.stage.addChild(gallery);
			const cells = names.map((n, i) => {
				const cell = new Container();
				cell.position.set(8 + (i % 7) * 151, 50 + Math.floor(i / 7) * 277);
				const meshSpec = MESH_WINS[n] ?? MESH_LANDS[n];
				const rig = meshSpec && buildRig(meshSpec.rig);
				const geometry =
					rig &&
					new MeshGeometry({
						positions: new Float32Array(rig.rest),
						uvs: rig.uvs,
						indices: rig.indices,
					});
				const picture = geometry
					? new Mesh({ geometry, texture: textures[n] })
					: new Sprite(textures[n]);
				picture.scale.set(geometry ? 143 / 256 : 143 / textures[n].width);
				cell.addChild(picture);
				const boil = n === 'B' ? createReagentBoilLayer(textures.B, 'tile') : undefined;
				if (boil) {
					boil.view.position.set(71.5, 71.5);
					boil.view.scale.set(143 / 256);
					cell.addChild(boil.view);
				}
				const label = new Text({
					text: n,
					style: { fontFamily: 'Arial', fontSize: 16, fill: 0xc7b88f },
				});
				label.position.set(8, 155);
				cell.addChild(label);
				gallery.addChild(cell);
				return { n, meshSpec, rig, geometry, picture, boil };
			});
			const boiling = createReagentBoilLayer(textures.B, 'tile');
			boiling.view.position.set(532, 315);
			boiling.view.scale.set(1.9);
			app.stage.addChild(boiling.view);
			const board = new Container();
			board.position.set(222, 22);
			app.stage.addChild(board);
			const boardCells = Array.from({ length: 20 }, (_, i) => {
				const s = new Sprite(textures[names[(i * 3) % names.length]]);
				s.width = 120;
				s.height = 120;
				s.position.set(Math.floor(i / 4) * 124, (i % 4) * 124);
				board.addChild(s);
				return s;
			});
			const boardBoils = boardCells.flatMap((s, i) => {
				if (names[(i * 3) % names.length] !== 'B') return [];
				const boil = createReagentBoilLayer(textures.B, 'tile');
				boil.view.position.set(s.x + 60, s.y + 60);
				boil.view.scale.set(120 / 256);
				board.addChild(boil.view);
				return [{ boil, reel: Math.floor(i / 4) }];
			});
			const cover = new Graphics();
			board.addChild(cover);
			const particles = Array.from({ length: 5 }, (_, r) => vaporParticles(r)).flat();
			const clouds = particles.map(() => {
				const s = new Sprite(smoke);
				s.anchor.set(0.5);
				board.addChild(s);
				return s;
			});
			await Assets.load([
				'/assets/spines/goBananasMonkey/monkey.json',
				'/assets/spines/goBananasMonkey/monkey.atlas',
			]);
			if (disposed) {
				app.destroy(true, { children: true });
				return;
			}
			const mascot = Spine.from({
				skeleton: '/assets/spines/goBananasMonkey/monkey.json',
				atlas: '/assets/spines/goBananasMonkey/monkey.atlas',
				autoUpdate: false,
			});
			mascot.position.set(532, 623);
			mascot.scale.set(0.64);
			app.stage.addChild(mascot);
			const bones = new Graphics();
			app.stage.addChild(bones);
			mascot.state.setAnimation(0, character, true);
			mascot.state.setAnimation(1, 'flutter', true);
			mascot.state.setAnimation(2, 'blink', true);
			seekCharacter = (seconds) => {
				paused = true;
				lastCharacter = character;
				characterDuration = mascot.skeleton.data.findAnimation(character)?.duration ?? 2;
				characterFrame = seconds;
				mascot.state.clearTracks();
				mascot.skeleton.setToSetupPose();
				mascot.skeleton.updateWorldTransform(Physics.reset);
				mascot.state.setAnimation(0, character, true);
				mascot.state.setAnimation(1, 'flutter', true);
				mascot.state.setAnimation(2, 'blink', true);
				mascot.update(0);
				for (let elapsed = 0; elapsed < seconds; ) {
					const dt = Math.min(1 / 120, seconds - elapsed);
					mascot.update(dt);
					elapsed += dt;
				}
			};
			characterDuration = mascot.skeleton.data.findAnimation(character)?.duration ?? 2;
			let lastCharacter = character;
			let time = 0,
				lastMode = mode,
				lastWidth = width,
				swapped = false;
			restart = () => {
				time = 0;
				swapped = false;
				if (mode === 'character') {
					mascot.skeleton.setToSetupPose();
					mascot.state.setAnimation(0, character, true);
					mascot.state.setAnimation(1, 'flutter', true);
					mascot.state.setAnimation(2, 'blink', true);
					mascot.update(0);
				}
			};
			previewApp = app;
			ready = true;
			app.ticker.add((ticker) => {
				if (lastMode !== mode || lastWidth !== width) {
					lastMode = mode;
					lastWidth = width;
					restart?.();
				}
				if (!paused) time += ticker.deltaMS;
				boiling.view.visible = mode === 'boil';
				boiling.step(time / 1000, 0.85);
				gallery.visible = mode === 'wins' || mode === 'idle';
				board.visible = mode === 'reaction';
				mascot.visible = mode === 'character';
				bones.visible = mode === 'character' && joints;
				if (lastCharacter !== character) {
					lastCharacter = character;
					mascot.state.setAnimation(0, character, true);
					characterDuration = mascot.skeleton.data.findAnimation(character)?.duration ?? 2;
					characterFrame = 0;
				}
				if (mode === 'character') {
					if (!paused) {
						const dt = Math.min(0.05, ticker.deltaMS / 1000);
						mascot.update(dt);
						characterFrame = (characterFrame + dt) % characterDuration;
					}
					bones.clear();
					for (const name of [
						'torso',
						'head',
						'armL',
						'armL_fore',
						'armL_hand',
						'armR',
						'armR_fore',
						'armR_hand',
						'legL',
						'legL_calf',
						'legL_foot',
						'legR',
						'legR_calf',
						'legR_foot',
					]) {
						const b = mascot.skeleton.findBone(name);
						if (!b) continue;
						const x = 532 + b.worldX * 0.64,
							y = 623 + b.worldY * 0.64;
						if (b.parent)
							bones
								.moveTo(532 + b.parent.worldX * 0.64, 623 + b.parent.worldY * 0.64)
								.lineTo(x, y)
								.stroke({ width: 2, color: 0xe3bc76, alpha: 0.8 });
						bones.circle(x, y, 3).fill(0xc2ebc4);
					}
					return;
				}
				if (mode === 'reaction') {
					const b = reactionTiming(width),
						age = time % (b.end + b.settle + 700);
					if (age < 30) swapped = false;
					if (age >= b.swap && !swapped) {
						for (let i = 0; i < 20; i++)
							if (Math.floor(i / 4) < width)
								boardCells[i].texture = textures[['H1', 'H2', 'H3', 'H4', 'W'][Math.floor(i / 4)]];
						swapped = true;
					}
					if (age < b.charge)
						for (let i = 0; i < 20; i++)
							boardCells[i].texture = textures[names[(i * 3) % names.length]];
					for (const { boil, reel } of boardBoils) {
						boil.view.visible = reel >= width || age < b.swap;
						boil.view.alpha =
							reel >= width
								? 1
								: Math.max(0, 1 - Math.max(0, age - b.charge) / (b.swap - b.charge));
						boil.step(
							time / 1000,
							reel >= width ? 0.35 : Math.min(1, 0.4 + (0.6 * age) / b.charge),
						);
					}
					cover.clear();
					for (let r = 0; r < width; r++)
						cover
							.rect(r * 124 - 2, -2, 124, 496)
							.fill({ color: 0x315e54, alpha: coverOpacity(age, b) });
					particles.forEach((p, i) => {
						const pose = vaporPose(p, age, b),
							s = clouds[i];
						s.visible = p.reel < width;
						s.position.set(p.reel * 124 + 60 + pose.x * 124, pose.y * 124);
						s.width = pose.size * 124;
						s.height = pose.size * 124 * pose.aspect;
						s.rotation = pose.rotation;
						s.alpha = pose.alpha;
					});
				} else
					for (const c of cells) {
						c.boil?.step(time / 1000, 0.5);
						if (!c.rig || !c.geometry || !c.meshSpec) continue;
						const spec = mode === 'idle' ? (IDLES[c.n] ?? c.meshSpec) : c.meshSpec;
						const positions = c.geometry.getBuffer('aPosition').data as Float32Array;
						skin(c.rig, spec.pose(c.rig, time % (spec.durationMs + 600)), spec.feetY, positions);
						c.geometry.getBuffer('aPosition').update();
					}
			});
		})();
		return () => {
			disposed = true;
			audio?.pause();
			if (app.renderer) app.destroy(true, { children: true });
		};
	});
</script>

{#if import.meta.env.DEV}
	<main>
		<p class="eyebrow">GO BANALCHEMY · LOCAL ART REVIEW</p>
		<h1>煉金獎圖・動畫・聲音檢視</h1>
		<p>固定底板，檢視圖案內部的網格演出。切換藥霧轉場，確認單輪至全盤的反應節奏。</p>
		<nav>
			<button class:active={mode === 'wins'} onclick={() => (mode = 'wins')}>中獎演出</button>
			<button class:active={mode === 'idle'} onclick={() => (mode = 'idle')}>待機動態</button>
			<button class:active={mode === 'reaction'} onclick={() => (mode = 'reaction')}
				>藥霧換圖</button
			>
			<button class:active={mode === 'boil'} onclick={() => (mode = 'boil')}>藥液沸騰</button>
			<button class:active={mode === 'plaques'} onclick={() => (mode = 'plaques')}>FG 牌面</button>
			<button class:active={mode === 'character'} onclick={() => (mode = 'character')}
				>人物動作</button
			>
			<button onclick={() => (paused = !paused)}>{paused ? '繼續' : '暫停'}</button>
			<button onclick={() => restart?.()}>重播</button>
			<label
				>反應輪數 <select bind:value={width}
					>{#each [1, 2, 3, 4, 5] as n}<option value={n}>{n}</option>{/each}</select
				></label
			>
		</nav>
		{#if mode === 'character'}<nav>
				<label
					>動作 <select bind:value={character}
						>{#each ['idle', 'cheer', 'chestbeat', 'throwit', 'nod', 'flinch', 'alert', 'glance'] as c}<option
								value={c}>{c}</option
							>{/each}</select
					></label
				><label><input type="checkbox" bind:checked={joints} /> 顯示關節</label>
				<label
					>時間 <input
						aria-label="人物動畫時間"
						type="range"
						min="0"
						max={characterDuration}
						step="0.01"
						value={characterFrame}
						oninput={(event) => seekCharacter?.(Number(event.currentTarget.value))}
					/>
					{characterFrame.toFixed(2)}s</label
				>
			</nav>{/if}
		<div class="stage" bind:this={host}></div>
		{#if mode === 'plaques' && previewApp && plaqueTexture}
			<AlchemyFgReview app={previewApp} texture={plaqueTexture} />
		{/if}
		<p>
			{ready ? '載入完成 · 使用遊戲實際獎圖、骨架、權重與藥霧時序' : '載入素材中…'}
		</p>
		<div class="audio">
			<label
				>音效試聽 <select bind:value={cue}
					>{#each cues as c}<option value={c}>{c}</option>{/each}</select
				></label
			><button onclick={listen}>播放</button><button onclick={() => audio?.pause()}>停止</button>
		</div>
	</main>
{:else}<p>Art review is available in local development.</p>{/if}

<style>
	:global(body) {
		margin: 0;
		overflow-y: auto !important;
		background: #0b1418;
		color: #dedfce;
		font-family: Arial, 'Microsoft JhengHei', sans-serif;
	}
	main {
		max-width: 1064px;
		margin: 32px auto;
		padding: 0 24px;
	}
	.eyebrow {
		font-size: 12px;
		letter-spacing: 3px;
		color: #baa577;
	}
	h1 {
		font-size: 30px;
		margin: 12px 0;
	}
	p {
		color: #a2b6ad;
		line-height: 1.6;
	}
	nav,
	.audio {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		margin: 20px 0;
	}
	button,
	select {
		border: 1px solid #466052;
		color: #e6e8d3;
		background: #152c25;
		border-radius: 6px;
		padding: 10px 15px;
		font-size: 14px;
	}
	button {
		cursor: pointer;
	}
	button.active {
		background: #45684a;
		border-color: #b8c588;
	}
	.stage {
		border: 1px solid #334d43;
		border-radius: 10px;
		overflow: hidden;
	}
	.stage :global(canvas) {
		display: block;
		width: 100% !important;
		height: auto !important;
	}
	label {
		font-size: 14px;
		color: #adbfaf;
	}
</style>
