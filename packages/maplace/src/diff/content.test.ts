// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { contentRenderer, sameContentSource } from "./content";

const at = { lat: 0, lng: 0 };

function render(location: Location, sanitize?: (html: string) => string): Node {
  const renderContent = contentRenderer(location, sanitize);
  if (renderContent === undefined) throw new Error("expected content");
  return renderContent();
}

describe("contentRenderer", () => {
  it("is undefined without content or html", () => {
    expect(contentRenderer({ id: "a", ...at, title: "A" }, undefined)).toBeUndefined();
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
    const renderContent = contentRenderer(location, undefined);
    expect(renderContent?.().textContent).toBe("a");
    renderContent?.();
    expect(content).toHaveBeenCalledTimes(2);
    expect(content).toHaveBeenCalledWith(location);
  });

  it("parses html only after sanitizing it, once however many renders", () => {
    const sanitize = vi.fn((html: string) => html.replace(/<script.*<\/script>/, ""));
    const renderContent = contentRenderer(
      { id: "a", ...at, html: "<b>hi</b><script>x()</script>" },
      sanitize,
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

describe("contentRenderer without a sanitizer", () => {
  it("refuses html, even past validation", () => {
    expect(() => contentRenderer({ id: "a", ...at, html: "<b>x</b>" }, undefined)).toThrow(
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
