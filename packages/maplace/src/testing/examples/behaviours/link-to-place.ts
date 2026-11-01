import { expect } from "vitest";
import { byText, type ExampleBehaviour } from "./reading";

/**
 * The address names the place picked; going back to an address selects its place, and moves
 * nothing when it is selected already; "View all" clears the selection, fits every place and
 * takes the place out of the address. The line under the map gives the link to what is picked.
 */
export const linkToPlace: ExampleBehaviour = async ({ store, adapter, root }) => {
  const before = location.href;
  const line = () => root.querySelector("p")?.textContent;
  const linkShown = () => root.querySelector<HTMLAnchorElement>("p a")?.search;
  try {
    await expect.poll(line).toBe("Pick a place for a link to it.");
    store.select("milan");
    await expect.poll(() => location.search).toContain("=milan");
    await expect.poll(linkShown).toContain("=milan");
    const atMilan = location.href;
    store.select("rome");
    await expect.poll(() => location.search).toContain("=rome");

    history.replaceState(null, "", atMilan);
    dispatchEvent(new PopStateEvent("popstate"));
    await expect.poll(() => store.getSnapshot().selectedId).toBe("milan");

    const asked = adapter.callsOf("setView").length;
    dispatchEvent(new PopStateEvent("popstate"));
    await adapter.probe().settle();
    expect(adapter.callsOf("setView"), "a history step naming the same place").toHaveLength(asked);

    const fits = adapter.callsOf("setView").length;
    byText(root, '[role="option"]', "View all").click();
    await expect.poll(() => store.getSnapshot().selectedId).toBeUndefined();
    await expect.poll(() => adapter.callsOf("setView").length).toBeGreaterThan(fits);
    expect(adapter.callsOf("setView").at(-1)?.view.kind).toBe("fit-bounds");
    await expect.poll(() => location.search).not.toContain("=milan");
    await expect.poll(line).toBe("Pick a place for a link to it.");
  } finally {
    history.replaceState(null, "", before);
  }
};
