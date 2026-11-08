import type { Location } from "@maplacejs/maplace";
import { LocationList, MaplaceProvider } from "@maplacejs/maplace/react";
import { CityMap } from "./city-map";

/** Where a server component's data would come from: a database, an API. */
async function loadCities(): Promise<Location[]> {
  return [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan" },
  ];
}

/** A server component: it loads the data and hands it to the binding, a client boundary. */
export async function Page() {
  const cities = await loadCities();
  return (
    <html lang="en">
      <body>
        <MaplaceProvider locations={cities}>
          <CityMap />
          <LocationList label="Cities" />
        </MaplaceProvider>
      </body>
    </html>
  );
}
