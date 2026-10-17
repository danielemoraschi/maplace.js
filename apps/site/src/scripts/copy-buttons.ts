/** How long a button says what it did before going back to its label. */
const FEEDBACK_MS = 2_000;

/** Every `[data-copy]` button under `root` copies the text of the element it names by id. */
export function startCopyButtons(
  root: ParentNode,
  clipboard: Pick<Clipboard, "writeText"> = navigator.clipboard,
): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    const label = button.textContent;
    button.addEventListener("click", async () => {
      const source = button.ownerDocument.getElementById(button.dataset.copy ?? "");
      try {
        await clipboard.writeText(source?.textContent ?? "");
        button.textContent = "Copied";
      } catch {
        button.textContent = "Couldn't copy";
      }
      setTimeout(() => {
        button.textContent = label;
      }, FEEDBACK_MS);
    });
  }
}
