// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { LocationList } from "./location-list";
import { MapControl } from "./map-control";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { fakeAdapters } from "./testing/adapters";
import { TOWNS } from "./testing/bound-store";
import { ROOT_MODES, renderInto } from "./testing/render";

describe.each(ROOT_MODES)("MapControl, in $mode", (root) => {
  it("puts its children on the live map at its position, with the provider's context", async () => {
    const adapters = fakeAdapters();
    await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          <MapControl position="top-right">
            <LocationList as="select" />
          </MapControl>
        </MaplaceMap>
      </MaplaceProvider>,
      root,
    );
    const adapter = adapters.live();
    expect(adapter.callsOf("mountControl").map(({ position }) => position)).toEqual(["top-right"]);
    const map = adapter.mounted?.container;
    expect(map?.querySelectorAll("select option:not([hidden])")).toHaveLength(TOWNS.length);
  });

  it("takes its children off the map on unmount, and moves them when its position changes", async () => {
    const adapters = fakeAdapters();
    const app = (position: "top-left" | "bottom-right" | undefined) => (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          {position && (
            <MapControl position={position}>
              <p>Note</p>
            </MapControl>
          )}
        </MaplaceMap>
      </MaplaceProvider>
    );
    const { render } = await renderInto(app("top-left"), root);
    const map = () => adapters.live().mounted?.container;
    await render(app("bottom-right"));
    const positions = adapters
      .live()
      .callsOf("mountControl")
      .map(({ position }) => position);
    expect(positions.at(-1)).toBe("bottom-right");
    expect(map()?.querySelectorAll("p")).toHaveLength(1);
    await render(app(undefined));
    expect(map()?.querySelector("p")).toBeNull();
  });

  it("is misuse outside a <MaplaceMap>", async () => {
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MapControl position="top-left">x</MapControl>
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toMatchObject({
      code: "invalid-input",
      message: "MapControl: needs a <MaplaceMap> above it",
    });
  });
});
