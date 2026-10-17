import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocationList, MaplaceMap, MaplaceProvider } from "./index";
import { fakeAdapters } from "./testing/adapters";
import { TOWNS } from "./testing/bound-store";

// No DOM in this file: importing the binding, and rendering it on a server, must not need one.
describe("maplace/react on a server", () => {
  it("renders the map's and the list's places, empty, with no DOM", () => {
    expect(typeof document).toBe("undefined");
    const html = renderToString(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={fakeAdapters().createAdapter} className="map" />
        <LocationList>{({ location }) => location.id}</LocationList>
      </MaplaceProvider>,
    );
    expect(html).toBe('<div class="map"></div><div style="display:contents"></div>');
  });
});
