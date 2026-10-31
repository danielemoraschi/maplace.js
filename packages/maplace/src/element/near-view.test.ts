// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { createNearViewWait } from "./near-view";

/** Each observer made, and a way to report an entry to it as the browser would. */
function stubObservers() {
  const reports: ((isIntersecting: boolean, width?: number) => void)[] = [];
  class StubObserver {
    constructor(callback: IntersectionObserverCallback) {
      const observer = this as unknown as IntersectionObserver;
      reports.push((isIntersecting, width = 0) =>
        callback(
          [{ isIntersecting, boundingClientRect: { width } } as IntersectionObserverEntry],
          observer,
        ),
      );
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", StubObserver);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
  return reports;
}

function lazyHost(): Element {
  const host = document.createElement("div");
  host.setAttribute("loading", "lazy");
  return host;
}

describe("createNearViewWait", () => {
  it("opens once its observer reports the host near", () => {
    const reports = stubObservers();
    const onNear = vi.fn();
    const wait = createNearViewWait(lazyHost(), onNear, () => {});
    wait.start();
    reports[0]?.(false);
    expect([wait.waiting, onNear.mock.calls.length]).toEqual([true, 0]);
    reports[0]?.(true);
    expect([wait.waiting, onNear.mock.calls.length]).toEqual([false, 1]);
  });

  it("makes one observer at most, started again while waiting", () => {
    const reports = stubObservers();
    const wait = createNearViewWait(
      lazyHost(),
      () => {},
      () => {},
    );
    wait.start();
    wait.start();
    expect(reports).toHaveLength(1);
  });

  it("ignores a report queued for an observer it stopped", () => {
    const reports = stubObservers();
    const onNear = vi.fn();
    const wait = createNearViewWait(lazyHost(), onNear, () => {});
    wait.start();
    wait.stop();
    wait.start();
    reports[0]?.(true);
    expect([wait.waiting, onNear.mock.calls.length]).toEqual([true, 0]);
  });

  it("reports far once its observer sees the host laid out away from the view", () => {
    const reports = stubObservers();
    const onFar = vi.fn();
    const wait = createNearViewWait(lazyHost(), () => {}, onFar);
    wait.start();
    reports[0]?.(false, 600);
    expect([wait.waiting, onFar.mock.calls.length]).toEqual([true, 1]);
  });

  it("says nothing of a host with no box", () => {
    const reports = stubObservers();
    const onFar = vi.fn();
    createNearViewWait(lazyHost(), () => {}, onFar).start();
    reports[0]?.(false, 0);
    expect(onFar).not.toHaveBeenCalled();
  });

  it("ignores a far report queued for an observer it stopped", () => {
    const reports = stubObservers();
    const onFar = vi.fn();
    const wait = createNearViewWait(lazyHost(), () => {}, onFar);
    wait.start();
    wait.stop();
    reports[0]?.(false, 600);
    expect(onFar).not.toHaveBeenCalled();
  });

  it("isn't far when near: only onNear is called", () => {
    const reports = stubObservers();
    const onFar = vi.fn();
    const onNear = vi.fn();
    createNearViewWait(lazyHost(), onNear, onFar).start();
    reports[0]?.(true, 600);
    expect([onNear.mock.calls.length, onFar.mock.calls.length]).toEqual([1, 0]);
  });
});
