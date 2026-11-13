import "maplibre-gl/dist/maplibre-gl.css";
import { createMapLibreMap } from "@maplacejs/maplace/maplibre";

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
const places = [
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

createMapLibreMap("#popups-maplibre-vanilla-map", {
  locations: places.map((place) => ({ ...place, content: () => placeCard(place.data) })),
  view: { kind: "center", center: { lat: 44, lng: 11 }, zoom: 6 },
  popup: { openInMapsLink: true, directionsLink: true },
});

/** A place's card: the page's template, filled with its photo, category, hours and rating. */
function placeCard(place: Place): Node {
  const template = document.querySelector("#popups-maplibre-vanilla-card") as HTMLTemplateElement;
  const card = template.content.cloneNode(true) as DocumentFragment;
  const photo = card.querySelector(".place-photo") as HTMLImageElement;
  photo.src = place.photo;
  photo.alt = place.alt;
  const write = (name: string, text: string) => {
    (card.querySelector(`.place-${name}`) as HTMLElement).textContent = text;
  };
  write("category", place.category);
  write("hours", place.hours);
  write("score", place.rating);
  write("reviews", `(${place.reviews} reviews)`);
  return card;
}
