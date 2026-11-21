/** What a copy's status says where the clipboard refused it and the words were selected instead. */
export const REFUSED_STATUS = "Selected: copy it with ⌘C or Ctrl+C";

/**
 * Copies `source`'s text, saying whether it could. Where the clipboard is refused (a browser's
 * policy, a page off HTTPS, which has none) the text is selected instead, for the reader's keys.
 */
export async function copyOrSelect(source: Element): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(source.textContent ?? "");
    return true;
  } catch (error_) {
    console.warn("Maplace.js site: the clipboard refused the copy", error_);
    getSelection()?.selectAllChildren(source);
    return false;
  }
}
