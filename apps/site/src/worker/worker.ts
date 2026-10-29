import { STAR_COUNT_PATH } from "../site/star-count-api.ts";
import { answerStarCount } from "./github-stars.ts";

/** What Cloudflare gives the Worker: the site's static assets, and GitHub's token (a secret). */
export interface SiteEnv {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  readonly GITHUB_STARS_TOKEN?: string;
}

/**
 * The site's Worker (W44): a GET of the star count is answered here, anything else by the static
 * assets, which serve the 404 page for an address with none.
 */
export default {
  fetch(request: Request, env: SiteEnv): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET" || pathname !== STAR_COUNT_PATH) return env.ASSETS.fetch(request);
    return answerStarCount(request, {
      // Async, so a platform without a cache (behind Access) rejects, which is a miss, not a throw.
      cache: async () => caches.open("star-count"),
      token: env.GITHUB_STARS_TOKEN,
      // A wrapper: workerd refuses `fetch` called as another object's method.
      ask: (input, init) => fetch(input, init),
    });
  },
};
