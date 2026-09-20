<script lang="ts">
	import { Spine } from '@esotericsoftware/spine-pixi-v8';
	import { getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	type Props = {
		who: 'guy' | 'girl';
		x: number;
		topY: number;
		height: number;
		groundY: number;
		alpha?: number;
		flip?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const context = getContext();
	const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const key = props.who === 'guy' ? 'hmCastGuySpine' : 'hmCastGirlSpine';
	const spineData = app.stateApp.loadedAssets[key];

	if (!spineData || !('bones' in spineData)) {
		throw new Error(`Cast Spine asset ${key} was not preloaded`);
	}

	/*
	 * Keep the Spine object itself in the caller's MainContainer.
	 *
	 * pixi-svelte's generic SpineProvider sizes and anchors against the nominal
	 * 512x2048 export box. These hand-authored rigs occupy only part of that box,
	 * and Spine's rendered Y coordinates are negative, so the provider's anchor
	 * placed the whole character outside the viewport. Measuring the live setup
	 * pose gives us the actual painted bounds and makes the rig line up with the
	 * same top/height contract used by CastFigure's proven flat reference.
	 */
	const spine = new Spine(spineData);
	spine.update(0);
	const bounds = spine.getBounds();
	const contentHeight = bounds.maxY - bounds.minY;
	const contentCenterX = (bounds.minX + bounds.maxX) * 0.5;
	const rigScale = props.who === 'girl' ? 0.72 : 0.82;
	const xInset = props.who === 'girl' ? -40 : -45;
	const animatedBones = {
		root: spine.skeleton.findBone('root'),
		elbow: spine.skeleton.findBone('elbow'),
		spine: spine.skeleton.findBone('spine'),
		chest: spine.skeleton.findBone('chest'),
	};
	const startedAt = performance.now();
	let reactionStartedAt = performance.now();
	let reactionKind: 'idle' | 'win' | 'trigger' = 'idle';
	let seenReactionSeq = stateGame.castReaction.seq;
	$effect(() => {
		if (stateGame.castReaction.seq !== seenReactionSeq) {
			seenReactionSeq = stateGame.castReaction.seq;
			reactionKind = stateGame.castReaction.kind;
			reactionStartedAt = performance.now();
		}
	});

	// The exported animation timelines came from the old 4.1 format and collapse
	// the 4.2 rig. Drive the handful of articulated bones directly instead. This
	// keeps the body calm while elbows and wrist remain genuinely independent.
	spine.beforeUpdateWorldTransforms = () => {
		const t = (performance.now() - startedAt) / 1000;
		const breathe = Math.sin(t * 1.25);
		const reactionAge = (performance.now() - reactionStartedAt) / 1000;
		const duration = reactionKind === 'trigger' ? 1.45 : 0.85;
		const reaction = reactionKind === 'idle' || reactionAge >= duration
			? 0
			: Math.sin(Math.PI * (reactionAge / duration));
		if (animatedBones.root) {
			const amplitude = props.who === 'girl' ? 0.42 : 0.35;
			const triggerLean = reactionKind === 'trigger' && props.who === 'guy' ? -2.2 * reaction : 0;
			animatedBones.root.rotation = animatedBones.root.data.rotation + breathe * amplitude + triggerLean;
			animatedBones.root.scaleY = animatedBones.root.data.scaleY *
				(1 + breathe * 0.0035 + (reactionKind === 'trigger' ? reaction * 0.008 : 0));
		}
		if (animatedBones.elbow) {
			const elbowAmplitude = props.who === 'girl' ? 1.15 : 0.8;
			const winKick = reactionKind === 'win' ? reaction * (props.who === 'girl' ? 2.2 : 1.6) : 0;
			const triggerKick = reactionKind === 'trigger' && props.who === 'guy' ? reaction * 5.2 : 0;
			animatedBones.elbow.rotation = animatedBones.elbow.data.rotation +
				Math.sin(t * 0.82 + 0.7) * elbowAmplitude + winKick + triggerKick;
		}
		if (animatedBones.spine) animatedBones.spine.rotation = animatedBones.spine.data.rotation + breathe * 0.7;
		if (animatedBones.chest) animatedBones.chest.rotation = animatedBones.chest.data.rotation - breathe * 0.45;
	};

	onMount(() => {
		const stage = app.stateApp.pixiApplication?.stage;
		if (!stage) throw new Error('Pixi stage is unavailable for Cast Spine');
		// Background and vignette are the first two stage children. Insert the cast
		// immediately after them so the reel housing and UI still cover overlaps.
		stage.addChildAt(spine, Math.min(2, stage.children.length));
		return () => {
			spine.removeFromParent();
			spine.destroy();
		};
	});

	$effect(() => {
		const drawScale = (props.height / contentHeight) * std.scale * rigScale;
		const direction = props.flip ? -1 : 1;
		const anchorX = typeof std.anchor === 'number' ? std.anchor : std.anchor.x;
		const anchorY = typeof std.anchor === 'number' ? std.anchor : std.anchor.y;

		spine.scale.set(direction * drawScale, drawScale);
		spine.x = std.x + (props.x + xInset - std.width * anchorX) * std.scale + direction * -contentCenterX * drawScale;
		spine.y =
			std.y + (props.topY - std.height * anchorY) * std.scale - bounds.minY * drawScale;
		spine.alpha = props.alpha ?? 1;
	});
</script>
