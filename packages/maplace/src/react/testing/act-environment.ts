// Tells React its updates are wrapped in `act`, so it flushes them there and warns otherwise.
// Imported for this effect alone, by every test that renders through `act`.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
