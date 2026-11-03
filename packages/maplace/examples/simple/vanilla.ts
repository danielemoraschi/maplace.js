import { createGoogleMap } from "maplace/google";

createGoogleMap("#simple-vanilla-map", {
  locations: [{ id: "london", lat: 51.5074, lng: -0.1278, title: "London" }],
});
