import { docRoute } from "../site/repo-docs.ts";
import { pageHeading } from "./example-sections.ts";
import type { VersionKind } from "./example-versions.ts";

/** The home page: the library, then every example by feature (`ExampleIndex.astro`). */
export const HOME_ROUTE = "/";

/** The hero's paragraph under the home page's H1. */
export const HOME_INTRO =
  "Maplace.js puts your locations on Google Maps or MapLibre: markers, shapes and routes, and the list or menu that goes with them, in sync with the map.";

/** The home page's description, for search and sharing. */
export const HOME_DESCRIPTION =
  "A JavaScript library for Google Maps and MapLibre: a list of locations becomes a map with markers, popups and a click to add one, in a few lines.";

/** The home page's H1, on one line. */
export const HOME_HEADING = pageHeading("A JavaScript library for markers");

/** What each of the hero's four ways in is (W66), beside its code: by the example's version. */
export const WAYS_IN_NOTES: Readonly<Record<VersionKind, { title: string; text: string }>> = {
  html: {
    title: "Two tags",
    text: "The CDN script and the element: no build step, no script of your own.",
  },
  script: {
    title: "Your own script",
    text: "The same CDN script, and the map made in your own code through the Maplace global it sets.",
  },
  vanilla: {
    title: "From npm",
    text: "The provider's entry imported, and the map mounted on any element.",
  },
  react: {
    title: "React",
    text: "A provider holding your places, and a map component with the adapter you pick.",
  },
};

/** Under a module's note, on Google only: what its page does first, its host page not shown. */
export const WAYS_IN_GOOGLE_LOADER =
  "On Google, your page loads Google's Maps loader with your key first.";

/** What a provider's point is about, drawn as its mark beside it. */
export type PointMark = "key" | "shapes" | "package" | "route" | "layers";

/** A provider and what it gives, as the home page sets them side by side. */
export interface ProviderPoints {
  readonly name: string;
  readonly points: readonly { readonly mark: PointMark; readonly text: string }[];
}

export const PROVIDERS_HEADING = "Two map providers, one API.";

export const PROVIDER_POINTS: readonly ProviderPoints[] = [
  {
    name: "MapLibre",
    points: [
      { mark: "key", text: "No key: OpenFreeMap's style by default." },
      { mark: "shapes", text: "Markers, popups, lists, circles, lines and areas." },
      { mark: "package", text: "The CDN script bundles maplibre-gl and its stylesheet." },
      { mark: "route", text: "Routes through a routing service of your own." },
    ],
  },
  {
    name: "Google Maps",
    points: [
      { mark: "key", text: "Your Maps key, and a map ID of your own for production." },
      { mark: "shapes", text: "The same markers, popups, lists and shapes." },
      { mark: "route", text: "Routes from Google's directions." },
      { mark: "layers", text: "Google's own map types and controls." },
    ],
  },
];

/** Under the providers: why a map waits, then the link to how (`PROVIDERS_CONSENT_LINK`). */
export const PROVIDERS_PRIVACY =
  "Both providers see the visitor's IP address, so a map can wait for the visitor's consent.";

export const PROVIDERS_CONSENT_LINK = "Holding a map until consent";

/** What leads to `PROVIDERS_CONSENT_LINK`, after `PROVIDERS_PRIVACY`. */
export const PROVIDERS_CONSENT_LEAD = "See:";

/** Where `PROVIDERS_CONSENT_LINK` goes: the setup reference's consent section. */
export const PROVIDERS_CONSENT_HREF = `${docRoute("setup")}#consent`;
