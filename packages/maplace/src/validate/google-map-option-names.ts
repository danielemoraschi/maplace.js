/**
 * Google's map option names MapLibre has its own for, each with what to write instead. MapLibre
 * would ignore them without a word, and the page's map would quietly do something else. A fixed
 * list: names both providers share, and names MapLibre has nothing for, aren't here.
 */
export const GOOGLE_NAMES_ON_MAPLIBRE: Readonly<Record<string, string>> = {
  scrollwheel: "is Google's name: MapLibre's is scrollZoom",
  draggable: "is Google's name: MapLibre's is dragPan",
  disableDoubleClickZoom: "is Google's name: MapLibre's is doubleClickZoom, the other way round",
  keyboardShortcuts: "is Google's name: MapLibre's is keyboard",
  gestureHandling: "is Google's name: MapLibre's nearest is cooperativeGestures",
  tilt: "is Google's name: MapLibre's is pitch",
  heading: "is Google's name: MapLibre's is bearing",
  restriction: "is Google's name: MapLibre's is maxBounds",
  styles: "is Google's name: the map's style is mapStyle (map-style on the element)",
};
