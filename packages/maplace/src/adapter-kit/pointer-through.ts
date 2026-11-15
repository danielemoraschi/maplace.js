/**
 * A popup the pointer goes through, to the map under it (`PopupWindow.passPointer`): it and all it
 * holds, whatever a provider's own rules say. Not a look, as the popup styles are: the session
 * adopts it for every provider, and the page's rules don't win over it.
 */
export const POINTER_THROUGH_ATTRIBUTE = "data-maplace-pointer-through";
export const POINTER_THROUGH_RULE = `[${POINTER_THROUGH_ATTRIBUTE}],[${POINTER_THROUGH_ATTRIBUTE}] *{pointer-events:none!important}`;
