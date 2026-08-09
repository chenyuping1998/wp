<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';
	import { stateUrlDerived, stateBet, stateConfig, stateModal, stateUi } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	const authenticate = async () => {
		try {
			const authenticateData = await requestAuthenticate({
				rgsUrl: stateUrlDerived.rgsUrl(),
				sessionID: stateUrlDerived.sessionID(),
				language: stateUrlDerived.lang(),
			});

			// error
			if (authenticateData?.error) throw authenticateData;

			// balance
			if (authenticateData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = authenticateData.balance.currency;
				stateBet.balanceAmount = authenticateData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (authenticateData?.config) {
				// Example of authenticateData.config
				// {
				// 	"gameID": "37_test-lines",
				// 	"minBet": 100000,
				// 	"maxBet": 1000000000,
				// 	"stepBet": 10000,
				// 	"defaultBetLevel": 1000000,
				// 	"betLevels": [100000, 200000, ..., 1000000000],
				// 	"betModes": {},
				// 	"jurisdiction": {
				// 			"socialCasino": false,
				// 			"disabledFullscreen": false,
				// 			"disabledTurbo": false,
				// 			"disabledSuperTurbo": false,
				// 			"disabledAutoplay": false,
				// 			"disabledSlamstop": false,
				// 			"disabledSpacebar": false,
				// 			"disabledBuyFeature": false,
				// 			"displayNetPosition": false,
				// 			"displayRTP": false,
				// 			"displaySessionTimer": false,
				// 			"minimumRoundDuration": 0
				// 	}
				// }
				stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;

				// Every betting parameter the server sent, not just the ladder.
				// minBet/maxBet bound the stake, stepBet is the increment when a game
				// has no discrete ladder, and defaultBetLevel is the stake to open
				// with — that last one is why a Gold Coin session used to start at
				// 1 GC instead of the 10,000 GC the server nominates.
				const toAmount = (value?: number) =>
					typeof value === 'number' ? value / API_AMOUNT_MULTIPLIER : 0;
				stateConfig.minBet = toAmount(authenticateData.config?.minBet);
				stateConfig.maxBet = toAmount(authenticateData.config?.maxBet);
				stateConfig.stepBet = toAmount(authenticateData.config?.stepBet);
				stateConfig.defaultBetLevel = toAmount(authenticateData.config?.defaultBetLevel);

				stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(
					(level) => level / API_AMOUNT_MULTIPLIER,
				);
				// Every level the server sent, in the order it sent them.
				//
				// This used to be filtered through MOST_USED_BET_INDEXES — a hardcoded
				// index whitelist [0,2,5,7,...,38] picked for a ~39-entry ladder. With a
				// shorter ladder most of those indexes simply do not exist: a 23-level
				// config matched only 9 of them, so the bet menu showed values that bore
				// no relation to betLevels at all. The menu is meant to present the
				// server's betting parameters, so it now presents all of them.
				stateConfig.betMenuOptions = stateConfig.betAmountOptions;

				// Open on the server's nominated stake. Set after the options above so
				// the clamp in setBetAmount has the limits to work with; a resumed
				// round overwrites it further down, which is correct — that stake is
				// already committed.
				if (stateConfig.defaultBetLevel > 0) {
					stateBet.betAmount = stateConfig.defaultBetLevel;
					stateBet.wageredBetAmount = stateConfig.defaultBetLevel;
				}
			}

			// round
			if (authenticateData?.round) {
				// Example of authenticateData.round 
				// {
				// 	"betID": 62277967,
				// 	"amount": 1000000,
				// 	"payout": 33400000,
				// 	"payoutMultiplier": 33.4,
				// 	"active": true,
				// 	"state": [...],
				// 	"mode": "BONUS",
				// 	"event": null
				// }

				if(authenticateData.round?.state) {
					// @ts-ignore
					stateBet.betToResume =  authenticateData.round;
				}

				if(authenticateData.round?.amount) {
					const betAmountValue =
						authenticateData.round.amount > 0
							? authenticateData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (authenticateData.round?.mode) {
					stateBet.activeBetModeKey = authenticateData.round.mode;
				};
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	const handleReplay = async () => {
		// A replay never authenticates, so nothing else would ever set the currency
		// and every amount would render as USD.
		const replayCurrency = stateUrlDerived.currency();
		if (replayCurrency) stateBet.currency = replayCurrency;

		stateBet.betAmount = (stateUrlDerived.amount() / API_AMOUNT_MULTIPLIER) || 0;
		stateBet.wageredBetAmount = (stateUrlDerived.amount() / API_AMOUNT_MULTIPLIER) || 0;
		stateBet.activeBetModeKey = stateUrlDerived.mode();

		// Mirrors authenticate()'s handling. Without it a failed replay request
		// rejected out of onMount, `authenticated` never flipped, and the game
		// rendered nothing at all — a black screen with no error and no way back.
		// A replay that cannot be fetched should still land the player in a game
		// that says so.
		try {
			const data = await requestReplay({
				rgsUrl: stateUrlDerived.rgsUrl(),
				game: stateUrlDerived.game(),
				mode: stateUrlDerived.mode(),
				version: stateUrlDerived.version(),
				event: stateUrlDerived.event(),
				language: stateUrlDerived.lang(),
			});

			if (data?.error) throw data;

			if (data) {
				// @ts-ignore
				stateBet.betToResume = {
					...data,
					event: '0',
					active: true,
					mode: stateUrlDerived.mode(),
				};
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	onMount(async () => {
		if(stateUrlDerived.replay()) {
			stateUi.config.mode = 'replay';
			await handleReplay();
		} else {
			stateUi.config.mode = 'default';
			await authenticate();
		};

		authenticated = true;
	});
</script>

{#if authenticated}
	{@render props.children()}
{/if}
