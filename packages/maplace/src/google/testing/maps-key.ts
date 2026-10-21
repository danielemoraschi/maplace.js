/// <reference types="vite/client" />

/**
 * The Maps API key the Maps tests load Google with: `VITE_MAPS_KEY` in `.env.local`, or the
 * `MAPS_KEY` secret in CI. Restricted to `MAPS_TEST_ORIGIN`; without it, the tests that need Maps
 * are skipped. Read as `import.meta.env.VITE_MAPS_KEY` outright: Vitest fills it in node only
 * where it is named so.
 */
export const MAPS_KEY: string | undefined = import.meta.env.VITE_MAPS_KEY || undefined;
