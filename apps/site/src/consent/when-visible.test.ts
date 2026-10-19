// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

/** A fresh `whenVisible`: its module keeps one observer for the page, made on first use. */
async function freshWhenVisible() {
  vi.resetModules();
  return (await import("./when-visible.ts")).whenVisible;
}

/** Two elements watched, each callback noting its name in `ran`. */
async function watching() {
  const whenVisible = await freshWhenVisible();
  const [rome, milan] = [document.createElement("div"), document.createElement("div")];
  const ran: string[] = [];
  whenVisible(rome, () => ran.push("rome"));
  whenVisible(milan, () => ran.push("milan"));
  const [observer] = ObserverStub.made as [ObserverStub];
  return { rome, milan, ran, observer };
}

describe("whenVisible", () => {
  beforeEach(() => {
    ObserverStub.made = [];
    vi.stubGlobal("IntersectionObserver", ObserverStub);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("runs an element's callback once it is in view, not before", async () => {
    const { rome, milan, ran, observer } = await watching();
    observer.report([{ target: rome, isIntersecting: false }]);
    observer.report([{ target: milan, isIntersecting: true }]);
    expect(ran).toEqual(["milan"]);
  });

  it("stops watching an element once its callback ran, so it runs once", async () => {
    const { milan, ran, observer } = await watching();
    observer.report([{ target: milan, isIntersecting: true }]);
    observer.report([{ target: milan, isIntersecting: true }]);
    expect(ran).toEqual(["milan"]);
    expect(observer.unobserved).toEqual([milan]);
  });

  it("watches every element with one observer", async () => {
    await watching();
    expect(ObserverStub.made).toHaveLength(1);
  });
});
