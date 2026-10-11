// Shared by the vanilla examples: the page provides the containers, Maps JS is loaded by
// Google's bootstrap snippet (or js-api-loader) before these modules run.
export function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing from the page`);
  return element;
}
