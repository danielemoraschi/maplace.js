/**
 * Where browser tests are served from when the port is free: the one referrer the tests' Maps key
 * allows. Read by `vitest.config.ts` (`api.port`), and checked by the Maps tests.
 */
export const MAPS_TEST_PORT = 63315;
export const MAPS_TEST_ORIGIN = `http://localhost:${MAPS_TEST_PORT}`;
