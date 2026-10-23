import type { FakeAdapters } from "../fake/adapters";

/**
 * The page's `Maplace`, as the CDN scripts set it (W33), on the fake adapter: the core's, the
 * element's and both providers' functions in one, since every example shares one document and a
 * later click may reach an earlier map's. Every adapter it makes is among `adapters.made`. All
 * imported when asked for: each reaches the core, and a test's mock of the core, which may read
 * the test's own imports, must be in place first.
 */
export async function fakeMaplaceGlobal(adapters: FakeAdapters) {
  const [core, element, { fakeGoogleEntry }, { fakeMapLibreEntry }] = await Promise.all([
    import("../../index"),
    import("../../element/index"),
    import("./fake-google"),
    import("./fake-maplibre"),
  ]);
  return { ...core, ...element, ...fakeGoogleEntry(adapters), ...fakeMapLibreEntry(adapters) };
}
