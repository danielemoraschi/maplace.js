// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startCodeFolds } from "./code-fold.ts";

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

/** A frame around a block marked as the build marks it: `lines` long, foldable or not. */
function frameOf(lines: number, foldable = true) {
  const marks = `data-lines="${lines}"${foldable ? " data-foldable" : ""}`;
  document.body.innerHTML = `<div data-code-frame><pre class="astro-code" ${marks}><code>a</code></pre><div data-code-fold><button type="button"></button></div></div>`;
  const frame = document.querySelector<HTMLElement>("[data-code-frame]") as HTMLElement;
  const block = frame.firstElementChild as HTMLElement;
  const button = frame.querySelector("button") as HTMLButtonElement;
  return { frame, block, button };
}

describe("startCodeFolds", () => {
  it("unmarks a foldable block no frame holds, so nothing clips it with no button to open it", () => {
    document.body.innerHTML = '<pre class="astro-code" data-foldable data-lines="29"></pre>';
    startCodeFolds(document);
    expect(document.querySelector("pre")?.hasAttribute("data-foldable")).toBe(false);
  });

  it("folds a block marked foldable, naming its lines on the button", () => {
    const { frame, block, button } = frameOf(29);
    startCodeFolds(document);
    expect(frame.dataset.fold).toBe("folded");
    expect([button.textContent, button.getAttribute("aria-expanded")]).toEqual([
      "Show all 29 lines",
      "false",
    ]);
    expect(button.getAttribute("aria-controls")).toBe(block.id);
  });

  it("folds a framed block in a hidden tab as well, its height set by CSS", () => {
    const { frame } = frameOf(29);
    frame.hidden = true;
    startCodeFolds(document);
    expect(frame.dataset.fold).toBe("folded");
  });

  it("leaves a block not marked foldable whole", () => {
    const { frame } = frameOf(12, false);
    startCodeFolds(document);
    expect(frame.dataset.fold).toBeUndefined();
  });

  it("folds on a page that isn't a secure context, as over a LAN address, where crypto.randomUUID is missing", () => {
    vi.stubGlobal("crypto", {});
    const { frame, block, button } = frameOf(29);
    startCodeFolds(document);
    expect([button.textContent, button.getAttribute("aria-controls")]).toEqual([
      "Show all 29 lines",
      block.id,
    ]);
    expect(block.id).not.toBe("");
  });

  it("opens and folds again on its button", () => {
    const { frame, button } = frameOf(29);
    button.scrollIntoView = vi.fn();
    startCodeFolds(document);
    button.click();
    expect([frame.dataset.fold, button.textContent, button.getAttribute("aria-expanded")]).toEqual([
      "open",
      "Show less",
      "true",
    ]);
    button.click();
    expect([frame.dataset.fold, button.getAttribute("aria-expanded")]).toEqual(["folded", "false"]);
    expect(button.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("opens where the page's search scrolls a folded block, the match kept in view", () => {
    const { frame, block } = frameOf(29);
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    startCodeFolds(document);
    block.scrollTop = 120;
    block.dispatchEvent(new Event("scroll"));
    expect([frame.dataset.fold, block.scrollTop]).toEqual(["open", 0]);
    expect(scrollBy).toHaveBeenCalledWith(0, 120);
  });

  it("stays folded for a sideways scroll", () => {
    const { frame, block } = frameOf(29);
    startCodeFolds(document);
    block.scrollLeft = 40;
    block.dispatchEvent(new Event("scroll"));
    expect(frame.dataset.fold).toBe("folded");
  });
});
