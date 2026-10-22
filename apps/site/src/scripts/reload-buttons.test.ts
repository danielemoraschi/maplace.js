// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { startReloadButtons } from "./reload-buttons.ts";

function notePage() {
  document.body.innerHTML = `<p><span data-map-failure></span> <button data-map-reload>Reload the page</button></p><button id="other">Other</button>`;
  const reload = vi.fn();
  startReloadButtons(document, reload);
  return reload;
}

describe("startReloadButtons", () => {
  it("reloads the page on a failure note's button", () => {
    const reload = notePage();
    document.querySelector<HTMLButtonElement>("[data-map-reload]")?.click();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("leaves other buttons alone", () => {
    const reload = notePage();
    document.querySelector<HTMLButtonElement>("#other")?.click();
    expect(reload).not.toHaveBeenCalled();
  });
});
