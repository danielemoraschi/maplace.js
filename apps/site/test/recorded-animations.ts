import type { Page } from "playwright";

/**
 * The ids of the elements the page animated, recorded as each animation starts: a 600 ms fade can
 * end before a test's next look at the page, on a busy machine.
 */
export async function recordAnimations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const animated: string[] = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args) {
      animated.push(this.id);
      return animate.apply(this, args);
    };
    Object.assign(globalThis, { animated });
  });
  return () => page.evaluate(() => (globalThis as unknown as { animated: string[] }).animated);
}
