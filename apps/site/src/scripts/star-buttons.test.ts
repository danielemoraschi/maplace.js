// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { startStarButtons } from "./star-buttons.ts";

/** GitHub's `render`, drawing a button for the link it's given as a `<span>` naming its href. */
function githubButtons() {
  const render = vi.fn((link: unknown, done: (button: HTMLSpanElement) => void) => {
    const button = document.createElement("span");
    button.dataset.for = (link as HTMLAnchorElement).href;
    done(button);
  });
  return { render, load: vi.fn(async () => ({ render })) };
}

describe("startStarButtons", () => {
  it("puts GitHub's button in place of each star link", async () => {
    document.body.innerHTML = '<a class="github-button" href="https://github.com/o/r">Star</a>';
    const { load } = githubButtons();
    await startStarButtons(document, load);
    expect(document.body.innerHTML).toBe('<span data-for="https://github.com/o/r"></span>');
  });

  it("loads nothing on a page without one", async () => {
    document.body.innerHTML = '<a href="https://github.com/o/r">GitHub</a>';
    const { load } = githubButtons();
    await startStarButtons(document, load);
    expect(load).not.toHaveBeenCalled();
  });
});
