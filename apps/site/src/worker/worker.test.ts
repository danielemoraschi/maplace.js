import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type SiteEnv } from "./worker.ts";

const SITE = "https://maplacejs.com";

function siteEnv(): SiteEnv & { ASSETS: { fetch: ReturnType<typeof vi.fn> } } {
  return { ASSETS: { fetch: vi.fn(async () => new Response("asset")) } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the site's Worker", () => {
  it("answers a GET of the star count, asking GitHub through fetch called on its own", async () => {
    const fetchStub = vi.fn(async () => Response.json({ stargazers_count: 5 }));
    vi.stubGlobal("fetch", fetchStub);
    vi.stubGlobal("caches", {
      open: async () => {
        throw new Error("no cache here");
      },
    });
    const answer = await worker.fetch(new Request(`${SITE}/api/stars`), siteEnv());
    expect(await answer.json()).toEqual({ stars: 5 });
    // workerd throws "Illegal invocation" for fetch called as another object's method; Node
    // doesn't, so its `this` is what tells.
    expect(fetchStub.mock.contexts[0]).toBeUndefined();
  });

  it("answers the star count when the platform has no cache at all, as behind Access", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ stargazers_count: 5 })),
    );
    vi.stubGlobal("caches", undefined);
    const answer = await worker.fetch(new Request(`${SITE}/api/stars`), siteEnv());
    expect(await answer.json()).toEqual({ stars: 5 });
  });

  it("hands anything else to the static assets, a POST of the star count too", async () => {
    const env = siteEnv();
    for (const request of [
      new Request(`${SITE}/no-such-page`),
      new Request(`${SITE}/api/stars`, { method: "POST" }),
    ]) {
      expect(await (await worker.fetch(request, env)).text()).toBe("asset");
    }
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(2);
  });
});
