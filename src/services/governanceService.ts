import { refundClaim } from './financeService';
import type * as T from '../types/index';
import type { DemoState } from '../mocks/seed';
import { mutate, readState } from '../store/demoStore';

export function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw Object.assign(new Error(message), { code: 'VALIDATION_ERROR' });
}
export function entity<T extends { id: string }>(rows: T[], id: string): T {
  const row = rows.find(r => r.id === id); check(row, 'Không tìm thấy dữ liệu.'); return row;
}
export function actor(s: DemoState, role: T.Role, id?: string) {
  check(s.session.role === role && (role === 'ADMIN' || (role === 'SUPPLIER' ? s.session.activeSupplierId : s.session.activeCustomerId) === id), 'Hãy chuyển sang đúng tài khoản demo để thực hiện.');
}
export function eligible(s: DemoState, id: string): boolean {
  const p = s.profiles.find(p => p.id === id);
  return !!p && (p.status === 'APPROVED' || (p.legacy && p.status === 'DRAFT' && !p.submittedAt));
}
export function visible(s: DemoState, p: T.ProductListing): boolean {
  const qc = s.qualityReviews.find(q => q.productId === p.id);
  return p.active && !!p.commodityId && eligible(s, p.supplierId) && (qc ? qc.status === 'APPROVED' : !!p.legacy);
}
export function photo(value: string) {
  check(typeof value === 'string' && value.length <= 450000 && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value), 'Chọn ảnh JPG, PNG hoặc WebP đã nén (tối đa 450.000 ký tự).');
}
function nonblank(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
export async function getBusinessProfiles() { return readState().profiles; }
export async function registerDemoBusiness(input: { role: T.BusinessRole; phone: string; otp: string }): Promise<T.BusinessProfile> {
  return mutate('SESSION_CHANGED', s => {
    check(['CUSTOMER', 'SUPPLIER'].includes(input.role) && /^0\d{9}$/.test(input.phone) && input.otp === '000000', 'SĐT 10 chữ số, OTP demo là 000000.');
    check(!s.profiles.some(p => p.role === input.role && p.phone === input.phone), 'SĐT đã đăng ký vai trò này; hãy đăng nhập.');
    const id = `${input.role === 'CUSTOMER' ? 'customer' : 'supplier'}-${s.nextId++}-registered`;
    const p: T.BusinessProfile = { id, role: input.role, phone: input.phone, businessName: 'Doanh nghiệp demo mới', taxCode: '', contactName: '', address: '', status: 'DRAFT', legacy: false };
    s.profiles.push(p);
    if (p.role === 'SUPPLIER') { s.suppliers.push({ id, name: p.businessName, phone: p.phone, gardenAddress: '' }); s.session.activeSupplierId = id; }
    else {
      const addressId = `address-${s.nextId++}-registered`;
      s.customers.push({ id, businessName: p.businessName, phone: p.phone, deliveryAddressIds: [addressId] });
      s.addresses.push({ id: addressId, customerId: id, label: 'Địa chỉ doanh nghiệp demo', address: '', deliveryZone: 'DEMO_30000' }); s.session.activeCustomerId = id;
    }
    s.session.role = p.role; return p;
  });
}
export async function loginDemo(input: { role: T.BusinessRole; phone: string; otp: string }) {
  return mutate('SESSION_CHANGED', s => {
    check(input.otp === '000000' && /^0\d{9}$/.test(input.phone), 'OTP demo là 000000; SĐT phải có 10 chữ số.');
    const p = s.profiles.find(p => p.role === input.role && p.phone === input.phone); check(p, 'Chưa có tài khoản demo này.');
    s.session.role = p.role; if (p.role === 'SUPPLIER') s.session.activeSupplierId = p.id; else s.session.activeCustomerId = p.id;
    return s.session;
  });
}
export async function saveBusinessProfile(input: { id: string; changes: Partial<Pick<T.BusinessProfile, 'businessName' | 'taxCode' | 'contactName' | 'address' | 'capacityKg' | 'certificateImage' | 'vietGapImage'>> }) {
  return mutate('DATA_CHANGED', s => {
    const p = entity(s.profiles, input.id); actor(s, p.role, p.id);
    const allowed = ['businessName', 'taxCode', 'contactName', 'address', 'capacityKg', 'certificateImage', 'vietGapImage'];
    check(input.changes && Object.keys(input.changes).length && Object.keys(input.changes).every(k => allowed.includes(k)), 'Trường hồ sơ không hợp lệ.');
    for (const [key, value] of Object.entries(input.changes)) {
      if (key === 'capacityKg') check(Number.isSafeInteger(value) && Number(value) > 0, 'Năng lực cung ứng phải là kg nguyên dương.');
      else { check(typeof value === 'string', 'Thông tin hồ sơ phải là văn bản.'); if ((key === 'certificateImage' || key === 'vietGapImage') && value) photo(value); }
    }
    Object.assign(p, input.changes); p.status = 'DRAFT';
    if (p.role === 'SUPPLIER') Object.assign(entity(s.suppliers, p.id), { name: p.businessName, taxCode: p.taxCode, gardenAddress: p.address });
    else { Object.assign(entity(s.customers, p.id), { businessName: p.businessName, taxCode: p.taxCode }); s.addresses.filter(a => a.customerId === p.id).forEach(a => { a.address = p.address; }); }
    return p;
  });
}
export async function submitBusinessProfile(id: string) {
  return mutate('DATA_CHANGED', s => {
    const p = entity(s.profiles, id); actor(s, p.role, id);
    check(p.status === 'DRAFT' || p.status === 'REJECTED', 'Hồ sơ không ở trạng thái có thể nộp.');
    check([p.businessName, p.taxCode, p.contactName, p.address].every(nonblank), 'Điền tên doanh nghiệp, MST, người liên hệ và địa chỉ.');
    if (p.role === 'SUPPLIER') { check(Number.isSafeInteger(p.capacityKg) && p.capacityKg! > 0 && p.certificateImage, 'NCC cần năng lực cung ứng và ảnh VSATTP demo.'); photo(p.certificateImage!); }
    p.status = 'PENDING'; p.legacy = false; p.submittedAt = s.demoNow; p.rejectionReason = undefined; return p;
  });
}
export async function reviewBusinessProfile(input: { id: string; approved: boolean; note: string }) {
  return mutate('DATA_CHANGED', s => {
    actor(s, 'ADMIN'); const p = entity(s.profiles, input.id); check(p.status === 'PENDING', 'Chỉ xét hồ sơ chờ duyệt.');
    check(typeof input.approved === 'boolean' && (input.approved || nonblank(input.note)), 'Nhập lý do từ chối.');
    p.status = input.approved ? 'APPROVED' : 'REJECTED'; p.reviewedAt = s.demoNow; p.rejectionReason = input.approved ? undefined : input.note.trim(); return p;
  });
}
export async function getQualityReviews() { return readState().qualityReviews; }
export async function submitProductQC(input: { productId: string; grade: 'A' | 'B'; yieldPercent?: number; brix?: number }) {
  return mutate('DATA_CHANGED', s => {
    const p = entity(s.products, input.productId); actor(s, 'SUPPLIER', p.supplierId);
    check(['A', 'B'].includes(input.grade), 'Phân hạng phải là A hoặc B.');
    if (input.yieldPercent !== undefined) check(Number.isFinite(input.yieldPercent) && input.yieldPercent > 0 && input.yieldPercent <= 100, 'Yield trong khoảng (0, 100].');
    if (input.brix !== undefined) check(Number.isFinite(input.brix) && input.brix >= 0 && input.brix <= 100, 'Brix trong khoảng 0–100.');
    const previous = s.qualityReviews.find(q => q.productId === p.id);
    const q: T.QualityReview = { ...input, supplierId: p.supplierId, revision: (previous?.revision ?? 0) + 1, status: 'PENDING', submittedAt: s.demoNow };
    s.qualityReviews = s.qualityReviews.filter(q => q.productId !== p.id); s.qualityReviews.push(q); p.legacy = false; return q;
  });
}
export async function reviewProductQC(input: { productId: string; approved: boolean; note: string }) {
  return mutate('DATA_CHANGED', s => {
    actor(s, 'ADMIN'); const q = s.qualityReviews.find(q => q.productId === input.productId); check(q && q.status === 'PENDING', 'QC không ở trạng thái chờ duyệt.');
    check(typeof input.approved === 'boolean' && nonblank(input.note), 'Nhập ghi chú QC.');
    if (input.approved) check(q.yieldPercent !== undefined && q.yieldPercent > 0 && q.yieldPercent <= 100, 'Cần Yield hợp lệ để duyệt QC.');
    q.status = input.approved ? 'APPROVED' : 'REJECTED'; q.note = input.note.trim(); q.reviewedAt = s.demoNow; return q;
  });
}
export function calculateTrueCost(price: number, kg: number, qc?: T.QualityReview) {
  if (!qc || qc.status !== 'APPROVED' || !qc.yieldPercent || !Number.isFinite(price) || price < 0 || !Number.isFinite(kg) || kg < 0) return null;
  return { costPerUsableKg: price / (qc.yieldPercent / 100), usableKg: kg * qc.yieldPercent / 100 };
}
export async function getDemoClock() { return readState().demoNow; }
export async function advanceDemoClock(minutes: number) {
  return mutate('DATA_CHANGED', s => { actor(s, 'ADMIN'); check(Number.isSafeInteger(minutes) && minutes > 0 && minutes <= 525600, 'Tua từ 1 đến 525600 phút.'); const value = Date.parse(s.demoNow) + minutes * 60000; check(Number.isFinite(value), 'Thời gian không hợp lệ.'); s.demoNow = new Date(value).toISOString(); return s.demoNow; });
}
export const openClaim = (c: T.Claim) => ['OPEN', 'RESPONDED'].includes(c.status);
export async function getClaims() {
  const s = readState(); return s.claims.filter(c => s.session.role === 'ADMIN' || (s.session.role === 'CUSTOMER' ? c.customerId === s.session.activeCustomerId : c.supplierId === s.session.activeSupplierId));
}
export async function submitClaim(input: { orderId: string; supplierId: string; lines: T.ClaimLine[]; reason: string; images: string[] }) {
  return mutate('DATA_CHANGED', s => {
    const o = entity(s.orders, input.orderId); actor(s, 'CUSTOMER', o.customerId);
    check(o.status === 'DELIVERED' && o.deliveredAt && Date.parse(s.demoNow) >= Date.parse(o.deliveredAt) && Date.parse(s.demoNow) < Date.parse(o.deliveredAt) + 7200000, 'Chỉ gửi trong 2 giờ kể từ khi giao thành công; đơn cũ thiếu giờ nhận không hỗ trợ hồi tố.');
    check(!s.claims.some(c => c.orderId === o.id && c.supplierId === input.supplierId && openClaim(c)), 'Đơn/NCC đã có khiếu nại đang mở.');
    check(nonblank(input.reason) && Array.isArray(input.images) && input.images.length <= 3, 'Nhập lý do và tối đa ba ảnh.'); input.images.forEach(photo);
    check(Array.isArray(input.lines) && input.lines.length > 0 && new Set(input.lines.map(l => l.productId)).size === input.lines.length, 'Chọn sản phẩm, không trùng dòng.');
    for (const line of input.lines) {
      const item = o.items.find(i => i.productId === line.productId && i.supplierId === input.supplierId); check(item && Number.isSafeInteger(line.quantityKg) && line.quantityKg > 0, 'Sản phẩm/NCC hoặc kg khiếu nại không hợp lệ.');
      const reserved = s.claims.filter(c => c.orderId === o.id && (openClaim(c) || c.status === 'APPROVED')).reduce((sum, c) => sum + (c.status === 'APPROVED' ? c.approvedLines ?? [] : c.lines).filter(l => l.productId === line.productId).reduce((n, l) => n + l.quantityKg, 0), 0);
      check(reserved + line.quantityKg <= item.quantityKg, 'Kg khiếu nại và đã hoàn vượt kg mua.');
    }
    const c: T.Claim = { ...input, id: `claim-${s.nextId++}`, customerId: o.customerId, submittedAt: s.demoNow, status: 'OPEN' }; s.claims.push(c); return c;
  });
}
export async function respondToClaim(input: { claimId: string; response: string }) {
  return mutate('DATA_CHANGED', s => { const c = entity(s.claims, input.claimId); actor(s, 'SUPPLIER', c.supplierId); check(openClaim(c) && nonblank(input.response), 'Chỉ phản hồi khiếu nại mở, nội dung không rỗng.'); c.response = input.response.trim(); c.status = 'RESPONDED'; return c; });
}
export function resolveClaim(s: DemoState, input: { claimId: string; approved: boolean; lines?: T.ClaimLine[]; note: string }) {
  actor(s, 'ADMIN'); const c = entity(s.claims, input.claimId);
  if (!openClaim(c)) { check(c.status === (input.approved ? 'APPROVED' : 'REJECTED') && c.decisionNote === input.note && (!input.approved || JSON.stringify(c.approvedLines) === JSON.stringify(input.lines)), 'Hồ sơ đã có quyết định khác.'); return c; }
  check(typeof input.approved === 'boolean' && nonblank(input.note), 'Nhập ghi chú quyết định.');
  let refund = 0;
  if (input.approved) {
    check(input.lines?.length && new Set(input.lines.map(l => l.productId)).size === input.lines.length, 'Nhập kg được duyệt.');
    const order = entity(s.orders, c.orderId);
    for (const line of input.lines) { const requested = c.lines.find(l => l.productId === line.productId); check(requested && Number.isSafeInteger(line.quantityKg) && line.quantityKg > 0 && line.quantityKg <= requested.quantityKg, 'Kg duyệt vượt yêu cầu.'); refund += line.quantityKg * order.items.find(i => i.productId === line.productId)!.unitPriceVnd; }
    check(Number.isSafeInteger(refund), 'Số tiền hoàn không hợp lệ.'); c.approvedLines = input.lines;
  }
  c.status = input.approved ? 'APPROVED' : 'REJECTED'; c.refundVnd = refund; c.decisionNote = input.note; c.decidedAt = s.demoNow; return c;
}
export async function decideClaim(input: { claimId: string; approved: boolean; lines?: T.ClaimLine[]; note: string }) { return mutate('DATA_CHANGED', s => { const c = resolveClaim(s, input); refundClaim(s, c); return c; }); }

