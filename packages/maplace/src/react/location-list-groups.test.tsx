// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { inputLabelled } from "../testing/examples/behaviours/reading";
import { optionsIn } from "../testing/lists";
import { LocationList } from "./location-list";
import { MaplaceProvider } from "./maplace-provider";
import { inAct, ROOT_MODES, renderInto, storeCatcher } from "./testing/render";

const office = (id: string, ...group: string[]): Location => ({
  id,
  lat: 0,
  lng: 0,
  title: id,
  group,
});
const OFFICES = [office("milan", "Europe", "Italy"), office("tokyo", "Asia", "Japan")];

describe.each(ROOT_MODES)("LocationList with groupFilter, in $mode", (root) => {
  it("shows the boxes, and ticking filters", async () => {
    const { Keep, store } = storeCatcher();
    const { container } = await renderInto(
      <MaplaceProvider locations={OFFICES}>
        <Keep />
        <LocationList groupFilter groupFilterLabel="Regions" />
      </MaplaceProvider>,
      root,
    );
    const filter = container.querySelector(".maplace-group-filter [role=group]");
    expect(filter?.getAttribute("aria-label")).toBe("Regions");
    const asia = inputLabelled(container, "Asia");
    await inAct(() => asia.click());
    expect(store().getSnapshot().filter?.groups).toEqual(["Europe"]);
    expect(optionsIn(container).map((option) => option.textContent)).toEqual(["milan"]);
  });
});
