/** What a copy's status says where the clipboard refused it and the words were selected instead. */
export const REFUSED_STATUS = "Selected: copy it with ⌘C or Ctrl+C";

/**
 * Copies `text`, `source`'s own by default, saying whether it could. Where the clipboard is
 * refused (a browser's policy, a page off HTTPS, which has none) `source` is selected instead, for
 * the reader's keys.
 */
export async function copyOrSelect(
  source: Element,
  text = source.textContent ?? "",
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error_) {
    console.warn("Maplace.js site: the clipboard refused the copy", error_);
    selectForKeys(source);
    return false;
  }
}

/** Selects `source` whole, its folds opened: what they hide is part of what the reader copies. */
function selectForKeys(source: Element): void {
  for (const fold of source.querySelectorAll("details")) fold.open = true;
  getSelection()?.selectAllChildren(source);
}
