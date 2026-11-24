const TRAILING_SOURCE_MAP_COMMENT = /\n\/\/# sourceMappingURL=\S+\s*$/;

/**
 * maplibre-gl's worker without its trailing source map comment, which names a map beside it: the
 * CDN script starts the worker from a `blob:` URL, and the site serves no map beside it.
 */
export function withoutSourceMapComment(source: string): string {
  return source.replace(TRAILING_SOURCE_MAP_COMMENT, "\n");
}
