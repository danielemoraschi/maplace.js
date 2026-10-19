// @vitest-environment happy-dom
import { Activity } from "react";
import { describe, expect, it, vi } from "vitest";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { fakeAdapters } from "./testing/adapters";
import { Boundary, inAct, ROOT_MODES, renderInto, storeCatcher } from "./testing/render";
import { TOWNS } from "./testing/towns";

describe.each(ROOT_MODES)("MaplaceMap, in $mode", (root) => {
  it("attaches a fresh adapter to its div on mount and detaches on unmount", async () => {
    const adapters = fakeAdapters();
    const { container, unmount } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter} className="map" />
      </MaplaceProvider>,
      root,
    );
    const adapter = adapters.live();
    expect(adapter.mounted?.container).toBe(container.querySelector("div.map"));
    expect(adapters.made).toHaveLength(root.mode === "StrictMode" ? 2 : 1);
    await unmount();
    expect(adapter.destroyed).toBe(true);
  });

  it("makes no new adapter on a render, whatever createAdapter it is given", async () => {
    const adapters = fakeAdapters();
    const app = (className: string) => (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={() => adapters.createAdapter()} className={className} />
      </MaplaceProvider>
    );
    const { container, render } = await renderInto(app("small"), root);
    const made = adapters.made.length;
    await render(app("large"));
    expect(adapters.made).toHaveLength(made);
    expect(adapters.live().mounted?.container).toBe(container.querySelector("div.large"));
  });

  it("gives a refused adapter to the boundary, destroyed", async () => {
    const adapters = fakeAdapters();
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter} />
        <MaplaceMap createAdapter={adapters.createAdapter} />
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toMatchObject({ code: "already-attached" });
    expect(adapters.made.every((adapter) => adapter.destroyed)).toBe(true);
  });

  it("gives a throwing createAdapter to the boundary", async () => {
    const failure = new Error("no map today");
    const createAdapter = vi.fn(() => {
      throw failure;
    });
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={createAdapter} />
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toBe(failure);
  });

  it("detaches while hidden in an Activity, keeping the store's state, and attaches again", async () => {
    const adapters = fakeAdapters();
    const { Keep, store } = storeCatcher();
    const app = (mode: "visible" | "hidden") => (
      <MaplaceProvider locations={TOWNS} defaultSelectedId="north">
        <Keep />
        <Activity mode={mode}>
          <MaplaceMap createAdapter={adapters.createAdapter} />
        </Activity>
      </MaplaceProvider>
    );
    const { render } = await renderInto(app("visible"), root);
    const first = adapters.live();
    await inAct(() => first.finishMount());
    await render(app("hidden"));
    expect(first.destroyed).toBe(true);
    expect(store().getSnapshot()).toMatchObject({ loadState: "idle", selectedId: "north" });
    await render(app("visible"));
    expect(adapters.live()).not.toBe(first);
  });
});

// StrictMode detaches, so destroys, a map's first adapter: a shared one only works in a plain root.
// The second map has a boundary of its own, so the first stays mounted.
it.each([
  ["a plain map", {}],
  ["one with React content", { markerIcon: () => "★" }],
])("leaves an adapter attached before to the map it drives, refused by %s", async (_, content) => {
  const shared = fakeAdapters().createAdapter();
  const { errors } = await renderInto(
    <>
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={() => shared} />
      </MaplaceProvider>
      <Boundary>
        <MaplaceProvider locations={TOWNS}>
          <MaplaceMap createAdapter={() => shared} {...content} />
        </MaplaceProvider>
      </Boundary>
    </>,
  );
  expect(errors[0]).toMatchObject({ code: "already-attached", field: "adapter" });
  expect(shared.destroyed).toBe(false);
});
