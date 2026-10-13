// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { contentRenderer, sameContentSource } from "./content";

const at = { lat: 0, lng: 0 };
const NO_REPORT = () => {};

function render(location: Location, sanitize?: (html: string) => string): Node {
  const node = contentRenderer(location, { sanitize, report: NO_REPORT })?.();
  if (node === undefined) throw new Error("expected content");
  return node;
}

describe("contentRenderer", () => {
  it("is undefined without content or html", () => {
    expect(
      contentRenderer({ id: "a", ...at, title: "A" }, { sanitize: undefined, report: NO_REPORT }),
    ).toBeUndefined();
  });

  it("renders a string as text, never as HTML", () => {
    const node = render({ id: "a", ...at, content: "<b>bold</b>" });
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe("<b>bold</b>");
  });

  it("returns a Node as the same node", () => {
    const node = document.createElement("p");
    expect(render({ id: "a", ...at, content: node })).toBe(node);
  });

  it("calls a function with the location on each render", () => {
    const content = vi.fn((location: Location) => document.createTextNode(location.id));
    const location: Location = { id: "a", ...at, content };
    const renderContent = contentRenderer(location, { sanitize: undefined, report: NO_REPORT });
    expect(renderContent?.()?.textContent).toBe("a");
    renderContent?.();
    expect(content).toHaveBeenCalledTimes(2);
    expect(content).toHaveBeenCalledWith(location);
  });

  it("parses html only after sanitizing it, once however many renders", () => {
    const sanitize = vi.fn((html: string) => html.replace(/<script.*<\/script>/, ""));
    const renderContent = contentRenderer(
      { id: "a", ...at, html: "<b>hi</b><script>x()</script>" },
      { sanitize, report: NO_REPORT },
    );
    expect(sanitize).not.toHaveBeenCalled();
    const first = renderContent?.();
    const second = renderContent?.();
    expect(sanitize).toHaveBeenCalledTimes(1);
    expect(first).not.toBe(second);
    const holder = document.createElement("div");
    holder.append(first as Node);
    expect(holder.innerHTML).toBe("<b>hi</b>");
  });
});

describe("content that fails", () => {
  it("shows no content and reports a throwing content function", () => {
    const report = vi.fn();
    const renderContent = contentRenderer(
      { id: "a", ...at, content: () => "<b>not a node</b>" as unknown as Node },
      { sanitize: undefined, report },
    );
    expect(renderContent?.()).toBeUndefined();
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ field: "content" }));
  });

  it("reports a sanitizer that throws, under html", () => {
    const report = vi.fn();
    const sanitize = () => {
      throw new Error("sanitizer bug");
    };
    const renderContent = contentRenderer(
      { id: "a", ...at, html: "<b>x</b>" },
      { sanitize, report },
    );
    expect(renderContent?.()).toBeUndefined();
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ field: "html" }));
  });
});

describe("contentRenderer without a sanitizer", () => {
  it("refuses html, even past validation", () => {
    expect(() =>
      contentRenderer(
        { id: "a", ...at, html: "<b>x</b>" },
        { sanitize: undefined, report: NO_REPORT },
      ),
    ).toThrow(
      expect.objectContaining({ code: "missing-sanitizer", locationId: "a", field: "html" }),
    );
  });
});

describe("sameContentSource", () => {
  const node = document.createElement("p");

  it("holds while content and html keep their references", () => {
    expect(
      sameContentSource({ id: "a", ...at, content: node }, { id: "a", ...at, content: node }),
    ).toBe(true);
    expect(
      sameContentSource(
        { id: "a", ...at, html: "<b>x</b>" },
        { id: "a", ...at, html: "<b>x</b>", title: "new" },
      ),
    ).toBe(true);
    expect(sameContentSource({ id: "a", ...at }, { id: "a", ...at })).toBe(true);
  });

  it("fails when content or html changes", () => {
    expect(
      sameContentSource({ id: "a", ...at, content: "x" }, { id: "a", ...at, content: "y" }),
    ).toBe(false);
    expect(sameContentSource({ id: "a", ...at, content: "x" }, { id: "a", ...at, html: "x" })).toBe(
      false,
    );
  });

  it("fails for function content, which is called with the location object itself", () => {
    const content = () => node;
    expect(sameContentSource({ id: "a", ...at, content }, { id: "a", ...at, content })).toBe(false);
  });
});
