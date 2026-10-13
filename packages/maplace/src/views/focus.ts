/** The keys that move focus within the list, by what they do. */
export const KEYS = {
  next: "ArrowDown",
  previous: "ArrowUp",
  first: "Home",
  last: "End",
} as const;

/** The keys that choose the focused entry. */
export const CHOOSE_KEYS: ReadonlySet<string> = new Set(["Enter", " "]);

/** Where `key` moves focus from `index` among `count` entries; undefined if it doesn't. */
export function nextFocus(index: number, key: string, count: number): number | undefined {
  if (count === 0) return undefined;
  switch (key) {
    case KEYS.next:
      return Math.min(index + 1, count - 1);
    case KEYS.previous:
      return Math.max(index - 1, 0);
    case KEYS.first:
      return 0;
    case KEYS.last:
      return count - 1;
    default:
      return undefined;
  }
}
