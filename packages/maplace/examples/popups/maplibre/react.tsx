import "maplibre-gl/dist/maplibre-gl.css";
import type { Location, View } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Your own fields, in each location's `data`. */
interface Place {
  readonly photo: string;
  readonly alt: string;
  readonly category: string;
  readonly rating: string;
  readonly reviews: string;
  readonly hours: string;
}

// The ratings, reviews and hours are sample figures.
const places: Location<Place>[] = [
  {
    id: "colosseum",
    lat: 41.8902,
    lng: 12.4922,
    title: "Colosseum",
    data: {
      photo: "/examples/data/photos/colosseum.webp",
      alt: "The Colosseum's arches behind a row of cypresses",
      category: "Landmark",
      rating: "4.7",
      reviews: "412,301",
      hours: "9:00–19:15",
    },
  },
  {
    id: "duomo",
    lat: 45.4641,
    lng: 9.1919,
    title: "Duomo di Milano",
    data: {
      photo: "/examples/data/photos/duomo.webp",
      alt: "The Duomo's white Gothic facade over its square",
      category: "Cathedral",
      rating: "4.8",
      reviews: "198,442",
      hours: "9:00–19:00",
    },
  },
  {
    id: "st-marks",
    lat: 45.4345,
    lng: 12.3397,
    title: "St Mark's Basilica",
    data: {
      photo: "/examples/data/photos/st-marks.webp",
      alt: "The mosaics and domes of St Mark's Basilica's facade",
      category: "Basilica",
      rating: "4.7",
      reviews: "156,018",
      hours: "9:30–17:15",
    },
  },
];

// Outside the component, so a render of the page around it doesn't render every popup again.
const popupContent = ({ data }: Location<Place>) =>
  data && (
    <div className="place-card">
      <img className="place-photo" src={data.photo} alt={data.alt} />
      <p className="place-meta">
        <span className="place-category">{data.category}</span> · Open{" "}
        <span className="place-hours">{data.hours}</span>
      </p>
      <p className="place-rating">
        ★ <span className="place-score">{data.rating}</span>{" "}
        <span className="place-reviews">({data.reviews} reviews)</span>
      </p>
    </div>
  );

const popup = { openInMapsLink: true, directionsLink: true };

const firstView: View = { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 };

function Popups() {
  return (
    <MaplaceProvider view={firstView} locations={places} popup={popup}>
      <MaplaceMap
        createAdapter={createMapLibreAdapter}
        className="map"
        popupContent={popupContent}
      />
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("popups-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Popups />
  </StrictMode>,
);
