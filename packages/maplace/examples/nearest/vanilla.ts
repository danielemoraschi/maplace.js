import { createGoogleMap } from "maplace/google";

createGoogleMap("#nearest-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "naples", lat: 40.8518, lng: 14.2681, title: "Naples" },
    { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin" },
  ],
  list: { container: "#nearest-vanilla-list", sort: "distance" },
  myLocation: true,
});
