import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own field, in each location's `data`: its pin's label. */
interface Museum {
  readonly pin: string;
}

const museums: Location<Museum>[] = [
  { id: "rijks", lat: 52.36, lng: 4.8852, title: "Rijksmuseum", data: { pin: "Rijks" } },
  {
    id: "anne-frank",
    lat: 52.3752,
    lng: 4.884,
    title: "Anne Frank House",
    data: { pin: "Anne Frank" },
  },
  { id: "hermitage", lat: 52.3654, lng: 4.9025, title: "Hermitage", data: { pin: "Hermitage" } },
  { id: "nemo", lat: 52.3738, lng: 4.9123, title: "NEMO Science Museum", data: { pin: "NEMO" } },
  { id: "eye", lat: 52.3843, lng: 4.9008, title: "Eye Filmmuseum", data: { pin: "Eye" } },
];

/**
 * A pin of your own, in a node maplace keeps for each marker and marks `data-hovered` and
 * `data-selected`, so the page's CSS gives each state its look (`[data-selected] > .pin`).
 */
const markerIcon = ({ data }: Location<Museum>) => <span className="pin">{data?.pin}</span>;

function CssMarkers() {
  return (
    <MaplaceProvider locations={museums}>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map" markerIcon={markerIcon} />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("css-markers-react-root") as HTMLElement).render(
  <StrictMode>
    <CssMarkers />
  </StrictMode>,
);
