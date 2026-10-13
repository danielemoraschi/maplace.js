/**
 * The Maps API key the Maps tests load Google with: `VITE_MAPS_KEY` in `.env.local`, or the
 * `MAPS_KEY` secret in CI. Restricted to `MAPS_TEST_ORIGIN`; without it, the tests that need Maps
 * are skipped.
 */
export const MAPS_KEY: string | undefined = viteEnvironment().VITE_MAPS_KEY || undefined;

/**
 * Vite's environment, typed here only: nothing else in src may read it, and the published build
 * has no Vite to fill it.
 */
function viteEnvironment(): { readonly VITE_MAPS_KEY?: string } {
  return (import.meta as ImportMeta & { env: { VITE_MAPS_KEY?: string } }).env;
}
