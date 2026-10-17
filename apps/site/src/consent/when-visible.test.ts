// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { whenVisible } from "./when-visible.ts";

/** An IntersectionObserver whose reports the test makes. */
class ObserverStub {
  static made: ObserverStub[] = [];
  readonly unobserved: Element[] = [];
  constructor(readonly report: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    ObserverStub.made.push(this);
  }
  observe() {}
  unobserve(target: Element) {
    this.unobserved.push(target);
  }
}

describe("whenVisible", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("runs each element's callback once it is in view, then stops watching it, with one observer", () => {
    vi.stubGlobal("IntersectionObserver", ObserverStub);
    const [rome, milan] = [document.createElement("div"), document.createElement("div")];
    const ran: string[] = [];
    whenVisible(rome, () => ran.push("rome"));
    whenVisible(milan, () => ran.push("milan"));
    const [observer] = ObserverStub.made as [ObserverStub];
    observer.report([{ target: rome, isIntersecting: false }]);
    observer.report([{ target: milan, isIntersecting: true }]);
    observer.report([{ target: milan, isIntersecting: true }]);
    expect(ran).toEqual(["milan"]);
    expect(observer.unobserved).toEqual([milan]);
    expect(ObserverStub.made).toHaveLength(1);
  });
});
