/// <reference types="google.maps" />

/** The text heading an InfoWindow (real or stub): its `headerContent`'s, if it has one. */
export function headingOf(
  infoWindow: Pick<google.maps.MVCObject, "get"> | undefined,
): string | undefined {
  const heading = infoWindow?.get("headerContent") as Node | null | undefined;
  return heading?.textContent ?? undefined;
}
