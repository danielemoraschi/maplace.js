import { reveal } from "./reveal.ts";

/**
 * Every `[data-version-switch]` radio group under `root` chooses which version of its example
 * the section's frame shows: the `[data-live-version]` of that value, faded in, the other two
 * hidden at once. The page renders the HTML version chosen and shown.
 */
export function startVersionSwitches(root: ParentNode): void {
  for (const group of root.querySelectorAll<HTMLElement>("[data-version-switch]")) {
    const example = group.dataset.versionSwitch ?? "";
    group.addEventListener("change", (event) => {
      const chosen = (event.target as HTMLInputElement).value;
      for (const version of versionsOf(root, example)) {
        reveal(version, version.dataset.liveVersion === chosen);
      }
    });
  }
}

function versionsOf(root: ParentNode, example: string): NodeListOf<HTMLElement> {
  return root.querySelectorAll<HTMLElement>(`[data-live-version][data-example="${example}"]`);
}
