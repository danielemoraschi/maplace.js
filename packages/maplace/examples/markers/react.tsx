import type { Location } from "maplace";
import { createGoogleAdapter } from "maplace/google";
import { LocationList, MaplaceMap, MaplaceProvider } from "maplace/react";

/** Your own fields, in each location's `data`. */
interface City {
  readonly about?: string;
  readonly starred?: boolean;
}

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });

// Outside the component, so a render of the page around it doesn't render every marker again.
const popupContent = ({ title, data }: Location<City>) =>
  data?.about ? (
    <>
      <strong>{title}</strong>
      <p>{data.about}</p>
    </>
  ) : null;

const markerIcon = ({ data }: Location<City>) => (data?.starred ? <span>★</span> : null);

export function Markers({ locations }: { readonly locations: readonly Location<City>[] }) {
  return (
    <MaplaceProvider locations={locations}>
      <MaplaceMap
        createAdapter={createAdapter}
        className="map"
        popupContent={popupContent}
        markerIcon={markerIcon}
      />
      <LocationList />
    </MaplaceProvider>
  );
}
