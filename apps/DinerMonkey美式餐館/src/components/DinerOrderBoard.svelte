<script lang="ts" module>
	export type EmitterEventDinerOrderBoard =
		| { type: 'dinerOrderStart' }
		| { type: 'dinerOrderScore'; amount: number };
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { GAME_FONT, NUMBER_FONT } from '../game/fonts';

	type Order = { number: number; amount: number };
	type Plate = { x: number; y: number; width: number; height: number };
	const props: { parallax: Plate } = $props();
	const context = getContext();
	let orders = $state<Order[]>([]);
	let nextOrder = 1;
	const chalk = $derived(context.stateGame.gameType === 'freegame' ? 0xece8d7 : 0xf2ead0);
	const accent = $derived(context.stateGame.gameType === 'freegame' ? 0x9ad7d1 : 0xf1bd83);

	context.eventEmitter.subscribeOnMount({
		dinerOrderStart: () => {
			orders = [{ number: nextOrder, amount: 0 }, ...orders].slice(0, 3);
			nextOrder = nextOrder % 99 + 1;
		},
		dinerOrderScore: ({ amount }) => {
			if (!orders.length) return;
			orders = [{ ...orders[0], amount: Math.max(0, amount) }, ...orders.slice(1)];
		},
	});

	// "payout" is restricted in social play (Stake.US); the column reads WIN there
	const payoutLabel = stateUrlDerived.social() ? 'WIN' : 'PAYOUT';

	const payout = (amount: number) => {
		const multiple = amount / 100;
		return `${multiple >= 100 ? multiple.toFixed(0) : multiple >= 10 ? multiple.toFixed(1) : multiple.toFixed(2)}×`;
	};
</script>

<!-- Lettering sits inside the plate's existing chalkboard and follows its cover crop. -->
<Container x={props.parallax.x} y={props.parallax.y}
	scale={{ x: props.parallax.width / 1920, y: props.parallax.height / 1080 }}>
	<Text text="ORDER BOARD" x={606} y={105}
		style={{ fontFamily: GAME_FONT, fontSize: 24, fill: accent, letterSpacing: 2 }} />
	<Text text="NO." x={608} y={134}
		style={{ fontFamily: GAME_FONT, fontSize: 14, fill: chalk, letterSpacing: 2 }} />
	<Text text={payoutLabel} x={768} y={134}
		style={{ fontFamily: GAME_FONT, fontSize: 14, fill: chalk, letterSpacing: 2 }} />
	{#each [0, 1, 2] as index}
		{@const order = orders[index]}
		<Text text={order ? `#${String(order.number).padStart(2, '0')}` : '--'} x={608} y={153 + index * 25}
			style={{ fontFamily: NUMBER_FONT, fontSize: 20, fill: chalk }} />
		<Text text={order ? payout(order.amount) : '—'} x={768} y={153 + index * 25}
			style={{ fontFamily: NUMBER_FONT, fontSize: 20, fill: chalk }} />
	{/each}
</Container>
