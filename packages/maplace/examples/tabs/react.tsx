import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const cities: Location[] = [
  { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
];
const notes: Readonly<Record<string, string>> = {
  rome: "Capital since 1871.",
  milan: "Finance and fashion.",
};

function Tabs() {
  const [note, setNote] = useState("");
  return (
    <MaplaceProvider
      locations={cities}
      onSelectionChange={({ id }) => setNote(id === undefined ? "" : (notes[id] ?? ""))}
    >
      <LocationList />
      <MaplaceMap createAdapter={createAdapter} className="map" />
      <aside>{note}</aside>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("tabs-react-root") as HTMLElement).render(
  <StrictMode>
    <Tabs />
  </StrictMode>,
);
