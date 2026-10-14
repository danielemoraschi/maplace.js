/// <reference types="google.maps" />
import type { LatLng } from "../../geometry";
import { StubMVCObject } from "./stub-mvc";

/** A point as Google holds one. */
export class StubLatLng {
  constructor(readonly point: LatLng) {}

  toJSON(): LatLng {
    return { ...this.point };
  }
}

/** One of Google's path arrays: each change fires its event, as a vertex handle's does. */
export class StubPath extends StubMVCObject {
  readonly #points: StubLatLng[];

  constructor(points: readonly LatLng[]) {
    super();
    this.#points = points.map((point) => new StubLatLng(point));
  }

  getArray(): StubLatLng[] {
    return this.#points;
  }

  getAt(index: number): StubLatLng | undefined {
    return this.#points[index];
  }

  getLength(): number {
    return this.#points.length;
  }

  setAt(index: number, point: LatLng): void {
    this.#points[index] = new StubLatLng(point);
    this.trigger("set_at", index);
  }

  insertAt(index: number, point: LatLng): void {
    this.#points.splice(index, 0, new StubLatLng(point));
    this.trigger("insert_at", index);
  }
}

/** What every shape shares: options, its map, and listeners. */
class StubShape extends StubMVCObject {
  setMap(map: unknown): void {
    this.set("map", map);
  }

  getMap(): unknown {
    return this.get("map");
  }
}

export class StubCircle extends StubShape {
  setCenter(center: LatLng): void {
    this.set("center", new StubLatLng(center));
  }

  getCenter(): StubLatLng | undefined {
    return this.get("center") as StubLatLng | undefined;
  }

  setRadius(radius: number): void {
    this.set("radius", radius);
  }

  getRadius(): number {
    return this.get("radius") as number;
  }
}

/** Setting a path makes new arrays, as Google does. */
export class StubPolyline extends StubShape {
  #path = new StubPath([]);

  setPath(path: readonly LatLng[]): void {
    this.#path = new StubPath(path);
  }

  getPath(): StubPath {
    return this.#path;
  }
}

export class StubPolygon extends StubShape {
  #paths: StubPath[] = [];

  setPaths(paths: readonly (readonly LatLng[])[]): void {
    this.#paths = paths.map((path) => new StubPath(path));
  }

  getPaths(): { getArray(): StubPath[] } {
    return { getArray: () => this.#paths };
  }
}
