/**
 * A framed code block (`code-copy.ts`) marked foldable when the site was built (`foldable-code.ts`)
 * is drawn folded from the first paint (`styles/code.css`): this shows the fade and the button that
 * opens it, then folds it again (`CodeCopyTemplate.astro`). Without scripts every block shows whole.
 */

import { CODE_FRAME } from "./code-copy.ts";

/** The blocks folded so far, naming each the next: `crypto.randomUUID` needs a secure context. */
let folded = 0;

/** Gives each framed foldable block under `root` its fold. */
export function startCodeFolds(root: ParentNode): void {
  unmarkUnframed(root);
  for (const frame of root.querySelectorAll<HTMLElement>(CODE_FRAME)) fold(frame);
}

/**
 * Unmarks each foldable block no frame holds (outside `main`, or with no frame on the page): it
 * would stay clipped with no button to open it.
 */
function unmarkUnframed(root: ParentNode): void {
  for (const block of root.querySelectorAll<HTMLElement>("[data-foldable]:not(.folded-host *)")) {
    if (!block.parentElement?.matches(CODE_FRAME)) delete block.dataset.foldable;
  }
}

/** Folds `frame`'s block if it was marked foldable. */
function fold(frame: HTMLElement): void {
  const block = frame.firstElementChild as HTMLElement | null;
  const button = frame.querySelector<HTMLButtonElement>(":scope > [data-code-fold] > button");
  if (block?.dataset.foldable === undefined || button === null) return;
  const control = foldControl(frame, block, button);
  control.close();
  button.addEventListener("click", () =>
    frame.dataset.fold === "open" ? control.close() : control.open(),
  );
  // The page's search scrolls a folded block to a match it clips: open it there instead.
  block.addEventListener("scroll", () => {
    if (frame.dataset.fold !== "folded" || block.scrollTop === 0) return;
    const scrolled = block.scrollTop;
    control.open();
    block.scrollTop = 0;
    window.scrollBy(0, scrolled);
  });
}

function foldControl(frame: HTMLElement, block: HTMLElement, button: HTMLButtonElement) {
  block.id ||= `folded-code-${++folded}`;
  button.setAttribute("aria-controls", block.id);
  const lines = block.dataset.lines;
  return {
    open() {
      frame.dataset.fold = "open";
      button.setAttribute("aria-expanded", "true");
      button.textContent = "Show less";
    },
    close() {
      const wasOpen = frame.dataset.fold === "open";
      frame.dataset.fold = "folded";
      button.setAttribute("aria-expanded", "false");
      button.textContent = `Show all ${lines} lines`;
      // Folded from below, the button stays where the reader is.
      if (wasOpen) button.scrollIntoView({ block: "nearest" });
    },
  };
}
