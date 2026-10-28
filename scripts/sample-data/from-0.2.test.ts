import { describe, expect, it } from "vitest";
import { mixedGroupsFromAjax, pointsFrom4k } from "./from-0.2.ts";

// Excerpts of 0.2.10's website/data/ajax.php and 4k.js, as written there.
const AJAX = `<?php
switch($t) {
	case 4:
		echo '{"title":"Group E","type":"circle","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2","html":"<h3>Content A2</h3><p>Lorem Ipsum..</p>","zoom":8,"circle_options":{"radius":30000}}]}';
		break;
	case 3:
		echo '{"title":"Group D","type":"polygon","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2"},{"lat":51.2,"lon":22.2,"title":"Title B2"},{"lat":49.4,"lon":35.9,"title":"Title C2"}]}';
		break;
	case 2:
		echo '{"title":"Group C","type":"directions","locations":[{"lat":45.9,"lon":10.9,"title":"Title A1","html":"<h3>Content A1</h3>"},{"lat":44.8,"lon":1.7,"title":"Title B1","html":"<h3>Content B1</h3>","show_infowindow":false}]}';
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

describe("mixedGroupsFromAjax", () => {
  const groups = () => mixedGroupsFromAjax(AJAX);
  const group = (letter: string) => groups().find((candidate) => candidate.letter === letter);

  it("converts each of 0.2's five groups, A to E, in order", () => {
    expect(groups().map(({ letter }) => letter)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("makes markers of groups A and B, as 1.0 locations", () => {
    expect(group("a")?.locations).toEqual([
      {
        id: "a1",
        group: "Markers",
        title: "Title A1",
        content: "Content A1",
        lat: 45.9,
        lng: 10.9,
      },
    ]);
    expect(group("b")?.locations).toEqual([
      {
        id: "b1",
        group: "More markers",
        title: "Title B2",
        content: "Content B2",
        lat: 51.2,
        lng: 22.2,
      },
    ]);
  });

  it("makes markers of group C's directions, for a route through them in order, no popup where 0.2 showed none", () => {
    expect(group("c")?.locations).toEqual([
      {
        id: "c1",
        group: "Route",
        title: "Title A1",
        content: "Content A1",
        lat: 45.9,
        lng: 10.9,
      },
      { id: "c2", group: "Route", title: "Title B1", lat: 44.8, lng: 1.7 },
    ]);
  });

  it("makes one polygon of group D's points", () => {
    expect(group("d")?.locations).toEqual([
      {
        id: "d1",
        group: "Area",
        title: "Area",
        type: "polygon",
        path: [
          { lat: 52.1, lng: 11.3 },
          { lat: 51.2, lng: 22.2 },
          { lat: 49.4, lng: 35.9 },
        ],
      },
    ]);
  });

  it("makes a circle of group E", () => {
    expect(group("e")?.locations).toEqual([
      {
        id: "e1",
        group: "Circle",
        title: "Title A2",
        content: "Content A2 Lorem Ipsum..",
        type: "circle",
        center: { lat: 52.1, lng: 11.3 },
        radius: 30000,
      },
    ]);
  });

  it("throws when a group it converts is missing", () => {
    expect(() => mixedGroupsFromAjax(AJAX.replace("Group B", "Group Z"))).toThrow(/Group B/);
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
