import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { answerStarCount, type StarCountSources } from "./github-stars.ts";

const REQUEST = new Request("https://maplacejs.com/api/stars");
const GITHUB_API = "https://api.github.com/repos/danielemoraschi/maplace.js";

const github = (body: unknown, status = 200) => vi.fn(async () => Response.json(body, { status }));

/**
 * Sources over a cache keyed by URL, `stored`, whose `put` stores only after a pause, as
 * Cloudflare's does: a put the answer doesn't wait for is still pending when the test looks.
 */
function sources(overrides: Partial<StarCountSources> = {}) {
  const stored = new Map<string, Response>();
  const cache = {
    match: async (key: string) => stored.get(key)?.clone(),
    put: async (key: string, response: Response) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      stored.set(key, response);
    },
  } as unknown as Cache;
  const ask = github({ stargazers_count: 1234 });
  return {
    stored,
    ask,
    sources: { cache: async () => cache, token: "token", ask, ...overrides },
  };
}

/** The request `ask` was first called with: its URL and its headers. */
function askedOf(ask: ReturnType<typeof vi.fn>) {
  const [url, init] = ask.mock.calls[0] as [string, RequestInit];
  return { url, headers: init.headers };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("answerStarCount", () => {
  it("answers from the cache without asking GitHub", async () => {
    const { stored, ask, sources: from } = sources();
    stored.set(REQUEST.url, Response.json({ stars: 7 }));
    expect(await (await answerStarCount(REQUEST, from)).json()).toEqual({ stars: 7 });
    expect(ask).not.toHaveBeenCalled();
  });

  it("tells browsers an hour from now, whatever age the cached count has", async () => {
    const { stored, sources: from } = sources();
    const aged = {
      "Cache-Control": "public, max-age=172800",
      Age: "108000",
      "cf-cache-status": "HIT",
    };
    stored.set(REQUEST.url, Response.json({ stars: 7 }, { headers: aged }));
    const answer = await answerStarCount(REQUEST, from);
    expect(answer.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(answer.headers.has("Age")).toBe(false);
    expect(answer.headers.has("cf-cache-status")).toBe(false);
  });

  it("answers a URL with a query from the same cached entry", async () => {
    const { stored, ask, sources: from } = sources();
    stored.set(REQUEST.url, Response.json({ stars: 7 }));
    const request = new Request(`${REQUEST.url}?n=42`);
    expect(await (await answerStarCount(request, from)).json()).toEqual({ stars: 7 });
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks GitHub for the repo's count with the token and a User-Agent, keeping it 48 hours and telling browsers an hour", async () => {
    const { stored, ask, sources: from } = sources();
    const answer = await answerStarCount(REQUEST, from);
    expect(await answer.json()).toEqual({ stars: 1234 });
    expect(answer.headers.get("Cache-Control")).toBe("public, max-age=3600");
    const { url, headers } = askedOf(ask);
    expect(url).toBe(GITHUB_API);
    expect(headers).toMatchObject({ Authorization: "Bearer token", "User-Agent": "maplacejs.com" });
    expect(stored.get(REQUEST.url)?.headers.get("Cache-Control")).toBe("public, max-age=172800");
    expect(await stored.get(REQUEST.url)?.json()).toEqual({ stars: 1234 });
  });

  it("asks GitHub without authorization when no token is set", async () => {
    const { ask, sources: from } = sources({ token: undefined });
    await answerStarCount(REQUEST, from);
    expect(askedOf(ask).headers).not.toHaveProperty("Authorization");
  });

  it("answers from GitHub, caching nothing, when the cache can't be opened", async () => {
    const cache = async () => {
      throw new Error("no cache behind Access");
    };
    const { sources: from } = sources({ cache });
    expect(await (await answerStarCount(REQUEST, from)).json()).toEqual({ stars: 1234 });
  });

  it("answers from GitHub when the cache can't be read, and despite a cache that can't be written", async () => {
    for (const failing of ["match", "put"] as const) {
      const cache = {
        match: async () => undefined,
        put: async () => undefined,
        [failing]: async () => {
          throw new Error(`no ${failing} here`);
        },
      } as unknown as Cache;
      const { sources: from } = sources({ cache: async () => cache });
      expect(await (await answerStarCount(REQUEST, from)).json(), failing).toEqual({ stars: 1234 });
    }
  });

  it("answers 503, caching nothing, when GitHub answers with an error", async () => {
    const { stored, sources: from } = sources({ ask: github({ message: "Bad credentials" }, 401) });
    const answer = await answerStarCount(REQUEST, from);
    expect(answer.status).toBe(503);
    expect(answer.headers.get("Cache-Control")).toBe("no-store");
    expect(await answer.json()).toEqual({ error: "star count unavailable" });
    expect(stored.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      "star count unavailable:",
      new Error("GitHub answered 401"),
    );
  });

  it("answers 503 when GitHub's answer has no count", async () => {
    const { sources: from } = sources({ ask: github({ stargazers_count: -1 }) });
    expect((await answerStarCount(REQUEST, from)).status).toBe(503);
  });

  it("answers 503 when the request to GitHub fails", async () => {
    const ask = vi.fn(async () => {
      throw new TypeError("network down");
    });
    const { sources: from } = sources({ ask });
    expect((await answerStarCount(REQUEST, from)).status).toBe(503);
  });
});
