/**
 * The skill's last section: what an agent most often gets wrong, as a checklist before it
 * finishes. Every code span in it is held to the API or to the doc that states it
 * (`agent-skill-mistakes.test.ts`).
 */
export function mistakesToAvoid(): string {
  return `## Mistakes to avoid

- Writing 0.2: no jQuery, no \`new Maplace(options).Load()\`.
- A map with no height: it fills its container, so give the container one (\`<maplace-map>\` has one unless unstyled).
- On Google, no key: a key is always needed, in the element's \`api-key\`, \`createGoogleMap\`'s \`apiKey\`, or \`key\` in Google's loader. A missing key raises no error: Google draws the map and only logs \`ApiProjectMapError\`. Without \`map-id\` or \`mapId\` the map runs on \`DEMO_MAP_ID\`, which isn't for production.
- Points as GeoJSON's \`[lng, lat]\`: a location's points are \`{ lat, lng }\`; turn a FeatureCollection into locations with \`locationsFromGeoJSON\`.
- \`html\` without \`sanitize\`: that is \`missing-sanitizer\`. \`content\`, a string shown as text, a node or a function, needs none.
- Loading before consent: give the element \`hold\`, and call \`release()\` once the visitor agrees; from npm, call \`createGoogleMap\` or \`createMapLibreMap\`, or render React's map, only then.`;
}
