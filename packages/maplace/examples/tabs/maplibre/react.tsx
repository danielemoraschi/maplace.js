import "maplibre-gl/dist/maplibre-gl.css";
import type { Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider, useMaplace } from "@maplacejs/maplace/react";
import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London", zoom: 6 },
  { id: "edinburgh", lat: 55.9533, lng: -3.1883, title: "Edinburgh", zoom: 6 },
];
const notes: Readonly<Record<string, string>> = {
  london: "Capital of the United Kingdom.",
  edinburgh: "Capital of Scotland, home of the Fringe arts festival.",
};

const noteOf = (id: string | undefined) => (id === undefined ? "" : (notes[id] ?? ""));

/** The chosen place's note, read from the store: the selection it starts on, and every one after. */
function TabDetails() {
  const maplace = useMaplace();
  const selectedId = useSyncExternalStore(
    maplace.subscribe,
    () => maplace.getSnapshot().selectedId,
  );
  return <aside>{noteOf(selectedId)}</aside>;
}

function Tabs() {
  return (
    <MaplaceProvider locations={cities} defaultSelectedId="london">
      <div className="panel">
        <LocationList />
        <TabDetails />
        <MaplaceMap createAdapter={createMapLibreAdapter} className="map" />
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("tabs-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Tabs />
  </StrictMode>,
);
