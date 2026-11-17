import type { Drawable } from "../drawable";

/*
 * One heatmap look for every provider: MapLibre builds its layers' expressions from these values,
 * Google draws its canvas and dots with these functions.
 */

/** The zooms below `maxZoom` over which the heat fades into the dots. */
export const HEAT_FADE_ZOOMS = 2;

/** The heat's colours by density, 0 to 1: clear, then blue through cyan and yellow to red. */
export const HEAT_COLORS: readonly (readonly [density: number, color: string])[] = [
  [0, "rgba(59, 130, 246, 0)"],
  [0.2, "#3b82f6"],
  [0.4, "#06b6d4"],
  [0.6, "#facc15"],
  [0.8, "#f97316"],
  [1, "#dc2626"],
];

/**
 * Each point's spread in CSS pixels and the heat's strength, at the world's zoom (1) and at
 * `maxZoom`: they grow as the map zooms in, so thousands of points over the world aren't one blot.
 */
export const HEAT_RADIUS = { world: 6, region: 24 } as const;
export const HEAT_INTENSITY = { world: 1, region: 3 } as const;

/** A heat point's radius at `zoom`, for Google's canvas; MapLibre's layer interpolates the same. */
export function heatRadiusAt(zoom: number, maxZoom: number): number {
  return between(HEAT_RADIUS.world, HEAT_RADIUS.region, zoomShare(zoom, maxZoom));
}

/** The heat's strength at `zoom`, as `heatRadiusAt`. */
export function heatIntensityAt(zoom: number, maxZoom: number): number {
  return between(HEAT_INTENSITY.world, HEAT_INTENSITY.region, zoomShare(zoom, maxZoom));
}

/** How far `zoom` is from the world's (1) to `maxZoom`, 0 to 1. */
function zoomShare(zoom: number, maxZoom: number): number {
  return clamp01((zoom - 1) / (maxZoom - 1));
}

function between(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}

/** A dot's radius in CSS pixels, from the lightest marker to the heaviest. */
export const DOT_RADIUS = { min: 4, max: 12 } as const;

/** The edge that sets a dot off the map and the dots under it. */
export const DOT_STROKE = { color: "#ffffff", width: 1.5 } as const;

/** The heat's opacity at `zoom`: whole until the fade starts, none from `maxZoom` on. */
export function heatOpacityAt(zoom: number, maxZoom: number): number {
  return clamp01((maxZoom - zoom) / HEAT_FADE_ZOOMS);
}

/** The dots' opacity at `zoom`: the heat's, mirrored. */
export function dotOpacityAt(zoom: number, maxZoom: number): number {
  return 1 - heatOpacityAt(zoom, maxZoom);
}

/** The heaviest heat marker's weight among the placed locations; 0 with none. */
function heaviestHeatWeight(placed: Iterable<{ drawable(): Drawable }>): number {
  let heaviest = 0;
  for (const location of placed) {
    const { heatWeight } = location.drawable();
    if (heatWeight !== undefined) heaviest = Math.max(heaviest, heatWeight);
  }
  return heaviest;
}

/** The heaviest heat marker's weight, kept from one diff to the next. */
export interface HeaviestHeat {
  value(): number;
  /** Works it out again; whether it changed. */
  update(placed: Iterable<{ drawable(): Drawable }>): boolean;
}

export function trackHeaviestHeat(): HeaviestHeat {
  let heaviest = 0;
  return {
    value: () => heaviest,
    update(placed) {
      const next = heaviestHeatWeight(placed);
      const changed = next !== heaviest;
      heaviest = next;
      return changed;
    },
  };
}

/** `weight` against the heaviest, 0 to 1; nothing weighs anything when the heaviest doesn't. */
export function relativeHeat(weight: number, heaviest: number): number {
  return heaviest > 0 ? weight / heaviest : 0;
}

/** A dot's radius for its relative weight. */
export function dotRadiusAt(relative: number): number {
  return between(DOT_RADIUS.min, DOT_RADIUS.max, relative);
}

/**
 * The dots' colours by relative weight, 0 to 1: the heat's opaque colours, the lightest dot in the
 * first, the heaviest in the last.
 */
export const DOT_COLORS: readonly (readonly [relative: number, color: string])[] = (() => {
  const [, ...opaque] = HEAT_COLORS;
  const [first = 0] = opaque[0] ?? [];
  return opaque.map(([density, color]) => [(density - first) / (1 - first), color] as const);
})();

/** The dots' colours at 256 steps of relative weight, worked out on first use. */
let dotColorTable: string[] | undefined;

/** A dot's colour for its relative weight, from the table. */
export function dotColorAt(relative: number): string {
  dotColorTable ??= Array.from({ length: 256 }, (_, at) => colorAt(at / 255));
  return dotColorTable[Math.round(clamp01(relative) * 255)] ?? "";
}

function colorAt(relative: number): string {
  const upper = Math.max(
    1,
    DOT_COLORS.findIndex(([at]) => at >= relative),
  );
  const [lowAt, low] = DOT_COLORS[upper - 1] as readonly [number, string];
  const [highAt, high] = DOT_COLORS[upper] as readonly [number, string];
  return mixHex(low, high, clamp01((relative - lowAt) / (highAt - lowAt)));
}

function mixHex(from: string, to: string, share: number): string {
  const channel = (hex: string, at: number) => Number.parseInt(hex.slice(at, at + 2), 16);
  const mixed = [1, 3, 5].map((at) =>
    Math.round(between(channel(from, at), channel(to, at), share)),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
