// An example's stylesheet in `examples/styles/`, linked from each version's HTML: written in as a
// `<style>` wherever a version's HTML is put in a document of its own, by the site and the runners,
// so it applies there as it does on a reader's copy beside the file.

/** A stylesheet link, as an example writes it: `<link rel="stylesheet" href="../styles/whats-on.css">`. */
const STYLESHEET_LINK = /<link rel="stylesheet" href="([^"]*)">/g;

/** Any link left once the stylesheet links are written in: one written another way. */
const ANY_LINK = /<link\b[^>]*>/;

/** The examples' folder of stylesheets, beside `data/`. */
const STYLES_FOLDER = "styles";

/** A stylesheet's file name, in `styles/` itself: `whats-on.css`. */
const STYLESHEET_FILE = /^[^/]+\.css$/;

/** Where an example's folder is resolved from: a base with no host, so `//host` leaves it. */
const EXAMPLES_ROOT = "file:///examples/";

/** A stylesheet's place under `examples/`: `styles`, `whats-on.css`. */
export interface StylesheetPlace {
  readonly folder: string;
  readonly file: string;
}

/**
 * `html`, from the example folder `folder` (`whats-on/maplibre`), with each stylesheet it links
 * written in its place as a `<style>`, its text from `read`, given the stylesheet's place. Any
 * other `<link>` is refused, as neither the site nor the runners could load it.
 */
export function withStylesheetsWritten(
  html: string,
  folder: string,
  read: (folder: string, file: string) => string,
): string {
  const written = html.replaceAll(STYLESHEET_LINK, (_link, href: string) => {
    const place = placeOf(href, folder);
    return `<style>\n${read(place.folder, place.file)}</style>`;
  });
  const left = ANY_LINK.exec(written)?.[0];
  if (left !== undefined) {
    throw new Error(
      `an example's only links are stylesheets, as <link rel="stylesheet" href="…">, not ${left}`,
    );
  }
  return written;
}

/** The stylesheets `html`, from the example folder `folder`, links, each by its place. */
export function stylesheetsLinkedBy(html: string, folder: string): StylesheetPlace[] {
  return [...html.matchAll(STYLESHEET_LINK)].map(([, href = ""]) => placeOf(href, folder));
}

/**
 * Where `href`, from the example folder `folder`, is under `examples/`; refused unless it is a
 * `.css` file in `examples/styles/` (`styles/whats-on.css`), the one place the site and the
 * runners read a stylesheet from.
 */
function placeOf(href: string, folder: string): StylesheetPlace {
  const path = new URL(href, `${EXAMPLES_ROOT}${folder}/`).href.slice(EXAMPLES_ROOT.length);
  const file = path.slice(STYLES_FOLDER.length + 1);
  if (!path.startsWith(`${STYLES_FOLDER}/`) || !STYLESHEET_FILE.test(file)) {
    throw new Error(`an example links a .css file in examples/styles/ only, not ${href}`);
  }
  return { folder: STYLES_FOLDER, file };
}
