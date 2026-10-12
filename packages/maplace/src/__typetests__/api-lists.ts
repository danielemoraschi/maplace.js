// The API lists the RFC states, as values `scripts/checks/rfc.ts` compares with the RFC;
// `api-lists.test-d.ts` ties each one to its type.
export const API_LISTS = {
  misuseCodes: [
    "invalid-input",
    "duplicate-id",
    "unknown-id",
    "unsupported-capability",
    "missing-sanitizer",
    "already-attached",
    "destroyed",
  ],
  runtimeCodes: ["provider-load-failed", "provider-auth-failed", "route-failed"],
  events: ["select", "hover", "change", "popupOpen", "popupClose", "viewport", "route", "error"],
  capabilities: ["route", "cluster", "circle", "edit"],
} as const;
