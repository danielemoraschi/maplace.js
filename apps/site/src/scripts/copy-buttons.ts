import { copyText } from "./copy-text.ts";

/** How long "Copied" stays in a command's status. */
export const COPIED_SHOWN_MS = 1400;

/**
 * Every `[data-copy]` button under `root` copies its command on a click, marks what came of it
 * (`data-copied`: `done` or `refused`) and says so in the `[role=status]` beside it
 * (`CopyCommand.astro`): "Copied", cleared after a while, or how to copy it where the clipboard is
 * refused, which stays.
 */
export function startCopyButtons(root: ParentNode): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    const status = button.parentElement?.querySelector<HTMLElement>('[role="status"]');
    if (!status) continue;
    let clearing: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener("click", async () => {
      const copied = await copyText(button.dataset.copy ?? "");
      // After the copy: a click still copying when another came would set its own timer.
      clearTimeout(clearing);
      button.dataset.copied = copied ? "done" : "refused";
      status.textContent = copied ? "Copied" : "Select the command to copy it";
      if (copied) clearing = setTimeout(() => clearStatus(button, status), COPIED_SHOWN_MS);
    });
  }
}

function clearStatus(button: HTMLElement, status: HTMLElement): void {
  delete button.dataset.copied;
  status.textContent = "";
}
