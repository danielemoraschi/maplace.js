import "maplibre-gl/dist/maplibre-gl.css";
import { createMaplace, type Location, listedLocations, type Maplace } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";

const locations: Location[] = [
  { id: "london", lat: 51.5074, lng: -0.1278, title: "London" },
  { id: "york", lat: 53.9591, lng: -1.0815, title: "York" },
  { id: "bath", lat: 51.3811, lng: -2.359, title: "Bath" },
  { id: "oxford", lat: 51.752, lng: -1.2577, title: "Oxford" },
  { id: "cambridge", lat: 52.2053, lng: 0.1218, title: "Cambridge", listed: false },
];

/** A radio choosing `id`, or fitting every location when `id` is empty. */
function choice(maplace: Maplace, id: string, title: string): HTMLLabelElement {
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "custom-list-maplibre-vanilla-choice";
  radio.value = id;
  radio.addEventListener("change", () => {
    maplace.select(id || undefined);
    if (!id) maplace.fitAll();
  });
  const label = document.createElement("label");
  label.append(radio, ` ${title}`);
  return label;
}

/**
 * A list of your own: a radio per location Maplace.js's lists would list, and one to fit them all.
 * The choices are made again when those change; the selection is checked.
 */
function checksMenu(maplace: Maplace, heading: string): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = heading;
  const choices = document.createElement("div");
  fieldset.append(legend, choices);
  let listedIds: string | undefined;
  const render = () => {
    const listed = listedLocations(maplace.getSnapshot());
    const ids = listed.map(({ id }) => id).join();
    if (ids !== listedIds) {
      listedIds = ids;
      const entries = listed.map(({ id, title }) => choice(maplace, id, title ?? id));
      choices.replaceChildren(choice(maplace, "", "Fit all"), ...entries);
    }
    const selected = maplace.getSnapshot().selectedId ?? "";
    for (const radio of choices.querySelectorAll("input")) radio.checked = radio.value === selected;
  };
  render();
  maplace.subscribe(render);
  return fieldset;
}

const maplace = createMaplace({ locations });
const adapter = createMapLibreAdapter();
maplace.attach(adapter, "#custom-list-maplibre-vanilla-map");
adapter.mountControl(checksMenu(maplace, "Choose a location:"), "top-right");
