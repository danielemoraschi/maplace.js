import { MaplaceError } from "../errors";
import { type AuthHook, createAuthHook } from "./auth-hook";

let pageHook: AuthHook | undefined;

/** The page's one auth hook, taken over on first use: every adapter on the page listens to it. */
export function pageAuthHook(): AuthHook {
  pageHook ??= createAuthHook(globalThis);
  return pageHook;
}

export function keyRefusedError(): MaplaceError {
  return new MaplaceError(
    "provider-auth-failed",
    "Google Maps refused the API key; its console error says why (e.g. RefererNotAllowedMapError)",
  );
}
