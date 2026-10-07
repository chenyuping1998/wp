<script lang="ts">
	/**
	 * HE LOOKS AT WHAT JUST HAPPENED — `mascotGaze` (a cell): a Scatter or a
	 * Wild landing, a line paying, a tablet cracking, a coin sticking. The head
	 * dips and turns toward the cell, the chest and hips follow a little, he
	 * holds the look for a moment and comes back.
	 *
	 * A character who notices things is the cheapest kind of alive there is,
	 * and the one a player reads without thinking about it: his eye takes
	 * theirs to the cell.
	 *
	 * Additive, on top of whatever track 0 is playing, applied after the
	 * animation and before the world transform (Spine's
	 * beforeUpdateWorldTransforms). Only while he is idling (`enabled`): every
	 * reaction he has already looks where it means to, and a look stacked on
	 * the alert would push the head past its mesh budget. Up/down follows the
	 * cell's row, and how far he turns follows how far across the board it is.
	 *
	 * The rig is a 2D cutout and cannot turn its head; a look is spelled the
	 * way `alert` spells it — a tilt, a shift toward the board, a lean.
	 */
	import { getContextSpine } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE } from '../game/constants';

	type Props = {
		/** where he stands (main-layout px) and how big — Mascot's placement */
		x: number;
		y: number;
		scale: number;
		enabled: boolean;
	};

	const props: Props = $props();
	const spine = getContextSpine();
	const context = getContext();

	// his head, measured up from his feet in skeleton units (the rig is ~1000
	// tall from the origin between the feet)
	const HEAD_UP = 760;
	const HOLD_MS = 950;
	const IN_MS = 220;
	const OUT_MS = 520;

	// how far toward the board (0..1) and up/down (-1 top .. 1 bottom)
	let target = { across: 0, down: 0 };
	let lookedAt = -Infinity;
	const now = () => performance.now();

	context.eventEmitter.subscribeOnMount({
		mascotGaze: ({ reel, row }) => {
			const board = context.stateGameDerived.boardLayout();
			const cell = SYMBOL_SIZE * board.scale;
			const cx = board.x + (reel - (BOARD_DIMENSIONS.x - 1) / 2) * cell;
			const cy = board.y + (row - 1 - (BOARD_DIMENSIONS.y - 1) / 2) * cell;
			const headX = props.x, headY = props.y - HEAD_UP * props.scale;
			const halfW = (BOARD_DIMENSIONS.x * cell) / 2, halfH = (BOARD_DIMENSIONS.y * cell) / 2;
			const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
			target = {
				across: clamp((headX - cx) / (halfW * 2.4), 0.35, 1),
				down: clamp((cy - headY) / (halfH * 1.4), -1, 1),
			};
			lookedAt = now();
		},
	});

	// eased, so a second look while one is held turns from where he is
	let cur = { across: 0, down: 0, k: 0 };

	// WHAT WAS ADDED LAST FRAME, so it is never added twice. A channel the
	// playing animation keys is reset by it every frame; one it does not key
	// keeps last frame's value — offsets included — and would creep. So each
	// frame starts by taking back last frame's offset from any channel still
	// holding exactly the value it was left at.
	type Channel = { bone: string; prop: 'rotation' | 'x' | 'y'; left: number; added: number };
	let applied: Channel[] = [];
	let lastT = now();

	onMount(() => {
		const prev = spine.beforeUpdateWorldTransforms;
		spine.beforeUpdateWorldTransforms = (object) => {
			prev?.(object);
			const t = now();
			const dt = Math.min(0.05, (t - lastT) / 1000);
			lastT = t;
			const since = t - lookedAt;
			// the envelope: in, hold, out
			const skel = object.skeleton;
			for (const c of applied) {
				const bone = skel.findBone(c.bone);
				if (bone && bone[c.prop] === c.left) bone[c.prop] -= c.added;
			}
			applied = [];
			const want =
				!props.enabled || since < 0
					? 0
					: since < IN_MS
						? since / IN_MS
						: since < IN_MS + HOLD_MS
							? 1
							: Math.max(0, 1 - (since - IN_MS - HOLD_MS) / OUT_MS);
			const ease = 1 - Math.exp(-dt * 12);
			cur.k += (want - cur.k) * ease;
			cur.across += (target.across - cur.across) * ease;
			cur.down += (target.down - cur.down) * ease;
			if (cur.k < 0.002) return;
			const k = cur.k;
			const add = (name: string, prop: Channel['prop'], amount: number) => {
				const bone = skel.findBone(name);
				if (!bone) return;
				bone[prop] += amount;
				applied.push({ bone: name, prop, left: bone[prop], added: amount });
			};
			// positive head rotation dips it (the nod's direction); the alert's
			// turn to the board is the same sign, so across and down add
			add('head', 'rotation', k * (5 * cur.across + 6 * cur.down));
			add('head', 'x', k * -6 * cur.across);
			add('head', 'y', k * -3 * cur.down);
			add('torso', 'rotation', k * 3 * cur.across);
			add('hip', 'x', k * -5 * cur.across);
		};
		return () => {
			spine.beforeUpdateWorldTransforms = prev ?? (() => {});
		};
	});
</script>
