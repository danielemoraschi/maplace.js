import "maplibre-gl/dist/maplibre-gl.css";
import type { Geometry, Location } from "maplace";
import { createMapLibreAdapter } from "maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

/** Your own fields, in each location's `data`. */
interface Area {
  readonly about: string;
}

const center = { lat: 41.9028, lng: 12.4964 };
const selectedStyle = { stroke: "#c2410c", fill: "#f97316" };
const circles: Location<Area>[] = [
  {
    id: "center",
    type: "circle",
    center,
    radius: 5_000,
    title: "Within 5 km",
    style: { stroke: "#1d4ed8", fill: "#3b82f6" },
    selectedStyle,
    data: { about: "The historic centre, on foot." },
  },
  {
    id: "ring",
    type: "circle",
    center,
    radius: 15_000,
    title: "Within 15 km",
    style: { stroke: "#15803d", fill: "#22c55e" },
    selectedStyle,
    data: { about: "Inside the ring road, by bike." },
  },
  {
    id: "resizable",
    type: "circle",
    center: { lat: 41.8, lng: 12.75 },
    radius: 8_000,
    title: "Change my size",
    editable: true,
    style: { stroke: "#7c3aed", fill: "#a78bfa" },
  },
];

// Outside the component, so a render of the page around it doesn't render every popup again.
const popupContent = ({ data }: Location<Area>) => (data ? <p>{data.about}</p> : null);

/** A circle's radius; other shapes have none. */
const radiusOf = (shape: Geometry | Location<Area>) =>
  "radius" in shape ? shape.radius : undefined;

function Circles() {
  const [radius, setRadius] = useState(8_000);
  // The editable circle's radius, while it is resized and once it is.
  const showRadius = (id: string, shape: Geometry | Location<Area>) => {
    const resized = radiusOf(shape);
    if (id === "resizable" && resized !== undefined) setRadius(resized);
  };
  return (
    <MaplaceProvider
      locations={circles}
      defaultSelectedId="center"
      onLocationEdit={({ location, geometry }) => showRadius(location.id, geometry)}
      onLocationChange={({ location }) => showRadius(location.id, location)}
    >
      <div className="map-and-list">
        <MaplaceMap
          createAdapter={createMapLibreAdapter}
          className="map"
          popupContent={popupContent}
        />
        <LocationList />
      </div>
      <p>
        <output>Radius: {(radius / 1000).toFixed(1)} km</output>
      </p>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("circles-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Circles />
  </StrictMode>,
);
