import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type { MountContext } from "../adapter";
import { MaplaceError } from "../errors";
import { MAP_FAILURE_CLASS, MAP_FAILURE_WORDS } from "../map-failure-words";
import { queried } from "../testing/queried";
import { createMapFailureNotice } from "./map-failure";

const failure = new MaplaceError("provider-load-failed", "mount: failed");

afterEach(() => {
  document.body.replaceChildren();
  document.body.style.margin = "";
});

/** A container holding a map's element filling it, and a sibling after it. */
function mapIn(containerStyle: string) {
  const container = document.createElement("div");
  container.style.cssText = containerStyle;
  const map = document.createElement("div");
  map.style.cssText = "width:100%;height:100%;background:#cde";
  container.append(map);
  const sibling = document.createElement("div");
  document.body.append(container, sibling);
  sibling.textContent = "after the map";
  return { container, map, sibling };
}

async function failIn(container: HTMLElement): Promise<void> {
  const context = { container, signal: new AbortController().signal } as unknown as MountContext;
  const mount = createMapFailureNotice().mounting(() => Promise.reject(failure));
  await expect(mount(context)).rejects.toBe(failure);
}

const rects = (...nodes: Element[]) => nodes.map((node) => node.getBoundingClientRect().toJSON());
const wordsIn = (container: Element) => queried(container, `.${MAP_FAILURE_CLASS}>*`);

describe("the map failure panel's layout", () => {
  it.each([
    ["static", "width:400px;height:300px"],
    ["overflow:hidden", "width:400px;height:300px;overflow:hidden"],
    ["bordered", "width:400px;height:300px;border:3px solid"],
  ])("its words show over a %s container's map, which doesn't move", async (_, style) => {
    document.body.style.margin = "0";
    const { container, map, sibling } = mapIn(style);
    const before = rects(container, map, sibling);
    await failIn(container);
    expect(rects(container, map, sibling)).toEqual(before);
    const words = wordsIn(container).getBoundingClientRect();
    const atWords = document.elementFromPoint(
      words.left + words.width / 2,
      words.top + words.height / 2,
    );
    expect(atWords).toBe(wordsIn(container));
    const top = container.getBoundingClientRect().top;
    expect(words.top).toBeGreaterThan(top);
    expect(words.top).toBeLessThan(top + 30);
  });

  it("shows in a container of no height", async () => {
    const { container } = mapIn("width:400px;height:0");
    await failIn(container);
    expect(wordsIn(container).getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it("is named by role alert in the accessibility tree", async () => {
    const { container } = mapIn("width:400px;height:300px");
    await failIn(container);
    expect(page.getByRole("alert").element().textContent).toBe(MAP_FAILURE_WORDS);
  });

  it("a page's .maplace-map-failure{display:none} removes it", async () => {
    const rule = document.body.appendChild(document.createElement("style"));
    rule.textContent = `.${MAP_FAILURE_CLASS}{display:none}`;
    const { container } = mapIn("width:400px;height:300px");
    await failIn(container);
    expect(wordsIn(container).getBoundingClientRect().height).toBe(0);
  });

  it("under data-maplace-unstyled the map still doesn't move, and the words show", async () => {
    const { container, map, sibling } = mapIn("width:400px;height:300px");
    container.setAttribute("data-maplace-unstyled", "");
    const before = rects(container, map, sibling);
    await failIn(container);
    expect(rects(container, map, sibling)).toEqual(before);
    expect(wordsIn(container).getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
