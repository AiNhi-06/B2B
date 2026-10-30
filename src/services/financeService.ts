import type * as T from '../types/index';
import type { DemoState } from '../mocks/seed';
import { readState, mutate } from '../store/demoStore';
import { actor, check, entity, openClaim } from './governanceService';

export function demoDate(now: string) { return new Date(Date.parse(now) + 7 * 3600000).toISOString().slice(0, 10); }
export function nextDeliveryDate(now: string) { return new Date(Date.parse(`${demoDate(now)}T00:00:00Z`) + 86400000).toISOString().slice(0, 10); }
export function schedule(s: DemoState, input: T.NewOrderInput, required = false) {
  if (required) check(input.deliveryDate && input.deliverySlot, 'Chọn ngày và ca giao demo.');
  const date = input.deliveryDate ?? nextDeliveryDate(s.demoNow); const slot = input.deliverySlot ?? 'MORNING';
  check(/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date && date >= nextDeliveryDate(s.demoNow) && ['MORNING', 'AFTERNOON'].includes(slot), 'Ngày giao từ ngày mai theo đồng hồ demo; chọn ca 05–07h hoặc 13–15h.');
  return { deliveryDate: date, deliverySlot: slot };
}
export function requestFingerprint(input: T.NewOrderInput) {
  const quantities = new Map<string, number>(); input.items.forEach(i => quantities.set(i.productId, (quantities.get(i.productId) ?? 0) + i.quantityKg));
  const options = input.checkoutOptions;
  const extra = options ? [options.orderMode, options.carrier, options.paymentMethod, options.insurance] : [];
  return JSON.stringify([input.customerId, input.deliveryAddressId, input.deliveryDate, input.deliverySlot, [...quantities].sort(([a], [b]) => a.localeCompare(b)), ...extra]);
}
export function requestKey(key: unknown) { check(typeof key === 'string' && key.trim().length > 0 && key.length <= 180, 'Thiếu mã chống xử lý lặp cho giao dịch demo.'); return key; }
export function post(s: DemoState, entry: Omit<T.LedgerEntry, 'id' | 'createdAt'>) {
  check(Number.isSafeInteger(entry.amountVnd) && entry.amountVnd >= 0, 'Tiền giao dịch không hợp lệ.');
  check(!s.ledger.some(e => e.key === entry.key), 'Giao dịch demo đã được ghi.');
  s.ledger.push({ ...entry, id: `ledger-${s.nextId++}`, createdAt: s.demoNow });
}
export function holdOrder(s: DemoState, o: T.Order) {
  const suppliers = new Set(o.items.map(i => i.supplierId!));
  for (const supplierId of suppliers) s.allocations.push({ id: `allocation-${s.nextId++}`, orderId: o.id, supplierId, goodsVnd: o.items.filter(i => i.supplierId === supplierId).reduce((n, i) => n + i.lineTotalVnd, 0), refundedVnd: 0, status: 'HELD' });
  post(s, { key: `hold:${o.id}`, kind: 'HOLD', orderId: o.id, amountVnd: o.totalVnd });
}
export function refundClaim(s: DemoState, c: T.Claim) {
  if (c.status !== 'APPROVED') return;
  const allocation = s.allocations.find(a => a.orderId === c.orderId && a.supplierId === c.supplierId);
  // Historical decisions have no payment to refund. Do not invent a transaction.
  if (!allocation || s.ledger.some(e => e.key === `refund:${c.id}`)) return;
  const refund = c.refundVnd!;
  check(allocation.status === 'HELD' && refund <= allocation.goodsVnd - allocation.refundedVnd, 'Phần tiền không còn giữ hoặc số hoàn vượt Escrow.');
  allocation.refundedVnd += refund;
  post(s, { key: `refund:${c.id}`, kind: 'REFUND', orderId: c.orderId, supplierId: c.supplierId, claimId: c.id, amountVnd: refund });
}
export function balance(s: DemoState, supplierId: string) {
  const earned = s.allocations.filter(a => a.supplierId === supplierId && a.status === 'SETTLED').reduce((n, a) => n + a.supplierNetVnd!, 0);
  const reservedVnd = s.withdrawals.filter(w => w.supplierId === supplierId && w.status === 'PENDING').reduce((n, w) => n + w.amountVnd, 0);
  const paidVnd = s.withdrawals.filter(w => w.supplierId === supplierId && w.status === 'APPROVED').reduce((n, w) => n + w.amountVnd, 0);
  check([earned, reservedVnd, paidVnd].every(Number.isSafeInteger), 'Số dư vượt phạm vi tiền demo.');
  return { supplierId, availableVnd: earned - reservedVnd - paidVnd, reservedVnd, paidVnd };
}
export async function getFinance(): Promise<T.FinanceSnapshot> {
  const s = readState(); const admin = s.session.role === 'ADMIN'; const supplier = s.session.role === 'SUPPLIER';
  const orderIds = new Set(s.orders.filter(o => o.customerId === s.session.activeCustomerId).map(o => o.id));
  const allocations = s.allocations.filter(a => admin || (supplier ? a.supplierId === s.session.activeSupplierId : orderIds.has(a.orderId)));
  return { allocations, ledger: s.ledger.filter(e => admin || (supplier ? e.supplierId === s.session.activeSupplierId : !!e.orderId && orderIds.has(e.orderId))), withdrawals: s.withdrawals.filter(w => admin || (supplier && w.supplierId === s.session.activeSupplierId)), balances: admin ? s.suppliers.map(p => balance(s, p.id)) : supplier ? [balance(s, s.session.activeSupplierId!)] : [] };
}
export async function settleEscrow(input: { orderId: string; supplierId: string }) {
  return mutate('DATA_CHANGED', s => {
    actor(s, 'ADMIN'); const a = s.allocations.find(a => a.orderId === input.orderId && a.supplierId === input.supplierId); check(a, 'Đơn không có thanh toán Escrow demo.');
    if (a.status === 'SETTLED') return a;
    const order = entity(s.orders, a.orderId);
    check(order.status === 'DELIVERED' && order.deliveredAt && Date.parse(s.demoNow) >= Date.parse(order.deliveredAt) + 7200000, 'Chỉ đối soát sau 2 giờ kể từ khi giao thành công.');
    check(!s.claims.some(c => c.orderId === a.orderId && c.supplierId === a.supplierId && openClaim(c)), 'Phần NCC này đang có khiếu nại mở.');
    const net = a.goodsVnd - a.refundedVnd; const fee = Number((BigInt(net) * 3n + 50n) / 100n);
    a.status = 'SETTLED'; a.feeVnd = fee; a.supplierNetVnd = net - fee; a.settledAt = s.demoNow;
    post(s, { key: `settle:${a.id}`, kind: 'SETTLEMENT', orderId: a.orderId, supplierId: a.supplierId, amountVnd: net, feeVnd: fee }); balance(s, a.supplierId); return a;
  });
}
export async function requestWithdrawal(input: { supplierId: string; amountVnd: number; requestKey: string }) {
  return mutate('DATA_CHANGED', s => {
    actor(s, 'SUPPLIER', input.supplierId); const key = `withdraw:${requestKey(input.requestKey)}`; const fingerprint = JSON.stringify([input.supplierId, input.amountVnd]);
    const old = s.operations[key]; if (old) { check(old.fingerprint === fingerprint, 'Mã giao dịch đã dùng cho yêu cầu khác.'); return entity(s.withdrawals, old.entityId); }
    check(Number.isSafeInteger(input.amountVnd) && input.amountVnd > 0 && input.amountVnd <= balance(s, input.supplierId).availableVnd, 'Số tiền rút phải nguyên dương và không vượt số dư khả dụng.');
    const w: T.Withdrawal = { ...input, id: `withdrawal-${s.nextId++}`, status: 'PENDING', createdAt: s.demoNow }; s.withdrawals.push(w); s.operations[key] = { fingerprint, entityId: w.id }; return w;
  });
}
export async function reviewWithdrawal(input: { withdrawalId: string; approved: boolean; note: string }) {
  return mutate('DATA_CHANGED', s => {
    actor(s, 'ADMIN'); const w = entity(s.withdrawals, input.withdrawalId); check(typeof input.approved === 'boolean' && typeof input.note === 'string' && (input.approved || input.note.trim()), 'Nhập lý do từ chối rút tiền.');
    const next = input.approved ? 'APPROVED' : 'REJECTED';
    if (w.status !== 'PENDING') { check(w.status === next && w.note === input.note, 'Yêu cầu đã được xử lý với quyết định khác.'); return w; }
    w.status = next; w.note = input.note; w.reviewedAt = s.demoNow;
    if (input.approved) post(s, { key: `withdraw:${w.id}`, kind: 'WITHDRAWAL', supplierId: w.supplierId, withdrawalId: w.id, amountVnd: w.amountVnd }); return w;
  });
}
