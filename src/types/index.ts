export type Role = 'SUPPLIER' | 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PLACED'
  | 'AGGREGATED'
  | 'SUPPLIER_CONFIRMED'
  | 'AT_HUB'
  | 'DISPATCHED'
  | 'DELIVERED';

export type PaymentStatus = 'UNPAID' | 'PAID';

export type ShipmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export interface DemoSession {
  role: Role;
  activeSupplierId?: string;
  activeCustomerId?: string;
}

export type DemoEventType =
  | 'DATA_CHANGED'
  | 'SESSION_CHANGED'
  | 'RESET';

export interface DemoDataEvent {
  type: DemoEventType;
}

export type ServiceErrorCode =
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATUS_TRANSITION'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND';

export interface ServiceError extends Error {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  gardenAddress: string;
  taxCode?: string;
  regionLabel?: string;
}

export interface Customer {
  id: string;
  businessName: string;
  phone: string;
  taxCode?: string;
  deliveryAddressIds: string[];
}

export interface DeliveryAddress {
  id: string;
  customerId: string;
  label: string;
  address: string;
  deliveryZone: string;
}

export type ProductCategory = 'VEGETABLES' | 'FRESH_FRUIT';
export type ProductUse = 'JUICE' | 'SMOOTHIE' | 'KITCHEN' | 'FRESH';
export interface Commodity { id: string; name: string; category: ProductCategory; }
export interface SupplierPublicProfile { id: string; name: string; regionLabel?: string; }
export interface ProductListing {
  id: string;
  supplierId: string;
  commodityId?: string;
  name: string;
  variety?: string;
  unit: 'kg';
  availableKg: number;
  publicPricePerKg: number;
  imageUrl?: string;
  uses: ProductUse[];
  originLabel?: string;
  packagingLabel?: string;
  active: boolean;
}
export interface CustomerProduct extends ProductListing {
  commodityId: string;
  category: ProductCategory;
  supplier: SupplierPublicProfile;
}

export interface OrderItem {
  productId: string;
  productName: string;
  supplierId?: string;
  supplierName?: string;
  quantityKg: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
}

export interface Order {
  id: string;
  customerId: string;
  deliveryAddressId: string;
  items: OrderItem[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt: string;
}

export interface CheckoutQuote {
  items: OrderItem[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
}

export interface DemandLine {
  productId: string;
  productName: string;
  supplierId: string;
  quantityKg: number;
  orderIds: string[];
}

export interface SupplierConfirmation {
  supplierId: string;
  orderIds: string[];
  confirmedAt: string;
  vehiclePlate?: string;
  estimatedArrivalAt?: string;
}

export interface Shipment {
  id: string;
  orderIds: string[];
  routeLabel: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  status: ShipmentStatus;
  trackingLabel?: string;
}

export interface NewOrderInput {
  customerId: string;
  deliveryAddressId: string;
  items: {
    productId: string;
    quantityKg: number;
  }[];
}

export interface NewProductInput {
  supplierId: string;
  commodityId: string;
  name: string;
  variety?: string;
  availableKg: number;
  publicPricePerKg: number;
  imageUrl?: string;
  uses: ProductUse[];
  originLabel?: string;
  packagingLabel?: string;
}
export interface UpdateProductInput {
  supplierId: string;
  productId: string;
  changes: Partial<Pick<ProductListing, 'commodityId' | 'name' | 'variety' | 'availableKg' |
    'publicPricePerKg' | 'imageUrl' | 'uses' | 'originLabel' | 'packagingLabel' | 'active'>>;
}
