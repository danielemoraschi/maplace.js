// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ControlPosition } from "../adapter";
import { controlPositions } from "../testing/examples/behaviours/reading";
import { optionsIn } from "../testing/lists";
import { LocationList } from "./location-list";
import { MapControlsContext } from "./map-controls";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { fakeAdapters } from "./testing/adapters";
import { ROOT_MODES, renderInto } from "./testing/render";
import { TOWNS } from "./testing/towns";

describe.each(ROOT_MODES)("LocationList with a position, in $mode", (root) => {
  it("puts the list itself on the map, with nothing around it and nothing beside the map", async () => {
    const adapters = fakeAdapters();
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          <LocationList position="top-right" heading="Towns" />
        </MaplaceMap>
      </MaplaceProvider>,
      root,
    );
    expect(controlPositions(adapters.live())).toEqual(["top-right"]);
    const map = adapters.live().mounted?.container;
    const layer = map?.lastElementChild;
    const list = layer?.querySelector('[role="listbox"]');
    expect(list?.closest(".maplace-list")?.parentElement).toBe(layer);
    expect(container.querySelector('div[style*="contents"]')).toBeNull();
    expect(container.querySelectorAll('[role="listbox"]')).toHaveLength(1);
  });

  it("puts a select itself on the map too", async () => {
    const adapters = fakeAdapters();
    await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          <LocationList as="select" position="bottom-left" />
        </MaplaceMap>
      </MaplaceProvider>,
      root,
    );
    const layer = adapters.live().mounted?.container.lastElementChild;
    expect(layer?.querySelector("select")?.parentElement).toBe(layer);
  });

  it("builds no list before the map is attached", async () => {
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MapControlsContext value={{ mountControl: undefined }}>
          <LocationList position="top-left" />
        </MapControlsContext>
      </MaplaceProvider>,
      root,
    );
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(container.childElementCount).toBe(0);
  });

  it("moves with its position, and leaves the map holding no list on unmount", async () => {
    const adapters = fakeAdapters();
    const app = (position: ControlPosition | undefined) => (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          {position && <LocationList position={position} />}
        </MaplaceMap>
      </MaplaceProvider>
    );
    const { render } = await renderInto(app("top-left"), root);
    const map = () => adapters.live().mounted?.container;
    await render(app("bottom-right"));
    expect(controlPositions(adapters.live()).at(-1)).toBe("bottom-right");
    expect(map()?.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    await render(app(undefined));
    expect(map()?.querySelector('[role="listbox"]')).toBeNull();
  });

  it("renders each entry's content into the options on the map", async () => {
    const adapters = fakeAdapters();
    await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          <LocationList position="top-right">
            {({ location }) => <strong>{location.id.toUpperCase()}</strong>}
          </LocationList>
        </MaplaceMap>
      </MaplaceProvider>,
      root,
    );
    const map = adapters.live().mounted?.container as HTMLElement;
    expect(optionsIn(map).map((option) => option.textContent)).toEqual(["EAST", "NORTH", "SOUTH"]);
  });

  it("is misuse outside a <MaplaceMap>", async () => {
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <LocationList position="top-left" />
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toMatchObject({
      code: "invalid-input",
      message: "LocationList: position needs a <MaplaceMap> above it",
    });
  });
});
