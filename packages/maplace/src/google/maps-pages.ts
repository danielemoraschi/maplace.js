import type { MapsPages } from "../adapter-kit/popup-links";

/** Google's Maps URLs (developers.google.com/maps/documentation/urls): no key, nothing billed. */
export const GOOGLE_MAPS_PAGES: MapsPages = {
  openInMaps: (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`,
  directions: (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}`,
};
