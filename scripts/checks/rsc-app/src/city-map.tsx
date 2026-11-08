"use client";
import { createGoogleAdapter } from "@maplacejs/maplace/google";
import { MaplaceMap } from "@maplacejs/maplace/react";

// Functions can't cross from a server component: the map's adapter is made here, on the client.
export function CityMap() {
  return <MaplaceMap createAdapter={createGoogleAdapter} className="map" />;
}
