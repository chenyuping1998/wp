export const stateConfig = $state({
	/** When the player cannot afford the bet, EXPLAIN rather than go dead.
	 *
	 * Stake review, 2026-09-06: "the game should display an Insufficient Balance
	 * message ... regardless of whether the bet is initiated using the Bet
	 * button, the spacebar, or Autoplay." Three separate controls have to honour
	 * it, and they live in two packages — the bet button and the autoplay opener
	 * in components-ui-pixi, the autoplay start button in components-ui-html,
	 * which cannot import the pixi package's uiTheme. So the policy lives here,
	 * where both can read one copy of it.
	 *
	 * Off by default: a game that has not opted in keeps the disabled controls it
	 * was built with rather than pressable ones with nothing behind them.
	 */
	explainInsufficientBalance: false,

	jurisdiction: {
		socialCasino: false,
		disabledFullscreen: false,
		disabledTurbo: false,
		disabledSuperTurbo: false,
		disabledAutoplay: false,
		disabledSlamstop: false,
		disabledSpacebar: false,
		disabledBuyFeature: false,
		displayNetPosition: false,
		displayRTP: false,
		displaySessionTimer: false,
		minimumRoundDuration: 0,
	},
	// Empty until authenticate answers. These used to hold a hardcoded ladder
	// ([1, 5, 25, …]) which meant that if the config request failed, or ran late,
	// the bet menu presented stakes the server had never offered — and a player
	// could pick one. There is no correct fallback for this: the stakes are the
	// server's to define, so until it has, there are none.
	betAmountOptions: [] as number[],
	betMenuOptions: [] as number[],
	// The rest of the server's betting parameters. These were read from the
	// authenticate response and then thrown away, so the stake always started at
	// a hardcoded 1 and nothing was bounded by what the server actually allows —
	// which for Gold Coins meant opening at 1 GC instead of the 10,000 GC the
	// server nominates. 0 means "not answered yet"; there is no sensible default
	// for someone else's betting limits.
	minBet: 0,
	maxBet: 0,
	stepBet: 0,
	defaultBetLevel: 0,
});
