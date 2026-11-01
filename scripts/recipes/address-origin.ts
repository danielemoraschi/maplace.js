// An address typed into your own form becomes the point the list measures from. `geocode` is yours;
// a blank address clears the point. The button stays disabled until this runs: a submit without it
// would put the address in the page's URL. Returns what stops listening.
import type { LatLng, Maplace } from "maplace";

/** Your geocoder: the address's point, or `undefined` when it finds none. */
export type Geocode = (address: string) => Promise<LatLng | undefined>;

function partOf<Part extends Element>(form: HTMLFormElement, selector: string): Part {
  const part = form.querySelector<Part>(selector);
  if (!part) throw new Error(`The form needs an element matching ${selector}`);
  return part;
}

export function searchFromAddress(
  form: HTMLFormElement,
  map: Maplace,
  geocode: Geocode,
): () => void {
  const input = partOf<HTMLInputElement>(form, '[name="address"]');
  const status = partOf(form, '[role="status"]');
  const button = partOf<HTMLButtonElement>(form, '[type="submit"]');
  let latest = 0;

  function measureFrom(point: LatLng): void {
    map.setOrigin(point);
    const { viewport } = map.getSnapshot();
    if (viewport) map.setView(point, viewport.zoom);
  }

  async function search(address: string, ask: number): Promise<void> {
    form.setAttribute("aria-busy", "true");
    const point = await geocode(address);
    if (ask !== latest) return;
    if (point) measureFrom(point);
    status.textContent = point ? `Nearest to ${address}` : "Address not found";
  }

  async function submitted(event: Event): Promise<void> {
    event.preventDefault();
    latest += 1;
    const ask = latest;
    status.textContent = "";
    const address = input.value.trim();
    try {
      if (address) await search(address, ask);
      else map.setOrigin(undefined);
    } catch (error) {
      console.error(error);
      if (ask === latest) status.textContent = "Search unavailable";
    } finally {
      if (ask === latest) form.removeAttribute("aria-busy");
    }
  }

  form.addEventListener("submit", submitted);
  button.disabled = false;
  return () => {
    button.disabled = true;
    form.removeEventListener("submit", submitted);
    latest += 1;
    form.removeAttribute("aria-busy");
  };
}
