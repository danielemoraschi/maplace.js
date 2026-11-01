import type { LatLng, Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", editable: true },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", editable: true },
];

/** The pin a click on the map adds, the `count`th. */
function addedPin(position: LatLng, count: number): Location {
  return { id: `pin-${count}`, ...position, title: `Pin ${count}`, editable: true };
}

function ClickToAdd() {
  const [locations, setLocations] = useState(cities);
  const addPin = ({ position }: { readonly position: LatLng }) =>
    setLocations((current) => [...current, addedPin(position, current.length - cities.length + 1)]);
  // The store has the dragged place already: kept here too, or the next pin would put it back.
  const keepMoved = ({ location }: { readonly location: Location }) =>
    setLocations((current) =>
      current.map((other) => (other.id === location.id ? location : other)),
    );
  return (
    <MaplaceProvider locations={locations} onMapClick={addPin} onLocationChange={keepMoved}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("click-to-add-react-root") as HTMLElement).render(
  <StrictMode>
    <ClickToAdd />
  </StrictMode>,
);
