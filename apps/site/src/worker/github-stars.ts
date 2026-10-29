import { REPOSITORY_URL } from "../site/repo-docs.ts";
import { isStarCount, STAR_COUNT_PATH } from "../site/star-count-api.ts";

/** Where the star count comes from: the Worker's cache, GitHub's token, and `fetch`. */
export interface StarCountSources {
  readonly cache: () => Promise<Cache>;
  readonly token: string | undefined;
  readonly ask: typeof fetch;
}

/** How long the cache keeps a count: 48 hours (the user, W44). */
const CACHED_FOR = "public, max-age=172800";
/** How long a browser keeps one: an hour, so a cached count reaches it soon after a refresh. */
const KEPT_BY_BROWSERS = "public, max-age=3600";

const GITHUB_REPO_API = `https://api.github.com/repos${new URL(REPOSITORY_URL).pathname}`;

/**
 * The site's answer to `request` for its star count: the cached count, else GitHub's, cached for
 * 48 hours; a 503 when GitHub can't give one. Keyed by the path, so a query can't miss on
 * purpose.
 */
export async function answerStarCount(
  request: Request,
  sources: StarCountSources,
): Promise<Response> {
  const key = new URL(STAR_COUNT_PATH, request.url).href;
  // A cache that fails, as behind Cloudflare Access where there is none, is only a miss.
  const cache = await sources.cache().catch(() => undefined);
  const cached = await cache?.match(key).catch(() => undefined);
  if (cached) return forBrowsers(cached);
  const stars = await countFromGitHub(sources).catch((reason: unknown) => {
    // Seen live with `wrangler tail` (an expired token answers 401); observability keeps nothing.
    console.warn("star count unavailable:", reason);
    return undefined;
  });
  if (stars === undefined) return unavailable();
  const answer = starCountResponse(stars);
  // Awaited, so the put isn't cut off with the response: a miss comes once in 48 hours.
  await cache?.put(key, answer.clone()).catch(() => undefined);
  return forBrowsers(answer);
}

/** The repository's star count from GitHub's API; throws, naming why, when it gives none. */
async function countFromGitHub({ token, ask }: StarCountSources): Promise<number> {
  const response = await ask(GITHUB_REPO_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "maplacejs.com",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const { stargazers_count: stars } = (await response.json()) as { stargazers_count?: unknown };
  const count = { stars };
  if (!isStarCount(count)) throw new Error("GitHub's answer has no star count");
  return count.stars;
}

function starCountResponse(stars: number): Response {
  return Response.json({ stars }, { headers: { "Cache-Control": CACHED_FOR } });
}

/** `answer` as browsers get it: kept an hour from now, whatever age the cached copy has. */
function forBrowsers(answer: Response): Response {
  const response = new Response(answer.body, answer);
  response.headers.set("Cache-Control", KEPT_BY_BROWSERS);
  response.headers.delete("Age");
  response.headers.delete("cf-cache-status");
  return response;
}

function unavailable(): Response {
  return Response.json(
    { error: "star count unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
