import { createSeed, addGovernance, commodities, type DemoState } from '../mocks/seed';
import type { DemoDataEvent, ProductListing } from '../types/index';

const KEY = 'b2b-demo-v1';
let state: DemoState | undefined;
const listeners = new Set<(event: DemoDataEvent) => void>();
function storage(): Storage | undefined { return typeof localStorage === 'undefined' ? undefined : localStorage; }

type LegacyState = Omit<DemoState, 'version' | 'products' | 'commodities'> & {
  version: 1;
  pricing?: unknown;
  products: (Omit<ProductListing, 'publicPricePerKg' | 'uses'> & { basePricePerKg: number })[];
};
export function upgradeStoredState(value: unknown): DemoState {
  const parsed = structuredClone(value) as DemoState | LegacyState | (Omit<DemoState, 'version'> & { version: 3 | 4 });
  if (!parsed || ![1, 3, 4, 5].includes(parsed.version) || !parsed.session ||
    !['products', 'orders', 'confirmations', 'shipments', 'suppliers', 'customers', 'addresses'].every(key => Array.isArray((parsed as unknown as Record<string, unknown>)[key])) ||
    !Number.isSafeInteger(parsed.nextId)) throw new Error('Dữ liệu demo không hợp lệ. Bản lưu được giữ nguyên; chưa chuyển đổi.');
  if (parsed.version === 5) {
    if (!Array.isArray(parsed.commodities)) throw new Error('Thiếu danh mục FARMGO trong dữ liệu đã lưu.');
    return structuredClone(parsed);
  }
  if (parsed.version === 3 || parsed.version === 4) {
    const result = parsed as unknown as DemoState;
    if (parsed.version === 3) addGovernance(result);
    result.version = 5; result.allocations = []; result.ledger = []; result.withdrawals = []; result.operations = {}; return result;
  }
  const legacy = parsed as LegacyState;
  const { pricing: _pricing, ...rest } = legacy;
  const upgraded: DemoState = {
    ...rest, version: 5, allocations: [], ledger: [], withdrawals: [], operations: {}, profiles: [], qualityReviews: [], claims: [], demoNow: new Date().toISOString(), commodities: structuredClone(commodities),
    products: legacy.products.map(item => {
      const { basePricePerKg, ...product } = item;
      if (!Number.isSafeInteger(basePricePerKg) || basePricePerKg < 0) throw new Error('Giá NCC cũ không hợp lệ. Dữ liệu được giữ nguyên.');
      const commodityId = commodities.some(entry => entry.id === item.id) ? item.id : undefined;
      return { ...product, commodityId, publicPricePerKg: basePricePerKg, uses: [] };
    }),
  };
  for (const order of upgraded.orders) for (const item of order.items) {
    const listing = upgraded.products.find(product => product.id === item.productId);
    const supplier = upgraded.suppliers.find(entry => entry.id === listing?.supplierId);
    if (supplier) { item.supplierId = supplier.id; item.supplierName = supplier.name; }
  }
  return addGovernance(upgraded);
}
function current(): DemoState {
  if (!state) {
    const saved = storage()?.getItem(KEY);
    if (saved) {
      let parsed: unknown;
      try { parsed = JSON.parse(saved); } catch { throw new Error('Không đọc được dữ liệu demo đã lưu. Dữ liệu chưa bị ghi đè.'); }
      const upgraded = upgradeStoredState(parsed);
      if ((parsed as { version: number }).version !== 5) storage()?.setItem(KEY, JSON.stringify(upgraded));
      state = upgraded;
    } else state = createSeed();
  }
  return state;
}
export function readState(): DemoState { return structuredClone(current()); }
export function mutate<T>(type: DemoDataEvent['type'], action: (draft: DemoState) => T): T {
  const before = current();
  const draft = structuredClone(before);
  const result = action(draft);
  if (type === 'RESET' || JSON.stringify(before) !== JSON.stringify(draft)) {
    storage()?.setItem(KEY, JSON.stringify(draft));
    state = draft;
    for (const listener of [...listeners]) {
      try { listener({ type }); } catch (error) { console.error('Demo listener failed', error); }
    }
  }
  return structuredClone(result);
}
export function subscribe(listener: (event: DemoDataEvent) => void): () => void {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
