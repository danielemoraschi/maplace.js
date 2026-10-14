/** Makes `element`'s size settable by a test, as layout would set it; returns that size. */
export function sizeable(element: HTMLElement, width: number, height: number) {
  const size = { width, height };
  Object.defineProperty(element, "clientWidth", { get: () => size.width });
  Object.defineProperty(element, "clientHeight", { get: () => size.height });
  return size;
}

/** A new element whose size a test sets. */
export function sizedElement(width: number, height: number) {
  const element = document.createElement("div");
  return { element, size: sizeable(element, width, height) };
}
