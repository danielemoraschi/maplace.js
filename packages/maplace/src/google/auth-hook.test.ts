import { describe, expect, it, vi } from "vitest";
import { createAuthHook } from "./auth-hook";

/** A window as far as the hook goes: where Google looks for `gm_authFailure`. */
type Page = { gm_authFailure?: () => void };

/** What Google does when it refuses the key. */
function refuseKey(page: Page): void {
  page.gm_authFailure?.();
}

describe("createAuthHook", () => {
  it("tells its listeners when Google refuses the key", () => {
    const page: Page = {};
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    refuseKey(page);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("still runs the page's own handler, set before it", () => {
    const pages = vi.fn();
    const page: Page = { gm_authFailure: pages };
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    refuseKey(page);
    expect([pages.mock.calls.length, listener.mock.calls.length]).toEqual([1, 1]);
  });

  it("still runs the page's own handler, set after it, and keeps listening", () => {
    const page: Page = {};
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    const pages = vi.fn();
    page.gm_authFailure = pages;
    refuseKey(page);
    expect([pages.mock.calls.length, listener.mock.calls.length]).toEqual([1, 1]);
  });

  it("wraps a handler the page declared as a global function, which can't be redefined", () => {
    const pages = vi.fn();
    const page: Page = {};
    Object.defineProperty(page, "gm_authFailure", {
      value: pages,
      writable: true,
      enumerable: true,
      configurable: false,
    });
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    refuseKey(page);
    expect([pages.mock.calls.length, listener.mock.calls.length]).toEqual([1, 1]);
  });

  it("tells its listeners even when the page's own handler throws", () => {
    const page: Page = {
      gm_authFailure: () => {
        throw new Error("the page's beacon failed");
      },
    };
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    expect(() => refuseKey(page)).toThrow("the page's beacon failed");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("runs a page handler that wraps maplace's once, without looping", () => {
    const page: Page = {};
    const listener = vi.fn();
    createAuthHook(page).listen(listener);
    const previous = page.gm_authFailure;
    const pages = vi.fn();
    page.gm_authFailure = () => {
      previous?.();
      pages();
    };
    refuseKey(page);
    expect([pages.mock.calls.length, listener.mock.calls.length]).toEqual([1, 1]);
  });

  it("chains with another copy of maplace on the same page, each hearing once", () => {
    const page: Page = {};
    const first = vi.fn();
    const second = vi.fn();
    createAuthHook(page).listen(first);
    createAuthHook(page).listen(second);
    const pages = vi.fn();
    page.gm_authFailure = pages;
    refuseKey(page);
    expect([first, second, pages].map((handler) => handler.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("remembers that Google refused the key, which it says once per page", () => {
    const page: Page = {};
    const hook = createAuthHook(page);
    expect(hook.refused()).toBe(false);
    refuseKey(page);
    expect(hook.refused()).toBe(true);
  });

  it("tells nothing to a listener that stopped", () => {
    const page: Page = {};
    const listener = vi.fn();
    const stop = createAuthHook(page).listen(listener);
    stop();
    refuseKey(page);
    expect(listener).not.toHaveBeenCalled();
  });
});
