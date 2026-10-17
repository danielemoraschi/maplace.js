import { describe, expect, it } from "vitest";
import { locationsFromAjax, pointsFrom4k } from "./from-0.2.ts";

// Excerpts of 0.2.10's website/data/ajax.php and 4k.js, as written there.
const AJAX = `<?php
switch($t) {
	case 4:
		echo '{"title":"Group E","type":"circle","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2","html":"<h3>Content A2</h3><p>Lorem Ipsum..</p>","zoom":8,"circle_options":{"radius":30000}}]}';
		break;
	case 3:
		echo '{"title":"Group D","type":"polygon","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2"}]}';
		break;
	case 1:
		echo '{"title":"Group B","type":"marker","locations":[{"lat":51.2,"lon":22.2,"title":"Title B2","html":"<h3>Content B2</h3>","zoom":8}]}';
		break;
	case 0:
	default:
		echo '{"title":"Group A","type":"marker","locations":[{"lat":45.9,"lon":10.9,"title":"Title A1","html":"<h3>Content A1</h3>","icon":"http://maps.google.com/mapfiles/markerA.png"}]}';
		break;
}`;

const BIG_4K = "var big4k = [{lat:27.91643811,lon:-135.51538737},{lat:-26.6,lon:119.09}];";

describe("locationsFromAjax", () => {
  it("makes markers of groups A and B and a circle of group E, in group order, as 1.0 locations", () => {
    expect(locationsFromAjax(AJAX)).toEqual([
      {
        id: "a1",
        group: "Group A",
        title: "Title A1",
        content: "Content A1",
        lat: 45.9,
        lng: 10.9,
      },
      {
        id: "b1",
        group: "Group B",
        title: "Title B2",
        content: "Content B2",
        lat: 51.2,
        lng: 22.2,
      },
      {
        id: "e1",
        group: "Group E",
        title: "Title A2",
        content: "Content A2 Lorem Ipsum..",
        type: "circle",
        center: { lat: 52.1, lng: 11.3 },
        radius: 30000,
      },
    ]);
  });

  it("throws when a group it converts is missing", () => {
    expect(() => locationsFromAjax(AJAX.replace("Group B", "Group Z"))).toThrow(/Group B/);
  });
});

describe("pointsFrom4k", () => {
  it("makes each {lat, lon} a marker with an id from its 1-based place", () => {
    expect(pointsFrom4k(BIG_4K)).toEqual([
      { id: "p1", lat: 27.91643811, lng: -135.51538737 },
      { id: "p2", lat: -26.6, lng: 119.09 },
    ]);
  });
});
