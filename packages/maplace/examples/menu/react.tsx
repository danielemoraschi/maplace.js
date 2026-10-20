import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
];
const NORTH = ["North"];

function Menu() {
  const [northOnly, setNorthOnly] = useState(false);
  return (
    <MaplaceProvider locations={cities} filter={northOnly ? NORTH : undefined}>
      <p>
        <label>
          <input
            type="checkbox"
            checked={northOnly}
            onChange={(event) => setNorthOnly(event.target.checked)}
          />{" "}
          North only
        </label>
      </p>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map">
        <LocationList
          as="select"
          heading="Choose a location:"
          fitAllLabel="All cities"
          position="top-right"
        />
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("menu-react-root") as HTMLElement).render(
  <StrictMode>
    <Menu />
  </StrictMode>,
);
