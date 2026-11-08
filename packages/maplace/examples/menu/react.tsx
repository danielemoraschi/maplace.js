import type { Location } from "@maplacejs/maplace";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London", group: "South" },
  { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", group: "North" },
  { id: "belfast", lat: 54.5973, lng: -5.9301, title: "Belfast", group: "North" },
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
          fitAll
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
