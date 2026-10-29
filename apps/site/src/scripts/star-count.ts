import { starCountMarkup } from "../site/star-button-markup.ts";
import { isStarCount, STAR_COUNT_PATH } from "../site/star-count-api.ts";

/** A star button the page draws: its shadow root holds GitHub's button (`star-button-markup.ts`). */
const STAR_BUTTON = "[data-star-button]";

/**
 * Puts the repository's star count, asked of the site itself (W44), beside each star button under
 * `root`. A page without one asks nothing. No `Accept` header: a server that has no count answers
 * HTML, which ends here as no count, rather than a 404 the browser would log.
 */
export async function showStarCount(root: ParentNode, ask: typeof fetch = fetch): Promise<void> {
  const buttons = [...root.querySelectorAll<HTMLElement>(STAR_BUTTON)];
  if (buttons.length === 0) return;
  const count = await askedCount(ask);
  if (count === undefined) return;
  for (const { shadowRoot } of buttons) {
    const repository = shadowRoot?.querySelector<HTMLAnchorElement>(".btn")?.href;
    if (repository === undefined) continue;
    shadowRoot
      ?.querySelector(".widget")
      ?.insertAdjacentHTML("beforeend", starCountMarkup(count, repository));
  }
}

/** The site's star count, or none when it can't give one: the button then shows without it. */
async function askedCount(ask: typeof fetch): Promise<number | undefined> {
  try {
    const response = await ask(STAR_COUNT_PATH);
    const answer: unknown = response.ok ? await response.json() : undefined;
    return isStarCount(answer) ? answer.stars : undefined;
  } catch {
    // A failed request or HTML for JSON: the button is drawn already, and stays without a count.
    return undefined;
  }
}
