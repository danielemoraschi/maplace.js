import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** A Bundler version's module chunk, on either provider: the site's build names it after its file. */
export const VANILLA_CHUNK = /\/_astro\/vanilla\.[^/]+\.js$/;

/** maplibre-gl's chunks: the library and its facade. */
export const MAPLIBRE_GL_CHUNKS = /\/_astro\/maplibre-gl\.[^/]+\.js$/;

/** maplibre-gl's library chunk in the site built in `dir`: the 1 MB one, not its small facade. */
export function mapLibreLibraryChunk(dir: string): string {
  const astro = join(dir, "_astro");
  const library = readdirSync(astro).find(
    (file) =>
      MAPLIBRE_GL_CHUNKS.test(`/_astro/${file}`) && statSync(join(astro, file)).size > 500_000,
  );
  if (library === undefined) throw new Error("the site's build has no maplibre-gl library chunk");
  return `/_astro/${library}`;
}
