// @vitest-environment happy-dom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocationList, MaplaceMap, MaplaceProvider } from "./index";
import { fakeAdapters } from "./testing/adapters";
import { TOWNS } from "./testing/bound-store";
import "./testing/render";

describe("maplace/react hydrated", () => {
  it("takes over the server's HTML without a mismatch, then attaches and lists", async () => {
    const adapters = fakeAdapters();
    const app = (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter} className="map" />
        <LocationList />
      </MaplaceProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(app);
    document.body.append(container);
    const recoverable: unknown[] = [];
    const root = await act(async () =>
      hydrateRoot(container, app, { onRecoverableError: (error) => recoverable.push(error) }),
    );
    expect(recoverable).toEqual([]);
    expect(adapters.live().mounted?.container).toBe(container.querySelector(".map"));
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3);
    await act(async () => root.unmount());
    container.remove();
  });
});
