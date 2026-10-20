/** A link to the repo that GitHub's own button, with its star count, takes the place of. */
const STAR_LINK = "a.github-button";

type GitHubButtons = Pick<typeof import("github-buttons"), "render">;

/**
 * Each star link under `root` becomes GitHub's button: drawn on the page (no iframe), its count
 * asked of GitHub's API, a button without a count when that fails. GitHub's script loads only on
 * a page that has one.
 */
export async function startStarButtons(
  root: ParentNode,
  load: () => Promise<GitHubButtons> = () => import("github-buttons"),
): Promise<void> {
  const links = [...root.querySelectorAll<HTMLAnchorElement>(STAR_LINK)];
  if (links.length === 0) return;
  const { render } = await load();
  for (const link of links) render(link, (button) => link.replaceWith(button));
}
