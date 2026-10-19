// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
import type { Location } from "../location";
import { locationById } from "../location-state";
import { MapContentPortals } from "./content-portals";
import { createContentSession } from "./content-slots";
import { MaplaceProvider } from "./maplace-provider";
import { renderInto } from "./testing/render";
import { TOWNS } from "./testing/towns";

it("lets a held popupOpen out once rendered, even with its function gone by then", async () => {
  const session = createContentSession({
    document,
    renders: { current: { popupContent: (location: Location) => location.id } },
    locationOf: (id) => locationById(TOWNS, id),
    report: () => {},
  });
  const report = vi.fn();
  session.popupFor("north");
  session.whenPopupShown("north", report);
  await renderInto(
    <MaplaceProvider locations={TOWNS}>
      <MapContentPortals session={session} popupContent={undefined} />
    </MaplaceProvider>,
  );
  expect(report).toHaveBeenCalledOnce();
});
