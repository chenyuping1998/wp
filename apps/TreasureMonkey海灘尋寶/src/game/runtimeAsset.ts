// Resolve static assets relative to the hosted game shell, including subdirectory uploads.
export const asset = (path: string) => typeof document === 'undefined'
 ? `./assets/${path}`
 : new URL(`./assets/${path}`, document.baseURI).href;
