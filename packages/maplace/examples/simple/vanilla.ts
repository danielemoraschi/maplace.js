import { createGoogleMap } from "maplace/google";

createGoogleMap("#simple-vanilla-map", {
  locations: [{ id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" }],
});
