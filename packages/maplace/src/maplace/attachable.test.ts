import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { initialSnapshot } from "../state/initial";
import { CONTAINER as container } from "../testing/container";
import { createFakeAdapter } from "../testing/fake-adapter";
import { checkAttachable, markUsed, type StoreAtAttach } from "./attachable";

const circle: Location = { id: "c", type: "circle", center: { lat: 0, lng: 0 }, radius: 5 };
const free: StoreAtAttach = {
  attached: false,
  cluster: false,
  snapshot: initialSnapshot(undefined),
};

function attachWith(store: Partial<StoreAtAttach>, adapter = createFakeAdapter()) {
  return () => checkAttachable({ adapter, container }, { ...free, ...store });
}

describe("checkAttachable", () => {
  it("returns the adapter's support check for a store it can draw", () => {
    expect(attachWith({})()).toBeTypeOf("function");
  });

  it("refuses a store that is already attached", () => {
    expect(attachWith({ attached: true })).toThrow(
      expect.objectContaining({ code: "already-attached", field: undefined }),
    );
  });

  it("refuses something that is not an adapter", () => {
    expect(() => checkAttachable({ adapter: undefined as never, container }, free)).toThrow(
      "attach: adapter must be an adapter (capabilities and mount), got undefined",
    );
  });

  it("refuses an adapter attached before, to any store", () => {
    const adapter = createFakeAdapter();
    markUsed(adapter);
    expect(attachWith({}, adapter)).toThrow(
      expect.objectContaining({ code: "already-attached", field: "adapter" }),
    );
  });

  it("refuses a container that is not an element", () => {
    expect(() =>
      checkAttachable({ adapter: createFakeAdapter(), container: null as never }, free),
    ).toThrow("attach: container must be an HTMLElement, got null");
  });

  it("refuses clustering, or locations, the adapter can't draw", () => {
    const noCapabilities = () => createFakeAdapter({ capabilities: [] });
    expect(attachWith({ cluster: true }, noCapabilities())).toThrow(
      expect.objectContaining({ code: "unsupported-capability", field: "options.cluster" }),
    );
    const snapshot = initialSnapshot({ locations: [circle] });
    expect(attachWith({ snapshot }, noCapabilities())).toThrow(
      expect.objectContaining({ code: "unsupported-capability", locationId: "c" }),
    );
  });
});
