// Writes the choropleth example's countries from Natural Earth's 1:110m admin-0 countries, version
// 5.1.2, which are public domain: run once by hand with the downloaded file,
// `node scripts/countries-data.ts ne_110m_admin_0_countries.geojson`, then `npm run fix`, which
// formats it as Biome formats every JSON file in the repo. From
// https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./build/package.ts";
import { countriesFrom } from "./sample-data/natural-earth.ts";

const [source] = process.argv.slice(2);
if (source === undefined) {
  console.error("usage: node scripts/countries-data.ts <ne_110m_admin_0_countries.geojson>");
  process.exit(1);
}

const target = join(ROOT, "packages/maplace/examples/data/countries.json");
writeFileSync(target, JSON.stringify(countriesFrom(JSON.parse(readFileSync(source, "utf8")))));
