var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import WebFont from 'webfontloader';
export const REM = 16;
export const MIN_CLICKABLE_SIZE = 3 * REM; // 44 x 44 is minimum clickable size
export const getPointValues = ({ point, defaultValue, }) => {
    const finalDefaultValue = defaultValue === undefined ? 0 : defaultValue;
    if (typeof point === 'number')
        return [point, point];
    return [(point === null || point === void 0 ? void 0 : point.x) || finalDefaultValue, (point === null || point === void 0 ? void 0 : point.y) || finalDefaultValue];
};
export const anchorToPivot = ({ anchor, sizes }) => {
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
        let canvas = document.createElement('canvas'), names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'], context = false;
        for (const i in names) {
            try {
                // @ts-ignore
                context = canvas.getContext(names[i]);
                // @ts-ignore
                if (context && typeof context.getParameter === 'function') {
                    // WebGL is enabled.
                    return 1;
                }
            }
            catch (e) { }
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
let fontKitId = 'aba0ebl';
export const setFontKit = (id) => {
    fontKitId = id;
};
// CSS font shorthands for faces the game self-hosts through @font-face, e.g.
// '400 16px "Titan One"'. Pixi measures glyph advances the moment it builds a
// Text, so a face still in flight at that point gets the first frame laid out on
// the fallback's metrics — and nothing re-measures it afterwards. Blocking
// startup on document.fonts is the only reliable fix. Empty by default, so games
// that ship no custom faces behave exactly as before.
let localFontSpecs = [];
export const setLocalFonts = (specs) => {
    localFontSpecs = specs;
};
const loadTypekit = () => new Promise((resolve) => {
    if (!fontKitId)
        return resolve();
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
    }
    catch (error) {
        console.error(error);
        resolve();
    }
});
const loadLocalFonts = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!localFontSpecs.length || typeof document === 'undefined' || !document.fonts)
        return;
    try {
        // load() resolves per face; fonts.ready then waits for the whole set to
        // settle, including any still being parsed
        yield Promise.all(localFontSpecs.map((spec) => document.fonts.load(spec)));
        yield document.fonts.ready;
    }
    catch (error) {
        // a missing face must not deadlock startup — fall back and carry on
        console.error('Local font load failed', error);
    }
});
export const preloadFont = () => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([loadTypekit(), loadLocalFonts()]);
});
export function propsSyncEffect({ props, target, ignore, }) {
    $effect(() => {
        // The whole thing is wrapped inside an $effect
        // and because of ”props[key]“，it will react with every single props updated.
        let targetInstance = target instanceof Function ? target() : target;
        if (targetInstance) {
            Object.keys(props)
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
