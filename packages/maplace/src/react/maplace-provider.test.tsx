// @vitest-environment happy-dom
import { startTransition, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Maplace } from "../store";
import { fakeAdapters } from "../testing/fake/adapters";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider, useMaplace } from "./maplace-provider";
import { inAct, ROOT_MODES, renderInto, storeCatcher } from "./testing/render";
import { TOWNS } from "./testing/towns";

describe("useMaplace", () => {
  it("throws outside a provider", async () => {
    function Lost() {
      useMaplace();
      return null;
    }
    const { errors } = await renderInto(<Lost />);
    expect(errors).toEqual([expect.objectContaining({ code: "invalid-input" })]);
  });
});

describe.each(ROOT_MODES)("MaplaceProvider, in $mode", (root) => {
  it("passes the words of what a map adds on to the store", async () => {
    const adapters = fakeAdapters();
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS} skipMapLabel="Oltre" selectedLabel="Scelto">
        <MaplaceMap createAdapter={adapters.createAdapter} />
      </MaplaceProvider>,
      root,
    );
    await inAct(() => adapters.live().finishMount());
    expect(container.querySelector(".maplace-skip-map")?.textContent).toBe("Oltre");
    await inAct(() => adapters.live().host().reportSelectionChange("south"));
    expect(container.querySelector("[aria-live]")?.textContent).toMatch(/^Scelto: /);
  });

  it("gives its children one store, kept across renders, with state through useSyncExternalStore", async () => {
    const seen = new Set<Maplace>();
    function Selected() {
      const store = useMaplace();
      seen.add(store);
      const { selectedId } = useSyncExternalStore(store.subscribe, store.getSnapshot);
      return <output>{selectedId ?? "none"}</output>;
    }
    const app = (id?: string) => (
      <MaplaceProvider locations={TOWNS} selectedId={id}>
        <Selected />
      </MaplaceProvider>
    );
    const { container, render } = await renderInto(app("north"), root);
    await render(app("south"));
    expect(container.textContent).toBe("south");
    expect(seen.size).toBe(1);
  });

  it("hears an event from a child's first layout effect", async () => {
    const onSelectionChange = vi.fn();
    function SelectsOnMount() {
      const store = useMaplace();
      useLayoutEffect(() => store.select("east"), [store]);
      return null;
    }
    await renderInto(
      <MaplaceProvider locations={TOWNS} onSelectionChange={onSelectionChange}>
        <SelectsOnMount />
      </MaplaceProvider>,
      root,
    );
    expect(onSelectionChange).toHaveBeenCalledWith({ id: "east" });
  });

  it("follows a parent that takes onSelectionChange into its state, in one render", async () => {
    const adapters = fakeAdapters();
    const { Keep, store } = storeCatcher();
    function Parent() {
      const [id, setId] = useState<string | undefined>("north");
      return (
        <MaplaceProvider
          locations={TOWNS}
          selectedId={id}
          onSelectionChange={(event) => setId(event.id)}
        >
          <MaplaceMap createAdapter={adapters.createAdapter} />
          <Keep />
          <output>{id}</output>
        </MaplaceProvider>
      );
    }
    const { container } = await renderInto(<Parent />, root);
    const adapter = adapters.live();
    await inAct(() => adapter.finishMount());
    const pans = adapter.callsOf("setView").length;
    await inAct(() => adapter.host().reportSelectionChange("south"));
    expect(container.querySelector("output")?.textContent).toBe("south");
    expect(store().getSnapshot().selectedId).toBe("south");
    expect(adapter.callsOf("setView")).toHaveLength(pans + 1);
  });

  it("goes back to the prop within the same act when the parent ignores the click", async () => {
    const adapters = fakeAdapters();
    const { Keep, store } = storeCatcher();
    await renderInto(
      <MaplaceProvider locations={TOWNS} selectedId="north">
        <MaplaceMap createAdapter={adapters.createAdapter} />
        <Keep />
      </MaplaceProvider>,
      root,
    );
    const adapter = adapters.live();
    await inAct(() => adapter.finishMount());
    await inAct(() => adapter.host().reportSelectionChange("south"));
    expect(store().getSnapshot().selectedId).toBe("north");
  });

  it("lands on a selection the parent sets in a transition", async () => {
    const { Keep, store } = storeCatcher();
    function Parent() {
      const [id, setId] = useState<string | undefined>("north");
      const onSelectionChange = (event: { id: string | undefined }) =>
        startTransition(() => setId(event.id));
      return (
        <MaplaceProvider locations={TOWNS} selectedId={id} onSelectionChange={onSelectionChange}>
          <Keep />
        </MaplaceProvider>
      );
    }
    await renderInto(<Parent />, root);
    await inAct(() => store().select("east"));
    expect(store().getSnapshot().selectedId).toBe("east");
  });

  it("leaves the store idle, its map destroyed, once unmounted", async () => {
    const adapters = fakeAdapters();
    const onError = vi.fn();
    const { Keep, store } = storeCatcher();
    const { unmount } = await renderInto(
      <MaplaceProvider locations={TOWNS} onError={onError}>
        <MaplaceMap createAdapter={adapters.createAdapter} />
        <Keep />
      </MaplaceProvider>,
      root,
    );
    await inAct(() => adapters.live().finishMount());
    await unmount();
    expect(store().getSnapshot().loadState).toBe("idle");
    expect(adapters.made.every((adapter) => adapter.destroyed)).toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });
});
