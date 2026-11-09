/**
 * Test-only, by `--import` (`testBuildEnv`): a site build's npm, which has no version of the
 * package, so the build pins the CDN scripts it builds (`cdn-pin.ts`) and downloads nothing, as
 * npm counts every download in the package's stats. Any other address throws: a build fetches
 * nothing else.
 */
globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  if (url.startsWith("https://registry.npmjs.org/"))
    return new Response("not found", { status: 404 });
  throw new Error(`a test build of the site asked the network for ${url}`);
}) as typeof fetch;
