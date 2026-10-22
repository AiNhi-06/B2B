import type { Customer, DeliveryAddress, DemoSession, Order, PricingRule, ProductListing, Shipment, Supplier, SupplierConfirmation } from '../types/index';

export interface DemoState {
  version: 1;
  session: DemoSession;
  suppliers: Supplier[];
  customers: Customer[];
  addresses: DeliveryAddress[];
  products: ProductListing[];
  pricing: PricingRule;
  orders: Order[];
  confirmations: SupplierConfirmation[];
  shipments: Shipment[];
  nextId: number;
}

// Fixtures only: these amounts and identities are not real business policies.
export const shippingFees: Readonly<Record<string, number>> = { 'address-1': 30000, 'address-2': 40000 };

export function createSeed(): DemoState {
  return {
    version: 1,
    session: { role: 'SUPPLIER', activeSupplierId: 'supplier-1', activeCustomerId: 'customer-1' },
    suppliers: [
      { id: 'supplier-1', name: 'Nhà vườn Chú Sáu', phone: '0900000001', gardenAddress: 'Vườn demo, Lâm Đồng' },
      { id: 'supplier-2', name: 'Hợp tác xã Miền Tây', phone: '0900000002', gardenAddress: 'Vườn demo, Tiền Giang' },
    ],
    customers: [
      { id: 'customer-1', businessName: 'Quán Cà phê The Bean', phone: '0900000011', deliveryAddressIds: ['address-1'] },
      { id: 'customer-2', businessName: 'Nước ép Fresh Garden', phone: '0900000012', deliveryAddressIds: ['address-2'] },
    ],
    addresses: [
      { id: 'address-1', customerId: 'customer-1', label: 'Quán chính (demo)', address: '123 Nguyễn Huệ, Q.1', deliveryZone: 'Q1' },
      { id: 'address-2', customerId: 'customer-2', label: 'Chi nhánh (demo)', address: '456 Lê Duẩn, Q.1', deliveryZone: 'Q1' },
    ],
    products: [
      { id: 'avocado-034', supplierId: 'supplier-1', name: 'Bơ 034', unit: 'kg', availableKg: 500, basePricePerKg: 20000, active: true },
      { id: 'mango-cat-hoa-loc', supplierId: 'supplier-1', name: 'Xoài Cát Hòa Lộc', unit: 'kg', availableKg: 300, basePricePerKg: 35000, active: true },
      { id: 'dragon-fruit', supplierId: 'supplier-2', name: 'Thanh long ruột đỏ', unit: 'kg', availableKg: 400, basePricePerKg: 15000, active: true },
    ],
    pricing: { mode: 'PERCENT', value: 30 },
    orders: [], confirmations: [], shipments: [], nextId: 1,
  };
}
