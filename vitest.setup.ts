// The vault utilities in lib/crypto.ts use browser globals (window.crypto,
// window.btoa, window.atob). Under Node those live on globalThis, so expose
// globalThis as `window` to exercise the real Web Crypto implementation.
const testGlobals = globalThis as unknown as { window?: unknown; crypto?: unknown };

if (typeof testGlobals.window === "undefined") {
  testGlobals.window = globalThis;
}

if (typeof testGlobals.crypto === "undefined") {
  testGlobals.crypto = (globalThis as { crypto?: unknown }).crypto;
}
