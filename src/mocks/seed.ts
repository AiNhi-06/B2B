import type { Commodity, Customer, DeliveryAddress, DemoSession, Order, ProductListing, Shipment, Supplier, SupplierConfirmation } from '../types/index';

import type { BusinessProfile, QualityReview, Claim } from '../types/index';
export interface DemoState {
  version: 4;
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
// Fixed demo fixtures only; certificates, QC and financial claims are not inferred.
export function createSeed(): DemoState {
  const seed: DemoState = {
    version: 4, profiles: [], qualityReviews: [], claims: [], demoNow: new Date().toISOString(),
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
  return addGovernance(seed);
}
export function addGovernance(state: DemoState): DemoState {
  state.profiles = [...state.suppliers.map(s => ({ id: s.id, role: 'SUPPLIER' as const, businessName: s.name, phone: s.phone, taxCode: s.taxCode ?? '', contactName: '', address: s.gardenAddress, status: 'DRAFT' as const, legacy: true })), ...state.customers.map(c => ({ id: c.id, role: 'CUSTOMER' as const, businessName: c.businessName, phone: c.phone, taxCode: c.taxCode ?? '', contactName: '', address: state.addresses.find(a => a.customerId === c.id)?.address ?? '', status: 'DRAFT' as const, legacy: true }))];
  state.products.forEach(p => { p.legacy = true; });
  state.qualityReviews = []; state.claims = []; state.demoNow = new Date().toISOString(); state.version = 4;
  return state;
}
