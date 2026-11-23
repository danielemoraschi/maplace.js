/**
 * A code block: Shiki's, from an example's file or a doc's Markdown, or a host page with Google's
 * loader folded (`FoldedHost.astro`), whose blocks are one file.
 */
const CODE_BLOCKS = ".folded-host, pre.astro-code";
const FOLDED_HOST = ".folded-host";
/** The frame a code block goes into, from `CodeCopyTemplate.astro`. */
export const CODE_FRAME = "[data-code-frame]";

/**
 * Every code block under `root` gets a copy of `template`'s frame (`CodeCopyTemplate.astro`): the
 * block goes in first, the frame's copy button and status after it, which `copy-buttons.ts` then
 * starts. The block is the button's source: its text, or a folded host's whole file.
 */
export function addCodeCopyButtons(root: ParentNode, template: HTMLTemplateElement): void {
  const frame = template.content.firstElementChild;
  if (!(frame instanceof HTMLElement)) throw new Error(`#${template.id} holds no frame element`);
  for (const block of root.querySelectorAll<HTMLElement>(CODE_BLOCKS)) {
    // A folded host's parts are one file: its own frame copies them.
    if (block.parentElement?.closest(FOLDED_HOST)) continue;
    const framed = frame.cloneNode(true) as HTMLElement;
    block.dataset.copySource = "";
    block.replaceWith(framed);
    framed.prepend(block);
  }
}
