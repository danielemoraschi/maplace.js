import type { ExampleGroup } from "../example-groups.ts";

export const clustersHeatmaps: ExampleGroup = {
  id: "clusters-heatmaps",
  label: "Clusters and heatmaps",
  heading: "Marker clustering and heatmaps",
  intro:
    "Marker clustering that groups thousands of points into badges counting them, and a heatmap of a month of earthquakes by magnitude that turns into dots as you zoom in.",
  summary: "Points clustered into badges, and a month of earthquakes as a heatmap.",
  description:
    "Cluster thousands of markers into count badges and draw a heatmap of a month of earthquakes, on Google Maps or MapLibre, each with its code to copy.",
  references: [{ doc: "store", heading: "## Heatmaps" }],
  sections: [
    {
      name: "big",
      title: "Marker clustering",
      summary:
        "Markers near each other clustered into one badge counting them, split apart as you zoom in.",
      description:
        "Cluster thousands of map markers into badges that count them and split apart as you zoom in, on Google Maps or MapLibre, from one JSON file of points.",
    },
    {
      name: "earthquakes",
      title: "Heatmaps",
      summary:
        "A month of earthquakes as a heatmap by magnitude, dots when zoomed in, volcanoes as pins, a checkbox for each.",
      description:
        "A heatmap of a month of earthquakes weighted by magnitude on Google Maps or MapLibre, turning into dots as you zoom in, with volcanoes as markers.",
    },
  ],
};
