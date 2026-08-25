import _ from 'lodash';
import { Tween } from 'svelte/motion';
import { sineOut, backIn, linear } from 'svelte/easing';

import { stateBet } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';
import { createInterruptible } from 'utils-shared/interruptible';

import type { SpinningReelCreateOptions, SpinningReelSpinOptions, SpinType } from './types';

export type SpinningReelMotion = 'spinning' | 'bouncing' | 'stopped';
export type SpinningReelSymbolState = 'static' | 'land' | 'spin';

export function createReelForSpinning<TRawSymbol extends object, TSymbolState extends string>(
	reelOptions: SpinningReelCreateOptions<TRawSymbol, TSymbolState>,
) {
	// reelSymbols
	const createReelSymbol = (reelSymbolOptions: { rawSymbol: TRawSymbol; symbolIndex: number }) => {
		const rawSymbol = reelSymbolOptions.rawSymbol;
		const symbolIndex = reelSymbolOptions.symbolIndex;
		const symbolState = reelOptions.initialSymbolState;
		const symbolY = () => reelY.current + (reelSymbol.symbolIndex + 0.5) * reelOptions.symbolHeight;
		const oncomplete = () => {};

		const reelSymbol = $state({
			id: {},
			rawSymbol,
			symbolIndex,
			symbolState,
			symbolY,
			oncomplete,
		});

		return reelSymbol;
	};

	type ReelSymbol = ReturnType<typeof createReelSymbol>;

	const createReelSymbols: (value: TRawSymbol[]) => ReelSymbol[] = (rawSymbols) => {
		const reelSymbols = rawSymbols.map((rawSymbol, symbolIndex) =>
			createReelSymbol({ rawSymbol, symbolIndex }),
		);

		return reelSymbols;
	};

	const updateAllReelSymbolState = (value: SpinningReelSymbolState) => {
		reelState.symbols.forEach((reelSymbol) => {
			reelSymbol.symbolState = value as TSymbolState;
			if (value === 'land') {
				reelOptions.onSymbolLand({ rawSymbol: reelSymbol.rawSymbol });
			}
		});
	};

	// constants
	const defaultY = -reelOptions.symbolHeight;
	// Padding-inclusive symbols per reel. Fixed for every game that does not pass
	// getReelLength, which is all of them except Margin Call - its feature board
	// grows two rows, and the padding maths below has to follow it or the reel
	// spins a 5-symbol strip into a 7-symbol window.
	//
	// Never call this during creation. A caller's getter typically reads the
	// game's own module-scope state, and reels are built at module scope too - so
	// calling it here can touch that state inside its temporal dead zone and throw
	// a ReferenceError while the module is still being evaluated. That takes the
	// whole game down before anything renders, and `ssr = false` means the build
	// never evaluates these modules, so nothing catches it before the browser.
	const getReelLength = reelOptions.getReelLength ?? (() => reelOptions.initialSymbols.length);

	// interruptible
	const interruptible = createInterruptible();

	// reactive states
	const reelY = new Tween(defaultY);
	const reelState = $state({
		symbols: createReelSymbols(reelOptions.initialSymbols),
		motion: 'stopped' as SpinningReelMotion,
		spinType: 'normal' as SpinType,
		anticipating: false,
		readyToSpin: () => {},
		spinOptions: () => ({}) as SpinningReelSpinOptions,
	});
	const basePaddingSize = () =>
		getReelLength() * reelState.spinOptions().reelPaddingMultiplierNormal;
	const anticipatedPaddingSize = () =>
		getReelLength() * reelState.spinOptions().reelPaddingMultiplierAnticipated;

	// internal states
	let isPreSpinning = false;
	// initialSymbols, not getReelLength(): at creation the reel holds exactly the
	// symbols it was handed, and this is overwritten by prepareToSpin on every
	// spin anyway. Same value as before for every caller - and it keeps creation
	// free of any call into the caller's state.
	let targetPaddingPosition = reelOptions.initialSymbols.length - 1;
	let prevSymbols: ReelSymbol[] = createReelSymbols(reelOptions.initialSymbols);
	let targetSymbols: ReelSymbol[] = createReelSymbols(reelOptions.initialSymbols);
	let paddingRawReel: TRawSymbol[] = reelOptions.initialSymbols;
	let onSpinFinishing: () => void = () => {};
	let noStop = false;
	let paddingSize = 0;

	const getPaddingRawSymbol = ({
		paddingRawReel,
		index,
	}: {
		paddingRawReel: TRawSymbol[];
		index: number;
	}) => {
		const length = paddingRawReel.length;
		if (index >= length) return paddingRawReel[index % length];
		if (index <= -1) return paddingRawReel[length + index];
		return paddingRawReel[index];
	};

	const getPaddingRawSymbols = ({
		paddingRawReel,
		start,
		length,
	}: {
		paddingRawReel: TRawSymbol[];
		start: number;
		length: number;
	}) =>
		_.range(length).map((index) => {
			const targetIndex = start + index;
			return getPaddingRawSymbol({ paddingRawReel, index: targetIndex });
		});

	const addPadding = async (paddingSizeValue: number) => {
		const paddingRawSymbols = getPaddingRawSymbols({
			paddingRawReel,
			start: targetPaddingPosition,
			length: paddingSizeValue,
		});
		const paddingSymbols = createReelSymbols(paddingRawSymbols);
		const symbolsForSpin: ReelSymbol[] = [...targetSymbols, ...paddingSymbols, ...prevSymbols];
		symbolsForSpin.forEach((symbol, newSymbolIndex) => (symbol.symbolIndex = newSymbolIndex));
		reelState.symbols = [...symbolsForSpin];

		const topY =
			defaultY -
			symbolsForSpin.length * reelOptions.symbolHeight +
			getReelLength() * reelOptions.symbolHeight;
		return topY;
	};

	const slideY = async ({
		reelY: targetY,
		speed,
		easing = undefined,
	}: {
		reelY: number;
		speed: number;
		easing?: (value: number) => number;
	}) => {
		const currentY = reelY.current;
		const distance = Math.abs(targetY - currentY);
		const duration = distance / speed; // (speed unit: pixel / ms)

		await reelY.set(targetY, { duration, easing });
	};

	const placeY = (targetY: number) => reelY.set(targetY, { duration: 0 });

	const removePaddingAndBounceBack = async () => {
		reelState.symbols = [...targetSymbols];
		placeY(defaultY + reelOptions.symbolHeight * reelState.spinOptions().reelBounceSizeMulti);
		await slideY({
			reelY: defaultY,
			speed: reelState.spinOptions().reelBounceBackSpeed,
			easing: sineOut,
		});
		setSymbolsWithReelSymbols(targetSymbols);
	};

	const preSpinPadding = async ({
		preSpinPaddingRawReel,
	}: {
		preSpinPaddingRawReel: TRawSymbol[];
	}) => {
		const randomStart = Math.floor(Math.random() * preSpinPaddingRawReel.length);
		prevSymbols = targetSymbols;
		const targetRawSymbols = getPaddingRawSymbols({
			paddingRawReel: preSpinPaddingRawReel,
			start: randomStart,
			length: getReelLength(),
		});
		targetSymbols = createReelSymbols(targetRawSymbols);
		const topY = await addPadding(0);
		await placeY(topY);
	};

	const preSpinSlideDownLoop = async ({
		isTurboBeforeAll,
		preSpinPaddingRawReel,
	}: {
		isTurboBeforeAll: boolean;
		preSpinPaddingRawReel: TRawSymbol[];
	}) => {
		let started = false;
		while (isPreSpinning) {
			const speed = started
				? reelState.spinOptions().reelSpinSpeed
				: reelState.spinOptions().reelPreSpinSpeed;
			const easing = started || isTurboBeforeAll ? linear : backIn;
			await slideY({ reelY: defaultY, speed, easing });
			await preSpinPadding({ preSpinPaddingRawReel });
			if (!started) {
				reelState.motion = 'spinning';
				updateAllReelSymbolState('spin');
				started = true;
			}
		}
	};

	const delaySpinByReelIndex = async () => {
		await waitForTimeout(reelState.spinOptions().reelSpinDelay * reelOptions.reelIndex);
	};

	const preSpin = async ({
		isTurboBeforeAll,
		preSpinPaddingReel,
	}: {
		isTurboBeforeAll: boolean; // To avoid previous spinType has effect on "getSpinOption" in "preSpinSlideDownLoop"
		preSpinPaddingReel: TRawSymbol[];
	}) => {
		const preSpinPaddingRawReel = preSpinPaddingReel;

		isPreSpinning = true;
		reelState.spinType = isTurboBeforeAll ? 'fast' : 'normal';
		await preSpinPadding({ preSpinPaddingRawReel });
		if (!isTurboBeforeAll || reelState.spinOptions().reelStaggerInTurbo) {
			await delaySpinByReelIndex();
		}
		preSpinSlideDownLoop({ isTurboBeforeAll, preSpinPaddingRawReel });
	};

	const generalSpinWith = async ({ slideDown }: { slideDown: () => Promise<void> }) => {
		const isSpinning = reelState.motion === 'spinning';

		const topY = await addPadding(paddingSize);
		await placeY(topY);

		if (!isSpinning) {
			reelState.motion = 'spinning';
			updateAllReelSymbolState('spin');
		}

		// Q: When to skip the slideDown?
		// A: When it's preSpinning(isSpinning) and stop button is clicked(isTurbo) and is noStop is false
		if (noStop) {
			await slideDown();
		} else if (stateBet.isTurbo && isSpinning && !reelState.spinOptions().reelStaggerInTurbo) {
			// skip
		} else {
			await interruptible.add(slideDown);
		}

		reelState.motion = 'bouncing';
		onSpinFinishing();
		// The impact is the START of the bounce, not the end of it. With
		// `landOnImpact` the symbols squash as the reel hits, in the same frame as
		// the reel-stop click that onSpinFinishing just played; without it they
		// wait out the whole bounce-back first (236ms on a 118px cell) and the
		// sound leads the picture by a quarter of a second.
		//
		// `removePaddingAndBounceBack` has already swapped in the final symbols, so
		// what is being animated here is the board that landed, not the strip.
		if (reelState.spinOptions().landOnImpact) updateAllReelSymbolState('land');
		await removePaddingAndBounceBack();
		reelState.motion = 'stopped';
		// Not repeated when it has already been done: 'land' resolves back to
		// 'static' after the landing motion, so setting it a second time here
		// would run the whole squash again from the top.
		if (!reelState.spinOptions().landOnImpact) updateAllReelSymbolState('land');
	};

	const fastSpin = () =>
		generalSpinWith({
			slideDown: async () => {
				const bounceSize = reelOptions.symbolHeight * reelState.spinOptions().reelBounceSizeMulti;

				await slideY({
					reelY: defaultY + bounceSize,
					speed: reelState.spinOptions().reelSpinSpeed,
				});
			},
		});

	const normalSpin = () =>
		generalSpinWith({
			slideDown: async () => {
				const bounceSize = reelOptions.symbolHeight * reelState.spinOptions().reelBounceSizeMulti;

				await slideY({
					reelY: defaultY * basePaddingSize(),
					speed: reelState.spinOptions().reelSpinSpeed,
				});
				await slideY({
					reelY: defaultY + bounceSize,
					speed: reelState.spinOptions().reelSpinSpeedBeforeBounce,
				});
			},
		});

	const anticipatedSpin = () =>
		generalSpinWith({
			slideDown: async () => {
				const bounceSize = reelOptions.symbolHeight * reelState.spinOptions().reelBounceSizeMulti;

				await slideY({
					reelY: defaultY * basePaddingSize(),
					// Slower than an ordinary reel where the app asks for it. Falls
					// back to the ordinary speed, so nothing changes for an app that
					// does not set it.
					speed:
						reelState.spinOptions().reelSpinSpeedAnticipated ??
						reelState.spinOptions().reelSpinSpeed,
				});
				await slideY({
					reelY: defaultY + bounceSize,
					speed: reelState.spinOptions().reelSpinSpeedBeforeBounce,
				});
			},
		});

	const SPIN_MAP = {
		fast: fastSpin,
		normal: normalSpin,
		anticipated: anticipatedSpin,
	};

	const prepareToSpin = (prepareToSpinOptions: {
		noStop: boolean;
		spinType: SpinType;
		symbols: TRawSymbol[];
		paddingPosition: number;
		paddingReel: TRawSymbol[];
		onSpinFinishing: () => void;
		previousPaddingSize: number;
	}) => {
		reelState.spinType = prepareToSpinOptions.spinType;

		noStop = prepareToSpinOptions.noStop;
		prevSymbols = targetSymbols;
		targetPaddingPosition = prepareToSpinOptions.paddingPosition;
		targetSymbols = createReelSymbols(prepareToSpinOptions.symbols);
		paddingRawReel = prepareToSpinOptions.paddingReel;
		onSpinFinishing = prepareToSpinOptions.onSpinFinishing;

		const GET_PADDING_SIZE_MAP = {
			// The +0 is what makes turbo land as a block: every reel travels the
			// same distance, so they all arrive together. reelStaggerInTurbo opts
			// back into the accumulating padding the normal spin uses, which is
			// where the reel-by-reel arrival actually comes from - the start delay
			// above only offsets the beginning.
			fast: reelState.spinOptions().reelStaggerInTurbo
				? prepareToSpinOptions.previousPaddingSize + basePaddingSize()
				: prepareToSpinOptions.previousPaddingSize + 0,
			normal: prepareToSpinOptions.previousPaddingSize + basePaddingSize(),
			anticipated: prepareToSpinOptions.previousPaddingSize + anticipatedPaddingSize(),
		};

		paddingSize = GET_PADDING_SIZE_MAP[prepareToSpinOptions.spinType];

		return paddingSize;
	};

	const spin = async () => {
		isPreSpinning = false;

		await SPIN_MAP[reelState.spinType]();

		interruptible.clear();
	};

	const setSymbolsWithReelSymbols = (reelSymbols?: ReelSymbol[]) => {
		reelState.motion = 'stopped';
		placeY(defaultY);
		if (reelSymbols) {
			prevSymbols = [...reelSymbols];
			targetSymbols = [...reelSymbols];
			paddingRawReel = reelOptions.initialSymbols;
			reelState.symbols = [...reelSymbols];
		}
	};

	const setSymbolsWithRawSymbols = (rawSymbols?: TRawSymbol[]) => {
		const newSymbols = rawSymbols ? createReelSymbols(rawSymbols) : undefined;
		setSymbolsWithReelSymbols(newSymbols);
	};

	const stop = () => {
		interruptible.interrupt();
	};

	const readyToSpinEffect = () => {
		$effect(() => {
			if (reelY.current === defaultY) {
				reelState.readyToSpin();
			}
		});
	};

	return {
		// from options
		reelIndex: reelOptions.reelIndex,
		symbolHeight: reelOptions.symbolHeight,
		onReelStopping: reelOptions.onReelStopping,
		get reelLength() {
			return getReelLength();
		},
		// reactive states
		reelState,
		// methods
		preSpin,
		prepareToSpin,
		spin,
		stop,
		setSymbolsWithRawSymbols,
		readyToSpinEffect,
	};
}
