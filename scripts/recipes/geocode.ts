// Addresses to coordinates, once, before your page ships: each place in places.json without
// coordinates gets them from the geocoder, its address kept in `data`. The key comes from the
// environment, never as an argument: GEOCODER_KEY=your-key node geocode.mts places.json
import { readFile, rename, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

interface Place {
  readonly id: string;
  readonly address?: string;
  readonly lat?: number;
  readonly data?: object;
}

/** OpenCage; another geocoder is its URL and where its answer puts the point. */
const geocoder = {
  url: (address: string, key: string) =>
    `https://api.opencagedata.com/geocode/v1/json?limit=1&no_annotations=1&key=${encodeURIComponent(key)}&q=${encodeURIComponent(address)}`,
  pointIn: (answer: { results: { geometry: { lat: number; lng: number } }[] }) =>
    answer.results[0]?.geometry,
};

const key = process.env.GEOCODER_KEY;
if (!key) throw new Error("Set GEOCODER_KEY to your geocoder's key");
const file = process.argv[2] ?? "places.json";
const places: Place[] = JSON.parse(await readFile(file, "utf8"));
for (const [index, { address, ...place }] of places.entries()) {
  if (place.lat !== undefined || !address?.trim()) continue;
  const response = await fetch(geocoder.url(address, key));
  if (!response.ok) {
    throw new Error(
      `${response.status} for "${address}": check the address, GEOCODER_KEY and your quota`,
    );
  }
  const point = geocoder.pointIn(await response.json());
  if (point) {
    places[index] = { ...place, ...point, data: { ...place.data, address } };
    // Saved at once, so a run stopped partway keeps what it placed; written aside, then moved
    // over the original, so a failed write never truncates it.
    await writeFile(`${file}.tmp`, `${JSON.stringify(places, null, 2)}\n`);
    await rename(`${file}.tmp`, file);
  } else {
    console.warn(`No match: ${address}`);
  }
  await sleep(1000); // one request a second: OpenCage's free rate
}
