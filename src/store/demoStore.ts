import { createSeed, type DemoState } from '../mocks/seed';
import type { DemoDataEvent } from '../types/index';

const KEY = 'b2b-demo-v1';
let state: DemoState | undefined;
const listeners = new Set<(event: DemoDataEvent) => void>();

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

function current(): DemoState {
  if (!state) {
    const saved = storage()?.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DemoState;
        if (parsed.version === 1 && parsed.session && Array.isArray(parsed.products)
          && Array.isArray(parsed.orders) && Array.isArray(parsed.confirmations)
          && Array.isArray(parsed.shipments) && Array.isArray(parsed.suppliers)
          && Array.isArray(parsed.customers) && Array.isArray(parsed.addresses)
          && parsed.pricing && Number.isSafeInteger(parsed.nextId)) state = parsed;
      } catch { /* Invalid stored JSON falls back to demo seed. */ }
    }
    state ??= createSeed();
  }
  return state;
}

export function readState(): DemoState { return structuredClone(current()); }

export function mutate<T>(type: DemoDataEvent['type'], action: (draft: DemoState) => T): T {
  const before = current();
  const draft = structuredClone(before);
  const result = action(draft);
  if (type === 'RESET' || JSON.stringify(before) !== JSON.stringify(draft)) {
    // Persist before publishing: failed writes leave the in-memory state unchanged.
    storage()?.setItem(KEY, JSON.stringify(draft));
    state = draft;
    for (const listener of [...listeners]) {
      try { listener({ type }); } catch (error) { console.error('Demo listener failed', error); }
    }
  }
  return structuredClone(result);
}

export function subscribe(listener: (event: DemoDataEvent) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
