// @vitest-environment happy-dom
import { Activity, type ReactNode, useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider, useMaplace } from "./maplace-provider";
import { fakeAdapters } from "./testing/adapters";
import { TOWNS } from "./testing/bound-store";
import { inAct, ROOT_MODES, renderInto } from "./testing/render";
import { iconOf, renderMap, settled, withData } from "./testing/rendered-map";

function Counter(): ReactNode {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}

/** Its id in `ids` while mounted. */
function Mounted({ id, in: ids }: { readonly id: string; readonly in: Set<string> }): ReactNode {
  useEffect(() => {
    ids.add(id);
    return () => {
      ids.delete(id);
    };
  }, [id, ids]);
  return id;
}

function OnUnmount({ run }: { readonly run: () => void }): ReactNode {
  useEffect(() => run, [run]);
  return "content";
}

describe.each(ROOT_MODES)("React content on the map, in $mode", (root) => {
  it("draws a marker's icon in its host, for its state, stamped as the core stamps", async () => {
    const markerIcon = (location: Location, state: { selected: boolean }) => (
      <b>{state.selected ? `${location.id}!` : location.id}</b>
    );
    const map = await renderMap(root, { markerIcon });
    expect(iconOf(map.probe, "north")?.textContent).toBe("north");
    await inAct(() => map.probe.click("north"));
    expect(iconOf(map.probe, "north")?.textContent).toBe("north!");
    expect(iconOf(map.probe, "north")?.hasAttribute("data-selected")).toBe(true);
  });

  it("keeps the content's state through a state change and a new inline function", async () => {
    const map = await renderMap(root, { markerIcon: () => <Counter /> });
    const button = () => iconOf(map.probe, "north")?.querySelector("button");
    await inAct(() => button()?.click());
    await inAct(() => map.probe.click("north"));
    await map.render({ markerIcon: () => <Counter /> });
    expect(button()?.textContent).toBe("1");
  });

  it("shows a popup's JSX when popupOpen fires, and follows a change of data in place", async () => {
    const shown = vi.fn();
    const onPopupOpen = ({ element }: { element: HTMLElement }) => shown(element.textContent);
    const popupContent = (location: Location) => (
      <p>{`${location.id}: ${String(location.data)}`}</p>
    );
    const map = await renderMap(root, { popupContent }, { onPopupOpen });
    await inAct(() => map.probe.click("north"));
    await map.settled();
    expect(shown.mock.calls).toEqual([["north: undefined"]]);
    await map.render({ popupContent }, { onPopupOpen, locations: withData(TOWNS, "new") });
    expect(map.probe.shownPopup()?.element.textContent).toBe("north: new");
    expect(shown).toHaveBeenCalledOnce();
  });

  it("unmounts a popup's content when it closes, or another location's opens", async () => {
    const mounted = new Set<string>();
    const popupContent = (location: Location) => <Mounted id={location.id} in={mounted} />;
    const map = await renderMap(root, { popupContent }, { popup: { openOn: "hover" } });
    await inAct(() => map.probe.pointerOver("north"));
    await map.settled();
    expect([...mounted]).toEqual(["north"]);
    await inAct(() => map.probe.pointerOver("south"));
    await map.settled();
    expect([...mounted]).toEqual(["south"]);
    await inAct(() => map.probe.pointerOut());
    await map.settled();
    expect([...mounted]).toEqual([]);
  });

  it("gives the content the provider's store", async () => {
    function SelectsOnClick(): ReactNode {
      const store = useMaplace();
      return (
        <button type="button" onClick={() => store.select("east")}>
          pin
        </button>
      );
    }
    const map = await renderMap(root, { markerIcon: () => <SelectsOnClick /> });
    await inAct(() => iconOf(map.probe, "north")?.querySelector("button")?.click());
    expect(iconOf(map.probe, "east")?.hasAttribute("data-selected")).toBe(true);
  });

  it("leaves a location to its own icon, or the default marker, when React renders nothing", async () => {
    const own = document.createElement("img");
    const locations = [{ ...TOWNS[0], icon: own } as Location, ...TOWNS.slice(1)];
    const map = await renderMap(root, { markerIcon: () => null }, { locations });
    expect(map.probe.location("north")?.icon).toBe(own);
    expect(map.probe.location("south")?.icon).toBeUndefined();
  });

  it("unmounts the content while hidden in an Activity, and draws it again when shown", async () => {
    const adapters = fakeAdapters();
    const unmounted = vi.fn();
    const markerIcon = (location: Location) =>
      location.id === "north" && <OnUnmount run={unmounted} />;
    const app = (mode: "visible" | "hidden") => (
      <MaplaceProvider locations={TOWNS}>
        <Activity mode={mode}>
          <MaplaceMap createAdapter={adapters.createAdapter} markerIcon={markerIcon} />
        </Activity>
      </MaplaceProvider>
    );
    const { render } = await renderInto(app("visible"), root);
    await inAct(() => adapters.live().finishMount());
    await settled(adapters.live());
    const before = unmounted.mock.calls.length;
    await render(app("hidden"));
    expect(unmounted.mock.calls.length).toBeGreaterThan(before);
    await render(app("visible"));
    await inAct(() => adapters.live().finishMount());
    await settled(adapters.live());
    expect(iconOf(adapters.live().probe(), "north")?.textContent).toBe("content");
  });
});
