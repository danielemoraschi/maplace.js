/**
 * What the site runs its Google examples with: its key and its map ID, each when it has one.
 * MapLibre's take neither.
 */
export interface SiteMapSettings {
  readonly apiKey?: string | undefined;
  readonly mapId?: string | undefined;
}
