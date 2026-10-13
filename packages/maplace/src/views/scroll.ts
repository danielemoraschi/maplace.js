/**
 * Scrolls `list` just enough to show `option`, within the list's own box. Not `scrollIntoView`,
 * which scrolls every scrollable ancestor: the page would jump on a map click.
 */
export function scrollOptionIntoList(list: Element, option: Element): void {
  const box = list.getBoundingClientRect();
  const shown = option.getBoundingClientRect();
  if (shown.top < box.top) list.scrollTop -= box.top - shown.top;
  else if (shown.bottom > box.bottom) list.scrollTop += shown.bottom - box.bottom;
}
