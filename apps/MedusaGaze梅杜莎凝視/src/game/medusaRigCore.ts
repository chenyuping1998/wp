// The character owns its Spine 4.3 core. Shared Spine 4.2 loaders stay intact.
import { AnimationState, AnimationStateData, AtlasAttachmentLoader, FakeTexture, Physics, Skeleton, SkeletonJson, TextureAtlas, type SkeletonData } from '@esotericsoftware/spine-core';

export function parseMedusaRig(json: unknown, atlasText: string): { data: SkeletonData; atlas: TextureAtlas } {
	const atlas = new TextureAtlas(atlasText);
	for (const page of atlas.pages) page.setTexture(new FakeTexture({ width: page.width, height: page.height }));
	const reader = new SkeletonJson(new AtlasAttachmentLoader(atlas));
	return { data: reader.readSkeletonData(json), atlas };
}

/** Shared by production, the art review and deterministic replay checks. */
export function createMedusaPlayer(data: SkeletonData, onSnakeFidget?: (index: number) => void) {
	const skeleton = new Skeleton(data), stateData = new AnimationStateData(data);
	stateData.defaultMix = 0.10;
	const state = new AnimationState(stateData);
	let freegame = false, reduced = false, disposed = false, restTime = 0, nextSnake = 18, snakeIndex = 0, acting = false, holding = false, fidgetDone = false;
	const rest = () => freegame ? 'fg_idle' : 'idle';
	state.setAnimation(0, rest(), true);
	state.addListener({ complete: entry => { if (entry.trackIndex === 0 && !entry.loop && !holding) acting = false; } });
	function update(dt: number) {
		if (disposed) return;
		const seconds = Math.max(0, dt);
		if (!reduced) {
			state.update(seconds); skeleton.update(seconds); state.apply(skeleton);
			if (!acting) {
				restTime += seconds;
				if (restTime >= nextSnake) {
					const index = snakeIndex++ % 9 + 1, clip = `snake_fidget_${index}`;
					if (data.findAnimation(clip)) { state.setAnimation(1,clip,false); state.addEmptyAnimation(1,0.08,0); }
					onSnakeFidget?.(index);
					nextSnake += 18;
				}
				if (!fidgetDone && restTime >= 20 && data.findAnimation('idle_fidget')) {
					fidgetDone = true; acting = true; state.setAnimation(0,'idle_fidget',false); state.addAnimation(0,rest(),true,0);
				}
			}
		}
		skeleton.updateWorldTransform(Physics.none);
	}
	update(0);
	return { skeleton, state, update,
		play(name: string, hold = false, rate = 1) {
			if (disposed || reduced || !data.findAnimation(name)) return false;
			restTime = 0; nextSnake = 18; fidgetDone = false; acting = true; holding = hold; state.clearTrack(1);
			const entry=state.setAnimation(0,name,false);entry.timeScale=Math.max(0.25,Math.min(4,Number.isFinite(rate)?rate:1));
			if (hold && data.findAnimation(`${name}_loop`)) state.addAnimation(0,`${name}_loop`,true,0);
			else if (!hold) state.addAnimation(0,rest(),true,0);
			return true;
		},
		setFreegame(value: boolean) {
			if (freegame === value) return;freegame = value;
			const current=state.tracks[0];
			if(!value){acting=false;holding=false;state.clearTracks();skeleton.setupPose();state.setAnimation(0,rest(),true);update(0);}
			else if(!acting)state.setAnimation(0,rest(),true);
			else if(current?.next&&(current.next.animation?.name==='idle'||current.next.animation?.name==='fg_idle'))current.next.animation=data.findAnimation(rest());
		},
		setReducedMotion(value: boolean) { reduced = value; if (value) { acting = false; holding = false; state.clearTracks(); skeleton.setupPose(); state.setAnimation(0,rest(),true); state.apply(skeleton); update(0); } },
		reset() { acting = false; holding = false; fidgetDone = false; restTime = 0; nextSnake = 18; state.clearTracks(); skeleton.setupPose(); state.setAnimation(0,rest(),true); update(0); },
		destroy() { disposed = true; state.clearTracks(); state.clearListeners(); },
	};
}
