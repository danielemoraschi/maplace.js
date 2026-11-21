import { copyOrSelect, REFUSED_STATUS } from "./copy-text.ts";

/** How long "Copied" stays in a command's status. */
export const COPIED_SHOWN_MS = 1400;

/**
 * Every `[data-copy]` button under `root` (`CopyButton.astro`) copies the `[data-copy-source]` beside
 * it on a click (its `data-copy-text` where it has one, else its text), marks what came of it
 * (`data-copied`: `done` or `refused`) and says so in the `[role=status]` beside it: "Copied",
 * cleared after a while, or, where the clipboard is refused, how to copy the words it selected,
 * which stays.
 */
export function startCopyButtons(root: ParentNode): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    const source = button.parentElement?.querySelector<HTMLElement>("[data-copy-source]");
    const status = button.parentElement?.querySelector<HTMLElement>('[role="status"]');
    if (!source || !status) continue;
    let clearing: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener("click", async () => {
      const copied = await copyOrSelect(source, source.dataset.copyText);
      // After the copy: a click still copying when another came would set its own timer.
      clearTimeout(clearing);
      button.dataset.copied = copied ? "done" : "refused";
      status.textContent = copied ? "Copied" : REFUSED_STATUS;
      if (copied) clearing = setTimeout(() => clearStatus(button, status), COPIED_SHOWN_MS);
    });
  }
}

function clearStatus(button: HTMLElement, status: HTMLElement): void {
  delete button.dataset.copied;
  status.textContent = "";
}
