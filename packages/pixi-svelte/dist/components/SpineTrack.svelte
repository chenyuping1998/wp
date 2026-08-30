<script lang="ts" module>
	import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';

	type SpineState = SPINE_PIXI.Spine['state'];
	type TrackEntry = SPINE_PIXI.TrackEntry;

	export type Props = Partial<TrackEntry> & {
		trackIndex: Parameters<SpineState['setAnimation']>[0];
		animationName: Parameters<SpineState['setAnimation']>[1];
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';

	import { propsSyncEffect } from '../utils.svelte';
	import { getContextSpine } from '../context.svelte';

	const props: Props = $props();
	const spine = getContextSpine();

	let track = $state(spine.state.tracks[props.trackIndex]);

	$effect(() => {
		if (props.trackIndex !== track?.trackIndex || props.animationName !== track?.animation?.name) {
			// Clearing the track first means the next animation blends out of the
			// SETUP POSE rather than out of whatever the skeleton was actually
			// doing — so a caller that asked for a mix would get a cut to the rest
			// pose and a fade up from there, which is worse than no mix at all.
			//
			// Skipped only when a mixDuration was supplied, so every game that does
			// not pass one behaves exactly as it did.
			if (track && !props.mixDuration) spine.state.setEmptyAnimation(track.trackIndex, 0);
			try {
				track = spine.state.setAnimation(props.trackIndex, props.animationName, props.loop);
				// setAnimation takes the duration from AnimationStateData, which
				// defaults to 0. propsSyncEffect below would set it too, but a frame
				// later — and the mix is decided on the frame it starts.
				if (props.mixDuration !== undefined && track) track.mixDuration = props.mixDuration;
			} catch (error) {
				console.error(error);
				const animations = spine?.state?.data?.skeletonData?.animations;
				if (animations) {
					console.log(
						'Available animation names:',
						animations.map((animation) => animation.name),
					);
				}
			}
		}
	});

	propsSyncEffect({ props, target: () => track, ignore: ['trackIndex', 'animationName'] });

	onDestroy(() => {
		spine.state.setEmptyAnimation(props.trackIndex, 0);
	});
</script>
