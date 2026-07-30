export const stateConfig = $state({
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
});
