/** Every failure note's `[data-map-reload]` button under `root` reloads the page. */
export function startReloadButtons(root: ParentNode, reload: () => void): void {
  for (const button of root.querySelectorAll("[data-map-reload]")) {
    button.addEventListener("click", reload);
  }
}
