import type { ExampleGroup } from "../example-groups.ts";

export const clustersHeatmaps: ExampleGroup = {
  id: "clusters-heatmaps",
  label: "Clusters and heatmaps",
  headingLead: "Marker clustering and heatmaps",
  intro:
    "Thousands of points grouped into badges that count them, and a month of earthquakes as a heatmap by magnitude that turns into dots as you zoom in.",
  summary: "4,000 points clustered, and a month of earthquakes as a heatmap.",
  description:
    "Marker clustering and heatmaps on Google Maps or MapLibre in JavaScript: thousands of points as count badges, and earthquakes as a heatmap.",
  references: [{ doc: "store", heading: "## Heatmaps" }],
  sections: [
    {
      name: "big",
      title: "Marker clustering",
      summary: "4,000 points, those near each other drawn as one badge counting them.",
    },
    {
      name: "earthquakes",
      title: "Heatmaps",
      summary:
        "A month of earthquakes as a heatmap by magnitude, dots when zoomed in, volcanoes as pins, a checkbox for each.",
    },
  ],
};
