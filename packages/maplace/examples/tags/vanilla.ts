import { createGoogleMap } from "maplace/google";

const maplace = createGoogleMap("#tags-vanilla-map", {
  locations: [
    {
      id: "rome",
      lat: 41.9028,
      lng: 12.4964,
      title: "Rome",
      group: "Centre",
      tags: ["parking", "open-late"],
    },
    { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna", group: "Centre" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North", tags: ["parking"] },
    { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North", tags: ["open-late"] },
    {
      id: "naples",
      lat: 40.8518,
      lng: 14.2681,
      title: "Naples",
      group: "South",
      tags: ["parking", "open-late"],
    },
  ],
  list: { heading: "Places" },
});

const filters = document.querySelector("#tags-vanilla-filters");
filters?.addEventListener("change", () => {
  const ticked = filters.querySelectorAll<HTMLInputElement>(":checked");
  maplace.setFilter({ tags: Array.from(ticked, (box) => box.value) });
});
