// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { CONSENT_KEY, createConsentStore } from "./consent-store.ts";

const blocked = (): Storage => {
  throw new DOMException("site data is blocked", "SecurityError");
};

describe("createConsentStore", () => {
  beforeEach(() => localStorage.clear());

  it("has no consent until it is granted, and keeps it for the next visit", () => {
    expect(createConsentStore(() => localStorage).isGranted()).toBe(false);
    createConsentStore(() => localStorage).grant();
    expect(createConsentStore(() => localStorage).isGranted()).toBe(true);
    expect(localStorage.getItem(CONSENT_KEY)).not.toBeNull();
  });

  it("forgets consent once revoked", () => {
    const store = createConsentStore(() => localStorage);
    store.grant();
    store.revoke();
    expect(store.isGranted()).toBe(false);
    expect(createConsentStore(() => localStorage).isGranted()).toBe(false);
  });

  it("keeps consent under maplace-site:maps, the key the privacy page names", () => {
    createConsentStore(() => localStorage).grant();
    expect(localStorage.getItem("maplace-site:maps")).toBe("granted");
  });

  it("keeps consent for the page when the browser keeps no site data", () => {
    const store = createConsentStore(blocked);
    expect(store.isGranted()).toBe(false);
    store.grant();
    expect(store.isGranted()).toBe(true);
    store.revoke();
    expect(store.isGranted()).toBe(false);
  });
});
