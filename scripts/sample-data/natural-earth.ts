// Natural Earth's 1:110m countries (public domain), as the choropleth example reads them.

/** A feature's geometry, kept as it is but for its coordinates' rounding. */
interface Geometry {
  readonly type: string;
  readonly coordinates: unknown;
}

/** The fields of a Natural Earth admin-0 feature this reads. */
interface AdminFeature {
  readonly properties: {
    readonly ADM0_A3: string;
    readonly NAME: string;
    readonly NAME_LONG: string;
    readonly POP_EST: number;
    readonly GDP_MD: number;
  };
  readonly geometry: Geometry;
}

interface AdminCollection {
  readonly features: readonly AdminFeature[];
}

/** One country as the example reads it: GeoJSON, its id the country's code. */
export interface Country {
  readonly type: "Feature";
  readonly id: string;
  readonly properties: { readonly title: string; readonly gdpPerPerson: number | null };
  readonly geometry: Geometry;
}

/** Left out: it has no GDP, and its ring round the pole each map draws its own way. */
const ANTARCTICA = "ATA";

/** Fewer people than this give a GDP per person that says nothing: research stations, islands. */
const FEWEST_PEOPLE = 10_000;

/** Two decimals of a degree, about a kilometre: finer than a 1:110m map draws. */
const DECIMALS = 100;

/**
 * The countries of a Natural Earth admin-0 collection, each with its name and GDP per person, in
 * their names' order, as a list of them reads.
 */
export function countriesFrom(collection: AdminCollection): {
  type: "FeatureCollection";
  features: Country[];
} {
  const features = collection.features
    .filter(({ properties }) => properties.ADM0_A3 !== ANTARCTICA)
    .map(countryOf)
    .sort((a, b) => a.properties.title.localeCompare(b.properties.title, "en"));
  return { type: "FeatureCollection", features };
}

function countryOf({ properties, geometry }: AdminFeature): Country {
  return {
    type: "Feature",
    id: properties.ADM0_A3,
    properties: { title: nameOf(properties), gdpPerPerson: gdpPerPersonOf(properties) },
    geometry: { type: geometry.type, coordinates: rounded(geometry.coordinates) },
  };
}

/**
 * Its short name, or its long one where the short one abbreviates ("Bosnia and Herz."): a screen
 * reader reads the select's names aloud. Not the long one always, which abbreviates others.
 */
function nameOf({ NAME, NAME_LONG }: AdminFeature["properties"]): string {
  return NAME.includes(".") ? NAME_LONG : NAME;
}

/** US dollars a person a year: Natural Earth's GDP is in millions. */
function gdpPerPersonOf({ POP_EST, GDP_MD }: AdminFeature["properties"]): number | null {
  if (POP_EST < FEWEST_PEOPLE) return null;
  return Math.round((GDP_MD * 1_000_000) / POP_EST);
}

function rounded(coordinates: unknown): unknown {
  if (Array.isArray(coordinates)) return coordinates.map(rounded);
  return typeof coordinates === "number"
    ? Math.round(coordinates * DECIMALS) / DECIMALS
    : coordinates;
}
