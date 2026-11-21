/** A point on the test page, in CSS pixels. */
interface PagePoint {
  readonly x: number;
  readonly y: number;
}

/** How far `element`'s middle is from `point`, across or down, whichever is more. */
export function offPoint(element: Element, point: PagePoint): number {
  const box = element.getBoundingClientRect();
  const across = Math.abs(box.left + box.width / 2 - point.x);
  const down = Math.abs(box.top + box.height / 2 - point.y);
  return Math.max(across, down);
}
