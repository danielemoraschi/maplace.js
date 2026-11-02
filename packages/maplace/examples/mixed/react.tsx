import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const places: Location[] = [
  { id: "colosseum", type: "marker", title: "Colosseum", lat: 41.8902, lng: 12.4922 },
  {
    id: "trastevere",
    type: "circle",
    title: "Trastevere",
    center: { lat: 41.8867, lng: 12.47 },
    radius: 500,
  },
  {
    id: "villa-borghese",
    type: "polygon",
    title: "Villa Borghese",
    path: [
      { lat: 41.9175, lng: 12.479 },
      { lat: 41.916, lng: 12.4885 },
      { lat: 41.909, lng: 12.488 },
      { lat: 41.9085, lng: 12.48 },
    ],
  },
  {
    id: "tiber",
    type: "polyline",
    title: "Along the Tiber",
    path: [
      { lat: 41.9117, lng: 12.4729 },
      { lat: 41.9014, lng: 12.4664 },
      { lat: 41.8964, lng: 12.466 },
      { lat: 41.8925, lng: 12.4709 },
      { lat: 41.8906, lng: 12.4775 },
    ],
  },
];

function Mixed() {
  return (
    <MaplaceProvider locations={places}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={createGoogleAdapter} className="map" />
        <LocationList />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("mixed-react-root") as HTMLElement).render(
  <StrictMode>
    <Mixed />
  </StrictMode>,
);
