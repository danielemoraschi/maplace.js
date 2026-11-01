// An adapter of your own, proved with maplace/testing: run in Vitest's browser mode. This one
// draws nothing, so it joins only the suite's first group; yours adds each as it draws that part,
// and its probe reads and drives your provider's map.
import type { Adapter } from "maplace";
import type { ConformanceSubject, MapProbe } from "maplace/testing";

function createMyAdapter(): Adapter {
  return {
    capabilities: new Set(["circle"]),
    async mount() {},
    async apply() {},
    present() {},
    setView() {},
    setRoute() {},
    mountControl() {
      return () => {};
    },
    destroy() {},
  };
}

const myProbe: MapProbe = {
  location: () => undefined,
  locationIds: () => [],
  stackOrder: () => [],
  shownPopup: () => undefined,
  originDot: () => undefined,
  click() {},
  clickMap() {},
  pointerOver() {},
  pointerOut() {},
  drag() {},
  closePopup() {},
  settle: async () => {},
};

export const myAdapter: ConformanceSubject = {
  name: "my adapter",
  groups: ["declarations"],
  create: () => ({ adapter: createMyAdapter(), probe: myProbe }),
};
