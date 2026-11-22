// What each example's thumbnail and sharing image show: the one thing that sets it apart (W65).
import type { Scene } from "./scene.ts";
import { CLOSE_UP_SCENE_HEIGHT, type SceneHeight } from "./shot-sizes.ts";

/** How one example is framed and staged for its pictures. */
export interface ShotPlan {
  /** Its folder in `packages/maplace/examples/`. */
  readonly name: string;
  /** The whole example, its own controls and panels around the map, rather than its map alone. */
  readonly frame?: "example";
  /** The map's own list taken away before it opens, where the picture is the map's. */
  readonly hidesList?: true;
  /** The scene's height, `DEFAULT_SCENE_HEIGHT` unless an example needs more room or a close-up. */
  readonly height?: SceneHeight;
  /** What the scene is put through once its map is open: a selection, a view, a query. */
  readonly stage?: (scene: Scene) => Promise<void>;
}

/** A globe flattened by its toggle, so the world fills the picture. */
const flatten = (scene: Scene) => scene.example.getByRole("button", { name: "Globe" }).click();

/** The example's own select set to `label`. */
async function choose(scene: Scene, label: string): Promise<void> {
  await scene.example.locator("select").first().selectOption({ label });
}

export const SHOT_PLANS: readonly ShotPlan[] = [
  // Its one pin.
  { name: "simple", height: CLOSE_UP_SCENE_HEIGHT },
  // The three kinds together: the map's pin on Edinburgh and Manchester, London's image and
  // Cardiff's markup.
  {
    name: "markers",
    stage: (scene) => scene.view({ center: { lat: 53.9, lng: -2.4 }, zoom: 5.6 }),
  },
  // One museum in its selected look, its neighbours in theirs.
  {
    name: "css-markers",
    stage: async (scene) => {
      await scene.view({ center: { lat: 52.3665, lng: 4.893 }, zoom: 13.6 });
      await scene.select("anne-frank", { pan: false });
    },
  },
  // The Colosseum's card whole, its pin low in the picture so the card sits in the middle.
  {
    name: "popups",
    height: CLOSE_UP_SCENE_HEIGHT,
    stage: async (scene) => {
      await scene.select("colosseum", { zoom: 14 });
      await scene.view({ center: { lat: 41.8972, lng: 12.4922 }, zoom: 14 });
    },
  },
  {
    name: "click-to-add",
    stage: async (scene) => {
      // Two pins added by a click each, on land between Milan and Rome.
      await scene.view({ center: { lat: 43.9, lng: 11.4 }, zoom: 6.3 });
      const box = await scene.map.boundingBox();
      for (const [x, y] of [
        [0.47, 0.5],
        [0.6, 0.66],
      ] as const) {
        if (box) await scene.page.mouse.click(box.x + box.width * x, box.y + box.height * y);
        await scene.page.waitForTimeout(300);
      }
    },
  },
  {
    name: "menu",
    stage: (scene) => choose(scene, "London"),
  },
  { name: "custom-list", stage: (scene) => scene.select("york", { pan: false }) },
  { name: "tabs", stage: (scene) => scene.view({ center: { lat: 52.6, lng: -1.5 }, zoom: 5.6 }) },
  {
    name: "tags",
    frame: "example",
    stage: async (scene) => {
      await scene.example.getByLabel("Parking").check();
      await scene.example.getByLabel("Open late").check();
    },
  },
  {
    name: "offices",
    stage: async (scene) => {
      await scene.example.getByRole("button", { name: /Groups/ }).click();
      await scene.example.getByRole("checkbox", { name: /Asia/ }).uncheck();
    },
  },
  {
    name: "search",
    stage: (scene) => scene.example.getByRole("searchbox").fill("na"),
  },
  {
    name: "nearest",
    stage: async (scene) => {
      const context = scene.page.context();
      await context.grantPermissions(["geolocation"]);
      await context.setGeolocation({ latitude: 51.75, longitude: -1.26 });
      await scene.example.getByRole("button", { name: "My location" }).click();
    },
  },
  {
    name: "this-area",
    stage: async (scene) => {
      await scene.example.getByText("This area", { exact: true }).click();
      await scene.view({ center: { lat: 50.5, lng: 9 }, zoom: 4.6 });
    },
  },
  {
    name: "circles",
    hidesList: true,
    stage: async (scene) => {
      await scene.select("resizable", { pan: false });
      await scene.fit();
    },
  },
  { name: "polygon", stage: (scene) => scene.select("park") },
  { name: "mixed", hidesList: true },
  {
    name: "choropleth",
    stage: async (scene) => {
      await flatten(scene);
      await scene.view({ center: { lat: 28, lng: 45 }, zoom: 1.5 });
      await scene.hover("IND");
    },
  },
  {
    name: "polyline",
    hidesList: true,
    stage: async (scene) => {
      await scene.select("trail", { pan: false });
      await scene.fit();
    },
  },
  {
    name: "flights",
    hidesList: true,
    // The globe close, past the picture's top and bottom, the plane over the Atlantic in view.
    stage: (scene) => scene.view({ center: { lat: 40, lng: -12 }, zoom: 2.55 }),
  },
  // Shanghai to Los Angeles selected, its card open over the Pacific.
  {
    name: "trade-lanes",
    hidesList: true,
    stage: async (scene) => {
      await scene.select("shanghai-los-angeles", { pan: false });
      await scene.view({ center: { lat: 36, lng: -178 }, zoom: 2.3 });
    },
  },
  { name: "route", hidesList: true },
  // The clusters' badges, centred on the points (North America), with room around them.
  { name: "big", stage: (scene) => scene.view({ center: { lat: 56, lng: -98 }, zoom: 1.8 }) },
  {
    name: "earthquakes",
    hidesList: true,
    stage: (scene) => scene.view({ center: { lat: 5, lng: 150 }, zoom: 2.2 }),
  },
  {
    name: "live-data",
    frame: "example",
    hidesList: true,
    stage: async (scene) => {
      await scene.example.getByRole("button", { name: "More markers" }).click();
      await scene.page.waitForTimeout(500);
      await scene.fit();
    },
  },
  // Its placeholder, words and button.
  { name: "load-on-demand", height: CLOSE_UP_SCENE_HEIGHT },
  { name: "link-to-place", frame: "example", stage: (scene) => scene.select("rome") },
  {
    name: "whats-on",
    frame: "example",
    height: 525,
    stage: async (scene) => {
      // Its map is nested in its own row, a fixed 26rem tall: the row and the map fill the picture.
      await scene.page.addStyleTag({
        content:
          ".whats-on { flex: 1 1 auto !important; } .whats-on-map { height: auto !important; }",
      });
      await scene.select("barbican", { pan: false });
      // The venues close, as the reader's own capture showed them: a view, not a fit, since the
      // map takes its new box on a later frame and a fit could still be for the old one.
      await scene.view({ center: { lat: 51.513, lng: -0.115 }, zoom: 12.4 });
    },
  },
  {
    name: "team",
    hidesList: true,
    stage: async (scene) => {
      await flatten(scene);
      await scene.fit();
    },
  },
  {
    name: "styled",
    frame: "example",
    stage: (scene) => choose(scene, "Dark"),
  },
  {
    name: "brand",
    hidesList: true,
    stage: async (scene) => {
      await scene.select("north", { pan: false });
      await scene.fit();
    },
  },
  // Its four bare pins, in the scene's top: its map is taller than the scene.
  {
    name: "unstyled",
    height: CLOSE_UP_SCENE_HEIGHT,
    stage: (scene) => scene.view({ center: { lat: 43, lng: 11.8 }, zoom: 5.5 }),
  },
];
