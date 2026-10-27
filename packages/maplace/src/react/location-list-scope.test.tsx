// @vitest-environment happy-dom
import { type ReactNode, useEffect } from "react";
import { describe, expect, it } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import { optionsIn } from "../testing/lists";
import { LocationList } from "./location-list";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { inAct, ROOT_MODES, renderInto, storeCatcher } from "./testing/render";
import { settled } from "./testing/rendered-map";
import { TOWNS } from "./testing/towns";

/** A map on the fake with a scoped list of `TOWNS` beside it, mounted and drawn. */
async function scopedListBesideMap(root: (typeof ROOT_MODES)[number], list: ReactNode) {
  const adapters = fakeAdapters();
  const { Keep, store } = storeCatcher();
  const rendered = await renderInto(
    <MaplaceProvider locations={TOWNS}>
      <Keep />
      <MaplaceMap createAdapter={adapters.createAdapter} />
      {list}
    </MaplaceProvider>,
    root,
  );
  const adapter = adapters.live();
  await inAct(() => adapter.finishMount());
  await settled(adapter);
  const button = () => rendered.container.querySelector<HTMLButtonElement>(".maplace-search-area");
  const moveTo = async (lat: number, lng: number, zoom: number) => {
    await inAct(() => store().setView({ lat, lng }, zoom));
    await settled(adapter);
  };
  const search = () => inAct(() => button()?.click());
  return { ...rendered, button, moveTo, search };
}

/** Its id in `ids` while mounted. */
function Mounted({ id, in: ids }: { readonly id: string; readonly in: Set<string> }): ReactNode {
  useEffect(() => {
    ids.add(id);
    return () => {
      ids.delete(id);
    };
  }, [id, ids]);
  return <em>{id}</em>;
}

describe.each(ROOT_MODES)("LocationList with scope, in $mode", (root) => {
  it("lists only what is in the map's view with scope='viewport', and shows the button after a move", async () => {
    const { container, button, moveTo, search } = await scopedListBesideMap(
      root,
      <LocationList scope="viewport" searchAreaLabel="Look here" />,
    );
    expect([optionsIn(container).length, button()?.hidden]).toEqual([3, true]);
    await moveTo(40, 16, 9);
    expect([button()?.hidden, button()?.textContent]).toEqual([false, "Look here"]);
    await search();
    expect(optionsIn(container).map((option) => option.textContent)).toEqual(["south"]);
  });

  it("unmounts the content of entries a search leaves out, and mounts them fresh when listed again", async () => {
    const mounted = new Set<string>();
    const { container, moveTo, search } = await scopedListBesideMap(
      root,
      <LocationList scope="viewport">
        {({ location }) => <Mounted id={location.id} in={mounted} />}
      </LocationList>,
    );
    const north = container.querySelector("em");
    await moveTo(40, 16, 9);
    await search();
    expect([...mounted]).toEqual(["south"]);
    await moveTo(43, 13, 4);
    await search();
    expect(mounted.size).toBe(3);
    expect(container.querySelector("em")).not.toBe(north);
  });

  it("gives scope with as='select' to the boundary", async () => {
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <LocationList as="select" scope="viewport" />
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toMatchObject({ code: "invalid-input" });
  });
});
