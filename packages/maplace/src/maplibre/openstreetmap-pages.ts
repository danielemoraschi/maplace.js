import type { MapsPages } from "../adapter-kit/popup-links";

/** openstreetmap.org's own addresses: a marker in its view, and its directions page's end point. */
export const OPENSTREETMAP_PAGES: MapsPages = {
  openInMaps: (lat, lng) =>
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`,
  directions: (lat, lng) => `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`,
};
