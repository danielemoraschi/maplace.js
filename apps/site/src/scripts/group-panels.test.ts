// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { type ExampleGroup, findGroupAtPath } from "../examples/example-sections.ts";
import { fetchGroupPanel } from "./group-panels.ts";

const LISTS = findGroupAtPath("/examples/lists/") as ExampleGroup;
const SHAPES = findGroupAtPath("/examples/shapes/") as ExampleGroup;

/** `fetch` answering `body` with `status`. */
function answering(body: string, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  );
}

const LISTS_PAGE = `<!doctype html><html><head><title>Lists</title></head><body>
  <header>maplacejs</header>
  <div data-group-panel="lists"><section id="menu"><h2>04 Menu</h2></section></div>
</body></html>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchGroupPanel", () => {
  it("returns the group's panel from its page, in this document and hidden", async () => {
    answering(LISTS_PAGE);
    const panel = await fetchGroupPanel(LISTS, document);
    expect(panel.ownerDocument).toBe(document);
    expect(panel.hidden).toBe(true);
    expect(panel.querySelector("h2")?.textContent).toBe("04 Menu");
    expect(fetch).toHaveBeenCalledWith("/examples/lists/");
  });

  it("throws naming the page when it answers with an error", async () => {
    answering("Not found", 404);
    await expect(fetchGroupPanel(LISTS, document)).rejects.toThrow(
      "group page /examples/lists/ answered 404",
    );
  });

  it("throws naming the page when it holds no panel of the group", async () => {
    answering(LISTS_PAGE);
    await expect(fetchGroupPanel(SHAPES, document)).rejects.toThrow(
      "group page /examples/shapes/ has no shapes panel",
    );
  });
});
