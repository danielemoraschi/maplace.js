import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import { LocationList, MapControl, MaplaceMap, MaplaceProvider } from "./index";
import { TOWNS } from "./testing/towns";

// No DOM in this file: importing the binding, and rendering it on a server, must not need one.
describe("maplace/react on a server", () => {
  it("renders the map's and the list's places, empty, with no DOM, React content or controls or not", () => {
    expect(typeof document).toBe("undefined");
    const html = renderToString(
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap
          createAdapter={fakeAdapters().createAdapter}
          className="map"
          popupContent={(location) => <p>{location.id}</p>}
          markerIcon={() => <b>pin</b>}
        >
          <MapControl position="top-right">
            <LocationList as="select" />
          </MapControl>
          <LocationList position="top-left" />
        </MaplaceMap>
        <LocationList>{({ location }) => location.id}</LocationList>
      </MaplaceProvider>,
    );
    expect(html).toBe('<div class="map"></div><div style="display:contents"></div>');
  });
});
