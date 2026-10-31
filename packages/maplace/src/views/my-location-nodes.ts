import { element, statusElement, toggleButton } from "./listbox-nodes";

export const MY_LOCATION_CLASS = "maplace-my-location";
export const MY_LOCATION_BOX_CLASS = "maplace-my-location-box";
export const MY_LOCATION_STATUS_CLASS = "maplace-my-location-status";

/** The control's parts, as `createMyLocationControl` drives them. */
export interface MyLocationNodes {
  readonly control: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly status: HTMLElement;
}

/** The button, in a box drawn as the area switch's, and the status always on the page beneath it. */
export function myLocationNodes(label: string): MyLocationNodes {
  const button = toggleButton(label);
  const box = element("div", MY_LOCATION_BOX_CLASS);
  box.append(button);
  const status = statusElement(MY_LOCATION_STATUS_CLASS);
  const control = element("div", MY_LOCATION_CLASS);
  control.append(box, status);
  return { control, button, status };
}
