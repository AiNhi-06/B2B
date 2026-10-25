import type { Commodity, Customer, DeliveryAddress, DemoSession, Order, ProductListing, Shipment, Supplier, SupplierConfirmation } from '../types/index';

import type { BusinessProfile, QualityReview, Claim } from '../types/index';
import type { EscrowAllocation, LedgerEntry, Withdrawal } from '../types/index';
export interface DemoState {
  version: 5;
  allocations: EscrowAllocation[];
  ledger: LedgerEntry[];
  withdrawals: Withdrawal[];
  operations: Record<string, { fingerprint: string; entityId: string }>;
  profiles: BusinessProfile[];
  qualityReviews: QualityReview[];
  claims: Claim[];
  demoNow: string;
  session: DemoSession;
  suppliers: Supplier[];
  customers: Customer[];
  addresses: DeliveryAddress[];
  products: ProductListing[];
  commodities: Commodity[];
  orders: Order[];
  confirmations: SupplierConfirmation[];
  shipments: Shipment[];
  nextId: number;
}
export const shippingFees: Readonly<Record<string, number>> = { 'address-1': 30000, 'address-2': 40000 };
export const commodities: Commodity[] = [
  { id: 'avocado-034', name: 'Bơ 034', category: 'FRESH_FRUIT' },
  { id: 'mango-cat-hoa-loc', name: 'Xoài Cát Hòa Lộc', category: 'FRESH_FRUIT' },
  { id: 'dragon-fruit', name: 'Thanh long ruột đỏ', category: 'FRESH_FRUIT' },
  { id: 'orange', name: 'Cam sành', category: 'FRESH_FRUIT' },
  { id: 'carrot', name: 'Cà rốt', category: 'VEGETABLES' },
  { id: 'tomato', name: 'Cà chua', category: 'VEGETABLES' },
  { id: 'cabbage', name: 'Bắp cải', category: 'VEGETABLES' },
];
// Fixed mock fixtures; no real certificates, QC results, payments or claims are implied.
export function createSeed(): DemoState {
  const demoNow = new Date().toISOString();
  const seed: DemoState = {
    version: 5, allocations: [], ledger: [], withdrawals: [], operations: {}, profiles: [], qualityReviews: [], claims: [], demoNow,
    session: { role: 'SUPPLIER', activeSupplierId: 'supplier-1', activeCustomerId: 'customer-1' },
    suppliers: [
      { id: 'supplier-1', name: 'Nhà vườn Chú Sáu', phone: '0900000001', gardenAddress: 'Vườn demo, Lâm Đồng', taxCode: 'DEMO-MST-NCC-01', regionLabel: 'Lâm Đồng' },
      { id: 'supplier-2', name: 'Hợp tác xã Miền Tây', phone: '0900000002', gardenAddress: 'Vườn demo, Tiền Giang', taxCode: 'DEMO-MST-NCC-02', regionLabel: 'Tiền Giang' },
    ],
    customers: [
      { id: 'customer-1', businessName: 'Quán Cà phê The Bean', phone: '0900000011', taxCode: 'DEMO-MST-FB-01', deliveryAddressIds: ['address-1'] },
      { id: 'customer-2', businessName: 'Nước ép Fresh Garden', phone: '0900000012', taxCode: 'DEMO-MST-FB-02', deliveryAddressIds: ['address-2'] },
    ],
    addresses: [
      { id: 'address-1', customerId: 'customer-1', label: 'Quán chính (demo)', address: '123 Nguyễn Huệ, Q.1', deliveryZone: 'Q1' },
      { id: 'address-2', customerId: 'customer-2', label: 'Chi nhánh (demo)', address: '456 Lê Duẩn, Q.1', deliveryZone: 'Q1' },
    ],
    products: [
      { id: 'avocado-034', commodityId: 'avocado-034', supplierId: 'supplier-1', name: 'Bơ 034', unit: 'kg', availableKg: 500, publicPricePerKg: 20000, uses: ['SMOOTHIE'], originLabel: 'Lâm Đồng', packagingLabel: 'Thùng 10 kg', active: true },
      { id: 'mango-cat-hoa-loc', commodityId: 'mango-cat-hoa-loc', supplierId: 'supplier-1', name: 'Xoài Cát Hòa Lộc', unit: 'kg', availableKg: 300, publicPricePerKg: 35000, uses: ['JUICE', 'SMOOTHIE', 'FRESH'], originLabel: 'Tiền Giang', packagingLabel: 'Sọt 20 kg', active: true },
      { id: 'dragon-fruit', commodityId: 'dragon-fruit', supplierId: 'supplier-2', name: 'Thanh long ruột đỏ', unit: 'kg', availableKg: 400, publicPricePerKg: 15000, uses: ['JUICE', 'FRESH'], originLabel: 'Tiền Giang', active: true },
      { id: 'mango-mekong', commodityId: 'mango-cat-hoa-loc', supplierId: 'supplier-2', name: 'Xoài Cát Hòa Lộc', unit: 'kg', availableKg: 240, publicPricePerKg: 32000, uses: ['JUICE', 'SMOOTHIE', 'FRESH'], originLabel: 'Tiền Giang', packagingLabel: 'Sọt 15 kg', active: true },
      { id: 'orange-mekong', commodityId: 'orange', supplierId: 'supplier-2', name: 'Cam sành', unit: 'kg', availableKg: 350, publicPricePerKg: 18000, uses: ['JUICE'], originLabel: 'Vĩnh Long', active: true },
      { id: 'carrot-dalat', commodityId: 'carrot', supplierId: 'supplier-1', name: 'Cà rốt Đà Lạt', unit: 'kg', availableKg: 600, publicPricePerKg: 13000, uses: ['JUICE', 'KITCHEN'], originLabel: 'Lâm Đồng', packagingLabel: 'Bao 15 kg', active: true },
      { id: 'tomato-dalat', commodityId: 'tomato', supplierId: 'supplier-1', name: 'Cà chua Đà Lạt', unit: 'kg', availableKg: 450, publicPricePerKg: 16000, uses: ['JUICE', 'KITCHEN'], originLabel: 'Lâm Đồng', active: true },
      { id: 'cabbage-dalat', commodityId: 'cabbage', supplierId: 'supplier-1', name: 'Bắp cải xanh', unit: 'kg', availableKg: 280, publicPricePerKg: 10000, uses: ['KITCHEN'], originLabel: 'Lâm Đồng', active: true },
    ],
    commodities: structuredClone(commodities),
    orders: [], confirmations: [], shipments: [], nextId: 1,
  };
  addGovernance(seed);
  addAdminShowcaseProfiles(seed);
  return addAdminOperationsShowcase(seed);
}
export function addAdminShowcaseProfiles(state: DemoState): DemoState {
  if (state.profiles.some(profile => profile.id.startsWith('showcase-'))) return state;
  const submittedAt = state.demoNow;
  state.profiles.push(
    { id: 'showcase-supplier-pending', role: 'SUPPLIER', businessName: 'Vườn trái cây An Phú', phone: '0900000031', taxCode: 'DEMO-MST-NCC-03', contactName: 'Nguyễn Minh An', address: 'Đức Trọng, Lâm Đồng', capacityKg: 850, status: 'PENDING', legacy: false, submittedAt },
    { id: 'showcase-customer-pending', role: 'CUSTOMER', businessName: 'Bếp Xanh Sài Gòn', phone: '0900000032', taxCode: 'DEMO-MST-FB-03', contactName: 'Trần Ngọc Hà', address: '12 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM', status: 'PENDING', legacy: false, submittedAt },
    { id: 'showcase-supplier-rejected', role: 'SUPPLIER', businessName: 'Nông trại Bình Minh', phone: '0900000033', taxCode: 'DEMO-MST-NCC-04', contactName: 'Lê Quốc Bảo', address: 'Cai Lậy, Tiền Giang', capacityKg: 620, status: 'REJECTED', legacy: false, submittedAt, reviewedAt: submittedAt, rejectionReason: 'Vui lòng bổ sung hồ sơ chứng nhận.' },
  );
  return state;
}
export function addAdminOperationsShowcase(state: DemoState): DemoState {
  if (state.orders.some(order => order.id.startsWith('showcase-'))) return state;

  const now = Date.parse(state.demoNow);
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  const deliveryDate = new Date(now + 24 * 60 * 60_000).toISOString().slice(0, 10);
  const deliveredDate = new Date(now).toISOString().slice(0, 10);
  if (!['avocado-034', 'mango-mekong', 'dragon-fruit', 'tomato-dalat', 'carrot-dalat', 'cabbage-dalat'].every(id => state.products.some(product => product.id === id))) return state;
  const item = (productId: string, productName: string, supplierId: string, supplierName: string, quantityKg: number, unitPriceVnd: number, qcSnapshot?: QualityReview) => ({
    productId, productName, supplierId, supplierName, quantityKg, unitPriceVnd, lineTotalVnd: quantityKg * unitPriceVnd, qcSnapshot,
  });
  const orders: Order[] = [
    { id: 'showcase-order-105', customerId: 'customer-1', deliveryAddressId: 'address-1', items: [item('avocado-034', 'Bơ 034', 'supplier-1', 'Nhà vườn Chú Sáu', 20, 20_000)], subtotalVnd: 400_000, shippingFeeVnd: 30_000, totalVnd: 430_000, status: 'PLACED', paymentStatus: 'PAID', deliveryDate, deliverySlot: 'MORNING', paymentRequestKey: 'showcase-hold-105', placedAt: minutesAgo(25) },
    { id: 'showcase-order-104', customerId: 'customer-2', deliveryAddressId: 'address-2', items: [item('dragon-fruit', 'Thanh long ruột đỏ', 'supplier-2', 'Hợp tác xã Miền Tây', 15, 15_000)], subtotalVnd: 225_000, shippingFeeVnd: 40_000, totalVnd: 265_000, status: 'AGGREGATED', paymentStatus: 'PAID', deliveryDate, deliverySlot: 'AFTERNOON', paymentRequestKey: 'showcase-hold-104', placedAt: minutesAgo(70) },
    { id: 'showcase-order-103', customerId: 'customer-1', deliveryAddressId: 'address-1', items: [item('mango-mekong', 'Xoài Cát Hòa Lộc', 'supplier-2', 'Hợp tác xã Miền Tây', 10, 32_000)], subtotalVnd: 320_000, shippingFeeVnd: 30_000, totalVnd: 350_000, status: 'DISPATCHED', paymentStatus: 'PAID', deliveryDate, deliverySlot: 'MORNING', paymentRequestKey: 'showcase-hold-103', placedAt: minutesAgo(240) },
    { id: 'showcase-order-102', customerId: 'customer-1', deliveryAddressId: 'address-1', items: [item('avocado-034', 'Bơ 034', 'supplier-1', 'Nhà vườn Chú Sáu', 10, 20_000)], subtotalVnd: 200_000, shippingFeeVnd: 30_000, totalVnd: 230_000, status: 'DELIVERED', paymentStatus: 'PAID', deliveryDate: deliveredDate, deliverySlot: 'MORNING', paymentRequestKey: 'showcase-hold-102', placedAt: minutesAgo(120), deliveredAt: minutesAgo(35) },
    { id: 'showcase-order-101', customerId: 'customer-2', deliveryAddressId: 'address-2', items: [item('mango-mekong', 'Xoài Cát Hòa Lộc', 'supplier-2', 'Hợp tác xã Miền Tây', 10, 32_000)], subtotalVnd: 320_000, shippingFeeVnd: 40_000, totalVnd: 360_000, status: 'DELIVERED', paymentStatus: 'PAID', deliveryDate: deliveredDate, deliverySlot: 'AFTERNOON', paymentRequestKey: 'showcase-hold-101', placedAt: minutesAgo(300), deliveredAt: minutesAgo(210) },
  ];
  state.orders.push(...orders);
  for (const order of orders) for (const line of order.items) {
    const product = state.products.find(entry => entry.id === line.productId)!;
    product.availableKg = Math.max(0, product.availableKg - line.quantityKg);
  }
  state.confirmations.push(
    { supplierId: 'supplier-2', orderIds: ['showcase-order-103'], confirmedAt: minutesAgo(210), vehiclePlate: '51D-246.80', estimatedArrivalAt: minutesAgo(100) },
    { supplierId: 'supplier-1', orderIds: ['showcase-order-102'], confirmedAt: minutesAgo(110) },
    { supplierId: 'supplier-2', orderIds: ['showcase-order-101'], confirmedAt: minutesAgo(290) },
  );
  state.shipments.push(
    { id: 'showcase-shipment-103', deliveryDate, deliverySlot: 'MORNING', orderIds: ['showcase-order-103'], routeLabel: 'Tuyến Thủ Đức · Quận 1', driverName: 'Nguyễn Văn Minh', driverPhone: '0900000099', vehiclePlate: '51D-246.80', status: 'IN_TRANSIT', trackingLabel: 'Đang giao · hành trình mô phỏng' },
    { id: 'showcase-shipment-102', deliveryDate: deliveredDate, deliverySlot: 'MORNING', orderIds: ['showcase-order-102'], routeLabel: 'Tuyến Phú Nhuận · Quận 1', driverName: 'Trần Quốc Huy', driverPhone: '0900000088', vehiclePlate: '51D-135.79', status: 'DELIVERED', trackingLabel: 'Đã giao · xác nhận mô phỏng' },
    { id: 'showcase-shipment-101', deliveryDate: deliveredDate, deliverySlot: 'AFTERNOON', orderIds: ['showcase-order-101'], routeLabel: 'Tuyến Quận 1 · Bình Thạnh', driverName: 'Lê Hoàng Nam', driverPhone: '0900000077', vehiclePlate: '51D-864.20', status: 'DELIVERED', trackingLabel: 'Đã giao · xác nhận mô phỏng' },
  );

  const recentReviewAt = minutesAgo(90);
  const completedReviewAt = minutesAgo(300);
  state.products.find(product => product.id === 'tomato-dalat')!.legacy = false;
  state.products.find(product => product.id === 'carrot-dalat')!.legacy = false;
  state.products.find(product => product.id === 'cabbage-dalat')!.legacy = false;
  state.qualityReviews.push(
    { productId: 'tomato-dalat', supplierId: 'supplier-1', grade: 'A', yieldPercent: 92, brix: 5.2, status: 'PENDING', revision: 1, submittedAt: recentReviewAt },
    { productId: 'carrot-dalat', supplierId: 'supplier-1', grade: 'B', yieldPercent: 88, brix: 7.1, status: 'REJECTED', revision: 1, note: 'Vui lòng bổ sung kết quả kiểm định lô hàng.', submittedAt: completedReviewAt, reviewedAt: recentReviewAt },
    { productId: 'cabbage-dalat', supplierId: 'supplier-1', grade: 'A', yieldPercent: 94, status: 'APPROVED', revision: 1, note: 'Đã duyệt thông số lô hàng mẫu.', submittedAt: completedReviewAt, reviewedAt: recentReviewAt },
  );

  const escrowRows = [
    { orderId: 'showcase-order-105', supplierId: 'supplier-1', goodsVnd: 400_000, status: 'HELD' as const },
    { orderId: 'showcase-order-104', supplierId: 'supplier-2', goodsVnd: 225_000, status: 'HELD' as const },
    { orderId: 'showcase-order-103', supplierId: 'supplier-2', goodsVnd: 320_000, status: 'HELD' as const },
    { orderId: 'showcase-order-102', supplierId: 'supplier-1', goodsVnd: 200_000, status: 'HELD' as const },
    { orderId: 'showcase-order-101', supplierId: 'supplier-2', goodsVnd: 320_000, refundedVnd: 64_000, status: 'SETTLED' as const, feeVnd: 7_680, supplierNetVnd: 248_320, settledAt: minutesAgo(90) },
  ];
  state.allocations.push(...escrowRows.map((row, index) => ({ id: `showcase-allocation-${index + 1}`, refundedVnd: 0, ...row })));
  for (const [index, order] of orders.entries()) state.ledger.push({ id: `showcase-ledger-hold-${index + 1}`, key: `hold:${order.id}`, kind: 'HOLD', orderId: order.id, amountVnd: order.totalVnd, createdAt: order.placedAt });
  state.ledger.push(
    { id: 'showcase-ledger-refund-101', key: 'refund:showcase-claim-101', kind: 'REFUND', orderId: 'showcase-order-101', supplierId: 'supplier-2', claimId: 'showcase-claim-101', amountVnd: 64_000, createdAt: minutesAgo(180) },
    { id: 'showcase-ledger-settle-101', key: 'settle:showcase-allocation-5', kind: 'SETTLEMENT', orderId: 'showcase-order-101', supplierId: 'supplier-2', amountVnd: 256_000, feeVnd: 7_680, createdAt: minutesAgo(90) },
  );
  state.claims.push(
    { id: 'showcase-claim-102', orderId: 'showcase-order-102', customerId: 'customer-1', supplierId: 'supplier-1', lines: [{ productId: 'avocado-034', quantityKg: 2 }], reason: 'Một phần bơ bị dập trong quá trình giao nhận.', images: [], status: 'OPEN', submittedAt: minutesAgo(20) },
    { id: 'showcase-claim-101', orderId: 'showcase-order-101', customerId: 'customer-2', supplierId: 'supplier-2', lines: [{ productId: 'mango-mekong', quantityKg: 2 }], reason: 'Đã xử lý hoàn 2 kg theo biên bản đối soát mẫu.', images: [], status: 'APPROVED', submittedAt: minutesAgo(190), approvedLines: [{ productId: 'mango-mekong', quantityKg: 2 }], refundVnd: 64_000, decisionNote: 'Đã xác nhận chất lượng lô hàng.', decidedAt: minutesAgo(180) },
  );
  state.withdrawals.push({ id: 'showcase-withdrawal-201', supplierId: 'supplier-2', amountVnd: 100_000, status: 'PENDING', requestKey: 'showcase-withdrawal-request-201', createdAt: minutesAgo(30), note: 'Yêu cầu đối soát đợt gần nhất.' });
  return state;
}
export function addGovernance(state: DemoState): DemoState {
  state.profiles = [...state.suppliers.map(s => ({ id: s.id, role: 'SUPPLIER' as const, businessName: s.name, phone: s.phone, taxCode: s.taxCode ?? '', contactName: '', address: s.gardenAddress, status: 'DRAFT' as const, legacy: true })), ...state.customers.map(c => ({ id: c.id, role: 'CUSTOMER' as const, businessName: c.businessName, phone: c.phone, taxCode: c.taxCode ?? '', contactName: '', address: state.addresses.find(a => a.customerId === c.id)?.address ?? '', status: 'DRAFT' as const, legacy: true }))];
  state.products.forEach(p => { p.legacy = true; });
  state.qualityReviews = []; state.claims = []; state.demoNow = new Date().toISOString(); state.version = 5;
  return state;
}
