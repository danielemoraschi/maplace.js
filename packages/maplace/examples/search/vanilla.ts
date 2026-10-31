import { createGoogleMap } from "maplace/google";

createGoogleMap("#search-vanilla-map", {
  locations: [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome", group: "Centre" },
    {
      id: "bologna",
      lat: 44.4949,
      lng: 11.3426,
      title: "Bologna",
      group: "Centre",
      searchText: "pasta",
    },
    { id: "forli", lat: 44.2227, lng: 12.0407, title: "Forlì", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North" },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North" },
    {
      id: "genoa",
      lat: 44.4056,
      lng: 8.9463,
      title: "Genoa",
      group: "North",
      searchText: "pasta, harbour",
    },
    {
      id: "naples",
      lat: 40.8518,
      lng: 14.2681,
      title: "Naples",
      group: "South",
      searchText: "pizza, harbour",
    },
    {
      id: "bari",
      lat: 41.1171,
      lng: 16.8719,
      title: "Bari",
      group: "South",
      searchText: "harbour",
    },
  ],
  list: { container: "#search-vanilla-list", searchLabel: "Find a place" },
});
