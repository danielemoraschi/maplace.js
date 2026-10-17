/** An example page's map, from its opening tag to its closing one. */
const MAP = /<maplace-map\b[\s\S]*?<\/maplace-map>/g;

/** Where an example page has the reader put their key. */
const KEY_PLACEHOLDER = ' api-key="YOUR_KEY"';

/**
 * The map of an example page as the site runs it: held until the visitor consents (`release()`),
 * with the site's key, or none when it has none. The page's CDN script is left out: the site's
 * own bundle defines the element.
 */
export function liveMap(pageHtml: string, apiKey: string | undefined): string {
  const map = onlyMapOf(pageHtml);
  if (map.split(KEY_PLACEHOLDER).length !== 2) {
    throw new Error(`an example's map has the key placeholder${KEY_PLACEHOLDER} once`);
  }
  const key = apiKey === undefined ? "" : ` api-key="${attributeValue(apiKey)}"`;
  return map.replace(KEY_PLACEHOLDER, key).replace("<maplace-map", "<maplace-map hold");
}

function onlyMapOf(pageHtml: string): string {
  const maps = pageHtml.match(MAP) ?? [];
  const [map] = maps;
  if (maps.length !== 1 || map === undefined) {
    throw new Error(`an example page has one <maplace-map>; this one has ${maps.length}`);
  }
  return map;
}

function attributeValue(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
