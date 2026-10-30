import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";
import { Fragment, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const cities: Location[] = [
  {
    id: "rome",
    lat: 41.9028,
    lng: 12.4964,
    title: "Rome",
    group: "Centre",
    tags: ["parking", "open-late"],
  },
  { id: "bologna", lat: 44.4949, lng: 11.3426, title: "Bologna", group: "Centre" },
  { id: "milan", lat: 45.4642, lng: 9.19, title: "Milan", group: "North", tags: ["parking"] },
  { id: "turin", lat: 45.0703, lng: 7.6869, title: "Turin", group: "North", tags: ["open-late"] },
  {
    id: "naples",
    lat: 40.8518,
    lng: 14.2681,
    title: "Naples",
    group: "South",
    tags: ["parking", "open-late"],
  },
];
const CHOICES = [
  { tag: "parking", label: "Parking" },
  { tag: "open-late", label: "Open late" },
];

function Tags() {
  const [tags, setTags] = useState<readonly string[]>([]);
  return (
    <MaplaceProvider locations={cities} filter={{ tags }}>
      <p>
        {CHOICES.map(({ tag, label }) => (
          <Fragment key={tag}>
            <label>
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={(event) =>
                  setTags(
                    event.target.checked ? [...tags, tag] : tags.filter((other) => other !== tag),
                  )
                }
              />{" "}
              {label}
            </label>{" "}
          </Fragment>
        ))}
      </p>
      <MaplaceMap createAdapter={createGoogleAdapter} className="map">
        <LocationList heading="Places" groupCounts position="top-right" />
      </MaplaceMap>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("tags-react-root") as HTMLElement).render(
  <StrictMode>
    <Tags />
  </StrictMode>,
);
