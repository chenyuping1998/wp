import WebFont from 'webfontloader';

import type { PixiPoint, Sizes } from './types';

export const REM = 16;
export const MIN_CLICKABLE_SIZE = 3 * REM; // 44 x 44 is minimum clickable size

export const getPointValues = ({
	point,
	defaultValue,
}: {
	point: PixiPoint;
	defaultValue: number;
}) => {
	const finalDefaultValue = defaultValue === undefined ? 0 : defaultValue;
	if (typeof point === 'number') return [point, point];
	return [point?.x || finalDefaultValue, point?.y || finalDefaultValue];
};

export const anchorToPivot = ({ anchor, sizes }: { anchor: PixiPoint; sizes: Sizes }) => {
	const { width, height } = sizes;
	const [anchorX, anchorY] = getPointValues({ point: anchor, defaultValue: 0 });
	return { x: width * anchorX, y: height * anchorY };
};

/**
 * Detects if WebGL is enabled.
 * Inspired from http://www.browserleaks.com/webgl#howto-detect-webgl
 *
 * @return { number } -1 for not Supported,
 *										0 for disabled
 *										1 for enabled
 */
export function detectWebGL() {
	// Check for the WebGL rendering context
	if (window && !!window.WebGLRenderingContext) {
		let canvas = document.createElement('canvas'),
			names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'],
			context = false;

		for (const i in names) {
			try {
				// @ts-ignore
				context = canvas.getContext(names[i]);
				// @ts-ignore
				if (context && typeof context.getParameter === 'function') {
					// WebGL is enabled.
					return 1;
				}
			} catch (e) {}
		}

		// WebGL is supported, but disabled.
		return 0;
	}

	// WebGL not supported.
	return -1;
}

// Adobe Typekit kit to preload before the first frame. The template's kit is
// the default so existing games keep working, but it is domain-locked to the
// template's account — off that origin it 404s and logs "Web font load
// inactive". A game that ships its own fonts (or uses system fonts) should call
// setFontKit(null) at module scope to skip the request entirely.
let fontKitId: string | null = 'aba0ebl';

export const setFontKit = (id: string | null) => {
	fontKitId = id;
};

// CSS font shorthands for faces the game self-hosts through @font-face, e.g.
// '400 16px "Titan One"'. Pixi measures glyph advances the moment it builds a
// Text, so a face still in flight at that point gets the first frame laid out on
// the fallback's metrics — and nothing re-measures it afterwards. Blocking
// startup on document.fonts is the only reliable fix. Empty by default, so games
// that ship no custom faces behave exactly as before.
let localFontSpecs: string[] = [];

export const setLocalFonts = (specs: string[]) => {
	localFontSpecs = specs;
};

const loadTypekit = () =>
	new Promise<void>((resolve) => {
		if (!fontKitId) return resolve();
		try {
			WebFont.load({
				typekit: {
					id: fontKitId,
				},
				active: () => {
					resolve();
				},
				inactive: () => {
					console.error('Web font load inactive');
					resolve();
				},
			});
		} catch (error) {
			console.error(error);
			resolve();
		}
	});

const loadLocalFonts = async () => {
	if (!localFontSpecs.length || typeof document === 'undefined' || !document.fonts) return;
	try {
		// load() resolves per face; fonts.ready then waits for the whole set to
		// settle, including any still being parsed
		await Promise.all(localFontSpecs.map((spec) => document.fonts.load(spec)));
		await document.fonts.ready;
	} catch (error) {
		// a missing face must not deadlock startup — fall back and carry on
		console.error('Local font load failed', error);
	}
};

export const preloadFont = async () => {
	await Promise.all([loadTypekit(), loadLocalFonts()]);
};

export function propsSyncEffect<TProps extends object, TTarget>({
	props,
	target,
	ignore,
}: {
	props: TProps;
	target?: TTarget | (() => TTarget);
	ignore?: (keyof TProps)[];
}) {
	$effect(() => {
		// The whole thing is wrapped inside an $effect
		// and because of ”props[key]“，it will react with every single props updated.
		let targetInstance = target instanceof Function ? target() : target;
		if (targetInstance) {
			(Object.keys(props) as (keyof TProps)[])
				.filter((key) => (ignore ? !ignore.includes(key) : true))
				.forEach((key) => {
					if (props[key] !== undefined) {
						// @ts-ignore
						targetInstance[key] = props[key];
					}
				});
		}
	});
}
