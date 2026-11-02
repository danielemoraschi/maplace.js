import { describe, expect, it } from "vitest";
import { recordsFromCsv } from "./builder-csv.ts";
import { createReport, type Report } from "./builder-report.ts";

const read = (text: string, report: Report = createReport()) => recordsFromCsv(text, report);

describe("recordsFromCsv", () => {
  it("reads quoted fields, doubled quotes and line breaks inside quotes", () => {
    expect(read('lat,lng,title\n1,2,"a, ""b""\nc"')).toEqual([
      { lat: 1, lng: 2, title: 'a, "b"\nc' },
    ]);
  });

  it.each([
    ["tab", "lat\tlng\tname, of\n1\t2\tx, y"],
    ["semicolon", "lat;lng;name, of\n1;2;x, y"],
  ])("takes a %s when the header has most of it", (_name, text) => {
    expect(read(text)).toEqual([{ lat: 1, lng: 2 }]);
  });

  it("breaks a tie by taking the tab, then the semicolon", () => {
    expect(read("lat;lng;a,b,c\n1;2;x,y,z")).toEqual([{ lat: 1, lng: 2 }]);
    expect(read("lat\tlng\tb;c;d\n1\t2\tz")).toEqual([{ lat: 1, lng: 2 }]);
  });

  it("drops a BOM and CRLF", () => {
    expect(read(`${String.fromCharCode(0xfeff)}lat,lng\r\n1,2\r\n`)).toEqual([{ lat: 1, lng: 2 }]);
  });

  it.each([
    ["LAT, Lng ", { lat: 1, lng: 2 }],
    ["Latitude,LON", { lat: 1, lng: 2 }],
    ["latitude,long", { lat: 1, lng: 2 }],
    ["lat,longitude", { lat: 1, lng: 2 }],
  ])("reads the header %s", (header, expected) => {
    expect(read(`${header}\n1,2`)).toEqual([expected]);
  });

  it("takes name as the title, and id, html, icon and group as written", () => {
    expect(read("lat,lng,name,id,html,icon,group\n1,2,n,7,<b>x</b>,i.png,g")).toEqual([
      { lat: 1, lng: 2, title: "n", id: "7", html: "<b>x</b>", icon: "i.png", group: "g" },
    ]);
  });

  it("turns lat, lng and zoom into numbers and leaves a bad one as written", () => {
    expect(read("lat,lng,zoom\n1.5,north,7")).toEqual([{ lat: 1.5, lng: "north", zoom: 7 }]);
  });

  it("splits tags on semicolons or spaces", () => {
    expect(read('lat,lng,tags\n1,2,"a;b c"')).toEqual([{ lat: 1, lng: 2, tags: ["a", "b", "c"] }]);
  });

  it("leaves out empty cells and blank lines", () => {
    expect(read("lat,lng,title\n\n1,2,\n\n")).toEqual([{ lat: 1, lng: 2 }]);
  });

  it("leaves out a row of nothing but delimiters", () => {
    expect(read("lat,lng\n1,2\n,,\n")).toEqual([{ lat: 1, lng: 2 }]);
  });

  it("reports an unknown column once, and looks nothing up on the prototype", () => {
    const report = createReport();
    expect(read("lat,lng,colour,constructor\n1,2,red,x\n3,4,blue,y", report)).toHaveLength(2);
    expect(report.notes().map(({ name }) => name)).toEqual(["colour", "constructor"]);
  });

  it("lets an empty cell past the header's end through", () => {
    expect(read("lat,lng\n1,2,")).toEqual([{ lat: 1, lng: 2 }]);
  });

  it("takes the user's paste: title wins where a row has it, and name fills the rest", () => {
    const report = createReport();
    const records = read(
      "name,lat,lng,title\nRome,41.9028,12.4964,my title\nMilan,45.4642,9.19\nVenice,45.4408,12.3155",
      report,
    );
    expect(records.map(({ title }) => title)).toEqual(["my title", "Milan", "Venice"]);
    expect(report.notes().map(({ name }) => name)).toEqual(["name"]);
  });

  it.each([
    ["lon", "lng", "lat,lng,lon\n1,2,9", "lat,lon,lng\n1,9,2"],
    ["long", "lng", "lat,lng,long\n1,2,9", "lat,long,lng\n1,9,2"],
    ["longitude", "lng", "lat,lng,longitude\n1,2,9", "lat,longitude,lng\n1,9,2"],
    ["latitude", "lat", "lng,lat,latitude\n2,1,9", "lng,latitude,lat\n2,9,1"],
  ])("a field's own column beats its alias %s in either order", (alias, field, ...texts) => {
    for (const text of texts) {
      const report = createReport();
      expect(read(text, report)).toEqual([{ lat: 1, lng: 2 }]);
      expect(report.notes()).toEqual([expect.objectContaining({ name: alias })]);
      expect(report.notes()[0]?.says).toContain(`fills ${field}`);
    }
  });

  it.each([["name,title,lat,lng\nA,B,1,2"], ["title,name,lat,lng\nB,A,1,2"]])(
    "a field's own column beats its alias name in %s",
    (text) => {
      expect(read(text)).toEqual([{ title: "B", lat: 1, lng: 2 }]);
    },
  );

  it("gives a row with an empty own cell its alias, with no note", () => {
    const report = createReport();
    expect(read("title,name,lat,lng\n,A,1,2", report)).toEqual([{ title: "A", lat: 1, lng: 2 }]);
    expect(report.notes()).toEqual([]);
  });

  it("takes the first of two aliases", () => {
    expect(read("lon,long,lat\n2,9,1")).toEqual([{ lng: 2, lat: 1 }]);
  });

  it("takes the first of two columns under one name, the second filling a gap", () => {
    expect(read("title,title,lat,lng\nA,B,1,2\n,C,3,4")).toEqual([
      { title: "A", lat: 1, lng: 2 },
      { title: "C", lat: 3, lng: 4 },
    ]);
  });

  it("says what a losing column fills and which was used, once", () => {
    const report = createReport();
    read("title,name,lat,lng\nA,B,1,2\nC,D,3,4", report);
    expect(report.notes()).toEqual([
      {
        name: "name",
        says: "fills title, as another column does; where a row has both, that one was used",
      },
    ]);
  });

  it.each([
    ["a header without coordinates", "title,place\nx,y", "needs a header row naming lat and lng"],
    ["a header alone", "lat,lng", "no rows"],
    ["an unclosed quote", 'lat,lng,title\n1,2,"x', "line 2"],
    ["an overlong row", "lat,lng\n1,2\n3,4,5", "Row 3"],
  ])("refuses %s", (_name, text, words) => {
    expect(() => read(text)).toThrow(words);
  });
});
